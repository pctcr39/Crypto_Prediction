import pandas as pd, numpy as np, pathlib, glob
F={}
for p in sorted(glob.glob("data/raw/funding/symbol=*/data.parquet")):
    s=p.split("symbol=")[1].split("/")[0]; F[s]=pd.read_parquet(p)["funding_rate"]

print("═══ 1 · PHAN PHOI FUNDING — 0,01% co phai 'san mac dinh' khong? ═══\n")
print(f"{'Cap':10s} {'so ky':>7s} {'TB %/8h':>9s} {'trung vi':>9s} {'= 0,0100%':>10s} {'>0,05%':>8s} {'< 0':>8s} {'p95':>9s} {'p99':>9s}")
for s,x in F.items():
    at_floor=(np.abs(x-0.0001)<1e-9).mean()
    print(f"{s:10s} {len(x):7d} {x.mean()*100:8.4f}% {x.median()*100:8.4f}% {at_floor*100:9.1f}% {(x>0.0005).mean()*100:7.1f}% {(x<0).mean()*100:7.1f}% {x.quantile(.95)*100:8.4f}% {x.quantile(.99)*100:8.4f}%")

print("\n═══ 2 · QUY DOI SANG %/NGAY va %/NAM ═══\n")
print(f"{'Cap':10s} {'TB %/ngay':>10s} {'TB %/nam':>9s} {'trung vi %/ngay':>16s} {'trung vi %/nam':>15s}")
for s,x in F.items():
    print(f"{s:10s} {x.mean()*3*100:9.4f}% {x.mean()*3*365*100:8.1f}% {x.median()*3*100:15.4f}% {x.median()*3*365*100:14.1f}%")

print("\n═══ 3 · ★ FUNDING CO DU BAO DUOC KHONG? (kiem dinh khang dinh §4.4 cua doc 12) ═══\n")
print(f"{'Cap':10s} {'AC(1)':>7s} {'AC(3)':>7s} {'AC(21)':>7s} {'AC(90)':>7s} | {'OOS R2 (EWMA)':>14s} {'OOS R2 (bay gio)':>16s}")
for s,x in F.items():
    d=x.resample('1D').mean().dropna()          # gop ve ngay
    ac=[d.autocorr(l) for l in (1,3,21,90)]
    # OOS: du bao funding TB 7 ngay toi tu du lieu qua khu — chia doi thoi gian
    y=d.rolling(7).mean().shift(-7).dropna()    # muc tieu: TB 7 ngay TOI
    ew=d.ewm(halflife=7).mean()                 # du bao: EWMA qua khu (dich 1)
    naive=d                                      # du bao: gia tri hom nay
    idx=y.index.intersection(ew.index)
    n=len(idx); cut=idx[n//2]
    oos=idx[idx>=cut]
    def r2(pred):
        e=y[oos]-pred[oos]; return 1-(e**2).sum()/((y[oos]-y[oos].mean())**2).sum()
    print(f"{s:10s} {ac[0]:7.3f} {ac[1]:7.3f} {ac[2]:7.3f} {ac[3]:7.3f} | {r2(ew.shift(1)):13.3f} {r2(naive.shift(1)):15.3f}")
print("\n   (muc tieu = funding trung binh 7 ngay TOI · du bao chi dung du lieu qua khu · nua sau mau)")
print("   Doi chieu: R2 du bao HUONG gia = 0,00-0,01 · du bao BIEN DONG = 0,4-0,6")
