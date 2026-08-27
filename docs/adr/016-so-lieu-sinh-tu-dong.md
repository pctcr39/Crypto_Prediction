# ADR-016 · Tài liệu thiết kế không giữ số định lượng

- **Trạng thái:** Đã chấp thuận (27/08/2026)
- **Thay thế:** `ADR-013 §3` lý do #2 (bị bác — xem §3 dưới)

---

## 1 · Vấn đề

Ba vòng phản biện đối kháng trên `PREDICTION_DESIGN`: **69 → 58 → 104 phát hiện**. Số blocker **tăng** giữa vòng hai và ba (18 → 28) dù đã sửa toàn bộ 58 phát hiện của vòng hai.

Đếm nguyên nhân: **~17 trong 28 blocker của vòng ba cùng một gốc** — tài liệu trích một con số **đo bằng hệ khác với hệ nó đặc tả**:

| Số được đo bằng | Tài liệu đặc tả |
|---|---|
| Một ô lưới `50/150/20` | Tổ hợp 27 ô |
| Một lệnh mỗi lần tín hiệu bật | Máy trạng thái tranche 4 mức · LIFO · tái vũ trang |
| `rolling(20).std()` close-to-close | Parkinson |
| Cả hai rào soi intrabar | Stop intrabar / TP tại close |

Mỗi vòng sửa làm lệch thêm một chiều, và số cũ ở chỗ khác trong tài liệu không được cập nhật theo. **Sửa từng số sinh ra vòng sau.**

## 2 · Quyết định

> **Tài liệu thiết kế KHÔNG chép số định lượng.** Mọi con số kinh tế sinh bởi `scripts/spec/measure_spec.py` — script **thực thi đúng đặc tả** — ghi ra `docs/generated/spec_numbers.md`. Tài liệu **trỏ tới**, không **chép**.
>
> **Quy tắc cứng: số nào script không sinh được thì không được xuất hiện trong tài liệu.**

Số **định tính / ngoại sinh** (trích từ literature hoặc từ hồ sơ bằng chứng `09`–`17`) vẫn nằm trong tài liệu, ở **Phụ lục A.2**, ghi rõ nguồn — và ghi rõ cái nào **cần đo lại**.

## 3 · Điều lộ ra ngay khi script chạy lần đầu

| | rc1 ghi | Đặc tả thực thi |
|---|---|---|
| Số sự kiện | 90 | **1.411** |
| **Sự kiện/đồng/năm** | **~9** | **50 – 62** |
| Tỉ lệ chốt lời | 30,0% | 29,7% |
| R TB lệnh thắng | 4,48R | 3,88R |
| EV ròng | +0,559R | **+0,408R** |
| `ABS_MOVE_RATIO` | 0,685 *(đo với σ close-to-close)* | **0,727** *(đo với σ̂ HAR)* |
| Hoà vốn trượt giá | 1,57R | **1,52R** |
| **GATE 1a** | *(chưa chấm)* | **3/4 cặp đạt — DOGE 0,764 TRƯỢT** |

**Ba hệ quả phải xử lý riêng:**

1. **Ngân sách im lặng sai 6 lần — ĐÃ CHỐT (27/08).** Với vũ trụ 8–10 đồng: **404 – 617 khuyến nghị/năm ≈ 1,5/ngày**. **Chấp nhận tần suất này, KHÔNG thêm cooldown** (thêm cooldown là tạo tham số mới để cứu một khung tường thuật — đúng thứ `16` cấm).
   Khung *«im lặng là trạng thái được thiết kế»* bị **xoá bỏ** và thay bằng phát biểu đúng bản chất: hệ **vào ra liên tục bằng những bước nhỏ**, không phải hiếm khi lên tiếng.
   **Lập luận sinh tồn đổi từ «ít lệnh» sang «lệnh nhỏ»:** `08 §A2` tính bức tường phí cho lệnh **toàn vốn**; ở đây mỗi tranche là 1% NAV nên phí chỉ **1,36 – 1,67% NAV/năm** với 9 đồng. Ràng buộc thật là **quay vòng trên vốn chiến lược** (6,2 – 7,9 đơn vị `w`/năm ⇒ 0,93 – 1,19%/năm) — đó mới là đại lượng phải theo dõi, và dashboard in nó thay cho «im lặng có số».
2. **`ADR-013 §3` lý do #2 bị bác.** ADR đó giữ rào `1,2/4,0` với ba lý do; lý do #2 là *«ô 1,2/4,8 cho biên +7,5 so với +8,7 — tệ hơn»*, đo bằng quy ước cũ. Đo đúng đặc tả, **ô 1,2/4,8 tốt hơn ở cả biên lẫn EV**. Lý do #1 (không đổi tham số để khôi phục kết luận) vẫn đứng và vẫn là lý do mạnh nhất — nhưng ADR đang viện một lý do sai. **Ô đang dùng không phải ô tốt nhất, và tài liệu phải nói thẳng điều đó.**
3. **σ̂ được định nghĩa hai lần.** `sigma_hat_daily` = trung bình trượt Parkinson (L1) và `har_rv` = HAR (L2), cả hai tự nhận là đường duy nhất. Phép đo phân xử: trung bình trượt **thua** EWMA(0,94) 2,2% theo QLIKE — **trượt chính cổng L2** — còn HAR **thắng** 23,6%. Chốt: **HAR là đường duy nhất**, Parkinson là đầu vào của nó.

## 4 · Hệ quả

**Tích cực:** xoá cả một lớp lỗi thay vì từng lỗi · số luôn khớp đặc tả theo cấu tạo · thay đổi đặc tả tự động cập nhật số · và nó **trung thực hơn** — nó buộc phải thừa nhận số nào chưa đo được trên hệ thật.

**Tiêu cực:** tài liệu đọc kém liền mạch hơn (phải mở tệp thứ hai) · và script trở thành một thành phần phải bảo trì như mã sản xuất.

**Rủi ro:** script có thể lệch khỏi mã sản xuất. Giảm thiểu: khi `src/cryptopred` tồn tại, `measure_spec.py` phải **import từ đó** thay vì cài đặt lại — đó là điều kiện nghiệm thu của bước 7 trong lộ trình.

---

*Số liệu: `scripts/spec/measure_spec.py` → `docs/generated/spec_numbers.md`. Vòng phản biện thứ ba: 18 agent, 1,94M token.*
