import pandas as pd, numpy as np, glob
F={}; P={}
for p in sorted(glob.glob("data/raw/funding/symbol=*/data.parquet")):
    s=p.split("symbol=")[1].split("/")[0]; F[s]=pd.read_parquet(p)["funding_rate"]
for s in F:
    fs=sorted(glob.glob(f"data/raw/ohlcv/symbol={s}/timeframe=1d/**/*.parquet",recursive=True))
    if fs:
        d=pd.concat([pd.read_parquet(f) for f in fs]).sort_index()
        P[s]=d[~d.index.duplicated()]["close"]
    else:  # BTC chi co 1h -> gop
        fs=sorted(glob.glob(f"data/raw/ohlcv/symbol={s}/timeframe=1h/**/*.parquet",recursive=True))
        d=pd.concat([pd.read_parquet(f) for f in fs]).sort_index()
        P[s]=d[~d.index.duplicated()]["close"].resample("1D").last()

print("═══ 4 · ★ CANH BAO §4.5 — funding co TANG cung voi bien dong khong? ═══")
print("   (neu CO: cong phi tren hop dong vinh cuu tu triet tieu)\n")
print(f"{'Cap':10s} {'tuong quan f ~ vol':>19s} | {'nhom vol THAP':>14s} {'nhom vol GIUA':>14s} {'nhom vol CAO':>13s}")
for s in sorted(F):
    fd=F[s].resample("1D").mean()
    vol=np.log(P[s]).diff().rolling(20).std()
    j=pd.concat([fd.rename("f"),vol.rename("v")],axis=1).dropna()
    q=pd.qcut(j.v,3,labels=["thap","giua","cao"])
    g=j.groupby(q,observed=True)["f"].mean()*3*100
    print(f"{s:10s} {j.f.corr(j.v):19.3f} | {g['thap']:13.4f}% {g['giua']:13.4f}% {g['cao']:12.4f}%")
print("   (don vi ba cot cuoi: %/ngay)")

print("\n═══ 5 · TAI LAP doc 09 §2 — sau cuc tri funding, gia di TIEP hay DAO? ═══\n")
print(f"{'Cap':10s} {'nguong':>8s} {'n':>5s} {'loi suat 7 ngay sau':>20s} {'nen':>8s} {'chenh':>8s} {'ti le tang':>11s}")
for s in sorted(F):
    fd=F[s].resample("1D").mean()
    r7=(P[s].shift(-7)/P[s]-1)
    j=pd.concat([fd.rename("f"),r7.rename("r")],axis=1).dropna()
    for lab,thr in [("p95",j.f.quantile(.95)),("p99",j.f.quantile(.99))]:
        m=j[j.f>=thr]
        print(f"{s if lab=='p95' else '':10s} {lab:>8s} {len(m):5d} {m.r.mean()*100:19.2f}% {j.r.mean()*100:7.2f}% {(m.r.mean()-j.r.mean())*100:+7.2f}% {(m.r>0).mean()*100:10.1f}%")

print("\n═══ 6 · KINH TE HOC CARRY THAT — mo phong mua giao ngay + ban khong vinh cuu ═══")
print("   Chi phi vao 0,15% + ra 0,15%. Thu funding moi 8 gio. Khong tinh basis.\n")
print(f"{'Cap':10s} giu 30 ngay")
print(f"{'Cap':10s} {'H=30 TB':>9s} {'H=30 p10':>9s} {'H=30 p90':>9s} {'% ky LO':>9s} | {'H=90 TB':>9s} {'% ky LO':>9s} | {'hoa von TB':>11s}")
for s in sorted(F):
    x=F[s]; cum=x.cumsum()
    for H,store in [(30,{}),(90,{})]:
        pass
    out={}
    for H in (30,90):
        k=H*3
        net=(cum.shift(-k)-cum)-0.003     # tong funding tru 0,30% phi khu hoi
        net=net.dropna()
        out[H]=(net.mean()*100, net.quantile(.10)*100, net.quantile(.90)*100, (net<0).mean()*100)
    # hoa von: bao nhieu ngay de tong funding vuot 0,30%
    bes=[]
    v=x.values
    for i in range(0,len(v)-900,30):
        c=np.cumsum(v[i:i+900])
        w=np.where(c>=0.003)[0]
        bes.append(w[0]/3 if len(w) else np.nan)
    print(f"{s:10s} {out[30][0]:8.3f}% {out[30][1]:8.3f}% {out[30][2]:8.3f}% {out[30][3]:8.1f}% | {out[90][0]:8.3f}% {out[90][3]:8.1f}% | {np.nanmedian(bes):8.1f} ngay")

print("\n═══ 7 · RUI RO THAT — cac dot funding AM co co cum khong? ═══\n")
print(f"{'Cap':10s} {'chuoi am dai nhat':>18s} {'sut giam sau nhat cua chuoi funding':>37s} {'nam xay ra':>12s}")
for s in sorted(F):
    x=F[s]; c=x.cumsum(); dd=(c-c.cummax())
    neg=(x<0).astype(int); run=0; best=0
    for v_ in neg.values:
        run=run+1 if v_ else 0; best=max(best,run)
    print(f"{s:10s} {best/3:14.1f} ngay {dd.min()*100:34.3f}% {str(dd.idxmin().date()):>12s}")
