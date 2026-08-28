/* ══════════════════════════════════════════════════════════════════
   screens/indicators.js — DASHBOARD CHỈ SỐ KỸ THUẬT (PRED-15)
   Trang này ĐO, không KẾT LUẬN (UI-07): không có badge hướng, không màu
   up/down cho giá trị chỉ số. Mỗi dòng mang chip nguồn gốc:
   BỘ CHÍNH THỨC · BỊ BÁC — không vào model · CHỜ DỮ LIỆU.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const CP = window.CP;
  const { h, clear, put, fmt, panel, freshness, chip, table, modal, sparkline, empty } = CP.ui;
  let offs = [], els = {}, cache = null, tab = null;

  CP.ui.injectCSS('indicators', `
    .ind-note{font-size:var(--fs-11);color:var(--text-3)}
    .ind-val{font-weight:600}
    .ind-tab-note{margin:8px 0}
    .tbl .spark{width:80px;height:24px}
  `);

  const GROUP_NOTES = {
    'Động lượng': 'RSI, MACD, Stochastic bị bác không phải vì "vô dụng" — thông tin của chúng đã có trong lợi suất log (r ≈ 0,85 với log_ret_12), ở dạng đơn giản hơn và không có tham số ẩn. Vẫn hiển thị cho trader quen mắt; không vào model.',
    'Phái sinh': 'Funding là CHI PHÍ giữ vị thế, vào hàm chi phí trước khi làm đặc trưng. Funding cực trị nghiêng về TIẾP DIỄN xu hướng, không phải đảo chiều (docs/Old/09 §2, đo trên 7.600 kỳ BTC). Bản đồ nhiệt thanh lý bị loại: "mức thanh lý" là kết quả mô hình bán như dữ liệu. Prototype chưa nối fapi ⇒ mọi dòng CHỜ DỮ LIỆU.',
    'Cấu trúc': 'Ba đặc trưng price action sống sót sau phản biện: quét-rồi-lấy-lại, khoảng cách tới đỉnh/đáy, khoảng cách tới số tròn. Order block / FVG / BOS không tái lập được giữa hai người cài đặt.',
    'Biến động': 'Nền tảng của mọi thứ: σ̂ quyết định dải q10–q90, rào chắn 1,2σ̂/6,0σ̂ và ngưỡng hoà vốn.',
  };
  const fmtVal = (d) => { const v = d.value; if (v == null) return '—'; switch (d.fmt) { case '%': return fmt.pct(v, 2, false); case 'z': return v.toFixed(2) + ' σ'; case 'n': return v.toFixed(1); case 'd': return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][v] || String(v); case '-': return '—'; default: return (+v).toFixed(3); } };
  const chipOf = (d) => d.chip === CP.indicators.OFFICIAL ? chip(d.chip, 'chip-official') : d.chip === CP.indicators.REJECTED ? chip(d.chip, 'chip-rejected') : chip(d.chip, 'chip-pending');

  /** Tính một lần: giá trị hiện tại + 40 điểm lịch sử (cửa sổ trượt) + percentile 120 cửa sổ. */
  function compute() {
    const closed = CP.market.closed(); if (closed.length < 60) return null;
    const list = CP.indicators.compute(closed);
    const n = closed.length; const W = Math.min(120, n - 60);
    return list.map((d) => {
      if (d.value == null || d.fmt === '-' || d.fmt === 'd') return { ...d, series: [], pct: null };
      const series = []; let below = 0, total = 0;
      for (let i = n - W; i <= n; i += 1) { let v = null; try { v = d.calc(closed.slice(0, i)); } catch (e) { v = null; } if (v == null || !isFinite(v)) continue; total++; if (v <= d.value) below++; if (i > n - 40) series.push(v); }
      return { ...d, series, pct: total ? Math.round((below / total) * 100) : null };
    });
  }

  function renderHead() {
    const el = els.head; clear(el); const tf = CP.state.get('tf');
    put(el, h('h1', {}, 'Chỉ số kỹ thuật'), h('button', { class: 'pairbtn', onClick: () => CP.openPairs() }, fmt.base(CP.state.get('symbol')) + '/USDT ▾'),
      h('div', { class: 'tfbar' }, ['1h', '4h', '1d'].map((x) => h('button', { class: 'ibtn model ' + (x === tf ? 'is-active' : ''), onClick: () => CP.state.set({ tf: x }) }, x))),
      h('span', { class: 'spacer' }), freshness(CP.data.freshness, CP.data.lastTick, 'Giá'),
      h('button', { class: 'ibtn', onClick: () => { if (!cache) return; modal({ title: 'Bảng thô mọi chỉ số · ' + CP.state.get('symbol') + ' · ' + tf, body: table(['Chỉ số', 'Nhóm', { label: 'Giá trị', num: 1 }, 'Nguồn gốc'], cache.map((d) => [d.id, d.group, fmtVal(d), d.chip])), wide: true }); } }, '⊞ Xem dạng bảng'));
  }
  function renderTabs() {
    const el = els.tabs; clear(el); const groups = CP.indicators.groups; if (!tab) tab = groups[0];
    put(el, groups.map((g) => h('button', { class: 'tab ' + (tab === g ? 'is-active' : ''), role: 'tab', 'aria-selected': String(tab === g), onClick: () => { tab = g; renderTabs(); renderTable(); } }, g, g === 'Phái sinh' ? h('span', { class: 'count' }, '(chờ dữ liệu)') : null)));
  }
  function renderTable() {
    const el = els.table; clear(el);
    if (!cache) { el.append(CP.ui.skeleton(200)); return; }
    const rows = cache.filter((d) => d.group === tab);
    put(el, GROUP_NOTES[tab] && h('div', { class: 'note ind-tab-note' }, GROUP_NOTES[tab]),
      table(['Chỉ số', { label: 'Giá trị', num: 1 }, { label: 'Percentile 120 cửa sổ', num: 1 }, '40 cửa sổ gần nhất', 'Nguồn gốc', 'Vào model?'], rows.map((d) => [
        h('div', {}, h('div', { class: 'ind-val' }, d.name), h('div', { class: 'ind-note' }, d.id + ' · ' + d.note)),
        h('span', { class: 'num strong' }, fmtVal(d)),
        h('span', { class: 'num' }, d.pct == null ? '—' : 'p' + d.pct),
        d.series.length > 2 ? sparkline(d.series) : h('span', { class: 'faint' }, '—'),
        chipOf(d),
        h('span', { class: d.chip === CP.indicators.OFFICIAL ? 'up-text' : 'faint' }, d.chip === CP.indicators.OFFICIAL ? '✓ có' : d.chip === CP.indicators.PENDING ? '— khi có dữ liệu' : '✗ không'),
      ]), { empty: 'Nhóm này chưa có chỉ số' }));
  }
  function renderOfficial() {
    const el = els.official; clear(el); if (!cache) return;
    const off = cache.filter((d) => d.chip === CP.indicators.OFFICIAL), pend = cache.filter((d) => d.chip === CP.indicators.PENDING);
    put(el, h('p', { class: 'muted small' }, '57 đặc trưng từng đề xuất gom thành 13 cụm độc lập; mỗi cụm một đại diện. Thêm chỉ báo cùng cụm là tiêu suất mà không thêm chiều.'),
      h('div', { class: 'grid-2' },
        h('div', {}, h('div', { class: 'strong small' }, `Bộ chính thức (${off.length})`), h('ul', { class: 'small muted', style: { margin: '4px 0 0', paddingLeft: '18px' } }, off.map((d) => h('li', {}, h('span', { class: 'mono' }, d.id), ' — ', d.name)))),
        h('div', {}, h('div', { class: 'strong small' }, `Chờ nguồn dữ liệu (${pend.length})`), h('ul', { class: 'small muted', style: { margin: '4px 0 0', paddingLeft: '18px' } }, pend.map((d) => h('li', {}, h('span', { class: 'mono' }, d.id), ' — ', d.note))))));
  }
  function renderAll() { cache = compute(); renderHead(); renderTabs(); renderTable(); renderOfficial(); }

  CP.screens.register('indicators', {
    title: 'Chỉ số', auth: false,
    async mount(outlet) {
      els = { head: h('div', { class: 'subhead' }), tabs: h('div', { class: 'tabs', role: 'tablist' }), table: h('div', {}), official: h('div', {}) };
      outlet.append(h('div', { class: 'page' }, els.head,
        h('div', { class: 'note note-pred' }, 'Kết luận HƯỚNG chỉ có ở Giao dịch / Phương pháp (một badge chủ). Trang này đo, không kết luận — giá trị chỉ số không mang màu tăng/giảm.'),
        panel({ id: 'ind-table', title: 'Bảng chỉ số', subtitle: 'chip nguồn gốc theo sổ đăng ký đặc trưng (docs/Old/14)', collapsible: false, cls: 'mt-3', body: h('div', {}, els.tabs, els.table) }),
        panel({ id: 'ind-official', title: 'Bộ chính thức dựng được + suất chờ dữ liệu', subtitle: 'sổ đăng ký đặc trưng: 13 cụm độc lập', body: els.official, cls: 'mt-3' }),
        h('div', { class: 'mt-3' }, CP.ui.disclaimer())));
      if (!['1h', '4h', '1d'].includes(CP.state.get('tf'))) CP.state.set({ tf: '1h' });
      offs.push(CP.market.on('klines', renderAll), CP.market.on('closed', renderAll), CP.market.on('fresh', renderHead),
        CP.state.subscribe((keys) => { if (keys.includes('symbol') || keys.includes('tf')) { cache = null; renderHead(); renderTable(); CP.market.load(CP.state.get('symbol'), CP.state.get('tf')); } }));
      renderHead(); renderTabs(); renderTable();
      await CP.market.load(CP.state.get('symbol'), CP.state.get('tf'));
      if (CP.market.klines.length && !cache) renderAll();
    },
    unmount() { offs.forEach((f) => f()); offs = []; cache = null; },
  });
})();
