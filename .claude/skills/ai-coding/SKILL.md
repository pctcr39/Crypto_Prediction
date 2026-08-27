---
name: ai-coding
description: Quy trình viết code bằng AI trong repo cryptopred. Dùng khi người
  dùng yêu cầu viết, sửa, refactor, thêm code, implement module, fix bug, hay
  thêm test cho bất kỳ phần nào của pipeline (data, feature, label, validation,
  model, backtest, serving, risk, dashboard). Bảo đảm code sinh ra theo đúng
  thứ tự làm việc của repo — đọc trạng thái trước, theo detail design, tuân 12
  RULE, chạy test và lint trước khi báo xong, cập nhật CLAUDE.md khi module
  hoàn thành.
---

# AI Coding — quy trình viết code trong repo này

Repo này có một đặc điểm: **một dòng code sai có thể tạo ra backtest đẹp mà
giả**. Vì vậy quy trình dưới đây không phải hình thức — nó là hàng rào.

## 1 · Trước khi viết dòng nào

1. Đọc bảng **"Trạng thái hiện tại"** trong `CLAUDE.md` — biết module đang đứng đâu.
2. Mở đúng mục detail design của module trong `docs/Old/04_EXECUTION_STRATEGY.md §6`
   và DoD trong `docs/Old/03_MODULE_SPECS.md`. Code không khớp detail design → hỏi
   lại trước, không tự chế.
3. Module mới hoặc thay đổi lớn → đề xuất **Plan Mode** trước.
4. Việc thuộc WBS nào (`docs/Old/04 §7`)? Nếu nhảy cóc phụ thuộc (vd viết model khi
   chưa có leakage test) → cảnh báo người dùng rồi mới làm theo quyết định của họ.

## 2 · Luật theo thư mục — tra trước khi sửa

| Sửa ở | Bắt buộc |
|---|---|
| `src/cryptopred/validation/` | **Test đi kèm trong cùng lần sửa.** Không có ngoại lệ. Không có test → dừng và hỏi. |
| `src/cryptopred/features/` | Mọi feature scale-free (RULE 1), qua đúng một `shift_all()` (RULE 2). Cấm `center=True`, `bfill()`, `interpolate()`. Kết thúc builder: `shift_all → assert_scale_free → return`. |
| `src/cryptopred/labels/` | Nhãn tại `t` chỉ phụ thuộc dữ liệu `> t`. H hàng cuối phải NaN. |
| `src/cryptopred/models/` | Mỗi lần train ghi MLflow đủ tag: `git_hash, seed, data_hash, leakage` (RULE 10). Baseline trước model (RULE 4). |
| `src/cryptopred/backtest/` | Phí + slippage từ `config/model.yaml → costs`, không hardcode. Khớp lệnh ở **open nến t+1**. |
| `src/cryptopred/execution/`, `risk/` | Mặc định TẮT. Không bao giờ viết code gửi lệnh thật mà không qua RiskEngine. Restart = trạng thái TẮT. |
| `data/raw/` | **Bất biến.** Chỉ `download.py` được ghi. Không sửa, không "dọn dẹp". |
| `web/` | Màu chỉ từ `tokens.css` (DS-RULE 8). Dự đoán = tím nét đứt, không bao giờ xanh/đỏ (RULE 7). |

## 3 · Quy ước code

- Tên hàm/biến/class **tiếng Anh**; comment và docstring giải thích **tiếng Việt**.
- `from __future__ import annotations` + type hint đầy đủ.
- Đường dẫn lấy từ `cryptopred.config` — không tự nối chuỗi.
- Chỉ `data/exchange.py` tạo client ccxt; chỉ `data/store.py` đọc Parquet.
- `logging.getLogger(__name__)`, không `print()` trong `src/`.
- Mỗi module chạy độc lập được: `python -m cryptopred.<gói>.<module> --help`.
- Stub chưa làm: `raise NotImplementedError("M<n> — xem docs/…")` — không trả giá trị giả.
- **Không bao giờ** log/in khoá API; không commit `.env`, `data/`, `mlruns/`.
- Thư viện cấm đề xuất: `pandas-ta` (repo bị xoá — dùng `pandas-ta-classic`),
  `backtrader`, `mlfinlab`, `lightweight-charts-python`. Lý do: `docs/Old/00 §3.2`.

## 4 · Sau khi viết — vòng kiểm chứng, chưa xanh chưa báo xong

```bash
make test     # phải xanh, offline, < vài giây
make lint     # ruff check + format
```

Nếu đụng `features/`, `labels/`, `validation/` → thêm:

```bash
make test-leakage
```

- Test đỏ → sửa code, **không sửa test cho xanh**. Nếu tin rằng test sai, nêu
  lý do cho người dùng quyết.
- Accuracy out-of-sample > 60% ở khung 1h xuất hiện ở bất kỳ đâu → dừng, kích
  hoạt quy trình RULE 11 (nghi rò rỉ), không ăn mừng.

## 5 · Khép vòng

- Module đạt đủ DoD → cập nhật bảng trạng thái trong `CLAUDE.md` (⬜ → 🔨 → ✅).
- Quyết định kiến trúc mới phát sinh → viết `docs/adr/NNN-*.md` theo mẫu `000`.
  Không để quyết định nào chỉ sống trong hội thoại.
- Chỉ commit khi người dùng yêu cầu; message tiếng Việt, mô tả *vì sao* không
  chỉ *cái gì*.

## 6 · Khi nào dừng lại và hỏi

- Yêu cầu sửa `validation/` mà không kèm test.
- Yêu cầu mâu thuẫn với một trong 12 RULE (`docs/Old/00 §1`) — nêu RULE bị đụng,
  chờ người dùng xác nhận rồi làm theo quyết định của họ.
- Con đường ngắn cần vi phạm ranh giới module (vd đọc Parquet trực tiếp thay
  vì qua `store`) — nêu chi phí, đề xuất đường đúng.
