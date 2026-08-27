# THIẾT KẾ RULE-BASE — LẮP RÁP TỪ PHƯƠNG PHÁP 4 · 7 · 8 · 6 · 5

> Phiên bản 0.9 (nháp chờ phản biện) · 27/08/2026
> Đây là bản **thiết kế chi tiết** của tầng quy tắc trong module Prediction: lắp các kết luận đã đo ở `11`–`16` thành đặc tả viết-mã-được. Mọi hằng số có cột **nguồn gốc** — không con số nào được phép xuất hiện mà không truy được về một phép đo hoặc một quyết định đã ghi.
> Quan hệ: `12 §6` (kiến trúc L0–L8 — tài liệu này là đặc tả tầng R của nó) · `13` (hàm chi phí) · `15` (lượng dữ liệu) · `16` (phương pháp thiết kế) · `ADR-002` (khoá 1h/4h).
> **Không phải lời khuyên đầu tư.**

---

# PHẦN 0 · TỔNG QUAN LẮP RÁP

## 0.1 · Vai trò của từng phương pháp — ánh xạ R-tầng ↔ L-tầng

| Tầng quy tắc | Từ phương pháp | Nằm ở tầng kiến trúc (`12 §6.2`) | Trạng thái |
|---|---|---|---|
| **R7 · Hàm chi phí + cổng phí** | Phương Pháp 7: Funding Rate & Cash-and-Carry | **L4** (+ f̂ ở L2) | ✅ Xây trước tiên |
| **R4 · Hướng sơ cấp: tổ hợp xu hướng** | Phương Pháp 4: Position Trading & Trend Following (lối ra mượn cấu trúc Phương Pháp 3: Swing Trading) | **L5** | ✅ Xây tuần 8–10 |
| **R8 · Hướng thay thế: động lượng cắt ngang** | Phương Pháp 8: On-Chain & Narrative Trading (nhánh Narrative đã quy tắc hoá) | **L5 thay thế** | ⏳ Thiết kế xong, **khoá chờ dữ liệu vũ trụ** |
| **R6 · Đặc trưng dòng lệnh** | Phương Pháp 6: Order Flow (nhánh sống sót) | **L1**, tiêu thụ bởi L6 | 🔶 Chờ cron + cột dữ liệu |
| **R5 · Đặc trưng cấu trúc** | Phương Pháp 5: Smart Money Concepts (một đặc trưng sống sót) | **L1**, tiêu thụ bởi L6 | ✅ Dựng được ngay |

Không có tầng nào cho Phương Pháp 1, 2, 9 — chúng bị loại bằng số học (`11`), và Hàng rào 1 chặn chúng **bằng mã** chứ không bằng quy ước.

## 0.2 · Sơ đồ lắp ráp

```
nến đóng ──► L0 độ tươi ──► L1 đặc trưng (R5 · R6 nằm ở đây)
                                 │
                                 ▼
                     L2 · σ̂ (HAR-RV) + f̂ (R7.1)        ← hai đại lượng DỰ BÁO ĐƯỢC
                                 │
                                 ▼
                     L3 · một phân phối F  ──► q10/q50/q90 · p_up (hiển thị)
                                 │
                                 ▼
                     L4 · R7.2 CỔNG PHÍ  ──► p_required (hiển thị mọi khung)
                                 │            + cổng SỰ KIỆN p*_event (quyết định)
                                 ▼
                     L5 · R4 TỔ HỢP XU HƯỚNG (hoặc R8 sau điểm rẽ)
                                 │  sinh SỰ KIỆN THEO TRANCHE (§2.4)
                                 ▼
                     L6 · học máy CHỈ LỌC BỎ  (đặc trưng từ R5 · R6 · R7.3)
                                 ▼
                     L7 · định cỡ + VETO ──► L8 đối soát + bảng điểm
```

## 0.3 · Ba nguyên tắc chi phối mọi lựa chọn bên dưới

1. **Rule giữ những gì đã biết; học máy chỉ được thu hẹp tập hành động** (`16 §2`). Fuzz-test được.
2. **Không chọn tham số bằng tối ưu.** Biến thể không phân biệt được ⇒ tổ hợp (`12 §6.5`). Khi loại một tham số, không tạo tham số mới thay thế (`16` Bước 6).
3. **Mọi ngưỡng quyết định nằm trong mã, có test làm nó đỏ.** Cấu hình chỉ giữ sự thật môi trường (phí sàn), không giữ ngưỡng (`16 §5`).

---

# PHẦN 1 · R7 — TẦNG CHI PHÍ (Phương Pháp 7) — XÂY TRƯỚC TIÊN

## 1.1 · R7.1 — Dự báo funding `f̂`

```python
def forecast_funding_daily(hist_8h: pd.Series) -> float:
    """Funding %/ngày dự báo cho kỳ tới.
    OOS R² đo được 0,437–0,514 trên 4 cặp (13 §4.2)."""
    daily = hist_8h.resample("1D").mean() * 3          # 3 kỳ mỗi ngày
    f_hat = daily.ewm(halflife=7).mean().iloc[-1]
    return clamp(f_hat, -0.005, +0.015)                # −0,5% … +1,5%/ngày
```

| Hằng số | Giá trị | Nguồn gốc |
|---|---|---|
| Chu kỳ bán rã | 7 ngày | `13 §4.2` — R² 0,44–0,51; naive trên SOL chỉ 0,010 ⇒ làm mượt là bắt buộc |
| Biên kẹp | −0,5% … +1,5%/ngày | Đợt SOL 11/2022 đo được −0,477%/ngày (`13 §7.4`); trần từ p99 lịch sử ×3 |
| **Khi thiếu dữ liệu funding** | `f̂ = p95 lịch sử của symbol` (thiếu nốt: p95 của BTC = 0,138%/ngày) | `13 §9` — luồng dữ liệu hỏng đúng lúc thị trường động; **rơi về mặc định 0,03%/ngày là đánh giá thấp chi phí đúng lúc chi phí cao nhất** |

## 1.2 · R7.2 — Hàm chi phí và HAI cổng (một hiển thị, một quyết định)

Bài học từ lỗi thứ nguyên của vùng chết 0,42/0,58 (`10 §1.3`), tổng quát hoá: **ngưỡng hoà vốn phụ thuộc HÌNH DẠNG cược.** Hệ có hai hình dạng nên có hai công thức — trộn chúng là lặp lại đúng lỗi cũ.

```python
def cost_pct(H_days: float, instrument: str, f_daily: float) -> float:
    if instrument == "spot":
        return 0.30                                    # taker 0,10×2 + trượt 0,05×2
    return 0.20 + f_daily * 100 * H_days               # perp: phí + funding × ngày giữ

def choose_instrument(H_days: float, f_daily: float) -> str:
    """Spot rẻ hơn khi giữ đủ lâu. Ngưỡng = (0,30−0,20)/f̂ (13 §5.1)."""
    return "spot" if H_days > 0.10 / max(f_daily * 100, 1e-6) else "perp"

# ── CỔNG HIỂN THỊ — cược đối xứng 1:1, in trên MỌI panel (ADR-002) ──
def p_required_symmetric(sigma_d: float, H_days: float, inst: str, f_d: float) -> float:
    e_move = sigma_d * sqrt(2/pi) * sqrt(H_days) * 100
    return 0.5 + cost_pct(H_days, inst, f_d) / (2 * e_move)

# ── CỔNG QUYẾT ĐỊNH — sự kiện rào chắn 4:1, tính TỪNG SỰ KIỆN ──
def p_star_event(sigma_d: float, inst: str, f_d: float,
                 sl_mult: float = 1.2, tp_mult: float = 4.0,
                 exp_hold_days: float = 6.3) -> float:
    """Hoà vốn của cược thắng +4R / thua −1R.
    c_R = chi phí khứ hồi quy về đơn vị R (R = khoảng cắt lỗ = sl_mult·σ̂)."""
    c_R = cost_pct(exp_hold_days, inst, f_d) / (sl_mult * sigma_d * 100)
    return (1 + c_R) / (tp_mult + 1)
```

**Kiểm số học** (σ̂ = 2,33%/ngày, giao ngay): `c_R = 0,30/2,80 = 0,107` ⇒ `p* = 1,107/5 = 22,1%` — khớp con số 22,0% của `10`/`11`. Ở chế độ vol thấp (σ̂ = 1,71%): `p* = 22,9%`.

> **Vì sao hình dạng 4:1 là bất biến đáng giá nhất của cả thiết kế:** cược đối xứng khung ngày dao động 54,3% → 55,8% giữa hai chế độ vol — nuốt gần hết biên. Cược 4:1 chỉ dao động **22,1% → 22,9%** trên cùng hai chế độ. Hình dạng cược làm ngưỡng hoà vốn **gần như bất biến theo chế độ** — đó là cách duy nhất đã tìm thấy để biến trần năng lực cố định thành kỳ vọng dương mà không cần giả định gì về chế độ.

**Kiểm tra sức chịu trượt giá của lệnh cắt lỗ** (`15 §2.7`, thành cổng số):

```
Lỗ thực nhận 1,0R:  p* = (1 + 0,107) / 5     = 22,1%   ← biên +7,9 điểm so 30,0% đo được
Lỗ thực nhận 1,5R:  p* = (1,5 + 0,107) / 5,5 = 29,2%   ← biên +0,8 điểm — GẦN HẾT
```

⇒ **Phép đo trượt giá lệnh cắt lỗ là cổng chặn cửa** (Phần 6): nếu trượt thực đo ≥1,4R, kỳ vọng của toàn kiến trúc âm và điểm rẽ nhánh chuyển sang "ship tổ hợp như sản phẩm quản trị rủi ro".

## 1.3 · R7.3 — Hai đặc trưng funding (cấp cho L6, chiều TIẾP DIỄN)

`funding_z96` (cụm 13, `14 §2`) và `funding_level_pct` (cụm 6). Không bao giờ dùng làm tín hiệu đảo chiều — `09 §2` + `13 §6.1` (7/8 phép thử cho chiều tiếp diễn). Không cần quy tắc veto funding riêng: funding nóng tự đẩy `cost_pct` lên và cổng tự đóng.

## 1.4 · Bất biến R7 — mỗi cái một test

| Bất biến | Test |
|---|---|
| Sàn hợp đồng vĩnh cửu: `p_required(perp,d) ≥ 0,5 + √(c₀·f)/A` với mọi d | Quét d ∈ [0,25 ; 90]; một lỗi dấu funding sẽ tụt dưới sàn — không test khác bắt được |
| `choose_instrument` là hàm | Tại f̂ = 0,0292%/ngày ⇒ ngưỡng 3,4 ngày; H = 6,3 ⇒ `spot`. Tại H = 0,5 ⇒ `perp` |
| Thiếu funding ⇒ giả định xấu nhất | Cắt chuỗi funding ⇒ `f̂` phải **tăng** lên p95, không rơi về 0,03% |
| Hai cổng không hoán đổi | `p_star_event` không bao giờ được so với `p_up`; `p_required_symmetric` không bao giờ chặn sự kiện — kiểm bằng kiểu (hai kiểu dữ liệu khác nhau, không so sánh được) |

---

# PHẦN 2 · R4 — HƯỚNG SƠ CẤP: TỔ HỢP XU HƯỚNG (Phương Pháp 4)

## 2.1 · Tín hiệu một ô

```python
def cell_signal(bars, ef: int, es: int, dn: int) -> int:      # 0 hoặc 1
    c = bars.close
    vao  = (c[t] > EMA(c, es)[t]) and (c[t] > max(bars.high[t-dn : t-1]))
    ra   = (c[t] < EMA(c, ef)[t])
    # máy trạng thái: 0 ─vao→ 1 ─ra→ 0. KHÔNG có trạng thái bán khống.
```

Lưới **đóng băng, đăng ký trước**: `ef ∈ {10, 20, 50}` × `es ∈ {100, 150, 200}` × `dn ∈ {20, 55, 100}` = **27 ô**. Nguồn gốc: `12 §2.5` — chính lưới đã đo; mọi biến thể khác của họ tín hiệu này tương quan 0,7–0,95 (`16` Bước 5) nên không có gì để đi tìm thêm.

## 2.2 · Tổ hợp — không chọn ô

```python
w_raw = mean(cell_signal(bars, *cell) for cell in GRID_27)     # ∈ [0, 1]
w     = round_to(w_raw, {0, 0.25, 0.50, 0.75, 1.00})           # 5 mức
```

| Quyết định | Nguồn gốc |
|---|---|
| Tổ hợp thay vì chọn | `12 §6.5` — tương quan hạng tham số giữa hai đoạn +0,19; tổ hợp cho tỉ số sụt giảm 0,29/0,29/0,31 (ổn định trong 0,02) |
| Trọng số đều giữa 27 ô | Mọi trọng số khác là tham số mới — cấm theo `16` Bước 6 |
| 5 mức rời rạc | Giảm số lệnh; **không có ngưỡng đồng thuận** — `w` là tỉ trọng, không phải phiếu bầu qua/trượt (`15 §2.10`) |
| Khoá cứng: không hysteresis, không làm mượt thêm | Mỗi thứ đó là một tham số mới. Nếu đo thấy nhấp nháy (flapping) giữa hai mức, ghi nhận như một phát hiện — **không** thêm tham số để giấu nó |

## 2.3 · Công cụ và khớp lệnh

- **GIAO NGAY, không ngoại lệ** — giữ ~6,3 ngày > ngưỡng đổi công cụ 2,0–3,4 ngày (`13 §5.1`); mức phạt perp tăng theo vol đúng lúc muốn giao dịch (`13 §5.2`).
- Tín hiệu tính tại close nến ngày `t` (00:00 UTC) · khớp mô hình hoá tại **open nến t+1**.
- **Thực thi thật lệch khỏi 00:00 UTC**: TWAP trong 00:15–00:45 UTC. 00:00 UTC vừa là mốc funding vừa là mốc turn-of-candle (+0,58bps/phút dồn cụm — `09 §4`); backtest vẫn dùng open như ước lượng thận trọng.

## 2.4 · ★ Sinh SỰ KIỆN THEO TRANCHE — hoà giải tỉ trọng liên tục với nhãn rời rạc

Vấn đề chưa tài liệu nào giải: tổ hợp cho **tỉ trọng liên tục**, nhưng khung rào chắn và meta-label cần **sự kiện rời rạc**. Thiết kế:

```
SỰ KIỆN = một bước TĂNG của w (0→0,25 · 0,25→0,50 · …)
  · tranche_size = Δw × size_base
  · mỗi tranche mang SL/TP/hạn CỦA RIÊNG NÓ, tính từ σ̂ tại entry của nó:
        SL = entry × (1 − 1,2·σ̂)      TP = entry × (1 + 4,0·σ̂)      hạn = 60 ngày
  · thoát tranche: chạm rào của nó  HOẶC  w bước xuống dưới mức của nó (LIFO)
                   HOẶC veto L7
  · L6 chấm TỪNG tranche-sự-kiện, chỉ được ép tranche đó = 0
```

| Vì sao thiết kế này | |
|---|---|
| Nhãn triple-barrier **rõ nghĩa** | Mỗi tranche một entry, một bộ rào — nhãn "chạm TP trước SL?" định nghĩa được |
| Bất biến đơn điệu **còn nguyên** | L6 chỉ ép tranche về 0, không đổi w, không đổi hướng |
| Vào lệnh **dần** khi các ô lần lượt đồng ý | Tổ hợp tự nhiên là bộ giảm chấn (`12 §6.5` lý do 4) |
| LIFO khi w giảm | Tranche vào sau (giá cao hơn trong uptrend) thoát trước — khớp trực giác cắt phần rủi ro mới nhất; và **là quy ước, không phải tham số** |

**Thang σ̂: k = 1 (σ̂ NGÀY), khoá cứng.** Nguồn: `12 §2.8` — tại k=1, 0/23 lệnh hết hạn, payoff 4:1 thật sự xảy ra; tại thang 35 ngày, 11/23 lệnh hết hạn và toàn bộ lập luận kinh tế sụp. ADR-009.

## 2.5 · Ngân sách im lặng của R4 — đăng ký trước

| Số | Giá trị đăng ký | Nguồn |
|---|---|---|
| Sự kiện tranche kỳ vọng | **8 – 20 thay đổi tỉ trọng/đồng/năm** (đo lại sau rời rạc hoá; tổ hợp liên tục đo được 25/năm) | `12 §6.5` chi tiết vận hành |
| Lệnh vào barrier kỳ vọng | ~3,5 sự-kiện-mới/đồng/năm ở mức ô đơn | `15 §1.5` — 90 lệnh / 4 cặp / ~6,4 năm |
| Vũ trụ giao dịch | **8–10 đồng** (đo trên 40) | `11 §7.3` + `15 §2.8` — ghi ADR: hệ kiểm định ≠ hệ chạy, phải đối chiếu |
| Trần tỉ lệ phát | 1h < 2% · 4h < 8% · 1d < 15% số nến | `10 mandate 12` |

## 2.6 · Điều R4 hứa và KHÔNG hứa — in cả hai lên dashboard

| Hứa (đo được, tái lập 54/54) | KHÔNG hứa |
|---|---|
| Tỉ số sụt giảm so mua-và-giữ ≤ ~0,6 (đo: 0,29–0,39) | Sharpe vượt mua-và-giữ (không tái lập: 0,07 → 0,77) |
| Sống sót chuỗi thua 8 lệnh (xác suất 5,8% — trong thiết kế) | Tỉ lệ thắng chứng minh được (cần 34 năm — `15 §3.4`) |

---

# PHẦN 3 · R8 — HƯỚNG THAY THẾ: ĐỘNG LƯỢNG CẮT NGANG (Phương Pháp 8)

**Trạng thái: thiết kế đầy đủ hôm nay, khoá vận hành cho tới khi đủ dữ liệu vũ trụ.** Thiết kế trước để ① cron ngày một có đặc tả tiêu thụ rõ ràng ② điểm rẽ nhánh ngày ~70 có phương án B đã đặc tả sẵn, không phải thiết kế lúc đang thất vọng vì GATE 1 trượt.

## 3.1 · Đặc tả

```python
# CHẠY MỖI THỨ HAI 00:00 UTC (khớp 00:15–00:45 TWAP như R4)
def cross_sectional_targets(month_snapshot, bars_by_symbol) -> dict[str, float]:
    # ① VŨ TRỤ CỦA ĐÚNG KỲ ĐÓ — tuyệt đối không dùng danh sách hôm nay (bẫy sống sót)
    universe = month_snapshot.symbols
    # ② lọc thanh khoản: trung vị quote-volume 30 ngày ≥ ngưỡng của config
    liquid = [s for s in universe if median_qv_30d(s) >= LIQ_MIN]
    # ③ xếp hạng theo BA cửa sổ, BỎ tuần gần nhất, rồi TRUNG BÌNH HẠNG
    #    (tổ hợp thay vì chọn cửa sổ — cùng nguyên tắc với R4)
    ranks = mean_rank(ret(s, 14, skip=7), ret(s, 21, skip=7), ret(s, 28, skip=7))
    # ④ CHỈ MUA nhóm 20% hạng cao nhất, trọng số nghịch đảo σ̂ (vol targeting B4)
    top = ranks.top_quantile(0.20)
    return {s: (1/sigma_hat(s)) / sum(1/sigma_hat(x) for x in top) for s in top}
```

| Quyết định | Nguồn gốc |
|---|---|
| Chỉ mua, nhóm thanh khoản cao | Liu–Tsyvinski–Wu (JF 2022): 4,2%/tuần **chỉ có ý nghĩa ở nhóm trên trung vị vốn hoá**; bán khống nhóm cuối cần vay đồng nhỏ, phí vay 5–30%+ |
| Bỏ tuần gần nhất | Chuẩn literature — tránh đảo chiều ngắn hạn |
| Trung bình hạng 3 cửa sổ {14, 21, 28} | Nguyên tắc tổ hợp (`16` Bước 6) — không chọn cửa sổ |
| Tuần, không phải ngày | 1 vòng/tuần spot = ~10,4%/năm phí nếu thay toàn bộ rổ (`09 §4`); thực tế rổ chồng lấn giữa các tuần nên quay vòng một phần — **phí mô hình hoá theo turnover thực, không theo vòng trọn** |

## 3.2 · Điều kiện MỞ KHOÁ — đăng ký trước

```
R8 chỉ được chạy khi MỘT trong hai:
  (a) ≥ 12 ảnh chụp vũ trụ hằng tháng thật đã tích luỹ          (sớm nhất: 2027-08)
  (b) vũ trụ quá khứ TÁI TẠO được từ kho lưu trữ Binance
      (nhiệm vụ điều tra 2 giờ — 12 §5.5) VÀ bản tái tạo được đối chiếu
      khớp ảnh chụp thật của các tháng đã có
VÀ (bất kể a hay b):
  cổng riêng của R8: tỉ số sụt giảm ≤ 0,60 so DCA-hold BTC VÀ so rổ-40-đều,
  trên purged walk-forward — KHÔNG kỳ vọng con số 4,2%/tuần của LTW
  (long-only top-quintile của 40 đồng thanh khoản là biến thể YẾU HƠN NHIỀU
   biến thể long-short deciles của họ; kỳ vọng thật: chưa biết ⇒ vì thế mới có cổng)
```

## 3.3 · Quan hệ với R4 tại điểm rẽ nhánh

R8 **thay thế** R4 làm L5 nếu GATE 1 của R4 trượt — không bao giờ **trộn** (trộn = thêm tham số pha trộn = vi phạm `16` Bước 6). Cây quyết định đầy đủ ở `11 §6.3`.

---

# PHẦN 4 · R6 + R5 — ĐẶC TRƯNG QUY TẮC HOÁ CHO BỘ LỌC L6

Các tầng này **không ra quyết định** — chúng là phép tính tất định (rule về mặt mã) sinh đặc trưng cho L6. Toàn bộ qua `shift_all(1)` + `assert_scale_free()` (RULE 1, 2).

## 4.1 · R6 — dòng lệnh (Phương Pháp 6, nhánh Order Flow)

| Đặc trưng | Công thức (mọi thứ đã shift 1) | Cần dữ liệu | Cụm (`14 §2`) |
|---|---|---|---|
| `taker_buy_ratio_z` | `z₉₆(taker_buy_vol / vol)` | Cột 9 klines — **cron/mẻ tải G3** | chưa đo |
| `cvd_slope_24` | `slope₂₄(cumsum(2·taker_buy − vol)) / mean₂₄(vol)` | như trên | chưa đo |
| `oi_price_div` | `sign(Δ₂₄ close) × sign(Δ₂₄ OI)` | **cron OI — 30 ngày, MẤT VĨNH VIỄN** | chưa đo |
| `volume_z96` | `z₉₆(vol)` | có sẵn | cụm 3 |
| *(chờ)* `cvd_divergence_spot_perp` | CVD spot − CVD perp, chuẩn hoá | aggTrades hai thị trường | chưa đo |
| *(chờ)* `cascade_recency_bars` | số nến từ lần gần nhất `ΔOI < p05 & ret < p05` | cron OI | chưa đo |

**Quy tắc nạp:** đặc trưng mới chỉ vào khi đã đo cụm trên dữ liệu thật (`14 §5` quy tắc 1) — bốn đặc trưng "chưa đo" ở trên phải qua phép đo trùng lặp trước khi chiếm suất.

## 4.2 · R5 — cấu trúc (Phương Pháp 5, phần sống sót duy nhất)

| Đặc trưng | Công thức | Ghi chú |
|---|---|---|
| `dist_to_prior_swing_sigma` | `(close − max(high[t−20…t−1])) / (σ̂ · close)` | Thước đo cấu trúc trung tính — **không phải** khẳng định Smart Money Concepts. Cụm 1, đại diện cấu trúc (`14 §2`) |

**Kèm hàng rào cấm định danh** (test quét `src/`): `order_block` · `fvg` · `bos` · `choch` · `liquidity_grab` · `killzone` · `elliott` · `wave_count` · `harmonic` · `gartley` · `smart_money`. Lý do mạnh hơn sau `12 §3`: các khái niệm này giờ đã **bị đo và bác** (FVG lấp 79,5% so nền 85,1%; sweep-reclaim edge **âm**) — một biến mang tên chúng chỉ có thể là cửa nhập ontology qua đầu người viết mã.

---

# PHẦN 5 · HÀM QUYẾT ĐỊNH LẮP RÁP

```python
def predict(bars, funding_hist, cfg) -> Prediction:
    """HÀM THUẦN — không đồng hồ, không I/O, không global (10 mandate 13)."""

    # L0 — độ tươi chặn trước mọi thứ
    fresh = freshness(bars)
    if fresh in ("delayed", "disconnected"):
        return no_opinion(fresh, "dữ liệu không đủ tươi")           # late=True CHẶN predict

    # L1–L2 — đặc trưng + HAI đại lượng dự báo được
    feats  = build_features(bars)                                    # shift_all(1) bên trong
    sigma  = har_rv(feats)  or  ewma_sigma(feats, lam=0.94)          # fallback tất định
    f_hat  = forecast_funding_daily(funding_hist)                    # §1.1, có fallback p95

    # L3 — MỘT phân phối, ba cách đọc (mâu thuẫn p_up↔q50 bất khả về cấu trúc)
    F = LogNormal(mu=0.0, sigma=sigma * sqrt(H_days))                # VR≈1 ⇒ mu=0
    q10, q50, q90 = F.quantiles(0.10, 0.50, 0.90)
    p_up = 1 - F.cdf(0)

    # L4 — R7: chi phí, công cụ, HAI cổng
    inst   = choose_instrument(EXP_HOLD_DAYS, f_hat)                 # đầu ra, không giả định
    p_req  = p_required_symmetric(sigma, H_days, inst, f_hat)        # HIỂN THỊ, mọi khung
    if p_req > SUSPICIOUS_ACC:                                       # Hàng rào 1: giết 1h/4h
        return display_only(F, p_req, "khung này không có nghiệm kinh tế")

    # L5 — R4 (hoặc R8 sau điểm rẽ): tổ hợp, tranche
    w      = ensemble_weight(bars, GRID_27)                          # {0,.25,.5,.75,1}
    events = tranche_events(w, prev_state, sigma)                    # §2.4
    if not events:
        return display_only(F, p_req, f"tỉ trọng {w:.2f}, không có bước tăng")

    # cổng QUYẾT ĐỊNH cho từng sự kiện — hình dạng 4:1, không phải p_up
    p_star = p_star_event(sigma, inst, f_hat)
    # L6 — học máy CHỈ LỌC BỎ từng tranche
    kept = []
    for ev in events:
        p_win = calibrate(meta_model.predict(feats))                 # isotonic
        if p_win >= p_star + MARGIN_2PP:
            kept.append(ev)
    if not kept:
        return display_only(F, p_req, f"L6 loại {len(events)} tranche (p_win < {p_star:.2f}+2pp)")

    # L7 — định cỡ + veto (veto ép size=0, không bao giờ đảo hướng)
    sized = [sz for ev in kept if (sz := apply_vetoes(size_tranche(ev, sigma))) > 0]
    if not sized:
        return display_only(F, p_req, "veto rủi ro")

    return Prediction(..., trade_intent="LONG", tranches=sized,
                      p_required=p_req, silence_reason=None)
```

Ghi chú lắp ráp:
- `display_only(...)` luôn trả về đầy đủ F + `p_required` + `silence_reason` — im lặng **có số và tự giải thích** (`12 §6.3`).
- Trước khi L6 tồn tại (tuần 10–13), `meta_model.predict ≡ 1.0` — hệ chạy thuần rule, cổng `p_star` vẫn hoạt động (chặn khi σ̂ quá thấp khiến `c_R` phình).
- Kiểu `trade_intent` không chứa `"SHORT"` — loại ở tầng kiểu.

---

# PHẦN 6 · NGÂN SÁCH THAM SỐ · CỔNG · THỨ TỰ XÂY

## 6.1 · Đếm trung thực MỌI tham số tự do của tầng rule

| Tham số | Giá trị | Ai chọn | Tinh chỉnh được? |
|---|---|---|---|
| Lưới 9 giá trị {10,20,50}×{100,150,200}×{20,55,100} | đóng băng | công khai + `12 §2.5` | ❌ đóng băng, ADR-008 |
| 5 mức rời rạc tỉ trọng | quy ước | — | ❌ |
| SL · TP · hạn: 1,2σ̂ · 4,0σ̂ · 60 ngày | `10`, kiểm `12 §2.8` | thiết kế | ❌ ADR-009 |
| Biên cổng: +2pp | `10 §2/B` | thiết kế | ❌ |
| f̂: bán rã 7 ngày + biên kẹp | `13 §4.2` / dữ liệu | đo | ❌ |
| EXP_HOLD_DAYS = 6,3 | `12 §2.8` đo | đo | ❌ |
| R8: {14,21,28} · top 20% · tuần · LIQ_MIN | literature + config | thiết kế | ❌ trừ LIQ_MIN (config, sự thật môi trường) |
| **Tổng lựa-chọn-người: ~12 — tất cả đăng ký trước, KHÔNG tham số nào được tối ưu bằng dữ liệu** | | | |

Đối chiếu ngân sách `16 §4.1`: tầng rule dùng 0 tham số **khớp dữ liệu** (fitted). Toàn bộ ngân sách n_hiệu_dụng/20 để dành cho L6 (≤18 đặc trưng, depth 3, ≤300 cây).

## 6.2 · Cổng — hợp nhất các sửa đổi

| Cổng | Ngưỡng | Nguồn |
|---|---|---|
| **GATE 1a (tái lập)** | tỉ số sụt giảm ≤ 0,60 ở ≥80% số ô, mọi fold | `12 §6.6` — chỉ tiêu duy nhất trả lời được bằng 3 năm × 40 cặp (`15 §3.4`) |
| **GATE 1b (kinh tế)** | Sharpe tổ hợp ≥ Sharpe mua-và-giữ ở ≥6/8 fold | so tương đối, không hằng số |
| **Cổng trượt-giá-stop** | trượt thực đo của lệnh cắt lỗ < 1,4R | §1.2 — tại 1,5R biên chỉ còn 0,8 điểm |
| **Cổng R8 riêng** | §3.2 | đăng ký hôm nay, chấm sau mở khoá |
| Cổng L6 | precision +≥5pp so không-lọc; <+3pp ⇒ **xoá tầng** | `10 §2/C` |

## 6.3 · Thứ tự xây — không đổi so `12 §6.9`, thêm hai dòng

Ngày 1: cron funding + OI + ảnh chụp vũ trụ · **+ điều tra 2h tái tạo vũ trụ** → Tuần 1: R7 trọn (40 dòng, chặn mọi thứ sau) → Tuần 2–4: trọng tài + tiêm rò rỉ → 4–6: L1 (R5, R6 phần dựng được) → 6–8: σ̂ **+ f̂ cùng đợt** → 8–9: F + dải + ADR-002 hiển thị → 9–10: R4 tổ hợp + tranche + **bộ phép đo (thêm: trượt giá stop · tương quan E|move|↔funding toàn vũ trụ)** → điểm rẽ ngày ~70 → 10–13: L6 (chỉ khi qua cổng).

---

# PHẦN 7 · MỘT ĐOẠN

> Rule-base này không có tham số nào được khớp bằng dữ liệu, không có ngưỡng nào nằm trong tệp cấu hình, và không có quyết định nào mà học máy được quyền tạo ra — nó chỉ được quyền **từ chối**. Phương Pháp 7 cầm cửa vì nó là thứ duy nhất dự báo được cả hai vế; Phương Pháp 4 cầm hướng vì nó là thứ duy nhất có bằng chứng ngoại sinh sống sót qua phép đo — và nó được tin **vì cắt sụt giảm, không vì lợi nhuận**; Phương Pháp 8 đứng chờ sau một điều kiện dữ liệu đăng ký trước; Phương Pháp 6 và 5 co lại thành sáu phép tính tất định nuôi một bộ lọc chưa chắc được xây. Mỗi con số ở trên có một dòng nguồn gốc, và mỗi nguyên tắc có một test làm nó đỏ — vì bài học đắt nhất của sáu tài liệu trước là: **thứ không bị test chặn thì sẽ bị sửa vào cái đêm dashboard trống ba tuần.**

---

*Bản 0.9 — chờ phản biện đối kháng đa hướng trước khi nâng 1.0. Nguồn số: docs 11–16 + `scripts/measurements_2026_08_26/`.*
