"""M5 · LightGBM classifier (hướng) + 3 quantile regressor (dải giá).

RULE 10 — mỗi lần chạy phải ghi vào MLflow: git commit hash, seed, hash snapshot
dữ liệu, toàn bộ config, và metric. Không có ngoại lệ, kể cả chạy thử cho vui.

Cạm bẫy: chạy 1000 trial Optuna trên một giai đoạn cố định là cách chắc chắn
nhất để overfit backtest. Mục tiêu tối ưu phải là điểm TRUNG BÌNH WALK-FORWARD,
và phải giữ lại một giai đoạn cuối CHƯA TỪNG CHẠM TỚI.
"""

from __future__ import annotations


def train(*args, **kwargs):
    raise NotImplementedError("M5 — xem docs/03_MODULE_SPECS.md §M5")
