# 19 · RÀ SOÁT MODULE PREDICTION — trạng thái ngày 27-08-2026

> Sinh từ một vòng rà soát 6 mũi độc lập + phản chứng từng blocker (16 tác nhân).
> Mọi phát hiện dưới đây đã được **tự kiểm lại bằng lệnh**, không chép từ tác nhân.
> Câu hỏi khởi phát: *"Design System báo module prediction bị conflict và không deploy được"*.

---

## 0 · Trả lời thẳng câu hỏi

**Không deploy được vì chưa có gì để deploy — không phải vì conflict.**

| Kiểm | Kết quả |
|---|---|
| Git conflict / conflict marker | **không có** ở bất kỳ tệp nào |
| Dự án "Design System" trên claude.ai | **rỗng — 0 tệp** |
| Hàm `predict()` trong toàn repo | **không tồn tại** |
| Module sản xuất còn `NotImplementedError` | **9/13** |
| `make api` | được viết để `exit 1` — *"M9 chưa được xây"* |
| `fastapi` · `uvicorn` trong `pyproject.toml` | có khai báo · **không cài trong `.venv`** |
| Dockerfile · CI · tệp serving chạy được | **không có** |

Chín module còn là stub: `backtest/engine.py` · `data/store.py` · `features/builder.py` ·
`labels/direction.py` · `models/baselines.py` · `models/calibrate.py` · `models/train.py` ·
`risk/limits.py` · `validation/leakage.py`.

Chỉ có **hai** module mang mã thật: `data/derivatives.py` và `validation/purged.py`.

### Một cải chính

Tôi đã báo *"giao diện dùng `direction` 27 lần"*. **Sai.** 19/28 lần là `flex-direction`
trong CSS; phần còn lại là văn xuôi và chuỗi dịch. **Giao diện không đọc `direction`
như một trường dữ liệu.** Xung đột hợp đồng có thật, nhưng nằm ở chỗ khác — xem §1.

---

## 1 · Ba blocker đã xác nhận

### B1 · `PREDICTION_DESIGN.md` còn mang rào chắn **4,0σ̂** mà ADR-017 đã thay bằng **6,0σ̂**

Bốn chỗ, và chúng nằm đúng ở hai nơi mà mã sẽ hiện thực:

| Dòng | Nội dung hiện tại | Phải là |
|---|---|---|
| `:253` | `target_price: float  # entry × (1 + 4,0·σ̂)` — **trong hợp đồng dữ liệu** | `1 + 6,0·σ̂` |
| `:474` | `def p_star_event(sigma_d, sl_mult=1.2, tp_mult=4.0)` — **mã L4** | `tp_mult=6.0` |
| `:198` | `"""Ngưỡng thắng của cược RÀO CHẮN 3,33:1"""` | `5,00:1` |
| `:478` | `payoff = 4,0/1,2 = 3,333R` | `6,0/1,2 = 5,000R` |

Cùng tệp, các dòng `:396` · `:607` · `:1099` đã ghi **6,0σ̂**. Tệp tự mâu thuẫn với chính nó.
`scripts/spec/measure_spec.py:21` đã là `1.2, 6.0`.

**Đây mới là "conflict" thật:** đặc tả nói hai điều trái nhau về cùng một hằng số.
Ai hiện thực §PHẦN 2 và ai hiện thực §L4 sẽ viết ra hai hệ thống khác nhau.

### B2 · §9.0b bắt dashboard in `p_star = 25,0%` — giá trị đúng là **18,1%**

`PREDICTION_DESIGN.md:1358` yêu cầu in `p_star` **cạnh mọi khuyến nghị**, giá trị điển hình
**25,0%**. `docs/generated/spec_numbers.md §1` sinh ra **18,1%**.

Sai **6,9 điểm**, và sai theo hướng làm hệ trông **khó thắng hơn thực tế**: người dùng đọc
"thắng 29,2% / cần 25,0%" thấy biên +4,2 điểm, trong khi biên thật là **+11,1 điểm**.

### B3 · `serving/schemas.py` là hợp đồng chết nhưng docstring tự xưng ràng buộc

```
"""Đây là *hợp đồng*, không phải gợi ý. Dashboard đọc đúng các trường này"""
```

- 68 dòng, commit **M0 `588510e`**, **chưa sửa một lần nào** từ lúc dựng khung repo
- `grep -rn "schemas" src tests scripts` (trừ chính nó) → **rỗng**. Không ai import
- **0 test** chạm tới `Prediction` — 37/37 test xanh mà không ghim một tên trường nào
- Còn `direction` · `p_up_calibrated` · `price_q10/50/90` · `confidence_band` — đều đã bị loại

`docs/18_BUILD_AND_DEPLOY_PLAN.md:25` đã gọi thẳng nó là *"hợp đồng SAI ❌ phải viết lại"*,
nhưng **trong mã không có dấu `DEPRECATED` nào**. Một phiên làm việc chỉ đọc `src/` sẽ nhận
câu trả lời trái ngược với tài liệu. Đây nhiều khả năng là nguồn của báo cáo "bị conflict".

---

## 2 · Vấn đề nghiêm trọng theo nhóm

### 2.1 · ADR-016 chưa hoàn tất — số vẫn bị chép tay

ADR-016 lập ra nguyên tắc *"tài liệu trỏ, không chép"*. Chưa thi hành xong:

| Chỗ | Số trong tài liệu | Số `measure_spec` sinh |
|---|---|---|
| `:454` `ABS_MOVE_RATIO` hard-code trong mã L4 | **0,685** | **0,7266** |
| §9.2 (đúng phần dạy rằng chép số gây 17/28 blocker) | 4 số chép | mâu thuẫn với tệp nó trỏ tới |
| §L4 bảng null (17,8% · 18,03% · 18,44% · 0,130 · 19,05%) | từ `scripts/measurements_2026_08_26/null_barrier.py` | **`measure_spec` không sinh** |
| Thời gian nắm giữ | 4 bản sao: 5,8 · 6,3 · ~6 ngày | **6,5 ngày** |

`ABS_MOVE_RATIO` tệ nhất: hai phép đo khác nhau (close-to-close một cặp vs σ̂ HAR bốn cặp)
đang dùng **cùng một tên hằng số**.

### 2.2 · ADR-017 làm lệch tài liệu ngược dòng, chưa ai dọn

- **Sáu ghi chú sửa** trong hồ sơ 09–17 chỉ trỏ ADR-013. Số "đã sửa" của chúng
  (25,0% · +5,0 · +8,7 · 1,57R) **nay lại sai** vì ADR-017 ra sau.
- **ADR-016 §3** toàn bộ bảng "Đặc tả thực thi" là số 4,0σ̂, không có ghi chú thay thế.
- **ADR-013** (chốt giữ 1,2/4,0) chưa được đánh dấu **ĐÃ THAY THẾ**.
- **§8.3** — §L4:543 hứa *"giao thức khử nhiễm siết theo ADR-017 §2"* — **chưa sửa một chữ**.
- Ngưỡng trượt giá 1,3R/1,4R biện minh bằng hoà vốn **1,57R** của rào cũ; nay là **1,81R**.

### 2.3 · Dữ liệu: **BTCUSDT không có nến 1d nào trên đĩa**

```
data/raw/ohlcv/symbol=BTCUSDT/timeframe=1h     ← chỉ có 1h
data/raw/ohlcv/symbol=ETHUSDT/timeframe=1d
data/raw/ohlcv/symbol=SOLUSDT/timeframe=1d
data/raw/ohlcv/symbol=DOGEUSDT/timeframe=1d
```

`measure_spec.py` **âm thầm resample 1h → 1d**, nên mẫu BTC bắt đầu **2021-01** thay vì
2017-08 (khớp với "BTCUSDT · 5,6 năm" trong `spec_numbers §2`). Mẻ tải bước 1 sẽ làm
**mọi con số trong ADR-013/016/017 thay đổi** — kể cả chấm GATE 1a.

Thêm: vũ trụ 40 cặp hiện có chứa **7 công cụ phi-hướng hoặc phi-crypto (17,5%)`;
`config/symbols.yaml` không có bộ lọc nào chặn, dù §11.3 đã ghi là phải thêm.

### 2.4 · `data/derivatives.py` — thu dữ liệu **không tái tạo được**, **0 test**

Module này thu open interest với **giới hạn 30 ngày — trễ là mất vĩnh viễn**. Vậy mà:

| Vấn đề | Hệ quả |
|---|---|
| **0 test** trên toàn bộ 240 dòng | không có lưới an toàn cho dữ liệu không lấy lại được |
| `except Exception` → `-1` + `log.warning` (không phải `error`) | cron hỏng **im lặng nhiều ngày** |
| mã thoát chỉ khác 0 khi `fails and total == 0` | một nguồn chạy được là che mọi lỗi còn lại |
| `_merge_write` đọc-gộp-`to_parquet(path)` **ghi đè nguyên tệp, không nguyên tử** | ngắt giữa chừng = mất toàn bộ lịch sử |
| ba hàm `fetch_*` ném `KeyError` khi sàn trả danh sách rỗng | bị nuốt thành `-1`, không phân biệt được "không có dữ liệu" với "hỏng" |
| `snapshot_orderbook` dùng `normalize_symbol` (→ `BTC/USDT`, **spot**) trong khi `collect` đặt `defaultType="future"` | chụp sổ lệnh **spot** — có thể đúng (hệ chỉ spot) nhưng **không nơi nào nói ra** |

### 2.5 · `validation/purged.py` — bộ chia đúng, nhưng thiếu sàn và thiếu răng

- **`test_size` không có sàn ngoài `≥ 1`.** Ở `n=1095` (đúng cỡ mẫu §LV.4 tự tính là
  *"vừa đủ"*), mỗi lát test chỉ **45 nến** — nhỏ hơn thiết kế 4 lần, **không cảnh báo**.
  §LV.4 kết luận "1.100 nến ≈ vừa đủ"; mã cần **1.460 nến** mới cho lát 91 nến.
- **`assert_no_overlap` gần như hằng đúng** với mọi fold do chính lớp này sinh ra —
  `train_end < test_start` đã được `_layout` bảo đảm về mặt xây dựng. Nó được chú thích là
  "phép dò rò rỉ #5" nhưng thực chất không dò được gì từ chính nó.
- **Ba sơ đồ trong docstring không mô tả đúng mã**: mã là walk-forward **cửa sổ mở rộng**
  (`train_idx = np.arange(0, tr_end)` — luôn từ 0), sơ đồ vẽ cửa sổ trượt.
- `Fold.gap_bars` tên là "bars" nhưng trả `pd.Timedelta`.

### 2.6 · Bộ dò rò rỉ: xanh nhưng lỏng

- **Ngưỡng rộng 3+ độ lệch chuẩn** so với nhiễu thật của chính bộ test ⇒ chỉ bắt rò rỉ khổng lồ.
  Seed cố định **giấu luôn độ nhiễu đó**.
- **3/5 phép nghiệm thu chỉ chứng minh hằng đẳng thức số học**, không chứng minh phép dò
  phát hiện được rò rỉ. Thực tế chỉ **1–2/5** thật sự nghiệm thu.
- **Rò rỉ cục bộ theo fold vô hình**: `_score` lấy trung bình qua 5 fold, một rò rỉ khổng lồ
  ở một fold bị pha loãng.
- **Bốn lớp rò rỉ không được phủ, và khoảng trống nằm ở ĐẶC TẢ** — cả `03 §M6` lẫn `§LV`
  đều không đòi: (a) fit scaler toàn mẫu (b) chọn đặc trưng ngoài fold
  (c) nhãn chồng lấn thiếu purge (d) survivorship.
- `config/model.yaml` khối `validation` vẫn ở trạng thái §LV.4 tuyên bố **phải đổi**;
  bộ dò chạy trên hằng số riêng (`PURGE = 20`), **không test nào ghim config**.

### 2.7 · Giao diện: không xung đột — **thiếu**

Không phải "UI dùng trường đã chết", mà **UI chưa có ba trường bắt buộc của hợp đồng mới**,
đứng đầu là **`p_required`**. §9.3 liệt kê sáu thứ dashboard **bắt buộc** hiển thị —
**bốn trong sáu không tồn tại một chuỗi ký tự nào** ở bất kỳ tệp giao diện nào.

- §9.4 cấm "đường nối tới q50" trong bảng *"quy ước thị giác — không thương lượng"*;
  prototype **đang vẽ đúng đường đó**.
- `02_DESIGN_SYSTEM.md:248` đặt bất biến *"con số luôn ≥ 58%"* — **bất khả thi** khi
  `p_up ≡ 0,50` theo cấu tạo. `web/tokens.css` thiếu token trạng thái `stale`.
- `CLAUDE.md:104` vẫn phong **prototype v6** làm "hợp đồng UI"; UI thật đã tới **v14**.
- `config/model.yaml` vẫn là cấu hình kiến trúc cũ: nhãn ba lớp · classifier hướng ·
  ba model quantile · ngưỡng vùng chết cứng — **cả bốn đều đã bị loại**.
- `ADR-005` được trích như thẩm quyền đã hiệu lực, nhưng **chưa được viết**.

### 2.8 · Cổng chất lượng và phụ thuộc

- **`make lint` đỏ vĩnh viễn: 501 lỗi, 100% trong `scripts/`** — mã sản xuất sạch.
  Một cổng không bao giờ xanh sẽ được học cách bỏ qua.
- **`hexital`** — thứ `00 §3` chốt là *"nguồn chân lý duy nhất về chỉ báo"* —
  **không có trong `pyproject.toml`**, và `CLAUDE.md` không nhắc tên nó lần nào.
- `scipy` không có trong nhóm phụ thuộc nào. *(Nhưng: `statistics.NormalDist` của thư viện
  chuẩn cung cấp đúng `ppf`/`cdf` — có thể không cần scipy chỉ vì L3.)*
- `measure_spec.py:127` đọc Parquet **trực tiếp bằng `glob`** — vi phạm luật repo
  *"chỉ `data.store` được đọc Parquet"*, và đi vòng qua tầng làm sạch.
- **Hai bề mặt rào chắn sống song song**, đo bằng hai máy khác nhau, cho hai kết luận khác
  nhau về **chính ô đang dùng** — và bề mặt cũ vẫn tự nhận ô 1,2/4,0 là *"đang dùng"*.
- Hai kế hoạch dùng chung nhãn **"M-A"** cho hai mốc khác nhau (`§11.1` vs `doc 18`),
  chênh ~7 ngày công và 5 tuần lịch; ước lượng "≈17 ngày" của §11.1 **tính cả việc đã xong**.
- `.claude/launch.json` trỏ port 8944 — **tệp không tồn tại trên đĩa**.

---

## 3 · Một tin tốt

**Bước 0b đã có câu trả lời, và là nhánh tốt.** Kho `data.binance.vision` **giữ các cặp đã
huỷ niêm yết** và có endpoint liệt kê toàn bộ. Bước 0b được ước lượng 0,25 ngày và đang chặn
bước 1 — nay mở khoá được cả bản vá survivorship lẫn khả năng làm tầng cắt ngang.

---

## 4 · Thứ tự đề xuất

| # | Việc | Vì sao trước |
|---|---|---|
| 1 | Dọn hậu quả **ADR-017**: sửa 4 chỗ ở B1, sửa `p_star` B2, đánh dấu ADR-013 **ĐÃ THAY THẾ**, thêm ghi chú vào ADR-016 §3 | đặc tả đang dạy hai điều trái nhau — mọi mã viết ra từ đây đều nhiễm |
| 2 | `schemas.py`: viết lại theo PHẦN 2 **hoặc** đánh dấu `DEPRECATED` ngay trong mã + **test ghim tên trường** | nguồn của báo cáo "conflict"; và 0 test nghĩa là lệch tiếp theo cũng sẽ trôi |
| 3 | **Tải BTCUSDT 1d** + mẻ 40 cặp (bước 0b đã mở khoá) | mọi con số hiện tại đo trên BTC thiếu 3,5 năm |
| 4 | **Test cho `derivatives.py`** + `to_parquet` nguyên tử + mã thoát đúng | dữ liệu OI mất là mất vĩnh viễn |
| 5 | Sàn `test_size` trong `purged.py` + sửa ba sơ đồ docstring | GATE 1 đòi 8 fold "đủ lớn"; hiện không có định nghĩa "đủ" |
| 6 | Hoàn tất ADR-016: `ABS_MOVE_RATIO`, §9.2, bảng null §L4, thời gian nắm giữ | nguyên tắc đã lập nhưng chưa thi hành xong |
| 7 | `make lint` xanh (loại `scripts/measurements_*` khỏi cổng hoặc dọn) | cổng đỏ vĩnh viễn = không có cổng |
| 8 | Cập nhật `CLAUDE.md` §Trạng thái + gỡ "prototype v6 là hợp đồng UI" | tệp mọi phiên đọc trước tiên đang lệch xa thực tế |

**Không có việc nào ở trên là "deploy".** Đường deploy chưa tồn tại và chưa nên tồn tại —
`predict()` còn chưa được viết.
