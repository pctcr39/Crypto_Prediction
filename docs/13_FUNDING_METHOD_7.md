# PHƯƠNG PHÁP 7: FUNDING RATE & CASH-AND-CARRY ARBITRAGE — PHÂN TÍCH ĐẦY ĐỦ

> Phiên bản 1.0 · 27/08/2026
> Tài liệu 12 để trống Phương Pháp 7 vì repo chưa có dữ liệu funding. **Phiên này đã tải về và đo.**
> Dữ liệu mới: `data/raw/funding/` — **28.333 kỳ funding** trên bốn cặp, 2019-09 → 2026-08. Cộng nến ngày ETH/SOL/DOGE tải qua chính downloader của repo.
> Quan hệ: `08 §B1` (carry) · `09 §2` (đã bác chiều đảo chiều) · `10 §1.1` (chi phí là hàm thời gian) · `11 §5.2` (ba vai trò) · `12 §4` (phần này thay thế và mở rộng)
> **Không phải lời khuyên đầu tư.**

---

# PHẦN 0 · KẾT LUẬN

## 0.1 · Bảng đo — tất cả chạy trên dữ liệu vừa tải

| # | Câu hỏi | Kết quả đo | Ý nghĩa |
|---|---|---|---|
| 1 | Mức 0,0100%/8h có phải "sàn mặc định" không? | **34,8 – 41,4% số kỳ nằm ĐÚNG tại 0,0100%** | ✅ Xác nhận — đó là giá trị mặc định, **không phải tín hiệu** |
| 2 | Funding có dự báo được không? | **OOS R² = 0,437 – 0,514** | ✅ **Cùng lớp với dự báo biến động (0,4–0,6), gấp ~50 lần dự báo hướng** |
| 3 | Cổng phí có tự triệt tiêu trên hợp đồng vĩnh cửu? | Funding nhóm biến động cao gấp **2,0 – 3,1 lần** nhóm thấp | 🔶 **Không triệt tiêu hết, nhưng ăn mất ~30% lợi ích của cổng** |
| 4 | Sau cực trị funding, giá đi tiếp hay đảo? | **7/8 phép thử cho ĐI TIẾP** | ✅ Tái lập `09 §2` trên dữ liệu tự tải |
| 5 | Nhưng đi tiếp theo nghĩa nào? | DOGE p99: lợi suất TB **+62,04%** mà chỉ **34,8% số lần dương** | ★ **Đây là hiệu ứng ĐUÔI, không phải hiệu ứng xu hướng trung tâm** |
| 6 | Carry thật lãi bao nhiêu? | Giữ 30 ngày: BTC **+0,657%** · ETH +0,849% · **SOL −0,293%** | 🔶 Thấp hơn quảng cáo, và **một cặp âm** |
| 7 | Carry có bao nhiêu kỳ lỗ? | Giữ 30 ngày: **24 – 27% số kỳ lỗ** (SOL: **49,0%**) | ⚠️ Không phải "lợi suất đều đặn" |
| 8 | Điểm hoà vốn thật | **12,7 – 14,3 ngày** (trung vị) | ⚠️ Xấu hơn con số 11,4 ngày của `08` |
| 9 | **Rủi ro đuôi thật của carry** | **SOL: 141/165 kỳ âm trong tháng 11/2022 · tổng −42,47% notional trong 2,5 tháng** | ❌ **Phát hiện nghiêm trọng nhất — xem §7.4** |

## 0.2 · Ba kết luận

**Kết luận 1 — Funding không phải nguồn tín hiệu. Nó là đại lượng dự báo được thứ HAI của cả dự án.**

Dự án này có đúng hai thứ dự báo được: **biến động** (R² 0,4–0,6) và giờ là **funding** (R² 0,44–0,51). Cả hai cùng nằm trong một phương trình:

```
p_required = 0,5 + c(H, công cụ, f̂) / (2 · E|move|)
                      ↑ dự báo được          ↑ dự báo được
```

**Cả tử số lẫn mẫu số của ngưỡng quyết định đều dự báo được tốt. Chỉ đại lượng đem so với nó — hướng giá — là không.** Điều này không cứu bài toán hướng, nhưng nó nói rằng cổng phí là **bộ phận đáng tin cậy nhất của toàn hệ thống**.

**Kết luận 2 — Cash-and-carry không phải "lợi suất trung tính thị trường". Nó là BÁN BẢO HIỂM cho khủng hoảng riêng của từng tài sản.**

Bạn thu phí bảo hiểm nhỏ và đều (BTC khoảng +0,66% mỗi 30 ngày), rồi trả một lần rất lớn khi tài sản đó rơi vào khủng hoảng riêng. SOL tháng 11/2022 – 01/2023: **−42,47% notional**, tương đương **bốn năm** tiền carry gộp của BTC bị xoá trong hai tháng rưỡi.

**Và rủi ro này KHÔNG đồng đều giữa các tài sản** — BTC tệ nhất chỉ −1,52%, SOL −43,40%. Đây là khác biệt gấp **hai mươi tám lần**, và nó quyết định carry nên chạy ở đâu.

**Kết luận 3 — Cổng phí hoạt động, nhưng chỉ thực sự hiệu quả trên giao ngay.**

| Chuyển từ nhóm biến động THẤP sang CAO (BTC, chân trời 7 ngày) | Ngưỡng thắng cần giảm |
|---|---|
| **Giao ngay** | 54,3% → **51,7%** — giảm **2,6 điểm** |
| **Hợp đồng vĩnh cửu** | 54,6% → **52,8%** — giảm **1,8 điểm** |
| | ⟹ perp chỉ giữ được **69%** lợi ích |

Và mức phạt của hợp đồng vĩnh cửu so với giao ngay **tăng dần theo biến động**: +0,3 → +0,7 → **+1,1 điểm**. Nghĩa là perp tệ nhất **đúng vào chế độ bạn muốn giao dịch nhất**.

---

# PHẦN 1 · DỮ LIỆU VÀ PHƯƠNG PHÁP ĐO

## 1.1 · Dữ liệu đã tải trong phiên này

| Nguồn | Nội dung | Ghi vào |
|---|---|---|
| Binance USDT-M, public API | **28.333 kỳ funding**, 4 cặp | `data/raw/funding/symbol=*/data.parquet` |
| Downloader của repo | Nến ngày ETH, SOL, DOGE từ 2019-09 | `data/raw/ohlcv/` |

| Cặp | Số kỳ | Từ | Đến |
|---|---|---|---|
| BTCUSDT | 7.628 | 2019-09-10 | 2026-08-26 |
| ETHUSDT | 7.394 | 2019-11-27 | 2026-08-26 |
| SOLUSDT | 6.595 | 2020-09-13 | 2026-08-26 |
| DOGEUSDT | 6.716 | 2020-07-10 | 2026-08-26 |

> **Đối chiếu độc lập:** `09 §2` báo cáo BTC 7.624 · ETH 7.390 · SOL 6.591 · DOGE 6.712. Số của tôi lớn hơn **đúng 4 kỳ mỗi cặp** — bằng đúng phần thời gian trôi qua giữa hai phiên (25/08 → 27/08). Hai lần kéo dữ liệu độc lập khớp nhau, xác nhận nguồn gốc số liệu của `09`.

## 1.2 · Bốn giới hạn phải nói trước

| # | Giới hạn | Ảnh hưởng |
|---|---|---|
| 1 | **Bốn cặp** — BTC, ETH, SOL, DOGE | Không suy rộng cho altcoin nhỏ, nơi rủi ro **lớn hơn** |
| 2 | **Không có dữ liệu basis** (chênh lệch giá vĩnh cửu ↔ giao ngay) | Kinh tế học carry ở §7 **lạc quan hơn thực tế** |
| 3 | **Không có phí vay chân bán khống** | Cùng hướng — con số thật xấu hơn |
| 4 | **Chưa có purged walk-forward** | Phần dự báo funding ở §4 là chia đôi thời gian, không phải quy trình tuần 9–10 |

---

# PHẦN 2 · CƠ CHẾ FUNDING — CHI TIẾT CẦN ĐỂ DÙNG ĐÚNG

## 2.1 · Công thức Binance

```
funding = clamp( chỉ_số_chênh_lệch
                 + clamp(lãi_suất − chỉ_số_chênh_lệch, ±0,05%),
                 ±giới_hạn_theo_cặp )
```

Trong đó `lãi_suất` mặc định là **0,01% mỗi 8 giờ**.

## 2.2 · Ba chi tiết quyết định cách diễn giải

| Chi tiết | Nội dung | Hệ quả thực hành |
|---|---|---|
| **Thành phần lãi suất mặc định 0,01%/8h** | Khi giá vĩnh cửu ≈ giá giao ngay, funding **rơi về đúng 0,01%** | Con số 0,01% là **điểm hút**, không phải tín hiệu thị trường. §3 đo được **34,8–41,4% số kỳ nằm đúng tại đây** |
| **Thanh toán ba lần/ngày** — 00:00, 08:00, 16:00 UTC | Chỉ ai **đang giữ vị thế tại đúng thời điểm** mới trả hoặc nhận | Chi phí funding là **hàm bậc thang**. Lệnh giữ 7 ngày trả **21 lần** |
| **Có trần theo cặp và mức ký quỹ** | Thị trường cực đoan ⇒ funding **bị chặn** | Khi bị chặn, chi phí thật chuyển sang **chênh lệch giá**, nơi bạn không đo được bằng funding |

## 2.3 · Ai trả cho ai

```
funding DƯƠNG  →  bên MUA trả bên BÁN KHỐNG    (perp cao hơn giao ngay — đám đông đang mua)
funding ÂM     →  bên BÁN KHỐNG trả bên MUA    (perp thấp hơn giao ngay — đám đông đang bán khống)
```

Vị thế carry chuẩn = **mua giao ngay + bán khống vĩnh cửu** ⇒ **thu** khi funding dương, **trả** khi funding âm. Toàn bộ rủi ro của Phần 7 nằm ở vế thứ hai.

---

# PHẦN 3 · PHÂN PHỐI THẬT CỦA FUNDING

## 3.1 · Bảng đo

| Cặp | Số kỳ | TB %/8h | Trung vị | **Đúng tại 0,0100%** | > 0,05% ("nóng") | **< 0 (âm)** | p95 | p99 |
|---|---|---|---|---|---|---|---|---|
| BTCUSDT | 7.628 | 0,0106% | 0,0097% | **35,4%** | 4,4% | **14,3%** | 0,0460% | 0,1051% |
| ETHUSDT | 7.394 | 0,0127% | 0,0100% | **34,8%** | 6,1% | **13,7%** | 0,0559% | 0,1341% |
| DOGEUSDT | 6.716 | 0,0114% | 0,0100% | **41,4%** | 5,7% | **17,9%** | 0,0551% | 0,1515% |
| **SOLUSDT** | 6.595 | **0,0002%** | 0,0086% | 34,8% | 4,6% | **28,6%** | 0,0451% | 0,1226% |

## 3.2 · Quy đổi sang đơn vị dùng được

| Cặp | TB %/ngày | TB %/năm | Trung vị %/ngày | Trung vị %/năm |
|---|---|---|---|---|
| BTCUSDT | 0,0318% | **11,6%** | 0,0292% | 10,6% |
| ETHUSDT | 0,0381% | **13,9%** | 0,0300% | 11,0% |
| DOGEUSDT | 0,0341% | **12,5%** | 0,0300% | 11,0% |
| **SOLUSDT** | **0,0005%** | **0,2%** | 0,0259% | 9,5% |

## 3.3 · Ba điều đọc ra

**① Mức 0,01% là giá trị mặc định — xác nhận bằng số.** Hơn một phần ba số kỳ nằm **đúng** tại 0,0100%. Nhìn thấy con số này trên bảng giá và kết luận *"thị trường đang nghiêng mua"* là sai cơ bản: đó là trạng thái **không có thông tin**.

**② Funding âm phổ biến hơn nhiều so với cảm nhận thông thường** — 13,7% tới **28,6%** số kỳ. Với vị thế carry, gần một phần bảy tới hơn một phần tư thời gian bạn **đang trả tiền**, chứ không thu.

**③ ★ SOL là bài học về trung bình và trung vị.** Trung vị của SOL là 0,0086%/8h — trông bình thường, quy ra 9,5%/năm. **Trung bình chỉ 0,0002%/8h = 0,2%/năm.** Chênh lệch gấp gần **năm mươi lần** giữa hai thước đo.

> Nguyên nhân: một đợt âm cực lớn kéo trung bình về gần không. Đây chính là dấu vân tay của **phân phối có đuôi trái dày** — và `08 §B1` từng trích *"SOLUSDT funding 0,0100%/8h → 10,9%/năm"* như một ảnh chụp tại thời điểm. **Trung bình lịch sử thật là 0,2%/năm.** Một ảnh chụp không phải một kỳ vọng.

---

# PHẦN 4 · ★ FUNDING DỰ BÁO ĐƯỢC — VÀ ĐÓ LÀ PHÁT HIỆN QUAN TRỌNG NHẤT

## 4.1 · Thiết lập phép đo

- **Mục tiêu dự báo:** funding trung bình **7 ngày TỚI**
- **Dự báo viên:** trung bình luỹ thừa của funding quá khứ (chu kỳ bán rã 7 ngày), **dịch một nến**
- **Đối chứng:** giá trị hôm nay (naive)
- **Ngoài mẫu:** chỉ chấm trên **nửa sau** của chuỗi

## 4.2 · Bảng đo

| Cặp | Tự tương quan 1 ngày | 3 ngày | 21 ngày | 90 ngày | **OOS R² (trung bình luỹ thừa)** | OOS R² (naive) |
|---|---|---|---|---|---|---|
| BTCUSDT | 0,826 | 0,708 | 0,359 | 0,193 | **0,480** | 0,459 |
| ETHUSDT | 0,802 | 0,675 | 0,402 | 0,251 | **0,514** | 0,457 |
| DOGEUSDT | 0,710 | 0,547 | 0,157 | 0,072 | **0,497** | 0,381 |
| SOLUSDT | 0,680 | 0,230 | 0,094 | −0,002 | **0,437** | 0,010 |

## 4.3 · So sánh — bảng quan trọng nhất của cả tài liệu

| Đại lượng | Công cụ | **OOS R²** |
|---|---|---|
| **Hướng giá** | Gradient boosting | **0,00 – 0,01** |
| **Biến động** | HAR-RV | **0,40 – 0,60** |
| **Funding** ← *đo trong phiên này* | Trung bình luỹ thừa, chu kỳ bán rã 7 ngày | **0,44 – 0,51** |

> **Dự báo funding ngang hàng dự báo biến động, và tốt hơn dự báo hướng khoảng năm mươi lần.**
>
> **Và nó rẻ hơn nhiều lần:** không cần mô hình HAR ba thang, không cần hiệu chỉnh, không cần huấn luyện — chỉ là một trung bình luỹ thừa **một tham số**. SOL cho thấy tham số đó có ý nghĩa: naive cho R² 0,010 còn làm mượt cho 0,437.

## 4.4 · Vì sao điều này quan trọng về mặt kiến trúc

```
p_required = 0,5 + c(H, công cụ, f̂) / (2 · E|move|)
                    └──── R² ≈ 0,48 ────┘   └── R² ≈ 0,50 ──┘

                     đem so với:  p_up   ← R² ≈ 0,005
```

**Cả hai thành phần của ngưỡng đều biết khá chính xác. Chỉ thứ đem so với nó là không biết.**

Ba hệ quả:

| # | Hệ quả |
|---|---|
| **1** | **Cổng phí là bộ phận đáng tin cậy nhất của hệ thống.** Việc cổng đóng hay mở gần như tất định; chỉ *cái đi qua cổng* mới là canh bạc |
| **2** | **Dự báo funding thuộc cùng đợt với dự báo biến động**, không phải đợt sau — cả hai vào cùng một phương trình |
| **3** | **Cả hai đều có giá trị mà không cần đặt một đồng nào.** Chúng là sản phẩm hiển thị hợp lệ ngay cả khi nhánh giao dịch không bao giờ mở |

---

# PHẦN 5 · VAI TRÒ MỘT — HÀM CHI PHÍ

## 5.1 · Đặc tả

```python
FLOOR_8H = 0.0001          # 0,01% — diem hut mac dinh cua Binance

def forecast_funding_daily(hist_8h: pd.Series) -> float:
    """Du bao funding %/ngay cho ky toi. OOS R2 do duoc 0,44-0,51 (§4.2)."""
    daily = hist_8h.resample("1D").mean()
    return daily.ewm(halflife=7).mean().iloc[-1] * 3      # 3 ky moi ngay

def cost_pct(horizon_days: float, instrument: str, f_daily: float) -> float:
    if instrument == "spot":
        return 0.30                                       # taker 0,10 x2 + truot 0,05 x2
    return 0.20 + f_daily * horizon_days                  # ← so hang ai cung quen

def choose_instrument(horizon_days: float, f_daily: float) -> str:
    """Giao ngay re hon khi giu du lau. Nguong = (0,30 − 0,20) / f_ngay."""
    return "spot" if horizon_days > 0.10 / max(f_daily, 1e-6) else "perp"

def p_required(sigma_daily: float, horizon_days: float, instrument: str, f_daily: float) -> float:
    e_move = sigma_daily * math.sqrt(2/math.pi) * math.sqrt(horizon_days) * 100
    return 0.5 + cost_pct(horizon_days, instrument, f_daily) / (2 * e_move)
```

**Ngưỡng đổi công cụ, tính bằng funding thật đo được:**

| Chế độ | f (%/ngày) | Ngưỡng đổi sang giao ngay |
|---|---|---|
| BTC trung vị | 0,0292% | **3,4 ngày** |
| BTC nhóm biến động cao | 0,0413% | **2,4 ngày** |
| ETH nhóm biến động cao | 0,0496% | **2,0 ngày** |

> **Giữ quá 2 – 3,5 ngày ⇒ giao ngay rẻ hơn hợp đồng vĩnh cửu.** Với `12 §2.8` đã xác định thời gian nắm giữ thực tế của khung rào chắn là **khoảng 6 ngày**, kết luận là **giao ngay, không có ngoại lệ**.

## 5.2 · ★ Cổng phí có tự triệt tiêu không — câu trả lời bằng số

**Cảnh báo ở `12 §4.5`:** cổng hạ ngưỡng bằng cách chỉ vào lệnh khi biên độ lớn — nhưng funding cũng tăng khi biến động tăng. Hai vế có thể triệt tiêu nhau.

**Đo tương quan:**

| Cặp | Tương quan funding ↔ biến động | Funding nhóm vol THẤP | GIỮA | **CAO** | Bội số |
|---|---|---|---|---|---|
| BTCUSDT | **+0,227** | 0,0170%/ngày | 0,0245% | **0,0413%** | **2,4×** |
| DOGEUSDT | **+0,279** | 0,0184% | 0,0270% | **0,0568%** | **3,1×** |
| ETHUSDT | +0,119 | 0,0252% | 0,0395% | **0,0496%** | 2,0× |
| SOLUSDT | −0,108 | 0,0098% | 0,0182% | 0,0027% | 0,3× |

**Tính ra ngưỡng thắng cần thực tế** (chân trời 7 ngày, dùng chính σ và f đo được của từng nhóm):

| BTC — nhóm | σ ngày | funding %/ngày | **Giao ngay** | **Vĩnh cửu** | Phạt của perp |
|---|---|---|---|---|---|
| Biến động THẤP | 1,64% | 0,0170% | 54,3% | 54,6% | +0,3 |
| Biến động GIỮA | 2,54% | 0,0245% | 52,8% | 53,5% | +0,7 |
| **Biến động CAO** | 4,07% | 0,0413% | **51,7%** | **52,8%** | **+1,1** |
| | | **Cổng mua được** | **2,6 điểm** | **1,8 điểm** | |

| ETH — nhóm | σ ngày | funding %/ngày | Giao ngay | Vĩnh cửu | Phạt |
|---|---|---|---|---|---|
| THẤP | 2,30% | 0,0252% | 53,1% | 53,9% | +0,8 |
| GIỮA | 3,56% | 0,0395% | 52,0% | 53,2% | +1,2 |
| **CAO** | 5,72% | 0,0496% | **51,2%** | **52,3%** | +1,0 |
| | | **Cổng mua được** | **1,9 điểm** | **1,6 điểm** | |

## 5.3 · Phán quyết về cổng phí

| Câu hỏi | Trả lời |
|---|---|
| Cổng có tự triệt tiêu hoàn toàn không? | **Không** — cổng vẫn mua được 1,6 – 2,6 điểm |
| Funding có ăn mất một phần không? | **Có** — perp chỉ giữ được **69%** lợi ích so với giao ngay (1,8 so với 2,6 điểm ở BTC) |
| Điều gì tệ nhất? | **Mức phạt của perp TĂNG theo biến động**: +0,3 → +0,7 → +1,1 điểm. Perp tệ nhất **đúng vào chế độ bạn muốn dùng cổng** |
| Kết luận thiết kế | **Cổng phí là công cụ của GIAO NGAY.** Trên hợp đồng vĩnh cửu nó vẫn chạy nhưng kém hiệu quả hơn rõ rệt, và kém đi đúng lúc cần nhất |

> `12 §4.5` cảnh báo cổng *"có thể không mua được gì"*. Số liệu **làm dịu** cảnh báo đó nhưng **không xoá** nó: cổng mua được, chỉ là trên perp bạn mất gần một phần ba phần mua được, và mất nhiều nhất đúng lúc quan trọng nhất.

---

# PHẦN 6 · VAI TRÒ HAI — ĐẶC TRƯNG

## 6.1 · Tái lập `09 §2` trên dữ liệu tự tải

Câu hỏi: sau khi funding vượt ngưỡng cực trị, bảy ngày sau giá đi tiếp hay đảo chiều?

| Cặp | Ngưỡng | n | Lợi suất 7 ngày sau | Nền | Chênh | **Tỉ lệ tăng** |
|---|---|---|---|---|---|---|
| BTCUSDT | p95 | 103 | +0,96% | +0,58% | **+0,38** | 53,4% |
| | p99 | 21 | +2,18% | +0,58% | **+1,60** | 52,4% |
| ETHUSDT | p95 | 123 | +4,48% | +1,42% | **+3,06** | 61,0% |
| | p99 | 25 | −0,37% | +1,42% | −1,79 | 52,0% |
| DOGEUSDT | p95 | 112 | **+21,08%** | +3,35% | **+17,73** | **40,2%** |
| | p99 | 23 | **+62,04%** | +3,35% | **+58,69** | **34,8%** |
| SOLUSDT | p95 | 109 | +16,30% | +2,37% | **+13,93** | 72,5% |
| | p99 | 22 | +15,73% | +2,37% | **+13,36** | 63,6% |

**7 trên 8 phép thử cho chiều ĐI TIẾP.** `09 §2` được tái lập trên dữ liệu kéo độc lập.

## 6.2 · ★ Nhưng "đi tiếp" theo nghĩa nào — tinh chỉnh mà `09` chưa nêu

Nhìn cột cuối cùng của bảng trên:

```
DOGE p99:   lợi suất trung bình  +62,04%   ...  mà chỉ  34,8%  số lần dương
DOGE p95:   lợi suất trung bình  +21,08%   ...  mà chỉ  40,2%  số lần dương
```

**Lợi suất trung bình dương lớn, trong khi phần lớn số lần lại ÂM.** Toàn bộ giá trị nằm ở **đuôi phải**.

> **Diễn giải đúng: cực trị funding không dự báo HƯỚNG — nó dự báo ĐỘ LỚN và ĐỘ LỆCH.**
>
> `09 §2` kết luận *"đứng ngược nó là đứng chắn tàu"* — vẫn đúng, vì cược ngược chiều gặp đuôi phải sẽ chết. Nhưng cược **thuận** chiều cũng thua về tỉ lệ đúng ở DOGE. **Cả hai chiều đều có tỉ lệ đúng dưới 50%; chỉ hình dạng phân phối là khác.**
>
> Điều này khớp hoàn hảo với luận điểm trung tâm của cả dự án: **thứ dự báo được là độ lớn, không phải hướng.** Funding cực trị là một chỉ báo chế độ đuôi dày — đúng loại thông tin mà tầng biến động cần, và sai loại thông tin mà tầng hướng cần.

## 6.3 · Hai suất đặc trưng — đặc tả

```python
funding_z96      = (f − mean(f, 96 kỳ)) / std(f, 96 kỳ)    # ~32 ngày, chuẩn hoá
funding_level_pct = f * 3 * 100                            # %/ngày, thang tuyệt đối
```

**Ba quy tắc dùng:**

| Quy tắc | Lý do |
|---|---|
| Dùng theo **chiều tiếp diễn**, không bao giờ đảo chiều | §6.1, và `09 §2` |
| Đưa vào **tầng biến động và tầng lọc bỏ**, không đưa vào tầng hướng | §6.2 — nó nói về độ lớn |
| Giữ **cả hai** thang (chuẩn hoá và tuyệt đối) | Chuẩn hoá bắt chế độ; tuyệt đối là **chi phí thật**, và 0,01% là điểm hút nên z-score quanh đó vô nghĩa |

---

# PHẦN 7 · VAI TRÒ BA — CASH-AND-CARRY LÀM SẢN PHẨM RIÊNG

## 7.1 · Cơ chế

```
Vào :  mua giao ngay N đồng  +  bán khống vĩnh cửu N đồng     chi phí 0,15%
Giữ :  thu (hoặc trả) funding mỗi 8 giờ
Ra  :  đóng cả hai chân                                        chi phí 0,15%

Giá lên hay xuống KHÔNG quan trọng — hai chân triệt tiêu.
Toàn bộ lãi/lỗ = tổng funding − 0,30% − basis − phí vay
```

## 7.2 · Kinh tế học thật — mô phỏng trên toàn bộ lịch sử

| Cặp | **Giữ 30 ngày: TB** | p10 | p90 | **% kỳ LỖ** | **Giữ 90 ngày: TB** | % kỳ LỖ | **Hoà vốn (trung vị)** |
|---|---|---|---|---|---|---|---|
| BTCUSDT | **+0,657%** | −0,189% | +2,086% | **24,3%** | +2,595% | 4,1% | **14,3 ngày** |
| ETHUSDT | **+0,849%** | −0,230% | +2,680% | **24,7%** | +3,151% | 10,6% | **12,7 ngày** |
| DOGEUSDT | **+0,734%** | −0,237% | +2,318% | **26,6%** | +2,836% | 7,1% | **13,5 ngày** |
| **SOLUSDT** | **−0,293%** | −1,311% | +1,828% | **49,0%** | **−0,305%** | **41,5%** | 13,8 ngày |

**Quy đổi cho BTC:** giữ 90 ngày được +2,595% ⇒ khoảng **10,5%/năm trên notional**. Vốn phải nuôi **hai chân**, nên trên **tổng vốn** ở ký quỹ 1 lần là khoảng **5,3%/năm** — khớp với con số 5,5% của `08 §B1`.

**Ba điều chỉnh so với `08`:**

| `08` nói | Đo được | |
|---|---|---|
| Hoà vốn 11,4 ngày | **12,7 – 14,3 ngày** | Xấu hơn 11 – 25% |
| "Chiến lược ít phụ thuộc kỹ năng nhất" | **24 – 27% số kỳ 30 ngày bị lỗ** | Đúng về kỹ năng, sai về độ đều đặn |
| SOL funding 10,9%/năm *(ảnh chụp)* | **Trung bình lịch sử 0,2%/năm · carry SOL LỖ ở mọi chân trời** | Ảnh chụp ≠ kỳ vọng |

## 7.3 · Vì sao BTC và ETH khác hẳn SOL

Carry sống bằng **funding dương đều đặn**, tức là bằng việc **luôn có nhiều người muốn mua đòn bẩy hơn người muốn bán khống**. Điều đó đúng với tài sản có dòng người mua cấu trúc (BTC, ETH). Nó **không** đúng với tài sản có thể rơi vào khủng hoảng riêng, khi cả thị trường muốn bán khống cùng lúc.

## 7.4 · ★★ RỦI RO ĐUÔI THẬT — con số nghiêm trọng nhất của tài liệu

| Cặp | Chuỗi âm dài nhất | **Sụt giảm sâu nhất của chuỗi funding** | Thời điểm |
|---|---|---|---|
| BTCUSDT | 8,0 ngày | −1,519% | 04/2020 |
| ETHUSDT | 8,3 ngày | −1,792% | 09/2022 |
| DOGEUSDT | 4,7 ngày | −2,546% | 02/2021 |
| **SOLUSDT** | **17,7 ngày** | **−43,398%** | **01/2023** |

**Kiểm chứng chi tiết đợt SOL:**

| Tháng | Funding TB %/8h | %/ngày | Số kỳ âm | Giá SOL TB |
|---|---|---|---|---|
| 2022-10 | +0,0030% | +0,0091% | 27/93 | 31,2 |
| **2022-11** | **−0,1590%** | **−0,4769%** | **141/165** | 18,6 |
| 2022-12 | −0,0322% | −0,0966% | 67/93 | 12,5 |
| 2023-01 | −0,0366% | −0,1098% | 31/93 | 19,8 |
| 2023-02 | +0,0029% | +0,0087% | 23/84 | 23,1 |

```
Tổng funding SOL, 01/11/2022 → 15/01/2023  :  −42,47% notional
Vị thế carry (bán khống vĩnh cửu) PHẢI TRẢ đúng khoản đó.
Giá SOL cùng kỳ: 32,2 → 22,9 USD — nhưng carry trung tính giá, nên
khoản lỗ này là lỗ THUẦN, không được bù bởi bất cứ thứ gì.
```

**Bối cảnh:** FTX sụp đổ tháng 11/2022. FTX là nhà hậu thuẫn lớn nhất của Solana. Cả thị trường bán khống SOL cùng lúc ⇒ giá vĩnh cửu rơi xuống dưới giao ngay ⇒ funding âm sâu và kéo dài ⇒ **bên bán khống trả tiền cho bên mua**.

## 7.5 · Phát biểu lại bản chất của carry

> **Cash-and-carry không phải "lợi suất trung tính thị trường". Nó là BÁN BẢO HIỂM cho khủng hoảng riêng của từng tài sản.**
>
> Thu phí bảo hiểm nhỏ và đều — BTC khoảng +0,66% mỗi 30 ngày, tức khoảng 5,3%/năm trên tổng vốn.
> Trả một lần rất lớn khi tài sản rơi vào khủng hoảng riêng — SOL −42,47% trong hai tháng rưỡi.
>
> **Quy đổi:** −42,47% chia cho tốc độ carry gộp của BTC (10,5%/năm trên notional) = **hơn bốn năm tiền carry bị xoá trong hai tháng rưỡi**.
>
> Hình dạng lợi nhuận này — **lãi nhỏ đều, lỗ lớn hiếm** — chính là hình dạng mà `08 §A1` xếp vào loại nguy hiểm nhất, và là hình dạng ngược hẳn với Phương Pháp 4 (lỗ nhỏ đều, lãi lớn hiếm).

## 7.6 · Bốn quy tắc nếu vẫn làm carry

| # | Quy tắc | Căn cứ |
|---|---|---|
| **1** | **Chỉ BTC và ETH.** Không altcoin, dù funding hấp dẫn hơn | Sụt giảm −1,5% / −1,8% so với −43,4% — gấp **28 lần** |
| **2** | **Công tắc dừng theo funding:** funding trung bình 3 ngày < 0 ⇒ đóng vị thế | Đợt SOL có 141/165 kỳ âm — **có thừa thời gian để thoát**, nếu có quy tắc |
| **3** | **Chân trời tối thiểu 90 ngày**, không phải 30 | Tỉ lệ kỳ lỗ giảm từ 24,3% xuống 4,1% |
| **4** | **Ưu tiên hợp đồng kỳ hạn quý** nếu chấp nhận khoá vốn | Hội tụ **tất định**, không có rủi ro funding đảo dấu — §8 |

---

# PHẦN 8 · BIẾN THỂ CÓ HỘI TỤ TẤT ĐỊNH — CHÊNH LỆCH GIÁ KỲ HẠN

| | Hợp đồng vĩnh cửu | **Kỳ hạn quý** |
|---|---|---|
| Nguồn thu | Funding — **có thể đảo dấu bất kỳ lúc nào** | Chênh lệch giá — **hội tụ về 0 TẤT ĐỊNH tại đáo hạn** |
| Rủi ro chính | Funding âm kéo dài (§7.4) | Ký quỹ chân bán khống nếu giá tăng mạnh giữa kỳ |
| Vốn | Linh hoạt | **Khoá tới đáo hạn** |
| Quyết định vận hành | Phải chọn thời điểm thoát | **Không phải chọn** — đáo hạn tự làm |
| Số đã kiểm (BIS WP 1087) | — | TB **6 – 8%/năm**, thường vượt 20%, có lúc trên 40% |

> **Với người vận hành ngoài giờ, hội tụ tất định đáng giá hơn lợi suất cao hơn:** nó loại bỏ hoàn toàn việc phải theo dõi và quyết định thời điểm thoát — nguồn sai sót vận hành lớn nhất của chiến lược hai chân, và đúng thứ đã giết vị thế carry SOL năm 2022.

---

# PHẦN 9 · CẮM VÀO MODULE PREDICTION Ở ĐÂU

| Tầng (`12 §6.2`) | Phương Pháp 7 đóng góp gì | Trạng thái |
|---|---|---|
| **L2 · Dự báo** | `f̂` — trung bình luỹ thừa chu kỳ bán rã 7 ngày, **R² 0,44–0,51** | ✅ **Xây ngay, cùng đợt với σ̂** |
| **L4 · Cổng phí** | `c(H, công cụ, f̂)` · `p_required` · `choose_instrument()` | ✅ **Xây trước mọi mô hình** |
| **L6 · Lọc bỏ** | `funding_z96` · `funding_level_pct` — **chiều tiếp diễn** | 🔶 Sau khi có đủ đặc trưng |
| **L7 · Veto** | Không cần quy tắc riêng — funding nóng tự đẩy `p_required` lên và cổng tự đóng | ✅ Miễn phí |
| **Sản phẩm riêng** | Carry, chỉ BTC/ETH, ưu tiên kỳ hạn quý | ⏸ **Hoãn tới sau GATE 1** |

**Bất biến bổ sung cho `12 §6.10`:**

| Bất biến | Phép thử |
|---|---|
| `p_required` không bao giờ dưới sàn hợp đồng vĩnh cửu | `assert p_req ≥ 0,5 + √(c₀·f)/A` với mọi `d > 0` |
| Dự báo funding không âm quá mức vô lý | `assert −0,5% ≤ f̂_ngày ≤ +1,5%` — biên từ dữ liệu thật |
| Chọn công cụ là hàm của `f̂`, không phải hằng | Test tại `f̂` = 0,0292% (ngưỡng 3,4 ngày) và `f̂` = 0,0496% (ngưỡng 2,0 ngày) |
| Khi thiếu dữ liệu funding, **giả định xấu nhất** | `f̂` mặc định = p95 lịch sử, **không phải** 0,01% |

> Bất biến cuối cùng quan trọng hơn vẻ ngoài của nó: nếu luồng funding hỏng và mã lặng lẽ rơi về giá trị mặc định 0,01%, hệ thống sẽ **đánh giá thấp chi phí đúng vào lúc chi phí cao nhất** — vì luồng dữ liệu thường hỏng đúng lúc thị trường biến động.

---

# PHẦN 10 · VIỆC PHÁT SINH

| # | Việc | Vào đâu | Ưu tiên |
|---|---|---|---|
| 1 | **Tác vụ định kỳ funding + khối lượng hợp đồng mở** cho vũ trụ giao dịch | Ngày 1 | ★★★ — hợp đồng mở chỉ có 30 ngày lịch sử |
| 2 | `forecast_funding_daily()` + `cost_pct()` + `choose_instrument()` + `p_required()` | Tuần 1 | ★★★ — 40 dòng mã, chặn mọi thứ phía sau |
| 3 | Bốn bất biến ở §9 kèm test | Tuần 1 | ★★ |
| 4 | Hai đặc trưng funding vào ngân sách 18 suất | Tuần 4–6 | ★★ — đã có chỗ trong `12 §6.8` |
| 5 | **Mở rộng phép đo tương quan funding ↔ biến động ra toàn vũ trụ** | Tuần 9–10 | ★★ — bốn cặp là quá ít để chốt |
| 6 | Sửa `08 §B1`: SOL 10,9%/năm là ảnh chụp; trung bình lịch sử 0,2%/năm | Ngay | ★ |
| 7 | Bổ sung vào `08 §B1` đợt SOL 11/2022: −42,47% trong 2,5 tháng | Ngay | ★★ — rủi ro carry đang bị nêu quá nhẹ |
| 8 | Ghi **ADR-010**: dự báo funding là thành phần L2 ngang hàng dự báo biến động | Tuần 7–8 | ★ |

---

# PHẦN 11 · MỘT ĐOẠN

> Phương Pháp 7 vào tài liệu này với danh nghĩa *"chiến lược có bằng chứng vững nhất, ít phụ thuộc kỹ năng nhất"*, và ra khỏi tài liệu này thành hai thứ hoàn toàn khác. Thứ nhất, phần **có giá trị nhất của nó không phải là chiến lược** — mà là việc funding hoá ra **dự báo được với R² 0,44 – 0,51**, ngang hàng biến động và gấp năm mươi lần dự báo hướng, khiến cổng phí trở thành bộ phận đáng tin cậy nhất của toàn hệ thống. Thứ hai, phần **là** chiến lược hoá ra không phải lợi suất mà là **bán bảo hiểm**: thu 0,66% mỗi ba mươi ngày trên BTC, rồi trả 42,47% trong hai tháng rưỡi trên SOL — hơn bốn năm thu nhập bị xoá bởi một sự kiện, và đúng bằng hình dạng lợi nhuận mà `08 §A1` xếp vào loại nguy hiểm nhất.
>
> Cả hai điều đó đều nằm trong dữ liệu công khai, miễn phí, tải về trong hai phút bằng chính công cụ mà repo đã có sẵn. Chúng không nằm trong tài liệu nào trước đó của dự án — không phải vì thiếu suy nghĩ, mà vì **suy nghĩ không thay được phép đo**, và bốn tài liệu liên tiếp đã lập luận về funding mà chưa từng nhìn vào nó.

---

*Dữ liệu: `data/raw/funding/` — 28.333 kỳ, bốn cặp, 2019-09 → 2026-08, kéo từ giao diện công khai Binance USDT-M trong phiên 27/08/2026. Mã đo: `scripts/measurements_2026_08_26/fetch_funding.py` · `funding_stats.py` · `funding_deep.py` · `funding_verify.py`. Giới hạn đầy đủ ở §1.2.*
