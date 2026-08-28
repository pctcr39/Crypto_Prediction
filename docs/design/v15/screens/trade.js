/* ══════════════════════════════════════════════════════════════════
   screens/trade.js — MÀN GIAO DỊCH (trang mặc định)
   Trục Binance Spot: sổ lệnh — chart — form — sổ lệnh dưới. Khác Binance ở
   một điểm cố ý: PredictionCard đứng TRÊN form đặt lệnh (sản phẩm này bán
   dự đoán, không bán khớp lệnh). Một badge hướng chủ duy nhất (UI-07).
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const CP = window.CP;
  const { h, clear, put, fmt, panel, dirBadge, freshness, chip, modeTag, table, confirm, toast, modal, probMeter, empty, DIR } = CP.ui;
  const TFS = ['1m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d', '1w'];
  const MODEL_TFS = ['1h', '4h', '1d'];

  CP.ui.injectCSS('trade', `
    .pc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
    .pc-q{display:flex;flex-direction:column;gap:0}
    .pc-q .l{font-size:var(--fs-11);color:var(--text-3)}
    .pc-q .v{font-size:var(--fs-14);font-weight:600}
    .passport{font-family:var(--font-mono);font-size:var(--fs-11);color:var(--text-3);line-height:1.6;word-break:break-all}
    .stale-band{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:var(--r-1);background:color-mix(in srgb,var(--status-slow) 14%,transparent);color:var(--text-1);font-size:var(--fs-12)}
    .rec{display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;font-size:var(--fs-12)}
    .rec .l{color:var(--text-3)}.rec .v{text-align:right}
    .of-row{display:flex;justify-content:space-between;font-size:var(--fs-12);color:var(--text-2);padding:2px 0}
    .of-row .v{color:var(--text-1)}
    .of-conv{font-size:var(--fs-11);color:var(--text-3);line-height:1.45;border-top:1px dashed var(--border);padding-top:6px;margin-top:6px}
    .trades{font-family:var(--font-mono);font-size:var(--fs-11);display:flex;flex-direction:column}
    .trades div{display:grid;grid-template-columns:1fr 1fr 1fr;padding:1px 8px}
    .trades div span:nth-child(2),.trades div span:nth-child(3){text-align:right}
    .chart-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:6px 8px;border-bottom:1px solid var(--border)}
    .chart-head .spacer{flex:1}
    .trade.is-full .area-chart{position:fixed;inset:56px 0 0 0;z-index:50;--chart-h:calc(100vh - 56px - 120px)}
    .lock-note{display:flex;gap:8px;align-items:flex-start;padding:8px;border-radius:var(--r-1);background:var(--surface-2);font-size:var(--fs-12);color:var(--text-2)}
    .tier-line{font-size:var(--fs-11);color:var(--text-3);border-top:1px solid var(--border);padding-top:6px;margin-top:6px}
    @media(max-width:767px){.pc-grid{grid-template-columns:repeat(3,1fr)}}
  `);

  let offs = [], chart = null, raf = 0, timers = [], els = {}, form = null, tickersLoaded = false;

  function tfLabel(tf) { const m = CP.pred.MODEL_OF(tf); return MODEL_TFS.includes(tf) && m.model === tf ? `model ${m.model}` : `model ${m.model} · chiếu lên khung ${tf}`; }

  // ── TICKER HEADER ────────────────────────────────────────────────
  function renderTicker() {
    const sym = CP.state.get('symbol'); const t = CP.market.ticker || (CP.market.tickersList || []).find((x) => x.symbol === sym) || null; const last = CP.market.last();
    const el = els.ticker; clear(el);
    const favs = CP.state.get('favorites'); const isFav = favs.includes(sym);
    const prevPrice = el.dataset.last ? +el.dataset.last : null;
    const priceEl = h('span', { class: 'price num-hero ' + (CP.data.freshness === 'down' ? 'is-down' : ''), 'aria-label': 'Giá hiện tại' }, fmt.price(last));
    if (prevPrice != null && last != null && last !== prevPrice) { priceEl.classList.add(last > prevPrice ? 'flash-up' : 'flash-down'); }
    el.dataset.last = last ?? '';
    const pct = t ? t.pct : null;
    put(el, 
      h('button', { class: 'pairbtn', onClick: () => CP.openPairs(), 'aria-haspopup': 'dialog' }, h('span', {}, fmt.base(sym), h('span', { class: 'faint' }, '/USDT')), h('span', { class: 'caret', 'aria-hidden': 'true' }, '▾')),
      h('button', { class: 'star ' + (isFav ? 'is-on' : ''), 'aria-label': (isFav ? 'Bỏ ưa thích ' : 'Ưa thích ') + sym, onClick: () => CP.state.set({ favorites: isFav ? favs.filter((x) => x !== sym) : [...favs, sym] }) }, isFav ? '★' : '☆'),
      priceEl,
      h('span', { class: 'num strong ' + (pct == null ? 'muted' : pct >= 0 ? 'up-text' : 'down-text') }, pct == null ? '—' : (pct >= 0 ? '▲ ' : '▼ ') + fmt.pct(pct)),
      h('span', { class: 'stat' }, h('span', { class: 'l' }, 'Cao 24h'), h('span', { class: 'v num' }, fmt.price(t && t.high))),
      h('span', { class: 'stat' }, h('span', { class: 'l' }, 'Thấp 24h'), h('span', { class: 'v num' }, fmt.price(t && t.low))),
      h('span', { class: 'stat' }, h('span', { class: 'l' }, 'KL 24h (USDT)'), h('span', { class: 'v num' }, fmt.compact(t && t.qv))),
      h('span', { class: 'stat hide-m' }, h('span', { class: 'l' }, 'Nến ' + CP.state.get('tf') + ' đóng sau'), h('span', { class: 'v num', id: 'tk-cd' }, fmt.countdown(CP.nextClose(CP.state.get('tf')) - CP.data.now()))),
      h('span', { class: 'spacer' }),
      freshness(CP.data.freshness, CP.data.lastTick, 'Giá'),
      CP.data.source === 'fallback' && chip('ẢNH CHỤP · không phải giá sống', 'chip-warn'),
    );
  }
  function updateTickerPrice() { // chỉ đổi số, không dựng lại DOM (mỗi tick)
    const last = CP.market.last(); const el = els.ticker; const priceEl = el.querySelector('.price'); if (!priceEl || last == null) return;
    const prev = +el.dataset.last; if (last === prev) return;
    priceEl.textContent = fmt.price(last); priceEl.classList.remove('flash-up', 'flash-down'); void priceEl.offsetWidth; priceEl.classList.add(last > prev ? 'flash-up' : 'flash-down'); el.dataset.last = last;
    const t = CP.market.ticker; if (t) { const p = el.querySelector('.strong.num'); if (p) { p.textContent = (t.pct >= 0 ? '▲ ' : '▼ ') + fmt.pct(t.pct); p.className = 'num strong ' + (t.pct >= 0 ? 'up-text' : 'down-text'); } }
  }

  // ── CHART ────────────────────────────────────────────────────────
  function renderChartHead() {
    const tf = CP.state.get('tf'); const el = els.chartHead; clear(el);
    const bar = h('div', { class: 'tfbar', role: 'tablist', 'aria-label': 'Khung thời gian' }, TFS.map((x) => h('button', { class: 'ibtn ' + (x === tf ? 'is-active ' : '') + (MODEL_TFS.includes(x) ? 'model' : ''), role: 'tab', 'aria-selected': String(x === tf), title: MODEL_TFS.includes(x) ? 'Khung có model riêng' : 'Chiếu model gần nhất lên khung này', onClick: () => CP.state.set({ tf: x }) }, x)));
    put(el, bar, chip(tfLabel(tf), 'chip-pred'), h('span', { class: 'spacer' }),
      h('button', { class: 'ibtn', title: 'Xem dạng bảng', 'aria-label': 'Xem dạng bảng', onClick: () => modal({ title: 'Nến ' + CP.state.get('symbol') + ' · ' + tf + ' (30 nến gần nhất, UTC)', body: chart.tableView(), wide: true }) }, '⊞ bảng'),
      h('button', { class: 'ibtn', title: 'Phóng to chart', 'aria-label': 'Phóng to chart', onClick: () => { els.grid.classList.toggle('is-full'); setTimeout(() => chart.resize(), 30); } }, '⤢'),
      h('button', { class: 'ibtn', title: 'Bố cục', 'aria-label': 'Bố cục', onClick: openLayoutMenu }, '⚙'));
  }
  function openLayoutMenu() {
    const cur = CP.state.get('layout');
    const set = (l) => { CP.state.set({ layout: l }); applyLayout(); close(); };
    const close = modal({ title: 'Bố cục màn Giao dịch', body: h('div', { class: 'stack' },
      h('div', { class: 'seg' }, [['simple', 'Đơn giản'], ['standard', 'Chuẩn'], ['terminal', 'Terminal']].map(([k, l]) => h('button', { class: 'seg-btn ' + (cur === k ? 'is-active' : ''), onClick: () => set(k) }, l))),
      h('p', { class: 'muted small' }, 'Đơn giản: ẩn sổ lệnh · Chuẩn: 3 cột · Terminal: sổ lệnh dưới cao hơn + khớp lệnh gần đây.'),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: localStorage.getItem('cp15.quickswitch') !== '0', onChange: (e) => localStorage.setItem('cp15.quickswitch', e.target.checked ? '1' : '0') }), 'Click sổ lệnh điền giá và tự đổi Mua/Bán (Quick Switch)'),
      h('button', { class: 'btn', onClick: () => { CP.state.set({ layout: 'standard' }); localStorage.removeItem('cp15.collapsed'); applyLayout(); close(); CP.router.render(); } }, 'Về bố cục mặc định')) });
  }
  function applyLayout() { const l = CP.state.get('layout'); els.grid.className = 'trade layout-' + l; els.trades.hidden = l !== 'terminal'; setTimeout(() => chart && chart.resize(), 30); }

  // ── SIGNAL STRIP (05 §3.5) ───────────────────────────────────────
  function renderStrip() {
    const el = els.strip; clear(el); const hist = CP.market.hist.slice(-60);
    if (!hist.length) { el.append(h('span', { class: 'faint small' }, 'Chưa có tín hiệu quá khứ')); return; }
    hist.forEach((x) => el.append(h('button', { class: 'sig ' + (x.direction === 'FLAT' ? 'silent' : x.hit ? 'hit' : 'miss'), title: `Tín hiệu ${fmt.dateTimeUTC(x.issuedAt)} UTC: ${DIR[x.direction].arrow} ${DIR[x.direction].text}${x.direction !== 'FLAT' ? ' ' + Math.round((x.direction === 'UP' ? x.pUp : 1 - x.pUp) * 100) + '% → ' + (x.hit ? '✓ đúng' : '✗ sai') : ' (im lặng)'}`, 'aria-label': 'Tín hiệu ' + fmt.dateTimeUTC(x.issuedAt), onClick: openHistory })));
    const st = CP.pred.stats(CP.market.hist);
    el.append(h('span', { class: 'sig-legend' }, `✓ ${st.hits} · ✗ ${st.misses} · n=${st.n}${st.enough ? '' : ' (chưa đủ dữ liệu)'} · hiệu suất giả định · mô phỏng`));
  }
  function openHistory() {
    const rows = CP.market.hist.slice().reverse().slice(0, 60).map((x) => [fmt.dateTimeUTC(x.issuedAt), dirBadge(x.direction, x.pUp), h('span', { class: 'num' }, x.level), h('span', { class: 'num' }, fmt.pct(x.retPct)), x.direction === 'FLAT' ? h('span', { class: 'muted' }, '— im lặng') : x.hit ? h('span', { class: 'up-text' }, '✓ đúng') : h('span', { class: 'down-text' }, '✗ sai'), h('span', { class: 'num' }, x.direction === 'FLAT' ? '—' : x.R.toFixed(2) + 'R')]);
    modal({ title: 'Lịch sử tín hiệu · ' + CP.state.get('symbol') + ' · ' + CP.state.get('tf') + ' (mô phỏng)', body: h('div', { class: 'stack' }, h('p', { class: 'muted small' }, 'Ghi trước khi biết kết cục, không sửa, không xoá. ✗ ngang hàng ✓. R đã trừ phí 0,10%×2 + trượt 0,05%×2.'), table(['Giờ UTC', 'Hướng', { label: 'Mức', num: 1 }, { label: 'Kết cục', num: 1 }, 'Chấm', { label: 'R', num: 1 }], rows)), wide: true });
  }

  // ── PREDICTION CARD ──────────────────────────────────────────────
  function renderPred() {
    const el = els.pred; clear(el); const p = CP.market.pred; const tf = CP.state.get('tf');
    if (!p) { put(el, empty('Chưa có dự đoán', 'Cần ≥ 60 nến đã đóng')); return; }
    const now = CP.data.now(); const stale = now > p.validUntil;
    const tier = CP.tiers.find((t) => t.id === CP.state.get('tier')) || CP.tiers[1];
    const belowTier = p.direction !== 'FLAT' && p.level < tier.level;
    const conf = p.direction === 'DOWN' ? 1 - p.pUp : p.pUp;
    put(el, 
      h('div', { class: 'row-between' }, h('div', { class: 'row gap-2' }, Object.assign(dirBadge(p.direction, p.pUp, { size: 'lg' }), { className: 'badge lg master badge-' + DIR[p.direction].cls }), chip('MÔ PHỎNG · ' + CP.verify.current().label, 'chip-sim')), chip(tfLabel(tf), 'chip-pred')),
      stale && h('div', { class: 'stale-band', role: 'status' }, '◌ QUÁ HẠN — dự đoán này hết hiệu lực lúc ' + fmt.timeUTC(p.validUntil) + ' UTC; dự đoán mới khi nến đóng.'),
      p.direction === 'FLAT' ? h('p', { class: 'muted small' }, 'Im lặng: ' + p.silenceReason + '. KHÔNG RÕ là câu trả lời bình thường của một hệ trung thực.') : null,
      belowTier && h('p', { class: 'muted small' }, `Mức ${p.level} dưới tầng ${tier.name} (${tier.level}) — tín hiệu hiển thị nhưng bot/khuyến nghị ở tầng của bạn bỏ qua.`),
      h('div', { class: 'stack-sm' }, probMeter(p.direction, p.pUp, p.pRequired),
        h('div', { class: 'of-row' }, h('span', {}, p.direction === 'FLAT' ? 'p_up (đã hiệu chỉnh)' : 'độ tin cậy hướng ' + DIR[p.direction].text + ' (đã hiệu chỉnh)'), h('span', { class: 'v num' }, Math.round((p.direction === 'FLAT' ? p.pUp : conf) * 100) + '%')),
        h('div', { class: 'of-row' }, h('span', {}, 'p_required — thắng tối thiểu để hoà vốn sau phí'), h('span', { class: 'v num pred-text' }, Math.round(p.pRequired * 100) + '%'))),
      h('div', { class: 'pc-grid' }, [['q10', p.q10], ['q50', p.q50], ['q90', p.q90]].map(([l, v]) => h('div', { class: 'pc-q' }, h('span', { class: 'l' }, l), h('span', { class: 'v num pred-text' }, fmt.price(v))))),
      h('div', { class: 'of-row' }, h('span', {}, 'Biến động kỳ vọng (σ̂ theo chân trời)'), h('span', { class: 'v num pred-text' }, '±' + p.expectedMovePct.toFixed(2) + '%')),
      h('div', { class: 'of-row' }, h('span', {}, 'Hiệu lực đến'), h('span', { class: 'v num' }, fmt.dateTimeUTC(p.validUntil) + ' UTC · ', h('span', { id: 'pc-cd' }, stale ? 'đã hết' : 'còn ' + fmt.countdown(p.validUntil - now)))),
      h('div', { class: 'passport' }, `tầng 1 rule-based · model ${p.model} · horizon ${p.horizonH}h · phát ${fmt.dateTimeUTC(p.issuedAt)} UTC · id ${p.id}`),
      h('div', { class: 'tier-line' }, `Tầng: ${tier.name} · ~${tier.perYear} khuyến nghị/đồng/năm — điều tiết tần suất, không phải chất lượng (ADR-018). `, h('a', { href: '#/consult' }, 'Đổi tầng')),
      CP.ui.disclaimer(),
    );
    renderRec();
  }

  // ── RECOMMENDATION CARD — chỉ khung 1d (ADR-002) · bốn số PRED-03b · nhãn kiểm chứng UI-11
  function renderRec() {
    const el = els.rec; clear(el); const p = CP.market.pred; if (!p) return;
    if (p.model !== '1d') { put(el, h('div', { class: 'lock-note' }, h('span', { 'aria-hidden': 'true' }, 'ℹ'), h('span', {}, 'Khung 1h/4h chỉ hiển thị dự đoán, không phát khuyến nghị vào lệnh (ADR-002). Chuyển khung 1d để xem khuyến nghị.'))); return; }
    const tier = CP.tiers.find((t) => t.id === CP.state.get('tier')) || CP.tiers[1];
    const v = CP.verify.current();
    const act = p.direction === 'UP' && p.level >= tier.level;
    const pWin = p.direction === 'DOWN' ? 1 - p.pUp : p.pUp;
    put(el, 
      h('div', { class: 'row-between' }, h('span', { class: 'strong' }, act ? '▲ VÀO (mua giao ngay)' : p.direction === 'DOWN' ? '▼ THOÁT / đứng ngoài' : '● IM LẶNG'), chip('rào chắn 1,2σ̂ / 6,0σ̂ · cố định', 'chip-pred')),
      p.direction === 'FLAT' && h('p', { class: 'muted small' }, 'Lý do im lặng: ' + p.silenceReason),
      h('div', { class: 'rec' },
        h('span', { class: 'l' }, 'p_win (đã hiệu chỉnh)'), h('span', { class: 'v num' }, Math.round(pWin * 100) + '%'),
        h('span', { class: 'l' }, 'p_star — hoà vốn của chính rào chắn này'), h('span', { class: 'v num pred-text' }, Math.round(p.pRequired * 100) + '%'),
        h('span', { class: 'l' }, 'Giá dừng lỗ (1,2σ̂)'), h('span', { class: 'v num pred-text' }, fmt.price(p.barrier.sl)),
        h('span', { class: 'l' }, 'Giá mục tiêu (6,0σ̂)'), h('span', { class: 'v num pred-text' }, fmt.price(p.barrier.tp)),
        h('span', { class: 'l' }, 'Vào tại'), h('span', { class: 'v num' }, 'open nến kế (≈ ' + fmt.price(CP.market.last()) + ')'),
        h('span', { class: 'l' }, 'Cỡ gợi ý'), h('span', { class: 'v num' }, '≤ 1% NAV')),
      h('div', { class: 'note note-pred', role: 'note' }, h('span', { class: 'strong' }, 'Trạng thái kiểm chứng: ' + v.label + ' (' + v.n + ' mẫu, mô phỏng). '), v.why + '. Bạn quyết định có tin hay không — nền tảng không chặn, chỉ nói thật.'),
      act && h('button', { class: 'btn btn-sm', onClick: () => { form.setSide('BUY'); form.setPctNav(1); form.focus(); } }, 'Đưa vào form (chỉ điền, không gửi)'),
      h('p', { class: 'faint tiny' }, 'Không có ô chỉnh dừng lỗ/chốt lời: tham số rào chắn là hằng số đã đăng ký trước (ADR-018 trục A). Hiệu suất giả định — không trộn với lệnh thật của bạn.'),
    );
  }

  // ── ORDER BOOK ───────────────────────────────────────────────────
  function renderBook() {
    const el = els.book; clear(el); const d = CP.market.depth; const last = CP.market.last();
    if (!d) { put(el, CP.ui.skeleton(300)); return; }
    const n = 12; const asks = d.asks.slice(0, n).reverse(), bids = d.bids.slice(0, n);
    const maxQ = Math.max(...asks.map((x) => x[1]), ...bids.map((x) => x[1]), 1e-9);
    const row = (side, [p, q], cum) => h('div', { class: 'ob-row ' + side, role: 'button', tabindex: '0', 'aria-label': `${side === 'ask' ? 'Bán' : 'Mua'} ${fmt.price(p)} · ${fmt.qty(q)}`, onClick: () => bookClick(side, p), onKeydown: (e) => { if (e.key === 'Enter') bookClick(side, p); } },
      h('span', { class: 'bar', style: { width: Math.min(100, (q / maxQ) * 100) + '%' } }), h('span', { class: 'price num' }, fmt.price(p)), h('span', { class: 'num' }, fmt.qty(q)), h('span', { class: 'num faint' }, fmt.compact(cum)));
    let cum = 0; const askRows = asks.slice().reverse().map((a) => { cum += a[0] * a[1]; return [a, cum]; }).reverse();
    cum = 0; const bidRows = bids.map((b) => { cum += b[0] * b[1]; return [b, cum]; });
    const spread = d.asks[0] && d.bids[0] ? d.asks[0][0] - d.bids[0][0] : null;
    const prev = +(el.dataset.last || 0);
    put(el, 
      h('div', { class: 'ob-head' }, h('span', {}, 'Giá'), h('span', {}, 'SL'), h('span', {}, 'Tổng USDT')),
      askRows.map(([a, c]) => row('ask', a, c)),
      h('div', { class: 'ob-spread' }, h('span', { class: 'last num ' + (last >= prev ? 'up-text' : 'down-text') }, (last >= prev ? '▲ ' : '▼ ') + fmt.price(last)), h('span', { class: 'num faint' }, spread != null ? 'chênh ' + fmt.price(spread) : '')),
      bidRows.map(([b, c]) => row('bid', b, c)));
    el.dataset.last = last;
  }
  function bookClick(side, price) {
    form.setPrice(price); form.setType('LIMIT');
    if (localStorage.getItem('cp15.quickswitch') !== '0') form.setSide(side === 'ask' ? 'BUY' : 'SELL'); // click ask ⇒ mua ngay giá đó
    form.focus();
  }
  function renderTrades() {
    const el = els.tradesBody; clear(el); const tr = CP.market.trades.slice(-18).reverse();
    if (!tr.length) { el.append(empty('Chưa có khớp lệnh')); return; }
    el.append(h('div', { class: 'trades' }, h('div', { class: 'faint' }, h('span', {}, 'Giá'), h('span', {}, 'SL'), h('span', {}, 'Giờ')), tr.map((x) => h('div', {}, h('span', { class: 'num ' + (x.m ? 'down-text' : 'up-text') }, (x.m ? '▼ ' : '▲ ') + fmt.price(x.p)), h('span', { class: 'num' }, fmt.qty(x.q)), h('span', { class: 'num faint' }, new Date(x.t).toISOString().slice(11, 19))))));
  }

  // ── ORDER FORM (PAPER-02 · TRADE-01 · UI-10) ─────────────────────
  function buildForm() {
    const st = { side: 'BUY', type: 'MARKET', price: '', amount: '', total: '', pct: 0, lastEdited: 'total' };
    const root = h('div', { class: 'stack-sm' });
    const api = {
      root,
      setSide(s) { st.side = s; draw(); }, setType(t) { st.type = t; draw(); }, setPrice(p) { st.price = String(+p.toFixed(6)); draw(); },
      setPctNav(pctNav) { const eq = CP.paper.equity({ [CP.state.get('symbol')]: CP.market.last() }); st.total = (eq * pctNav / 100).toFixed(2); st.lastEdited = 'total'; draw(); },
      focus() { const i = root.querySelector('input:not([disabled])'); i && i.focus(); root.scrollIntoView({ block: 'nearest' }); },
      refresh: () => draw(),
    };
    function lockReason() {
      if (CP.mode.get() === 'TRADING') { const c = CP.mode.canTrade(); if (!c.ok) return 'TIỀN THẬT chưa sẵn sàng: ' + c.reasons.join(' · '); return null; }
      if (CP.data.freshness === 'down') return 'Mất kết nối giá — không đặt lệnh khi không biết giá (RULE 8)';
      return null;
    }
    function preview() {
      const sym = CP.state.get('symbol'); const last = CP.market.last();
      const req = { symbol: sym, side: st.side, type: st.type, price: st.price, last };
      if (st.lastEdited === 'amount' && st.amount) req.baseQty = st.amount; else if (st.total) req.quoteQty = st.total;
      else return null;
      return CP.paper.preview(req);
    }
    function draw() {
      clear(root);
      const sym = CP.state.get('symbol'), base = fmt.base(sym); const s = CP.paper.state(); const pos = s.positions[sym] || { qty: 0 }; const last = CP.market.last();
      const lock = lockReason(); const pv = preview();
      const avail = st.side === 'BUY' ? s.cash : pos.qty;
      const pctBtns = h('div', { class: 'pctrow' }, [25, 50, 75, 100].map((p) => h('button', { class: 'btn ' + (st.pct === p ? 'btn-primary' : ''), type: 'button', onClick: () => { st.pct = p; if (st.side === 'BUY') { st.total = (s.cash * p / 100 / (1 + CP.costs.taker + (st.type === 'MARKET' ? CP.costs.slippage : 0))).toFixed(2); st.lastEdited = 'total'; } else { st.amount = String(+(pos.qty * p / 100).toFixed(6)); st.lastEdited = 'amount'; } draw(); } }, p + '%')));
      root.append(
        h('div', { class: 'row-between' }, h('div', { class: 'seg', role: 'tablist' }, [['LIMIT', 'Limit'], ['MARKET', 'Market']].map(([k, l]) => h('button', { class: 'seg-btn ' + (st.type === k ? 'is-active' : ''), role: 'tab', 'aria-selected': String(st.type === k), onClick: () => { st.type = k; draw(); } }, l))), modeTag(CP.mode.get())),
        h('div', { class: 'seg', role: 'tablist', style: { width: '100%' } }, h('button', { class: 'seg-btn buy ' + (st.side === 'BUY' ? 'is-active' : ''), style: { flex: 1, minHeight: '40px' }, role: 'tab', 'aria-selected': String(st.side === 'BUY'), onClick: () => { st.side = 'BUY'; st.pct = 0; draw(); } }, '▲ Mua'), h('button', { class: 'seg-btn sell ' + (st.side === 'SELL' ? 'is-active' : ''), style: { flex: 1, minHeight: '40px' }, role: 'tab', 'aria-selected': String(st.side === 'SELL'), onClick: () => { st.side = 'SELL'; st.pct = 0; draw(); } }, '▼ Bán')),
        h('div', { class: 'of-row' }, h('span', {}, 'Khả dụng'), h('span', { class: 'v num' }, st.side === 'BUY' ? fmt.num(s.cash) + ' USDT' : fmt.qty(pos.qty) + ' ' + base)),
        st.type === 'LIMIT' && h('label', { class: 'frow' }, h('span', { class: 'flabel' }, 'Giá (USDT)'), h('div', { class: 'input-wrap' }, h('input', { class: 'input num', inputmode: 'decimal', value: st.price, placeholder: last ? fmt.price(last) : '', onInput: (e) => { st.price = e.target.value; st.pct = 0; drawPreview(); } }), h('span', { class: 'suffix' }, 'USDT'))),
        h('label', { class: 'frow' }, h('span', { class: 'flabel' }, 'Số lượng (' + base + ')'), h('div', { class: 'input-wrap' }, h('input', { class: 'input num', inputmode: 'decimal', value: st.amount, placeholder: st.side === 'SELL' ? 'để trống = bán toàn bộ' : '0.0000', onInput: (e) => { st.amount = e.target.value; st.lastEdited = 'amount'; st.pct = 0; st.total = ''; drawPreview(); } }), h('span', { class: 'suffix' }, base))),
        st.side === 'BUY' && h('label', { class: 'frow' }, h('span', { class: 'flabel' }, 'Tổng (USDT)'), h('div', { class: 'input-wrap' }, h('input', { class: 'input num', inputmode: 'decimal', value: st.total, placeholder: 'tối thiểu ' + CP.paper.MIN_NOTIONAL, onInput: (e) => { st.total = e.target.value; st.lastEdited = 'total'; st.pct = 0; st.amount = ''; drawPreview(); } }), h('span', { class: 'suffix' }, 'USDT'))),
        pctBtns,
        h('div', { id: 'of-preview' }),
        lock ? h('div', { class: 'lock-note', role: 'status' }, h('span', { 'aria-hidden': 'true' }, '🔒'), h('span', {}, lock)) : null,
        h('button', { class: 'btn btn-block ' + (st.side === 'BUY' ? 'btn-buy' : 'btn-sell'), disabled: !!lock, onClick: submit }, (st.side === 'BUY' ? 'Mua ' : 'Bán ') + base + (CP.mode.get() === 'PAPER' ? ' · PAPER' : ' · TIỀN THẬT')),
        h('div', { id: 'of-err' }),
        h('div', { class: 'of-conv' }, 'Quy ước (hiện trước khi bấm): giao ngay, không bán khống · lệnh tối thiểu ' + CP.paper.MIN_NOTIONAL + ' USDT · nút % tính theo tiền mặt khi Mua, theo số coin đang giữ khi Bán · ô Số lượng trống khi Bán = bán toàn bộ · lệnh vượt số dư được kẹp xuống và báo · phí taker 0,10% + trượt 0,05% (Market) · lệnh > 50% số dư cần xác nhận thêm.'),
      );
      drawPreview();
    }
    function drawPreview() {
      const box = root.querySelector('#of-preview'); if (!box) return; clear(box);
      if (st.side === 'SELL' && !st.amount) { const sym = CP.state.get('symbol'); const pos = CP.paper.state().positions[sym]; if (pos && pos.qty > 0) { st.amount = String(pos.qty); st.lastEdited = 'amount'; } }
      const pv = preview(); if (!pv) return;
      box.append(h('div', { class: 'card', style: { padding: '8px 10px' } },
        h('div', { class: 'of-row' }, h('span', {}, 'Ước tính'), h('span', { class: 'v num' }, fmt.qty(pv.base) + ' ' + fmt.base(CP.state.get('symbol')) + ' ≈ ' + fmt.num(pv.quote) + ' USDT')),
        h('div', { class: 'of-row' }, h('span', {}, 'Phí taker 0,10%' + (pv.slip ? ' + trượt 0,05%' : '')), h('span', { class: 'v num' }, fmt.num(pv.fee + pv.slip) + ' USDT')),
        h('div', { class: 'of-row' }, h('span', {}, st.side === 'BUY' ? 'Tổng trừ tiền mặt' : 'Tổng nhận'), h('span', { class: 'v num strong' }, fmt.num(pv.total) + ' USDT')),
        h('div', { class: 'of-row' }, h('span', {}, 'Cỡ so với NAV'), h('span', { class: 'v num ' + (pv.pctNav > 50 ? 'down-text' : '') }, pv.pctNav.toFixed(1) + '%')),
        pv.warnings.map((w) => h('div', { class: 'tiny', style: { color: 'var(--warn)' } }, '⚠ ' + w)),
        pv.errors.map((e) => h('div', { class: 'inline-err' }, e))));
    }
    async function submit() {
      const errBox = root.querySelector('#of-err'); CP.ui.inlineError(errBox, null);
      const pv = preview();
      if (!pv) { CP.ui.inlineError(errBox, 'Nhập số lượng hoặc tổng tiền'); return; }
      if (!pv.ok) { CP.ui.inlineError(errBox, pv.errors[0]); return; }
      const sym = CP.state.get('symbol'); const base = fmt.base(sym); const mode = CP.mode.get();
      const body = h('div', { class: 'stack-sm' },
        h('div', { class: 'row' }, modeTag(mode), h('span', { class: 'strong' }, (st.side === 'BUY' ? '▲ MUA ' : '▼ BÁN ') + base + '/USDT'), chip(st.type === 'MARKET' ? 'Market' : 'Limit ' + fmt.price(pv.px))),
        h('div', { class: 'rec' }, h('span', { class: 'l' }, 'Số lượng'), h('span', { class: 'v num' }, fmt.qty(pv.base) + ' ' + base), h('span', { class: 'l' }, 'Giá trị'), h('span', { class: 'v num' }, fmt.num(pv.quote) + ' USDT'), h('span', { class: 'l' }, 'Phí taker 0,10%'), h('span', { class: 'v num' }, fmt.num(pv.fee) + ' USDT'), h('span', { class: 'l' }, 'Trượt giá 0,05%'), h('span', { class: 'v num' }, fmt.num(pv.slip) + ' USDT'), h('span', { class: 'l' }, 'Tổng chi phí'), h('span', { class: 'v num' }, fmt.num(pv.fee + pv.slip) + ' USDT = ' + ((pv.fee + pv.slip) / pv.quote * 100).toFixed(2) + '%'), h('span', { class: 'l' }, st.side === 'BUY' ? 'Trừ tiền mặt' : 'Nhận về'), h('span', { class: 'v num strong' }, fmt.num(pv.total) + ' USDT'), h('span', { class: 'l' }, 'Cỡ so với NAV'), h('span', { class: 'v num' }, pv.pctNav.toFixed(1) + '%')),
        pv.needsConfirm && h('div', { class: 'note note-warn' }, 'Lệnh > 50% số dư khả dụng — xác nhận này không tắt được.'),
        pv.warnings.filter((w) => !w.startsWith('Lệnh > 50%')).map((w) => h('div', { class: 'note note-warn' }, w)),
        h('div', { class: 'note note-pred' }, 'Phương pháp đang hiển thị: ' + CP.verify.current().label + ' (' + CP.verify.current().n + ' mẫu, mô phỏng). Quyết định là của bạn.'),
        h('p', { class: 'faint tiny' }, (mode === 'PAPER' ? 'PAPER: khớp mô phỏng tại giá thật. ' : 'TIỀN THẬT: bước hai là xác thực lại. ') + 'Lệnh được ghi vào sổ trước khi khớp; không sửa, không xoá.'));
      const ok = await confirm({ title: 'Xác nhận lệnh (bước 2/2)', body, okText: st.side === 'BUY' ? 'Mua ' + base : 'Bán ' + base, danger: st.side === 'SELL' });
      if (!ok) return;
      try {
        const req = { symbol: sym, side: st.side, type: st.type, price: st.price, last: CP.market.last(), predictionId: CP.market.pred && CP.market.pred.id };
        if (st.lastEdited === 'amount' && st.amount) req.baseQty = st.amount; else req.quoteQty = st.total;
        const o = CP.paper.place(req);
        st.amount = ''; st.total = ''; st.pct = 0; draw(); renderBottom(); renderTicker();
        const host = document.getElementById('toasts') || (document.body.appendChild(h('div', { id: 'toasts' })));
        const t = h('div', { class: 'toast toast-ok', role: 'status' }, o.status === 'FILLED' ? `Đã khớp ${o.side === 'BUY' ? 'mua' : 'bán'} ${fmt.qty(o.qty)} ${base} @ ${fmt.price(o.fillPrice)}` : `Đã đặt lệnh Limit ${fmt.price(o.price)} — chờ khớp`, o.status === 'NEW' && h('button', { class: 'btn btn-sm', onClick: () => { CP.paper.cancel(o.id); t.remove(); renderBottom(); toast('Đã huỷ lệnh chờ', 'info'); } }, 'Huỷ (10 s)'));
        host.append(t); setTimeout(() => t.remove(), 10000);
      } catch (e) { CP.ui.inlineError(errBox, e.message); }
    }
    draw();
    return api;
  }

  // ── BOTTOM TABS ──────────────────────────────────────────────────
  let bottomTab = 'open';
  function renderBottom() {
    const el = els.bottom; clear(el); const s = CP.paper.state(); const sym = CP.state.get('symbol');
    const open = s.orders.filter((o) => o.status === 'NEW');
    const tabs = h('div', { class: 'tabs', role: 'tablist' }, [['open', 'Lệnh mở', open.length], ['history', 'Lịch sử lệnh', s.orders.length], ['fills', 'Khớp lệnh', s.fills.length], ['wallet', 'Ví PAPER', null]].map(([k, l, n]) => h('button', { class: 'tab ' + (bottomTab === k ? 'is-active' : ''), role: 'tab', 'aria-selected': String(bottomTab === k), onClick: () => { bottomTab = k; renderBottom(); } }, l, n != null && h('span', { class: 'count num' }, '(' + n + ')'))));
    const body = h('div', { class: 'panel-body' });
    const side = (o) => h('span', { class: o.side === 'BUY' ? 'up-text' : 'down-text' }, (o.side === 'BUY' ? '▲ Mua' : '▼ Bán'));
    if (bottomTab === 'open') body.append(open.length ? h('div', { class: 'stack-sm' }, table(['Giờ UTC', 'Cặp', 'Chiều', 'Loại', { label: 'Giá', num: 1 }, { label: 'SL', num: 1 }, ''], open.slice().reverse().map((o) => [fmt.dateTimeUTC(o.at), o.symbol, side(o), o.type, fmt.price(o.price), fmt.qty(o.qty), h('button', { class: 'btn btn-sm', onClick: () => { CP.paper.cancel(o.id); renderBottom(); } }, 'Huỷ')])), h('div', { class: 'row' }, h('button', { class: 'btn btn-sm btn-danger', onClick: async () => { if (await confirm({ title: 'Huỷ tất cả lệnh chờ?', body: h('p', {}, open.length + ' lệnh chờ sẽ bị huỷ.'), okText: 'Huỷ tất cả', danger: true })) { CP.paper.cancelAll(); renderBottom(); } } }, 'Huỷ tất cả'))) : empty('Không có lệnh chờ', 'Lệnh Limit chưa khớp sẽ hiện ở đây'));
    else if (bottomTab === 'history') body.append(table(['Giờ UTC', 'Cặp', 'Chiều', 'Loại', { label: 'Giá', num: 1 }, { label: 'SL', num: 1 }, 'Trạng thái', { label: 'Phí', num: 1 }], s.orders.slice().reverse().slice(0, 100).map((o) => [fmt.dateTimeUTC(o.at), o.symbol, side(o), o.type, fmt.price(o.fillPrice || o.price), fmt.qty(o.qty), o.status === 'FILLED' ? 'Đã khớp' : o.status === 'NEW' ? 'Chờ' : 'Đã huỷ', o.fee != null ? fmt.num(o.fee) : '—']), { empty: 'Chưa có lệnh nào — sổ lệnh chỉ thêm, không xoá' }));
    else if (bottomTab === 'fills') body.append(table(['Giờ UTC', 'Cặp', 'Chiều', { label: 'Giá', num: 1 }, { label: 'SL', num: 1 }, { label: 'Phí USDT', num: 1 }], s.fills.slice().reverse().slice(0, 100).map((f) => [fmt.dateTimeUTC(f.at), f.symbol, side(f), fmt.price(f.price), fmt.qty(f.qty), fmt.num(f.fee)]), { empty: 'Chưa có khớp lệnh' }));
    else { const eq = CP.paper.equity({ [sym]: CP.market.last() }); body.append(h('div', { class: 'stack-sm' }, h('div', { class: 'kpi-row' }, kpi('Giá trị ví', fmt.num(eq) + ' USDT'), kpi('Tiền mặt', fmt.num(s.cash) + ' USDT'), kpi('PnL kỳ', (eq - 10000 >= 0 ? '▲ +' : '▼ ') + fmt.num(eq - 10000) + ' USDT', eq - 10000 >= 0 ? 'up-text' : 'down-text'), kpi('Kỳ', '#' + s.period + ' · n=' + s.orders.length + ' lệnh')), table(['Tài sản', { label: 'Số lượng', num: 1 }, { label: 'Giá vốn', num: 1 }, { label: 'Đã hiện thực', num: 1 }], Object.entries(s.positions).filter(([, p]) => p.qty > 0).map(([k, p]) => [fmt.base(k), fmt.qty(p.qty), fmt.price(p.avg), fmt.num(p.realized || 0)]), { empty: 'Chưa giữ coin nào' }), h('a', { href: '#/portfolio', class: 'small' }, 'Xem Danh mục đầy đủ →'))); }
    el.append(h('div', { class: 'panel-head', style: { padding: 0, border: 0 } }, tabs, h('span', { class: 'spacer' }), modeTag(CP.mode.get())), body);
  }
  const kpi = (l, v, cls = '') => h('div', { class: 'kpi' }, h('span', { class: 'kpi-label' }, l), h('span', { class: 'kpi-value num ' + cls }, v));

  // ── MOUNT ────────────────────────────────────────────────────────
  async function mount(outlet) {
    els = {};
    els.ticker = h('div', { class: 'ticker', role: 'region', 'aria-label': 'Giá và thống kê 24h' });
    els.chartHead = h('div', { class: 'chart-head' });
    els.chartWrap = h('div', { class: 'chart-wrap' });
    els.strip = h('div', { class: 'signal-strip', role: 'group', 'aria-label': 'Dải tín hiệu quá khứ' });
    els.pred = h('div', { class: 'stack-sm', 'aria-live': 'polite' });
    els.rec = h('div', { class: 'stack-sm' });
    els.book = h('div', { class: 'ob' });
    els.tradesBody = h('div', {});
    els.bottom = h('div', { class: 'panel', style: { padding: '0 0 0 0' } });
    form = buildForm();
    const chartPanel = h('section', { class: 'panel area-chart flush', 'aria-label': 'Biểu đồ giá' }, els.chartHead, els.chartWrap, els.strip);
    const bookPanel = panel({ id: 'book', title: 'Sổ lệnh', subtitle: 'Binance · công khai', body: els.book, cls: 'flush area-book' });
    els.trades = panel({ id: 'trades', title: 'Khớp lệnh gần đây', body: els.tradesBody, cls: 'flush' }); els.trades.hidden = true;
    const bookCol = h('div', { class: 'area-book stack-sm' }, bookPanel, els.trades);
    const predPanel = panel({ id: 'pred', title: 'Dự đoán', subtitle: 'một badge chủ · tím = model', body: els.pred, collapsible: false, cls: 'panel-pred' });
    const recPanel = panel({ id: 'rec', title: 'Khuyến nghị (khung 1d)', body: els.rec, cls: 'panel-rec' });
    const orderPanel = panel({ id: 'order', title: 'Đặt lệnh', body: form.root, cls: 'panel-order', actions: [h('button', { class: 'ibtn', title: 'Phím tắt', 'aria-label': 'Phím tắt', onClick: () => CP.hotkeys.show() }, '?')] });
    els.grid = h('div', { class: 'trade' }, bookCol, chartPanel, h('div', { class: 'area-side' }, predPanel, recPanel, orderPanel), h('div', { class: 'area-bottom' }, els.bottom));
    els.mobileBar = h('div', { class: 'mobile-bar' }, h('button', { class: 'btn btn-buy', onClick: () => openSheet('BUY') }, '▲ Mua'), h('button', { class: 'btn btn-sell', onClick: () => openSheet('SELL') }, '▼ Bán'));
    outlet.append(els.ticker, els.grid, els.mobileBar);
    applyLayout();
    renderTicker(); renderChartHead(); renderBottom();
    els.chartWrap.append(CP.ui.skeleton(300));

    chart = new CP.CandleChart(els.chartWrap, { getKlines: () => CP.market.klines, getPred: () => CP.market.pred, getHist: () => CP.market.hist });
    els.chartWrap.querySelector('.skeleton')?.remove();
    const redraw = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; chart.draw(); }); };

    offs.push(
      CP.market.on('loading', () => { els.chartWrap.classList.add('loading-dim'); }),
      CP.market.on('klines', () => { els.chartWrap.classList.remove('loading-dim'); chart.draw(); renderTicker(); renderPred(); renderStrip(); renderBook(); form.refresh(); }),
      CP.market.on('tick', () => { redraw(); updateTickerPrice(); }),
      CP.market.on('ticker', () => { if (!els.ticker.querySelector('.price')) renderTicker(); }),
      CP.market.on('tickers', () => { if (!CP.market.ticker) renderTicker(); }),
      CP.market.on('closed', () => { renderPred(); renderStrip(); renderBottom(); redraw(); }),
      CP.market.on('depth', () => renderBook()),
      CP.market.on('trade', () => renderTrades()),
      CP.market.on('fresh', () => { renderTicker(); form.refresh(); }),
      CP.state.subscribe((keys) => {
        if (keys.includes('symbol') || keys.includes('tf')) { renderChartHead(); renderTicker(); CP.market.load(CP.state.get('symbol'), CP.state.get('tf')); }
        if (keys.includes('favorites')) renderTicker();
        if (keys.includes('tier')) { renderPred(); }
        if (keys.includes('layout')) applyLayout();
      }),
    );
    timers.push(setInterval(() => {
      const cd = document.getElementById('tk-cd'); if (cd) cd.textContent = fmt.countdown(CP.nextClose(CP.state.get('tf')) - CP.data.now());
      const pc = document.getElementById('pc-cd'); const p = CP.market.pred; if (pc && p) { const left = p.validUntil - CP.data.now(); pc.textContent = left <= 0 ? 'đã hết' : 'còn ' + fmt.countdown(left); if (left <= 0 && !els.pred.querySelector('.stale-band')) renderPred(); }
    }, 1000));
    // phím tắt cục bộ: b/s chọn chiều, l/m loại lệnh
    els.key = (e) => { const tag = (e.target.tagName || '').toLowerCase(); if (['input', 'textarea', 'select'].includes(tag) || e.metaKey || e.ctrlKey) return; if (e.key === 'b') form.setSide('BUY'); else if (e.key === 's') form.setSide('SELL'); else if (e.key === 'l') form.setType('LIMIT'); else if (e.key === 'm') form.setType('MARKET'); };
    document.addEventListener('keydown', els.key);
    await CP.market.load(CP.state.get('symbol'), CP.state.get('tf'));
    if (!tickersLoaded) { tickersLoaded = true; CP.market.loadTickers().catch(() => {}); }
  }
  function openSheet(side) {
    form.setSide(side);
    const wrap = h('div', { class: 'modal-wrap sheet-wrap', onClick: (e) => { if (e.target === wrap) close(); } }, h('div', { class: 'modal sheet', role: 'dialog', 'aria-modal': 'true' }, h('div', { class: 'modal-head' }, h('h3', {}, 'Đặt lệnh · ' + fmt.base(CP.state.get('symbol'))), h('button', { class: 'ibtn', 'aria-label': 'Đóng', onClick: () => close() }, '✕')), form.root));
    const close = () => { wrap.remove(); document.querySelector('.panel-order .panel-body')?.append(form.root); };
    document.body.append(wrap);
  }
  function unmount() {
    offs.forEach((f) => f()); offs = []; timers.forEach(clearInterval); timers = [];
    if (els.key) document.removeEventListener('keydown', els.key);
    if (chart) { chart.destroy(); chart = null; }
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  CP.screens.register('trade', { title: 'Giao dịch', auth: false, mount, unmount });
})();
