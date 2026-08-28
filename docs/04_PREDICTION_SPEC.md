# 04 · LÕI DỰ ĐOÁN — CHIẾN LƯỢC VÀ KIẾN TRÚC

> **Trạng thái:** **nháp 2** · 28/08/2026 · chờ chủ dự án duyệt — đã áp một vòng phản biện đối kháng (78 phát hiện xác nhận). **Bảy câu ở §11.1 đang chặn; §0 còn nhiều ô "chưa đăng ký".**
> **Căn cứ:** `00_VISION.md §6` (lõi hai tầng) · `01_REQUIREMENTS.md §3 PRED-01…22` (cái gì + kiểm bằng gì) ·
> `adr/002` (khoá 1h/4h) · `adr/016` (số sinh tự động) · `adr/017` (rào 6,0σ̂) · `adr/018` (tầng chọn lọc) · `adr/020` (bỏ GATE)
> **Kế thừa phần đo lường:** `Old/PREDICTION_DESIGN.md` · `Old/10_PREDICTION_ARCHITECTURE.md` · `Old/12` · `Old/14` · `Old/17`
> **Vai trò:** nói **LÀM THẾ NÀO** lõi dự đoán thoả REQ-PRED. Không nhắc lại REQ; mỗi mục trỏ REQ nó thi hành.
> **Luật soạn thảo (ADR-016):** tài liệu này **không giữ số đo**. Mọi kết quả trỏ `docs/generated/spec_numbers.md`.
> Số xuất hiện dưới đây chỉ là **luật** (ngưỡng đăng ký trước) hoặc **số của tài liệu ngoài** có nguồn kèm.

---

## 0 · SỔ NGƯỠNG ĐĂNG KÝ TRƯỚC — nơi duy nhất 04 trả lời uỷ thác của 01

`01_REQUIREMENTS` uỷ thác **9 con số quyết định** cho tài liệu này (mọi chuỗi ``ở `04``, tất cả từ
REQ mức CHẶN). `ADR-016` **cho phép** tài liệu chứa ngưỡng đăng ký trước — nó chỉ cấm số **đo**.
Bảng này là chỗ duy nhất trả lời; trả lời bằng chữ *"đăng ký"* ở chỗ khác **không tính**.

| Hằng số trong mã | Giá trị | REQ uỷ thác | ADR | Test ghim |
|---|---|---|---|---|
| `COST_GATE_MARGIN_PP` | **chưa đăng ký — chặn `PRED-04`, chặn L4** | PRED-04 | — | `test_cost_gate_margin_pinned` |
| `MIN_TEST_SLICE_EVENTS` | **chưa đăng ký — dẫn xuất từ §7.3, chặn `PRED-11`** | PRED-11 | — | `test_min_test_slice_raises` |
| `MIN_TRAIN_BARS` | **chưa đăng ký theo khung** — mặc định 5000 của `config` làm 8 fold khung ngày **bất khả hôm nay** (§7.3) | PRED-11 | — | `test_min_train_bars_per_tf` |
| `HOLDOUT_TOUCH_BUDGET` | **chưa đăng ký — chặn cưỡng chế holdout** | PRED-11 | — | `test_holdout_burned_at_budget` |
| `BASELINE_SET` | **chưa đăng ký** — phải khoá cứng, thứ tự cố định; mô hình nền thị trường **không** nằm trong bộ này (§5.7) | PRED-11 · RULE 4 · PRED-22 | — | `test_baseline_set_frozen` |
| `LABEL_TTL_DAYS` | **chưa đăng ký — chặn đầu vào thứ sáu của `PRED-13`** | PRED-13 | — | `test_label_expires` |
| `MIN_SCORED_PREDICTIONS_PER_PAIR` · `COVERAGE_TOLERANCE_PP` | **chưa đăng ký** — và độ phủ hiện đo được **cao hơn 80%** (§4.3), nên chưa biết đạt hay trượt | PRED-14(b) | — | `test_coverage_audit_gated_on_n` |
| `PIT_TEST` | **chưa đăng ký** — tên phép kiểm phải cố định trước | PRED-14(b) | — | `test_pit_test_name_pinned` |
| `MULTIPLE_TESTING_LEVEL` | **chưa đăng ký — chặn mọi bảng xếp hạng** | PRED-15(a) | — | `test_ranking_refuses_without_adjustment` |
| `WIDE_UNIVERSE_N` · `NARROW_UNIVERSE_N` | **chưa đăng ký — câu hỏi chặn nặng nhất** (§7.3: quyết định `PRED-11`×`PRED-12` có nghiệm hay không) | PRED-19 | — | `test_universe_nesting` |
| `ACI_ETA` · `T_MIN_AUDIT_DAYS` | **chưa đăng ký** — phải dẫn xuất, không phải số rơi từ trời (§5.3) | PRED-14(b) | ADR-022 | `test_eta_pinned` |
| `N_TRIALS_REGISTERED["barrier"]` | **chưa đăng ký** — cận dưới đã biết: 16 ô bề mặt rào (`ADR-017`) + 27 ô lưới xu hướng + 4 tầng (`ADR-018`) | PRED-15 | — | `test_n_trials_never_decreases` |
| `L6_FIT_SET` | **chưa đăng ký** — quyết định trần tham số đạt hay trượt (§7.1) | PRED-21 | ADR-023 | `test_l6_fit_set_pinned` |
| `EXIT_CONVENTION` | **chưa đăng ký — chênh 39–52% EV toàn hệ** (§4.1) | PRED-18(a) | ADR-013 | `test_exit_convention_pinned` |
| Quy ước vào lệnh | tín hiệu tại close `t` ⇒ vào tại **open `t+1`** | PRED-18(a) | ADR-013 | đã đăng ký, §4.1 |

> **Luật của bảng này:** ô chưa quyết ghi thẳng **"chưa đăng ký — chặn việc X"**. Không được để
> trống, và **không được thay bằng chữ "đăng ký"** trong văn xuôi — đó chính là cách bản nháp 1
> trả lời 8/9 uỷ thác mà không trả lời gì.
>
> **Test kiến trúc `test_req_delegations_resolve`:** mọi chuỗi khớp ``ở `04`` trong
> `01_REQUIREMENTS.md` phải ánh xạ tới đúng một hằng số **có tên trong bảng này** *và* **có mặt
> trong mã**; thiếu ⇒ CI đỏ. Không có test này thì bảng lại trôi như lần trước.

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

1. **AI không chạm vào hướng, ở cả tầng 1 lẫn tầng 2.** Hướng đến từ quy tắc xu hướng có cơ chế kinh tế đọc được; AI chỉ được **thu hẹp** danh sách và **định lượng độ bất định**. ⚠️ **Nhưng chính lưới xu hướng chưa chứng minh được nó đóng góp gì** — đối chứng vào lệnh vô điều kiện (M0, §4.2) cho thấy một phần lớn EV của tầng 1 có sẵn mà **không cần tín hiệu hướng nào**, phần còn lại chỉ vừa chớm vượt nhiễu. Câu này đúng về **chỗ đặt AI**; nó **chưa** là khẳng định rằng phần rule đang tạo ra kỹ năng.
2. **Ràng buộc thật của tầng AI không phải thuật toán — là cỡ mẫu.** Với vài trăm sự kiện độc lập, `PRED-15` (tham số tự do ≤ n hiệu dụng / 20) **loại thẳng** LightGBM 300 cây mà `Old/PREDICTION_DESIGN §L6` đang mặc định. Xem §5.4 và §7 — đây là thay đổi lớn nhất tài liệu này đề xuất.
3. **Foundation model của thị trường tài chính (Kronos, Chronos, TimesFM) không đủ điều kiện phát khuyến nghị**, không phải vì yếu mà vì `RULE 12` + `PRED-08`: chúng không công bố mốc cắt dữ liệu, nên số fold hợp lệ không đủ. Chúng vào hệ với đúng một vai: **đối chứng**. Xem §5.7.
4. **Ba luật đang có hiệu lực phải sửa trước khi viết mã.** Dây an toàn `p_required > 0,60` của `PRED-02` đo **sai thứ nguyên** (§2.5 — tần suất cắn nhỏ hơn bản nháp trước tưởng, nhưng lỗi vẫn là lỗi); quy tắc *nhãn = giá trị thấp nhất trong các cặp* của `PRED-13` cho một đèn **luôn đỏ** vì ở mức cặp phép thử không có công suất (§8.4); và ràng buộc lát hiệu chỉnh của `PRED-12` ghép với `PRED-11` **có thể vô nghiệm** ở vũ trụ hẹp, hỏng **im lặng** (§7.3).

---

## 2 · Bốn ràng buộc đóng khung mọi lựa chọn — và một lỗi phải sửa trước

### 2.1 · Bức tường phí là hàm của biên độ

`p_required = 0,5 + c / (2·E|move|)` — với `c` là chi phí khứ hồi (`PRED-16`) và `E|move|` biên độ kỳ vọng.
Hệ quả đã đo và đã khoá bằng ADR-002: ở khung 4 giờ ngưỡng hoà vốn vượt xa trần năng lực dự báo hướng, **giao của "đủ lãi" và "đáng tin" là tập rỗng**. Vì thế ý định giao dịch chỉ tồn tại ở khung 1 ngày, và tồn tại nhờ **đổi hình dạng cược** (payoff 5,00R hạ ngưỡng hoà vốn xuống mức trần năng lực với tới được) — không nhờ mô hình hướng tốt hơn.

> **Điều này quyết định toàn bộ phần AI:** không có chỗ cho một mô hình hướng, dù là cây, mạng, hay foundation model. Có chỗ cho mô hình **biên độ** và mô hình **bỏ lệnh**.

### 2.2 · Ngân sách chiều thông tin là 13, không phải 57

`Old/14 §0.1`: 57 đặc trưng từng được đề xuất, 38 dựng được, **13 chiều thật sự độc lập** ở ngưỡng |ρ| ≥ 0,70. Toàn bộ khối động lượng + xu hướng + cấu trúc gộp lại là **một** chiều.
⇒ Muốn chiều thứ 14 phải thêm **nguồn dữ liệu**, không phải thêm công thức. Mọi kiến trúc AI đề xuất thêm 40 feature kỹ thuật là đề xuất thêm nhiễu.

> ⚠️ **Con số 13 đo trên MỘT tài sản**, và `Old/14` tự ghi nhóm liên thị trường chưa kiểm được. ⇒ **Cần đo lại trên vũ trụ nhiều cặp trước khi dùng làm ngân sách cứng** (Phụ lục A.2, §11.4). Kết luận định tính — *thêm công thức không thêm chiều* — không phụ thuộc con số này.

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

Bề mặt hai ngưỡng — `spec_numbers §6` (sinh bởi `measure_spec.py::cost_gate_surface`).
Tần suất dây thật sự kích hoạt — `spec_numbers §6b` (`::wire_bite_rate`). Tài liệu này chỉ trỏ.

**Đọc bảng:** với chân trời 1 ngày, dây an toàn kích hoạt khi σ̂ ngày dưới ngưỡng ở `§6`. Đo được
trên hai mẫu số (`§6b`): nó cắn một **thiểu số** ngày-đồng và một **thiểu số** sự kiện tranche —
**không phải "phần lớn thời gian"** — nhưng phân bố **rất lệch theo cặp**, BTCUSDT chịu phần lớn.
Ở chân trời bằng thời gian nắm giữ, tần suất kích hoạt là **0%**.

Và `c_R = c/(sl·σ̂)` đi **NGƯỢC** chiều với σ̂: nhóm bị bịt đúng là nhóm **chi phí trên mỗi R cao
nhất**, không phải nhóm rẻ nhất. Vì thế câu hỏi thật không phải *"dây có bịt miệng hệ không"* mà:

> **Nhóm sự kiện đó có đáng phát không, khi mỗi đơn vị R của chúng đắt hơn nhiều lần —
> và khi nó rơi gần trọn vào một cặp?**

Đó vẫn là câu hỏi phải trả lời, nhưng nó **nhỏ hơn và khác** câu tôi đặt ở bản nháp trước.

### Vấn đề còn lại sau khi đo: đại lượng vẫn sai, chân trời vẫn chưa khớp phương pháp

Hai chuyện tách bạch, đừng gộp:

| | Sự thật | Hệ quả |
|---|---|---|
| **Đại lượng** | `p_required` là hoà vốn cược **đối xứng 1:1**, dùng làm cổng cho cược **rào chắn 5,00R** | Lỗi thứ nguyên — cùng họ với `ADR-013`. `p_star` là đại lượng đúng của cược đang phát |
| **Chân trời** | `H` **có** nơi đăng ký: `config/model.yaml` `label.horizon_bars`, `ADR-002 §4` trích nguyên văn. Vấn đề là **giá trị** `"1d": 1` — chân trời kinh tế của phương pháp là **thời gian nắm giữ**, không phải một nến | Đổi `H` sang chân trời nắm giữ làm tần suất kích hoạt về **0%** (`§6b`) mà không đụng gì khác |

**Hai nhánh sửa, LOẠI TRỪ NHAU — cần chủ dự án chọn (§11, ADR-024):**

```
(a) SỬA CHÂN TRỜI — nhẹ.  Giữ nguyên đại lượng p_required và ngưỡng 0,60;
    đăng ký H = chân trời NẮM GIỮ của chính cược đang phát.
    · tiền lệ: ADR-002 §4 đã chấm panel 4h ở chân trời 24 giờ
    · đo được: tần suất kích hoạt 5,4% → 0,00%; khung giả 4h VẪN bị chặn
    · giữ nguyên phép kiểm nghiệm thu nguyên văn của PRED-02
(b) SỬA ĐẠI LƯỢNG — nặng.  Bỏ p_required khỏi vai cổng, thay bằng p_win − p_star.
    · nhưng phép kiểm nghiệm thu của PRED-02 («khung giả có p_required = 0,65
      ⇒ không phát ý định») KHÔNG THỰC THI ĐƯỢC NỮA
    · ⇒ ADR phải sửa luôn cột «Kiểm bằng» của một REQ mức CHẶN
```

> **Rào thứ hai kiểu `c_R > trần` đã bị BỎ khỏi đề xuất.** Nó không phải rào độc lập: với σ̂ thang
> ngày nó không chứa số hạng khung nên bằng nhau ở 1h/4h/1d; còn nếu cho σ̂ co theo khung thì
> `c_R > τ` **trùng vị từ** với `p_required > 0,60`. Hai rào độc lập giữ nguyên bản chất cũ:
> **rào chính** = danh sách trắng `tf ∈ TRADE_TF` (`ADR-002`), **rào hai** = `p_required` của
> chân trời đang phát. Nếu vẫn muốn một rào đọc `p_win`, phải ghi rõ nó là **mở rộng phạm vi của
> `PRED-04`** từ mức tranche lên mức đường phát — **không** phải rào độc lập, vì một lỗi trong bộ
> hiệu chỉnh sẽ tắt cả hai cùng lúc, đúng thứ `PRED-02` cấm.

**Test pin hai chiều, bắt buộc dù chọn nhánh nào:** quét σ̂ từ 0,8% đến 5,0% ở `H` đã đăng ký ⇒
đường 1 ngày **không** im lặng vì lý do biến động; đăng ký một khung giả 4h ⇒ **phải** im lặng.

*(Bản nháp trước của mục này chứa hai ô `p_star` chép sai và hai mệnh đề diễn giải sai — trong đó
một mệnh đề **sai dấu**. Phát hiện bởi vòng phản biện 28/08; bảng chép tay đã bị xoá khỏi tài liệu
và thay bằng con trỏ, mệnh đề sai dấu đã bị xoá khỏi cả `measure_spec.py`.)*

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
├─ L5 · HƯỚNG SƠ CẤP ─────────────────────────────────────────────── QUY TẮC ─┤
│  tổ hợp lưới xu hướng → w ∈ {0; ¼; ½; ¾; 1} · máy trạng thái tranche          │
├─ L6 · LỌC BỎ ──────────────────────────────────────────────────── HỌC MÁY ─┤
│  «sự kiện này chạm chốt lời trước dừng lỗ không?»  TẮT MẶC ĐỊNH (PRED-21)     │
│  ⛔ chỉ được thu hẹp — không tạo hướng, không đảo hướng, fuzz-test đơn điệu    │
│  ★ khi TẮT, p_win vẫn phải có nguồn — xem khối ★ ngay dưới sơ đồ              │
├─ L4 · CỔNG PHÍ ─────────────────────────────────────────────────── QUY TẮC ─┤
│  p_required (hiển thị, mọi khung) · p_star (quyết định, của chính rào chắn)   │
│  ⛔ CHẶN: tf ∉ TRADE_TF ⇒ ý định RỖNG                          (PRED-02)      │
│  ⛔ CHẶN: p_win_cal < p_star + COST_GATE_MARGIN_PP ⇒ RỖNG      (PRED-04) ★    │
│  ⛔ CHẶN: p_required > 0,60 ⇒ RỖNG — luật ĐANG HIỆU LỰC, xem §2.5             │
├─ L7 · CỠ GỢI Ý & CẢNH BÁO ─────────────────────────────── QUY TẮC (+ ML) ─┤
│  suggested_size_pct theo notional cố định · danh sách cảnh báo · KHÔNG đặt lệnh│
├─ L8 · SỔ & BẢNG ĐIỂM ───────────────────────────────────────────── QUY TẮC ─┤
│  sổ bất biến (PRED-05) · chấm kết cục · QLIKE · độ phủ · PIT · nhãn PRED-13   │
│  ✅ chạy VÔ ĐIỀU KIỆN, kể cả khi hệ im lặng hoàn toàn                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

> ### ★ Cổng phí đứng SAU lớp sinh `p_win` — và `p_win` phải có nguồn kể cả khi L6 tắt
>
> Bản nháp 1 xếp L4 trước L5/L6, tức đặt cổng phí **trước** lớp sinh đầu vào của chính nó, và
> hộp L4 **không nhắc `PRED-04`** — REQ mức CHẶN định nghĩa cổng phát khuyến nghị. Nặng hơn: ở
> cấu hình mặc định (L6 tắt) **không lớp nào sinh `p_win`**, nên isotonic không có gì để hiệu
> chỉnh, `PRED-03` thiếu một trong bốn số bắt buộc in, và `PRED-04` không có đầu vào.
>
> **Nguồn `p_win` khi L6 tắt — chọn MỘT, đăng ký vào §0, không có đường thứ ba:**
>
> | | Cách | Được | Mất |
> |---|---|---|---|
> | **(i)** | Xác suất chạm rào **suy giải tích từ chính `F` của L3** | Giữ bất biến I1 "một phân phối"; không thêm mô hình nào | Phụ thuộc giả định dạng `F`; dưới bước ngẫu nhiên nó gần như hằng số |
> | **(ii)** | **Tỉ lệ trúng thực nghiệm theo bucket σ̂** (§4.2 M5), qua isotonic `PRED-12` | Là số đo thật, không phải giả định | Cần đủ mẫu mỗi bucket; là một mô hình nhỏ phải chịu ngân sách §7 |
>
> ⛔ **`p_up` không bao giờ được dùng thay `p_win`** — khác thứ nguyên (`PRED-03`): `p_up` là xác
> suất giá tăng ở chân trời, `p_win` là xác suất chạm chốt lời trước dừng lỗ.

### 3.2 · Hợp đồng đăng ký một phương pháp (thi hành `PRED-08`)

Một `method` là một bản ghi bất biến, khai đủ các trường sau thì mới đăng ký được:

| Trường | Kiểu | Ý nghĩa · ràng buộc |
|---|---|---|
| `method_id` | `str` | Định danh ổn định. Vào khoá idempotent của `Prediction` (`PRED-05`) |
| `layers_owned` | `frozenset[str]` | Lớp nào method này thay thế. Lớp không khai ⇒ dùng bản dùng chung |
| `effective_cutoff()` | `date \| None` | **Hàm dẫn xuất, không khai tay.** `None` hợp lệ khi `trained_from_scratch = True` **hoặc** `pretrained_corpus = "synthetic"` đã qua phép dò #10. Khi nhà cung cấp không công bố: lấy `weights_release_date` làm **cận trên bảo thủ** |
| `trained_from_scratch` | `bool` | True ⇒ mọi trọng số sinh trong repo, từ dữ liệu repo |
| `pretrained_corpus` | `Literal["none","synthetic","market","mixed"]` | **Đề xuất mới, cần ADR** — xem ghi chú dưới |
| `free_params` | `int` | Số tham số tự do khai báo. Vào phép kiểm trần `PRED-15` (§7) |
| `n_trials_registered` | `int` | Số cấu hình từng thử. Vào Deflated Sharpe |
| `monotone_only` | `bool` | True ⇒ chịu fuzz-test "tập ra ⊆ tập vào" |
| `emits_intent` | `bool` | False ⇒ không bao giờ sinh `new_tranches` |
| `weights_release_date` · `weights_uri` · `weights_sha256` · `library_version` | | **Bốn trường mới, bắt buộc khi `pretrained_corpus ≠ "none"`.** Không có chúng thì luật "lấy ngày phát hành làm cận trên" **không cưỡng chế được bằng mã** — và hai kết luận §5.5, §5.7 đang đứng trên một trường không tồn tại |

> **★ `pretrained_corpus` — bảng chân trị TOÀN PHẦN, không ô nào rơi mặc định.**
> Hợp đồng cũ chỉ có hai trạng thái (*train từ đầu* / *có cutoff*) nên vừa **loại oan** mô hình
> prior tổng hợp, vừa **không siết đủ** mô hình prior thị trường không công bố cutoff.
>
> | `pretrained_corpus` | có `weights_release_date` | Phán quyết |
> |---|---|---|
> | `none` (train từ đầu trong repo) | — | Nhận. `RULE 12` không có đối tượng |
> | `synthetic` | có | Nhận **sau khi qua phép dò #10**; hồ sơ nhãn ghi *"miễn trừ RULE 12 dựa trên lời khai + phép dò, không phải kiểm chứng trực tiếp"* |
> | `synthetic` | **không** | **Từ chối đăng ký** — không có mốc để dò |
> | `market` | có | Nhận làm **đối chứng**; fold hợp lệ = `test_start > weights_release_date`; không đủ fold ⇒ không vào phán quyết nhãn |
> | `market` | **không** | **Từ chối đăng ký** |
> | `mixed` | có | **Xử như `market`** — ô nguy hiểm nhất, không được hưởng miễn trừ của `synthetic` |
> | `mixed` | **không** | **Từ chối đăng ký** |
> | bất kỳ giá trị nào khác | — | **Từ chối đăng ký** — enum đóng |
>
> **Lời khai phải có phép thử đứng sau.** `effective_cutoff()` và `pretrained_corpus` đều là lời
> khai của người đăng ký — chúng không tự đúng. **Mọi** method có `pretrained_corpus ≠ "none"`,
> kể cả `synthetic`, phải qua **phép dò #10 · ghi nhớ lịch sử**:
>
> ```
> Chạy method ở chế độ zero-shot trên hai đoạn tách rời:
>   ① đoạn CŨ  — trước weights_release_date
>   ② đoạn MỚI — sau  weights_release_date
> Chênh lệch hiệu năng vượt sai số bootstrap ⇒ HẠ khai báo về "market",
> áp lại ràng buộc cutoff, ghi lý do máy-đọc-được.
> ```
>
> Phép dò **không chứng minh được sự vô tội** — nó chỉ bắt được ghi nhớ đủ mạnh để lộ ra. Và nó
> **không** chặn được thiên lệch còn lại: kiến trúc và siêu tham số của mô hình nền đã được tác
> giả chọn trên chính thị trường ta chấm, nên **ngay cả fold sau mốc cắt vẫn mang thiên lệch**
> (→ §10.2).
>
> **Thủ tục:** `ADR-021` **sửa phạm vi `RULE 12`**, nên nó phải sửa cùng lúc `CLAUDE.md` (bảng 12
> luật), `00_VISION §5.1`, và `PRED-08` — `00_VISION` quy định tài liệu sau muốn nói ngược thì
> phải sửa tài liệu gốc trước, bằng ADR.

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

### 3.4 · Hợp đồng `Prediction` / `Tranche` — NGUỒN CHUẨN

Bản kế thừa ở `Old/PREDICTION_DESIGN PHẦN 2` **sai bốn chỗ** so với REQ hiện hành. Từ đây, bảng
này là nguồn chuẩn; `Old/` là sử liệu.

| Trường | Bản `Old/` | Đúng phải là | Vì |
|---|---|---|---|
| `Tranche.target_price` | `entry × (1 + 4,0·σ̂)` | `entry × (1 + 6,0·σ̂)` | `ADR-017` |
| `Tranche.tranche_id` | `symbol\|open_time\|level\|model_sha` | thêm **`method_id`** | `PRED-05` |
| `Tranche` | không có `p_win` | thêm **`p_win_calibrated`** | `PRED-03` đòi in đủ bốn số |
| `TrancheStatus` | 5 giá trị | thêm **`open_at_end`** (chỉ hợp lệ trong kho hiện vật backtest) và **`market_halted`** | `DATA-09` · `TRADE-09` |

- **`open_at_end` không bao giờ vào chỉ tiêu kết cục.** Đếm riêng, hiển thị riêng. Bản ghi còn mở
  lúc hết mẫu được chấm tại giá đóng cuối là **hiện vật backtest**, vận hành thật không có quyền
  làm điều đó.
- **`market_halted` dừng đồng hồ hạn giữ**, không coi là đã thoát.

### 3.5 · Hành vi khi thiếu dữ liệu

| Tình huống | Hành vi bắt buộc |
|---|---|
| Lỗ hổng nến đã được `clean` đánh dấu | Đặc trưng cuộn qua lỗ hổng ⇒ **chặn dự đoán**, cùng cơ chế `PRED-07` chặn theo tuổi. `DATA-02` đánh dấu, `04` phải nói dùng dấu đó thế nào |
| Cặp rời vũ trụ (`DATA-09`) | Không phát khuyến nghị mới; tranche đang mở chuyển `market_halted`, đồng hồ hạn dừng |
| Mất kết nối giữa lúc có tranche mở | Sổ **không đoán** kết cục; `unverified_since` ghi mốc, hiển thị rõ |

---

## 4 · Tầng 1 — rule-based: đóng băng cái gì, còn phải đo cái gì

### 4.1 · Đã đóng băng (kế thừa nguyên trạng, không mở lại)

| Thành phần | Đặc tả | Nguồn |
|---|---|---|
| Ước lượng biến động | Parkinson từ high/low, thang **ngày**, một đường sinh duy nhất | `Old/PREDICTION_DESIGN §L1` · `PRED-14(a)` |
| Mục tiêu của σ̂ | trung bình RV **5 ngày tới** (khớp thời gian nắm giữ thực tế) | `§L2` |
| Hướng sơ cấp | tổ hợp trọng số đều trên lưới xu hướng đã đóng băng, không chọn ô | `§L5` · `Old/12 §2.5` |
| Rào chắn | `1,2σ̂` dừng lỗ · `6,0σ̂` chốt lời · `k = 1` · hạn 60 ngày — **hạn có 0 quan sát trong toàn mẫu ⇒ tham số AN TOÀN, không phải tham số đã đo** | `ADR-017` |
| Quy ước khớp | tín hiệu tại close `t` ⇒ vào tại **open `t+1`** | `PRED-18(a)` |
| Bất đối xứng thoát | stop soi intrabar (lệnh treo bắt buộc) · target kiểm tại close — **⚠️ CHƯA ĐĂNG KÝ dứt khoát, xem khối ★ dưới bảng** | `§L5` |
| Cỡ gợi ý | notional cố định, **không** nghịch đảo σ̂ | `§L7` |
| Tầng chọn lọc | bốn tầng lồng nhau trên `level`, **không phải thang chất lượng** | `ADR-018` |

> ### ★ Quy ước thoát là con số lớn nhất trong toàn tài liệu — và nó chưa được đăng ký
>
> "Target kiểm tại **close**" nghĩa là lệnh thắng thoát tại giá đóng cửa, **không** tại
> `target_price`. Hệ quả đo được (vòng phản biện 28/08, chạy trên chính máy tranche):
>
> | Quy ước | R trung bình lệnh thắng | EV ròng mỗi sự kiện |
> |---|---|---|
> | **Kiểm tại close** (đang dùng) | ~6,7R — **không** phải 5,0R | mốc hiện tại |
> | Ép về đúng payoff hợp đồng 5,0R | 5,0R | **−52%** |
> | Lệnh giới hạn soi intrabar | 5,0R | **−39%** |
>
> **Và `p_star = (1 + c_R)/(W + 1)` với `W = tp/sl = 5,0` chỉ đúng dưới quy ước lệnh giới hạn.**
> Dưới quy ước close, nó dùng payoff hợp đồng cho một hệ có payoff **thực nhận** cao hơn — tức
> cổng phí đang tính bằng một con số không phải con số của chính nó.
>
> Chênh lệch **39–52% EV toàn hệ** lớn hơn mọi hiệu ứng khác tài liệu này bàn tới, gồm cả tầng L6
> mà §5.4 và §6 dành ba trang. Hai nhánh, cần chủ dự án chọn (`EXIT_CONVENTION` ở §0):
>
> - **(a) Giữ close** ⇒ `target_price` phải được gọi là **ngưỡng kích hoạt**, không phải giá khớp
>   — ở cả `PRED-03` lẫn UI; và `p_star` phải dùng payoff **thực nhận**, không phải `tp/sl`.
> - **(b) Đổi sang lệnh giới hạn** ⇒ nhất quán với `p_star`, nhưng phải **chạy lại toàn bộ bề mặt
>   rào** và đính chính `ADR-017`: ô `1,2/6,0` có thể không còn là ô được chọn.

### 4.2 · Còn phải đo trước khi tầng 1 được gắn nhãn *đã kiểm chứng*

Đây là danh sách chặn, không phải danh sách mong muốn. Thứ tự là thứ tự phụ thuộc.

| # | Việc | Chặn cái gì | Kiểm bằng |
|---|---|---|---|
| **M0** | **★ Đối chứng vào lệnh VÔ ĐIỀU KIỆN** — vào mỗi ngày, cùng σ̂, cùng rào, cùng quy ước thoát; kèm biến thể vào ngẫu nhiên khớp số lệnh | **Câu hỏi lưới xu hướng có đóng góp gì không** — đo sơ bộ 28/08 cho thấy **một phần lớn EV của tầng 1 có sẵn mà không cần bất kỳ tín hiệu hướng nào**, phần còn lại chỉ vừa chớm vượt nhiễu | Block bootstrap **ghép đôi** trên trục thời gian toàn cục, khối = độ dài nhãn. Đăng ký trước: *KTC95 của (tranche − vô điều kiện) chứa 0 trên vũ trụ ngoài hiệu chuẩn ⇒ **lưới xu hướng không được tính là nguồn kỹ năng*** |
| **M0b** | **Hai quy ước thoát chấm song song** (close ↔ lệnh giới hạn), hai chuỗi EV báo cáo cạnh nhau | Chênh 39–52% EV toàn hệ (★ §4.1). Không đăng ký `EXIT_CONVENTION` thì `p_star` đang dùng sai payoff | Hai chuỗi cạnh nhau; chọn MỘT và ghi vào §0 |
| M1 | **Dữ liệu khung ngày thật** cho mọi cặp (`DATA-08`) — số hiện tại đo trên chuỗi resample từ 1h | **Mọi con số** trong `spec_numbers` | Script kiểm nguồn: mọi chuỗi ngày dùng để chấm có nguồn `raw` khung ngày |
| M2 | **Bộ kiểm định tự chứng minh** — tiêm rò rỉ đã biết, xác nhận từng probe bắt được | Mọi kết luận sau đó | `PRED-11`: `skipped == 0`, bộ tiêm làm từng probe đỏ |
| M3 | **Đo lại bề mặt rào chắn trên vũ trụ ngoài nhóm hiệu chuẩn** (36 cặp) | Nhãn của tầng 1 | Giao thức khử nhiễm `ADR-017 §2`: cấu hình `1,2/6,0` là cấu hình **duy nhất** được chấm |
| M4 | **Đo độ phủ dải giá cuộn** trên số dự đoán tối thiểu | `PRED-14(b)` | Độ phủ 80% ± sai số đăng ký · PIT không lệch · quantile cắt nhau = 0 |
| M5 | **Đo tỉ lệ thắng theo bucket biến động** | Biết cổng phí có mua được gì không | Bảng hit-rate × bucket σ̂, kèm `p_star` của chính bucket đó |
| M6 | **Đo chênh lệch `open[t+1]` ↔ TWAP thực thi** | Quyền gọi quy ước hiện tại là "thận trọng" | Hai chuỗi PnL, báo cáo độ lệch, không kết luận trước khi đo |

### 4.3 · L2 · σ̂ — đặc tả đầy đủ (mã hiện tại chưa thoả `PRED-14(a)`)

Ba nhánh đo được đều lệch, và cả ba đều dịch **mọi** giá dừng lỗ, **mọi** giá chốt lời, **mọi**
q10/q90 — nên chúng phải sửa trước khi bàn bất cứ tầng nào ở §5.

| # | Khuyết tật đã xác nhận | Sửa |
|---|---|---|
| (a) | **Cổng chọn σ̂ tương đối không tồn tại.** Mã hiện tại là `har.fillna(ewma)` — EWMA chỉ chạy ở giai đoạn `NaN`, **nhánh dự phòng không bao giờ bắn**, trong khi `PRED-14(a)` đòi một cổng **tương đối** | Cổng `\|ln(σ̂_HAR / σ̂_EWMA)\| > ngưỡng §0` ⇒ rơi về EWMA(0,94) + ghi nhật ký. **Test bắt buộc bắn đúng nhánh dự phòng** — không có test đó thì nhánh này lại chết lặng |
| (b) | **Biến đổi ngược sai loại thống kê.** Fit OLS trên `log(RV)` rồi trả `sqrt(exp(Xβ))` cho **trung vị**, không phải kỳ vọng ⇒ σ̂ **hụt hơn 10%** tuỳ cặp | Khai rõ σ̂ là trung vị **hay** kỳ vọng. Nếu kỳ vọng: cộng `s²/2` trước `exp`, `s` do `measure_spec` sinh **theo từng cặp** |
| (c) | **Độ phủ `[q10,q90]` đo được CAO HƠN 80%** ⇒ dải đang **quá rộng**, `PRED-14(b)` chưa chắc đạt | Đặt `COVERAGE_TOLERANCE_PP` vào §0 **trước** khi kết luận đạt/trượt. Đây cũng là đầu vào của quyết định ACI ở §5.3 |
| (d) | Lịch refit (mỗi 7 ngày) là một phép fit, nhưng 04 chưa nói nó nằm ở đâu trong fold | Ghi rõ: **lịch refit nằm hoàn toàn trong lát train của fold**; không lát nào được refit bằng dữ liệu sau `train_end` |

> **(b) và (c) đi cùng nhau.** σ̂ hụt làm dải hẹp lại, nhưng độ phủ đo được lại **cao hơn** mục
> tiêu — nghĩa là phân phối `F` đang sai dạng theo hướng ngược. Sửa một trong hai mà không sửa
> cái kia sẽ làm độ phủ trôi tiếp.

> **M2 trước M3.** Đo trên một bộ kiểm định chưa từng bắt được gì là đo trên một cái cân chưa hiệu chuẩn.

---

## 5 · Tầng 2 — AI: bảy ứng viên, xếp theo tỉ lệ giá trị trên rủi ro

### 5.1 · Bảng chấm

| # | Ứng viên | Vai trò | Chi phí mẫu | Rủi ro tự lừa | Phán quyết |
|---|---|---|---|---|---|
| A1 | **Isotonic hiệu chỉnh xác suất** | ánh xạ `p_win` thô → xác suất thật | **cao nhất trong bảy ứng viên** — 300 sự kiện hiệu dụng × 8 fold, purge hai biên; ở vũ trụ hẹp phép tính **hiện không có nghiệm** (§7.3) | thấp | ✅ **bắt buộc** — `PRED-12`, không tuỳ chọn |
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

**Vì sao ACI chứ không phải split conformal.** Split conformal đòi **tính trao đổi được** giữa
tập hiệu chỉnh và tập dự đoán. Chuỗi lợi suất crypto có tự tương quan trong biến động và đổi chế
độ — giả thiết đó vỡ, và vỡ đúng lúc quan trọng nhất. ACI **không đòi trao đổi được**.

### ⚠️ Nguy cơ do chính đề xuất này tạo ra

Định lý ACI bảo đảm độ phủ biên hội tụ về `1 − α` **bất kể chất lượng mô hình** — một dải rộng vô
hạn cũng đạt 80%. Nếu vẫn chấm bằng độ phủ thì phép kiểm **không thể trượt**, và ta đổi một kiểu
p-hacking lấy một kiểu tautology. Ba khuyết tật đi kèm nếu cài ngây thơ:

| | Khuyết tật | Hệ quả |
|---|---|---|
| (a) | `α_t` cập nhật theo `err_t`, mà `err_t` chỉ quan sát được **sau** chân trời dải | **Rò rỉ `RULE 2` nằm ngay trong đường quyết định** |
| (b) | `α_t` là trạng thái toàn cục khả biến sinh từ kết cục | Phá bất biến **I4** (`predict()` thuần) và không nằm trong khoá idempotent `PRED-05` |
| (c) | Chặn Gibbs–Candès `(0,8+η)/(T·η)` rất rộng ở `T` nhỏ | Ở cỡ mẫu năm đầu, định lý **không nói được gì chặt hơn** dung sai mà `PRED-14(b)` muốn kiểm |

### Bốn tiêu chí chấm, tách bạch — chép nguyên vào ADR-022

```
Kiểm (a) ĐẦU VÀO NHÃN PRED-13 : đo trên quantile DANH NGHĨA của F — TRƯỚC ACI.
    độ phủ · PIT · số lần cắt nhau.  Ba đại lượng này TRƯỢT ĐƯỢC và PHẢI trượt khi F sai.
Kiểm (b) BẢO ĐẢM VẬN HÀNH     : độ phủ SAU ACI — báo cáo riêng, hiển thị trên UI,
    KHÔNG vào phán quyết nhãn.
Kiểm (c) ĐỘ SẮC, đăng ký trước: bề rộng dải chuẩn hoá theo σ̂ (hoặc pinball loss) phải
    thắng dải EWMA-Gauss dự phòng.  Nới dải làm nó TỆ ĐI ⇒ không thoả bằng cách nới.
Kiểm (d) PHỦ CÓ ĐIỀU KIỆN     : theo bucket σ̂, ≥3 bucket, mỗi bucket ≥50 mẫu, trong
    ±10 điểm quanh 80%.  Không thoả bằng nới dải đồng đều.

Độ trễ phản hồi : err_t vào công thức sớm nhất tại t + chân trời dải + embargo.
                  CẤM cập nhật mỗi nến khi chân trời dải > 1 nến.
Không toàn cục  : α_t là ĐỐI SỐ TƯỜNG MINH của predict(), người gọi dựng từ sổ (I4).
η               : đăng ký bằng QUY TẮC DẪN XUẤT, không bằng số rơi từ trời —
                  η := min η sao cho (0,8 + η)/(T_min · η) ≤ COVERAGE_TOLERANCE_PP.
                  Ghi CẢ η lẫn T_min vào §0.
Chế độ tác động : ACI hiệu chỉnh HỆ SỐ THANG của chính F (mọi đầu ra suy lại từ F_t,
                  p_up đổi theo — nói rõ trên UI).
                  ⛔ σ̂_rào lấy THẲNG từ HAR, KHÔNG đi qua ACI — ADR-017 §2 đã đăng ký
                  trước cấu hình rào; một vòng lặp độ phủ không được phép dịch giá
                  dừng lỗ và giá chốt lời.
```

> **Bất biến I1 phải siết thành I1b.** Một hệ số nới **đối xứng** lên q10/q90 giữ nguyên q50 và
> giữ nguyên dấu ⇒ test I1 hiện tại **xanh trong khi bất biến đã vỡ**. I1b: assert
> `F.cdf(q10) = 0,10` · `F.cdf(q90) = 0,90` · `p_up = 1 − F.cdf(0)` **trên chính đối tượng `F` đã
> phát**, kiểm **SAU** khi ACI chạy; cộng assert `σ̂_rào` không đổi khi hệ số thang đổi, và hệ số
> nằm trong `[k_min, k_max]` đăng ký trước.

**Không nhận:** các biến thể nhiều tham số hơn (hiệu chỉnh thiên lệch, Bellman conformal) — tốt
hơn trong văn liệu nhưng ăn ngân sách tham số ở §7.

**Hai phép dò mới, xem §8.2:** #8 đối chứng âm (chạy ACI trên chuỗi kết cục xáo ngẫu nhiên ⇒ độ
phủ vẫn đạt nhưng **độ sắc phải sụp**; không sụp ⇒ đỏ) · #9 trạng thái online không đọc tương lai
(cắt đuôi dữ liệu tại `t` ⇒ `assert α_t` bất biến tới bit).

### 5.4 · A3 · Meta-label — nhận vai trò, **đổi mô hình**

**Phát hiện chặn.** `Old/PREDICTION_DESIGN §L6` mặc định LightGBM `depth 3 · ≤15 lá · ≤300 cây`.
Đặt cạnh `PRED-15`: *số tham số tự do ≤ cỡ mẫu hiệu dụng / 20*.

**Phát biểu đúng — bản nháp 1 nói quá:** cấu hình đó bị loại vì **không đếm được**, không phải vì
"vượt trần hai bậc độ lớn". `depth 3` chặn ở 8 lá nên hai ràng buộc không hợp thành; và cấu hình
**không khai** learning rate, phạt L1/L2, `min_child_weight`, subsample — tức **không đặc tả đủ
để đếm bậc tự do**. Điều đứng vững, và đứng vững ở **mọi** tổ hợp định nghĩa `n_eff` khả dĩ:
tổng số lá của một GBM cỡ đó vượt trần ở mọi kịch bản.

⚠️ **"Logistic nằm trong ngân sách" là khẳng định CHƯA ĐO.** Trần phụ thuộc hai lựa chọn còn bỏ
ngỏ (§7.1) và trải rộng tới mức một logistic 6 đặc trưng + hằng số **có thể vượt trần**. Phải pin
`L6_FIT_SET` (§0) rồi thay số vào công thức của chính §7.1 trước khi khẳng định lại.

⚠️ **Ngân sách đặc trưng là ràng buộc RIÊNG.** Bản nháp 1 đổi đồng thời lớp mô hình (GBM →
logistic) và số đặc trưng (18 → 6) rồi quy toàn bộ chênh lệch cho lớp mô hình. Tách ra: trần đặc
trưng áp cho **mọi** hạng, độc lập với lớp mô hình.

**Ba ứng viên thay thế, xếp theo thứ tự đề xuất:**

| Hạng | Mô hình | Tham số tự do | Ưu | Nhược |
|---|---|---|---|---|
| **1** | **Hồi quy logistic phạt** (L2 hoặc elastic net) trên ≤ 6 đặc trưng đã chọn trước | ≈ số đặc trưng | Nằm trong ngân sách; hệ số **đọc được** ⇒ kiểm được cơ chế kinh tế; hỗ trợ trọng số mẫu theo độ duy nhất nhãn | Không bắt tương tác |
| **2** | **TabPFN v2** — **CHƯA ĐỦ ĐIỀU KIỆN ĐĂNG KÝ** | phải đo bằng `df_eff`, **không phải 0** | Mạnh trong lớp mẫu nhỏ; không tinh chỉnh nên ít ăn ngân sách trial | **Ba miễn trừ cùng lúc, cả ba đều tự khai** (trần tham số qua `free_params=0` · Deflated Sharpe qua "0 trial" · `RULE 12` qua `"synthetic"`). Ba điều kiện phải qua trước khi đăng ký — xem khối ★ dưới bảng |
| **3** | GBM **rất** nhỏ (`depth 2`, ≤ 50 cây, ≤ 6 đặc trưng, learning rate cố định) | vẫn ở bậc trăm | Quen thuộc | Vẫn khó biện minh dưới `PRED-15`; cần ADR nếu chọn |

**Đề xuất chốt:** hạng 1 làm **mặc định**; hạng 2 **chưa đủ điều kiện đăng ký**. LightGBM 300 cây
**rút khỏi đặc tả** — việc rút này không cần ADR (`PRED-21` không nhắc LightGBM, cấu hình cũ chỉ
sống ở `Old/` là sử liệu), **nhưng** `config/model.yaml` vẫn đang cấu hình một LightGBM `classifier`
**đang sống** — xem §11 mục 5b.

> **★ Ba điều kiện TabPFN phải qua trước khi được đăng ký:**
> 1. **Phép thử tương đương trọng số.** "Lấy mẫu tuần tự thay trọng số duy nhất" **không tương
>    đương**: hàng trùng nhân trọng số trong hàm mất mát, nhưng làm **méo phân phối ngữ cảnh** mà
>    một bộ học trong-ngữ-cảnh đang điều kiện hoá. So trực tiếp logistic-có-trọng-số với
>    TabPFN + lấy mẫu tuần tự trên cùng fold; không tái lập được ⇒ **loại**.
> 2. **Phép thử I4.** 100 lần chạy byte-identical; ghim phiên bản thư viện, seed, backend **vào
>    `model_sha`**.
> 3. **`free_params` đo bằng `df_eff`**, không phải 0 (§7.2).
>
> Và cơ chế chọn giữa hai họ mô hình **chấm trên fold walk-forward**, tiêu chí thay thế đăng ký
> trước; **holdout chạm đúng một lần** cho method thắng — bản nháp 1 đặt việc chọn trên holdout,
> đúng thứ §5.6 tự cấm.
>
> **Ghi rõ để vòng sau không tranh luận lại:** cỡ mẫu (~1.100 sự kiện × ≤6 đặc trưng × 2 lớp) và
> phần cứng (Mac mini M4) **không** phải lý do loại — cả hai nằm sâu trong bao vận hành của TabPFN v2.

**Giữ nguyên từ đặc tả cũ (đúng và quan trọng):**
- **Nhãn là bảng chân trị của enum kết cục, không phải quy tắc mờ.** `hit_target` → 1 ·
  `hit_stop` → 0 · `superseded` / `expired` / `open_at_end` / `market_halted` → **LOẠI khỏi tập
  huấn luyện VÀ khỏi mẫu số precision** (hoặc thành lớp thứ ba có trọng số riêng — chọn một, ghi
  vào §0). Lý do: nhóm `superseded` chiếm phần đáng kể tổng sự kiện và có **tỉ lệ dương khác hẳn**
  nhóm chạm rào; trộn hai tổng thể rồi đo "precision" cho ra con số **không diễn giải được** — mà
  §6 dùng chính con số đó để xoá hẳn một tầng. Gọi nó "right-censoring" cũng **sai tên**: kiểm
  duyệt nói *"thời gian sự kiện > T"*, không nói **kết cục**.
- **Cấm nhãn phản thực** — dùng dữ liệu sau thời điểm thoát là rò rỉ đúng nghĩa `RULE 2`.
- **Đăng ký định nghĩa "precision"** mà §6 dùng để xoá tầng: lớp dương nào, đo **sau** cổng phí,
  ngưỡng cắt cố định, đối chiếu tầng 1 trên **cùng** tập con.
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

**Điều kiện bật:**
```
① đủ số fold hợp lệ (test_start > effective_cutoff) theo PRED-11
② ENSEMBLE_QLIKE_GAIN_MIN và DM_ALPHA — CHƯA ĐĂNG KÝ, chặn A4
   ⚠️ bản nháp 1 tự đặt hai con số ở đây. PRED-17 (CHẶN) đòi mọi ngưỡng
      quyết định nằm trong mã KÈM ADR. «p < 0,05» là quy ước chuẩn dễ biện
      minh; «≥ 5% QLIKE» là con số TỰ PHÁT MINH, không neo ngoài — nó quyết
      định một mô hình có vào đường sản xuất hay không.  ⇒ ADR-027 (§11)
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

**Vai được phép — và giới hạn của vai đó:** một dòng **đối chứng**, để trả lời câu hỏi *"lõi
rule-based của ta có thua một mô hình nền zero-shot không?"* Câu trả lời có giá trị dù theo chiều
nào — nhưng nó là **thông tin**, không phải **sản phẩm**.

> ⛔ **Mô hình nền thị trường KHÔNG nằm trong `BASELINE_SET`.** Bản nháp 1 cho Kronos chấm "trên
> **cùng** bộ kiểm định" — gồm cả fold **trước** ngày phát hành trọng số, tức fold nó đã nhìn
> thấy. Một đối thủ biết đáp án đứng trong bộ baseline mà `PRED-11` đòi phải **thắng toàn bộ** ⇒
> **đèn không bao giờ xanh**. Luật đúng: mỗi baseline **kế thừa đúng bộ lọc fold của method sinh
> ra nó**; baseline không có fold sạch **không vào** phán quyết `PRED-13`, báo cáo ở **bảng riêng**
> mang nhãn *đối chứng nhiễm — ngoài phán quyết*.

### 5.8 · A7 · Động lượng cắt ngang — giữ khoá, và nay có thêm lý do

`Old/17 §3` đã khoá nhánh này vì thiếu ảnh chụp universe quá khứ. Bằng chứng ngoài củng cố việc giữ khoá: phân tích dưới **giả định thực tế** trên thị trường crypto cho thấy **động lượng chuỗi thời gian mạnh, động lượng cắt ngang yếu**, và phần lớn lợi nhuận cắt ngang biến mất sau chi phí và rủi ro thanh lý ([Han, Kang & Ryu](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4675565)).

⇒ Ưu tiên hạ xuống dưới mọi việc ở §4.2. Vẫn tiếp tục **thu ảnh chụp universe hằng tháng** — dữ liệu đó không tạo lại được, và chi phí thu gần bằng không.

---

## 6 · Ba chiến lược triển khai

Không phải ba lựa chọn loại trừ — ba **mức tham vọng**, mỗi mức là điều kiện của mức sau.

| | **S1 · ĐO TRƯỚC** | **S2 · LỌC BẰNG MÔ HÌNH NHỎ** | **S3 · ENSEMBLE BIẾN ĐỘNG** |
|---|---|---|---|
| Tầng AI có gì | isotonic + conformal | + meta-label logistic/TabPFN | + TTM ⊕ HAR cho σ̂ |
| Điều kiện bắt đầu | M1–M2 xong | S1 chạy + ≥300 sự kiện **forward** đã chấm | S2 chạy + đủ fold sau mốc cắt |
| Kết cục xác suất cao | có sản phẩm trung thực; hệ **vào ra liên tục bằng những bước nhỏ** — quanh một lệnh mỗi ngày, EV mỏng, phí ăn ~1% NAV/năm (`spec_numbers §3b`) | **xoá tầng L6** (kết quả hợp lệ) | cải thiện QLIKE biên hẹp |
| Rủi ro chính | **có ba:** ACI có thể tự thoả mãn phép kiểm (§5.3) · ngân sách lát hiệu chỉnh có thể vô nghiệm (§7.3) · bộ dò rò rỉ dễ sai âm thầm (M2) | nhặt nhiễu ở n nhỏ; **và cổng cần nhiều năm mới có công suất** | phụ thuộc thư viện ngoài + `RULE 12` |
| Giá trị học được | nghề kiểm định dự báo | nghề đo lường trên mẫu nhỏ | nghề tích hợp mô hình nền |

### → Khuyến nghị: **đi S1 trọn vẹn, đăng ký trước điểm rẽ sang S2, để S3 mở**

**Vì sao không nhảy thẳng S2.** Cổng bật L6 đòi **300 sự kiện forward đã chấm** — nghĩa là sự kiện phát ra *sau khi* hệ chạy thật, không phải sự kiện đào từ lịch sử. Số sự kiện mỗi đồng mỗi năm ở `spec_numbers §2` cho biết mốc đó tính bằng **quý**, không tính bằng tuần. Viết L6 trước khi có mẫu là viết một tầng sẽ nằm im và sẽ bị sửa lén khi bảng trống.

**Vì sao vẫn đăng ký S2 ngay bây giờ.** Đăng ký trước ngưỡng `+5pp / +3pp / xoá` **khi đầu còn lạnh** là toàn bộ giá trị của cổng đó. Đăng ký sau khi thấy kết quả là không đăng ký.

**Điểm rẽ, viết ra để không diễn giải lại về sau:**

| Kết quả đo | Hành động |
|---|---|
| **Cận dưới** KTC95 của Δprecision ≥ +3pp | Bật L6, method vẫn là `barrier`, nhãn sinh lại từ đầu |
| **Cận trên** KTC95 ≤ +3pp | **Xoá tầng L6 khỏi mã.** Ghi ADR. Đây là thành công của bộ kiểm định |
| KTC bắc qua +3pp | Giữ tắt, tiếp tục tích luỹ. **Không** thêm đặc trưng để đẩy qua ngưỡng |
| **Hai sàn cùng lúc** | Tỉ lệ giữ ≥ 60% **và** n giữ ≥ 180; dưới một trong hai ⇒ cổng trả **"KHÔNG KẾT LUẬN"**, không bao giờ trả "bật" |

> ### ⚠️ Cổng ba nhánh cũ không có công suất để phán quyết thứ nó được viết ra để phán quyết
>
> Ở 300 sự kiện, nửa khoảng tin cậy của Δprecision **rộng hơn cả dải giữa (+3…+5pp)**: một kết quả
> đo được +5,0pp có KTC tương thích **đồng thời** với "bật" và "xoá tầng". Chiều ngược lại còn tệ
> hơn — **không có sàn tỉ lệ giữ** thì ở tỉ lệ giữ rất thấp, một bộ lọc vô nghĩa vượt +5pp bằng
> **nhiễu thuần** một phần ba số lần.
>
> **Cỡ mẫu thật để cổng có công suất là bậc NGHÌN sự kiện forward, không phải 300** — ở nhịp phát
> hiện hành là **nhiều năm**, không phải nhiều quý. Con số "≥300" của `PRED-21` là ngưỡng **đủ để
> hiệu chỉnh**, không phải đủ để **phán quyết**. Bản vá này **chạm `PRED-21`** ⇒ cần ADR sửa REQ,
> và nó đặt ra một câu hỏi phạm vi cho chủ dự án (§11): chấp nhận chờ, xoá L6 khỏi lộ trình ngay,
> hay đổi cổng sang một đại lượng có công suất ở n nhỏ hơn.

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

> ⚠️ **Hai lựa chọn chưa đăng ký làm trần trải hơn MƯỜI LẦN**, nên không được dùng bậc độ lớn
> của trần làm căn cứ cho bất kỳ kết luận nào cho tới khi chốt:
>
> | Lựa chọn | Các khả năng | Ảnh hưởng |
> |---|---|---|
> | Độ duy nhất nhãn tính trên **trục toàn cục** hay **trong từng cặp** | hai giá trị rất khác nhau | nhân/chia `n_eff` vài lần |
> | ρ̄ đo trên chuỗi lợi suất sự kiện gộp theo **ngày / tuần / tháng** | nhịp ngày là **hiện vật** (chuỗi gần như toàn 0) | quyết định hệ số độc lập |
>
> **Đăng ký (ADR-023):** độ duy nhất trên **trục thời gian toàn cục**; ρ̄ trên chuỗi lợi suất sự
> kiện **gộp theo THÁNG**. Thêm `average_uniqueness()` và `rho_bar_event_returns()` vào
> `measure_spec.py`.
>
> **Và phải pin `L6_FIT_SET` trước:** fit trên riêng sự kiện forward cho một trần rất chặt; fit
> trên toàn bộ lịch sử theo lược đồ walk-forward cho một trần rộng hơn nhiều. Đăng ký: *"L6 fit
> trên **toàn bộ sự kiện lịch sử theo lược đồ purged walk-forward §8.1**; ≥300 sự kiện forward là
> điều kiện **chấm và bật**, không phải tập fit."*

### 7.2 · Bậc tự do — MỘT định nghĩa, áp cho mọi mô hình

Bản nháp 1 áp một trần chung lên bốn đại lượng **không so được với nhau** (số lá thô, số hệ số
thô, `0` cho mô hình nền, số đoạn isotonic). Ô `0` là lỗ hổng thật: bất kỳ mô hình nào cũng có thể
**rửa qua đường "tiền huấn luyện + học trong ngữ cảnh"** để nhận ngân sách vô hạn — và TabPFN dùng
cho meta-label **điều kiện hoá trên chính tập huấn luyện của repo**, tức không phải zero-shot.

**Thay bằng một định nghĩa duy nhất:**

```
df_eff = Σᵢ Cov(ŷᵢ, yᵢ) / σ²        (bậc tự do hiệu dụng, Efron)
ước lượng bằng hoán vị / nhiễu trên chính tập fit — áp cho MỌI mô hình,
kể cả mô hình nền dùng in-context.   ⛔ XOÁ dòng "zero-shot → 0".
```

| Cưỡng chế | Cách |
|---|---|
| `free_params` là số **tự khai** | `PRED-08` gọi `df_eff(artifact)` và **so với giá trị khai**; lệch > 10% ⇒ đỏ |
| Lưới quy tắc đã đóng băng | **Không** vào `free_params`, nhưng **bắt buộc** vào `n_trials_registered` — nó được chọn sau khi nhìn dữ liệu trên chính bốn cặp hiệu chuẩn (`ADR-017 §2`) |
| Cổng L6 | Phát biểu bằng `n_eff ≥ 20 × df_eff`, **không** bằng số sự kiện thô |

> **Hai bài toán khác nhau, đừng gộp:** **Deflated Sharpe** phạt theo *số cấu hình đã thử*;
> **kiểm soát FDR** phạt theo *số chuỗi được chấm cùng lúc*. Cấm hiển thị bảng xếp hạng coin theo
> kỹ năng trước khi áp hiệu chỉnh đa phép thử (`PRED-15(a)`).

### 7.3 · ★ Ngân sách kiểm định — `PRED-11` × `PRED-12` có thể VÔ NGHIỆM

Đây là mục quan trọng nhất của §7, và nó chưa từng được tính.

```
Bố cục mỗi fold:  [ train | purge P | calib | purge P | test T | embargo E ]

  P = E = max(độ dài nhãn của MỌI tầng dùng bộ chia này)
  calib_days = MIN_CALIB_EVENTS / e × 365,25       với e = sự kiện/đồng/năm × WIDE_UNIVERSE_N
  A ≥ MIN_TRAIN_BARS[tf] + n_folds × (2P + calib_days + T + E)

assert calib_events ≥ MIN_CALIB_EVENTS            # PRED-12 — NÉM LỖI
assert T × e/365,25 ≥ MIN_TEST_SLICE_EVENTS       # PRED-11 — NÉM LỖI
Trượt ⇒ hạ n_folds và GHI hệ quả công suất.  ⛔ KHÔNG BAO GIỜ hạ purge.
```

**Ba sự thật đã kiểm trên trục dữ liệu hiện có:**

1. **`min_train_bars` mặc định của `config/model.yaml` làm 8 fold khung ngày BẤT KHẢ ngay hôm
   nay** — `PurgedWalkForward` ném `ValueError` vì cần nhiều nến hơn số nến đang có. Không phải
   rủi ro tương lai; là trạng thái hiện tại.
2. **Ràng buộc lát hiệu chỉnh vô nghiệm ở vũ trụ hẹp.** Với `MIN_CALIB_EVENTS = 300` mỗi fold và
   purge = embargo = độ dài nhãn, số ngày cần vượt trục dữ liệu ở mọi vũ trụ nhỏ; chỉ vũ trụ rất
   rộng mới vừa, và khi đó lát test co lại còn vài chục sự kiện.
3. **Chế độ hỏng thì IM LẶNG.** `PRED-12` bắt tắt tầng xác suất khi lát không đủ mẫu ⇒ không có
   `p_win` hiệu chỉnh ⇒ `PRED-04` mất đầu vào ⇒ **hệ câm 100%** mà không ai biết lý do nằm ở bố
   cục fold.

⇒ **`fold_budget()` phải vào `measure_spec.py` như một CỔNG NÉM LỖI**, không phải bảng tham khảo.
Và không ai tính được ngân sách này cho tới khi `WIDE_UNIVERSE_N` được đăng ký (§0) — đó là lý do
nó là câu hỏi chặn nặng nhất trong §11.

---

## 8 · Kiểm định và nhãn

### 8.1 · Bộ kiểm định (thi hành `PRED-11`)

| Thành phần | Đặc tả |
|---|---|
| Bộ chia | Purged walk-forward tự viết · **một trục thời gian toàn cục** cho mọi cặp — chia theo từng symbol là rò rỉ chéo coin gần như trực tiếp |
| Purge & embargo | = độ dài nhãn, áp **cả hai biên** của mọi lát dùng để fit bất cứ thứ gì (kể cả lát hiệu chỉnh) |
| Sàn cỡ lát test | Đăng ký trong mã; lát nhỏ hơn sàn ⇒ **ném lỗi**, không cảnh báo im lặng |
| Holdout | `store` từ chối trả nến trong khoảng holdout trừ khi gọi với mục đích `final_scoring`; mỗi lần gọi ghi bản ghi bất biến; quá số lần đăng ký ⇒ **holdout đã cháy** |
| Baseline | `BASELINE_SET` **khoá cứng ở §0**, thứ tự cố định, sau phí. Thiếu một baseline ⇒ **không gắn nhãn**. Mỗi baseline **kế thừa đúng bộ lọc fold của method sinh ra nó**; baseline không có fold sạch **không vào** phán quyết `PRED-13` mà báo cáo ở bảng riêng mang nhãn *đối chứng nhiễm — ngoài phán quyết*. Mô hình nền thị trường **không** nằm trong bộ này (§5.7) |

### 8.2 · Mười một phép dò rò rỉ — năm kế thừa, sáu thêm

| # | Phép dò | Trạng thái |
|---|---|---|
| 1–5 | Bộ kế thừa (`Old/PREDICTION_DESIGN §LV.2`) | có, **phải tự chứng minh bằng bộ tiêm** (M2) |
| **6** | **Batch ↔ live:** chạy cùng đoạn lịch sử qua hai đường, `assert` σ̂ khớp tới sai số đăng ký | `DATA-06` |
| **7** | **Rò rỉ theo fold:** chỉ tiêu **từng fold** phải nằm trong `FOLD_SPREAD_MAX` và qua phép kiểm đồng nhất ở mức `FOLD_HOMOGENEITY_ALPHA` (cả hai ở §0) — một rò rỉ khổng lồ ở một fold bị trung bình 8 fold che mất | **mới**. ⚠️ Không có luật đạt/trượt thì **không được đếm là probe** — bản nháp 1 viết nó như một yêu cầu *báo cáo*, làm loãng chính phép đếm `PRED-11` dùng để siết |
| **8** | **Đối chứng âm ACI:** chạy trên chuỗi kết cục xáo ngẫu nhiên ⇒ độ phủ vẫn đạt nhưng **độ sắc phải sụp**; không sụp ⇒ đỏ | mới, §5.3 |
| **9** | **Trạng thái online không đọc tương lai:** cắt đuôi dữ liệu tại `t` ⇒ `assert` trạng thái ACI bất biến tới bit | mới, §5.3 |
| **10** | **Ghi nhớ lịch sử:** hiệu năng zero-shot trước / sau `weights_release_date` — chênh vượt sai số bootstrap ⇒ hạ khai báo về `market` | mới, §3.2 |
| **11** | **Tập ngữ cảnh chịu cùng purge/embargo** như tập fit — áp cho mọi mô hình học trong ngữ cảnh | mới, §5.4 |

Bốn lớp rò rỉ mà cả đặc tả cũ lẫn `PRED-11` chưa đòi tường minh, nay đăng ký: **(a)** fit bộ
chuẩn hoá trên toàn mẫu · **(b)** chọn đặc trưng ngoài fold · **(c)** nhãn chồng lấn thiếu purge ·
**(d)** thiên lệch sống sót.

> **Ai viết bộ tiêm?** `M2` chỉ ghi *"bộ tiêm làm từng probe đỏ"* mà không nói ai viết. Đăng ký:
> **bộ tiêm do một tác nhân KHÁC viết, và đăng ký trước khi chạy probe**; mỗi lớp (a)–(d) có ít
> nhất một mũi tiêm **mang tên**. Lớp (d) **đăng ký nhưng HOÃN kích hoạt** cho tới khi có ảnh chụp
> universe quá khứ (§5.8) — nếu không, probe này đỏ vĩnh viễn và sẽ bị học cách bỏ qua.

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
| Phán quyết kỹ năng ở mức cặp | Chuyển lên **mức phương pháp**, trên bảng gộp toàn vũ trụ. Sai số bằng **block bootstrap trên trục thời gian TOÀN CỤC, cùng khối cho mọi cặp**, mỗi lần rút lấy **nguyên lát cắt ngang** — rút khối riêng từng cặp **bỏ sót phụ thuộc chéo coin** và cho sai số hẹp hơn thật. Độ dài khối = độ dài nhãn **tối đa**, báo cáo thêm ở 1× và 2×; `B` và độ dài khối đăng ký trước; in **số khối độc lập** cạnh mỗi kết quả |
| Trạng thái từng cặp | Hạ xuống thành **thuộc tính của cặp** (đủ/thiếu dữ liệu, độ phủ dải đạt/trượt), hiển thị nhưng không kéo nhãn phương pháp xuống |
| ~~Thêm trạng thái thứ tư~~ | **BÁC BỎ — đứng trên tiền đề sai.** `PRED-13` **đã** phân biệt "chưa đo" (② `đang thu bằng chứng` = trượt về **lượng**, gồm cả n = 0) với "đo rồi, trượt" (③ = trượt về **tính hợp lệ**). Thêm một giá trị đầu ra buộc **phân hoạch lại miền** của hàm sáu biến, không phải "chỉ thêm một ô". Nếu ② khó đọc trên giao diện thì đổi **tên hiển thị**, không đổi miền giá trị |

> **Một lỗi riêng phải nói trước:** dùng SE của **mức** để chấm một **chênh lệch** là sai. Mọi so
> sánh hai cấu hình phải dùng **SE của chênh lệch, ghép đôi**; `measure_spec.py` in **SE block
> cạnh SE iid** để chênh lệch giữa hai cách tính luôn nhìn thấy được.

> Sửa này **không nới chuẩn**: nó chuyển phép thử về nơi có đủ mẫu để phép thử **có nghĩa**,
> và làm cho trạng thái "chúng tôi chưa biết" nói đúng điều nó muốn nói.

---

### 8.5 · ★ Điều kiện rút lui — trạng thái `bác bỏ`

Ba trạng thái của `PRED-13` đều diễn đạt các mức của *"chưa biết"*. Không trạng thái nào diễn đạt
được *"đã biết, và biết là sai"*.

**Vì sao cần.** `ADR-020` bỏ cổng cấp phép nhưng **không** bỏ nghĩa vụ nói thật. `00_VISION` Luật
15: *"Hệ không bao giờ gợi ý nhiều tự tin hơn bằng chứng nó có."* Tiếp tục phát khuyến nghị mới từ
một phương pháp mà **chính hệ đã đo** là EV âm với khoảng tin cậy nằm trọn dưới 0 là **vi phạm**
câu đó, không phải tôn trọng nó.

**Ranh giới với ADR-020 — khác nhau ở ĐỐI TƯỢNG bị chặn:**

| | Chặn ai | Phán quyết |
|---|---|---|
| GATE cũ | chặn **người dùng hành động** dựa trên số chưa được chứng minh | gia trưởng — **đã bỏ, đúng** |
| `bác bỏ` | chặn **hệ phát ra** một con số chính hệ đã đo là sai | không nói dối — **giữ** |

**Ba ràng buộc để nó không lén trở thành GATE:**

1. **Dừng hệ PHÁT, không dừng user LÀM.** Người dùng vẫn xem toàn bộ lịch sử, vẫn giao dịch tay,
   vẫn dùng Paper, vẫn bật bot theo thiết lập của họ. Chỉ **luồng khuyến nghị mới của đúng method
   đó** ngừng.
2. **Ngưỡng, phép đo, và ĐƯỜNG RA đăng ký trước cùng lúc** (`PRED-15(b)`), bằng **đúng** bộ kiểm
   định đã dùng cho nhãn. Đường ra phải tồn tại từ ngày đầu, nếu không `bác bỏ` thành bản án chung
   thân do một cỡ mẫu xấu tuyên.
3. **Hiển thị lý do bằng tiếng người kèm số**, giữ nguyên toàn bộ lịch sử đã phát (`TRACK` bất
   biến). `bác bỏ` là bằng chứng bộ kiểm định hoạt động — không phải thứ để giấu.

**Phạm vi:** phán quyết ở **mức phương pháp** trên bảng gộp, không ở mức từng cặp (§8.4).

### Ngưỡng: không có hằng số, chỉ có một phát biểu thống kê

Mọi ngưỡng dạng *"EV < −0,2R"* là **hằng số trá hình** — nó chỉ có nghĩa khi gắn với một cỡ mẫu
cụ thể. Đăng ký trước **phát biểu**, không đăng ký giá trị:

```
VÀO  `bác bỏ` ⟺ cận TRÊN  một phía 95% của EV mỗi sự kiện nằm DƯỚI 0
RA   `bác bỏ` ⟺ cận DƯỚI một phía 95% của EV mỗi sự kiện nằm TRÊN 0
                 · cùng mức, cùng phép kiểm, đổi chiều
                 · và đường ra ĐÒI DỮ LIỆU MỚI — không phải chấm lại cùng
                   bộ dữ liệu bằng phương pháp khác
```

Hai vế viết trong **cùng một câu** để không ai sửa một vế mà quên vế kia. Chỉ hai thứ phải đăng ký
trước — **mức 95%** và **một phía** — cả hai là quy ước chuẩn. Không còn tham số nào để chọn sau
khi nhìn dữ liệu.

Ranh giới tự suy ra bậc độ lớn nào: `spec_numbers §7` (`measure_spec.py::rejection_boundary`).
Ba điều bảng đó nói:

1. **`bác bỏ` sẽ hiếm ở cỡ mẫu hiện thực, và đó là tính chất đúng.** Nó chỉ bắt được thứ **hỏng rõ
   rệt**; bác nhầm một phương pháp thật ra tốt cũng là sai lầm tốn kém.
2. **Sai số chuẩn ngây thơ `sd/√n` là LẠC QUAN.** Phép chấm bắt buộc dùng **phân vị block
   bootstrap** theo lược đồ §8.4 — **không** dùng `±z·SE`, và không giả định chuẩn: phân phối R
   rất lệch (thắng nhiều R, thua tối đa ~1R), nên ở n vài trăm xấp xỉ chuẩn hỏng ở đúng cái đuôi
   đang xét.
3. **Dưới sàn cỡ mẫu**, trạng thái là ② `đang thu bằng chứng` — **không phải** `bác bỏ`.

### ⚠️ Nhịp chấm phải đăng ký trước — chống nhìn lén

Một quy tắc *"cận trên < 0"* đánh giá **mỗi ngày** sẽ kích hoạt sai nhiều hơn 5% rất nhiều: bài
toán nhìn lặp lại của thử nghiệm lâm sàng, áp cho **cả hai chiều**.

```
Đăng ký trước MỘT trong hai, không đổi giữa chừng:
  ① chấm theo LỊCH cố định, hoặc
  ② chấm mỗi khi n tăng thêm một lượng đăng ký trước
Ghi nhật ký MỌI lần chấm — kể cả lần không đổi trạng thái.
Số lần chấm là đầu vào của hiệu chỉnh đa phép thử (PRED-15a).
```

| | Yêu cầu thi hành | Vì sao |
|---|---|---|
| **(a)** | **Chung sổ với holdout.** Mỗi lần chấm ghi vào **chính** sổ chạm holdout của `PRED-11`, cùng lý do máy-đọc-được | Hai bộ đếm cho cùng một loại chi phí thống kê thì **tổng thật không ai thấy**. Một ngân sách, một sổ |
| **(b)** | **Hàm chấm TỪ CHỐI CHẠY** khi khoảng cách tới lần chấm trước chưa đủ — ném lỗi, không trả kết quả im lặng | Quy tắc chỉ sống trong tài liệu thì vẫn chạy lại bằng tay được. Cưỡng chế ở **tầng gọi**, đúng cơ chế `PRED-11` dùng cho holdout |

### Áp cho chính tầng 1 — ba nhánh, chấm trên vũ trụ ngoài hiệu chuẩn

| Kết quả | Hành động |
|---|---|
| Cận dưới KTC95 của EV > 0 **và** vượt đối chứng vô điều kiện (M0) | Giữ phát |
| Cận dưới ≤ 0 **nhưng** vượt đối chứng vô điều kiện | Giữ phát **kèm nhãn**, đo lại kỳ sau |
| Cận dưới ≤ 0 **hoặc** không vượt đối chứng vô điều kiện | `barrier` **NGỪNG PHÁT Ý ĐỊNH** — chỉ giữ σ̂, dải giá, sổ |

> Kịch bản nhánh ba **đang nằm trong khoảng tin cậy hôm nay** (M0, §4.2). Đó là lý do mục này
> không phải phòng xa — nó là điều kiện phải có trước khi phát khuyến nghị đầu tiên.

> **Cần chủ dự án ký (`ADR-026`).** Đây là quyết định phạm vi, không thuần kỹ thuật. Nếu bác, gỡ
> mục này — gỡ một mục dễ hơn là phát hiện thiếu nó sau sáu tháng phát khuyến nghị từ một phương
> pháp đã đo là âm.

---

## 9 · Lộ trình theo phụ thuộc

Không có ngày tháng — xếp theo cái gì chặn cái gì.

```
⓪  ★ SỔ BẤT BIẾN BẬT TRƯỚC MỌI MÔ HÌNH — kèm KHOÁ PHIÊN BẢN
    Prediction (PRED-05) + sổ khuyến nghị (TRACK-01) ghi từ bản ghi ĐẦU TIÊN.
    + epoch_id: băm CHỈ những lớp ảnh hưởng quyết định (L1 đặc trưng · L3 phân
      phối · L4 cổng + hằng số rào + hàm chi phí · L5 hướng · bộ hiệu chỉnh).
      Đổi công thức/ngưỡng/rào/hàm chi phí ⇒ RESET đồng hồ.
      Sửa I/O, log, hiển thị, refactor không đổi đầu ra ⇒ không reset.
    + giai đoạn thô sơ chạy dưới method_id = "barrier-dev": KHÔNG BAO GIỜ thăng
      nhãn, không gộp vào track record.  (PRED-05 từ chối ghi lại open_time đã
      chấm KỂ CẢ khi model_sha khác — nên không tách method_id là chiếm vĩnh viễn
      mọi open_time của giai đoạn thô sơ.)
    + ACC-06: chuỗi băm liên kết · kiểm hằng ngày · trạng thái toàn vẹn công khai
      · tự hạ nhãn khi đứt chuỗi.  Ba việc này thuộc bước ⓪, không phải việc sau.
⓪b DUYỆT ADR-002 (đang «Đề xuất → chờ chấp thuận») ⇒ đăng ký H ⇒ ADR-024
    ⇒ sửa PRED-02 gồm cả cột «Kiểm bằng» ⇒ MỚI viết L4.
①  M1 dữ liệu ngày thật  ─┬─►  M2 bộ kiểm định tự chứng minh  ─►  M3 đo lại bề mặt
                          │                                          trên vũ trụ ngoài hiệu chuẩn
                          └─►  L1 lõi đặc trưng + phép dò #6
②  L2 σ̂ HAR  ─►  cổng QLIKE riêng của L2  ─►  ★ giá trị thật đầu tiên của cả dự án
                                                (một con số dám bảo vệ trên dashboard)
③  L3 phân phối + A2 conformal  ─►  M4 kiểm toán độ phủ cuộn  ─►  PRED-14(b) đạt
③b A1 isotonic + PRED-12  ─►  nguồn p_win đã đăng ký (★ §3.1)
④  L5 máy tranche  ─►  L4 cổng phí (p_required, p_star, COST_GATE_MARGIN_PP trong mã)
④b cưỡng chế holdout ở `store` + sổ đăng ký trước PRED-15(b)
④c máy nhãn PRED-13 — hàm thuần, bảng chân trị toàn phần, test vét cạn
④d L7 + silence_reason + sổ điểm phát (UI-10)  ─►  sổ bất biến L8
⑤  ★ hệ chạy thật, QUAY VÒNG CÓ SỐ  ─►  tích luỹ sự kiện forward
⑥  đủ sự kiện forward để cổng CÓ CÔNG SUẤT (bậc nghìn, §6)  ─►  A3 meta-label  ─►  điểm rẽ §6
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
> 1. **Sổ bật trước mô hình** (bước ⓪). Không có ngoại lệ — nhưng kèm khoá phiên bản: đồng hồ **chạy lại từ đầu mỗi lần method đổi bản chất**, nên bật sổ sớm mua được thời gian **chỉ khi** method đã ổn định.
> 2. **Sản phẩm phải có lý do tồn tại khi mang nhãn `chưa kiểm chứng` vĩnh viễn.** Nếu giá trị
>    của hệ chỉ xuất hiện sau khi có nhãn xanh, hệ **không có trạng thái ra mắt**. Đây là lý do
>    §6 đặt S1 làm mức sàn và §5.1 xếp `A1`/`A2` lên trước `A3`: dự báo biến động có QLIKE
>    thắng đối chứng, và dải giá có độ phủ đo được, là **giá trị không phụ thuộc nhãn**.

**Hai mốc phát hành, tách bạch:**

| Mốc | Gồm | Là gì |
|---|---|---|
| **S0** | ⓪ + ① + ② | **Mức sàn chạy được một mình**: sổ + độ tươi + σ̂ có QLIKE + dashboard chỉ hiển thị biến động và dải giá. Không phát khuyến nghị nào |
| **S1b** | ③ + ③b + ④…④d + `PRED-13` | Phần **phát khuyến nghị**. Chỉ mở khi §7.3 có nghiệm và §8.5 đã đăng ký |

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
| Im lặng dài làm người vận hành hạ ngưỡng | **thấp–trung bình** | `ADR-016 §3` đã đổi khung: lập luận sinh tồn là **"lệnh nhỏ"**, không phải "ít lệnh" — nhịp phát hiện hành quanh một lệnh/ngày. Vẫn giữ `silence_reason` bắt buộc và ngưỡng trong mã (`PRED-17`) |
| **Trượt phí do quay vòng** — chi phí chắc chắn nhất của cả hệ, trừ trước mọi EV | **trung bình–cao** | Dashboard in `turnover_w_per_year` và `fee_nav_pct_per_year` (`spec_numbers §3b`) cạnh mọi con số hiệu suất |
| **Cỡ mẫu không bao giờ đủ cho tầng 2** | trung bình | Chấp nhận: S1 là mức sàn và tự nó là sản phẩm |
| **Phụ thuộc thư viện ngoài** (TabPFN, TTM) | trung bình | Cả hai là **ứng viên thách thức**, không nằm trên đường sản xuất; mặc định luôn là mô hình tự viết |
| **Nhãn không bao giờ lên xanh** vì quy tắc lấy giá trị thấp nhất theo cặp | **cao** | §8.4 — chuyển phán quyết lên mức phương pháp, thêm trạng thái thứ tư |
| Dây an toàn `PRED-02` đo sai đại lượng | **trung bình** | §2.5 — bịt một thiểu số sự kiện, tập trung ở một cặp; nhóm bị bịt là nhóm `c_R` cao nhất. Vẫn phải sửa trước khi viết L4, kèm test quét σ̂ |
| **Quy ước thoát chưa đăng ký** — `p_star` đang dùng payoff hợp đồng cho một hệ có payoff thực nhận khác | **cao** | §4.1 ★ · M0b — chênh 39–52% EV toàn hệ, lớn hơn mọi hiệu ứng khác tài liệu bàn tới |
| **Lưới xu hướng có thể không đóng góp gì** ngoài đối chứng vào lệnh vô điều kiện | **cao** | M0 (§4.2) chấm trước M3; §8.5 nhánh ba đã đăng ký hành động nếu kịch bản này thành sự thật |
| **Ngân sách kiểm định vô nghiệm**, hỏng im lặng | **cao** | §7.3 — `fold_budget()` là cổng **ném lỗi**, không phải bảng tham khảo |
| Thiên lệch chọn lọc của **tác giả mô hình nền** — kiến trúc và siêu tham số đã chọn trên chính thị trường ta chấm | trung bình | Mốc cắt dữ liệu **không** chặn được rủi ro này; ngay cả fold sau mốc cắt vẫn mang thiên lệch. Ghi cạnh mọi kết quả của method có `pretrained_corpus ≠ "none"` |

---

## 11 · Việc phải làm sau khi bản này được duyệt

### 11.1 · Bảy câu chặn — chỉ chủ dự án quyết được

Mỗi câu đang chặn ít nhất một ô của §0. Không câu nào Claude quyết thay.

| # | Câu hỏi | Chặn |
|---|---|---|
| 1 | **`WIDE_UNIVERSE_N` và `NARROW_UNIVERSE_N` là bao nhiêu?** — quyết định `PRED-11` × `PRED-12` có nghiệm hay không. Vũ trụ nhỏ ⇒ vô nghiệm; vũ trụ rất rộng ⇒ vừa đủ nhưng lát test co lại còn vài chục sự kiện. *(Lưu ý: "36 cặp" của `ADR-017 §2` là vũ trụ **khử nhiễm**, không phải vũ trụ đo của `PRED-19`)* | §7.3 · M3 · toàn bộ ngân sách fold |
| 2 | **Lát hiệu chỉnh `PRED-12` rút từ vũ trụ ĐO hay vũ trụ KHUYẾN NGHỊ?** — (a) vũ trụ đo: số học đóng được nhưng bộ hiệu chỉnh học trên **quần thể khác** quần thể được phát · (b) isotonic cuộn mở rộng dùng chung mọi fold: khả thi ngay, đổi lại mất tính độc lập giữa fold · (c) giữ theo fold, hạ số fold và mở rộng vũ trụ: **phải sửa `PRED-11`**, tức ADR chạm REQ mức CHẶN | §7.3 · §5.2 · A1 |
| 3 | **Dây an toàn `PRED-02`: sửa CHÂN TRỜI hay sửa ĐẠI LƯỢNG?** — hai nhánh loại trừ nhau (§2.5). **Khuyến nghị: sửa chân trời** — rẻ, giữ nguyên phép kiểm nghiệm thu, và đưa tần suất kích hoạt về 0% | §2.5 · §3.1 L4 · §9 ④ |
| 4 | **Quy ước thoát: `target` kiểm tại close hay lệnh giới hạn soi intrabar?** — chênh **39–52% EV toàn hệ**, lớn hơn mọi hiệu ứng khác tài liệu bàn tới (§4.1 ★) | §4.1 · `p_star` · `ADR-017` |
| 5 | **Chấp nhận thời gian chờ thật của cổng L6 không?** — với công suất đúng, cổng cần bậc **nghìn** sự kiện forward, tức **nhiều năm**. (a) chấp nhận và ghi thẳng vào §6/§9 · (b) **xoá L6 khỏi lộ trình ngay** và ghi ADR — hợp lệ, rẻ hơn là tiêu nhiều năm cho một thí nghiệm không phân biệt được hai giả thuyết · (c) sửa `PRED-21` để cổng đo một đại lượng có công suất ở n nhỏ hơn | §6 · §9 ⑥ · `PRED-21` |
| 6 | **Có nhận M0 (đối chứng vào lệnh vô điều kiện) làm baseline bắt buộc không?** — nó có thể **bác chính tầng 1**. Không nhận là phát một sản phẩm mà chưa ai biết phần lưới xu hướng đóng góp gì | §4.2 · §8.1 · §8.5 · §1 |
| 7 | **Duyệt `ADR-002` trước hay sau?** — nó vẫn ghi *"Đề xuất → chờ chấp thuận"* mà `ADR-024` sẽ sửa một điều khoản của nó | §9 ⓪b |

### 11.2 · ADR phải viết — số do phiên kiểm định cấp tập trung

| ADR | Nội dung | Ghi chú |
|---|---|---|
| **021** | Bảng chân trị `pretrained_corpus` **toàn phần** + bốn trường trọng số + `effective_cutoff()` | **Sửa phạm vi `RULE 12`** ⇒ phải sửa cùng lúc `CLAUDE.md`, `00_VISION §5.1`, `PRED-08` |
| **022** | ACI với **bốn tiêu chí tách bạch** + I1b + quy tắc dẫn xuất `η` (§5.3) | |
| **023** | Quy ước `n_eff` / `df_eff` + `L6_FIT_SET` (§7.1, §7.2) | |
| **024** | Dây an toàn `PRED-02` — chọn nhánh ở câu 3 | Có thể phải sửa cột "Kiểm bằng" của một REQ mức CHẶN |
| **025** | Phán quyết kỹ năng ở **mức phương pháp** + block bootstrap panel (§8.4) | Trạng thái thứ tư **đã bị bác** — không đưa vào |
| **026** | Trạng thái `bác bỏ` (§8.5) **và** cập nhật `ADR-017 §2` sau `ADR-020` | `ADR-017 §2` đang neo cả ba mục vào GATE 1 — khung đã bị xoá, nên M3 **mất tiêu chí đạt/trượt** |
| **027** | `ENSEMBLE_QLIKE_GAIN_MIN` và `DM_ALPHA` cho A4 (§5.5) | Tới khi có: §5.5 ghi "chưa đăng ký — chặn A4" |

### 11.3 · Việc trong mã, không cần ADR

| # | Việc | Vì |
|---|---|---|
| 1 | `measure_spec.py`: thêm `wire_bite_rate` ✅ · `fold_budget` · `average_uniqueness` · `rho_bar_event_returns` · `unconditional_benchmark` · `gate_power` | §7.3, §8.4, M0 |
| 2 | `measure_spec.py`: in **SE block cạnh SE iid**, in **SE của chênh lệch ghép đôi**, in **khối xuất xứ dữ liệu** ở đầu `spec_numbers.md` | Dùng SE của mức để chấm một chênh lệch là lỗi riêng |
| 3 | `make test`: sinh lại `spec_numbers.md` ra tệp tạm và `diff` — lệch ⇒ đỏ | Hàng rào rẻ nhất cho `ADR-016` |
| 4 | `serving/schemas.py`: đánh dấu **DEPRECATED** trong mã + test ghim tên trường | Hợp đồng chết đang tự xưng là ràng buộc |
| 5 | **Dọn `config/model.yaml`** | Nó chứa `threshold` / `dead_zone` / `decision` / `horizon` ⇒ **`PRED-17` đỏ ngay khi được viết**; còn cấu hình một **LightGBM hướng giá đang sống** (chính A5 mà §5.1 bác) và một khối **ba mô hình quantile riêng** (chính thứ §10.1 cấm). Chuyển `label.horizon_bars` vào mã, xoá phần còn lại |
| 6 | Bốn phép dò mới #8–#11 + luật đạt/trượt cho #7 | §8.2 |
| 7 | Test kiến trúc `test_req_delegations_resolve` | §0 |

### 11.4 · Phụ lục A.2 · Số ngoại sinh — phải viết trước khi trích tiếp

`ADR-016 §2` đòi đúng mục này. Bốn dòng bắt buộc mở đầu:

| Số | Nguồn | Trạng thái |
|---|---|---|
| **13 chiều thông tin độc lập** | `Old/14 §0.1` | ⚠️ đo trên **một** tài sản, và `Old/14` tự ghi nhóm liên thị trường chưa kiểm được ⇒ **CẦN ĐO LẠI**, không được dùng làm ngân sách cứng cho vũ trụ nhiều cặp |
| **"36 cặp"** | `ADR-017 §2` | Phụ thuộc `PRED-19` chưa đăng ký (§0) |
| **Thời gian nắm giữ** | `spec_numbers §1` | Số **sinh** — trỏ, không chép |
| **Tỉ lệ "Rule / AI" 90/10 · 80/20 · 75/25** ở §6 | — | **Không nguồn, không định nghĩa ⇒ XOÁ** hoặc định nghĩa bằng một đại lượng đếm được |

---

*Tài liệu này không chứa số đo. Mọi kết quả: `docs/generated/spec_numbers.md` (sinh bởi `scripts/spec/measure_spec.py`).
Bằng chứng ngoài được trích có đường dẫn tại chỗ trích. Hồ sơ đo lường thế hệ 1: `docs/Old/`.*
