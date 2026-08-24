"""M1 · Vũ trụ coin — lọc cặp đủ điều kiện và lưu ảnh chụp theo tháng.

    python -m cryptopred.data.universe --refresh
    python -m cryptopred.data.universe --show

Vì sao phải chụp theo tháng (MASTER_PLAN §4.2):
    Nếu backtest 3 năm trên top-50 coin CỦA HÔM NAY, bạn đã âm thầm loại bỏ
    mọi coin bị huỷ niêm yết hoặc về 0 — kết quả sẽ đẹp giả tạo. Đó là
    **bẫy sống sót**. Cách chống duy nhất: mỗi tháng lưu lại danh sách đủ
    điều kiện *tại thời điểm đó*, và backtest tháng nào dùng danh sách tháng ấy.

Suy luận thì KHÔNG bị bó vào danh sách này — nhờ RULE 1 (feature scale-free),
model chạy được cho bất kỳ cặp nào; dashboard chỉ cần gắn nhãn
"ngoài tập huấn luyện" cho trung thực.
"""

from __future__ import annotations

import argparse
import logging
import re
import sys
from pathlib import Path

import pandas as pd

from cryptopred.config import RAW_DIR, symbols_config
from cryptopred.data.exchange import make_exchange
from cryptopred.logging_setup import setup_logging

log = logging.getLogger(__name__)

UNIVERSE_DIR = RAW_DIR / "universe"


def _snapshot_path(month: str) -> Path:
    return UNIVERSE_DIR / f"month={month}" / "universe.parquet"


def list_candidates(exchange=None) -> pd.DataFrame:
    """Lấy mọi cặp spot đang hoạt động, kèm volume 24h từ ticker.

    Volume 30 ngày ở đây được *ước lượng* bằng `quoteVolume` 24h × 30.
    Đây là xấp xỉ thô nhưng đủ để lọc sơ bộ; sau khi đã tải nến 1d về,
    `refresh()` sẽ tính lại bằng tổng thật (xem `_exact_30d_volume`).
    """
    cfg = symbols_config()
    ex = exchange or make_exchange()
    ex.load_markets()

    quote = cfg.get("quote", "USDT")
    filters = cfg.get("filters", {})
    stables = {s.upper() for s in cfg.get("stablecoin_bases", [])}
    patterns = [re.escape(p) for p in filters.get("exclude_patterns", [])]
    pattern_re = re.compile("|".join(patterns)) if patterns else None

    tickers = ex.fetch_tickers()
    rows = []

    for symbol, m in ex.markets.items():
        if not (m.get("spot") and m.get("active") and m.get("quote") == quote):
            continue
        base = str(m.get("base", "")).upper()
        if filters.get("exclude_stablecoins", True) and base in stables:
            continue
        if pattern_re and pattern_re.search(symbol):
            continue
        if filters.get("exclude_leveraged", True) and re.search(r"(UP|DOWN|BULL|BEAR)$", base):
            continue

        t = tickers.get(symbol, {})
        qv24 = t.get("quoteVolume")
        rows.append(
            {
                "symbol": symbol,
                "base": base,
                "quote_volume_24h_usd": float(qv24) if qv24 else 0.0,
                "quote_volume_30d_est_usd": float(qv24) * 30 if qv24 else 0.0,
            }
        )

    df = pd.DataFrame(rows).sort_values("quote_volume_24h_usd", ascending=False)
    log.info("Sàn có %s cặp spot %s đang hoạt động (sau khi loại stable/đòn bẩy).", len(df), quote)
    return df.reset_index(drop=True)


def fetch_listing_dates(symbols: list[str], exchange=None) -> dict[str, pd.Timestamp]:
    """Ngày niêm yết ≈ timestamp của nến ngày đầu tiên sàn có.

    Mỗi cặp một request nhẹ. Với ~400 cặp và rate limit bật, mất vài phút.
    """
    ex = exchange or make_exchange()
    out: dict[str, pd.Timestamp] = {}
    for i, symbol in enumerate(symbols, 1):
        try:
            candles = ex.fetch_ohlcv(symbol, "1d", since=0, limit=1)
            if candles:
                out[symbol] = pd.to_datetime(candles[0][0], unit="ms", utc=True)
        except Exception as e:  # noqa: BLE001
            log.debug("Không lấy được ngày niêm yết %s: %s", symbol, e)
        if i % 50 == 0:
            log.info("  … đã kiểm tra ngày niêm yết %s/%s cặp", i, len(symbols))
    return out


def refresh(*, month: str | None = None, check_listing: bool = True, exchange=None) -> pd.DataFrame:
    """Dựng và lưu ảnh chụp vũ trụ coin cho tháng hiện tại."""
    cfg = symbols_config()
    filters = cfg.get("filters", {})
    tu = cfg.get("training_universe", {})
    month = month or pd.Timestamp.now(tz="UTC").strftime("%Y-%m")

    df = list_candidates(exchange)

    min_vol = float(filters.get("min_quote_volume_30d_usd", 0))
    df["pass_volume"] = df["quote_volume_30d_est_usd"] >= min_vol

    min_days = int(filters.get("min_listed_days", 0))
    if check_listing and min_days > 0:
        liquid = df.loc[df["pass_volume"], "symbol"].tolist()
        log.info("Kiểm tra ngày niêm yết cho %s cặp đạt thanh khoản…", len(liquid))
        dates = fetch_listing_dates(liquid, exchange)
        now = pd.Timestamp.now(tz="UTC")
        df["listed_at"] = df["symbol"].map(dates)
        df["listed_days"] = (now - df["listed_at"]).dt.days
        df["pass_age"] = df["listed_days"].fillna(-1) >= min_days
    else:
        df["listed_at"] = pd.NaT
        df["listed_days"] = pd.NA
        df["pass_age"] = True

    df["eligible"] = df["pass_volume"] & df["pass_age"]

    # Tập huấn luyện = top N theo volume trong số đủ điều kiện + always_include
    top_n = int(tu.get("top_n_by_volume", 40))
    training = df.loc[df["eligible"], "symbol"].head(top_n).tolist()
    for s in cfg.get("always_include", []):
        if s not in training:
            training.append(str(s))
    df["in_training_universe"] = df["symbol"].isin(training)
    df["snapshot_month"] = month

    path = _snapshot_path(month)
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(path, engine="pyarrow", compression="snappy")

    log.info(
        "Ảnh chụp %s: %s đủ điều kiện / %s cặp · tập huấn luyện %s cặp → %s",
        month,
        int(df["eligible"].sum()),
        len(df),
        len(training),
        path,
    )
    return df


def load_snapshot(month: str | None = None) -> pd.DataFrame:
    """Đọc ảnh chụp của một tháng. Không truyền tháng → ảnh chụp mới nhất."""
    if month is None:
        months = (
            sorted(p.name.split("=")[1] for p in UNIVERSE_DIR.glob("month=*"))
            if UNIVERSE_DIR.exists()
            else []
        )
        if not months:
            return pd.DataFrame()
        month = months[-1]
    path = _snapshot_path(month)
    return pd.read_parquet(path) if path.exists() else pd.DataFrame()


def load_training_universe(month: str | None = None) -> list[str]:
    """Danh sách cặp dùng để HUẤN LUYỆN ở tháng chỉ định."""
    df = load_snapshot(month)
    if df.empty:
        return []
    return df.loc[df["in_training_universe"], "symbol"].tolist()


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(
        prog="python -m cryptopred.data.universe",
        description="Lọc vũ trụ coin và lưu ảnh chụp theo tháng (chống bẫy sống sót).",
    )
    p.add_argument("--refresh", action="store_true", help="gọi sàn và dựng ảnh chụp mới")
    p.add_argument("--show", action="store_true", help="in ảnh chụp gần nhất")
    p.add_argument("--month", help="tháng dạng YYYY-MM")
    p.add_argument(
        "--no-listing-check",
        action="store_true",
        help="bỏ kiểm tra ngày niêm yết (nhanh hơn nhiều)",
    )
    p.add_argument("--log-level", default=None)
    args = p.parse_args(argv)
    setup_logging(args.log_level)

    if args.refresh:
        refresh(month=args.month, check_listing=not args.no_listing_check)

    if args.show or not args.refresh:
        df = load_snapshot(args.month)
        if df.empty:
            log.error("Chưa có ảnh chụp nào. Chạy: python -m cryptopred.data.universe --refresh")
            return 1
        cols = ["symbol", "quote_volume_24h_usd", "listed_days", "eligible", "in_training_universe"]
        print(df.loc[df["in_training_universe"], cols].to_string(index=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
