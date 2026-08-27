import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from trend import run, metrics, D, COST
import numpy as np, pandas as pd, itertools

grid=list(itertools.product([10,20,50],[100,150,200],[20,55,100]))
cut='2024-01-01'
A=D[D.index< cut]; B=D[D.index>=cut]
print(f"Doan 1: {A.index[0].date()} -> {A.index[-1].date()}  ({len(A)} ngay)")
print(f"Doan 2: {B.index[0].date()} -> {B.index[-1].date()}  ({len(B)} ngay)\n")

def bh(X):
    oo=X['open'].shift(-1)/X['open']-1; b=oo.fillna(0).copy(); b.iloc[0]-=COST
    return metrics(b,pd.Series(1.0,index=X.index))

res=[]
for ef,es,dn in grid:
    _,pA,rA=run(A,ef,es,dn); _,pB,rB=run(B,ef,es,dn)
    res.append(dict(ef=ef,es=es,dn=dn,shA=metrics(rA,pA)['sharpe'],shB=metrics(rB,pB)['sharpe'],
                    ddA=metrics(rA,pA)['maxdd'],ddB=metrics(rB,pB)['maxdd']))
R=pd.DataFrame(res)
print(f"{'Doan':<8s} {'mua&giu':>8s} {'o tot nhat':>11s} {'o trung vi':>11s} {'o te nhat':>10s} {'so o >0,8':>10s}")
print(f"{'1 (21-23)':<8s} {bh(A)['sharpe']:8.2f} {R.shA.max():11.2f} {R.shA.median():11.2f} {R.shA.min():10.2f} {(R.shA>0.8).sum():7d}/27")
print(f"{'2 (24-26)':<8s} {bh(B)['sharpe']:8.2f} {R.shB.max():11.2f} {R.shB.median():11.2f} {R.shB.min():10.2f} {(R.shB>0.8).sum():7d}/27")

print("\n★ PHEP THU THAT SU: chon o tot nhat tren Doan 1, chay tren Doan 2")
best=R.loc[R.shA.idxmax()]
print(f"   O tot nhat Doan 1 = ema({best.ef:.0f},{best.es:.0f}) donchian {best.dn:.0f}  ->  Sharpe {best.shA:.2f}")
print(f"   Chinh o do tren Doan 2                                 ->  Sharpe {best.shB:.2f}")
print(f"   Mua va giu Doan 2                                      ->  Sharpe {bh(B)['sharpe']:.2f}")
print(f"   Tuong quan hang giua hai doan: {R.shA.rank().corr(R.shB.rank()):+.2f}")
print("\n   Bo tham so doc 09 trich (ema20/200 + donchian 55):")
d=R[(R.ef==20)&(R.es==200)&(R.dn==55)].iloc[0]
print(f"   Doan 1 Sharpe {d.shA:.2f} | Doan 2 Sharpe {d.shB:.2f}")

print("\nCAT DUOI — gia tri that cua theo xu huong")
print(f"   maxDD mua va giu : Doan 1 {bh(A)['maxdd']*100:6.1f}% | Doan 2 {bh(B)['maxdd']*100:6.1f}%")
print(f"   maxDD trung vi luoi: Doan 1 {R.ddA.median()*100:6.1f}% | Doan 2 {R.ddB.median()*100:6.1f}%")
print(f"   maxDD te nhat luoi : Doan 1 {R.ddA.min()*100:6.1f}% | Doan 2 {R.ddB.min()*100:6.1f}%")
