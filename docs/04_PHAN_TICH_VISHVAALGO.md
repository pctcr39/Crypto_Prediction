# PHÂN TÍCH KIẾN TRÚC — VISHVAALGO / VISHVAALGOAI

> Ngày phân tích: 25/08/2026
> Đối tượng: VishvaAlgo, bot giao dịch crypto ML/AI của Puranam Pradeep Picasso (Patreon `pppicasso`, Medium `imbuedeskpicasso`)
> Phương pháp: đọc toàn bộ bài viết công khai của tác giả, trang bán hàng Patreon, tìm kiếm kiểm chứng độc lập.
>
> **Ký hiệu nguồn:** (A) = tác giả tuyên bố · (V) = đã kiểm chứng độc lập · (U) = không xác định được

---

## 0. KẾT LUẬN NGẮN

Phần kỹ thuật là thật và khá quy chuẩn. Phần kiểm định thì không đủ để chống đỡ những con số được quảng cáo. Có một dòng code trong chính bài viết của tác giả giải thích trọn vẹn con số 33.885% mà không cần giả định bất kỳ edge nào.

Đây **không phải** kết luận lừa đảo. Tác giả có ghi rõ "backtest" trong thân bài và gắn nhãn "educational tool" trên trang bán. Nhưng khoảng cách giữa tiêu đề bài viết và thực tế đo được là rất lớn, và toàn bộ khoảng cách đó nằm ở phương pháp kiểm định.

---

## 1. KIẾN TRÚC THEO TỪNG THẾ HỆ

Đây không phải một hệ thống mà là bốn hệ thống khác nhau dùng chung một cái tên.

| Thế hệ | Stack (A) |
|---|---|
| **v1–v2** (2023–24) | Python + **CCXT** → Binance Futures · lịch sử qua **TvDatafeed** (TradingView, ~20.000 nến) · **TA-Lib** · MinMaxScaler · Keras `.h5` · `backtesting.py` + `skopt` |
| **v3.0** (4/2024) | Ensemble **TCN + LSTM + Transformer** kết hợp **CatBoost / Random Forest / Gradient Boosting** · model riêng từng asset · SL/TP/đòn bẩy riêng từng asset · danh sách asset tự sắp theo volume 24h · cooldown 1 giờ mỗi symbol · giới hạn `max_trades` |
| **v4.15** | Binance Futures · Docker Compose · notebook Jupyter 1.1–1.6 · gói ZIP 7,69 GB |
| **v.Freq_S/F_3_6** | Dựa trên **Freqtrade** (bản spot và bản futures) |
| **v36.2 "VishvaAlgoAI"** (8/2026) | **Bỏ hẳn deep learning**, quay về HistGradientBoosting / ExtraTrees / RF / MLP · 65–75 feature "strictly causal" · dữ liệu từ CoinGecko API, Binance Swap qua CCXT, TradingView RapidAPI |

**Đặc trưng (v1–v4):** ~190–193 feature trên ETH/USDT khung 15 phút — ATR, EMA, RSI, VWAP, ROC, Keltner, Donchian, MACD, Bollinger, EWO, OBV, ADL, Stochastic, PSAR, cộng nhóm return/range/volatility, tính trên các chu kỳ `[6,8,10,12,14,16,18,22,26,33,44,55]`.

**Triển khai:** Docker (tự chọn ARM/AMD64), có image GPU và non-GPU, chạy máy cá nhân hoặc VPS.

### 1.1 Quan hệ với Freqtrade

| Freqtrade cung cấp | Tác giả tự viết (A) |
|---|---|
| Kết nối sàn, khớp lệnh | File strategy `.py` |
| Backtest engine, hyperopt | Model NN đã train sẵn, nạp lúc chạy |
| Dry-run mode | `custom_assets_xxx.txt` (danh sách asset) |
| Telegram bot, FreqUI | Logic SL/TP/trailing riêng, Docker Compose |

**Không có bằng chứng dùng FreqAI (V).** Cả trang bán lẫn mọi bài viết đều không nhắc tới. Về mặt kiến trúc thì đây là hai hướng ngược nhau: FreqAI tồn tại để **retrain thích ứng theo thời gian**, còn VishvaAlgo train offline trong notebook rồi ship model đóng băng. Đây là suy luận từ sự vắng mặt của bằng chứng, không phải một tuyên bố — nếu quan tâm thì nên hỏi thẳng tác giả.

### 1.2 Chi tiết mô hình

- **Phân loại 3 lớp** (A): `0` = trung lập · `1` = long · `2` = short. *(Trùng ý tưởng với vùng chết trong thiết kế của ta.)*
- **Nhãn** (A): hàm `mytarget()` quét tới trước `barsupfront+2` nến, `pipdiff_percentage = 0.01` (TP 1%), `SLTPRatio = 2.0` — nhãn dạng barrier nhìn về phía trước.
- **Khung thời gian:** 15 phút là chính (v36.2 thử thêm 3m/5m/30m/1h).
- **Transformer** (A): MultiHeadAttention 6 head, `key_dim=64` → Dense 193→96→48→12 ReLU, dropout 0,2 → softmax 3 lớp, Adam `lr=1e-4`.
- **Mất cân bằng lớp** (A): `compute_class_weight('balanced')`, có nhắc ADASYN. Nhưng đoạn `class_weights = {0: 3.33, 1: 3.33, 2: 3.34}` được hardcode **thực chất là trọng số đều** — nó không sửa gì cả, trong khi lớp trung lập chiếm áp đảo.
- **Hiệu chỉnh xác suất:** không có ở v1–v4. v36.2 mới bắt đầu nhắc tới (A, chưa kiểm chứng).

---

## 2. ĐIỂM CHẾT NGƯỜI

Trong chính bài viết công bố con số 33.885%, đoạn code như sau:

```python
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, shuffle=False)
# ... huấn luyện trên X_train ...

y_pred = best_model.predict(X)          # ← toàn bộ X, KHÔNG phải X_test
df_ens['ensemble_signal'] = y_pred
Backtest(df_ens, MyCandlesStrat_010, cash=100000, commission=.001)
```

**Backtest chạy trên dự đoán của toàn bộ dataset. Bảy mươi phần trăm cửa sổ báo cáo là dữ liệu model đã học thuộc.**

Đây không phải "hơi lạc quan". Đây là chấm điểm bài thi trên chính đề mà thí sinh đã được xem đáp án. Riêng lỗi này đủ để tạo ra một con số tuỳ ý, không cần hệ thống có bất kỳ edge nào.

### Năm lỗi cộng dồn phía sau

| # | Lỗi | Hậu quả |
|---|---|---|
| 1 | Chia dữ liệu **một lần** 70/30, không purge, không embargo | Nhãn nhìn trước N nến khiến mẫu ở ranh giới chồng lấn sang tập test |
| 2 | `skopt` tối ưu SL/TP/đòn bẩy **trên chính tập báo cáo** | Tinh chỉnh trên tập đánh giá |
| 3 | Train trên ETH, áp cho 138 asset, **giữ lại cái tốt nhất** ghi vào `custom_assets.txt` | Bẫy sống sót thuần tuý — xếp hạng trên cùng dữ liệu dùng để báo cáo |
| 4 | `commission=0.001`, **không có slippage, không có funding rate** | Perp mất ~0,03%/ngày funding; round-trip taker thật ~0,13–0,15%. Với ~1.000 lệnh, phần bỏ sót cỡ 50% giá trị vòng quay |
| 5 | `backtesting.py` mặc định vào lệnh theo **% equity hiện tại** | Lãi kép — khuếch đại edge in-sample theo cấp số nhân |

Cộng thêm: ngày bắt đầu 1/1/2021 nằm đúng chân sóng tăng 2021.

---

## 3. KIỂM TRA SỐ HỌC

1.022 ngày = **2,80 năm** (được marketing là "3 năm"). Lợi nhuận 33.885% nghĩa là **339,85 lần** vốn.

| Đại lượng | Giá trị hàm ý |
|---|---|
| CAGR (tính theo 3 năm) | **597,9%** |
| Lợi nhuận tháng (hình học) | **+17,6%** |
| Lợi nhuận ngày | **+0,534% mỗi ngày, 1.022 ngày liên tục** |
| 1.000 USD thành | **339.850 USD** |
| 100.000 USD thành | **34,0 triệu USD** |

**So sánh với kỷ lục tốt nhất từng được ghi nhận.** Quỹ Medallion của Renaissance Technologies đạt khoảng 66%/năm gross — con số được xem là đỉnh cao lịch sử ngành. Trong 3 năm Medallion cho 4,57 lần. Claim của VishvaAlgo **lớn hơn 74 lần**; Medallion cần **11,5 năm** mới chạm tới 339×.

**So sánh với việc không làm gì.** ETH mua và giữ trong đúng cửa sổ đó: **+122,5%** (2,23 lần). Claim gấp **153 lần** so với buy-and-hold.

**Phép thử ngoại suy.** Với CAGR đó, một tài khoản 10.000 USD sẽ vượt **toàn bộ vốn hoá thị trường crypto** (~3.500 tỷ USD) trong **10,1 năm**, và vượt **GDP toàn cầu** trong 11,9 năm. Một tỉ suất tự huỷ khi ngoại suy là một tỉ suất không thể là edge.

**Mâu thuẫn nội tại.** Chính bài viết ghi Sharpe = **0,78** kèm lợi nhuận 33.885%. Hai con số này không thể cùng đúng: 339× trong 2,8 năm hàm ý Sharpe từ 2,7 đến 13 tuỳ mức biến động. Sharpe 0,78 là mức của một chiến lược tầm thường.

### Giới hạn sức chứa

Trên Binance USDT-perp, khoảng **2 triệu USD** nằm trong phạm vi 0,1% quanh giá giữa của ETHUSDT — cặp perp sâu thứ nhì. Alt perp chỉ có 50–200 nghìn USD.

| Vốn (đòn bẩy 10×) | Vị thế | % sổ lệnh ETH trong 0,1% |
|---|---|---|
| 10.000 USD | 100.000 USD | 5% |
| **100.000 USD** | 1.000.000 USD | **50%** |
| 1.000.000 USD | 10.000.000 USD | 500% |

Nghĩa là tác động thị trường bắt đầu cắn ở khoảng **50–100 nghìn USD vốn trên ETH**, và thấp hơn một đến hai bậc trên các alt trong rổ 138 coin.

Đáng chú ý: chính trang bán hàng của tác giả hứa **"6–40% lợi nhuận mỗi tháng, 25 USDT mỗi lệnh, vốn 150 USDT"**. Con số 150 USDT đó là lời thú nhận trung thực nhất trong toàn bộ tài liệu về quy mô mà hệ thống thực sự vận hành.

---

## 4. TÌNH TRẠNG KIỂM CHỨNG

**Không tìm thấy bất kỳ kiểm chứng độc lập nào (V).** Cụ thể là không có:

- Repo GitHub công khai. Tài khoản `github.com/picasso999` chỉ có dự án web, không có code giao dịch.
- Tài khoản verified kiểu myfxbook/Darwinex, trang hiệu suất do sàn xác thực, hay audit bên thứ ba.
- Log dry-run hoặc live của Freqtrade công khai.
- Bất kỳ ai tái lập được kết quả.

Bằng chứng được đưa ra là ảnh chụp màn hình Medium và Telegram — tự báo cáo, không kiểm toán được. Bài viết v2.0 chỉ có biểu đồ backtest và ảnh Binance **testnet**, không có P&L thật.

**Điểm công bằng cần nêu:** tôi cũng **không tìm thấy báo cáo tiêu cực nào** — không có thread Reddit, không có Trustpilot, không có khiếu nại hoàn tiền nhắc tên VishvaAlgo. Sự vắng mặt gần như hoàn toàn của thảo luận độc lập theo cả hai chiều **tự nó là phát hiện**: sản phẩm này gần như không có dấu vết bên ngoài kênh của chính tác giả.

Điểm dữ liệu độc lập duy nhất tìm được là một bình luận dưới bài 66.941%: *"49% max DD and 1.33 pf no good for me"*. Profit factor 1,33 là con số của một chiến lược thật nhưng tầm thường — và không thể dung hoà với 339×.

---

## 5. NHỮNG GÌ HỌ LÀM ĐÚNG

Đây là phần dễ bị bỏ qua nếu chỉ nhìn vào con số quảng cáo. Sáu điểm kiến trúc dưới đây thực sự đáng học:

1. **Phân loại 3 lớp có lớp trung lập.** Trùng với thiết kế vùng chết của ta — xác nhận đây là hướng đúng.
2. **SL/TP/đòn bẩy riêng cho từng asset.** Thiết kế hiện tại của ta dùng chung một bộ tham số. Đáng cân nhắc thêm vào M13.
3. **Cooldown 1 giờ mỗi symbol sau khi đóng lệnh.** Chống giao dịch quá mức — nên bổ sung vào risk engine.
4. **Giới hạn `max_trades` đồng thời.** Ta có giới hạn tổng exposure nhưng chưa giới hạn số vị thế mở.
5. **Docker Compose với image ARM và AMD64 riêng.** Cách đóng gói tốt cho người dùng chạy trên máy cá nhân lẫn VPS.
6. **Dùng Freqtrade làm lớp khớp lệnh, giữ model của riêng mình.** Đúng bằng phương án B mà ta đã ghi nhận trong kế hoạch tổng thể.

**Và điểm thứ bảy, quan trọng nhất:** phiên bản v36.2 (8/2026) **đã bỏ deep learning để quay về gradient boosting** (HistGradientBoosting, ExtraTrees, RF). Sau ba năm thử TCN, LSTM và Transformer, tác giả quay lại đúng chỗ mà kế hoạch của ta bắt đầu. Đó là một xác nhận thực nghiệm đáng giá cho lựa chọn LightGBM.

v36.2 cũng dùng ngôn ngữ nghiêm túc hơn hẳn: triple-barrier labeling, out-of-sample forward evaluation, chống phantom-fill bias, ma sát 0,60% round-trip, đòn bẩy 1,0. Đây là tiến bộ phương pháp thật. Nhưng **không công bố cửa sổ backtest**, và kết quả được quảng bá dựa trên **103 lệnh** — quá nhỏ để nói được điều gì.

---

## 6. ĐỐI CHIẾU VỚI THIẾT KẾ CỦA TA

| Luật của ta | VishvaAlgo | Ghi chú |
|---|---|---|
| RULE 2 — dịch ít nhất 1 nến | Nhãn nhìn trước nhưng không purge ranh giới | Rò rỉ |
| RULE 3 — walk-forward có purge/embargo | Một lần chia 70/30 | Rò rỉ |
| RULE 4 — đánh bại baseline | Không có baseline nào được công bố | Không so được với buy-and-hold |
| RULE 5 — trừ phí và slippage | Có phí 0,1%, **thiếu slippage và funding** | Bỏ sót ~50% giá trị vòng quay |
| RULE 6 — hiệu chỉnh xác suất | Không có tới v36.2 | — |
| RULE 10 — tái lập được | Không có MLflow, không seed công khai | — |
| RULE 11 — nghi ngờ >60% | Công bố win rate 81,17% | Đúng vào vùng cần nghi ngờ |
| §4.2 — bẫy sống sót | Asset shortlisting chính là nó | — |
| GATE 1 — chấm trên holdout chưa chạm | Chấm trên tập đã train | Lỗi gốc |
| GATE 3 — shadow run trên giá thật | Chỉ có ảnh testnet | — |

**Tám trên mười luật bị vi phạm.** Điều đáng nói không phải là VishvaAlgo tệ — mà là mười hai luật ta viết tuần trước không phải lý thuyết suông. Chúng là danh sách chính xác những chỗ một dự án crypto ML có thật đã trượt.

---

## 7. NẾU BẠN VẪN MUỐN DÙNG

Không có gì sai khi mua để đọc code — 190 feature, kiến trúc ensemble và cách đóng gói Docker đều là tài liệu học tốt, và giá một sản phẩm Patreon rẻ hơn nhiều so với thời gian tự mò.

Nhưng nếu định chạy tiền thật, ba việc phải làm trước:

1. **Chạy lại backtest với `X_test` thay vì `X`.** Một dòng sửa. Con số thật sẽ hiện ra và đó mới là con số đáng bàn.
2. **Bật funding rate và slippage** trong cấu hình backtest, rồi chạy lại lần nữa.
3. **Áp đúng bốn gate** trong `00_MASTER_PLAN.md` như với model tự viết. Mua sẵn không miễn cho ai khỏi việc kiểm định.

Nếu sau ba bước đó con số vẫn tốt, bạn đã tìm được thứ đáng giá. Nếu không, bạn vừa tiết kiệm được nhiều hơn số tiền bỏ ra mua.

---

*Đây là phân tích kỹ thuật, không phải lời khuyên đầu tư. Mọi số liệu hiệu suất trong tài liệu này đều là tuyên bố của tác giả sản phẩm và chưa được kiểm chứng độc lập.*
