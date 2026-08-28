/* ══════════════════════════════════════════════════════════════════
   data.js — LỚP DỮ LIỆU THỊ TRƯỜNG (prototype v15)

   Ba đường dữ liệu theo docs/Old/05 §3.6 + skill visualize-dashboard §6:
     · giá/sổ lệnh/khớp lệnh: trình duyệt nối THẲNG Binance (REST + WebSocket
       công khai, không cần API key, không qua backend);
     · dự đoán: chưa có backend M9 → domain.js mô phỏng từ nến đã đóng;
     · lịch sử: REST một lần lúc mở trang.

   Khi không gọi được api.binance.com (artifact chặn mạng ngoài — CSP),
   lớp này tự chuyển sang CP_FALLBACK (ảnh chụp lúc build) và MÔ PHỎNG tick
   bằng bước đi ngẫu nhiên nhỏ. Trạng thái nguồn luôn được công bố qua
   `CP.data.source` để giao diện nói thật (RULE 8).
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const CP = (window.CP = window.CP || {});

  const REST = 'https://api.binance.com/api/v3';
  const WS = 'wss://stream.binance.com:9443/stream?streams=';
  const TF_MS = { '1m': 6e4, '5m': 3e5, '15m': 9e5, '30m': 18e5, '1h': 36e5, '2h': 72e5, '4h': 144e5, '6h': 216e5, '12h': 432e5, '1d': 864e5, '1w': 6048e5 };

  /** Trạng thái độ tươi — 4 mức theo RULE 8. */
  const FRESH = { LIVE: 'live', SLOW: 'slow', DOWN: 'down', STALE: 'stale' };

  const state = {
    source: 'probing',          // 'live' | 'fallback' | 'probing'
    serverOffset: 0,            // serverTime − Date.now()
    lastTick: 0,                // ms — lần cuối nhận tick giá
    wsState: 'idle',            // 'idle' | 'open' | 'closed' | 'error'
    freshness: FRESH.DOWN,
    listeners: new Set(),       // callback(freshness)
  };

  // ── helpers ──────────────────────────────────────────────────────
  const now = () => Date.now() + state.serverOffset;

  function parseKline(r) {
    // Binance kline: [openTime, open, high, low, close, volume, closeTime, quoteVol, trades, ...]
    return { t: r[0], o: +r[1], h: +r[2], l: +r[3], c: +r[4], v: +r[5] };
  }

  async function getJSON(url, ms = 6000) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), ms);
    try {
      const res = await fetch(url, { signal: ctl.signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  function setFreshness(f) {
    if (state.freshness === f) return;
    state.freshness = f;
    state.listeners.forEach((cb) => { try { cb(f); } catch (e) { console.error(e); } });
  }

  // Đồng hồ độ tươi: live < 5s, chậm < 30s, còn lại là mất kết nối.
  setInterval(() => {
    if (state.source === 'fallback') return; // fallback tự đặt trạng thái
    const age = Date.now() - state.lastTick;
    if (!state.lastTick || state.wsState !== 'open') setFreshness(FRESH.DOWN);
    else if (age < 5000) setFreshness(FRESH.LIVE);
    else if (age < 30000) setFreshness(FRESH.SLOW);
    else setFreshness(FRESH.DOWN);
  }, 1000);

  // ── thăm dò nguồn ────────────────────────────────────────────────
  let probe = null;
  function ensureSource() {
    if (probe) return probe;
    probe = (async () => {
      try {
        const t0 = Date.now();
        const { serverTime } = await getJSON(REST + '/time', 4000);
        state.serverOffset = serverTime - (t0 + (Date.now() - t0) / 2);
        state.source = 'live';
      } catch (e) {
        state.source = 'fallback';
        state.serverOffset = 0;
        // Dữ liệu chụp là dữ liệu cũ — không bao giờ tự nhận là Live.
        setFreshness(FRESH.STALE);
      }
      return state.source;
    })();
    return probe;
  }

  // ── REST ─────────────────────────────────────────────────────────
  async function klines(symbol, tf, limit = 240) {
    await ensureSource();
    if (state.source === 'live') {
      try {
        const rows = await getJSON(`${REST}/klines?symbol=${symbol}&interval=${tf}&limit=${limit}`);
        return rows.map(parseKline);
      } catch (e) { /* rơi xuống fallback */ }
    }
    return fallbackKlines(symbol, tf, limit);
  }

  async function tickers() {
    await ensureSource();
    if (state.source === 'live') {
      try {
        const rows = await getJSON(`${REST}/ticker/24hr`, 8000);
        return rows
          .filter((x) => x.symbol.endsWith('USDT') && +x.quoteVolume > 0 && !/UP|DOWN|BEAR|BULL/.test(x.symbol.replace('USDT', '')))
          .map((x) => ({ symbol: x.symbol, last: +x.lastPrice, pct: +x.priceChangePercent, high: +x.highPrice, low: +x.lowPrice, qv: +x.quoteVolume }))
          .sort((a, b) => b.qv - a.qv)
          .slice(0, 200);
      } catch (e) { /* fallback */ }
    }
    const fb = window.CP_FALLBACK;
    return fb ? fb.tickers.map((r) => ({ symbol: r[0], last: r[1], pct: r[2], high: r[3], low: r[4], qv: r[5] })) : [];
  }

  async function depth(symbol, limit = 20) {
    await ensureSource();
    if (state.source === 'live') {
      try {
        const d = await getJSON(`${REST}/depth?symbol=${symbol}&limit=${limit}`);
        return { bids: d.bids.map((x) => [+x[0], +x[1]]), asks: d.asks.map((x) => [+x[0], +x[1]]) };
      } catch (e) { /* fallback */ }
    }
    return fallbackDepth(symbol, limit);
  }

  async function trades(symbol, limit = 40) {
    await ensureSource();
    if (state.source === 'live') {
      try {
        const rows = await getJSON(`${REST}/aggTrades?symbol=${symbol}&limit=${limit}`);
        return rows.map((x) => ({ t: x.T, p: +x.p, q: +x.q, m: x.m }));
      } catch (e) { /* fallback */ }
    }
    return fallbackTrades(symbol, limit);
  }

  // ── WebSocket đa luồng ───────────────────────────────────────────
  // handlers: { kline(k, isClosed), ticker(t), depth(d), trade(tr) }
  let ws = null, wsSubs = [];
  function openWS(streams) {
    if (ws) { try { ws.close(); } catch (e) {} }
    state.wsState = 'idle';
    ws = new WebSocket(WS + streams.join('/'));
    ws.onopen = () => { state.wsState = 'open'; };
    ws.onclose = () => { state.wsState = 'closed'; setFreshness(FRESH.DOWN); };
    ws.onerror = () => { state.wsState = 'error'; };
    ws.onmessage = (ev) => {
      let msg; try { msg = JSON.parse(ev.data); } catch (e) { return; }
      const d = msg.data; if (!d) return;
      state.lastTick = Date.now();
      wsSubs.forEach((s) => {
        if (d.e === 'kline' && d.s === s.symbol && d.k.i === s.tf && s.h.kline) {
          const k = d.k;
          s.h.kline({ t: k.t, o: +k.o, h: +k.h, l: +k.l, c: +k.c, v: +k.v }, k.x);
        } else if (d.e === '24hrTicker' && d.s === s.symbol && s.h.ticker) {
          s.h.ticker({ symbol: d.s, last: +d.c, pct: +d.P, high: +d.h, low: +d.l, qv: +d.q, bid: +d.b, ask: +d.a });
        } else if (d.e === 'depthUpdate' && d.s === s.symbol && s.h.depth) {
          s.h.depth({ bids: d.b.map((x) => [+x[0], +x[1]]), asks: d.a.map((x) => [+x[0], +x[1]]) });
        } else if (d.e === 'aggTrade' && d.s === s.symbol && s.h.trade) {
          s.h.trade({ t: d.T, p: +d.p, q: +d.q, m: d.m });
        }
      });
    };
  }

  /** Đăng ký nhận tick cho một cặp/khung. Trả về hàm huỷ. */
  function subscribe(symbol, tf, h) {
    const sub = { symbol, tf, h, sim: null };
    wsSubs.push(sub);
    ensureSource().then((src) => {
      if (!wsSubs.includes(sub)) return;
      if (src === 'live') {
        const s = symbol.toLowerCase();
        openWS([`${s}@kline_${tf}`, `${s}@ticker`, `${s}@depth20@1000ms`, `${s}@aggTrade`]);
      } else {
        sub.sim = startSim(sub);
      }
    });
    return () => {
      wsSubs = wsSubs.filter((x) => x !== sub);
      if (sub.sim) sub.sim();
      if (!wsSubs.length && ws) { ws.close(); ws = null; }
    };
  }

  // ── FALLBACK: ảnh chụp + mô phỏng ────────────────────────────────
  function fallbackKlines(symbol, tf, limit) {
    const fb = window.CP_FALLBACK; if (!fb) return [];
    const bySym = fb.klines[symbol] || fb.klines.BTCUSDT;
    let rows = bySym[tf];
    if (!rows) {
      // Khung không có trong ảnh chụp → nội suy từ 1h (chỉ để prototype không trống).
      const base = bySym['1h'];
      const n = Math.max(1, Math.round((TF_MS[tf] || 36e5) / 36e5));
      rows = [];
      if (n >= 1 && TF_MS[tf] >= 36e5) {
        for (let i = 0; i + n <= base.length; i += n) {
          const g = base.slice(i, i + n);
          rows.push([g[0][0], g[0][1], Math.max(...g.map((x) => x[2])), Math.min(...g.map((x) => x[3])), g[g.length - 1][4], g.reduce((a, x) => a + x[5], 0)]);
        }
      } else {
        // khung < 1h: chia nến 1h thành các nến con dao động nhẹ
        const m = Math.round(36e5 / (TF_MS[tf] || 36e5));
        base.slice(-Math.ceil(limit / m) - 1).forEach((r) => {
          let p = r[1];
          for (let j = 0; j < m; j++) {
            const tgt = j === m - 1 ? r[4] : r[1] + (r[4] - r[1]) * ((j + 1) / m) + (r[2] - r[3]) * (Math.sin(j * 1.7 + r[0] / 1e7) * 0.18);
            const hi = Math.max(p, tgt) * (1 + 0.0004), lo = Math.min(p, tgt) * (1 - 0.0004);
            rows.push([r[0] + j * TF_MS[tf], p, hi, lo, tgt, r[5] / m]);
            p = tgt;
          }
        });
      }
    }
    return rows.slice(-limit).map((r) => ({ t: r[0], o: r[1], h: r[2], l: r[3], c: r[4], v: r[5] }));
  }

  function lastPriceOf(symbol) {
    const fb = window.CP_FALLBACK; if (!fb) return 100;
    const t = fb.tickers.find((r) => r[0] === symbol);
    if (t) return t[1];
    const k = fb.klines[symbol]; if (k && k['1h']) return k['1h'][k['1h'].length - 1][4];
    return 100;
  }

  function fallbackDepth(symbol, limit) {
    const fb = window.CP_FALLBACK;
    if (fb && fb.depth[symbol]) return fb.depth[symbol];
    const p = lastPriceOf(symbol), tick = p > 1000 ? 0.1 : p > 10 ? 0.01 : 0.0001;
    const bids = [], asks = [];
    for (let i = 1; i <= limit; i++) {
      bids.push([+(p - i * tick * 5).toFixed(6), +(Math.random() * 2 + 0.1).toFixed(4)]);
      asks.push([+(p + i * tick * 5).toFixed(6), +(Math.random() * 2 + 0.1).toFixed(4)]);
    }
    return { bids, asks };
  }

  function fallbackTrades(symbol, limit) {
    const fb = window.CP_FALLBACK;
    if (fb && fb.trades[symbol]) return fb.trades[symbol].slice(-limit).map((r) => ({ t: r[0], p: r[1], q: r[2], m: r[3] }));
    const p = lastPriceOf(symbol), out = [];
    for (let i = 0; i < limit; i++) out.push({ t: Date.now() - (limit - i) * 900, p: p * (1 + (Math.random() - 0.5) * 0.0006), q: +(Math.random()).toFixed(4), m: Math.random() < 0.5 });
    return out;
  }

  /** Mô phỏng tick khi không có mạng: bước đi ngẫu nhiên nhỏ quanh giá cuối. */
  function startSim(sub) {
    const ks = fallbackKlines(sub.symbol, sub.tf, 2);
    let cur = ks.length ? { ...ks[ks.length - 1] } : { t: Date.now(), o: 100, h: 100, l: 100, c: 100, v: 0 };
    const t0 = fallbackTickerOf(sub.symbol);
    let hi = t0.high, lo = t0.low;
    const tfms = TF_MS[sub.tf] || 36e5;
    // Nến mô phỏng bắt đầu từ "bây giờ" để countdown có nghĩa.
    cur = { t: Math.floor(Date.now() / tfms) * tfms, o: cur.c, h: cur.c, l: cur.c, c: cur.c, v: 0 };
    const id = setInterval(() => {
      const step = cur.c * (Math.random() - 0.5) * 0.0008;
      cur.c = +(cur.c + step).toFixed(8);
      cur.h = Math.max(cur.h, cur.c); cur.l = Math.min(cur.l, cur.c); cur.v += Math.random() * 0.5;
      hi = Math.max(hi, cur.c); lo = Math.min(lo, cur.c);
      state.lastTick = Date.now();
      setFreshness(FRESH.STALE); // dữ liệu mô phỏng — không bao giờ nhận là Live
      let closed = false;
      if (Date.now() >= cur.t + tfms) { closed = true; }
      sub.h.kline && sub.h.kline({ ...cur }, closed);
      if (closed) cur = { t: cur.t + tfms, o: cur.c, h: cur.c, l: cur.c, c: cur.c, v: 0 };
      sub.h.ticker && sub.h.ticker({ symbol: sub.symbol, last: cur.c, pct: (cur.c / t0.open - 1) * 100, high: hi, low: lo, qv: t0.qv, bid: cur.c * 0.99999, ask: cur.c * 1.00001 });
      if (sub.h.trade && Math.random() < 0.7) sub.h.trade({ t: Date.now(), p: cur.c, q: +(Math.random() * 0.8).toFixed(4), m: step < 0 });
      if (sub.h.depth && Math.random() < 0.3) sub.h.depth(fallbackDepth(sub.symbol, 20));
    }, 1000);
    return () => clearInterval(id);
  }

  function fallbackTickerOf(symbol) {
    const fb = window.CP_FALLBACK;
    const t = fb && fb.tickers.find((r) => r[0] === symbol);
    const last = t ? t[1] : lastPriceOf(symbol);
    const pct = t ? t[2] : 0;
    return { last, pct, high: t ? t[3] : last * 1.02, low: t ? t[4] : last * 0.98, qv: t ? t[5] : 0, open: last / (1 + pct / 100) };
  }

  // ── công khai ────────────────────────────────────────────────────
  CP.data = {
    FRESH, TF_MS,
    get source() { return state.source; },
    get freshness() { return state.freshness; },
    get lastTick() { return state.lastTick; },
    now, ensureSource, klines, tickers, depth, trades, subscribe,
    onFreshness(cb) { state.listeners.add(cb); return () => state.listeners.delete(cb); },
  };
})();
