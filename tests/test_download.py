"""M1 · Test downloader — không gọi mạng.

DoD của M1: `assert df.index.is_monotonic_increasing and df.index.is_unique`
"""

from __future__ import annotations

import pandas as pd
import pytest

from cryptopred.data import download as dl


def test_tidy_sorts_and_dedups():
    idx = pd.DatetimeIndex(
        ["2025-01-01T02:00", "2025-01-01T00:00", "2025-01-01T01:00", "2025-01-01T01:00"],
        tz="UTC",
        name="ts",
    )
    df = pd.DataFrame({c: [4.0, 1.0, 2.0, 99.0] for c in dl.OHLCV_COLUMNS}, index=idx)
    out = dl._tidy(df)

    assert out.index.is_monotonic_increasing
    assert out.index.is_unique
    assert len(out) == 3
    # Trùng lặp giữ bản GHI SAU — vì sàn có thể đã sửa lại nến cũ
    assert out.loc["2025-01-01T01:00", "close"] == 99.0


def test_roundtrip_write_read(tmp_path, monkeypatch, synthetic_ohlcv):
    """Ghi rồi đọc lại phải ra đúng dữ liệu cũ, kể cả khi trải qua nhiều năm."""
    from cryptopred import config

    monkeypatch.setattr(config, "RAW_DIR", tmp_path / "raw")
    dl.write_local(synthetic_ohlcv, "BTC/USDT", "1h")
    back = dl.read_local("BTC/USDT", "1h")

    pd.testing.assert_frame_equal(back, synthetic_ohlcv, check_freq=False)


def test_read_local_missing_returns_empty(tmp_path, monkeypatch):
    from cryptopred import config

    monkeypatch.setattr(config, "RAW_DIR", tmp_path / "raw")
    out = dl.read_local("KHONGCO/USDT", "1h")
    assert out.empty
    assert list(out.columns) == dl.OHLCV_COLUMNS


def test_write_partitions_by_year(tmp_path, monkeypatch):
    from cryptopred import config

    monkeypatch.setattr(config, "RAW_DIR", tmp_path / "raw")
    idx = pd.date_range("2024-12-30", periods=100, freq="1h", tz="UTC", name="ts")
    df = pd.DataFrame(dict.fromkeys(dl.OHLCV_COLUMNS, 1.0), index=idx)
    paths = dl.write_local(df, "BTC/USDT", "1h")

    years = sorted(p.parent.name for p in paths)
    assert years == ["year=2024", "year=2025"]


def test_cli_splits_symbols_and_timeframes():
    symbols, timeframes = dl._split_args(["BTCUSDT", "ETHUSDT", "1h", "4h"])
    assert symbols == ["BTCUSDT", "ETHUSDT"]
    assert timeframes == ["1h", "4h"]


def test_cli_parser_help_does_not_crash():
    parser = dl.build_parser()
    args = parser.parse_args(["BTCUSDT", "1h", "--start", "2024-01-01"])
    assert args.args == ["BTCUSDT", "1h"]
    assert args.start == "2024-01-01"


@pytest.mark.network
def test_download_btc_1h_real(tmp_path, monkeypatch):
    """Cổng ra M0 — chạy thật: pytest -m network"""
    from cryptopred import config

    monkeypatch.setattr(config, "RAW_DIR", tmp_path / "raw")
    df = dl.download_symbol("BTCUSDT", "1h", start="2026-08-01")

    assert len(df) > 100
    assert df.index.is_monotonic_increasing and df.index.is_unique
    assert (df["high"] >= df["low"]).all()
