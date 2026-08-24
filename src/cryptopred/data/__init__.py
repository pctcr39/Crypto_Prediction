"""M1–M2 · Thu thập và lưu trữ dữ liệu.

download.py   tải nến từ sàn về data/raw/ (idempotent, chỉ nến đã đóng)
universe.py   lọc vũ trụ coin + ảnh chụp theo tháng (chống bẫy sống sót)
store.py      API ĐỌC duy nhất cho mọi module phía sau
exchange.py   nơi duy nhất tạo client ccxt
"""
