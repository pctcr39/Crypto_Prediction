"""Fixture dùng chung. Không test nào ở đây được gọi mạng."""

from __future__ import annotations

import numpy as np
import pandas as pd
import pytest


@pytest.fixture
def synthetic_ohlcv() -> pd.DataFrame:
    """500 nến 1h giả lập, chỉ số hợp lệ — dùng để test logic, không test model."""
    rng = np.random.default_rng(42)
    idx = pd.date_range("2025-01-01", periods=500, freq="1h", tz="UTC", name="ts")
    close = 100 * np.exp(np.cumsum(rng.normal(0, 0.01, len(idx))))
    high = close * (1 + np.abs(rng.normal(0, 0.003, len(idx))))
    low = close * (1 - np.abs(rng.normal(0, 0.003, len(idx))))
    open_ = np.r_[close[0], close[:-1]]
    volume = np.abs(rng.normal(1000, 200, len(idx)))
    return pd.DataFrame(
        {"open": open_, "high": high, "low": low, "close": close, "volume": volume}, index=idx
    )


@pytest.fixture
def tmp_data_dir(tmp_path, monkeypatch):
    """Chuyển mọi đường dẫn dữ liệu sang thư mục tạm — test không đụng data/ thật."""
    from cryptopred import config

    for name in ("DATA_DIR", "RAW_DIR", "CLEAN_DIR", "FEATURES_DIR", "LABELS_DIR"):
        sub = tmp_path if name == "DATA_DIR" else tmp_path / name.split("_")[0].lower()
        monkeypatch.setattr(config, name, sub)
    return tmp_path
