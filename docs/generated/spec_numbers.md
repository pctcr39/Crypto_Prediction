# SỐ LIỆU CỦA ĐẶC TẢ — SINH TỰ ĐỘNG, KHÔNG SỬA TAY

> Sinh bởi `scripts/spec/measure_spec.py`, chạy lại được từ gốc repo.
> `docs/PREDICTION_DESIGN.md` **không chép** số nào từ đây — nó trỏ tới.
> Số nào script này không sinh ra được thì **không được xuất hiện** trong tài liệu.

Vũ trụ đo: BTCUSDT, ETHUSDT, SOLUSDT, DOGEUSDT · rào `1.2σ̂/6.0σ̂` · hạn 60 ngày · phí 0.3% khứ hồi

---

## 1 · Kinh tế học của khuyến nghị

| Đại lượng | Giá trị |
|---|---|
| Số sự kiện tranche | **1,114** |
| Tỉ lệ chốt lời | **29.2%** |
| Hoà vốn (payoff hợp đồng 5.00R) | **18.1%** |
| Biên trên điều kiện cổng | **+11.1 điểm** |
| R trung bình lệnh thắng | **4.67R** |
| R trung bình lệnh thua | -0.92R |
| **EV ròng mỗi sự kiện** | **+0.628R** |
| Thời gian nắm giữ trung bình | **6.5 ngày** |

**Kết cục:** `hit_stop` 689 · `hit_target` 211 · `superseded` 202 · `open_at_end` 12

## 2 · ★ Ngân sách im lặng — sự kiện mỗi đồng mỗi năm

| Cặp | Số sự kiện | Số năm | **Sự kiện/năm** |
|---|---|---|---|
| BTCUSDT | 215 | 5.6 | **38.1** |
| ETHUSDT | 332 | 7.0 | **47.5** |
| SOLUSDT | 236 | 6.0 | **39.1** |
| DOGEUSDT | 331 | 7.0 | **47.4** |

**Dải: 38 – 48 sự kiện/đồng/năm.** Với vũ trụ khuyến nghị 8–10 đồng: **305 – 475 khuyến nghị/năm**.

## 3 · Hằng số dẫn xuất

| Hằng số | Giá trị | Đo thế nào |
|---|---|---|
| `ABS_MOVE_RATIO` | **0.7266** | E\|move\| / σ̂ **HAR** (không phải σ close-to-close) |
| `c_R` (σ̂ tham chiếu 3,00%) | 0.0833 | 0.3% / (1.2·σ̂·100) |
| Hoà vốn trượt giá dừng lỗ | **1.81R** | từ chính (p=29.2%, W=4.67R) |

| Lỗ thực nhận | EV |
|---|---|
| 1.0R | +0.571R |
| 1.3R | +0.359R |
| 1.4R | +0.288R |
| 1.5R | +0.217R |
| 1.81R | -0.003R |

## 3b · Quay vòng và tiền phí

| Cặp | Quay vòng (`w`/năm) | Phí/năm trên **vốn chiến lược** | Sự kiện/năm | Phí/năm trên **NAV** *(tranche 1% NAV)* |
|---|---|---|---|---|
| BTCUSDT | 7.9 | 1.19% | 38.1 | 0.114% |
| ETHUSDT | 7.9 | 1.19% | 47.5 | 0.143% |
| SOLUSDT | 6.2 | 0.93% | 39.1 | 0.117% |
| DOGEUSDT | 6.3 | 0.94% | 47.4 | 0.142% |

**Phí trên NAV: 0.114 – 0.143% mỗi đồng mỗi năm.** Với 9 đồng: **1.03 – 1.29% NAV/năm**.

> Tần suất cao nhưng **mỗi lệnh nhỏ**. Bức tường phí của `08 §A2` tính cho lệnh **toàn vốn**; ở đây mỗi tranche là 1% NAV nên tiền phí không tỉ lệ với số lệnh theo cách đó.


## 3c · ★ TRỤC D — phân tầng theo độ chọn lọc (ADR-018)

Tập LỒNG NHAU trên cùng danh sách đã phát. Một mô hình, một hiệu chỉnh, một cổng.

| Tầng | Cắt tại `level` | n | **Sự kiện/đồng/năm** | % thắng | EV/lệnh | SE | Tổng R | So với Đầy đủ |
|---|---|---|---|---|---|---|---|---|
| **Đầy đủ** | ≥ 0.25 | 1,114 | **43.4** | 29.2% | +0.649R | 0.097 | +723.0R | — (mốc) |
| **Cân bằng** | ≥ 0.50 | 713 | **27.8** | 30.2% | +0.622R | 0.117 | +443.7R | z=-0.18 không phân biệt được |
| **Chọn lọc** | ≥ 0.75 | 436 | **17.0** | 30.5% | +0.584R | 0.147 | +254.5R | z=-0.37 không phân biệt được |
| **Tối thiểu** | ≥ 1.00 | 177 | **6.9** | 32.8% | +0.565R | 0.225 | +100.0R | z=-0.34 không phân biệt được |

**Kết luận: 0/3 tầng khác biệt có ý nghĩa so với Đầy đủ.**
Độ lệch chuẩn R mỗi sự kiện = **3.23R** — rất lớn. Để phân biệt được chênh lệch 0,15R ở mức 95% cần **≈1,775 sự kiện mỗi tầng**; hiện có **1,114** trên 25.7 đồng-năm.

> ⚠️ **Tầng KHÔNG phải thang chất lượng.** EV mỗi lệnh không phân biệt được giữa các tầng. Tầng chỉ điều tiết **tần suất** và do đó **tổng lợi nhuận** — ít lệnh hơn nghĩa là ít tổng R hơn ở cùng chất lượng kỳ vọng, không phải chất lượng cao hơn. Giao diện không được ngụ ý ngược lại.


## 4 · GATE 1a — tỉ số sụt giảm, thang `w`

| Cặp | Sụt giảm chiến lược | Mua-và-giữ | **Tỉ số** | Ngưỡng 0,60 |
|---|---|---|---|---|
| BTCUSDT | -24.67% | -76.63% | **0.3219** | đạt |
| ETHUSDT | -29.44% | -79.3% | **0.3713** | đạt |
| SOLUSDT | -44.98% | -96.27% | **0.4672** | đạt |
| DOGEUSDT | -70.55% | -92.33% | **0.7641** | **TRƯỢT** |

**3/4 cặp đạt.** Cổng đòi ≥80% ⇒ với 4 cặp hiệu chuẩn, ngưỡng chưa đạt.

## 5 · Độ bền qua bề mặt rào chắn — chạy TRÊN CHÍNH máy tranche

| stop | target | payoff | n | % thắng | hoà vốn | biên | R TB thắng | EV |
|---|---|---|---|---|---|---|---|---|
| 1.0 | 3.0 | 3.0R | 1,859 | 27.6% | 27.5% | +0.1 | 4.07R | +0.331R |
| 1.0 | 4.0 | 4.0R | 1,573 | 26.4% | 22.0% | +4.4 | 4.61R | +0.412R |
| 1.0 | 4.8 | 4.8R | 1,455 | 25.6% | 19.0% | +6.6 | 5.04R | +0.479R |
| 1.0 | 6.0 | 6.0R | 1,263 | 25.4% | 15.7% | +9.7 | 5.59R | +0.617R |
| 1.2 | 3.0 | 2.5R | 1,652 | 31.1% | 31.0% | +0.1 | 3.44R | +0.334R |
| 1.2 | 4.0 | 3.33R | 1,411 | 29.7% | 25.0% | +4.7 | 3.88R | +0.408R |
| 1.2 | 4.8 | 4.0R | 1,297 | 28.7% | 21.7% | +7.0 | 4.23R | +0.466R |
| 1.2 | 6.0 | 5.0R | 1,114 | 29.2% | 18.1% | +11.1 | 4.67R | +0.628R ← |
| 1.5 | 3.0 | 2.0R | 1,437 | 34.7% | 35.6% | -0.9 | 2.83R | +0.317R |
| 1.5 | 4.0 | 2.67R | 1,262 | 32.5% | 29.1% | +3.4 | 3.19R | +0.352R |
| 1.5 | 4.8 | 3.2R | 1,144 | 32.3% | 25.4% | +6.9 | 3.48R | +0.443R |
| 1.5 | 6.0 | 4.0R | 982 | 32.5% | 21.3% | +11.2 | 3.86R | +0.583R |
| 2.0 | 3.0 | 1.5R | 1,160 | 41.4% | 42.0% | -0.6 | 2.13R | +0.333R |
| 2.0 | 4.0 | 2.0R | 1,009 | 39.2% | 35.0% | +4.2 | 2.44R | +0.400R |
| 2.0 | 4.8 | 2.4R | 928 | 38.3% | 30.9% | +7.4 | 2.65R | +0.451R |
| 2.0 | 6.0 | 3.0R | 820 | 37.9% | 26.2% | +11.7 | 2.94R | +0.555R |

**Biên: trung vị +5.7 · min -0.9 · max +11.7** · 14/16 ô biên dương · 16/16 ô EV dương


## 6 · ★ Hai ngưỡng, hai thứ nguyên — dây an toàn `PRED-02`

`p_required` = hoà vốn cược đối xứng 1:1 (**chỉ hiển thị**) · `p_star` = hoà vốn của chính rào chắn `1.2σ̂/6.0σ̂` (**cổng quyết định**). Cùng hàm chi phí, khác thứ nguyên.

| σ̂ ngày | `p_required` (H = 1 ngày) | `p_required` (H = giữ 6.47 ngày) | `c_R` | `p_star` |
|---|---|---|---|---|
| 0.8% | **75.8%** ⛔ | **60.1%** ⛔ | 0.312 | 21.9% |
| 1.0% | **70.6%** ⛔ | 58.1% | 0.250 | 20.8% |
| 1.5% | **63.8%** ⛔ | 55.4% | 0.167 | 19.4% |
| 2.0% | **60.3%** ⛔ | 54.1% | 0.125 | 18.8% |
| 2.5% | 58.3% | 53.2% | 0.100 | 18.3% |
| 3.0% | 56.9% | 52.7% | 0.083 | 18.1% |
| 4.0% | 55.2% | 52.0% | 0.062 | 17.7% |
| 5.0% | 54.1% | 51.6% | 0.050 | 17.5% |

**Dây an toàn `p_required > 0.60` kích hoạt khi σ̂ ngày < 2.06%** (chân trời 1 ngày) hoặc **< 0.81%** (chân trời bằng thời gian nắm giữ). Trên cùng dải σ̂, `p_star` chỉ đi từ 21.9% xuống 17.5%.

> ⚠️ Khung 1 ngày là khung **duy nhất** được phát ý định (ADR-002). Một dây an toàn kích hoạt ở biến động thấp sẽ bịt miệng đúng khung nó được viết ra để bảo vệ — và bịt đúng lúc chi phí trên mỗi R đang thấp nhất. Xem `docs/04_PREDICTION_SPEC.md §2.5`.


## 7 · ★ Ranh giới của trạng thái `bác bỏ` — không hằng số, một phát biểu

Phát biểu đăng ký trước: **«cận trên một phía 95% của EV nằm dưới 0»**. Không có ngưỡng hằng số — ranh giới tự suy từ `n` và độ lệch chuẩn R mỗi sự kiện (**3.23R**, đo được) tại đúng thời điểm chấm.

| n sự kiện | sai số chuẩn | EV đo phải âm hơn | … nếu `n_eff` chỉ bằng 25% `n` |
|---|---|---|---|
| 300 | 0.1865R | **-0.307R** | -0.614R |
| 500 | 0.1444R | **-0.238R** | -0.475R |
| 1,000 | 0.1021R | **-0.168R** | -0.336R |
| 1,114 ← cỡ hiện có | 0.0968R | **-0.159R** | -0.318R |
| 2,000 | 0.0722R | **-0.119R** | -0.238R |

> ⚠️ **Sai số chuẩn ngây thơ là LẠC QUAN.** Sự kiện chồng lấn thời gian và tương quan chéo coin làm `n` hiệu dụng nhỏ hơn `n` thô — cột cuối cho thấy ranh giới xê dịch bao xa. Phép chấm thật dùng **phân vị block bootstrap**, độ dài khối ≥ độ dài nhãn; **không** dùng ±z·SE.

> Đọc bảng: với cỡ mẫu hiện thực, `bác bỏ` chỉ bắt được thứ **hỏng rõ rệt**. Đó là tính chất đúng — bác nhầm một phương pháp thật ra tốt cũng là sai lầm tốn kém. Xem `docs/04_PREDICTION_SPEC.md §8.5`.
