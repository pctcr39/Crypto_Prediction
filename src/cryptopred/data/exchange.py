"""Khởi tạo client ccxt — một chỗ duy nhất trong repo tạo ra đối tượng sàn.

M1/M2 chỉ dùng public API (không cần khoá). Khoá chỉ cần từ M13 trở đi.
"""

from __future__ import annotations

import logging

import ccxt

from cryptopred.config import secrets, symbols_config

log = logging.getLogger(__name__)

# Binance giới hạn 1000 nến mỗi lần gọi fetch_ohlcv
MAX_CANDLES_PER_REQUEST = 1000


def make_exchange(*, authenticated: bool = False, testnet: bool = False) -> ccxt.Exchange:
    """Tạo client ccxt cho sàn đã cấu hình.

    `enableRateLimit=True` để ccxt tự giãn nhịp gọi. ĐỪNG tắt: Binance ban IP
    theo trọng số request, và một vòng lặp tải dữ liệu rất dễ chạm trần.
    """
    cfg = symbols_config()
    name = cfg.get("exchange", "binance")
    klass = getattr(ccxt, name)

    params: dict = {
        "enableRateLimit": cfg.get("download", {}).get("enable_rate_limit", True),
        "options": {"defaultType": cfg.get("market_type", "spot")},
    }

    if authenticated:
        s = secrets()
        key, sec = (
            (s.testnet_key, s.testnet_secret) if testnet else (s.binance_key, s.binance_secret)
        )
        if not (key and sec):
            raise RuntimeError(
                "Thiếu khoá API. Copy .env.example → .env rồi điền "
                f"{'BINANCE_TESTNET_API_*' if testnet else 'BINANCE_API_*'}."
            )
        params |= {"apiKey": key, "secret": sec}

    ex = klass(params)
    if testnet:
        ex.set_sandbox_mode(True)
        log.warning("Đang chạy ở chế độ TESTNET — lệnh không dùng tiền thật.")
    return ex


def normalize_symbol(symbol: str) -> str:
    """`BTCUSDT` / `btc/usdt` / `BTC-USDT` → `BTC/USDT` (định dạng ccxt).

    Cho phép người dùng gõ kiểu Binance ở dòng lệnh mà bên trong vẫn dùng
    một định dạng duy nhất.
    """
    s = symbol.strip().upper().replace("-", "/").replace("_", "/")
    if "/" in s:
        return s
    for quote in ("USDT", "FDUSD", "USDC", "BTC", "ETH", "BNB", "TUSD"):
        if s.endswith(quote) and len(s) > len(quote):
            return f"{s[: -len(quote)]}/{quote}"
    raise ValueError(f"Không đoán được cặp từ '{symbol}'. Hãy viết dạng 'BTC/USDT'.")


def timeframe_ms(exchange: ccxt.Exchange, timeframe: str) -> int:
    """Độ dài một nến, tính bằng mili-giây."""
    return exchange.parse_timeframe(timeframe) * 1000
