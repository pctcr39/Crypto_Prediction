/* ══════════════════════════════════════════════════════════════════
   screens/bots.js — BOT (BOT-01..09, REQ-SAFE, UI-11)
   Không có cổng thống kê (ADR-020). Bot PAPER chạy ngay; bot TIỀN THẬT phát
   hành khi đủ bộ an toàn + đã chạy trọn một kỳ Paper + LEGAL-01. Khi bật bot,
   nhãn trạng thái kiểm chứng của phương pháp hiện bằng tiếng người.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const CP = window.CP;
  const { h, clear, put, fmt, panel, chip, modeTag, table, confirm, toast, modal, formRow, inlineError, empty } = CP.ui;
  let offs = [], timers = [], els = {}, selected = null;

  CP.ui.injectCSS('bots', `
    .safe-row{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:start;padding:6px 0;border-bottom:1px solid var(--border);font-size:var(--fs-12)}
    .safe-row:last-child{border-bottom:0}
    .safe-row .st{white-space:nowrap}
    .bot-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
    .bot-kv{display:grid;grid-template-columns:1fr auto;gap:2px 8px;font-size:var(--fs-12)}
    .bot-kv .l{color:var(--text-3)}.bot-kv .v{text-align:right}
    .botcard.is-selected{border-color:var(--accent)}
  `);

  const tierOf = (id) => CP.tiers.find((t) => t.id === id) || CP.tiers[1];

  function renderBanner() {
    const el = els.banner; clear(el); const on = CP.bots.list().filter((b) => b.status === 'ON');
    const live = on.some((b) => b.mode === 'TRADING');
    const cls = live ? 'live' : on.length ? 'paper' : '';
    put(el, h('div', { class: 'risk-banner ' + cls, role: 'status' }, live ? '⚠' : on.length ? '●' : '○', live ? h('span', {}, h('span', { class: 'strong' }, 'Bot TIỀN THẬT đang chạy'), ' — lệnh gửi lên Binance của bạn.') : on.length ? h('span', {}, h('span', { class: 'strong' }, on.length + ' bot PAPER đang chạy'), ' — quyết định khi nến đóng, ghi nhật ký; không chạm tiền thật.') : h('span', {}, 'Không bot nào đang chạy. Khởi động lại luôn về TẮT (Luật 16).'), h('span', { class: 'spacer' }), modeTag(live ? 'TRADING' : 'PAPER')));
  }
  function renderSafe() {
    const el = els.safe; clear(el); const v = CP.verify.current();
    put(el,
      h('div', { class: 'note note-pred' }, h('span', { class: 'strong' }, 'Phương pháp đang hiển thị: ' + v.label + ' (' + v.n + ' mẫu, mô phỏng). '), 'Không có cổng thống kê chặn bạn (ADR-020) — bạn quyết định có tin hay không; nền tảng chịu trách nhiệm không để phần mềm làm mất tiền vì lỗi kỹ thuật.'),
      h('div', { class: 'strong small mt-2' }, 'Bộ an toàn bắt buộc của đường lệnh (REQ-SAFE) — định nghĩa "đã viết xong", không phải cổng cấp phép'),
      h('div', {}, CP.safe.items.map((i) => h('div', { class: 'safe-row' }, h('span', { class: 'mono faint' }, i.id), h('span', {}, h('span', { class: 'strong' }, i.name), h('div', { class: 'faint' }, i.detail)), h('span', { class: 'st' }, i.done ? chip('thiết kế xong', 'chip-up') : chip('chưa viết', 'chip-pending'))))),
      h('p', { class: 'small muted mt-2' }, CP.safe.summary() + ' Bot TIỀN THẬT phát hành khi: đủ bộ này · bạn đã chạy trọn một kỳ bot PAPER · có tư vấn pháp lý (LEGAL-01).'),
      h('div', { class: 'strong small mt-2' }, 'Luật vận hành từng bot'),
      h('ul', { class: 'small muted', style: { margin: '4px 0 0', paddingLeft: '18px' } }, ['Khởi động lại = TẮT; rời trạng thái tắt chỉ sau khi đối soát sạch.', 'Lỗ ngày −2% NAV đầu ngày (00:00 UTC, gồm PnL chưa thực hiện) ⇒ chế độ an toàn, không tự bật lại; bật lại là thao tác tay có xác nhận.', '≤ 1% NAV mỗi lệnh · ≤ 5% tổng exposure.', 'Dừng lỗ là lệnh TRÊN SÀN, đặt cùng lúc lệnh vào; nút dừng khẩn cấp không bao giờ huỷ dừng lỗ.', 'Ý định vào lệnh có hạn — không bao giờ khớp bù.', 'Mất tick > 60 giây ⇒ chế độ an toàn.'].map((t) => h('li', {}, t))));
  }
  function botCard(b) {
    const t = tierOf(b.tier); const on = b.status === 'ON';
    return h('div', { class: 'card botcard ' + (selected === b.id ? 'is-selected' : ''), onClick: () => { selected = b.id; renderBots(); renderLog(); } },
      h('div', { class: 'row-between' }, h('span', { class: 'strong' }, b.name), modeTag(b.mode)),
      h('div', { class: 'status ' + (on ? 'on' : '') }, h('span', { class: 'dot' }), on ? 'Đang chạy' : 'Đã tắt'),
      h('div', { class: 'bot-kv' }, h('span', { class: 'l' }, 'Cặp'), h('span', { class: 'v' }, fmt.base(b.symbol) + '/USDT'), h('span', { class: 'l' }, 'Tầng'), h('span', { class: 'v' }, t.name + ' · ~' + t.perYear + '/năm'), h('span', { class: 'l' }, 'Giới hạn'), h('span', { class: 'v num' }, `${b.maxPerTradePct}%/lệnh · lỗ ngày ${b.dailyLossPct}% · exposure ${b.maxExposurePct}%`), h('span', { class: 'l' }, 'Quyết định'), h('span', { class: 'v num' }, 'n=' + b.log.filter((x) => x.kind === 'decision').length + ' · lệnh ' + b.stats.trades)),
      h('div', { class: 'row mt-2' },
        on ? h('button', { class: 'btn btn-sm', onClick: (e) => { e.stopPropagation(); CP.bots.setStatus(b.id, 'OFF', 'user'); renderAll(); } }, 'Tạm dừng') : h('button', { class: 'btn btn-sm btn-primary', onClick: async (e) => { e.stopPropagation(); await startBot(b); } }, 'Chạy'),
        h('button', { class: 'btn btn-sm btn-ghost', onClick: (e) => { e.stopPropagation(); selected = b.id; renderBots(); renderLog(); document.getElementById('panel-bot-log')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } }, 'Nhật ký'),
        h('button', { class: 'btn btn-sm btn-ghost', onClick: async (e) => { e.stopPropagation(); if (await confirm({ title: 'Xoá bot "' + b.name + '"?', body: h('p', {}, 'Nhật ký quyết định được giữ trong audit.'), okText: 'Xoá', danger: true })) { CP.bots.save(CP.bots.list().filter((x) => x.id !== b.id)); if (selected === b.id) selected = null; renderAll(); } } }, 'Xoá')));
  }
  async function startBot(b) {
    const v = CP.verify.current();
    const ok = await confirm({ title: 'Chạy bot "' + b.name + '"?', body: h('div', { class: 'stack-sm' }, h('div', { class: 'row' }, modeTag(b.mode), h('span', {}, fmt.base(b.symbol) + '/USDT · tầng ' + tierOf(b.tier).name)),
      h('div', { class: 'note note-pred' }, h('span', { class: 'strong' }, 'Phương pháp bot sẽ theo: ' + v.label + '. '), v.status === 'verified' ? '' : 'Chưa có bằng chứng phương pháp này thắng baseline sau phí. Bot vẫn chạy nếu bạn muốn — đây là quyết định của bạn, được ghi lại.'),
      h('p', { class: 'small muted' }, 'Bot quyết định khi nến ' + CP.state.get('tf') + ' đóng; mỗi quyết định ghi vì sao, tham chiếu dự đoán gốc, tầng và nhãn kiểm chứng lúc đó.')), okText: 'Chạy bot' });
    if (!ok) return;
    CP.bots.setStatus(b.id, 'ON', 'user'); toast('Bot đang chạy — quyết định đầu tiên khi nến đóng', 'ok'); renderAll();
  }
  function renderBots() {
    const el = els.bots; clear(el); const list = CP.bots.list();
    put(el, list.length ? h('div', { class: 'bot-grid' }, list.map(botCard)) : empty('Chưa có bot', 'Tạo bot PAPER để đo trước — bot phải chạy Paper trước khi có thể chạy tiền thật'));
  }
  function createDlg() {
    const syms = [...new Set([CP.state.get('symbol'), ...CP.state.get('favorites')])];
    const name = h('input', { class: 'input', value: 'Bot ' + fmt.base(CP.state.get('symbol')) + ' ' + (CP.bots.list().length + 1), 'aria-label': 'Tên' });
    const sym = h('select', { class: 'select' }, syms.map((s) => h('option', { value: s }, fmt.base(s) + '/USDT')));
    const tier = h('select', { class: 'select' }, CP.tiers.map((t) => h('option', { value: t.id, selected: t.id === CP.state.get('tier') }, `${t.name} · ~${t.perYear}/đồng/năm — tần suất, không phải chất lượng`)));
    const per = h('input', { class: 'input num', type: 'number', min: '0.1', max: '1', step: '0.1', value: '1' });
    const dl = h('input', { class: 'input num', type: 'number', min: '0.5', max: '2', step: '0.5', value: '2' });
    const ex = h('input', { class: 'input num', type: 'number', min: '1', max: '5', step: '1', value: '5' });
    const can = CP.mode.canTrade();
    const modePaper = h('input', { type: 'radio', name: 'bmode', value: 'PAPER', checked: true });
    const modeReal = h('input', { type: 'radio', name: 'bmode', value: 'TRADING', disabled: true });
    const wrap = h('div', { class: 'stack-sm' });
    const close = modal({ title: 'Tạo bot', body: put(wrap, formRow('Tên', name), formRow('Cặp', sym), formRow('Tầng độ chọn lọc', tier, 'Chỉ chọn tầng và cách hiển thị — không chọn tham số rào chắn (ADR-018).'),
      h('div', { class: 'grid-3' }, formRow('% NAV mỗi lệnh (≤ 1)', per), formRow('Lỗ ngày % (≤ 2)', dl), formRow('Exposure % (≤ 5)', ex)),
      h('div', { class: 'stack-sm' }, h('label', { class: 'check' }, modePaper, h('span', {}, modeTag('PAPER'), ' ví ảo — bắt buộc chạy trước')), h('label', { class: 'check', title: can.reasons.join(' · ') }, modeReal, h('span', {}, modeTag('TRADING'), ' chưa phát hành: ' + (can.reasons[0] || '') + (can.reasons.length > 1 ? ' (+' + (can.reasons.length - 1) + ')' : '')))),
      h('button', { class: 'btn btn-primary', onClick: () => { try { if (+per.value > 1 || +dl.value > 2 || +ex.value > 5) throw new Error('Giới hạn vượt trần hệ thống (1% · 2% · 5%)'); CP.bots.create({ name: name.value.trim() || 'Bot', symbol: sym.value, tier: tier.value, maxPerTradePct: +per.value, dailyLossPct: +dl.value, maxExposurePct: +ex.value, mode: modeReal.checked ? 'TRADING' : 'PAPER' }); close(); toast('Đã tạo bot ở trạng thái TẮT — bấm "Chạy" để bật', 'ok'); renderAll(); } catch (e) { inlineError(wrap, e.message); } } }, 'Tạo bot (trạng thái TẮT)')) });
  }
  function renderLog() {
    const el = els.log; clear(el); const b = CP.bots.list().find((x) => x.id === selected) || CP.bots.list()[0];
    if (!b) { el.append(empty('Chưa có bot')); return; }
    selected = b.id;
    const left = CP.nextClose(CP.state.get('tf')) - CP.data.now();
    put(el, h('div', { class: 'row' }, h('span', { class: 'strong' }, b.name), modeTag(b.mode), h('span', { class: 'spacer' }), h('button', { class: 'btn btn-sm', onClick: () => { if (!CP.market.pred) return toast('Chưa có dự đoán', 'error'); CP.bots.onCandleClose(CP.market.pred, CP.market.last()); renderAll(); toast('Đã mô phỏng một lần nến đóng', 'info'); } }, 'Mô phỏng nến đóng (prototype)')),
      table(['Giờ UTC', 'Loại', 'Nội dung', 'Tầng · nhãn lúc đó', 'Dự đoán'], b.log.slice(0, 60).map((x) => [h('span', { class: 'num' }, fmt.dateTimeUTC(x.at)), x.kind === 'kill' ? chip('dừng khẩn', 'chip-down') : x.kind === 'state' ? chip('trạng thái', '') : chip('quyết định', 'chip-pred'), x.text, x.tier ? x.tier + ' · ' + (x.verify || '') : '—', h('span', { class: 'mono faint tiny' }, x.predictionId ? x.predictionId.split('|')[1] : '—')]), { empty: `Bot chưa ra quyết định nào — chờ nến ${CP.state.get('tf')} đóng (còn ${fmt.countdown(left)})` }));
  }
  function renderAll() { renderBanner(); renderBots(); renderLog(); }

  CP.screens.register('bots', {
    title: 'Bot', auth: true,
    async mount(outlet) {
      els = { banner: h('div', {}), safe: h('div', {}), bots: h('div', {}), log: h('div', {}) };
      outlet.append(h('div', { class: 'page' }, h('div', { class: 'subhead' }, h('h1', {}, 'Bot tự giao dịch'), h('span', { class: 'muted small' }, 'theo khuyến nghị của phương pháp, ở tầng bạn chọn, trong giới hạn của bạn'), h('span', { class: 'spacer' }), h('button', { class: 'btn btn-primary', onClick: createDlg }, '+ Tạo bot')),
        els.banner,
        h('div', { class: 'grid-2 mt-3' }, panel({ id: 'bot-safe', title: 'Nói thật & bộ an toàn', subtitle: 'ADR-020 · REQ-SAFE', body: els.safe }), panel({ id: 'bot-list', title: 'Bot của bạn', collapsible: false, body: els.bots })),
        panel({ id: 'bot-log', title: 'Nhật ký quyết định', subtitle: 'BOT-05 · người dùng đọc được', cls: 'mt-3', collapsible: false, body: els.log }),
        h('div', { class: 'mt-3 stack-sm' }, h('button', { class: 'btn btn-danger btn-block', onClick: async () => { if (await confirm({ title: 'DỪNG KHẨN CẤP mọi bot của bạn?', body: h('p', {}, 'Ngừng vòng lặp, huỷ lệnh vào chưa khớp; GIỮ NGUYÊN lệnh dừng lỗ trên sàn. Gõ STOP để xác nhận.'), okText: 'Dừng tất cả', danger: true, requireText: 'STOP' })) { CP.bots.stopAll('user'); toast('Đã dừng mọi bot', 'ok'); renderAll(); } } }, '■ DỪNG KHẨN CẤP mọi bot'), h('p', { class: 'faint small' }, 'Sau khởi động lại, mọi bot luôn TẮT. Nút dừng khẩn cấp không bao giờ huỷ lệnh dừng lỗ — "thoát hết" là thao tác riêng.'))));
      renderAll(); renderSafe();
      offs.push(CP.market.on('closed', renderAll), CP.market.on('klines', renderSafe));
      if (!CP.market.klines.length) CP.market.load(CP.state.get('symbol'), CP.state.get('tf'));
      timers.push(setInterval(() => { const e = els.log.querySelector('td.empty'); if (e) e.textContent = `Bot chưa ra quyết định nào — chờ nến ${CP.state.get('tf')} đóng (còn ${fmt.countdown(CP.nextClose(CP.state.get('tf')) - CP.data.now())})`; }, 1000));
    },
    unmount() { offs.forEach((f) => f()); offs = []; timers.forEach(clearInterval); timers = []; },
  });
})();
