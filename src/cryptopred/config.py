"""Cấu hình tập trung — đường dẫn, YAML, biến môi trường.

Mọi module khác lấy đường dẫn và tham số từ đây, không tự nối chuỗi đường dẫn.
Lý do: khi đổi chỗ thư mục `data/`, chỉ phải sửa một nơi.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import cache
from pathlib import Path
from typing import Any

import yaml
from dotenv import load_dotenv

# ── Gốc repo: file này ở src/cryptopred/config.py → lên 3 cấp ───────
ROOT = Path(__file__).resolve().parents[2]

load_dotenv(ROOT / ".env")  # không có .env cũng không sao — mọi thứ đều có mặc định

CONFIG_DIR = ROOT / "config"
DATA_DIR = Path(os.getenv("DATA_DIR", ROOT / "data")).expanduser().resolve()

RAW_DIR = DATA_DIR / "raw"
CLEAN_DIR = DATA_DIR / "clean"
FEATURES_DIR = DATA_DIR / "features"
LABELS_DIR = DATA_DIR / "labels"


@cache
def load_yaml(name: str) -> dict[str, Any]:
    """Đọc một file trong `config/`. Kết quả được cache theo tên file.

    >>> load_yaml("symbols")["exchange"]
    'binance'
    """
    path = CONFIG_DIR / f"{name}.yaml"
    if not path.exists():
        raise FileNotFoundError(f"Không tìm thấy config: {path}")
    with path.open(encoding="utf-8") as f:
        return yaml.safe_load(f)


def symbols_config() -> dict[str, Any]:
    return load_yaml("symbols")


def features_config() -> dict[str, Any]:
    return load_yaml("features")


def model_config() -> dict[str, Any]:
    return load_yaml("model")


@dataclass(frozen=True)
class Secrets:
    """Khoá API. KHÔNG BAO GIỜ log hay in ra các giá trị này."""

    binance_key: str = ""
    binance_secret: str = ""
    testnet_key: str = ""
    testnet_secret: str = ""
    telegram_token: str = ""
    telegram_chat_id: str = ""

    @property
    def has_binance(self) -> bool:
        return bool(self.binance_key and self.binance_secret)


def secrets() -> Secrets:
    return Secrets(
        binance_key=os.getenv("BINANCE_API_KEY", ""),
        binance_secret=os.getenv("BINANCE_API_SECRET", ""),
        testnet_key=os.getenv("BINANCE_TESTNET_API_KEY", ""),
        testnet_secret=os.getenv("BINANCE_TESTNET_API_SECRET", ""),
        telegram_token=os.getenv("TELEGRAM_BOT_TOKEN", ""),
        telegram_chat_id=os.getenv("TELEGRAM_CHAT_ID", ""),
    )


def trading_mode() -> str:
    """`paper` | `testnet` | `live`.

    RULE 9 / GATE 4: mọi lần khởi động lại đều bắt đầu ở chế độ an toàn.
    Hàm này chỉ *đọc* biến môi trường; việc cho phép giao dịch thật còn
    phải qua `trading_enabled()` — hai công tắc riêng biệt là cố ý.
    """
    return os.getenv("TRADING_MODE", "paper").strip().lower()


def trading_enabled() -> bool:
    """Công tắc tổng cho executor. Mặc định TẮT — không có ngoại lệ."""
    return os.getenv("TRADING_ENABLED", "false").strip().lower() == "true"


# ── Tiện ích đường dẫn ─────────────────────────────────────────────


def safe_symbol(symbol: str) -> str:
    """`BTC/USDT` → `BTCUSDT` — dùng làm tên thư mục."""
    return symbol.replace("/", "").replace(":", "_").upper()


def ohlcv_path(symbol: str, timeframe: str, year: int, layer: str = "raw") -> Path:
    """Đường dẫn Parquet phân vùng: <layer>/ohlcv/symbol=X/timeframe=Y/year=Z/data.parquet"""
    base = {"raw": RAW_DIR, "clean": CLEAN_DIR}[layer]
    return (
        base
        / "ohlcv"
        / f"symbol={safe_symbol(symbol)}"
        / f"timeframe={timeframe}"
        / f"year={year}"
        / "data.parquet"
    )
