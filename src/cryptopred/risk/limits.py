"""Giới hạn rủi ro — BỘ AN TOÀN BẮT BUỘC của đường lệnh.

Hệ 4 GATE đã bị bỏ (ADR-020). Danh sách dưới đây KHÔNG phải cổng cấp phép — nó là
ĐỊNH NGHĨA HOÀN THÀNH: phần mềm chạm tiền thật mà thiếu một mục là chưa viết xong.
Đặc tả: docs/01_REQUIREMENTS.md §8 (REQ-SAFE) · chi tiết: docs/05_TRADING_SPEC.md

Mười một thứ BẮT BUỘC có và phải được kiểm thử trước khi chạm tiền thật:

  [ ] Kill switch — một lệnh dừng toàn bộ và huỷ mọi lệnh chờ
  [ ] Giới hạn lỗ ngày — lỗ 2% vốn/ngày → tự tắt, KHÔNG tự bật lại
  [ ] Giới hạn vị thế — ≤ 1% vốn mỗi lệnh, ≤ 5% tổng exposure khi mới bắt đầu
  [ ] Idempotent order — mỗi lệnh một `clientOrderId` duy nhất
  [ ] Đối soát — mỗi 5 phút so trạng thái nội bộ với số dư thật, lệch là báo động
  [ ] API key giới hạn — bật quyền giao dịch, TẮT quyền rút tiền, khoá theo IP
  [ ] Heartbeat — mất kết nối > 60s → đóng vị thế hoặc chuyển chế độ an toàn
  [ ] Cắt lỗ từng vị thế — stop-loss theo bội số ATR (1,5×ATR14), đặt CÙNG LÚC
      với lệnh vào, không đặt sau
  [ ] Thời gian giữ tối đa — hết horizon mà chưa chạm mục tiêu thì thoát theo
      giá thị trường, không giữ vị thế mồ côi
  [ ] Quy tắc thoát khi tín hiệu đổi — dự đoán mới rơi vào "KHÔNG RÕ" thì đóng
      vị thế đang mở ngay, không chờ
  [ ] Chế độ thủ công — mọi lần khởi động lại đều bắt đầu ở trạng thái TẮT

Đủ bộ an toàn KHÔNG có nghĩa là sẽ có lãi. Nó chỉ loại bỏ những cách thua CÓ THỂ
TRÁNH ĐƯỢC — lỗi kỹ thuật, rò rỉ dữ liệu, tự lừa mình. Rủi ro thị trường vẫn thuộc
về người dùng; đó là ranh giới trách nhiệm mà ADR-020 đặt ra.

⚠️ ADR-019: sản phẩm là nền tảng NHIỀU người dùng có Trading mode. Mọi giới hạn ở
đây tính THEO TỪNG TÀI KHOẢN (Luật 16, docs/00_VISION.md §5.2); riêng nút dừng
khẩn cấp có thêm tầng toàn hệ cho admin (REQ SAFE-02).
Giữ NotImplementedError cho tới phase tương ứng trong docs/08_ROADMAP.md.
"""

from __future__ import annotations

MAX_POSITION_PCT = 0.01  # ≤ 1% vốn mỗi lệnh
MAX_TOTAL_EXPOSURE_PCT = 0.05
DAILY_LOSS_LIMIT_PCT = 0.02  # chạm là tắt, không tự bật lại
HEARTBEAT_TIMEOUT_SEC = 60
ATR_STOPLOSS_MULT = 1.5  # cắt lỗ = 1,5×ATR14, đặt cùng lúc với lệnh vào


def check_all(*args, **kwargs):
    raise NotImplementedError("Chưa xây — xem docs/01_REQUIREMENTS.md §8 REQ-SAFE")
