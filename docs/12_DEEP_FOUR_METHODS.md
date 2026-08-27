# PHÂN TÍCH SÂU BỐN PHƯƠNG PHÁP — VÀ CHIẾN LƯỢC THIẾT KẾ MODULE PREDICTION

> Phiên bản 1.0 · 26/08/2026
> Phân tích sâu: **Phương Pháp 4: Position Trading & Trend Following** · **Phương Pháp 5: Smart Money Concepts & Price Action Hiện Đại** · **Phương Pháp 7: Funding Rate & Cash-and-Carry Arbitrage** · **Phương Pháp 8: On-Chain & Narrative Trading**. Rồi từ đó dựng **chiến lược thiết kế module Prediction**.
> Quan hệ: `09` (review đã phản biện) · `10` (kiến trúc, mười bốn điều bắt buộc) · `11` (chín phương pháp, kịch bản, khả thi) — **tài liệu này SỬA hai kết luận của `11`**, xem mục 0.3.
> **Điểm khác biệt của tài liệu này: nó ĐO, không chỉ lập luận.** Toàn bộ Phần 2 và Phần 3 chạy trên 2.062 nến ngày Bitcoin có sẵn trong `data/raw`. **Không phải lời khuyên đầu tư.**

---

# PHẦN 0 · KẾT LUẬN VÀ NHỮNG GÌ ĐÃ ĐO ĐƯỢC HÔM NAY

## 0.1 · Bảng đo — chạy trên dữ liệu của chính repo

Dữ liệu: `BTCUSDT` khung 1 giờ gộp thành **2.062 nến ngày**, từ 2021-01-01 tới 2026-08-24. Phí 0,30% khứ hồi. Khớp tại giá mở nến kế tiếp. Độ lệch chuẩn ước lượng dịch một nến.

| Khẳng định được kiểm | Kết quả đo | Phán quyết |
|---|---|---|
| **Trend Following có Sharpe 1,07 – 1,32** *(số của `09`, cửa sổ 2014–2026)* | Ô trung vị lưới 27 ô: **0,47** · ô tốt nhất 0,89 · mua-và-giữ 0,59 | ⚠️ **Không tái lập trên cửa sổ 2021–2026** |
| Bộ tham số `09` trích (ema 20/200 + Donchian 55) | Đoạn 2021–23: **−0,16** · Đoạn 2024–26: **+1,12** | ❌ **Cực kỳ bất ổn** |
| Chọn tham số tốt nhất trên quá khứ có chuyển sang tương lai không? | Ô tốt nhất đoạn 1 (1,04) → đoạn 2 chỉ **0,72**, **bằng đúng mua-và-giữ (0,72)** | ❌ **Lợi thế chọn tham số = 0** |
| Thứ hạng tham số có ổn định giữa hai đoạn? | Tương quan hạng **+0,19** | ❌ **Gần như ngẫu nhiên** |
| **Trend Following cắt sụt giảm** | Mua-và-giữ −76,6% / −53,0% → lưới trung vị **−29,9% / −18,9%**; **54/54 quan sát đều cắt** | ✅ **VỮNG NHẤT trong toàn bộ phép đo** |
| Tỉ lệ chốt lời khung rào chắn 1,2σ̂ / 4,0σ̂ | Ô trung vị **30,0%** · tỉ lệ nền khớp cửa sổ **23,7%** · hoà vốn 22,0% | 🔶 **Dấu đúng, p = 0,24 — không đủ công suất** |
| **Fair Value Gap "phải được lấp"** | Lấp 50,0 / 59,8 / 69,4 / 79,5% (5/10/20/60 ngày) · **nền cùng độ sâu 45,5 / 60,7 / 70,3 / 85,1%** | ❌ **BỊ BÁC — chênh −5,6 đến +4,5 điểm** |
| **Quét rồi lấy lại (sweep-and-reclaim)** | Lợi suất 5 ngày sau: tín hiệu **−0,30%** · nền **+0,43%** · p = 0,92 | ❌ **BỊ BÁC — edge ÂM** |
| **Số tròn hút giá (Osler)** | Dưới mốc +0,06% · trên mốc +0,35% · **giữa khoảng +1,24%** · nền +0,26% | ❌ **Không có hiệu ứng; giữa khoảng lại mạnh nhất** |

## 0.2 · Ba kết luận

**Kết luận thứ nhất — Phương Pháp 4 không phải máy tạo lợi nhuận, nó là máy cắt sụt giảm.**

Trên 54 quan sát (27 ô lưới × 2 đoạn thời gian), **phần lợi nhuận không tái lập được** (tương quan hạng giữa hai đoạn +0,19; ô trung vị 0,47 so với mua-và-giữ 0,59), nhưng **phần cắt sụt giảm tái lập trong 54/54 quan sát** — mua-và-giữ −76,6% xuống còn −18,9…−42,6%.

> Đây không phải phát hiện tiêu cực. Nó là **phát hiện về việc nên đo cái gì**. `10` và `11` đặt cổng GATE 1 ở *net Sharpe ≥ 0,8* — chỉ tiêu đó **không tái lập được**, nên nó sẽ cho kết quả ngẫu nhiên. Chỉ tiêu tái lập được là **tỉ số sụt giảm**. Mục 6.6 đổi cổng theo phát hiện này.

**Kết luận thứ hai — Phương Pháp 5 mất cả ba đặc trưng cuối cùng trên dữ liệu của chính repo.**

`11` cấp cho Phương Pháp 5 ba suất đặc trưng vì cho rằng phần lõi (cụm dừng lỗ quanh số tròn, quét rồi lấy lại) có literature vững. **Đo trên Bitcoin khung ngày: cả ba đều không có edge, và quét-rồi-lấy-lại còn có edge âm.** Đây chính là quy trình mà `09` đã đòi hỏi — *"nền literature là ngoại hối/cổ phiếu, phải tự tái lập trên dữ liệu Binance trước khi tin"* — và phép tái lập đó vừa thất bại.

**Kết luận thứ ba — hai phương pháp còn lại không đo được bằng dữ liệu hiện có, và đó chính là thông tin.**

Phương Pháp 7 cần lịch sử funding (**chưa tải**). Phương Pháp 8 cần ảnh chụp vũ trụ nhiều tháng (**có đúng một**). Việc không đo được không phải trung lập — nó nói rằng **tác vụ định kỳ ngày một là ràng buộc chặn cứng**, không phải một mục trong danh sách việc.

## 0.3 · Hai sửa đổi đối với `11`

| Nội dung trong `11` | Sửa thành |
|---|---|
| Phương Pháp 5 được **ba suất đặc trưng** (`cờ quét-lấy-lại`, `khoảng cách đỉnh đáy`, `khoảng cách số tròn`) | **Cắt xuống một suất** — chỉ giữ `khoảng cách tới đỉnh/đáy gần nhất` (đo cấu trúc, không phải khẳng định của Smart Money Concepts). Hai suất giải phóng chuyển sang nhóm chế độ và dòng lệnh. |
| Cổng GATE 1 = *net Sharpe ô trung vị ≥ 0,8* | **Đổi thành cổng kép**: ① tỉ số sụt giảm ≤ 0,60 ở ≥80% số ô *(chỉ tiêu tái lập được)* ② net Sharpe ô trung vị ≥ mua-và-giữ *(chỉ tiêu kinh tế)*. Lý do ở mục 2.7. |

---

# PHẦN 1 · PHƯƠNG PHÁP ĐO — ĐỌC TRƯỚC KHI TIN BẤT KỲ SỐ NÀO

**Giao thức đã dùng:**
- Tín hiệu tính tại giá đóng nến `t`, vị thế mở tại **giá mở nến `t+1`** (`10 §E3` — khớp tại giá đóng `t` là một dạng nhìn trước).
- Cửa sổ Donchian dùng `.shift(1)` — **không** bao gồm nến hiện tại.
- Độ lệch chuẩn ước lượng bằng độ lệch chuẩn trượt 20 ngày, **dịch một nến** (RULE 2).
- Phí 0,15% mỗi chiều, tính trên mỗi lần đổi trạng thái.
- Tỉ lệ nền **khớp cửa sổ** — không so với 50%, không so với 0.

**Năm giới hạn phải nói trước, vì chúng lớn:**

| # | Giới hạn | Ảnh hưởng |
|---|---|---|
| 1 | **Một đồng duy nhất** (Bitcoin) | Không kết luận được gì về altcoin |
| 2 | **5,6 năm, 2.062 nến** — trung bình **22 lệnh mỗi ô** | Công suất thống kê rất thấp (`11 §7.2`) |
| 3 | **Không có purged walk-forward** — chỉ chia đôi thời gian | Đây **không phải** phép đo của tuần 9–10 |
| 4 | Cửa sổ 2021–2026 chứa một chu kỳ gấu và hai chu kỳ tăng, **không có giai đoạn 2014–2020** | Chính là lý do số khác `09` |
| 5 | Không có phí funding, không có trượt giá thay đổi theo thanh khoản | Số thực tế sẽ **xấu hơn** |

> **Cách đọc đúng:** đây là **phép thử khói** trả lời câu hỏi *"kế hoạch này có đáng thực thi không?"*, **không phải** phép đo trả lời *"chiến lược này có lãi không?"*. Một phép thử khói âm tính đủ để dừng; một phép thử khói dương tính **không** đủ để đi tiếp.

---

# PHẦN 2 · PHƯƠNG PHÁP 4: POSITION TRADING & TREND FOLLOWING

## 2.1 · Bốn giải thích cạnh tranh — và chỉ hai cái áp dụng cho crypto

Câu hỏi *"vì sao theo xu hướng lại hoạt động"* có bốn câu trả lời trong literature. Chúng **không tương đương**, vì mỗi cái dự đoán một điều kiện tồn tại khác nhau.

| Giải thích | Cơ chế | Áp dụng cho crypto? |
|---|---|---|
| **① Phản ứng dưới mức với tin tức** (Hong & Stein 1999) | Thông tin lan truyền chậm qua các nhóm nhà đầu tư; giá điều chỉnh dần chứ không tức thì | ✅ **Áp dụng mạnh** — crypto là tài sản có đường cong chấp nhận, thông tin lan qua các lớp người dùng trong nhiều tháng |
| **② Phần bù cho việc nhận rủi ro từ bên phòng hộ** (hedging pressure) | Nhà sản xuất hàng hoá cần bán khống để phòng hộ; người đầu cơ được trả tiền để nhận phía kia | ❌ **KHÔNG áp dụng** — crypto không có nhà sản xuất có nhu cầu thương mại phải phòng hộ. Thợ đào là gần nhất, quy mô quá nhỏ |
| **③ Dòng tiền hệ thống và chen chúc** | Quỹ theo xu hướng tự tạo xu hướng bằng chính dòng vốn của mình | 🔶 **Yếu** — quy mô quỹ theo xu hướng trong crypto nhỏ so với thị trường |
| **④ Khai thác dữ liệu** (phê phán) | Xu hướng là ảo ảnh của việc thử nghìn quy tắc rồi báo cáo cái đẹp | ⚠️ **Không loại trừ được** — và phép đo ở mục 2.5 cho thấy phê phán này có trọng lượng thật |

> **Vì sao phân biệt này quan trọng:** nếu edge của theo xu hướng chủ yếu đến từ ② thì nó **không chuyển sang crypto**, và toàn bộ literature ngoài crypto trở thành bằng chứng không liên quan. Nếu chủ yếu từ ①, nó chuyển được. Bằng chứng nghiêng về ① — nhưng ① cũng dự đoán rằng **edge mòn dần khi thị trường trưởng thành**, và đó chính xác là điều số liệu 2021–2026 cho thấy so với 2014–2026.

## 2.2 · Mọi biến thể tín hiệu đều là cùng một thứ

Levine & Pedersen (2016) chứng minh: **giao cắt đường trung bình động ≈ tổng có trọng số của lợi suất quá khứ.** Cùng một đối tượng, khác cách tham số hoá. Phá vỡ biên Donchian cũng vậy — nó là hàm bậc thang của cùng một thống kê.

**Hệ quả thực hành, và nó tiết kiệm hàng tuần công:**

1. **Không có "tín hiệu tốt hơn" để đi tìm.** Giao cắt, phá vỡ biên, dấu của lợi suất N ngày, động lượng chuẩn hoá biến động — tất cả tương quan 0,8 – 0,95 với nhau.
2. **Tinh chỉnh giữa các biến thể là khai thác nhiễu**, không phải cải tiến. Phép đo 2.5 xác nhận: tương quan hạng giữa hai đoạn thời gian chỉ +0,19.
3. **Chọn biến thể đơn giản nhất và đóng băng nó.** Mọi giờ công bỏ vào so sánh biến thể là giờ công bị mất.

## 2.3 · Hồ sơ thống kê — vì sao Sharpe là chỉ tiêu SAI cho phương pháp này

Theo xu hướng có **hình dạng lợi nhuận lệch dương**: nhiều lệnh thua nhỏ, ít lệnh thắng rất lớn. Về mặt cấu trúc nó tương đương một **vị thế mua quyền chọn hai chiều (long straddle)**: trả phí bảo hiểm đều đặn trong thị trường đi ngang, thu về trong các cú dịch chuyển lớn.

Điều này tạo ra ba hệ quả mà hầu hết phân tích bỏ qua:

| Hệ quả | Nội dung |
|---|---|
| **Sharpe phạt độ lệch dương** | Sharpe chia cho độ lệch chuẩn, mà độ lệch chuẩn tính cả các cú **thắng** lớn. Một chiến lược có đuôi phải dày bị Sharpe chấm thấp hơn giá trị thật. |
| **Chuỗi thua dài là đặc tính, không phải lỗi** | Với tỉ lệ thắng 30%, xác suất thua 8 lệnh liên tiếp là 0,7⁸ = **5,8%** — nghĩa là **gần như chắc chắn xảy ra** trong một năm 15 lệnh nếu chạy nhiều đồng |
| **Chỉ tiêu đúng là chỉ tiêu đo đuôi** | Tỉ số sụt giảm tối đa, tỉ số Calmar, hoặc phân vị 5% của phân phối lợi nhuận — không phải Sharpe |

Phép đo ở mục 2.5 xác nhận chính xác điều này: **Sharpe không tái lập, sụt giảm thì tái lập 54/54.**

## 2.4 · Vì sao chỉ mua-hoặc-đứng-ngoài, không bán khống — ba lý do độc lập

1. **Trôi dương của tài sản.** Bán khống là đứng ngược chiều trôi dài hạn. Cần edge lớn hơn nhiều mới bù được.
2. **Bất đối xứng funding.** Bán khống hợp đồng vĩnh cửu thì **thu** funding khi funding dương — nghe có vẻ tốt. Nhưng `09 §2` đã đo: sau cực trị funding dương, giá **tiếp diễn tăng**. Nghĩa là phe bán khống thu funding **đúng lúc chịu lỗ giá**. Khoản thu là phần bù cho rủi ro, không phải bữa trưa miễn phí.
3. **Chi phí vay chân bán khống** 5 – 30% mỗi năm, có lúc vọt trên 100% (`09 §8` mục 10) — khoản mà mọi backtest bán khống quên tính.

## 2.5 · ★ PHÉP ĐO — lưới 27 ô trên dữ liệu thật

**Quy tắc đo:** `close > EMA_chậm` VÀ `close > max(high[t−N … t−1])` để vào · `close < EMA_nhanh` để ra · chỉ mua hoặc đứng ngoài · giao ngay · khớp giá mở nến kế tiếp · phí 0,30% khứ hồi.

**Toàn bộ bề mặt, 2021-01 → 2026-08** *(mua-và-giữ: Sharpe 0,59 · sụt giảm −76,6%)*:

| EMA nhanh | EMA chậm | Donchian | Sharpe | Lợi nhuận kép/năm | Sụt giảm | Lệnh/năm | Phơi bày |
|---|---|---|---|---|---|---|---|
| 50 | 150 | 20 | **0,89** | 26,5% | −29,5% | 4,1 | 36,5% |
| 50 | 100 | 20 | 0,81 | 23,6% | −35,0% | 4,4 | 37,9% |
| 50 | 200 | 20 | 0,80 | 22,6% | −27,9% | 3,9 | 35,2% |
| 20 | 150 | 20 | 0,73 | 18,0% | −42,6% | 5,3 | 26,9% |
| … *(21 ô ở giữa)* | | | 0,21 – 0,64 | | | | |
| 20 | 200 | 55 | 0,39 | 6,5% | −35,6% | 3,5 | 19,4% |
| 10 | 200 | 55 | **0,05** | −0,8% | −34,4% | 5,1 | 13,0% |

| Thống kê lưới | Giá trị |
|---|---|
| Ô tốt nhất | **0,89** |
| **Ô trung vị** ← ngưỡng phải dùng | **0,47** |
| Ô tệ nhất | 0,05 |
| Số ô vượt mua-và-giữ (0,59) | **10/27** |
| Số ô vượt ngưỡng 0,8 của `10`/`11` | **2/27** |

> **Đọc thẳng: nếu chạy phép đo của tuần 9–10 hôm nay trên Bitcoin, cổng GATE 1 như đang viết sẽ TRƯỢT.** Ô trung vị 0,47 so với ngưỡng 0,8.

## 2.6 · ★ PHÉP ĐO — tham số có chuyển từ quá khứ sang tương lai không?

Chia đôi: Đoạn 1 = 2021-01 → 2023-12 (1.095 ngày) · Đoạn 2 = 2024-01 → 2026-08 (967 ngày).

| Đoạn | Mua-và-giữ | Ô tốt nhất | **Ô trung vị** | Ô tệ nhất | Số ô > 0,8 |
|---|---|---|---|---|---|
| 1 (2021–23) | 0,52 | 1,04 | **0,07** | −0,41 | 3/27 |
| 2 (2024–26) | 0,72 | 1,17 | **0,77** | 0,25 | 13/27 |

**Phép thử quyết định — chọn ô tốt nhất trên Đoạn 1, chạy trên Đoạn 2:**

```
Ô tốt nhất Đoạn 1  = EMA(50,150) + Donchian 20   →  Sharpe 1,04
Chính ô đó trên Đoạn 2                           →  Sharpe 0,72
Mua-và-giữ trên Đoạn 2                           →  Sharpe 0,72
                                                    ↑ BẰNG NHAU
Tương quan hạng 27 ô giữa hai đoạn               →  +0,19
Bộ tham số `09` trích (20/200/55)                →  Đoạn 1: −0,16 · Đoạn 2: +1,12
```

> **Ba điều đọc ra, và cả ba đều quan trọng hơn con số Sharpe:**
> 1. **Việc chọn tham số không mang lại gì.** Ô tốt nhất quá khứ cho đúng bằng mua-và-giữ ở tương lai. Đây là kết quả kinh điển của khai thác dữ liệu, đo được trên chính dữ liệu của dự án.
> 2. **Tương quan hạng +0,19 nghĩa là bảng xếp hạng tham số gần như ngẫu nhiên.** Mọi thảo luận kiểu "nên dùng EMA 50 hay 200" là thảo luận về nhiễu.
> 3. **Bộ tham số được `09` trích dẫn dao động 1,28 Sharpe giữa hai cửa sổ liền kề.** Một con số như thế không phải "kết quả" — nó là một mẫu duy nhất từ một phân phối rất rộng.

## 2.7 · ★ Chỉ tiêu nào TÁI LẬP ĐƯỢC — và cổng GATE 1 phải đổi

| Chỉ tiêu | Đoạn 1 | Đoạn 2 | Tái lập? |
|---|---|---|---|
| Sharpe ô trung vị | 0,07 | 0,77 | ❌ chênh 0,70 |
| Sharpe ô tốt nhất | 1,04 | 1,17 | 🔶 nhưng là cực đại của 27 |
| **Sụt giảm mua-và-giữ** | −76,6% | −53,0% | — |
| **Sụt giảm lưới trung vị** | **−29,9%** | **−18,9%** | ✅ |
| **Sụt giảm ô tệ nhất** | −42,6% | −35,0% | ✅ |
| **Tỉ số sụt giảm** (chiến lược / mua-và-giữ) | **0,39** | **0,36** | ✅✅ **chênh 0,03** |

> **Tỉ số sụt giảm là chỉ tiêu duy nhất trong toàn bộ phép đo cho ra gần như cùng một con số ở hai chế độ thị trường khác hẳn nhau.** 54/54 quan sát ô-đoạn đều cắt sụt giảm đáng kể.

**⇒ Đề xuất sửa cổng GATE 1** *(sửa `10` và `11`)*:

```
CỔNG CŨ:  net Sharpe ô trung vị ≥ 0,8                      ← không tái lập được
CỔNG MỚI (kép, phải đạt CẢ HAI):
  ① Tỉ số sụt giảm ≤ 0,60 ở ≥80% số ô lưới                 ← chỉ tiêu TÁI LẬP ĐƯỢC
  ② net Sharpe ô trung vị ≥ net Sharpe mua-và-giữ           ← chỉ tiêu KINH TẾ, so tương đối
                                                              không so hằng số tuyệt đối
```

Lý do ② dùng so sánh tương đối: Sharpe của mua-và-giữ dao động 0,52 – 0,72 – 0,96 tuỳ cửa sổ. Một ngưỡng tuyệt đối 0,8 đo **chế độ thị trường**, không đo **chiến lược**.

## 2.8 · ★ PHÁT HIỆN THIẾT KẾ — ba tham số của khung rào chắn mâu thuẫn nhau

`10 §2/C` đặc tả: cắt lỗ `1,2σ̂` · chốt lời `4,0σ̂` · chân trời thời gian 60 ngày · giữ khoảng 35 ngày. **Bốn con số này không tương thích với nhau.**

Dưới chuyển động Brown, thời gian kỳ vọng chạm một trong hai rào là `a·b/σ²`. Với `a = 1,2k·σ_ngày` và `b = 4,0k·σ_ngày` thì thời gian đó là **4,8k² ngày** *(k là hệ số co giãn theo căn thời gian)*.

**Đo trên tín hiệu thật:**

| Thang co giãn | Cắt lỗ | Chốt lời | CHỐT | STOP | **HẾT HẠN** | Tỉ lệ chốt | Ngày TB |
|---|---|---|---|---|---|---|---|
| σ̂ ngày (k=1) | 3,0% | 10,1% | 11 | 12 | **0** | **47,8%** | 6,3 |
| σ̂ tuần (k=7) | 8,0% | 26,7% | 7 | 13 | 3 | 30,4% | 27,6 |
| σ̂ 12 ngày | 10,7% | 35,6% | 6 | 11 | 6 | 26,1% | 33,1 |
| **σ̂ 35 ngày** *(theo `10`)* | 17,9% | 59,6% | 4 | 8 | **11** | 17,4% | 43,7 |

> **Ở cấu hình mà `10` mô tả (giữ 35 ngày), gần MỘT NỬA số lệnh kết thúc bằng HẾT HẠN THỜI GIAN chứ không chạm rào giá.** Nghĩa là **hình dạng cược 4:1 không hề xảy ra** — lợi nhuận thực nhận là "giá đã đi đâu sau 60 ngày", một phân phối hoàn toàn khác. **Toàn bộ lập luận kinh tế của giải pháp C dựa trên payoff 4:1, và payoff đó không tồn tại ở cấu hình đã đặc tả.**
>
> **Cách sửa: chọn hai trong ba, không chọn cả ba.** Muốn payoff 4:1 thật thì phải để rào giá chi phối ⇒ `k ≈ 1` ⇒ **thời gian nắm giữ thực tế khoảng 6 ngày, không phải 35**. Điều đó cũng nhất quán với quy tắc chọn công cụ của `11 §2.2`: giữ 6,3 ngày > ngưỡng 3,33 ngày ⇒ **giao ngay vẫn là công cụ đúng**.

**Hệ quả về danh xưng — và nó không chỉ là chuyện chữ nghĩa:** với `k = 1`, quy tắc **vào lệnh** đến từ Phương Pháp 4, nhưng cấu trúc **ra lệnh** biến nó thành một giao dịch 6 ngày, tức là **Phương Pháp 3: Swing Trading**. Hệ thống thực tế là *"vào bằng tín hiệu xu hướng, thoát bằng rào chắn swing"*. Gọi đúng tên giúp chọn đúng chỉ tiêu đối chứng và đúng bảng chi phí.

## 2.9 · ★ PHÉP ĐO — tín hiệu có hơn điểm vào ngẫu nhiên không?

Đây là phép thử mà `11 §8.2` đòi: so với **tỉ lệ nền khớp cửa sổ**, không so với 50%.

```
Tín hiệu thật (ô 50/150/20):   11/23 = 47,8%   khoảng tin cậy 95%: [27,4% ; 68,2%]
Tỉ lệ nền (mọi ngày làm điểm vào, n=1.980):   23,7%
Null random walk không trôi:                  23,1%     ← khớp gần hoàn hảo với nền đo được
Hoán vị 20.000 lần, p-value:                  0,009
```

**Nhưng ô 50/150/20 là ô tôi chọn sau khi nhìn bảng Sharpe — đó là thiên lệch chọn lọc.** Chạy lại phép hoán vị trên **cả 27 ô**:

| | Kết quả |
|---|---|
| Số ô có p < 0,05 (thô) | **6/27** |
| Sau hiệu chỉnh Benjamini–Hochberg q = 0,10 | **0/27 sống sót** |
| **Phép thử đúng** — một giả thuyết, thống kê = tỉ lệ chốt của **ô trung vị** | 30,0% · null 23,4% · **p = 0,237** |
| Trung bình số lệnh mỗi ô | **22,3** |

> **Ba lớp đọc, phải đọc đủ cả ba:**
>
> **① Con số thô nghiêng về phía tốt.** Ô trung vị 30,0% so với nền 23,7% và hoà vốn 22,0% — biên **+8,0 điểm** so hoà vốn. Dấu đúng.
>
> **② Nhưng không có ý nghĩa thống kê.** p = 0,237. Với 22 lệnh mỗi ô, đây **chính xác** là điều `11 §7.2` dự báo: cần 229 lệnh độc lập, có 22. Phép đo **không thể** phân định, và biết trước là nó không thể.
>
> **③ Cấu trúc thắng-thua thì KHÔNG ngẫu nhiên.** Cả chín ô có `Donchian = 20` xếp trên cùng (p = 0,021 – 0,080); **mọi** ô có Donchian 55 hoặc 100 đều không đáng kể (p = 0,31 – 0,62). Một mẫu hình đơn điệu theo đúng một tham số không phải hình dạng của nhiễu thuần.
>
> **Ghi chú kỹ thuật quan trọng:** áp Benjamini–Hochberg lên 27 biến thể của **cùng một quy tắc** trên **cùng một chuỗi giá** là **dùng sai công cụ** — các phép thử đó tương quan gần như hoàn toàn, và Benjamini–Hochberg giả định độc lập tương đối. "0/27 sống sót" ở đây là **hiện vật của phương pháp**, không phải phán quyết về hiện tượng. Cách đúng là **một giả thuyết, một thống kê (ô trung vị)** — và nó cho p = 0,237.

## 2.10 · Kết luận về Phương Pháp 4

| Khẳng định | Trạng thái sau khi đo |
|---|---|
| Có edge định hướng | 🔶 **Dấu đúng, không chứng minh được** (p = 0,237, và sẽ không chứng minh được trong nhiều năm) |
| Sinh lợi nhuận vượt mua-và-giữ | ❌ **Không tái lập** — ô trung vị 0,47 so với 0,59 |
| Cắt sụt giảm | ✅ **Tái lập 54/54, tỉ số ổn định 0,36 – 0,39** |
| Tham số chọn được | ❌ **Không** — tương quan hạng +0,19 |
| Xứng đáng là quy tắc hướng sơ cấp | ✅ **Có** — nhưng vì lý do **cắt đuôi và có bằng chứng ngoại sinh dày**, không phải vì lợi nhuận |

---

# PHẦN 3 · PHƯƠNG PHÁP 5: SMART MONEY CONCEPTS & PRICE ACTION HIỆN ĐẠI

## 3.1 · Giải phẫu đầy đủ — mười lăm khái niệm, phán quyết từng cái

| Khái niệm | Khẳng định | Có mã hoá khách quan được? | Phán quyết |
|---|---|---|---|
| **Order block** | Nến cuối trước cú dịch chuyển mạnh = "dấu chân tổ chức" | ❌ "cú dịch chuyển mạnh" không có định nghĩa duy nhất | **Bác** — tổ chức đi lệnh chia nhỏ qua nhiều giờ, không để lại dấu một nến |
| **Breaker block** | Order block bị phá rồi đảo vai trò | ❌ kế thừa mơ hồ từ trên | Bác |
| **Mitigation block** | Nơi "tổ chức gỡ vị thế lỗ" | ❌ | Bác — không quan sát được |
| **Fair Value Gap** | Khoảng trống ba nến, "phải được lấp" | ✅ mã hoá được | **Bác bằng dữ liệu** — mục 3.3 |
| **Liquidity pool** | Dừng lỗ cụm ngoài đỉnh/đáy | ✅ mã hoá được | **Cơ chế thật** (Osler) — nhưng xem 3.4 |
| **Buy/sell-side liquidity** | Đổi tên cho trên | ✅ | Trùng lặp |
| **Inducement** | Cú dụ trước cú thật | ❌ chỉ nhận ra sau khi biết kết quả | Bác — hậu nghiệm |
| **Break of structure** | Phá đỉnh/đáy cấu trúc | ✅ nếu định nghĩa swing chặt | ≡ phá vỡ biên — **đã có trong Phương Pháp 4** |
| **Change of character** | Đảo cấu trúc | 🔶 phụ thuộc định nghĩa swing | ≡ tín hiệu thoát của Phương Pháp 4 |
| **Optimal trade entry** (Fib 62–79%) | Vùng vào tối ưu | ✅ | **Bác** — điểm đảo chiều không cụm tại mức Fibonacci (Batchelor & Ramyar) |
| **Premium/discount array** | Nửa trên "đắt", nửa dưới "rẻ" | ✅ | Tầm thường — chỉ là vị trí trong biên độ |
| **Killzone** | Khung giờ có tên riêng | ✅ | ≡ **hiệu ứng phiên**, đã có trong nhóm thời gian |
| **Judas swing** | Cú giả đầu phiên | ❌ | Bác — hậu nghiệm |
| **Silver bullet** | Cửa sổ một giờ cố định | ✅ | Không cơ chế; và khung giờ nằm sau bức tường phí |
| **Power of 3 / AMD** | Tích luỹ – thao túng – phân phối | ❌ gán nhãn chỉ làm được sau | Bác — trùng Wyckoff, cùng vấn đề |

**Đếm lại: trong mười lăm khái niệm, chỉ hai cái vừa mã hoá được vừa không trùng với thứ đã có — Fair Value Gap và Liquidity pool.** Cả hai được đo ở mục 3.3 và 3.4, và **cả hai đều thất bại**.

## 3.2 · Vì sao hệ thuật ngữ này không thể bác bỏ được — và đó là tính năng chứ không phải lỗi

Ba cơ chế thoát hiểm được xây sẵn vào cấu trúc khái niệm:

| Cơ chế thoát | Dạng thường gặp | Hệ quả logic |
|---|---|---|
| **Xác định hậu nghiệm** | *"Đó không phải order block hợp lệ"* — nói sau khi giá đã đi ngược | Mọi phản ví dụ đều bị loại khỏi mẫu ⇒ giả thuyết không bao giờ sai |
| **Phân cấp bối cảnh** | *"Đúng ở khung ngày nhưng khung giờ chưa xác nhận"* | Luôn tồn tại một khung thời gian giải thích được kết quả |
| **Quy lỗi cho người học** | *"Phương pháp đúng, bạn áp dụng sai"* | Thất bại trở thành bằng chứng cần học thêm |

> Ba cơ chế này cộng lại tạo ra một hệ **không sinh ra dự đoán kiểm tra được**. Và điều đó **không phải khiếm khuyết theo góc nhìn của người bán khoá học** — doanh thu dạy học là dòng tiền tất định, lợi nhuận giao dịch là dòng tiền ngẫu nhiên; một người hợp lý sẽ chọn dạy. Tính không bác bỏ được chính là thứ giữ cho khách hàng mua khoá nâng cao.

## 3.3 · ★ PHÉP ĐO — "Fair Value Gap phải được lấp"

**Định nghĩa dùng để đo** (bản chặt nhất, không mơ hồ): khoảng trống tăng tại nến `t` khi `low[t] > high[t−2]`. "Được lấp" = giá thấp nhất chạm lại mức `high[t−2]` trong cửa sổ W ngày.

**Tỉ lệ nền khớp cửa sổ** — đây là phần mà mọi tài liệu Smart Money Concepts bỏ qua: lấy một ngày ngẫu nhiên trong mẫu, đặt một mức giá **cách giá đóng đúng bằng độ sâu của khoảng trống**, hỏi mức đó có bị chạm trong W ngày không.

| Cửa sổ | Fair Value Gap được lấp | **Tỉ lệ nền cùng độ sâu** | Chênh |
|---|---|---|---|
| 5 ngày | 50,0% | 45,5% | **+4,5 điểm** |
| 10 ngày | 59,8% | 60,7% | **−0,9 điểm** |
| 20 ngày | 69,4% | 70,3% | **−0,9 điểm** |
| 60 ngày | 79,5% | **85,1%** | **−5,6 điểm** |

*(223 khoảng trống tăng trên 2.062 nến — 10,8% số nến)*

> **Khẳng định "Fair Value Gap phải được lấp" ĐÚNG — và hoàn toàn vô nội dung.** Nó đúng vì **mọi mức giá ở cùng độ sâu đều được lấp với tỉ lệ tương đương hoặc cao hơn**. Ở cửa sổ 60 ngày, khoảng trống thậm chí được lấp **ÍT hơn** mức ngẫu nhiên 5,6 điểm.
>
> Đây là **bẫy tỉ lệ nền** ở dạng thuần khiết nhất, đo được bằng ba mươi dòng mã trên dữ liệu công khai. Rằng nó vẫn được dạy rộng rãi là một dữ kiện về thị trường dạy học, không phải về thị trường tài chính.

## 3.4 · ★ PHÉP ĐO — quét rồi lấy lại, và số tròn

Đây là hai khẳng định mà `11` cho là **sống sót** vì có nền Osler (2000, 2003) trên *Journal of Finance*. Tôi tự tái lập, theo đúng yêu cầu của `09` — *"nền literature là ngoại hối/cổ phiếu, phải tự tái lập trên dữ liệu Binance trước khi tin"*.

**Quét rồi lấy lại:** `low[t] < min(low[t−N…t−1]) × 0,999` **và** `close[t] > min(low[t−N…t−1])`.

| N | Số lần | Lợi suất 5 ngày sau — tín hiệu | Nền | Chênh | p |
|---|---|---|---|---|---|
| 10 | 145 | **−0,30%** | +0,43% | **−0,73 điểm** | 0,918 |
| 20 | 84 | **−0,25%** | +0,43% | **−0,68 điểm** | 0,833 |

**Số tròn** (mốc 10.000 USD), lợi suất 3 ngày sau:

| Vị trí giá | n | Lợi suất sau | Nền |
|---|---|---|---|
| Ngay **dưới** mốc tròn (0–5%) | 116 | +0,06% | +0,26% |
| Ngay **trên** mốc tròn (95–100%) | 101 | +0,35% | +0,26% |
| **Giữa khoảng** (45–55%) | 140 | **+1,24%** | +0,26% |

> **Cả hai đều thất bại, và quét-rồi-lấy-lại thất bại theo chiều NGƯỢC LẠI** — edge âm 0,7 điểm, p = 0,92. Số tròn không cho hiệu ứng nào, và ô mạnh nhất lại là **giữa khoảng** — đúng nơi lý thuyết nói không có gì.
>
> **Phản biện công bằng, và câu trả lời:** Osler nghiên cứu sổ lệnh ngoại hối **trong ngày**, không phải nến ngày crypto. Có thể hiệu ứng tồn tại ở khung phút và bị phá huỷ khi gộp về ngày. Câu trả lời cho dự án này: **kể cả nếu đúng như vậy, nó vẫn không dùng được** — mọi hiệu ứng chỉ tồn tại trong ngày đều nằm **sau bức tường phí** (`11 §2.1`: khung 4 giờ cần thắng 63 – 70%). Một edge không với tới được thì không phải edge.

## 3.5 · Kết luận về Phương Pháp 5 — và sửa đổi đối với `11`

| Đặc trưng `11` cấp suất | Kết quả đo | Quyết định |
|---|---|---|
| `sweep_reclaim_flag` | Edge **âm**, p = 0,92 | ❌ **Cắt** |
| `dist_to_round_number_pct` | Không hiệu ứng | ❌ **Cắt** *(đã ở danh sách chờ)* |
| `dist_to_prior_swing_sigma` | Chưa bác — đây là **thước đo cấu trúc**, không phải khẳng định của Smart Money Concepts | ✅ **Giữ một suất** |

**Hai suất giải phóng** chuyển sang: một cho nhóm chế độ (`realized_vol_ratio_5d_20d` — cấu trúc kỳ hạn biến động), một cho nhóm dòng lệnh (`cvd_divergence_spot_perp` khi có dữ liệu).

**Giữ nguyên lệnh cấm định danh** — quan trọng hơn trước, không kém: giờ đã có bằng chứng rằng các khái niệm này không có nội dung dự báo, nên một biến tên `order_block` trong mã nguồn chỉ có thể là cửa ngõ để chỉnh tham số theo câu chuyện.

> **Điều đáng ghi nhận về quy trình:** `11` xếp Phương Pháp 5 ở mức 4/5 dựa trên literature ngoại hối. Ba phép đo, chưa tới một giờ, trên dữ liệu đã có sẵn trên đĩa, hạ nó xuống 1/5. **Chi phí của việc tự tái lập nhỏ hơn nhiều lần chi phí của việc tin nhầm** — và đây là bằng chứng cụ thể cho nguyên tắc đó, sinh ra trong chính dự án này.

---

# PHẦN 4 · PHƯƠNG PHÁP 7: FUNDING RATE & CASH-AND-CARRY ARBITRAGE

> **Không đo được trong phiên này** — `data/raw` chưa có lịch sử funding. Phần này là phân tích cơ chế cộng với các số đã kiểm ở `09`. **Mục 4.4 nêu một phát hiện thiết kế mà tôi cho là quan trọng nhất của cả tài liệu.**

## 4.1 · Cơ chế funding của Binance — chi tiết cần thiết để dùng đúng

```
funding = clamp( chỉ_số_chênh_lệch + clamp(lãi_suất − chỉ_số_chênh_lệch, ±0,05%), ±giới_hạn )
```

Ba chi tiết quyết định cách diễn giải:

| Chi tiết | Nội dung | Hệ quả |
|---|---|---|
| **Thành phần lãi suất mặc định 0,01%/8h** | Khi chênh lệch giá vĩnh cửu và giao ngay ≈ 0, funding **rơi về 0,01%** | Mức 0,01% là **sàn mặc định, không phải tín hiệu**. Diễn giải nó là "thị trường đang nghiêng mua" là sai cơ bản |
| **Thanh toán ba lần mỗi ngày** (00:00, 08:00, 16:00 UTC) | Chỉ ai **đang giữ vị thế tại đúng thời điểm** mới trả hoặc nhận | Chi phí funding là **hàm bậc thang**, không liên tục. Một lệnh 7 ngày trả 21 lần |
| **Giới hạn trần** thay đổi theo cặp và mức ký quỹ | | Khi thị trường cực đoan, funding **bị chặn** — chi phí thật của việc giữ vị thế chuyển sang chênh lệch giá |

## 4.2 · Ba vai trò — và vai trò quan trọng nhất không phải vai trò tên gọi gợi ý

**Vai trò một — hàm chi phí.** Đã đặc tả đầy đủ ở `11 §5.2`. Nhắc lại kết quả cốt lõi: `p*_min(vĩnh cửu) = 50% + √(c₀·f)/A ≈ 53%` bất biến theo tài sản, trong khi giao ngay không có sàn.

**Vai trò hai — hai suất đặc trưng, chiều tiếp diễn** (`09 §2` đã bác chiều ngược trên toàn bộ lịch sử bốn đồng).

**Vai trò ba — sản phẩm riêng.** Hoà vốn 11,4 ngày · lợi suất trên tổng vốn khoảng 4,5%/năm ở kịch bản thực tế · ngưỡng vốn hợp lý khoảng 50.000 USD (`11 §7.4`).

## 4.3 · Biến thể có hội tụ tất định — chênh lệch giá hợp đồng kỳ hạn

Khác biệt cấu trúc so với hợp đồng vĩnh cửu, và nó đáng kể:

| | Vĩnh cửu | **Kỳ hạn quý** |
|---|---|---|
| Nguồn thu | Funding — **có thể đảo dấu bất kỳ lúc nào** | Chênh lệch giá — **hội tụ về 0 TẤT ĐỊNH tại đáo hạn** |
| Rủi ro chính | Funding âm co cụm hàng tuần | Ký quỹ chân bán khống nếu giá tăng mạnh giữa kỳ |
| Vốn | Linh hoạt | **Khoá tới đáo hạn** |
| Số đã kiểm (BIS WP 1087, đọc bản gốc) | — | Trung bình **6 – 8%/năm**, thường xuyên vượt 20%, có lúc trên 40% (đầu 2019, đầu 2020, 3/2021) |

> Đối với một người vận hành ngoài giờ, **hội tụ tất định đáng giá hơn lợi suất cao hơn**: nó loại bỏ hoàn toàn việc phải theo dõi và quyết định thời điểm thoát — nguồn sai sót vận hành lớn nhất của chiến lược hai chân.

## 4.4 · ★★ PHÁT HIỆN — vế chi phí DỰ BÁO ĐƯỢC trong khi vế lợi nhuận thì không

Đây là hệ quả chưa được nêu ở bất kỳ tài liệu nào trong repo, và nó đổi thứ tự ưu tiên xây dựng.

Phương trình quyết định là:

```
p_required = 0,5 + c(H, công cụ) / (2 · E|move|)
```

Cả hai vế phải của phân số đều là **đại lượng phải dự báo**. Và chúng có **năng lực dự báo hoàn toàn khác nhau**:

| Thành phần | Bản chất | Năng lực dự báo |
|---|---|---|
| **Hướng** (vế cần vượt `p_required`) | Gần martingale | **R² 0 – 1%** — trần cứng |
| `E\|move\|` (mẫu số) | Biến động, tự tương quan 0,63 – 0,74 | **R² 0,4 – 0,6** |
| `c` — thành phần phí | Hằng số đã biết | **Tất định** |
| **`c` — thành phần funding** | Chuỗi tự tương quan mạnh (mức 0,01% là điểm hút) | **Cao — chưa đo, nhưng cùng họ với biến động** |

> **Cả TỬ SỐ lẫn MẪU SỐ của ngưỡng quyết định đều dự báo được tốt. Chỉ đại lượng bị đem ra so với nó là không.**
>
> Điều này không cứu được bài toán hướng. Nhưng nó nói rằng **`p_required` là một đại lượng bạn biết chính xác hơn nhiều so với thứ bạn đem so với nó** — và vì thế cổng phí là bộ phận **đáng tin cậy nhất** của toàn hệ thống. Cổng đóng hay mở là một quyết định gần như tất định; chỉ *cái đi qua cổng* mới là canh bạc.
>
> **Hệ quả xây dựng: dự báo funding thuộc cùng đợt với dự báo biến động, không phải đợt sau.** Cả hai đều là đại lượng dự báo được, cả hai đều vào cùng một phương trình, và cả hai đều **không cần đặt một đồng nào** để có giá trị.

## 4.5 · ★ CẢNH BÁO — cổng biến động và cổng funding có thể triệt tiêu nhau

Một cái bẫy chưa ai trong bốn kiến trúc của `10` nêu:

```
Cổng phí hạ p_required bằng cách chỉ vào lệnh khi E|move| LỚN.
Nhưng funding cũng tăng khi biến động tăng — cả hai cùng phản ánh đòn bẩy chen chúc.
⟹ Chọn lúc E|move| cao có thể ĐỒNG NGHĨA với chọn lúc funding đắt.
⟹ Mẫu số tăng, tử số cũng tăng, và cổng KHÔNG MUA ĐƯỢC GÌ.
```

Trên giao ngay bẫy này không tồn tại (không có funding). **Trên hợp đồng vĩnh cửu thì nó có thể vô hiệu hoá toàn bộ ý tưởng cổng phí.**

**Phép đo bắt buộc, ngay khi có dữ liệu funding** *(bổ sung vào bộ tám phép đo của `11 §8.2` — thay thế phép đo về quét-rồi-lấy-lại vừa bị bác)*:

> **Đo tương quan giữa `E|move|` và `funding` theo nhóm ba.** Nếu tương quan dương mạnh, cổng phí trên hợp đồng vĩnh cửu là ảo giác, và mặc định **giao ngay** trở thành bắt buộc chứ không còn là khuyến nghị.

## 4.6 · Kết luận về Phương Pháp 7

| Vai trò | Trạng thái |
|---|---|
| **Hàm chi phí** | ✅ **Bắt buộc, xây trước tiên** — 30 dòng mã, không cần dữ liệu mới |
| **Dự báo funding** | ✅ **Nâng lên cùng đợt với dự báo biến động** — mục 4.4 |
| Đặc trưng chen chúc | 🔶 Cần dữ liệu, chiều tiếp diễn |
| Cảnh báo cổng triệt tiêu | ⚠️ **Phải đo trước khi tin vào cổng phí trên hợp đồng vĩnh cửu** |
| Sản phẩm carry | 🔶 Hoãn; bản kỳ hạn quý ưu việt hơn cho một người vận hành |

---

# PHẦN 5 · PHƯƠNG PHÁP 8: ON-CHAIN & NARRATIVE TRADING

> **Không đo được trong phiên này** — cần dữ liệu on-chain (không có) và ảnh chụp vũ trụ nhiều tháng (có đúng một).

## 5.1 · Vấn đề dữ liệu theo thời điểm — sâu hơn mọi tài liệu thường nói

Chỉ số on-chain có **ba lớp hiệu chỉnh hồi tố**, và lớp thứ hai là lớp giết chết mọi backtest:

| Lớp | Cơ chế | Mức độ |
|---|---|---|
| **① Tổ chức lại chuỗi** | Vài khối cuối có thể bị thay | Nhỏ, vài giờ |
| **② ★ Sửa đổi thuật toán gom nhóm thực thể** | Nhà cung cấp dùng heuristic để gom địa chỉ thành "thực thể" (sàn, thợ đào, cá voi). Khi heuristic được cải tiến, **toàn bộ chuỗi lịch sử được tính lại** | **Rất lớn** — chuỗi bạn tải hôm nay **khác** chuỗi tồn tại ba năm trước |
| **③ Dán nhãn địa chỉ sàn trôi** | Địa chỉ mới được phát hiện và gán nhãn lùi về quá khứ | Lớn với mọi chỉ số dòng tiền vào/ra sàn |

> **Hệ quả:** backtest một quy tắc dựa trên MVRV bằng chuỗi tải hôm nay là **rò rỉ tương lai được đóng gói sẵn** — bạn đang dùng cách phân loại thực thể *của năm 2026* để ra quyết định *của năm 2021*. Không có nhà cung cấp miễn phí nào giữ kho lưu trữ theo thời điểm, và bề mặt rò rỉ này **không có phép thử nào trong `tests/test_leakage.py` bắt được**, vì dữ liệu tự nó đã bị nhiễm trước khi vào đường ống.

## 5.2 · Vấn đề n ≈ 4 — định lượng nó

Chỉ số chu kỳ (MVRV, SOPR, NUPL) có **bốn chu kỳ** kể từ 2011. Một ngưỡng ước lượng trên ba chu kỳ và kiểm trên một chu kỳ có sai số chuẩn xấp xỉ `σ/√3`. Với biến thiên ngưỡng giữa các chu kỳ quan sát được (đỉnh MVRV giảm dần qua từng chu kỳ khi thị trường trưởng thành), **sai số chuẩn cùng bậc độ lớn với chính hiệu ứng**.

> Nói cách khác: **không có phép thử thống kê nào phân biệt được "ngưỡng MVRV có hiệu lực" với "bốn lần trùng hợp"**. Đây không phải lời kêu gọi thận trọng — đó là mệnh đề về giới hạn thông tin. Dùng làm **bối cảnh hiển thị** thì được; dùng để **chọn thời điểm** thì không, và không bao giờ.

## 5.3 · Mở khoá token — cơ chế đúng, và vì sao cửa sổ giao dịch hẹp hơn nó có vẻ

Số liệu Keyrock (hơn 16.000 sự kiện): **khoảng 90% kèm áp lực giá âm, phần lớn mức giảm rơi vào 30 ngày TRƯỚC ngày mở khoá**, dốc nhất tuần cuối, ổn định lại khoảng 14 ngày sau.

**Cơ chế đúng, và nó tinh tế hơn "cung tăng thì giá giảm":** lịch mở khoá là **thông tin công khai từ trước**. Người bán hợp lý không đợi tới ngày mở khoá — họ bán trước bằng cách bán khống hoặc giảm vị thế. Vì thế mức giảm xuất hiện **trước** sự kiện. Đây là thị trường hoạt động đúng, không phải sai lệch.

**Hệ quả cho việc khai thác — và đây là phần các bài viết bỏ qua:** nếu hiệu ứng đã được phản ánh trước, thì **giá trị của tín hiệu nằm ở việc TRÁNH, không phải ở việc kiếm lời**. Đúng như `09 §7` xếp nó: **bộ chặn**, không phải nguồn alpha. Và vì `10 §5.14` đã xác định không có nguồn miễn phí đáng tin, bộ chặn này đã bị cắt. **Giữ nguyên quyết định cắt.**

## 5.4 · ★ Narrative Trading quy tắc hoá chính là động lượng cắt ngang — đặc tả đầy đủ

```
Mỗi kỳ tái cân bằng (khuyến nghị: hằng tuần, không phải hằng ngày):
  ① Lấy ẢNH CHỤP VŨ TRỤ CỦA ĐÚNG KỲ ĐÓ            ← điểm chết người, xem 5.5
  ② Lọc: khối lượng giao dịch trung vị 30 ngày ≥ ngưỡng thanh khoản
  ③ Xếp hạng theo lợi suất N ngày qua (N = 7 … 28), BỎ QUA tuần gần nhất
     (bỏ tuần gần nhất để tránh hiệu ứng đảo chiều ngắn hạn — chuẩn trong literature)
  ④ Mua nhóm 20% đầu, trọng số đều hoặc theo nghịch đảo biến động
  ⑤ Nắm giữ tới kỳ sau. CHỈ MUA, không bán khống nhóm cuối
```

**Vì sao chỉ mua và chỉ nhóm thanh khoản cao:** Liu, Tsyvinski & Wu (*Journal of Finance* 2022) đo được **4,2% mỗi tuần có ý nghĩa thống kê ở nhóm đồng trên trung vị vốn hoá**, nhưng chỉ **0,6% và không có ý nghĩa** ở nhóm nhỏ. Bản bán khống nhóm cuối yêu cầu vay đồng nhỏ — nơi chi phí vay vọt và trượt giá 0,2 – 1%.

**Vì sao nó là "narrative" đã quy tắc hoá:** narrative là cơ chế nhân quả (một câu chuyện thu hút dòng tiền), xếp hạng động lượng là **thước đo quan sát được của cùng hiện tượng đó**. Bạn không cần biết câu chuyện là gì; bạn chỉ cần đo dòng tiền nó tạo ra. Điều này loại bỏ toàn bộ phần không quy tắc hoá được (đọc mạng xã hội, đánh giá "đội ngũ dự án") và giữ lại phần đo được.

## 5.5 · ★ Bẫy sống sót — và một khả năng có thể tiết kiệm mười hai tháng

**Bẫy:** xếp hạng trên danh sách bốn mươi đồng **của hôm nay** rồi chạy ngược ba năm là dùng thông tin *"đồng này còn tồn tại và còn trong top 40 vào năm 2026"* để ra quyết định năm 2023. Những đồng đã chết bị loại khỏi mẫu — chính những đồng mà chiến lược sẽ mua và mất tiền. Kết quả đẹp một cách giả tạo, và **không phép thử rò rỉ nào trong đường ống bắt được**, vì rò rỉ nằm ở khâu **chọn mẫu**, trước cả khi dữ liệu vào.

**Trạng thái repo:** `data/raw/universe/` có đúng một ảnh chụp — `month=2026-08`. Cần ít nhất mười hai tháng.

**★ Khả năng chưa được điều tra — có thể dựng lại vũ trụ quá khứ:**

> Kho lưu trữ dữ liệu công khai của Binance chứa dữ liệu lịch sử **theo từng cặp, bao gồm cả các cặp đã bị huỷ niêm yết**. Nếu đúng như vậy thì **danh sách cặp tồn tại tại một thời điểm quá khứ có thể tái tạo được** — bằng cách xác định, với mỗi cặp, khoảng thời gian nó có dữ liệu.
>
> Nếu tái tạo được, **tầng động lượng cắt ngang mở khoá ngay thay vì phải chờ mười hai tháng** — và đó là phương án dự phòng số một nếu GATE 1 trượt.
>
> **Đây là giả thuyết, chưa kiểm chứng trong phiên này.** Đề xuất: một nhiệm vụ điều tra **hai giờ**, đặt ngay sau tác vụ định kỳ ngày một. Tỉ số giá trị trên chi phí của nó cao hơn bất kỳ mục nào khác trong toàn bộ kế hoạch.

**Bất kể kết quả điều tra ra sao, tác vụ chụp vũ trữ hằng tháng vẫn phải bật hôm nay** — nó là bảo hiểm rẻ cho trường hợp giả thuyết trên sai.

## 5.6 · Kết luận về Phương Pháp 8

| Nhánh | Trạng thái |
|---|---|
| Chỉ số định giá on-chain | ❌ **Bối cảnh hiển thị, không bao giờ chọn thời điểm** — n≈4 cộng rò rỉ theo thời điểm không sửa được |
| Lịch mở khoá token | ❌ **Giữ nguyên quyết định cắt** — không nguồn miễn phí đáng tin |
| Theo dấu cá voi / sao chép ví | ❌ Bác |
| **Narrative → động lượng cắt ngang** | ✅ **Bằng chứng vững nhất trong họ, và là dự phòng số một** — bị khoá bởi ảnh chụp vũ trụ |
| **Điều tra tái tạo vũ trụ quá khứ** | ★ **Hai giờ công, có thể mở khoá mười hai tháng** |

---

# PHẦN 6 · CHIẾN LƯỢC THIẾT KẾ MODULE PREDICTION

## 6.1 · Bảy nguyên tắc — mỗi nguyên tắc truy được về một phép đo

| # | Nguyên tắc | Truy về đâu |
|---|---|---|
| **1** | **Đo cái TÁI LẬP ĐƯỢC, không đo cái ấn tượng.** Chọn chỉ tiêu theo độ ổn định giữa các chế độ, rồi mới xét độ hấp dẫn | Tỉ số sụt giảm 0,36 / 0,39 so với Sharpe 0,07 / 0,77 — mục 2.7 |
| **2** | **Tỉ lệ nền khớp cửa sổ là đối chứng bắt buộc của mọi khẳng định.** So với 50% hoặc với 0 là vô nghĩa | Fair Value Gap 79,5% so với nền 85,1% — mục 3.3 |
| **3** | **Quy tắc giữ cái bạn BIẾT; học máy giữ cái bạn chỉ ĐO được; không bao giờ để học máy giữ cái bạn đã biết** | `10 §6`, được ba phép đo của tài liệu này củng cố |
| **4** | **Cổng phí là bộ phận đáng tin nhất của cả hệ** — cả tử số lẫn mẫu số của nó đều dự báo được tốt, chỉ thứ đem so với nó là không | Mục 4.4 |
| **5** | **Không tham số nào được chọn bằng tối ưu hoá.** Khi các biến thể không phân biệt được, **tổ hợp tất cả** thay vì chọn một | Tương quan hạng +0,19 · độ lệch chuẩn Sharpe giữa 27 ô = 0,31 — mục 2.6 và 6.5 |
| **6** | **Im lặng là trạng thái được thiết kế, và nó có ngân sách bằng số đăng ký trước** | 23 sự kiện trong 5,6 năm trên một đồng — mục 2.8 |
| **7** | **Mỗi tầng phải sai được một mình.** Một tầng hỏng không được làm hỏng tầng khác, và phải có cách phát hiện ra nó hỏng | Nguyên tắc kỹ thuật, không phải phép đo |

## 6.2 · Kiến trúc phân tầng

```
 ┌─ L0 · TIẾP NHẬN & ĐỘ TƯƠI ────────────────────────── QUY TẮC ─┐
 │   gộp nến 1h → 4h/1d · khử trùng lặp theo open_time            │
 │   máy trạng thái: LIVE / CHẬM / MẤT KẾT NỐI / CŨ                │
 │   ⛔ CHẬM hoặc MẤT KẾT NỐI ⇒ toàn hệ trả «KHÔNG CÓ Ý KIẾN»      │
 │      late=True là CHẶN PREDICT, không phải cờ hiển thị          │
 └────────────────────────────────────────────────────────────────┘
 ┌─ L1 · LÕI ĐẶC TRƯNG ──────────────────────────────── QUY TẮC ─┐
 │   MỘT đường mã dùng chung batch ↔ live                          │
 │   shift_all(1) · assert_scale_free() · MỘT hàm biến động        │
 │   ✅ phép thử rò rỉ thứ sáu: hai đường, assert khớp 1e-6         │
 └────────────────────────────────────────────────────────────────┘
 ┌─ L2 · HAI ĐẠI LƯỢNG DỰ BÁO ĐƯỢC ─────────────────── HỌC MÁY ─┐
 │   σ̂  ← HAR-RV 4 hệ số   (dự phòng: EWMA λ=0,94 tất định)       │
 │   f̂  ← dự báo funding   (cùng đợt, không phải đợt sau — §4.4)  │
 │   ⚠️  ĐÂY LÀ TẦNG DUY NHẤT BẠN TỰ CHỨNG MINH ĐƯỢC (11 quan sát) │
 └────────────────────────────────────────────────────────────────┘
 ┌─ L3 · MỘT PHÂN PHỐI F ────────────────────────────── QUY TẮC ─┐
 │   q_α = last_close · exp(z_α · σ̂ · √H)                         │
 │   p_up = 1 − F(0)          ← SUY RA, không mô hình riêng        │
 │   expected_vol_pct = σ̂                                          │
 │   ✅ BẤT BIẾN: ba đầu ra là BA CÁCH ĐỌC của MỘT F               │
 │      ⇒ mâu thuẫn «p_up=0,62 mà q50<last_close» BẤT KHẢ          │
 └────────────────────────────────────────────────────────────────┘
 ┌─ L4 · CỔNG PHÍ ───────────────────────────────────── QUY TẮC ─┐
 │   E|move| = σ̂ · √(2/π) · √H                                    │
 │   c = c(H, công cụ, f̂)      ← funding × số ngày nắm giữ        │
 │   p_required = 0,5 + c / (2·E|move|)     TÍNH TỪNG NẾN, TRONG MÃ│
 │   công cụ = giao ngay nếu H > (c_ngay − c_vc)/f̂, ngược lại vc  │
 └────────────────────────────────────────────────────────────────┘
 ┌─ L5 · HƯỚNG SƠ CẤP ───────────────────────────────── QUY TẮC ─┐
 │   TỔ HỢP 27 ô lưới xu hướng — KHÔNG chọn một ô (§6.5)          │
 │   giao ngay, chỉ mua hoặc đứng ngoài, khớp giá mở nến kế tiếp   │
 │   sinh SỰ KIỆN: vào · cắt lỗ 1,2σ̂ · chốt lời 4,0σ̂ · hết hạn    │
 │   ⚠️ k = 1 (thang σ̂ NGÀY) — nếu không, rào thời gian chi phối   │
 └────────────────────────────────────────────────────────────────┘
 ┌─ L6 · LỌC BỎ ─────────────────────────────────────── HỌC MÁY ─┐
 │   «sự kiện này chạm chốt lời trước cắt lỗ không?»               │
 │   LightGBM độ sâu 3 · ≤15 lá · ≤18 đặc trưng · ≤300 cây         │
 │   trọng số mẫu theo ĐỘ DUY NHẤT NHÃN                            │
 │   ⛔ KHÔNG BAO GIỜ đảo hướng của L5 — chỉ được LOẠI BỎ           │
 │   ⛔ 99% số nến không gọi tới tầng này                          │
 └────────────────────────────────────────────────────────────────┘
 ┌─ L7 · ĐỊNH CỠ & VETO ─────────────────────── HỌC MÁY + QUY TẮC ┐
 │   size = min(¼Kelly, vol_target/σ̂, trần 1%)                     │
 │   VETO ép size = 0 bất kể L1–L6: lỗ ngày 2% · tương quan ·      │
 │   nhịp tim · công tắc dừng                                      │
 └────────────────────────────────────────────────────────────────┘
 ┌─ L8 · ĐỐI SOÁT & BẢNG ĐIỂM ───────────────────────── QUY TẮC ─┐
 │   OutcomeReconciler · QLIKE · độ phủ · CRPSS/BSS · FVA          │
 │   ✅ chạy VÔ ĐIỀU KIỆN, kể cả khi hệ im lặng hoàn toàn          │
 └────────────────────────────────────────────────────────────────┘
```

## 6.3 · Hợp đồng dữ liệu — bản cụ thể

```python
@dataclass(frozen=True)          # ★ frozen: không tầng nào sửa được output tầng khác
class Prediction:
    # ── định danh — khoá idempotent, từ bản ghi ĐẦU TIÊN ──
    symbol: str
    timeframe: str               # "1h" | "4h" | "1d"
    open_time: datetime          # UTC, nến ĐÓNG sinh ra dự đoán này
    model_sha: str               # git hash + hash config
    # ── ba đầu ra: BA CÁCH ĐỌC CỦA MỘT PHÂN PHỐI F ──
    expected_vol_pct: float      # σ̂, nguồn duy nhất
    q10: float; q50: float; q90: float
    p_up: float                  # = 1 − F(0), SUY RA. Không mô hình riêng
    # ── kinh tế học của quyết định — luôn hiện diện, kể cả khi im lặng ──
    p_required: float            # ★ tính trong mã, KHÔNG đọc từ config
    e_move_pct: float
    cost_assumed_pct: float
    instrument: Literal["spot","perp"]     # ĐẦU RA của bảng chi phí, không phải giả định
    # ── ý định giao dịch — None là giá trị HỢP LỆ và THƯỜNG GẶP ──
    trade_intent: Optional[Literal["LONG"]] = None   # không có SHORT (§2.4)
    size_pct: Optional[float] = None
    stop_price: Optional[float] = None
    target_price: Optional[float] = None
    edge_r_net: Optional[float] = None
    # ── trung thực ──
    data_freshness: Literal["live","delayed","disconnected","stale"]
    silence_reason: Optional[str] = None   # ★ vì sao KHÔNG có ý định — bắt buộc khi None
```

> **Ba quyết định thiết kế nằm trong hợp đồng này, không nằm trong tài liệu:**
> ① `p_required` là **trường bắt buộc**, không phải tuỳ chọn — mọi con số phải đứng cạnh hoà vốn của chính nó (`10 mandate 11`).
> ② `silence_reason` **bắt buộc khi `trade_intent is None`** — im lặng phải tự giải thích, nếu không người vận hành sẽ đọc nó là hỏng hóc và hạ ngưỡng.
> ③ Không có giá trị `"SHORT"` trong kiểu dữ liệu — bán khống bị loại **ở tầng kiểu**, không ở tầng quy ước (§2.4).

## 6.4 · Hàm quyết định — nơi duy nhất quyết định được đưa ra

```python
def predict(bars, funding_hist, cfg) -> Prediction:
    """HÀM THUẦN: không đọc đồng hồ, không I/O, không biến toàn cục."""

    # L0 — độ tươi chặn trước mọi thứ
    fresh = freshness(bars)
    if fresh in ("delayed", "disconnected"):
        return no_opinion(fresh, "dữ liệu không đủ tươi")

    # L1–L2 — hai đại lượng dự báo được
    feats  = build_features(bars)          # đã shift_all(1)
    sigma  = har_rv(feats) or ewma(feats, lam=0.94)
    f_hat  = forecast_funding(funding_hist)

    # L3 — MỘT phân phối, ba cách đọc
    F      = LogNormal(mu=0.0, sigma=sigma * sqrt(H))    # VR≈1 ⇒ mu=0
    q10,q50,q90 = F.quantiles(0.10, 0.50, 0.90)
    p_up   = 1 - F.cdf(0)

    # L4 — cổng phí. TÍNH, không đọc config
    e_move = sigma * sqrt(2/pi) * sqrt(H)
    inst   = "spot" if H_days > (C_SPOT - C_PERP)/f_hat else "perp"
    c      = C_SPOT if inst == "spot" else C_PERP + f_hat * H_days
    p_req  = 0.5 + c / (2 * e_move)

    # L5 — hướng sơ cấp: TỔ HỢP, không chọn một ô
    vote   = mean(tsmom_signal(bars, ef, es, dn) for ef, es, dn in GRID_27)

    # ── cổng: ba điều kiện, TẤT CẢ phải đúng ──
    if vote < VOTE_MIN:            return no_opinion(fresh, "tổ hợp xu hướng chưa đủ đồng thuận")
    if p_up <= p_req + 0.02:       return no_opinion(fresh, f"p_up {p_up:.3f} ≤ ngưỡng {p_req:.3f}")

    # L6 — học máy CHỈ ĐƯỢC LOẠI BỎ
    p_win = calibrate(meta_model.predict(feats))
    if p_win < P_WIN_MIN:          return no_opinion(fresh, "lớp lọc loại sự kiện này")

    # L7 — định cỡ và veto
    size = min(kelly_quarter(p_win), VOL_TARGET/sigma, MAX_POS)
    size = apply_vetoes(size)
    if size == 0:                  return no_opinion(fresh, "veto rủi ro")

    return Prediction(..., trade_intent="LONG", size_pct=size, ...)
```

> **Bất biến trung tâm — QUYỀN ĐƠN ĐIỆU:** mọi nhánh của hàm này hoặc trả `no_opinion`, hoặc trả đúng `"LONG"` do L5 quyết. **Không nhánh nào tạo ra hướng.** L6 chỉ xuất hiện ở vị trí có thể `return no_opinion`. Điều này **fuzz-test được**: quét `p_win` trên toàn `[0,1]` với cổng L4 đóng, output phải luôn là `no_opinion`.

## 6.5 · ★ Quyết định thiết kế — tổ hợp 27 ô thay vì chọn một

Phép đo 2.6 cho thấy việc chọn tham số **không mang lại gì** (tương quan hạng +0,19; ô tốt nhất quá khứ = mua-và-giữ ở tương lai). Độ lệch chuẩn Sharpe giữa 27 ô là **0,31** — nghĩa là **chọn một ô là rút một mẫu từ phân phối rộng**.

**Đo thử phương án tổ hợp** — tỉ trọng vị thế = tỉ lệ số ô đang báo MUA:

| Đoạn | Mua-và-giữ | Ô trung vị | Ô tốt nhất *(không biết trước)* | **TỔ HỢP** | Sụt giảm mua-và-giữ | **Sụt giảm tổ hợp** | **Tỉ số** |
|---|---|---|---|---|---|---|---|
| Toàn bộ 2021–26 | 0,59 | 0,47 | 0,89 | **0,57** | −76,6% | **−22,1%** | **0,29** |
| Đoạn 1 (21–23) | 0,52 | 0,07 | 1,04 | **0,35** | −76,6% | **−22,1%** | **0,29** |
| Đoạn 2 (24–26) | 0,72 | 0,77 | 1,17 | **0,92** | −53,0% | **−16,5%** | **0,31** |

**Bốn lý do chọn tổ hợp:**

1. **Vượt ô trung vị ở cả ba đoạn** (0,57 / 0,35 / 0,92 so với 0,47 / 0,07 / 0,77) — mà ô trung vị là kỳ vọng thực tế của việc chọn ngẫu nhiên một ô.
2. **Cắt sụt giảm SÂU HƠN mọi ô đơn lẻ**: tỉ số 0,29 – 0,31 so với 0,36 – 0,39. Và **ổn định trong 0,02 qua ba đoạn** — chỉ tiêu ổn định nhất trong toàn bộ tài liệu.
3. **Xoá bỏ hoàn toàn một quyết định mà phép đo chứng minh là tuỳ tiện.** Không còn câu hỏi "dùng EMA 50 hay 200" để tranh cãi hay để chỉnh lén về sau.
4. **Tỉ trọng liên tục là bộ giảm chấn tự nhiên** — vào lệnh dần khi các ô lần lượt đồng ý, thay vì nhảy 0 → 100%.

**Điều trung thực phải nói kèm: tổ hợp KHÔNG tạo ra lợi nhuận.** Toàn mẫu Sharpe 0,57 so với mua-và-giữ 0,59. Nó làm cho **chỉ tiêu tái lập được trở nên tốt hơn và ổn định hơn**, và nó **loại bỏ một nguồn tự lừa mình**. Đó là toàn bộ điều nó làm, và đó là lý do đủ.

**Chi tiết vận hành:** tổ hợp đổi tỉ trọng khoảng 25 lần mỗi năm (so với 4 lần của một ô). Chi phí đã tính trong số trên. Để giảm thao tác, **rời rạc hoá tỉ trọng thành {0 · 0,25 · 0,50 · 0,75 · 1,00}** — giảm số lần đặt lệnh mà gần như không đổi kết quả.

## 6.6 · Cổng GATE 1 sửa lại

```
CỔNG CŨ (`10`, `11`):   net Sharpe ô trung vị ≥ 0,8
                        ↑ phép đo cho thấy chỉ tiêu này KHÔNG TÁI LẬP (0,07 → 0,77)

CỔNG MỚI — kép, phải đạt CẢ HAI:
  ① TÁI LẬP :  tỉ số sụt giảm (chiến lược / mua-và-giữ) ≤ 0,60
               ở ≥80% số ô lưới, trên MỌI fold walk-forward
  ② KINH TẾ :  net Sharpe của TỔ HỢP ≥ net Sharpe mua-và-giữ
               trên ≥6 trong 8 fold
               ↑ so sánh TƯƠNG ĐỐI: Sharpe mua-và-giữ dao động 0,52–0,96
                 tuỳ cửa sổ, nên ngưỡng tuyệt đối đo CHẾ ĐỘ chứ không đo CHIẾN LƯỢC
```

**Điểm rẽ nhánh, sửa lại theo phép đo:**

| Kết quả | Hành động |
|---|---|
| ① đạt **và** ② đạt | → Xây tầng L6 (lọc bỏ) |
| ① đạt, ② trượt | → **Ship tổ hợp xu hướng như một sản phẩm QUẢN TRỊ RỦI RO**, không phải sản phẩm alpha. Trung thực và có giá trị thật |
| ① trượt | → **Dừng nhánh giao dịch, ship đài quan trắc.** Nếu ngay cả tỉ số sụt giảm cũng không tái lập thì không còn gì để đứng lên |

## 6.7 · Ngân sách im lặng — bằng số, đăng ký trước

Phép đo cho **23 sự kiện vào lệnh trong 5,6 năm trên một đồng** ≈ **4 lệnh/đồng/năm**. Với vũ trụ giao dịch 8 – 10 đồng (`11 §7.3`): **32 – 40 lệnh/năm**, khoảng **0,7 lệnh/tuần**.

| Điều bắt buộc hiển thị | Vì sao |
|---|---|
| Số lệnh **kỳ vọng** in ngay trên bảng điều khiển (4/đồng/năm) | Để im lặng được đọc là **đúng thiết kế**, không phải hỏng |
| Im lặng **có số**: *«0/2.400 nến qua cổng trong 7 ngày — đây là hành vi ĐÚNG»* | `10 mandate 12` |
| Trần tỉ lệ phát: 1h < 2% · 4h < 8% · 1d < 15% | Vượt trần ⇒ **cảnh báo**, vì hệ nói quá nhiều |
| `p_required` in cạnh `p_up` **ở mọi khung, kể cả khung bị khoá** | Người dùng thấy khoảng cách, không phải đoán |

> **Chế độ hỏng nguy hiểm nhất của toàn bộ hệ thống không phải lỗi kỹ thuật** — là người vận hành nhìn bảng trống ba tuần rồi hạ ngưỡng. Ngân sách im lặng là biện pháp đối kháng duy nhất, và nó phải nằm trên màn hình chứ không trong tài liệu.

## 6.8 · Mười tám suất đặc trưng — sau sửa đổi của Phần 3

| Nhóm | Suất | Đặc trưng | Thay đổi so `11` |
|---|---|---|---|
| **Chế độ** | **5** | phân vị biến động 720 · tỉ số σ̂/σ̂ trung vị 90 ngày · phân vị khối lượng 720 · biên độ thực/giá · **`realized_vol_ratio_5d_20d`** | **+1** (nhận từ Phương Pháp 5) |
| **Dòng lệnh** | **5** | tỉ lệ mua chủ động chuẩn hoá · độ dốc khối lượng tích luỹ 24 · khối lượng chuẩn hoá 96 · dấu Δgiá × dấu ΔOI · **`cvd_divergence_spot_perp`** | **+1** (nhận từ Phương Pháp 5) |
| **Chen chúc** | 2 | funding chuẩn hoá 96 · mức funding | — |
| **Chất lượng cấu trúc** | **1** | khoảng cách tới đỉnh/đáy gần nhất | **−2** (cắt `sweep_reclaim`, `dist_to_round`) |
| **Liên thị trường** | 3 | lợi suất Bitcoin · lợi suất vượt trội · beta 30 ngày | — |
| **Thời gian** | 2 | thứ trong tuần sin/cos | — |
| **Tổng** | **18** | | |

## 6.9 · Thứ tự xây dựng — và lý do nhân quả của từng bước

| Thứ tự | Xây gì | Vì sao ở vị trí này |
|---|---|---|
| **0** | Tác vụ định kỳ: funding + khối lượng hợp đồng mở + ảnh chụp vũ trụ | **Thứ duy nhất mất vĩnh viễn nếu hoãn.** Không phụ thuộc quyết định kiến trúc nào |
| **0b** | ★ Điều tra tái tạo vũ trụ quá khứ (2 giờ) | Có thể mở khoá 12 tháng cho phương án dự phòng số một (§5.5) |
| **1** | **Hàm chi phí + `p_required`** | 30 dòng mã, không cần dữ liệu mới, và **mọi tầng khác đều đọc nó**. Xây sau là phải sửa lại tất cả |
| **2** | Trọng tài: purged walk-forward + tiêm rò rỉ | *Một bộ dò chưa từng bắt được gì không phải bộ dò.* Trước cầu thủ |
| **3** | Lõi đặc trưng + **một hàm biến động duy nhất** | Đóng băng định nghĩa. Phép thử rò rỉ thứ sáu |
| **4** | **HAR-RV → σ̂** | **Tầng duy nhất bạn tự chứng minh được** (11 quan sát). Giá trị thật đầu tiên |
| **5** | **Dự báo funding → f̂** | Cùng đợt với σ̂, không phải đợt sau — §4.4 |
| **6** | Phân phối F → dải giá + `p_up` suy ra | Hoàn tất 2/3 hợp đồng dữ liệu, chưa train cây nào |
| **7** | Tổ hợp 27 ô + sinh sự kiện rào chắn (k=1) | Quy tắc, không học. Sinh dữ liệu cho bước 8 |
| **8** | **Bộ phép đo + chấm GATE 1 sửa lại** | Điểm rẽ nhánh |
| **9** | *(chỉ khi qua cổng)* L6 lọc bỏ + L7 định cỡ | Tầng đắt nhất, xây cuối, có thể không bao giờ xây |

> **Đảo thứ tự 1 và 4 là sai lầm tốn kém nhất có thể mắc**: nếu xây mô hình trước hàm chi phí, mọi chỉ tiêu đánh giá trong suốt quá trình đều thiếu mẫu số, và bạn sẽ tối ưu vào một mục tiêu sai trong nhiều tuần.

## 6.10 · Bất biến và phép thử tương ứng

| Bất biến | Phép thử | Bắt được lỗi gì |
|---|---|---|
| Ba đầu ra đến từ **một** F | `assert p_up > 0.5 ⟺ q50 > last_close` trên toàn bộ lịch sử | Mâu thuẫn logic hiện đang **hợp lệ về kiểu dữ liệu** trong `schemas.py` |
| Dải giá đơn điệu | `assert q10 ≤ q50 ≤ q90` — **số lần cắt nhau phải = 0** | Sinh dải bằng ba mô hình riêng |
| Học máy chỉ **thu hẹp** tập hành động | Fuzz: quét `p_win ∈ [0,1]` với cổng L4 đóng ⇒ luôn `no_opinion` | Học máy lén tạo hướng |
| `p_required` không dưới sàn hợp đồng vĩnh cửu | `assert p_req ≥ 0.5 + √(c₀·f)/A` với mọi `d > 0` | **Lỗi dấu trong số hạng funding** — không test nào khác bắt được |
| Chọn công cụ là **hàm** | Test tại biên 3,33 ngày và tại 35 ngày (phải ra `spot`) | Giả định cứng công cụ |
| Một hàm biến động, batch ≡ live | Chạy cùng đoạn lịch sử hai đường, `assert khớp 1e-6` | Lệch định nghĩa giữa huấn luyện và phục vụ |
| `predict()` là hàm thuần | Gọi hai lần cùng đầu vào ⇒ byte-identical | Đọc đồng hồ, I/O ẩn, biến toàn cục |
| Độ tươi chặn trước | `late=True` ⇒ `trade_intent is None`, mọi trường hợp | `late` bị dùng làm cờ hiển thị |
| Im lặng tự giải thích | `trade_intent is None ⟹ silence_reason is not None` | Ô trống bị đọc là hỏng hóc |
| Không có bán khống | Kiểu dữ liệu không chứa `"SHORT"` | Bán khống lọt qua bằng quy ước |
| Cấm định danh hệ thuật ngữ | Quét `src/` tìm 11 tên bị cấm | Nhập khẩu ontology qua đầu người viết mã |

## 6.11 · Chế độ hỏng và phản ứng đã định nghĩa

| Chế độ hỏng | Dấu hiệu | Phản ứng của hệ |
|---|---|---|
| Nguồn dữ liệu trễ | Nến trễ quá ngưỡng | **Chặn predict**, hiển thị CHẬM |
| HAR-RV phân kỳ | `σ̂` ngoài khoảng hợp lý | Rơi về EWMA λ=0,94 **tất định**, ghi nhật ký |
| Độ phủ dải giá trôi | Kiểm toán cuộn 500 dự đoán lệch khỏi 80% ± 3pp | **Cảnh báo, không tự chỉnh** — tự chỉnh che mất nguyên nhân |
| Hệ im lặng quá lâu | 0 lệnh trong N tuần | **Hiển thị số kỳ vọng cạnh số thực tế.** Không hành động |
| Hệ phát quá nhiều | Vượt trần tỉ lệ phát | **Cảnh báo** — nghi rò rỉ hoặc lỗi cổng |
| Chuỗi thua dài | 8 lệnh thua liên tiếp | **Không phản ứng** — xác suất 5,8% ở tỉ lệ thắng 30%, nằm trong thiết kế |
| Sụt giảm vượt đăng ký | Vượt mức đã đăng ký trước | **Công tắc dừng**, cần can thiệp thủ công để bật lại |
| Tỉ lệ đúng khung 1h vượt 60% | | **`RULE 11`: giả định rò rỉ** cho tới khi chứng minh ngược lại |

---

# PHẦN 7 · LỊCH THỰC THI — ĐIỀU CHỈNH SO VỚI `10 §4`

| Mốc | Điều chỉnh từ tài liệu này |
|---|---|
| **Ngày 1** | Giữ nguyên · **thêm** nhiệm vụ điều tra 2 giờ về tái tạo vũ trụ quá khứ (§5.5) |
| Tuần 1–2 · dữ liệu | Giữ nguyên · **thêm** cột dữ liệu funding vào ưu tiên cao (cần cho §4.4 và §4.5) |
| Tuần 2–4 · trọng tài | Giữ nguyên |
| Tuần 4–6 · đặc trưng | **Áp bảng 18 suất đã sửa** (§6.8) — cắt hai đặc trưng của Phương Pháp 5 |
| Tuần 6–8 · σ̂ | Giữ nguyên |
| **Tuần 7–8 · f̂** | **MỚI** — dự báo funding, cùng đợt với σ̂ (§4.4) |
| Tuần 8–9 · dải giá | Giữ nguyên · **thêm** bất biến sàn hợp đồng vĩnh cửu |
| **Tuần 9–10 · đo** | **Sửa bộ phép đo**: bỏ phép đo quét-rồi-lấy-lại *(đã bác, §3.4)* · **thêm** phép đo tương quan `E\|move\|` ↔ funding *(§4.5, có thể vô hiệu hoá cổng phí trên hợp đồng vĩnh cửu)* |
| **Chấm GATE 1** | **Dùng cổng kép sửa lại** (§6.6), không dùng ngưỡng Sharpe 0,8 |
| Tuần 10+ | Vũ trụ giao dịch 8–10 đồng · tổ hợp 27 ô, không chọn một ô |

**Ba tài liệu quyết định kiến trúc cần viết** *(bổ sung danh sách của `10`)*:
- **ADR-007** — cổng GATE 1 đổi từ ngưỡng Sharpe tuyệt đối sang cổng kép tỉ-số-sụt-giảm + so sánh tương đối
- **ADR-008** — hướng sơ cấp dùng **tổ hợp** lưới tham số, không chọn một ô; kèm phép đo biện minh
- **ADR-009** — thang co giãn rào chắn khoá ở `k = 1`; ghi rõ hệ quả rằng thời gian nắm giữ thực tế là ~6 ngày, không phải 35

---

# PHẦN 8 · MỘT ĐOẠN

> Bốn phương pháp được phân tích sâu ở đây kết thúc ở bốn chỗ rất khác nhau, và không chỗ nào là chỗ danh tiếng của chúng gợi ý. **Phương Pháp 4: Position Trading & Trend Following** giữ được vị trí quy tắc hướng sơ cấp — nhưng không phải vì nó sinh lợi nhuận (phần đó không tái lập được qua hai đoạn thời gian), mà vì nó cắt sụt giảm trong **54 trên 54** quan sát. **Phương Pháp 5: Smart Money Concepts** mất cả ba đặc trưng cuối cùng trong chưa tới một giờ đo trên dữ liệu đã nằm sẵn trên đĩa — Fair Value Gap được lấp **ít hơn** một mức giá ngẫu nhiên cùng độ sâu. **Phương Pháp 7: Funding Rate** hoá ra không phải nguồn tín hiệu mà là **thứ duy nhất trong phương trình quyết định mà bạn dự báo được cả tử số lẫn mẫu số**. Và **Phương Pháp 8: On-Chain & Narrative** rút gọn về đúng một thứ khai thác được — động lượng cắt ngang — bị khoá sau một thư mục chứa đúng một tệp.
>
> Điều đáng giữ lại không phải bốn phán quyết đó. Là cách chúng được rút ra: **mỗi khẳng định đặt cạnh tỉ lệ nền khớp cửa sổ của chính nó, mỗi tham số kiểm bằng cách chọn trên quá khứ rồi chạy trên tương lai, mỗi chỉ tiêu chọn theo độ tái lập trước khi xét độ hấp dẫn.** Ba thói quen đó rẻ hơn nhiều lần thứ chúng ngăn chặn — và chúng vừa lật ngược hai kết luận của tài liệu liền trước, viết cách đây vài giờ bởi cùng một quy trình phân tích nhưng không có phép đo đi kèm.

---

*Phần 2 và Phần 3 chạy trên `data/raw/ohlcv/symbol=BTCUSDT/timeframe=1h` — 2.062 nến ngày, 2021-01-01 → 2026-08-24. Mã đo lưu tại thư mục nháp của phiên. Phần 4 và Phần 5 là phân tích cơ chế, chưa đo được vì thiếu dữ liệu — và chính điều đó là lập luận mạnh nhất cho tác vụ định kỳ ngày một.*
