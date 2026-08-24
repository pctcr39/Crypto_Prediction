# Crypto Prediction

Pipeline dự đoán **hướng giá crypto** + dashboard realtime, cho bất kỳ cặp USDT nào
trên Binance.

Ba đầu ra mỗi lần suy luận: hướng giá kèm xác suất **đã hiệu chỉnh**, dải giá
(quantile 10/50/90), và biến động kỳ vọng.

> **Không phải lời khuyên đầu tư.** Kiến trúc auto-trade được dựng sẵn nhưng mặc
> định TẮT, chỉ mở sau khi vượt 4 cổng kiểm soát ở `docs/00_MASTER_PLAN.md §7`.

---

## Bắt đầu trong 3 phút

```bash
make setup                          # cài môi trường (uv tự tải Python 3.12)
make test                           # phải xanh
make download SYM=BTCUSDT TF=1h     # tải nến BTC về data/raw/
make check-data                     # xem đã có gì
```

Không cần khoá API cho bước này — M1/M2 chỉ dùng public API của Binance.

Cần khoá (từ M13 trở đi):

```bash
cp .env.example .env    # rồi điền — .env đã nằm trong .gitignore
```

## Lệnh

```bash
make help          # danh sách đầy đủ
make test-leakage  # ★ bộ dò rò rỉ dữ liệu
make lint / fmt
make universe      # dựng ảnh chụp vũ trụ coin của tháng này
```

Mọi module cũng chạy độc lập được:

```bash
python -m cryptopred.data.download --help
python -m cryptopred.data.universe --refresh
```

---

## Tài liệu

| File | Nội dung |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Quy ước repo + 12 luật nền tảng — đọc trước khi sửa code |
| [`docs/00_MASTER_PLAN.md`](docs/00_MASTER_PLAN.md) | Kế hoạch tổng thể, kiến trúc, roadmap 12 tuần, 4 gate |
| [`docs/01_CLAUDE_HANDBOOK.md`](docs/01_CLAUDE_HANDBOOK.md) | Cẩm nang tính năng Claude Code |
| [`docs/02_DESIGN_SYSTEM.md`](docs/02_DESIGN_SYSTEM.md) | Design system dashboard |
| [`docs/03_MODULE_SPECS.md`](docs/03_MODULE_SPECS.md) | Đặc tả chi tiết M0–M14 |
| [`docs/adr/`](docs/adr/) | Nhật ký quyết định kiến trúc |

## Cấu trúc

```
config/           symbols.yaml · features.yaml · model.yaml
src/cryptopred/
  data/           M1–M2 · tải, lọc vũ trụ coin, đọc dữ liệu
  features/       M3 ★ · đặc trưng scale-free, đã dịch 1 nến
  labels/         M4  · nhãn có vùng chết thích ứng
  validation/     M6 ★★★ · purged walk-forward + dò rò rỉ
  models/         M5, M7 · train + hiệu chỉnh xác suất
  backtest/       M8  · vectorbt + quantstats (có phí)
  serving/        M9–M10 · FastAPI + WebSocket
  risk/           M13 · giới hạn cứng + kill switch
  execution/      M14 · executor ccxt
  notify/         M12 · Telegram
web/              M11 · dashboard (tokens.css = nguồn chân lý về màu)
tests/            test_leakage.py ★ là file test quan trọng nhất repo
data/             raw → clean → features → labels (không commit)
```

## Trạng thái

**P0 xong.** Khung repo dựng đủ, downloader chạy được, test xanh.
Việc tiếp theo: **M3 (feature)** và **M6 (kiểm định)** làm song song — bộ kiểm
định phải tồn tại *trước khi* có model nào để tự lừa mình.

Module chưa làm đều `raise NotImplementedError` kèm số hiệu module. Đó là cố ý:
không có code giả vờ chạy được.

## Giấy phép & phụ thuộc

Mã trong repo: MIT. Thư viện đã chốt và những thư viện **cố tình loại bỏ** (kèm
lý do) nằm ở `docs/00_MASTER_PLAN.md §3`.

⚠️ `vectorbt` (M8) dùng Apache-2.0 **kèm Commons Clause** — dùng cá nhân/nội bộ
thoải mái, nhưng không được bán sản phẩm mà giá trị chính đến từ nó.
