"""Tai lich su funding rate tu Binance USDT-M (public API, khong can khoa).

Ghi vao data/raw/funding/symbol=<SYM>/data.parquet
"""
from __future__ import annotations
import time, pathlib, sys
import pandas as pd, ccxt

SYMS = ["BTC/USDT:USDT", "ETH/USDT:USDT", "SOL/USDT:USDT", "DOGE/USDT:USDT"]
OUT  = pathlib.Path("data/raw/funding")

def fetch_all(ex, sym):
    since = ex.parse8601("2019-09-01T00:00:00Z"); rows=[]
    while True:
        b = ex.fetch_funding_rate_history(sym, since=since, limit=1000)
        if not b: break
        rows += b
        nxt = b[-1]["timestamp"] + 1
        if nxt <= since or len(b) < 1000: break
        since = nxt
        time.sleep(ex.rateLimit/1000)
    d = pd.DataFrame([{"ts": pd.to_datetime(r["timestamp"], unit="ms", utc=True),
                       "funding_rate": float(r["fundingRate"])} for r in rows])
    return d.drop_duplicates("ts").set_index("ts").sort_index()

if __name__ == "__main__":
    ex = ccxt.binanceusdm({"enableRateLimit": True})
    for s in SYMS:
        d = fetch_all(ex, s)
        base = s.split("/")[0]
        p = OUT / f"symbol={base}USDT"; p.mkdir(parents=True, exist_ok=True)
        d.to_parquet(p/"data.parquet")
        print(f"{base:6s} {len(d):6d} ky  {d.index[0].date()} -> {d.index[-1].date()}  "
              f"trung binh {d.funding_rate.mean()*100:.4f}%/8h")
