import pandas as pd, numpy as np, sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from pp4_data_needs import D, SYMS, run, COST

print("═══ 5 · TUONG QUAN KET CUC LENH — con so quyet dinh cho ti le thang ═══\n")
lr={s:np.log(D[s].close).diff() for s in SYMS}
sg={s:lr[s].rolling(20).std().shift(1) for s in SYMS}
trades={}
for s in SYMS:
    X=D[s]; p,_=run(X); idx=list(X.index)
    # ★ SUA 27/08: run() tra p = sig.shift(1) (DA dich). Lay entry tu p roi
    # vao tai open[i+1] => cham MOT ngay so voi quy uoc repo (vao tai open cua
    # nen KE TIEP nen sinh tin hieu). Dich nguoc lai de khop null.py/all27.py.
    sig_raw = p.shift(-1)
    ent=sig_raw[(sig_raw.diff()>0)].index; out=[]
    for t in ent:
        i=idx.index(t); v=sg[s].loc[t]
        if i+1>=len(idx) or not np.isfinite(v): continue
        e=X.open.iloc[i+1]; stop=e*(1-1.2*v); targ=e*(1+4.0*v); res=None
        for j in range(i+1,min(i+61,len(idx))):
            if X.low.iloc[j]<=stop: res=(idx[j],0); break
            if X.high.iloc[j]>=targ: res=(idx[j],1); break
        if res is None: res=(idx[min(i+60,len(idx)-1)], int(X.close.iloc[min(i+60,len(idx)-1)]>e))
        out.append((t,res[0],res[1]))
    trades[s]=pd.DataFrame(out,columns=['vao','ra','thang'])
    print(f"   {s:10s} {len(trades[s]):3d} lenh  ti le chot {trades[s].thang.mean()*100:5.1f}%")
allt=pd.concat([v.assign(sym=k) for k,v in trades.items()])
print(f"   {'TONG':10s} {len(allt):3d} lenh  ti le chot {allt.thang.mean()*100:5.1f}%  (nen do o doc 12: 23,7%)")

# tuong quan ket cuc giua cac lenh CHONG LAN thoi gian
pairs=[]
for a,b in [(x,y) for i,x in enumerate(SYMS) for y in SYMS[i+1:]]:
    for _,ta in trades[a].iterrows():
        ov=trades[b][(trades[b].vao<=ta.ra)&(trades[b].ra>=ta.vao)]
        for _,tb in ov.iterrows(): pairs.append((ta.thang,tb.thang))
if pairs:
    A=np.array(pairs)
    agree=(A[:,0]==A[:,1]).mean()
    p1,p2=A[:,0].mean(),A[:,1].mean()
    exp=p1*p2+(1-p1)*(1-p2)
    kappa=(agree-exp)/(1-exp)
    print(f"\n   {len(pairs)} cap lenh CHONG LAN thoi gian giua cac dong")
    print(f"   Ti le ket cuc GIONG NHAU : {agree*100:.1f}%  (ky vong neu doc lap: {exp*100:.1f}%)")
    print(f"   ★ Kappa (tuong quan ket cuc) = {kappa:.3f}")
    for n in [4,10,40]:
        print(f"      {n:2d} dong -> N hieu dung = {n/(1+(n-1)*max(kappa,0)):.2f}")

print("\n═══ 6 · SO NAM CAN — theo tung chi tieu, 40 dong ═══\n")
ne40_ret=40/(1+39*0.248); ne40_out=40/(1+39*max(kappa,0.01))
tr_yr=3.5
print(f"   N hieu dung 40 dong: loi suat {ne40_ret:.2f} · ket cuc lenh {ne40_out:.2f}")
print(f"\n   {'Chi tieu':34s} {'do lech 1 cua so':>17s} {'can':>8s} {'-> so nam':>10s}")
for name,sd,delta,src in [
    ("Ti so sut giam (nguong 0,60)", 0.18, 0.20, ne40_ret),
    ("Sharpe vuot mua-va-giu (0,30)", 0.41, 0.30, ne40_ret),
]:
    for W in [1,2,3,4,5]:
        sdW={1:{'Ti so sut giam (nguong 0,60)':0.23,'Sharpe vuot mua-va-giu (0,30)':1.24},
             2:{'Ti so sut giam (nguong 0,60)':0.20,'Sharpe vuot mua-va-giu (0,30)':0.69},
             3:{'Ti so sut giam (nguong 0,60)':0.18,'Sharpe vuot mua-va-giu (0,30)':0.41},
             4:{'Ti so sut giam (nguong 0,60)':0.18,'Sharpe vuot mua-va-giu (0,30)':0.41},
             5:{'Ti so sut giam (nguong 0,60)':0.17,'Sharpe vuot mua-va-giu (0,30)':0.40}}[W][name]
        se=sdW/np.sqrt(src)
        if se < delta/2:
            print(f"   {name:34s} {sdW:17.2f} {delta/2:8.3f} {W:8d} nam   (sai so {se:.3f})")
            break
    else:
        print(f"   {name:34s} {sdW:17.2f} {delta/2:8.3f}      >5 nam")

need=229
print(f"\n   {'Ti le thang lenh (can 229 lenh doc lap)':34s}")
print(f"      40 dong x {tr_yr} lenh/nam x N_hieu_dung {ne40_out:.2f}/40 = {tr_yr*ne40_out:.1f} lenh doc lap/nam")
print(f"      -> {need/(tr_yr*ne40_out):.0f} NAM")
