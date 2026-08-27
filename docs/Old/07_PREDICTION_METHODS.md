# TOÀN CẢNH PHƯƠNG PHÁP DỰ ĐOÁN HƯỚNG GIÁ CRYPTO — VÀ CHIẾN LƯỢC CHỌN

> Phiên bản 1.0 · 25/08/2026
> Mục đích: liệt kê **đầy đủ** các họ tín hiệu và họ mô hình đang được dùng để dự đoán hướng giá crypto, đánh giá trung thực từng cái, rồi chốt **chiến lược áp dụng theo đợt** cho dự án này.
> Quan hệ: `00_MASTER_PLAN §4.3` liệt kê 9 nhóm feature của Wave 0 · tài liệu này mở rộng ra toàn bộ không gian và xếp thứ tự các đợt tiếp theo.

---

## 0. KHUNG ĐÁNH GIÁ — ĐỌC TRƯỚC

Mọi phương pháp bên dưới được chấm theo **năm trục**. Không có trục nào thay thế được trục khác.

| Trục | Nghĩa |
|---|---|
| **Nguồn** | Lấy dữ liệu ở đâu · miễn phí hay trả tiền · Binance có sẵn không |
| **Chân trời** | Tín hiệu sống được bao lâu — giây, giờ, ngày, hay tháng |
| **Bằng chứng** | Có nghiên cứu độc lập chứng minh không, hay chỉ là folklore của trader |
| **Chi phí** | Ngày công + tiền + **bề mặt rò rỉ mới** phát sinh |
| **Hợp dự án** | Có sống nổi qua phí 0,30% khứ hồi và bộ kiểm định M6 không |

**Ba mức bằng chứng dùng xuyên suốt:**

- 🟢 **Vững** — có literature độc lập, tái lập được, cơ chế kinh tế rõ
- 🟡 **Hỗn hợp** — có bằng chứng nhưng phụ thuộc chế độ thị trường, dễ mòn
- 🔴 **Yếu** — chủ yếu là folklore, hoặc bằng chứng chỉ tồn tại trong backtest chưa trừ phí

> **Cảnh báo xuyên suốt:** phần lớn "phương pháp" lưu hành trên mạng thuộc nhóm 🔴, và gần như toàn bộ chúng sụp đổ khi bật phí giao dịch (RULE 5). Bảng dưới cố ý nói thẳng điều đó.

---

# PHẦN A · CHÍN HỌ NGUỒN TÍN HIỆU

Phân loại theo **nguồn dữ liệu**, không theo tên chỉ báo — vì mỗi nguồn là một pipeline riêng, một bề mặt rò rỉ riêng, một khoản chi phí riêng.

---

## A1 · Giá & khối lượng (OHLCV)

Nguồn rẻ nhất, sẵn nhất, và cũng bị khai thác nhiều nhất — nên edge còn lại mỏng.

| Phương pháp | Cơ chế | Chân trời | Bằng chứng |
|---|---|---|---|
| **Động lượng (momentum)** | Xu hướng có quán tính do dòng tiền vào chậm | ngày–tháng | 🟢 vững nhất trong nhóm; time-series momentum có literature dày |
| **Đảo chiều ngắn hạn (mean reversion)** | Thanh khoản tạm cạn rồi hồi | giờ | 🟡 mạnh ở khung phút, mòn nhanh ở khung giờ |
| **Biến động cụm (vol clustering)** | Biến động tự tương quan mạnh | mọi khung | 🟢 **vững nhất toàn bảng** — nhưng dự đoán *độ lớn*, không phải *hướng* |
| **Phá vỡ biên (breakout)** | Dừng lỗ dồn ngoài biên | giờ–ngày | 🟡 nhiều tín hiệu giả; cần lọc bằng khối lượng |
| **Chỉ báo TA cổ điển** (RSI, MACD, Bollinger, Stoch) | biến đổi phi tuyến của giá | giờ–ngày | 🔴 **đơn lẻ gần như vô dụng**; chỉ có giá trị làm *feature* cho model |
| **Hình nến Nhật** (doji, engulfing…) | tâm lý phiên | giờ | 🔴 không tái lập được trong nghiên cứu nghiêm túc |
| **Sóng Elliott, Fibonacci, Gann** | — | — | 🔴 không có cơ chế kiểm chứng; loại |
| **Mùa vụ trong ngày/tuần** | giờ giao dịch Á–Âu–Mỹ, funding 8h | giờ | 🟡 có thật ở crypto vì hoạt động 24/7 nhưng dòng tiền thì không |
| **Chu kỳ halving** | cung phát hành giảm | tháng–năm | 🟡 chỉ 4 quan sát trong lịch sử — **cỡ mẫu không đủ để kết luận** |

> **Nói thẳng về TA:** RSI 14 vượt 70 không dự đoán được gì. Nhưng "RSI 14 ở phân vị 95 của 30 ngày, trong khi biến động ở phân vị 20, và coin đang mạnh hơn BTC" thì có thể có tín hiệu. **Sức mạnh nằm ở tổ hợp phi tuyến, không ở chỉ báo đơn lẻ** — và đó chính xác là việc của gradient boosting.

**Trạng thái dự án:** ✅ đây là Wave 0, 9 nhóm feature đã đặc tả ở `00 §4.3`.

---

## A2 · Vi cấu trúc & sổ lệnh

| Phương pháp | Cơ chế | Chân trời | Bằng chứng |
|---|---|---|---|
| **Tỉ lệ taker mua/bán** | ai đang chủ động vượt spread | phút–giờ | 🟢 vững; cơ chế rõ ràng |
| **Order Flow Imbalance (OFI)** | chênh lệch bổ sung/rút thanh khoản hai bên | giây–phút | 🟢 vững trong literature vi cấu trúc |
| **Mất cân bằng sổ lệnh (book imbalance)** | tổng khối bid vs ask | giây–phút | 🟡 dễ bị spoofing đánh lừa |
| **Phân bố cỡ lệnh** | lệnh lớn = tổ chức, nhỏ = nhỏ lẻ | phút–giờ | 🟡 |
| **VPIN / toxicity** | tỉ lệ dòng lệnh có thông tin | phút | 🟡 tính toán nặng |
| **Thanh lý (liquidations)** | cascade dừng lỗ đòn bẩy | phút–giờ | 🟢 vững; **cực mạnh ở đuôi phân phối** |

> **Cạm bẫy chí mạng:** phần lớn edge vi cấu trúc sống ở khung **giây–phút** và **chết sạch** khi trừ phí 0,10%/chiều. Chỉ nên dùng chúng dưới dạng **tổng hợp theo nến** (aggregate) làm feature cho khung 1h, không dùng để giao dịch trực tiếp.

**Trạng thái dự án:** 🔨 `taker_buy_ratio` đã có trong `features.yaml`, lấy từ cột 9 endpoint klines (khoảng trống G3, làm ở W1).

---

## A3 · Phái sinh — ★ NHÓM GIÁ TRỊ NHẤT CHƯA KHAI THÁC

**Đã kiểm chứng ngày 25/08/2026: cả bốn endpoint dưới đây MIỄN PHÍ, KHÔNG cần API key.**

| Tín hiệu | Endpoint Binance | Cơ chế | Bằng chứng |
|---|---|---|---|
| **Funding rate** | `/fapi/v1/fundingRate` | Phe đông phải trả tiền phe ít → đo mức chen chúc của đòn bẩy | 🟢 như **thước đo crowding + nguồn thu carry**. ⚠️ Còn mệnh đề «cực đoan → đảo chiều» đã bị **kiểm toán 25/08 bác trên dữ liệu**: toàn bộ lịch sử funding BTC/ETH/SOL/DOGE (2019–2026) cho thấy sau cực trị p95–p99, return 1–7 ngày trung bình **DƯƠNG** (tiếp diễn — SOL p99: +23%/7d), hit-rate contrarian đa số <50%. Cực trị funding trùng trend mạnh; dùng ngược chiều đơn lẻ là đứng chắn tàu |
| **Open Interest** | `/futures/data/openInterestHist` | Vốn mới vào hay vị thế đang đóng | 🟢 vững khi **ghép với giá**: giá↑ + OI↑ = tiền mới; giá↑ + OI↓ = đóng short |
| **Long/Short account ratio** | `/futures/data/globalLongShortAccountRatio` | Nhỏ lẻ đang nghiêng bên nào | 🟡 tín hiệu **ngược chiều** — đám đông thường sai ở cực trị |
| **Taker long/short ratio** | `/futures/data/takerlongshortRatio` | Áp lực chủ động trên futures | 🟢 vững |
| **Basis** (futures − spot) | tính từ 2 nguồn | Kỳ vọng và chi phí mang | 🟢 vững |
| **Thanh lý realtime** | WS `!forceOrder@arr` | Cascade | 🟢 vững |
| Độ nghiêng quyền chọn (skew), gamma | Deribit API | Phòng hộ của dealer | 🟡 chỉ có BTC/ETH; phức tạp |

**Mẫu dữ liệu thật lấy được:**
```
fundingRate      0.00005818  (0,0058%/8h → 6,4%/năm — đòn bẩy long đang trả phí)
sumOpenInterest  108.067 BTC (≈ 8,5 tỉ USD)
longShortRatio   0.9223      (nhỏ lẻ đang nghiêng SHORT)
buySellRatio     0.9371      (taker đang nghiêng bán)
```

> **Vì sao nhóm này đáng giá nhất:** nó đo **vị thế và đòn bẩy** — thứ mà giá và khối lượng không cho biết. Hai thị trường có cùng đường giá nhưng khác funding và OI là hai thị trường hoàn toàn khác nhau về rủi ro squeeze. Và nó **miễn phí**.

**Trạng thái dự án:** ⬜ chưa có trong kế hoạch. **Đề xuất thành Wave 1** — xem Phần D.

---

## A4 · On-chain

| Tín hiệu | Cơ chế | Chân trời | Bằng chứng |
|---|---|---|---|
| **Dòng vào/ra sàn** (exchange netflow) | coin vào sàn = chuẩn bị bán | ngày | 🟡 tốt nhất nhóm nhưng nhiễu vì chuyển nội bộ |
| **MVRV, SOPR, NUPL** | lãi/lỗ chưa thực hiện của toàn mạng | tuần–tháng | 🟡 hữu ích ở **đỉnh/đáy chu kỳ**, vô dụng ở khung ngày |
| Địa chỉ hoạt động, hashrate | sức khoẻ mạng lưới | tháng | 🟡 chậm |
| Ví cá voi | tiền lớn di chuyển | ngày | 🔴 rất nhiễu; phần lớn là chuyển giữa ví của cùng chủ |
| Stablecoin supply | thanh khoản chờ vào | tuần | 🟡 |
| TVL, DEX volume | hoạt động DeFi | tuần | 🟡 chỉ hợp altcoin |

**Chi phí thực tế:** Glassnode/CryptoQuant khoảng 30–800 USD/tháng · Dune có bậc miễn phí nhưng phải tự viết SQL · node riêng thì tốn công vận hành.

> **Cạm bẫy lớn nhất của on-chain: độ trễ công bố.** Nhiều chỉ số on-chain được tính lại và **công bố trễ vài giờ tới vài ngày**. Backtest dùng giá trị "tại thời điểm t" trong khi thực tế tới t+6h mới biết = **rò rỉ tương lai kinh điển**. Nếu dùng, bắt buộc phải có bảng độ trễ từng chỉ số và shift theo đó.

**Trạng thái dự án:** ⬜ `00 §3.3` đã xếp Dune vào "giai đoạn 2, khi sẵn sàng trả phí". Giữ nguyên.

---

## A5 · Liên thị trường & vĩ mô

| Tín hiệu | Cơ chế | Chân trời | Bằng chứng |
|---|---|---|---|
| **Lợi suất BTC** | BTC kéo cả thị trường | mọi khung | 🟢 **vững nhất toàn bộ tài liệu này** |
| **Lợi suất vượt trội so với BTC** | sức mạnh tương đối thật | giờ–ngày | 🟢 vững |
| **Beta 30 ngày với BTC** | độ nhạy theo chế độ | ngày | 🟢 vững |
| **BTC dominance** | tiền xoay vòng sang alt | tuần | 🟡 |
| DXY, lãi suất thực, SPX/NDX | crypto giao dịch như tài sản rủi ro | ngày–tuần | 🟡 tương quan **không ổn định** — mạnh 2022, yếu 2024 |
| Vàng | câu chuyện "vàng số" | tháng | 🔴 tương quan **không ổn định, đổi dấu theo chế độ** (2024–25 dương rõ theo narrative debasement) — không có cơ chế khai thác được ở khung ngày |
| **Dòng tiền ETF spot** | cầu tổ chức | ngày | 🟡 dữ liệu chỉ có theo ngày, công bố trễ |

**Trạng thái dự án:** ✅ ba tín hiệu vững nhất đã nằm trong nhóm `cross_market` của Wave 0 — `00 §4.3` gọi đây là "nhóm quan trọng nhất", và đánh giá đó chính xác.

---

## A6 · Tâm lý & tin tức

| Tín hiệu | Cơ chế | Bằng chứng |
|---|---|---|
| Chỉ số Fear & Greed | tổng hợp sẵn, miễn phí | 🟡 phần lớn chỉ là hàm của giá gần đây — **ít thông tin mới** |
| Khối lượng/tâm lý mạng xã hội | đám đông | 🔴 nhiễu nặng, đầy bot, dễ bị thao túng |
| Google Trends | quan tâm bán lẻ | 🟡 **trễ**, và có giới hạn lấy dữ liệu lịch sử theo giờ |
| Phân tích tin tức bằng NLP | phản ứng sự kiện | 🟡 phải cực nhanh mới có edge — bất khả thi với thiết lập cá nhân |
| Điểm tin bằng LLM | ngữ nghĩa | 🟡 **cạm bẫy chí mạng:** LLM biết chuyện đã xảy ra sau đó → rò rỉ tương lai nghiêm trọng khi backtest |

> `00 §3.2` đã loại `finBERT` (đứng yên từ 2022, huấn luyện trên văn phong chứng khoán). Đánh giá đó vẫn đúng.

**Trạng thái dự án:** ⬜ không nằm trong kế hoạch. **Đề xuất giữ nguyên là không làm** — tỉ lệ công sức/giá trị kém nhất toàn bảng.

---

## A7 · Sự kiện & lịch

| Sự kiện | Ảnh hưởng | Bằng chứng |
|---|---|---|
| Niêm yết mới trên sàn lớn | cầu đột biến | 🟢 vững nhưng **không giao dịch được** — quá nhanh |
| Mở khoá token (vesting) | cung đột biến, **biết trước lịch** | 🟢 vững; đây là tín hiệu hiếm hoi biết trước |
| Nâng cấp mạng, hard fork | kỳ vọng | 🟡 thường "buy the rumor, sell the news" |
| Số liệu vĩ mô (CPI, FOMC) | biến động tăng vọt | 🟢 vững cho **biến động**, không cho hướng |
| Đáo hạn quyền chọn | ghim giá quanh strike | 🟡 chỉ BTC/ETH |

**Ứng dụng khả thi nhất:** không phải để dự đoán hướng, mà để **tạm dừng giao dịch** quanh sự kiện biến động cao. Đây là tính năng của RiskEngine (M13), không phải của model.

---

## A8 · Chế độ thị trường (regime)

Không phải tín hiệu độc lập, mà là **bộ chuyển mạch** quyết định tín hiệu nào đang có hiệu lực.

| Phương pháp | Ghi chú | Bằng chứng |
|---|---|---|
| Phân vị biến động | rẻ, hiệu quả | 🟢 vững |
| Hidden Markov Model | 2–3 trạng thái ẩn | 🟡 hay overfit; số trạng thái là tham số tuỳ ý |
| Phát hiện điểm gãy (CUSUM, Bayesian) | tìm chỗ chuyển chế độ | 🟡 |
| Phân cụm | gom nến giống nhau | 🟡 |
| Chỉ báo xu hướng/đi ngang (ADX) | đơn giản | 🟡 |

> **Cách dùng đúng và sai:** dùng chế độ làm **feature** đưa vào model (để model tự học "khi biến động cao thì tín hiệu X yếu đi") thì tốt. Dùng chế độ để **bật/tắt model** thì thêm một tầng tham số cần tinh chỉnh, và thường là overfit.

**Trạng thái dự án:** ✅ nhóm `regime` (phân vị biến động và volume 30 ngày) đã ở Wave 0 — đúng cách dùng.

---

## A9 · Cross-sectional (nhiều coin cùng lúc)

Đây là **góc nhìn hoàn toàn khác** với tất cả các nhóm trên: thay vì hỏi "BTC sẽ tăng không?", hỏi "**trong 40 coin, coin nào sẽ mạnh hơn phần còn lại?**"

| Phương pháp | Cơ chế | Bằng chứng |
|---|---|---|
| **Xếp hạng sức mạnh tương đối** | mua top, bán bottom | 🟢 vững — cross-sectional momentum là hiệu ứng dày literature nhất trong tài chính |
| **Độ rộng thị trường (breadth)** | bao nhiêu % coin đang trên EMA200 | 🟡 |
| **Pairs trading / cointegration** | hai coin lệch nhau rồi hội tụ | 🟡 quan hệ hay gãy đột ngột |
| **Mô hình nhân tố** | phân rã lợi suất thành BTC-beta + size + momentum | 🟢 vững |

> **Ưu thế lớn nhất của cách tiếp cận này:** chiến lược **trung tính thị trường**. Không cần đoán BTC lên hay xuống — chỉ cần đoán coin A mạnh hơn coin B. Loại bỏ được nguồn rủi ro lớn nhất.

**Trạng thái dự án:** ⬜ chưa có. Dữ liệu **đã sẵn** sau W1 (40 cặp cùng khung thời gian), chi phí thêm gần bằng 0. **Đề xuất thành Wave 3.**

---

# PHẦN B · BẢY HỌ MÔ HÌNH

| Họ | Đại diện | Hợp với | Đánh giá cho dự án này |
|---|---|---|---|
| **Baseline** | always-up · seasonal-naive · random · buy-and-hold | mọi bài toán | ✅ **bắt buộc chạy trước** (RULE 4) — không có mốc thì không biết mình thắng gì |
| **Tuyến tính / thống kê** | logistic, ARIMA, GARCH, VAR, Kalman | chuỗi ổn định | 🟡 GARCH tốt cho **biến động**; ARIMA vô dụng cho hướng giá crypto |
| **Cây tăng cường** ★ | **LightGBM**, XGBoost, CatBoost | bảng, nhiễu, ít mẫu | ✅ **lựa chọn chính** — thắng deep learning trong đa số bài toán dạng này |
| **Deep learning chuỗi** | LSTM, GRU, TCN, Transformer, N-BEATS, TFT | chuỗi dài, nhiều dữ liệu | 🟡 cần dữ liệu gấp bội để bù cho việc tự học biểu diễn; ta **đã biết** biểu diễn tốt |
| **Foundation model** | Chronos-2, TimesFM, Kronos, Moirai | zero-shot | 🟡 ⚠️ **RULE 12** — đã pretrain trên kho dữ liệu nhiều khả năng bao gồm chính lịch sử BTC bạn định backtest |
| **Học tăng cường** | DQN, PPO, FinRL | học chính sách vào/ra | 🔴 `00 §3.2` đã loại: "RL trên dữ liệu tài chính nhiễu là bài toán nghiên cứu, không phải bài toán kỹ thuật" |
| **Meta / ensemble** | stacking, **meta-labeling** | tinh chỉnh quyết định | 🟢 **meta-labeling đáng làm sau GATE 1** — xem dưới |

### Meta-labeling — kỹ thuật đáng chú ý nhất chưa có trong kế hoạch

Ý tưởng (López de Prado): tách bài toán làm hai tầng.

```
Model 1 (sơ cấp)   →  quyết định HƯỚNG      (có thể là quy tắc đơn giản)
Model 2 (thứ cấp)  →  quyết định CÓ ĐẶT CƯỢC KHÔNG, và ĐẶT BAO NHIÊU
```

Model 2 học từ nhãn "lần đó model 1 đúng hay sai". Ưu điểm: cải thiện precision mà không phá recall, và **sinh ra trực tiếp con số để position sizing**.

Rất khớp với kiến trúc đã có — vùng chết 42–58 hiện tại đã là một dạng meta-labeling thô sơ. **Đề xuất Wave 4.**

---

# PHẦN C · SÁU KỊCH BẢN THỊ TRƯỜNG

Không phương pháp nào đúng ở mọi chế độ. Bảng này trả lời: **khi thị trường thế này thì cái gì còn hiệu lực?**

| # | Kịch bản | Dấu hiệu nhận biết | Còn hiệu lực | Chết | Rủi ro của hệ thống |
|---|---|---|---|---|---|
| **1** | **Xu hướng mạnh** | ADX cao, biến động vừa, OI tăng cùng giá | momentum · trend-following · cross-sectional | mean reversion | Vào muộn đúng đỉnh |
| **2** | **Đi ngang biên hẹp** | biến động phân vị thấp, OI phẳng | mean reversion · bán biến động | momentum (cưa liên tục) | **Phí ăn sạch** — vùng chết phải rộng ra |
| **3** | **Bão biến động** | realized vol phân vị > 90, thanh lý dồn dập | dự báo biến động · vi cấu trúc | mọi thứ dựa trên giá trung bình | Slippage thật vượt xa giả định 0,05% |
| **4** | **Sập / cascade** | thanh lý cascade, funding đảo dấu đột ngột | **không gì cả** — chỉ có quản trị rủi ro | tất cả | Stop-loss trượt giá; correlation → 1 |
| **5** | **Squeeze** | funding cực đoan + OI cao + đám đông một bên | funding · long/short ratio (ngược chiều) | momentum thuần | Bị quét đúng lúc đoán đúng hướng |
| **6** | **Đổi chế độ** | phá vỡ tương quan lịch sử | không gì cả | model train trên chế độ cũ | **Nguy hiểm nhất** — model tự tin mà sai hệ thống |

**Ba hệ quả thiết kế rút ra:**

1. **Kịch bản 4 và 6 không giải được bằng model.** Chúng là bài toán của RiskEngine (M13) và của audit A4/A5. Đừng cố train để tránh sập — hãy dựng kill switch.
2. **Kịch bản 2 là nơi phí giết chiến lược.** Vùng chết thích ứng theo biến động (`theta`) đã xử lý đúng: thị trường yên thì ngưỡng thu hẹp *theo tỉ lệ*, nhưng sàn 5bp ngăn giao dịch nhiễu.
3. **Kịch bản 5 chỉ nhìn thấy được bằng dữ liệu phái sinh.** Đây là lập luận mạnh nhất cho Wave 1: một hệ thống chỉ nhìn OHLCV **mù hoàn toàn** trước squeeze.

---

# PHẦN D · CHIẾN LƯỢC CỤ THỂ

## D1 · Nguyên tắc chọn

> **Mỗi họ nguồn thêm vào = một pipeline mới + một bề mặt rò rỉ mới + một khoản chi phí vĩnh viễn.** Vì vậy thêm theo đợt, và mỗi đợt phải tự chứng minh trước khi có đợt sau.

**Ba câu hỏi trước khi thêm bất kỳ nguồn nào:**

1. Nó cho biết thứ mà nguồn hiện có **không cho biết**? *(Fear & Greed trượt câu này — nó chủ yếu là hàm của giá.)*
2. Nó có **cơ chế kinh tế** giải thích được, hay chỉ là tương quan? *(Ví cá voi trượt câu này.)*
3. Có **biết chắc độ trễ công bố** không? *(Phần lớn on-chain trượt câu này.)*

## D2 · Bốn đợt

### 🟢 Wave 0 — OHLCV · ĐANG LÀM (M3, gói W4–W5)

9 nhóm feature ở `00 §4.3`, ~45 cột. Không đổi gì.

**Cổng ra:** thắng cả 4 baseline out-of-sample sau phí. Đây là **GATE 1**.

---

### 🟠 Wave 1 — PHÁI SINH · ĐỀ XUẤT THÊM MỚI, ưu tiên cao nhất

**Vì sao đứng đầu:** miễn phí (đã kiểm chứng) · cùng một nhà cung cấp đã tích hợp · bằng chứng 🟢 · và là **nguồn duy nhất nhìn thấy kịch bản 5 (squeeze)**.

| Feature đề xuất | Nguồn | Ghi chú |
|---|---|---|
| `drv_funding` | `/fapi/v1/fundingRate` | giá trị hiện tại |
| `drv_funding_z96` | ↑ | z-score 96 kỳ — cực trị mới là tín hiệu |
| `drv_funding_cum8` | ↑ | tích luỹ 8 kỳ (chi phí giữ vị thế) |
| `drv_oi_chg` | `openInterestHist` | biến thiên OI |
| `drv_oi_price_div` | ↑ + giá | **dấu(Δgiá) × dấu(ΔOI)** — phân biệt tiền mới vs đóng vị thế |
| `drv_ls_ratio_z` | `globalLongShortAccountRatio` | z-score; dùng **ngược chiều** |
| `drv_taker_ls` | `takerlongshortRatio` | áp lực chủ động futures |
| `drv_basis` | mark − spot | chuẩn hoá theo % |

**Chi phí:** ~1,5 ngày (thêm downloader + 8 feature + test căn timestamp).

**⚠️ Rủi ro rò rỉ đặc thù — phải xử lý:**
- Funding rate **công bố 8 giờ/lần** nhưng có `fundingTime` là mốc *áp dụng*. Phải dùng giá trị đã biết **tại thời điểm t**, không phải giá trị của kỳ chứa t.
- OI hist có độ mịn tối thiểu 5 phút và **giới hạn 30 ngày lịch sử** — không tải được 3 năm. Phải bắt đầu tích luỹ từ bây giờ.

> **Điểm này quan trọng:** nếu định dùng Wave 1, phải **bắt đầu thu thập OI ngay hôm nay**, vì Binance không cho lấy quá 30 ngày về trước. Mỗi ngày trì hoãn là mất một ngày dữ liệu vĩnh viễn.

**Cổng ra:** Sharpe walk-forward tăng ≥ 0,15 so với Wave 0. Không đạt → **gỡ bỏ**, không giữ lại "cho chắc".

---

### 🟡 Wave 2 — VI CẤU TRÚC TỔNG HỢP · sau GATE 1

Tổng hợp từ `aggTrade` theo nến: tỉ lệ taker (đã có ở W1), phân bố cỡ lệnh, số lệnh/nến, khối lượng thanh lý từ `!forceOrder@arr`.

**Chi phí:** ~1 ngày + phải chạy collector liên tục (dữ liệu này không tải lại được).

**Cổng ra:** cùng ngưỡng Wave 1.

---

### 🟡 Wave 3 — CROSS-SECTIONAL · sau GATE 1, chi phí gần bằng 0

Dữ liệu đã có sẵn sau W1. Thêm: xếp hạng lợi suất trong 40 coin, độ rộng thị trường, phân vị beta.

**Thay đổi bài toán:** từ "coin này lên hay xuống" sang "**coin này mạnh hơn hay yếu hơn rổ**". Mở đường tới chiến lược trung tính thị trường — bỏ được rủi ro lớn nhất.

**Chi phí:** ~1,5 ngày. **⚠️ Bắt buộc dùng ảnh chụp vũ trụ theo tháng**, nếu không sẽ dính bẫy sống sót ngay lập tức.

---

### 🔵 Wave 4 — META-LABELING · sau khi có model ổn định

Tầng thứ hai quyết định *có đặt cược không và bao nhiêu*. Thay thế vùng chết cố định 42–58 bằng một quyết định học được.

**Chi phí:** ~2 ngày. **Điều kiện:** chỉ làm khi model sơ cấp đã qua GATE 1 và GATE 2.

---

## D3 · Cố tình KHÔNG làm — và lý do

| Loại | Lý do loại |
|---|---|
| **On-chain trả phí** | 30–800 USD/tháng, và độ trễ công bố là bẫy rò rỉ nghiêm trọng. Xem lại nếu dự án tự nuôi được. |
| **Tâm lý mạng xã hội / NLP tin tức** | Tỉ lệ công sức/giá trị kém nhất. Bot và thao túng làm nhiễu nặng. |
| **Chấm điểm tin bằng LLM** | LLM biết chuyện đã xảy ra sau đó → rò rỉ tương lai không thể gỡ khi backtest. |
| **Học tăng cường** | `00 §3.2` — bài toán nghiên cứu, không phải bài toán kỹ thuật. |
| **Elliott, Fibonacci, Gann** | Không có cơ chế kiểm chứng. |
| **Giao dịch tần suất cao** | Không thể cạnh tranh về độ trễ; phí giết sạch. |
| **Foundation model làm model chính** | RULE 12. Chỉ dùng làm "ý kiến thứ hai" sau GATE 1, đánh giá zero-shot trên dữ liệu sau cutoff. |

## D4 · Bảng ưu tiên cuối

| Đợt | Nội dung | Công | Tiền | Bằng chứng | Khi nào |
|---|---|---|---|---|---|
| **0** | OHLCV 9 nhóm | *đang làm* | 0 | 🟢 | W4–W5 |
| **1** | **Phái sinh** ★ | 1,5d | **0** | 🟢 | **Bắt đầu thu OI ngay; feature sau GATE 1** |
| **2** | Vi cấu trúc tổng hợp | 1d + collector | 0 | 🟢 | Sau GATE 1 |
| **3** | Cross-sectional | 1,5d | 0 | 🟢 | Sau GATE 1 |
| **4** | Meta-labeling | 2d | 0 | 🟢 | Sau GATE 1 + 2 |
| — | On-chain | 3d+ | $$ | 🟡 | Chỉ khi dự án tự nuôi được |
| — | Tâm lý, RL, HFT | — | — | 🔴 | Không làm |

## D5 · Việc duy nhất cần quyết ngay

**Bật thu thập Open Interest ngay hôm nay.** Binance chỉ cho lấy 30 ngày lịch sử — mọi ngày trì hoãn là dữ liệu mất vĩnh viễn. Chi phí: một script cron nhỏ, ~2 giờ làm. Không cần chờ GATE 1, không cần quyết định gì khác.

Mọi thứ còn lại trong tài liệu này đều đợi được tới sau GATE 1.

---

*Tài liệu liên quan: `00_MASTER_PLAN §4.3` (9 nhóm feature Wave 0) · `04_EXECUTION_STRATEGY` (WBS) · `06_HIGH_LEVEL_DESIGN` (kiến trúc) · `config/features.yaml` (khai báo feature hiện tại)*
