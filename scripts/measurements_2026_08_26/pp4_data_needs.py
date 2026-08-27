import pandas as pd, numpy as np, glob, itertools
COST=0.0015
def load(sym):
    fs=sorted(glob.glob(f"data/raw/ohlcv/symbol={sym}/timeframe=1d/**/*.parquet",recursive=True))
    if fs:
        d=pd.concat([pd.read_parquet(f) for f in fs]).sort_index(); return d[~d.index.duplicated()]
    fs=sorted(glob.glob(f"data/raw/ohlcv/symbol={sym}/timeframe=1h/**/*.parquet",recursive=True))
    d=pd.concat([pd.read_parquet(f) for f in fs]).sort_index(); d=d[~d.index.duplicated()]
    return pd.DataFrame({'open':d.open.resample('1D').first(),'high':d.high.resample('1D').max(),
                         'low':d.low.resample('1D').min(),'close':d.close.resample('1D').last()}).dropna()
SYMS=["BTCUSDT","ETHUSDT","SOLUSDT","DOGEUSDT"]
D={s:load(s) for s in SYMS}
for s in SYMS: print(f"{s:10s} {len(D[s]):5d} nen  {D[s].index[0].date()} -> {D[s].index[-1].date()}")

def run(X, ef=50, es=150, dn=20):
    c=X['close']; ema_f=c.ewm(span=ef,adjust=False).mean(); ema_s=c.ewm(span=es,adjust=False).mean()
    don=X['high'].rolling(dn).max().shift(1)
    entry=(c>ema_s)&(c>don); exit_=(c<ema_f)
    pos=0; sig=[]
    for i in range(len(c)):
        if pos==0 and entry.iloc[i]: pos=1
        elif pos==1 and exit_.iloc[i]: pos=0
        sig.append(pos)
    sig=pd.Series(sig,index=c.index)
    oo=X['open'].shift(-1)/X['open']-1
    p=sig.shift(1).fillna(0); turn=(p-p.shift(1).fillna(0)).abs()
    return p,(p*oo).fillna(0)-turn*COST

R={s:run(D[s])[1] for s in SYMS}; P={s:run(D[s])[0] for s in SYMS}

print("\n═══ 1 · ★ TUONG QUAN THAT giua cac dong — thay vi gia dinh rho=0,9 ═══\n")
M=pd.DataFrame(R).dropna()
print("  (a) Tuong quan LOI SUAT CHIEN LUOC hang ngay:")
Cs=M.corr(); print(Cs.round(3).to_string())
off=[Cs.iloc[i,j] for i in range(4) for j in range(i+1,4)]
rho_ret=np.mean(off); print(f"\n      rho trung binh = {rho_ret:.3f}")

print("\n  (b) Tuong quan TRANG THAI VI THE (cung mua hay khong):")
Cp=pd.DataFrame(P).dropna().corr()
offp=[Cp.iloc[i,j] for i in range(4) for j in range(i+1,4)]
print(f"      rho trung binh = {np.mean(offp):.3f}")

for lab,rho in [("loi suat",rho_ret),("trang thai vi the",np.mean(offp))]:
    for n in [4,10,40]:
        ne=n/(1+(n-1)*rho)
        print(f"      {lab:18s}: {n:2d} dong -> N hieu dung = {ne:.2f}")

print("\n═══ 2 · SO LENH THAT — nguon cung quan sat moi nam ═══\n")
tot=0
print(f"{'Cap':10s} {'so nam':>7s} {'so lenh':>8s} {'lenh/nam':>9s}")
for s in SYMS:
    p=P[s]; n=int(((p-p.shift(1).fillna(0))>0).sum()); yrs=len(p)/365.25
    tot+=n; print(f"{s:10s} {yrs:7.1f} {n:8d} {n/yrs:9.1f}")
yrs_btc=len(P['BTCUSDT'])/365.25
print(f"{'TONG':10s} {'':7s} {tot:8d}")
ne=4/(1+3*rho_ret)
print(f"\n   4 dong tuong quan {rho_ret:.2f} -> {ne:.2f} dong doc lap")
print(f"   Nguon cung quan sat DOC LAP: {tot/ (len(M)/365.25) * (ne/4):.1f} lenh/nam")
