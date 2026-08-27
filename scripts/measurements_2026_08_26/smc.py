import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from trend import run, D
import numpy as np, pandas as pd
rng=np.random.default_rng(11)
c,h,l,o=D.close,D.high,D.low,D.open
lr=np.log(c).diff(); sg=lr.rolling(20).std().shift(1)

# ══ PHUONG PHAP 5 · phep thu 1: FAIR VALUE GAP co "phai duoc lap" khong? ══
# FVG tang: low[t] > high[t-2]  (khoang trong giua nen t-2 va t)
print("═══ PHUONG PHAP 5 · FAIR VALUE GAP — ti le lap so voi TI LE NEN ═══\n")
fvg_up = (l > h.shift(2))
gap_lo = h.shift(2); gap_hi = l
print(f"So Fair Value Gap tang tim duoc: {int(fvg_up.sum())} tren {len(D)} nen ({fvg_up.mean()*100:.1f}%)")
for W in [5,10,20,60]:
    filled=[]
    idx=np.where(fvg_up.values)[0]
    for i in idx:
        if i+W>=len(D): continue
        filled.append(1 if l.iloc[i+1:i+1+W].min() <= gap_lo.iloc[i] else 0)
    # TI LE NEN: mot muc gia bat ky cach duoi close dung bang do rong gap, co bi cham trong W ngay khong
    base=[]
    for i in idx:
        if i+W>=len(D): continue
        depth=(c.iloc[i]-gap_lo.iloc[i])/c.iloc[i]
        j=rng.integers(25,len(D)-W-1)
        lvl=c.iloc[j]*(1-depth)
        base.append(1 if l.iloc[j+1:j+1+W].min()<=lvl else 0)
    print(f"  cua so {W:2d} ngay:  FVG duoc lap {np.mean(filled)*100:5.1f}%  |  ti le nen (muc bat ky cung do sau) {np.mean(base)*100:5.1f}%  |  chenh {(np.mean(filled)-np.mean(base))*100:+5.1f} diem")

# ══ PHUONG PHAP 5 · phep thu 2: QUET ROI LAY LAI ══
print("\n═══ PHUONG PHAP 5 · QUET ROI LAY LAI (sweep-and-reclaim) ═══\n")
for N in [10,20]:
    prev_low=l.rolling(N).min().shift(1)
    sweep=(l<prev_low*0.999)&(c>prev_low)
    fwd=(c.shift(-5)/c-1)
    a=fwd[sweep.fillna(False)].dropna(); b=fwd.dropna()
    n=len(a); 
    boot=np.array([b.sample(n,replace=False,random_state=int(x)).mean() for x in rng.integers(0,1e6,3000)])
    p=(boot>=a.mean()).mean()
    print(f"  N={N:2d}:  {n:3d} lan  |  loi suat 5 ngay sau: tin hieu {a.mean()*100:+5.2f}%  nen {b.mean()*100:+5.2f}%  |  chenh {(a.mean()-b.mean())*100:+5.2f} diem  |  p={p:.3f}")

# ══ PHUONG PHAP 5 · phep thu 3: SO TRON ══
print("\n═══ PHUONG PHAP 5 · SO TRON (Osler) — gia co bi hut/day quanh moc 10.000 khong? ═══\n")
step=10000
dist=((c%step)/step)  # vi tri trong khoang 10k
fwd=(c.shift(-3)/c-1)
for lo_,hi_,name in [(0.00,0.05,'ngay DUOI moc tron'),(0.95,1.00,'ngay TREN moc tron'),(0.45,0.55,'giua khoang')]:
    m=(dist>=lo_)&(dist<hi_)
    a=fwd[m].dropna()
    print(f"  {name:22s}: n={len(a):4d}  loi suat 3 ngay sau {a.mean()*100:+5.2f}%  (nen {fwd.dropna().mean()*100:+5.2f}%)")
