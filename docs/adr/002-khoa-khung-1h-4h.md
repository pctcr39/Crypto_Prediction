# ADR-002 · Khoá khung 1 giờ và 4 giờ thành output HIỂN THỊ, không phát ý định giao dịch

- **Trạng thái:** Đề xuất → chờ chấp thuận
- **Ngày:** 27/08/2026
- **Bối cảnh:** `10 mandate 5` yêu cầu khoá 1h/4h; tài liệu này cung cấp **bằng chứng đo được** cho quyết định đó.

---

## 1 · Câu hỏi

Prototype dashboard hiển thị các khung từ 1 phút tới 1 tuần. Người dùng nhìn panel 4 giờ và hỏi một câu hợp lý: **"hệ thống dự đoán bốn tiếng tới thế nào?"**

Phương Pháp 4 (Position Trading & Trend Following) — quy tắc hướng sơ cấp của kiến trúc — vào lệnh **3,5 lần mỗi cặp mỗi năm** và giữ khoảng **6 ngày**. Nó **không có ý kiến gì** về bốn tiếng tới.

Vậy panel 4 giờ hiển thị cái gì?

## 2 · Bằng chứng

Đo trên **12.370 nến 4 giờ** BTCUSDT, 2021-01 → 2026-08.

### 2.1 · Chạy chính Phương Pháp 4 ở khung 4 giờ

| Tham số | Số lệnh | Lệnh/năm | Phí/năm | **Sharpe SAU phí** | Sharpe TRƯỚC phí |
|---|---|---|---|---|---|
| 20/200/55 | 109 | 19,3 | 5,8% | 0,59 | 0,85 |
| 50/150/20 | 138 | 24,4 | 7,3% | 0,57 | 0,81 |
| **10/100/20** | 224 | **39,7** | **11,9%** | **−0,02** | 0,46 |
| 50/200/100 | 67 | 11,9 | 3,6% | 0,64 | 0,79 |
| **mua-và-giữ** | 1 | — | 0,3% | **0,59** | |

**Trung vị sau phí: 0,58 — bằng đúng mua-và-giữ (0,59).**

Phương pháp giao dịch 12 – 40 lần mỗi năm để đạt **chính xác kết quả của việc không làm gì**. Phí ăn 0,20 – 0,25 Sharpe; bộ tham số nhanh nhất bị phí **xoá sạch** (0,46 → −0,02).

### 2.2 · Khung 4 giờ là bước ngẫu nhiên

| Phép đo | Kết quả |
|---|---|
| Tự tương quan lợi suất, độ trễ 1 – 12 | **−0,027 … +0,028** |
| Tỉ số phương sai VR(2) · VR(6) · VR(12) · VR(42) | **0,973 · 0,989 · 0,948 · 0,968** — mọi giá trị ≈ 1 |
| Baseline always-up | 50,98% |

### 2.3 · Ngưỡng thắng cần — tính bằng biên độ đo được

```
E|move| 4 giờ đo được                     :  0,790%
Ngưỡng thắng cần, giao ngay (0,30%)       :  69,0%
Ngưỡng thắng cần, vĩnh cửu (0,20%)        :  62,7%
Ngưỡng thắng cần, vĩnh cửu + funding nền  :  63,0%
                                             ─────
Trần năng lực dự báo hướng đo được        :  51 – 53%
RULE 11 giả định có rò rỉ từ              :  60%
```

> **Giao của «đủ lãi» và «đáng tin» là TẬP RỖNG, không phải tập hẹp.** Một mô hình 4 giờ đủ tốt để có lãi (≥63%) sẽ **tự động bị chính hệ kiểm định của repo tuyên là hỏng** (>60%).
>
> *(Con số này tái lập độc lập ước lượng của `10 §1.1`: 69,5% / 63,0% — nay đo được 69,0% / 62,7%.)*

### 2.4 · Nhưng có thứ DỰ BÁO ĐƯỢC ở khung 4 giờ

| Đại lượng | Phương pháp | Kết quả ngoài mẫu |
|---|---|---|
| **Biến động** nến 4 giờ tiếp theo | HAR ba thang (1 ngày / 5 ngày / 22 ngày) | **R² = 0,278** |
| **Hướng** nến 4 giờ tiếp theo | Cùng ba thang | **52,27%** — so với always-up 51,04% |

**Chênh lệch: biên hướng là 1,2 điểm, trong khi cần 18 điểm để hoà vốn. Biên độ thì dự báo được với R² 0,278.**

## 3 · Quyết định

**Khung 1 giờ và 4 giờ trở thành output HIỂN THỊ. Chúng KHÔNG BAO GIỜ phát `trade_intent`.**

Panel 4 giờ hiển thị **ba thứ, tất cả đều là số thật**:

| Hiển thị | Nguồn | Vì sao hợp lệ |
|---|---|---|
| **Dải giá q10 / q50 / q90** cho 4 giờ tới | `q = last_close · exp(z·σ̂·√H)` | Độ rộng đến từ σ̂ có R² 0,278 |
| **Biến động kỳ vọng** | HAR-RV | Đại lượng dự báo được |
| **`p_required` in NGAY CẠNH `p_up`** | Hàm chi phí | Người dùng **thấy** khoảng cách 63% so với 52%, không phải đoán rằng hệ hỏng |

Và **một thứ không hiển thị**: nút giao dịch, gợi ý vào lệnh, hay bất cứ thứ gì hàm ý hành động.

## 4 · Thực thi

**Hàng rào bằng mã** (`12 §8.4` Hàng rào 1):

```
với mọi (khung thời gian, công cụ):
    nếu p_required > sanity.suspicious_accuracy_1h:      # 0,60
        trade_intent PHẢI là None
```

Test: cố tình phát tín hiệu khung 4 giờ ⇒ khẳng định output là KHÔNG RÕ. **Không cờ cấu hình nào bật được nó.**

Lý do đặt trong mã chứ không trong quy ước: đây chính là dòng sẽ bị sửa vào cái đêm ai đó muốn "cho dashboard sinh động hơn". Khi nó bị sửa, không test nào đỏ trừ khi có test này.

## 5 · Hệ quả

**Tích cực:**
- Panel 4 giờ vẫn có nội dung thật — dải giá và biến động, đo được từng nến bằng độ phủ
- Người dùng thấy `p_required` và hiểu vì sao im lặng
- Chặn được chế độ hỏng nguy hiểm nhất: hạ ngưỡng khi bảng trống

**Tiêu cực:**
- Người dùng quen với dashboard giao dịch sẽ thất vọng vì không có tín hiệu 4 giờ
- Phải giải thích nhiều hơn trên giao diện

**Rủi ro nếu KHÔNG làm:**
- Phát tín hiệu 4 giờ cần thắng 63% để hoà vốn; hệ sẽ lỗ đều đặn và ổn định
- Hoặc: một mô hình báo cáo hơn 60% ở khung giờ, và `RULE 11` bắt buộc coi đó là rò rỉ

## 6 · Phương án đã cân nhắc và loại

| Phương án | Vì sao loại |
|---|---|
| Phát tín hiệu 4 giờ trên hợp đồng vĩnh cửu (phí thấp hơn) | 62,7% vẫn vượt xa trần 51–53% |
| Chỉ phát khi độ tin cậy rất cao | Độ tin cậy cao ở khung giờ **chính là** dấu hiệu rò rỉ theo `RULE 11` |
| Ẩn hẳn panel 1h/4h | Mất giá trị thật của nowcast biến động, và người dùng vẫn muốn nhìn giá |

---

*Bằng chứng: `scripts/measurements_2026_08_26/h4_reality.py` trên 12.370 nến 4 giờ. Liên quan: `10 mandate 5` · `11 §2.1` · `12 §6.2` tầng L4 · `13 §5` hàm chi phí.*
