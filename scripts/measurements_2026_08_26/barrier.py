import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from trend import run, D, COST
import numpy as np, pandas as pd

# sigma uoc luong tai close ngay t, DICH 1 (RULE 2)
lr=np.log(D.close).diff()
sig_hat=lr.rolling(20).std().shift(1)

def barriers(D, ef, es, dn, k, sl_mult=1.2, tp_mult=4.0, tmax=60):
    s,_,_=run(D,ef,es,dn)
    entries=s[(s.diff()>0)].index
    out=[]
    o=D['open']; hi=D['high']; lo=D['low']
    idx=list(D.index)
    for t in entries:
        i=idx.index(t)
        if i+1>=len(idx): continue
        sg=sig_hat.loc[t]
        if not np.isfinite(sg): continue
        e=o.iloc[i+1]
        stop=e*(1-sl_mult*sg*np.sqrt(k)); targ=e*(1+tp_mult*sg*np.sqrt(k))
        res=None
        for j in range(i+1, min(i+1+tmax, len(idx))):
            if lo.iloc[j]<=stop: res=('STOP',(stop/e-1),j-i); break
            if hi.iloc[j]>=targ: res=('TARGET',(targ/e-1),j-i); break
        if res is None:
            j=min(i+tmax,len(idx)-1); res=('HET_HAN',(D.close.iloc[j]/e-1),j-i)
        out.append(res)
    return pd.DataFrame(out,columns=['ket_cuc','loi_suat','so_ngay'])

print("KHUNG RAO CHAN 1,2σ̂ / 4,0σ̂ — do tren tin hieu that, chan troi thoi gian 60 ngay")
print("Null random walk: P(cham chot loi truoc) = 1,2/5,2 = 23,1%\n")
print(f"{'k (thang σ)':>12s} {'stop %':>7s} {'chot %':>7s} | {'CHOT':>5s} {'STOP':>5s} {'HET HAN':>8s} | {'ti le chot':>10s} {'ky vong/lenh':>13s} {'ngay TB':>8s}")
for k,name in [(1,'σ̂ ngay'),(7,'σ̂ tuan'),(12.5,'σ̂ ~12 ngay'),(35,'σ̂ 35 ngay')]:
    B=barriers(D,50,150,20,k)
    if len(B)==0: continue
    n=len(B); ct=(B.ket_cuc=='TARGET').sum(); cs=(B.ket_cuc=='STOP').sum(); ch=(B.ket_cuc=='HET_HAN').sum()
    sg=sig_hat.median()
    print(f"{name:>12s} {1.2*sg*np.sqrt(k)*100:6.1f}% {4.0*sg*np.sqrt(k)*100:6.1f}% | {ct:5d} {cs:5d} {ch:8d} | {ct/n*100:9.1f}% {(B.loi_suat.mean()-0.003)*100:12.2f}% {B.so_ngay.mean():8.1f}")
print(f"\n  Tong so su kien vao lenh: {len(barriers(D,50,150,20,1))}  (5,6 nam, MOT dong)")

print("\n★ KIEM DINH GIA THUYET BA THAM SO MAU THUAN")
print("  Duoi random walk, thoi gian ky vong cham mot trong hai rao = 1,2k · 4,0k = 4,8k ngay")
for k in [1,7,12.5,35]:
    print(f"    k={k:5.1f}  ->  thoi gian ky vong {4.8*k:6.1f} ngay  vs chan troi 60 ngay  ->  {'RAO GIA CHI PHOI' if 4.8*k<60*0.5 else ('CAN BANG' if 4.8*k<60*1.5 else 'HET HAN CHI PHOI')}")
