"""Dung toan bo dac trung ung vien tren du lieu that, do trung lap."""
import pandas as pd, numpy as np, glob

def load(sym):
    fs=sorted(glob.glob(f"data/raw/ohlcv/symbol={sym}/timeframe=1d/**/*.parquet",recursive=True))
    if not fs:
        fs=sorted(glob.glob(f"data/raw/ohlcv/symbol={sym}/timeframe=1h/**/*.parquet",recursive=True))
        d=pd.concat([pd.read_parquet(f) for f in fs]).sort_index()
        d=d[~d.index.duplicated()]
        return pd.DataFrame({'open':d.open.resample('1D').first(),'high':d.high.resample('1D').max(),
                             'low':d.low.resample('1D').min(),'close':d.close.resample('1D').last(),
                             'volume':d.volume.resample('1D').sum()}).dropna()
    d=pd.concat([pd.read_parquet(f) for f in fs]).sort_index()
    return d[~d.index.duplicated()]

D=load("BTCUSDT"); B=load("BTCUSDT")
fund=pd.read_parquet("data/raw/funding/symbol=BTCUSDT/data.parquet")["funding_rate"].resample("1D").mean()
c,h,l,o,v=D.close,D.high,D.low,D.open,D.volume
lr=np.log(c).diff()
def z(x,w): return (x-x.rolling(w).mean())/x.rolling(w).std()
def ema(x,n): return x.ewm(span=n,adjust=False).mean()

X=pd.DataFrame(index=D.index)
# ── LOI SUAT ──
for n in [1,2,3,6,12,24,72]: X[f'log_ret_{n}']=np.log(c).diff(n)
# ── BIEN DONG ──
X['rv_24']=lr.rolling(24).std(); X['rv_72']=lr.rolling(72).std()
X['atr_close']=((h-l).rolling(14).mean())/c
X['parkinson']=np.sqrt((np.log(h/l)**2).rolling(24).mean()/(4*np.log(2)))
X['rv_ratio_5_20']=lr.rolling(5).std()/lr.rolling(20).std()
X['sigma_ratio_90d']=lr.rolling(20).std()/lr.rolling(20).std().rolling(90).median()
# ── DONG LUONG ──
d_=c.diff(); up=d_.clip(lower=0).rolling(14).mean(); dn=(-d_.clip(upper=0)).rolling(14).mean()
X['rsi_14']=100-100/(1+up/dn)
X['macd_atr']=(ema(c,12)-ema(c,26)-ema(ema(c,12)-ema(c,26),9))/((h-l).rolling(14).mean())
X['stoch_k']=(c-l.rolling(14).min())/(h.rolling(14).max()-l.rolling(14).min())
for n in [6,24]: X[f'roc_{n}']=c.pct_change(n)
# ── XU HUONG ──
X['close_ema20']=c/ema(c,20); X['ema20_ema50']=ema(c,20)/ema(c,50); X['ema50_ema200']=ema(c,50)/ema(c,200)
# ── KHOI LUONG ──
X['vol_z96']=z(v,96); X['obv_slope']=np.sign(lr).mul(v).cumsum().diff(24)/v.rolling(24).mean()
# ── HINH NEN ──
X['hl_range_pct']=(h-l)/c; X['close_pos']=(c-l)/(h-l); X['body_pct']=(c-o).abs()/c
X['upper_wick']=(h-np.maximum(c,o))/c
# ── THOI GIAN ──
doy=D.index.dayofweek.values
X['dow_sin']=np.sin(2*np.pi*doy/7); X['dow_cos']=np.cos(2*np.pi*doy/7)
# ── CHE DO ──
X['vol_pct_720']=lr.rolling(20).std().rolling(720,min_periods=100).rank(pct=True)
X['volume_pct_720']=v.rolling(720,min_periods=100).rank(pct=True)
# ── CAU TRUC ──
X['dist_prior_high']=(c-h.rolling(20).max().shift(1))/(lr.rolling(20).std()*c)
X['dist_prior_low'] =(c-l.rolling(20).min().shift(1))/(lr.rolling(20).std()*c)
X['breakout_ext']=(c-h.rolling(20).max().shift(1))/(lr.rolling(20).std()*c)
X['dist_round']=((c%10000)/10000-0.5).abs()
# ── LIEN THI TRUONG (BTC la chinh no -> dung placeholder de dem) ──
X['btc_log_ret']=np.log(B.close).diff()
# ── FUNDING ──
X['funding_level']=fund*3*100
X['funding_z96']=z(fund,96)
X['funding_cum8']=fund.rolling(8).sum()

X=X.dropna()
print(f"Dung duoc {X.shape[1]} dac trung tren {X.shape[0]} nen (BTC ngay, sau khi bo NaN)\n")

# ── TRUNG LAP ──
C=X.corr().abs(); np.fill_diagonal(C.values,0)
print("═══ TOP 18 CAP TRUNG LAP NANG NHAT (|tuong quan| > 0,85) ═══\n")
pairs=[(C.index[i],C.columns[j],C.iloc[i,j]) for i in range(len(C)) for j in range(i+1,len(C)) if C.iloc[i,j]>0.85]
for a,b,r in sorted(pairs,key=lambda t:-t[2])[:18]: print(f"   {r:.3f}   {a:22s} ~ {b}")
print(f"\n   Tong so cap |r|>0,85: {len(pairs)}   ·   |r|>0,95: {sum(1 for *_,r in pairs if r>0.95)}")

# ── CHON THAM LAM: giu dac trung it trung lap nhat ──
print("\n═══ CHON THAM LAM 18 SUAT — moi buoc giu dac trung it trung voi da chon nhat ═══\n")
chosen=['sigma_ratio_90d']       # neo: dau ra cua tang bien dong
remain=[x for x in X.columns if x not in chosen]
while len(chosen)<18 and remain:
    best=min(remain,key=lambda f:C.loc[f,chosen].max())
    print(f"   {len(chosen)+1:2d}. {best:22s}  trung lap toi da voi nhom da chon: {C.loc[best,chosen].max():.3f}")
    chosen.append(best); remain.remove(best)
print(f"\n   Bi loai ({len(remain)}): {', '.join(remain)}")
X.to_parquet("scripts/measurements_2026_08_26/features_btc.parquet")
