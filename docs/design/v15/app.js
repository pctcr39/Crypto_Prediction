/* ══════════════════════════════════════════════════════════════════
   app.js — KHỞI ĐỘNG prototype v15: nav phải, chọn cặp, mode, theme,
   footer (giờ máy chủ · đếm ngược nến · nguồn dữ liệu), phím tắt, router.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const CP = window.CP;
  const { h, clear, put, fmt, toast, confirm, modal, freshness, modeTag, chip } = CP.ui;

  // ── Luật 16: mọi bot về TẮT khi khởi động ────────────────────────
  const stopped = CP.bots.resetOnBoot();
  if (stopped) setTimeout(() => toast(`${stopped} bot đã về TẮT sau khi khởi động lại (Luật 16). Bật tay nếu muốn tiếp tục.`, 'warn', 6000), 600);

  // ── Theme ────────────────────────────────────────────────────────
  document.documentElement.setAttribute('data-theme', CP.state.get('theme'));
  if (localStorage.getItem('cp15.cvd') === '1') document.documentElement.setAttribute('data-cvd', 'true');

  // ── Disclaimer (LEGAL-02) dùng chung ─────────────────────────────
  CP.ui.disclaimer = () => h('p', { class: 'disclaimer' }, 'Khuyến nghị chỉ để tham khảo — quyết định và trách nhiệm thuộc về bạn. Không đảm bảo lợi nhuận. Số liệu trong prototype là mô phỏng — phương pháp chưa kiểm chứng.');

  // ── Nav phải: cặp · mode · freshness · theme · user ──────────────
  function renderNavRight() {
    const host = document.getElementById('nav-right'); clear(host);
    const user = CP.auth.current();
    const sym = CP.state.get('symbol');
    put(host,
      h('button', { class: 'pairbtn', id: 'pairbtn', 'aria-haspopup': 'dialog', onClick: openPairs }, h('span', {}, fmt.base(sym) + '/USDT'), h('span', { class: 'caret', 'aria-hidden': 'true' }, '▾')),
      h('button', { class: 'ibtn', id: 'modebtn', title: 'Chế độ', 'aria-label': 'Đổi chế độ PAPER / TIỀN THẬT', onClick: openMode }, modeTag(CP.mode.get())),
      h('span', { id: 'nav-fresh', class: 'hide-m' }, freshness(CP.data.freshness, CP.data.lastTick, 'Giá')),
      h('button', { class: 'ibtn hide-m', title: 'Đổi giao diện tối/sáng', 'aria-label': 'Đổi giao diện tối/sáng', onClick: () => CP.applyTheme(CP.state.get('theme') === 'dark' ? 'light' : 'dark') }, CP.state.get('theme') === 'dark' ? '☾' : '☀'),
      h('button', { class: 'ibtn hide-m', title: 'Phím tắt (?)', 'aria-label': 'Phím tắt', onClick: () => CP.hotkeys.show() }, '?'),
      user ? h('a', { class: 'btn btn-sm btn-ghost', href: '#/account', title: user.email }, h('span', { class: 'mono' }, user.email.split('@')[0]))
        : h('a', { class: 'btn btn-sm btn-primary', href: '#/auth' }, 'Đăng nhập'),
    );
  }
  CP.renderNavRight = renderNavRight;
  document.body.dataset.mode = CP.mode.get();

  // ── Chọn cặp (overlay từ nav, không chiếm cột) ───────────────────
  let closePairs = null;
  async function openPairs() {
    if (closePairs) return;
    const list = CP.market.tickersList.length ? CP.market.tickersList : await CP.market.loadTickers();
    let q = '', filter = 'all', sort = 'qv';
    const body = h('div', { class: 'pairs' });
    const input = h('input', { class: 'input', placeholder: 'Tìm cặp (BTC, ETH…)', 'aria-label': 'Tìm cặp', onInput: (e) => { q = e.target.value.trim().toUpperCase(); draw(); } });
    const filters = h('div', { class: 'filters' });
    const wrap = h('div', { class: 'tbl-wrap' });
    body.append(input, filters, wrap);
    const favs = () => CP.state.get('favorites');
    function draw() {
      clear(filters);
      [['all', 'USDT'], ['fav', '★ Yêu thích'], ['gain', 'Tăng mạnh'], ['lose', 'Giảm mạnh']].forEach(([k, l]) => filters.append(h('button', { class: 'btn btn-sm ' + (filter === k ? 'btn-primary' : ''), onClick: () => { filter = k; draw(); } }, l)));
      let rows = list.filter((t) => !q || t.symbol.includes(q));
      if (filter === 'fav') rows = rows.filter((t) => favs().includes(t.symbol));
      if (filter === 'gain') rows = [...rows].sort((a, b) => b.pct - a.pct).slice(0, 30);
      if (filter === 'lose') rows = [...rows].sort((a, b) => a.pct - b.pct).slice(0, 30);
      rows = rows.slice(0, 120);
      clear(wrap);
      wrap.append(CP.ui.table([{ label: '' }, { label: 'Cặp' }, { label: 'Giá', num: 1 }, { label: '24h', num: 1 }, { label: 'KL USDT', num: 1 }], rows.map((t) => [
        h('button', { class: 'star ' + (favs().includes(t.symbol) ? 'is-on' : ''), 'aria-label': 'Ưa thích ' + t.symbol, onClick: (e) => { e.stopPropagation(); const f = favs(); CP.state.set({ favorites: f.includes(t.symbol) ? f.filter((x) => x !== t.symbol) : [...f, t.symbol] }); draw(); } }, favs().includes(t.symbol) ? '★' : '☆'),
        h('span', { class: 'strong' }, fmt.base(t.symbol), h('span', { class: 'faint' }, '/USDT')),
        h('span', { class: 'num' }, fmt.price(t.last)),
        h('span', { class: 'num ' + (t.pct >= 0 ? 'up-text' : 'down-text') }, (t.pct >= 0 ? '▲ ' : '▼ ') + fmt.pct(t.pct)),
        h('span', { class: 'num' }, fmt.compact(t.qv)),
      ]), { empty: 'Không tìm thấy cặp' }));
      wrap.querySelectorAll('tbody tr').forEach((tr, i) => { tr.classList.add('clickable'); tr.tabIndex = 0; const pick = () => { CP.state.set({ symbol: rows[i].symbol }); closePairs && closePairs(); if (!['trade', 'indicators', 'consult', 'markets'].includes(CP.router.current)) CP.router.go('trade'); }; tr.addEventListener('click', pick); tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') pick(); }); });
    }
    draw();
    const close = modal({ title: 'Chọn cặp', body, wide: false });
    closePairs = () => { close(); closePairs = null; };
    setTimeout(() => input.focus(), 50);
  }
  CP.openPairs = openPairs;

  // ── Đổi mode (UI-04): không giấu nút — khoá và nói lý do ─────────
  async function openMode() {
    const cur = CP.mode.get(); const can = CP.mode.canTrade();
    const body = h('div', { class: 'stack' },
      h('div', { class: 'row' }, modeTag('PAPER'), h('span', { class: 'muted' }, 'Ví ảo 10.000 USDT · khớp mô phỏng tại giá thật + phí taker 0,10% + trượt 0,05%')),
      h('div', { class: 'row' }, modeTag('TRADING'), h('span', { class: 'muted' }, 'Lệnh thật trên tài khoản Binance của bạn — chỉ mở khi đủ điều kiện')),
      can.ok ? h('div', { class: 'note note-danger' }, 'Đủ điều kiện. Chuyển sang TIỀN THẬT cần xác nhận 2 bước.')
        : h('div', { class: 'note note-warn' }, h('div', { class: 'strong' }, 'TIỀN THẬT đang khoá vì:'), h('ul', { style: { margin: '4px 0 0 16px', padding: 0 } }, can.reasons.map((r) => h('li', {}, r)))),
      h('div', { class: 'row' },
        cur === 'TRADING' && h('button', { class: 'btn', onClick: () => { CP.mode.set('PAPER'); document.body.dataset.mode = 'PAPER'; renderNavRight(); close(); CP.router.render(); } }, 'Về PAPER'),
        cur === 'PAPER' && h('button', { class: 'btn btn-danger', disabled: !can.ok, title: can.ok ? '' : can.reasons.join(' · '), onClick: async () => { close(); const ok = await confirm({ title: 'Chuyển sang TIỀN THẬT', body: h('p', {}, 'Mọi lệnh sau đây gửi lên Binance bằng tiền của bạn. Gõ REAL để xác nhận.'), okText: 'Bật TIỀN THẬT', danger: true, requireText: 'REAL' }); if (ok) { try { CP.mode.set('TRADING'); document.body.dataset.mode = 'TRADING'; renderNavRight(); CP.router.render(); } catch (e) { toast(e.message, 'error'); } } } }, 'Bật TIỀN THẬT')),
    );
    const close = modal({ title: 'Chế độ giao dịch', body });
  }
  document.getElementById('to-paper').addEventListener('click', () => { CP.mode.set('PAPER'); document.body.dataset.mode = 'PAPER'; renderNavRight(); CP.router.render(); });

  // ── Footer: giờ máy chủ · đếm ngược · nguồn · độ tươi ────────────
  function tickFooter() {
    const tf = CP.state.get('tf');
    document.getElementById('ft-clock').textContent = new Date(CP.data.now()).toISOString().slice(11, 19) + ' UTC';
    document.getElementById('ft-countdown').textContent = 'nến ' + tf + ' đóng sau ' + fmt.countdown(CP.nextClose(tf) - CP.data.now());
    const src = CP.data.source;
    document.getElementById('ft-source').textContent = src === 'live' ? 'Nguồn: Binance công khai (REST + WS)' : src === 'fallback' ? 'Nguồn: ẢNH CHỤP lúc build — không phải dữ liệu sống' : 'Đang dò nguồn…';
    const f = document.getElementById('ft-fresh'); clear(f); f.append(freshness(CP.data.freshness, CP.data.lastTick, 'Giá'));
    const nf = document.getElementById('nav-fresh'); if (nf) { clear(nf); nf.append(freshness(CP.data.freshness, CP.data.lastTick, 'Giá')); }
  }
  setInterval(tickFooter, 1000);

  // ── Phím tắt (UI-10) — tắt khi đang gõ ───────────────────────────
  let pendingG = false;
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (['input', 'textarea', 'select'].includes(tag) || e.metaKey || e.ctrlKey) return;
    if (e.key === '?') { e.preventDefault(); CP.hotkeys.show(); return; }
    if (e.key === '/') { e.preventDefault(); openPairs(); return; }
    if (e.key === '1') CP.state.set({ tf: '1h' }); else if (e.key === '2') CP.state.set({ tf: '4h' }); else if (e.key === '3') CP.state.set({ tf: '1d' });
    if (pendingG) { pendingG = false; const map = { t: 'trade', i: 'indicators', m: 'consult', p: 'account', b: 'bots', k: 'markets', d: 'portfolio' }; if (map[e.key]) CP.router.go(map[e.key]); return; }
    if (e.key === 'g') { pendingG = true; setTimeout(() => (pendingG = false), 800); }
  });

  // ── Router + state ───────────────────────────────────────────────
  CP.state.subscribe((keys) => { if (keys.includes('symbol') || keys.includes('theme')) renderNavRight(); if (keys.includes('theme')) document.documentElement.setAttribute('data-theme', CP.state.get('theme')); });
  window.addEventListener('hashchange', () => CP.router.render());
  window.addEventListener('cp:auth', () => { renderNavRight(); });
  renderNavRight(); tickFooter();
  if (!location.hash) location.hash = '#/trade';
  // ?demo=1 ⇒ nạp tài khoản demo rồi mới dựng màn (chỉ prototype)
  const demoWanted = /[?&]demo=1/.test(location.hash) && !CP.auth.current();
  if (demoWanted) { CP.demo.seed().then(() => { renderNavRight(); CP.router.render(); toast('Đang dùng tài khoản demo: demo@cryptopred.vn (2FA, kênh thông báo, liên kết Binance giả lập đã sẵn)', 'info', 6000); }); }
  CP.data.ensureSource().then(() => tickFooter());
  if (!demoWanted) CP.router.render();
})();
