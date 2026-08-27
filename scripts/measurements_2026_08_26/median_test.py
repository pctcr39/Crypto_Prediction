import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from trend import run, D
import numpy as np, pandas as pd, itertools
rng=np.random.default_rng(3)
lr=np.log(D.close).diff(); sig_hat=lr.rolling(20).std().shift(1)
o,hi,lo=D['open'],D['high'],D['low']; idx=list(D.index)
def outcome(i,sl=1.2,tp=4.0,tmax=60):
    if i+1>=len(idx) or not np.isfinite(sig_hat.iloc[i]): return None
    sg=sig_hat.iloc[i]; e=o.iloc[i+1]
    stop=e*(1-sl*sg); targ=e*(1+tp*sg)
    for j in range(i+1,min(i+1+tmax,len(idx))):
        if lo.iloc[j]<=stop: return 0
        if hi.iloc[j]>=targ: return 1
    return 0 if D.close.iloc[min(i+tmax,len(idx)-1)]<e else 1
valid=[i for i in range(len(idx)-61) if np.isfinite(sig_hat.iloc[i])]
allout={i:outcome(i) for i in valid}
GRID=list(itertools.product([10,20,50],[100,150,200],[20,55,100]))
ent_by_cell=[]
for ef,es,dn in GRID:
    s,_,_=run(D,ef,es,dn)
    ent_by_cell.append([idx.index(t) for t in s[s.diff()>0].index])
obs=np.median([np.mean([allout[i] for i in e if allout.get(i) is not None]) for e in ent_by_cell])
print("★ PHEP THU DUNG: mot gia thuyet duy nhat, thong ke = TI LE CHOT CUA O TRUNG VI")
print("   (thay vi 27 phep thu rieng le roi hieu chinh da kiem dinh — 27 bien the cua CUNG mot quy tac")
print("    tuong quan cao, ap Benjamini-Hochberg len chung la dung sai cong cu)\n")
null=[]
pool=np.array(valid)
for _ in range(3000):
    sh=rng.permutation(pool)
    mp=[]
    for e in ent_by_cell:
        n=len([i for i in e if allout.get(i) is not None])
        if n==0: continue
        pick=sh[:n]
        mp.append(np.mean([allout[i] for i in pick if allout.get(i) is not None]))
    null.append(np.median(mp))
null=np.array(null)
print(f"   Ti le chot o trung vi (do duoc) : {obs*100:.1f}%")
print(f"   Phan phoi null (3.000 hoan vi)  : trung binh {null.mean()*100:.1f}%  phan vi 95 {np.percentile(null,95)*100:.1f}%")
print(f"   p-value                         : {(null>=obs).mean():.4f}")
print(f"   Hoa von payoff 4:1              : 22,0%")
print(f"   Bien so voi hoa von             : {(obs-0.22)*100:+.1f} diem")
