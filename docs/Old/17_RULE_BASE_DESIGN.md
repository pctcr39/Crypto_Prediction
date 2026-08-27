# THIẾT KẾ RULE-BASE — LẮP RÁP TỪ PHƯƠNG PHÁP 4 · 7 · 8 · 6 · 5

> Phiên bản 1.0 · 27/08/2026 — **bản 0.9 đã qua phản biện đối kháng 8 mũi, 69 phát hiện (11 blocker · 38 major · 20 minor), tất cả blocker và major được giải quyết bên dưới**
> Đây là bản **thiết kế chi tiết** của tầng quy tắc trong module Prediction. Mọi hằng số có cột **nguồn gốc**; hằng số nào là ước lượng in-sample được **dán nhãn đúng như vậy** thay vì nguỵ trang thành "đăng ký trước".
> Quan hệ: `12 §6` (kiến trúc L0–L8) · `13` (hàm chi phí) · `14` (sổ đặc trưng) · `15` (lượng dữ liệu) · `16` (phương pháp) · `ADR-002` (khoá 1h/4h — đã vá theo §5.3).
> **Không phải lời khuyên đầu tư.**

---

# PHẦN 0 · TỔNG QUAN

## 0.1 · Vai trò từng phương pháp — ánh xạ R-tầng ↔ L-tầng

| Tầng quy tắc | Từ phương pháp | Tầng kiến trúc (`12 §6.2`) | Trạng thái |
|---|---|---|---|
| **R7 · Hàm chi phí + hai cổng** | Phương Pháp 7: Funding Rate & Cash-and-Carry Arbitrage | **L4** (+ f̂ ở L2) | ✅ Xây trước tiên |
| **R4 · Hướng sơ cấp: tổ hợp xu hướng + máy trạng thái tranche** | Phương Pháp 4: Position Trading & Trend Following (lối ra mượn cấu trúc Phương Pháp 3: Swing Trading) | **L5** | ✅ Tuần 8–10 |
| **R8 · Hướng thay thế: động lượng cắt ngang** | Phương Pháp 8: On-Chain & Narrative Trading (nhánh Narrative quy tắc hoá) | **L5 thay thế — HỢP ĐỒNG RIÊNG, không dùng tranche** | ⏳ Khoá chờ dữ liệu vũ trụ |
| **R6 · Đặc trưng dòng lệnh** | Phương Pháp 6: Order Flow | **L1**, tiêu thụ bởi L6 | 🔶 Chờ cron + cột dữ liệu |
| **R5 · Đặc trưng cấu trúc** | Phương Pháp 5: Smart Money Concepts (một đặc trưng sống sót) | **L1**, tiêu thụ bởi L6 | ✅ Dựng được ngay |

Không có tầng nào cho Phương Pháp 1, 2, 9 — bị loại bằng số học (`11`), chặn bằng mã (§5.3).

## 0.2 · Sơ đồ lắp ráp

```
nến đóng ──► L0 độ tươi ──► L1 đặc trưng (R5 · R6 tính ở đây)
                                │
                                ▼
                    L2 · σ̂ (HAR-RV, fallback EWMA λ=0,94) + f̂ (R7.1)
                                │
                                ▼
                    L3 · F = Normal(0, σ̂√H) trên log-return
                         q_α = last_close·exp(z_α·σ̂·√H) · p_up = 1−F(0) ≡ 0,50
                                │
                                ▼
                    L4 · R7.2 CỔNG PHÍ — p_required (hiển thị mọi khung)
                         + p*_event (cổng quyết định, hình dạng 4:1, CHỈ giao ngay)
                                │
                                ▼
                    L5 · R4 MÁY TRẠNG THÁI TRANCHE (hoặc R8 — hợp đồng riêng)
                                │
                                ▼
                    L6 · học máy CHỈ LỌC BỎ từng tranche (đặc trưng theo sổ `14 §3`)
                                ▼
                    L7 · định cỡ + VETO ──► L8 đối soát + bảng điểm
```

## 0.3 · Ba nguyên tắc chi phối

1. **Rule giữ những gì đã biết; học máy chỉ được thu hẹp tập hành động.** Fuzz-test được, ở mức TRANCHE (§6.5).
2. **Không chọn tham số bằng tối ưu; biến thể không phân biệt được thì tổ hợp.** Khi loại một tham số, không tạo tham số mới thay thế.
3. **Mọi ngưỡng quyết định nằm trong mã, có test làm nó đỏ.** Cấu hình chỉ giữ sự thật môi trường (biểu phí sàn). *(Bản 0.9 vi phạm chính nguyên tắc này ở hai chỗ — SUSPICIOUS_ACC và LIQ_MIN — phản biện bắt được, bản này sửa: cả hai vào mã, §5.3 và §3.1.)*

## 0.4 · Kết quả phản biện bản 0.9 — những gì đã đổi

| # | Phát hiện (blocker) | Sửa trong bản 1.0 |
|---|---|---|
| 1 | **Tranche không có quy tắc vào lại** — mô phỏng: hệ đứng ngoài 85–95% số ngày-có-tín-hiệu sau khi tranche chạm rào; cổng chứng nhận một chiến lược KHÁC chiến lược sẽ chạy (SOL CAGR 94%→17%) | **Quy tắc tái vũ trang** §2.4 + **GATE 1 phải chấm trên chính máy trạng thái sản xuất** §6.2 |
| 2 | **Lỗi thứ nguyên σ̂ ↔ E\|move\|** — 2,33%/1,71% là E\|move\|; σ̂ thật = 3,00%/2,43%; mọi số "kiểm số học" của 0.9 sai ~29%. *Đúng lớp lỗi 0,42/0,58 mà tài liệu tự cảnh báo — và tự mắc* | Toàn bộ §1.2 tính lại; hằng số tỉ lệ E\|move\|/σ̂ = **0,685 đo được** thay hệ số Gauss 0,798 |
| 3 | **`p_up = 1 − LogNormal.cdf(0) ≡ 1,0`** — lỗi giá đỡ phân phối | F = Normal trên log-return; `p_up ≡ 0,50` khi μ=0 — và đó là **đầu ra trung thực** §5.1 |
| 4 | **Hàng rào 1 không giết được panel 4h** — horizon config của 4h là 24 giờ ⇒ p_req ≈ 56–58% < ngưỡng 0,60 | Khoá bằng **danh sách trắng khung thời gian trong mã** §5.3; ngưỡng 0,60 chỉ là dây an toàn thứ hai. ADR-002 vá theo |
| 5 | **f̂ âm ⇒ chi phí perp âm không sàn ⇒ p* < 0** — cổng mở toang đúng kịch bản SOL/FTX | Sàn chi phí cổng `max(·, 0,20%)` + công cụ tranche **khoá cứng giao ngay** §1.2 |
| 6 | **Mâu thuẫn "giao ngay không ngoại lệ" ↔ `choose_instrument` trả perp** | `choose_instrument` hạ cấp thành hàm HIỂN THỊ; mọi tranche `instrument=="spot"`, có test §2.3 |
| 7 | **Trạng thái tranche vô gia cư** — `prev_state` không có trong chữ ký, không persist, không thủ tục khôi phục | Chữ ký `predict(bars, funding, book, cfg) → (Prediction, book′)` + sổ tranche persist + thủ tục khởi động §5.2 |
| 8 | **"Đăng ký trước" thực chất là chốt-sau-khi-nhìn** BTC 2021–2026 — đúng giai đoạn GATE 1 sẽ chấm | Dán nhãn lại trung thực + **giao thức khử nhiễm** §6.2: 4 đồng hiệu chuẩn bị loại khỏi thống kê đạt/trượt |
| 9 | **R8 suy biến thành rổ ngoại tệ/vàng** — ảnh chụp thật chứa EUR/XAUT/PAXG/RLUSD + cổ phiếu token hoá; 33,9% số tuần cả rổ động lượng âm; trọng số 1/σ̂ dồn 71% vào EUR | Bộ lọc lớp tài sản + quy tắc tiền mặt + trọng số đều §3.1 |
| 10 | **R8 không dùng được hợp đồng tranche của L5** — giữ-tới-kỳ-sau ≠ rào chắn 4:1 | R8 có **hợp đồng riêng** §3.3, không meta-label ở v1 |
| 11 | **SUSPICIOUS_ACC**: ngưỡng quyết định không giá trị, không nguồn, sống trong config | = 0,60 cứng trong mã, nguồn RULE 11, vào bảng §6.1 |

Ngoài ra 38 major (nhãn kiểm duyệt LIFO, đặc tả cỡ lệnh, ngân sách im lặng đo lại, phí R8 theo turnover, diff cấu hình, RULE 4/6/10, bảng tham số đếm lại 26, cơ chế canh rào…) và 20 minor — tất cả tích hợp bên dưới, mỗi cái ghi tại chỗ.

---

# PHẦN 1 · R7 — TẦNG CHI PHÍ (Phương Pháp 7)

## 1.1 · R7.1 — Dự báo funding `f̂`

```python
def forecast_funding_daily(hist_8h: pd.Series, *, asof: Timestamp) -> float:
    """Funding %/ngày dự báo. OOS R² 0,437–0,514 (13 §4.2) — đo trên dự báo viên
    CÓ DỊCH MỘT KỲ, nên tiền điều kiện bắt buộc: hist_8h chỉ gồm các kỳ ĐÃ CHỐT
    trước `asof`. Test rò rỉ: đưa một kỳ tương lai vào ⇒ phải đỏ."""
    hist = hist_8h[hist_8h.index < asof]
    daily = hist.resample("1D").sum() / hist.resample("1D").count() * 3
    daily = daily[hist.resample("1D").count() >= 3]        # loại bin chưa đủ 3 kỳ
    f_hat = daily.ewm(halflife=7).mean().iloc[-1] * 100    # %/ngày
    return clamp(f_hat, -1.40, +1.40)
```

| Hằng số | Giá trị | Nguồn gốc — tái lập được |
|---|---|---|
| Chu kỳ bán rã | 7 ngày | `13 §4.2`; naive trên SOL chỉ R² 0,010 ⇒ làm mượt bắt buộc |
| Biên kẹp | **±1,40%/ngày** | `max(p99 ngày × 3)` trên 4 cặp = 1,36 (DOGE), làm tròn lên. *(0.9 ghi +1,5 "từ p99×3" — phản biện chứng minh không tái lập; sàn −0,5 thì cắt đúng đợt SOL 11/2022 với f̂ thực −0,78 — bỏ sàn hẹp, kẹp đối xứng theo max quan sát)* |
| **Thiếu dữ liệu funding** | `f̂ = p95 EXPANDING tới t` của symbol (thiếu nốt: p95 BTC = 0,138%/ngày) | `13 §9`; expanding — không dùng phân vị toàn mẫu trong backtest |
| Staleness | chuỗi funding cũ hơn 24 giờ ⇒ coi như thiếu | ma trận hỏng §6.6 |

## 1.2 · R7.2 — Hàm chi phí và HAI cổng

Ngưỡng hoà vốn phụ thuộc **hình dạng cược** — hệ có hai hình dạng nên có hai công thức, hai kiểu dữ liệu, không so sánh chéo được.

```python
ABS_MOVE_RATIO = 0.685     # E|move|/σ̂ ĐO ĐƯỢC trên BTC ngày (2,06/3,00) — KHÔNG dùng
                           # hệ số Gauss √(2/π)=0,798: đuôi dày làm nó phóng đại ~16%

def cost_pct(H_days, instrument, f_daily) -> float:
    if instrument == "spot": return 0.30            # taker 0,10×2 + trượt 0,05×2
    return 0.20 + f_daily * H_days                  # perp — CHỈ để hiển thị/kế hoạch

def cost_gate(H_days, instrument, f_daily) -> float:
    """Chi phí dùng cho CỔNG: funding âm là thu nhập nhưng KHÔNG BAO GIỜ được
    hạ ngưỡng quyết định dưới mức phí giao dịch thuần."""
    return max(cost_pct(H_days, instrument, max(f_daily, 0.0)), 0.20)

# ── CỔNG HIỂN THỊ — cược đối xứng 1:1, in trên MỌI panel ──
def p_required_symmetric(sigma_d, H_days, instrument, f_daily) -> PReq:
    e_move = sigma_d * ABS_MOVE_RATIO * sqrt(H_days) * 100
    return PReq(0.5 + cost_gate(H_days, instrument, f_daily) / (2 * e_move))

# ── CỔNG QUYẾT ĐỊNH — sự kiện rào chắn 4:1, GIAO NGAY (spot: chi phí không
#    phụ thuộc thời gian giữ ⇒ KHÔNG cần tham số exp_hold — 0.9 thừa tham số này) ──
def p_star_event(sigma_d, sl_mult=1.2, tp_mult=4.0) -> PStar:
    c_R = 0.30 / (sl_mult * sigma_d * 100)          # sigma_d là PHÂN SỐ (vd 0.030)
    return PStar((1 + c_R) / (tp_mult + 1))
```

**Kiểm số học — tính lại toàn bộ sau phản biện** (σ̂ là độ lệch chuẩn log-return ngày, **đo được**: BTC 2021–26 = 3,00% · chế độ vol thấp 2023–26 = 2,43% — `12 §2.8`):

```
σ̂ = 3,00%:  c_R = 0,30/3,60 = 0,083  ⇒  p* = 25,0%   [sửa: mẫu số tp/sl+1 = 4,333]
> ⚠️ **SỬA 27/08/2026 — xem `docs/adr/013-sua-loi-thu-nguyen-payoff.md`.** Toàn bộ khối §1.2 kế thừa lỗi thứ nguyên: mẫu số phải là `tp_mult/sl_mult + 1 = 4,333`, không phải `tp_mult + 1 = 5`. Số đúng: **25,0% / 25,5%** (dao động 0,5 điểm — kết luận bất biến-theo-chế-độ vẫn đứng). Hoà vốn trượt giá: **1,57R**, không phải 1,60R.

σ̂ = 2,43%:  c_R = 0,30/2,92 = 0,103  ⇒  p* = 25,5%   [sửa]
              dao động giữa hai chế độ:      0,4 điểm
Đối chiếu cược đối xứng GIAO NGAY cùng hai chế độ (10 §1.1): 56,4% → 58,8% = 2,4 điểm
```

> **Hình dạng 4:1 làm ngưỡng hoà vốn gần bất biến theo chế độ** (0,4 so với 2,4 điểm) — kết luận của 0.9 **sống sót qua sửa thứ nguyên**, và các con số đúng còn làm nó mạnh hơn. *(0.9 trích nhầm cột perp 54,3→55,8 — đã sửa thành cột spot.)*

**Sức chịu trượt giá của lệnh cắt lỗ** — tính lại, và sửa một phát biểu sai của 0.9:

```
Lỗ thực nhận 1,0R:  p* = 25,0%     biên so 33,7% đo được:  +8,7 điểm   [sửa ADR-013]
Lỗ thực nhận 1,5R:  p* = (1,5+0,083)/4,833 = 32,8%        +0,9 điểm   [sửa ADR-013]
HOÀ VỐN tại tỉ lệ thắng 33,7% (số đã sửa off-by-one):  m = (0,337×3,333−0,083)/0,663 = 1,57R
```

⇒ Cổng trượt-giá-stop (§6.2): **cảnh báo tại 1,3R · chặn tại 1,4R** — 1,4R là ngưỡng **thận trọng** (biên còn ~2 điểm, về ~0 sau biên +2pp), *không phải* điểm kỳ vọng âm; kỳ vọng chỉ âm từ ~1,6R. *(0.9 viết "≥1,4R ⇒ kỳ vọng âm" — sai theo chính số học của nó.)*

**`choose_instrument` hạ cấp thành hàm hiển thị.** Nó vẫn tính ngưỡng `d > 0,10/f̂` cho bảng chi phí trên dashboard (`10 mandate 1`: spot-hay-perp là đầu ra của bảng), nhưng **không nằm trên đường quyết định**: mọi tranche R4 khoá `instrument="spot"` tại entry (§2.3).

## 1.3 · R7.3 — Hai đặc trưng funding cho L6

`funding_z96` (cụm 13) · `funding_level_pct` (cụm 6) — chiều **tiếp diễn** (`09 §2` · `13 §6.1`). Cửa sổ z = 96 kỳ: vào bảng tham số §6.1. Không cần veto funding riêng — funding nóng tự đẩy `cost_gate` (hiển thị) và đẩy chế độ vào vùng σ̂ cao nơi cổng tự siết.

## 1.4 · Bất biến R7 — mỗi cái một test

| Bất biến | Test |
|---|---|
| Sàn perp `p_required ≥ 0,5 + √(c₀·f)/A` | **chỉ trên miền f̂ > 0**; quét d ∈ [0,25; 90] |
| Miền f̂ ≤ 0 | `cost_gate ≥ 0,20` và `p_star_event > 0` với **mọi** f̂ ∈ [−1,40; +1,40] — ca test tại đúng biên kẹp âm *(0.9 sập ca này: p* = −0,011)* |
| Chọn công cụ là hàm | f̂ = 0,0292 ⇒ ngưỡng 3,4 ngày; f̂ = 0,0496 ⇒ 2,0 ngày |
| Thiếu funding ⇒ giả định xấu | cắt chuỗi ⇒ f̂ **tăng** lên p95-expanding |
| Rò rỉ funding | đưa kỳ funding tương lai vào `hist_8h` ⇒ đỏ |
| Hai cổng hai kiểu | `PReq` và `PStar` là hai kiểu; so sánh chéo không biên dịch/chạy được |
| Hằng số tỉ lệ | pin `ABS_MOVE_RATIO` bằng phép đo lại E\|move\|/σ̂ trong test (0,685 ± 0,02) |

---

# PHẦN 2 · R4 — HƯỚNG SƠ CẤP: TỔ HỢP XU HƯỚNG + MÁY TRẠNG THÁI TRANCHE

## 2.1 · Tín hiệu một ô

```python
def cell_signal(bars, ef, es, dn) -> {0, 1}:
    # QUY ƯỚC CHỈ SỐ (duy nhất, toàn tài liệu): "high N nến trước t" nghĩa là
    # rolling(N).max().shift(1) — BAO GỒM nến t−1, KHÔNG bao gồm nến t.
    vao = close[t] > EMA(close, es)[t]  và  close[t] > rolling_max(high, dn).shift(1)[t]
    ra  = close[t] < EMA(close, ef)[t]
    # máy trạng thái 0 ⇄ 1, không có trạng thái bán khống
```

Lưới **đóng băng**: `{10,20,50} × {100,150,200} × {20,55,100}` = 27 ô, hash của lưới pin trong test.

> ⚠️ **Nhãn trung thực (sửa theo phản biện):** lưới, quyết định tổ hợp, k=1 đều được chốt **sau khi nhìn** BTC/ETH/SOL/DOGE 2021–2026. Chúng "đóng băng kể từ hôm nay", không phải "đăng ký trước khi thấy dữ liệu". Hệ quả nằm ở giao thức chấm GATE 1 — §6.2.

## 2.2 · Tổ hợp — không chọn ô

```python
w_raw = mean(cell_signal(bars, *cell) for cell in GRID_27)
w     = round_to(w_raw, {0, 0.25, 0.50, 0.75, 1.00})
```

| Quyết định | Nguồn gốc — cập nhật theo phép đo của phản biện |
|---|---|
| Tổ hợp thay chọn | tương quan hạng +0,19; tỉ số sụt giảm 0,29/0,29/0,31 (`12 §6.5`) — *lưu ý: số Đoạn 2 nhiễm artifact khởi động EMA (đoạn bị cắt trước khi tính EMA dài); phải tính tín hiệu trên chuỗi đầy đủ rồi mới cắt đoạn khi đo lại* |
| **5 mức rời rạc** | Lý do thật (sửa 0.9): làm SỰ KIỆN **đếm được và gán nhãn được** — phản biện đo turnover rời rạc ≈ liên tục (8,0 vs 8,1 đơn-vị-w/năm), nó **không** giảm phí |
| Không hysteresis | Phản biện đo flapping: 0,8–1,8 cặp đảo/năm, phí 0,09–0,18%/năm — nhỏ, **quyết định khoá cứng đứng vững bằng số** |
| Trọng số đều 27 ô | mọi trọng số khác là tham số mới |

## 2.3 · Công cụ và khớp lệnh

- **`instrument = "spot"` khoá cứng tại entry của mọi tranche**, ghi vào sổ tranche. Test: mọi sự kiện sinh ra có `instrument == "spot"`. *(Giữ ~6 ngày > ngưỡng đổi công cụ 2,0–3,4 ngày; xoá mâu thuẫn của 0.9 với `choose_instrument`.)*
- Tín hiệu tại close ngày t (00:00 UTC) · backtest khớp **open t+1** · thực thi thật TWAP 00:15–00:45 UTC. **Chênh open↔TWAP chưa đo** — vào bộ phép đo tuần 9–10; chữ "thận trọng" của 0.9 bị xoá vì chưa chứng minh.

## 2.4 · Máy trạng thái TRANCHE — đặc tả đầy đủ (viết lại sau blocker #1)

```
TRẠNG THÁI (persist — §5.2):  danh sách tranche mở, mỗi cái:
    {id, symbol, level ∈ {0.25,0.5,0.75,1.0}, entry_price, entry_time,
     sigma_entry, sl_price, tp_price, deadline, size_pct, instrument="spot",
     stop_order_id}                     ← id lệnh stop ĐANG TREO trên sàn

SỰ KIỆN MỞ  = mỗi bước 0,25 mà w vượt LÊN và slot đó đang TRỐNG
    · bước nhảy k mức trong một nến ⇒ k SỰ KIỆN RIÊNG (cùng entry, cùng σ̂)
    · SL = entry×(1 − 1,2·σ̂)   TP = entry×(1 + 4,0·σ̂)   hạn = 60 ngày   (σ̂ NGÀY, k=1)

★ TÁI VŨ TRANG (sửa blocker #1 — quy tắc KHÔNG tham số):
    khi một tranche thoát bằng SL/TP/hạn, slot của nó thành TRỐNG ngay;
    tại close kế tiếp, nếu w vẫn ≥ mức slot ⇒ SỰ KIỆN MỚI (entry mới, σ̂ mới, rào mới).
    Không cooldown — cooldown là tham số mới. Chi phí whipsaw của quy tắc này
    là thuộc tính ĐO ĐƯỢC của chiến lược, và GATE 1 chấm trên chính nó (§6.2).

SỰ KIỆN ĐÓNG:
    · chạm SL — canh bằng LỆNH STOP-LIMIT TREO TRÊN SÀN từ lúc mở (không phải
      kiểm tại close: nến −3σ̂ qua đêm sẽ phá vỡ giả định lỗ 1,0R mà biên chỉ
      chịu được tới 1,4R). TP và hạn kiểm tại close. Backtest soi INTRABAR
      (high/low) khớp cơ chế này.
    · cùng nến chạm cả hai rào ⇒ tính SL trước (thận trọng, khớp backtest)
    · w bước XUỐNG ⇒ đóng theo LIFO. LIFO là lựa-chọn-1-trong-3 ảnh hưởng P&L
      ⇒ vào bảng §6.1, kèm phép đo đối chứng LIFO/FIFO tuần 9–10
    · veto L7

NHÃN CHO L6 (sửa major "kiểm duyệt"):
    · chạm TP trước SL = 1 · chạm SL trước = 0
    · thoát bằng LIFO hoặc hạn = RIGHT-CENSORING: nhãn = dấu(lợi suất thực nhận
      sau phí), trọng số mẫu × (thời gian sống / thời gian sống trung vị)
    · CẤM nhãn phản thực "nếu để nguyên thì chạm gì" — dùng dữ liệu sau thời
      điểm thoát, là rò rỉ đúng nghĩa RULE 2
    · Quy mô hiện tượng (phản biện đo): LIFO-thoát = 16% tổng tranche (BTC 28%,
      ETH 14% — trong đó 56% số tranche ETH bị LIFO lẽ ra chạm TP)
```

**Cỡ lệnh** (sửa major "size_base không định nghĩa" — sizing theo rủi-ro-cố-định bị **từ chối**: nghịch đảo σ̂ phá trần khi vol thấp, notional một tranche lên 32–55% vốn):

```
size_base(coin)   = 4% NAV theo NOTIONAL
một tranche 0,25  = 1% NAV            ← đúng trần "≤1% mỗi lệnh"
mọi bước nhảy đa mức tách thành lệnh 1% NAV riêng
Σ notional một coin ≤ 4% NAV (bất biến sum ≤ w×size_base, LIFO bảo toàn)
Trần danh mục:  L7 áp hệ số toàn cục = min(1, CAP/Σ notional) — CAP thuộc hệ GATE
                (GATE 4 tiền thật: 5%). Rủi-ro-tại-SL một tranche = 1%×1,2σ̂ ≈ 0,04% NAV
```

## 2.5 · Ngân sách im lặng — ĐO LẠI theo phản biện, ba con số có tên riêng

| Con số (dashboard in đúng tên này) | Giá trị đăng ký | Nguồn |
|---|---|---|
| **Tranche-mở /đồng/năm** ← số in to nhất | **~9** (BTC đo 9,4) + phần tái-vũ-trang (đo ở GATE 1, chưa có số) | mô phỏng phản biện trên máy trạng thái |
| Thay-đổi-tỉ-trọng /đồng/năm | **17–24** (đo: BTC 21,8 · ETH 20,5 · SOL 17,1 · DOGE 18,2) — *0.9 ghi 8–20, không nguồn, và đã bị chính phép đo vượt* | mô phỏng phản biện |
| Lệnh-ô-đơn /đồng/năm (tham chiếu) | 3,5 | `15 §1.5` |
| Trần phát khung 1h · 4h | **= 0, tuyệt đối** — một lần phát bất kỳ ⇒ test đỏ *(0.9 chép 2%/8% từ `10` viết trước ADR-002 — mâu thuẫn, đã sửa)* | §5.3 |
| Trần phát khung 1d | > 2× kỳ vọng tranche-mở ⇒ cảnh báo (không dùng % số nến) | |

## 2.6 · Điều R4 hứa và không hứa — không đổi so 0.9

Hứa: tỉ số sụt giảm (54/54 tái lập) · sống sót chuỗi thua 8 lệnh (5,8% — trong thiết kế). Không hứa: Sharpe vượt mua-và-giữ · tỉ lệ thắng chứng minh được (34 năm). **Nhưng (blocker #1): mọi lời hứa chỉ có nghĩa sau khi đo lại trên chính máy trạng thái tranche** — số 0,29–0,39 hiện hành là số của chiến-lược-w, dùng làm tham chiếu, không phải số của cổng.

---

# PHẦN 3 · R8 — ĐỘNG LƯỢNG CẮT NGANG (hợp đồng riêng, khoá chờ dữ liệu)

## 3.1 · Đặc tả — viết lại sau blocker #9

```python
# MỖI THỨ HAI 00:00 UTC (khớp TWAP 00:15–00:45)
def cross_sectional_targets(snapshot, bars) -> dict[str, float]:
    # ① vũ trụ CỦA ĐÚNG KỲ: ảnh chụp gần nhất TRƯỚC thứ Hai tuần T (as-of tường minh)
    # ② BỘ LỌC LỚP TÀI SẢN (sửa blocker: ảnh chụp thật 2026-08 có EUR hạng cao,
    #    XAUT/PAXG/RLUSD và 3 cổ phiếu token hoá trong top-40):
    #    loại: neo pháp định (EUR…) · vàng/hàng hoá (XAUT, PAXG) · stablecoin mọi loại
    #    (RLUSD…) · cổ phiếu token hoá · đòn bẩy — mở rộng exclude của symbols.yaml
    # ③ thanh khoản: TOP-40 THEO HẠNG trung vị quote-volume [t−30, t−1]
    #    (thay ngưỡng tuyệt đối LIQ_MIN — ngưỡng là quyết định trá hình trong config:
    #     5M cho lọt 422/477 cặp, đổi nó đổi mẫu số của "top 20%")
    # ④ xếp hạng: trung bình hạng của ret(s,w,skip) = close[t−7]/close[t−7−w] − 1,
    #    w ∈ {14, 21, 28}  (định nghĩa tường minh — 0.9 để mơ hồ)
    # ⑤ ĐỘNG LƯỢNG TUYỆT ĐỐI: chỉ giữ đồng có ret trung bình > 0.
    #    KHÔNG đồng nào dương ⇒ TIỀN MẶT (sửa blocker: 33,9% số tuần cả rổ âm —
    #    long-only mà không có cửa tiền mặt sẽ mua "đồng đỡ tệ nhất" trong sập)
    # ⑥ MUA nhóm 20% hạng đầu còn lại, TRỌNG SỐ ĐỀU
    #    (0.9 dùng 1/σ̂ — không nguồn: Liu–Tsyvinski–Wu dùng value-weighted, trích dẫn
    #     "B4" là khẳng định đã bị repo bác; 1/σ̂ còn dồn 71% rổ vào EUR. Trọng số đều
    #     = quy ước 0 tham số, khai báo là LỆCH so với value-weighted của nguồn)
```

## 3.2 · Kinh tế phí và điều kiện mở khoá — siết theo phản biện

| Mục | Bản 1.0 |
|---|---|
| Phí nền nếu thay toàn rổ | **15,6%/năm** (RULE 5: taker + trượt; 0.9 ghi 10,4% taker-only) |
| Turnover đăng ký trước | **20–40%/tuần** (mô phỏng phản biện: 23,4%) ⇒ phí thực ~3–6%/năm; backtest đo ngoài dải ⇒ điều tra trước khi tin |
| Mở khoá (a) | ≥12 ảnh chụp tháng thật |
| Mở khoá (b) — siết | mã tái tạo viết + **hash trước**, đối chiếu **mù với ≥3 ảnh chụp** (sớm nhất 2026-11), khớp ≥95% thành phần, **và tái hiện được các vụ huỷ niêm yết đã biết** |
| Cổng riêng | tỉ số sụt giảm ≤ 0,60 so DCA-hold Bitcoin VÀ so rổ-40-đều, purged walk-forward — **không kỳ vọng 4,2%/tuần của nguồn** (biến thể long-only quintile yếu hơn nhiều long-short deciles) |

## 3.3 · Hợp đồng riêng của R8 (sửa blocker #10)

R8 **không dùng** khung tranche: sự kiện = "đồng VÀO rổ", thoát = rớt khỏi top-20% / quy tắc tiền mặt / veto L7. **Không meta-label L6 ở v1** — nhãn giữ-tới-rớt-hạng sẽ được định nghĩa nếu và chỉ nếu R8 qua cổng riêng và có ≥2 năm sự kiện thật. R8 **thay thế** R4 tại L5 (theo cây quyết định `11 §6.3`), không bao giờ trộn.

---

# PHẦN 4 · R5 + R6 — ĐẶC TRƯNG, HOÀ GIẢI VỚI SỔ ĐĂNG KÝ `14`

**L6 dùng bộ 13 suất chính thức của `14 §3.1` + 5 suất chờ của `14 §3.2`** — tài liệu này KHÔNG định nghĩa ngân sách riêng (0.9 tạo mâu thuẫn "9 suất/≤18/13 chiều" — phản biện bắt). Phần dưới chỉ đặc tả các suất thuộc R5/R6/R7:

| Suất trong sổ `14` | Công thức (mọi thứ qua `shift_all(1)`) | Cửa sổ (vào §6.1) | Trạng thái |
|---|---|---|---|
| `taker_buy_ratio_z` | `z(taker_buy/vol)` | z: 96 | 📡 cột G3 |
| `cvd_slope_24` | `slope(cumsum(2·taker_buy − vol))/mean(vol)` | 24 | 📡 |
| `oi_price_div` | `sign(Δclose)·sign(ΔOI)` | 24 | 📡 **cron OI — mất vĩnh viễn** |
| `volume_z96` | `z(vol)` | 96 | ✅ cụm 3 |
| `funding_z96` · `funding_level_pct` | §1.3 | 96 | ✅ cụm 13 · 6 |
| `dist_to_prior_swing_sigma` | `(close − rolling_max(high,20).shift(1)) / (σ̂·close)` | 20 | ✅ cụm 1 |
| *(chờ, chưa đo cụm)* `cvd_divergence_spot_perp` · `cascade_recency_bars` | — | — | 📡 phải qua đo trùng lặp trước khi chiếm suất |

**Khi mẻ 40 cặp về: chạy lại `feature_clusters` trên ≥3 altcoin trước khi chốt suất** (`14 §5` quy tắc 2 — 0.9 làm rơi, đã khôi phục). Hàng rào cấm 11 định danh giữ nguyên, test quét `src/`.

---

# PHẦN 5 · HÀM QUYẾT ĐỊNH + TRẠNG THÁI + HỢP ĐỒNG

## 5.1 · predict — chữ ký mới (sửa blocker #7)

```python
TRADE_TF   = frozenset({"1d"})      # Hàng rào 1 — danh sách trắng, CỨNG TRONG MÃ
RULE11_ACC = 0.60                   # dây an toàn thứ hai — nguồn: RULE 11 (0.9 để
                                    # SUSPICIOUS_ACC không giá trị trong config)
H_DAYS     = {"1h": 4/24, "4h": 1.0, "1d": 1.0}   # từ config horizon_bars — tường minh

def predict(bars, funding_hist, book: TrancheBook, cfg) -> tuple[Prediction, TrancheBook]:
    """Hàm thuần THẬT: mọi trạng thái vào-ra qua tham số; hằng số qua cfg/module-const;
    gọi hai lần cùng đầu vào ⇒ hai kết quả giống hệt từng byte."""
    fresh = freshness(bars, cfg)
    if fresh in ("delayed", "disconnected"):
        return no_opinion(fresh, "dữ liệu không đủ tươi"), book

    feats = build_features(bars)
    sigma = har_rv(feats) or ewma_sigma(feats, lam=0.94)
    f_hat = forecast_funding_daily(funding_hist, asof=bars.close_time)

    H = H_DAYS[cfg.tf]
    F = Normal(mu=0.0, sd=sigma * sqrt(H))                 # log-return; VR≈1 ⇒ mu=0
    q10, q50, q90 = (last_close * exp(F.ppf(a)) for a in (0.10, 0.50, 0.90))
    p_up = 1 - F.cdf(0.0)                                  # ≡ 0,50 khi mu=0 — TRUNG THỰC:
                                                           # hệ không có ý kiến hướng ở tầng
                                                           # phân phối; trạng thái xu hướng
                                                           # hiển thị bằng đồng hồ w, không
                                                           # phải bằng một xác suất bịa
    p_req = p_required_symmetric(sigma, H, "spot", f_hat)  # hiển thị mọi panel

    if cfg.tf not in TRADE_TF or p_req.value > RULE11_ACC:  # rào kép
        return display_only(F, p_req, w=None, reason="khung hiển thị (ADR-002)"), book

    w = ensemble_weight(bars, GRID_27)
    events, book2 = tranche_step(w, book, sigma, last_close)   # §2.4: mở/tái-vũ-trang/LIFO
    if not events:
        return display_only(F, p_req, w, f"w={w:.2f}, không có slot mở"), book2

    p_star = p_star_event(sigma)
    kept = [ev for ev in events
            if calibrate(meta.predict(feats, ev)) >= p_star.value + 0.02]
            # isotonic: fit trên tập validation TÁCH RIÊNG trong từng fold purged
            # walk-forward, GỘP TOÀN VŨ TRỤ (sự kiện/đồng không đủ hiệu chỉnh riêng);
            # điều kiện tối thiểu ≥300 sự kiện trước khi L6 được bật (RULE 6)
    ...
    return Prediction(..., tranches=tuple(sized), p_required=p_req.value,
                      silence_reason=None), book3
```

## 5.2 · Sổ tranche — persist và khôi phục (sửa blocker #7)

| Mục | Đặc tả |
|---|---|
| Lưu | SQLite/Parquet, khoá idempotent `symbol|open_time|level|model_sha`, ghi **trước** khi đặt lệnh |
| Khởi động | đọc sổ → đối soát sàn: **mỗi tranche mở ↔ đúng một lệnh stop đang treo** (`stop_order_id`) |
| Tranche mồ côi (có vị thế, mất sổ / có sổ, mất stop) | vào hàng chờ veto-đóng + cảnh báo; **không bao giờ tự tạo lại rào từ trí nhớ** |
| Vòng đối soát 5 phút (GATE 4) | mở rộng: số dư **và** bất biến một-tranche-một-stop |

## 5.3 · Hàng rào 1 vá lại + vá ADR-002

Ngưỡng kinh tế 0,60 **không giết được panel 4h** vì horizon config của 4h là 24 giờ (p_req ≈ 56–58%) — phản biện bắt bằng chính số của tài liệu. Rào thật là **danh sách trắng `TRADE_TF` trong mã**; 0,60 chỉ là dây an toàn khi ai đó thêm khung mới vào danh sách trắng mà quên tính phí. ADR-002 §4 được vá tương ứng. Test: ép phát ở "1h"/"4h" ⇒ đỏ, không cờ nào bật được.

## 5.4 · Sửa đổi hợp đồng dữ liệu (so `12 §6.3`) — cần ADR

```python
@dataclass(frozen=True)
class Tranche:
    level: float; entry_price: float; sigma_entry: float
    sl_price: float; tp_price: float; deadline: datetime
    size_pct: float; instrument: Literal["spot"]          # không có giá trị khác

@dataclass(frozen=True)
class Prediction:
    ...như 12 §6.3, thêm/đổi:
    tranches: tuple[Tranche, ...] = ()      # thay size_pct/stop_price/target_price số ít
    trade_intent: Optional[Literal["LONG"]] # không SHORT ở tầng kiểu
```

**GATE 4 cần ADR-011**: ba mục lỗi thời mâu thuẫn thiết kế tranche — stop "1,5×ATR14" (nay: 1,2σ̂ tại entry) · "hết horizon 4 nến 1h" (nay: hạn 60 ngày) · "dự đoán KHÔNG RÕ ⇒ đóng vị thế" (dưới máy tranche, ngày-không-sự-kiện là bình thường; đóng theo mặt chữ = đóng toàn danh mục gần như mỗi ngày).

---

# PHẦN 6 · THAM SỐ · CỔNG · CẤU HÌNH · TEST · VẬN HÀNH

## 6.1 · Bảng tham số ĐẾM LẠI — 26, hai cột (0.9 tự nhận ~12, phản biện đếm 24–28)

**Cột A — ảnh hưởng kết quả backtest** (17):

| Tham số | Giá trị | Nhãn trung thực |
|---|---|---|
| Lưới 9 giá trị · tổ hợp · 5 mức · trọng số đều | — | đóng băng **sau khi nhìn** 4 đồng 2021–26 |
| SL 1,2σ̂ · TP 4,0σ̂ · hạn 60 · k=1 | — | như trên; k=1 có bằng chứng 0/23 hết hạn nhưng đo trên **ô tốt nhất in-sample, n=23, một đồng** — đo lại trên tổ hợp ở GATE 1 |
| LIFO | 1-trong-3 | lựa chọn thiết kế; phép đo đối chứng LIFO/FIFO tuần 9–10 |
| Biên cổng +2pp · RULE11_ACC 0,60 | mã | `10 §2/B` · RULE 11 |
| ABS_MOVE_RATIO 0,685 | đo | pin bằng test |
| f̂: bán rã 7 · kẹp ±1,40 · p95-expanding | đo/suy | `13 §4.2` · max p99×3 = 1,36 |
| λ = 0,94 (fallback σ̂) | quy ước RiskMetrics 1996 | không tinh chỉnh; HAR-RV là **mô hình khớp dữ liệu có kiểm định riêng** — tuyên bố "0 tham số khớp" chỉ áp cho **tầng quyết định** |
| R8: {14,21,28} · skip 7 · top 20% · top-40 hạng · trung vị 30 ngày · trọng số đều · tuần | — | đăng ký hôm nay, trước khi có dữ liệu chấm — R8 là bộ hằng số **sạch nhất** vì chưa nhìn thấy kết quả nào |
| Cửa sổ đặc trưng: z 96 · slope 24 · swing 20 | — | quy ước đăng ký trước, chưa đo độ nhạy |

**Cột B — vận hành, không chạm kết quả** (9): size_base 4% NAV · tranche 1% NAV · TWAP 00:15–00:45 · ngưỡng freshness · staleness funding 24h · mốc thứ Hai của R8 · H_DAYS theo config · CAP danh mục (thuộc hệ GATE) · biên isotonic ≥300 sự kiện.

## 6.2 · Cổng — với giao thức khử nhiễm (sửa blocker #8)

| Cổng | Ngưỡng | Giao thức |
|---|---|---|
| **GATE 1a** | tỉ số sụt giảm ≤ 0,60 ở ≥80% số ô, mọi fold | **Chấm trên CHÍNH máy trạng thái tranche sản xuất** (một mã, hai chế độ chạy) — không phải trên chiến-lược-w của `ens.py` |
| **GATE 1b** | Sharpe tổ hợp ≥ mua-và-giữ ở ≥6/8 fold | như trên |
| **Khử nhiễm** | — | Thống kê đạt/trượt tính trên **36 cặp KHÔNG thuộc nhóm hiệu chuẩn** (BTC/ETH/SOL/DOGE báo cáo riêng) · 6 tháng cuối không chạm (config có sẵn) · dữ liệu sau 2026-08 là sạch tuyệt đối · trượt thì **không** được chỉnh lưới/k/tỉ lệ rào |
| **RULE 4** | R4 tổ hợp chấm cạnh **đủ 7 baseline** (`10` tuần 9–10; always-up dùng 49,6% từ 2022) — chỉ tiêu: tỉ số sụt giảm + Sharpe tương đối | trước điểm rẽ ngày ~70 |
| **RULE 10** | mọi phép đo chặn cửa + mọi lần train L6 (kể cả thử tay) ghi MLflow; DSR tính theo số trial thật từ MLflow | |
| Cổng trượt-giá-stop | cảnh báo 1,3R · chặn 1,4R (hoà vốn 1,6R) | **Phương pháp đo đăng ký** (0.9 thiếu): ① cron chụp sổ lệnh top-20 mức (spread+độ sâu) cho vũ trụ giao dịch từ ngày 1 ② ước lượng bằng mô phỏng ăn-độ-sâu trên các nến σ̂ ≥ p95 ③ đo lại bằng lệnh shadow/testnet tại GATE 3 |
| Cổng L6 | precision +≥5pp; <+3pp ⇒ xoá tầng | `10 §2/C` |
| Cổng R8 | §3.2 | sau mở khoá |

## 6.3 · Diff cấu hình — phần 0.9 thiếu hẳn

| Tệp | Thay đổi |
|---|---|
| `config/model.yaml` | **Xoá** `decision.p_up_threshold`/`p_down_threshold` (thay: TRADE_TF + p_required trong mã) · **xoá** khối `quantile` (ADR-004) · `classifier` → khối `meta_label` (depth 3 · ≤15 lá · ≤300 cây · ≤18 đặc trưng) · `drop_flat_from_train: false` · `tuning.n_trials: 20` · `baselines` += `tsmom_grid_median`, `dca_hold`, `naive_rw` · `costs.funding_rate_8h_pct` giữ làm tham chiếu hiển thị, **cấm** dùng trong cổng (cổng dùng f̂) |
| `config/features.yaml` | theo `14 §4` (tuần 4–6, cùng lúc viết `build_features`) |
| `config/symbols.yaml` | mở rộng exclude: neo pháp định (EUR…) · vàng/hàng hoá (XAUT, PAXG) · RLUSD · cổ phiếu token hoá — cần cho cả vũ trụ lẫn R8 |
| `serving/schemas.py` | §5.4 |

## 6.4 · Thứ tự xây — sửa lỗ hổng "thiếu mẻ tải"

Ngày 1: cron funding + OI + ảnh chụp vũ trụ + **cron sổ lệnh (spread/độ sâu)** + điều tra 2h tái tạo vũ trụ → **Tuần 1–2: MẺ 40 CẶP × 1d × ≥3 năm + cột taker_buy + cổng chất lượng** *(0.9 quên — đây là điều kiện tiên quyết của GATE 1a)* → Tuần 1: R7 → 2–4: trọng tài + tiêm rò rỉ → 4–6: L1 + đo lại cụm trên altcoin → 6–8: σ̂ + f̂ (**ADR-010**) → 8–9: F + dải + đo VR(2..30 ngày) 4 cặp *(giả định mu=0 mới chỉ có nguồn BTC khung giờ)* → 9–10: máy tranche + **bộ phép đo hợp nhất**: bộ của `10` tuần 9–10 (gồm ★hit-rate theo nhóm vol) + trượt-giá-stop + tương quan E\|move\|↔funding toàn vũ trụ + LIFO/FIFO + chênh open↔TWAP + hold-days thật của tổ hợp → điểm rẽ ~70 → 10–13: L6 (chỉ khi qua cổng). ADR cần viết: **ADR-008** (tổ hợp) · **ADR-009** (k=1 — mở lại nếu hold-days tổ hợp lệch xa 6,3) · **ADR-010** (f̂ ở L2) · **ADR-011** (sửa GATE 4).

## 6.5 · Bất biến R4/R8 — bảng test đối xứng với §1.4 (0.9: cả Phần 2–3 không có test nào)

| Bất biến | Test |
|---|---|
| Lưới đóng băng | hash 27 ô pin trong test |
| Máy trạng thái tranche | property test: slot mở ⟺ w ≥ mức và slot trống · đóng đúng LIFO · không tranche sống quá hạn · tái-vũ-trang chỉ tại close · Σ notional ≤ w×size_base |
| Một tranche ↔ một stop treo | kiểm trong vòng đối soát, và test đơn vị |
| Nhãn kiểm duyệt | tranche LIFO/hạn không bao giờ mang nhãn phản thực (test: hàm nhãn không được đọc giá sau thời điểm thoát) |
| Quy ước intrabar | null mô phỏng khung rào phải ra 23,1% ± 0,5 điểm (soi-close cho 28,0% — refactor lệch quy ước sẽ đỏ) |
| Fuzz L6 mức tranche | quét p_win ∈ [0,1] khi cổng đóng/slot đầy ⇒ không sự kiện nào sinh ra |
| Mọi tranche spot | `instrument == "spot"` toàn bộ sổ |
| R8 chống nhìn trước | đưa ảnh chụp có timestamp ≥ ngày chạy ⇒ đỏ *(loại rò rỉ mà `12 §5.5` nói không probe nào trong đường ống bắt được — nên phải có test riêng)* |
| R8 lớp tài sản | rổ không bao giờ chứa symbol thuộc danh sách loại |
| Trần phát | một trade_intent ở "1h"/"4h" ⇒ đỏ |

## 6.6 · Ma trận đường dữ liệu hỏng — 12 ô, đủ (0.9: 3 ô)

| Nguồn \ Kiểu | Trễ | Thiếu | Sai/bất thường |
|---|---|---|---|
| **Kline** | L0 chặn predict, hiển thị CHẬM | L0 chặn, MẤT KẾT NỐI | cổng chất lượng M2 chặn từ tầng dữ liệu |
| **Funding** | >24h ⇒ coi như thiếu | f̂ = p95-expanding (giả định xấu) | kẹp ±1,40 nuốt outlier; ngoài kẹp ⇒ cảnh báo |
| **OI** (chỉ nuôi đặc trưng L6) | đặc trưng OI = NaN ⇒ L6 bỏ qua sự kiện (thu hẹp — hợp bất biến đơn điệu) | như trễ | z-score tự hấp thụ; \|z\|>8 ⇒ NaN |
| **Ảnh chụp vũ trụ** (chỉ R8) | dùng ảnh gần nhất TRƯỚC kỳ; quá 45 ngày ⇒ R8 đứng tiền mặt + cảnh báo | R8 đứng tiền mặt | đối chiếu số lượng symbol ± 20% so tháng trước, lệch ⇒ chặn + cảnh báo |

---

# PHẦN 7 · MỘT ĐOẠN

> Bản 0.9 của tài liệu này tự tin rằng nó có ~12 tham số đăng ký trước, một cổng số học đã kiểm, và một cơ chế tranche gọn gàng. Tám mũi phản biện với quyền chạy mô phỏng trả lời: tham số thật là 26 và một phần chốt-sau-khi-nhìn; con số "kiểm số học" mắc đúng lỗi thứ nguyên mà tài liệu trích dẫn để cảnh báo người khác; và cơ chế tranche, như viết, sẽ giao dịch một chiến lược khác hẳn chiến lược mà cổng chứng nhận — đứng ngoài thị trường chín phần mười số ngày có tín hiệu. Không phát hiện nào trong số đó đến từ lý lẽ; tất cả đến từ việc **chạy đặc tả trên dữ liệu như thể nó là mã**.
>
> Cái còn đứng vững cũng đáng ghi: hình dạng cược 4:1 giữ ngưỡng hoà vốn trong 0,4 điểm qua hai chế độ biến động (số đúng còn đẹp hơn số sai); quyết định không-hysteresis được chính phản biện xác nhận bằng phép đo flapping; và nguyên tắc "học máy chỉ được từ chối" không bị phát hiện nào chạm tới. Một bản thiết kế sống sót qua 69 phát hiện không phải vì nó đúng từ đầu — vì nó **được viết để có thể sai một cách bắt được**, và đó là toàn bộ điều `16` yêu cầu.

---

*v1.0 · Phản biện: workflow 8 agent, 929k token, mô phỏng lưu trong transcript phiên (`tranche_stress.py`, `desync.py`, `maxpos.py`…). Nguồn số: docs 11–16 + `scripts/measurements_2026_08_26/`. Mọi con số mới trong bản này (0,685 · ~~21,7/22,1%~~ →25,0/25,5% · ~~1,60R~~ →1,57R · 21,8/năm · 16% LIFO · 23,4%/tuần · 33,9% · 1,36) truy được về phép đo của phản biện hoặc script repo.*
