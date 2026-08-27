import pandas as pd, numpy as np, glob
COST=0.0015
fs=sorted(glob.glob("data/raw/ohlcv/symbol=BTCUSDT/timeframe=1h/**/*.parquet",recursive=True))
h=pd.concat([pd.read_parquet(f) for f in fs]).sort_index(); h=h[~h.index.duplicated()]
D4=pd.DataFrame({'open':h.open.resample('4h').first(),'high':h.high.resample('4h').max(),
                 'low':h.low.resample('4h').min(),'close':h.close.resample('4h').last(),
                 'volume':h.volume.resample('4h').sum()}).dropna()
print(f"Du lieu: {len(D4)} nen 4 gio  {D4.index[0].date()} -> {D4.index[-1].date()}  ({len(D4)/6/365.25:.1f} nam)\n")
lr=np.log(D4.close).diff()

print("═══ 1 · CHAY CHINH PHUONG PHAP 4 O KHUNG 4 GIO ═══\n")
def run(X, ef, es, dn, cost):
    c=X['close']; ef_=c.ewm(span=ef,adjust=False).mean(); es_=c.ewm(span=es,adjust=False).mean()
    don=X['high'].rolling(dn).max().shift(1)
    entry=(c>es_)&(c>don); exit_=(c<ef_); pos=0; sig=[]
    for i in range(len(c)):
        if pos==0 and entry.iloc[i]: pos=1
        elif pos==1 and exit_.iloc[i]: pos=0
        sig.append(pos)
    sig=pd.Series(sig,index=c.index)
    oo=X['open'].shift(-1)/X['open']-1
    p=sig.shift(1).fillna(0); turn=(p-p.shift(1).fillna(0)).abs()
    return p,(p*oo).fillna(0)-turn*cost
yrs=len(D4)/6/365.25
print(f"{'tham so':>18s} {'so lenh':>8s} {'lenh/nam':>9s} {'phi/nam':>9s} {'Sharpe SAU phi':>15s} {'Sharpe TRUOC phi':>17s}")
rows=[]
for ef,es,dn in [(20,200,55),(50,150,20),(10,100,20),(50,200,100)]:
    p,r=run(D4,ef,es,dn,COST); _,r0=run(D4,ef,es,dn,0.0)
    n=int(((p-p.shift(1).fillna(0))>0).sum())
    sh=r.mean()/r.std()*np.sqrt(6*365.25); sh0=r0.mean()/r0.std()*np.sqrt(6*365.25)
    rows.append(sh)
    print(f"{f'{ef}/{es}/{dn}':>18s} {n:8d} {n/yrs:9.1f} {n/yrs*0.30:8.1f}% {sh:15.2f} {sh0:17.2f}")
oo=D4.open.shift(-1)/D4.open-1; b=oo.fillna(0).copy(); b.iloc[0]-=COST
print(f"{'mua-va-giu':>18s} {'1':>8s} {'':9s} {'0.3%':>9s} {b.mean()/b.std()*np.sqrt(6*365.25):15.2f}")
print(f"\n   Trung vi Sharpe sau phi cua 4 bo tham so: {np.median(rows):.2f}")

print("\n═══ 2 · KHUNG 4 GIO CO DU BAO DUOC HUONG KHONG? ═══\n")
for k in [1,2,3,6,12]:
    print(f"   Tu tuong quan loi suat 4h, do tre {k:2d} ({k*4:2d} gio): {lr.autocorr(k):+.4f}")
vr=[]
for q in [2,6,12,42]:
    v=(np.log(D4.close).diff(q).var()/q)/lr.var()
    vr.append(v); print(f"   Ti so phuong sai VR({q:2d}) = {v:.3f}   (=1 nghia la buoc ngau nhien)")
up=(lr>0).mean()
print(f"\n   Ti le nen tang (baseline always-up): {up*100:.2f}%")

print("\n═══ 3 · NGUONG THANG CAN o khung 4 gio — bang so THAT ═══\n")
em=lr.abs().mean()*100
print(f"   E|move| 4 gio do duoc            : {em:.3f}%")
for name,c_ in [("giao ngay 0,30%",0.30),("vinh cuu 0,20%",0.20),("vinh cuu + funding nen",0.20+0.03*(4/24))]:
    print(f"   Nguong thang can, {name:24s}: {50+c_/(2*em)*100:6.1f}%")
print(f"   Tran nang luc do duoc (09 §3.1)   : 51-53%")
print(f"   RULE 11 gia dinh ro ri tu         : 60%")

print("\n═══ 4 · ★ CAI GI DU BAO DUOC O KHUNG 4 GIO ═══\n")
# HAR-RV tren nen 4h: RV = bien do Parkinson gop 6 nen (1 ngay)
rv=np.log(D4.high/D4.low)**2/(4*np.log(2))
rvd=rv.rolling(6).mean()          # 1 ngay
def har_r2(y, X, split=0.5):
    d=pd.concat([y.rename('y')]+[x.rename(f'x{i}') for i,x in enumerate(X)],axis=1).dropna()
    n=int(len(d)*split); tr,te=d.iloc[:n],d.iloc[n:]
    A=np.c_[np.ones(len(tr)),tr.filter(like='x').values]
    beta=np.linalg.lstsq(A,tr.y.values,rcond=None)[0]
    B=np.c_[np.ones(len(te)),te.filter(like='x').values]
    pred=B@beta; e=te.y.values-pred
    return 1-(e**2).sum()/((te.y.values-te.y.values.mean())**2).sum()
y=np.log(rv.shift(-1).rolling(1).mean())           # log RV nen 4h TIEP THEO
X=[np.log(rvd), np.log(rv.rolling(30).mean()), np.log(rv.rolling(132).mean())]
print(f"   Du bao BIEN DONG nen 4 gio tiep theo (HAR 3 thang, OOS nua sau):")
print(f"      R2 = {har_r2(y,X):.3f}")
ydir=np.sign(lr.shift(-1))
Xd=[lr,lr.rolling(6).mean(),lr.rolling(42).mean()]
d=pd.concat([ydir.rename('y')]+[x.rename(f'x{i}') for i,x in enumerate(Xd)],axis=1).dropna()
n=int(len(d)*0.5); tr,te=d.iloc[:n],d.iloc[n:]
A=np.c_[np.ones(len(tr)),tr.filter(like='x').values]
beta=np.linalg.lstsq(A,tr.y.values,rcond=None)[0]
pred=np.sign(np.c_[np.ones(len(te)),te.filter(like='x').values]@beta)
print(f"\n   Du bao HUONG nen 4 gio tiep theo (cung 3 thang, OOS nua sau):")
print(f"      Ti le dung = {(pred==te.y.values).mean()*100:.2f}%   (always-up: {(te.y.values>0).mean()*100:.2f}%)")
