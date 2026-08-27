# CLAUDE.md — hướng dẫn làm việc trong repo này

> Đọc file này trước khi sửa bất cứ thứ gì.
>
> ⚠️ **ĐANG TÁI CẤU TRÚC TÀI LIỆU (từ 27/08/2026).** Phạm vi sản phẩm đã đổi
> (ADR-019): nền tảng NHIỀU người dùng, 2 mode Paper/Trading (thủ công + bot),
> lõi dự đoán 2 tầng rule-based → ML. Toàn bộ tài liệu thế hệ 1 đã chuyển vào
> `docs/Old/` (đọc `docs/Old/README.md` trước). Bộ tài liệu mới `docs/00–08`
> đang được viết và duyệt từng bước — file nào đã tồn tại trong `docs/` thì file
> đó là nguồn sự thật; chủ đề nào chưa có file mới thì tra `docs/Old/`.
> Mọi tham chiếu `docs/XX_...` cũ trong mã nguồn đọc là `docs/Old/XX_...`.
>
> Chi tiết đầy đủ (bản cũ): `docs/Old/00_MASTER_PLAN.md` · đặc tả module: `docs/Old/03_MODULE_SPECS.md` · thứ tự làm việc + audit: `docs/Old/04_EXECUTION_STRATEGY.md`

---

## Dự án này làm gì

Pipeline dự đoán **hướng giá crypto** cho bất kỳ cặp USDT nào trên Binance, kèm
dashboard realtime. Ba đầu ra mỗi lần suy luận: hướng (`p_up` đã hiệu chỉnh),
dải giá (quantile 10/50/90), và biến động kỳ vọng. Khung 1h/4h (intraday) và 1d.

Kiến trúc auto-trade được dựng sẵn nhưng **mặc định TẮT**. Hệ 4 gate đã bị bỏ
(ADR-020) — thay bằng nhãn trạng thái kiểm chứng + bộ an toàn kỹ thuật bắt buộc.

Mục tiêu kép: xây sản phẩm thật **và** học Claude Code. Chủ repo là PCT, trình độ
Python cơ bản — code cần comment giải thích, mỗi module có script chạy độc lập.

---

## Mười hai luật — không thương lượng

Đây không phải best practice chung chung. Mỗi luật chống lại một cách cụ thể mà
dự án dự đoán giá sẽ tự lừa mình. Bản đầy đủ ở `docs/00_MASTER_PLAN.md §1`.

| # | Luật | Kiểm bằng |
|---|---|---|
| 1 | **Không train trên giá tuyệt đối.** Mọi feature phải scale-free: log return, tỉ lệ, z-score. | `assert_scale_free()` |
| 2 | **Mọi feature dịch ít nhất 1 nến.** Qua đúng một hàm: `features.shift_all()`. | `tests/test_leakage.py` |
| 3 | **Chỉ chia theo thời gian.** Cấm `train_test_split`, cấm `KFold`. Dùng purged walk-forward tự viết. | `validation/purged.py` |
| 4 | **Đánh bại 3 baseline trước** (always-up, seasonal-naive, random) — out-of-sample, sau phí. | `models/baselines.py` |
| 5 | **Mọi con số đều đã trừ phí:** taker 0,10%/chiều + slippage 0,05%. | `config/model.yaml → costs` |
| 6 | **Xác suất phải hiệu chỉnh.** `predict_proba()` thô không phải xác suất. Isotonic trên tập validation riêng. | reliability diagram |
| 7 | **Dự đoán không được nhìn giống dữ liệu thật.** Tím, nét đứt. Không bao giờ xanh/đỏ. | `docs/02_DESIGN_SYSTEM.md` |
| 8 | **Dashboard luôn nói thật về độ tươi:** Live / Chậm / Mất kết nối / Dự đoán cũ. | — |
| 9 | **Nói thật về mức độ đã kiểm chứng, và không phát hành nửa vời.** Mỗi phương pháp mang nhãn trạng thái kiểm chứng sinh tự động, hiện cạnh mọi khuyến nghị. Tính năng chạm tiền thật chỉ ra mắt khi đủ bộ an toàn kỹ thuật (nút dừng khẩn cấp, chống trùng lệnh, đối soát, giới hạn, khoá không quyền rút). *(ADR-020 thay hệ 4 gate — người dùng quyết định có tin dự đoán hay không; nền tảng chịu trách nhiệm về lỗi phần mềm.)* | `docs/01_REQUIREMENTS.md §8` |
| 10 | **Mỗi lần train ghi vào MLflow:** git hash, seed, hash dữ liệu, config, metric. | — |
| 11 | **Accuracy > 60% ở khung 1h ⇒ giả định có rò rỉ** cho tới khi chứng minh ngược lại. | `-m leakage` |
| 12 | **Foundation model đã thấy quá khứ của bạn.** Kronos/Chronos chỉ đánh giá sau cutoff của chúng. | — |

**Khi luật va chạm với kết quả đẹp, luật thắng.** Một backtest đẹp mà vi phạm
RULE 2 thì không phải kết quả — nó là lỗi chưa được phát hiện.

---

## Quy tắc riêng của repo

### ⚠️ `src/cryptopred/validation/` — không sửa nếu không kèm test

Đây là module quyết định repo nói thật hay nói dối. Mọi thay đổi trong thư mục
này **phải đi kèm test trong cùng một lần sửa**. Không có trường hợp "sửa nhanh
rồi viết test sau". Nếu được yêu cầu sửa mà không có test — hãy hỏi lại.

### `data/raw/` là bất biến

Không sửa, không ghi đè có chọn lọc, không "dọn dẹp" ở tầng này. Mọi xử lý bắt
đầu từ `clean/`. Khi nghi ngờ: `make clean-data` rồi dựng lại — `raw/` giữ nguyên.

### Notebook không chứa logic sản xuất

`notebooks/` để khám phá. Logic đã ổn định phải chuyển vào `src/` và có test.
Notebook không có test là nơi rò rỉ ẩn náu.

### Không bao giờ commit `.env`, `data/`, `mlruns/`

Đã có trong `.gitignore`. Kiểm tra lại trước mỗi commit.

---

## Quy ước code

- **Tên hàm, biến, class: tiếng Anh.** **Comment và docstring giải thích: tiếng Việt.**
- Type hint đầy đủ, `from __future__ import annotations` ở đầu file.
- Đường dẫn lấy từ `cryptopred.config`, không tự nối chuỗi.
- Chỉ `cryptopred.data.exchange` được tạo client ccxt.
- Chỉ `cryptopred.data.store` được đọc file Parquet.
- Mỗi module chạy độc lập được: `python -m cryptopred.<gói>.<module> --help`.
- Log bằng `logging.getLogger(__name__)`, không dùng `print()` trong `src/`.
- **Không bao giờ log hay in giá trị khoá API.**

## Lệnh hay dùng

```bash
make setup          # cài môi trường (uv, Python 3.12)
make test           # test — phải xanh trước mỗi commit
make test-leakage   # ★ bộ dò rò rỉ
make lint / make fmt
make download SYM=BTCUSDT TF=1h
make check-data     # xem đang có dữ liệu gì
```

---

## Trạng thái hiện tại

| Phase | Module | Trạng thái |
|---|---|---|
| P0 · Nền móng | M0 | ✅ xong — repo, test 25 xanh, downloader chạy được |
| P1 · Dữ liệu | M1 | 🔶 downloader + universe snapshot xong; **còn** mẻ lớn 40 cặp × 3 khung + cột taker_buy (G3). Đã có: BTC 1h 49.465 nến |
| P1 | M2 | 🔶 store đọc + quality_report xong; **còn** `build_clean` |
| P1 | M3 | ⬜ chỉ có hàng rào `shift_all`/`assert_scale_free` (có test) |
| P2 | M4 nhãn · M6 kiểm định ★ | ⬜ stub — 5 phép thử leakage đang `skip` |
| P3–P4 | M5, M7, M8 | ⬜ stub |
| P5 | M9–M11 | ⬜ stub — **prototype dashboard v6 là hợp đồng UI** (`docs/design/dashboard-prototype.html`, artifact đã publish): chart + khung 1m–1w chiếu model, chọn coin, trade setup M13, BUY/SELL paper, sổ lệnh mô phỏng |
| P6–P7 | M12–M14 | ⬜ stub — xem lộ trình mới ở `docs/00_VISION.md §10` |

Harness: skills `ai-coding` + `visualize-dashboard` ✅ · hooks H1–H5 ⬜ · agents ⬜ · MCP để M9.
Docs: 00–03 gốc · 04 chiến lược (WBS W0–W18, 6 tầng audit) · 05 UX plan · 04_PHAN_TICH_VISHVAALGO · ADR-001. ADR-002..005 chưa viết.
Quyết định chờ user: xem `docs/01_REQUIREMENTS.md §17`.

**Việc tiếp theo theo kế hoạch:** M3 (feature) và M6 (kiểm định) làm **song song** —
bộ kiểm định phải tồn tại *trước khi* có model nào để tự lừa mình.

---

## Khi làm việc với Claude trong repo này

- Bật **Plan Mode** trước mỗi module mới. Kế hoạch trước, code sau.
- Với M4 và M6: giao subagent nhiệm vụ **đối kháng** — *"hãy cố chứng minh bộ
  nhãn/bộ kiểm định này bị rò rỉ"*. Prompt đối kháng tìm ra thứ prompt xác nhận bỏ sót.
- Không đề xuất `pandas-ta` (repo gốc đã bị xoá, package PyPI đổi chủ — rủi ro
  chuỗi cung ứng). Dùng `pandas-ta-classic`.
- Không đề xuất `backtrader` (chết từ 2023) hay `mlfinlab` (đã đóng mã nguồn).
- Bảng thư viện đã chốt và bảng cố tình loại bỏ: `docs/00_MASTER_PLAN.md §3`.
