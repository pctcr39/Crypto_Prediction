import pandas as pd, glob, numpy as np
def daily():
    fs=sorted(glob.glob('data/raw/ohlcv/symbol=BTCUSDT/timeframe=1h/**/*.parquet',recursive=True))
    d=pd.concat([pd.read_parquet(f) for f in fs]).sort_index()
    d=d[~d.index.duplicated(keep='first')]
    D=pd.DataFrame({
        'open':d['open'].resample('1D').first(),
        'high':d['high'].resample('1D').max(),
        'low' :d['low' ].resample('1D').min(),
        'close':d['close'].resample('1D').last(),
        'volume':d['volume'].resample('1D').sum(),
    }).dropna()
    return D
