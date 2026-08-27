import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from trend import run, D
import numpy as np, pandas as pd, itertools
rng=np.random.default_rng(7)
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
valid=[i for i in range(len(idx)-61) if np.isfinite(sig_hat.iloc[i])]
allout={i:outcome(i) for i in valid}
base=np.mean([v for v in allout.values() if v is not None])
pool=np.array([allout[i] for i in valid])

rows=[]
for ef,es,dn in itertools.product([10,20,50],[100,150,200],[20,55,100]):
    s,_,_=run(D,ef,es,dn)
    ent=[idx.index(t) for t in s[s.diff()>0].index]
    res=[allout.get(i) for i in ent]; res=[x for x in res if x is not None]
    if len(res)<5: continue
    n=len(res); p=np.mean(res)
    boot=np.array([pool[rng.choice(len(pool),n,replace=False)].mean() for _ in range(4000)])
    rows.append(dict(ef=ef,es=es,dn=dn,n=n,win=p,pval=(boot>=p).mean()))
R=pd.DataFrame(rows).sort_values('pval')
print(f"TI LE NEN KHOP CUA SO = {base*100:.1f}%   ·   hoa von payoff 4:1 = 22,0%\n")
print(f"{'ema_nhanh':>9s} {'ema_cham':>8s} {'donchian':>8s} {'so lenh':>7s} {'ti le chot':>10s} {'p-value':>8s}")
for _,r in R.iterrows():
    print(f"{r.ef:9.0f} {r.es:8.0f} {r.dn:8.0f} {r.n:7.0f} {r.win*100:9.1f}% {r.pval:8.3f}")
print(f"\n  Trung vi ti le chot tren 27 o : {R.win.median()*100:.1f}%  (nen {base*100:.1f}%)")
print(f"  So o co p < 0,05              : {(R.pval<0.05).sum()}/{len(R)}")
# Benjamini-Hochberg q=0,10
ps=np.sort(R.pval.values); m=len(ps); k=np.arange(1,m+1)
thr=ps<=(k/m*0.10); ncut=thr.sum() if thr.any() else 0
print(f"  Sau Benjamini-Hochberg q=0,10 : {ncut}/{m} o song sot")
print(f"  Trung binh so lenh moi o      : {R.n.mean():.1f}  (5,6 nam, MOT dong)")
