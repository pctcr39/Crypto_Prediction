/* ══════════════════════════════════════════════════════════════════
   core.js — KHUNG ỨNG DỤNG prototype v15
     · CP.state   — trạng thái dùng chung (cặp, khung, tầng, mode, theme), có subscribe
     · CP.router  — điều hướng theo hash, màn nào cần đăng nhập
     · CP.ui      — DOM helper + định dạng số/thời gian + component dùng chung
     · CP.market  — phiên thị trường dùng chung: nến, tick, dự đoán khoá khi nến đóng
     · CP.chart   — CandleChart: nến + nón dự đoán tím + crosshair + bảng số
     · CP.charts  — line/sparkline/bars nhỏ cho các panel khác
   Màu KHÔNG viết trong file này — đọc từ token lúc vẽ (DS-RULE 8).
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const CP = (window.CP = window.CP || {});
  const LS = (k, v) => { try { if (v === undefined) { const s = localStorage.getItem('cp15.' + k); return s ? JSON.parse(s) : null; } localStorage.setItem('cp15.' + k, JSON.stringify(v)); } catch (e) { return null; } };

  // ── STATE ────────────────────────────────────────────────────────
  const saved = LS('state') || {};
  const state = {
    symbol: saved.symbol || 'BTCUSDT', tf: saved.tf || '1h', tier: saved.tier || 'balanced',
    theme: saved.theme || 'dark', lang: saved.lang || 'vi', layout: saved.layout || 'standard',
    favorites: saved.favorites || ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'],
  };
  const subs = new Set();
  CP.state = {
    get: (k) => state[k],
    all: () => ({ ...state }),
    set(patch) {
      const changed = Object.keys(patch).filter((k) => state[k] !== patch[k]);
      if (!changed.length) return;
      Object.assign(state, patch);
      LS('state', state);
      subs.forEach((cb) => { try { cb(changed, state); } catch (e) { console.error(e); } });
    },
    subscribe(cb) { subs.add(cb); return () => subs.delete(cb); },
  };

  // ── UI HELPERS ───────────────────────────────────────────────────
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k === 'html') el.innerHTML = v;   // chỉ dùng với chuỗi do mã tạo, không với dữ liệu ngoài
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat(Infinity)) { if (c == null || c === false) continue; el.append(c instanceof Node ? c : document.createTextNode(String(c))); }
    return el;
  }
  const clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };
  /** Gắn nhiều con vào el: trải mảng, bỏ null/false (DOM.append không làm việc này). */
  const put = (el, ...kids) => { kids.flat(Infinity).forEach((c) => { if (c == null || c === false) return; el.append(c instanceof Node ? c : document.createTextNode(String(c))); }); return el; };

  // Định dạng số — DS-RULE 1: mọi số đi với class .num (font mono, tabular)
  const priceDp = (p) => (p >= 10000 ? 1 : p >= 1000 ? 2 : p >= 100 ? 2 : p >= 1 ? 3 : p >= 0.01 ? 5 : 7);
  const fmt = {
    price: (p, dp) => (p == null || isNaN(p) ? '—' : (+p).toLocaleString('en-US', { minimumFractionDigits: dp ?? priceDp(p), maximumFractionDigits: dp ?? priceDp(p) })),
    pct: (x, dp = 2, sign = true) => (x == null || isNaN(x) ? '—' : (sign && x > 0 ? '+' : '') + (+x).toFixed(dp) + '%'),
    num: (x, dp = 2) => (x == null || isNaN(x) ? '—' : (+x).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })),
    compact: (x) => (x == null || isNaN(x) ? '—' : Math.abs(x) >= 1e9 ? (x / 1e9).toFixed(2) + 'B' : Math.abs(x) >= 1e6 ? (x / 1e6).toFixed(2) + 'M' : Math.abs(x) >= 1e3 ? (x / 1e3).toFixed(1) + 'K' : (+x).toFixed(2)),
    qty: (q) => (q == null ? '—' : q >= 100 ? q.toFixed(2) : q >= 1 ? q.toFixed(4) : q.toFixed(6)),
    timeUTC: (t) => { const d = new Date(t); return d.toISOString().slice(11, 16); },
    dateUTC: (t) => new Date(t).toISOString().slice(5, 10).replace('-', '/'),
    dateTimeUTC: (t) => { const d = new Date(t).toISOString(); return d.slice(5, 10).replace('-', '/') + ' ' + d.slice(11, 16); },
    local: (t) => new Date(t).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
    countdown: (ms) => { if (ms < 0) ms = 0; const s = Math.floor(ms / 1000); const hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60; return (hh ? hh + ':' : '') + String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0'); },
    ago: (t) => { const s = Math.max(0, Math.round((Date.now() - t) / 1000)); return s < 60 ? s + ' giây' : s < 3600 ? Math.floor(s / 60) + ' phút' : Math.floor(s / 3600) + ' giờ'; },
    base: (sym) => sym.replace(/USDT$/, ''),
  };

  const DIR = {
    UP: { arrow: '▲', text: 'TĂNG', cls: 'up' },
    DOWN: { arrow: '▼', text: 'GIẢM', cls: 'down' },
    FLAT: { arrow: '●', text: 'KHÔNG RÕ', cls: 'flat' },
  };
  const FRESH_LABEL = { live: 'Live', slow: 'Chậm', down: 'Mất kết nối', stale: 'Dữ liệu cũ' };

  const ui = {
    h, clear, put, fmt, DIR, FRESH_LABEL,
    /** DirectionBadge — màu + ký hiệu + chữ (DS-RULE 3). p = độ tin cậy của hướng đang hiện. */
    dirBadge(dir, p, opts = {}) {
      const d = DIR[dir] || DIR.FLAT;
      const conf = dir === 'UP' ? p : dir === 'DOWN' ? 1 - p : null;
      return h('span', { class: `badge badge-${d.cls} ${opts.size || ''}`, role: 'status', 'aria-label': `${d.text}${conf != null ? ' ' + Math.round(conf * 100) + '%' : ''}` },
        h('span', { class: 'badge-arrow', 'aria-hidden': 'true' }, d.arrow), h('span', { class: 'badge-text' }, d.text),
        conf != null && h('span', { class: 'badge-p num' }, Math.round(conf * 100) + '%'));
    },
    /** FreshnessIndicator — 4 trạng thái, luôn hiện (RULE 8). */
    freshness(status, lastAt, label) {
      return h('span', { class: `fresh fresh-${status}`, title: lastAt ? 'Cập nhật ' + fmt.ago(lastAt) + ' trước' : '' },
        h('span', { class: 'fresh-dot', 'aria-hidden': 'true' }), h('span', {}, (label ? label + ' · ' : '') + FRESH_LABEL[status]),
        (lastAt && status !== 'live') ? h('span', { class: 'fresh-at num' }, fmt.timeUTC(lastAt)) : null);
    },
    chip(text, cls = '') { return h('span', { class: 'chip ' + cls }, text); },
    modeTag(mode) { return h('span', { class: 'modetag modetag-' + (mode === 'TRADING' ? 'real' : 'paper'), 'aria-label': 'Chế độ ' + mode }, mode === 'TRADING' ? 'TIỀN THẬT' : 'PAPER'); },
    kbd(k) { return h('kbd', {}, k); },
    /** Panel chuẩn: tiêu đề + hành động + thân; gập được. */
    panel({ id, title, subtitle, actions = [], body, collapsible = true, cls = '' }) {
      const collapsed = collapsible && (LS('collapsed') || {})[id];
      const bodyEl = h('div', { class: 'panel-body' }, body);
      const btn = collapsible && h('button', { class: 'ibtn panel-toggle', 'aria-expanded': String(!collapsed), 'aria-label': (collapsed ? 'Mở ' : 'Gập ') + title, onClick: () => { const c = LS('collapsed') || {}; c[id] = !c[id]; LS('collapsed', c); el.classList.toggle('is-collapsed', c[id]); btn.setAttribute('aria-expanded', String(!c[id])); } }, h('span', { class: 'chev', 'aria-hidden': 'true' }));
      const el = h('section', { class: `panel ${cls} ${collapsed ? 'is-collapsed' : ''}`, id: 'panel-' + id, 'aria-label': title },
        h('header', { class: 'panel-head' }, h('div', { class: 'panel-title' }, h('h2', {}, title), subtitle && h('span', { class: 'panel-sub' }, subtitle)), h('div', { class: 'panel-actions' }, actions, btn)),
        bodyEl);
      return el;
    },
    toast(msg, kind = 'info', ms = 3500) {
      let host = document.getElementById('toasts'); if (!host) { host = h('div', { id: 'toasts', 'aria-live': 'polite' }); document.body.append(host); }
      const t = h('div', { class: 'toast toast-' + kind, role: kind === 'error' ? 'alert' : 'status' }, msg); host.append(t);
      setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 200); }, ms);
    },
    /** Hộp thoại xác nhận — trả Promise<boolean>. Không dark pattern: nút huỷ ngang hàng. */
    confirm({ title, body, okText = 'Xác nhận', cancelText = 'Huỷ', danger = false, requireText = null }) {
      return new Promise((resolve) => {
        let input;
        const close = (v) => { wrap.remove(); document.removeEventListener('keydown', onKey); resolve(v); };
        const onKey = (e) => { if (e.key === 'Escape') close(false); };
        const okBtn = h('button', { class: 'btn ' + (danger ? 'btn-danger' : 'btn-primary'), disabled: !!requireText, onClick: () => close(true) }, okText);
        if (requireText) input = h('input', { class: 'input', placeholder: `Gõ "${requireText}" để xác nhận`, onInput: (e) => { okBtn.disabled = e.target.value.trim() !== requireText; } });
        const wrap = h('div', { class: 'modal-wrap', onClick: (e) => { if (e.target === wrap) close(false); } },
          h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'mtitle' },
            h('h3', { id: 'mtitle' }, title), h('div', { class: 'modal-body' }, body), input,
            h('div', { class: 'modal-actions' }, h('button', { class: 'btn', onClick: () => close(false) }, cancelText), okBtn)));
        document.body.append(wrap); document.addEventListener('keydown', onKey); (input || okBtn).focus();
      });
    },
    modal({ title, body, wide = false }) {
      const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey); };
      const onKey = (e) => { if (e.key === 'Escape') close(); };
      const wrap = h('div', { class: 'modal-wrap', onClick: (e) => { if (e.target === wrap) close(); } },
        h('div', { class: 'modal ' + (wide ? 'modal-wide' : ''), role: 'dialog', 'aria-modal': 'true' },
          h('div', { class: 'modal-head' }, h('h3', {}, title), h('button', { class: 'ibtn', 'aria-label': 'Đóng', onClick: close }, '✕')),
          h('div', { class: 'modal-body' }, typeof body === 'function' ? body(close) : body)));
      document.body.append(wrap); document.addEventListener('keydown', onKey);
      return close;
    },
    /** Bảng đơn giản từ mảng hàng; cells có thể là Node. */
    table(headers, rows, opts = {}) {
      return h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl ' + (opts.cls || '') },
        h('thead', {}, h('tr', {}, headers.map((x) => h('th', { scope: 'col', class: x.num ? 'num-col' : '' }, x.label ?? x)))),
        h('tbody', {}, rows.length ? rows.map((r) => h('tr', {}, r.map((c, i) => h('td', { class: (headers[i] && headers[i].num) ? 'num' : '' }, c)))) : h('tr', {}, h('td', { colspan: headers.length, class: 'empty' }, opts.empty || 'Chưa có dữ liệu')))));
    },
    empty(text, hint) { return h('div', { class: 'empty-state' }, h('p', {}, text), hint && h('p', { class: 'hint' }, hint)); },
    skeleton(hgt = 120) { return h('div', { class: 'skeleton', style: { height: hgt + 'px' }, 'aria-hidden': 'true' }); },
    /** Sparkline SVG 1 chuỗi, màu theo token (ink = --text-2 hoặc up/down). */
    sparkline(values, { w = 96, hgt = 28, cls = '' } = {}) {
      if (!values || values.length < 2) return h('span', { class: 'spark-empty' });
      const mn = Math.min(...values), mx = Math.max(...values), rng = mx - mn || 1;
      const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${hgt - 2 - ((v - mn) / rng) * (hgt - 4)}`).join(' ');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', `0 0 ${w} ${hgt}`); svg.setAttribute('class', 'spark ' + cls); svg.setAttribute('aria-hidden', 'true');
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'polyline'); p.setAttribute('points', pts); p.setAttribute('fill', 'none'); p.setAttribute('stroke', 'currentColor'); p.setAttribute('stroke-width', '1.5'); p.setAttribute('stroke-linejoin', 'round');
      svg.append(p); return svg;
    },
    /** Thanh xác suất 6px với vạch 50% (02 §4.2). */
    probMeter(dir, pUp, pReq) {
      const conf = dir === 'DOWN' ? 1 - pUp : pUp;
      const el = h('div', { class: 'pmeter', role: 'img', 'aria-label': `Độ tin cậy ${Math.round(conf * 100)}%, ngưỡng hoà vốn ${Math.round(pReq * 100)}%` },
        h('div', { class: 'pmeter-track' }, h('div', { class: `pmeter-fill fill-${DIR[dir]?.cls || 'flat'}`, style: { width: (conf * 100).toFixed(1) + '%' } }), h('div', { class: 'pmeter-mid', 'aria-hidden': 'true' }), pReq != null && h('div', { class: 'pmeter-req', style: { left: (pReq * 100).toFixed(1) + '%' }, title: 'Ngưỡng thắng cần để hoà vốn' })),
        h('div', { class: 'pmeter-labels' }, h('span', {}, '0'), h('span', {}, '50%'), h('span', {}, '100')));
      return el;
    },
    formRow(label, control, hint) { return h('label', { class: 'frow' }, h('span', { class: 'flabel' }, label), control, hint && h('span', { class: 'fhint' }, hint)); },
    /** Chèn CSS riêng của một màn (một lần). Không mã hex — chỉ var(--token). */
    injectCSS(id, text) { if (document.getElementById('css-' + id)) return; const st = document.createElement('style'); st.id = 'css-' + id; st.textContent = text; document.head.append(st); },
    /** Lỗi hiển thị cạnh nút, không chỉ trong log (UI-10). */
    inlineError(el, msg) { let e = el.querySelector(':scope > .inline-err'); if (!msg) { e && e.remove(); return; } if (!e) { e = h('div', { class: 'inline-err', role: 'alert' }); el.append(e); } e.textContent = msg; },
  };
  CP.ui = ui;

  // ── THEME ────────────────────────────────────────────────────────
  CP.applyTheme = (t) => { document.documentElement.setAttribute('data-theme', t); CP.state.set({ theme: t }); window.dispatchEvent(new Event('cp:theme')); };
  CP.tokens = (names) => { const cs = getComputedStyle(document.documentElement); const o = {}; names.forEach((n) => (o[n] = cs.getPropertyValue('--' + n).trim())); return o; };

  // ── ROUTER ───────────────────────────────────────────────────────
  const screens = {};
  let active = null;
  CP.screens = {
    register(name, def) { screens[name] = def; },
    get: (n) => screens[n],
    names: () => Object.keys(screens),
  };
  CP.router = {
    current: null,
    go(name, params = {}) { location.hash = '#/' + name + (Object.keys(params).length ? '?' + new URLSearchParams(params) : ''); },
    parse() { const m = location.hash.match(/^#\/([a-z-]+)(?:\?(.*))?/); return { name: m ? m[1] : 'trade', params: m && m[2] ? Object.fromEntries(new URLSearchParams(m[2])) : {} }; },
    render() {
      const { name, params } = this.parse();
      const def = screens[name] || screens.trade || { title: name, mount: (o) => o.append(ui.empty('Màn "' + name + '" chưa được dựng')) };
      const user = CP.auth.current();
      if (def.auth && !user && !params.preview) { location.hash = '#/auth?next=' + name; return; } // ?preview=1: xem màn không cần đăng nhập (chỉ prototype)
      const outlet = document.getElementById('outlet');
      if (active && active.unmount) { try { active.unmount(); } catch (e) { console.error(e); } }
      clear(outlet);
      outlet.className = 'outlet screen-' + name;
      active = def; this.current = name;
      document.title = (def.title || name) + ' · cryptopred';
      document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('is-active', a.dataset.nav === name));
      try { def.mount(outlet, { params, user }); } catch (e) { console.error(e); outlet.append(ui.empty('Màn hình gặp lỗi khi dựng', String(e.message))); }
      window.scrollTo(0, 0);
    },
  };

  // ── MARKET SESSION (dùng chung giữa các màn) ─────────────────────
  // Sự kiện: 'klines' (tải xong), 'tick' (kline dở dang + ticker), 'closed' (nến đóng → dự đoán mới),
  //          'depth', 'trade', 'fresh', 'tickers'
  const mk = {
    symbol: null, tf: null, klines: [], ticker: null, depth: null, trades: [], pred: null, hist: [], model: null, tickersList: [], predAt: 0,
    listeners: {}, unsub: null, loading: false, symbolMeta: {},
    on(ev, cb) { (this.listeners[ev] = this.listeners[ev] || new Set()).add(cb); return () => this.listeners[ev].delete(cb); },
    emit(ev, ...a) { (this.listeners[ev] || []).forEach((cb) => { try { cb(...a); } catch (e) { console.error(e); } }); },
    async load(symbol, tf) {
      if (this.symbol === symbol && this.tf === tf && this.klines.length) return;
      this.symbol = symbol; this.tf = tf; this.loading = true; this.emit('loading');
      if (this.unsub) { this.unsub(); this.unsub = null; }
      const ks = await CP.data.klines(symbol, tf, 240);
      if (this.symbol !== symbol || this.tf !== tf) return;
      this.klines = ks; this.recompute(); this.loading = false;
      this.emit('klines', ks);
      CP.data.depth(symbol).then((d) => { if (this.symbol === symbol) { this.depth = d; this.emit('depth', d); } });
      CP.data.trades(symbol).then((t) => { if (this.symbol === symbol) { this.trades = t; this.emit('trade', t); } });
      this.unsub = CP.data.subscribe(symbol, tf, {
        kline: (k, closed) => {
          const last = this.klines[this.klines.length - 1];
          if (last && k.t === last.t) Object.assign(last, k);
          else if (!last || k.t > last.t) { this.klines.push(k); if (this.klines.length > 400) this.klines.shift(); }
          if (closed) { this.recompute(); this.emit('closed', this.pred); CP.bots.onCandleClose(this.pred, k.c); }
          CP.paper.onTick(symbol, k.c);
          this.emit('tick', k, this.ticker);
        },
        ticker: (t) => { this.ticker = t; this.emit('ticker', t); },
        depth: (d) => { this.depth = d; this.emit('depth', d); },
        trade: (tr) => { this.trades.push(tr); if (this.trades.length > 60) this.trades.shift(); this.emit('trade', this.trades); },
      });
    },
    recompute() {
      const s = CP.pred.series(this.klines, this.tf, this.symbol, { back: 150 });
      this.pred = s.current; this.hist = s.history; this.model = s.model; this.predAt = Date.now();
    },
    closed() { return this.klines.slice(0, -1); },
    last() { return this.ticker ? this.ticker.last : this.klines.length ? this.klines[this.klines.length - 1].c : null; },
    async loadTickers() { this.tickersList = await CP.data.tickers(); this.emit('tickers', this.tickersList); return this.tickersList; },
  };
  CP.data.onFreshness((f) => mk.emit('fresh', f));
  CP.market = mk;

  // ── CANDLE CHART ─────────────────────────────────────────────────
  /**
   * CandleChart(container, opts)
   *   opts: { getKlines(), getPred(), getHist(), onHover(k|null) }
   *   API : draw(), setVisible(n), resize(), destroy(), tableView()
   * Vẽ theo docs/Old/02 §3: nến đặc, bấc 1px, khe 2px; q50 nét đứt tím 2px; dải q10–q90 tô --pred-band;
   * vách "Bây giờ" 1px --border; lưới chỉ ngang 20%; trục không vẽ đường; crosshair + tooltip; chấm ✓/✗ viền tím.
   */
  class CandleChart {
    constructor(container, opts) {
      this.c = container; this.o = opts;
      this.canvas = h('canvas', { class: 'chart-canvas', tabindex: '0', role: 'img', 'aria-label': 'Biểu đồ nến kèm dự đoán' });
      this.tip = h('div', { class: 'chart-tip', hidden: true });
      this.c.append(this.canvas, this.tip);
      this.ctx = this.canvas.getContext('2d');
      this.visible = 90; this.offset = 0; this.hover = null; this.futureBars = 0;
      this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(this.c);
      this._bind();
      this.resize();
      this._themeH = () => this.draw(); window.addEventListener('cp:theme', this._themeH);
    }
    _bind() {
      const cv = this.canvas;
      cv.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); this._hoverAt(e.clientX - r.left, e.clientY - r.top); });
      cv.addEventListener('pointerleave', () => { this.hover = null; this.tip.hidden = true; this.draw(); this.o.onHover && this.o.onHover(null); });
      cv.addEventListener('wheel', (e) => { e.preventDefault(); const d = Math.sign(e.deltaY); this.setVisible(this.visible + d * Math.max(4, Math.round(this.visible * 0.1))); }, { passive: false });
      let drag = null;
      cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, off: this.offset }; cv.setPointerCapture(e.pointerId); });
      cv.addEventListener('pointerup', () => { drag = null; });
      cv.addEventListener('pointermove', (e) => { if (!drag) return; const dx = e.clientX - drag.x; const bars = Math.round(dx / this.barW); this.offset = Math.max(0, Math.min((this.o.getKlines().length - 10), drag.off + bars)); this.draw(); });
      cv.addEventListener('keydown', (e) => { if (e.key === '+' || e.key === '=') this.setVisible(this.visible - 10); else if (e.key === '-') this.setVisible(this.visible + 10); else if (e.key === 'ArrowLeft') { this.offset = Math.min(this.o.getKlines().length - 10, this.offset + 5); this.draw(); } else if (e.key === 'ArrowRight') { this.offset = Math.max(0, this.offset - 5); this.draw(); } });
    }
    setVisible(n) { this.visible = Math.max(20, Math.min(300, n)); this.draw(); }
    resize() { const r = this.c.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1; this.w = Math.max(10, r.width); this.hgt = Math.max(10, r.height); this.canvas.width = this.w * dpr; this.canvas.height = this.hgt * dpr; this.canvas.style.width = this.w + 'px'; this.canvas.style.height = this.hgt + 'px'; this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); this.draw(); }
    destroy() { this.ro.disconnect(); window.removeEventListener('cp:theme', this._themeH); }
    _layout() {
      const ks = this.o.getKlines(); const pred = this.o.getPred();
      const tfms = CP.data.TF_MS[CP.market.tf] || 36e5;
      this.futureBars = pred ? Math.max(2, Math.ceil((pred.validUntil - pred.issuedAt) / tfms) + 1) : 0;
      const padR = 64, padB = 22, padT = 8, padL = 4;
      const plotW = this.w - padR - padL, plotH = this.hgt - padB - padT;
      const total = this.visible + this.futureBars;
      const barW = plotW / total;
      const end = ks.length - this.offset, start = Math.max(0, end - this.visible);
      const vis = ks.slice(start, end);
      let lo = Infinity, hi = -Infinity;
      vis.forEach((k) => { if (k.l < lo) lo = k.l; if (k.h > hi) hi = k.h; });
      if (pred && this.offset === 0) { lo = Math.min(lo, pred.q10 * 0.999); hi = Math.max(hi, pred.q90 * 1.001); }
      if (!isFinite(lo)) { lo = 0; hi = 1; }
      const pad = (hi - lo) * 0.06 || 1; lo -= pad; hi += pad;
      const y = (p) => padT + (1 - (p - lo) / (hi - lo)) * plotH;
      const x = (i) => padL + (i - start) * barW + barW / 2;   // i = chỉ số trong ks (có thể vượt end cho tương lai)
      Object.assign(this, { ks, pred, vis, start, end, lo, hi, y, x, barW, padR, padB, padT, padL, plotW, plotH, tfms });
    }
    draw() {
      if (!this.ctx || !this.o.getKlines().length) return;
      this._layout();
      const T = CP.tokens(['up', 'down', 'pred', 'pred-band', 'text-2', 'text-3', 'border', 'surface-1', 'accent', 'grid']);
      const g = this.ctx; g.clearRect(0, 0, this.w, this.hgt);
      g.font = '500 10.5px ' + (getComputedStyle(document.documentElement).getPropertyValue('--font-num') || 'monospace');
      // Lưới ngang + nhãn giá
      const ticks = 5; g.strokeStyle = T.grid || T.border; g.lineWidth = 1; g.fillStyle = T['text-2']; g.textAlign = 'left'; g.textBaseline = 'middle';
      for (let i = 0; i <= ticks; i++) { const p = this.lo + ((this.hi - this.lo) * i) / ticks; const yy = Math.round(this.y(p)) + 0.5; g.globalAlpha = 0.35; g.beginPath(); g.moveTo(this.padL, yy); g.lineTo(this.w - this.padR, yy); g.stroke(); g.globalAlpha = 1; g.fillText(fmt.price(p), this.w - this.padR + 6, yy); }
      // Nhãn thời gian (UTC) — cả hai phía ranh giới
      g.textAlign = 'center'; g.textBaseline = 'top'; g.fillStyle = T['text-3'];
      const every = Math.max(1, Math.round(this.visible / 6));
      for (let i = this.start; i < this.end + this.futureBars; i += every) {
        const t = i < this.ks.length ? this.ks[i].t : this.ks[this.ks.length - 1].t + (i - this.ks.length + 1) * this.tfms;
        const lbl = this.tfms >= 864e5 ? fmt.dateUTC(t) : fmt.timeUTC(t);
        g.fillText(lbl, this.x(i), this.hgt - this.padB + 6);
      }
      // Nến
      const bodyW = Math.max(1, this.barW - 2);
      this.vis.forEach((k, j) => {
        const i = this.start + j; const xx = this.x(i); const up = k.c >= k.o; g.strokeStyle = g.fillStyle = up ? T.up : T.down; g.lineWidth = 1;
        g.beginPath(); g.moveTo(Math.round(xx) + 0.5, this.y(k.h)); g.lineTo(Math.round(xx) + 0.5, this.y(k.l)); g.stroke();
        const y1 = this.y(Math.max(k.o, k.c)), y2 = this.y(Math.min(k.o, k.c));
        g.fillRect(Math.round(xx - bodyW / 2), y1, bodyW, Math.max(1, y2 - y1));
      });
      // Nến đang hình thành: viền rỗng để phân biệt (chưa đóng)
      if (this.offset === 0 && this.vis.length) { const k = this.vis[this.vis.length - 1]; const xx = this.x(this.ks.length - 1); g.strokeStyle = T['text-2']; g.lineWidth = 1; g.strokeRect(Math.round(xx - bodyW / 2) + 0.5, this.y(Math.max(k.o, k.c)) + 0.5, bodyW - 1, Math.max(1, this.y(Math.min(k.o, k.c)) - this.y(Math.max(k.o, k.c))) - 1); }
      // Đường giá hiện tại — 1px nét đứt --text-2, nhãn ghim phải
      const last = this.ks[this.ks.length - 1];
      if (last && this.offset === 0) { const yy = Math.round(this.y(last.c)) + 0.5; g.setLineDash([3, 3]); g.strokeStyle = T['text-2']; g.beginPath(); g.moveTo(this.padL, yy); g.lineTo(this.w - this.padR, yy); g.stroke(); g.setLineDash([]); g.fillStyle = last.c >= last.o ? T.up : T.down; const lbl = fmt.price(last.c); const tw = g.measureText(lbl).width + 8; g.fillRect(this.w - this.padR + 2, yy - 8, tw, 16); g.fillStyle = T['surface-1']; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(lbl, this.w - this.padR + 6, yy); }
      // Vách "Bây giờ" + dự đoán
      if (this.pred && this.offset === 0) {
        const p = this.pred; const iNow = this.ks.length - 2 + 0.5;           // giữa nến đóng cuối và nến đang hình thành
        const xNow = Math.round(this.x(iNow)) + 0.5;
        g.strokeStyle = T.border; g.lineWidth = 1; g.beginPath(); g.moveTo(xNow, this.padT); g.lineTo(xNow, this.hgt - this.padB); g.stroke();
        g.fillStyle = T['text-3']; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('Bây giờ', xNow + 4, this.padT + 2);
        const iAnchor = this.ks.length - 2; const iEnd = iAnchor + (p.validUntil - p.issuedAt) / this.tfms + 1;
        const xa = this.x(iAnchor), xe = this.x(iEnd);
        // dải q10–q90: hình nón từ điểm neo mở rộng theo √t
        g.fillStyle = T['pred-band'] || 'rgba(139,123,232,.14)'; g.beginPath(); g.moveTo(xa, this.y(p.anchor));
        const N = 12; for (let s = 1; s <= N; s++) { const f = s / N; const sq = Math.sqrt(f); g.lineTo(xa + (xe - xa) * f, this.y(p.anchor * Math.pow(p.q90 / p.anchor, sq) * Math.pow(p.q50 / p.anchor, f - sq))); }
        for (let s = N; s >= 1; s--) { const f = s / N; const sq = Math.sqrt(f); g.lineTo(xa + (xe - xa) * f, this.y(p.anchor * Math.pow(p.q10 / p.anchor, sq) * Math.pow(p.q50 / p.anchor, f - sq))); }
        g.closePath(); g.fill();
        // q50 nét đứt tím 2px
        g.strokeStyle = T.pred; g.lineWidth = 2; g.setLineDash([6, 4]); g.beginPath(); g.moveTo(xa, this.y(p.anchor)); g.lineTo(xe, this.y(p.q50)); g.stroke(); g.setLineDash([]);
        // điểm neo 8px viền 2px --surface-1
        [[xa, p.anchor], [xe, p.q50]].forEach(([xx, pp]) => { g.beginPath(); g.arc(xx, this.y(pp), 4, 0, Math.PI * 2); g.fillStyle = T.pred; g.fill(); g.lineWidth = 2; g.strokeStyle = T['surface-1']; g.stroke(); });
        // nhãn q10/q50/q90 phía phải
        g.fillStyle = T.pred; g.textAlign = 'left'; g.textBaseline = 'middle'; g.font = 'italic 500 10.5px ' + (getComputedStyle(document.documentElement).getPropertyValue('--font-num') || 'monospace');
        [['q90', p.q90], ['q50', p.q50], ['q10', p.q10]].forEach(([n, v]) => g.fillText(n + ' ' + fmt.price(v), Math.min(xe + 6, this.w - this.padR + 2), this.y(v)));
        // SL/TP rào chắn (nếu có hướng) — nét chấm mảnh tím
        if (p.direction !== 'FLAT') { g.setLineDash([2, 3]); g.lineWidth = 1; g.strokeStyle = T.pred; [p.barrier.sl, p.barrier.tp].forEach((v) => { if (v > this.lo && v < this.hi) { const yy = Math.round(this.y(v)) + 0.5; g.beginPath(); g.moveTo(xa, yy); g.lineTo(xe, yy); g.stroke(); } }); g.setLineDash([]); }
      }
      // Hàng chấm tín hiệu quá khứ: viền tím, tô theo kết quả (05 §3.5)
      const hist = this.o.getHist ? this.o.getHist() : [];
      if (hist.length) {
        const byT = new Map(hist.map((hh) => [hh.issuedAt - this.tfms, hh]));
        this.vis.forEach((k, j) => { const hh = byT.get(k.t); if (!hh || hh.direction === 'FLAT') return; const xx = this.x(this.start + j); const yy = this.hgt - this.padB - 5; g.beginPath(); g.arc(xx, yy, 3, 0, Math.PI * 2); g.fillStyle = hh.hit ? T.up : T.down; g.fill(); g.lineWidth = 1.5; g.strokeStyle = T.pred; g.stroke(); });
      }
      // Crosshair
      if (this.hover) { const { i, px, py } = this.hover; const xx = Math.round(this.x(i)) + 0.5; g.strokeStyle = T['text-3']; g.setLineDash([2, 2]); g.lineWidth = 1; g.beginPath(); g.moveTo(xx, this.padT); g.lineTo(xx, this.hgt - this.padB); g.stroke(); const yy = Math.round(py) + 0.5; g.beginPath(); g.moveTo(this.padL, yy); g.lineTo(this.w - this.padR, yy); g.stroke(); g.setLineDash([]); const pv = this.lo + (1 - (py - this.padT) / this.plotH) * (this.hi - this.lo); g.fillStyle = T['text-2']; const lbl = fmt.price(pv); g.fillRect(this.w - this.padR + 2, yy - 8, g.measureText(lbl).width + 8, 16); g.fillStyle = T['surface-1']; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(lbl, this.w - this.padR + 6, yy); }
    }
    _hoverAt(px, py) {
      if (!this.ks) return;
      const i = Math.round((px - this.padL) / this.barW - 0.5) + this.start;
      if (i < this.start || i >= this.end + this.futureBars) { this.hover = null; this.tip.hidden = true; this.draw(); return; }
      this.hover = { i, px, py }; this.draw();
      const k = this.ks[i]; const rows = [];
      if (k) { rows.push([fmt.dateTimeUTC(k.t) + ' UTC', '']); rows.push(['O', fmt.price(k.o)], ['H', fmt.price(k.h)], ['L', fmt.price(k.l)], ['C', fmt.price(k.c)], ['Vol', fmt.compact(k.v)]); const hh = (this.o.getHist ? this.o.getHist() : []).find((x) => x.issuedAt - this.tfms === k.t); if (hh && hh.direction !== 'FLAT') rows.push(['Tín hiệu', `${DIR[hh.direction].arrow} ${DIR[hh.direction].text} ${Math.round((hh.direction === 'UP' ? hh.pUp : 1 - hh.pUp) * 100)}% → ${hh.hit ? '✓ đúng' : '✗ sai'}`]); }
      else if (this.pred) { const p = this.pred; const t = this.ks[this.ks.length - 1].t + (i - this.ks.length + 1) * this.tfms; rows.push([fmt.dateTimeUTC(t) + ' UTC · dự đoán', '']); rows.push(['q90', fmt.price(p.q90)], ['q50', fmt.price(p.q50)], ['q10', fmt.price(p.q10)], ['p_up', Math.round(p.pUp * 100) + '% (đã hiệu chỉnh · mô phỏng)']); }
      clear(this.tip); rows.forEach(([a, b]) => this.tip.append(h('div', { class: 'tip-row' }, h('span', {}, a), h('span', { class: 'num' }, b))));
      this.tip.hidden = false; const tw = this.tip.offsetWidth; this.tip.style.left = (px + 14 + tw > this.w ? px - tw - 14 : px + 14) + 'px'; this.tip.style.top = Math.max(0, Math.min(py + 12, this.hgt - this.tip.offsetHeight)) + 'px';
      this.o.onHover && this.o.onHover(k || null);
    }
    /** Chế độ bảng — bản WCAG của biểu đồ (02 §6). */
    tableView() {
      const ks = this.o.getKlines().slice(-30).reverse(); const p = this.o.getPred();
      const rows = ks.map((k) => [fmt.dateTimeUTC(k.t), fmt.price(k.o), fmt.price(k.h), fmt.price(k.l), fmt.price(k.c), fmt.compact(k.v)]);
      const body = h('div', {}, p && h('p', { class: 'muted' }, `Dự đoán (mô phỏng): q10 ${fmt.price(p.q10)} · q50 ${fmt.price(p.q50)} · q90 ${fmt.price(p.q90)} · p_up ${Math.round(p.pUp * 100)}% · hiệu lực đến ${fmt.dateTimeUTC(p.validUntil)} UTC`), ui.table([{ label: 'Giờ UTC' }, { label: 'Mở', num: 1 }, { label: 'Cao', num: 1 }, { label: 'Thấp', num: 1 }, { label: 'Đóng', num: 1 }, { label: 'KL', num: 1 }], rows));
      return body;
    }
  }
  CP.CandleChart = CandleChart;

  // ── Biểu đồ nhỏ: đường (equity), cột (order book depth) ──────────
  CP.charts = {
    /** Đường 1 chuỗi có lưới ngang + nhãn đầu/cuối. values: [[t, v]] */
    line(container, values, { color = 'text-2', hgt = 140, baseline = null, fillArea = true } = {}) {
      clear(container);
      if (!values || values.length < 2) { container.append(ui.empty('Chưa đủ dữ liệu')); return; }
      const w = Math.max(100, container.clientWidth || 300); const T = CP.tokens([color, 'grid', 'text-3', 'border']);
      const vs = values.map((x) => x[1]); const mn = Math.min(...vs, baseline ?? Infinity), mx = Math.max(...vs, baseline ?? -Infinity), rng = mx - mn || 1;
      const X = (i) => 4 + (i / (values.length - 1)) * (w - 60), Y = (v) => 6 + (1 - (v - mn) / rng) * (hgt - 24);
      const ns = 'http://www.w3.org/2000/svg'; const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', `0 0 ${w} ${hgt}`); svg.setAttribute('class', 'linechart'); svg.setAttribute('role', 'img');
      for (let i = 0; i <= 3; i++) { const v = mn + (rng * i) / 3; const l = document.createElementNS(ns, 'line'); l.setAttribute('x1', 4); l.setAttribute('x2', w - 56); l.setAttribute('y1', Y(v)); l.setAttribute('y2', Y(v)); l.setAttribute('stroke', T.grid || T.border); l.setAttribute('opacity', '.35'); svg.append(l); const t = document.createElementNS(ns, 'text'); t.setAttribute('x', w - 50); t.setAttribute('y', Y(v) + 3.5); t.setAttribute('fill', T['text-3']); t.setAttribute('font-size', '10'); t.setAttribute('class', 'num'); t.textContent = fmt.compact(v); svg.append(t); }
      if (baseline != null) { const l = document.createElementNS(ns, 'line'); l.setAttribute('x1', 4); l.setAttribute('x2', w - 56); l.setAttribute('y1', Y(baseline)); l.setAttribute('y2', Y(baseline)); l.setAttribute('stroke', T['text-3']); l.setAttribute('stroke-dasharray', '3 3'); svg.append(l); }
      const pts = values.map((x, i) => `${X(i)},${Y(x[1])}`).join(' ');
      if (fillArea) { const a = document.createElementNS(ns, 'polygon'); a.setAttribute('points', `${X(0)},${Y(mn)} ${pts} ${X(values.length - 1)},${Y(mn)}`); a.setAttribute('fill', T[color]); a.setAttribute('opacity', '.10'); svg.append(a); }
      const p = document.createElementNS(ns, 'polyline'); p.setAttribute('points', pts); p.setAttribute('fill', 'none'); p.setAttribute('stroke', T[color]); p.setAttribute('stroke-width', '2'); p.setAttribute('stroke-linejoin', 'round'); svg.append(p);
      const end = document.createElementNS(ns, 'circle'); end.setAttribute('cx', X(values.length - 1)); end.setAttribute('cy', Y(vs[vs.length - 1])); end.setAttribute('r', 4); end.setAttribute('fill', T[color]); end.setAttribute('stroke', 'var(--surface-1)'); end.setAttribute('stroke-width', '2'); svg.append(end);
      container.append(svg);
    },
  };

  // ── Bảng tra phím tắt (UI-10) ────────────────────────────────────
  CP.hotkeys = {
    list: [['?', 'Bảng phím tắt này'], ['/', 'Tìm cặp'], ['1 · 2 · 3', 'Khung 1h · 4h · 1d'], ['g t', 'Tới Giao dịch'], ['g i', 'Tới Chỉ số'], ['g m', 'Tới Phương pháp'], ['g p', 'Tới Tài khoản'], ['b / s', 'Chọn Mua / Bán trong ô lệnh'], ['Esc', 'Đóng hộp thoại'], ['+ / −', 'Phóng/thu chart (khi chart có focus)'], ['← →', 'Cuộn chart']],
    show() { ui.modal({ title: 'Phím tắt', body: ui.table(['Phím', 'Tác dụng'], this.list.map(([k, v]) => [ui.kbd(k), v])) }); },
  };
})();
