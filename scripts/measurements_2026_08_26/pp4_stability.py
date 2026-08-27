import pandas as pd, numpy as np, glob, sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from pp4_data_needs import D, R, P, SYMS, run, COST

def metrics(ret,p,X):
    if ret.std()==0 or len(ret)<60: return None
    eq=(1+ret).cumprod(); sh=ret.mean()/ret.std()*np.sqrt(365.25)
    dd=(eq/eq.cummax()-1).min()
    oo=X['open'].shift(-1)/X['open']-1; b=oo.fillna(0).copy(); b.iloc[0]-=COST
    eqb=(1+b).cumprod(); ddb=(eqb/eqb.cummax()-1).min()
    shb=b.mean()/b.std()*np.sqrt(365.25)
    n=int(((p-p.shift(1).fillna(0))>0).sum())
    return dict(sharpe=sh, dd_ratio=dd/ddb if ddb<0 else np.nan,
                sharpe_excess=sh-shb, trades=n)

print("═══ 3 · ★ DUONG ON DINH — chi tieu nao NGUNG DAO DONG som nhat? ═══")
print("   Cua so truot moi do dai, do DO PHAN TAN cua tung chi tieu\n")
WINS=[182,365,547,730,1095,1460]     # 0,5 / 1 / 1,5 / 2 / 3 / 4 nam
rows=[]
for W in WINS:
    vals={'sharpe':[], 'dd_ratio':[], 'sharpe_excess':[], 'trades':[]}
    for s in SYMS:
        X=D[s]
        for st in range(0, len(X)-W, 60):
            sub=X.iloc[st:st+W]
            p,r=run(sub); m=metrics(r,p,sub)
            if m and not np.isnan(m['dd_ratio']):
                for k in vals: vals[k].append(m[k])
    rows.append(dict(W=W, n=len(vals['sharpe']),
        sh_sd=np.std(vals['sharpe']), sh_iqr=np.subtract(*np.percentile(vals['sharpe'],[75,25])),
        dd_sd=np.std(vals['dd_ratio']), dd_iqr=np.subtract(*np.percentile(vals['dd_ratio'],[75,25])),
        dd_med=np.median(vals['dd_ratio']), sh_med=np.median(vals['sharpe']),
        ex_sd=np.std(vals['sharpe_excess']), tr_med=np.median(vals['trades'])))
T=pd.DataFrame(rows)
print(f"{'cua so':>10s} {'so mau':>7s} {'lenh TB':>8s} | {'SHARPE: trung vi':>17s} {'do lech':>8s} {'IQR':>7s} | {'TI SO SUT GIAM: trung vi':>25s} {'do lech':>8s} {'IQR':>7s}")
for _,r in T.iterrows():
    print(f"{r.W/365.25:8.1f}n {r.n:7.0f} {r.tr_med:8.0f} | {r.sh_med:17.2f} {r.sh_sd:8.2f} {r.sh_iqr:7.2f} | {r.dd_med:25.2f} {r.dd_sd:8.2f} {r.dd_iqr:7.2f}")

print("\n   ── DOC: do lech cang nho, chi tieu cang 'da hoi tu' ──")
print(f"   Sharpe        : do lech {T.sh_sd.iloc[0]:.2f} (0,5n) -> {T.sh_sd.iloc[-1]:.2f} (4n)   giam {(1-T.sh_sd.iloc[-1]/T.sh_sd.iloc[0])*100:.0f}%")
print(f"   Ti so sut giam: do lech {T.dd_sd.iloc[0]:.2f} (0,5n) -> {T.dd_sd.iloc[-1]:.2f} (4n)   giam {(1-T.dd_sd.iloc[-1]/T.dd_sd.iloc[0])*100:.0f}%")

print("\n═══ 4 · BAO NHIEU NAM DE PHAN BIET DUOC MOT KHAC BIET CO Y NGHIA? ═══\n")
print("   Quy tac: can do lech cua uoc luong < 1/2 khac biet muon phat hien\n")
for name,sd_col,med_col,delta,unit in [
    ("Sharpe vs mua-va-giu", 'ex_sd', 'sh_med', 0.30, "Sharpe"),
    ("Ti so sut giam vs nguong 0,60", 'dd_sd', 'dd_med', 0.20, "ti so")]:
    print(f"   ── {name} (muon phat hien khac biet {delta} {unit}) ──")
    for _,r in T.iterrows():
        se_1=r[sd_col]                      # do lech tren MOT cua so
        for ncoin,ne in [(4,2.29),(10,3.09),(40,3.74)]:
            se=se_1/np.sqrt(ne)
            if ncoin==40:
                ok="DAT" if se < delta/2 else "chua"
                print(f"      {r.W/365.25:.1f} nam x 40 dong -> sai so chuan {se:.3f}  (can < {delta/2:.3f})  {ok}")
    print()
