import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from trend import run, metrics, D, COST
import numpy as np, pandas as pd, itertools
GRID=list(itertools.product([10,20,50],[100,150,200],[20,55,100]))
def ens(X):
    ps=[]
    for ef,es,dn in GRID:
        _,p,_=run(X,ef,es,dn); ps.append(p)
    P=pd.concat(ps,axis=1).mean(axis=1)          # ti trong = ti le o dang MUA
    oo=X['open'].shift(-1)/X['open']-1
    turn=(P-P.shift(1).fillna(0)).abs()
    return P,(P*oo).fillna(0)-turn*COST
def bh(X):
    oo=X['open'].shift(-1)/X['open']-1; b=oo.fillna(0).copy(); b.iloc[0]-=COST
    return metrics(b,pd.Series(1.0,index=X.index))
segs=[('TOAN BO 2021-2026',D),('Doan 1 2021-23',D[D.index<'2024-01-01']),('Doan 2 2024-26',D[D.index>='2024-01-01'])]
print(f"{'Doan':<20s} {'mua&giu Sh':>11s} {'o trung vi':>11s} {'o tot nhat':>11s} {'TO HOP 27 o':>12s} | {'DD mua&giu':>11s} {'DD to hop':>10s} {'ti so DD':>9s}")
for name,X in segs:
    P,r=ens(X); m=metrics(r,P); b=bh(X)
    sh=[]; dd=[]
    for ef,es,dn in GRID:
        _,p,rr=run(X,ef,es,dn); mm=metrics(rr,p); sh.append(mm['sharpe']); dd.append(mm['maxdd'])
    print(f"{name:<20s} {b['sharpe']:11.2f} {np.median(sh):11.2f} {max(sh):11.2f} {m['sharpe']:12.2f} | {b['maxdd']*100:10.1f}% {m['maxdd']*100:9.1f}% {m['maxdd']/b['maxdd']:9.2f}")
P,r=ens(D); m=metrics(r,P)
print(f"\n  To hop toan mau: CAGR {m['cagr']*100:.1f}%  |  phoi bay TB {P.mean()*100:.1f}%  |  so lan doi ti trong/nam {((P-P.shift(1)).abs()>0.001).sum()/(len(D)/365.25):.0f}")
print(f"  Do lech chuan cua Sharpe giua 27 o: {np.std(sh):.2f}  ->  chon MOT o la rut mot mau tu phan phoi nay")
