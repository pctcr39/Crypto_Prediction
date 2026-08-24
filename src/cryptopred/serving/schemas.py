"""Hợp đồng dữ liệu giữa backend và dashboard — MASTER_PLAN §5.

Đây là *hợp đồng*, không phải gợi ý. Dashboard đọc đúng các trường này; đổi tên
trường là một breaking change và phải cập nhật cả `web/app.js`.

Cố tình dùng dataclass thay vì pydantic để module này import được cả khi chưa
cài nhóm `serving` (dùng trong test, notebook, script).
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime
from typing import Literal

Direction = Literal["UP", "DOWN", "UNCLEAR"]
ConfidenceBand = Literal["LOW", "MEDIUM", "HIGH"]


@dataclass(frozen=True)
class Prediction:
    symbol: str
    timeframe: str
    horizon_bars: int
    predicted_at: datetime  # thời điểm nến đóng, đã tính xong
    valid_until: datetime  # sau mốc này dashboard phải hiện "Dự đoán cũ" (RULE 8)
    last_close: float

    # ── Hướng (LightGBM classifier + isotonic) ──────────────────
    direction: Direction
    p_up: float  # thô — CHỈ để chẩn đoán, không hiển thị (RULE 6)
    p_up_calibrated: float  # ★ con số duy nhất được phép hiển thị
    confidence_band: ConfidenceBand

    # ── Dải giá (3 model quantile) ──────────────────────────────
    price_q10: float
    price_q50: float
    price_q90: float

    # ── Biến động (dùng cho position sizing ở M12) ──────────────
    expected_vol_pct: float

    # ── Trung thực với người dùng (MASTER_PLAN §4.2) ────────────
    in_training_universe: bool  # false → dashboard gắn nhãn "ngoài tập huấn luyện"
    model_version: str
    mlflow_run_id: str = ""
    warnings: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        d = asdict(self)
        d["predicted_at"] = self.predicted_at.isoformat().replace("+00:00", "Z")
        d["valid_until"] = self.valid_until.isoformat().replace("+00:00", "Z")
        return d


def classify_direction(
    p_up_calibrated: float, *, up: float = 0.58, down: float = 0.42
) -> Direction:
    """Quy tắc phân loại có vùng chết — MASTER_PLAN §5.

    "UNCLEAR" là một câu trả lời BÌNH THƯỜNG, không phải lỗi. Một hệ thống
    trung thực im lặng phần lớn thời gian.
    """
    if p_up_calibrated > up:
        return "UP"
    if p_up_calibrated < down:
        return "DOWN"
    return "UNCLEAR"
