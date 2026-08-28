/* ══════════════════════════════════════════════════════════════════
   screens/markets.js — THỊ TRƯỜNG: danh sách cặp USDT, lọc, sắp xếp,
   cột Dự đoán 1d (tím, mô phỏng) cho ★ yêu thích + top 8 theo khối lượng.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const CP = window.CP;
  const { h, clear, put, fmt, freshness, chip, dirBadge, table, empty, DIR } = CP.ui;
  let offs = [], timers = [], els = {}, list = [], preds = {}, q = '', filter = localStorage.getItem('cp15.mk.filter') || 'all', sort = localStorage.getItem('cp15.mk.sort') || 'qv', prevPrice = {};

  CP.ui.injectCSS('markets', `
    .mk-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px}
    .mk-bar .input{max-width:260px}
    .mk-bar .spacer{flex:1}
    .tbl.mk tbody tr{height:36px}
    .tbl.mk td.price{transition:none}
    @media(max-width:767px){.tbl.mk .hide-m{display:none}}
  `);

  const favs = () => CP.state.get('favorites');
  const STABLE = /^(USDC|FDUSD|USD1|RLUSD|TUSD|DAI|BUSD|USDP|PYUSD|EUR|EURI|XUSD|USDE|USDD)USDT$/;
  async function loadPreds() {
    const targets = [...new Set([...favs(), ...list.slice(0, 8).map((t) => t.symbol)])];
    for (const sym of targets) {
      if (preds[sym] !== undefined) continue;
      if (STABLE.test(sym)) { preds[sym] = 'stable'; continue; }
      preds[sym] = null;
      try { const ks = await CP.data.klines(sym, '1d', 120); preds[sym] = CP.pred.series(ks, '1d', sym, { back: 5 }).current || false; } catch (e) { preds[sym] = false; }
      if (els.table) draw();
    }
  }
  function draw() {
    const el = els.table; if (!el) return; clear(el);
    if (!list.length) { el.append(CP.ui.skeleton(320)); return; }
    let rows = list.filter((t) => !q || t.symbol.includes(q));
    if (filter === 'fav') rows = rows.filter((t) => favs().includes(t.symbol));
    if (filter === 'gain') rows = rows.filter((t) => t.pct > 0);
    if (filter === 'lose') rows = rows.filter((t) => t.pct < 0);
    rows = rows.slice().sort((a, b) => sort === 'pct' ? b.pct - a.pct : sort === 'pctasc' ? a.pct - b.pct : b.qv - a.qv).slice(0, 150);
    const tbl = table([{ label: '' }, { label: 'Cặp' }, { label: 'Giá', num: 1 }, { label: '24h', num: 1 }, { label: 'Cao / Thấp 24h', num: 1 }, { label: 'KL USDT', num: 1 }, { label: 'Dự đoán 1d' }], rows.map((t) => {
      const p = preds[t.symbol];
      const predCell = p === 'stable' ? h('span', { class: 'faint' }, '— stablecoin') : p ? Object.assign(dirBadge(p.direction, p.pUp), { className: 'badge master badge-' + DIR[p.direction].cls, style: 'height:24px;font-size:11px' }) : p === null ? h('span', { class: 'faint' }, '…') : h('span', { class: 'faint' }, '—');
      const flash = prevPrice[t.symbol] != null && prevPrice[t.symbol] !== t.last ? (t.last > prevPrice[t.symbol] ? 'flash-up' : 'flash-down') : '';
      return [
        h('button', { class: 'star ' + (favs().includes(t.symbol) ? 'is-on' : ''), 'aria-label': 'Ưa thích ' + t.symbol, onClick: (e) => { e.stopPropagation(); const f = favs(); CP.state.set({ favorites: f.includes(t.symbol) ? f.filter((x) => x !== t.symbol) : [...f, t.symbol] }); loadPreds(); draw(); } }, favs().includes(t.symbol) ? '★' : '☆'),
        h('span', { class: 'strong' }, fmt.base(t.symbol), h('span', { class: 'faint' }, '/USDT')),
        h('span', { class: 'num price ' + flash + (CP.data.freshness === 'down' ? ' faint' : '') }, fmt.price(t.last)),
        h('span', { class: 'num ' + (t.pct >= 0 ? 'up-text' : 'down-text') }, (t.pct >= 0 ? '▲ ' : '▼ ') + fmt.pct(t.pct)),
        h('span', { class: 'num faint hide-m' }, fmt.price(t.high) + ' / ' + fmt.price(t.low)),
        h('span', { class: 'num' }, fmt.compact(t.qv)),
        predCell,
      ];
    }), { cls: 'mk', empty: 'Không tìm thấy cặp' });
    // đánh dấu cột ẩn trên mobile + hàng click được
    tbl.querySelectorAll('thead th:nth-child(5)').forEach((th) => th.classList.add('hide-m'));
    tbl.querySelectorAll('tbody tr').forEach((tr, i) => { if (!rows[i]) return; tr.classList.add('clickable'); tr.tabIndex = 0; const go = () => { CP.state.set({ symbol: rows[i].symbol }); CP.router.go('trade'); }; tr.addEventListener('click', go); tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); }); });
    el.append(tbl);
    prevPrice = Object.fromEntries(list.map((t) => [t.symbol, t.last]));
  }
  function renderBar() {
    const el = els.bar; clear(el);
    const inp = h('input', { class: 'input', placeholder: 'Tìm cặp (BTC, ETH…)', 'aria-label': 'Tìm cặp', value: q, onInput: (e) => { q = e.target.value.trim().toUpperCase(); draw(); } });
    put(el, inp,
      h('div', { class: 'seg' }, [['all', 'USDT'], ['fav', '★ Yêu thích'], ['gain', 'Tăng'], ['lose', 'Giảm']].map(([k, l]) => h('button', { class: 'seg-btn ' + (filter === k ? 'is-active' : ''), onClick: () => { filter = k; localStorage.setItem('cp15.mk.filter', k); renderBar(); draw(); } }, l))),
      h('div', { class: 'seg' }, [['qv', 'KL'], ['pct', '24h ↓'], ['pctasc', '24h ↑']].map(([k, l]) => h('button', { class: 'seg-btn ' + (sort === k ? 'is-active' : ''), onClick: () => { sort = k; localStorage.setItem('cp15.mk.sort', k); renderBar(); draw(); } }, l))),
      h('span', { class: 'spacer' }), chip('Dự đoán 1d: MÔ PHỎNG · ' + CP.verify.current().label, 'chip-sim'), freshness(CP.data.freshness, CP.data.lastTick, 'Giá'));
    if (els.focusSearch) { els.focusSearch = false; setTimeout(() => inp.focus(), 30); }
  }
  async function refresh() { try { list = await CP.market.loadTickers(); draw(); loadPreds(); } catch (e) { /* giữ bảng cũ */ } }

  CP.screens.register('markets', {
    title: 'Thị trường', auth: false,
    async mount(outlet, { params }) {
      els = { bar: h('div', { class: 'mk-bar' }), table: h('div', { class: 'tbl-wrap' }), focusSearch: !!params.q };
      outlet.append(h('div', { class: 'page' }, h('div', { class: 'subhead' }, h('h1', {}, 'Thị trường'), h('span', { class: 'muted small' }, 'cặp USDT trên Binance · cập nhật 10 s')), els.bar, els.table,
        h('p', { class: 'faint small mt-3' }, 'Cột Dự đoán 1d chỉ tính cho cặp ★ yêu thích và 8 cặp khối lượng lớn nhất; cặp ngoài tập huấn luyện ghi "—". Tím = do model sinh ra, mô phỏng, hiệu suất giả định.')));
      renderBar(); draw();
      list = CP.market.tickersList; if (list.length) { draw(); loadPreds(); }
      await refresh();
      timers.push(setInterval(refresh, 10000));
      offs.push(CP.market.on('fresh', () => { renderBar(); draw(); }), CP.state.subscribe((keys) => { if (keys.includes('favorites')) draw(); }));
    },
    unmount() { offs.forEach((f) => f()); offs = []; timers.forEach(clearInterval); timers = []; },
  });
})();
