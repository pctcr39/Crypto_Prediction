"""M7 · Hiệu chỉnh xác suất — RULE 6.

`predict_proba()` của LightGBM KHÔNG PHẢI xác suất thật. Phải hiệu chỉnh bằng
isotonic regression trên một tập validation RIÊNG (không phải tập test), rồi
kiểm chứng bằng reliability diagram và Brier score.

Kiểm chứng bằng lời: gom mọi lần model nói "60%" — trong số đó phải có xấp xỉ
60% thật sự tăng. Sai lệch quá ±10% là chưa đạt.

Đây là ranh giới giữa một dashboard trung thực và một dashboard nguy hiểm.
"""

from __future__ import annotations


def fit_calibrator(*args, **kwargs):
    raise NotImplementedError("M7 — xem docs/03_MODULE_SPECS.md §M7")
