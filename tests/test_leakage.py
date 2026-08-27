"""★ FILE TEST QUAN TRỌNG NHẤT REPO — bộ dò rò rỉ dữ liệu.

Rò rỉ dữ liệu là cách duy nhất khiến dự án này nói dối bạn một cách thuyết phục.
Backtest 85% chính xác, thực tế bằng 0. Mọi phép thử ở đây tồn tại để bắt đúng
tình huống đó.

Trạng thái: HÀNG RÀO + NĂM PHÉP THỬ M6 đều đã chạy (27/08/2026).

★ ĐIỀU KIỆN NGHIỆM THU KHÔNG PHẢI «TEST XANH».
    Mỗi phép dò đi kèm một phép thử TIÊM RÒ RỈ chứng minh nó BẮT ĐƯỢC.
    Một bộ dò chưa từng bắt được gì không phải bộ dò.

**Không được xoá phép thử để test xanh** — nếu một phép thử đỏ, thứ sai là
pipeline, không phải test.

⚠️ Phép thử «train tương lai / test quá khứ» CỐ Ý KHÔNG có ở đây (03 §M6):
    một tín hiệu dừng hợp lệ cũng cho kết quả tương đương, nên dùng nó sẽ
    vứt đi những model tốt.

Tham chiếu: RULE 2, RULE 3, RULE 11 · docs/03_MODULE_SPECS.md §M6
"""

from __future__ import annotations

import numpy as np
import pandas as pd
import pytest

from cryptopred.features.builder import RAW_LEVEL_COLUMNS, assert_scale_free, shift_all
from cryptopred.validation.purged import Fold, PurgedWalkForward

# ══════════════════════════════════════════════════════════════════
#  HÀNG RÀO — đã chạy được ngay từ P0
# ══════════════════════════════════════════════════════════════════


@pytest.mark.leakage
def test_shift_all_thuc_su_dich_mot_nen(synthetic_ohlcv):
    """RULE 2 — feature của nến t phải rời sang hàng t+1."""
    feat = pd.DataFrame({"r1": np.log(synthetic_ohlcv["close"]).diff()})
    out = shift_all(feat)

    assert pd.isna(out["r1"].iloc[0]), "Hàng đầu phải là NaN sau khi dịch"
    assert out["r1"].iloc[5] == pytest.approx(feat["r1"].iloc[4]), "Giá trị phải đến từ nến trước"


@pytest.mark.leakage
def test_shift_all_tu_choi_shift_0():
    """RULE 2 không có ngoại lệ — shift 0 nghĩa là nhìn thấy hiện tại."""
    feat = pd.DataFrame({"x": [1.0, 2.0, 3.0]})
    with pytest.raises(ValueError, match="RULE 2"):
        shift_all(feat, bars=0)


@pytest.mark.leakage
def test_assert_scale_free_chan_gia_tho(synthetic_ohlcv):
    """RULE 1 — giá thô lọt vào feature là hỏng toàn bộ tính đa-coin."""
    with pytest.raises(ValueError, match="RULE 1"):
        assert_scale_free(synthetic_ohlcv)


@pytest.mark.leakage
def test_assert_scale_free_chap_nhan_ti_le(synthetic_ohlcv):
    feat = pd.DataFrame(
        {
            "log_return_1": np.log(synthetic_ohlcv["close"]).diff(),
            "hl_range_pct": (synthetic_ohlcv["high"] - synthetic_ohlcv["low"])
            / synthetic_ohlcv["close"],
        }
    )
    assert_scale_free(feat)  # không được ném lỗi
    assert not (set(feat.columns) & RAW_LEVEL_COLUMNS)


@pytest.mark.leakage
def test_config_features_khong_cho_phep_bfill():
    """`bfill` kéo dữ liệu tương lai về quá khứ — phải nằm trong danh sách cấm."""
    from cryptopred.config import features_config

    forbidden = " ".join(features_config()["forbidden"]).lower()
    assert "bfill" in forbidden
    assert "center=true" in forbidden


@pytest.mark.leakage
def test_shift_bars_trong_config_luon_it_nhat_1():
    from cryptopred.config import features_config

    assert features_config()["shift_bars"] >= 1, "Đổi shift_bars về 0 là mở cửa cho rò rỉ"


# ══════════════════════════════════════════════════════════════════
#  NĂM PHÉP DÒ CỦA M6 — mỗi phép kèm một phép TIÊM RÒ RỈ
#  docs/03_MODULE_SPECS.md §M6 · docs/PREDICTION_DESIGN.md §LV
# ══════════════════════════════════════════════════════════════════

PURGE = 20  # độ dài nhãn của bộ dữ liệu giả lập dưới đây


def _panel(
    n_days: int = 900,
    n_sym: int = 3,
    seed: int = 7,
    horizon: int = PURGE,
    ragged: bool = False,
):
    """Bảng dài (symbol, ngày) với nhãn nhìn về trước `horizon` nến.

    Giá là bước ngẫu nhiên thuần ⇒ KHÔNG có tín hiệu thật. Mọi điểm số vượt
    50% một cách đáng kể trên bộ này đều là rò rỉ, theo cấu tạo.

    `ragged=True` cho mỗi symbol một ngày niêm yết khác nhau — đúng như vũ trụ
    thật (BTC từ 2021, ETH từ 2019, SOL từ 2020). Đây là ca khiến việc chia
    fold theo từng symbol sinh ra mốc cắt lệch nhau.
    """
    rng = np.random.default_rng(seed)
    rows = []
    for s in range(n_sym):
        start = f"{2021 - s}-01-01" if ragged else "2021-01-01"
        days = n_days + (s * 250 if ragged else 0)
        idx = pd.date_range(start, periods=days, freq="D", tz="UTC")
        close = 100 * np.exp(np.cumsum(rng.normal(0, 0.03, len(idx))))
        r1 = np.r_[np.nan, np.diff(np.log(close))]
        fwd = np.log(np.r_[close[horizon:], [np.nan] * horizon] / close)
        rows.append(
            pd.DataFrame(
                {
                    "ts": idx,
                    "symbol": f"SYM{s}",
                    "f_ret1": pd.Series(r1).shift(1).to_numpy(),  # RULE 2 — đã dịch
                    "f_vol20": pd.Series(r1).rolling(20).std().shift(1).to_numpy(),
                    "label": np.sign(fwd),
                }
            )
        )
    return pd.concat(rows, ignore_index=True).dropna().reset_index(drop=True)


def _score(df: pd.DataFrame, folds: list[Fold], feats: list[str]) -> float:
    """Mô hình tối giản: chọn đặc trưng tương quan mạnh nhất trên TRAIN, dùng dấu
    của nó dự đoán trên TEST. Không phụ thuộc sklearn, và đủ nhạy để lộ rò rỉ —
    nếu một đặc trưng chứa nhãn tương lai, điểm sẽ vọt lên gần 100%."""
    accs = []
    for f in folds:
        tr, te = df.iloc[f.train_idx], df.iloc[f.test_idx]
        if tr.empty or te.empty:
            continue
        corrs = {c: tr[c].corr(tr["label"]) for c in feats}
        best = max(corrs, key=lambda c: abs(corrs[c]) if np.isfinite(corrs[c]) else -1)
        if not np.isfinite(corrs[best]):
            continue
        pred = np.sign(te[best].to_numpy() * np.sign(corrs[best]))
        accs.append(float((pred == te["label"].to_numpy()).mean()))
    return float(np.mean(accs)) if accs else float("nan")


def _cv(n_folds: int = 5) -> PurgedWalkForward:
    return PurgedWalkForward(
        n_folds=n_folds, purge_bars=PURGE, embargo_bars=PURGE, min_train_bars=200
    )


# ── PHÉP DÒ 1 · DỊCH NHÃN ─────────────────────────────────────────
@pytest.mark.leakage
def test_probe1_shifted_labels_khong_lam_diem_tang():
    """Dịch nhãn thêm một bước rồi chấm lại. Điểm TĂNG ⇒ model đang đọc tương lai."""
    df = _panel()
    folds = list(_cv().split_panel(df["ts"]))
    feats = ["f_ret1", "f_vol20"]
    base = _score(df, folds, feats)
    moved = df.copy()
    moved["label"] = moved.groupby("symbol")["label"].shift(-1)
    moved = moved.dropna().reset_index(drop=True)
    shifted = _score(moved, list(_cv().split_panel(moved["ts"])), feats)
    assert shifted <= base + 0.05, f"Dịch nhãn làm điểm TĂNG {base:.3f} → {shifted:.3f} ⇒ rò rỉ."


@pytest.mark.leakage
def test_probe1_BAT_DUOC_ro_ri_tiem_vao():
    """★ NGHIỆM THU — tiêm một đặc trưng bằng chính nhãn của nến kế tiếp."""
    df = _panel()
    df["f_leak"] = df.groupby("symbol")["label"].shift(-1)  # nhìn tương lai
    df = df.dropna().reset_index(drop=True)
    feats = ["f_ret1", "f_vol20", "f_leak"]
    base = _score(df, list(_cv().split_panel(df["ts"])), feats)
    moved = df.copy()
    moved["label"] = moved.groupby("symbol")["label"].shift(-1)
    moved = moved.dropna().reset_index(drop=True)
    shifted = _score(moved, list(_cv().split_panel(moved["ts"])), feats)
    assert shifted > base + 0.05, (
        f"PROBE 1 KHÔNG BẮT ĐƯỢC rò rỉ đã tiêm: {base:.3f} → {shifted:.3f}"
    )


# ── PHÉP DÒ 2 · XÁO TRỘN NHÃN ─────────────────────────────────────
@pytest.mark.leakage
def test_probe2_shuffled_labels_ve_muc_ngau_nhien():
    """Xáo nhãn trong từng symbol. Điểm phải về ~50%."""
    df = _panel()
    rng = np.random.default_rng(0)
    df["label"] = df.groupby("symbol")["label"].transform(lambda s: rng.permutation(s.to_numpy()))
    acc = _score(df, list(_cv().split_panel(df["ts"])), ["f_ret1", "f_vol20"])
    assert abs(acc - 0.5) < 0.08, f"Nhãn đã xáo mà điểm vẫn {acc:.3f} ⇒ rò rỉ."


@pytest.mark.leakage
def test_probe2_BAT_DUOC_ro_ri_tiem_vao():
    """★ NGHIỆM THU — đặc trưng sao chép chính nhãn thì xáo cũng không cứu được."""
    df = _panel()
    rng = np.random.default_rng(0)
    df["label"] = df.groupby("symbol")["label"].transform(lambda s: rng.permutation(s.to_numpy()))
    df["f_copy"] = df["label"]  # rò rỉ tiêm vào
    acc = _score(df, list(_cv().split_panel(df["ts"])), ["f_ret1", "f_copy"])
    assert acc > 0.58, f"PROBE 2 KHÔNG BẮT ĐƯỢC: điểm chỉ {acc:.3f}"


# ── PHÉP DÒ 3 · TƯƠNG QUAN ĐẶC TRƯNG ↔ NHÃN ───────────────────────
def _max_abs_corr(df: pd.DataFrame, feats: list[str]) -> float:
    return max(abs(df[c].corr(df["label"])) for c in feats)


@pytest.mark.leakage
def test_probe3_khong_dac_trung_nao_tuong_quan_qua_099():
    df = _panel()
    assert _max_abs_corr(df, ["f_ret1", "f_vol20"]) <= 0.99


@pytest.mark.leakage
def test_probe3_BAT_DUOC_ro_ri_tiem_vao():
    """★ NGHIỆM THU — đặc trưng sao chép nhãn có |corr| = 1."""
    df = _panel()
    df["f_copy"] = df["label"]
    assert _max_abs_corr(df, ["f_ret1", "f_copy"]) > 0.99


# ── PHÉP DÒ 4 · RANH GIỚI CHÉO COIN ───────────────────────────────
@pytest.mark.leakage
def test_probe4_moi_symbol_dung_chung_MOT_moc_cat():
    """★ Chia fold riêng từng coin = rò rỉ chéo gần như trực tiếp (03 §M6)."""
    df = _panel(n_sym=3, ragged=True)
    folds = list(_cv().split_panel(df["ts"]))
    for f in folds:
        te, tr = df.iloc[f.test_idx], df.iloc[f.train_idx]
        # ① mọi hàng test nằm trọn trong cửa sổ toàn cục, bất kể symbol nào
        assert te["ts"].min() >= f.test_start and te["ts"].max() <= f.test_end
        assert tr["ts"].max() <= f.train_end
        # ② KHÔNG symbol nào bị bỏ sót nếu nó CÓ dữ liệu trong cửa sổ đó
        co_du_lieu = set(df.loc[df["ts"].between(f.test_start, f.test_end), "symbol"].unique())
        assert set(te["symbol"].unique()) == co_du_lieu, (
            "Một symbol có dữ liệu trong cửa sổ test nhưng bị loại — mốc cắt không toàn cục"
        )
        # ③ symbol chưa niêm yết thì vắng mặt — đó là ĐÚNG, không phải lỗi
        assert co_du_lieu, "Cửa sổ test rỗng"


@pytest.mark.leakage
def test_probe4_BAT_DUOC_chia_fold_theo_tung_symbol():
    """★ NGHIỆM THU — chia riêng từng symbol thì mốc cắt lệch nhau."""
    # vũ trụ THẬT có lịch sử lệch nhau — đó là ca sinh ra rò rỉ chéo
    df = _panel(n_sym=3, ragged=True)
    per_symbol_cuts = {
        sym: next(iter(_cv().split(pd.DatetimeIndex(g.sort_values("ts")["ts"])))).test_start
        for sym, g in df.groupby("symbol")
    }
    assert len(set(per_symbol_cuts.values())) > 1, (
        f"PROBE 4 KHÔNG BẮT ĐƯỢC: chia riêng từng symbol mà mốc vẫn trùng — {per_symbol_cuts}"
    )
    # còn trục toàn cục thì mọi symbol dùng chung đúng một mốc
    g_cut = next(iter(_cv().split_panel(df["ts"]))).test_start
    assert len(set(per_symbol_cuts.values()) - {g_cut}) > 0, (
        "Mốc riêng phải khác mốc toàn cục — nếu không thì phép dò vô nghĩa"
    )


# ── PHÉP DÒ 5 · KIỂM TRA RANH GIỚI ────────────────────────────────
@pytest.mark.leakage
def test_probe5_train_va_test_khong_chong_lan():
    df = _panel()
    cv = _cv()
    folds = list(cv.split_panel(df["ts"]))
    cv.assert_no_overlap(folds)
    for f in folds:
        assert f.gap_bars >= pd.Timedelta(days=PURGE), (
            f"Fold {f.index}: khoảng trống {f.gap_bars} < purge {PURGE} ngày"
        )


@pytest.mark.leakage
def test_probe5_BAT_DUOC_purge_bang_khong():
    """★ NGHIỆM THU — purge = 0 phải bị TỪ CHỐI ngay ở hàm khởi tạo."""
    with pytest.raises(ValueError, match="RULE 3"):
        PurgedWalkForward(n_folds=5, purge_bars=0, embargo_bars=PURGE, min_train_bars=200)


@pytest.mark.leakage
def test_probe5_BAT_DUOC_purge_qua_ngan():
    """★ NGHIỆM THU — purge ngắn hơn độ dài nhãn để lọt nhãn chồng lấn."""
    df = _panel(horizon=PURGE)
    short = PurgedWalkForward(n_folds=5, purge_bars=1, embargo_bars=1, min_train_bars=200)
    folds = list(short.split_panel(df["ts"]))
    assert all(f.gap_bars < pd.Timedelta(days=PURGE) for f in folds), (
        "PROBE 5 KHÔNG BẮT ĐƯỢC: purge=1 mà khoảng trống vẫn ≥ độ dài nhãn"
    )


# ── RULE 11 · ngưỡng nghi ngờ ─────────────────────────────────────
@pytest.mark.leakage
def test_rule11_accuracy_khung_1h_vuot_60_phai_bao_dong():
    """Vượt 60% ở khung giờ ⇒ GIẢ ĐỊNH CÓ RÒ RỈ, không ăn mừng."""
    from cryptopred.config import model_config

    nguong = model_config()["sanity"]["suspicious_accuracy_1h"]
    assert nguong <= 0.60, "Nới ngưỡng RULE 11 là tự tước bỏ hàng rào cuối cùng"
    df = _panel()
    acc = _score(df, list(_cv().split_panel(df["ts"])), ["f_ret1", "f_vol20"])
    assert acc < nguong, f"Bước ngẫu nhiên thuần mà đạt {acc:.3f} ⇒ rò rỉ trong chính bộ test"
