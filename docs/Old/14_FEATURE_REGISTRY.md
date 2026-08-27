# SỔ ĐĂNG KÝ ĐẶC TRƯNG — TỔNG HỢP TOÀN BỘ TỪ CHÍN PHƯƠNG PHÁP

> Phiên bản 1.0 · 27/08/2026
> Gom **mọi đặc trưng từng được đề xuất** trong dự án — từ `config/features.yaml`, `00 §4.3`, `07` Wave 1, `09 §5`, `11 §8.3`, `12 §6.8`, `13 §6.3` — vào **một sổ duy nhất**, kèm trạng thái bằng chứng và phán quyết.
> **Điểm khác biệt: mức trùng lặp được ĐO trên dữ liệu thật**, không ước lượng bằng cảm nhận.
> **Không phải lời khuyên đầu tư.**

---

# PHẦN 0 · KẾT LUẬN

## 0.1 · Con số quan trọng nhất

```
Tổng đặc trưng từng được đề xuất trong toàn dự án :  57
Dựng được trên dữ liệu hiện có                    :  38
★ SỐ CHIỀU THÔNG TIN THẬT SỰ ĐỘC LẬP             :  13
```

Đo bằng gom cụm liên kết đơn ở ngưỡng |tương quan| ≥ 0,70, trên 1.943 nến ngày Bitcoin cộng chuỗi funding.

> **Hệ quả trực tiếp: ngân sách 18 suất của `11`/`12` KHÔNG phải ràng buộc thật.** Ràng buộc thật là **số chiều thông tin của dữ liệu**, và nó là 13. Cấp 18 suất từ nguồn dữ liệu hiện tại nghĩa là **ít nhất 5 suất chắc chắn trùng lặp**.
>
> Ràng buộc chuyển từ *"chọn 18 trong 57"* sang *"muốn có chiều thứ 14 thì phải thêm NGUỒN DỮ LIỆU, không phải thêm công thức"*.

## 0.2 · Ba phát hiện

**① Toàn bộ khối động lượng + xu hướng + cấu trúc là MỘT chiều.**

Cụm lớn nhất chứa **17 đặc trưng**: mọi log return, RSI, MACD, Stochastic, ROC, `close/EMA20`, `EMA20/EMA50`, độ dốc OBV, khoảng cách tới đỉnh/đáy, độ vượt biên phá vỡ. Tất cả nối với nhau qua tương quan ≥ 0,70.

**② Levine & Pedersen được kiểm chứng trên dữ liệu của chính repo.**

| Chỉ báo xu hướng | Tương quan cao nhất với **một log return thuần** |
|---|---|
| `ema20_ema50` | **0,906** với `log_ret_72` |
| `close_ema20` | **0,904** với `log_ret_12` |
| `rsi_14` | **0,854** với `log_ret_12` |
| `stoch_k` | 0,765 với `log_ret_12` |
| `macd_atr` | 0,735 với `log_ret_12` |
| `ema50_ema200` | 0,673 với `log_ret_72` ← **dưới ngưỡng, là chiều riêng** |

`12 §2.2` lập luận rằng mọi biến thể tín hiệu xu hướng là cùng một đối tượng. Bảng này là bằng chứng số. **Nhóm `momentum` của `features.yaml` — RSI, MACD, Stochastic, ROC — gần như không thêm chiều nào so với nhóm `returns`.**

**③ Bốn cặp trùng lặp gần như hoàn hảo đang cùng tồn tại trong kế hoạch.**

| Cặp | Tương quan | Ghi chú |
|---|---|---|
| `breakout_extension_sigma` ~ `dist_to_prior_swing_sigma` | **1,000** | **Cùng một công thức.** Cả hai đang có suất trong `11 §8.3` — một suất bị lãng phí |
| `log_ret_6` ~ `roc_6` | 0,997 | `features.yaml` khai báo cả hai |
| `log_ret_24` ~ `roc_24` | 0,993 | như trên |
| `rv_24` ~ `parkinson` | 0,942 | như trên |

---

# PHẦN 1 · SỔ ĐĂNG KÝ ĐẦY ĐỦ — 57 ĐẶC TRƯNG

**Chú giải cột «Trạng thái»:**
✅ **DÙNG** — có suất trong bộ chính · 🅿️ **CHỜ** — hợp lệ nhưng trùng cụm hoặc chưa có chỗ · 📡 **THIẾU DỮ LIỆU** — hợp lệ, chưa dựng được · ❌ **BÁC** — đã đo và thất bại, hoặc bị bác bằng phân tích

## 1.1 · Nhóm LỢI SUẤT — từ `features.yaml` · Phương Pháp 3, 4

| Đặc trưng | Công thức | Cụm | Trạng thái | Ghi chú |
|---|---|---|---|---|
| `log_ret_1` | `ln(c/c₁)` | 4 | ✅ **DÙNG** | Đại diện cụm 4 |
| `log_ret_2` | `ln(c/c₂)` | 1 | 🅿️ CHỜ | Trùng cụm 1 |
| `log_ret_3` | `ln(c/c₃)` | 1 | 🅿️ CHỜ | |
| `log_ret_6` | `ln(c/c₆)` | 1 | 🅿️ CHỜ | Trùng `roc_6` r=0,997 |
| `log_ret_12` | `ln(c/c₁₂)` | 1 | ✅ **DÙNG** | **Đại diện cụm 1** — return thuần, dễ hiểu nhất |
| `log_ret_24` | `ln(c/c₂₄)` | 1 | 🅿️ CHỜ | Trùng `roc_24` r=0,993 |
| `log_ret_72` | `ln(c/c₇₂)` | 1 | 🅿️ CHỜ | |

## 1.2 · Nhóm BIẾN ĐỘNG — từ `features.yaml` · nền tảng

| Đặc trưng | Công thức | Cụm | Trạng thái | Ghi chú |
|---|---|---|---|---|
| `rv_24` | `std(log_ret, 24)` | 2 | ✅ **DÙNG** | **Đại diện cụm 2** |
| `rv_72` | `std(log_ret, 72)` | 2 | 🅿️ CHỜ | r=0,9xx với `rv_24` |
| `atr_close` | `ATR₁₄ / close` | 2 | 🅿️ CHỜ | r=0,854 với `rv_24` |
| `parkinson` | `√(mean(ln(h/l)²)/(4ln2))` | 2 | 🅿️ CHỜ | r=0,942 với `rv_24` |
| **`rv_ratio_5d_20d`** | `std₅ / std₂₀` | **7** | ✅ **DÙNG** | ★ **Cụm RIÊNG** — cấu trúc kỳ hạn biến động. Đề xuất ở `12 §6.8`, nay xác nhận không trùng |
| `sigma_ratio_90d` | `σ̂ / median(σ̂, 90)` | 5 | ✅ **DÙNG** | Đại diện cụm 5 |
| `vol_pct_720` | phân vị σ̂ trong 720 nến | 5 | 🅿️ CHỜ | r=0,818 với trên |

## 1.3 · Nhóm ĐỘNG LƯỢNG — từ `features.yaml` · **cả nhóm bị hạ cấp**

| Đặc trưng | Cụm | Trạng thái | Lý do |
|---|---|---|---|
| `rsi_14` | 1 | ❌ **BÁC** | r=0,854 với `log_ret_12` — là return đổi thang |
| `macd_atr` | 1 | ❌ **BÁC** | r=0,735 với `log_ret_12` |
| `stoch_k` | 1 | ❌ **BÁC** | r=0,765 với `log_ret_12` |
| `stoch_d` | 1 | ❌ **BÁC** | Làm mượt của `stoch_k` |
| `roc_6` | 1 | ❌ **BÁC** | r=0,997 với `log_ret_6` — **cùng đại lượng** |
| `roc_24` | 1 | ❌ **BÁC** | r=0,993 với `log_ret_24` |

> **Cả nhóm `momentum` của `features.yaml` bị loại.** Không phải vì chỉ báo kỹ thuật "vô dụng" — mà vì **thông tin của chúng đã có trong nhóm `returns`**, ở dạng đơn giản hơn và không có tham số ẩn. Giữ chúng là tiêu suất mà không thêm chiều.

## 1.4 · Nhóm XU HƯỚNG — từ `features.yaml` · Phương Pháp 4

| Đặc trưng | Cụm | Trạng thái | Ghi chú |
|---|---|---|---|
| `close_ema20` | 1 | ❌ BÁC | r=0,904 với `log_ret_12` |
| `ema20_ema50` | 1 | 🅿️ CHỜ | r=0,906 với `log_ret_72` |
| **`ema50_ema200`** | **8** | ✅ **DÙNG** | ★ **Cụm RIÊNG** — r chỉ 0,673 với return dài nhất. **Xu hướng chậm là chiều khác với động lượng nhanh** |

> Phát hiện tinh tế: trong ba tỉ số xu hướng, **chỉ tỉ số chậm nhất là chiều độc lập**. Hai cái nhanh tan vào cụm động lượng. Điều này khớp với Phương Pháp 4 — thứ có bằng chứng là **xu hướng dài hạn**, không phải dao động ngắn hạn.

## 1.5 · Nhóm KHỐI LƯỢNG — `features.yaml` · Phương Pháp 6 (Order Flow)

| Đặc trưng | Cụm | Trạng thái | Ghi chú |
|---|---|---|---|
| `volume_z96` | 3 | ✅ **DÙNG** | Đại diện cụm 3 |
| `volume_pct_720` | 3 | 🅿️ CHỜ | r=0,8xx với trên |
| `obv_slope_24` | 1 | ❌ BÁC | Rơi vào cụm động lượng — OBV là return có trọng số khối lượng |
| **`taker_buy_ratio`** | ? | 📡 **THIẾU DỮ LIỆU** | ★ Ưu tiên cao nhất nhóm — `ccxt.fetch_ohlcv` **không trả cột này** (khoảng trống G3) |
| **`cvd_slope_24`** | ? | 📡 THIẾU DỮ LIỆU | Từ `aggTrades`, cờ `isBuyerMaker` |
| **`cvd_divergence_spot_perp`** | ? | 📡 THIẾU DỮ LIỆU | Giả thuyết `09 §7`: đợt tăng do giao ngay dẫn bền hơn |

## 1.6 · Nhóm HÌNH NẾN — `features.yaml`

| Đặc trưng | Cụm | Trạng thái |
|---|---|---|
| `hl_range_pct` | 3 | 🅿️ CHỜ |
| `body_pct` | 3 | 🅿️ CHỜ |
| `close_position_in_range` | 4 | ✅ **DÙNG** — r=0,714 với `log_ret_1`, sát ngưỡng nhưng giữ vì rẻ |
| **`upper_wick_pct`** | **9** | ✅ **DÙNG** | ★ **Cụm RIÊNG** — bóng trên là chiều độc lập |

## 1.7 · Nhóm THỜI GIAN — `features.yaml` · Phương Pháp 2

| Đặc trưng | Cụm | Trạng thái | Ghi chú |
|---|---|---|---|
| `hour_sin`, `hour_cos` | — | ❌ BÁC ở khung ngày | Vô nghĩa khi chân trời là ngày. Giữ cho panel 1h/4h |
| `dow_sin` | 10 | ✅ **DÙNG** | Cụm riêng |
| `dow_cos` | 11 | ✅ **DÙNG** | Cụm riêng |

## 1.8 · Nhóm LIÊN THỊ TRƯỜNG — `features.yaml` gọi là "nhóm quan trọng nhất"

| Đặc trưng | Trạng thái | Ghi chú |
|---|---|---|
| `btc_log_return_1` | ✅ **DÙNG** | **Không đo được trong phiên này** — đo trên chính BTC nên suy biến (r = 1,000 với `log_ret_1`) |
| `excess_return_vs_btc` | ✅ **DÙNG (giả định)** | Như trên — cần đo lại trên altcoin |
| `beta_30d` | ✅ **DÙNG (giả định)** | Như trên |

> ⚠️ **Lỗ hổng đo lường phải nói rõ:** ba đặc trưng này **chưa được kiểm trùng lặp**, vì phép đo chạy trên Bitcoin — tài sản tham chiếu của chính chúng. Trên một altcoin, nhiều khả năng chúng là **chiều thứ 14, 15, 16** thật sự. Đây là lý do mạnh nhất để tải xong mẻ 40 cặp: **nó không chỉ thêm mẫu, nó có thể thêm CHIỀU.**

## 1.9 · Nhóm CHẾ ĐỘ — `features.yaml`

Đã gộp vào 1.2 (`sigma_ratio_90d`, `vol_pct_720`) và 1.5 (`volume_pct_720`).

## 1.10 · Nhóm PHÁI SINH — `07` Wave 1 · **Phương Pháp 7**

| Đặc trưng | Nguồn | Cụm | Trạng thái | Ghi chú |
|---|---|---|---|---|
| `funding_level_pct` | `/fapi/v1/fundingRate` | 6 | ✅ **DÙNG** | Đại diện cụm 6 · **là CHI PHÍ THẬT**, không chỉ là đặc trưng |
| **`funding_z96`** | ↑ | **13** | ✅ **DÙNG** | ★ **Cụm RIÊNG** — xác nhận khuyến nghị `13 §6.3` giữ **cả hai** thang |
| `funding_cum8` | ↑ | 6 | 🅿️ CHỜ | r=0,808 với `funding_level` |
| `oi_chg` | `openInterestHist` | ? | 📡 **THIẾU DỮ LIỆU** | ★★ **Chỉ 30 ngày lịch sử — mất là mất vĩnh viễn** |
| `oi_price_div` | ↑ + giá | ? | 📡 THIẾU DỮ LIỆU | `dấu(Δgiá) × dấu(ΔOI)` — tiền mới hay đóng vị thế |
| `ls_ratio_z` | `globalLongShortAccountRatio` | ? | 📡 THIẾU DỮ LIỆU | ⚠️ `07` ghi "dùng ngược chiều" — **cần kiểm lại**, vì logic đó đã sập với funding (`09 §2`) |
| `taker_ls` | `takerlongshortRatio` | ? | 📡 THIẾU DỮ LIỆU | |
| `basis` | mark − spot | ? | 📡 THIẾU DỮ LIỆU | Chi phí carry, và là đặc trưng chen chúc |

## 1.11 · Nhóm CẤU TRÚC — `09 §5` · Phương Pháp 5, 6

| Đặc trưng | Cụm | Trạng thái | Lý do |
|---|---|---|---|
| `dist_to_prior_high` | 1 | ✅ **DÙNG** | Đại diện cấu trúc trong cụm 1 |
| `dist_to_prior_low` | 1 | 🅿️ CHỜ | Trùng cụm 1 |
| `breakout_extension_sigma` | 1 | ❌ **BÁC** | **r = 1,000 với `dist_to_prior_high` — cùng công thức.** Sửa lỗi của `11 §8.3` |
| `sweep_reclaim_flag` | — | ❌ **BÁC** | `12 §3.4`: lợi suất 5 ngày sau **−0,30%** so với nền +0,43%, p=0,92 — **edge ÂM** |
| `dist_to_round_number` | 12 | ❌ **BÁC** | `12 §3.4`: không hiệu ứng; ô mạnh nhất lại là giữa khoảng |
| `dist_to_vpoc_30d` | ? | 🅿️ CHỜ | Chưa dựng — dự kiến trùng nặng với `dist_to_prior_high` |
| `depth_imbalance` | ? | ❌ **BÁC** | Cần sổ lệnh thời gian thực; tường lệnh có thể là giả (`09 §5`) |
| `cascade_recency_bars` | ? | 📡 THIẾU DỮ LIỆU | Cần khối lượng hợp đồng mở |

## 1.12 · Bị bác bằng phân tích — không bao giờ dựng

| Đặc trưng | Từ | Lý do bác |
|---|---|---|
| `order_block`, `fvg`, `bos`, `choch`, `liquidity_grab`, `killzone` | Phương Pháp 5 | Không tái lập được giữa hai người cài đặt (`11 §3` Tiêu chí 2). **Fair Value Gap đã đo: lấp 79,5% so với nền 85,1%** — thấp hơn ngẫu nhiên (`12 §3.3`) |
| Mọi đặc trưng từ bản đồ nhiệt thanh lý | Phương Pháp 6 | Luồng dữ liệu bị giới hạn 1 lệnh/giây từ 2021; "mức thanh lý" là **kết quả mô hình bán như dữ liệu** (`11 §4`) |
| MVRV, SOPR, NUPL và mọi chỉ số on-chain | Phương Pháp 8 | **Hiệu chỉnh hồi tố do sửa thuật toán gom nhóm thực thể** — rò rỉ tương lai đóng gói sẵn, không test nào bắt được (`12 §5.1`) |
| Chỉ số theo dấu cá voi | Phương Pháp 8 | Vị thế không sao chép được; độ trễ phút–giờ (`11 §4`) |
| Đếm sóng Elliott, mẫu hình Harmonic | — | Không bác bỏ được về nguyên tắc |

---

# PHẦN 2 · MƯỜI BA CỤM ĐỘC LẬP — KẾT QUẢ ĐO

| Cụm | Số đặc trưng | Nội dung | Đại diện được chọn |
|---|---|---|---|
| **1** | **17** | Mọi log return · RSI · MACD · Stochastic · ROC · `close/EMA20` · `EMA20/EMA50` · độ dốc OBV · khoảng cách đỉnh/đáy · độ vượt biên | `log_ret_12` + `dist_to_prior_high` |
| **2** | 4 | `rv_24` · `rv_72` · `atr_close` · `parkinson` | `rv_24` |
| **3** | 4 | `volume_z96` · `hl_range_pct` · `body_pct` · `volume_pct_720` | `volume_z96` |
| **4** | 2 | `log_ret_1` · `close_position_in_range` | cả hai (r=0,714, sát ngưỡng) |
| **5** | 2 | `sigma_ratio_90d` · `vol_pct_720` | `sigma_ratio_90d` |
| **6** | 2 | `funding_level` · `funding_cum8` | `funding_level` |
| **7** | 1 | `rv_ratio_5d_20d` | ★ cấu trúc kỳ hạn biến động |
| **8** | 1 | `ema50_ema200` | ★ xu hướng chậm |
| **9** | 1 | `upper_wick_pct` | |
| **10** | 1 | `dow_sin` | |
| **11** | 1 | `dow_cos` | |
| **12** | 1 | `dist_to_round_number` | ❌ đã bác bằng đo |
| **13** | 1 | `funding_z96` | ★ chế độ funding |

## 2.1 · Vì sao KHÔNG chọn bằng thuật toán phi tương quan

Tôi có chạy một thuật toán chọn tham lam thuần theo độ phi tương quan. Nó chọn ra, trong tám vị trí đầu: `log_ret_2`, `dow_sin`, `ema50_ema200`, `dow_cos`, **`dist_round`**, `rv_ratio_5_20`, `upper_wick`, `funding_z96`.

> **Nó nhặt `dist_round` lên vị trí thứ sáu — đặc trưng mà `12 §3.4` đã đo và bác.**
>
> Lý do: **phi tương quan cao là thuộc tính của NHIỄU** cũng nhiều như của thông tin mới. Một đặc trưng ngẫu nhiên thuần sẽ phi tương quan với mọi thứ và được thuật toán xếp hạng cao nhất.
>
> ⇒ **Gom cụm để phát hiện trùng lặp, rồi chọn đại diện bằng BẰNG CHỨNG và khả năng diễn giải.** Không tự động hoá bước chọn.

## 2.2 · Vì sao KHÔNG chọn bằng độ liên quan với nhãn

Cám dỗ hiển nhiên: đo tương quan của từng đặc trưng với lợi suất tương lai rồi giữ cái mạnh nhất. **Không được làm ở đây**, và lý do có tính nguyên tắc:

| | |
|---|---|
| **Đo trùng lặp** | Là thuộc tính của **ma trận đặc trưng**, không liên quan tới nhãn ⇒ chạy trên toàn mẫu **không phải rò rỉ** |
| **Đo liên quan** | Là thuộc tính của **quan hệ đặc trưng ↔ nhãn** ⇒ chạy trên toàn mẫu rồi chọn là **rò rỉ chọn lọc**, và nó không để lại dấu vết nào |

⇒ **Chọn theo độ liên quan phải nằm TRONG từng fold walk-forward**, không nằm trong tài liệu này. Đây là ranh giới mà `RULE 3` bảo vệ.

---

# PHẦN 3 · BỘ ĐẶC TRƯNG CHÍNH THỨC

## 3.1 · Mười ba suất dựng được NGAY hôm nay

| # | Đặc trưng | Cụm | Từ phương pháp | Vai trò |
|---|---|---|---|---|
| 1 | `sigma_ratio_90d` | 5 | Nền tảng | Chế độ biến động |
| 2 | `rv_24` | 2 | Nền tảng | Mức biến động |
| 3 | **`rv_ratio_5d_20d`** | 7 | Nền tảng | Cấu trúc kỳ hạn biến động |
| 4 | `volume_z96` | 3 | Phương Pháp 6 | Bất thường khối lượng |
| 5 | `log_ret_12` | 1 | Phương Pháp 3, 4 | Động lượng |
| 6 | **`ema50_ema200`** | 8 | **Phương Pháp 4** | Xu hướng chậm |
| 7 | `log_ret_1` | 4 | Nền tảng | Nến gần nhất |
| 8 | `close_position_in_range` | 4 | Nền tảng | Vị trí đóng cửa |
| 9 | `upper_wick_pct` | 9 | Nền tảng | Áp lực bán trong nến |
| 10 | `dist_to_prior_high` | 1 | Phương Pháp 3, 5 | Cấu trúc |
| 11 | **`funding_level_pct`** | 6 | **Phương Pháp 7** | **Chi phí thật** |
| 12 | **`funding_z96`** | 13 | **Phương Pháp 7** | Chế độ chen chúc |
| 13 | `dow_sin` + `dow_cos` | 10, 11 | Phương Pháp 2 | Mùa vụ tuần |

## 3.2 · Năm suất chờ nguồn dữ liệu

| # | Đặc trưng | Nguồn cần | Ưu tiên | Ghi chú |
|---|---|---|---|---|
| 14 | `taker_buy_ratio` | Cột 9 endpoint klines | ★★★ | `ccxt` không trả — khoảng trống G3 |
| 15 | `oi_price_div` | `openInterestHist` | ★★★ | **Chỉ 30 ngày lịch sử** |
| 16 | `excess_return_vs_btc` | 40 cặp cùng khung | ★★★ | **Có thể là chiều mới thật** — §1.8 |
| 17 | `cvd_slope_24` | `aggTrades` | ★★ | Lấy lại được sau |
| 18 | `basis` | mark − giao ngay | ★ | Chi phí carry |

> **Ba trong năm suất chờ nằm ở mức ★★★ và cả ba đều chặn bởi việc tải dữ liệu, không phải bởi việc viết mã.** Trong đó `oi_price_div` là thứ **mất vĩnh viễn** nếu không bắt đầu thu hôm nay.

## 3.3 · Bảng đối chiếu với các phiên bản trước

| Nguồn | Số đặc trưng | Thay đổi ở tài liệu này |
|---|---|---|
| `config/features.yaml` / `00 §4.3` | ~45 (9 nhóm) | **Cả nhóm `momentum` bị loại** (trùng cụm 1) · `obv_slope`, `close_ema20` loại · `hour_*` loại ở khung ngày |
| `07` Wave 1 (phái sinh) | 8 | Giữ 5, hạ 1 xuống chờ, đánh dấu `ls_ratio_z` **cần kiểm lại chiều** |
| `09 §5` (6 hiện tượng bán lẻ) | 6 | **Chỉ còn 2** — quét-lấy-lại và số tròn đã bị đo và bác (`12 §3.4`) |
| `11 §8.3` (18 suất, bản 1) | 18 | **`breakout_extension_sigma` trùng 1,000 với `dist_to_prior_swing`** — sửa lỗi |
| `12 §6.8` (18 suất, bản 2) | 18 | `rv_ratio_5d_20d` **xác nhận là cụm riêng** ✅ |
| `13 §6.3` (funding) | 2 | **Cả hai xác nhận là cụm khác nhau** ✅ — giữ cả hai thang là đúng |

---

# PHẦN 4 · `config/features.yaml` ĐÃ LỖI THỜI

`config/features.yaml` được viết cho kiến trúc **ban đầu**: một bộ phân loại hướng LightGBM với ~45 đặc trưng. Kiến trúc đó đã bị thay ở `10`–`12`: hướng do **quy tắc** quyết, học máy chỉ **lọc bỏ** với **≤18 đặc trưng** trên vài trăm quan sát hiệu dụng.

| Xung đột | Hiện tại | Phải thành |
|---|---|---|
| Số lượng | ~45 đặc trưng | **13 dựng được + 5 chờ dữ liệu** |
| Nhóm `momentum` | `enabled: true` | **`enabled: false`** — trùng cụm 1 |
| `trend.ratios` | ba tỉ số | **Chỉ `ema50_ema200`** |
| `volatility` | bốn ước lượng | **Một** (`rv_24`) + thêm `rv_ratio_5d_20d` |
| `time.features` | có `hour_sin`, `hour_cos` | Bỏ ở khung ngày, giữ cho panel hiển thị |
| Thiếu hoàn toàn | — | **Nhóm `derivatives`** (funding, khối lượng hợp đồng mở) |

> **Đề xuất: không sửa `features.yaml` ngay bây giờ.** Nó là hợp đồng của tầng đặc trưng, và tầng đó chưa được viết (`features/builder.py:73` vẫn là `NotImplementedError`). Sửa cấu hình trước khi có mã đọc nó là tạo ra một tài liệu thứ hai để lệch pha. **Sửa nó ở tuần 4–6, cùng lúc viết `build_features`, và dùng bảng §3.1 làm nguồn sự thật.**

---

# PHẦN 5 · QUY TẮC VẬN HÀNH SỔ ĐĂNG KÝ

| # | Quy tắc | Lý do |
|---|---|---|
| **1** | **Mỗi đặc trưng mới phải khai báo CỤM của nó trước khi được thêm.** Nếu tương quan ≥ 0,70 với một đặc trưng đã có, nó phải **thay thế**, không được **thêm vào** | Ngân sách là số chiều, không phải số cột |
| **2** | **Đo trùng lặp lại mỗi khi thêm nguồn dữ liệu mới** — và **trên altcoin, không chỉ Bitcoin** | §1.8 — cụm đo trên BTC có thể khác trên alt |
| **3** | **Chọn theo độ liên quan chỉ được làm TRONG fold** | §2.2 — ngoài fold là rò rỉ chọn lọc |
| **4** | **Đặc trưng bị bác bằng phép đo không được quay lại** mà không có phép đo mới trên dữ liệu mới | Chống việc âm thầm khôi phục `sweep_reclaim` |
| **5** | **Mọi đặc trưng đi qua đúng một hàm `shift_all(1)`** và qua `assert_scale_free()` | RULE 1, RULE 2 |
| **6** | **Cấm mười một định danh hệ thuật ngữ** trong `src/` | `12 §3.5` |
| **7** | **`funding_level_pct` vừa là đặc trưng vừa là CHI PHÍ.** Nó phải vào hàm chi phí trước, vào bảng đặc trưng sau | `13 §5` — nếu chỉ coi là đặc trưng thì mất vai trò quan trọng hơn |

---

# PHẦN 6 · MỘT ĐOẠN

> Chín phương pháp giao dịch, sáu tài liệu phân tích và một tệp cấu hình đã đề xuất tổng cộng **57 đặc trưng**. Dựng ba mươi tám cái trong số đó lên dữ liệu thật và đo tương quan cho ra **mười ba chiều thông tin** — trong đó **mười bảy đặc trưng** rơi vào đúng **một** cụm: mọi log return, RSI, MACD, Stochastic, ROC, tỉ số đường trung bình nhanh, độ dốc OBV, khoảng cách tới đỉnh gần nhất. Chúng là **cùng một con số được viết bằng mười bảy cách**.
>
> Điều đó đổi bản chất của bài toán. Câu hỏi không còn là *"chọn mười tám đặc trưng nào trong năm mươi bảy"* — với nguồn dữ liệu hiện tại, **không có mười tám đặc trưng độc lập để mà chọn**. Câu hỏi đúng là: *"chiều thứ mười bốn đến từ NGUỒN DỮ LIỆU nào?"* Và câu trả lời đã nằm sẵn trong kế hoạch từ lâu, chỉ là dưới một cái tên khác: khối lượng mua chủ động, khối lượng hợp đồng mở, và bốn mươi cặp thay vì một. **Hai trong ba thứ đó chặn bởi việc tải dữ liệu, không phải viết mã — và một trong số đó mất vĩnh viễn mỗi ngày trôi qua.**

---

*Phép đo trùng lặp chạy trên 1.943 nến ngày Bitcoin (2021-01 → 2026-08) cộng 7.628 kỳ funding, gom cụm liên kết đơn ở ngưỡng |tương quan| ≥ 0,70. Mã: `scripts/measurements_2026_08_26/feature_audit.py` · `feature_clusters.py`. Giới hạn: một tài sản — nhóm liên thị trường chưa kiểm được, xem §1.8.*
