# ADR-013 · Sửa lỗi thứ nguyên payoff và lỗi off-by-one điểm vào

- **Trạng thái:** Đã chấp thuận (27/08/2026)
- **Bối cảnh:** Phát hiện trong vòng phản biện đối kháng `PREDICTION_DESIGN` 1.0-rc1
- **Phạm vi ảnh hưởng:** `10 §2/C` (gốc) · `11` · `12` · `15` · `17 §1.2` · `PREDICTION_DESIGN §L4`

---

## 1 · Hai lỗi

### Lỗi 1 — thứ nguyên payoff

Rào chắn được định nghĩa bằng **hệ số của σ̂**: `stop = entry × (1 − 1,2σ̂)` · `target = entry × (1 + 4,0σ̂)`.

Đơn vị rủi ro `R` = khoảng cách tới stop = `1,2σ̂`. Do đó:

```
Thắng = 4,0σ̂ / 1,2σ̂ = 3,333 R          ← KHÔNG phải 4,0 R
Thua  = 1,0 R
EV = 0  ⟺  p·(tp/sl) = (1−p) + c_R
        ⟺  p* = (1 + c_R) / (tp/sl + 1)        mẫu số 4,333
```

Công thức đã dùng: `(1 + c_R) / (tp_mult + 1)` — **mẫu số 5**, tức coi `4,0` là tỉ số payoff.

| σ̂ | R = 1,2σ̂ | c_R | p\* sai | **p\* đúng** |
|---|---|---|---|---|
| 3,00% | 3,60% | 0,083 | 21,7% | **25,0%** |
| 2,43% | 2,92% | 0,103 | 22,1% | **25,5%** |

### Lỗi 2 — off-by-one điểm vào (trong script đo)

```
pp4_data_needs.run()  →  (p, ret)   với  p = sig.shift(1)      ← ĐÃ dịch
pp4_final.py          →  lấy entry từ p, rồi vào tại open[i+1]
                         ⟹ vào tại open[t_tín_hiệu + 2] — CHẬM MỘT NGÀY

trend.py run()        →  (sig, p, ret);  null.py / all27.py dùng `sig` CHƯA dịch
                         ⟹ vào tại open[t_tín_hiệu + 1] — ĐÚNG quy ước repo
```

| | Sai | **Đúng** |
|---|---|---|
| BTCUSDT | 34,8% | **47,8%** |
| ETHUSDT | 34,8% | **43,5%** |
| SOLUSDT | 21,1% | **27,8%** |
| DOGEUSDT | 28,0% | **16,0%** |
| **Tổng** | 30,0% (90 lệnh) | **33,7% (89 lệnh)** |

Kiểm chứng chéo: `null.py` độc lập cho BTC **11/23 = 47,8%** — khớp.
**Chỉ `15 §1.5` bị ảnh hưởng.** Số của `12` (`null.py`, `all27.py`) dùng quy ước đúng.

---

## 2 · Hai lỗi triệt tiêu nhau gần hết

| | Tỉ lệ chốt lời | Hoà vốn | **Biên** |
|---|---|---|---|
| Tuyên bố trong tài liệu | 30,0% | 21,7% | +8,3 điểm |
| Chỉ sửa lỗi 1 | 30,0% | 25,0% | +5,0 điểm |
| **Sửa cả hai** | **33,7%** | **25,0%** | **+8,7 điểm** |

> **Con số headline gần như không đổi, nhưng cả hai đầu vào đều sai.** Đây là dạng lỗi nguy hiểm nhất — một kết quả đúng-vẻ-ngoài sinh ra từ hai sai số bù trừ. Sửa một cái mà không sửa cái kia sẽ làm tài liệu *trông tệ hơn sự thật*.

**Sức chịu trượt giá — tính lại tại p = 33,7%:**

| Lỗ thực nhận | EV |
|---|---|
| 1,00R | +0,377R |
| 1,30R *(cảnh báo)* | +0,171R |
| 1,40R *(chặn)* | +0,105R |
| **1,57R** | **−0,001R** ← hoà vốn |

Ngưỡng cổng 1,3R / 1,4R **giữ nguyên** — nay có lý do đúng: chúng nằm trong vùng kỳ vọng dương.

---

## 3 · Quyết định

**Giữ nguyên rào `1,2σ̂ / 4,0σ̂`. Sửa công thức, không sửa tham số.**

Ba lý do:

| # | Lý do |
|---|---|
| **1** | **Phương pháp** — đổi tham số để khôi phục một kết luận mong muốn là p-hacking mà `16` cấm |
| **2** | **Số học** — nâng target lên 4,8σ̂ (payoff 4:1 thật) cho biên **+7,5** so với **+8,7** hiện tại: tệ hơn |
| **3** | **Không cần thiết** — sau khi sửa cả hai lỗi, biên là +8,7 điểm |

**Kiểm độ bền qua 16 cấu hình rào** *(89 lệnh, 4 cặp — kiểm tra, không phải thủ tục chọn)*: **16/16 ô cho biên dương**, trung vị +8,2, độ lệch 2,8. Ô đang dùng nằm trên trung vị. Kết luận không phụ thuộc lựa chọn rào.

**Ngưỡng cổng `27,5%` giữ nguyên** — vốn là biên thận trọng đặt trên hoà vốn (sai) 22,0%, và vẫn nằm trên hoà vốn (đúng) 25,0–25,5% với biên 2,0–2,5 điểm.

---

## 4 · Bất biến mới — để lỗi này không quay lại

```python
# Bất biến 23 — kỳ vọng tại p_star bằng 0
#   Tính EV TRỰC TIẾP từ sl_mult / tp_mult / cost, KHÔNG đọc lại công thức p*.
#   Đây là điểm mấu chốt: bảng số không bắt được lỗi thứ nguyên, phép thử này bắt.
assert abs(EV(p_star_event(σ), sl_mult, tp_mult, cost)) < 1e-9   for σ in 0,005 … 0,20

# Bất biến 24 — khoảng cách null → hoà vốn, luôn dương
assert p_star − sl/(sl+tp) == c_R / (1 + tp/sl)
```

**Bất biến 24 phát biểu một sự thật cấu trúc:** dưới bước ngẫu nhiên, **mọi** cấu hình rào chắn đều lỗ đúng bằng `c_R/(1+r)`. Hình dạng cược **không tạo ra edge** — nó chỉ đổi mức nâng tỉ lệ thắng mà tín hiệu phải cung cấp (với 1,2/4,0: **1,92 điểm**; tín hiệu đo được nâng **10,6 điểm**).

---

## 5 · Vì sao không phát hiện sớm hơn

Lỗi 1 đi qua **sáu tài liệu** và **hai vòng phản biện đối kháng** (69 + 58 phát hiện). Nó chỉ lộ ra khi một agent **tự đạo hàm lại công thức** thay vì đọc lại nó.

Lỗi 2 nằm trong script đo của chính tác giả, ẩn sau một trùng hợp: cả hai phép đo khác nhau đều ra **30,0%**.

**Bài học đưa vào `16` (phương pháp thiết kế):**

> **Đọc lại một công thức không phải kiểm tra nó.** Với mọi biểu thức mà một quyết định đứng lên, phải **đạo hàm lại độc lập từ định nghĩa** và **viết một bất biến tính đại lượng đó bằng đường khác**. Bảng số chỉ kiểm được số học, không kiểm được thứ nguyên.

---

## 6 · Đã áp dụng

| Tệp | Thay đổi |
|---|---|
| `PREDICTION_DESIGN.md` | Công thức `p_star_event` · bảng kiểm số học · bảng trượt giá · bề mặt 16 ô · bất biến 23, 24 · Phụ lục A |
| `10` · `11` · `12` · `15` · `17` | Ghi chú sửa tại chỗ, trỏ về ADR này (giữ nguyên bản ghi gốc — hồ sơ bằng chứng không viết lại) |
| `scripts/measurements_2026_08_26/pp4_final.py` | Vá off-by-one, chạy lại xác nhận 33,7% |
| `scripts/measurements_2026_08_26/barrier_surface.py` | **Mới** — đo bề mặt 16 cấu hình rào |

---

*Số liệu: `barrier_surface.py` · `pp4_final.py` (đã vá) · `null.py`. Mọi con số trong ADR này chạy lại được từ gốc repo.*
