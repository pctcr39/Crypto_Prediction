"""B4 — chon uoc luong RV bang phep do, khong bang tranh luan.
Tieu chi: du bao BIEN DONG TUONG LAI tot nhat (do la viec cua sigma_hat).
Muc tieu chuan vang: RV that tinh tu nen 1 GIO (chi co cho BTC)."""
import pandas as pd, numpy as np, glob

fs=sorted(glob.glob("data/raw/ohlcv/symbol=BTCUSDT/timeframe=1h/**/*.parquet",recursive=True))
h=pd.concat([pd.read_parquet(f) for f in fs]).sort_index(); h=h[~h.index.duplicated()]
D=pd.DataFrame({'open':h.open.resample('1D').first(),'high':h.high.resample('1D').max(),
                'low':h.low.resample('1D').min(),'close':h.close.resample('1D').last()}).dropna()
# ── MUC TIEU: RV that tu 24 nen 1h (chuan vang) ──
lr1h=np.log(h.close).diff()
rv_true=(lr1h**2).resample('1D').sum().reindex(D.index).dropna()
D=D.loc[rv_true.index]
print(f"BTC: {len(D)} ngay, RV that tu nen 1h — {D.index[0].date()} -> {D.index[-1].date()}\n")

lr=np.log(D.close).diff()
o,hi,lo,c = D.open, D.high, D.low, D.close
EST = {
 "close-to-close":  lr**2,
 "Parkinson":       (np.log(hi/lo)**2)/(4*np.log(2)),
 "Garman-Klass":    0.5*np.log(hi/lo)**2 - (2*np.log(2)-1)*np.log(c/o)**2,
 "Rogers-Satchell": np.log(hi/c)*np.log(hi/o) + np.log(lo/c)*np.log(lo/o),
}

def har_oos(x, y, split=0.5):
    """HAR ba thang tren log(x) -> du bao log(y) ngay ke tiep. OOS nua sau."""
    lx=np.log(x.clip(lower=1e-10))
    X=pd.concat([lx.rolling(1).mean(), lx.rolling(5).mean(), lx.rolling(22).mean()],axis=1)
    d=pd.concat([np.log(y.clip(lower=1e-10)).shift(-1).rename('y'), X],axis=1).dropna()
    n=int(len(d)*split); tr,te=d.iloc[:n],d.iloc[n:]
    A=np.c_[np.ones(len(tr)), tr.iloc[:,1:].values]
    b=np.linalg.lstsq(A,tr.y.values,rcond=None)[0]
    pred=np.c_[np.ones(len(te)), te.iloc[:,1:].values]@b
    e=te.y.values-pred
    r2=1-(e**2).sum()/((te.y.values-te.y.values.mean())**2).sum()
    # QLIKE tren thang phuong sai (Patton 2011): y/f - ln(y/f) - 1
    yv=np.exp(te.y.values); fv=np.exp(pred); q=(yv/fv - np.log(yv/fv) - 1).mean()
    return r2, q

print("═══ DU BAO RV THAT NGAY KE TIEP — HAR ba thang, OOS nua sau ═══\n")
print(f"{'Uoc luong dung lam DAU VAO':22s} {'OOS R2 (log)':>13s} {'QLIKE':>9s} {'sigma TB %/ngay':>16s}")
res={}
for k,v in EST.items():
    r2,q = har_oos(v, rv_true)
    res[k]=(r2,q)
    print(f"{k:22s} {r2:12.3f} {q:9.4f} {np.sqrt(v.clip(lower=0).mean())*100:15.2f}%")
print(f"\n   Doi chieu EWMA(lam=0,94) tren close-to-close:")
ew=(lr**2).ewm(alpha=1-0.94).mean()
d=pd.concat([np.log(rv_true.clip(lower=1e-10)).shift(-1).rename('y'), np.log(ew.clip(lower=1e-10)).rename('x')],axis=1).dropna()
n=int(len(d)*0.5); te=d.iloc[n:]
e=te.y.values-te.x.values
print(f"      OOS R2 = {1-(e**2).sum()/((te.y-te.y.mean())**2).sum():.3f}  (du bao truc tiep, khong hieu chinh)")

print("\n═══ HE QUA: thang σ̂ neu doi uoc luong ═══\n")
print(f"{'Uoc luong':22s} {'sigma TB %/ngay':>16s} {'so voi close-to-close':>22s}")
base=np.sqrt((lr**2).mean())
for k,v in EST.items():
    m=np.sqrt(v.clip(lower=0).mean())
    print(f"{k:22s} {m*100:15.2f}% {m/base:21.3f}x")
print("\n   => Doi uoc luong doi CA DO RONG RAO CHAN (stop 1,2σ̂) va CA NGUONG p*.")
print("      Moi hang so da do (0/23 het han · 6,3 ngay · 29,2% chot loi) do bang close-to-close.")

print("\n\n═══ ★ CHAN TROI DU BAO: sigma_hat dung cho rao giu ~5-6 NGAY, khong phai 1 ngay ═══\n")
def har_h(x, y, H, split=0.5):
    lx=np.log(x.clip(lower=1e-10))
    X=pd.concat([lx.rolling(1).mean(), lx.rolling(5).mean(), lx.rolling(22).mean()],axis=1)
    tgt=np.log(y.clip(lower=1e-10).rolling(H).mean().shift(-H))     # TB RV H ngay TOI
    d=pd.concat([tgt.rename('y'), X],axis=1).dropna()
    n=int(len(d)*split); tr,te=d.iloc[:n],d.iloc[n:]
    A=np.c_[np.ones(len(tr)), tr.iloc[:,1:].values]
    b=np.linalg.lstsq(A,tr.y.values,rcond=None)[0]
    pred=np.c_[np.ones(len(te)), te.iloc[:,1:].values]@b
    e=te.y.values-pred
    r2=1-(e**2).sum()/((te.y.values-te.y.values.mean())**2).sum()
    yv,fv=np.exp(te.y.values),np.exp(pred)
    return r2, (yv/fv-np.log(yv/fv)-1).mean()

print(f"{'Chan troi muc tieu':22s} " + " ".join(f"{k:>17s}" for k in EST))
for H in [1,3,5,10,22]:
    row=[]
    for k,v in EST.items():
        r2,q=har_h(v, rv_true, H); row.append(f"R2 {r2:.3f} Q {q:.3f}")
    print(f"TB RV {H:2d} ngay toi     " + " ".join(f"{x:>17s}" for x in row))

print("\n   Nguong cong L2 hien tai (PREDICTION_DESIGN §8.4): OOS R2 log-RV >= 0,30")
best_h5,_=har_h(EST["Parkinson"], rv_true, 5)
best_h1,_=har_h(EST["Parkinson"], rv_true, 1)
print(f"   Parkinson, muc tieu 1 ngay  : R2 = {best_h1:.3f}  ->  {'DAT' if best_h1>=0.30 else 'TRUOT'}")
print(f"   Parkinson, muc tieu 5 ngay  : R2 = {best_h5:.3f}  ->  {'DAT' if best_h5>=0.30 else 'TRUOT'}")
print(f"\n   Doi chieu nguon doc 09: 0,512 tren 700k nen 5m (du bao RV thang 5 PHUT)")
print(f"                           0,33-0,34 o che do vol thap 2023-2026")

print("\n\n═══ ★ CONG L2 DUNG: so TUONG DOI voi EWMA, khong phai nguong tuyet doi ═══\n")
def qlike_of(pred_var, y, split=0.5):
    d=pd.concat([y.rename('y'), pred_var.rename('f')],axis=1).dropna()
    d=d[(d.y>0)&(d.f>0)]; n=int(len(d)*split); te=d.iloc[n:]
    return (te.y/te.f - np.log(te.y/te.f) - 1).mean(), len(te)

for H in [1,5]:
    tgt = rv_true.rolling(H).mean().shift(-H)
    ew  = (lr**2).ewm(alpha=1-0.94).mean()
    q_ew,_ = qlike_of(ew, tgt)
    # HAR-Parkinson: du bao ra thang phuong sai
    lx=np.log(EST["Parkinson"].clip(lower=1e-10))
    X=pd.concat([lx.rolling(1).mean(), lx.rolling(5).mean(), lx.rolling(22).mean()],axis=1)
    d=pd.concat([np.log(tgt.clip(lower=1e-10)).rename('y'), X],axis=1).dropna()
    n=int(len(d)*0.5); tr,te=d.iloc[:n],d.iloc[n:]
    A=np.c_[np.ones(len(tr)),tr.iloc[:,1:].values]; b=np.linalg.lstsq(A,tr.y.values,rcond=None)[0]
    fv=pd.Series(np.exp(np.c_[np.ones(len(te)),te.iloc[:,1:].values]@b), index=te.index)
    q_har,nn = qlike_of(fv, tgt, split=0.0)
    print(f"   Chan troi {H} ngay:  QLIKE EWMA(0,94) = {q_ew:.4f}   HAR-Parkinson = {q_har:.4f}   "
          f"cai thien {(1-q_har/q_ew)*100:+.1f}%   {'DAT' if q_har < q_ew*0.95 else 'TRUOT'} (can >=5%)")

print("\n\n═══ HE QUA CUA VIEC DOI SANG PARKINSON — cac hang so da do co doi khong? ═══\n")
import sys; sys.path.insert(0,'scripts/measurements_2026_08_26')
from barrier_surface import D as DD, SYMS, signal
def outcomes_est(X, est, sl=1.2, tp=4.0, tmax=60):
    o,hi,lo,c=X.open,X.high,X.low,X.close
    if est=="close-to-close": var=np.log(c).diff()**2
    else: var=(np.log(hi/lo)**2)/(4*np.log(2))
    sg=np.sqrt(var.rolling(20).mean()).shift(1)
    s=signal(X); idx=list(X.index); out=[]
    for t in s[s.diff()>0].index:
        i=idx.index(t); v=sg.loc[t]
        if i+1>=len(idx) or not np.isfinite(v): continue
        e=X.open.iloc[i+1]; R=sl*v; stop=e*(1-R); targ=e*(1+tp*v); done=False
        for j in range(i+1,min(i+1+tmax,len(idx))):
            if X.low.iloc[j]<=stop: out.append((-1.0, j-i, "stop")); done=True; break
            if X.close.iloc[j]>=targ: out.append(((X.close.iloc[j]-e)/(e*R), j-i, "target")); done=True; break
        if not done:
            j=min(i+tmax,len(idx)-1); out.append(((X.close.iloc[j]-e)/(e*R), j-i, "hethan"))
    return out
print(f"{'Uoc luong':18s} {'n':>4s} {'% thang':>8s} {'R TB thang':>11s} {'EV':>8s} {'ngay TB':>8s} {'% het han':>10s} {'stop TB %':>10s}")
for est in ["close-to-close","Parkinson"]:
    allr=[]
    for s in SYMS: allr += outcomes_est(DD[s], est)
    r=np.array([x[0] for x in allr]); nd=np.mean([x[1] for x in allr])
    exp_pct=np.mean([x[2]=="hethan" for x in allr])*100
    w=r>0; c_R=0.30/(1.2*3.00)
    print(f"{est:18s} {len(r):4d} {w.mean()*100:7.1f}% {r[w].mean():10.2f}R {r.mean()-c_R:+7.3f}R {nd:7.1f} {exp_pct:9.1f}% {'—':>10s}")
