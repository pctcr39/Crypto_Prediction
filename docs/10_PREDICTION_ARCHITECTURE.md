# KIẾN TRÚC PHẦN DỰ ĐOÁN — BA GIẢI PHÁP

> Phiên bản 1.0 · 26/08/2026 · Trả lời câu hỏi: *rule-based hay AI model, hay mix?*
> Nguồn: 4 kiến trúc sư độc lập (vận hành sàn · dự báo khí tượng · thống kê M4/M5 · quỹ systematic)
> + 2 giám khảo (thực tế kinh tế · khả thi cho một người). Mọi con số truy được về `09` hoặc tính lại trong tài liệu này.
> Liên quan: `00_MASTER_PLAN.md` · `05_STREAMING_ARCHITECTURE.md` · `07`/`08`/`09`

---

## 0 · KẾT LUẬN TRONG 30 GIÂY

**Câu trả lời là MIX — nhưng ngược với trực giác thông thường.**

Trực giác nói: *AI dự đoán hướng, rule quản trị rủi ro.*
Bằng chứng nói: **rule giữ hướng, AI giữ biến động và việc chọn bỏ lệnh.**

Lý do nằm ở một phương trình duy nhất:

```
p* = 0,5 + c / (2 · E|move|)          ← hit-rate cần để hoà vốn
```

Trong đó `c` là chi phí khứ hồi và `E|move|` là biên độ kỳ vọng. Hai vế của bài toán:

| | Giá trị đo được | Nguồn |
|---|---|---|
| **Năng lực dự báo hướng** (trần cứng) | 51–53% khung giờ · 52–56% khung ngày | `09 §3.1` |
| **Năng lực dự báo biến động** | OOS R² **0,4–0,6** (tái lập 0,512 trên 700k nến 5m Binance) | `09 §3.1` |
| Chênh lệch | **~100 lần** theo R² | |

Hướng là hằng số ngoài tầm kiểm soát — model tốt hơn không mua thêm được phần trăm nào, và `RULE 11` chặn ở 60%. Biến số **duy nhất điều khiển được** trong phương trình là `E|move|`, và đó chính là thứ dự báo được tốt gấp trăm lần.

> **Hệ quả kiến trúc:** model biến động không phải phụ kiện để định cỡ lệnh — **nó là thành phần quyết định model hướng có dùng được hay không.** Kế hoạch hiện tại đặt nó ở cuối pipeline như một output phụ. Sai thứ tự nhân quả.

---

## 1 · BỐN SỰ THẬT ĐÓNG KHUNG MỌI THIẾT KẾ

### 1.1 · Bức tường phí là hàm của biên độ, không phải hằng số

Bảng dưới **tính lại độc lập trong phiên này**, không trích từ trí nhớ. Phí: spot 0,30% khứ hồi (taker 0,10%×2 + trượt 0,05%×2); perp 0,20%; funding nền 0,01%/8h (đúng `config/model.yaml`), funding nóng 0,05%/8h (`08 §82`).

| Chân trời | E\|move\| | Spot | Perp (chỉ phí) | Perp + funding **nền** | Perp + funding **nóng** |
|---|---|---|---|---|---|
| 4h *(= `horizon_bars["1h"]=4`)* | 0,77% | 69,6% | 63,1% | 63,4% | 64,7% |
| 1 ngày | 2,33% | 56,4% | 54,3% | 54,9% | 57,5% |
| 1 ngày · **chế độ vol thấp 23–26** | 1,71% | 58,8% | 55,8% | 56,7% | **60,2%** ⚠ |
| 1 tuần | 6,58% | **52,3%** | 51,5% | 53,1% | 59,5% |
| | | | | | |
| **Trần năng lực đo được** | | **52–56%** | | | |

**Ba hệ quả không thể thương lượng:**

1. **Khung 1h và 4h chết hẳn như tầng đặt cược.** p\* 63–70% so với trần 51–53%, và `RULE 11` chặn ở 60%. Giao của *«đủ lãi»* và *«đáng tin»* là **tập rỗng**, không phải tập hẹp. Bốn trường phái độc lập ra cùng kết luận này.
2. **1 ngày trong chế độ vol thấp + funding nóng = 60,2% ⇒ tái nhập vùng nghi rò rỉ của `RULE 11`.** Chạy trốn sang khung ngày không thoát được như tưởng — biên an toàn thật nhỏ hơn quảng cáo 1,6–8,7 điểm.
3. **Ở khung tuần, SPOT (52,3%) RẺ HƠN PERP có funding nền (53,1%).** Hai nước cờ *«kéo dài chân trời»* và *«dùng perp vì phí thấp»* **triệt tiêu lẫn nhau**: lợi thế 0,10% của perp bị funding nền ăn hết sau 3,3 ngày, funding nóng thì 0,67 ngày.

> ⚠️ **Funding là chi phí CÓ ĐIỀU KIỆN, tệ hơn trung bình.** `09 §2` đã kiểm trên BTC/ETH/SOL/DOGE 2019–2026: sau cực trị funding dương, giá **tiếp diễn tăng**. Nghĩa là hệ trend-following long perp nắm giữ **chính xác vào lúc funding đắt nhất**. Con số Sharpe net 1,07–1,32 đã kiểm là số **spot long/flat**, chỉ đúng ở cấu hình đó.

### 1.2 · Hai trong ba đầu ra giải được bằng một hồi quy 4 tham số

Variance-ratio BTC khung giờ đo được **VR(2)=0,98 · VR(24)=0,95 ≈ 1** — gần random walk. Suy ra `q50 ≈ last_close`: **toàn bộ thông tin của dải giá nằm ở ĐỘ RỘNG**, mà độ rộng chính là σ̂ — thứ dự báo được với R² 0,5.

⇒ `expected_vol_pct` **và** `q10/q50/q90` cùng đến từ HAR-RV (Corsi 2009), 4 tham số, refit vài giây mỗi tuần.
⇒ **Ba model LightGBM quantile bị cắt** — nhất trí 4/4 kiến trúc + 2/2 giám khảo. Thay bằng số học:

```
q_α = last_close · exp(z_α · σ̂ · √H)
```

Ưu điểm kèm theo: **đơn điệu theo cấu tạo** — `q10 ≤ q50 ≤ q90` không bao giờ cắt nhau, không phải «hiếm khi cắt».

### 1.3 · Vùng chết 0,42/0,58 là lỗi THỨ NGUYÊN

`config/model.yaml:66-67` đang có `p_up_threshold: 0.58` / `p_down_threshold: 0.42`, và `serving/schemas.py:57` hard-code cùng hai số đó làm mặc định.

Đây không phải sai giá trị mà sai **thứ nguyên**: lãi/lỗ phụ thuộc **tích** của xác suất và biên độ, một ngưỡng xác suất đơn không mã hoá được điều đó. Nhất trí 4/4: thay bằng `p_required` tính **từng nến**, **trong code**, không đọc từ config.

> Vì sao phải nằm trong code: đây chính là dòng sẽ bị sửa vào cái đêm dashboard trông trống ba tuần liền. Khi nó bị sửa, **không test nào đỏ, không tiếng động**, và mọi con số sau đó là số bịa.

### 1.4 · Trạng thái repo hôm nay (đã kiểm trên đĩa)

| Hạng mục | Thực tế | Hệ quả |
|---|---|---|
| `data/raw` | **2,2 MB** — 1 cặp, 1 khung (BTCUSDT 1h) | Chặn cứng mọi kết luận thống kê |
| `data/raw/universe/` | đúng **một** ảnh chụp (`month=2026-08`) | Tầng cross-sectional bất khả ≥12 tháng |
| `features/builder.py:73` | `NotImplementedError` | M3 chưa có |
| `validation/purged.py` | **63 dòng** khung | Trọng tài chưa tồn tại |
| `risk/limits.py:27` | `NotImplementedError` | M13 chưa có |
| 5 probe rò rỉ | đang `skip` | Bộ dò chưa từng bắt được gì |
| `config`: `drop_flat_from_train` | `true` | Nến đi ngang bị loại khỏi train — xem §4 mục 3 |
| `config`: `n_trials` | `100` | Quá lớn so với n hiệu dụng |
| `config`: `funding_rate_8h_pct` | `0.01` — **có sẵn mà không kiến trúc nào dùng** | |

---

## 2 · BA GIẢI PHÁP

### Bảng so sánh

| | **A · ĐÀI QUAN TRẮC** | **B · MỘT PHÂN PHỐI, MỘT NGƯỠNG** | **C · ĐỔI HÌNH DẠNG CƯỢC** |
|---|---|---|---|
| **Rule / AI** | 90 / 10 | 75 / 25 | 65 / 35 |
| **Câu hỏi trả lời** | «Rộng bao nhiêu?» | «Có đáng cược không?» | «Cược bao nhiêu?» |
| **AI chạm vào hướng?** | Không | Có, bị kẹp [0,35 ; 0,65] | **Không** — chỉ lọc bỏ |
| **Hình dạng cược** | không cược | đối xứng 1:1 | **4:1** |
| **Hoà vốn phải vượt** | — | 52,3–56,7% | **22,0–27,5%** |
| **Biên so trần năng lực** | — | **−2,9 … +1,1 điểm** | +4,4 … +13 điểm\* |
| **Đầu ra có tiền?** | không | không | **có** (`size_pct`) |
| **Tuần công** (v1 / trọn gói) | **8–9 / 13–15** | 9–10 / 17–19 | 10–11 / 20–22 |
| **Xác suất có sản phẩm ngày 90** | rất cao | cao | trung bình |
| **Xác suất có PnL dương** | 0 | thấp | trung bình |
| **Dạy được nhiều nhất** | nghề kiểm định dự báo | kinh tế học ngưỡng | nghề trading thật |

\* *có điều kiện — phụ thuộc một phép đo CHƯA LÀM, xem C.*

---

### 🔭 A · ĐÀI QUAN TRẮC — *«Bán độ bất định, không bán hướng»*

**Không có classifier hướng. Không có tín hiệu giao dịch.** Học máy chỉ gồm HAR-RV (4 hệ số) và isotonic.

```
kline_1h đóng  [40 cặp — KHÔNG phải 400]
  ├─ A0 RULE   tổng hợp 4h/1d · dedupe theo open_time · máy trạng thái độ tươi
  │            ⛔ Trễ/Mất kết nối ⇒ toàn hệ trả «KHÔNG CÓ Ý KIẾN»
  ├─ A1 RULE   lõi đặc trưng dùng chung batch↔live · shift_all(1) · assert_scale_free()
  │            + MỘT hàm RV duy nhất (Parkinson/Garman-Klass từ OHLC)
  ├─ A2 HỌC    HAR-RV: OLS trên log(RV) 3 thang (1d/5d/22d) ──► expected_vol_pct
  │            fallback EWMA λ=0,94 tất định
  ├─ A3 RULE   q_α = last_close · exp(z_α·σ̂·√H) ────────────► q10 ≤ q50 ≤ q90
  ├─ A4 RULE   tầng THAM CHIẾU chạy vô điều kiện: climatology + persistence
  ├─ A5 RULE   p_up = 1 − F(0) từ CHÍNH F sinh ra dải ──────► hướng (gần như luôn KHÔNG RÕ)
  └─ A6 RULE   OutcomeReconciler + bảng điểm skill công khai (CRPSS/BSS/coverage/PIT)
```

**Bất biến kiến trúc:** ba đầu ra là **ba cách đọc của MỘT phân phối F**. Nhờ vậy mâu thuẫn *«p_up = 0,62 trong khi q50 < last_close»* trở thành **bất khả về cấu trúc** — hiện tại nó đang **hợp lệ về kiểu dữ liệu** trong `schemas.py`.

| | |
|---|---|
| **Nhãn** | Mục tiêu liên tục `r_H` và `r_H/σ̂`. `drop_flat_from_train: false` |
| **Model** | HAR-RV 4 tham số — **không LightGBM, không GARCH** |
| **Chấm điểm** | **QLIKE** (Patton 2011) cho vol — không MSE. PIT/rank histogram cho dải. CRPSS + BSS so climatology |
| **Ngưỡng sống** | QLIKE tốt hơn EWMA(0,94) ≥5% (DM p<0,05) · OOS R² log-RV ≥ 0,30 · độ phủ [q10,q90] = 80% ± 3pp trên ≥500 dự đoán đã chấm · **quantile cắt nhau = 0** |
| **Hợp với ai** | Muốn sản phẩm thật sau 8 tuần và chấp nhận nó không đưa lệnh · đặt mục tiêu học lên đầu · chấp nhận *«model hướng của tôi không có kỹ năng»* là **kết quả hợp lệ** |

---

### ⚖️ B · MỘT PHÂN PHỐI, MỘT NGƯỠNG — *«Vẫn cược đối xứng, nhưng chỉ khi số học cho phép»*

Kế thừa nguyên A0–A3, thêm cổng phí động và một tầng nghiêng hướng **bị kẹp công suất**.

```
… A0 → A1 → A2 (σ̂) → A3 (dải) …
  ├─ B1 RULE   CỔNG TƯỜNG PHÍ — 4 dòng số học, TÍNH TRONG CODE
  │              E|move| = σ̂·√(2/π)·√H
  │              c = c(H, instrument)  ← BAO GỒM funding × số ngày nắm giữ
  │              p_required = 0,5 + c/(2·E|move|)
  ├─ B2 HỌC    nghiêng hướng μ̂ — ensemble 4 tín hiệu yếu có cơ chế kinh tế đọc được
  │            (TSMOM · dấu(Δgiá)×dấu(ΔOI) · funding z96 theo chiều TIẾP DIỄN · động lượng
  │             cross-sectional), logistic phạt mạnh, KẸP CỨNG p_up ∈ [0,35 ; 0,65]
  ├─ B3 HỌC    isotonic ──► p_up_calibrated
  ├─ B4 RULE   UP ⟺ p_up_cal > p_required + 2pp   ·   DOWN ⟺ đối xứng   ·   còn lại KHÔNG RÕ
  └─ B5 RULE   lớp bám sát từng giây = CẦU BROWNIAN trên chính F đã phát (công thức đóng)
```

**Bất biến — QUYỀN ĐƠN ĐIỆU:** B2/B3 chỉ có thể biến TRADE thành NO-TRADE. Fuzz-test được: quét `p_up_cal` trên toàn [0,1] với cổng đóng ⇒ output luôn «KHÔNG RÕ».

> **★ Rủi ro chết người của B — một giả định chưa ai đo.** Cổng vol hạ `p_required` xuống ~52,5% bằng cách chỉ vào lệnh khi `E|move|` lớn. Nhưng **không ai chứng minh hit-rate GIỮ NGUYÊN 52–56% trong chế độ vol cao.** Vol cao = nhiễu cao; nhiều khả năng hit-rate rơi cùng nhịp với `p_required` và cổng **không mua được gì**. Ba trên bốn kiến trúc gốc xây trên giả định này mà không nhận ra.

| | |
|---|---|
| **Model** | Ensemble 4 tín hiệu yếu + logistic phạt mạnh, **gộp toàn vũ trụ**, symbol categorical — không phải LightGBM 45 feature / 2000 cây |
| **Hiệu chỉnh** | Isotonic gộp nhiều symbol (24 tháng khung 1d chỉ ~730 nến — không đủ công suất hiệu chỉnh từng coin) |
| **Kiểm định** | Purged WF 8 fold ≥24 tháng · Pesaran–Timmermann · Diebold–Mariano vs 7 baseline · **Deflated Sharpe** · **FDR Benjamini–Hochberg** q=0,10 |
| **Ngưỡng sống** | Hit-rate ≥ `p_required` **của chính fold đó** + 2pp trên ≥100 lần phát không chồng lấp · net Sharpe > **1,32** (đỉnh dải TSMOM) · **≤1,07 ⇒ ship TSMOM và dừng** |
| **Kết cục xác suất cao** | Hệ thống **im lặng gần như hoàn toàn** ở 1h/4h và phần lớn thời gian ở 1d |

---

### 🎯 C · ĐỔI HÌNH DẠNG CƯỢC — *«Không hạ thanh xà, đổi hình học»*

**Rule quyết hướng và lối ra. Học máy chỉ quyết CÓ CƯỢC KHÔNG và CƯỢC BAO NHIÊU.** Học máy không bao giờ chạm vào hướng.

**Lập luận trung tâm — số học, không khẩu vị:**

| Payoff | Hoà vốn (kèm phí) | Tham chiếu | Margin |
|---|---|---|---|
| 1:1 đối xứng (1d perp + funding) | 54,9% | trần 52–56% | **−2,9 … +1,1 điểm** |
| 3:1 | **27,5%** | | +7,5 điểm |
| **4:1** (stop 1,2σ̂ / target 4σ̂) | **22,0%** | TSMOM ≈ 35% `09 §4` | **+13 điểm** |

Kỳ vọng: `0,35×4R − 0,65×1R − 0,10R(phí) = +0,65R/lệnh`.
Và tần suất: **15 lệnh/năm = 4,5%/năm tiền phí**, so với 1 vòng/tuần = **10,4%/năm** — riêng việc giảm tần suất trả lại nửa bức tường.

> ⚠️ **CẢNH BÁO TRUNG THỰC.** Con số 35% được **mượn** từ hệ MA long/flat đã kiểm toán, **không phải** đo trên khung barrier 1,2σ/4σ. Dưới random walk thuần, `P(chạm target trước) = 1,2/5,2 = 23,1%` — chỉ hơn hoà vốn 22,0% đúng **1,1 điểm**. **Hình dạng CHUYỂN gánh nặng, không TẠO RA biên.** Toàn bộ edge vẫn nằm ở khẳng định «TSMOM nâng 23,1% → 35%», và khẳng định đó **phải được đo trước khi xây bất cứ thứ gì đứng lên nó**.

```
… A0 → A1 → A2 (σ̂) → A3 (dải) …
  ├─ C1 RULE   cổng chế độ — 3 bucket vol/volume CỐ ĐỊNH (regime làm feature thì tốt,
  │            làm switch học được thì overfit)
  ├─ C2 RULE   HƯỚNG SƠ CẤP = TSMOM (MA20/50/200 + Donchian), khớp t+1
  │            ★ SPOT LONG/FLAT — đúng cấu hình mà Sharpe 1,07–1,32 được đo
  │            sinh SỰ KIỆN: entry · SL = 1,2σ̂ · TP = 4,0σ̂ · time barrier
  │            → 7–18 sự kiện/coin/năm thay vì 8.760 dự đoán/coin/năm
  ├─ C3 HỌC    META-LABEL — LightGBM NĂNG LỰC THẤP (depth 3 · ≤15 lá · ≤18 feature · ≤300 cây)
  │            «sự kiện này chạm TP trước SL không?» · sample weight theo ĐỘ DUY NHẤT NHÃN
  │            ⛔ KHÔNG BAO GIỜ đảo hướng của C2 — chỉ được LỌC BỎ
  │            ⛔ 99% số nến không gọi tới tầng này
  ├─ C4 HỌC+RULE  isotonic → p_win_cal → size = min(¼Kelly, vol_target/σ̂, trần 1%)
  └─ C5 RULE   VETO — ép size = 0 bất kể C1–C4 nói gì (lỗ ngày 2% không tự bật lại ·
               trần 1%/lệnh · tương quan · heartbeat · kill switch)
```

| | |
|---|---|
| **Nhãn** | **Hai bộ**: mức-nến (giữ để chấm baseline + hiển thị) và **triple-barrier mức-sự-kiện** từ σ̂ — bộ sau mới là nhãn của tầng ML |
| **Cỡ mẫu** | 40 coin × 15 lệnh/năm × 3 năm ≈ 1.800 sự kiện thô, tương quan ~0,9 ⇒ **vài trăm hiệu dụng**. Quy tắc **≥20 quan sát độc lập / tham số tự do** ⇒ cấu hình hiện tại (2000 cây / 31 lá / 45 feature) sai **vài bậc độ lớn** |
| **Đoạn khó nhất (~25h)** | Sample weight theo **độ duy nhất nhãn**. Bỏ nó = thổi phồng cỡ mẫu hiệu dụng đúng ở tầng đã thiếu mẫu, **và không có gì báo lỗi** |
| **Ngưỡng sống** | C2 đứng một mình: net Sharpe ≥ **0,8** · win-rate thật của khung barrier ≥ **27,5%** · C3 phải cho precision **+≥5pp** — **<+3pp ⇒ XOÁ TẦNG NÀY** (kết quả hợp lệ) |

**Ba rủi ro chết người của C:**

1. **Win-rate 35% là số mượn** → phép đo chặn cửa ở tuần 9–10, chưa có số thì cấm viết một dòng C3.
2. **Funding giết bản perp.** Giữ 20–52 ngày: 0,2–0,6R (nền) → **1,1–2,8R (nóng)** trên R≈2,8%. `+0,65R` → `+0,05R` … âm. Mặc định phải là **spot long/flat** cho tới khi perp chứng minh được sau funding.
3. **Trượt giá của stop nằm hết ở đuôi thua.** 65% số lệnh kết thúc bằng stop — loại lệnh khớp tệ nhất trong cascade. Nếu lỗ thực nhận 1,5R: `0,35×4 − 0,65×1,5 − 0,1 = +0,325R` — **mất đúng một nửa**. Cần mô hình slippage riêng cho lệnh stop, `f(σ̂, spread, độ sâu)`, không phải hằng số 0,05%.

---

## 3 · KHUYẾN NGHỊ

## → CHỌN **C**, ĐI QUA **A**.

**Đây không phải hai lựa chọn — là một lộ trình có điểm rẽ nhánh đăng ký trước.**

**Vì sao C, không phải B.** B trung thực nhất về đo lường nhưng **không có lối thoát kinh tế**: sau khi cộng funding, cược đối xứng cần 52,3–56,7% trong khi trần là 52–56% — margin **−2,9 … +1,1 điểm**, và toàn bộ margin đó dựa trên một giả định chưa ai đo (hit-rate giữ nguyên ở chế độ vol cao). C là kiến trúc **duy nhất** biến trần **cố định** 51–53% thành kỳ vọng dương bằng số học thuần, **không cần giả định nào về chế độ**.

**Vì sao đi qua A.**
1. **60 ngày đầu của A và C là CÙNG MỘT CODE.** σ̂ của HAR-RV là đầu vào của stop 1,2σ̂, target 4σ̂, dải giá, và cổng phí. Không có A thì không có C — nên 60 ngày đầu đúng bất kể sau đó rẽ đâu.
2. **A là mức sàn trung thực.** C trượt thì vẫn còn một sản phẩm thật dựng trên tầng duy nhất có R² 0,5.
3. **A ship sớm.** Ngày ~50 dashboard lần đầu hiển thị một con số dám bảo vệ, thay cho «baseline động lượng thô dán nhãn minh hoạ». Với một người làm ngoài giờ, **5–6 tuần không thấy sản phẩm là cửa tử về động lực.**

**Vì sao KHÔNG chọn B.** Kết cục xác suất cao nhất của B — theo chính lịch trình của nó — là *«ship TSMOM sau 12 tuần»*. Đó **đúng là điểm khởi hành của C**. 12 tuần trả cho một câu trả lời mà bảng hoà vốn đã cho biết trước.

**Nhưng lấy 4 thứ của B vào C** (≈1 ngày công, giá trị an toàn cao nhất trong cả ba):
1. `p_required` tính trong code, xoá `decision.p_up_threshold` khỏi config.
2. Bất biến đơn điệu — học máy chỉ được **thu hẹp** tập hành động, fuzz-test được.
3. Khoá idempotent `symbol|tf|open_time|model_sha` + upsert, **từ bản ghi đầu tiên** (~1h bây giờ; retrofit sau 6 tháng là không làm nổi).
4. `late=True` là **CHẶN PREDICT**, không phải cờ hiển thị.

**Và lấy 1 thứ của A dù chọn gì:** suy `p_up = 1 − F(0)` từ chính F sinh ra dải giá. Chi phí gần bằng 0, và nó làm mâu thuẫn `p_up=0,62` / `q50 < last_close` — hiện **hợp lệ về kiểu dữ liệu** trong `schemas.py` — trở thành **bất khả về cấu trúc**.

---

## 4 · LỘ TRÌNH 90 NGÀY

> **Tuần 1–10 giống hệt nhau ở cả ba giải pháp.** Phân kỳ chỉ bắt đầu từ tuần 10.
> Nguyên tắc xếp thứ tự: ① thứ mất vĩnh viễn nếu hoãn · ② trọng tài trước cầu thủ · ③ thứ dự báo được trước thứ không dự báo được.

### NGÀY 1 · ~4h — DUY NHẤT KHÔNG THỂ LÙI
- [ ] Cron thu **OI + funding + takerlongshortRatio** cho 40 cặp. Binance chỉ trả **30 ngày** OI — mỗi ngày hoãn là dữ liệu mất **vĩnh viễn** (`07 §D5`).
- [ ] Cron **ảnh chụp universe hằng tháng**. Trên đĩa hiện có đúng một (`month=2026-08`). Ảnh chụp quá khứ **không tạo lại được**.
- [ ] Không phụ thuộc bất kỳ quyết định kiến trúc nào.

### TUẦN 1–2 · DỮ LIỆU
Mẻ tải **40 cặp × 3 khung × 3 năm** + cột `taker_buy_volume` *(hiện: 1 cặp, 2,2 MB)* · `build_clean` + quality gate.
**Vũ trụ giao dịch = top ~40 thanh khoản, KHÔNG phải 400** — đuôi 300 cặp có spread 0,2–1% khiến giả định slippage 0,05% thành hư cấu. 400 là phạm vi *hiển thị*.

### TUẦN 2–4 · TRỌNG TÀI TRƯỚC CẦU THỦ ★ *tuần đáng giá nhất của cả 90 ngày*
`purged.py` thật: 8 fold ≥24 tháng, purge+embargo = horizon, **một trục thời gian toàn cục** áp chung mọi symbol (chia fold theo từng symbol là rò rỉ chéo coin gần như trực tiếp).
**Điều kiện nghiệm thu KHÔNG phải «test xanh»:** tiêm rò rỉ đã biết (một feature không shift · một scaler fit toàn mẫu · một nhãn lệch một nến) và **xác nhận từng probe BẮT ĐƯỢC**, rồi mới gỡ ra.
> *Một bộ dò chưa từng bắt được gì không phải bộ dò.*

### TUẦN 4–6 · LÕI ĐẶC TRƯNG + NHÃN
`build_features` → `shift_all(1)` → `assert_scale_free()` · **một hàm RV duy nhất** từ OHLC, **đóng băng định nghĩa**, dùng chung batch↔live · **phép thử rò rỉ thứ SÁU**: chạy cùng đoạn lịch sử qua hai đường, `assert σ̂ khớp 1e-6` · sửa `drop_flat_from_train` → `false` · giao subagent nhiệm vụ **đối kháng**: *«hãy chứng minh bộ nhãn này bị rò rỉ»*.

### TUẦN 6–8 · HAR-RV → GIÁ TRỊ THẬT ĐẦU TIÊN CỦA CẢ DỰ ÁN
HAR-RV 4 tham số + fallback EWMA · chấm bằng **QLIKE** · **cổng: OOS R² log-RV ≥ 0,30**, không đạt thì dừng và sửa RV trước · đẩy `expected_vol_pct` thật lên dashboard, **gỡ nhãn «minh hoạ»**.

### TUẦN 8–9 · DẢI GIÁ + AUDIT ĐỘ PHỦ
`q = last_close · exp(z_α·σ̂·√H)` · coverage audit cuộn 500 dự đoán, hiệu chỉnh z tới khi đạt 80% ± 3pp · bỏ đường nối tới q50, in độ phủ 30 ngày **đo được** cạnh dải.
> ✅ **Mốc: 2/3 hợp đồng dữ liệu là số thật, chưa train một cây quyết định nào. Đây là GIẢI PHÁP A hoàn chỉnh ở mức v1.**

### TUẦN 9–10 · BASELINE + ★ HAI PHÉP ĐO CHẶN CỬA
7 baseline (`always_up` **dùng 49,6% từ 2022**, `seasonal_naive`, `random_5050`, `buy_and_hold` 0,96, **`TSMOM`**, `DCA-hold`, `naive RW`) + bảng FVA + Diebold–Mariano · `p_required` tính trong code, hai tầng phí, **có funding theo số ngày nắm giữ**.
- ★ **Đo win-rate THẬT của khung barrier 1,2σ̂ / 4σ̂** trên walk-forward, spot long/flat.
- ★ **Đo hit-rate THEO BUCKET VOL** — trả lời câu hỏi load-bearing của giải pháp B.

### ⚖️ ĐIỂM RẼ NHÁNH — NGÀY ~70, ĐĂNG KÝ TRƯỚC NGAY HÔM NAY

| Kết quả đo | Hành động |
|---|---|
| Win-rate barrier ≥ **27,5%** VÀ TSMOM spot net Sharpe ≥ **0,8** | → đi tiếp **giải pháp C** (tuần 10–14) |
| Win-rate barrier 23,1–27,5% | → giữ **TSMOM làm sản phẩm**, không xây meta-label. Ship A + TSMOM |
| Win-rate ≤ **23,1%** (mức random walk) HOẶC Sharpe < 0,8 | → **dừng nhánh giao dịch, ship giải pháp A.** Đây là **THÀNH CÔNG**, không phải thất bại |

> **Tuyệt đối KHÔNG khi trượt:** chạy thêm Optuna · nới ngưỡng GATE · đổi giai đoạn test.
> **Thứ tự sửa được phép** (chốt lúc đầu lạnh): ① đổi chân trời sang 1w · ② siết độ chọn lọc · ③ thêm phái sinh OI/funding.

### TUẦN 10–13 · NHÁNH C
Triple-barrier từ σ̂ · LightGBM depth 3, ≤18 feature, ≤300 cây, **sample weight theo độ duy nhất nhãn** · **Optuna ≤20 trial** (không phải 100), ghi **mỗi lần thử tay như một trial** vào MLflow · isotonic → `p_win_cal` → `size = min(¼Kelly, vol_target/σ̂, 1%)` · thêm `size_pct`/`stop_price`/`target_price`/`edge_r_net`/`cost_assumed` vào `schemas.py` nhưng **để `None` và KHÔNG render lên dashboard cho tới khi qua GATE 1** · hiện thực `risk/limits.py`, **mỗi giới hạn một test cố tình vi phạm**.

### TUẦN 13 · CHẤM GATE 1 + ADR
Backtest **hai lần**: spot long/flat (c=0,30%) và perp long/short (**funding có DẤU theo chuỗi lịch sử thật**) · bootstrap CI Sharpe theo fold, đòi **phân vị 5% > 0** · DSR với N thật · FDR q=0,10 · chấm trên 6 tháng chưa từng chạm.
**ADR-002** khoá 1h/4h thành output hiển thị · **ADR-003** cổng phí động thay vùng chết cố định · **ADR-004** bỏ quantile booster · **ADR-005** `p_up_calibrated` đổi nghĩa (nếu vào nhánh C) · **ADR-006** chi phí là hàm thời gian nắm giữ.

---

## 5 · MƯỜI BỐN ĐIỀU BẮT BUỘC — ĐÚNG BẤT KỂ CHỌN A, B HAY C

1. **`c(H, instrument)` thay hằng số phí** — bảng chi phí hai trục; **spot-hay-perp là ĐẦU RA của bảng, không phải giả định đầu vào**. `funding_rate_8h_pct: 0.01` đã có sẵn trong config.
2. **`p_required` TÍNH TRONG CODE**, xoá `decision.p_up_threshold`/`p_down_threshold`.
3. **`drop_flat_from_train` → `false`** — vùng chết là quyết định lúc **suy luận**, không phải lúc **huấn luyện**.
4. **Xoá 3 LightGBM quantile** (nhất trí 4/4 + 2/2), thay bằng số học từ σ̂.
5. **Khoá 1h/4h thành output HIỂN THỊ/nowcast** (nhất trí 4/4). Ý định giao dịch → 1d/1w.
6. **Một hàm RV, một đường code, batch↔live** + phép thử rò rỉ thứ 6 (`assert 1e-6`).
7. **Trọng tài phải tự chứng minh** — tiêm rò rỉ, bắt buộc probe phải bắt được.
8. **Dải giá đơn điệu theo cấu tạo (cắt nhau = 0) + audit độ phủ 80% ± 3pp** — chỉ số rẻ nhất và trung thực nhất của cả hệ, đo được từng nến, không cần chờ GATE nào.
9. **Đếm n HIỆU DỤNG**, giới hạn ≥20 quan sát độc lập / tham số tự do. 40 cặp tương quan ~0,9 **không phải** 40 bằng chứng; nhãn chồng lấp H nến làm n nhỏ hơn tới H lần. Block bootstrap block ≥ H.
10. **DSR (theo số trial) VÀ FDR Benjamini–Hochberg (theo số chuỗi) là hai bài toán khác nhau.** α=0,05 trên 1.200 chuỗi ⇒ ~60 dương tính giả. **Cấm hiển thị bảng xếp hạng coin theo skill trước khi áp FDR.**
11. **Mọi con số đứng cạnh hoà vốn của chính nó.** Hit-rate không kèm `p_required` là vô nghĩa; accuracy không kèm climatology (51,2% toàn Binance-era vs **49,6% từ 2022**) là vô nghĩa; R² vol không kèm QLIKE vs EWMA là vô nghĩa.
12. **IM LẶNG LÀ TRẠNG THÁI ĐƯỢC THIẾT KẾ, KHÔNG PHẢI Ô TRỐNG.** Chế độ hỏng nguy hiểm nhất **không phải lỗi kỹ thuật** — là người vận hành nhìn dashboard trống ba tuần rồi hạ ngưỡng. Bắt buộc: đăng ký trước số lệnh kỳ vọng (7–18/năm/coin) ngay trên dashboard · im lặng **có số** (*«0/2.400 nến qua cổng trong 7 ngày — đây là hành vi ĐÚNG»*) · **trần tỉ lệ phát** 1h<2%, 4h<8%, 1d<15%.
13. **Khoá idempotent `symbol|tf|open_time|model_sha` + upsert, từ bản ghi đầu tiên.** `predict()` phải là **hàm thuần** — không đọc đồng hồ, không I/O, không global.
14. **Ba thứ KHÔNG mua:** GPU · tick/1m data · tối ưu throughput (21 ms/giờ, bảy bậc dưới ngưỡng).
   **Hai thứ thật sự thiếu mà một người không tự tạo ra được:** lịch token unlock (không nguồn miễn phí đáng tin ⇒ **cắt veto unlock**) và **ảnh chụp universe quá khứ** (không tạo lại được ⇒ chặn cứng mọi tầng cross-sectional ≥12 tháng).

---

## 6 · MỘT CÂU

> **Rule giữ những gì bạn BIẾT** — phí, cơ chế biến động, tham chiếu, lối ra, giới hạn rủi ro, hình dạng cược.
> **Học máy giữ những gì bạn chỉ có thể ĐO** — mức biến động có điều kiện, ánh xạ hiệu chỉnh, lệnh nào nên bỏ.
> **Và không bao giờ để học máy giữ thứ bạn đã biết** — đó là cách một hệ thống dự báo tự lừa mình.

---

*Nguồn: 4 kiến trúc độc lập + 2 giám khảo (phiên 26/08/2026) · Mọi con số hoà vốn tính lại độc lập trong §1.1 · Mọi khẳng định về repo kiểm chứng trên đĩa cùng ngày.*
