import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from load import daily
import numpy as np, pandas as pd, itertools

D=daily()
COST=0.0015   # 0,15% moi chieu = 0,30% khu hoi

def run(D, ef, es, dn, cost=COST):
    c=D['close']
    ema_f=c.ewm(span=ef,adjust=False).mean()
    ema_s=c.ewm(span=es,adjust=False).mean()
    don  =D['high'].rolling(dn).max().shift(1)      # KHONG gom nen t
    # tin hieu tinh tai close ngay t
    entry=(c>ema_s)&(c>don)
    exit_ =(c<ema_f)
    sig=np.zeros(len(c)); pos=0
    for i in range(len(c)):
        if pos==0 and entry.iloc[i]: pos=1
        elif pos==1 and exit_.iloc[i]: pos=0
        sig[i]=pos
    sig=pd.Series(sig,index=c.index)
    # khop tai OPEN ngay t+1: vi the trong ngay t do tin hieu ngay t-1 quyet dinh
    oo=D['open'].shift(-1)/D['open']-1              # loi suat giu tu open[t] -> open[t+1]
    p=sig.shift(1).fillna(0)
    turn=(p-p.shift(1).fillna(0)).abs()
    ret=(p*oo).fillna(0)-turn*cost
    return sig,p,ret

def metrics(ret,p):
    n=len(ret); yrs=n/365.25
    eq=(1+ret).cumprod()
    sh=ret.mean()/ret.std()*np.sqrt(365.25) if ret.std()>0 else 0
    dd=(eq/eq.cummax()-1).min()
    trades=int(((p-p.shift(1).fillna(0))>0).sum())
    return dict(sharpe=sh, cagr=(eq.iloc[-1]**(1/yrs)-1), maxdd=dd,
                trades_yr=trades/yrs, exposure=p.mean(), final=eq.iloc[-1])

# ---- moc so sanh: mua va giu (co phi vao mot lan) ----
oo=D['open'].shift(-1)/D['open']-1
bh=oo.fillna(0).copy(); bh.iloc[0]-=COST
m=metrics(bh,pd.Series(1.0,index=D.index))
print("MUA VA GIU (buy & hold):")
print(f"  Sharpe {m['sharpe']:.2f} | CAGR {m['cagr']*100:6.1f}% | maxDD {m['maxdd']*100:6.1f}% | x{m['final']:.2f}\n")

grid=list(itertools.product([10,20,50],[100,150,200],[20,55,100]))
rows=[]
for ef,es,dn in grid:
    sig,p,ret=run(D,ef,es,dn)
    mm=metrics(ret,p); mm.update(ef=ef,es=es,dn=dn); rows.append(mm)
R=pd.DataFrame(rows)
print("LUOI 27 O — TOAN BO BE MAT (2021-01 -> 2026-08, phi 0,30% khu hoi)")
print(f"{'ema_nhanh':>9s} {'ema_cham':>8s} {'donchian':>8s} {'Sharpe':>7s} {'CAGR':>8s} {'maxDD':>8s} {'lenh/nam':>9s} {'phoi bay':>9s}")
for _,r in R.sort_values('sharpe',ascending=False).iterrows():
    print(f"{r.ef:9.0f} {r.es:8.0f} {r.dn:8.0f} {r.sharpe:7.2f} {r.cagr*100:7.1f}% {r.maxdd*100:7.1f}% {r.trades_yr:9.1f} {r.exposure*100:8.1f}%")
print()
print(f"  O TOT NHAT : Sharpe {R.sharpe.max():.2f}")
print(f"  O TRUNG VI : Sharpe {R.sharpe.median():.2f}   <-- NGUONG PHAI DUNG")
print(f"  O TE NHAT  : Sharpe {R.sharpe.min():.2f}")
print(f"  So o vuot mua-va-giu ({m['sharpe']:.2f}): {(R.sharpe>m['sharpe']).sum()}/27")
print(f"  So o vuot nguong 0,8 : {(R.sharpe>0.8).sum()}/27")
R.to_csv(str(__import__('pathlib').Path(__file__).parent/'grid.csv'),index=False)
