"""M5 · Ba baseline BẮT BUỘC — RULE 4.

Phải chạy và ghi điểm vào MLflow TRƯỚC khi train LightGBM. Model chỉ có giá trị
nếu thắng cả ba trên tập out-of-sample, SAU KHI TRỪ PHÍ.

Vì sao: crypto có xu hướng tăng dài hạn, nên "mua và giữ" đánh bại phần lớn
model machine learning nghiệp dư. Không đo baseline = không biết mình thắng cái gì.
"""

from __future__ import annotations

BASELINES = ("always_up", "seasonal_naive", "random_5050", "buy_and_hold")


def run_baselines(*args, **kwargs) -> dict:
    raise NotImplementedError("M5 — xem docs/03_MODULE_SPECS.md §M5")
