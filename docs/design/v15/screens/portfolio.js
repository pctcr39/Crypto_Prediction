/* ══════════════════════════════════════════════════════════════════
   screens/portfolio.js — DANH MỤC: PAPER | TIỀN THẬT luôn tách (UI-04).
   Lớp THỰC THI của user (lệnh Paper/Trading) — không trộn với hiệu suất giả
   định của lớp khuyến nghị (TRACK-04). Reset ví = mở kỳ mới, giữ lịch sử.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const CP = window.CP;
  const { h, clear, put, fmt, panel, chip, modeTag, table, confirm, toast, modal, empty } = CP.ui;
  let offs = [], timers = [], els = {}, tab = 'PAPER', tickers = {};

  CP.ui.injectCSS('portfolio', `
    .pf-tabs .tab{font-weight:600}
    .pf-tabs .tab.real.is-active{border-bottom-color:var(--down)}
    .upnl{white-space:nowrap}
  `);

  const priceOf = (sym) => (sym === CP.market.symbol && CP.market.last()) || (tickers[sym] && tickers[sym].last) || null;
  const kpi = (l, v, cls = '', sub = null) => h('div', { class: 'kpi' }, h('span', { class: 'kpi-label' }, l), h('span', { class: 'kpi-value num ' + cls }, v), sub && h('span', { class: 'kpi-delta faint' }, sub));
  const sideEl = (o) => h('span', { class: o.side === 'BUY' ? 'up-text' : 'down-text' }, o.side === 'BUY' ? '▲ Mua' : '▼ Bán');

  // ── PAPER ────────────────────────────────────────────────────────
  function renderPaper() {
    const el = els.body; clear(el); const s = CP.paper.state();
    const prices = {}; Object.keys(s.positions).forEach((k) => { const p = priceOf(k); if (p) prices[k] = p; });
    const eq = CP.paper.equity(prices, s); const pnl = eq - 10000;
    const dayStart = s.equityLog.filter((x) => x[0] >= new Date().setUTCHours(0, 0, 0, 0))[0]; const dayPnl = dayStart ? eq - dayStart[1] : 0;
    const fees = s.fills.reduce((a, f) => a + f.fee, 0);
    const posRows = Object.entries(s.positions).filter(([, p]) => p.qty > 0).map(([sym, p]) => { const px = priceOf(sym); const u = px ? (px - p.avg) * p.qty : null; const upct = px ? (px / p.avg - 1) * 100 : null; return [h('span', { class: 'strong' }, fmt.base(sym)), h('span', { class: 'num' }, fmt.qty(p.qty)), h('span', { class: 'num' }, fmt.price(p.avg)), h('span', { class: 'num' }, px ? fmt.price(px) : '—'), h('span', { class: 'num upnl ' + (u == null ? 'faint' : u >= 0 ? 'up-text' : 'down-text') }, u == null ? '—' : (u >= 0 ? '▲ +' : '▼ ') + fmt.num(u) + ' (' + fmt.pct(upct) + ')'), h('span', { class: 'num' }, fmt.num(p.realized || 0)), h('button', { class: 'btn btn-sm btn-sell', onClick: () => sellAll(sym, p.qty) }, 'Bán hết')]; });
    const open = s.orders.filter((o) => o.status === 'NEW');
    const eqEl = h('div', {});
    put(el,
      h('div', { class: 'row' }, modeTag('PAPER'), chip('Kỳ #' + s.period + ' · từ ' + fmt.dateUTC(s.startedAt), ''), h('span', { class: 'muted small' }, 'Ví ảo 10.000 USDT · khớp tại giá thật + phí taker 0,10% + trượt 0,05%')),
      h('div', { class: 'kpi-row mt-3' }, kpi('Giá trị ví', fmt.num(eq) + ' USDT', 'big'), kpi('Tiền mặt', fmt.num(s.cash)), kpi('PnL kỳ', (pnl >= 0 ? '▲ +' : '▼ ') + fmt.num(pnl), pnl >= 0 ? 'up-text' : 'down-text', fmt.pct(pnl / 100)), kpi('PnL hôm nay (UTC)', (dayPnl >= 0 ? '▲ +' : '▼ ') + fmt.num(dayPnl), dayPnl >= 0 ? 'up-text' : 'down-text'), kpi('Phí đã trả', fmt.num(fees)), kpi('Số lệnh', 'n=' + s.orders.length, '', s.fills.length + ' khớp')),
      panel({ id: 'pf-eq', title: 'Đường vốn', subtitle: 'ghi mỗi phút khi có tick', cls: 'mt-3', body: eqEl, actions: [h('button', { class: 'ibtn', onClick: () => modal({ title: 'Đường vốn (bảng)', body: table(['Giờ UTC', { label: 'Giá trị', num: 1 }], s.equityLog.slice(-60).reverse().map((x) => [fmt.dateTimeUTC(x[0]), fmt.num(x[1])])) }) }, '⊞ bảng')] }),
      panel({ id: 'pf-pos', title: 'Vị thế', subtitle: 'giao ngay', cls: 'mt-3 flush', body: table(['Tài sản', { label: 'Số lượng', num: 1 }, { label: 'Giá vốn', num: 1 }, { label: 'Giá hiện tại', num: 1 }, { label: 'uPnL', num: 1 }, { label: 'Đã hiện thực', num: 1 }, ''], posRows, { empty: 'Chưa giữ coin nào — đặt lệnh ở màn Giao dịch' }) }),
      panel({ id: 'pf-open', title: 'Lệnh mở', cls: 'mt-3 flush', actions: [open.length ? h('button', { class: 'btn btn-sm btn-danger', onClick: async () => { if (await confirm({ title: 'Huỷ tất cả lệnh chờ?', body: h('p', {}, open.length + ' lệnh.'), okText: 'Huỷ tất cả', danger: true })) { CP.paper.cancelAll(); renderPaper(); } } }, 'Huỷ tất cả') : null], body: table(['Giờ UTC', 'Cặp', 'Chiều', 'Loại', { label: 'Giá', num: 1 }, { label: 'SL', num: 1 }, ''], open.slice().reverse().map((o) => [fmt.dateTimeUTC(o.at), o.symbol, sideEl(o), o.type, fmt.price(o.price), fmt.qty(o.qty), h('button', { class: 'btn btn-sm', onClick: () => { CP.paper.cancel(o.id); renderPaper(); } }, 'Huỷ')]), { empty: 'Không có lệnh chờ' }) }),
      panel({ id: 'pf-hist', title: 'Lịch sử lệnh', subtitle: 'mọi cặp · chỉ thêm, không xoá', cls: 'mt-3 flush', body: table(['Giờ UTC', 'Cặp', 'Chiều', 'Loại', { label: 'Giá', num: 1 }, { label: 'SL', num: 1 }, 'Trạng thái', { label: 'Phí', num: 1 }], s.orders.slice().reverse().slice(0, 100).map((o) => [fmt.dateTimeUTC(o.at), o.symbol, sideEl(o), o.type, fmt.price(o.fillPrice || o.price), fmt.qty(o.qty), o.status === 'FILLED' ? 'Đã khớp' : o.status === 'NEW' ? 'Chờ' : 'Đã huỷ', o.fee != null ? fmt.num(o.fee) : '—']), { empty: 'Chưa có lệnh' }) }),
      panel({ id: 'pf-fills', title: 'Khớp lệnh', cls: 'mt-3 flush', body: table(['Giờ UTC', 'Cặp', 'Chiều', { label: 'Giá', num: 1 }, { label: 'SL', num: 1 }, { label: 'Phí', num: 1 }], s.fills.slice().reverse().slice(0, 100).map((f) => [fmt.dateTimeUTC(f.at), f.symbol, sideEl(f), fmt.price(f.price), fmt.qty(f.qty), fmt.num(f.fee)]), { empty: 'Chưa có khớp lệnh' }) }),
      panel({ id: 'pf-periods', title: 'Kỳ trước', cls: 'mt-3', body: (s.archived && s.archived.length) ? table(['Kỳ', { label: 'Số lệnh', num: 1 }, { label: 'Giá trị cuối', num: 1 }], s.archived.map((a) => ['#' + a.period, a.orders.length, fmt.num(a.equityLog[a.equityLog.length - 1][1])])) : empty('Chưa có kỳ nào kết thúc') }),
      h('div', { class: 'row mt-3' }, h('button', { class: 'btn', onClick: async () => { if (await confirm({ title: 'Mở kỳ mới (reset ví)?', body: h('p', {}, 'Ví về 10.000 USDT, vị thế xoá. Lịch sử lệnh KHÔNG bị xoá — track record bất biến (PAPER-03).'), okText: 'Mở kỳ mới' })) { CP.paper.reset(); toast('Đã mở kỳ #' + CP.paper.state().period, 'ok'); renderPaper(); } } }, 'Mở kỳ mới (reset ví)'), h('span', { class: 'faint small' }, 'Lớp thực thi của bạn — tách khỏi hiệu suất giả định của phương pháp (TRACK-04).')));
    CP.charts.line(eqEl, s.equityLog, { color: 'text-2', hgt: 140, baseline: 10000 });
  }
  async function sellAll(sym, qty) {
    const last = priceOf(sym); if (!last) return toast('Chưa có giá cho ' + sym, 'error');
    const pv = CP.paper.preview({ symbol: sym, side: 'SELL', type: 'MARKET', baseQty: qty, last });
    if (!pv.ok) return toast(pv.errors[0], 'error');
    const ok = await confirm({ title: 'Bán toàn bộ ' + fmt.base(sym) + '? (bước 2/2)', body: h('div', { class: 'stack-sm' }, h('div', { class: 'row' }, modeTag('PAPER'), h('span', {}, '▼ BÁN ' + fmt.qty(pv.base) + ' ' + fmt.base(sym) + ' ≈ ' + fmt.num(pv.quote) + ' USDT')), h('div', { class: 'small muted' }, 'Phí taker 0,10% + trượt 0,05% = ' + fmt.num(pv.fee + pv.slip) + ' USDT · nhận về ' + fmt.num(pv.total) + ' USDT · ' + pv.pctNav.toFixed(1) + '% NAV'), pv.needsConfirm && h('div', { class: 'note note-warn' }, 'Lệnh > 50% số dư — xác nhận này không tắt được.')), okText: 'Bán ' + fmt.base(sym), danger: true });
    if (!ok) return;
    try { CP.paper.place({ symbol: sym, side: 'SELL', type: 'MARKET', baseQty: qty, last }); toast('Đã bán', 'ok'); renderPaper(); } catch (e) { toast(e.message, 'error'); }
  }

  // ── TIỀN THẬT ────────────────────────────────────────────────────
  function renderReal() {
    const el = els.body; clear(el); const l = CP.link.get(); const can = CP.mode.canTrade();
    if (!l) { put(el, h('div', { class: 'row' }, modeTag('TRADING')), empty('Chưa liên kết tài khoản Binance', 'Liên kết bằng khoá API chỉ-quyền-giao-dịch — hệ không giữ tiền của bạn'), h('a', { class: 'btn btn-primary', href: '#/account?tab=binance' }, 'Liên kết Binance')); return; }
    const usdt = l.balances.reduce((a, b) => a + (b.asset === 'USDT' ? b.free + b.locked : (b.free + b.locked) * (priceOf(b.asset + 'USDT') || 0)), 0);
    put(el, h('div', { class: 'row' }, modeTag('TRADING'), chip('chỉ đọc · đối soát lúc ' + fmt.timeUTC(l.lastCheck) + ' UTC', ''), chip('khoá ' + l.fp, '')),
      h('div', { class: 'kpi-row mt-3' }, kpi('Ước tính tổng (USDT)', fmt.num(usdt), 'big', 'theo giá hiện có'), kpi('Trạng thái khoá', l.status === 'trade' ? 'giao dịch' : 'chỉ đọc')),
      panel({ id: 'pf-real-bal', title: 'Số dư trên Binance', subtitle: 'chỉ đọc · LINK-04', cls: 'mt-3 flush', body: table(['Tài sản', { label: 'Khả dụng', num: 1 }, { label: 'Đang khoá', num: 1 }, { label: '≈ USDT', num: 1 }], l.balances.map((b) => [b.asset, fmt.qty(b.free), fmt.qty(b.locked), fmt.num(b.asset === 'USDT' ? b.free + b.locked : (b.free + b.locked) * (priceOf(b.asset + 'USDT') || 0))])) }),
      panel({ id: 'pf-real-orders', title: 'Lệnh thật', cls: 'mt-3', body: h('div', { class: 'stack-sm' }, empty('Chưa có lệnh tiền thật', 'Đường lệnh tiền thật chưa phát hành'), h('div', { class: 'note note-warn' }, h('div', { class: 'strong' }, 'Đặt lệnh TIỀN THẬT chưa sẵn sàng vì:'), h('ul', { style: { margin: '4px 0 0 16px', padding: 0 } }, can.reasons.map((r) => h('li', {}, r))))) }),
      h('p', { class: 'faint small mt-3' }, 'Khi phát hành: mỗi lệnh xác nhận hai bước (bước hai là xác thực lại), hiện phí ước tính, cỡ so với NAV và nhãn trạng thái kiểm chứng của phương pháp trước khi gửi (TRADE-01).'));
  }

  function renderTabs() {
    const el = els.tabs; clear(el);
    put(el, h('button', { class: 'tab ' + (tab === 'PAPER' ? 'is-active' : ''), role: 'tab', 'aria-selected': String(tab === 'PAPER'), onClick: () => { tab = 'PAPER'; renderTabs(); renderPaper(); } }, 'PAPER'), h('button', { class: 'tab real ' + (tab === 'REAL' ? 'is-active' : ''), role: 'tab', 'aria-selected': String(tab === 'REAL'), onClick: () => { tab = 'REAL'; renderTabs(); renderReal(); } }, 'TIỀN THẬT'));
  }

  CP.screens.register('portfolio', {
    title: 'Danh mục', auth: true,
    async mount(outlet) {
      els = { tabs: h('div', { class: 'tabs pf-tabs', role: 'tablist' }), body: h('div', { class: 'mt-3' }) };
      outlet.append(h('div', { class: 'page' }, h('div', { class: 'subhead' }, h('h1', {}, 'Danh mục'), h('span', { class: 'muted small' }, 'lớp thực thi · hai mode luôn tách')), els.tabs, els.body));
      renderTabs(); renderPaper();
      offs.push(CP.market.on('tick', () => { if (tab === 'PAPER') updatePos(); }), CP.market.on('tickers', (list) => { tickers = Object.fromEntries(list.map((t) => [t.symbol, t])); if (tab === 'PAPER') renderPaper(); else renderReal(); }));
      if (!CP.market.klines.length) CP.market.load(CP.state.get('symbol'), CP.state.get('tf'));
      if (!CP.market.tickersList.length) CP.market.loadTickers().catch(() => {}); else tickers = Object.fromEntries(CP.market.tickersList.map((t) => [t.symbol, t]));
      timers.push(setInterval(() => { if (tab === 'PAPER') updatePos(); }, 2000));
    },
    unmount() { offs.forEach((f) => f()); offs = []; timers.forEach(clearInterval); timers = []; },
  });
  let lastUpd = 0;
  function updatePos() { if (Date.now() - lastUpd < 1000) return; lastUpd = Date.now(); const rows = els.body.querySelectorAll('#panel-pf-pos tbody tr'); if (!rows.length) return; renderPaper(); }
})();
