# HIGH LEVEL DESIGN — CRYPTOPRED

> Phiên bản 1.0 · 25/08/2026
> Quan hệ tài liệu: `00_MASTER_PLAN` là **hiến pháp** (what/why) · `03_MODULE_SPECS` là **đặc tả từng module** (DoD) · `04_EXECUTION_STRATEGY` là **kế hoạch tác chiến** (when/who) · tài liệu này là **bản vẽ kiến trúc** (how it fits together).
>
> **Ký hiệu trạng thái dùng xuyên suốt:** ✅ chạy được · 🔨 đang dở · ⬜ stub chưa làm · 🔒 khoá sau cổng kiểm soát · ★ module quan trọng nhất
> *(Ký hiệu bằng chữ + biểu tượng, không mã hoá bằng màu — DS-RULE 3.)*

---

## MỤC LỤC

| § | Nội dung | Loại sơ đồ |
|---|---|---|
| 1 | Bối cảnh hệ thống | flowchart |
| 2 | Bản đồ container | flowchart |
| 3 | Kiến trúc pipeline chi tiết | flowchart |
| 4 | Mô hình dữ liệu | ER + cây thư mục |
| 5 | Ba đường dữ liệu realtime | sequence |
| 6 | Vòng đời một dự đoán | sequence |
| 7 | Kiểm định — purged walk-forward ★ | gantt + flowchart |
| 8 | Vòng huấn luyện và cổng chất lượng | flowchart |
| 9 | Máy trạng thái chế độ giao dịch | state |
| 10 | Đường tới tiền thật | flowchart |
| 11 | Triển khai | flowchart |
| 12 | Phụ thuộc module và đường găng | flowchart |
| 13 | Lớp cắt ngang | bảng |

---

## 1. BỐI CẢNH HỆ THỐNG

Ai dùng, hệ thống nói chuyện với cái gì bên ngoài. Lưu ý ba đường ra vào Binance có **bản chất khác nhau**: đọc công khai (không cần khoá), và đặt lệnh (cần khoá, bị khoá sau 4 cổng).

```mermaid
flowchart TB
    U(["👤 Người dùng<br>xem dự đoán, tự quyết định"])
    OPS(["🔧 Chủ hệ thống<br>train, backtest, vận hành"])

    subgraph SYS["CRYPTOPRED"]
        direction TB
        CORE["Pipeline + Dashboard"]
    end

    BINR["🌐 Binance REST + WebSocket<br>công khai · KHÔNG cần API key"]
    BINT["🔐 Binance Trading API<br>cần key · TẮT quyền rút tiền"]
    TG["📱 Telegram Bot API"]
    ML["📊 MLflow<br>chạy cục bộ, file backend"]

    U -->|"chọn coin, khung, đọc dự đoán"| SYS
    OPS -->|"make train, make download"| SYS
    BINR -->|"nến, sổ lệnh, khớp lệnh"| SYS
    SYS -.->|"🔒 đặt lệnh — sau GATE 1-4"| BINT
    SYS -->|"cảnh báo khi hướng ĐỔI"| TG
    SYS <-->|"metric, model, git hash"| ML

    classDef ext stroke-dasharray:4 4
    class BINR,BINT,TG,ML ext
```

**Ranh giới trách nhiệm:** hệ thống **không** đưa ra khuyến nghị đầu tư. Nó công bố xác suất đã hiệu chỉnh kèm cỡ mẫu, và nói thật khi không biết. Quyết định là của người dùng.

---

## 2. BẢN ĐỒ CONTAINER

Ba lớp triển khai độc lập, ba nhịp chạy khác nhau.

```mermaid
flowchart LR
    subgraph BATCH["⏱️ LỚP MẺ · chạy tay hoặc theo lịch đêm"]
        direction TB
        B1["Downloader<br>✅ M1"]
        B2["Feature + Label builder<br>⬜ M3-M4"]
        B3["Trainer + Backtester<br>⬜ M5-M8"]
    end

    subgraph STORE["💾 LƯU TRỮ · Parquet + DuckDB"]
        direction TB
        S1[("raw/ ✅")]
        S2[("clean/ 🔨")]
        S3[("features/ labels/ ⬜")]
        S4[("predictions/ ⬜")]
        S5[("mlruns/ ⬜")]
    end

    subgraph SERVE["🔄 LỚP DỊCH VỤ · chạy liên tục"]
        direction TB
        V1["InferenceService<br>⬜ M10 · mỗi nến đóng"]
        V2["FastAPI<br>⬜ M9"]
        V3["OutcomeReconciler<br>⬜ M10"]
        V4["RiskEngine + Executor<br>🔒 M13-M14"]
    end

    subgraph WEB["🖥️ LỚP GIAO DIỆN · trình duyệt"]
        direction TB
        W1["Dashboard<br>🔨 prototype v6"]
    end

    B1 --> S1 --> B2 --> S3 --> B3 --> S5
    B1 --> S2
    S5 --> V1 --> S4 --> V3
    S2 --> V1
    V2 --> W1
    S4 --> V2
    V1 -.->|"🔒 tín hiệu"| V4
    W1 -.->|"WebSocket giá — KHÔNG qua backend"| BIN["Binance WS"]
```

**Vì sao tách ba lớp:** lớp mẻ có thể chạy hàng giờ mà không ảnh hưởng gì; lớp dịch vụ phải sống 24/7 nhưng làm rất ít việc; lớp giao diện phải mượt kể cả khi hai lớp kia chết. Ranh giới này quyết định thiết kế §5.

---

## 3. KIẾN TRÚC PIPELINE CHI TIẾT

Toàn bộ đường đi từ nến thô tới lệnh. Sơ đồ này đồng thời là bản đồ tiến độ.

```mermaid
flowchart TB
    subgraph ING["M1-M2 · THU THẬP & LƯU TRỮ"]
        direction TB
        A1["ccxt fetch_ohlcv<br>✅ phân trang, idempotent"]
        A2["universe.py<br>✅ ảnh chụp theo tháng"]
        RAW[("data/raw/<br>✅ BẤT BIẾN")]
        CLN["build_clean<br>⬜ đánh dấu lỗ hổng"]
        CLEAN[("data/clean/<br>⬜")]
        ST["store.get_ohlcv<br>✅ API đọc DUY NHẤT"]
        A1 --> RAW
        A2 --> RAW
        RAW --> CLN --> CLEAN --> ST
    end

    subgraph FEA["M3-M4 · ĐẶC TRƯNG & NHÃN"]
        direction TB
        F1["9 nhóm feature<br>⬜ ~45 cột scale-free"]
        F2["shift_all<br>✅ điểm nghẽn RULE 2"]
        F3["assert_scale_free<br>✅ chặn RULE 1"]
        L1["LabelBuilder<br>⬜ vùng chết thích ứng"]
        FS[("features/ ⬜")]
        LS[("labels/ ⬜")]
        F1 --> F2 --> F3 --> FS
        L1 --> LS
    end

    subgraph VAL["M6 ★★★ · KIỂM ĐỊNH"]
        direction TB
        V1["PurgedWalkForward<br>⬜ 8 fold, purge + embargo"]
        V2["5 phép thử rò rỉ<br>⬜ chạy MỖI LẦN train"]
    end

    subgraph MOD["M5-M7 · HUẤN LUYỆN"]
        direction TB
        M1["4 baseline<br>⬜ RULE 4 — chạy TRƯỚC"]
        M2["LightGBM classifier<br>⬜ p_up thô"]
        M3["3x quantile regressor<br>⬜ q10 q50 q90"]
        M4["Isotonic calibration<br>⬜ RULE 6"]
        REG[("MLflow Registry<br>⬜ git hash + seed")]
        M1 --> M2 --> M4 --> REG
        M2 --> M3 --> REG
    end

    subgraph EVA["M8 · ĐÁNH GIÁ"]
        E1["vectorbt<br>⬜ phí 0.10% + slip 0.05%"]
        E2{"GATE 1<br>Sharpe ≥ 1.0<br>6/8 fold lãi"}
        E1 --> E2
    end

    subgraph SRV["M9-M11 · PHỤC VỤ"]
        direction TB
        P1["InferenceService<br>⬜ KHI nến đóng"]
        P2[("PredictionStore<br>⬜")]
        P3["OutcomeReconciler<br>⬜ chấm điểm"]
        P4["FastAPI + WS<br>⬜ 7 endpoint"]
        P5["Dashboard<br>🔨 prototype v6"]
        P1 --> P2 --> P3 --> P4 --> P5
    end

    subgraph TRD["M12-M14 · GIAO DỊCH 🔒"]
        direction TB
        R1["RiskEngine ★★<br>🔒 3 lối ra + kill switch"]
        R2["Executor ccxt<br>🔒 Testnet ∥ shadow"]
        R3["Telegram<br>⬜ chỉ khi hướng ĐỔI"]
        R1 --> R2
        R1 --> R3
    end

    ST --> F1
    ST --> L1
    FS --> V1
    LS --> V1
    V1 --> V2
    V2 -->|"đỏ = TỪ CHỐI đăng ký model"| M1
    REG --> E1
    E2 -->|"đạt"| P1
    ST --> P1
    E2 -->|"đạt + GATE 2"| R1
    P1 -.-> R1

    style VAL stroke-width:3px
    style TRD stroke-dasharray:5 5
```

**Ba điểm nghẽn cố ý trong sơ đồ:**

1. `shift_all` là **cửa duy nhất** để feature đi vào model — không có đường vòng, RULE 2 không thể bị lách vì quên.
2. Bộ dò rò rỉ nằm **giữa** kiểm định và huấn luyện, đỏ thì MLflow từ chối đăng ký model. Không phải một bước tuỳ chọn ai đó nhớ thì chạy.
3. `GATE 1` là cửa duy nhất từ nhánh nghiên cứu sang nhánh phục vụ và nhánh giao dịch.

---

## 4. MÔ HÌNH DỮ LIỆU

### 4.1 Quan hệ thực thể

```mermaid
erDiagram
    UNIVERSE_SNAPSHOT ||--o{ OHLCV_RAW : "quyết định tải cặp nào"
    OHLCV_RAW ||--|| OHLCV_CLEAN : "làm sạch, đánh dấu lỗ hổng"
    OHLCV_CLEAN ||--o{ FEATURE_ROW : "sinh, đã shift(1)"
    OHLCV_CLEAN ||--o{ LABEL_ROW : "sinh, nhìn về trước H nến"
    FEATURE_ROW ||--|| LABEL_ROW : "ghép theo (symbol, ts)"
    FOLD ||--o{ FEATURE_ROW : "chia train/test có purge"
    MODEL_RUN ||--o{ FOLD : "huấn luyện trên"
    MODEL_RUN ||--o{ PREDICTION : "sinh ra"
    PREDICTION ||--o| OUTCOME : "được chấm điểm sau khi hết hạn"

    UNIVERSE_SNAPSHOT {
        string month PK "YYYY-MM"
        string symbol PK
        float quote_volume_24h_usd
        int listed_days
        bool eligible
        bool in_training_universe
    }
    OHLCV_RAW {
        timestamp ts PK "UTC, chỉ nến ĐÃ ĐÓNG"
        string symbol PK
        string timeframe PK
        float open_high_low_close
        float volume
        float taker_buy_volume "cột 9 endpoint klines"
    }
    OHLCV_CLEAN {
        timestamp ts PK
        bool gap_before "ĐÁNH DẤU, không điền"
        int n_missing_before
        bool anomaly "nhảy giá > 50%"
    }
    FEATURE_ROW {
        timestamp ts PK
        float ret_1_to_72 "log return, scale-free"
        float vol_rv24_atr14 "chuẩn hoá theo giá"
        float x_excess_vs_btc "nhóm giá trị nhất"
        float rgm_vol_percentile
    }
    LABEL_ROW {
        timestamp ts PK
        float r_future "log return nhìn về trước H nến"
        float theta "0.3 x rolling_std, có sàn"
        int label "+1 / 0 / -1"
    }
    FOLD {
        int index PK
        timestamp train_end
        timestamp test_start "phải >= train_end + purge"
        timestamp test_end
    }
    MODEL_RUN {
        string mlflow_run_id PK
        string git_hash "RULE 10"
        int seed
        string data_hash
        string leakage_status "PASS / FAIL"
    }
    PREDICTION {
        timestamp predicted_at PK
        string symbol PK
        string timeframe PK
        float p_up "thô — CHỈ để chẩn đoán"
        float p_up_calibrated "số DUY NHẤT được hiển thị"
        float price_q10_q50_q90
        timestamp valid_until
    }
    OUTCOME {
        float realized_return
        bool hit
        timestamp scored_at
    }
```

### 4.2 Bố cục trên đĩa

```
data/
├── raw/                                    ✅ BẤT BIẾN — tải lại được bất cứ lúc nào
│   ├── ohlcv/symbol=BTCUSDT/timeframe=1h/year=2026/data.parquet
│   └── universe/month=2026-08/universe.parquet
├── clean/  🔨   ohlcv/symbol=.../timeframe=.../year=...
├── features/ ⬜ symbol=.../timeframe=.../year=...
├── labels/   ⬜ horizon=4/symbol=.../year=...
└── predictions/ ⬜ timeframe=1h/year=2026/predictions.parquet
```

**Ba luật của mô hình dữ liệu:**

| Luật | Vì sao |
|---|---|
| `raw/` không bao giờ bị sửa | Mọi lỗi sửa từ `clean/` trở đi. Nghi ngờ thì xoá `clean/` xuống và dựng lại. |
| Lỗ hổng được **đánh dấu**, không điền | Điền giá vào nến sàn không có = bịa dữ liệu. Module sau tự quyết xử lý thế nào. |
| Phân vùng theo `symbol/timeframe/year` | DuckDB đọc thẳng Parquet, truy vấn 1 năm nến 1h dưới 200 ms mà không cần database server. |

---

## 5. BA ĐƯỜNG DỮ LIỆU REALTIME

Điểm mấu chốt của thiết kế, và chỗ hầu hết dashboard dự đoán làm sai.

```mermaid
sequenceDiagram
    autonumber
    participant B as Trình duyệt
    participant BN as Binance WS
    participant API as FastAPI
    participant INF as InferenceService

    Note over B,BN: ĐƯỜNG 1 · GIÁ — vài lần/giây, KHÔNG qua backend
    B->>BN: subscribe btcusdt@kline_1h
    loop mỗi tick
        BN-->>B: giá mới
        B->>B: cập nhật hero, nháy nền 150ms
    end

    Note over BN,INF: ĐƯỜNG 2 · DỰ ĐOÁN — chỉ khi nến đóng
    BN-->>INF: kline k.x = true, nến 14:00 đã đóng
    INF->>INF: dựng feature, predict, calibrate
    INF->>API: ghi PredictionStore
    API-->>B: đẩy qua WS /ws/predictions
    B->>B: vẽ đường tím nét đứt + dải q10-q90

    Note over B,API: ĐƯỜNG 3 · LỊCH SỬ — một lần khi mở trang
    B->>API: GET /api/ohlcv?limit=500
    API-->>B: 500 nến
    B->>API: GET /api/predictions/history
    API-->>B: track record để vẽ dải chấm ✓/✗

    Note over B: Backend chết thì đường 1 vẫn chạy.<br>Đường 2 im quá valid_until thì hiện «Dự đoán cũ» — RULE 8
```

**Vì sao không chạy inference mỗi giây:** trong một nến chưa đóng, đầu vào của model gần như không đổi — chạy lại chỉ tạo ra một con số rung lắc gây hiểu lầm rằng model đang "suy nghĩ lại". Nó không suy nghĩ lại; nó đang nhìn cùng một dữ liệu.

### 5.1 Máy trạng thái độ tươi (RULE 8)

```mermaid
stateDiagram-v2
    [*] --> DangKetNoi
    DangKetNoi --> Live: nhận tick đầu tiên
    Live --> Cham: > 5 giây không có tick
    Cham --> Live: có tick trở lại
    Cham --> MatKetNoi: > 30 giây hoặc WS đóng
    Live --> MatKetNoi: WS đóng
    MatKetNoi --> DangKetNoi: tự nối lại (backoff luỹ thừa)

    state "Dự đoán cũ" as DuDoanCu
    Live --> DuDoanCu: now > valid_until mà chưa có bản mới
    DuDoanCu --> Live: nhận dự đoán mới

    note right of MatKetNoi
        Giá chuyển XÁM + hiện dấu thời gian cuối.
        KHÔNG BAO GIỜ im lặng hiển thị số cũ
        như thể nó vẫn đúng.
    end note
```

---

## 6. VÒNG ĐỜI MỘT DỰ ĐOÁN

Từ lúc nến đóng tới lúc con số được chấm đúng/sai. Vòng khép kín này nuôi `/api/accuracy`, dải track record trên chart, và tầng audit trôi hiệu chỉnh.

```mermaid
sequenceDiagram
    autonumber
    participant BN as Binance
    participant DET as Candle-close detector
    participant FB as FeatureBuilder
    participant MD as Model + Calibrator
    participant PS as PredictionStore
    participant RC as OutcomeReconciler
    participant UI as Dashboard

    BN-->>DET: kline 14:00 đóng (k.x=true)
    Note over DET: Nguồn dự phòng: REST poll tại close+5s<br>nếu WS im — detector chết lặng lẽ là<br>nguyên nhân «Dự đoán cũ» số một

    DET->>FB: yêu cầu feature tại t=14:00
    FB->>FB: 9 nhóm → shift_all() → assert_scale_free()
    FB-->>MD: ma trận feature 1 hàng

    MD->>MD: classifier → p_up thô
    MD->>MD: isotonic → p_up_calibrated
    MD->>MD: 3 quantile → q10 / q50 / q90
    MD->>MD: vùng chết: >0.58 TĂNG · <0.42 GIẢM · còn lại KHÔNG RÕ

    MD->>PS: ghi Prediction (dedupe theo symbol+tf+predicted_at)
    PS-->>UI: đẩy WebSocket
    UI->>UI: vẽ đường tím nét đứt, valid_until = 18:00

    Note over PS,RC: ... 4 giờ trôi qua ...

    BN-->>RC: kline 18:00 đóng
    RC->>PS: quét prediction có valid_until <= now, chưa chấm
    RC->>RC: outcome = log(close_18h / last_close)
    RC->>RC: hit = dấu(outcome) khớp direction?
    RC->>PS: cập nhật outcome + hit + scored_at
    PS-->>UI: chấm ✓ hoặc ✗ hiện trên dải track record
    RC->>RC: audit A4 — so Brier 30 ngày với Brier lúc đăng ký
```

**Hai thứ vòng này bắt buộc phải có mà nhiều hệ thống bỏ quên:**

- **Dedupe** — chạy lại service không được tạo dự đoán trùng cho cùng một nến. Cùng triết lý với downloader idempotent ở M1.
- **Chấm điểm tự động** — nếu phải chấm tay, sau hai tuần sẽ không ai chấm nữa, và `/api/accuracy` trở thành con số bịa.

---

## 7. KIỂM ĐỊNH — PURGED WALK-FORWARD ★

Thư viện `mlfinlab` từng làm sẵn việc này **đã đóng mã nguồn**. Không còn lựa chọn OSS nào — phải tự viết. Đây chính xác là thứ quyết định repo nói thật hay nói dối.

### 7.1 Bố trí fold theo thời gian

```mermaid
gantt
    title Walk-forward 8 fold — purge và embargo ở mọi ranh giới
    dateFormat YYYY-MM-DD
    axisFormat %m/%y

    section Fold 1
    Train              :done, 2023-01-01, 300d
    Purge H nến        :crit, 2023-10-28, 8d
    Test               :active, 2023-11-05, 90d
    Embargo H nến      :crit, 2024-02-03, 8d

    section Fold 2
    Train (mở rộng)    :done, 2023-01-01, 390d
    Purge H nến        :crit, 2024-01-26, 8d
    Test               :active, 2024-02-03, 90d
    Embargo H nến      :crit, 2024-05-03, 8d

    section Fold 3
    Train (mở rộng)    :done, 2023-01-01, 480d
    Purge H nến        :crit, 2024-04-25, 8d
    Test               :active, 2024-05-03, 90d
    Embargo H nến      :crit, 2024-08-01, 8d
```

**Toán chỉ số chính xác:**

```
n = len(index);  test_len = (n − min_train) // n_folds

fold k (0-based):
    test_start = min_train + k · test_len
    test_end   = min_train + (k+1) · test_len
    train      = [0, test_start − purge)          ← purge cắt TRƯỚC test
    fold sau chỉ nhận thêm dữ liệu từ test_end + embargo trở đi
```

| Khái niệm | Cắt bao nhiêu | Vì sao |
|---|---|---|
| **Purge** | H nến cuối tập train | Nhãn của những nến đó nhìn vào vùng test. Không cắt = model đã thấy đáp án. |
| **Embargo** | H nến sau tập test | Tự tương quan không dừng lại đúng tại ranh giới; mẫu ngay sau test vẫn còn dính. |

**Ba bất biến được test:** `train_end + purge ≤ test_start` ở mọi fold · các tập test không giao nhau · tổng thời gian test ≥ 24 tháng khi `n_folds=8` (điều kiện của GATE 1).

### 7.2 Năm phép thử rò rỉ

```mermaid
flowchart LR
    IN["features + labels + splitter"] --> P1 & P2 & P3 & P4 & P5

    P1["1 · Dịch nhãn<br>dịch thêm 1 bước, train lại"]
    P2["2 · Xáo trộn nhãn<br>xáo ngẫu nhiên, train lại"]
    P3["3 · Tương quan<br>corr(feature, label)"]
    P4["4 · Đảo thời gian<br>train tương lai, test quá khứ"]
    P5["5 · Ranh giới fold<br>so mẫu cuối train vs đầu test"]

    P1 --> D1{"điểm TĂNG?"}
    P2 --> D2{"vẫn > 50%<br>đáng kể?"}
    P3 --> D3{"có cột<br>> 0.99?"}
    P4 --> D4{"điểm<br>tương đương?"}
    P5 --> D5{"chồng lấn<br>thời gian?"}

    D1 -->|"có"| FAIL
    D2 -->|"có"| FAIL
    D3 -->|"có"| FAIL
    D4 -->|"có"| SUS
    D5 -->|"có"| FAIL

    FAIL["❌ RÒ RỈ<br>MLflow tag leakage=FAIL<br>TỪ CHỐI đăng ký model"]
    SUS["⚠️ ĐÁNG NGHI<br>model học thứ không<br>phụ thuộc thời gian"]

    D1 & D2 & D3 & D4 & D5 -->|"không"| OK["✅ qua — được phép train tiếp"]
```

Bộ probe dùng **model proxy rẻ** (LightGBM 50 cây hoặc logistic) — mục tiêu là *phát hiện rò rỉ*, không phải điểm cao, nên phải chạy dưới 60 giây để nằm được trong mỗi lần train.

---

## 8. VÒNG HUẤN LUYỆN VÀ CỔNG CHẤT LƯỢNG

```mermaid
flowchart TB
    START(["make train SYM=... TF=..."]) --> G0{"working tree sạch?"}
    G0 -->|"không"| STOP1["❌ dừng — git hash sẽ<br>không trỏ đúng code (RULE 10)"]
    G0 -->|"có"| BASE["Chạy 4 baseline<br>always-up · seasonal-naive<br>random · buy-and-hold"]

    BASE --> LOG1[("ghi MLflow")]
    LOG1 --> PROBE["Chạy 5 phép thử rò rỉ<br>trên feature + label"]
    PROBE --> G1{"tất cả PASS?"}
    G1 -->|"không"| STOP2["❌ tag leakage=FAIL<br>KHÔNG đăng ký model<br>→ runbook leakage-audit"]

    G1 -->|"có"| SPLIT["PurgedWalkForward<br>sinh 8 fold"]
    SPLIT --> LOOP["Với MỖI fold:<br>chuẩn hoá trong fold<br>train clf + 3 quantile<br>fit isotonic trên 20% cuối train"]
    LOOP --> OOS["Gộp dự đoán out-of-sample"]

    OOS --> G2{"thắng cả 4 baseline<br>SAU KHI trừ phí?"}
    G2 -->|"không"| STOP3["❌ model không có giá trị<br>RULE 4 — quay lại M3/M4"]

    G2 -->|"có"| G3{"accuracy 1h > 60%?"}
    G3 -->|"có"| SUSPECT["⚠️ RULE 11<br>GIẢ ĐỊNH CÓ RÒ RỈ<br>chạy lại quy trình truy tìm<br>TRƯỚC KHI ăn mừng"]
    SUSPECT --> PROBE

    G3 -->|"không"| REG[("✅ đăng ký MLflow<br>git hash · seed · data hash")]
    REG --> BT["M8 · backtest vectorbt<br>phí + slippage, mọi fold"]
    BT --> G4{"GATE 1<br>Sharpe ≥ 1.0 · DD ≤ 25%<br>PF ≥ 1.2 · 6/8 fold lãi"}
    G4 -->|"trượt"| REC["📝 ghi lại kết quả trượt<br>— vẫn là kết quả hợp lệ"]
    G4 -->|"đạt"| SERVE(["→ M9-M11 phục vụ<br>→ M13 mở đường tiền thật"])
```

**Chi tiết dễ làm sai nhất trong vòng này:** chuẩn hoá (fit z-score) và fit isotonic phải nằm **bên trong** fold train. Fit trên toàn chuỗi rồi mới chia fold là rò rỉ — tinh vi và gần như vô hình trên biểu đồ.

---

## 9. MÁY TRẠNG THÁI CHẾ ĐỘ GIAO DỊCH

```mermaid
stateDiagram-v2
    state "TẮT (mặc định)" as TAT
    state "PAPER — khớp mô phỏng giá thật" as PAPER
    state "TESTNET — sổ lệnh riêng của Binance" as TESTNET
    state "SHADOW — mainnet thật, KHÔNG gửi lệnh" as SHADOW
    state "LIVE — tiền thật" as LIVE
    state "KHOÁ AN TOÀN" as SAFE

    [*] --> TAT
    TAT --> PAPER: bật tay
    PAPER --> TESTNET: GATE 1 + GATE 2 đạt
    PAPER --> SHADOW: GATE 1 + GATE 2 đạt
    TESTNET --> LIVE: GATE 3 + GATE 4 đạt
    SHADOW --> LIVE: GATE 3 + GATE 4 đạt

    LIVE --> SAFE: lỗ ngày > 2% vốn
    LIVE --> SAFE: mất kết nối > 60 giây
    LIVE --> SAFE: đối soát lệch số dư
    LIVE --> SAFE: kill switch
    SAFE --> TAT: người vận hành xử lý xong

    LIVE --> TAT: khởi động lại service
    TESTNET --> TAT: khởi động lại service
    PAPER --> TAT: khởi động lại service

    note right of TAT
        MỌI lần khởi động lại đều
        quay về TẮT. Đó là thiết kế,
        không phải phiền toái.
    end note

    note right of SAFE
        KHOÁ AN TOÀN không tự
        mở lại. Phải có người xem
        và bật tay.
    end note
```

---

## 10. ĐƯỜNG TỚI TIỀN THẬT

```mermaid
flowchart TB
    BT["M8 · Backtest có phí"] --> G1{"GATE 1 · THỐNG KÊ"}
    G1 --> G1C["≥8 fold trải ≥24 tháng<br>Sharpe ≥ 1.0 sau phí<br>max drawdown ≤ 25%<br>profit factor ≥ 1.2<br>≥6/8 fold có lãi<br>thắng buy-and-hold"]

    G1C --> G2{"GATE 2 · HIỆU CHỈNH"}
    G2 --> G2C["Brier tốt hơn baseline<br>reliability trong ±10% mọi bin<br>«nói 60% thì đúng ~60% số lần»"]

    G2C --> M13["M13 · RiskEngine ★★<br>PHẢI viết TRƯỚC executor"]
    M13 --> M13C["Nhóm 1 · giới hạn vốn<br>Nhóm 2 · toàn vẹn kỹ thuật<br>Nhóm 3 · LỐI RA từng vị thế"]

    M13C --> G3{"GATE 3 · 60 NGÀY TIỀN ẢO"}
    G3 --> VA["Vế A · Testnet<br>chứng minh ĐƯỜNG ỐNG<br>≥100 lệnh · 0 sự cố"]
    G3 --> VB["Vế B · Shadow mainnet<br>chứng minh KINH TẾ<br>PnL trong ±30% backtest"]

    VA --> G4{"GATE 4 · AN TOÀN KỸ THUẬT"}
    VB --> G4
    G4 --> G4C["kill switch · lỗ ngày 2% tự tắt<br>≤1% vốn/lệnh · clientOrderId idempotent<br>đối soát 5 phút · key TẮT quyền rút<br>heartbeat 60s · khởi động = TẮT"]

    G4C --> LIVE(["💰 TIỀN THẬT<br>hạn mức nhỏ nhất có thể"])

    style M13 stroke-width:3px
    style LIVE stroke-dasharray:5 5
```

> **Không chấm PnL trên Testnet.** Testnet có sổ lệnh riêng và rất mỏng; giá ở đó không bám 1:1 giá thật. Sáu mươi ngày Testnet nói cho bạn biết **code có đúng không** — nó không nói gì về khớp lệnh, trượt giá hay lợi nhuận. Đó là việc của vế shadow.

**Nhóm 3 của M13 — lối ra, phần hay bị quên nhất:**

| Lối ra | Quy tắc |
|---|---|
| Stop-loss | 1.5 × ATR14, **đặt cùng lúc** với lệnh vào, không đặt sau |
| Hết hạn | Hết horizon (4 nến với khung 1h) mà chưa chạm mục tiêu → thoát theo giá thị trường |
| Tín hiệu tắt | Tín hiệu mới rơi vào vùng KHÔNG RÕ → đóng vị thế đang mở, không chờ |

> Định nghĩa lối ra **trước** khi viết lối vào. Một hệ thống biết khi nào vào mà không biết khi nào ra sẽ tích luỹ những vị thế không còn ai có lý do để giữ — và đó là cách phần lớn bot cá nhân thua sạch.

---

## 11. TRIỂN KHAI

```mermaid
flowchart TB
    subgraph LOCAL["💻 Máy cá nhân — giai đoạn 1"]
        direction TB
        L1["uv + Python 3.12<br>.venv/"]
        L2["make download / train / test"]
        L3["mlflow ui :5000"]
        L4["uvicorn :8000"]
        L5[("data/ — vài GB Parquet")]
    end

    subgraph BROWSER["🌐 Trình duyệt"]
        BR1["Dashboard tại localhost:8000"]
        BR2["hoặc file HTML standalone<br>✅ nối thẳng Binance, không cần server"]
    end

    subgraph FUTURE["☁️ VPS — sau GATE 1, chưa quyết"]
        direction TB
        C1["InferenceService 24/7"]
        C2["APScheduler → Prefect<br>khi retry/observability thành đau thật"]
        C3["Executor 🔒"]
    end

    L2 --> L5 --> L4 --> BR1
    L2 --> L3
    BR2 -.->|"REST + WS công khai"| BIN["Binance"]
    L4 -.-> FUTURE

    style FUTURE stroke-dasharray:5 5
```

**Quyết định trì hoãn có chủ ý** (nguyên tắc S4 của `04_EXECUTION_STRATEGY`):

| Hạng mục | Trì hoãn tới | Vì sao |
|---|---|---|
| VPS / deploy | Sau GATE 1 | Model chưa thắng baseline thì deploy là trang trí |
| Prefect | Khi APScheduler thành đau thật | Không thêm hạ tầng trước khi có triệu chứng |
| MCP server | M9 | Trước đó chưa có API để bọc |
| GARCH | Sau GATE 1 | EWMA realized vol đủ cho position sizing |

---

## 12. PHỤ THUỘC MODULE VÀ ĐƯỜNG GĂNG

```mermaid
flowchart LR
    M0["M0 ✅"] --> M1["M1 🔨"] --> M2["M2 🔨"] --> M3["M3 ⬜"] --> M6["M6 ⬜ ★"]
    M2 --> M4["M4 ⬜"] --> M6
    M6 --> M5["M5 ⬜"] --> M7["M7 ⬜"] --> M8["M8 ⬜"]
    M7 --> M10["M10 ⬜"] --> M9["M9 ⬜"] --> M11["M11 🔨"]
    M2 --> M9
    M10 --> M12["M12 ⬜"]
    M8 -->|"GATE 1"| M13["M13 🔒 ★★"] --> M14["M14 🔒"]

    style M6 stroke-width:4px
    style M13 stroke-width:3px
```

**Đường găng:** `M0 → M1 → M2 → M3 → M6 → M5 → M7 → M8`.

Mọi thứ khác làm song song hoặc trễ hơn được. **Nếu thời gian eo hẹp, cắt M11 (dashboard) trước — cắt M6 (kiểm định) là tự huỷ dự án.**

---

## 13. LỚP CẮT NGANG

### 13.1 Sáu tầng audit

Tầng nào đỏ thì tầng sau không còn ý nghĩa.

| Tầng | Chống | Kích hoạt | Hành động khi đỏ |
|---|---|---|---|
| **A0** lint/format | style trôi | mỗi lần sửa file | tự sửa tại chỗ |
| **A1** guardrail | RULE 1+2 bị lách | mỗi commit | **chặn commit** |
| **A2** 5 phép thử | rò rỉ tinh vi | **mỗi lần train** | tag `leakage=FAIL`, từ chối đăng ký |
| **A3** chất lượng dữ liệu | trôi dữ liệu | mỗi lần tải + snapshot tháng | không build clean |
| **A4** trôi hiệu chỉnh | «62%» hết đúng | hằng tuần | cờ «cần retrain» + Telegram |
| **A5** live vs backtest | tự lừa khâu cuối | hằng ngày khi shadow | **vấn đề ở backtest**, quay lại M8 |

> Chế độ hỏng nguy hiểm nhất của audit — giống RULE 8 của dashboard — là **không chạy mà không ai biết**. Vì vậy báo cáo sáng của M12 phải in cả dòng "audit A3/A4 lần cuối chạy lúc nào".

### 13.2 Xử lý lỗi theo tầng

| Tầng | Chế độ hỏng | Ứng xử |
|---|---|---|
| Tải dữ liệu | sàn sửa nến cũ | **ghi log chênh lệch**, giữ bản mới — không ghi đè lặng lẽ |
| Tải dữ liệu | lỗ hổng (sàn bảo trì) | đánh dấu, không điền |
| Tải dữ liệu | rate limit / mạng | retry backoff, một cặp lỗi không làm sập cả mẻ |
| Inference | model lỗi | **giữ dự đoán cũ + đánh dấu stale** — không bao giờ im lặng |
| Inference | detector nến đóng chết | nguồn dự phòng REST poll tại close+5s |
| Dashboard | mất WS | giá xám + dấu thời gian cuối, tự nối lại backoff |
| Executor 🔒 | mất kết nối > 60s | đóng vị thế hoặc chuyển KHOÁ AN TOÀN |
| Executor 🔒 | gửi lại lệnh | `clientOrderId` idempotent — không tạo lệnh mới |

### 13.3 Bảo mật

| Hạng mục | Quy tắc |
|---|---|
| Khoá API | Chỉ trong `.env` (đã gitignore). **Không bao giờ** log hay in giá trị. |
| Quyền của khoá | Bật giao dịch, **TẮT quyền rút tiền**, khoá theo IP. Không có ngoại lệ. |
| Dữ liệu thị trường | REST/WS công khai — không cần khoá. Đây là lý do dashboard chạy được từ file HTML. |
| Không commit | `.env` · `data/` · `mlruns/` — đã có trong `.gitignore` |
| Hook cưỡng chế | `PreToolUse` chặn mọi lệnh khớp `create_order` khi `TRADING_ENABLED≠true` |

---

## 14. NHỮNG QUYẾT ĐỊNH ĐÃ CHỐT VÀ CHƯA CHỐT

### Đã chốt (xem `docs/adr/`)

| # | Quyết định | Ghi ở |
|---|---|---|
| ADR-001 | Python 3.12 + uv · bố cục `src/` · stub nổ thay vì trả giá trị giả | `adr/001-skeleton.md` |
| — | PredictionStore = Parquet append + DuckDB, không thêm hạ tầng | `04 §1 G1` |
| — | OutcomeReconciler thuộc M10, là chủ quản việc chấm điểm | `04 §1 G2` |
| — | Chỉ báo causal tính một lần; **chuẩn hoá** mới phải per-fold | `04 §1 G5` |
| — | 3 model theo timeframe (1h/4h/1d), khác nhau chỉ ở config | `04 §1 G6` |
| — | `expected_vol_pct` = EWMA realized vol; GARCH là nâng cấp sau GATE 1 | `04 §1 G7` |

### Chưa chốt — chờ quyết định

| # | Câu hỏi | Ảnh hưởng |
|---|---|---|
| 1 | Ngưỡng thanh khoản: giữ 5 triệu USD/30 ngày (thực đo 422/474 cặp lọt qua) hay siết 150 triệu? | Kích thước vũ trụ coin, thời gian tải |
| 2 | Tải 40 cặp theo config hay 45–50 để dư? | Dung lượng, thời gian W1 |
| 3 | Trượt GATE 1 thì quay lại M3 (feature) hay M4 (nhãn) trước? | Nên quyết bằng đầu lạnh **trước khi** có kết quả |

---

*Tài liệu liên quan: `00_MASTER_PLAN.md` (hiến pháp) · `03_MODULE_SPECS.md` (DoD từng module) · `04_EXECUTION_STRATEGY.md` (WBS + audit) · `05_DASHBOARD_UX_PLAN.md` (UX) · `docs/design/system-map.html` (bản đồ trạng thái) · `docs/adr/` (quyết định kiến trúc)*
