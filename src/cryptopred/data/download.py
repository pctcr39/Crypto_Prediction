"""M1 · Tải lịch sử nến từ sàn về `data/raw/`.

Chạy được ngay từ dòng lệnh — đây là cổng ra của M0:

    python -m cryptopred.data.download BTCUSDT 1h
    python -m cryptopred.data.download BTCUSDT ETHUSDT 1h --start 2024-01-01
    python -m cryptopred.data.download --universe 1h 4h 1d

Bốn tính chất bắt buộc của module này:

1. **Idempotent** — chạy lại chỉ tải phần còn thiếu, không tạo bản ghi trùng.
2. **Chỉ lấy nến đã đóng** — nến đang hình thành sẽ còn thay đổi; đưa nó vào
   dữ liệu huấn luyện là một dạng rò rỉ tương lai (RULE 2).
3. **Không tin dữ liệu là bất biến** — sàn thỉnh thoảng sửa lại nến cũ. Khi
   tải chồng lên vùng đã có, ta *so sánh và ghi log chênh lệch* thay vì im lặng.
4. **Không giả định chuỗi liên tục** — sàn có lúc bảo trì, chuỗi sẽ có lỗ hổng.
   Ở tầng `raw/` ta KHÔNG điền gì cả; việc đó để M2 đánh dấu và M3 tự quyết.

⚠️ Ghi chú cho M3: `fetch_ohlcv` của ccxt không trả về *taker buy volume* —
   feature `taker_buy_ratio` ở config/features.yaml sẽ cần gọi thẳng endpoint
   `/api/v3/klines` của Binance. Chưa làm ở đây, xem TODO cuối file.
"""

from __future__ import annotations

import argparse
import logging
import sys
import time
from datetime import UTC, datetime
from pathlib import Path

import ccxt
import pandas as pd

from cryptopred.config import ohlcv_path, symbols_config
from cryptopred.data.exchange import (
    MAX_CANDLES_PER_REQUEST,
    make_exchange,
    normalize_symbol,
    timeframe_ms,
)
from cryptopred.logging_setup import setup_logging

log = logging.getLogger(__name__)

OHLCV_COLUMNS = ["open", "high", "low", "close", "volume"]


# ══════════════════════════════════════════════════════════════════
#  Đọc / ghi tầng raw
# ══════════════════════════════════════════════════════════════════


def _partition_dir(symbol: str, timeframe: str, layer: str = "raw") -> Path:
    return ohlcv_path(symbol, timeframe, year=1970, layer=layer).parents[1]


def read_local(symbol: str, timeframe: str, layer: str = "raw") -> pd.DataFrame:
    """Đọc toàn bộ nến đã có trên đĩa. Trả về DataFrame rỗng nếu chưa có gì."""
    root = _partition_dir(symbol, timeframe, layer)
    files = sorted(root.glob("year=*/data.parquet")) if root.exists() else []
    if not files:
        return _empty_frame()

    df = pd.concat([pd.read_parquet(f) for f in files])
    return _tidy(df)


def write_local(df: pd.DataFrame, symbol: str, timeframe: str, layer: str = "raw") -> list[Path]:
    """Ghi Parquet phân vùng theo năm. Ghi đè trọn vẹn từng năm bị ảnh hưởng."""
    written: list[Path] = []
    for year, chunk in df.groupby(df.index.year):
        path = ohlcv_path(symbol, timeframe, int(year), layer)
        path.parent.mkdir(parents=True, exist_ok=True)
        chunk.to_parquet(path, engine="pyarrow", compression="snappy")
        written.append(path)
    return written


def _empty_frame() -> pd.DataFrame:
    idx = pd.DatetimeIndex([], tz="UTC", name="ts")
    return pd.DataFrame(columns=OHLCV_COLUMNS, index=idx, dtype="float64")


def _tidy(df: pd.DataFrame) -> pd.DataFrame:
    """Sắp xếp, khử trùng lặp (giữ bản ghi MỚI NHẤT), kiểm tra bất biến."""
    df = df[~df.index.duplicated(keep="last")].sort_index()
    assert df.index.is_monotonic_increasing, "Index không tăng dần — lỗi logic ghép dữ liệu"
    assert df.index.is_unique, "Index có timestamp trùng — lỗi logic khử trùng lặp"
    return df


# ══════════════════════════════════════════════════════════════════
#  Gọi sàn
# ══════════════════════════════════════════════════════════════════


def fetch_range(
    exchange: ccxt.Exchange,
    symbol: str,
    timeframe: str,
    since_ms: int,
    until_ms: int,
) -> pd.DataFrame:
    """Tải phân trang [since_ms, until_ms). Có retry với backoff."""
    cfg = symbols_config().get("download", {})
    limit = int(cfg.get("candles_per_request", MAX_CANDLES_PER_REQUEST))
    max_retries = int(cfg.get("max_retries", 5))
    backoff = float(cfg.get("retry_backoff_sec", 2.0))
    step = timeframe_ms(exchange, timeframe)

    rows: list[list] = []
    cursor = since_ms

    while cursor < until_ms:
        batch = None
        for attempt in range(1, max_retries + 1):
            try:
                batch = exchange.fetch_ohlcv(symbol, timeframe, since=cursor, limit=limit)
                break
            except (ccxt.NetworkError, ccxt.ExchangeNotAvailable, ccxt.RequestTimeout) as e:
                wait = backoff * attempt
                log.warning(
                    "Lỗi mạng (%s/%s): %s — thử lại sau %.1fs", attempt, max_retries, e, wait
                )
                time.sleep(wait)
        if batch is None:
            raise RuntimeError(f"Tải {symbol} {timeframe} thất bại sau {max_retries} lần thử.")

        # Sàn trả rỗng = hết dữ liệu ở vùng này (coin chưa niêm yết, hoặc đã tới hiện tại)
        if not batch:
            break

        batch = [r for r in batch if r[0] < until_ms]
        if not batch:
            break

        rows.extend(batch)
        new_cursor = batch[-1][0] + step
        # Chống lặp vô hạn khi sàn trả về đúng một nến cũ
        if new_cursor <= cursor:
            break
        cursor = new_cursor

        log.debug("  … %s nến, tới %s", len(rows), _fmt(batch[-1][0]))

    if not rows:
        return _empty_frame()

    df = pd.DataFrame(rows, columns=["ts", *OHLCV_COLUMNS])
    df["ts"] = pd.to_datetime(df["ts"], unit="ms", utc=True)
    return _tidy(df.set_index("ts").astype("float64"))


# ══════════════════════════════════════════════════════════════════
#  Điều phối
# ══════════════════════════════════════════════════════════════════


def download_symbol(
    symbol: str,
    timeframe: str,
    *,
    start: str | None = None,
    end: str | None = None,
    exchange: ccxt.Exchange | None = None,
    force: bool = False,
) -> pd.DataFrame:
    """Tải (hoặc bổ sung) lịch sử một cặp. Trả về toàn bộ chuỗi sau khi ghi."""
    ex = exchange or make_exchange()
    symbol = normalize_symbol(symbol)
    step = timeframe_ms(ex, timeframe)

    cfg_start = symbols_config().get("history", {}).get("start")
    since_ms = _to_ms(start or cfg_start)

    # Chỉ lấy nến ĐÃ ĐÓNG: cắt mốc hiện tại về đầu nến đang chạy (RULE 2)
    now_ms = ex.milliseconds()
    until_ms = _to_ms(end) if end else (now_ms // step) * step

    existing = _empty_frame() if force else read_local(symbol, timeframe)

    if not existing.empty:
        last_ms = int(existing.index[-1].timestamp() * 1000)
        # Tải chồng lại 2 nến cuối để phát hiện việc sàn sửa nến cũ
        since_ms = max(since_ms, last_ms - step)
        log.info(
            "%s %s — đã có %s nến (%s → %s), tải tiếp từ %s",
            symbol,
            timeframe,
            f"{len(existing):,}",
            _fmt_ts(existing.index[0]),
            _fmt_ts(existing.index[-1]),
            _fmt(since_ms),
        )
    else:
        log.info("%s %s — chưa có dữ liệu, tải từ đầu: %s", symbol, timeframe, _fmt(since_ms))

    if since_ms >= until_ms:
        log.info("%s %s — đã cập nhật, không cần tải thêm.", symbol, timeframe)
        return existing

    fresh = fetch_range(ex, symbol, timeframe, since_ms, until_ms)
    if fresh.empty:
        log.info("%s %s — sàn không trả về nến nào trong khoảng yêu cầu.", symbol, timeframe)
        return existing

    _report_revisions(existing, fresh, symbol, timeframe)

    merged = _tidy(pd.concat([existing, fresh]))
    added = len(merged) - len(existing)
    paths = write_local(merged, symbol, timeframe)

    log.info(
        "%s %s — +%s nến (tổng %s) → %s file, mới nhất %s",
        symbol,
        timeframe,
        f"{added:,}",
        f"{len(merged):,}",
        len(paths),
        _fmt_ts(merged.index[-1]),
    )
    _report_gaps(merged, step, symbol, timeframe)
    return merged


def _report_revisions(old: pd.DataFrame, new: pd.DataFrame, symbol: str, timeframe: str) -> None:
    """Sàn có sửa lại nến cũ không? Ghi log, không sửa lặng lẽ (cạm bẫy M1)."""
    if old.empty:
        return
    common = old.index.intersection(new.index)
    if common.empty:
        return
    diff = ~old.loc[common].round(10).eq(new.loc[common].round(10)).all(axis=1)
    if diff.any():
        log.warning(
            "%s %s — sàn đã SỬA %s nến cũ (vd %s). Bản mới được giữ lại.",
            symbol,
            timeframe,
            int(diff.sum()),
            _fmt_ts(common[diff][0]),
        )


def _report_gaps(df: pd.DataFrame, step_ms: int, symbol: str, timeframe: str) -> None:
    """Đếm lỗ hổng. KHÔNG điền — tầng raw là nguyên bản, M2 mới xử lý."""
    if len(df) < 2:
        return
    deltas = df.index.to_series().diff().dropna()
    gaps = deltas[deltas > pd.Timedelta(step_ms, unit="ms")]
    if not gaps.empty:
        log.warning(
            "%s %s — có %s lỗ hổng (lớn nhất %s). Không điền ở tầng raw; M2 sẽ đánh dấu.",
            symbol,
            timeframe,
            len(gaps),
            gaps.max(),
        )


# ══════════════════════════════════════════════════════════════════
#  Tiện ích thời gian
# ══════════════════════════════════════════════════════════════════


def _to_ms(value: str | None) -> int:
    if value is None:
        return 0
    ts = pd.Timestamp(value)
    ts = ts.tz_localize("UTC") if ts.tzinfo is None else ts.tz_convert("UTC")
    return int(ts.timestamp() * 1000)


def _fmt(ms: int) -> str:
    return datetime.fromtimestamp(ms / 1000, tz=UTC).strftime("%Y-%m-%d %H:%M")


def _fmt_ts(ts: pd.Timestamp) -> str:
    return ts.strftime("%Y-%m-%d %H:%M")


# ══════════════════════════════════════════════════════════════════
#  CLI
# ══════════════════════════════════════════════════════════════════


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="python -m cryptopred.data.download",
        description="Tải lịch sử nến từ Binance về data/raw/ (idempotent).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Ví dụ:\n"
            "  python -m cryptopred.data.download BTCUSDT 1h\n"
            "  python -m cryptopred.data.download BTCUSDT ETHUSDT 1h --start 2024-01-01\n"
            "  python -m cryptopred.data.download --universe 1h 4h\n"
        ),
    )
    p.add_argument("args", nargs="*", help="danh sách cặp rồi tới danh sách khung, vd: BTCUSDT 1h")
    p.add_argument(
        "--universe", action="store_true", help="dùng tập huấn luyện trong config/symbols.yaml"
    )
    p.add_argument("--start", help="mốc bắt đầu, vd 2024-01-01 (mặc định: history.start)")
    p.add_argument("--end", help="mốc kết thúc (mặc định: nến đóng gần nhất)")
    p.add_argument("--force", action="store_true", help="bỏ qua dữ liệu đã có, tải lại từ đầu")
    p.add_argument("--log-level", default=None, help="DEBUG / INFO / WARNING")
    return p


_TIMEFRAME_TOKENS = {
    "1m",
    "3m",
    "5m",
    "15m",
    "30m",
    "1h",
    "2h",
    "4h",
    "6h",
    "8h",
    "12h",
    "1d",
    "3d",
    "1w",
}


def _split_args(tokens: list[str]) -> tuple[list[str], list[str]]:
    """Tách danh sách thành (cặp, khung) — khung là các token như 1h, 4h, 1d."""
    symbols = [t for t in tokens if t.lower() not in _TIMEFRAME_TOKENS]
    timeframes = [t.lower() for t in tokens if t.lower() in _TIMEFRAME_TOKENS]
    return symbols, timeframes


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    setup_logging(args.log_level)

    symbols, timeframes = _split_args(args.args)
    cfg = symbols_config()

    if args.universe:
        from cryptopred.data.universe import load_training_universe

        symbols = load_training_universe()
        if not symbols:
            log.error(
                "Chưa có ảnh chụp vũ trụ coin. Chạy trước:\n"
                "  python -m cryptopred.data.universe --refresh"
            )
            return 1

    if not symbols:
        symbols = [str(s) for s in cfg.get("always_include", ["BTC/USDT"])]
        log.info("Không truyền cặp nào — dùng always_include: %s", ", ".join(symbols))
    if not timeframes:
        timeframes = [str(t) for t in cfg.get("timeframes", ["1h"])]
        log.info("Không truyền khung nào — dùng timeframes trong config: %s", ", ".join(timeframes))

    ex = make_exchange()
    failed: list[str] = []

    for symbol in symbols:
        for tf in timeframes:
            try:
                download_symbol(
                    symbol, tf, start=args.start, end=args.end, exchange=ex, force=args.force
                )
            except Exception as e:  # noqa: BLE001 — một cặp lỗi không được làm sập cả mẻ
                log.error("✗ %s %s — %s: %s", symbol, tf, type(e).__name__, e)
                failed.append(f"{symbol} {tf}")

    if failed:
        log.error(
            "Thất bại %s/%s: %s", len(failed), len(symbols) * len(timeframes), ", ".join(failed)
        )
        return 1

    log.info("✓ Xong — %s cặp × %s khung.", len(symbols), len(timeframes))
    return 0


# TODO(M3): taker buy volume không có trong fetch_ohlcv của ccxt.
#   Cần gọi thẳng /api/v3/klines (cột 9: taker buy base asset volume)
#   để dựng feature `taker_buy_ratio` ở config/features.yaml.

if __name__ == "__main__":
    sys.exit(main())
