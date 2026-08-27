# ADR-018 · Cho người dùng chọn TẦNG ĐỘ CHỌN LỌC — và chỉ chọn ở đó

- **Trạng thái:** Đã chấp thuận (27/08/2026) — **quyết định của chủ dự án**
- **Bối cảnh:** câu hỏi *"nếu phân tầng, cho user chọn phương pháp dự đoán thì sao"*
- **Liên quan:** `ADR-002` (khoá chân trời) · `ADR-016` (số sinh tự động) · `ADR-017` (rào 6,0σ̂)

---

## 1 · Quyết định

Người dùng được chọn **tầng độ chọn lọc** (trục D) và **cách hiển thị** (trục E).
Người dùng **không** được chọn tham số rào chắn (trục A), nguồn tín hiệu (trục B),
hay chân trời (trục C).

| Trục | Chọn gì | Nằm ở đâu | Quyết định |
|---|---|---|---|
| A | tham số rào chắn `sl/tp` | trước khi đo | ⛔ **CẤM VĨNH VIỄN** |
| B | nguồn tín hiệu / tổ hợp tầng | trước hiệu chỉnh | 🔒 hoãn — sau GATE 1 |
| C | chân trời | trước hiệu chỉnh | 🔒 hoãn — `ADR-002` đang khoá |
| **D** | **ngưỡng độ chọn lọc** | **sau cổng** | ✅ **áp dụng** |
| **E** | **hiển thị · sắp xếp · lọc** | **sau khuyến nghị** | ✅ **áp dụng, tự do** |

**Nguyên lý phân định:** lựa chọn **trước cổng** nhân số giả thuyết phải kiểm định và
ăn vào ngân sách thống kê. Lựa chọn **sau cổng** chỉ cắt một danh sách đã kiểm định.

## 2 · ⚠️ Phép thử tiên quyết đã CHẠY, và kết quả là ÂM TÍNH

Trước khi xây, một câu hỏi phải được trả lời: **EV có đơn điệu theo độ chọn lọc không?**
Nếu không, các tầng chỉ là trang trí — hoặc tệ hơn, bán nhóm kém dưới cái tên nghe an toàn.

Đã đo trên toàn bộ 1.114 sự kiện, bốn trục độ tin khả dụng. Kết quả:

| Trục độ tin thử | Hình dạng EV | Có đơn điệu? |
|---|---|---|
| Mức slot `level` 0,25 → 1,00 | +0,697 → +0,683 → +0,597 → +0,565R | **giảm nhẹ, trong nhiễu** |
| `w` tại lúc vào | không có xu hướng | ✗ |
| σ̂ tại lúc vào (ngũ phân vị) | **hình chữ U**: +0,928 → +0,284 → +0,901R | ✗ |
| `p_star` (ngũ phân vị) | hình chữ U (ảnh gương của σ̂) | ✗ |

**Không một chênh lệch nào vượt nhiễu.** Phép so sánh mạnh nhất đạt z = 1,50; ngưỡng là 1,96.
Độ lệch chuẩn R mỗi sự kiện là **3,23R** — để phân biệt chênh lệch 0,15R cần **≈1.775 sự
kiện mỗi tầng**, trong khi toàn bộ vũ trụ hiệu chuẩn mới có 1.114.

Số hiện hành: [`spec_numbers.md §3c`](../generated/spec_numbers.md) — sinh tự động, không chép.

### Hệ quả bắt buộc — đăng ký TRƯỚC, ngay bây giờ

1. **Tầng KHÔNG phải thang chất lượng.** Cấm mọi cách diễn đạt ngụ ý tầng chặt hơn cho
   khuyến nghị *tốt hơn*: không "cao cấp", không "độ tin cao", không sao, không huy hiệu
   thứ hạng, không sắp xếp mặc định theo tầng.
2. **Điều tầng thật sự điều tiết là TẦN SUẤT** — và do đó **tổng lợi nhuận**.
   Bậc thang đo được: **43,4 → 27,8 → 17,0 → 6,9** sự kiện/đồng/năm.
   Tổng R tương ứng: **+723 → +444 → +255 → +100R**. Ít lệnh hơn ⇒ **ít tổng R hơn**,
   ở cùng chất lượng kỳ vọng mỗi lệnh.
3. **Giao diện phải nói đúng điều đó** khi người dùng đổi tầng — nêu tần suất và tổng R
   kỳ vọng thay đổi, **không** nêu chất lượng thay đổi.
4. **Không được đo lại rồi chọn tầng "tốt nhất".** Nếu sau này có đủ mẫu và một tầng tỏ ra
   khác biệt thật, đó là phát hiện mới cần ADR mới — không phải lý do đổi mặc định âm thầm.

## 3 · Vì sao vẫn làm, dù lợi ích EV bằng không

Vì tần suất **tự nó** là một tham số vận hành chính đáng, độc lập với EV:

- **Ngân sách chú ý** — 43 khuyến nghị/đồng/năm × 9 đồng ≈ 390/năm. Có người muốn ít hơn.
- **Số vị thế đồng thời** — tầng chặt hơn giữ ít slot mở hơn cùng lúc.
- **Tiền phí** — tỉ lệ thẳng với số lệnh: `1,03–1,29% NAV/năm` ở tầng Đầy đủ.
- **Phù hợp phạm vi đã chốt** — hệ chỉ khuyến nghị, người dùng quyết định. Họ **vốn đã** có
  quyền lọc tối hậu là không hành động. Tầng chỉ công cụ hoá quyền đó.

Và kết quả âm tính mang một tin tốt: **không tầng nào là bẫy.** Vì EV không phân biệt được,
người dùng chọn sai cũng không bị phạt. Điều đó khiến việc trao quyền chọn là an toàn.

## 4 · Bốn tầng

Cắt trên `level` — trường **đã có sẵn** trong hợp đồng `Tranche`, không cần đổi hợp đồng.

| Tầng | Giữ tranche có | Sự kiện/đồng/năm |
|---|---|---|
| **Đầy đủ** | `level ≥ 0,25` | 43,4 |
| **Cân bằng** | `level ≥ 0,50` | 27,8 |
| **Chọn lọc** | `level ≥ 0,75` | 17,0 |
| **Tối thiểu** | `level = 1,00` | 6,9 |

Chúng là **tập lồng nhau** trên cùng một danh sách. Cùng mô hình, cùng hiệu chỉnh, cùng cổng
`p_star`. Về thống kê vẫn là **một giả thuyết**, nên không cần hiệu chỉnh Bonferroni và
không nhân yêu cầu dữ liệu.

## 5 · Rào chống lạm dụng

Rủi ro còn lại: người dùng **đổi tầng theo kết quả gần đây** — thua thì siết, thắng thì nới.
Đó vẫn là p-hacking, chạy trên đồng hồ chậm hơn và bằng tiền thật.

Rào bằng thiết kế, không bằng cấm đoán:

1. **Nhật ký lựa chọn tầng** — dòng thời gian riêng (`user_prefs`), **không** nhét vào hợp
   đồng `Tranche`; `Prediction` là bất biến và không mang trạng thái người dùng.
2. **Lịch sử chấm theo tầng đang hiệu lực LÚC PHÁT**, không theo tầng hiện tại. Không cho
   viết lại quá khứ bằng cách đổi thiết lập.
3. **Đổi tầng có độ trễ** — hiệu lực từ chu kỳ sau, biến nó thành quyết định chứ không phải phản xạ.
4. **Hiện chính mẫu hình của người dùng** — số lần đổi tầng trong 90 ngày, đặt cạnh kết quả.

## 6 · Vì sao trục A bị cấm vĩnh viễn

`ADR-017 §2` đã đăng ký trước rằng `1,2σ̂/6,0σ̂` là cấu hình **duy nhất** được chấm ở GATE 1.
Đưa bề mặt 16 ô lên giao diện là thuê người dùng làm p-hacking hộ mình.

Bằng chứng cụ thể từ `spec_numbers §5`: ô **đúng nhiều nhất** là `2,0/3,0` với **41,4%**
thắng — và biên **−0,6 điểm**, tức **lỗ**. Tương quan giữa tỉ lệ đúng và EV trên bề mặt là
**−0,263**. Người dùng chọn theo "tỉ lệ đúng cao nhất" sẽ chọn đúng ô thua.

---

*Số liệu: `scripts/spec/measure_spec.py::tier_table` → `docs/generated/spec_numbers.md §3c`.*
*Không hằng số mới. `TIERS` sống cạnh `LEVELS` trong cùng một tệp.*
