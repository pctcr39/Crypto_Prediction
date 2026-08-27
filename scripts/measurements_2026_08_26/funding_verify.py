import pandas as pd, numpy as np, glob
F={}; P={}
for p in sorted(glob.glob("data/raw/funding/symbol=*/data.parquet")):
    s=p.split("symbol=")[1].split("/")[0]; F[s]=pd.read_parquet(p)["funding_rate"]
for s in F:
    fs=sorted(glob.glob(f"data/raw/ohlcv/symbol={s}/timeframe=1d/**/*.parquet",recursive=True)) or \
       sorted(glob.glob(f"data/raw/ohlcv/symbol={s}/timeframe=1h/**/*.parquet",recursive=True))
    d=pd.concat([pd.read_parquet(f) for f in fs]).sort_index()
    P[s]=d[~d.index.duplicated()]["close"].resample("1D").last()

print("═══ KIEM CHUNG: dot funding am cua SOL 2022-2023 ═══\n")
x=F["SOLUSDT"]["2022-10-01":"2023-03-01"].resample("1D").mean()
print(f"{'thang':10s} {'funding TB %/8h':>16s} {'%/ngay':>9s} {'so ky am':>9s} {'gia SOL':>9s}")
for m,g in x.groupby(x.index.to_period("M")):
    raw=F["SOLUSDT"][str(m)]
    pr=P["SOLUSDT"][str(m)]
    print(f"{str(m):10s} {g.mean()*100:15.4f}% {g.mean()*3*100:8.4f}% {(raw<0).sum():5d}/{len(raw):3d} {pr.mean():8.1f}")
tot=F["SOLUSDT"]["2022-11-01":"2023-01-15"].sum()
print(f"\n   Tong funding SOL 01/11/2022 -> 15/01/2023 : {tot*100:+.2f}% notional")
print(f"   Vi the carry (ban khong vinh cuu) se PHAI TRA dung khoan do.")
print(f"   Gia SOL cung ky: {P['SOLUSDT']['2022-11-01']:.1f} -> {P['SOLUSDT']['2023-01-15']:.1f} USD")

print("\n\n═══ ★ BANG QUYET DINH: p_required THEO NHOM BIEN DONG ═══")
print("   Cong phi HOAT DONG hay TU TRIET TIEU? Tinh bang so that.\n")
for s in ["BTCUSDT","ETHUSDT"]:
    lr=np.log(P[s]).diff(); vol=lr.rolling(20).std()
    fd=F[s].resample("1D").mean()
    j=pd.concat([fd.rename("f"),vol.rename("v")],axis=1).dropna()
    q=pd.qcut(j.v,3,labels=["THAP","GIUA","CAO"])
    print(f"  ── {s} ──")
    print(f"  {'nhom vol':>9s} {'sigma ngay':>11s} {'funding %/ngay':>15s} | {'p* GIAO NGAY':>13s} {'p* VINH CUU':>12s} {'chenh':>7s}")
    for lab in ["THAP","GIUA","CAO"]:
        g=j[q==lab]; sd=g.v.mean(); f=g.f.mean()*3
        for H in [7]:
            A=sd*100*np.sqrt(2/np.pi)*np.sqrt(H)      # E|move| tren H ngay, %
            p_spot=50+0.30/(2*A)*100
            p_perp=50+(0.20+f*100*H)/(2*A)*100
            print(f"  {lab:>9s} {sd*100:10.2f}% {f*100:14.4f}% | {p_spot:12.1f}% {p_perp:11.1f}% {p_perp-p_spot:+6.1f}")
    print()
print("   (chan troi 7 ngay · E|move| = sigma·sqrt(2/pi)·sqrt(H) · phi giao ngay 0,30% / vinh cuu 0,20%)")
