# ADR-001 · Khung dự án P0

**Ngày:** 2026-08-24
**Trạng thái:** đã chốt

## Bối cảnh

`docs/00_MASTER_PLAN.md` đã chốt scope. Bước đầu tiên (§10) là dựng khung repo
chạy được, với một script tải dữ liệu dùng được ngay — cổng ra của M0.

## Quyết định

1. **Python 3.12, quản lý bằng `uv`.** Ghim ở `.python-version`; `uv` tự tải
   Python nên máy không cần cài sẵn.
2. **Bố cục `src/`** với `hatchling`. Package cài ở chế độ editable → mọi module
   chạy được bằng `python -m cryptopred.…` mà không cần nghịch `PYTHONPATH`.
3. **Phụ thuộc chia nhóm** (`model`, `backtest`, `serving`, `ops`). Nhóm lõi chỉ
   đủ cho M0–M4; chưa cài `lightgbm`/`vectorbt` ở tuần 1.
4. **Stub `raise NotImplementedError("M<n> — …")`** thay vì trả về giá trị giả.
   Code giả vờ chạy được là cách âm thầm nhất để một pipeline nói dối.
5. **Test cần mạng bị loại khỏi `make test`** bằng marker `network`. Test mặc
   định phải chạy offline và dưới 1 giây, nếu không sẽ không ai chạy nó.
6. **`data/raw/` chỉ chứa nến ĐÃ ĐÓNG.** Downloader cắt mốc hiện tại về đầu nến
   đang chạy. Nến chưa đóng còn thay đổi — đưa vào là một dạng rò rỉ (RULE 2).
7. **Tải chồng 2 nến cuối mỗi lần chạy lại** để phát hiện sàn sửa nến cũ; chênh
   lệch được ghi log thay vì ghi đè im lặng.

## Phương án đã cân nhắc và loại bỏ

| Phương án | Vì sao loại |
|---|---|
| Python 3.14 (bản có sẵn trên máy) | Nhiều gói ML chưa có wheel ổn định; không đáng đổi lấy rủi ro ở tuần 1 |
| Cài hết phụ thuộc từ đầu | `vectorbt` + `catboost` + `mlflow` kéo theo hàng trăm MB chưa dùng tới tuần 6 |
| Stub trả về giá trị giả (`return 0.5`) | Che mất việc chưa làm; đúng thứ RULE 4 và RULE 11 đang chống |
| Dùng `freqtrade` làm nền | GPL-3.0 và ép theo cấu trúc của nó; sẽ học freqtrade thay vì học cách xây pipeline |

## Hệ quả

- Cài lần đầu nhanh (~30s) nhưng tới M5 phải chạy thêm `make setup-model`.
- Mọi lệnh gọi module chưa làm sẽ **nổ ngay** kèm số hiệu module — ồn ào có chủ đích.
- Ghim Python 3.12 nghĩa là sẽ có lúc phải nâng thủ công; đổi lại tránh được
  việc gỡ lỗi cài đặt trong tuần đầu.
