/* ══════════════════════════════════════════════════════════════════
   M11 · Dashboard — CHƯA XÂY
   Đặc tả: docs/03_MODULE_SPECS.md §M9–M11 · docs/02_DESIGN_SYSTEM.md

   Ba đường dữ liệu ĐỘC LẬP (MASTER_PLAN §2) — điểm mấu chốt của thiết kế:

     1. GIÁ      — trình duyệt nối THẲNG tới wss://stream.binance.com.
                   Backend không tham gia. Backend chết thì giá vẫn chạy.
     2. DỰ ĐOÁN  — WebSocket riêng của backend, chỉ đẩy KHI NẾN ĐÓNG.
                   Đừng gọi model mỗi giây: trong một nến chưa đóng, đầu vào
                   gần như không đổi — chỉ tạo ra con số rung lắc vô nghĩa.
     3. LỊCH SỬ  — REST /api/ohlcv một lần khi mở trang (500 nến).

   Ba luật giao diện không được quên:
     RULE 7  — dự đoán vẽ TÍM, NÉT ĐỨT, kèm dải mờ. Không bao giờ xanh/đỏ.
     RULE 8  — luôn hiển thị độ tươi: Live / Chậm / Mất kết nối / Dự đoán cũ.
               Chế độ hỏng nguy hiểm nhất không phải báo lỗi — mà là im lặng
               hiển thị số cũ như thể nó vẫn đúng.
     DS-RULE 3 — hướng luôn có mũi tên VÀ chữ, không chỉ mã hoá bằng màu.

   Chart: gọi thẳng TradingView lightweight-charts v5 (Apache-2.0).
   KHÔNG dùng bản bọc Python `lightweight-charts-python` — đứng yên từ 2024,
   còn kẹt ở v4.
   ══════════════════════════════════════════════════════════════════ */

console.info("[cryptopred] M11 chưa xây — xem docs/03_MODULE_SPECS.md §M11");
