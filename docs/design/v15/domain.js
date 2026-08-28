/* ══════════════════════════════════════════════════════════════════
   domain.js — LÕI NGHIỆP VỤ MÔ PHỎNG cho prototype v15

   Prototype không có backend (M9 chưa tồn tại). File này MÔ PHỎNG đúng hợp
   đồng mà backend sẽ cung cấp, để giao diện được thiết kế trên dữ liệu có
   hình dạng thật:
     · CP.pred     — dự đoán tầng 1 (mô phỏng, tính từ nến ĐÃ ĐÓNG, phương án C)
     · CP.methods  — 9 phương pháp theo phán quyết docs/Old/11 §0.2
     · CP.indicators — sổ chỉ số + chip nguồn gốc (docs/Old/14 §3)
     · CP.tiers    — 4 tầng độ chọn lọc (ADR-018) — tầng ≠ chất lượng
     · CP.auth     — tài khoản, phiên, 2FA, audit log (localStorage)
     · CP.link     — liên kết Binance: kiểm quyền → từ chối khoá rút tiền → thu hồi
     · CP.verify   — nhãn trạng thái kiểm chứng (ADR-020) · CP.safe — bộ an toàn REQ-SAFE · CP.notify — kênh thông báo
     · CP.paper    — ví PAPER 10.000 USDT, spot, phí + trượt giá (không thuế), sổ lệnh append-only
     · CP.bots     — bot PAPER; bot TIỀN THẬT chỉ khi đủ REQ-SAFE + kỳ Paper + LEGAL-01
     · CP.mode     — PAPER / TRADING

   Mọi con số dự đoán ở đây là MÔ PHỎNG và được gắn nhãn như vậy trên UI.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const CP = (window.CP = window.CP || {});
  const LS = (k, v) => {
    try {
      if (v === undefined) { const s = localStorage.getItem('cp15.' + k); return s ? JSON.parse(s) : null; }
      localStorage.setItem('cp15.' + k, JSON.stringify(v));
    } catch (e) { return null; }
  };
  const uid = () => Math.random().toString(36).slice(2, 10);
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  // ── Chi phí thật (RULE 5) — KHÔNG tính thuế: người dùng tự khai (quyết định chủ dự án 27/08/2026, 00_VISION §4)
  const COSTS = { taker: 0.001, slippage: 0.0005, roundTrip() { return 2 * (this.taker + this.slippage); } };
  CP.costs = COSTS;

  // ── Khung nhìn → model (docs/Old/05 §3.2) ────────────────────────
  const MODEL_OF = (tf) => (['1m', '5m', '15m', '30m', '1h'].includes(tf) ? { model: '1h', horizonH: 4, bars: 4 } : ['2h', '4h', '6h'].includes(tf) ? { model: '4h', horizonH: 24, bars: 6 } : { model: '1d', horizonH: 24, bars: 1 });

  // ── toán tiện ích ───────────────────────────────────────────────
  const ema = (arr, n) => { const k = 2 / (n + 1); let e = arr[0]; const out = [e]; for (let i = 1; i < arr.length; i++) { e = arr[i] * k + e * (1 - k); out.push(e); } return out; };
  const std = (arr) => { if (arr.length < 2) return 0; const m = arr.reduce((a, b) => a + b, 0) / arr.length; return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / (arr.length - 1)); };
  const zscore = (arr) => { const s = std(arr); const m = arr.reduce((a, b) => a + b, 0) / arr.length; return s ? (arr[arr.length - 1] - m) / s : 0; };
  const logret = (ks) => ks.slice(1).map((k, i) => Math.log(k.c / ks[i].c));

  // ── Hiệu chỉnh mô phỏng: điểm thô → p_up "đã hiệu chỉnh" ─────────
  // Ép vào [0,38 · 0,66] để mô phỏng đúng thực tế: model trung thực hiếm khi vượt 65%.
  const calibrate = (score) => clamp(0.5 + 0.16 * Math.tanh(score), 0.34, 0.66);
  const DEAD = 0.08; // vùng chết ±8 điểm quanh 50% → KHÔNG RÕ

  /** Mức độ chọn lọc `level` của một dự đoán, từ khoảng cách tới 50%. */
  const levelOf = (p) => { const d = Math.abs(p - 0.5); return d >= 0.15 ? 1 : d >= 0.12 ? 0.75 : d >= 0.10 ? 0.5 : d >= DEAD ? 0.25 : 0; };

  // ── DỰ ĐOÁN TẦNG 1 (mô phỏng) ───────────────────────────────────
  /**
   * Tính dự đoán tại nến đóng cuối cùng của mảng `closed` (không dùng nến dở dang).
   * Chỉ dùng dữ liệu ≤ close[t] (RULE 2 — mọi đầu vào đã "dịch" khỏi tương lai).
   */
  function predictAt(closed, tf, symbol) {
    const n = closed.length;
    if (n < 60) return null;
    const m = MODEL_OF(tf);
    const cs = closed.map((k) => k.c);
    const lr = logret(closed);
    const sigma = std(lr.slice(-24)) || 1e-4;                 // σ̂ mỗi nến
    const sigH = sigma * Math.sqrt(m.bars);                    // σ̂ theo chân trời
    const e50 = ema(cs, 50), e200 = ema(cs, Math.min(200, n - 1));
    const trend = (e50[n - 1] - e200[n - 1]) / (e200[n - 1] * sigma * 10);     // PP4 — quy tắc hướng sơ cấp
    const mom = lr.slice(-12).reduce((a, b) => a + b, 0) / (sigma * Math.sqrt(12)); // log_ret_12
    const last = closed[n - 1];
    const rng = last.h - last.l || 1e-9;
    const cpos = (last.c - last.l) / rng - 0.5;                // close_position_in_range
    const score = 0.9 * trend + 0.5 * mom + 0.6 * cpos;
    const pUp = calibrate(score);
    const level = levelOf(pUp);
    const dir = pUp >= 0.5 + DEAD ? 'UP' : pUp <= 0.5 - DEAD ? 'DOWN' : 'FLAT';
    const q50 = last.c * Math.exp(0.15 * (pUp - 0.5) * sigH * 6);
    const q10 = q50 * Math.exp(-1.2816 * sigH);
    const q90 = q50 * Math.exp(1.2816 * sigH);
    // Rào chắn ADR-017: SL 1,2σ̂ · TP 6,0σ̂ (không cho user chỉnh — ADR-018 trục A)
    const sl = 1.2, tp = 6.0;
    const cR = COSTS.roundTrip() / sigH;                       // chi phí quy về σ̂
    const pRequired = (sl + cR) / (tp + sl);                   // ngưỡng thắng để hoà vốn
    const t0 = last.t + CP.data.TF_MS[tf];                     // nến đóng lúc nào
    return {
      id: `${symbol}|${last.t}|${level}|sim`,
      symbol, tf, model: m.model, horizonH: m.horizonH,
      issuedAt: t0, validUntil: t0 + m.horizonH * 36e5,
      anchor: last.c, direction: dir, pUp, pRequired, level,
      q10, q50, q90, sigma: sigH, expectedMovePct: sigH * 100,
      barrier: { slSigma: sl, tpSigma: tp, sl: dir === 'DOWN' ? last.c * Math.exp(sl * sigH) : last.c * Math.exp(-sl * sigH), tp: dir === 'DOWN' ? last.c * Math.exp(-tp * sigH) : last.c * Math.exp(tp * sigH) },
      silenceReason: dir === 'FLAT' ? 'p_up trong vùng ±8 điểm quanh 50% — không đủ bằng chứng' : null,
      simulated: true,
    };
  }

  /** Dự đoán hiện hành + lịch sử đã chấm (track record) cho một cặp/khung. */
  function series(klines, tf, symbol, opts = {}) {
    const closed = klines.slice(0, -1);              // nến cuối đang hình thành → bỏ
    const m = MODEL_OF(tf);
    const cur = predictAt(closed, tf, symbol);
    const hist = [];
    const back = opts.back || 120;
    for (let i = Math.max(60, closed.length - back); i < closed.length - m.bars; i++) {
      const p = predictAt(closed.slice(0, i + 1), tf, symbol);
      if (!p) continue;
      const out = closed[i + m.bars].c;
      const ret = Math.log(out / p.anchor);
      let hit = null, R = 0;
      if (p.direction !== 'FLAT') {
        hit = p.direction === 'UP' ? out > p.anchor : out < p.anchor;
        // R mô phỏng: chạm TP/SL trong chân trời theo đường đóng cửa
        const path = closed.slice(i + 1, i + 1 + m.bars);
        const sgn = p.direction === 'UP' ? 1 : -1;
        let r = null;
        for (const k of path) {
          const hi = sgn * Math.log(k.h / p.anchor), lo = sgn * Math.log(k.l / p.anchor);
          if (lo <= -p.barrier.slSigma * p.sigma / Math.sqrt(m.bars) * Math.sqrt(m.bars)) { r = -1; break; }
          if (hi >= p.barrier.tpSigma * p.sigma) { r = p.barrier.tpSigma / p.barrier.slSigma; break; }
        }
        if (r === null) r = (sgn * ret) / (p.barrier.slSigma * p.sigma);
        R = r - COSTS.roundTrip() / (p.barrier.slSigma * p.sigma);
      }
      hist.push({ ...p, outcomeClose: out, retPct: ret * 100, hit, R });
    }
    return { current: cur, history: hist, model: m };
  }

  /** Thống kê track record: luôn kèm n= (TRACK-02). */
  function stats(hist, minLevel = 0.25) {
    const acted = hist.filter((h) => h.direction !== 'FLAT' && h.level >= minLevel);
    const n = acted.length, hits = acted.filter((h) => h.hit).length;
    const gains = acted.filter((h) => h.R > 0).reduce((a, h) => a + h.R, 0);
    const losses = -acted.filter((h) => h.R < 0).reduce((a, h) => a + h.R, 0);
    return {
      n, hits, misses: n - hits, silent: hist.length - hist.filter((h) => h.direction !== 'FLAT').length,
      accuracy: n ? hits / n : null,
      profitFactor: losses > 0 ? gains / losses : (gains > 0 ? Infinity : null),
      totalR: acted.reduce((a, h) => a + h.R, 0),
      enough: n >= 100,
    };
  }

  CP.pred = { MODEL_OF, predictAt, series, stats, DEAD, calibrate, levelOf };

  // ── TẦNG ĐỘ CHỌN LỌC (ADR-018) — tầng điều tiết TẦN SUẤT, không phải chất lượng
  CP.tiers = [
    { id: 'full', name: 'Đầy đủ', level: 0.25, perYear: 43.4, totalR: 723 },
    { id: 'balanced', name: 'Cân bằng', level: 0.5, perYear: 27.8, totalR: 444 },
    { id: 'selective', name: 'Chọn lọc', level: 0.75, perYear: 17.0, totalR: 255 },
    { id: 'minimal', name: 'Tối thiểu', level: 1.0, perYear: 6.9, totalR: 100 },
  ];

  // ── CHÍN PHƯƠNG PHÁP (docs/Old/11 §0.2) ──────────────────────────
  // vote(closed, tf) → 'UP' | 'DOWN' | 'FLAT' | null (null = không bỏ phiếu)
  CP.methods = [
    { id: 'PP4', name: 'Theo xu hướng (Position / Trend Following)', role: 'Quy tắc hướng sơ cấp ★', score: '5/5', votes: true, weight: 'chủ',
      mechanism: 'EMA50 so với EMA200 trên nến đã đóng; chỉ mua-hoặc-đứng-ngoài, không bán khống. Tín hiệu tại close t, khớp tại open t+1.',
      fails: 'Thị trường đi ngang kéo dài: nhiều tín hiệu giả, mỗi cái lỗ nhỏ (−1,2σ̂). Đây là phương pháp thắng bằng vài cú lớn, thua bằng nhiều cú nhỏ.',
      vote: (c) => { const cs = c.map((k) => k.c); const e50 = ema(cs, 50), e200 = ema(cs, Math.min(200, cs.length - 1)); const d = (e50.at(-1) - e200.at(-1)) / e200.at(-1); return d > 0.004 ? 'UP' : d < -0.004 ? 'DOWN' : 'FLAT'; } },
    { id: 'PP7', name: 'Funding & Cash-and-Carry', role: 'Hàm chi phí ★★ + 2 đặc trưng', score: '5/5 (vai trò chi phí)', votes: false, weight: 'chi phí',
      mechanism: 'Funding là CHI PHÍ giữ vị thế, không phải tín hiệu. Funding cực trị nghiêng về TIẾP DIỄN xu hướng (docs/Old/09 §2), không phải đảo chiều.',
      fails: 'Dùng funding làm tín hiệu đảo chiều đơn lẻ — đã bị dữ liệu bác (hit-rate < 50%).', vote: () => null, pending: 'Chờ dữ liệu funding (fapi) — prototype chưa nối' },
    { id: 'PP3', name: 'Swing Trading', role: 'Chân trời + cấu trúc điểm vào', score: '4/5 phần lõi', votes: true, weight: 'phụ',
      mechanism: 'Khoảng cách tới đỉnh/đáy gần nhất chuẩn hoá theo σ̂ — quyết định điểm vào, không quyết định hướng.',
      fails: 'Swing "như được dạy" (kháng cự/hỗ trợ vẽ tay) không tái lập được giữa hai người.',
      vote: (c) => { const hi = Math.max(...c.slice(-30).map((k) => k.h)); const lo = Math.min(...c.slice(-30).map((k) => k.l)); const p = (c.at(-1).c - lo) / (hi - lo || 1); return p > 0.8 ? 'UP' : p < 0.2 ? 'DOWN' : 'FLAT'; } },
    { id: 'PP6', name: 'Order Flow (nhánh sống)', role: 'Hai đặc trưng cho lớp lọc', score: '4/5 · 3/5 · 0/5', votes: true, weight: 'phụ',
      mechanism: 'Bất thường khối lượng (volume z-score 96 nến) và CVD. Volume Profile chờ; bản đồ thanh lý bị loại.',
      fails: 'Khối lượng đột biến không cho biết hướng — chỉ cho biết "có chuyện".',
      vote: (c) => { const v = c.slice(-96).map((k) => k.v); const z = zscore(v); const up = c.at(-1).c > c.at(-1).o; return Math.abs(z) > 2 ? (up ? 'UP' : 'DOWN') : 'FLAT'; } },
    { id: 'PP5', name: 'Price Action (3 đặc trưng sống sót)', role: 'Ba đặc trưng', score: '4/5 sau khi lột bỏ', votes: true, weight: 'phụ',
      mechanism: 'Quét-rồi-lấy-lại, khoảng cách tới đỉnh/đáy, khoảng cách tới số tròn. Toàn bộ hệ thuật ngữ SMC (order block, FVG, BOS…) đã bị bác.',
      fails: 'FVG "phải được lấp" đo được 79,5% — thấp hơn nền ngẫu nhiên 85,1%.',
      vote: (c) => { const k = c.at(-1), prev = c.at(-2); const sweptLow = k.l < Math.min(...c.slice(-11, -1).map((x) => x.l)) && k.c > prev.c; const sweptHigh = k.h > Math.max(...c.slice(-11, -1).map((x) => x.h)) && k.c < prev.c; return sweptLow ? 'UP' : sweptHigh ? 'DOWN' : 'FLAT'; } },
    { id: 'PP2', name: 'Day Trading', role: 'Chỉ hiển thị — nowcast biến động', score: '1/5', votes: false, weight: 'hiển thị',
      mechanism: 'Không phát ý định giao dịch. Chỉ hiển thị biến động thực hiện trong ngày và mùa vụ tuần (dow_sin/cos).',
      fails: 'Khung ngắn gần random walk; phí nuốt edge.', vote: () => null },
    { id: 'PP9', name: 'DCA mua-và-giữ', role: 'Đối chứng trung thực nhất', score: '5/5 (đối chứng)', votes: false, weight: 'đối chứng',
      mechanism: 'Mua đều đặn, không dự đoán. Mọi phương pháp khác phải thắng nó sau phí mới có lý do tồn tại. Grid martingale bị loại.',
      fails: 'Thị trường giảm dài — nhưng đó là rủi ro thị trường, không phải lỗi phương pháp.', vote: () => null },
    { id: 'PP8', name: 'On-chain & Narrative', role: 'Khoá 12 tháng', score: '1/5 · 5/5 nhưng khoá', votes: false, weight: 'khoá',
      mechanism: 'Chỉ số on-chain (MVRV, SOPR…) bị hiệu chỉnh hồi tố — rò rỉ tương lai đóng gói sẵn.', fails: 'Không test nào bắt được rò rỉ này.', vote: () => null, locked: true },
    { id: 'PP1', name: 'Scalping', role: 'Loại — giữ 2 quy tắc né thời điểm thực thi', score: '0/5', votes: false, weight: 'loại',
      mechanism: 'Bức tường phí: ở khung phút cần hit-rate > 250% để hoà vốn.', fails: 'Luôn.', vote: () => null, locked: true },
  ];

  /** Đếm phiếu — KHÔNG PHẢI XÁC SUẤT. Các phương pháp không độc lập (57 đặc trưng ~ 13 chiều thật). */
  CP.consensus = function (closed, tf) {
    const rows = CP.methods.map((mth) => ({ ...mth, vote: mth.votes ? mth.vote(closed, tf) : null }));
    const voters = rows.filter((r) => r.votes);
    const up = voters.filter((r) => r.vote === 'UP').length, down = voters.filter((r) => r.vote === 'DOWN').length;
    return { rows, up, down, flat: voters.length - up - down, total: voters.length, note: 'đếm phiếu, không phải xác suất — các phương pháp không độc lập (57 đặc trưng ~ 13 chiều thật)' };
  };

  // ── SỔ CHỈ SỐ + CHIP NGUỒN GỐC (docs/Old/14 §3; PRED-15) ────────
  const OFFICIAL = 'BỘ CHÍNH THỨC', REJECTED = 'BỊ BÁC — không vào model', PENDING = 'CHỜ DỮ LIỆU';
  const pct = (x) => x * 100;
  CP.indicators = {
    OFFICIAL, REJECTED, PENDING,
    groups: ['Biến động', 'Xu hướng', 'Động lượng', 'Khối lượng', 'Hình nến', 'Cấu trúc', 'Phái sinh', 'Mùa vụ'],
    list: [
      { id: 'sigma_ratio_90d', name: 'σ̂ / trung vị 90 ngày', group: 'Biến động', chip: OFFICIAL, fmt: 'x', calc: (c) => { const lr = logret(c); const s = std(lr.slice(-24)); const meds = []; for (let i = 24; i < lr.length; i += 6) meds.push(std(lr.slice(i - 24, i))); meds.sort((a, b) => a - b); const med = meds[Math.floor(meds.length / 2)] || s; return s / (med || 1); }, note: 'Chế độ biến động — cụm 5' },
      { id: 'rv_24', name: 'Biến động thực hiện 24 nến', group: 'Biến động', chip: OFFICIAL, fmt: '%', calc: (c) => pct(std(logret(c).slice(-24))), note: 'Mức biến động — cụm 2' },
      { id: 'rv_ratio_5d_20d', name: 'Cấu trúc kỳ hạn biến động (5d/20d)', group: 'Biến động', chip: OFFICIAL, fmt: 'x', calc: (c) => { const lr = logret(c); return std(lr.slice(-Math.min(120, lr.length))) / (std(lr.slice(-Math.min(480, lr.length))) || 1); }, note: 'Cụm riêng 7 ★' },
      { id: 'ema50_ema200', name: 'EMA50 − EMA200 (theo %)', group: 'Xu hướng', chip: OFFICIAL, fmt: '%', calc: (c) => { const cs = c.map((k) => k.c); const e50 = ema(cs, 50), e200 = ema(cs, Math.min(200, cs.length - 1)); return pct((e50.at(-1) - e200.at(-1)) / e200.at(-1)); }, note: 'Xu hướng chậm — PP4 ★' },
      { id: 'log_ret_12', name: 'Lợi suất log 12 nến', group: 'Động lượng', chip: OFFICIAL, fmt: '%', calc: (c) => pct(Math.log(c.at(-1).c / c.at(-13).c)), note: 'Động lượng — cụm 1 (RSI/MACD/Stoch là bản đổi thang của nó)' },
      { id: 'log_ret_1', name: 'Lợi suất log nến gần nhất', group: 'Động lượng', chip: OFFICIAL, fmt: '%', calc: (c) => pct(Math.log(c.at(-1).c / c.at(-2).c)), note: 'Cụm 4' },
      { id: 'rsi_14', name: 'RSI 14', group: 'Động lượng', chip: REJECTED, fmt: 'n', calc: (c) => { const lr = logret(c).slice(-14); const g = lr.filter((x) => x > 0).reduce((a, b) => a + b, 0), l = -lr.filter((x) => x < 0).reduce((a, b) => a + b, 0); return l === 0 ? 100 : 100 - 100 / (1 + g / l); }, note: 'r = 0,854 với log_ret_12 — cùng thông tin' },
      { id: 'macd', name: 'MACD (12,26) / ATR', group: 'Động lượng', chip: REJECTED, fmt: 'x', calc: (c) => { const cs = c.map((k) => k.c); const d = ema(cs, 12).at(-1) - ema(cs, 26).at(-1); const atr = c.slice(-14).reduce((a, k) => a + (k.h - k.l), 0) / 14; return d / (atr || 1); }, note: 'r = 0,735 với log_ret_12' },
      { id: 'stoch_k', name: 'Stochastic %K 14', group: 'Động lượng', chip: REJECTED, fmt: 'n', calc: (c) => { const w = c.slice(-14); const hi = Math.max(...w.map((k) => k.h)), lo = Math.min(...w.map((k) => k.l)); return 100 * (c.at(-1).c - lo) / (hi - lo || 1); }, note: 'r = 0,765 với log_ret_12' },
      { id: 'volume_z96', name: 'Khối lượng z-score 96 nến', group: 'Khối lượng', chip: OFFICIAL, fmt: 'z', calc: (c) => zscore(c.slice(-96).map((k) => k.v)), note: 'Bất thường khối lượng — PP6' },
      { id: 'taker_buy_ratio', name: 'Tỉ lệ taker mua', group: 'Khối lượng', chip: PENDING, fmt: 'x', calc: () => null, note: 'Cần cột 9 endpoint klines (G3)' },
      { id: 'cvd_slope_24', name: 'Độ dốc CVD 24 nến', group: 'Khối lượng', chip: PENDING, fmt: 'x', calc: () => null, note: 'Cần aggTrades lịch sử' },
      { id: 'obv', name: 'OBV', group: 'Khối lượng', chip: REJECTED, fmt: 'n', calc: (c) => c.slice(-50).reduce((a, k, i, arr) => i ? a + (k.c > arr[i - 1].c ? k.v : -k.v) : 0, 0), note: 'Tích luỹ không scale-free (RULE 1)' },
      { id: 'close_position_in_range', name: 'Vị trí đóng cửa trong nến', group: 'Hình nến', chip: OFFICIAL, fmt: 'x', calc: (c) => { const k = c.at(-1); return (k.c - k.l) / (k.h - k.l || 1); }, note: 'Cụm 4' },
      { id: 'upper_wick_pct', name: 'Bóng trên / biên độ', group: 'Hình nến', chip: OFFICIAL, fmt: 'x', calc: (c) => { const k = c.at(-1); return (k.h - Math.max(k.o, k.c)) / (k.h - k.l || 1); }, note: 'Áp lực bán trong nến — cụm riêng 9 ★' },
      { id: 'dist_to_prior_high', name: 'Khoảng cách tới đỉnh 30 nến (σ̂)', group: 'Cấu trúc', chip: OFFICIAL, fmt: 'x', calc: (c) => { const hi = Math.max(...c.slice(-31, -1).map((k) => k.h)); const s = std(logret(c).slice(-24)) || 1e-4; return Math.log(hi / c.at(-1).c) / s; }, note: 'PP3, PP5' },
      { id: 'dist_round', name: 'Khoảng cách tới số tròn', group: 'Cấu trúc', chip: OFFICIAL, fmt: '%', calc: (c) => { const p = c.at(-1).c; const mag = 10 ** Math.floor(Math.log10(p)); const step = mag / 2; const r = Math.round(p / step) * step; return pct((p - r) / p); }, note: 'Osler 2000/2003 — PP5' },
      { id: 'fvg', name: 'Fair Value Gap / Order Block / BOS', group: 'Cấu trúc', chip: REJECTED, fmt: '-', calc: () => null, note: 'Không tái lập giữa hai người cài đặt; FVG lấp 79,5% < nền 85,1%' },
      { id: 'funding_level_pct', name: 'Funding hiện hành (%/8h)', group: 'Phái sinh', chip: PENDING, fmt: '%', calc: () => null, note: 'CHI PHÍ thật — vào hàm chi phí trước, đặc trưng sau. Prototype chưa nối fapi' },
      { id: 'funding_z96', name: 'Funding z-score 96 kỳ', group: 'Phái sinh', chip: PENDING, fmt: 'z', calc: () => null, note: 'Chế độ chen chúc — cụm riêng 13 ★. Cực trị nghiêng TIẾP DIỄN, không đảo chiều' },
      { id: 'oi_price_div', name: 'Phân kỳ OI – giá', group: 'Phái sinh', chip: PENDING, fmt: 'x', calc: () => null, note: 'openInterestHist chỉ có 30 ngày' },
      { id: 'basis', name: 'Basis (mark − spot)', group: 'Phái sinh', chip: PENDING, fmt: '%', calc: () => null, note: 'Chi phí carry' },
      { id: 'liq_heatmap', name: 'Bản đồ nhiệt thanh lý', group: 'Phái sinh', chip: REJECTED, fmt: '-', calc: () => null, note: '"Mức thanh lý" là kết quả mô hình bán như dữ liệu' },
      { id: 'dow', name: 'Mùa vụ tuần (dow sin/cos)', group: 'Mùa vụ', chip: OFFICIAL, fmt: 'd', calc: (c) => new Date(c.at(-1).t).getUTCDay(), note: 'PP2 — cụm 10, 11' },
    ],
    compute(closed) {
      return this.list.map((d) => { let v = null; try { v = d.calc(closed); } catch (e) { v = null; } return { ...d, value: v }; });
    },
  };

  // ── AUTH — tài khoản, phiên, 2FA, audit (ACC-01/03/05) ───────────
  async function sha(s) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  const auth = {
    users() { return LS('users') || {}; },
    session() { return LS('session'); },
    current() { const s = this.session(); if (!s || s.exp < Date.now()) return null; const u = this.users()[s.email]; return u ? { email: u.email, twoFA: !!u.twoFA, createdAt: u.createdAt, prefs: u.prefs || {} } : null; },
    async signUp(email, password, acceptTerms) {
      email = (email || '').trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Email không hợp lệ');
      if ((password || '').length < 10) throw new Error('Mật khẩu tối thiểu 10 ký tự');
      if (!acceptTerms) throw new Error('Cần đồng ý điều khoản & tuyên bố miễn trừ (LEGAL-02)');
      const users = this.users();
      if (users[email]) throw new Error('Email đã đăng ký');
      const salt = uid();
      // Prototype: SHA-256 + salt. Bản thật: argon2id (ACC-01 — thuật toán chậm).
      users[email] = { email, salt, hash: await sha(salt + password), createdAt: Date.now(), twoFA: false, prefs: { tier: 'balanced', lang: 'vi', theme: 'dark' } };
      LS('users', users);
      this.audit('signup', { email });
      return this.login(email, password);
    },
    async login(email, password) {
      email = (email || '').trim().toLowerCase();
      const u = this.users()[email];
      if (!u || u.hash !== (await sha(u.salt + password))) throw new Error('Email hoặc mật khẩu không đúng');
      LS('session', { email, exp: Date.now() + 12 * 36e5, twoFAok: false });
      this.audit('login', { email });
      return this.current();
    },
    logout() { const s = this.session(); if (s) this.audit('logout', { email: s.email }); LS('session', null); },
    /** 2FA mô phỏng: prototype tự sinh mã 6 số và hiển thị trong "ứng dụng xác thực giả lập". */
    twoFACode() { const s = this.session(); if (!s) return null; const t = Math.floor(Date.now() / 30000); return String((parseInt(s.email.length + '' + t, 10) * 9301 + 49297) % 233280).padStart(6, '0').slice(-6); },
    enable2FA(code) { const s = this.session(); if (!s) throw new Error('Chưa đăng nhập'); if (code !== this.twoFACode()) throw new Error('Mã 2FA không đúng'); const users = this.users(); users[s.email].twoFA = true; LS('users', users); s.twoFAok = true; LS('session', s); this.audit('2fa_enabled', { email: s.email }); },
    verify2FA(code) { const s = this.session(); if (!s) return false; if (code !== this.twoFACode()) throw new Error('Mã 2FA không đúng'); s.twoFAok = true; LS('session', s); return true; },
    twoFAVerified() { const s = this.session(); return !!(s && s.twoFAok); },
    setPrefs(p) { const s = this.session(); if (!s) return; const users = this.users(); users[s.email].prefs = { ...(users[s.email].prefs || {}), ...p }; LS('users', users); if (p.tier) this.audit('tier_changed', { email: s.email, tier: p.tier }); },
    audit(action, meta) { const log = LS('audit') || []; log.push({ id: uid(), at: Date.now(), action, ...meta }); LS('audit', log.slice(-500)); },
    auditLog() { const s = this.session(); return (LS('audit') || []).filter((a) => !s || a.email === s.email).reverse(); },
    deleteAccount() { const s = this.session(); if (!s) return; const users = this.users(); delete users[s.email]; LS('users', users); link.revoke('account_deleted'); this.audit('account_deleted', { email: s.email }); LS('session', null); },
  };
  CP.auth = auth;

  // ── LIÊN KẾT BINANCE (LINK-01..05) — mô phỏng kiểm quyền ─────────
  const link = {
    get() { const u = auth.current(); if (!u) return null; return (LS('links') || {})[u.email] || null; },
    /**
     * Mô phỏng gọi GET /sapi/v1/account/apiRestrictions. `simulate` chọn kịch bản
     * để người review thấy đủ 3 kết cục: hợp lệ / có quyền rút → TỪ CHỐI / thiếu quyền giao dịch.
     */
    async connect({ apiKey, secret, simulate = 'ok' }) {
      const u = auth.current(); if (!u) throw new Error('Chưa đăng nhập');
      if (!u.twoFA || !auth.twoFAVerified()) throw new Error('Cần bật và xác minh xác thực hai bước trước khi liên kết (ACC-03)');
      if (!CP.notify.hasVerified()) throw new Error('Cần ít nhất một kênh thông báo ngoài màn hình đã xác minh trước khi liên kết (NOTIFY-01)');
      if (!/^[A-Za-z0-9]{64}$/.test(apiKey || '')) throw new Error('API key phải là 64 ký tự chữ-số');
      if (!/^[A-Za-z0-9]{64}$/.test(secret || '')) throw new Error('Secret key phải là 64 ký tự chữ-số');
      await new Promise((r) => setTimeout(r, 900));
      const perms = simulate === 'withdraw' ? { enableReading: true, enableSpotAndMarginTrading: true, enableWithdrawals: true, ipRestrict: false }
        : simulate === 'readonly' ? { enableReading: true, enableSpotAndMarginTrading: false, enableWithdrawals: false, ipRestrict: true }
        : { enableReading: true, enableSpotAndMarginTrading: true, enableWithdrawals: false, ipRestrict: true };
      if (perms.enableWithdrawals) {
        auth.audit('link_rejected_withdraw', { email: u.email, fp: apiKey.slice(-4) });
        // Khoá KHÔNG được lưu ở bất kỳ dạng nào khi bị từ chối.
        throw Object.assign(new Error('TỪ CHỐI: khoá có quyền RÚT TIỀN. Hệ không bao giờ nhận khoá này (Luật 13). Tạo khoá mới trên Binance, chỉ bật "Enable Reading" + "Enable Spot & Margin Trading".'), { code: 'WITHDRAW' });
      }
      // Bản thật: secret mã hoá bằng khoá chủ ngoài DB (LINK-02). Prototype: KHÔNG lưu secret — chỉ lưu dấu vân tay.
      const rec = { email: u.email, fp: '…' + apiKey.slice(-4), perms, linkedAt: Date.now(), lastCheck: Date.now(), status: perms.enableSpotAndMarginTrading ? 'trade' : 'readonly', balances: this.mockBalances() };
      const all = LS('links') || {}; all[u.email] = rec; LS('links', all);
      auth.audit('link_created', { email: u.email, fp: rec.fp, status: rec.status });
      return rec;
    },
    recheck() { const r = this.get(); if (!r) return null; r.lastCheck = Date.now(); const all = LS('links') || {}; all[r.email] = r; LS('links', all); return r; },
    revoke(reason = 'user') { const u = auth.current(); if (!u) return; const all = LS('links') || {}; if (all[u.email]) { delete all[u.email]; LS('links', all); bots.stopAll('link_revoked'); auth.audit('link_revoked', { email: u.email, reason }); } },
    mockBalances() { return [{ asset: 'USDT', free: 1250.42, locked: 0 }, { asset: 'BTC', free: 0.0125, locked: 0 }, { asset: 'ETH', free: 0.4, locked: 0 }]; },
    serverIp: '203.0.113.42', // IP máy chủ để user khoá IP trên Binance (LINK-05) — ví dụ
  };
  CP.link = link;

  // ── NHÃN TRẠNG THÁI KIỂM CHỨNG (ADR-020 · PRED-12 · UI-11) ───────
  // Thay vai trò GATE 1–2: không chặn ai, chỉ nói thật. Sinh tự động từ số mẫu +
  // kết quả kiểm định; prototype chưa có kiểm định thật ⇒ mọi phương pháp "chưa kiểm chứng".
  CP.verify = {
    LABEL: { unverified: 'chưa kiểm chứng', collecting: 'đang thu bằng chứng', verified: 'đã kiểm chứng' },
    /** @param {{n:number, hasSkill?:boolean, calibrated?:boolean, leakageClean?:boolean, simulated?:boolean}} ev */
    derive(ev) {
      const n = ev.n || 0;
      let status = 'unverified';
      if (!ev.simulated && n >= 100 && ev.leakageClean && ev.calibrated && ev.hasSkill) status = 'verified';
      else if (!ev.simulated && n >= 30) status = 'collecting';
      const label = this.LABEL[status];
      const why = status === 'verified' ? 'thắng toàn bộ baseline sau phí trên holdout chưa chạm, xác suất đã hiệu chỉnh'
        : ev.simulated ? 'số liệu mô phỏng trong prototype — không tính là bằng chứng'
        : n < 30 ? `mới có ${n} mẫu đã chấm` : 'chưa thắng baseline sau phí / chưa hiệu chỉnh';
      return { status, label, n, why, scoredAt: ev.scoredAt || null, sentence: `Phương pháp này ${label} (${n} mẫu${ev.simulated ? ', mô phỏng' : ''}) — ${why}.` };
    },
    /** Trạng thái của tầng 1 hiện hành (dựa trên lịch sử đã chấm của phiên). */
    current() { const hist = (CP.market && CP.market.hist) || []; return this.derive({ n: hist.filter((h) => h.direction !== 'FLAT').length, simulated: true, scoredAt: hist.length ? hist[hist.length - 1].issuedAt : null }); },
    ofMethod(id, n) { return this.derive({ n: n || 0, simulated: true }); },
  };

  // ── BỘ AN TOÀN BẮT BUỘC CỦA ĐƯỜNG LỆNH (REQ-SAFE — "định nghĩa hoàn thành", không phải cổng)
  CP.safe = {
    items: [
      { id: 'SAFE-01', name: 'Nút dừng khẩn cấp của người dùng', detail: 'ngừng vòng lặp, huỷ lệnh vào chưa khớp, GIỮ nguyên lệnh dừng lỗ trên sàn', done: false },
      { id: 'SAFE-02', name: 'Nút dừng toàn hệ của admin', detail: 'chặn mọi đường gửi lệnh, không tự mở lại', done: false },
      { id: 'SAFE-03', name: 'Giới hạn cỡ lệnh và tổng exposure', detail: 'hằng số trong mã, có test vượt trần', done: false },
      { id: 'SAFE-04', name: 'Giới hạn lỗ ngày, không tự bật lại', detail: 'PnL thực hiện + chưa thực hiện, tính từ 00:00 UTC', done: false },
      { id: 'SAFE-05', name: 'Chống gửi trùng lệnh + đối soát với sàn', detail: 'clientOrderId duy nhất; đối soát ≤ 5 phút; lệch ⇒ chặn lệnh mới', done: false },
      { id: 'SAFE-06', name: 'Đường lệnh đã chạy thử trước khi phát hành', detail: 'đủ ngày/lệnh trên Paper/Demo với 0 trùng, 0 mồ côi, 0 lệch — chấm sự cố kỹ thuật, không chấm PnL', done: false },
      { id: 'SAFE-07', name: 'Khoá API đúng quyền và ràng buộc IP', detail: 'không quyền rút tiền, danh sách trắng IP', done: true },
      { id: 'SAFE-08', name: 'Khởi động lại về trạng thái tắt', detail: 'rời trạng thái tắt chỉ sau khi đối soát sạch', done: true },
      { id: 'SAFE-09', name: 'Lối ra định nghĩa trước lối vào', detail: 'dừng lỗ TRÊN SÀN đặt cùng lúc lệnh vào; hạn giữ; thoát khi tín hiệu hết hiệu lực', done: false },
    ],
    ready() { return this.items.every((i) => i.done); },
    missing() { return this.items.filter((i) => !i.done); },
    summary() { const m = this.missing().length; return m ? `Đường lệnh tiền thật chưa viết xong: còn ${m}/${this.items.length} mục an toàn bắt buộc (REQ-SAFE).` : 'Đủ bộ an toàn bắt buộc (REQ-SAFE).'; },
    legalOk: false, // LEGAL-01: tư vấn pháp lý trước khi mở Trading cho người ngoài
  };

  // ── KÊNH THÔNG BÁO NGOÀI MÀN HÌNH (REQ-NOTIFY) ───────────────────
  CP.notify = {
    _all() { return LS('notify') || {}; },
    list() { const u = auth.current(); return u ? (this._all()[u.email] || []) : []; },
    save(l) { const u = auth.current(); if (!u) return; const all = this._all(); all[u.email] = l; LS('notify', all); },
    hasVerified() { return this.list().some((c) => c.verified); },
    add(type, address) { const l = this.list(); if (l.some((c) => c.type === type && c.address === address)) throw new Error('Kênh đã tồn tại'); const c = { id: uid(), type, address, verified: false, addedAt: Date.now(), code: String(100000 + Math.floor(Math.random() * 900000)) }; l.push(c); this.save(l); auth.audit('notify_added', { email: auth.current().email, type }); return c; },
    verify(id, code) { const l = this.list(); const c = l.find((x) => x.id === id); if (!c) throw new Error('Không tìm thấy kênh'); if (c.code !== code) throw new Error('Mã xác minh không đúng'); c.verified = true; c.verifiedAt = Date.now(); delete c.code; this.save(l); auth.audit('notify_verified', { email: auth.current().email, type: c.type }); return c; },
    remove(id) { const l = this.list(); const c = l.find((x) => x.id === id); const rest = l.filter((x) => x.id !== id); if (c && c.verified && !rest.some((x) => x.verified)) bots.stopAll('notify_channel_removed'); this.save(rest); auth.audit('notify_removed', { email: auth.current().email }); },
    events: ['Bot vào chế độ an toàn (kèm nguyên nhân)', 'Bot tự tắt do lỗ ngày', 'Admin dừng toàn hệ', 'Khoá API bị vô hiệu hoặc đổi quyền', 'Đối soát lệch nghiêm trọng', 'Vị thế mất quyền quản lý'],
  };

  // ── MODE PAPER / TRADING (UI-04) ─────────────────────────────────
  CP.mode = {
    get() { return LS('mode') || 'PAPER'; },
    canTrade() {
      const u = auth.current(); const l = link.get();
      const reasons = [];
      if (!u) reasons.push('Chưa đăng nhập');
      else if (!u.twoFA) reasons.push('Chưa bật xác thực hai bước (ACC-03)');
      if (u && !CP.notify.hasVerified()) reasons.push('Chưa có kênh thông báo ngoài màn hình đã xác minh (NOTIFY-01)');
      if (!l) reasons.push('Chưa liên kết Binance');
      else if (l.status !== 'trade') reasons.push('Khoá chỉ có quyền đọc — xem được số dư, chưa đặt lệnh được');
      if (!CP.safe.ready()) reasons.push(CP.safe.summary());
      if (!CP.safe.legalOk) reasons.push('Chưa có tư vấn pháp lý cho việc đặt lệnh hộ người dùng (LEGAL-01)');
      return { ok: reasons.length === 0, reasons };
    },
    set(m) { if (m === 'TRADING' && !this.canTrade().ok) throw new Error('Chưa đủ điều kiện mở TIỀN THẬT'); LS('mode', m); auth.audit('mode_changed', { email: (auth.current() || {}).email, mode: m }); },
  };

  // ── VÍ PAPER (PAPER-01..05) ──────────────────────────────────────
  const MIN_NOTIONAL = 10;
  const paper = {
    MIN_NOTIONAL,
    key() { const u = auth.current(); return u ? u.email : 'anon'; },
    _all() { return LS('paper') || {}; },
    state() {
      const all = this._all(); const k = this.key();
      if (!all[k]) { all[k] = { period: 1, startedAt: Date.now(), cash: 10000, positions: {}, orders: [], fills: [], equityLog: [[Date.now(), 10000]] }; LS('paper', all); }
      return all[k];
    },
    save(s) { const all = this._all(); all[this.key()] = s; LS('paper', all); },
    /** Xem trước lệnh — mọi quy ước hiển thị TRƯỚC khi bấm (PAPER-02). */
    preview({ symbol, side, type, price, quoteQty, baseQty, last }) {
      const s = this.state();
      const px = type === 'LIMIT' ? +price : last;
      const errors = [], warnings = [];
      if (!px || px <= 0) errors.push('Chưa có giá');
      let base = baseQty ? +baseQty : quoteQty ? +quoteQty / px : 0;
      let quote = base * px;
      const pos = s.positions[symbol] || { qty: 0, avg: 0 };
      if (side === 'BUY') {
        const maxQuote = s.cash / (1 + COSTS.taker + (type === 'MARKET' ? COSTS.slippage : 0));
        if (quote > maxQuote + 1e-9) { warnings.push(`Kẹp theo số dư: tối đa ${maxQuote.toFixed(2)} USDT`); quote = maxQuote; base = quote / px; }
      } else {
        if (base > pos.qty + 1e-12) { warnings.push(`Kẹp theo số coin đang giữ: ${pos.qty}`); base = pos.qty; quote = base * px; }
        if (pos.qty <= 0) errors.push('Không có coin để bán (spot — không bán khống)');
      }
      if (quote < MIN_NOTIONAL) errors.push(`Lệnh tối thiểu ${MIN_NOTIONAL} USDT`);
      const fee = quote * COSTS.taker, slip = type === 'MARKET' ? quote * COSTS.slippage : 0;
      const equity = this.equity(last ? { [symbol]: last } : {});
      const pctNav = equity ? (quote / equity) * 100 : 0;
      if (pctNav > 50) warnings.push('Lệnh > 50% số dư — cần xác nhận thêm (UI-10)');
      return { ok: errors.length === 0, errors, warnings, px, base, quote, fee, slip, total: side === 'BUY' ? quote + fee + slip : quote - fee - slip, pctNav, needsConfirm: pctNav > 50 };
    },
    place(req) {
      const pv = this.preview(req); if (!pv.ok) throw new Error(pv.errors[0]);
      const s = this.state();
      const o = { id: uid(), at: Date.now(), symbol: req.symbol, side: req.side, type: req.type, price: pv.px, qty: pv.base, quote: pv.quote, status: 'NEW', mode: 'PAPER', predictionId: req.predictionId || null };
      s.orders.push(o);                                      // append-only, ghi TRƯỚC khi khớp
      if (o.type === 'MARKET') this._fill(s, o, pv.px * (o.side === 'BUY' ? 1 + COSTS.slippage : 1 - COSTS.slippage));
      this.save(s);
      return o;
    },
    _fill(s, o, px) {
      const quote = o.qty * px, fee = quote * COSTS.taker;
      const pos = s.positions[o.symbol] || { qty: 0, avg: 0, realized: 0 };
      if (o.side === 'BUY') { s.cash -= quote + fee; pos.avg = (pos.avg * pos.qty + quote) / (pos.qty + o.qty); pos.qty += o.qty; }
      else { s.cash += quote - fee; pos.realized += (px - pos.avg) * o.qty - fee; pos.qty -= o.qty; if (pos.qty < 1e-12) { pos.qty = 0; pos.avg = 0; } }
      s.positions[o.symbol] = pos;
      o.status = 'FILLED'; o.filledAt = Date.now(); o.fillPrice = px; o.fee = fee;
      s.fills.push({ id: uid(), orderId: o.id, at: o.filledAt, symbol: o.symbol, side: o.side, price: px, qty: o.qty, fee });
    },
    cancel(id) { const s = this.state(); const o = s.orders.find((x) => x.id === id); if (o && o.status === 'NEW') { o.status = 'CANCELED'; o.canceledAt = Date.now(); this.save(s); } },
    cancelAll() { const s = this.state(); s.orders.forEach((o) => { if (o.status === 'NEW') { o.status = 'CANCELED'; o.canceledAt = Date.now(); } }); this.save(s); },
    /** Gọi mỗi tick: khớp lệnh LIMIT khi giá cắt qua; ghi equity. */
    onTick(symbol, last) {
      const s = this.state(); let changed = false;
      s.orders.forEach((o) => { if (o.status === 'NEW' && o.symbol === symbol && ((o.side === 'BUY' && last <= o.price) || (o.side === 'SELL' && last >= o.price))) { this._fill(s, o, o.price); changed = true; } });
      const lastLog = s.equityLog[s.equityLog.length - 1];
      if (!lastLog || Date.now() - lastLog[0] > 60000) { s.equityLog.push([Date.now(), this.equity({ [symbol]: last }, s)]); if (s.equityLog.length > 2000) s.equityLog.shift(); changed = true; }
      if (changed) this.save(s);
      return changed;
    },
    equity(prices = {}, s = this.state()) { return s.cash + Object.entries(s.positions).reduce((a, [sym, p]) => a + p.qty * (prices[sym] || p.avg), 0); },
    reset() { const s = this.state(); const all = this._all(); all[this.key()] = { period: s.period + 1, startedAt: Date.now(), cash: 10000, positions: {}, orders: [], fills: [], equityLog: [[Date.now(), 10000]], archived: (s.archived || []).concat([{ period: s.period, orders: s.orders, fills: s.fills, equityLog: s.equityLog }]) }; LS('paper', all); auth.audit('paper_reset', { email: this.key(), period: s.period + 1 }); },
  };
  CP.paper = paper;

  // ── BOT (BOT-01..09) — PAPER chạy được; TIỀN THẬT chỉ khi đủ REQ-SAFE + kỳ Paper + LEGAL-01 ──
  const bots = {
    _all() { return LS('bots') || {}; },
    list() { return this._all()[paper.key()] || []; },
    save(list) { const all = this._all(); all[paper.key()] = list; LS('bots', all); },
    create({ name, symbol, tier, maxPerTradePct = 1, dailyLossPct = 2, maxExposurePct = 5, mode = 'PAPER' }) {
      if (mode === 'TRADING') { const c = CP.mode.canTrade(); if (!c.ok) throw new Error('Bot TIỀN THẬT chưa phát hành được: ' + c.reasons[0]); const ran = paper.state().archived && paper.state().archived.length; if (!ran) throw new Error('Bạn cần chạy trọn một kỳ bot PAPER của chính mình trước (BOT-01b)'); }
      const b = { id: uid(), name, symbol, tier, maxPerTradePct: Math.min(1, +maxPerTradePct), dailyLossPct: Math.min(2, +dailyLossPct), maxExposurePct: Math.min(5, +maxExposurePct), mode, status: 'OFF', createdAt: Date.now(), log: [], stats: { trades: 0, wins: 0, R: 0 }, dayPnL: 0 };
      const l = this.list(); l.push(b); this.save(l); auth.audit('bot_created', { email: paper.key(), bot: b.id, mode }); return b;
    },
    setStatus(id, status, why = 'user') { const l = this.list(); const b = l.find((x) => x.id === id); if (!b) return; b.status = status; b.log.unshift({ at: Date.now(), kind: 'state', text: `${status === 'ON' ? 'Bật' : 'Tắt'} bởi ${why}` }); this.save(l); auth.audit('bot_' + status.toLowerCase(), { email: paper.key(), bot: id, why }); },
    stopAll(why = 'kill_switch') { const l = this.list(); l.forEach((b) => { if (b.status === 'ON') { b.status = 'OFF'; b.log.unshift({ at: Date.now(), kind: 'kill', text: `KILL SWITCH — dừng (${why}); huỷ lệnh chờ` }); } }); this.save(l); paper.cancelAll(); auth.audit('kill_switch', { email: paper.key(), why }); },
    /** Luật 16: mỗi lần tải trang, mọi bot về TẮT. */
    resetOnBoot() { const l = this.list(); let n = 0; l.forEach((b) => { if (b.status === 'ON') { b.status = 'OFF'; b.log.unshift({ at: Date.now(), kind: 'state', text: 'Khởi động lại → TẮT (Luật 16). Bật tay nếu muốn tiếp tục.' }); n++; } }); this.save(l); return n; },
    /** Gọi khi nến đóng: bot quyết định theo dự đoán đã khoá. */
    onCandleClose(pred, last) {
      if (!pred) return;
      const l = this.list(); let changed = false;
      l.forEach((b) => {
        if (b.status !== 'ON' || b.symbol !== pred.symbol) return;
        const tier = CP.tiers.find((t) => t.id === b.tier) || CP.tiers[1];
        const s = paper.state(); const eq = paper.equity({ [pred.symbol]: last }, s);
        const pos = s.positions[pred.symbol] || { qty: 0 };
        const entry = { at: Date.now(), kind: 'decision', predictionId: pred.id, tier: tier.name, verify: CP.verify.current().label, text: '' };
        if (pred.direction === 'FLAT') entry.text = `Không vào: KHÔNG RÕ (${pred.silenceReason})`;
        else if (pred.level < tier.level) entry.text = `Không vào: mức ${pred.level} dưới tầng ${tier.name} (${tier.level})`;
        else if (pred.direction === 'DOWN') entry.text = 'Không vào: spot chỉ mua-hoặc-đứng-ngoài; tín hiệu GIẢM ⇒ thoát nếu đang giữ' + (pos.qty > 0 ? ' → BÁN' : '');
        else if (pos.qty > 0) entry.text = 'Đang giữ vị thế — không mua thêm (giới hạn exposure)';
        else if (b.dayPnL <= -(b.dailyLossPct / 100) * eq) { entry.text = `Lỗ ngày chạm ${b.dailyLossPct}% NAV → TẮT, không tự bật lại`; b.status = 'OFF'; }
        else {
          const quote = Math.min(eq * b.maxPerTradePct / 100, s.cash * 0.98);
          try { const o = paper.place({ symbol: pred.symbol, side: 'BUY', type: 'MARKET', quoteQty: quote, last, predictionId: pred.id }); entry.text = `MUA ${o.qty.toFixed(6)} @ ${o.fillPrice.toFixed(2)} — ${b.maxPerTradePct}% NAV; SL ${pred.barrier.sl.toFixed(2)} đặt cùng lúc; hết hạn ${new Date(pred.validUntil).toISOString().slice(11, 16)} UTC`; b.stats.trades++; }
          catch (e) { entry.text = 'Không vào: ' + e.message; }
        }
        if (pred.direction === 'DOWN' && pos.qty > 0) { try { paper.place({ symbol: pred.symbol, side: 'SELL', type: 'MARKET', baseQty: pos.qty, last, predictionId: pred.id }); } catch (e) {} }
        b.log.unshift(entry); if (b.log.length > 200) b.log.length = 200; changed = true;
      });
      if (changed) this.save(l);
    },
  };
  CP.bots = bots;


  // ── TÀI KHOẢN DEMO (chỉ prototype) — để người review đi hết luồng không cần đăng ký
  CP.demo = {
    async seed() {
      const email = 'demo@cryptopred.vn', pw = 'Demo-Password-2026';
      if (!auth.users()[email]) await auth.signUp(email, pw, true); else await auth.login(email, pw);
      const users = auth.users(); users[email].twoFA = true; LS('users', users);
      const s = auth.session(); s.twoFAok = true; LS('session', s);
      if (!CP.notify.hasVerified()) { const c = CP.notify.add('email', email); CP.notify.verify(c.id, c.code); }
      if (!link.get()) { try { await link.connect({ apiKey: 'D'.repeat(64), secret: 'S'.repeat(64), simulate: 'ok' }); } catch (e) { /* bỏ qua */ } }
      const ps = paper.state();
      if (!ps.orders.length) {
        const px = (CP.market && CP.market.last && CP.market.last()) || 80000;
        try { paper.place({ symbol: 'BTCUSDT', side: 'BUY', type: 'MARKET', quoteQty: 1500, last: px }); paper.place({ symbol: 'BTCUSDT', side: 'SELL', type: 'LIMIT', price: px * 1.03, baseQty: 0.005, last: px }); } catch (e) { /* bỏ qua */ }
      }
      if (!bots.list().length) { const b = bots.create({ name: 'Bot BTC cân bằng', symbol: 'BTCUSDT', tier: 'balanced' }); b.log.unshift({ at: Date.now() - 36e5, kind: 'decision', predictionId: 'BTCUSDT|demo|0.5|sim', tier: 'Cân bằng', verify: 'chưa kiểm chứng', text: 'Không vào: KHÔNG RÕ (p_up trong vùng ±8 điểm quanh 50%)' }); bots.save(bots.list().map((x) => x.id === b.id ? b : x)); }
      localStorage.setItem('cp15.antiphish', 'cpDEMO26');
      auth.audit('demo_seeded', { email });
      return auth.current();
    },
  };

  // ── Đếm ngược nến (docs/Old/05 §3.4) ─────────────────────────────
  CP.nextClose = (tf) => { const ms = CP.data.TF_MS[tf]; const n = CP.data.now(); return Math.ceil(n / ms) * ms; };
})();
