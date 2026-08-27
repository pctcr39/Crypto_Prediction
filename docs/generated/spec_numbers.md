# SỐ LIỆU CỦA ĐẶC TẢ — SINH TỰ ĐỘNG, KHÔNG SỬA TAY

> Sinh bởi `scripts/spec/measure_spec.py`, chạy lại được từ gốc repo.
> `docs/PREDICTION_DESIGN.md` **không chép** số nào từ đây — nó trỏ tới.
> Số nào script này không sinh ra được thì **không được xuất hiện** trong tài liệu.

Vũ trụ đo: BTCUSDT, ETHUSDT, SOLUSDT, DOGEUSDT · rào `1.2σ̂/4.0σ̂` · hạn 60 ngày · phí 0.3% khứ hồi

---

## 1 · Kinh tế học của khuyến nghị

| Đại lượng | Giá trị |
|---|---|
| Số sự kiện tranche | **1,411** |
| Tỉ lệ chốt lời | **29.7%** |
| Hoà vốn (payoff hợp đồng 3.33R) | **25.0%** |
| Biên trên điều kiện cổng | **+4.7 điểm** |
| R trung bình lệnh thắng | **3.88R** |
| R trung bình lệnh thua | -0.94R |
| **EV ròng mỗi sự kiện** | **+0.408R** |
| Thời gian nắm giữ trung bình | **5.1 ngày** |

**Kết cục:** `hit_stop` 892 · `hit_target` 347 · `superseded` 160 · `open_at_end` 12

## 2 · ★ Ngân sách im lặng — sự kiện mỗi đồng mỗi năm

| Cặp | Số sự kiện | Số năm | **Sự kiện/năm** |
|---|---|---|---|
| BTCUSDT | 285 | 5.6 | **50.5** |
| ETHUSDT | 431 | 7.0 | **61.7** |
| SOLUSDT | 313 | 6.0 | **51.8** |
| DOGEUSDT | 382 | 7.0 | **54.7** |

**Dải: 50 – 62 sự kiện/đồng/năm.** Với vũ trụ khuyến nghị 8–10 đồng: **404 – 617 khuyến nghị/năm**.

## 3 · Hằng số dẫn xuất

| Hằng số | Giá trị | Đo thế nào |
|---|---|---|
| `ABS_MOVE_RATIO` | **0.7266** | E\|move\| / σ̂ **HAR** (không phải σ close-to-close) |
| `c_R` (σ̂ tham chiếu 3,00%) | 0.0833 | 0.3% / (1.2·σ̂·100) |
| Hoà vốn trượt giá dừng lỗ | **1.52R** | từ chính (p=29.7%, W=3.88R) |

| Lỗ thực nhận | EV |
|---|---|
| 1.0R | +0.365R |
| 1.3R | +0.154R |
| 1.4R | +0.084R |
| 1.5R | +0.013R |
| 1.52R | -0.001R |

## 3b · Quay vòng và tiền phí

| Cặp | Quay vòng (`w`/năm) | Phí/năm trên **vốn chiến lược** | Sự kiện/năm | Phí/năm trên **NAV** *(tranche 1% NAV)* |
|---|---|---|---|---|
| BTCUSDT | 7.9 | 1.19% | 50.5 | 0.151% |
| ETHUSDT | 7.9 | 1.19% | 61.7 | 0.185% |
| SOLUSDT | 6.2 | 0.93% | 51.8 | 0.155% |
| DOGEUSDT | 6.3 | 0.94% | 54.7 | 0.164% |

**Phí trên NAV: 0.151 – 0.185% mỗi đồng mỗi năm.** Với 9 đồng: **1.36 – 1.67% NAV/năm**.

> Tần suất cao nhưng **mỗi lệnh nhỏ**. Bức tường phí của `08 §A2` tính cho lệnh **toàn vốn**; ở đây mỗi tranche là 1% NAV nên tiền phí không tỉ lệ với số lệnh theo cách đó.


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
| 1.2 | 4.0 | 3.33R | 1,411 | 29.7% | 25.0% | +4.7 | 3.88R | +0.408R ← |
| 1.2 | 4.8 | 4.0R | 1,297 | 28.7% | 21.7% | +7.0 | 4.23R | +0.466R |
| 1.2 | 6.0 | 5.0R | 1,114 | 29.2% | 18.1% | +11.1 | 4.67R | +0.628R |
| 1.5 | 3.0 | 2.0R | 1,437 | 34.7% | 35.6% | -0.9 | 2.83R | +0.317R |
| 1.5 | 4.0 | 2.67R | 1,262 | 32.5% | 29.1% | +3.4 | 3.19R | +0.352R |
| 1.5 | 4.8 | 3.2R | 1,144 | 32.3% | 25.4% | +6.9 | 3.48R | +0.443R |
| 1.5 | 6.0 | 4.0R | 982 | 32.5% | 21.3% | +11.2 | 3.86R | +0.583R |
| 2.0 | 3.0 | 1.5R | 1,160 | 41.4% | 42.0% | -0.6 | 2.13R | +0.333R |
| 2.0 | 4.0 | 2.0R | 1,009 | 39.2% | 35.0% | +4.2 | 2.44R | +0.400R |
| 2.0 | 4.8 | 2.4R | 928 | 38.3% | 30.9% | +7.4 | 2.65R | +0.451R |
| 2.0 | 6.0 | 3.0R | 820 | 37.9% | 26.2% | +11.7 | 2.94R | +0.555R |

**Biên: trung vị +5.7 · min -0.9 · max +11.7** · 14/16 ô biên dương · 16/16 ô EV dương
