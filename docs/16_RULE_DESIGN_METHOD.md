# THIẾT KẾ HỆ THỐNG RULE-BASED — PHƯƠNG PHÁP LÀM VIỆC

> Phiên bản 1.0 · 27/08/2026
> Rút ra từ chính quá trình làm `11` → `12` → `13` → `14` → `15` → `ADR-002`. Phần 6 liệt kê **sáu lỗi tôi đã mắc trong dự án này** và phương pháp đã bắt chúng như thế nào.
> Tài liệu này nói về **cách làm**, không nói về chiến lược nào cụ thể.

---

# PHẦN 1 · "RULE" LÀ GÌ — ĐỊNH NGHĨA BẰNG PHÉP THỬ

Phần lớn thứ tự gọi là "quy tắc giao dịch" không phải quy tắc. Chúng là **câu chuyện có tham số**. Năm phép thử để phân biệt:

| Tiêu chí | Nội dung | Cách kiểm |
|---|---|---|
| **1 · Đầu vào khách quan** | Tính được từ dữ liệu, không cần mắt người diễn giải | Thử viết mã từ đúng bản mô tả, không hỏi thêm |
| **2 · Tái lập giữa hai người cài đặt** ★ | Hai người cài độc lập từ cùng bản mô tả cho **cùng kết quả ≥95% số nến** | Đây là con dao mổ |
| **3 · Ít hơn hoặc bằng ba tham số tự do** | | Đếm. Kể cả tham số ẩn trong "và", "hoặc", ngưỡng |
| **4 · Bác bỏ được** | Có ngưỡng thất bại **viết trước**, so với tỉ lệ nền khớp cửa sổ | Viết ngưỡng ra giấy trước khi chạy |
| **5 · Sống qua bức tường phí của chân trời nó** | | `p_required = 0,5 + c/(2·E\|move\|)` |

## 1.1 · Vì sao Tiêu chí 2 là con dao mổ

Nó giết nhiều thứ hơn tiêu chí phí. Đưa cùng một bản mô tả "order block" cho hai người, họ khoanh ra hai tập nến khác nhau. **Một khái niệm không tái lập được giữa hai người cài đặt không phải quy tắc — nó là một câu chuyện.** Và câu chuyện thì luôn khớp dữ liệu sau khi đã biết đáp án.

Ba cơ chế thoát hiểm cần nhận ra ngay:

| Cơ chế | Dạng thường gặp | Hệ quả |
|---|---|---|
| **Xác định hậu nghiệm** | *"Đó không phải mẫu hình hợp lệ"* — nói sau khi giá đi ngược | Mọi phản ví dụ bị loại khỏi mẫu |
| **Phân cấp bối cảnh** | *"Đúng ở khung ngày nhưng khung giờ chưa xác nhận"* | Luôn có một khung giải thích được kết quả |
| **Quy lỗi người dùng** | *"Phương pháp đúng, bạn áp dụng sai"* | Thất bại thành bằng chứng cần học thêm |

## 1.2 · Vì sao Tiêu chí 3 là con dao thứ hai

Một "quy tắc" tám tham số chạy trên bốn trăm quan sát hiệu dụng **không phải quy tắc** — đó là một mô hình dung lượng cao nguỵ trang bằng câu chữ. Nó khớp quá mức y hệt một cây quyết định hai nghìn nhánh, khác ở chỗ **không ai kiểm định nó**, vì nó "chỉ là logic if-then".

**Ngân sách tham số = n_hiệu_dụng / 20.** Không phải quy ước — là hệ quả của việc mỗi tham số tiêu một bậc tự do.

---

# PHẦN 2 · PHÂN BỔ: CÁI GÌ LÀ RULE, CÁI GÌ LÀ HỌC MÁY

## 2.1 · Nguyên tắc trung tâm

> **Rule giữ những gì bạn BIẾT.**
> **Học máy giữ những gì bạn chỉ có thể ĐO.**
> **Không bao giờ để học máy giữ thứ bạn đã biết.**

| Loại | Thuộc về | Ví dụ trong dự án này |
|---|---|---|
| **Biết chắc — số học** | **Rule** | Phí, funding, `p_required`, chọn công cụ, hình dạng cược, giới hạn rủi ro |
| **Biết cơ chế, có literature ngoại sinh dày** | **Rule** | Xu hướng dài hạn (Phương Pháp 4), lối ra, cắt lỗ |
| **Chỉ đo được, không suy ra được** | **Học máy** | Mức biến động có điều kiện, ánh xạ hiệu chỉnh xác suất, **lệnh nào nên bỏ** |
| **Không biết và không đo được** | **Không ai giữ** | Hướng giá ở khung giờ |

## 2.2 · Ba câu hỏi để phân loại một thành phần

1. **Tôi có viết được nó thành số học không?** → Có ⇒ rule. Đừng để mô hình học lại phép cộng.
2. **Có literature ngoại sinh, ngoài lĩnh vực này, tái lập được không?** → Có ⇒ rule, và **giữ càng gần bản chuẩn càng tốt**.
3. **Nó chỉ tồn tại trong backtest của tôi không?** → Có ⇒ **không dùng**, dù là rule hay học máy.

## 2.3 · Vì sao hướng thuộc về rule chứ không thuộc học máy

Đây là kết luận phản trực giác nhất của dự án, và lý do là **năng lực dự báo**, không phải sở thích:

```
Năng lực dự báo hướng    :  R² 0,00 – 0,01   ← trần cứng, mô hình tốt hơn không mua thêm được
Năng lực dự báo biến động:  R² 0,40 – 0,60
Năng lực dự báo funding  :  R² 0,44 – 0,51
```

Học máy chỉ đáng dùng ở nơi **có gì đó để học**. Ở nơi trần là 51–53%, một mô hình phức tạp không cho kết quả tốt hơn một quy tắc đơn giản — nó chỉ cho kết quả **khó kiểm định hơn** và **dễ tự lừa hơn**.

## 2.4 · Bất biến đơn điệu — cách giữ ranh giới không bị xói mòn

> **Học máy chỉ được phép THU HẸP tập hành động, không bao giờ được MỞ RỘNG nó.**

Cụ thể: rule quyết hướng; học máy chỉ có thể biến GIAO DỊCH thành KHÔNG-GIAO-DỊCH. Nó không bao giờ tạo ra một hướng, và không bao giờ đảo hướng.

**Kiểm bằng fuzz test:** quét đầu ra của mô hình trên toàn khoảng [0,1] với cổng phí đóng ⇒ output phải **luôn** là "không có ý kiến". Nếu có một giá trị nào đó làm hệ phát tín hiệu, ranh giới đã bị thủng.

---

# PHẦN 3 · QUY TRÌNH CHÍN BƯỚC

Thứ tự này quan trọng. Đảo bước 1 và bước 6 là sai lầm tốn kém nhất có thể mắc.

### Bước 1 · Viết hàm chi phí TRƯỚC KHI nghĩ về tín hiệu

```
c = c(chân_trời, công_cụ, funding)
E|move| = σ̂ · √(2/π) · √H
p_required = 0,5 + c / (2 · E|move|)
```

**Vì sao trước tiên:** nó cho biết bài toán **có nghiệm hay không** trước khi bạn tốn tuần nào đi tìm nghiệm. Khung 4 giờ cần thắng 63–69% trong khi trần là 51–53% — biết điều này ở ngày một tiết kiệm nhiều tháng.

Và: nếu xây mô hình trước hàm chi phí, **mọi chỉ tiêu đánh giá trong suốt quá trình đều thiếu mẫu số**, và bạn tối ưu vào mục tiêu sai trong nhiều tuần.

### Bước 2 · Chọn chân trời bằng bảng phí, không bằng sở thích

Chân trời quyết định **ngưỡng đúng cần đạt**; tín hiệu chỉ quyết định **có đạt được không**. Chọn sai chân trời thì tín hiệu tốt đến mấy cũng vô nghĩa.

### Bước 3 · Chọn chỉ tiêu theo độ TÁI LẬP trước khi xét độ hấp dẫn

Đo trên nhiều chế độ thị trường, chọn chỉ tiêu **ít dao động nhất**, rồi mới hỏi nó có hấp dẫn không.

Trong dự án này: Sharpe dao động 0,07 → 0,77 giữa hai đoạn; tỉ số sụt giảm 0,39 → 0,36. **Cổng đặt trên Sharpe cho kết quả ngẫu nhiên; cổng đặt trên tỉ số sụt giảm cho kết quả có nghĩa.**

> Đây là bước bị bỏ qua nhiều nhất. Người ta chọn Sharpe vì nó quen thuộc, không vì nó đo được bằng lượng dữ liệu đang có.

### Bước 4 · Tính lượng dữ liệu cần cho chỉ tiêu đó — TRƯỚC khi chạy

```
Độ lệch của ước lượng phải < 1/2 khác biệt muốn phát hiện
n_hiệu_dụng = n / (1 + (n−1)·ρ)          ← ρ phải ĐO, không giả định
```

Nếu câu trả lời là "34 năm", bạn vừa tiết kiệm được ba tháng đi tìm câu trả lời không tồn tại.

### Bước 5 · Viết quy tắc ở dạng đơn giản nhất, rồi ĐÓNG BĂNG

Mọi biến thể của cùng một họ tín hiệu tương quan 0,7–0,95 với nhau. Không có "tín hiệu tốt hơn" để đi tìm. Chọn cái đơn giản nhất, đóng băng, chuyển sang việc khác.

### Bước 6 · Khi các biến thể không phân biệt được, TỔ HỢP thay vì CHỌN

Nếu đo được rằng thứ hạng tham số không ổn định (tương quan hạng gần 0), thì **việc chọn là tuỳ tiện** — và thứ tuỳ tiện sẽ bị chỉnh lén về sau.

Tổ hợp: ① vượt kỳ vọng của việc chọn ngẫu nhiên ② ổn định hơn ③ **xoá bỏ một quyết định** thay vì tối ưu nó.

> **Nguyên tắc con, quan trọng:** khi loại bỏ một tham số, **đừng tạo ra tham số mới thay thế**. Tổ hợp có cám dỗ tạo ra "ngưỡng đồng thuận" — và ngưỡng đó trở thành nơi tinh chỉnh mới. Khoá cứng nó.

### Bước 7 · Mỗi khẳng định đặt cạnh TỈ LỆ NỀN KHỚP CỬA SỔ

Không so với 50%. Không so với 0. So với: *"nếu tôi làm điều này ở một thời điểm ngẫu nhiên, kết quả là gì?"*

Ví dụ: Fair Value Gap được lấp 79,5% trong 60 ngày — nghe thuyết phục. Một mức giá **bất kỳ** ở cùng độ sâu được lấp **85,1%**. Khẳng định đúng và hoàn toàn vô nội dung.

### Bước 8 · Biến mọi nguyên tắc thành một phép thử làm nó ĐỎ

Nguyên tắc nằm trong tài liệu sẽ không được đọc lúc 2 giờ sáng. Nguyên tắc nằm trong test sẽ chặn.

### Bước 9 · Định nghĩa trước hành vi khi TRƯỢT

Viết ra, lúc đầu lạnh: điều gì được phép sửa, theo thứ tự nào, và điều gì tuyệt đối không. Sau khi trượt là quá muộn để quyết định điều này một cách trung thực.

---

# PHẦN 4 · BA NGÂN SÁCH

Hệ thống rule-based không bị giới hạn bởi ý tưởng. Nó bị giới hạn bởi ba ngân sách, và cả ba đều tính được.

## 4.1 · Ngân sách tham số

```
số tham số tự do tối đa = n_hiệu_dụng / 20
```

`n_hiệu_dụng` không phải số hàng dữ liệu. Nó là số **quan sát độc lập** — sau khi trừ tương quan chéo giữa các tài sản và độ chồng lấn của nhãn.

## 4.2 · Ngân sách chiều thông tin

**Đếm số CHIỀU, không đếm số cột.** Gom cụm đặc trưng theo tương quan; mỗi cụm là một chiều.

Trong dự án này: 57 đặc trưng được đề xuất, 38 dựng được, **13 chiều độc lập**. Cụm lớn nhất chứa 17 đặc trưng — mọi log return, RSI, MACD, Stochastic, ROC, tỉ số đường trung bình nhanh, độ dốc OBV. **Cùng một con số viết bằng mười bảy cách.**

⇒ Muốn có chiều thứ 14 thì phải thêm **nguồn dữ liệu**, không phải thêm **công thức**.

## 4.3 · Ngân sách im lặng

Hệ thống chọn lọc sẽ im lặng phần lớn thời gian. Đó là thiết kế, không phải lỗi. Nhưng nó phải **có số đăng ký trước**:

| Bắt buộc | Vì sao |
|---|---|
| Số lệnh **kỳ vọng** in trên màn hình | Để im lặng đọc được là đúng thiết kế |
| Im lặng **có số**: *"0/2.400 nến qua cổng trong 7 ngày"* | Ô trống bị đọc là hỏng hóc |
| **Trần** tỉ lệ phát tín hiệu | Vượt trần ⇒ cảnh báo, vì hệ nói quá nhiều |
| `p_required` in cạnh `p_up` **ở mọi khung** | Người dùng thấy khoảng cách, không phải đoán |

> **Chế độ hỏng nguy hiểm nhất của một hệ rule-based không phải lỗi kỹ thuật** — là người vận hành nhìn bảng trống ba tuần rồi hạ ngưỡng. Ngân sách im lặng là biện pháp đối kháng duy nhất, và nó phải nằm **trên màn hình**, không nằm trong tài liệu.

---

# PHẦN 5 · BIẾN NGUYÊN TẮC THÀNH TEST

Đây là phần phân biệt một hệ rule-based thật với một tập quy ước.

| Nguyên tắc | Phép thử làm nó đỏ |
|---|---|
| Ba đầu ra đến từ **một** phân phối | `assert p_up > 0,5 ⟺ q50 > last_close` trên toàn lịch sử |
| Dải giá đơn điệu | `assert q10 ≤ q50 ≤ q90` — **số lần cắt nhau = 0** |
| Học máy chỉ thu hẹp tập hành động | Fuzz: quét toàn [0,1] với cổng đóng ⇒ luôn "không ý kiến" |
| Chân trời không có nghiệm thì không phát tín hiệu | Ép phát ở khung 4 giờ ⇒ assert output là KHÔNG RÕ |
| Chi phí là hàm, không phải hằng | Test tại hai giá trị funding khác nhau ⇒ ra hai công cụ khác nhau |
| Ngưỡng không đọc từ cấu hình | Xoá khoá khỏi config ⇒ hệ vẫn chạy đúng |
| Không có bán khống | **Kiểu dữ liệu** không chứa giá trị đó |
| Im lặng tự giải thích | `trade_intent is None ⟹ silence_reason is not None` |
| Không nhập khẩu hệ thuật ngữ | Quét mã nguồn tìm danh sách định danh bị cấm |
| Hàm dự đoán là hàm thuần | Gọi hai lần cùng đầu vào ⇒ kết quả giống hệt từng byte |

**Quy tắc chọn chỗ đặt:**

| Đặt ở đâu | Khi nào |
|---|---|
| **Trong mã, kèm test** | Mọi thứ ảnh hưởng tới quyết định giao dịch hoặc tới con số báo cáo |
| Trong cấu hình | Chỉ những thứ **thật sự** cần đổi giữa các môi trường |
| Trong tài liệu | Lý do **vì sao**, không phải bản thân quy tắc |

> **Ngưỡng quyết định tuyệt đối không nằm trong tệp cấu hình.** Đó chính là dòng sẽ bị sửa vào cái đêm dashboard trống ba tuần liền. Khi nó bị sửa, **không test nào đỏ, không tiếng động nào**, và mọi con số sau đó là số bịa.

---

# PHẦN 6 · SÁU LỖI TÔI ĐÃ MẮC TRONG DỰ ÁN NÀY

Phương pháp chỉ đáng tin nếu nó bắt được lỗi của chính người dùng nó. Đây là sáu lỗi thật, theo thứ tự thời gian.

## 6.1 · Cấp suất đặc trưng dựa trên literature mà chưa tự tái lập

**Lỗi:** `11` cho Smart Money Concepts điểm 4/5 và **ba suất đặc trưng**, vì phần lõi có nền Osler trên *Journal of Finance*.

**Bắt được bởi:** Bước 7 — tỉ lệ nền khớp cửa sổ. Đo trên dữ liệu của chính repo: quét-rồi-lấy-lại cho lợi suất **−0,30%** so với nền +0,43% (p=0,92); số tròn không hiệu ứng.

**Bài học:** literature ở lĩnh vực khác là **giả thuyết**, không phải bằng chứng. Tái lập trước khi cấp ngân sách. Chi phí tái lập: chưa tới một giờ.

## 6.2 · Dùng tham số giả định trong phép tính công suất

**Lỗi:** `11 §7.2` giả định tương quan chéo ρ = 0,9 và 15 lệnh/năm ⇒ kết luận "13,8 năm".

**Bắt được bởi:** Bước 4 — *ρ phải ĐO, không giả định*. Đo thật: κ = 0,501 và **3,5** lệnh/năm ⇒ **34 năm**. Ước lượng cũ **lạc quan gấp 2,5 lần**.

**Bài học:** trong một phép tính công suất, **tham số giả định chịu toàn bộ tải trọng của kết luận**. Hai sai số đi ngược chiều nhau và không triệt tiêu hết.

## 6.3 · Cấp hai suất cho cùng một công thức

**Lỗi:** `11 §8.3` liệt kê `breakout_extension_sigma` và `dist_to_prior_swing_sigma` là hai đặc trưng riêng.

**Bắt được bởi:** Ngân sách 4.2 — đo trùng lặp. Tương quan **1,000**. Chúng là **cùng một công thức viết hai lần**.

**Bài học:** đo trùng lặp **trước** khi phân bổ ngân sách, không phải sau.

## 6.4 · Tự động hoá bước chọn và nhặt phải nhiễu

**Lỗi:** tôi chạy một thuật toán chọn tham lam thuần theo độ phi tương quan. Nó xếp `dist_round` — đặc trưng vừa bị bác ở 6.1 — vào **vị trí thứ sáu**.

**Bắt được bởi:** đối chiếu với kết quả đo trước đó.

**Bài học:** **phi tương quan cao là thuộc tính của NHIỄU cũng nhiều như của thông tin mới.** Một chuỗi ngẫu nhiên thuần sẽ phi tương quan với mọi thứ và được thuật toán xếp hạng cao nhất. ⇒ Gom cụm để **phát hiện trùng lặp**, rồi chọn đại diện bằng **bằng chứng**. Không tự động hoá bước chọn.

## 6.5 · Đặc tả một cơ chế mà không mô phỏng nó

**Lỗi:** `10` đặc tả cắt lỗ 1,2σ̂ · chốt lời 4,0σ̂ · hết hạn 60 ngày · giữ ~35 ngày. **Bốn con số này không tương thích.** Đặc tả này đi qua bốn kiến trúc sư và hai giám khảo mà không ai phát hiện.

**Bắt được bởi:** mô phỏng. Ở thang σ̂ 35 ngày, **11 trong 23 lệnh** kết thúc bằng hết hạn thời gian ⇒ **payoff 4:1 không hề xảy ra** — mà toàn bộ lập luận kinh tế dựa trên nó.

**Bài học:** **đặc tả không phải mô phỏng.** Một cơ chế có nhiều tham số ràng buộc lẫn nhau phải được **chạy thử** trước khi tin. Lập luận bằng lời không phát hiện được sự bất tương thích giữa ba con số.

## 6.6 · Tranh luận về một đại lượng suốt bốn tài liệu mà không tải nó về

**Lỗi:** `08`, `09`, `11`, `12` đều lập luận về funding. Không tài liệu nào tải dữ liệu funding.

**Bắt được bởi:** hai phút tải dữ liệu. Kết quả: funding **dự báo được với R² 0,44–0,51** (không tài liệu nào biết), và carry trên SOL mất **−42,47% notional** trong hai tháng rưỡi (rủi ro bị nêu quá nhẹ ở `08`).

**Bài học:** **suy nghĩ không thay được phép đo.** Khi một đại lượng nằm sau một lệnh tải hai phút, mọi phút bỏ ra tranh luận về nó là phút lãng phí.

## 6.7 · Lỗi thứ bảy — đọc lại một công thức không phải kiểm tra nó

**Lỗi:** công thức hoà vốn `p* = (1+c_R)/(tp_mult+1)` coi `4,0` là tỉ số payoff, trong khi `4,0` là **hệ số của σ̂**. Rào `1,2σ̂/4,0σ̂` cho payoff **3,33:1**, nên mẫu số phải là `tp/sl + 1 = 4,333`. Hoà vốn đúng **25,0%**, không phải 21,7%.

**Nó sống sót qua:** sáu tài liệu · hai vòng phản biện đối kháng (69 + 58 phát hiện) · và một mục §L4 tự tuyên bố *"hai kiểu dữ liệu — biện pháp chống lặp lại lỗi thứ nguyên"* đặt ngay cạnh nó.

**Bắt được bởi:** một agent **tự đạo hàm lại** công thức từ định nghĩa rào, thay vì đọc lại nó.

**Và một lỗi thứ tám đi kèm:** khi xác minh, phát hiện `pp4_final.py` lấy điểm vào từ một chuỗi **đã dịch** rồi dịch thêm một lần nữa — vào lệnh chậm một ngày. Tỉ lệ chốt lời thật là 33,7%, không phải 30,0%. **Hai lỗi đi ngược chiều và triệt tiêu nhau gần hết** (+8,3 → +5,0 → +8,7 điểm) — con số headline gần như không đổi trong khi cả hai đầu vào đều sai.

**Bài học — bổ sung vào Bước 8 của quy trình:**

> **Đọc lại một công thức không phải kiểm tra nó.** Với mọi biểu thức mà một quyết định đứng lên: ① **đạo hàm lại độc lập từ định nghĩa gốc**, ② viết một **bất biến tính đại lượng đó bằng đường khác** (ở đây: `assert EV(p*) == 0` tính thẳng từ `sl`/`tp`/`cost`). Bảng số kiểm được số học nhưng **không kiểm được thứ nguyên** — vì mọi phép tính trong bảng đều dùng chung công thức sai.
>
> Hệ quả thứ hai: **một kết quả đúng-vẻ-ngoài có thể là tích của hai sai số bù trừ.** Khi phát hiện một lỗi, phải kiểm cả các đầu vào khác của cùng con số — sửa một nửa làm kết quả tệ hơn cả khi chưa sửa.

*Chi tiết đầy đủ: `docs/adr/013-sua-loi-thu-nguyen-payoff.md`.*

## 6.8 · Mẫu hình chung của cả tám lỗi

Cả tám đều là **một dạng**: chấp nhận một khẳng định vì nó **hợp lý**, thay vì vì nó **đã được kiểm**. Và cả sáu đều bị bắt bởi cùng một thứ — **đặt con số cạnh đối chứng của nó**:

| Con số | Đối chứng |
|---|---|
| Tỉ lệ lấp Fair Value Gap | Tỉ lệ nền cùng độ sâu |
| Tương quan giả định | Tương quan đo được |
| Số đặc trưng | Số chiều thông tin |
| Điểm phi tương quan | Kết quả đo độ liên quan |
| Đặc tả rào chắn | Mô phỏng rào chắn |
| Lập luận về funding | Dữ liệu funding |
| **Công thức đọc lại** | **Công thức đạo hàm lại** |

---

# PHẦN 7 · DANH SÁCH KIỂM TRƯỚC KHI CHẤP NHẬN MỘT QUY TẮC

```
□  Hai người cài đặt độc lập cho cùng kết quả ≥95% số nến?
□  Ít hơn hoặc bằng ba tham số tự do — kể cả tham số ẩn?
□  Số tham số ≤ n_hiệu_dụng / 20, với n_hiệu_dụng ĐO chứ không giả định?
□  Chân trời của nó có nghiệm — p_required nằm dưới trần năng lực?
□  Có literature ngoại sinh, ngoài lĩnh vực này, tái lập được?
□  Đã tự tái lập trên dữ liệu của chính mình?
□  Kết quả đứng cạnh tỉ lệ nền KHỚP CỬA SỔ, không phải cạnh 50%?
□  Chỉ tiêu đánh giá đã chọn theo độ TÁI LẬP, không phải độ quen thuộc?
□  Đã tính lượng dữ liệu cần cho chỉ tiêu đó, TRƯỚC khi chạy?
□  Nếu là biến thể của một họ — đã tổ hợp thay vì chọn?
□  Nếu đã loại một tham số — có vô tình tạo tham số mới không?
□  Cơ chế đã được MÔ PHỎNG, không chỉ được đặc tả?
□  Ngưỡng nằm trong mã, không nằm trong cấu hình?
□  Mỗi bất biến có một test làm nó đỏ?
□  Hành vi khi trượt đã viết ra, lúc đầu lạnh?
```

---

# PHẦN 8 · MỘT ĐOẠN

> Thiết kế hệ thống rule-based không phải là việc nghĩ ra quy tắc hay. Quy tắc hay thì nhiều, và phần lớn chúng là câu chuyện có tham số. Việc thật sự là **dựng một bộ máy phát hiện ra rằng quy tắc của chính bạn không hoạt động, đủ sớm để điều đó còn rẻ** — và bộ máy đó gồm ba thứ: đặt mọi con số cạnh đối chứng của nó, chọn chỉ tiêu theo độ tái lập trước khi xét độ hấp dẫn, và biến mỗi nguyên tắc thành một phép thử làm nó đỏ.
>
> Bằng chứng cho phương pháp này không nằm ở chỗ nó tạo ra kết luận đẹp. Nó nằm ở chỗ **nó đã lật ngược sáu kết luận của chính tôi trong cùng dự án** — trong đó có hai kết luận được viết ra vài giờ trước bởi cùng một quy trình phân tích, chỉ khác là chưa có phép đo đi kèm.

---

*Rút ra từ `11` → `12` → `13` → `14` → `15` → `ADR-002`. Sáu lỗi ở Phần 6 đều có thể truy về tài liệu và phép đo cụ thể.*
