"""M13 · Giới hạn rủi ro — GATE 4, RULE 9.

Mười một thứ BẮT BUỘC có và phải được kiểm thử trước khi chạm tiền thật
(danh sách đầy đủ — khớp docs/00_MASTER_PLAN.md §7 GATE 4, không rút gọn):

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

Vượt cả bốn gate KHÔNG có nghĩa là sẽ có lãi. Chúng chỉ loại bỏ những cách thua
CÓ THỂ TRÁNH ĐƯỢC — lỗi kỹ thuật, rò rỉ dữ liệu, tự lừa mình.

⚠️ 27/08/2026 — theo docs/PREDICTION_DESIGN.md §0.1/§0.3, GATE 3 và GATE 4 hiện
NGOÀI PHẠM VI sản phẩm: hệ thống được định nghĩa lại là chỉ dự đoán/khuyến nghị,
không đặt lệnh, không giữ khoá API. Module này giữ nguyên NotImplementedError
cho tới khi có một quyết định (ADR) đảo ngược lựa chọn phạm vi đó.
"""

from __future__ import annotations

MAX_POSITION_PCT = 0.01  # ≤ 1% vốn mỗi lệnh
MAX_TOTAL_EXPOSURE_PCT = 0.05
DAILY_LOSS_LIMIT_PCT = 0.02  # chạm là tắt, không tự bật lại
HEARTBEAT_TIMEOUT_SEC = 60
ATR_STOPLOSS_MULT = 1.5  # cắt lỗ = 1,5×ATR14, đặt cùng lúc với lệnh vào


def check_all(*args, **kwargs):
    raise NotImplementedError("M13 — xem docs/00_MASTER_PLAN.md §7 GATE 4")
