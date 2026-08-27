# ADR-017 · Đổi mức chốt lời từ 4,0σ̂ sang 6,0σ̂

- **Trạng thái:** Đã chấp thuận (27/08/2026) — **quyết định của chủ dự án**
- **Thay thế:** `ADR-013 §3` (giữ nguyên rào 1,2σ̂/4,0σ̂)

---

## 1 · Thay đổi

```
stop   = 1,2σ̂     (không đổi)
target = 4,0σ̂  →  6,0σ̂
payoff = 3,33R →  5,00R
```

| | 1,2 / 4,0 | **1,2 / 6,0** |
|---|---|---|
| Tỉ lệ chốt lời | 29,7% | **29,2%** *(thấp hơn)* |
| Hoà vốn | 25,0% | **18,1%** |
| **Biên** | +4,7 điểm | **+11,1 điểm** |
| R trung bình lệnh thắng | 3,88R | **4,67R** |
| **EV ròng** | +0,408R | **+0,628R** — **+54%** |
| Thời gian nắm giữ | 5,1 ngày | **6,5 ngày** |
| Hết hạn | 0,9% | **1,1%** |

Số sinh tự động: [`spec_numbers.md`](../generated/spec_numbers.md).

## 2 · ⚠️ Đây là tham số CHỌN SAU KHI NHÌN DỮ LIỆU — ghi rõ để không ai quên

`ADR-013 §3` từ chối đổi rào với lý do #1: *«đổi tham số để khôi phục một kết luận mong muốn là p-hacking mà `16` cấm»*. **Quyết định này đi ngược lý do đó, và nó phải được ghi đúng như vậy.**

| | |
|---|---|
| Chọn thế nào | Đo bề mặt 16 cấu hình trên **4 cặp hiệu chuẩn** (BTC · ETH · SOL · DOGE), rồi chọn ô có EV cao nhất |
| Không phải | Đăng ký trước rồi mới đo |
| Hệ quả | Con số **+0,628R** và **+11,1 điểm** là **ước lượng IN-SAMPLE có thiên lệch chọn lọc** |
| Kỳ vọng trung thực | Ngoài mẫu, ưu thế **+54%** sẽ **co lại** — mức co chưa biết, và không có cách nào biết trước từ chính bốn cặp này |

**Giao thức khử nhiễm bắt buộc, siết hơn `PREDICTION_DESIGN §8.3`:**

1. **Bốn cặp hiệu chuẩn nay nhiễm KÉP** — chúng đã quyết lưới xu hướng, `k=1`, ước lượng RV, và giờ là cả tỉ lệ rào. Thống kê GATE 1 **chỉ tính trên 36 cặp còn lại**; bốn cặp này báo cáo **riêng, không gộp**.
2. **Đăng ký trước, ngay bây giờ:** cấu hình `1,2σ̂ / 6,0σ̂` là cấu hình **duy nhất** được chấm ở GATE 1. Không quét lại bề mặt trên 36 cặp rồi chọn ô đẹp — làm thế là lặp lại đúng thiên lệch, ở quy mô lớn hơn.
3. **Nếu GATE 1 trượt: không được quay về 4,0σ̂ để thử lại.** Thứ tự sửa được phép giữ nguyên (`§8.3`): ① kéo dài chân trời ② siết độ chọn lọc ③ thêm phái sinh vào L6.

## 3 · Vì sao vẫn chấp nhận được về mặt cơ chế

Ba phép kiểm đã chạy trước khi đổi:

| Kiểm | Kết quả |
|---|---|
| **Rào thời gian có chi phối không?** | Hết hạn **1,1%** — không. *(Cấu hình 35 ngày đã chết vì 48% hết hạn)* |
| **Có phải đổi công cụ không?** | Giữ 6,5 ngày > ngưỡng 2,0–3,4 ngày ⇒ **giao ngay**, không đổi |
| **Bề mặt có dốc quanh ô này không?** | Ô lân cận `1,0/6,0` cho EV +0,617R và `1,5/6,0` cho +0,583R — **không phải đỉnh nhọn**; cả cột `target = 6,0` đều cao |

Điểm cuối là điều đáng nói: **ưu thế đến từ cột `target`, không từ một ô riêng lẻ.** Mọi cấu hình `target = 6,0σ̂` đều nằm trong nhóm EV cao nhất, bất kể `stop`. Đó là mẫu hình có cấu trúc, không phải một điểm may — nhưng nó **vẫn được phát hiện in-sample**, và điều đó không đổi.

## 4 · Điều này nói gì về tỉ lệ đúng

Yêu cầu ban đầu là **tăng tỉ lệ dự đoán đúng**. Bề mặt cho câu trả lời ngược:

```
Tương quan giữa tỉ lệ đúng và EV trên 16 cấu hình:  −0,263

Cấu hình ĐÚNG NHIỀU NHẤT   : 2,0/3,0 → 41,4% đúng · EV +0,333R · biên −0,6  (LỖ)
Cấu hình KIẾM NHIỀU NHẤT   : 1,2/6,0 → 29,2% đúng · EV +0,628R · biên +11,1
```

Cấu hình được chọn có tỉ lệ đúng **thấp hơn** cấu hình cũ (29,2% so với 29,7%) và **thấp hơn 12 điểm** so với cấu hình đúng nhiều nhất — nhưng kiếm gần **gấp đôi**. Đây là `08 §A1` đo được trên chính hệ này: **tỉ số lãi/lỗ quan trọng hơn tần suất đúng.**

---

*Số liệu: `scripts/spec/measure_spec.py` → `docs/generated/spec_numbers.md`. Thay đổi hằng số: `TP_MULT = 4.0 → 6.0`.*
