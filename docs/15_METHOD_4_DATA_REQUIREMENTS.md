# PHƯƠNG PHÁP 4: POSITION TRADING & TREND FOLLOWING — TRÌNH BÀY, VẤN ĐỀ, VÀ LƯỢNG DỮ LIỆU CẦN

> Phiên bản 1.0 · 27/08/2026
> Trả lời ba câu hỏi: ① phương pháp này là gì, chính xác? ② cần xem xét những vấn đề nào? ③ **cần dữ liệu dài bao lâu mới đánh giá được?**
> Câu ③ được đo trực tiếp: 90 lệnh thật trên **bốn cặp** (BTC · ETH · SOL · DOGE, 2019–2026), đường ổn định theo độ dài cửa sổ, và tương quan kết cục lệnh đo bằng 61 cặp lệnh chồng lấn.
> **Tài liệu này SỬA một con số của `11 §7.2` theo hướng XẤU hơn** — xem §3.5.
> **Không phải lời khuyên đầu tư.**

---

# PHẦN 0 · TRẢ LỜI TRONG MỘT TRANG

## 0.1 · Câu trả lời cho "cần dữ liệu bao lâu"

**Không có một câu trả lời — có ba, và chúng chênh nhau hơn mười lần.**

| Bạn muốn trả lời câu hỏi nào | Chỉ tiêu | **Dữ liệu cần (40 cặp)** | Có sẵn chưa? |
|---|---|---|---|
| *"Nó có cắt sụt giảm không?"* | Tỉ số sụt giảm ≤ 0,60 | **3 năm** | ✅ **Tải được ngay hôm nay** |
| *"Nó có hơn mua-và-giữ không?"* | Sharpe vượt ≥ 0,30 | **hơn 5 năm** | 🔶 Ranh giới |
| *"Tỉ lệ thắng có thật sự trên hoà vốn không?"* | 229 lệnh độc lập | **34 năm** | ❌ **Không bao giờ** |

> **Câu hỏi bạn chọn hỏi quyết định lượng dữ liệu cần, và khoảng cách giữa các lựa chọn là mười lần.** Đây là lý do `12 §6.6` đổi cổng GATE 1 từ Sharpe sang tỉ số sụt giảm — không phải vì tỉ số sụt giảm đẹp hơn, mà vì **nó là chỉ tiêu duy nhất trả lời được bằng lượng dữ liệu tồn tại**.

## 0.2 · Con số gây sốc nhất

**Độ lệch chuẩn của Sharpe đo trên cửa sổ MỘT NĂM = 1,24.**

Nghĩa là một backtest một năm của phương pháp này có thể cho ra Sharpe bất kỳ đâu trong khoảng khoảng **−1,8 đến +3,2**. Không phân biệt được hệ tuyệt vời với hệ tồi tệ.

| Độ dài cửa sổ | Số lệnh TB | Sharpe trung vị | **Độ lệch Sharpe** | Tỉ số sụt giảm trung vị | **Độ lệch tỉ số** |
|---|---|---|---|---|---|
| 0,5 năm | 2 | 0,66 | **1,59** | 0,58 | 0,28 |
| 1 năm | 4 | 0,68 | **1,24** | 0,68 | 0,23 |
| 1,5 năm | 5 | 0,78 | 0,96 | 0,70 | 0,21 |
| 2 năm | 8 | 0,87 | 0,69 | 0,69 | 0,20 |
| 3 năm | 12 | 0,91 | **0,41** | 0,66 | **0,18** |
| 4 năm | 16 | 0,83 | **0,41** | 0,60 | **0,18** |

> **Đọc hai cột cuối so với hai cột giữa:** Sharpe phải đi từ 1,59 xuống 0,41 mới dùng được — **giảm 74%**. Tỉ số sụt giảm chỉ giảm 36%, vì **nó đã ổn định ngay từ đầu**: trung vị nằm trong khoảng 0,58 – 0,70 ở **mọi** độ dài cửa sổ.
>
> Tỉ số sụt giảm không cần hội tụ. Nó bắt đầu đã hội tụ.

## 0.3 · Ba vấn đề lớn nhất cần xem xét

| # | Vấn đề | Trạng thái |
|---|---|---|
| **1** | Chọn tham số **không chuyển** từ quá khứ sang tương lai (tương quan hạng +0,19) | ✅ Đã giải — dùng **tổ hợp 27 ô**, `12 §6.5` |
| **2** | Ba tham số khung rào chắn **mâu thuẫn nhau** — payoff 4:1 không xảy ra ở cấu hình đã đặc tả | ✅ Đã giải — khoá `k=1`, `12 §2.8` |
| **3** | **Cơ chế có thể đang mòn** — 2021–2026 yếu hơn 2014–2026 | ❌ **Không giải được bằng dữ liệu.** Chỉ quản trị được |

---

# PHẦN 1 · TRÌNH BÀY PHƯƠNG PHÁP

## 1.1 · Ý tưởng trong ba dòng

```
Khi giá đang trong xu hướng tăng dài hạn VÀ vừa phá lên đỉnh N kỳ  →  MUA
Khi giá rơi xuống dưới đường trung bình nhanh                       →  ĐỨNG NGOÀI
Không bao giờ BÁN KHỐNG. Chỉ giao ngay. Khớp tại giá mở nến kế tiếp.
```

Trạng thái hợp lệ: **MUA** hoặc **ĐỨNG NGOÀI**. Đó là toàn bộ.

## 1.2 · Đặc tả đầy đủ

```python
# ── TIN HIEU: tinh tai gia DONG nen t · vao lenh tai gia MO nen t+1 ──
ema_nhanh   = EMA(close, 20 | 50)                    # tham so 1
ema_cham    = EMA(close, 100 | 150 | 200)            # tham so 2
donchian_hi = max(high[t-N … t-1])                   # tham so 3 — KHONG gom nen t

VAO  :  close[t] > ema_cham[t]   VA   close[t] > donchian_hi[t]
RA   :  close[t] < ema_nhanh[t]  HOAC  cham cat lo / chot loi / het han

# ── SINH SU KIEN cho tang loc bo ──
cat_lo   = gia_vao × (1 − 1,2 · σ̂_ngay)      # ~2,8% voi σ̂ = 2,33%
chot_loi = gia_vao × (1 + 4,0 · σ̂_ngay)      # ~9,3%
het_han  = 60 ngay
#   ★ σ̂ phai la σ̂ NGAY (k=1). Xem §2.2 — moi thang khac lam rao thoi gian chi phoi.

# ── HUONG: TO HOP, khong chon mot o ──
ti_trong = trung_binh([tin_hieu(ef,es,dn) for ef,es,dn in LUOI_27_O])
ti_trong = lam_tron(ti_trong, {0 · 0,25 · 0,50 · 0,75 · 1,00})
```

**Công cụ: GIAO NGAY.** Thời gian nắm giữ thực tế khoảng 6 ngày > ngưỡng đổi công cụ 3,4 ngày (`13 §5.1`) ⇒ giao ngay luôn rẻ hơn hợp đồng vĩnh cửu.

## 1.3 · Vì sao nó hoạt động — và giải thích nào áp dụng cho crypto

| Giải thích | Cơ chế | Áp dụng? |
|---|---|---|
| **Phản ứng dưới mức với tin tức** (Hong & Stein 1999) | Thông tin lan chậm qua các lớp nhà đầu tư | ✅ **Mạnh** — crypto có đường cong chấp nhận kéo dài nhiều tháng |
| Phần bù cho bên nhận rủi ro từ người phòng hộ | Nhà sản xuất hàng hoá phải bán khống | ❌ **Không** — crypto không có nhà sản xuất có nhu cầu thương mại |
| Dòng tiền hệ thống, chen chúc | Quỹ theo xu hướng tự tạo xu hướng | 🔶 Yếu — quy mô nhỏ |
| Khai thác dữ liệu (phê phán) | Xu hướng là ảo ảnh của việc thử nghìn quy tắc | ⚠️ **Không loại trừ được** |

> **Điều này quyết định vì sao chọn Phương Pháp 4:** nếu edge chủ yếu đến từ giải thích thứ hai thì nó **không chuyển sang crypto**, và literature ngoài crypto trở thành bằng chứng không liên quan. Bằng chứng nghiêng về giải thích thứ nhất — **nhưng giải thích thứ nhất cũng dự đoán rằng edge mòn dần khi thị trường trưởng thành**, và đó chính xác là điều số liệu cho thấy (§2.11).

## 1.4 · Hồ sơ thống kê — vì sao Sharpe là chỉ tiêu sai

Phương pháp này có **lợi nhuận lệch dương**: nhiều lệnh thua nhỏ, ít lệnh thắng rất lớn. Về cấu trúc nó tương đương **vị thế mua quyền chọn hai chiều** — trả phí bảo hiểm trong thị trường đi ngang, thu về trong các cú dịch chuyển lớn.

| Hệ quả | Nội dung |
|---|---|
| **Sharpe phạt độ lệch dương** | Mẫu số tính cả các cú **thắng** lớn ⇒ chấm thấp hơn giá trị thật |
| **Chuỗi thua dài là đặc tính** | Tỉ lệ thắng 30% ⇒ thua 8 lệnh liên tiếp có xác suất **5,8%** — gần như chắc chắn xảy ra |
| **Chỉ tiêu đúng đo ĐUÔI** | Tỉ số sụt giảm, không phải Sharpe — và §3 cho thấy nó cũng là chỉ tiêu **đo được nhanh nhất** |

## 1.5 · Số đo thực tế trên bốn cặp

| Cặp | Số năm | Số lệnh | Lệnh/năm | Tỉ lệ chốt lời |
|---|---|---|---|---|
| BTCUSDT | 5,6 | 23 | 4,1 | 34,8% |
| ETHUSDT | 7,0 | 23 | 3,3 | 34,8% |
| SOLUSDT | 6,0 | 19 | 3,1 | **21,1%** |
| DOGEUSDT | 7,0 | 25 | 3,6 | 28,0% |
| **TỔNG** | | **90** | **3,5** | **30,0%** |

*Tỉ lệ nền khớp cửa sổ (`12 §2.9`): 23,7% · Hoà vốn payoff 4:1: 22,0%*

> **Chú ý SOL: 21,1% — dưới cả tỉ lệ nền.** Với khoảng 20 lệnh mỗi cặp, độ phân tán giữa các cặp rất lớn. Đây là §3 dưới dạng trực quan: **cỡ mẫu mỗi cặp quá nhỏ để nói bất cứ điều gì về cặp đó.**

---

# PHẦN 2 · MƯỜI HAI VẤN ĐỀ CẦN XEM XÉT

## Nhóm A · Đã giải quyết bằng phép đo

### 2.1 · Chọn tham số không chuyển từ quá khứ sang tương lai

**Vấn đề:** bộ tham số nào? EMA 20/200? 50/150? Donchian 20 hay 55?

**Đã đo** (`12 §2.6`):

```
Tương quan hạng 27 ô giữa hai đoạn thời gian     :  +0,19
Ô tốt nhất Đoạn 1 (Sharpe 1,04) → Đoạn 2         :  0,72
Mua-và-giữ Đoạn 2                                 :  0,72   ← BẰNG NHAU
Bộ tham số `09` trích (20/200/55)                :  Đoạn 1 −0,16 · Đoạn 2 +1,12
```

**✅ Giải pháp: tổ hợp cả 27 ô.** Vượt ô trung vị ở cả ba đoạn, cắt sụt giảm sâu hơn mọi ô đơn lẻ (tỉ số 0,29/0,29/0,31), và **xoá bỏ hoàn toàn quyết định tuỳ tiện**. `12 §6.5`.

### 2.2 · Ba tham số khung rào chắn mâu thuẫn nhau

**Vấn đề:** `10` đặc tả cắt lỗ 1,2σ̂ · chốt lời 4,0σ̂ · hết hạn 60 ngày · giữ ~35 ngày. **Bốn số này không tương thích.**

**Đã đo** (`12 §2.8`): ở thang σ̂ 35 ngày, **11 trong 23 lệnh kết thúc bằng HẾT HẠN** chứ không chạm rào giá. **Payoff 4:1 không hề xảy ra** — mà toàn bộ lập luận kinh tế dựa trên nó.

**✅ Giải pháp: khoá `k = 1` (thang σ̂ NGÀY).** Khi đó 0/23 lệnh hết hạn, thời gian nắm giữ thực tế ~6 ngày.

**Hệ quả về danh xưng:** vào lệnh bằng tín hiệu Phương Pháp 4, thoát bằng cấu trúc **Phương Pháp 3**. Gọi đúng tên để chọn đúng bảng chi phí và đúng đối chứng.

### 2.3 · Công cụ giao ngay hay hợp đồng vĩnh cửu

**Đã đo** (`13 §5.1`): ngưỡng đổi công cụ `= (0,30 − 0,20)/f̂` = **3,4 ngày** ở funding trung vị BTC, **2,4 ngày** ở chế độ biến động cao.

**✅ Giải pháp: GIAO NGAY, không ngoại lệ.** Giữ 6 ngày > mọi ngưỡng. Và `13 §5.2` đo được mức phạt của perp **tăng theo biến động** (+0,3 → +0,7 → +1,1 điểm) — perp tệ nhất đúng vào chế độ muốn giao dịch.

### 2.4 · Chỉ mua hay mua-bán hai chiều

**✅ Giải pháp: chỉ mua hoặc đứng ngoài.** Ba lý do độc lập:
1. Bán khống đứng ngược trôi dương dài hạn
2. `09 §2`: sau cực trị funding dương giá **tiếp diễn tăng** ⇒ phe bán khống thu funding **đúng lúc chịu lỗ giá**
3. Chi phí vay chân bán khống 5 – 30%/năm, có lúc vượt 100%

### 2.5 · Chỉ tiêu đánh giá nào

**Đã đo** (`12 §2.7` và §3 tài liệu này): Sharpe **không tái lập** (0,07 → 0,77 giữa hai đoạn); tỉ số sụt giảm **tái lập 54/54 quan sát**, chênh 0,03.

**✅ Giải pháp: cổng GATE 1 kép** — ① tỉ số sụt giảm ≤ 0,60 ở ≥80% số ô ② Sharpe tổ hợp ≥ Sharpe mua-và-giữ. `12 §6.6`.

## Nhóm B · Đang mở — phải đo trước khi cam kết

### 2.6 · ★ Bẫy sống sót

**Vấn đề:** backtest trên bốn mươi cặp **của hôm nay** dùng thông tin *"cặp này còn tồn tại năm 2026"* để ra quyết định năm 2023. Những cặp đã chết bị loại khỏi mẫu — chính những cặp mà xu hướng tăng sẽ mua rồi mất tiền.

**Mức nghiêm trọng:** với Phương Pháp 4 (chuỗi thời gian từng cặp) nhẹ hơn so với động lượng cắt ngang, nhưng **vẫn thổi phồng kết quả**.

**Cách giải:** cần lịch sử của **cả các cặp đã huỷ niêm yết**. Nối với nhiệm vụ điều tra 2 giờ ở `12 §5.5`. **Chưa làm.**

### 2.7 · ★ Trượt giá của lệnh cắt lỗ

**Vấn đề:** khoảng 65 – 70% số lệnh kết thúc bằng cắt lỗ — **loại lệnh khớp tệ nhất**, vì nó khớp trong lúc thị trường đang chạy ngược.

**Số học:** nếu lỗ thực nhận là 1,5R thay vì 1,0R:
```
0,35 × 4R − 0,65 × 1,0R − 0,1R = +0,65R      ← giả định hiện tại
0,35 × 4R − 0,65 × 1,5R − 0,1R = +0,325R     ← mất đúng một nửa
```

**Cách giải:** mô hình trượt giá riêng cho lệnh cắt lỗ, hàm của `(σ̂, spread, độ sâu)` — **không phải hằng số 0,05%**. **Chưa làm.**

### 2.8 · Vũ trụ giao dịch bao nhiêu cặp — và một mâu thuẫn mới

**Mâu thuẫn chưa được nêu ở tài liệu nào:**

| Mục đích | Số cặp tối ưu | Nguồn |
|---|---|---|
| **Vận hành** | **8 – 10** — từ 10 lên 40 chỉ thêm 0,01 đơn vị đa dạng hoá nhưng tải vận hành gấp 4 | `11 §7.3` |
| **Đo lường** | **40** — cần tối đa số quan sát độc lập | §3 tài liệu này |

**✅ Giải pháp đề xuất: hai vũ trụ khác nhau, có chủ ý.** Đo trên 40 cặp, giao dịch 8 – 10 cặp thanh khoản nhất. **Nhưng phải ghi rõ trong ADR rằng hệ được kiểm định KHÔNG hoàn toàn là hệ được chạy** — và kiểm tra rằng nhóm 8–10 cặp không có kết quả lệch hẳn so với toàn bộ 40.

### 2.9 · Tỉ lệ đúng có giữ nguyên ở chế độ biến động cao không

**Vấn đề:** cổng phí hạ ngưỡng bằng cách chỉ vào lệnh khi biên độ lớn. Nhưng **chưa ai chứng minh tỉ lệ thắng giữ nguyên trong chế độ biến động cao** — biến động cao cũng có nghĩa nhiễu cao.

**Trạng thái:** `13 §5.2` đã đo được một nửa câu trả lời (funding tăng theo biến động, ăn ~30% lợi ích của cổng trên perp). Nửa còn lại — **tỉ lệ thắng theo nhóm ba biến động** — vẫn là Phép đo 3 của `11 §8.2`. **Chưa làm.**

### 2.10 · Ngưỡng đồng thuận của tổ hợp

**Vấn đề mới phát sinh từ giải pháp tổ hợp:** vào lệnh khi bao nhiêu phần trăm số ô đồng ý? 50%? 30%? Bất kỳ ô nào?

**Rủi ro:** đây là **một tham số mới** vừa được tạo ra, và nó có thể trở thành nơi tinh chỉnh mới thay cho tham số vừa bị loại bỏ.

**Đề xuất:** khoá cứng ở **tỉ trọng = tỉ lệ số ô đồng ý** (không có ngưỡng), rời rạc hoá thành 5 mức. Nếu buộc phải có ngưỡng, đăng ký trước và không bao giờ chỉnh.

## Nhóm C · Không giải được bằng dữ liệu — chỉ quản trị được

### 2.11 · ★ Cơ chế có thể đang mòn

| Cửa sổ | Nguồn | Sharpe |
|---|---|---|
| 2014 – 2026 | `09 §4` | **1,07 – 1,32** |
| 2021 – 2026, ô trung vị lưới | `12 §2.5` | **0,47** |
| 2021 – 2026, mua-và-giữ | `12 §2.5` | 0,59 |

Giải thích "phản ứng dưới mức" (§1.3) **dự đoán chính điều này**: khi thị trường trưởng thành, thông tin lan nhanh hơn, edge mòn.

**Không giải được bằng thêm dữ liệu** — dữ liệu quá khứ xa hơn chỉ nói về một thị trường đã không còn tồn tại.

**Quản trị được bằng:** ① dùng chỉ tiêu ổn định (tỉ số sụt giảm) thay chỉ tiêu dễ mòn (Sharpe) ② đăng ký trước mức sụt giảm chấp nhận được ③ không hứa hẹn lợi nhuận vượt trội với chính mình.

### 2.12 · Bạn đang MƯỢN bằng chứng, không tạo ra nó

Từ §3: bạn cần **34 năm** để tự chứng minh tỉ lệ thắng. Nghĩa là mọi quyết định chạy phương pháp này đều dựa trên **bằng chứng bên ngoài** — literature động lượng nhiều thập kỷ, qua nhiều lớp tài sản.

> **Đây vừa là điểm mạnh vừa là ràng buộc.** Điểm mạnh: Phương Pháp 4 có nền ngoại sinh dày nhất trong cả chín phương pháp. Ràng buộc: **bất kỳ sửa đổi "sáng tạo" nào bạn tự nghĩ ra đều mất phần nền đó**, và bạn không có dữ liệu để thay thế. ⇒ **Giữ quy tắc càng gần bản chuẩn càng tốt.**

---

# PHẦN 3 · ★ CẦN DỮ LIỆU DÀI BAO LÂU

## 3.1 · Vì sao câu hỏi không có một câu trả lời

Lượng dữ liệu cần phụ thuộc **chỉ tiêu bạn muốn đo**, và ba chỉ tiêu của phương pháp này có tốc độ hội tụ chênh nhau **hơn mười lần**. Hỏi "cần bao nhiêu năm" mà không nói đo gì là câu hỏi thiếu vế.

## 3.2 · Đo tốc độ hội tụ

**Phương pháp:** cửa sổ trượt mọi độ dài từ 0,5 tới 4 năm, trên bốn cặp, bước 60 ngày. Với mỗi cửa sổ chạy quy tắc và ghi lại chỉ tiêu. Rồi đo **độ phân tán** của chỉ tiêu qua các cửa sổ cùng độ dài.

| Cửa sổ | Số mẫu | Lệnh TB | Sharpe trung vị | **Độ lệch** | IQR | Tỉ số sụt giảm trung vị | **Độ lệch** | IQR |
|---|---|---|---|---|---|---|---|---|
| 0,5 năm | 136 | 2 | 0,66 | **1,59** | 2,21 | 0,58 | **0,28** | 0,42 |
| 1 năm | 134 | 4 | 0,68 | **1,24** | 1,63 | 0,68 | **0,23** | 0,31 |
| 1,5 năm | 122 | 5 | 0,78 | 0,96 | 1,34 | 0,70 | 0,21 | 0,28 |
| 2 năm | 110 | 8 | 0,87 | 0,69 | 0,86 | 0,69 | 0,20 | 0,25 |
| 3 năm | 86 | 12 | 0,91 | **0,41** | 0,41 | 0,66 | **0,18** | 0,24 |
| 4 năm | 62 | 16 | 0,83 | **0,41** | 0,48 | 0,60 | **0,18** | 0,26 |

**Ba điều đọc ra:**

1. **Backtest một năm là vô nghĩa với phương pháp này.** Độ lệch Sharpe 1,24 trên một cửa sổ một năm — hai hệ thống hoàn toàn giống nhau có thể cho Sharpe chênh nhau 2,5 chỉ do may rủi.
2. **Sharpe cần giảm 74% độ phân tán mới dùng được; tỉ số sụt giảm chỉ cần 36%** — vì nó đã ổn định từ đầu. Trung vị của nó nằm trong 0,58 – 0,70 ở **mọi** độ dài cửa sổ.
3. **Số lệnh là nút thắt vật lý.** 4 lệnh mỗi năm mỗi cặp. Không có cách nào tăng nó mà không đổi quy tắc.

## 3.3 · Bốn mươi cặp cho bao nhiêu bằng chứng độc lập — đo thật

`11 §7.2` **giả định** tương quan 0,9. Đo thật trên bốn cặp:

| Đại lượng | Tương quan đo được | 4 cặp | 10 cặp | **40 cặp** |
|---|---|---|---|---|
| **Lợi suất chiến lược hằng ngày** | **0,248** | 2,29 | 3,09 | **3,75** |
| Trạng thái vị thế (cùng mua hay không) | 0,611 | 1,41 | 1,54 | 1,61 |
| **★ Kết cục lệnh** (61 cặp lệnh chồng lấn) | **κ = 0,501** | 1,60 | 1,81 | **1,95** |

Ma trận tương quan lợi suất chiến lược:

```
            BTC     ETH     SOL    DOGE
BTC       1,000   0,457   0,316   0,118
ETH       0,457   1,000   0,321   0,181
SOL       0,316   0,321   1,000   0,099
DOGE      0,118   0,181   0,099   1,000
```

> **Kết cục lệnh mới là con số quyết định cho câu hỏi tỉ lệ thắng** — và nó đo được trực tiếp: trong 61 cặp lệnh chồng lấn thời gian giữa các cặp tiền, kết cục **giống nhau 77,0%** trong khi kỳ vọng nếu độc lập là 54,0%. Kappa = **0,501**.
>
> ⇒ **Bốn mươi cặp chỉ cho giá trị thống kê của khoảng HAI cặp độc lập** đối với câu hỏi tỉ lệ thắng. Thêm cặp gần như không mua thêm được gì.

## 3.4 · Bảng trả lời cuối cùng

Quy tắc: sai số chuẩn của ước lượng phải nhỏ hơn **một nửa** khác biệt muốn phát hiện.

| Chỉ tiêu | Khác biệt muốn phát hiện | Độ lệch một cửa sổ | Nguồn độc lập (40 cặp) | **Số năm cần** |
|---|---|---|---|---|
| **Tỉ số sụt giảm** | 0,20 (so ngưỡng 0,60) | 0,18 ở cửa sổ 3 năm | 3,75 | **3 năm** ✅ |
| **Sharpe vượt mua-và-giữ** | 0,30 | 0,40 ở cửa sổ 5 năm | 3,75 | **hơn 5 năm** 🔶 |
| **Tỉ lệ thắng lệnh** | 229 lệnh độc lập | — | 1,95 | **34 năm** ❌ |

Chi tiết phép tính tỉ lệ thắng:
```
40 cặp × 3,5 lệnh/năm × (N_hiệu_dụng 1,95 / 40)  =  6,8 lệnh ĐỘC LẬP mỗi năm
229 lệnh cần  ÷  6,8  =  34 năm
```

## 3.5 · ⚠️ Sửa `11 §7.2` — theo hướng XẤU hơn

| | `11 §7.2` (giả định) | Đo thật (tài liệu này) |
|---|---|---|
| Lệnh mỗi cặp mỗi năm | 15 | **3,5** |
| Tương quan | 0,9 (giả định) | **κ = 0,501** (đo) |
| N hiệu dụng, 40 cặp | 1,11 | **1,95** |
| Lệnh độc lập mỗi năm | 16,6 | **6,8** |
| **Số năm cần** | **13,8** | **34** |

> **Hai sai số đi ngược chiều nhau nhưng không triệt tiêu hết.** Tương quan thật thấp hơn giả định (tốt), nhưng tần suất lệnh thật **thấp hơn bốn lần** so với con số 7–18 lệnh/năm mà `09` trích (xấu hơn nhiều). Kết quả ròng: ước lượng cũ **lạc quan gấp 2,5 lần**.
>
> **Kết luận định tính không đổi:** tỉ lệ thắng của Phương Pháp 4 **không thể chứng minh được trong đời dự án này**, dù tính bằng con số nào. Điều đó củng cố — không làm suy yếu — quyết định của `12 §6.6` chuyển cổng GATE 1 sang tỉ số sụt giảm.

## 3.6 · Tin tốt: dữ liệu cần đã tồn tại

| Dữ liệu | Cần cho | Trạng thái |
|---|---|---|
| **Nến ngày, 40 cặp, ≥3 năm** | Cổng tỉ số sụt giảm | ✅ **Tải được ngay** — vài chục phút |
| Nến ngày, 40 cặp, ≥5 năm | Cổng Sharpe | 🔶 Nhiều cặp không đủ 5 năm lịch sử |
| **Lịch sử cặp đã huỷ niêm yết** | Chống bẫy sống sót (§2.6) | ❓ **Chưa điều tra** — `12 §5.5` |
| Khối lượng hợp đồng mở | Đặc trưng lớp lọc | ⚠️ **30 ngày — mất vĩnh viễn mỗi ngày** |

> **Đây là điểm tích cực nhất của tài liệu:** khác với khối lượng hợp đồng mở (mất vĩnh viễn) và ảnh chụp vũ trụ (không tạo lại được), **dữ liệu để đánh giá Phương Pháp 4 ở mức cổng-sụt-giảm đã tồn tại và tải được hôm nay.** Ràng buộc không phải thời gian — là mẻ tải chưa chạy.

---

# PHẦN 4 · KẾ HOẠCH KIỂM ĐỊNH

| Bước | Việc | Điều kiện đạt | Cần dữ liệu |
|---|---|---|---|
| **1** | Tải 40 cặp × khung ngày × ≥3 năm | Chất lượng dữ liệu qua cổng | — |
| **2** | Điều tra tái tạo cặp đã huỷ niêm yết | Có/không kết luận rõ | 2 giờ |
| **3** | Tổ hợp 27 ô, purged walk-forward 8 fold | — | 3 năm × 40 cặp |
| **4** | **Cổng ①** tỉ số sụt giảm ≤ 0,60 ở ≥80% số ô, **mọi** fold | Đạt/trượt | ✅ đủ |
| **5** | **Cổng ②** Sharpe tổ hợp ≥ Sharpe mua-và-giữ ở ≥6/8 fold | Đạt/trượt | 🔶 công suất thấp — ghi rõ |
| **6** | Tỉ lệ thắng theo nhóm ba biến động (§2.9) | **Không có ngưỡng** — phép đo thông tin | ✅ đủ |
| **7** | Mô hình trượt giá lệnh cắt lỗ (§2.7) | Kỳ vọng vẫn dương ở 1,5R | ✅ đủ |
| **8** | Đối chiếu nhóm 8–10 cặp giao dịch với toàn bộ 40 (§2.8) | Không lệch hệ thống | ✅ đủ |

**Cấm khi trượt:** thêm tham số · nới ngưỡng · đổi giai đoạn kiểm định · báo cáo ô tốt nhất thay vì tổ hợp.

**Thứ tự sửa được phép** (chốt lúc đầu lạnh): ① kéo dài chân trời sang tuần ② siết độ chọn lọc ③ thêm phái sinh vào lớp lọc.

---

# PHẦN 5 · MỘT ĐOẠN

> Phương Pháp 4 là quy tắc đơn giản nhất trong cả chín phương pháp — ba tham số, hai trạng thái, không có gì để tuỳ nghi — và cũng là quy tắc mà việc **đánh giá** nó khó nhất. Nguyên nhân nằm ở một con số vật lý không thay đổi được: **ba phẩy năm lệnh mỗi cặp mỗi năm**. Từ đó suy ra mọi thứ còn lại: một backtest một năm có độ lệch Sharpe 1,24 và vì thế không nói lên điều gì; bốn mươi cặp chỉ đáng giá bằng hai cặp độc lập vì kết cục lệnh trùng nhau 77% số lần; và tỉ lệ thắng cần **ba mươi bốn năm** để chứng minh.
>
> Nhưng cùng phép đo đó cho một lối ra. **Tỉ số sụt giảm — trung vị nằm giữa 0,58 và 0,70 ở mọi độ dài cửa sổ từ nửa năm tới bốn năm — không cần hội tụ, vì nó bắt đầu đã hội tụ.** Ba năm dữ liệu bốn mươi cặp là đủ để trả lời câu hỏi *"nó có cắt sụt giảm không"* với sai số 0,093 trên một khác biệt 0,20. Và ba năm dữ liệu bốn mươi cặp là thứ **tải về được trong buổi chiều nay**.
>
> Chọn câu hỏi đo được thay vì câu hỏi quen thuộc — đó là toàn bộ nội dung của tài liệu này.

---

*Phép đo: 90 lệnh thật trên BTC · ETH · SOL · DOGE (2019-09 → 2026-08) · đường ổn định trên 650 cửa sổ trượt · tương quan kết cục đo trên 61 cặp lệnh chồng lấn. Mã: `scripts/measurements_2026_08_26/pp4_data_needs.py` · `pp4_stability.py` · `pp4_final.py`. Giới hạn: bốn cặp — tương quan trên bốn mươi cặp có thể khác, và §3.3 dùng ngoại suy từ bốn.*
