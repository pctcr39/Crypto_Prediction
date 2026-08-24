"""M9–M10 · FastAPI + WebSocket.

Ba đường dữ liệu độc lập (MASTER_PLAN §2) — đây là điểm mấu chốt của thiết kế:
  1. Giá   — trình duyệt nối THẲNG tới WebSocket Binance, backend không tham gia.
  2. Dự đoán — backend chạy inference KHI NẾN ĐÓNG, đẩy qua WS riêng.
  3. Lịch sử — REST một lần khi mở trang.

Đừng bắt model chạy lại mỗi giây: trong một nến chưa đóng, đầu vào gần như
không đổi — chạy lại chỉ tạo ra một con số rung lắc vô nghĩa.
"""
