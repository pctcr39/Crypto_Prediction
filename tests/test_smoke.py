"""M0 · Kiểm tra khung repo dựng đúng — cổng ra của Phase 0."""

from __future__ import annotations

import pytest

from cryptopred import __version__
from cryptopred.config import (
    CONFIG_DIR,
    ROOT,
    features_config,
    model_config,
    secrets,
    symbols_config,
    trading_enabled,
    trading_mode,
)
from cryptopred.data.exchange import normalize_symbol


def test_package_importable():
    assert __version__


def test_config_files_exist():
    for name in ("symbols.yaml", "features.yaml", "model.yaml"):
        assert (CONFIG_DIR / name).exists(), f"Thiếu config/{name}"


def test_configs_load():
    assert symbols_config()["exchange"] == "binance"
    assert features_config()["shift_bars"] >= 1
    assert model_config()["seed"] == 42


def test_env_example_exists_and_env_is_ignored():
    """M0 DoD: .env phải nằm trong .gitignore TRƯỚC commit đầu tiên."""
    assert (ROOT / ".env.example").exists()
    gitignore = (ROOT / ".gitignore").read_text(encoding="utf-8")
    assert ".env" in gitignore
    assert "data/**" in gitignore


def test_trading_defaults_to_off():
    """RULE 9 / GATE 4 — không có .env thì hệ thống phải ở chế độ an toàn."""
    assert trading_mode() in {"paper", "testnet", "live"}
    assert trading_enabled() is False or trading_mode() != "live"


def test_secrets_never_required_for_public_data():
    """M1/M2 chỉ dùng public API — thiếu khoá vẫn phải chạy được."""
    s = secrets()
    assert isinstance(s.has_binance, bool)


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("BTCUSDT", "BTC/USDT"),
        ("btc/usdt", "BTC/USDT"),
        ("ETH-USDT", "ETH/USDT"),
        ("1000PEPEUSDT", "1000PEPE/USDT"),
    ],
)
def test_normalize_symbol(raw, expected):
    assert normalize_symbol(raw) == expected


def test_normalize_symbol_rejects_garbage():
    with pytest.raises(ValueError):
        normalize_symbol("KHONGBIET")


def test_decision_thresholds_have_dead_zone():
    """MASTER_PLAN §5 — phải có vùng "KHÔNG RÕ" ở giữa."""
    d = model_config()["decision"]
    assert d["p_down_threshold"] < d["p_up_threshold"]


def test_costs_are_configured():
    """RULE 5 — không có phí trong config nghĩa là backtest sẽ nói dối."""
    costs = model_config()["costs"]
    assert costs["taker_fee_pct"] > 0
    assert costs["slippage_pct"] > 0
