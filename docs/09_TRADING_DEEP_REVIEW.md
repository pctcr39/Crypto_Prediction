# REVIEW SÂU PHƯƠNG PHÁP GIAO DỊCH — TỔNG HỢP ĐA NGUỒN ĐÃ QUA PHẢN BIỆN ĐỐI KHÁNG

> Phiên bản 1.0 · 25/08/2026
> **Cách tài liệu này được tạo ra:** 14 agent chạy song song — 2 kiểm toán docs 07/08, 5 mũi nghiên cứu (quant EN · trường phái bán lẻ EN · cộng đồng VN · độ chính xác dự đoán · smart money/inside) — rồi **mỗi báo cáo bị một phản biện đối kháng cố bác bỏ**: tính lại từng con số bằng Python, kéo dữ liệu thật từ API Binance, đối chiếu từng trích dẫn với nguồn gốc. Kết quả: 110 phát hiện, 56 phán quyết — **48 xác nhận · 6 bác bỏ · 2 không chắc**. Chỉ những gì sống sót mới nằm dưới đây; những gì bị bác được ghi rõ ở §9.
> **Không phải lời khuyên đầu tư.**

---

## 1 · KẾT QUẢ KIỂM TOÁN DOCS 07–08 — LỖI ĐÃ SỬA

Kiểm toán định lượng tính lại **từng con số** trong hai tài liệu. Đa số đúng (bức tường phí, quy đổi funding→APR, điểm hoà vốn carry 11,4 ngày, halving n=4, các nhãn 🟢🟡🔴 chính). Sáu chỗ sai hoặc thiếu đã được sửa trực tiếp vào doc 07/08:

| # | Lỗi | Đúng là | Trạng thái |
|---|---|---|---|
| 1 | A1: trend-following 35%×(+4/−1) = "+0,40%" | **+0,75% trước phí / +0,45% sau phí** (0,35×4 − 0,65×1) | ✅ đã sửa 08 |
| 2 | "Maker rút hoà vốn carry xuống ~8 ngày (−30%)" | **9,4 ngày (−17,5%)**; muốn 7,8 ngày phải kèm BNB discount chân spot | ✅ đã sửa 08 |
| 3 | F2: "rủi ro 10%/lệnh → gần như chắc chắn mất 50% vốn" | Mô phỏng 200k đường: **25–60% tuỳ edge** — cao nhưng không "chắc chắn"; bảng nay ghi rõ giả định | ✅ đã sửa 08 |
| 4 | B1: "carry 10,9%/năm" không nói vốn nuôi **hai chân** | APR trên tổng vốn: margin 1x → **5,5%** · 2x → 7,3% · 5x → 9,1% (thanh lý cách ~19%). Giữ 30 ngày, margin 2x ≈ **4,5%/năm** | ✅ đã sửa 08 |
| 5 | A2: "6 lệnh/ngày cần 54% để hoà" | Lãi kép: cần **~72%** — kết luận "không khả thi" còn mạnh hơn | ✅ đã sửa 08 |
| 6 | B4: "vol targeting tăng Sharpe 20–40% cho mọi chiến lược" | Backtest độc lập BTC 2014–2026: delta Sharpe chỉ **−0,07…+0,11**; nhưng **cắt max DD −83% → −36…−50%** là thật | ✅ đã sửa 08 |

Cộng thêm các tinh chỉnh: basis là chi phí *tối đa* chứ không tất định · funding âm **co cụm hàng tuần** (5–7/2021, cuối 2022) · mean reversion khung phút chỉ sống với phí maker · carry cần kỹ năng *vận hành* vừa chứ không "thấp" · vàng = "tương quan không ổn định" thay vì "bằng 0".

---

## 2 · PHÁT HIỆN LẬT NGƯỢC QUAN TRỌNG NHẤT — funding cực đoan KHÔNG phải tín hiệu đảo chiều

Niềm tin phổ biến (và từng nằm trong doc 07): *"funding dương cực đoan thường đi trước điều chỉnh — dùng ngược chiều"*. Phản biện kéo **toàn bộ lịch sử funding từ API Binance** (BTC 7.624 kỳ · ETH 7.390 · SOL 6.591 · DOGE 6.712, 2019–2026) ghép với giá và đo return sau cực trị:

| Coin | Sau funding > p95, return 7 ngày TB | Nền (unconditional) | Hit-rate contrarian |
|---|---|---|---|
| BTC | **+1,42%** | +1,07% | đa số **< 50%** |
| ETH | **+4,36%** | +1,33% | < 50% |
| SOL (p99) | **+23,0%** | +2,33% | < 50% |
| DOGE (p99) | **+36,5%** | +3,14% | < 50% |

**Kết luận:** sau cực trị funding dương, giá trung bình **tiếp tục tăng** — cực trị funding trùng với trend mạnh, và đứng ngược nó là đứng chắn tàu. Điều này khớp với quan sát bull 2021: funding >0,05%/8h kéo dài nhiều tuần mà giá vẫn leo.

**Cách dùng đúng của funding (cập nhật doc 07):**
- 🟢 **Thước đo crowding** — feature cho model tự học tương tác với chế độ
- 🟢 **Nguồn thu carry** — không cần đoán hướng
- 🔴 **Tín hiệu đảo chiều đơn lẻ** — bị dữ liệu bác; nếu có giá trị timing thì chỉ khi **kết hợp** OI flush + drawdown, và phải tự backtest

> Đây chính là lý do tồn tại của quy trình phản biện: một mệnh đề nghe rất hợp lý, được lặp lại khắp nơi, nằm cả trong tài liệu của chính dự án — và sập khi gặp dữ liệu đầy đủ.

---

## 3 · CÂU TRẢ LỜI CHO "PHÂN TÍCH DỰ ĐOÁN NÀO CHÍNH XÁC NHẤT?"

### 3.1 Bất đối xứng số 1 của toàn lĩnh vực

**Dự báo ĐỘ LỚN biến động chính xác hơn dự báo HƯỚNG khoảng 100 lần** (tính theo R²):

| | Biến động | Hướng |
|---|---|---|
| Công cụ tốt nhất | HAR-RV (Corsi 2009) | Gradient boosting |
| OOS R² | **0,4–0,6** — *tái lập độc lập trên 700k nến 5m Binance: 0,512* | 0–1% đã là "xuất sắc" (Gu–Kelly–Xiu 2020) |
| Hit-rate hướng | — | trần thực tế **52–56%** khung ngày, 51–53% khung giờ |
| Vì sao | Vol tự tương quan 0,63–0,74, không có arbitrage trực tiếp triệt tiêu | Return ≈ martingale; hướng dự báo được thì bị arbitrage ăn ngay |

**Hệ quả thiết kế cho cryptopred:** đầu tư dự báo vol (cho position sizing) là khoản chắc ăn nhất của cả pipeline — chính là `expected_vol_pct` trong hợp đồng dữ liệu. Ghi chú trung thực: chế độ vol thấp 2023–2026, HAR OOS R² đo được chỉ 0,33–0,34.

### 3.2 Bức tường phí theo chân trời — toán hoà vốn (kiểm chứng độc lập trên dữ liệu Binance)

Trade mỗi bar, ăn trọn move, phí khứ hồi spot 0,20%: hit-rate hoà vốn `p > 0,5 + phí/(2·E|move|)`:

| Chân trời | E\|move\| đo được | Hit-rate hoà vốn | Phán quyết |
|---|---|---|---|
| 1 phút | ~0,04–0,05% | **250%** | bất khả thi tuyệt đối |
| 1 giờ | 0,393% | **75,4%** | không model nào đạt |
| 1 ngày | 2,33% | **54,3%** | sát trần 52–56% — chỉ lãi khi trade *chọn lọc* |
| 1 tuần | 6,58% | **51,5%** | dễ thở nhất |

⚠️ Chế độ vol thấp 2023–2026: E|move| ngày chỉ 1,71% → hoà vốn ngày lên **55,8%** — vượt trần. Càng củng cố: **trade chọn lọc (vùng chết) là điều kiện sinh tồn, không phải lựa chọn thẩm mỹ.**

**Sửa quan trọng từ phản biện:** tường phí trên là cho **spot**. Tín hiệu thực thi trên **USDT-M futures** chịu taker 0,05%/chiều → khứ hồi 0,10% — **một nửa rào cản**. Ngưỡng "edge < 0,3%/lệnh coi như không tồn tại" chỉ đúng cho spot; với perp là ~0,15–0,2%.

### 3.3 Xếp hạng độ chính xác theo chân trời (sau khi loại claim bị bác)

| Chân trời | Chính xác nhất (thống kê) | Thực dụng nhất (sau phí) |
|---|---|---|
| **Phút** | Order flow imbalance: 60–75% hướng mid-price vài tick (Cont 2014; DeepLOB) — **cao nhất toàn lĩnh vực, và vô dụng**: move 1–5bps < phí 10–25bps | không có gì |
| **Giờ** | Dự báo vol intraday (HAR) | tín hiệu event-conditional hiếm, thực thi perp |
| **Ngày** | **HAR-RV vol (R² ~0,5)** | GBT direction 52–56% trade chọn lọc; OI+giá làm filter |
| **Tuần–tháng** | Cross-sectional momentum (LTW, JF 2022: ~3%/tuần gross; **sống ở coin LỚN** — 4,2%/tuần nhóm trên median size vs 0,6% nhóm nhỏ) | bản long-only top thanh khoản — khả thi hơn báo cáo gốc ngụ ý |
| Chu kỳ | On-chain MVRV/SOPR: cơ chế đẹp, **n≈4 — không kiểm định thống kê được**; ngưỡng trôi mỗi chu kỳ | chỉ làm bối cảnh, không timing |

**Vì sao mọi accuracy >60% khung ngắn trên mạng gần như chắc chắn là leakage** — 6 cơ chế: fit scaler toàn sample · shuffle split trên cửa sổ chồng lấp · off-by-one · survivorship · không so baseline always-up · quên phí. Kiểm định lõi: variance-ratio BTC khung giờ đo được VR(2)=0,98, VR(24)=0,95 ≈ 1 — gần random walk; nếu 60% hướng khung giờ là thật, Sharpe annualized ~15, cả thế giới quant đã nghỉ hưu. *Baseline always-up cập nhật: 51,2% toàn Binance-era, chỉ 49,6% giai đoạn 2022–2026 — con số "~53%" đã lỗi thời.*

### 3.4 Deep learning & foundation models

- **DL giá thuần** (LSTM/Transformer): nơi sản sinh 90% accuracy dỏm 60–90% trên mạng. Làm sạch pipeline thì ≈ bằng hoặc kém gradient boosting, compute ×10. Cạm bẫy kỹ thuật riêng: batch/layer-norm tính thống kê qua trục thời gian = leakage ẩn.
- **Chronos/TimesFM**: ≈ random walk cho returns; chỉ dùng được phần dự báo **phân phối/quantile** cho vol. Khớp RULE 12 của dự án.
- **Đo "chính xác" đúng cách**: vol → QLIKE (Patton 2011), không phải MSE; hướng → hit-rate kèm Pesaran–Timmermann test + so baseline; giá trị kinh tế → Sharpe sau phí + Deflated Sharpe (Bailey–López de Prado) chống multiple testing.

---

## 4 · QUANT TIẾNG ANH — NHỮNG CON SỐ SỐNG SÓT QUA PHẢN BIỆN

| Chiến lược | Con số đã kiểm chứng độc lập | Nguồn |
|---|---|---|
| **TSMOM long/flat** ★ khả thi nhất cá nhân | Backtest lại BTC 2014–2026: MA20–200 + Donchian, khớp t+1, **phí đã trừ: Sharpe 1,07–1,32** vs buy-hold 0,96; DD bear −77…−83% giảm còn — nhưng MA50 vẫn chịu −60% do whipsaw; 7–18 lệnh/năm | tự backtest (verifier) |
| **Cross-sectional momentum** | LTW (JF 2022): long-short ~3%/tuần gross 2014–2020; **4,2%/tuần có ý nghĩa ở coin trên median size, 0,6% không ý nghĩa ở coin nhỏ** → long-only top thanh khoản là bản khả thi | NBER w25882, trích nguyên văn |
| **Funding carry** | Lịch sử thật từ API: Q1/2021 **66,3%/năm** · Q2/2021 28,3% · Q4/2021 25,1% · 2020: 7–23%; 2022 đa phần +2…+7%, chỉ 11/2022 âm. Hoà vốn baseline ~10–11,4 ngày | API Binance (verifier kéo 3.000 kỳ) |
| **Basis kỳ hạn** | BIS WP 1087 (đọc PDF gốc): trung bình **6–8%/năm**, thường xuyên >20%, "sometimes exceeding 40%" (đầu 2019, đầu 2020, **3/2021**); hội tụ tất định tại đáo hạn | BIS WP 1087 |
| **Vol risk premium** | Deribit 2019–20: IV ATM 30d cao hơn RV ~15 điểm vol (Alexander & Imeraj); gap thu hẹp mạnh hậu ETF 2023+; "nhặt xu trước xe lu" | SSRN 3383734 |
| **Market making** | Toán đóng cửa cho retail: maker spot VIP0 0,10% không rebate, spread BTC 1–2bps → **lỗ cấu trúc ~18bps/vòng** trước cả adverse selection | biểu phí Binance |
| **Seasonality trong ngày** | "Turn-of-the-candle": +0,58bps/phút dồn vào phút 0/15/30/45, t-stat >9 — thật nhưng cỡ bps: chỉ dùng làm **execution timing** (đừng vào lệnh đúng mốc funding 00/08/16 UTC) | PMC10015199 |
| **Stat-arb pairs** | "Cointegration" crypto phần lớn chỉ là beta chung BTC; break vĩnh viễn (LUNA, FTT) xoá sạch lãi tích luỹ; 4 lần khớp/vòng = 0,40% phí | kiến thức, không bị bác |
| **Low-beta/BAB** | Yếu nhất danh sách — nền tảng kinh tế (ràng buộc đòn bẩy) bị crypto x125 rút mất; bản sống được là **lọc lottery/MAX effect**: coin vừa có ngày +30–50% bị mua như vé số và underperform sau đó | kiến thức |

**Bộ lọc tổng cho cá nhân (đứng vững qua kiểm):** 1 vòng spot taker/tuần = **~10,4%/năm tiền phí**. Chiến lược quay vòng ngày chỉ tồn tại trên giấy.

---

## 5 · TRƯỜNG PHÁI BÁN LẺ TIẾNG ANH — TÁCH PHẦN THẬT KHỎI HUYỀN HỌC

Kết luận tổng: **không trường phái nào có kiểm chứng độc lập như một hệ thống hoàn chỉnh**, nhưng ~6 hiện tượng lõi bên dưới chúng là thật và đo được.

| Trường phái | Phần THẬT (có literature) | Phần HUYỀN HỌC | Phán quyết |
|---|---|---|---|
| **ICT/SMC** (đang thịnh nhất) | Stop cụm ngoài số tròn & swing (Osler 2000/2003, JF) → sweep-then-reclaim là hiện tượng thật; session timing | Order block = "1 nến dấu chân tổ chức" (tổ chức đi TWAP/iceberg, không để dấu 1 nến); FVG "phải được lấp" (mọi mức đều được revisit — base rate) | Giữ 2 feature, bỏ ontology |
| **Wyckoff** | Tích luỹ/phân phối là thật; spring/UTAD ≡ failed breakout đo được | Gán nhãn phase chỉ làm được hậu nghiệm | Giữ failed-breakout |
| **VSA** | Quan hệ volume–\|return\| (Karpoff 1987); climax volume | Hệ nhãn định tính không code nhất quán được — 2 người đọc ra 2 kết luận | Giữ volume z-score |
| **Elliott/Harmonic** | — | Đếm sóng không duy nhất → unfalsifiable; điểm đảo chiều **không** cụm tại mức Fib (Batchelor & Ramyar); thành tích Prechter gần bét bảng Hulbert | **Bỏ hoàn toàn** |
| **Supply/Demand zones** | S/R quanh số tròn & prior high/low là thật (cụm lệnh — Osler) | "Lệnh tổ chức nằm chờ hàng tuần tại zone" — sai cơ chế, order book động | Giữ khoảng-cách-tới-mức làm feature |
| **Price action nến** | — | Kiểm định kỹ nhất, kết quả xấu nhất: bootstrap chống data-snooping → không giá trị (Marshall et al. 2006); edge nếu có <0,1% < phí | Bỏ làm hệ thống |
| **Orderflow/CVD** ★ | **Nhiều chất thật nhất**: OFI→giá (Cont 2014); iceberg detection có literature; CVD tự tính miễn phí từ aggTrades | Đọc footprint "bằng mắt"; khối lượng tổ chức thật đi OTC không hiện trên tape | Giữ làm feature tổng hợp theo nến |
| **Bookmap** | Depth imbalance dự báo ở tick-horizon (micro-price, Stoikov) | Wall trên heatmap crypto có thể là spoof — offshore không ai phạt (Mỹ: án hình sự từ Dodd-Frank) | Không dùng wall làm tín hiệu |
| **Grid bot** | — | "Lãi mỗi ngày" = trả trước cho cú lỗ đuôi: cấu trúc **short-trend không được trả premium**; step 0,3% thì 2/3 lãi gộp là phí; *lưu ý phản biện: hoà vốn step = 1× phí khứ hồi (0,20% taker / 0,15% BNB), không phải 2× như finder nêu* | Hiểu là short-vol, không phải "không cần dự đoán" |
| **DCA bot safety-order** | — | Martingale trá hình: mô phỏng 20k episode — win-rate 93–99% **và kỳ vọng ÂM**; lệnh thua cuối −21…−66% vốn | Bỏ; win-rate cao chính là công cụ marketing |
| **Copy trading** | — | Hàm thưởng leader = quyền chọn (ăn 10–15% lãi, không chịu lỗ) → tối ưu của leader là martingale; leaderboard = survivorship; follower khớp sau chịu slippage một chiều | Bỏ |
| **Signal groups** | — | Nghịch lý revealed preference: edge thật thì không bán $50/tháng; nhánh xấu nhất là pump-and-dump có tổ chức (Xu & Livshits 2019, USENIX) | Bỏ |

**Vì sao chúng phổ biến dù bằng chứng yếu — kinh tế học bán khoá học:** doanh thu dạy trade là deterministic, lợi nhuận trade là stochastic → guru hợp lý chọn dạy; unfalsifiability là *feature* ("phương pháp đúng, bạn áp dụng sai" → mua tiếp khoá nâng cao).

**6 hiện tượng lõi sống sót → featurize cho M3:** ① sweep-and-reclaim/failed-breakout ② session/giờ UTC + mốc funding ③ volume z-score & climax ④ taker imbalance/CVD ⑤ khoảng cách tới số tròn & prior high/low ⑥ depth imbalance (lọc tuổi thọ wall). *Caveat chung: nền literature là FX/equity — phải tự replicate trên dữ liệu Binance trước khi tin.*

---

## 6 · CỘNG ĐỒNG VIỆT NAM — PHONG CÁCH, TOÁN HỌC, VÀ CẠM BẪY

Bối cảnh quy mô (đã kiểm nguồn): VN **hạng 5 thế giới** về chấp nhận crypto (Chainalysis 2024; 2025 lên hạng 4), **>200 tỉ USD** dòng giao dịch 7/2024–6/2025 — bất thường so với GDP.

### 6.1 Toán học cháy tài khoản — vì sao scalping đòn bẩy cao gần như chắc chắn về 0

Phong cách phổ biến nhất giới trẻ VN: futures x20–x125, kèo nhóm, "gồng". Bốn tầng toán (đã kiểm từng con số):

1. **Phí theo đòn bẩy:** phí tính trên notional → x125 mỗi lệnh ăn **12,5% margin** chỉ riêng phí khứ hồi; 10 lệnh/ngày = trả 125% vốn/ngày
2. **Khoảng cách thanh lý:** x125 thanh lý khi giá ngược **0,4–0,8%** (tính cả maintenance margin) — đúng bằng σ 1 giờ của BTC (0,53–0,75%): **nhiễu ngẫu nhiên đủ giết lệnh**, chưa cần đoán sai
3. **Compound:** kỳ vọng −1%/lệnh → sau 200 lệnh còn **13,4% vốn** (0,99²⁰⁰)
4. **Hoà vốn win-rate:** TP=SL=0,5% với phí 0,2% khứ hồi → cần thắng **đúng 70,0%** chỉ để hoà

Văn hoá "cháy tài khoản" được meme hoá ("ăn mì tôm", "ra đảo") khiến người mới coi cháy là học phí thay vì bằng chứng kỳ vọng âm.

### 6.2 Kinh tế học của "kèo" — vì sao nguồn cung thầy vô tận

Chủ nhóm sống bằng phí VIP (1–10 triệu VND/tháng) + **hoa hồng referral sàn tới 20–41% phí giao dịch của thành viên** → chủ nhóm được trả để thành viên **giao dịch nhiều**, không phải để thắng. Kèo đăng sau khi chủ đã vào lệnh → thành viên là thanh khoản thoát. Kèo thắng được pin, kèo thua bị xoá.

### 6.3 Xếp hạng EV thật cho người tham gia (phán quyết trung thực)

| EV | Hoạt động |
|---|---|
| **+EV thật (trần thấp)** | ① DCA-hold BTC/ETH nhiều năm bằng tiền nhàn rỗi — *beta, không phải alpha*; BTC dương với mọi cửa sổ ≥4 năm, nhưng mua đỉnh 11/2021 giữ 4,8 năm chỉ +15% (~3%/năm) ② Airdrop/retroactive — +EV rõ 2020–2023 (UNI ~1.200$/ví), nay EV/giờ dưới lương tối thiểu vì sybil filter ③ Binance Launchpad với BNB sẵn — +EV nhỏ, đều ④ *Đứng phía BÁN* (khoá học, kèo VIP, referral) — nghề +EV lớn nhất cộng đồng, và chính điều đó giải thích mọi thứ |
| **Trung tính → âm nhẹ** | Grid bot (≈ cầm coin trong range trừ phí + ảo giác lãi ngày) · Wyckoff/price action kỷ luật tốt (giá trị là risk management, không phải dự đoán) |
| **Máy xay tiền** | Scalping đòn bẩy cao (toán trên) · kèo VIP · săn "x100"/hidden gem (người phím được trả token giá thấp — chính họ là bên xả; case ViruSs–ZUKI) · copy ví cá voi (ví mồi công khai, gom ví kín xả ví nổi) · DCA-hold **altcoin** ("gồng lỗ altcoin là chiến lược mất vốn có kỷ luật" — phần lớn alt top-100 mùa 2017/2021 mất >90% không bao giờ về đỉnh) |
| **Lừa đảo tuyệt đối** | Cam kết lãi ngày: 1%/ngày = **×37,8/năm** — định nghĩa ponzi. Hồ sơ VN đã kiểm: **iFan/Pincoin 2018**: cam kết 48%/tháng, 32.000 người, ~15.000 tỉ đồng · **Mr Pips 2024**: 21→36 website giả sàn, 2.661 bị hại, kê biên ~5.200 tỉ · kịch bản "đọc lệnh": cho thắng-cho rút vài lần nhỏ rồi khoá rút khi nạp lớn |
| **Chi phí mới 2026** | **Thuế TNCN 0,1%/giá trị mỗi giao dịch** (Thông tư 32/2026/TT-BTC, hiệu lực 27/03/2026, pilot 5 năm theo NQ 05/2025) — tính **kể cả khi lỗ**; áp cho kênh được cấp phép trong nước, giao dịch sàn offshore là nghĩa vụ tự khai. Cộng vào bức tường phí: 1 lệnh/tuần từ ~1,3% lên ~1,7–2,2%/tháng |

### 6.4 Từ điển thuật ngữ — nghĩa thật

kèo = setup người khác phím (ẩn ý: không tự phân tích) · phím hàng = mách coin (người phím thường đã có vị thế) · gồng lãi/gồng lỗ = giữ lệnh lời/âm không stop (gồng lỗ là nguyên nhân cháy số 1, được văn hoá hoá thành "bản lĩnh") · đu đỉnh · bắt đáy ("bắt dao rơi") · xả hàng = phân phối · lùa gà = dụ người thiếu kinh nghiệm mua để mình xả · úp bô = xả thẳng lên đầu người mua theo (chủ động, nặng hơn lùa gà) · cháy = thanh lý sạch margin · về bờ = hoà vốn sau chuỗi lỗ · phím = tip · cá mập/tay to = tiền lớn.

---

## 7 · SMART MONEY / "INSIDE" — ĐO ĐƯỢC GÌ THẬT, ẢO TƯỞNG GÌ

### Dùng được (miễn phí, trễ thấp, từ chính Binance)

| Tín hiệu | Kết quả kiểm | Cách dùng |
|---|---|---|
| **Funding/OI/top-trader-vs-account ratio/taker flow** | Endpoint tồn tại đúng mô tả, miễn phí; top-trader *position* ratio lệch ngược account ratio đám đông = mẫu hình phân phối đáng backtest | Feature + filter cực trị (KHÔNG contrarian đơn lẻ — §2) |
| **CVD spot-vs-perp** | Tự tính từ aggTrades (cờ isBuyerMaker), phí 0, trễ ms; rally spot-dẫn bền hơn perp-dẫn — *practitioner-lore, phải tự backtest* | Ứng viên feature tốt nhất nhóm |
| **Unlock calendar** ★ | Keyrock, >16.000 sự kiện: **~90% kèm áp lực giá âm, phần lớn giảm trong 30 ngày TRƯỚC unlock**, dốc nhất tuần cuối, ổn định ~14 ngày sau (xác nhận qua hội tụ nhiều nguồn thứ cấp) | **Veto-filter: không long altcoin trong 30 ngày trước unlock lớn** |
| **Sự kiện nguồn cung ví công khai** | Đức bán 49.858 BTC (19/6–12/7/2024), Mt.Gox trả ~140k BTC từ 5/7/2024 — đọc được trước từ on-chain; nhưng "sell the news": đáy cục bộ rơi đúng cao điểm tin xấu | Risk-filter vài lần/năm, không phải alpha |

### Insider thật — có án, có số liệu

- **Coinbase/Wahi 2022–23**: PM mảng listing front-run ≥14 đợt công bố, lời ~1,5 triệu USD, **án 24 tháng tù** — vụ insider trading tiền số hình sự đầu tiên của Mỹ
- **SSRN 4184367** (146 listing Coinbase 2018–2022): ước tính **10–25% listing có dấu hiệu front-run** trước công bố
- Hàm ý khai thác được cho cá nhân: **NÉ, không đuổi** — thống kê listing Binance đã đổi dấu: dataset Coin98 2024: 30 token chỉ JUP xanh (1/30 = 3,3%); dataset PANews (37 token): 5/37 = 13,5% — *hai dataset khác nhau, đừng trộn (lỗi finder đã bị phản biện bắt)*; nhiều token −44…−90% (AEVO −88%) do cấu trúc low-float/high-FDV

### Ảo tưởng (vứt)

- **Copy ví "smart money"**: PnL top đến từ vị thế không sao chép được (sniper block đầu, insider, wash-trade); trễ thực tế phút–giờ trong khi MEV bot copy cùng block; Nansen không thấy flow trong sàn (ledger off-chain). *Phản biện: hướng đúng, mức "gần chắc chắn âm" chưa chứng minh được — vắng bằng chứng cả hai chiều*
- **Whale alert đơn lẻ**: phần lớn là chuyển nội bộ/custody (đợt Binance dồn ví proof-of-reserves 11/2022 tạo "inflow" tỉ USD không phải bán)
- **Đọc footprint tổ chức trên tape**: khối lượng thật đi OTC/RFQ; stream thanh lý Binance bị **throttle 1 lệnh/giây từ 2021** — mọi "liquidation heatmap" bán trên dashboard dựng từ dữ liệu thiếu (đã xác nhận qua tài liệu dev Binance)
- **Max pain quyền chọn**: không có backtest công khai nào cho thấy edge sau phí — content marketing

---

## 8 · HỆ QUẢ CHO CRYPTOPRED — VIỆC PHÁT SINH TỪ REVIEW

| # | Việc | Vào đâu | Lý do |
|---|---|---|---|
| 1 | ~~Funding contrarian~~ → funding làm **feature crowding + carry**, thử nghiệm *continuation* thay vì đảo chiều | Wave 1 (07 §D2) | §2 — dữ liệu bác chiều ngược |
| 2 | Thêm baseline **TSMOM (MA cross)** với con số đã kiểm: Sharpe net 1,07–1,32 — nếu ML không thắng nổi MA50, phải biết sớm | W8 (M5) | RULE 4 mở rộng |
| 3 | Thêm baseline **DCA-hold** | W8 | Câu hỏi trung thực nhất của người VN |
| 4 | **Unlock veto-filter**: không tín hiệu long altcoin trong 30 ngày trước unlock lớn | M13 RiskEngine | Keyrock ~90% |
| 5 | 6 hiện tượng lõi bán lẻ → feature M3 (sweep-reclaim, session, volume-z, taker-CVD, số tròn, depth) | Wave 2 | §5 |
| 6 | Tường phí **hai tầng**: spot 0,20% vs perp 0,10% khứ hồi — ngưỡng lọc tín hiệu theo lớp công cụ thực thi | M8 backtest config | Phản biện bác ngưỡng đơn |
| 7 | Cột **thuế VN 0,1%/giao dịch** vào cấu hình chi phí (tuỳ kênh) | `config/model.yaml → costs` | Thông tư 32/2026 |
| 8 | **HAR-RV** cho `expected_vol_pct` (thay vì chỉ EWMA) — R² 0,51 đã tái lập độc lập trên dữ liệu Binance | M5/M7 | §3.1 |
| 9 | Baseline always-up cập nhật theo giai đoạn (49,6% từ 2022) — đừng dùng hằng số 53% | M5 | §3.3 |
| 10 | Borrow cost cho mọi chân short (5–30%/năm, spike >100%) | M8 + 08 Phần E | Lỗ hổng đã xác nhận |

---

## 9 · HỒ SƠ CÁC CLAIM BỊ BÁC — giữ lại để không ai lặp lại

| Claim | Ai nêu | Vì sao bác |
|---|---|---|
| "Funding cực đoan → return 1–7 ngày sau ÂM, hit-rate contrarian 55–60%" | research-accuracy | Dữ liệu đầy đủ 4 coin cho chiều NGƯỢC LẠI (§2) |
| "Basis kỳ hạn từng 60%/năm, đỉnh Q2-2021" | research-en-quant | PDF gốc BIS WP 1087: "sometimes exceeding 40%", đỉnh 3/2021, trung bình 6–8% |
| "Vol targeting +0,2–0,4 Sharpe" | research-en-quant | Backtest độc lập 7 biến thể: delta −0,07…+0,11; chỉ phần cắt DD đứng vững |
| "Grid step phải > 2× phí (0,4–0,5%) mới có lãi" | review-gaps | Hoà vốn = 1× phí khứ hồi (0,20% taker/0,15% BNB) — sai gấp đôi |
| "30 token list Binance 2024, win rate 13,5%" | research-insight | Trộn 2 dataset: Coin98 = 1/30 (3,3%); PANews = 5/37 (13,5%) |
| "Ngưỡng edge <0,3%/lệnh coi như không tồn tại" (cho tín hiệu perp) | research-insight | Tường phí perp = 0,10% khứ hồi, không phải 0,20% — ngưỡng thổi phồng ×2 |
| *(không chắc)* "Copy ví lãi cao gần chắc chắn âm" · bảng xếp hạng trung tâm nguyên trạng | insight · accuracy | Hướng hợp lý nhưng chưa kiểm định lượng được / mắt xích funding phải sửa trước |

---

*Nguồn thô: 7 báo cáo + 56 phán quyết tại scratchpad phiên làm việc; các sửa đổi đã áp thẳng vào `07_PREDICTION_METHODS.md` và `08_TRADING_METHODS.md`. Tài liệu liên quan: `04_EXECUTION_STRATEGY` (WBS) · `docs/adr/`.*
