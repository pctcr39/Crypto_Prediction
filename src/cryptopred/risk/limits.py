"""M13 · Giới hạn rủi ro — GATE 4, RULE 9.

Tám thứ BẮT BUỘC có và phải được kiểm thử trước khi chạm tiền thật:

  [ ] Kill switch — một lệnh dừng toàn bộ và huỷ mọi lệnh chờ
  [ ] Giới hạn lỗ ngày — lỗ 2% vốn/ngày → tự tắt, KHÔNG tự bật lại
  [ ] Giới hạn vị thế — ≤ 1% vốn mỗi lệnh, ≤ 5% tổng exposure khi mới bắt đầu
  [ ] Idempotent order — mỗi lệnh một `clientOrderId` duy nhất
  [ ] Đối soát — mỗi 5 phút so trạng thái nội bộ với số dư thật, lệch là báo động
  [ ] API key giới hạn — bật quyền giao dịch, TẮT quyền rút tiền, khoá theo IP
  [ ] Heartbeat — mất kết nối > 60s → đóng vị thế hoặc chuyển chế độ an toàn
  [ ] Chế độ thủ công — mọi lần khởi động lại đều bắt đầu ở trạng thái TẮT

Vượt cả bốn gate KHÔNG có nghĩa là sẽ có lãi. Chúng chỉ loại bỏ những cách thua
CÓ THỂ TRÁNH ĐƯỢC — lỗi kỹ thuật, rò rỉ dữ liệu, tự lừa mình.
"""

from __future__ import annotations

MAX_POSITION_PCT = 0.01  # ≤ 1% vốn mỗi lệnh
MAX_TOTAL_EXPOSURE_PCT = 0.05
DAILY_LOSS_LIMIT_PCT = 0.02  # chạm là tắt, không tự bật lại
HEARTBEAT_TIMEOUT_SEC = 60


def check_all(*args, **kwargs):
    raise NotImplementedError("M13 — xem docs/00_MASTER_PLAN.md §7 GATE 4")
