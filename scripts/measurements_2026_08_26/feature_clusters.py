import pandas as pd, numpy as np
X=pd.read_parquet("scripts/measurements_2026_08_26/features_btc.parquet")
X=X.drop(columns=['btc_log_ret'])          # trung 1,000 voi log_ret_1 vi do tren chinh BTC
C=X.corr().abs()

# gom cum: lien ket don, nguong 0,70
th=0.70
cols=list(X.columns); parent={c:c for c in cols}
def find(a):
    while parent[a]!=a: parent[a]=parent[parent[a]]; a=parent[a]
    return a
for i,a in enumerate(cols):
    for b in cols[i+1:]:
        if C.loc[a,b]>=th:
            ra,rb=find(a),find(b)
            if ra!=rb: parent[rb]=ra
groups={}
for c_ in cols: groups.setdefault(find(c_),[]).append(c_)

print(f"═══ CUM DAC TRUNG (lien ket don, |tuong quan| ≥ {th}) ═══")
print(f"   {len(X.columns)} dac trung  ->  {len(groups)} CUM DOC LAP\n")
for i,(k,g) in enumerate(sorted(groups.items(),key=lambda t:-len(t[1])),1):
    if len(g)>1:
        sub=C.loc[g,g].values; np.fill_diagonal(sub,0)
        print(f"  Cum {i} ({len(g)} dac trung, tuong quan trong cum toi da {sub.max():.3f}):")
        print(f"     {', '.join(g)}")
    else:
        print(f"  Cum {i} (1): {g[0]}")
print(f"\n★ SO CHIEU THONG TIN THAT: {len(groups)} — khong phai {len(X.columns)}")

# ── kiem tra rieng: nhom xu huong co phai loi suat doi ten khong? ──
print("\n═══ KIEM DINH LEVINE-PEDERSEN: 'chi bao xu huong ≈ tong loi suat qua khu' ═══\n")
tr=['close_ema20','ema20_ema50','ema50_ema200','rsi_14','macd_atr','stoch_k']
rt=[c for c in X.columns if c.startswith('log_ret')]
print(f"   {'chi bao xu huong':18s} | tuong quan cao nhat voi mot loi suat thuan")
for t in tr:
    best=max(rt,key=lambda r:C.loc[t,r])
    print(f"   {t:18s} | {C.loc[t,best]:.3f}  voi  {best}")
