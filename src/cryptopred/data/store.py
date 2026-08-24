"""M2 · Lớp đọc dữ liệu — API DUY NHẤT cho mọi module phía sau.

Không module nào khác được tự mở file Parquet. Lý do: khi đổi bố cục lưu trữ
(thêm phân vùng, đổi sang DuckDB, đổi tên cột), chỉ phải sửa ở đây.

    from cryptopred.data import store
    df = store.get_ohlcv("BTC/USDT", "1h", start="2024-01-01")

Trạng thái: phần ĐỌC đã chạy được. Phần LÀM SẠCH (`build_clean`) là việc của
M2 và hiện mới chỉ dựng khung — xem `docs/03_MODULE_SPECS.md`.
"""

from __future__ import annotations

import logging

import duckdb
import pandas as pd

from cryptopred.config import CLEAN_DIR, RAW_DIR, safe_symbol
from cryptopred.data.download import read_local

log = logging.getLogger(__name__)


def get_ohlcv(
    symbol: str,
    timeframe: str,
    *,
    start: str | None = None,
    end: str | None = None,
    layer: str = "auto",
) -> pd.DataFrame:
    """Đọc nến của một cặp.

    `layer="auto"` ưu tiên `clean/`, chưa có thì rơi về `raw/`.
    Trả về DataFrame index UTC tăng dần, duy nhất, cột open/high/low/close/volume.
    """
    if layer == "auto":
        layer = "clean" if _has_layer(symbol, timeframe, "clean") else "raw"

    df = read_local(symbol, timeframe, layer=layer)
    if df.empty:
        raise FileNotFoundError(
            f"Chưa có dữ liệu {symbol} {timeframe} ở tầng '{layer}'. Chạy trước:\n"
            f"  python -m cryptopred.data.download {safe_symbol(symbol)} {timeframe}"
        )

    if start is not None:
        df = df.loc[df.index >= pd.Timestamp(start, tz="UTC")]
    if end is not None:
        df = df.loc[df.index < pd.Timestamp(end, tz="UTC")]
    return df


def _has_layer(symbol: str, timeframe: str, layer: str) -> bool:
    base = {"raw": RAW_DIR, "clean": CLEAN_DIR}[layer]
    root = base / "ohlcv" / f"symbol={safe_symbol(symbol)}" / f"timeframe={timeframe}"
    return root.exists() and any(root.glob("year=*/data.parquet"))


def available(layer: str = "raw") -> pd.DataFrame:
    """Liệt kê những gì đang có trên đĩa: cặp, khung, số nến, khoảng thời gian."""
    base = {"raw": RAW_DIR, "clean": CLEAN_DIR}[layer]
    root = base / "ohlcv"
    if not root.exists():
        return pd.DataFrame(columns=["symbol", "timeframe", "bars", "first", "last"])

    duckdb.sql("SET TimeZone='UTC'")  # mọi mốc thời gian trong repo đều là UTC

    rows = []
    for tf_dir in sorted(root.glob("symbol=*/timeframe=*")):
        symbol = tf_dir.parent.name.split("=")[1]
        timeframe = tf_dir.name.split("=")[1]
        files = sorted(tf_dir.glob("year=*/data.parquet"))
        if not files:
            continue
        q = duckdb.sql(
            "SELECT count(*) AS bars, min(ts) AS first, max(ts) AS last "
            f"FROM read_parquet({[str(f) for f in files]!r})"
        ).fetchone()
        rows.append(
            {"symbol": symbol, "timeframe": timeframe, "bars": q[0], "first": q[1], "last": q[2]}
        )
    return pd.DataFrame(rows)


def quality_report(symbol: str, timeframe: str) -> dict:
    """Báo cáo chất lượng — M2 · DoD yêu cầu in ra lỗ hổng + điểm bất thường.

    KHÔNG sửa dữ liệu, chỉ mô tả. Việc quyết định xử lý thế nào là của M3.
    """
    df = get_ohlcv(symbol, timeframe, layer="raw")
    step = pd.Timedelta(df.index.to_series().diff().median())
    deltas = df.index.to_series().diff()
    gaps = deltas[deltas > step]
    ret = (df["close"] / df["close"].shift(1) - 1).abs()

    return {
        "symbol": symbol,
        "timeframe": timeframe,
        "bars": len(df),
        "first": df.index[0],
        "last": df.index[-1],
        "gaps": int(len(gaps)),
        "largest_gap": gaps.max() if not gaps.empty else pd.Timedelta(0),
        "nonpositive_price": int((df[["open", "high", "low", "close"]] <= 0).any(axis=1).sum()),
        "high_lt_low": int((df["high"] < df["low"]).sum()),
        "negative_volume": int((df["volume"] < 0).sum()),
        "jumps_over_50pct": int((ret > 0.50).sum()),  # có thể là thật — cần xem log, đừng xoá vội
    }


def build_clean(symbol: str, timeframe: str) -> pd.DataFrame:
    """M2 — sinh tầng `clean/` từ `raw/`.

    Khi làm: khử trùng lặp, sắp xếp, ĐÁNH DẤU lỗ hổng bằng một cột cờ.
    Tuyệt đối KHÔNG điền giá vào lỗ hổng ở đây — module sau tự quyết
    (điền bừa ở tầng này là cách tạo ra dữ liệu không tồn tại).
    """
    raise NotImplementedError("M2 — xem docs/03_MODULE_SPECS.md §M2")
