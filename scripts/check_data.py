#!/usr/bin/env python
"""Liệt kê dữ liệu đang có trên đĩa. Chạy: make check-data"""

import sys

import pandas as pd

from cryptopred.data import store
from cryptopred.logging_setup import setup_logging


def main() -> int:
    setup_logging("WARNING")
    pd.set_option("display.width", 140)

    for layer in ("raw", "clean"):
        df = store.available(layer)
        print(f"\n── tầng {layer}/ ─────────────────────────────────")
        if df.empty:
            print("  (trống)")
        else:
            print(df.to_string(index=False))

    if store.available("raw").empty:
        print("\nChưa có gì. Bắt đầu bằng:  make download SYM=BTCUSDT TF=1h")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
