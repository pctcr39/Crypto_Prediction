"""M6 ★ · Bộ dò rò rỉ dữ liệu — 5 phép thử tự động.

| Phép thử         | Cách làm                                  | Dấu hiệu rò rỉ                    |
|------------------|-------------------------------------------|-----------------------------------|
| Dịch nhãn        | dịch toàn bộ nhãn thêm 1 bước, train lại  | điểm số **tăng** → chắc chắn rò rỉ |
| Xáo trộn nhãn    | xáo ngẫu nhiên nhãn, train lại            | vẫn > 50% đáng kể → rò rỉ          |
| Tương quan       | `corr(feature, label)`                    | bất kỳ feature nào > 0.99 → rò rỉ  |
| Đảo thời gian    | train trên tương lai, test trên quá khứ   | điểm tương đương → đáng nghi       |
| Ranh giới fold   | so mẫu cuối train vs đầu test             | chồng lấn thời gian → purge sai    |

RULE 11 — nếu directional accuracy out-of-sample vượt 60% ở khung 1h,
GIẢ ĐỊNH LÀ CÓ RÒ RỈ cho tới khi chứng minh được điều ngược lại. Chạy đủ 5 phép
thử này trước khi ăn mừng.
"""

from __future__ import annotations

import pandas as pd


def test_shifted_labels(*args, **kwargs) -> dict:
    raise NotImplementedError("M6")


def test_shuffled_labels(*args, **kwargs) -> dict:
    raise NotImplementedError("M6")


def test_feature_label_correlation(
    features: pd.DataFrame, labels: pd.Series, threshold: float = 0.99
) -> dict:
    raise NotImplementedError("M6")


def test_time_reversal(*args, **kwargs) -> dict:
    raise NotImplementedError("M6")


def test_fold_boundaries(*args, **kwargs) -> dict:
    raise NotImplementedError("M6")
