import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from trend import run, D
import numpy as np, pandas as pd
rng=np.random.default_rng(42)
lr=np.log(D.close).diff(); sig_hat=lr.rolling(20).std().shift(1)
o,hi,lo=D['open'],D['high'],D['low']; idx=list(D.index)

def outcome(i,k=1.0,sl=1.2,tp=4.0,tmax=60):
    if i+1>=len(idx): return None
    sg=sig_hat.iloc[i]
    if not np.isfinite(sg): return None
    e=o.iloc[i+1]; stop=e*(1-sl*sg*np.sqrt(k)); targ=e*(1+tp*sg*np.sqrt(k))
    for j in range(i+1,min(i+1+tmax,len(idx))):
        if lo.iloc[j]<=stop: return 0
        if hi.iloc[j]>=targ: return 1
    return 0 if D.close.iloc[min(i+tmax,len(idx)-1)]<e else 1

s,_,_=run(D,50,150,20)
ent=[idx.index(t) for t in s[s.diff()>0].index]
real=[outcome(i) for i in ent]; real=[x for x in real if x is not None]
p_real=np.mean(real); n=len(real)
ci=1.96*np.sqrt(p_real*(1-p_real)/n)
print(f"TIN HIEU THAT : {sum(real)}/{n} = {p_real*100:.1f}%   khoang tin cay 95%: [{(p_real-ci)*100:.1f}% , {(p_real+ci)*100:.1f}%]")

valid=[i for i in range(len(idx)-61) if np.isfinite(sig_hat.iloc[i])]
allout=[outcome(i) for i in valid]
p_base=np.mean([x for x in allout if x is not None])
print(f"TI LE NEN     : moi ngay trong mau lam diem vao = {p_base*100:.1f}%   (n={len(valid)})")
print(f"NULL random walk khong troi                     = 23,1%")

boot=[]
for _ in range(20000):
    pick=rng.choice(valid,size=n,replace=False)
    boot.append(np.mean([allout[valid.index(i)] for i in pick]))
boot=np.array(boot)
pval=(boot>=p_real).mean()
print(f"\nHOAN VI (20.000 lan rut {n} diem vao ngau nhien):")
print(f"   trung binh nen {boot.mean()*100:.1f}%  |  phan vi 95 {np.percentile(boot,95)*100:.1f}%")
print(f"   p-value cua tin hieu that = {pval:.3f}  ->  {'CO Y NGHIA' if pval<0.05 else 'KHONG CO Y NGHIA THONG KE'}")
print(f"\n   Bien tin hieu so voi nen: {(p_real-p_base)*100:+.1f} diem")
print(f"   Hoa von can (payoff 4:1, phi 0,1R): 22,0%  ->  ca hai deu vuot")
