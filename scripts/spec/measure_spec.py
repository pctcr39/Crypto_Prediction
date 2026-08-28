"""THỰC THI ĐẶC TẢ — nguồn duy nhất của mọi con số định lượng trong PREDICTION_DESIGN.

Nguyên tắc: tài liệu KHÔNG chép số. Nó trỏ tới docs/generated/spec_numbers.md,
do chính script này sinh ra bằng cách CHẠY đúng đặc tả:
  · σ̂  = HAR-RV trên log(Parkinson RV), mục tiêu TB RV 5 ngày tới, walk-forward
  · w  = tổ hợp 27 ô, rời rạc hoá 5 mức
  · sự kiện = máy trạng thái TRANCHE (mở theo bước tăng vào slot trống · LIFO ·
    tái vũ trang · stop soi INTRABAR · target soi tại CLOSE · hạn 60 ngày)
  · vào tại OPEN nến t+1 · phí 0,30% khứ hồi

Số nào script này không sinh được thì KHÔNG được xuất hiện trong tài liệu.
"""
from __future__ import annotations
import itertools, json, sys
from dataclasses import dataclass, replace
from pathlib import Path
import numpy as np, pandas as pd

LN2 = np.log(2)
COST_ROUNDTRIP = 0.30          # % — taker 0,10×2 + trượt 0,05×2
SL_MULT, TP_MULT, DEADLINE = 1.2, 6.0, 60   # ADR-017 — đổi từ 4,0 (chọn SAU khi nhìn bề mặt)
LEVELS = (0.25, 0.50, 0.75, 1.00)
GRID_27 = tuple(itertools.product((10, 20, 50), (100, 150, 200), (20, 55, 100)))
HAR_TARGET_DAYS, HAR_REFIT_EVERY, HAR_MIN_TRAIN = 5, 7, 250
SYMS = ("BTCUSDT", "ETHUSDT", "SOLUSDT", "DOGEUSDT")

# ══ L1 · biến động ═══════════════════════════════════════════════════
def realized_variance(b: pd.DataFrame) -> pd.Series:
    """Parkinson (1980) — phương sai NGÀY từ high/low."""
    return (np.log(b.high / b.low) ** 2) / (4 * LN2)

def har_sigma_daily(b: pd.DataFrame) -> pd.Series:
    """σ̂ NGÀY — đường DUY NHẤT sinh σ̂. HAR ba thang trên log(RV Parkinson),
    mục tiêu TB RV 5 ngày TỚI, khớp lại mỗi 7 ngày trên cửa sổ mở rộng.
    Không nhìn trước: hệ số tại t chỉ dùng dữ liệu tới t−1."""
    rv = realized_variance(b)
    lx = np.log(rv.clip(lower=1e-12))
    X = pd.concat([lx.rolling(1).mean(), lx.rolling(5).mean(), lx.rolling(22).mean()], axis=1)
    y = np.log(rv.rolling(HAR_TARGET_DAYS).mean().shift(-HAR_TARGET_DAYS).clip(lower=1e-12))
    out = pd.Series(index=b.index, dtype=float)
    beta = None
    for i in range(len(b)):
        if i >= HAR_MIN_TRAIN and (beta is None or i % HAR_REFIT_EVERY == 0):
            # nhãn của mẫu j nhìn tới j+H ⇒ chỉ dùng j ≤ i−H−1 (purge)
            cut = i - HAR_TARGET_DAYS - 1
            d = pd.concat([y.iloc[:cut].rename("y"), X.iloc[:cut]], axis=1).dropna()
            if len(d) >= HAR_MIN_TRAIN:
                A = np.c_[np.ones(len(d)), d.iloc[:, 1:].values]
                beta = np.linalg.lstsq(A, d.y.values, rcond=None)[0]
        if beta is not None and i >= 1 and X.iloc[i - 1].notna().all():
            pred = float(np.exp(np.r_[1.0, X.iloc[i - 1].values] @ beta))
            out.iloc[i] = np.sqrt(max(pred, 1e-12))
    return out

def ewma_sigma_daily(b: pd.DataFrame, lam: float = 0.94) -> pd.Series:
    """Dự phòng TẤT ĐỊNH."""
    return np.sqrt(realized_variance(b).ewm(alpha=1 - lam).mean()).shift(1)

# ══ L5 · hướng ═══════════════════════════════════════════════════════
def cell_signal(b: pd.DataFrame, ef: int, es: int, dn: int) -> pd.Series:
    c = b.close
    fast, slow = c.ewm(span=ef, adjust=False).mean(), c.ewm(span=es, adjust=False).mean()
    don = b.high.rolling(dn).max().shift(1)
    entry, exit_ = (c > slow) & (c > don), c < fast
    pos, out = 0, []
    for i in range(len(c)):
        if pos == 0 and bool(entry.iloc[i]): pos = 1
        elif pos == 1 and bool(exit_.iloc[i]): pos = 0
        out.append(pos)
    return pd.Series(out, index=c.index)

def ensemble_weight(b: pd.DataFrame, grid=GRID_27) -> pd.Series:
    raw = pd.concat([cell_signal(b, *g) for g in grid], axis=1).mean(axis=1)
    return (raw * 4).round() / 4          # {0 · ,25 · ,5 · ,75 · 1}

# ══ L5 · máy trạng thái TRANCHE ══════════════════════════════════════
@dataclass
class Tr:
    level: float; i_entry: int; entry: float; sigma: float
    stop: float; target: float; deadline_i: int
    i_exit: int | None = None; exit_px: float | None = None
    reason: str | None = None; realized_r: float | None = None

def run_tranches(b: pd.DataFrame, w: pd.Series, sig: pd.Series,
                 sl=SL_MULT, tp=TP_MULT, dl=DEADLINE) -> list[Tr]:
    """Máy trạng thái đúng §L5. Thứ tự trong một nến: STOP → TARGET → DEADLINE → LIFO → MỞ."""
    o, hi, lo, c = b.open.values, b.high.values, b.low.values, b.close.values
    wv, sv = w.values, sig.values
    open_slots: dict[float, Tr] = {}
    closed: list[Tr] = []
    for i in range(len(b) - 1):
        # ① STOP (intrabar) ② TARGET (close) ③ DEADLINE
        for lv in sorted(open_slots, reverse=True):
            t = open_slots[lv]
            if i <= t.i_entry: continue
            if lo[i] <= t.stop:      px, rs = t.stop, "hit_stop"
            elif c[i] >= t.target:   px, rs = c[i], "hit_target"
            elif i >= t.deadline_i:  px, rs = c[i], "expired"
            else: continue
            t.i_exit, t.exit_px, t.reason = i, px, rs
            t.realized_r = (px - t.entry) / (t.entry * sl * t.sigma)
            closed.append(t); del open_slots[lv]
        # ④ LIFO — w tụt dưới mức slot
        for lv in sorted(open_slots, reverse=True):
            if wv[i] < lv:
                t = open_slots[lv]
                t.i_exit, t.exit_px, t.reason = i, c[i], "superseded"
                t.realized_r = (c[i] - t.entry) / (t.entry * sl * t.sigma)
                closed.append(t); del open_slots[lv]
        # ⑤ MỞ — bước tăng vào slot TRỐNG (bao gồm tái vũ trang), vào tại open[i+1]
        s = sv[i]
        if np.isfinite(s) and s > 0:
            for lv in LEVELS:
                if wv[i] >= lv and lv not in open_slots:
                    e = o[i + 1]
                    open_slots[lv] = Tr(lv, i, e, s, e * (1 - sl * s), e * (1 + tp * s),
                                        min(i + dl, len(b) - 1))
    for lv, t in open_slots.items():          # còn mở cuối mẫu ⇒ chấm theo giá cuối
        j = len(b) - 1
        t.i_exit, t.exit_px, t.reason = j, c[j], "open_at_end"
        t.realized_r = (c[j] - t.entry) / (t.entry * sl * t.sigma)
        closed.append(t)
    return closed

# ══ chấm ═════════════════════════════════════════════════════════════
def load(sym: str) -> pd.DataFrame:
    import glob
    fs = sorted(glob.glob(f"data/raw/ohlcv/symbol={sym}/timeframe=1d/**/*.parquet", recursive=True))
    if fs:
        d = pd.concat([pd.read_parquet(f) for f in fs]).sort_index()
        return d[~d.index.duplicated()]
    fs = sorted(glob.glob(f"data/raw/ohlcv/symbol={sym}/timeframe=1h/**/*.parquet", recursive=True))
    d = pd.concat([pd.read_parquet(f) for f in fs]).sort_index(); d = d[~d.index.duplicated()]
    return pd.DataFrame({"open": d.open.resample("1D").first(), "high": d.high.resample("1D").max(),
                         "low": d.low.resample("1D").min(), "close": d.close.resample("1D").last()}).dropna()

_CACHE: dict = {}
def _prep(s: str):
    if s not in _CACHE:
        b = load(s)
        _CACHE[s] = (b, har_sigma_daily(b).fillna(ewma_sigma_daily(b)), ensemble_weight(b))
    return _CACHE[s]

def measure(sl=SL_MULT, tp=TP_MULT) -> dict:
    rows, per = [], {}
    for s in SYMS:
        b, sig, w = _prep(s)
        tr = run_tranches(b, w, sig, sl, tp)
        yrs = len(b) / 365.25
        per[s] = dict(n=len(tr), years=round(yrs, 1), per_year=round(len(tr) / yrs, 1))
        rows += [(s, t) for t in tr]
    R = np.array([t.realized_r for _, t in rows])
    reason = pd.Series([t.reason for _, t in rows]).value_counts().to_dict()
    win = R > 0
    c_R = COST_ROUNDTRIP / (sl * 3.00)                   # đơn vị R, σ̂ tham chiếu 3,00%
    payoff = tp / sl
    return dict(n=len(R), win_rate=float(win.mean()), r_win=float(R[win].mean()),
                r_loss=float(R[~win].mean()), ev_gross=float(R.mean()), c_R=float(c_R),
                ev_net=float(R.mean() - c_R), breakeven=float((1 + c_R) / (payoff + 1)),
                payoff=float(payoff), reasons=reason, per_symbol=per,
                hold_days=float(np.mean([t.i_exit - t.i_entry for _, t in rows])))

def turnover_and_drag() -> dict:
    """Phí quay vòng — khung im lặng cũ dựa vào 'ít lệnh'; khung mới phải dựa vào
    'lệnh nhỏ'. Đây là con số phân biệt hai khung."""
    out = {}
    for s in SYMS:
        b, sig, w = _prep(s)
        yrs = len(b) / 365.25
        # thang w (vốn CỦA CHIẾN LƯỢC)
        p_ = w.shift(1).fillna(0)
        turn_w = float((p_ - p_.shift(1).fillna(0)).abs().sum())
        # thang NAV: mỗi tranche 1% NAV notional
        tr = run_tranches(b, w, sig)
        out[s] = dict(
            turnover_w_per_year=round(turn_w / yrs, 1),
            fee_w_pct_per_year=round(turn_w / yrs * COST_ROUNDTRIP / 2, 2),
            events_per_year=round(len(tr) / yrs, 1),
            fee_nav_pct_per_year=round(len(tr) / yrs * COST_ROUNDTRIP * 0.01, 3),
        )
    return out

def emit(path="docs/generated/spec_numbers.md") -> None:
    m, amr, dd, surf, slip = measure(), abs_move_ratio(), drawdown_ratio_w_scale(), barrier_surface(), None
    slip = slippage_table(m)
    tiers = tier_table()
    be_slip = slip[-1]["breakeven_R"]
    L = []
    A = L.append
    A("# SỐ LIỆU CỦA ĐẶC TẢ — SINH TỰ ĐỘNG, KHÔNG SỬA TAY\n")
    A("> Sinh bởi `scripts/spec/measure_spec.py`, chạy lại được từ gốc repo.")
    A("> `docs/PREDICTION_DESIGN.md` **không chép** số nào từ đây — nó trỏ tới.")
    A("> Số nào script này không sinh ra được thì **không được xuất hiện** trong tài liệu.\n")
    A(f"Vũ trụ đo: {', '.join(SYMS)} · rào `{SL_MULT}σ̂/{TP_MULT}σ̂` · hạn {DEADLINE} ngày · phí {COST_ROUNDTRIP}% khứ hồi\n")
    A("---\n\n## 1 · Kinh tế học của khuyến nghị\n")
    A("| Đại lượng | Giá trị |\n|---|---|")
    A(f"| Số sự kiện tranche | **{m['n']:,}** |")
    A(f"| Tỉ lệ chốt lời | **{m['win_rate']*100:.1f}%** |")
    A(f"| Hoà vốn (payoff hợp đồng {m['payoff']:.2f}R) | **{m['breakeven']*100:.1f}%** |")
    A(f"| Biên trên điều kiện cổng | **{(m['win_rate']-m['breakeven'])*100:+.1f} điểm** |")
    A(f"| R trung bình lệnh thắng | **{m['r_win']:.2f}R** |")
    A(f"| R trung bình lệnh thua | {m['r_loss']:.2f}R |")
    A(f"| **EV ròng mỗi sự kiện** | **{m['ev_net']:+.3f}R** |")
    A(f"| Thời gian nắm giữ trung bình | **{m['hold_days']:.1f} ngày** |")
    A(f"\n**Kết cục:** " + " · ".join(f"`{k}` {v:,}" for k, v in m["reasons"].items()) + "\n")
    A("## 2 · ★ Ngân sách im lặng — sự kiện mỗi đồng mỗi năm\n")
    A("| Cặp | Số sự kiện | Số năm | **Sự kiện/năm** |\n|---|---|---|---|")
    for k, v in m["per_symbol"].items():
        A(f"| {k} | {v['n']:,} | {v['years']} | **{v['per_year']}** |")
    pys = [v["per_year"] for v in m["per_symbol"].values()]
    A(f"\n**Dải: {min(pys):.0f} – {max(pys):.0f} sự kiện/đồng/năm.** Với vũ trụ khuyến nghị 8–10 đồng: **{min(pys)*8:.0f} – {max(pys)*10:.0f} khuyến nghị/năm**.\n")
    A("## 3 · Hằng số dẫn xuất\n")
    A("| Hằng số | Giá trị | Đo thế nào |\n|---|---|---|")
    A(f"| `ABS_MOVE_RATIO` | **{amr['mean']:.4f}** | E\\|move\\| / σ̂ **HAR** (không phải σ close-to-close) |")
    A(f"| `c_R` (σ̂ tham chiếu 3,00%) | {m['c_R']:.4f} | {COST_ROUNDTRIP}% / ({SL_MULT}·σ̂·100) |")
    A(f"| Hoà vốn trượt giá dừng lỗ | **{be_slip}R** | từ chính (p={m['win_rate']*100:.1f}%, W={m['r_win']:.2f}R) |")
    A(f"\n| Lỗ thực nhận | EV |\n|---|---|")
    for r in slip[:-1]:
        A(f"| {r['loss_R']}R | {r['ev']:+.3f}R |")
    A("\n## 3b · Quay vòng và tiền phí\n")
    tv = turnover_and_drag()
    A("| Cặp | Quay vòng (`w`/năm) | Phí/năm trên **vốn chiến lược** | Sự kiện/năm | Phí/năm trên **NAV** *(tranche 1% NAV)* |")
    A("|---|---|---|---|---|")
    for k, v in tv.items():
        A(f"| {k} | {v['turnover_w_per_year']} | {v['fee_w_pct_per_year']}% | {v['events_per_year']} | {v['fee_nav_pct_per_year']}% |")
    fn = [v["fee_nav_pct_per_year"] for v in tv.values()]
    A(f"\n**Phí trên NAV: {min(fn):.3f} – {max(fn):.3f}% mỗi đồng mỗi năm.** Với 9 đồng: **{min(fn)*9:.2f} – {max(fn)*9:.2f}% NAV/năm**.")
    A("\n> Tần suất cao nhưng **mỗi lệnh nhỏ**. Bức tường phí của `08 §A2` tính cho lệnh **toàn vốn**; ở đây mỗi tranche là 1% NAV nên tiền phí không tỉ lệ với số lệnh theo cách đó.\n")
    A("\n## 3c · ★ TRỤC D — phân tầng theo độ chọn lọc (ADR-018)\n")
    A("Tập LỒNG NHAU trên cùng danh sách đã phát. Một mô hình, một hiệu chỉnh, một cổng.\n")
    A("| Tầng | Cắt tại `level` | n | **Sự kiện/đồng/năm** | % thắng | EV/lệnh | SE | Tổng R | So với Đầy đủ |")
    A("|---|---|---|---|---|---|---|---|---|")
    for t in tiers[:-1]:
        z = t["z_vs_full"]
        v = "— (mốc)" if z is None else (f"z={z:+.2f} **KHÁC BIỆT**" if abs(z) > 1.96 else f"z={z:+.2f} không phân biệt được")
        A(f"| **{t['tier']}** | ≥ {t['min_level']:.2f} | {t['n']:,} | **{t['per_year']}** | "
          f"{t['win']}% | {t['ev']:+.3f}R | {t['se']:.3f} | {t['total_r']:+.1f}R | {v} |")
    mt = tiers[-1]
    n_sig = sum(1 for t in tiers[:-1] if t["z_vs_full"] is not None and abs(t["z_vs_full"]) > 1.96)
    A(f"\n**Kết luận: {n_sig}/{len(tiers)-2} tầng khác biệt có ý nghĩa so với Đầy đủ.**")
    A(f"Độ lệch chuẩn R mỗi sự kiện = **{mt['sd_per_event']}R** — rất lớn. Để phân biệt được chênh lệch "
      f"0,15R ở mức 95% cần **≈{mt['n_needed_for_0p15']:,} sự kiện mỗi tầng**; hiện có "
      f"**{mt['n_total']:,}** trên {mt['coin_years']} đồng-năm.\n")
    A("> ⚠️ **Tầng KHÔNG phải thang chất lượng.** EV mỗi lệnh không phân biệt được giữa các tầng. "
      "Tầng chỉ điều tiết **tần suất** và do đó **tổng lợi nhuận** — ít lệnh hơn nghĩa là ít tổng R hơn "
      "ở cùng chất lượng kỳ vọng, không phải chất lượng cao hơn. Giao diện không được ngụ ý ngược lại.\n")
    A("\n## 4 · GATE 1a — tỉ số sụt giảm, thang `w`\n")
    A("| Cặp | Sụt giảm chiến lược | Mua-và-giữ | **Tỉ số** | Ngưỡng 0,60 |\n|---|---|---|---|---|")
    for k, v in dd.items():
        A(f"| {k} | {v['dd_strategy']}% | {v['dd_buyhold']}% | **{v['ratio']}** | {'đạt' if v['ratio'] <= 0.60 else '**TRƯỢT**'} |")
    n_pass = sum(1 for v in dd.values() if v["ratio"] <= 0.60)
    A(f"\n**{n_pass}/{len(dd)} cặp đạt.** Cổng đòi ≥80% ⇒ với 4 cặp hiệu chuẩn, ngưỡng chưa đạt.\n")
    A("## 5 · Độ bền qua bề mặt rào chắn — chạy TRÊN CHÍNH máy tranche\n")
    A("| stop | target | payoff | n | % thắng | hoà vốn | biên | R TB thắng | EV |\n|---|---|---|---|---|---|---|---|---|")
    for r in surf:
        star = " ←" if (r["sl"], r["tp"]) == (SL_MULT, TP_MULT) else ""
        A(f"| {r['sl']} | {r['tp']} | {r['payoff']}R | {r['n']:,} | {r['win']}% | {r['be']}% | {r['margin']:+.1f} | {r['r_win']}R | {r['ev']:+.3f}R{star} |")
    mg = [r["margin"] for r in surf]; ev = [r["ev"] for r in surf]
    A(f"\n**Biên: trung vị {np.median(mg):+.1f} · min {min(mg):+.1f} · max {max(mg):+.1f}** · "
      f"{sum(1 for x in mg if x>0)}/{len(mg)} ô biên dương · {sum(1 for x in ev if x>0)}/{len(ev)} ô EV dương\n")
    A("\n## 6 · ★ Hai ngưỡng, hai thứ nguyên — dây an toàn `PRED-02`\n")
    cg = cost_gate_surface(amr["mean"], m["hold_days"])
    A(f"`p_required` = hoà vốn cược đối xứng 1:1 (**chỉ hiển thị**) · `p_star` = hoà vốn của chính rào chắn "
      f"`{SL_MULT}σ̂/{TP_MULT}σ̂` (**cổng quyết định**). Cùng hàm chi phí, khác thứ nguyên.\n")
    A(f"| σ̂ ngày | `p_required` (H = 1 ngày) | `p_required` (H = giữ {cg['hold_days']} ngày) | `c_R` | `p_star` |")
    A("|---|---|---|---|---|")
    for r in cg["rows"]:
        f1 = f"**{r['p_req_1d']*100:.1f}%** ⛔" if r["p_req_1d"] > cg["wire"] else f"{r['p_req_1d']*100:.1f}%"
        f2 = f"**{r['p_req_hold']*100:.1f}%** ⛔" if r["p_req_hold"] > cg["wire"] else f"{r['p_req_hold']*100:.1f}%"
        A(f"| {r['sigma']:.1f}% | {f1} | {f2} | {r['c_R']:.3f} | {r['p_star']*100:.1f}% |")
    A(f"\n**Dây an toàn `p_required > {cg['wire']:.2f}` kích hoạt khi σ̂ ngày < {cg['sigma_cut_1d']:.2f}%** "
      f"(chân trời 1 ngày) hoặc **< {cg['sigma_cut_hold']:.2f}%** (chân trời bằng thời gian nắm giữ). "
      f"Trên cùng dải σ̂, `p_star` chỉ đi từ {cg['p_star_hi']*100:.1f}% xuống {cg['p_star_lo']*100:.1f}%.\n")
    A("> ⚠️ Khung 1 ngày là khung **duy nhất** được phát ý định (ADR-002). Dây an toàn kích hoạt ở biến "
      "động thấp — và `c_R` đi **NGƯỢC** chiều với σ̂, nên nhóm bị bịt đúng là nhóm chi phí trên mỗi R "
      "**cao nhất**. Tần suất kích hoạt thật: `§6b`. Xem `docs/04_PREDICTION_SPEC.md §2.5`.\n")
    A("\n## 6b · ★ Dây an toàn cắn bao nhiêu — đo trên hai mẫu số\n")
    wb = wire_bite_rate(amr["mean"], m["hold_days"])
    A(f"Ngưỡng kích hoạt: σ̂ < **{wb['cuts_pct']['H1d']}%** (H = 1 ngày) · **{wb['cuts_pct']['Hhold']}%** "
      f"(H = nắm giữ). Trung vị σ̂ ngày của toàn mẫu: **{wb['median_sigma_pct']}%** "
      f"({wb['n_days']:,} ngày-đồng · {wb['n_events']:,} sự kiện).\n")
    A("| Cặp | % THỜI GIAN bị cắn (H=1d) | % SỰ KIỆN bị cắn (H=1d) | % thời gian (H=giữ) | % sự kiện (H=giữ) |")
    A("|---|---|---|---|---|")
    for k, v in wb["per"].items():
        bold = (lambda x: f"**{x}%**") if k == "TỔNG" else (lambda x: f"{x}%")
        A(f"| {k} | {bold(v['H1d']['days'])} | {bold(v['H1d']['events'])} | "
          f"{bold(v['Hhold']['days'])} | {bold(v['Hhold']['events'])} |")
    A("\n> **Không phải \"phần lớn thời gian\".** Dây cắn một thiểu số, nhưng phân bố rất lệch theo cặp — "
      "và nhóm bị cắn là nhóm `c_R` cao nhất (chi phí trên mỗi R đi ngược chiều σ̂). Câu hỏi thật không "
      "phải \"dây có bịt miệng hệ không\" mà **\"nhóm sự kiện đó có đáng phát không, khi mỗi đơn vị R "
      "của chúng đắt hơn nhiều lần\"**.\n")
    A("\n## 7 · ★ Ranh giới của trạng thái `bác bỏ` — không hằng số, một phát biểu\n")
    rb = rejection_boundary(mt["sd_per_event"], n_now=mt["n_total"])
    A(f"Phát biểu đăng ký trước: **«cận trên một phía {int((1-0.05)*100)}% của EV nằm dưới 0»**. "
      f"Không có ngưỡng hằng số — ranh giới tự suy từ `n` và độ lệch chuẩn R mỗi sự kiện "
      f"(**{rb['sd_per_event']}R**, đo được) tại đúng thời điểm chấm.\n")
    A("| n sự kiện | sai số chuẩn | EV đo phải âm hơn | … nếu `n_eff` chỉ bằng 25% `n` |")
    A("|---|---|---|---|")
    for r in rb["rows"]:
        tag = " ← cỡ hiện có" if r["is_now"] else ""
        A(f"| {r['n']:,}{tag} | {r['se']:.4f}R | **{r['bound']:+.3f}R** | {r['bound_neff_25']:+.3f}R |")
    A("\n> ⚠️ **Sai số chuẩn ngây thơ là LẠC QUAN.** Sự kiện chồng lấn thời gian và tương quan chéo "
      "coin làm `n` hiệu dụng nhỏ hơn `n` thô — cột cuối cho thấy ranh giới xê dịch bao xa. Phép chấm "
      "thật dùng **phân vị block bootstrap**, độ dài khối ≥ độ dài nhãn; **không** dùng ±z·SE.\n")
    A("> Đọc bảng: với cỡ mẫu hiện thực, `bác bỏ` chỉ bắt được thứ **hỏng rõ rệt**. Đó là tính chất "
      "đúng — bác nhầm một phương pháp thật ra tốt cũng là sai lầm tốn kém. Xem "
      "`docs/04_PREDICTION_SPEC.md §8.5`.\n")
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text("\n".join(L), encoding="utf-8")
    print(f"đã sinh {path} — {len(L)} dòng")


# ══ TRỤC D · phân tầng theo độ chọn lọc (ADR-018) ════════════════════
TIERS = ((0.25, "Đầy đủ"), (0.50, "Cân bằng"), (0.75, "Chọn lọc"), (1.00, "Tối thiểu"))

def tier_table() -> list[dict]:
    """★ PHÉP THỬ TIÊN QUYẾT của trục D: EV có ĐƠN ĐIỆU theo độ chọn lọc không?

    Các tầng là TẬP LỒNG NHAU trên cùng một danh sách đã phát — cùng mô hình,
    cùng hiệu chỉnh, cùng cổng. Chúng chỉ cắt danh sách ở mức `level` khác nhau.
    Vì vậy về thống kê đây vẫn là MỘT giả thuyết, không phải bốn.

    Phí quy về R tính theo σ̂ CỦA CHÍNH tranche đó (không dùng hằng số tham
    chiếu 3,00%) — tranche vào lúc σ̂ thấp bị phí ăn nhiều R hơn.
    """
    rows, years = [], 0.0
    for s in SYMS:
        b, sig, w = _prep(s)
        years += len(b) / 365.25
        for t in run_tranches(b, w, sig):
            c_R = COST_ROUNDTRIP / (SL_MULT * t.sigma * 100)
            rows.append((t.level, t.realized_r - c_R, t.realized_r > 0))
    lv = np.array([r[0] for r in rows])
    rn = np.array([r[1] for r in rows])
    wn = np.array([r[2] for r in rows])
    out, base = [], None
    for lo, name in TIERS:
        k = lv >= lo
        n = int(k.sum())
        ev = float(rn[k].mean())
        se = float(rn[k].std(ddof=1) / np.sqrt(n))
        d = {"tier": name, "min_level": lo, "n": n, "per_year": round(n / years, 1),
             "win": round(float(wn[k].mean()) * 100, 1), "ev": round(ev, 3),
             "se": round(se, 3), "total_r": round(float(rn[k].sum()), 1)}
        if base is None:
            base = (ev, se)
            d["z_vs_full"] = None
        else:
            d["z_vs_full"] = round((ev - base[0]) / np.sqrt(se ** 2 + base[1] ** 2), 2)
        out.append(d)
    sd = float(rn.std(ddof=1))
    return out + [{"tier": "__meta__", "sd_per_event": round(sd, 2), "n_total": len(rows),
                   "coin_years": round(years, 1),
                   "n_needed_for_0p15": int((1.96 * sd / 0.15) ** 2)}]


# ══ các phép đo phụ trợ mà tài liệu cần ══════════════════════════════
def drawdown_ratio_w_scale() -> dict:
    """GATE 1a — chấm ở thang `w` (vốn CỦA CHIẾN LƯỢC), không theo % NAV."""
    out = {}
    for s in SYMS:
        b = load(s); w = ensemble_weight(b)
        oo = b.open.shift(-1) / b.open - 1
        p = w.shift(1).fillna(0)
        r = (p * oo).fillna(0) - (p - p.shift(1).fillna(0)).abs() * (COST_ROUNDTRIP / 200)
        bh = oo.fillna(0).copy(); bh.iloc[0] -= COST_ROUNDTRIP / 200
        dd = lambda x: float(((1 + x).cumprod() / (1 + x).cumprod().cummax() - 1).min())
        out[s] = dict(dd_strategy=round(dd(r) * 100, 2), dd_buyhold=round(dd(bh) * 100, 2),
                      ratio=round(dd(r) / dd(bh), 4))
    return out

def barrier_surface() -> list[dict]:
    """Độ bền qua lưới rào — chạy TRÊN CHÍNH máy tranche."""
    rows = []
    for sl, tp in itertools.product((1.0, 1.2, 1.5, 2.0), (3.0, 4.0, 4.8, 6.0)):
        m = measure(sl, tp)
        rows.append(dict(sl=sl, tp=tp, payoff=round(m["payoff"], 2), n=m["n"],
                         win=round(m["win_rate"] * 100, 1), be=round(m["breakeven"] * 100, 1),
                         margin=round((m["win_rate"] - m["breakeven"]) * 100, 1),
                         r_win=round(m["r_win"], 2), ev=round(m["ev_net"], 3)))
    return rows

# ══ L4 · CỔNG PHÍ — hai ngưỡng, hai thứ nguyên ═══════════════════════
P_REQUIRED_SAFETY_WIRE = 0.60   # PRED-02 · dây an toàn hiện hành

def cost_gate_surface(amr: float, hold_days: float,
                      sigmas=(0.8, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0)) -> dict:
    """★ Bảng để thấy `p_required` và `p_star` KHÔNG thay nhau được.

    p_required : hoà vốn của cược ĐỐI XỨNG 1:1 — chỉ để HIỂN THỊ (PRED-03)
                 = 0,5 + c / (2·E|move|)  ·  E|move| = ABS_MOVE_RATIO·σ̂·√H
    p_star     : hoà vốn của chính RÀO CHẮN đang phát — cổng QUYẾT ĐỊNH
                 = (1 + c_R) / (W + 1)  ·  c_R = c / (sl·σ̂)  ·  W = tp/sl

    Cả hai đọc cùng một hàm chi phí (PRED-16). Câu hỏi bảng trả lời:
    ở mức σ̂ nào thì dây an toàn `p_required > 0,60` của PRED-02 bịt miệng
    khung 1 ngày — khung DUY NHẤT được phát ý định giao dịch (ADR-002)?

    Ngưỡng giải tích:  0,5 + c/(2·amr·σ̂·√H) > wire ⟺ σ̂ < c / (2·(wire−0,5)·amr·√H)
    """
    W = TP_MULT / SL_MULT
    rows = []
    for sg in sigmas:
        c_R = COST_ROUNDTRIP / (SL_MULT * sg)
        row = dict(sigma=sg, c_R=round(c_R, 4), p_star=round((1 + c_R) / (W + 1), 4))
        for H, key in ((1.0, "p_req_1d"), (hold_days, "p_req_hold")):
            row[key] = round(0.5 + COST_ROUNDTRIP / (2 * amr * sg * np.sqrt(H)), 4)
        rows.append(row)
    cut = lambda H: COST_ROUNDTRIP / (2 * (P_REQUIRED_SAFETY_WIRE - 0.5) * amr * np.sqrt(H))
    return dict(rows=rows, hold_days=round(hold_days, 2), wire=P_REQUIRED_SAFETY_WIRE,
                sigma_cut_1d=round(cut(1.0), 3), sigma_cut_hold=round(cut(hold_days), 3),
                p_star_lo=rows[-1]["p_star"], p_star_hi=rows[0]["p_star"])



# ══ L8 · ĐIỀU KIỆN RÚT LUI — ranh giới của trạng thái `bác bỏ` ═══════
Z_ONE_SIDED_95 = 1.645   # quy ước chuẩn, KHÔNG tinh chỉnh — đăng ký trước

def rejection_boundary(sd_per_event: float,
                       ns=(300, 500, 1000, 2000), n_now: int | None = None) -> dict:
    """★ `bác bỏ` KHÔNG có ngưỡng hằng số — nó có một PHÁT BIỂU THỐNG KÊ:

        «cận trên một phía 95% của EV nằm dưới 0»

    Bảng dưới chỉ để thấy BẬC ĐỘ LỚN: ở mỗi cỡ mẫu, EV đo được phải âm hơn
    bao nhiêu thì phát biểu trên mới đúng. Không con số nào trong bảng được
    dùng làm ngưỡng — chúng thay đổi theo n và theo sd đo được tại lúc chấm.

    ⚠️ Sai số chuẩn ngây thơ `sd/√n` là LẠC QUAN: sự kiện chồng lấn thời gian
    và tương quan chéo coin làm n hiệu dụng nhỏ hơn n thô. Phép chấm THẬT phải
    dùng **phân vị block bootstrap**, độ dài khối ≥ độ dài nhãn — xem cột
    `n_eff = 25% n` để thấy ranh giới xê dịch bao xa khi tính đúng.
    """
    rows = []
    for n in sorted(set(list(ns) + ([n_now] if n_now else []))):
        se = sd_per_event / np.sqrt(n)
        rows.append(dict(n=n, se=round(se, 4),
                         bound=round(-Z_ONE_SIDED_95 * se, 4),
                         bound_neff_25=round(-Z_ONE_SIDED_95 * sd_per_event / np.sqrt(n * 0.25), 4),
                         is_now=(n == n_now)))
    return dict(sd_per_event=sd_per_event, z=Z_ONE_SIDED_95, rows=rows)



def wire_bite_rate(amr: float, hold_days: float) -> dict:
    """§6b · Dây an toàn `PRED-02` CẮN bao nhiêu — đo, không suy đoán.

    Trả tần suất `σ̂ < ngưỡng kích hoạt` trên HAI mẫu số khác nhau:
      · ngày-đồng  — bao nhiêu phần trăm THỜI GIAN dây có hiệu lực
      · sự kiện    — bao nhiêu phần trăm KHUYẾN NGHỊ thực sự bị bịt
    Hai con số này khác nhau vì sự kiện không rải đều theo chế độ biến động.
    """
    cg = cost_gate_surface(amr, hold_days)
    cuts = {"H1d": cg["sigma_cut_1d"] / 100.0, "Hhold": cg["sigma_cut_hold"] / 100.0}
    per, all_d, all_e = {}, [], []
    for s in SYMS:
        b, sig, w = _prep(s)
        d = sig.dropna().values
        e = np.array([t.sigma for t in run_tranches(b, w, sig)])
        all_d.append(d); all_e.append(e)
        per[s] = {k: dict(days=round(float((d < c).mean()) * 100, 2),
                          events=round(float((e < c).mean()) * 100, 2)) for k, c in cuts.items()}
    D, E = np.concatenate(all_d), np.concatenate(all_e)
    per["TỔNG"] = {k: dict(days=round(float((D < c).mean()) * 100, 2),
                           events=round(float((E < c).mean()) * 100, 2)) for k, c in cuts.items()}
    return dict(per=per, cuts_pct={k: round(v * 100, 3) for k, v in cuts.items()},
                median_sigma_pct=round(float(np.median(D)) * 100, 2), n_days=len(D), n_events=len(E))


def slippage_table(m: dict) -> list[dict]:
    """EV theo lỗ thực nhận, tính từ CHÍNH cặp (p, W) đang vận hành."""
    p, W, c = m["win_rate"], m["r_win"], m["c_R"]
    be = (p * W - c) / (1 - p)
    return [dict(loss_R=L, ev=round(p * W - (1 - p) * L - c, 3)) for L in (1.0, 1.3, 1.4, 1.5, round(be, 2))] + [dict(breakeven_R=round(be, 2))]

def abs_move_ratio() -> dict:
    """E|move| / σ̂ — phải đo với CHÍNH σ̂ mà hệ dùng (HAR), không phải σ close-to-close."""
    out = {}
    for s in SYMS:
        b = load(s); sig = har_sigma_daily(b).fillna(ewma_sigma_daily(b))
        em = np.log(b.close).diff().abs()
        d = pd.concat([em.rename("e"), sig.rename("s")], axis=1).dropna()
        out[s] = round(float((d.e / d.s).mean()), 4)
    out["mean"] = round(float(np.mean([v for k, v in out.items() if k != "mean"])), 4)
    return out

if __name__ == "__main__":
    emit()
