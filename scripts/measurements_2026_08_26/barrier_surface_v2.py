"""Be mat tham so rao chan — DUNG DAC TA DA CHOT:
  · uoc luong Parkinson (B4)  · stop soi INTRABAR, TP soi tai CLOSE (B11c)
  · vao tai open[t+1] (B6)    · phi 0,30% khu hoi
Thay barrier_surface.py (do bang close-to-close + ca hai intrabar)."""
import pandas as pd, numpy as np, glob, itertools, sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from barrier_surface import D, SYMS, signal

COST, SD_REF, LN2 = 0.30, 0.0300, np.log(2)

def sigma_parkinson(X, w=20):
    return np.sqrt(((np.log(X.high/X.low)**2)/(4*LN2)).rolling(w).mean()).shift(1)

def outcomes(X, sl, tp, tmax=60):
    sg=sigma_parkinson(X); s=signal(X); idx=list(X.index); out=[]
    for t in s[s.diff()>0].index:
        i=idx.index(t); v=sg.loc[t]
        if i+1>=len(idx) or not np.isfinite(v): continue
        e=X.open.iloc[i+1]; R=sl*v; stop=e*(1-R); targ=e*(1+tp*v); done=False
        for j in range(i+1, min(i+1+tmax,len(idx))):
            if X.low.iloc[j]<=stop:  out.append(-1.0); done=True; break     # stop INTRABAR
            if X.close.iloc[j]>=targ: out.append((X.close.iloc[j]-e)/(e*R)); done=True; break  # TP tai CLOSE
        if not done:
            j=min(i+tmax,len(idx)-1); out.append((X.close.iloc[j]-e)/(e*R))
    return out

print("═══ BE MAT RAO CHAN v2 — Parkinson · stop intrabar / TP close · open[t+1] ═══\n")
print(f"{'stop':>5s} {'targ':>5s} {'payoff':>7s} | {'hoa von':>8s} | {'n':>4s} {'% thang':>8s} {'BIEN':>7s} {'R TB thang':>11s} {'EV sau phi':>11s}")
rows=[]
for sl,tp in itertools.product([1.0,1.2,1.5,2.0],[3.0,4.0,4.8,6.0]):
    r=[]
    for s in SYMS: r += outcomes(D[s], sl, tp)
    r=np.array(r); w=r>0
    payoff=tp/sl; c_R=COST/(sl*SD_REF*100); be=(1+c_R)/(payoff+1)
    ev=r.mean()-c_R
    rows.append(dict(sl=sl,tp=tp,margin=(w.mean()-be)*100,ev=ev))
    star=" ←" if (sl,tp)==(1.2,4.0) else ""
    print(f"{sl:5.1f} {tp:5.1f} {payoff:6.2f}R | {be*100:7.1f}% | {len(r):4d} {w.mean()*100:7.1f}% {(w.mean()-be)*100:+6.1f} {r[w].mean():10.2f}R {ev:+10.3f}R{star}")
R=pd.DataFrame(rows)
print(f"\n   Bien: trung vi {R.margin.median():+.1f} · min {R.margin.min():+.1f} · max {R.margin.max():+.1f} · do lech {R.margin.std():.1f}")
print(f"   So o bien DUONG: {(R.margin>0).sum()}/{len(R)}   ·   so o EV DUONG: {(R.ev>0).sum()}/{len(R)}")
o=R[(R.sl==1.2)&(R.tp==4.0)].iloc[0]
print(f"   O 1,2/4,0 (dang dung): bien {o.margin:+.1f} diem · EV {o.ev:+.3f}R")
print(f"\n   DOI CHIEU bang cu trong tai lieu (close-to-close + ca hai intrabar):")
print(f"      o 1,2/4,0 cho bien +8,7 diem  ->  nay {o.margin:+.1f} diem")
