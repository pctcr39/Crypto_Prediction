# REVIEW & KẾ HOẠCH UX DASHBOARD

> Phiên bản 1.0 · 25/08/2026 · Review prototype `docs/design/dashboard-prototype.html`
> Mục tiêu: dashboard **thân thiện, dễ tương tác, thu hút** — mà không phản bội một luật trung thực nào của 00/02.
> Liên quan: `02_DESIGN_SYSTEM.md` (luật hiển thị) · `04_EXECUTION_STRATEGY.md §7` (WBS W15)

---

## 1. REVIEW PROTOTYPE — 9 PHÁT HIỆN

Prototype v1 đạt phần *đúng* (token, màu kiểm định, tách dự đoán/sự thật, trạng thái đủ) nhưng còn xa phần *đáng dùng hằng ngày*. Review theo con mắt một người dùng Binance quen thuộc:

| # | Phát hiện | Vì sao quan trọng | Trạng thái |
|---|---|---|---|
| **R1** | Trục tương lai ghi «+4h» trừu tượng, không phải giờ thật | Người dùng Binance đọc mọi thứ theo timestamp UTC; «+4h» bắt họ tự tính | ✅ **đã sửa v2** — trục tương lai ghi 16:00 · 18:00 UTC, tooltip vùng dự đoán ghi giờ thật |
| **R2** | Chỉ 3 tab khung (1h/4h/1d); Binance có 11+ | Cảm giác "đồ chơi" so với chart họ dùng hằng ngày | ✅ **v2 có UI** — thanh khung đầy đủ 1m→1w + quy tắc chiếu model (§3.2); logic dữ liệu thật ở W15a |
| **R3** | Không thấy model **từng nói gì** trên chart — chỉ có 1 dự đoán hiện tại | Đây vừa là lỗ hổng lòng tin vừa là cơ hội thu hút lớn nhất: track record công khai là thứ giữ người dùng quay lại | ✅ **v2 mô phỏng** — dải chấm tín hiệu quá khứ (viền tím, tô ✓/✗) + tooltip kết quả; dữ liệu thật cần W13 (§3.5) |
| **R4** | Không đếm ngược nến — Binance luôn có countdown | Countdown trả lời câu hỏi tự nhiên nhất: "bao giờ có dự đoán mới?" — lý do quay lại màn hình | ✅ **đã thêm v2** — «Nến đóng & dự đoán mới sau 54:43» |
| **R5** | Không zoom / pan / kéo xem lịch sử | Tương tác tối thiểu của một chart tài chính | ⬜ W15a — lightweight-charts v5 có sẵn, **không tự chế trên Canvas** |
| **R6** | Không có lớp giải thích cho người mới ("62% đã hiệu chỉnh" nghĩa là gì?) | "Thân thiện" với người không làm ML = mỗi con số dịch được ra tiếng người trong 1 chạm | ⬜ W15c |
| **R7** | Coin selector sơ sài: không ghim ưa thích, không giá mini, không sắp xếp | Người dùng thật có 3–5 coin theo dõi thường trực | 🔶 **v5 chọn coin đã hoạt động** (UX-14); ghim/sparkline/sort còn lại ở W15c |
| **R8** | Mobile mới chỉ "xếp chồng cho khỏi vỡ" | Phần lớn lượt xem giá là trên điện thoại | ⬜ W15c |
| **R9** | *Bug:* mô phỏng giá trôi vô hạn theo thời gian mở trang (ratchet high/low) | Mở trang 30 phút là hero lệch khỏi dải dự đoán → prototype tự mâu thuẫn | ✅ **đã sửa** — dao động hồi quy quanh mốc, đồng hồ quay vòng |

**Kết luận:** v2 đã xử lý toàn bộ nhóm *timestamp & track record* (R1–R4, R9). Phần còn lại (R5–R8) là việc của code thật W15 — prototype không nên chế lại thứ lightweight-charts cho không.

---

## 2. BA NGUYÊN TẮC — "THU HÚT BẰNG SỰ THẬT SỐNG ĐỘNG"

Dashboard này không được phép câu kéo kiểu casino. Sự thu hút phải đến từ chính chất liệu của sản phẩm:

1. **SỐNG** — màn hình luôn nhúc nhích một cách trung thực: giá tick realtime, countdown chạy, flash nền 150ms khi giá đổi. Không hoạt hoạ trang trí, không hiệu ứng giả realtime (DS-RULE 2).
2. **RÕ** — mọi con số dịch được ra tiếng người trong một chạm: tooltip của meter là câu "Trong 100 lần model nói ~62%, thực tế tăng 58 lần (n=340)", không phải định nghĩa Brier score.
3. **CHỨNG MINH ĐƯỢC** — track record nằm ngay trên chart, cả lúc model sai. Người dùng quay lại vì họ đang *theo dõi một cuộc thử nghiệm công khai*, không phải vì bị dụ.

**Guardrail chống dark-pattern (không thương lượng):** không confetti/âm thanh khi có tín hiệu · không ẩn các lần sai · KHÔNG RÕ hiển thị thoải mái như một câu trả lời bình thường · accuracy luôn kèm n= · mọi engagement idea vi phạm RULE 6/7/8 bị loại từ vòng ý tưởng.

---

## 3. TIMESTAMP & TIMEFRAME GIỐNG BINANCE — THIẾT KẾ CHỐT

### 3.1 Thanh khung đầy đủ
`1m · 5m · 15m · 30m · 1h · 2h · 4h · 6h · 12h · 1d · 1w` — dữ liệu nến mọi khung đều lấy thẳng từ Binance (miễn phí, đường giá không qua backend).

### 3.2 Model giữ nguyên 3 khung — và nói thật điều đó
Nói thẳng: **không mở model xuống 1m/5m.** Khung ngắn gần như random walk (RULE 11) và phí nuốt sạch edge intraday dày lệnh (RULE 5) — model 1m sẽ chỉ sản xuất nhiễu đắt tiền. Thay vào đó:

| Khung đang xem | Dự đoán hiển thị | Chip trung thực |
|---|---|---|
| 1m · 5m · 15m · 30m · 1h | model **1h** (horizon 4h) | «model 1h · chiếu lên khung 15m» |
| 2h · 4h · 6h | model **4h** (horizon 24h) | «model 4h · chiếu lên khung 2h» |
| 12h · 1d · 1w | model **1d** (horizon 1d) | «model 1d · chiếu lên khung 12h» |

Dải q10–q90 và đường q50 vẽ theo **giờ UTC tuyệt đối** nên tự khớp mọi khung — chỉ số nến tương lai thay đổi, timestamp không. Nếu sau này bạn vẫn muốn model riêng cho khung ngắn, đó là thay đổi master plan (thêm nhãn, thêm walk-forward, thêm gate) — quyết định riêng, không gói vào W15.

### 3.3 Trục thời gian — timestamp thật ở cả hai phía ranh giới
Vùng tương lai đánh nhãn giờ UTC thật (16:00 · 18:00), đường dự đoán neo đúng `valid_until`. «Bây giờ» là ranh giới duy nhất giữa sự thật và phỏng đoán — người xem không bao giờ phải tự quy đổi «+4h».

### 3.4 Countdown kép
«Nến đóng & dự đoán mới sau **mm:ss**» — đồng bộ server-time như Binance (lệch giờ máy người dùng phải được bù bằng `serverTime` của API).

### 3.5 Dự đoán theo TOÀN BỘ timestamp — dải tín hiệu quá khứ
Mỗi nến đã đóng đều từng có một dự đoán. Thiết kế: hàng chấm dưới chart, mỗi chấm một nến có tín hiệu — **viền tím** (vật của model, RULE 7), **tô xanh ✓ / đỏ ✗** theo kết quả (ngữ nghĩa PnL), nến im lặng không có chấm. Hover nến → tooltip ghép «Tín hiệu 09:00: ▼ GIẢM 61% → ✓ đúng».

**Hệ quả kiến trúc (quan trọng):** cần dữ liệu từ PredictionStore + OutcomeReconciler (W13) và một endpoint **mới** phải bổ sung vào hợp đồng API M9:

```
GET /api/predictions/history?symbol=&timeframe=&limit=200
→ [{predicted_at, direction, p_up_calibrated, outcome, hit}, …]
```

### 3.5b Nhịp dự đoán — chốt phương án C (25/08/2026)

Người dùng kỳ vọng "dự đoán realtime liên tục". Ba phương án đã cân nhắc:

| | Cách | Được | Mất |
|---|---|---|---|
| A | Model khung ngắn hơn (5m/15m) | tần suất thật | hit-rate về ~51%; hoà vốn khung phút cần **250%** (`09 §3.2`) |
| B | Dự đoán "tạm tính" trong nến | cảm giác liên tục | phải train thêm bộ feature cho nến dở dang; người xem neo vào số tạm |
| **C ✅** | **Model chạy khi nến đóng · lớp bám sát chạy từng giây** | realtime thật, trung thực, rẻ | `p_up` không nhảy — nhưng nó *không nên* nhảy |

**Lý do kỹ thuật chọn C:** ① model huấn luyện trên nến ĐÃ ĐÓNG — nến đang hình thành là dữ liệu out-of-distribution; ② 44/45 feature tính từ nến đã đóng, đứng yên suốt cả nến; ③ số rung lắc trông như thông tin nhưng là nhiễu (RULE 8).

> **Tần suất cập nhật không làm dự đoán mới hơn — chỉ làm nó ồn hơn.** Một dự đoán cho mốc 18:00 vẫn là dự đoán cho 18:00, dù tính lại 1 lần hay 3.600 lần.

**Cái gì cập nhật từng giây mà không nói dối:** giá/sổ lệnh/tape (đo đạc) · vị trí giá trong dải · % quãng đường tới q50 · thời gian còn lại · trạng thái bám sát · uPnL. **Cái gì đứng yên:** câu trả lời của model.

### 3.6 Kết nối Binance — hai tầng, hai số phận

| Tầng | Là gì | Khi nào có thật |
|---|---|---|
| **Dữ liệu (read-only)** | Giá, sổ lệnh `@depth`, khớp lệnh `@aggTrade` — WebSocket công khai, **không cần API key** | W15a — trình duyệt nối thẳng Binance (đúng kiến trúc 3 đường của 00 §2) |
| **Đặt lệnh** | BUY/SELL động tới tiền | M13 (RiskEngine) → M14 (Executor), chỉ sau GATE 1–4; khởi động lại luôn về TẮT (RULE 9). Prototype và giai đoạn đầu chạy **PAPER** |

Prototype luôn mô phỏng cả hai tầng vì artifact chặn mạng ngoài (CSP) — đây là giới hạn của môi trường publish, không phải của thiết kế.

---

## 4. DANH MỤC NÂNG CẤP — XẾP ƯU TIÊN

| ID | Nâng cấp | Giá trị | Effort | Gói | Trạng thái |
|---|---|---|---|---|---|
| UX-1 | Timestamp thật ở trục tương lai + tooltip | ★★★ | XS | — | ✅ v2 |
| UX-2 | Thanh khung 1m→1w + chiếu model + chip trung thực | ★★★ | S | W15a | ✅ **v4 đầy đủ** — đổi tab là đổi nến/model/horizon/countdown thật; đích ngoài màn hình ghi «→ đích hh:mm» thay vì vẽ sai; model 1d demo trạng thái KHÔNG RÕ (vùng chết) |
| UX-3 | Dải tín hiệu quá khứ + tooltip kết quả | ★★★ | M | W15b | ✅ v2 (mô phỏng) |
| UX-4 | Countdown nến & dự đoán kế | ★★★ | XS | — | ✅ v2 |
| UX-5 | Zoom / pan / kéo lịch sử (lightweight-charts v5) | ★★★ | S | W15a | ⬜ |
| UX-6 | Lớp giải thích: tooltip tiếng người, «?» mỗi panel, tour 3 bước lần đầu mở | ★★★ | M | W15c | ⬜ |
| UX-7 | Coin selector: ghim ★, giá mini + sparkline 24h, sort theo volume/%/tên | ★★ | M | W15c | ⬜ |
| UX-8 | «Báo tôi khi có tín hiệu» → deep-link Telegram bot (nối M12) | ★★ | S | W16 | ⬜ |
| UX-9 | Mobile thật: coin selector thành bottom-sheet, panel phải tab hoá, chart ưu tiên chiều cao | ★★ | M | W15c | ⬜ |
| UX-10 | Share card PNG một dự đoán (kèm timestamp, n=, disclaimer) | ★ | S | P3 · tuỳ chọn | ⬜ |
| UX-11 | **PredictionCard v3:** bảng dự đoán theo từng mốc giờ + lợi nhuận % mỗi mốc, profit hero (kèm sau-phí 0.30% khứ hồi), dải kịch bản q10↔q90 + RR | ★★★ | S | W15b | ✅ v3 |
| UX-12 | **Đường dự đoán nổi bật hơn:** 3px + quầng sáng tím, chấm mốc từng giờ, pill đích trên trục giá ghi q50 + % kỳ vọng | ★★ | XS | W15a | ✅ v3 |
| UX-13 | Ma trận hiệu năng theo khung (đúng hướng · PF · n cho 1h/4h/1d) thay AccuracyPanel đơn khung | ★★ | S | W15b | ✅ v3 (mô phỏng) |
| UX-14 | **Chọn coin hoạt động thật (v5):** đổi coin là đổi toàn bộ thang giá/nến/ATR/setup; quantile model là **%** nên một model phục vụ mọi coin (demo sống RULE 1); SOL demo GIẢM, DOGE demo KHÔNG RÕ, TUT hiện banner «ngoài tập huấn luyện» | ★★★ | M | W15a | ✅ v5 |
| UX-15 | **TradeSetupCard (v5):** vốn + rủi ro%/lệnh do người dùng nhập → SL 1.5×ATR14, TP q90/q10, RR, khối lượng (trần bằng vốn), lãi/lỗ USDT đã trừ phí, thoát hạn theo horizon — đúng 3 lối ra M13; SHORT ghi «cần futures»; KHÔNG RÕ → «model đứng ngoài»; chip **auto-trade TẮT**, không có nút đặt lệnh (RULE 9) | ★★★ | M | W15b + M13 | ✅ v5 |
| UX-16 | **BUY/SELL chế độ PAPER (v6):** nút Mua/Bán kiểu Binance, ví ảo 10.000 USDT, %-nhanh 25–100, khớp mô phỏng phí taker 0.10%/chiều, giá vào trung bình, uPnL sống theo tick, **vạch VỊ THẾ trên chart**; bán khi ví trống → thông điệp spot; chip «chưa kết nối Binance» | ★★★ | M | W15b → nối M13 paper thật | ✅ v6 |
| UX-17 | **Sổ lệnh + khớp lệnh kiểu Binance (v6):** 6 asks/6 bids kèm thanh depth, mid + mũi hướng, tape chảy ~0.9s/lệnh, thanh tỷ lệ Mua/Bán (tiền thân trực quan của feature `taker_buy_ratio` G3). Bản thật W15a nối WS công khai @depth · @aggTrade, không cần API key — artifact CSP chặn mạng ngoài nên prototype mô phỏng | ★★ | M | W15a | ✅ v6 (mô phỏng) |
| UX-18 | **Lớp bám sát — phương án C (v7):** dự đoán **khoá lại khi nến đóng** (tính từ nến ĐÃ ĐÓNG, đóng băng cho tới nến kế); lớp bám sát cập nhật **từng giây** bằng số học trên dự đoán đã khoá: quãng đường đã đi vs thời gian đã trôi (2 thanh so kè), vị trí giá trong dải q10–q90, còn phải đi bao nhiêu tới q50 (đổi nhãn khi đã vượt), uPnL nếu vào lệnh lúc chốt (KHÔNG RÕ → không tính), trạng thái 6 mức: đang bám · nhanh hơn · chậm hơn · đi ngược · đã chạm đích · ra ngoài dải | ★★★ | M | W15b | ✅ v7 |
| UX-19 | **Cấu trúc 3 tab (v8):** Giao dịch · Dự đoán · Thị trường — canvas của pane ẩn được vẽ lại khi hiện (clientWidth=0 khi hidden) | ★★ | S | W15a | ✅ v8 |
| UX-20 | **Nón phân vị thay dải ±1σ phẳng:** 3 lớp lồng nhau q10–q90 / q25–q75 / q40–q60, CÙNG màu `--pred` chỉ đổi alpha, loe theo √k, dùng phân vị THỰC NGHIỆM (không giả định chuẩn) | ★★★ | M | W15a | ✅ v8 |
| UX-21 | **Nón khí hậu học (baseline câm)** vẽ dưới nón model + panel so sánh độ sắc nét q10–q90 vs q10–q90 — bài kiểm tra rẻ nhất và tàn nhẫn nhất cho mọi hệ dự báo phân vị | ★★★ | S | W15a | ✅ v8 |
| UX-22 | **Chùm 24 kịch bản (block bootstrap khối 4 nến)** — giữ được biến động cụm; 3 đường gần q10/q50/q90 gắn nhãn CHỮ; nút rút lại để thấy bản chất ngẫu nhiên | ★★★ | M | W15b | ✅ v8 |
| UX-23 | **Phong vũ biểu biến động** — RV đo được vs dự báo EWMA, dải chế độ thấp/thường/bão, một trục y duy nhất (`09 §3.1`: thứ dự báo chính xác nhất) | ★★ | M | W15b | ✅ v8 |
| UX-24 | **Hộ chiếu model & 4 cổng** — 19 tiêu chí chép nguyên văn `00 §7`, mọi ô ghi «—» vì chưa có model để chấm; chip «TIỀN THẬT: ĐANG KHOÁ» | ★★★ | S | — | ✅ v8 |
| UX-25 | **Băng bối cảnh 6 ô** (funding · OI · CVD · sổ lệnh · biến động · thanh lý) kèm sparkline + chấm độ tươi riêng từng ô | ★★ | S | W15a | ✅ v8 |
| UX-26 | **Đồng hồ funding** thang phi tuyến asinh (vừa thấy vùng ±0,01% vừa chứa cực trị) + z-score n=96 + histogram 96 kỳ + đếm ngược | ★★★ | M | W15a | ✅ v8 |
| UX-27 | **OI × giá — 4 góc phần tư** với vệt 12 điểm gần nhất; chỉ điểm hiện tại có nhãn chữ | ★★★ | M | W15a | ✅ v8 |
| UX-28 | **Nhịp tim thị trường** (giao dịch/giây, USDT/giây, cột mua-trên/bán-dưới, ô sọc cho giây im lặng) + **dòng thanh lý realtime** từ `!forceOrder@arr`, ghi rõ Binance throttle 1 lệnh/giây nên dữ liệu ĐẾM THIẾU | ★★ | M | W15a | ✅ v8 |
| UX-29 | **Nút chế độ bố cục (v9):** «⊞ Gộp 1 trang» ⇄ «⊟ Tách tab». Chế độ gộp: 3 pane xếp dọc với vạch tiêu đề khu vực, navtab thành mục lục cuộn (scrollIntoView), panel thị trường sống mọi lúc; canvas vẽ lại khi từ ẩn sang hiện. Lựa chọn nhớ bằng localStorage `cryptopred-layout` (cùng `cryptopred-lang` là hai khoản lưu duy nhất của trang), đã cập nhật câu chân trang cho khớp | ★★ | S | W15a | ✅ v9 |
| UX-30 | **Nowcast · nhịp tick (v10):** điểm tổng hợp ±100 từ 5 thành phần chuẩn hoá ATR (EMA20 dev · MACD/ATR · RSI · ROC6 · taker), tính lại MỖI tick và CỐ Ý dùng nến đang chạy; kim gauge + sparkline 300 điểm + hai ô «vs dự đoán khoá». Ghi thẳng trên card: đọc số tức thời, không phải model, không đọc thành xác suất (RULE 6) — đáp ứng «real time liên tục» mà không phá phương án C | ★★★ | M | W15a | ✅ v10 |
| UX-31 | **Bàn phương pháp dự đoán (v10):** 8 họ phương pháp (TSMOM · Donchian · mean-reversion z(MA20) · chế độ biến động · funding crowding · dòng OI · CVD taker · baseline lịch sử) chấm ▲/■/▼ live kèm nhãn bằng chứng 🟢/🟡 và ghi chú lấy từ kiểm toán 07/09 (kể cả phán quyết funding TIẾP DIỄN) + thanh đếm phiếu — chú thích «đếm phiếu, không phải xác suất» | ★★★ | M | W15a | ✅ v10 |
| UX-32 | **Thông số kỹ thuật chuyên nghiệp (v10):** 17 chỉ báo / 4 nhóm (động lượng · xu hướng · biến động · khối lượng-dòng lệnh) tính từ nến ĐÃ ĐÓNG đúng công thức kinh điển (Wilder RSI/ATR · Stoch · MACD chuẩn hoá ATR · EMA ratio · Donchian · Bollinger width/%B · RV/Parkinson · volume z · OBV · taker) — đúng bộ feature 00 §4.3, chân card dẫn 07 §A1 «chỉ báo đơn lẻ gần như vô dụng» | ★★ | M | W15a | ✅ v10 |
| UX-33 | **Song ngữ VI ⇄ EN (v10):** nút EN/VI đổi toàn trang không reload — 70 chuỗi tĩnh (`data-i`, bản VI tự chụp từ DOM), ~170 chuỗi động qua `T()` (kể cả nhãn canvas), cả `aria-label`/`placeholder`/`title`. Thuật ngữ đối chiếu chuẩn UI Binance VI/EN bằng workflow 3 agent (2 bảng độc lập + giám khảo · 130 mục · 29 phán quyết); sửa 45+ chỗ lệch chuẩn ở bản VI: GATE 3 «Tiền ảo»→«Giao dịch mô phỏng», «Khớp lệnh gần đây»→«Giao dịch thị trường», «uPnL»→«PNL chưa thực hiện», «Giá vào trung bình»→«Giá vào lệnh», «Giữa»→«Trung vị», «vùng chết»→«vùng không vào lệnh», «lệnh/giây»→«giao dịch/giây», «bị TL»→«bị thanh lý», «Chậm»→«Trễ», «%/năm»→«APR», dấu phẩy→dấu chấm thập phân… Lưu localStorage `cryptopred-lang` | ★★★ | L | W15a | ✅ v10 |

### 4.1 Tham chiếu trình bày — VishvaAlgoAI (bài Medium v36.2)

Người dùng chỉ định tham chiếu bài "v36.2 Neural Trading Bot — 79.6% win rate, 3.33 PF". Những gì **mượn về cách trình bày** (đã vào v3): geometry rõ ràng từng tín hiệu (giá theo mốc giờ, dải kịch bản, RR — họ ghi entry/SL/TP/RR ngay trong mỗi alert) · ma trận hiệu năng theo từng khung (win rate · PF · expectancy · n — bảng "promotion matrix" của họ) · phí khứ hồi ghi cạnh lợi nhuận (họ tính 0.60% notional; ta 0.30% theo RULE 5).

Những gì **không mượn**: con số tiêu đề. RULE 11 của ta coi mọi win-rate cao ở khung ngắn là nghi vấn cho tới khi qua bộ dò rò rỉ — và công bằng mà nói, chính bài đó cũng giữ lane 3m ở chế độ nghiên cứu vì LCB95 âm (n=103 cho lane 15m là cỡ mẫu mỏng). Dashboard của ta hiển thị kịch bản kèm n=, không hiển thị lời hứa.

---

## 5. WIREFRAME SAU NÂNG CẤP

**Desktop (≥1280):** giữ khung 3 cột của 02 §5. Hàng lọc trên chart: thanh khung 11 mức + chip model + nút bảng. Dưới chart: dải tín hiệu quá khứ (cùng canvas). Panel phải thêm nút «?» ở mỗi card mở giải thích ngắn.

**Mobile (<768):** header giá (hero + countdown ghim trên cùng) → chart cao ≥ 55vh, thanh khung cuộn ngang → PredictionCard → nút «Báo tôi khi có tín hiệu» → lịch sử. Coin selector = bottom-sheet mở từ nút cạnh symbol. Vùng chạm ≥44px giữ nguyên.

---

## 6. THỰC THI — W15 TÁCH BA GÓI

| Gói | Nội dung | Ước lượng | Phụ thuộc | DoD |
|---|---|---|---|---|
| **W15a** Chart core | lightweight-charts v5 · 3 luồng dữ liệu tách file (02 §M11) · thanh khung 11 mức + chiếu model · timestamp thật · zoom/pan · countdown đồng bộ serverTime | 2.5d | W12 (API) | Mọi khung hiển thị đúng; chip nói thật; 1 giờ chạy không rò bộ nhớ |
| **W15b** Track record | endpoint `predictions/history` (thêm vào M9) · dải tín hiệu quá khứ · accuracy overlay · SignalHistoryTable nối dữ liệu thật | 1.5d | **W13** (PredictionStore + OutcomeReconciler) | Chấm ✓/✗ khớp 100% với reconciler; accuracy kèm n= |
| **W15c** Thân thiện | lớp giải thích + tour 3 bước · coin selector nâng cấp · mobile thật · trạng thái rỗng/lỗi/skeleton | 1.5d | W15a | Checklist 02 §6 tick đủ; người mới hiểu «62% đã hiệu chỉnh» sau ≤1 tooltip |

Tổng ~5.5d — thay dòng W15 (5d) trong `04 §7`; đường găng không đổi (vẫn sau W13).

**Việc phát sinh ngoài W15:** ① thêm endpoint history vào hợp đồng API khi làm W12 · ② M12 nhận thêm deep-link «Báo tôi» (UX-8) · ③ prototype v2 là tài liệu sống — mọi thay đổi thiết kế cập nhật vào đó trước, code thật theo sau.

---

## 7. ĐO THÀNH CÔNG

- **Hiểu:** người chưa từng thấy sản phẩm giải thích được «▲ TĂNG 62%» sau ≤ 1 tooltip.
- **Nhanh:** mở trang → chart + dự đoán đầu tiên < 3s trên mạng thường.
- **Bền:** 1 giờ chạy liên tục không rò bộ nhớ; rút mạng → «Mất kết nối» trong ≤ 5s (DoD M11 giữ nguyên).
- **Trung thực:** KHÔNG RÕ xuất hiện tự nhiên; các lần ✗ sai hiển thị ngang hàng với ✓ đúng; không con số nào thiếu n=.

---

*Liên quan: `02_DESIGN_SYSTEM.md` · `04_EXECUTION_STRATEGY.md` · prototype: `docs/design/dashboard-prototype.html`*
