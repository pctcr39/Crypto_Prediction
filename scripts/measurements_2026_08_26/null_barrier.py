"""B17 — dung NULL DUNG cho khung rao chan, thay cho con so giai tich 1,2/5,2.

Gia tri 23,1% = sl/(sl+tp) chi dung cho chuyen dong Brown:
  · khong troi  · GIAM SAT LIEN TUC ca hai rao  · KHONG co han thoi gian
Thiet ke that khac ca ba:
  · buoc NGAY roi rac  · stop soi INTRABAR (low), target soi tai CLOSE  · han 60 ngay
=> Phai MO PHONG, va mo phong phai co seed + so duong + mo hinh sinh.
"""
import numpy as np, pandas as pd, glob, sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))

SEED, N_PATHS, SUB = 20260827, 200_000, 24     # 24 buoc/ngay -> sinh high/low trong ngay

def simulate_null(sigma_d, sl=1.2, tp=6.0, tmax=60, drift=0.0,   # tp: ADR-017
                  conv="stop_low_tp_close", seed=SEED, n=N_PATHS):
    """GBM khong troi, buoc gio, gop thanh nen ngay. Tra ti le CHAM TARGET."""
    rng = np.random.default_rng(seed)
    s_h = sigma_d / np.sqrt(SUB)                      # do lech chuan moi buoc gio
    logstop, logtarg = np.log1p(-sl*sigma_d), np.log1p(tp*sigma_d)
    hit = np.zeros(n, dtype=np.int8); done = np.zeros(n, dtype=bool)
    cum = np.zeros(n)
    for d in range(tmax):
        step = rng.normal(drift/SUB, s_h, size=(n, SUB))
        path = cum[:, None] + np.cumsum(step, axis=1)
        day_low  = np.minimum(path.min(axis=1), cum)
        day_close = path[:, -1]
        alive = ~done
        # stop soi INTRABAR (low), uu tien khi cung nen
        st = alive & (day_low <= logstop)
        hit[st] = 0; done[st] = True
        alive = ~done
        if conv == "stop_low_tp_close":
            tg = alive & (day_close >= logtarg)
        else:                                          # ca hai intrabar
            day_high = np.maximum(path.max(axis=1), cum)
            tg = alive & (day_high >= logtarg)
        hit[tg] = 1; done[tg] = True
        cum = day_close
        if done.all(): break
    # het han: tinh theo dau loi suat thuc nhan
    hit[~done] = (cum[~done] > 0).astype(np.int8)
    return hit.mean(), (~done).mean()

print(f"═══ NULL MO PHONG — seed {SEED}, {N_PATHS:,} duong, {SUB} buoc/ngay ═══\n")
print(f"   Gia tri GIAI TICH (Brown, giam sat lien tuc, khong han): sl/(sl+tp) = {1.2/7.2*100:.2f}%\n")
print(f"{'Quy uoc':26s} {'sigma ngay':>11s} {'null mo phong':>14s} {'% het han':>10s}")
for conv,lab in [("ca_hai_intrabar","cả hai intrabar"),("stop_low_tp_close","stop low / TP close")]:
    for sd in [0.0243, 0.0300, 0.0400]:
        p, exp = simulate_null(sd, conv=conv)
        print(f"{lab:26s} {sd*100:10.2f}% {p*100:13.2f}% {exp*100:9.2f}%")
    print()

print("   ── ON DINH THEO SEED (quy uoc van hanh, sigma 3,00%) ──")
vals=[simulate_null(0.0300, seed=SEED+k)[0] for k in range(5)]
print(f"      5 seed: {' · '.join(f'{v*100:.2f}%' for v in vals)}   do lech {np.std(vals)*100:.3f} diem")

print("\n\n═══ DOI CHIEU TI LE NEN THUC NGHIEM (cung quy uoc van hanh) ═══\n")
from barrier_surface import D, SYMS
def base_rate(X, sl=1.2, tp=6.0, tmax=60):
    o,hi,lo,c = X.open,X.high,X.low,X.close
    var=(np.log(hi/lo)**2)/(4*np.log(2))                  # Parkinson (B4)
    sg=np.sqrt(var.rolling(20).mean()).shift(1)
    idx=list(X.index); out=[]
    for i in range(len(idx)-tmax-1):
        v=sg.iloc[i]
        if not np.isfinite(v): continue
        e=o.iloc[i+1]; stop=e*(1-sl*v); targ=e*(1+tp*v); r=None
        for j in range(i+1, i+1+tmax):
            if lo.iloc[j]<=stop: r=0; break
            if c.iloc[j]>=targ: r=1; break
        out.append(r if r is not None else int(c.iloc[i+tmax]>e))
    return np.mean(out), len(out)
tot=[]
for s in SYMS:
    b,n = base_rate(D[s]); tot.append((b,n))
    print(f"   {s:10s} ti le nen = {b*100:5.2f}%   (n = {n:,})")
w=sum(b*n for b,n in tot)/sum(n for _,n in tot)
print(f"   {'GOP':10s} ti le nen = {w*100:5.2f}%   (n = {sum(n for _,n in tot):,})")
p_null,_ = simulate_null(0.0300)
print(f"\n   Null mo phong (khong troi)  : {p_null*100:.2f}%")
print(f"   Ti le nen thuc nghiem       : {w*100:.2f}%   chenh {(w-p_null)*100:+.2f} diem  <- phan TROI DUONG cua crypto")
