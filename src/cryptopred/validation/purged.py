"""M6 ★★★ · Walk-forward có purge + embargo — MODULE QUAN TRỌNG NHẤT REPO.

    |--- train ---| purge |--- test ---| embargo |--- train ---| ...
                   (H nến)              (H nến)

`purge`   cắt bỏ H nến cuối tập train, vì nhãn của chúng nhìn vào vùng test.
`embargo` chờ thêm H nến sau tập test trước khi dữ liệu đó được dùng để train
          ở fold sau (tự tương quan không dừng ngay tại ranh giới).

Vì sao phải tự viết: `mlfinlab` — thư viện duy nhất từng cung cấp sẵn purged CV
— đã ĐÓNG MÃ NGUỒN và chuyển thành sản phẩm thương mại. Không còn lựa chọn OSS.
Đây chính là năng lực đã rời khỏi thế giới mã nguồn mở, và là thứ quyết định
dự án này nói thật hay nói dối.

RULE 3 — CẤM `train_test_split`, CẤM `KFold`, CẤM mọi kiểu chia ngẫu nhiên.

⚠️ Quy ước của repo: KHÔNG sửa file này nếu không kèm test. Xem CLAUDE.md.
"""

from __future__ import annotations

from collections.abc import Iterator
from dataclasses import dataclass

import numpy as np
import pandas as pd


@dataclass(frozen=True)
class Fold:
    """Một fold: chỉ số mẫu train và test, kèm mốc thời gian để kiểm tra ranh giới."""

    index: int
    train_idx: np.ndarray
    test_idx: np.ndarray
    train_end: pd.Timestamp
    test_start: pd.Timestamp
    test_end: pd.Timestamp


class PurgedWalkForward:
    """Bộ chia walk-forward có purge và embargo.

    Args:
        n_folds: số fold. GATE 1 yêu cầu ≥ 8, trải ≥ 24 tháng.
        purge_bars: số nến cắt ở cuối train (mặc định = horizon nhãn).
        embargo_bars: số nến chờ sau test (mặc định = horizon nhãn).
        min_train_bars: fold đầu tiên phải có ít nhất bấy nhiêu nến train.
    """

    def __init__(
        self,
        *,
        n_folds: int = 8,
        purge_bars: int,
        embargo_bars: int,
        min_train_bars: int = 5000,
    ) -> None:
        raise NotImplementedError("M6 — xem docs/03_MODULE_SPECS.md §M6. Đừng rút ngắn module này.")

    def split(self, index: pd.DatetimeIndex) -> Iterator[Fold]:
        """Sinh lần lượt từng fold."""
        raise NotImplementedError("M6")
