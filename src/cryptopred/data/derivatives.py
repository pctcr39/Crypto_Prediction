"""M1 · Thu thập dữ liệu PHÁI SINH — funding · open interest · taker ratio · sổ lệnh.

    python -m cryptopred.data.derivatives --universe          # chạy hằng ngày (cron)
    python -m cryptopred.data.derivatives BTCUSDT ETHUSDT
    python -m cryptopred.data.derivatives --universe --what oi

★ VÌ SAO MODULE NÀY PHẢI CHẠY TỪ HÔM NAY, KHÔNG PHẢI KHI LÀM TỚI M3:

    Binance chỉ trả **30 ngày** lịch sử `openInterestHist`. Mỗi ngày hoãn là
    mất một ngày dữ liệu **VĨNH VIỄN** — không mua lại được, không tái tạo được.
    Funding và nến thì lấy lại được bất cứ lúc nào; OI thì không.

    Sổ lệnh (spread + độ sâu) còn tệ hơn: KHÔNG có lịch sử nào cả. Chỉ có ảnh
    chụp tại thời điểm gọi. Nó là đầu vào duy nhất cho phép đo trượt giá của
    lệnh dừng lỗ — cổng chặn nhạy nhất của thiết kế (PREDICTION_DESIGN §8.5 #4).

Ghi vào `data/raw/`, phân vùng theo symbol, idempotent (chạy lại không trùng lặp).
"""

from __future__ import annotations

import argparse
import logging
import sys
import time
from datetime import UTC, datetime
from pathlib import Path

import pandas as pd

from cryptopred.config import RAW_DIR, symbols_config
from cryptopred.data.exchange import make_exchange, normalize_symbol
from cryptopred.logging_setup import setup_logging

log = logging.getLogger(__name__)

FUNDING_DIR = RAW_DIR / "funding"
OI_DIR = RAW_DIR / "open_interest"
TAKER_DIR = RAW_DIR / "taker_ratio"
BOOK_DIR = RAW_DIR / "orderbook"

OI_PERIOD = "5m"  # độ mịn nhỏ nhất Binance cho phép
OI_MAX_DAYS = 30  # ← giới hạn cứng của sàn. Đây là lý do module này tồn tại.
BOOK_LIMIT = 20  # số mức mỗi bên


def _perp(symbol: str) -> str:
    """`BTCUSDT` → `BTC/USDT:USDT` (hợp đồng vĩnh cửu USDT-M của ccxt)."""
    return f"{normalize_symbol(symbol)}:{normalize_symbol(symbol).split('/')[1]}"


def _merge_write(df: pd.DataFrame, path: Path, key: str = "ts") -> int:
    """Gộp với dữ liệu đã có, khử trùng lặp theo `key`, ghi lại. Trả về số hàng MỚI."""
    if df.empty:
        return 0
    path.parent.mkdir(parents=True, exist_ok=True)
    before = 0
    if path.exists():
        old = pd.read_parquet(path)
        before = len(old)
        df = pd.concat([old.reset_index(), df.reset_index()]).drop_duplicates(key, keep="last")
        df = df.set_index(key).sort_index()
    df.to_parquet(path)
    return len(df) - before


# ══════════════════════════════════════════════════════════════════
#  Bốn nguồn
# ══════════════════════════════════════════════════════════════════


def fetch_funding(ex, symbol: str, since_ms: int | None = None) -> pd.DataFrame:
    """Lịch sử funding 8 giờ. LẤY LẠI ĐƯỢC — không gấp, nhưng rẻ nên gom luôn."""
    rows, since = [], since_ms or ex.parse8601("2019-09-01T00:00:00Z")
    while True:
        batch = ex.fetch_funding_rate_history(_perp(symbol), since=since, limit=1000)
        if not batch:
            break
        rows += batch
        nxt = batch[-1]["timestamp"] + 1
        if nxt <= since or len(batch) < 1000:
            break
        since = nxt
        time.sleep(ex.rateLimit / 1000)
    return (
        pd.DataFrame(
            [
                {
                    "ts": pd.to_datetime(r["timestamp"], unit="ms", utc=True),
                    "funding_rate": float(r["fundingRate"]),
                }
                for r in rows
            ]
        )
        .drop_duplicates("ts")
        .set_index("ts")
        .sort_index()
    )


def fetch_open_interest(ex, symbol: str) -> pd.DataFrame:
    """★ MẤT VĨNH VIỄN nếu hoãn — Binance chỉ giữ 30 ngày."""
    since = ex.milliseconds() - OI_MAX_DAYS * 86_400_000
    rows = ex.fetch_open_interest_history(_perp(symbol), OI_PERIOD, since=since, limit=500)
    out = []
    for r in rows:
        info = r.get("info", {}) or {}
        out.append(
            {
                "ts": pd.to_datetime(r["timestamp"], unit="ms", utc=True),
                "oi_base": float(
                    info.get("sumOpenInterest") or r.get("openInterestAmount") or "nan"
                ),
                "oi_quote": float(
                    info.get("sumOpenInterestValue") or r.get("openInterestValue") or "nan"
                ),
            }
        )
    return pd.DataFrame(out).drop_duplicates("ts").set_index("ts").sort_index()


def fetch_taker_ratio(ex, symbol: str) -> pd.DataFrame:
    """Tỉ lệ mua/bán chủ động của futures. Cũng giới hạn 30 ngày."""
    since = ex.milliseconds() - OI_MAX_DAYS * 86_400_000
    raw = ex.fetch_long_short_ratio_history(_perp(symbol), OI_PERIOD, since=since, limit=500)
    out = []
    for r in raw:
        info = r.get("info", {}) or {}
        out.append(
            {
                "ts": pd.to_datetime(r["timestamp"], unit="ms", utc=True),
                "long_short_ratio": float(
                    r.get("longShortRatio") or info.get("longShortRatio") or "nan"
                ),
            }
        )
    return pd.DataFrame(out).drop_duplicates("ts").set_index("ts").sort_index()


def snapshot_orderbook(ex, symbol: str) -> pd.DataFrame:
    """★ KHÔNG CÓ LỊCH SỬ — chỉ có ảnh chụp tại thời điểm gọi.

    Đầu vào duy nhất cho phép đo trượt giá lệnh dừng lỗ. Ghi spread và độ sâu
    tích luỹ hai bên; một hàng mỗi lần gọi.
    """
    ob = ex.fetch_order_book(normalize_symbol(symbol), limit=BOOK_LIMIT)
    bids, asks = ob.get("bids") or [], ob.get("asks") or []
    if not bids or not asks:
        return pd.DataFrame()
    best_bid, best_ask = bids[0][0], asks[0][0]
    mid = (best_bid + best_ask) / 2
    row = {
        "ts": pd.to_datetime(ob.get("timestamp") or ex.milliseconds(), unit="ms", utc=True),
        "mid": mid,
        "spread_pct": (best_ask - best_bid) / mid * 100,
        "bid_depth_quote": sum(p * q for p, q in bids),
        "ask_depth_quote": sum(p * q for p, q in asks),
        "levels": min(len(bids), len(asks)),
    }
    return pd.DataFrame([row]).set_index("ts")


SOURCES = {
    "funding": (fetch_funding, FUNDING_DIR),
    "oi": (fetch_open_interest, OI_DIR),
    "taker": (fetch_taker_ratio, TAKER_DIR),
    "book": (snapshot_orderbook, BOOK_DIR),
}


def collect(symbols: list[str], what: list[str], exchange=None) -> dict[str, dict[str, int]]:
    """Thu thập và ghi. Trả về {symbol: {nguồn: số hàng mới}}."""
    ex = exchange or make_exchange()
    ex.options["defaultType"] = "future"  # OI/funding/taker chỉ có ở futures
    report: dict[str, dict[str, int]] = {}
    for sym in symbols:
        report[sym] = {}
        for name in what:
            fn, base = SOURCES[name]
            try:
                df = fn(ex, sym)
                n = _merge_write(df, base / f"symbol={sym}" / "data.parquet")
                report[sym][name] = n
                log.info("%-10s %-8s +%d hàng", sym, name, n)
            except Exception as exc:  # noqa: BLE001 — cron không được chết
                report[sym][name] = -1
                log.warning("%-10s %-8s LỖI: %s", sym, name, exc)
            time.sleep(ex.rateLimit / 1000)
    return report


def _universe_symbols() -> list[str]:
    """Vũ trụ giao dịch từ ảnh chụp mới nhất; thiếu thì lấy từ config."""
    snaps = sorted((RAW_DIR / "universe").glob("month=*/universe.parquet"))
    if snaps:
        df = pd.read_parquet(snaps[-1])
        col = "symbol" if "symbol" in df.columns else df.columns[0]
        if "in_training_universe" in df.columns:
            df = df[df["in_training_universe"]]
        return [str(s).replace("/", "") for s in df[col].tolist()]
    return [s.replace("/", "") for s in symbols_config().get("explicit", [])]


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Thu thập dữ liệu phái sinh — OI mất vĩnh viễn sau 30 ngày.",
        epilog="Chạy hằng ngày. Xem docs/PREDICTION_DESIGN.md §11.1 bước 0.",
    )
    p.add_argument("symbols", nargs="*", help="vd BTCUSDT ETHUSDT")
    p.add_argument("--universe", action="store_true", help="dùng ảnh chụp vũ trụ mới nhất")
    p.add_argument(
        "--what", default="funding,oi,taker,book", help="nguồn cần lấy, phân tách bằng dấu phẩy"
    )
    p.add_argument("--log-level", default="INFO")
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    setup_logging(args.log_level)
    symbols = _universe_symbols() if args.universe else [s.upper() for s in args.symbols]
    if not symbols:
        log.error("Chưa có symbol nào. Dùng --universe hoặc liệt kê tường minh.")
        return 2
    what = [w.strip() for w in args.what.split(",") if w.strip() in SOURCES]
    log.info(
        "Thu thập %s cho %d cặp — %s",
        what,
        len(symbols),
        datetime.now(UTC).strftime("%Y-%m-%d %H:%M UTC"),
    )
    rep = collect(symbols, what)
    fails = sum(1 for v in rep.values() for n in v.values() if n < 0)
    total = sum(n for v in rep.values() for n in v.values() if n > 0)
    log.info("Xong: +%d hàng · %d lỗi", total, fails)
    return 1 if fails and total == 0 else 0


if __name__ == "__main__":
    sys.exit(main())
