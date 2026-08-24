"""M4 · Nhãn hướng giá có vùng chết thích ứng.

Công thức (MASTER_PLAN §4.4), khung 1h, horizon = 4 nến:

    r_future = log(close[t+H] / close[t])
    theta    = 0.3 * rolling_std(log_return, 96)

    label = +1  nếu r_future >  theta     # TĂNG
            -1  nếu r_future < -theta     # GIẢM
             0  còn lại                    # ĐI NGANG — loại khỏi tập train

Vì sao có vùng chết: ép model phân loại nhị phân mọi nến sẽ khiến nó dồn phần
lớn công suất để đoán nhiễu quanh mốc 0. Vùng chết dạy nó chỉ phát biểu khi có
chuyển động đáng kể. `theta` thích ứng theo biến động nên hoạt động đúng ở cả
thị trường yên lẫn thị trường bão.

RULE 2 ở đây đi NGƯỢC chiều với feature: nhãn tại `t` được phép — và bắt buộc —
chỉ phụ thuộc dữ liệu SAU `t`. Test trong `tests/test_leakage.py` khẳng định điều này.
"""

from __future__ import annotations

import pandas as pd


def make_direction_labels(close: pd.Series, *, horizon: int, timeframe: str = "1h") -> pd.DataFrame:
    """Trả về DataFrame gồm `r_future`, `theta`, `label` (+1 / 0 / -1).

    H nhãn cuối chuỗi phải là NaN — chưa có tương lai để nhìn.
    """
    raise NotImplementedError("M4 — xem docs/03_MODULE_SPECS.md §M4")
