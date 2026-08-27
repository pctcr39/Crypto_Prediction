"""⚠️ LỖI THỜI — dùng close-to-close + cả-hai-intrabar.
Đặc tả đã chốt là Parkinson + stop-intrabar/TP-close.
Dùng barrier_surface_v2.py. File này giữ lại vì D/SYMS/signal được import từ đây."""

import pandas as pd, numpy as np, glob, itertools, sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))

COST = 0.30                      # % khu hoi giao ngay
SYMS = ["BTCUSDT","ETHUSDT","SOLUSDT","DOGEUSDT"]

def load(sym):
    fs=sorted(glob.glob(f"data/raw/ohlcv/symbol={sym}/timeframe=1d/**/*.parquet",recursive=True))
    if fs:
        d=pd.concat([pd.read_parquet(f) for f in fs]).sort_index(); return d[~d.index.duplicated()]
    fs=sorted(glob.glob(f"data/raw/ohlcv/symbol={sym}/timeframe=1h/**/*.parquet",recursive=True))
    d=pd.concat([pd.read_parquet(f) for f in fs]).sort_index(); d=d[~d.index.duplicated()]
    return pd.DataFrame({'open':d.open.resample('1D').first(),'high':d.high.resample('1D').max(),
                         'low':d.low.resample('1D').min(),'close':d.close.resample('1D').last()}).dropna()
D={s:load(s) for s in SYMS}

def signal(X, ef=50, es=150, dn=20):
    c=X.close; ema_f=c.ewm(span=ef,adjust=False).mean(); ema_s=c.ewm(span=es,adjust=False).mean()
    don=X.high.rolling(dn).max().shift(1)
    entry=(c>ema_s)&(c>don); exit_=(c<ema_f); pos=0; out=[]
    for i in range(len(c)):
        if pos==0 and entry.iloc[i]: pos=1
        elif pos==1 and exit_.iloc[i]: pos=0
        out.append(pos)
    return pd.Series(out,index=c.index)

def outcomes(X, sl, tp, tmax=60):
    """Vao tai OPEN nen t+1 (quy uoc cua repo). Soi intrabar high/low. SL uu tien."""
    lr=np.log(X.close).diff(); sg=lr.rolling(20).std().shift(1)
    s=signal(X); ent=s[s.diff()>0].index; idx=list(X.index); res=[]
    for t in ent:
        i=idx.index(t); v=sg.loc[t]
        if i+1>=len(idx) or not np.isfinite(v): continue
        e=X.open.iloc[i+1]; stop=e*(1-sl*v); targ=e*(1+tp*v)
        r=None
        for j in range(i+1, min(i+1+tmax, len(idx))):
            if X.low.iloc[j]<=stop: r=0; break
            if X.high.iloc[j]>=targ: r=1; break
        if r is None: r=0 if X.close.iloc[min(i+tmax,len(idx)-1)]<e else 1
        res.append((r, v))
    return res

SD_REF = 0.0300     # sigma tham chieu BTC 2021-26, de tinh c_R
print("═══ BE MAT THAM SO RAO CHAN — 4 cap, tin hieu 50/150/20, vao tai open[t+1] ═══")
print("   Duoi random walk khong troi: null = sl/(sl+tp) · hoa von = (1+c_R)/(tp/sl+1)")
print("   KHOANG CACH BAT BIEN: hoa von − null = c_R/(1+tp/sl)  ← luon DUONG\n")
print(f"{'stop':>5s} {'targ':>5s} {'payoff':>7s} | {'null RW':>8s} {'hoa von':>8s} {'k.cach':>7s} | {'n':>4s} {'DO DUOC':>8s} {'BIEN':>7s} | {'EV/lenh':>8s}")
rows=[]
for sl,tp in itertools.product([1.0,1.2,1.5,2.0],[3.0,4.0,4.8,6.0]):
    allr=[]
    for s in SYMS: allr += outcomes(D[s], sl, tp)
    if len(allr)<20: continue
    p=np.mean([r for r,_ in allr]); n=len(allr)
    payoff=tp/sl; c_R=COST/(sl*SD_REF*100)
    null=sl/(sl+tp); be=(1+c_R)/(payoff+1); gap=(be-null)*100
    ev=p*payoff-(1-p)*1.0-c_R
    rows.append(dict(sl=sl,tp=tp,payoff=payoff,null=null,be=be,p=p,n=n,margin=(p-be)*100,ev=ev))
    print(f"{sl:5.1f} {tp:5.1f} {payoff:6.2f}R | {null*100:7.1f}% {be*100:7.1f}% {gap:6.2f}pp | {n:4d} {p*100:7.1f}% {(p-be)*100:+6.1f} | {ev:+7.3f}R")
R=pd.DataFrame(rows)
print(f"\n   Bien: trung vi {R.margin.median():+.1f} diem · min {R.margin.min():+.1f} · max {R.margin.max():+.1f} · do lech {R.margin.std():.1f}")
print(f"   So o co bien DUONG: {(R.margin>0).sum()}/{len(R)}")
print(f"   O 1,2/4,0 (dang dung): bien {R[(R.sl==1.2)&(R.tp==4.0)].margin.iloc[0]:+.1f} diem")
print(f"   O 1,2/4,8 (phuong an b): bien {R[(R.sl==1.2)&(R.tp==4.8)].margin.iloc[0]:+.1f} diem")
