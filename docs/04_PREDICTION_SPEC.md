# 04 · LÕI DỰ ĐOÁN — CHIẾN LƯỢC VÀ KIẾN TRÚC

> **Trạng thái:** nháp 1 · 28/08/2026 · chờ chủ dự án duyệt
> **Căn cứ:** `00_VISION.md §6` (lõi hai tầng) · `01_REQUIREMENTS.md §3 PRED-01…22` (cái gì + kiểm bằng gì) ·
> `adr/002` (khoá 1h/4h) · `adr/016` (số sinh tự động) · `adr/017` (rào 6,0σ̂) · `adr/018` (tầng chọn lọc) · `adr/020` (bỏ GATE)
> **Kế thừa phần đo lường:** `Old/PREDICTION_DESIGN.md` · `Old/10_PREDICTION_ARCHITECTURE.md` · `Old/12` · `Old/14` · `Old/17`
> **Vai trò:** nói **LÀM THẾ NÀO** lõi dự đoán thoả REQ-PRED. Không nhắc lại REQ; mỗi mục trỏ REQ nó thi hành.
> **Luật soạn thảo (ADR-016):** tài liệu này **không giữ số đo**. Mọi kết quả trỏ `docs/generated/spec_numbers.md`.
> Số xuất hiện dưới đây chỉ là **luật** (ngưỡng đăng ký trước) hoặc **số của tài liệu ngoài** có nguồn kèm.

---

## 1 · Kết luận trong một trang

**Câu hỏi:** rule-based hay AI — và mỗi bên giữ gì?

**Trả lời:** không phải "AI dự đoán hướng, rule quản trị rủi ro". Ngược lại.

| Đại lượng | Dự báo được tới đâu | Ai giữ | Vì sao |
|---|---|---|---|
| **Hướng giá** | gần bằng không ở mọi khung tới 1 ngày | **QUY TẮC** | Không có gì để học. Model tốt hơn không mua thêm điểm phần trăm nào, và `RULE 11` chặn ở 60% |
| **Biến động** σ̂ | cao nhất trong ba đại lượng | **HỌC MÁY** (HAR-RV) | Đại lượng duy nhất tự chứng minh được với ~11 quan sát thay vì hàng trăm lệnh |
| **Chi phí funding** f̂ | cao | **HỌC MÁY** (EWMA) | Vào tử số của ngưỡng hoà vốn |
| **Hình dạng cược** (rào 1,2σ̂ / 6,0σ̂) | — | **QUY TẮC** | Số học thuần: đổi hình học hạ ngưỡng hoà vốn xuống dưới trần năng lực |
| **Sự kiện nào nên bỏ** | chưa biết — phải đo | **HỌC MÁY**, tắt mặc định | Chỉ được **thu hẹp** (`PRED-21`) |
| **Ánh xạ xác suất → xác suất thật** | — | **HỌC MÁY** (isotonic) | `RULE 6`: `predict_proba()` thô không phải xác suất |
| **Độ rộng dải giá có bảo đảm phủ** | — | **HỌC MÁY nhẹ** (conformal) | Thay việc chỉnh `z` bằng tay — xem §5.3 |

**Bốn câu chốt:**

1. **AI không chạm vào hướng, ở cả tầng 1 lẫn tầng 2.** Hướng đến từ quy tắc xu hướng có cơ chế kinh tế đọc được. AI chỉ được **thu hẹp** danh sách và **định lượng độ bất định**.
2. **Ràng buộc thật của tầng AI không phải thuật toán — là cỡ mẫu.** Với vài trăm sự kiện độc lập, `PRED-15` (tham số tự do ≤ n hiệu dụng / 20) **loại thẳng** LightGBM 300 cây mà `Old/PREDICTION_DESIGN §L6` đang mặc định. Xem §5.4 và §7 — đây là thay đổi lớn nhất tài liệu này đề xuất.
3. **Foundation model của thị trường tài chính (Kronos, Chronos, TimesFM) không đủ điều kiện phát khuyến nghị**, không phải vì yếu mà vì `RULE 12` + `PRED-08`: chúng không công bố mốc cắt dữ liệu, nên số fold hợp lệ không đủ. Chúng vào hệ với đúng một vai: **đối chứng**. Xem §5.7.
4. **Hai luật đang có hiệu lực sẽ tự bịt miệng hệ, và phải sửa trước khi viết mã.** Dây an toàn `p_required > 0,60` của `PRED-02` im lặng đúng khung 1 ngày trong chế độ biến động thấp (§2.5); quy tắc *nhãn = giá trị thấp nhất trong các cặp* của `PRED-13` cho một đèn luôn đỏ (§8.4). Cả hai không phải lỗi chính tả — chúng là lỗi **thứ nguyên** và lỗi **công suất thống kê**.

---

## 2 · Bốn ràng buộc đóng khung mọi lựa chọn — và một lỗi phải sửa trước

### 2.1 · Bức tường phí là hàm của biên độ

`p_required = 0,5 + c / (2·E|move|)` — với `c` là chi phí khứ hồi (`PRED-16`) và `E|move|` biên độ kỳ vọng.
Hệ quả đã đo và đã khoá bằng ADR-002: ở khung 4 giờ ngưỡng hoà vốn vượt xa trần năng lực dự báo hướng, **giao của "đủ lãi" và "đáng tin" là tập rỗng**. Vì thế ý định giao dịch chỉ tồn tại ở khung 1 ngày, và tồn tại nhờ **đổi hình dạng cược** (payoff 5,00R hạ ngưỡng hoà vốn xuống mức trần năng lực với tới được) — không nhờ mô hình hướng tốt hơn.

> **Điều này quyết định toàn bộ phần AI:** không có chỗ cho một mô hình hướng, dù là cây, mạng, hay foundation model. Có chỗ cho mô hình **biên độ** và mô hình **bỏ lệnh**.

### 2.2 · Ngân sách chiều thông tin là 13, không phải 57

`Old/14 §0.1`: 57 đặc trưng từng được đề xuất, 38 dựng được, **13 chiều thật sự độc lập** ở ngưỡng |ρ| ≥ 0,70. Toàn bộ khối động lượng + xu hướng + cấu trúc gộp lại là **một** chiều.
⇒ Muốn chiều thứ 14 phải thêm **nguồn dữ liệu**, không phải thêm công thức. Mọi kiến trúc AI đề xuất thêm 40 feature kỹ thuật là đề xuất thêm nhiễu.

### 2.3 · Ngân sách mẫu: đếm sự kiện, không đếm nến

Đơn vị mẫu của tầng quyết định là **sự kiện tranche**, không phải nến. Số sự kiện mỗi đồng mỗi năm → `spec_numbers §2`. Nhãn chồng lấn theo thời gian nắm giữ và tương quan chéo coin cao ⇒ **n hiệu dụng nhỏ hơn n thô nhiều lần**. Bảng tính ở §7.

### 2.4 · Hai luật chống tự lừa mình chi phối phần AI

| Luật | Ràng buộc lên tầng AI |
|---|---|
| `RULE 11` | Accuracy > 60% ở khung 1h ⇒ **giả định rò rỉ**. Một model hướng "thành công" ở khung giờ là bằng chứng buộc tội, không phải kết quả |
| `RULE 12` + `PRED-08` | Model dùng trọng số tiền huấn luyện phải khai `training_data_cutoff`; bộ kiểm định **chỉ chấm fold có `test_start > cutoff`**. Không khai ⇒ không có fold hợp lệ ⇒ không gắn nhãn |

### 2.5 · ★ Một lỗi thứ nguyên còn sống trong `PRED-02` — phải sửa trước khi viết L4

`PRED-02` dựng hai rào cho ý định giao dịch: **danh sách trắng khung** (rào chính) và
**`p_required` > 0,60 ⇒ ý định rỗng** (dây an toàn). Dây an toàn đo **sai đại lượng**.

`p_required` là ngưỡng hoà vốn của **cược đối xứng 1:1**. Phương pháp thật là **rào chắn
payoff 5,00R**, hoà vốn `p_star = (1 + c_R)/(W + 1)`. Hai đại lượng khác thứ nguyên — đúng
loại lỗi mà `PRED-03` dựng hai kiểu dữ liệu riêng để chặn, nhưng chính `PRED-02` lại dùng
đại lượng hiển thị làm cổng quyết định.

Hệ quả tính được từ hằng số luật (`c = 0,30%` khứ hồi · `sl = 1,2σ̂` · `W = 5,00R`) và
`ABS_MOVE_RATIO` (→ `spec_numbers §3`):

| σ̂ ngày | `p_required` (H = 1 ngày) | `p_required` (H = giữ ~6,5 ngày) | `p_star` của chính rào chắn |
|---|---|---|---|
| 0,8% | **75,8%** ⛔ chặn | **60,1%** ⛔ chặn | ~21,9% |
| 1,5% | **63,8%** ⛔ chặn | 55,4% | ~19,7% |
| 2,0% | **60,3%** ⛔ chặn | 54,1% | ~18,8% |
| 3,0% | 56,9% | 52,7% | ~18,1% |
| 5,0% | 54,1% | 51,6% | ~17,7% |

**Đọc bảng:** với chân trời 1 ngày, dây an toàn kích hoạt khi **σ̂ ngày < ~2,06%** — tức
phần lớn thời gian thị trường yên. Và 1 ngày là khung **duy nhất** được phát ý định. Nghĩa là
dây an toàn **bịt miệng đúng cái khung nó được viết ra để bảo vệ**, đúng lúc chi phí trên mỗi
R đang thấp nhất. Trong khi đó `p_star` — ngưỡng thật của cược thật — chỉ nhích từ ~18% lên
~22% trên cùng dải σ̂, không hề tiến gần vùng nguy hiểm.

Thêm một tầng mơ hồ: **bảng phụ thuộc chân trời nào được thay vào `H`**, và điều đó chưa
được đăng ký ở đâu. Cùng một cấu hình cho hai kết luận trái ngược ở σ̂ = 1,0%.

**Đề xuất (cần ADR — xem §11):**

```
① Dây an toàn đo ĐÚNG đại lượng của cược đang phát:
     p_win_cal − p_star  <  biên đăng ký   ⇒  ý định RỖNG
   (cùng đại lượng cổng phí PRED-04, nhưng là rào ĐỘC LẬP: cổng phí chấm từng
    tranche, dây an toàn chấm cả ĐƯỜNG PHÁT của khung đó)
② Dây an toàn thứ hai giữ vai «ai đó thêm khung mới mà quên tính phí»:
     c_R = c / (sl_mult · σ̂)  >  trần đăng ký   ⇒  ý định RỖNG
   c_R là chi phí tính bằng ĐƠN VỊ R — cùng thứ nguyên với payoff, tăng vọt ở
   khung ngắn vì σ̂ co lại. Trần phải ĐO rồi ĐĂNG KÝ, không đặt bằng trực giác.
③ Test pin: quét σ̂ từ 0,8% đến 5,0%, assert đường 1 ngày KHÔNG im lặng vì lý do
   biến động thấp; và assert một khung giả có c_R vượt trần thì im lặng.
```

> **Giữ nguyên `p_required` ở chỗ nó thuộc về:** in cạnh `p_up` trên mọi khung (`PRED-03`).
> Nó là câu trả lời trung thực cho câu hỏi *"cược đối xứng ở khung này cần thắng bao nhiêu?"* —
> và ở khung 4 giờ, câu trả lời đó chính là lý do `ADR-002` tồn tại. Vấn đề không phải đại
> lượng, mà là việc nó bị dùng làm **cổng** cho một cược có hình dạng khác.

*(Phát hiện từ vòng kiểm định `01_REQUIREMENTS` ngày 28/08/2026; số học tái tạo được bằng
công thức trên, cần đưa vào `measure_spec.py` để thôi phụ thuộc bảng chép tay.)*

---

## 3 · Kiến trúc

### 3.1 · Hai tầng, chín lớp, một registry

```
                        ┌──────────────────────────────────────────────┐
                        │  REGISTRY PHƯƠNG PHÁP  (PRED-08)             │
                        │  cùng đầu vào · cùng kiểu Prediction ·        │
                        │  cùng bộ kiểm định · cùng hàm chi phí ·       │
                        │  cùng sổ track record · nhãn sinh độc lập     │
                        └───────────────┬──────────────────────────────┘
                                        │
        ┌───────────────────────────────┴────────────────────────────────┐
        │                                                                │
 ╔══════▼═══════════════════════╗                       ╔════════════════▼═══════════════╗
 ║ TẦNG 1 · method_id="barrier" ║                       ║ TẦNG 2 · method_id=<mới>       ║
 ║ rule-based, ĐÃ ĐO            ║                       ║ PRED-20 · P5 · chưa tồn tại    ║
 ╚══════════════════════════════╝                       ╚════════════════════════════════╝
        │  chín lớp dùng chung — tầng 2 cắm vào ĐÚNG các lớp này, không dựng đường riêng
        ▼
┌─ L0 · TIẾP NHẬN & ĐỘ TƯƠI ──────────────────────────────────────── QUY TẮC ─┐
│  gộp nến · khử trùng theo (symbol, tf, open_time) · máy trạng thái độ tươi     │
│  ⛔ freshness ≠ live ⇒ KHÔNG phát khuyến nghị mới (PRED-07), không phải cờ UI  │
├─ L1 · LÕI ĐẶC TRƯNG ────────────────────────────────────────────── QUY TẮC ─┤
│  MỘT đường mã batch ↔ live · shift_all(1) · assert_scale_free()               │
│  13 suất đặc trưng (Old/14 §3.1) · MỘT hàm biến động (Parkinson)              │
├─ L2 · HAI ĐẠI LƯỢNG DỰ BÁO ĐƯỢC ───────────────────────────────── HỌC MÁY ─┤
│  σ̂ ← HAR-RV, mục tiêu = trung bình RV 5 ngày tới · fallback EWMA λ=0,94       │
│  f̂ ← EWMA bán rã 7 ngày                          ★ tầng tự chứng minh được   │
├─ L3 · MỘT PHÂN PHỐI F ──────────────────────────────────── QUY TẮC + §5.3 ─┤
│  F trên log-return · q_α = F⁻¹(α) · p_up = 1 − F(0)          (PRED-01)        │
│  độ rộng hiệu chỉnh bằng conformal online, KHÔNG chỉnh z bằng tay             │
├─ L4 · CỔNG PHÍ ─────────────────────────────────────────────────── QUY TẮC ─┤
│  p_required (hiển thị, mọi khung) · p_star (quyết định, của chính rào chắn)   │
│  ⛔ tf ∉ TRADE_TF hoặc p_required > 0,60 ⇒ ý định RỖNG   (PRED-02)            │
├─ L5 · HƯỚNG SƠ CẤP ─────────────────────────────────────────────── QUY TẮC ─┤
│  tổ hợp lưới xu hướng → w ∈ {0; ¼; ½; ¾; 1} · máy trạng thái tranche          │
├─ L6 · LỌC BỎ ──────────────────────────────────────────────────── HỌC MÁY ─┤
│  «sự kiện này chạm chốt lời trước dừng lỗ không?»  TẮT MẶC ĐỊNH (PRED-21)     │
│  ⛔ chỉ được thu hẹp — không tạo hướng, không đảo hướng, fuzz-test đơn điệu    │
├─ L7 · CỠ GỢI Ý & CẢNH BÁO ─────────────────────────────── QUY TẮC (+ ML) ─┤
│  suggested_size_pct theo notional cố định · danh sách cảnh báo · KHÔNG đặt lệnh│
├─ L8 · SỔ & BẢNG ĐIỂM ───────────────────────────────────────────── QUY TẮC ─┤
│  sổ bất biến (PRED-05) · chấm kết cục · QLIKE · độ phủ · PIT · nhãn PRED-13   │
│  ✅ chạy VÔ ĐIỀU KIỆN, kể cả khi hệ im lặng hoàn toàn                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 · Hợp đồng đăng ký một phương pháp (thi hành `PRED-08`)

Một `method` là một bản ghi bất biến, khai đủ các trường sau thì mới đăng ký được:

| Trường | Kiểu | Ý nghĩa · ràng buộc |
|---|---|---|
| `method_id` | `str` | Định danh ổn định. Vào khoá idempotent của `Prediction` (`PRED-05`) |
| `layers_owned` | `frozenset[str]` | Lớp nào method này thay thế. Lớp không khai ⇒ dùng bản dùng chung |
| `training_data_cutoff` | `date \| None` | `None` **chỉ hợp lệ** khi `trained_from_scratch = True` |
| `trained_from_scratch` | `bool` | True ⇒ mọi trọng số sinh trong repo, từ dữ liệu repo |
| `pretrained_corpus` | `Literal["none","synthetic","market","mixed"]` | **Đề xuất mới, cần ADR** — xem ghi chú dưới |
| `free_params` | `int` | Số tham số tự do khai báo. Vào phép kiểm trần `PRED-15` (§7) |
| `n_trials_registered` | `int` | Số cấu hình từng thử. Vào Deflated Sharpe |
| `monotone_only` | `bool` | True ⇒ chịu fuzz-test "tập ra ⊆ tập vào" |
| `emits_intent` | `bool` | False ⇒ không bao giờ sinh `new_tranches` |

> **★ Vì sao cần `pretrained_corpus` — một lỗ hổng của `PRED-08` phát hiện khi khảo sát ứng viên AI.**
> Hợp đồng hiện chỉ có hai trạng thái: *train từ đầu* hoặc *có cutoff*. Nhưng tồn tại loại thứ ba:
> mô hình tiền huấn luyện **hoàn toàn trên dữ liệu tổng hợp** (TabPFN v2 — prior sinh từ mô hình nhân
> quả cấu trúc và mạng Bayes, [Nature 2025](https://www.nature.com/articles/s41586-024-08328-6)).
> Loại này **không thể đã nhìn thấy quá khứ giá của bạn** — `RULE 12` không có đối tượng để áp,
> nên ràng buộc `test_start > cutoff` là vô nghĩa và sẽ loại oan một ứng viên tốt.
> Ngược lại, ràng buộc phải **siết hơn** cho `pretrained_corpus = "market"` (Kronos, Chronos, TTM):
> khi không công bố cutoff, lấy **ngày phát hành trọng số** làm cận trên bảo thủ.
> Đề xuất viết thành **ADR-021** trước khi bất kỳ method tiền huấn luyện nào được đăng ký.

> **★ Registry nhiều method KHÔNG có nghĩa người dùng được chọn method.**
> `ADR-018` khoá trục B (chọn nguồn tín hiệu) và trục C (chọn chân trời). Điều kiện mở cũ của
> chúng là *"sau GATE 1"* — mà `ADR-020` đã xoá hệ GATE, nên **điều kiện đó không còn tồn tại**:
> mở trục B hoặc C nay đòi một ADR mới, kèm rào chống chọn-theo-kết-quả tương đương rào đổi tầng
> (`PRED-10`). Registry phục vụ ba việc khác: chấm nhiều phương pháp trên **cùng** bộ kiểm định,
> cho mỗi phương pháp một **track record riêng**, và cho `PRED-22` một trang giải thích cơ chế.
> Người dùng **xem** được nhiều phương pháp; hệ **phát** theo phương pháp đang hiệu lực.

### 3.3 · Bốn bất biến kiến trúc — mỗi cái một test

| # | Bất biến | Thi hành | Fuzz/test |
|---|---|---|---|
| I1 | **Một phân phối.** Ba đầu ra là ba cách đọc của cùng `F` | `PRED-01` | Bơm μ ∈ {−0,01; 0; +0,01} ⇒ `sign(p_up − 0,5) == sign(q50 − close)` |
| I2 | **Quyền đơn điệu.** Học máy chỉ thu hẹp tập khuyến nghị | `PRED-21` | Quét toàn miền đầu ra model ⇒ tập ra ⊆ tập vào, mọi lần |
| I3 | **Hai kiểu ngưỡng không gán chéo.** `PReq` (hiển thị) ≠ `PStar` (quyết định) | `PRED-03` | Gán chéo ⇒ lỗi kiểu; khối khuyến nghị không chứa `p_required` |
| I4 | **`predict()` là hàm thuần.** Không đọc đồng hồ, không I/O, không toàn cục | `PRED-06`,`PRED-07` | Gọi hai lần cùng đầu vào ⇒ byte-identical; grep: không `datetime.now()` trong đường quyết định |

---

## 4 · Tầng 1 — rule-based: đóng băng cái gì, còn phải đo cái gì

### 4.1 · Đã đóng băng (kế thừa nguyên trạng, không mở lại)

| Thành phần | Đặc tả | Nguồn |
|---|---|---|
| Ước lượng biến động | Parkinson từ high/low, thang **ngày**, một đường sinh duy nhất | `Old/PREDICTION_DESIGN §L1` · `PRED-14(a)` |
| Mục tiêu của σ̂ | trung bình RV **5 ngày tới** (khớp thời gian nắm giữ thực tế) | `§L2` |
| Hướng sơ cấp | tổ hợp trọng số đều trên lưới xu hướng đã đóng băng, không chọn ô | `§L5` · `Old/12 §2.5` |
| Rào chắn | `1,2σ̂` dừng lỗ · `6,0σ̂` chốt lời · hạn 60 ngày · `k = 1` | `ADR-017` |
| Quy ước khớp | tín hiệu tại close `t` ⇒ vào tại **open `t+1`** | `PRED-18(a)` |
| Bất đối xứng thoát | stop soi intrabar (lệnh treo bắt buộc) · target kiểm tại close | `§L5` |
| Cỡ gợi ý | notional cố định, **không** nghịch đảo σ̂ | `§L7` |
| Tầng chọn lọc | bốn tầng lồng nhau trên `level`, **không phải thang chất lượng** | `ADR-018` |

### 4.2 · Còn phải đo trước khi tầng 1 được gắn nhãn *đã kiểm chứng*

Đây là danh sách chặn, không phải danh sách mong muốn. Thứ tự là thứ tự phụ thuộc.

| # | Việc | Chặn cái gì | Kiểm bằng |
|---|---|---|---|
| M1 | **Dữ liệu khung ngày thật** cho mọi cặp (`DATA-08`) — số hiện tại đo trên chuỗi resample từ 1h | **Mọi con số** trong `spec_numbers` | Script kiểm nguồn: mọi chuỗi ngày dùng để chấm có nguồn `raw` khung ngày |
| M2 | **Bộ kiểm định tự chứng minh** — tiêm rò rỉ đã biết, xác nhận từng probe bắt được | Mọi kết luận sau đó | `PRED-11`: `skipped == 0`, bộ tiêm làm từng probe đỏ |
| M3 | **Đo lại bề mặt rào chắn trên vũ trụ ngoài nhóm hiệu chuẩn** (36 cặp) | Nhãn của tầng 1 | Giao thức khử nhiễm `ADR-017 §2`: cấu hình `1,2/6,0` là cấu hình **duy nhất** được chấm |
| M4 | **Đo độ phủ dải giá cuộn** trên số dự đoán tối thiểu | `PRED-14(b)` | Độ phủ 80% ± sai số đăng ký · PIT không lệch · quantile cắt nhau = 0 |
| M5 | **Đo tỉ lệ thắng theo bucket biến động** | Biết cổng phí có mua được gì không | Bảng hit-rate × bucket σ̂, kèm `p_star` của chính bucket đó |
| M6 | **Đo chênh lệch `open[t+1]` ↔ TWAP thực thi** | Quyền gọi quy ước hiện tại là "thận trọng" | Hai chuỗi PnL, báo cáo độ lệch, không kết luận trước khi đo |

> **M2 trước M3.** Đo trên một bộ kiểm định chưa từng bắt được gì là đo trên một cái cân chưa hiệu chuẩn.

---

## 5 · Tầng 2 — AI: bảy ứng viên, xếp theo tỉ lệ giá trị trên rủi ro

### 5.1 · Bảng chấm

| # | Ứng viên | Vai trò | Chi phí mẫu | Rủi ro tự lừa | Phán quyết |
|---|---|---|---|---|---|
| A1 | **Isotonic hiệu chỉnh xác suất** | ánh xạ `p_win` thô → xác suất thật | thấp (≥300 mẫu/lát) | thấp | ✅ **bắt buộc** — `PRED-12`, không tuỳ chọn |
| A2 | **Conformal online cho dải giá** | bảo đảm độ phủ dưới dịch chuyển phân phối | rất thấp | thấp | ✅ **nhận** — §5.3 |
| A3 | **Meta-label lọc bỏ, mô hình nhỏ** | bỏ sự kiện xấu | trung bình (≥300 sự kiện forward) | **trung bình–cao** | 🟡 **có điều kiện** — §5.4, và **đổi mô hình** |
| A4 | **Ensemble σ̂: HAR + mô hình chuỗi nhỏ** | giảm QLIKE của σ̂ | trung bình | trung bình | 🟡 **thử sau**, chỉ khi A1–A3 xong — §5.5 |
| A5 | **Mô hình hướng học máy** | dự đoán `p_up` | — | **rất cao** | ⛔ **bác** — §2.1, `RULE 11` |
| A6 | **Foundation model sinh giá** (Kronos, Chronos, TimesFM) | dự báo chuỗi/giá | — | **rất cao** | ⛔ **chỉ làm đối chứng** — §5.7 |
| A7 | **Động lượng cắt ngang / xếp hạng chéo coin** | chọn coin | cao (cần ảnh chụp universe quá khứ) | cao | 🔒 **khoá** — §5.8 |

### 5.2 · A1 · Hiệu chỉnh xác suất — không phải lựa chọn

Đã là `PRED-12`. Ba chi tiết dễ làm sai, ghi ra để không phải phát hiện lại:

1. **Lát hiệu chỉnh nằm giữa train và test ⇒ phải purge + embargo ở CẢ HAI biên.** Nó rò rỉ được về cả hai phía.
2. **Gộp toàn vũ trụ, không hiệu chỉnh từng đồng.** Số sự kiện mỗi đồng không đủ công suất.
3. **Một bộ hiệu chỉnh chung cho mọi tầng chọn lọc** (`ADR-018`: tầng là tập lồng nhau trên cùng một danh sách, không phải bốn mô hình).

### 5.3 · A2 · Conformal thay cho "chỉnh z tới khi đạt 80%"

**Vấn đề của cách cũ.** `PRED-14(b)` đòi độ phủ `[q10, q90]` = 80% ± sai số. Cách làm kế thừa là *"kiểm toán cuộn rồi hiệu chỉnh `z` tới khi đạt"*. Đó là một vòng lặp tối ưu **không đăng ký trước**, chạy trên chính chỉ tiêu dùng để chấm — tức là p-hacking hợp pháp hoá bằng tên gọi "hiệu chỉnh".

**Đề xuất.** Thay bằng **Adaptive Conformal Inference (ACI)** ở dạng đơn giản nhất: một biến trạng thái `α_t` cập nhật online theo việc kỳ trước có phủ hay không, hệ số học `η` **đăng ký trước và không tinh chỉnh** (đúng cách repo đã xử lý `λ = 0,94` của RiskMetrics).

| | |
|---|---|
| **Được** | Bảo đảm phủ dài hạn **không cần giả định phân phối**, kể cả khi thị trường đổi chế độ ([tổng quan phương pháp](https://arxiv.org/html/2601.18509v2)) |
| **Giá phải trả** | Thêm **đúng một** tham số `η`; và ACI bảo đảm phủ **biên**, không bảo đảm phủ **có điều kiện** — nói rõ trên UI |
| **Không nhận** | Các biến thể nhiều tham số hơn (bias-corrected, Bellman conformal). Chúng tốt hơn trong văn liệu nhưng ăn ngân sách tham số ở §7 |
| **Kiểm** | Chính `PRED-14(b)`: độ phủ, PIT, số lần cắt nhau. ACI **không được** làm quantile cắt nhau — kiểm bằng cấu tạo |

### 5.4 · A3 · Meta-label — nhận vai trò, **đổi mô hình**

**Phát hiện chặn.** `Old/PREDICTION_DESIGN §L6` mặc định LightGBM `depth 3 · ≤15 lá · ≤300 cây`.
Đặt cạnh `PRED-15`: *số tham số tự do ≤ cỡ mẫu hiệu dụng / 20*.

```
300 cây × 15 lá  =  4.500 lá  ⇒  bậc nghìn tham số tự do
n hiệu dụng khả dĩ (§7)       ⇒  bậc trăm
trần PRED-15                  ⇒  bậc chục
```

**Chênh hai bậc độ lớn. Cấu hình L6 kế thừa vi phạm chính luật của repo.** Điều này chưa ai ghi ra, vì `PRED-15` được viết ở bộ tài liệu mới còn `L6` viết ở bộ cũ.

**Ba ứng viên thay thế, xếp theo thứ tự đề xuất:**

| Hạng | Mô hình | Tham số tự do | Ưu | Nhược |
|---|---|---|---|---|
| **1** | **Hồi quy logistic phạt** (L2 hoặc elastic net) trên ≤ 6 đặc trưng đã chọn trước | ≈ số đặc trưng | Nằm trong ngân sách; hệ số **đọc được** ⇒ kiểm được cơ chế kinh tế; hỗ trợ trọng số mẫu theo độ duy nhất nhãn | Không bắt tương tác |
| **2** | **TabPFN v2** (mô hình nền tabular, prior **tổng hợp**) | 0 tham số fit, 0 trial | Mạnh nhất trong lớp mẫu nhỏ; **không tinh chỉnh ⇒ không ăn ngân sách Deflated Sharpe**; `RULE 12` không có đối tượng (§3.2) | Không có đường chính thức cho **trọng số mẫu** ⇒ phải thay bằng lấy mẫu tuần tự theo độ duy nhất; là hộp đen; phụ thuộc thư viện ngoài |
| **3** | GBM **rất** nhỏ (`depth 2`, ≤ 50 cây, ≤ 6 đặc trưng, learning rate cố định) | vẫn ở bậc trăm | Quen thuộc | Vẫn khó biện minh dưới `PRED-15`; cần ADR nếu chọn |

**Đề xuất chốt:** hạng 1 làm **mặc định**, hạng 2 làm **ứng viên thách thức** chạy song song trong kiểm toán, không phát khuyến nghị cho tới khi thắng hạng 1 trên holdout chưa chạm. LightGBM 300 cây **rút khỏi đặc tả**.

**Giữ nguyên từ đặc tả cũ (đúng và quan trọng):**
- Nhãn: chạm target trước stop = 1 · chạm stop trước = 0 · thoát LIFO/deadline = **right-censoring** theo dấu lợi suất thực nhận, trọng số theo thời gian sống. **Cấm nhãn phản thực** — dùng dữ liệu sau thời điểm thoát là rò rỉ đúng nghĩa `RULE 2`.
- Trọng số mẫu theo **độ duy nhất nhãn**. Bỏ nó = thổi phồng cỡ mẫu hiệu dụng đúng ở tầng đã thiếu mẫu, **và không có gì báo lỗi**.
- Cổng sống ba nhánh của `PRED-21`: `≥ +5pp` precision ⇒ bật · `+3…5pp` ⇒ giữ tắt, đo lại kỳ sau · `< +3pp` ⇒ **xoá tầng**.

> Văn liệu về meta-labeling báo cáo cải thiện precision có thật nhưng **khiêm tốn và phụ thuộc chiến lược gốc**
> ([Singh & Joubert](https://hudsonthames.org/wp-content/uploads/2022/04/Does-Meta-Labeling-Add-to-Signal-Efficacy.pdf)).
> Ngưỡng `+5pp` của repo nằm ở mép trên khoảng đó — nghĩa là **kết cục nhiều khả năng nhất là xoá tầng L6**, và
> đó là kết quả hợp lệ, phải được nói trước để không ai đi tìm cách nới ngưỡng khi nó xảy ra.

### 5.5 · A4 · Ensemble σ̂ — chỉ sau khi mọi thứ khác chạy

Bằng chứng ngoài mới nhất, trực tiếp đúng bài toán này: so 9 mô hình nền chuỗi thời gian **zero-shot** với 8 đặc tả kinh tế lượng họ HAR, trên 50 tài sản và ba chân trời ([arXiv 2607.05291](https://arxiv.org/abs/2607.05291)):

- **Mô hình nền không thắng HAR một cách đồng đều.** Lợi thế gộp tập trung ở vài tài sản ngoại lệ.
- Chỉ **Tiny Time Mixers (TTM)** — kiến trúc **nhỏ**, ~1M tham số — thắng Log-HAR ở mọi chân trời, **biên hẹp**.
- Phần lớn lợi thế ở chân trời ngắn đến từ **hiệu chỉnh thang đo**, không phải dự báo động lực tốt hơn.
- **Trung bình đều TTM + Log-HAR tốt hơn cả hai thành phần đứng riêng.**
- Kết luận của chính bài: **chọn kiến trúc quan trọng hơn chọn phe** (mô hình nền hay kinh tế lượng).

**Hệ quả cho repo:** HAR **giữ nguyên vai trò lõi**. TTM là ứng viên duy nhất đáng thử ở tầng σ̂, và chỉ theo dạng **trung bình đều với HAR**, không thay thế. Nhưng nó vướng `RULE 12`: TTM không công bố mốc cắt dữ liệu ⇒ theo §3.2 phải lấy ngày phát hành trọng số làm cận trên, và chỉ những fold sau mốc đó mới được chấm. Trước khi có đủ số fold hợp lệ, TTM **không vào đường sản xuất**.

**Điều kiện bật, đăng ký trước:**
```
① đủ số fold hợp lệ (test_start > cutoff bảo thủ) theo PRED-11
② QLIKE của ensemble tốt hơn HAR đơn ≥ 5%, Diebold–Mariano p < 0,05
③ nhánh dự phòng vẫn là EWMA tất định — KHÔNG có đường thứ ba (PRED-14a)
```

### 5.6 · Điều tầng 2 **không** được làm

| Cấm | Vì sao |
|---|---|
| Phát `Prediction` riêng khi chưa qua `PRED-08` | Registry là cửa duy nhất |
| Tạo hoặc đảo hướng | `PRED-21` · bất biến I2 |
| Đọc `p_required` làm cổng | `PRED-03` — sai kiểu, sai thứ nguyên |
| Tinh chỉnh siêu tham số bằng chính tập chấm | `PRED-15(b)` — sổ đăng ký trước |
| Đổi rào chắn để cứu một kết quả | `ADR-017 §2` — đăng ký trước rồi |

### 5.7 · A6 · Foundation model thị trường — vào hệ bằng cửa đối chứng

**Kronos** là mô hình nền chuyên cho nến tài chính, tiền huấn luyện trên hơn 12 tỉ bản ghi K-line từ 45 sàn, báo cáo cải thiện lớn về RankIC và MAE biến động trong thiết lập zero-shot ([arXiv 2508.02739](https://arxiv.org/abs/2508.02739) · [trọng số](https://huggingface.co/NeoQuasar/Kronos-base), MIT, ~102M tham số, ngữ cảnh 512).

**Vì sao vẫn không phát khuyến nghị được:**

| Rào | Chi tiết |
|---|---|
| **Mốc cắt dữ liệu không công bố** | Tài liệu trọng số không nói khoảng thời gian huấn luyện, không nói tách train/test theo thời gian. Theo §3.2 phải lấy ngày phát hành làm cận trên bảo thủ |
| **Số fold hợp lệ không đủ** | `PRED-11` đòi ≥ 8 fold trải ≥ 24 tháng **sau** mốc cắt. Với mốc bảo thủ giữa 2025, khoảng thời gian sạch tính tới nay chưa đủ |
| **Vũ trụ huấn luyện phủ đúng thị trường ta giao dịch** | Đây là kịch bản `RULE 12` được viết ra để chặn — không phải nghi ngờ trừu tượng |

**Vai được phép:** một dòng trong bảng baseline của `L8`, chấm trên **cùng** bộ kiểm định, để trả lời câu hỏi *"lõi rule-based của ta có thua một mô hình nền zero-shot không?"* Câu trả lời đó có giá trị dù theo chiều nào — nhưng nó là **thông tin**, không phải **sản phẩm**.

### 5.8 · A7 · Động lượng cắt ngang — giữ khoá, và nay có thêm lý do

`Old/17 §3` đã khoá nhánh này vì thiếu ảnh chụp universe quá khứ. Bằng chứng ngoài củng cố việc giữ khoá: phân tích dưới **giả định thực tế** trên thị trường crypto cho thấy **động lượng chuỗi thời gian mạnh, động lượng cắt ngang yếu**, và phần lớn lợi nhuận cắt ngang biến mất sau chi phí và rủi ro thanh lý ([Han, Kang & Ryu](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4675565)).

⇒ Ưu tiên hạ xuống dưới mọi việc ở §4.2. Vẫn tiếp tục **thu ảnh chụp universe hằng tháng** — dữ liệu đó không tạo lại được, và chi phí thu gần bằng không.

---

## 6 · Ba chiến lược triển khai

Không phải ba lựa chọn loại trừ — ba **mức tham vọng**, mỗi mức là điều kiện của mức sau.

| | **S1 · ĐO TRƯỚC** | **S2 · LỌC BẰNG MÔ HÌNH NHỎ** | **S3 · ENSEMBLE BIẾN ĐỘNG** |
|---|---|---|---|
| Tầng AI có gì | isotonic + conformal | + meta-label logistic/TabPFN | + TTM ⊕ HAR cho σ̂ |
| Rule / AI | 90 / 10 | 80 / 20 | 75 / 25 |
| Điều kiện bắt đầu | M1–M2 xong | S1 chạy + ≥300 sự kiện **forward** đã chấm | S2 chạy + đủ fold sau mốc cắt |
| Kết cục xác suất cao | có sản phẩm trung thực, im lặng phần lớn thời gian | **xoá tầng L6** (kết quả hợp lệ) | cải thiện QLIKE biên hẹp |
| Rủi ro chính | không có — đây là mức sàn | nhặt nhiễu ở n nhỏ | phụ thuộc thư viện ngoài + `RULE 12` |
| Giá trị học được | nghề kiểm định dự báo | nghề đo lường trên mẫu nhỏ | nghề tích hợp mô hình nền |

### → Khuyến nghị: **đi S1 trọn vẹn, đăng ký trước điểm rẽ sang S2, để S3 mở**

**Vì sao không nhảy thẳng S2.** Cổng bật L6 đòi **300 sự kiện forward đã chấm** — nghĩa là sự kiện phát ra *sau khi* hệ chạy thật, không phải sự kiện đào từ lịch sử. Số sự kiện mỗi đồng mỗi năm ở `spec_numbers §2` cho biết mốc đó tính bằng **quý**, không tính bằng tuần. Viết L6 trước khi có mẫu là viết một tầng sẽ nằm im và sẽ bị sửa lén khi bảng trống.

**Vì sao vẫn đăng ký S2 ngay bây giờ.** Đăng ký trước ngưỡng `+5pp / +3pp / xoá` **khi đầu còn lạnh** là toàn bộ giá trị của cổng đó. Đăng ký sau khi thấy kết quả là không đăng ký.

**Điểm rẽ, viết ra để không diễn giải lại về sau:**

| Kết quả đo | Hành động |
|---|---|
| L6 cho precision **≥ +5pp** trên holdout chưa chạm | Bật L6, method vẫn là `barrier`, nhãn sinh lại từ đầu |
| **+3…5pp** | Giữ tắt. Đo lại sau một kỳ. **Không** thêm đặc trưng để đẩy qua ngưỡng |
| **< +3pp** | **Xoá tầng L6 khỏi mã.** Ghi ADR. Đây là thành công của bộ kiểm định, không phải thất bại của dự án |

**Bốn hành động bị cấm trong cùng chu kỳ khi trượt** (`PRED-15(b)`): thêm tham số · nới ngưỡng · đổi giai đoạn dữ liệu · báo ô tốt nhất thay kết quả tổng hợp.

---

## 7 · Ngân sách thống kê — bảng phải tính trước khi viết mô hình

`PRED-15(a)`: **số tham số tự do ≤ cỡ mẫu hiệu dụng / 20.** Để dùng được, cả hai vế phải có định nghĩa máy tính được. Đăng ký định nghĩa sau:

### 7.1 · Cỡ mẫu hiệu dụng

```
n_eff  =  n_thô  ×  hệ số duy nhất nhãn  ×  hệ số độc lập chéo coin

hệ số duy nhất nhãn : trung bình độ duy nhất theo Lopez de Prado —
                      nhãn chồng lấn H nến làm n nhỏ đi tới H lần
hệ số độc lập       : 1 / (1 + (k−1)·ρ̄) với k coin, ρ̄ tương quan trung bình
                      của chuỗi lợi suất sự kiện — KHÔNG phải của chuỗi giá
```

Cả ba đại lượng **phải do `measure_spec.py` sinh**, không chép tay (`ADR-016`). Con số sinh ra trỏ `spec_numbers`.

> Ví dụ minh hoạ cách đọc, **không phải số của hệ**: nếu tương quan chéo coin cao và nhãn chồng lấn nhiều ngày, một vũ trụ bốn chữ số sự kiện thô có thể co về bậc **trăm** — và trần tham số khi đó là bậc **chục**.

### 7.2 · Số tham số tự do — quy ước đếm, đăng ký trước

| Loại mô hình | Đếm là |
|---|---|
| Hồi quy tuyến tính/logistic | số hệ số + hằng số |
| Isotonic | số đoạn của hàm bậc thang đã fit |
| Cây tăng cường | **tổng số lá trên mọi cây** (không phải số hyperparameter) |
| Mô hình nền tiền huấn luyện, dùng zero-shot | **0**, nhưng `n_trials_registered` tính mọi biến thể đã thử |
| ACI | 1 (`η`) |
| Lưới quy tắc đã đóng băng | số ô lưới **không** tính vào đây; nó tính vào Deflated Sharpe qua `n_trials` |

> **Hai bài toán khác nhau, đừng gộp** (`Old/10 §5.10`): **Deflated Sharpe** phạt theo *số cấu hình đã thử*; **kiểm soát FDR** phạt theo *số chuỗi được chấm cùng lúc*. Cấm hiển thị bảng xếp hạng coin theo kỹ năng trước khi áp hiệu chỉnh đa phép thử (`PRED-15(a)`).

---

## 8 · Kiểm định và nhãn

### 8.1 · Bộ kiểm định (thi hành `PRED-11`)

| Thành phần | Đặc tả |
|---|---|
| Bộ chia | Purged walk-forward tự viết · **một trục thời gian toàn cục** cho mọi cặp — chia theo từng symbol là rò rỉ chéo coin gần như trực tiếp |
| Purge & embargo | = độ dài nhãn, áp **cả hai biên** của mọi lát dùng để fit bất cứ thứ gì (kể cả lát hiệu chỉnh) |
| Sàn cỡ lát test | Đăng ký trong mã; lát nhỏ hơn sàn ⇒ **ném lỗi**, không cảnh báo im lặng |
| Holdout | `store` từ chối trả nến trong khoảng holdout trừ khi gọi với mục đích `final_scoring`; mỗi lần gọi ghi bản ghi bất biến; quá số lần đăng ký ⇒ **holdout đã cháy** |
| Baseline | Toàn bộ bộ đăng ký, sau phí. Thiếu một baseline ⇒ **không gắn nhãn** |

### 8.2 · Bảy phép dò rò rỉ — năm cũ, hai thêm

| # | Phép dò | Trạng thái |
|---|---|---|
| 1–5 | Bộ kế thừa (`Old/PREDICTION_DESIGN §LV.2`) | có, **phải tự chứng minh bằng bộ tiêm** (M2) |
| **6** | **Batch ↔ live:** chạy cùng đoạn lịch sử qua hai đường, `assert` σ̂ khớp tới sai số đăng ký | `DATA-06` |
| **7** | **Rò rỉ theo fold, không pha loãng:** báo cáo chỉ tiêu **từng fold**, không chỉ trung bình — một rò rỉ khổng lồ ở một fold bị trung bình 8 fold che mất | **mới, đề xuất ở tài liệu này** |

Bốn lớp rò rỉ mà cả đặc tả cũ lẫn `PRED-11` chưa đòi tường minh, nay đăng ký: **(a)** fit bộ chuẩn hoá trên toàn mẫu · **(b)** chọn đặc trưng ngoài fold · **(c)** nhãn chồng lấn thiếu purge · **(d)** thiên lệch sống sót.

### 8.3 · Nhãn trạng thái kiểm chứng

Nhãn là **hàm thuần của sáu đầu vào** (`PRED-13`), không ai đặt tay được. Tài liệu này chỉ thêm một ràng buộc thi hành:

> **Mỗi method trong registry sinh nhãn độc lập.** Tầng 2 không thừa hưởng nhãn của tầng 1 — kể cả khi nó dùng lại tám trong chín lớp. Method mới bắt đầu ở `chưa kiểm chứng`, và mọi khuyến nghị của nó mang nhãn đó cho tới khi tự thắng bộ baseline.

### 8.4 · ★ Vấn đề công suất của quy tắc "nhãn = giá trị thấp nhất trong các cặp"

`PRED-13` quy định nhãn mức phương pháp là **giá trị thấp nhất** trong các cặp nó đang phát.
Đặt cạnh §2.3 (đơn vị mẫu là sự kiện, không phải nến), quy tắc này có một hệ quả không mong muốn:

```
số sự kiện mỗi cặp trong toàn bộ lịch sử   → spec_numbers §2  (bậc trăm)
sai số chuẩn của tỉ lệ trúng ở cỡ đó       → vài điểm phần trăm
sai số chuẩn của Sharpe ở cỡ đó            → cùng bậc với chính giá trị cần phân biệt
```

⇒ Ở mức **từng cặp**, phép thử gần như **không có công suất**: không tách được "có kỹ năng"
khỏi "không". Lấy giá trị thấp nhất trên một tập phép thử vô công suất cho ra một đèn **luôn
đỏ** — và một đèn luôn đỏ mang lượng thông tin bằng không, đúng thứ `ADR-020` không muốn, vì
nhãn trung thực là lớp phòng ngự **duy nhất** còn lại sau khi bỏ GATE.

**Đề xuất (cần ADR — §11):**

| Vấn đề | Sửa |
|---|---|
| Phán quyết kỹ năng ở mức cặp | Chuyển lên **mức phương pháp**, trên bảng gộp toàn vũ trụ, sai số bằng **block bootstrap** với block ≥ độ dài nhãn |
| Trạng thái từng cặp | Hạ xuống thành **thuộc tính của cặp** (đủ/thiếu dữ liệu, độ phủ dải đạt/trượt), hiển thị nhưng không kéo nhãn phương pháp xuống |
| Ba trạng thái không phân biệt được "chưa đo" với "đo rồi, trượt" | Thêm trạng thái thứ tư **`không đủ dữ liệu để kết luận`** — tách khỏi `chưa kiểm chứng`. Bảng chân trị vẫn là hàm toàn phần, chỉ thêm một ô |

> Sửa này **không nới chuẩn**: nó chuyển phép thử về nơi có đủ mẫu để phép thử **có nghĩa**,
> và làm cho trạng thái "chúng tôi chưa biết" nói đúng điều nó muốn nói.

---

## 9 · Lộ trình theo phụ thuộc

Không có ngày tháng — xếp theo cái gì chặn cái gì.

```
⓪  ★ SỔ BẤT BIẾN BẬT TRƯỚC MỌI MÔ HÌNH
    Prediction (PRED-05) + sổ khuyến nghị (TRACK-01) ghi từ bản ghi ĐẦU TIÊN,
    kể cả khi nội dung dự đoán còn thô sơ và nhãn còn là «chưa kiểm chứng».
    Lý do: mọi ngưỡng bằng chứng của hệ đếm SỰ KIỆN FORWARD — backtest không tính.
    Đồng hồ chỉ bắt đầu chạy khi sổ tồn tại, và không có cách nào chạy bù.
①  M1 dữ liệu ngày thật  ─┬─►  M2 bộ kiểm định tự chứng minh  ─►  M3 đo lại bề mặt
                          │                                          trên vũ trụ ngoài hiệu chuẩn
                          └─►  L1 lõi đặc trưng + phép dò #6
②  L2 σ̂ HAR  ─►  cổng QLIKE riêng của L2  ─►  ★ giá trị thật đầu tiên của cả dự án
                                                (một con số dám bảo vệ trên dashboard)
③  L3 phân phối + A2 conformal  ─►  M4 kiểm toán độ phủ cuộn  ─►  PRED-14(b) đạt
④  L4 cổng phí (p_required, p_star trong mã)  ─►  L5 máy tranche  ─►  sổ bất biến L8
⑤  ★ hệ chạy thật, im lặng có số  ─►  tích luỹ sự kiện forward
⑥  ≥300 sự kiện forward  ─►  A3 meta-label  ─►  điểm rẽ §6 (bật / hoãn / xoá)
⑦  đủ fold sau mốc cắt  ─►  A4 ensemble σ̂  (tuỳ chọn, không chặn gì)
⑧  PRED-20 method thứ hai  ─►  qua đúng cửa registry §3.2
```

> ### ★ Đồng hồ bằng chứng — hệ quả thiết kế không thể lách
>
> Ngưỡng ≥300 mẫu đã chấm (hiệu chỉnh, `PRED-12`) và ≥300 sự kiện **forward** (bộ lọc,
> `PRED-21`) cộng với số sự kiện mỗi năm ở `spec_numbers §2` đặt nhãn `đã kiểm chứng` cách
> ngày phát hành **nhiều quý, có thể nhiều năm**. Gõ mã nhanh hơn không rút ngắn được nó.
>
> Hai hệ quả bắt buộc, và chúng định hình toàn bộ tài liệu này:
> 1. **Sổ bật trước mô hình** (bước ⓪). Không có ngoại lệ.
> 2. **Sản phẩm phải có lý do tồn tại khi mang nhãn `chưa kiểm chứng` vĩnh viễn.** Nếu giá trị
>    của hệ chỉ xuất hiện sau khi có nhãn xanh, hệ **không có trạng thái ra mắt**. Đây là lý do
>    §6 đặt S1 làm mức sàn và §5.1 xếp `A1`/`A2` lên trước `A3`: dự báo biến động có QLIKE
>    thắng đối chứng, và dải giá có độ phủ đo được, là **giá trị không phụ thuộc nhãn**.

**Mốc đáng bảo vệ nhất là ②.** Nó là tầng duy nhất tự chứng minh được với số quan sát nhỏ, và nó đứng độc lập: kể cả khi toàn bộ nhánh khuyến nghị trượt, một dự báo biến động có QLIKE thắng đối chứng vẫn là một sản phẩm thật.

---

## 10 · Điều không làm, và rủi ro còn mở

### 10.1 · Không làm — có lý do, không phải chưa kịp

| Không làm | Lý do |
|---|---|
| Mô hình hướng bằng học máy | §2.1 — không có gì để học, và thành công là bằng chứng buộc tội (`RULE 11`) |
| Ba mô hình quantile riêng | Dải giá suy từ **một** phân phối ⇒ đơn điệu theo cấu tạo (`PRED-01`) |
| Trạng thái SHORT | Trôi dương · funding bất đối xứng · phí vay |
| Chọn ô lưới tốt nhất | Tương quan hạng tham số giữa hai đoạn thời gian quá thấp ⇒ tổ hợp, không chọn |
| Tinh chỉnh siêu tham số quy mô lớn | Ngân sách Deflated Sharpe; và `n_trials` phải khai (§3.2) |
| Cho người dùng chọn tham số rào chắn | `ADR-018 §6` — là thuê người dùng p-hack hộ mình |

### 10.2 · Rủi ro còn mở — ghi ra để không ai ngạc nhiên

| Rủi ro | Mức | Giảm nhẹ |
|---|---|---|
| **Ưu thế của rào `6,0σ̂` co lại ngoài mẫu** — tham số chọn sau khi nhìn dữ liệu | **cao** | `ADR-017 §2` đã đăng ký trước; M3 chấm trên 36 cặp ngoài nhóm hiệu chuẩn, báo cáo riêng |
| **L6 không mua được gì** ⇒ xoá tầng | trung bình–cao | Đã đăng ký là kết quả hợp lệ (§6). Không thêm đặc trưng để cứu |
| **Im lặng dài làm người vận hành hạ ngưỡng** | **cao** | Im lặng phải **có số** và `silence_reason` bắt buộc; ngưỡng nằm trong mã, pin bằng test (`PRED-17`) |
| **Cỡ mẫu không bao giờ đủ cho tầng 2** | trung bình | Chấp nhận: S1 là mức sàn và tự nó là sản phẩm |
| **Phụ thuộc thư viện ngoài** (TabPFN, TTM) | trung bình | Cả hai là **ứng viên thách thức**, không nằm trên đường sản xuất; mặc định luôn là mô hình tự viết |
| **Nhãn không bao giờ lên xanh** vì quy tắc lấy giá trị thấp nhất theo cặp | **cao** | §8.4 — chuyển phán quyết lên mức phương pháp, thêm trạng thái thứ tư |
| **Dây an toàn `PRED-02` bịt miệng khung 1 ngày** trong chế độ biến động thấp | **cao** | §2.5 — sửa trước khi viết L4, kèm test quét σ̂ |

---

## 11 · Việc phải làm với tài liệu và mã sau khi bản này được duyệt

| # | Việc | Vì sao |
|---|---|---|
| 1 | **ADR-021** — thêm `pretrained_corpus` vào hợp đồng registry (§3.2) | `PRED-08` hiện thiếu trạng thái "tiền huấn luyện trên dữ liệu tổng hợp" ⇒ loại oan TabPFN, và **không siết đủ** với Kronos/TTM |
| 2 | **ADR-022** — thay "chỉnh z" bằng ACI cho độ phủ dải giá (§5.3) | Cách cũ là vòng tối ưu không đăng ký trước, chạy trên chính chỉ tiêu dùng để chấm |
| 3 | **ADR-023** — rút LightGBM 300 cây khỏi L6, đặt logistic phạt làm mặc định (§5.4) | Cấu hình kế thừa vi phạm `PRED-15` hai bậc độ lớn |
| 4 | Đăng ký quy ước đếm `n_eff` và `free_params` vào `measure_spec.py` (§7) | `PRED-15` chưa dùng được cho tới khi hai vế có định nghĩa máy tính được |
| 5 | Đánh dấu `src/cryptopred/serving/schemas.py` **DEPRECATED** ngay trong mã + test ghim tên trường | Hợp đồng chết đang tự xưng là ràng buộc; `Old/19 §B3` |
| 6 | Thêm phép dò rò rỉ #7 (báo cáo theo fold) vào bộ kiểm định | §8.2 |
| 7 | **ADR-024** — sửa dây an toàn `PRED-02`: đo `p_win − p_star` và `c_R`, bỏ ngưỡng `p_required > 0,60` khỏi vai trò cổng (§2.5) | Dây hiện tại im lặng đúng lúc đáng phát nhất; là lỗi thứ nguyên cùng họ với `ADR-013` |
| 8 | **ADR-025** — phán quyết kỹ năng ở mức phương pháp + trạng thái thứ tư `không đủ dữ liệu để kết luận` (§8.4) | Quy tắc lấy giá trị thấp nhất theo cặp cho đèn luôn đỏ; nhãn là lớp phòng ngự duy nhất sau `ADR-020` |
| 9 | **Bật sổ `Prediction` + `TRACK-01` ngay**, trước mọi mô hình (bước ⓪ của §9) | Mọi ngưỡng bằng chứng đếm sự kiện **forward**; không có cách chạy bù đồng hồ |

---

*Tài liệu này không chứa số đo. Mọi kết quả: `docs/generated/spec_numbers.md` (sinh bởi `scripts/spec/measure_spec.py`).
Bằng chứng ngoài được trích có đường dẫn tại chỗ trích. Hồ sơ đo lường thế hệ 1: `docs/Old/`.*
