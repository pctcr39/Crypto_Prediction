"""M3 ★ · Sinh đặc trưng scale-free.

Hai luật sống còn của module này (MASTER_PLAN §1):

  RULE 1 — mọi feature phải SCALE-FREE. Cấm giá thô, cấm volume thô.
           Một model duy nhất phải phục vụ được cả BTC (68.000 USD) lẫn
           DOGE (0,12 USD) — đó là điều kiện kỹ thuật để người dùng tự chọn coin.

  RULE 2 — mọi feature phải dịch đúng MỘT nến trước khi dùng, và phải đi qua
           đúng một hàm bọc duy nhất: `shift_all()` dưới đây. Không đường vòng.

Cạm bẫy (đã có test ở tests/test_leakage.py):
  · `rolling(..., center=True)`  → cửa sổ căn giữa nhìn vào tương lai. CẤM.
  · `bfill()` / `interpolate()`  → kéo dữ liệu tương lai về quá khứ. CẤM.
  · Chỉ báo có giai đoạn khởi động (EMA200 cần 200 nến) phải tính lại TRONG
    TỪNG FOLD, không tính một lần trên cả chuỗi rồi cắt.
  · Chuẩn hoá (z-score) phải fit BÊN TRONG fold train, không bao giờ toàn chuỗi.
"""

from __future__ import annotations

import logging

import pandas as pd

from cryptopred.config import features_config

log = logging.getLogger(__name__)

#: Những cột tuyệt đối không được đưa thẳng vào model (RULE 1)
RAW_LEVEL_COLUMNS = frozenset({"open", "high", "low", "close", "volume"})


def shift_all(features: pd.DataFrame, bars: int | None = None) -> pd.DataFrame:
    """★ Điểm nghẽn duy nhất áp RULE 2. Mọi feature phải đi qua đây.

    Feature tính từ nến `t` chỉ được dùng để dự đoán nến `t+1` trở đi.
    Đây là lỗi số một của mọi dự án dự đoán crypto: tính RSI từ giá đóng cửa
    nến 14:00 rồi dùng nó để "dự đoán" chính nến 14:00 → backtest 85%,
    thực tế bằng 0.

    Nếu bạn thấy mình muốn gọi `.shift()` ở chỗ khác — dừng lại. Đó là dấu
    hiệu feature đang đi vòng qua hàm này.
    """
    n = features_config().get("shift_bars", 1) if bars is None else bars
    if n < 1:
        raise ValueError(f"shift_bars phải ≥ 1 (RULE 2), nhận được {n}. Không có ngoại lệ.")
    return features.shift(n)


def assert_scale_free(features: pd.DataFrame) -> None:
    """Chặn RULE 1 ngay tại chỗ: không cột nào được là mức giá/khối lượng thô."""
    offenders = sorted(RAW_LEVEL_COLUMNS & set(features.columns))
    if offenders:
        raise ValueError(
            f"RULE 1 vi phạm — cột giá/volume thô lọt vào feature: {offenders}. "
            "Hãy chuyển sang log return, tỉ lệ, hoặc z-score."
        )


def build_features(ohlcv: pd.DataFrame, *, reference: pd.DataFrame | None = None) -> pd.DataFrame:
    """M3 — sinh ~45 feature theo 9 nhóm ở `config/features.yaml`.

    Args:
        ohlcv: nến của coin đang xét (từ `store.get_ohlcv`).
        reference: nến BTC — bắt buộc cho nhóm `cross_market`, nhóm giá trị
            nhất và cũng dễ rò rỉ nhất (phải căn đúng timestamp giữa hai coin;
            lệch một nến là nhìn thấy tương lai).

    Kết thúc hàm PHẢI là:
        out = shift_all(out); assert_scale_free(out); return out
    """
    raise NotImplementedError("M3 — xem docs/03_MODULE_SPECS.md §M3")
