# PHƯƠNG PHÁP GIAO DỊCH CRYPTO — TỔNG HỢP VÀ XẾP HẠNG TRUNG THỰC

> Phiên bản 1.0 · 25/08/2026
> Phân biệt với `07_PREDICTION_METHODS`: tài liệu đó nói về **tín hiệu dự đoán hướng**; tài liệu này nói về **cách biến tín hiệu thành lệnh có kỳ vọng dương** — kiến trúc chiến lược, hành vi thị trường khai thác được, cách dùng chỉ số, thực thi, và quản trị vốn.
> **Không phải lời khuyên đầu tư.** Đây là phân tích kỹ thuật phục vụ thiết kế hệ thống.

---

# PHẦN A · TOÁN CỦA EDGE — ĐỌC TRƯỚC MỌI THỨ KHÁC

Mọi chiến lược, dù mô tả hoa mỹ đến đâu, quy về đúng một biểu thức:

```
Kỳ vọng mỗi lệnh = (p_thắng × lãi_TB) − (p_thua × lỗ_TB) − phí − trượt_giá
```

Nếu số này không dương, mọi thứ còn lại là trang trí.

## A1 · Vì sao thắng 55% vẫn có thể lỗ

| Kịch bản | Thắng | Lãi TB | Lỗ TB | Trước phí | Sau phí 0,30% |
|---|---|---|---|---|---|
| "Tỉ lệ thắng cao" | 60% | +0,4% | −0,5% | **+0,04%** | **−0,26%** ❌ |
| Cân bằng | 52% | +1,0% | −1,0% | +0,04% | −0,26% ❌ |
| **Lãi lớn hơn lỗ** | 45% | +2,0% | −1,0% | **+0,35%** | **+0,05%** ✅ |
| Trend-following điển hình | 35% | +4,0% | −1,0% | **+0,75%** | **+0,45%** ✅ |

> **Tỉ lệ thắng là chỉ số bị hiểu sai nhiều nhất trong giao dịch.** Một hệ thống thắng 35% có thể lãi đều, một hệ thống thắng 60% có thể phá sản. Thứ quyết định là **tỉ số lãi/lỗ**, không phải tần suất đúng.

Đây là lý do dashboard của dự án hiển thị **profit factor** bên cạnh directional accuracy — accuracy một mình là con số gây hiểu lầm.

## A2 · Bức tường phí — tính theo tần suất

Phí khứ hồi Binance spot: taker 0,10% × 2 + trượt giá 0,05% × 2 = **0,30%**.

| Tần suất | Phí/tháng | Cần lãi gộp bao nhiêu để hoà |
|---|---|---|
| 6 lệnh/ngày | 54% (lãi kép: cần ~**72%** mới hoà) | **không khả thi** |
| 1 lệnh/ngày | 9% | 9%/tháng — cực khó |
| 1 lệnh/2 ngày | 4,5% | khó |
| 2 lệnh/tuần | 2,6% | khả thi |
| **1 lệnh/tuần** | **1,3%** | **hợp lý** |
| 2 lệnh/tháng | 0,6% | dễ thở |

**Kết luận thiết kế:** tần suất là kẻ thù. Vùng chết 42–58 của dự án không chỉ để "trung thực" — nó là **cơ chế sinh tồn kinh tế**. Model im lặng phần lớn thời gian là điều kiện cần để sống sót qua phí.

---

# PHẦN B · MƯỜI MỘT KIẾN TRÚC CHIẾN LƯỢC

Xếp theo **độ tin cậy của bằng chứng**, không theo độ hấp dẫn.

---

## B1 · 🟢 Cash-and-carry / thu hoạch funding — *trung tính thị trường*

**Cơ chế:** mua spot + short perpetual cùng khối lượng. Giá lên hay xuống không quan trọng — hai chân triệt tiêu nhau. Bạn thu **funding rate** mà phe long trả cho phe short.

**Số liệu thật lúc 25/08/2026:**

```
BTCUSDT   funding 0,0100%/8h  →  10,9%/năm
SOLUSDT   funding 0,0100%/8h  →  10,9%/năm
XRPUSDT   funding 0,0015%/8h  →   1,6%/năm
BNBUSDT   funding 0,0000%/8h  →   0,0%/năm

basis (perp − spot):  BTC −0,043%  ·  ETH −0,053%  ·  SOL −0,038%
```

**Nhưng đây là chỗ phải tính kỹ — và là chỗ hầu hết bài viết trên mạng bỏ qua:**

| Khoản | Giá trị |
|---|---|
| Phí vào (spot taker 0,10% + perp taker 0,05%) | −0,15% |
| Phí ra | −0,15% |
| Basis âm (short perp ở giá **thấp hơn** spot) | −0,043% |
| **Tổng chi phí một vòng** | **−0,343%** |
| Thu funding mỗi ngày (3 × 0,01%) | +0,03%/ngày |
| **Điểm hoà vốn** | **≈ 11,4 ngày** |

> **Ba điều tài liệu trên mạng thường không nói:**
> 1. Mức `0,0100%/8h` chính là **giá trị nền mặc định** của Binance khi premium ≈ 0 — không phải dấu hiệu "thị trường đang nóng". Funding thật sự hấp dẫn là khi nó vượt 0,05%/8h.
> 2. **Basis đang âm** — perp rẻ hơn spot. Bạn short perp ở giá thấp hơn, nên mất **tối đa** khoản đó nếu basis về 0 lúc thoát (perp không có đáo hạn — đây là ước lượng thận trọng, không phải chi phí tất định).
> 3. Dùng lệnh **maker** thay taker cắt phí futures từ 0,05% xuống 0,02% — rút điểm hoà vốn xuống **~9,4 ngày** (cải thiện 17,5%); muốn xuống ~7,8 ngày phải kèm cả BNB discount 25% cho chân spot (taker 0,075%).

**Hai phép tính bắt buộc trước khi mê con số 10,9% (kiểm toán 25/08/2026):**

- **Vốn phải nuôi HAI chân.** Funding thu trên notional perp, nhưng vốn = spot + margin short. APR trên **tổng vốn**: margin 1x → 5,5% · 2x → 7,3% (chịu được giá tăng ~48%) · 5x → 9,1% nhưng thanh lý chỉ cách ~19% — BTC từng tăng hơn thế trong một tháng nhiều lần. Multi-Asset Mode (thế chấp bằng chính coin spot) đưa hiệu quả vốn về gần 1 chân, đổi lấy rủi ro vận hành.
- **APR ròng phụ thuộc thời gian giữ** (trừ chi phí vòng 0,343%): giữ 8 ngày → **−4,7%/năm** · 15 ngày → +2,6% · 30 ngày → +6,8% · 90 ngày → +9,6%. Kịch bản thực tế (margin 2x, giữ 30 ngày) ≈ **4,5%/năm trên tổng vốn**.

**Rủi ro thật:** funding đảo dấu (bạn phải *trả*) — và các đợt âm **co cụm hàng tuần** trong lịch sử (5–7/2021, cuối 2022), không rải đều · thanh lý chân short nếu giá tăng mạnh và ký quỹ mỏng · sàn phá sản · vốn bị khoá.

**Biến thể an toàn hơn chưa được nhắc:** *basis trade kỳ hạn* (mua spot + short futures quý) — basis hội tụ về 0 **tất định tại đáo hạn**, không có rủi ro funding đảo dấu. BIS WP 1087: trung bình 6–8%/năm, thường xuyên vượt 20%, đỉnh >40% (đầu 2019, đầu 2020, 3/2021). Đổi lại: vốn khoá tới đáo hạn và margin call chân short nếu giá pump mạnh giữa kỳ.

**Đánh giá:** đây là chiến lược có **bằng chứng vững nhất và ít phụ thuộc kỹ năng nhất** trong toàn bộ tài liệu. Nó không cần dự đoán gì cả. Đổi lại: lợi nhuận khiêm tốn, cần vốn lớn để có ý nghĩa, và cần kiên nhẫn.

---

## B2 · 🟢 Cross-sectional momentum — *xếp hạng, không đoán hướng*

**Cơ chế:** mỗi kỳ, xếp hạng 40 coin theo lợi suất N ngày qua. Mua top decile, bán bottom decile. Không cần biết thị trường chung lên hay xuống.

**Vì sao vững:** hiệu ứng momentum cross-sectional có literature dày nhất trong tài chính, tồn tại qua nhiều lớp tài sản và nhiều thập kỷ.

**Trong crypto:** mạnh hơn cổ phiếu vì thị trường non trẻ và dòng tiền bán lẻ đuổi theo hiệu suất.

**Chi phí thực hiện:** dữ liệu **đã có sẵn** sau W1 (40 cặp cùng khung). Đây là Wave 3 trong `07 §D2`.

**⚠️ Cạm bẫy sống còn:** phải dùng **ảnh chụp vũ trụ theo tháng**. Xếp hạng trên top-40 của hôm nay rồi backtest ngược 3 năm = bẫy sống sót, kết quả đẹp giả tạo.

---

## B3 · 🟢 Trend following (time-series momentum)

**Cơ chế:** vào theo hướng xu hướng, cắt lỗ nhanh, để lãi chạy.

**Đặc trưng thống kê:** tỉ lệ thắng **thấp** (30–40%) nhưng tỉ số lãi/lỗ **cao** (3:1 trở lên). Xem lại bảng A1 — đây chính là hình dạng có kỳ vọng dương.

**Điểm mạnh:** sống sót qua mọi chế độ vì nó không dự đoán, chỉ đi theo. Bắt được đuôi phân phối — nơi phần lớn lợi nhuận crypto nằm.

**Điểm yếu:** chuỗi thua dài trong thị trường đi ngang (kịch bản 2). Cần kỷ luật tâm lý cực cao — hoặc tự động hoá hoàn toàn.

---

## B4 · 🟢 Volatility targeting — *không phải chiến lược, là bộ nhân*

**Cơ chế:** thay vì đặt cùng số tiền mỗi lệnh, đặt cùng **mức rủi ro**:

```
khối lượng = (vốn × rủi ro_mục_tiêu) / (biến động dự báo × giá)
```

Biến động cao → vào nhỏ. Biến động thấp → vào lớn.

**Vì sao đáng giá:** biến động là thứ **dự báo được đáng tin nhất** trong tài chính (vol clustering 🟢). Backtest độc lập trên BTC 2014–2026 (kiểm toán 25/08): vol targeting **cắt max drawdown từ −83% xuống −36%…−50%** — đó là giá trị thật của nó. ~~Tăng Sharpe 20–40%~~ đã bị bác trên chính dữ liệu BTC (delta Sharpe đo được chỉ −0,07…+0,11): đây là lớp **quản trị đuôi**, không phải máy in Sharpe — mức cải thiện phải tự đo trên walk-forward của mình.

> Đây là lý do `expected_vol_pct` nằm trong hợp đồng dữ liệu của dự án ngay từ đầu — nó không phải để hiển thị, mà để **định cỡ lệnh**.

---

## B5 · 🟢 Market making — *vững nhưng ngoài tầm*

Đặt lệnh hai bên, ăn spread, quản lý tồn kho. Bằng chứng vững, nhưng cần hạ tầng độ trễ thấp và cạnh tranh với các đội chuyên nghiệp. **Không khả thi cho thiết lập cá nhân.**

---

## B6 · 🟡 Mean reversion ngắn hạn

Giá lệch xa trung bình rồi hồi. Mạnh ở khung phút **nhưng chỉ với phí maker/HFT — với phí taker cá nhân, khung phút thuộc vùng chết của bức tường phí** (07 §A2); mòn nhanh ở khung giờ. Chết trong xu hướng mạnh (kịch bản 1) — cần bộ lọc chế độ.

## B7 · 🟡 Breakout / phá vỡ biên

Vào khi giá vượt biên N kỳ. Nhiều tín hiệu giả; cần lọc bằng khối lượng và mở rộng biến động. Bản chất là trend following với điểm vào cụ thể hơn.

## B8 · 🟡 Fade liquidation cascade

Sau chuỗi thanh lý dồn dập, giá thường hồi một phần vì lệnh bán là **cưỡng bức**, không phải quyết định. Bằng chứng khá tốt, nhưng đòi hỏi thực thi nhanh và can đảm vào ngược đám đông đúng lúc hoảng loạn.

## B9 · 🟡 Statistical arbitrage / pairs

Hai coin đồng liên kết lệch nhau rồi hội tụ. Quan hệ trong crypto **gãy đột ngột** — dự án phá sản, đổi tokenomics. Cần giám sát cointegration liên tục.

## B10 · 🟡 Event-driven

**Mở khoá token (vesting)** là tín hiệu hiếm hoi **biết trước lịch** — nguồn cung tăng đột biến vào ngày đã công bố. Bằng chứng khá tốt. Niêm yết mới thì bằng chứng vững nhưng **không giao dịch được** vì quá nhanh.

## B11 · 🟡 Dự đoán hướng bằng ML — *chính là dự án này*

**Nói thẳng: đây là biến thể khó nhất trong toàn bộ danh sách.**

Bạn đang cố trích tín hiệu từ chuỗi gần random walk, ở khung thời gian mà edge mỏng nhất, cạnh tranh với các đội có dữ liệu và hạ tầng tốt hơn. Mức 52–55% đã là thành công.

**Nhưng điều này không có nghĩa nên bỏ**, vì hai lý do:

1. **Hạ tầng bạn đang xây phục vụ mọi chiến lược khác.** Downloader, walk-forward, bộ dò rò rỉ, risk engine, dashboard — B1 đến B4 đều cần đúng những thứ đó. Xây xong, chuyển sang chiến lược khác gần như miễn phí.
2. **Mục tiêu kép của dự án là học.** Làm được bài khó nhất thì bài dễ hơn thành hiển nhiên.

---

# PHẦN C · MƯỜI HÀNH VI THỊ TRƯỜNG KHAI THÁC ĐƯỢC

| # | Hành vi | Cơ chế | Cách nhận biết | Bằng chứng |
|---|---|---|---|---|
| 1 | **Vol clustering** | biến động tự tương quan mạnh | realized vol 24h | 🟢 vững nhất |
| 2 | **Liquidation cascade** | thanh lý ép thanh lý | WS `!forceOrder@arr`, OI sụt đột ngột | 🟢 |
| 3 | **Funding squeeze** | đòn bẩy chen chúc một bên | funding z-score > 2 + OI cao | 🟢 |
| 4 | **Đám đông sai ở cực trị** | nhỏ lẻ mua đỉnh bán đáy | `longShortRatio` ở cực trị | 🟡 dùng **ngược chiều** |
| 5 | **Quét thanh khoản (stop hunt)** | dừng lỗ dồn dưới đáy/trên đỉnh rõ ràng | wick dài xuyên mức, rồi hồi ngay | 🟡 |
| 6 | **Hiệu ứng phiên** | Á–Âu–Mỹ có nhịp riêng | giờ trong ngày (sin/cos) | 🟡 có thật vì crypto 24/7 nhưng dòng tiền thì không |
| 7 | **Cuối tuần mỏng** | thanh khoản thấp, biên độ giả | thứ trong tuần | 🟡 |
| 8 | **Số tròn hút giá** | lệnh chờ dồn ở 80.000, 100.000 | khoảng cách tới số tròn | 🟡 |
| 9 | **Suy giảm sau niêm yết** | hype tan, cung mở khoá | ngày kể từ niêm yết | 🟡 |
| 10 | **Tương quan → 1 khi sập** | mọi thứ bán tháo cùng lúc | tương quan trượt 30 ngày | 🟢 — **đây là rủi ro, không phải cơ hội** |

> **Hành vi #10 là thứ giết danh mục.** Đa dạng hoá 10 coin nghe an toàn, nhưng khi sập thì cả 10 cùng xuống — bạn thực chất đang có **một vị thế lớn gấp 10**, không phải 10 vị thế nhỏ. RiskEngine phải giới hạn **tổng exposure**, không chỉ giới hạn từng lệnh.

---

# PHẦN D · CHỈ SỐ — DÙNG SAI VÀ DÙNG ĐÚNG

| Chỉ số | ❌ Cách dùng phổ biến (vô dụng) | ✅ Cách dùng có giá trị |
|---|---|---|
| **RSI** | "> 70 quá mua → bán" | Phân vị RSI trong 30 ngày, **kết hợp** chế độ biến động. Trong xu hướng mạnh RSI ở 80 suốt nhiều tuần. |
| **MACD** | "cắt lên → mua" | MACD histogram **chuẩn hoá theo ATR** → so sánh được giữa các coin |
| **Bollinger** | "chạm biên trên → bán" | **Độ rộng dải** làm chỉ báo chế độ biến động (siết → sắp bung) |
| **Volume** | "volume cao → xác nhận" | **Z-score volume** + tỉ lệ taker mua → biết ai chủ động |
| **EMA cross** | "vàng cắt lên → mua" | **Tỉ lệ** `close/EMA20`, `EMA20/EMA50` làm feature, không làm tín hiệu |
| **ATR** | dùng làm chỉ báo hướng | Chuẩn hoá: `ATR/close` → **định cỡ lệnh và đặt stop** |
| **Funding** | "funding cao → sắp giảm" | **Z-score 96 kỳ** — chỉ cực trị mới có tín hiệu, giá trị nền 0,01% là mặc định |
| **Open Interest** | "OI tăng → tăng giá" | **Ghép với giá**: giá↑+OI↑ = tiền mới · giá↑+OI↓ = đóng short |
| **Fear & Greed** | "sợ hãi cực độ → mua" | Ít giá trị — phần lớn chỉ là hàm của giá gần đây |

> **Quy luật chung:** chỉ báo đơn lẻ với ngưỡng cố định gần như luôn vô dụng. Chỉ báo được **chuẩn hoá, đặt trong bối cảnh chế độ, và tổ hợp phi tuyến** thì mới có tín hiệu. Đó chính xác là việc của gradient boosting — và là lý do dự án dùng LightGBM chứ không dùng quy tắc if-then.

---

# PHẦN E · THỰC THI — NƠI NHÀ ĐẦU TƯ CÁ NHÂN MẤT TIỀN

Phần này ít được nói tới nhất nhưng ảnh hưởng tới lợi nhuận nhiều hơn cả việc chọn chỉ báo.

## E1 · Maker vs Taker

| Loại lệnh | Phí spot | Phí futures | Đánh đổi |
|---|---|---|---|
| Taker (market) | 0,10% | 0,05% | Khớp chắc chắn, đắt |
| **Maker (limit)** | 0,10% | **0,02%** | Rẻ hơn, nhưng **có thể không khớp** |

Với chiến lược carry (B1), chuyển sang maker rút điểm hoà vốn từ 11,4 xuống ~9,4 ngày — **cải thiện 17,5% mà không cần tín hiệu tốt hơn** (kèm BNB discount 25% chân spot mới xuống được ~7,8 ngày). Ngoài ra: **trả phí bằng BNB giảm 25% phí spot** (taker 0,10% → 0,075%) và 10% phí futures — cải thiện không điều kiện, đổi lấy exposure giá BNB của phần tồn kho.

Rủi ro: lệnh maker không khớp khi thị trường chạy — bạn bỏ lỡ đúng lúc tín hiệu mạnh nhất.

## E2 · Trượt giá theo thanh khoản

| Loại coin | Trượt giá thực tế | Ghi chú |
|---|---|---|
| BTC, ETH | 0,01–0,03% | Giả định 0,05% của dự án là **thận trọng** |
| Top 20 | 0,05–0,10% | Vừa đủ |
| Ngoài top 50 | 0,20–1,00%+ | Giả định 0,05% là **nguy hiểm sai** |

> **Hệ quả cho backtest:** dùng cùng một con số slippage cho mọi coin sẽ tô hồng kết quả trên altcoin nhỏ. Nếu vũ trụ mở rộng khỏi top-40, phải cho slippage **thay đổi theo thanh khoản**.

## E3 · Thời điểm

- **Tránh phút funding** (00:00, 08:00, 16:00 UTC) — biến động và spread bất thường
- **Tránh giờ thanh khoản mỏng** (khoảng 02:00–06:00 UTC) — trượt giá tăng vọt
- **Khớp ở open nến t+1**, không phải close nến t. Tín hiệu tính xong tại close t; khớp ngay tại close t là một dạng lookahead.

## E4 · Khớp một phần và lệnh mồ côi

Lệnh lớn khớp làm nhiều phần ở nhiều giá. Nếu code giả định "đặt lệnh = có vị thế đầy đủ", trạng thái nội bộ sẽ lệch với sàn. Đây là lý do GATE 4 bắt buộc có **đối soát 5 phút/lần**.

---

# PHẦN F · QUẢN TRỊ VỐN — QUYẾT ĐỊNH SỐNG CÒN

## F1 · Ba cách định cỡ lệnh

| Cách | Công thức | Đánh giá |
|---|---|---|
| Cố định tỉ lệ | `vốn × 1%` | Đơn giản, an toàn, **khởi điểm đúng** |
| **Theo biến động** | `vốn × rủi ro / (ATR × giá)` | ✅ **Tốt nhất** — mọi lệnh cùng mức rủi ro |
| Kelly | `f* = edge / odds` | ⚠️ Kelly đầy đủ **quá hung hăng**; sai số ước lượng edge làm nó phá sản. Dùng ¼ Kelly nếu dùng. |

## F2 · Rủi ro phá sản

Với 100 lệnh (mô phỏng 200.000 đường, win-rate 51–55%, payoff 1:1 tới 3:1, chưa trừ phí):

| Rủi ro mỗi lệnh | Xác suất mất 50% vốn |
|---|---|
| 1% | rất thấp |
| 2% | thấp |
| 5% | đáng kể |
| 10% | **25–60% tuỳ edge** — cộng phí vào còn tệ hơn |

> Giới hạn ≤1%/lệnh của GATE 4 không phải bảo thủ quá mức — nó là điều kiện toán học để sống sót qua chuỗi thua tất yếu.

## F3 · Điều chỉnh theo tương quan

Mười vị thế altcoin không phải 10 rủi ro độc lập — trong thị trường sập, tương quan → 1. Giới hạn **5% tổng exposure** của GATE 4 xử lý đúng điều này.

---

# PHẦN G · XẾP HẠNG TRUNG THỰC

| # | Chiến lược | Bằng chứng | Khả thi cá nhân | Vốn cần | Kỹ năng cần |
|---|---|---|---|---|---|
| 1 | **Cash-and-carry / funding** | 🟢🟢🟢 | ✅ cao | Lớn | Dự đoán: thấp · **vận hành: vừa** (margin chân short, optimal exit, đối soát 2 chân) |
| 2 | **Cross-sectional momentum** | 🟢🟢🟢 | ✅ cao | Vừa | Vừa |
| 3 | **Trend following** | 🟢🟢 | ✅ cao | Vừa | Vừa + **kỷ luật** |
| 4 | **Volatility targeting** *(lớp phủ)* | 🟢🟢🟢 | ✅ cao | — | Thấp |
| 5 | Event-driven (mở khoá token) | 🟡🟡 | ✅ vừa | Nhỏ | Vừa |
| 6 | Fade liquidation | 🟡🟡 | 🔶 khó | Vừa | Cao |
| 7 | Mean reversion ngắn hạn | 🟡 | 🔶 khó | Vừa | Cao |
| 8 | Stat arb / pairs | 🟡 | 🔶 khó | Lớn | Cao |
| 9 | **ML dự đoán hướng** ← *dự án này* | 🟡 | 🔶 khó | Nhỏ | **Rất cao** |
| 10 | Market making | 🟢🟢 | ❌ không | Lớn | Rất cao |
| 11 | HFT | 🟢🟢 | ❌ không | Rất lớn | Rất cao |

## G1 · Điều không dễ nghe, nhưng cần nói

**Ba chiến lược đứng đầu bảng đều không cần dự đoán hướng giá.** Chúng thu hoạch cấu trúc thị trường (funding), sức mạnh tương đối (ranking), hoặc quán tính (trend) — không phải trả lời câu hỏi "giá sẽ lên hay xuống".

Dự án đang xây thứ hạng 9: khó nhất, edge mỏng nhất.

**Nhưng đây không phải lập luận để dừng lại**, vì hạ tầng thì dùng chung:

| Thành phần đang xây | Phục vụ chiến lược nào |
|---|---|
| Downloader + store (M1–M2) | **Tất cả** |
| Walk-forward + bộ dò rò rỉ (M6) | **Tất cả** — bất kỳ backtest nào cũng cần |
| Backtest có phí (M8) | **Tất cả** |
| RiskEngine (M13) | **Tất cả** |
| Dashboard (M11) | **Tất cả** |
| Feature + model (M3–M7) | Chỉ #9 |

**Khoảng 70% công sức của dự án phục vụ mọi chiến lược.** Chỉ M3–M7 là riêng cho dự đoán hướng.

## G2 · Đề xuất cụ thể

**Giữ nguyên kế hoạch.** Không đổi hướng. Nhưng thêm ba điều chỉnh nhỏ, chi phí gần bằng 0:

| # | Điều chỉnh | Chi phí | Vì sao |
|---|---|---|---|
| 1 | **Thêm 2 baseline chiến lược** vào M5: trend-following đơn giản (EMA cross) và cross-sectional momentum | 0,5d | RULE 4 hiện chỉ so với baseline *thống kê*. Nếu model không thắng nổi EMA cross, bạn cần biết điều đó **sớm**. |
| 2 | **Ghi lại funding + basis** ngay từ W1 | *đã đề xuất ở `07 §D5`* | Vừa là feature (Wave 1), vừa mở đường B1 sau này. OI chỉ có 30 ngày lịch sử — mất là mất vĩnh viễn. |
| 3 | **Slippage thay đổi theo thanh khoản** trong M8 | 0,5d | Slippage cố định 0,05% tô hồng kết quả trên coin ngoài top-20 |

**Nếu GATE 1 trượt sau hai lần thử:** kế hoạch dự phòng hợp lý nhất không phải bỏ cuộc, mà là **chuyển đích sang #2 (cross-sectional momentum)** — dùng lại toàn bộ hạ tầng, đổi bài toán từ "coin này lên hay xuống" sang "coin nào mạnh hơn rổ". Đây là câu hỏi dễ hơn nhiều với cùng bộ dữ liệu.

---

## G3 · Bảy điều đúng bất kể chiến lược nào

1. **Kỳ vọng dương sau phí** — không có ngoại lệ nào
2. **Tỉ số lãi/lỗ quan trọng hơn tỉ lệ thắng**
3. **Tần suất là kẻ thù** — mỗi lệnh là một khoản phí chắc chắn đổi lấy một kết quả không chắc chắn
4. **Định cỡ lệnh quan trọng hơn điểm vào**
5. **Định nghĩa lối ra trước lối vào**
6. **Tương quan → 1 khi thị trường sập** — đa dạng hoá là ảo giác đúng lúc bạn cần nó nhất
7. **Chiến lược sống sót lâu nhất là chiến lược bạn hiểu vì sao nó hoạt động** — một hộp đen đang lãi là một hộp đen bạn sẽ không dám tắt khi nó bắt đầu lỗ

---

*Tài liệu liên quan: `07_PREDICTION_METHODS.md` (tín hiệu) · `00_MASTER_PLAN §7` (4 cổng) · `03_MODULE_SPECS §M13` (3 lối ra) · `06_HIGH_LEVEL_DESIGN §10` (đường tới tiền thật)*
