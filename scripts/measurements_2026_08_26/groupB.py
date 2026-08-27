"""Do bang chung cho Nhom B: B1 (so dong bang) va B11 (canh stop)."""
import pandas as pd, numpy as np, glob, sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from barrier_surface import D, SYMS, signal, COST

ABS = 0.685
def p_req(sd, H=1.0, cost=0.30):
    return 0.5 + cost/(2*sd*ABS*np.sqrt(H)*100)

print("═══ B1 · CONG PHI DONG BAO LAU? (p_required > 0,60) ═══")
print("   p_req > 0,60 <=> e_move < 1,5% <=> sigma_ngay < 2,19%\n")
print(f"{'Cap':10s} {'so ngay':>8s} {'% dong cong':>12s} {'chuoi dai nhat':>15s} {'p_req trung vi':>15s}")
for s in SYMS:
    lr=np.log(D[s].close).diff(); sd=lr.rolling(30).std().shift(1)
    pr=sd.dropna().map(lambda x: p_req(x))
    closed=(pr>0.60)
    run=best=0
    for v in closed.values:
        run=run+1 if v else 0; best=max(best,run)
    print(f"{s:10s} {len(pr):8d} {closed.mean()*100:11.1f}% {best:12d} ngay {pr.median():14.3f}")

print("\n   => Trong suot cac doan nay, thiet ke hien tai KHONG soi rao, KHONG dong LIFO,")
print("      KHONG cuong che deadline. So khuyen nghi — 'bang chung duy nhat' — dung yen.")

print("\n\n═══ B11 · GIA CUA VIEC KHONG DAT LENH STOP TREO ═══")
print("   So sanh hai quy uoc thoat khi gia xuyen stop:")
print("     (a) lenh stop treo tren san  -> thoat DUNG tai muc stop = 1,00R")
print("     (b) nguoi dung kiem moi ngay -> thoat tai CLOSE cua nen xuyen stop\n")
rows=[]
for s in SYMS:
    X=D[s]; lr=np.log(X.close).diff(); sg=lr.rolling(20).std().shift(1)
    sig=signal(X); idx=list(X.index)
    for t in sig[sig.diff()>0].index:
        i=idx.index(t); v=sg.loc[t]
        if i+1>=len(idx) or not np.isfinite(v): continue
        e=X.open.iloc[i+1]; R=1.2*v; stop=e*(1-R); targ=e*(1+4.0*v)
        for j in range(i+1, min(i+61,len(idx))):
            if X.low.iloc[j]<=stop:
                loss_close=(e-X.close.iloc[j])/(e*R)      # lo thuc nhan, don vi R
                rows.append(dict(sym=s, loss_R=loss_close)); break
            if X.high.iloc[j]>=targ: break
B=pd.DataFrame(rows)
print(f"{'Cap':10s} {'so lenh stop':>13s} {'lo TB (R)':>11s} {'trung vi':>9s} {'p90':>7s} {'max':>7s} {'% > 1,4R':>9s}")
for s in SYMS:
    g=B[B.sym==s]
    print(f"{s:10s} {len(g):13d} {g.loss_R.mean():10.2f}R {g.loss_R.median():8.2f}R {g.loss_R.quantile(.9):6.2f}R {g.loss_R.max():6.2f}R {(g.loss_R>1.4).mean()*100:8.1f}%")
print(f"{'TONG':10s} {len(B):13d} {B.loss_R.mean():10.2f}R {B.loss_R.median():8.2f}R {B.loss_R.quantile(.9):6.2f}R {B.loss_R.max():6.2f}R {(B.loss_R>1.4).mean()*100:8.1f}%")

p_win, payoff, c_R = 0.337, 4.0/1.2, 0.30/(1.2*3.00)
print(f"\n   KY VONG voi lo thuc nhan trung binh cua quy uoc (b) = {B.loss_R.mean():.2f}R:")
ev_a = p_win*payoff - (1-p_win)*1.00 - c_R
ev_b = p_win*payoff - (1-p_win)*B.loss_R.mean() - c_R
print(f"      (a) stop treo, lo 1,00R : EV = {ev_a:+.3f}R")
print(f"      (b) kiem moi ngay        : EV = {ev_b:+.3f}R    ({(ev_b/ev_a-1)*100:+.0f}%)")
print(f"      Hoa von o {(p_win*payoff-c_R)/(1-p_win):.2f}R  =>  quy uoc (b) {'VUOT' if B.loss_R.mean()>(p_win*payoff-c_R)/(1-p_win) else 'con trong'} nguong")

print("\n\n═══ B11(c) · QUY UOC RAO BAT DOI XUNG — stop INTRABAR, TP tai CLOSE ═══")
print("   Nguon 17 §2.4: stop la lenh treo (bao ve, khan) => intrabar")
print("                  TP kiem tai close (khong cat upside tren wick)\n")
def outcomes_conv(X, conv, sl=1.2, tp=4.0, tmax=60):
    lr=np.log(X.close).diff(); sg=lr.rolling(20).std().shift(1)
    s=signal(X); idx=list(X.index); res=[]
    for t in s[s.diff()>0].index:
        i=idx.index(t); v=sg.loc[t]
        if i+1>=len(idx) or not np.isfinite(v): continue
        e=X.open.iloc[i+1]; stop=e*(1-sl*v); targ=e*(1+tp*v); r=None; nd=0
        for j in range(i+1, min(i+1+tmax, len(idx))):
            nd=j-i
            if X.low.iloc[j]<=stop: r=0; break
            hit_tp = (X.high.iloc[j]>=targ) if conv=="ca hai intrabar" else (X.close.iloc[j]>=targ)
            if hit_tp: r=1; break
        if r is None: r=0 if X.close.iloc[min(i+tmax,len(idx)-1)]<e else 1
        res.append((r,nd))
    return res

payoff=4.0/1.2; c_R=0.30/(1.2*3.00); be=(1+c_R)/(payoff+1)
print(f"{'Quy uoc':26s} {'n':>4s} {'ti le chot':>11s} {'hoa von':>9s} {'bien':>7s} {'ngay TB':>9s}")
for conv in ["ca hai intrabar","stop intrabar/TP close"]:
    allr=[]
    for s in SYMS: allr += outcomes_conv(D[s], conv)
    p=np.mean([r for r,_ in allr]); nd=np.mean([d for _,d in allr])
    print(f"{conv:26s} {len(allr):4d} {p*100:10.1f}% {be*100:8.1f}% {(p-be)*100:+6.1f} {nd:8.1f}")
print(f"\n   Null random walk: ca hai intrabar = {1.2/5.2*100:.1f}%")
print("   (Quy uoc TP-tai-close lam null THAP hon — target kho cham hon)")

print("\n\n═══ B11(c) · SO SANH DUNG: R THUC NHAN, khong phai ti le thang nhi phan ═══")
print("   c1: stop treo + LIMIT treo tai target  -> ca hai intrabar, thoat DUNG 3,33R")
print("   c2: stop treo, TP kiem tai close       -> thang co the CHAY XA hon 3,33R\n")
def realized(X, conv, sl=1.2, tp=4.0, tmax=60):
    lr=np.log(X.close).diff(); sg=lr.rolling(20).std().shift(1)
    s=signal(X); idx=list(X.index); out=[]
    for t in s[s.diff()>0].index:
        i=idx.index(t); v=sg.loc[t]
        if i+1>=len(idx) or not np.isfinite(v): continue
        e=X.open.iloc[i+1]; R=sl*v; stop=e*(1-R); targ=e*(1+tp*v); done=False
        for j in range(i+1, min(i+1+tmax, len(idx))):
            if X.low.iloc[j]<=stop:
                out.append(-1.0); done=True; break                  # thoat dung tai stop
            if conv=="c1" and X.high.iloc[j]>=targ:
                out.append(tp/sl); done=True; break                 # thoat dung tai target
            if conv=="c2" and X.close.iloc[j]>=targ:
                out.append((X.close.iloc[j]-e)/(e*R)); done=True; break   # thoat tai close >= target
        if not done:
            j=min(i+tmax,len(idx)-1); out.append((X.close.iloc[j]-e)/(e*R))
    return out

c_R=0.30/(1.2*3.00)
print(f"{'Quy uoc':8s} {'n':>4s} {'% thang':>8s} {'R TB thang':>11s} {'R TB thua':>10s} {'EV/lenh':>9s} {'EV sau phi':>11s}")
for conv,lab in [("c1","c1"),("c2","c2")]:
    r=[]
    for s in SYMS: r += realized(D[s], conv)
    r=np.array(r); w=r>0
    ev=r.mean()
    print(f"{lab:8s} {len(r):4d} {w.mean()*100:7.1f}% {r[w].mean():10.2f}R {r[~w].mean():9.2f}R {ev:+8.3f}R {ev-c_R:+10.3f}R")
print("\n   (thua = -1,0R dung theo cau tao vi stop la lenh treo; het han thi tinh R thuc)")
