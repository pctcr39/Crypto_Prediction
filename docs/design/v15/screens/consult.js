/* ══════════════════════════════════════════════════════════════════
   screens/consult.js — TAB "PHƯƠNG PHÁP", hai lớp

   LỚP 1 · Dashboard (mặc định) — bản f2 28/08/2026 theo yêu cầu chủ dự án:
     MỌI dashboard hiển thị ngay, luôn mở, không tap-to-open. Mỗi phương pháp là
     một dashboard đầy đủ: nó đang nói gì · đồng hồ đo của riêng nó · dòng phiếu
     30 nến · độ phù hợp · cách hoạt động · khi nào sai · thành tích kèm n=.
     Vẫn không p_up/σ̂/q10–q90 ở lớp 1 (ký hiệu chỉ ở lớp 2).
     · Hệ thống nói gì  — một kết luận duy nhất + chân trời viết bằng tiếng Việt
     · Hệ thống đề xuất phương pháp nào cho lúc này
     · 4 thẻ phương pháp, xếp theo ĐỘ PHÙ HỢP VỚI THỊ TRƯỜNG LÚC NÀY
     · Phần "tự kiểm chứng" (tầng · hiệu suất · nhật ký) gập sẵn, không chiếm chỗ

   LỚP 2 · Sau khi user chọn một phương pháp (#/consult?m=giao-dich-theo-xu-huong)
     Hiện TOÀN BỘ: lý thuyết, cơ chế, đặc tả, tham số kỹ thuật, bằng chứng đã
     đo, khi nào sai, cái gì đã bị bác — và sổ ký hiệu. Đây là chỗ DUY NHẤT
     các ký hiệu được phép xuất hiện.

   Chỉ 4 phương pháp đang bỏ phiếu. Năm cái còn lại không tham gia định hướng
   nên không hiện ở tab này.

   ⚠️ Mã nội bộ (PP3…PP6) KHÔNG BAO GIỜ hiện ra giao diện — chỉ dùng để nối
   với CP.methods. Trên UI và trên URL chỉ dùng tên thật và slug.

   Ràng buộc giữ nguyên: một badge chủ (UI-07) · nhãn kiểm chứng (UI-11) ·
   tầng điều tiết tần suất (ADR-018) · mọi thống kê kèm n= (TRACK-02/04).
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const CP = window.CP;
  const { h, clear, put, fmt, panel, dirBadge, freshness, chip, modeTag, table, toast, modal, empty, DIR } = CP.ui;

  let offs = [], timers = [], els = {}, methodStats = null, selected = null, logTier = 'all';

  CP.ui.injectCSS('consult', `
    /* ── Lớp 1: câu trả lời lớn, không con số ── */
    .hero{display:flex;flex-direction:column;gap:var(--sp-3)}
    .hero-top{display:flex;align-items:center;gap:var(--sp-4);flex-wrap:wrap}
    .hero-say{font-size:var(--fs-24);font-weight:600;line-height:1.25;color:var(--text-1)}
    .hero-when{font-size:var(--fs-14);color:var(--text-2)}
    .hero-when b{color:var(--text-1);font-weight:600}
    .hero-sure{font-size:var(--fs-13);color:var(--text-2)}
    .hero-sure b{color:var(--text-1)}
    .propose{border:1px solid var(--accent);border-radius:var(--r-2);padding:var(--sp-3);background:var(--surface-2)}
    .propose-h{font-size:var(--fs-11);letter-spacing:.06em;text-transform:uppercase;color:var(--accent);font-weight:600}
    .propose-w{font-size:var(--fs-12);color:var(--text-2);margin-top:var(--sp-2)}

    /* Khối TÊN PHƯƠNG PHÁP — một cách trình bày duy nhất ở mọi nơi:
       tên tiếng Việt cụ thể, tên gốc tiếng Anh ngay dưới. Không bao giờ hiện mã nội bộ. */
    .mtitle{display:flex;flex-direction:column;gap:1px;min-width:0}
    .mtitle-vi{font-size:var(--fs-16);font-weight:600;color:var(--text-1);line-height:1.3}
    .mtitle-en{font-size:var(--fs-11);color:var(--text-3);font-style:italic}
    .mtitle.lg .mtitle-vi{font-size:var(--fs-24);line-height:1.2}
    .mtitle.lg .mtitle-en{font-size:var(--fs-13)}

    /* ── Lớp 1: bốn thẻ phương pháp ── */
    .mcards{display:grid;grid-template-columns:repeat(2,1fr);gap:var(--sp-3)}
    .mcard{display:flex;flex-direction:column;gap:var(--sp-2);padding:var(--sp-3);border:1px solid var(--border);
           border-radius:var(--r-2);background:var(--surface-1);text-align:left;cursor:pointer;min-height:var(--tap);
           transition:border-color var(--dur-fast),background var(--dur-fast)}
    .mcard:hover{border-color:var(--border-strong);background:var(--surface-2)}
    .mcard:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
    .mcard-top{display:flex;align-items:baseline;gap:var(--sp-2)}
    .mcard-rank{font-size:var(--fs-11);color:var(--text-3);font-family:var(--font-mono);flex:none}
    .mcard-one{font-size:var(--fs-12);color:var(--text-2);line-height:1.45}
    .mcard-say{display:flex;align-items:center;gap:var(--sp-2);font-size:var(--fs-12);color:var(--text-2)}
    .mcard-fit{font-size:var(--fs-12);color:var(--text-2);line-height:1.45;border-top:1px solid var(--border);padding-top:var(--sp-2)}
    .mcard-fit b{color:var(--text-1)}
    .fitdots{display:inline-flex;gap:3px;vertical-align:middle;margin-right:6px}
    .fitdots i{width:7px;height:7px;border-radius:50%;background:var(--surface-3);display:block}
    .fitdots i.on{background:var(--accent)}
    .mcard-go{font-size:var(--fs-12);color:var(--accent);font-weight:500}

    /* ── Lớp 2: trang chi tiết ── */
    .dt-head{display:flex;flex-direction:column;gap:var(--sp-3);margin-bottom:var(--sp-4)}
    .dt-one{font-size:var(--fs-14);color:var(--text-2);line-height:1.55;max-width:76ch}
    .sec{margin-top:var(--sp-5)}
    .sec-h{font-size:var(--fs-11);letter-spacing:.06em;text-transform:uppercase;color:var(--text-3);
           font-weight:600;border-bottom:1px solid var(--border);padding-bottom:var(--sp-2);margin-bottom:var(--sp-3)}
    .sec p{font-size:var(--fs-13);color:var(--text-2);line-height:1.65;max-width:80ch;margin:0 0 var(--sp-3)}
    .spec{font-family:var(--font-mono);font-size:var(--fs-12);line-height:1.6;white-space:pre;overflow-x:auto;
          padding:var(--sp-3);background:var(--surface-0);border:1px solid var(--border);border-radius:var(--r-1);color:var(--text-2)}
    .spec-lbl{font-size:var(--fs-12);color:var(--text-3);margin-bottom:var(--sp-2)}
    .gloss{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:var(--sp-3)}
    .gitem{padding:var(--sp-3);border:1px solid var(--border);border-radius:var(--r-2);background:var(--surface-1)}
    .gsym{font-family:var(--font-mono);font-size:var(--fs-16);color:var(--pred);font-weight:600}
    .gname{font-size:var(--fs-12);color:var(--text-1);font-weight:600;margin-bottom:var(--sp-2)}
    .gplain{font-size:var(--fs-12);color:var(--text-2);line-height:1.55}
    .gwhy{font-size:var(--fs-11);color:var(--text-3);line-height:1.55;margin-top:var(--sp-2);
          border-top:1px solid var(--border);padding-top:var(--sp-2)}
    .vd{font-family:var(--font-mono);font-size:var(--fs-11);line-height:1.5}
    .vd-ok{color:var(--up)}.vd-warn{color:var(--warn)}.vd-bad{color:var(--down-text,var(--down))}
    .banned{display:flex;flex-wrap:wrap;gap:var(--sp-2)}
    .passport{font-family:var(--font-mono);font-size:var(--fs-11);color:var(--text-3);word-break:break-all}

    /* ── Phần tự kiểm chứng, gập sẵn ── */
    .adv{border:1px solid var(--border);border-radius:var(--r-2);background:var(--surface-1);margin-top:var(--sp-3)}
    .adv>summary{cursor:pointer;padding:var(--sp-3);font-size:var(--fs-13);color:var(--text-2);
                 font-weight:500;list-style:none;min-height:var(--tap);display:flex;align-items:center;gap:var(--sp-2)}
    .adv>summary::-webkit-details-marker{display:none}
    .adv>summary::before{content:"▸";color:var(--text-3);font-size:var(--fs-12)}
    .adv[open]>summary::before{content:"▾"}
    .adv>summary:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
    .adv-body{padding:0 var(--sp-3) var(--sp-3);border-top:1px solid var(--border)}
    .adv-body>*{margin-top:var(--sp-3)}
    .tiers{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}
    .tiers .btn{flex-direction:column;gap:0;min-height:52px;padding:4px}
    .tiers .btn small{font-size:10px;color:var(--text-3);font-weight:400}
    .tiers .btn.is-on{border-color:var(--accent)}
    .legend{display:flex;gap:12px;font-size:var(--fs-11);color:var(--text-3)}
    .legend i{display:inline-block;width:10px;height:2px;margin-right:4px;vertical-align:middle}


    /* ── Lớp 1 (bản f2): mỗi phương pháp là MỘT DASHBOARD luôn mở ── */
    .strip{display:flex;align-items:center;gap:var(--sp-3);flex-wrap:wrap}
    .strip .say{font-size:var(--fs-16);font-weight:600;color:var(--text-1)}
    .strip .sub{font-size:var(--fs-12);color:var(--text-2)}
    .strip .sub b{color:var(--text-1)}
    .boards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--sp-3)}
    .board{display:flex;flex-direction:column;gap:var(--sp-3);padding:var(--sp-3);border:1px solid var(--border);border-radius:var(--r-2);background:var(--surface-1);min-width:0}
    .board.top{border-color:var(--accent)}
    .board-head{display:flex;align-items:flex-start;gap:var(--sp-2)}
    .board-rank{font-family:var(--font-mono);font-size:var(--fs-11);color:var(--text-3);padding-top:4px;flex:none}
    .board-role{font-size:var(--fs-11);color:var(--text-3)}
    .board-say{display:flex;align-items:center;gap:var(--sp-2);flex-wrap:wrap;font-size:var(--fs-13);color:var(--text-1)}
    .board-say .plain{color:var(--text-2)}
    .gauge{display:flex;flex-direction:column;gap:4px}
    .gauge-h{display:flex;justify-content:space-between;font-size:var(--fs-11);color:var(--text-3);margin-bottom:10px}
    .gauge-h b{color:var(--text-1);font-weight:600}
    .gauge-track{position:relative;height:10px;border-radius:var(--r-pill);background:var(--surface-3)}
    .gauge-fill{position:absolute;top:0;bottom:0;border-radius:var(--r-pill);background:var(--text-2)}
    .gauge-mark{position:absolute;top:-4px;width:2px;height:18px;background:var(--text-1);transform:translateX(-1px)}  /* vạch giá trị = bậc sáng nhất cùng thang xám, không mượn màu ngữ nghĩa (DS-RULE 5) */
    .gauge-mid{position:absolute;top:-2px;width:1px;height:14px;background:var(--text-3)}
    .gauge-zone{position:absolute;top:-3px;bottom:-3px;border-left:2px dashed var(--border-strong)}
    .gauge-zone::after{content:attr(data-label);position:absolute;left:4px;top:-14px;font-size:10px;color:var(--text-3);white-space:nowrap}
    .gauge-l{display:flex;justify-content:space-between;font-size:10px;color:var(--text-3);font-family:var(--font-mono)}
    .fit-row{display:flex;align-items:center;gap:6px;font-size:var(--fs-12);color:var(--text-2);line-height:1.45}
    .fit-row b{color:var(--text-1)}
    .vt{display:flex;flex-direction:column;gap:4px}
    .vt-h{display:flex;justify-content:space-between;font-size:var(--fs-11);color:var(--text-3)}
    .vt-h b{color:var(--text-1)}
    .vt-row{display:flex;gap:2px}
    .vt-row i{flex:1;height:14px;border-radius:2px;background:var(--surface-3);display:block;min-width:4px}
    .vt-row i.u{background:var(--up)}.vt-row i.d{background:var(--down)}.vt-row i.n{background:var(--surface-3)}
    .vt-row i.miss{opacity:.35}
    .vt-legend{display:flex;gap:10px;font-size:10px;color:var(--text-3)}
    .vt-legend i{display:inline-block;width:10px;height:10px;border-radius:2px;vertical-align:middle;margin-right:3px}
    .board-facts{display:grid;grid-template-columns:auto 1fr;gap:4px 10px;font-size:var(--fs-12);color:var(--text-2);border-top:1px solid var(--border);padding-top:var(--sp-2)}
    .board-facts .k{color:var(--text-3);white-space:nowrap}
    .board-foot{display:flex;align-items:center;gap:var(--sp-2);flex-wrap:wrap;margin-top:auto}
    .votebar{display:flex;height:10px;border-radius:var(--r-pill);overflow:hidden;background:var(--surface-3);gap:2px}
    .votebar span{display:block;height:100%;background:var(--text-2)}
    .votebar span.n{background:var(--text-3)}.votebar span.d{background:var(--text-1)}
    @media(max-width:1023px){.boards{grid-template-columns:1fr}}
    @media(max-width:767px){
      .mcards{grid-template-columns:1fr}
      .tiers{grid-template-columns:repeat(2,1fr)}
      .hero-say{font-size:var(--fs-20)}
      .spec{font-size:var(--fs-11)}
    }
  `);

  const wilson = (k, n) => { if (!n) return 0; const z = 1.96, p = k / n; return z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / (1 + z * z / n) * 100; };
  const tierChanges90d = () => CP.auth.auditLog().filter((a) => a.action === 'tier_changed' && Date.now() - a.at < 90 * 864e5).length;
  const curTier = () => CP.tiers.find((t) => t.id === CP.state.get('tier')) || CP.tiers[1];
  /** Khối tên phương pháp — DUY NHẤT một cách trình bày, dùng ở cả ba nơi. */
  const methodTitle = (m, opts = {}) => h(opts.tag || 'div', { class: 'mtitle ' + (opts.lg ? 'lg' : '') },
    h('span', { class: 'mtitle-vi' }, m.name),
    h('span', { class: 'mtitle-en' }, m.full));

  const voteOf = (id, closed) => { const m = CP.methods.find((x) => x.id === id); return m && m.votes ? m.vote(closed, CP.state.get('tf')) : null; };

  /** Track record từng phương pháp trên 80 nến gần nhất (mô phỏng). */
  function computeMethodStats() {
    const closed = CP.market.closed(); const m = CP.market.model; const out = {};
    const N = 80, start = Math.max(60, closed.length - N - m.bars);
    CP.theory.ORDER.forEach((id) => {
      const mth = CP.methods.find((x) => x.id === id); if (!mth || !mth.votes) return;
      let n = 0, k = 0;
      for (let i = start; i < closed.length - m.bars; i++) {
        const v = mth.vote(closed.slice(0, i + 1)); if (v === 'FLAT' || !v) continue;
        n++; const o = closed[i + m.bars].c;
        if ((v === 'UP' && o > closed[i].c) || (v === 'DOWN' && o < closed[i].c)) k++;
      }
      out[id] = { n, k };
    });
    return out;
  }

  /* ══════════════════════════════════════════════════════════════
     LỚP 1 · DASHBOARD — chỉ xu hướng, không ký hiệu
     ══════════════════════════════════════════════════════════════ */

  function renderStrip() {
    const el = els.strip; clear(el);
    const p = CP.market.pred, closed = CP.market.closed();
    if (!p) { el.append(CP.ui.skeleton(60)); return; }
    const v = CP.verify.current();
    const stale = CP.data.now() > p.validUntil;
    const ranked = CP.theory.rank(closed); const top = ranked[0];
    const say = p.direction === 'UP' ? 'Giá đang nghiêng về phía TĂNG' : p.direction === 'DOWN' ? 'Giá đang nghiêng về phía GIẢM' : 'Chưa đủ rõ để nói giá sẽ đi hướng nào';
    put(el,
      h('div', { class: 'strip' },
        Object.assign(dirBadge(p.direction, null, { size: 'lg' }), { className: 'badge lg master badge-' + DIR[p.direction].cls }),
        h('div', { class: 'stack-sm', style: { gap: '2px', minWidth: 0 } },
          h('div', { class: 'say' }, say),
          h('div', { class: 'sub' }, 'Cho ', h('b', {}, CP.theory.horizonText(CP.market.model)), ' — đến ', h('b', {}, fmt.timeUTC(p.validUntil)), ' UTC',
            p.direction !== 'FLAT' ? [' · mức chắc chắn ', h('b', {}, CP.theory.certaintyText(p.pUp))] : null,
            top ? [' · hợp nhất lúc này: ', h('b', {}, top.name)] : null)),
        h('span', { class: 'spacer' }),
        chip('MÔ PHỎNG · ' + v.label, 'chip-sim')),
      stale && h('div', { class: 'note note-warn' }, '◌ Dự đoán này đã quá hạn lúc ' + fmt.timeUTC(p.validUntil) + ' UTC — chờ nến mới đóng.'),
      p.direction === 'FLAT' && h('p', { class: 'faint small' }, '“Chưa rõ” là câu trả lời bình thường, không phải lỗi. Hệ chỉ lên tiếng khi bằng chứng đủ mạnh để sống qua phí giao dịch.'));
  }

  function fitDots(score) {
    const n = score >= 0.7 ? 4 : score >= 0.45 ? 3 : score >= 0.2 ? 2 : 1;
    return h('span', { class: 'fitdots', 'aria-hidden': 'true' }, [0, 1, 2, 3].map((i) => h('i', { class: i < n ? 'on' : '' })));
  }

  /** Đồng hồ đo riêng của từng phương pháp — số đọc ra thành chữ, có mốc để so. */
  function gauge(m, ctx) {
    const G = (title, valueText, pct, opts = {}) => h('div', { class: 'gauge', role: 'img', 'aria-label': title + ': ' + valueText },
      h('div', { class: 'gauge-h' }, h('span', {}, title), h('b', {}, valueText)),
      h('div', { class: 'gauge-track' },
        opts.zone && h('span', { class: 'gauge-zone', 'data-label': opts.zoneLabel || 'ngưỡng', style: { left: opts.zone[0] + '%', width: (opts.zone[1] - opts.zone[0]) + '%' } }),
        opts.mid != null && h('span', { class: 'gauge-mid', style: { left: opts.mid + '%' } }),
        opts.fillFrom != null ? h('span', { class: 'gauge-fill', style: { left: Math.min(opts.fillFrom, pct) + '%', width: Math.abs(pct - opts.fillFrom) + '%' } }) : h('span', { class: 'gauge-fill', style: { left: 0, width: pct + '%' } }),
        h('span', { class: 'gauge-mark', style: { left: pct + '%' } })),
      h('div', { class: 'gauge-l' }, h('span', {}, opts.l0 || ''), h('span', {}, opts.l1 || '')));
    if (m.id === 'PP4') { const z = Math.min(3, ctx.trendZ); const pct = 50 + (ctx.trendUp ? 1 : -1) * (z / 3) * 50; return G('Hai đường trung bình tách nhau', (ctx.trendUp ? 'ngắn hạn TRÊN dài hạn' : 'ngắn hạn DƯỚI dài hạn') + ' · ' + (z >= 1 ? 'rõ rệt' : z >= 0.4 ? 'vừa' : 'gần như chồng nhau'), pct, { mid: 50, fillFrom: 50, l0: '◀ giảm rõ', l1: 'tăng rõ ▶', zone: null }); }
    if (m.id === 'PP3') { const pct = Math.round(ctx.rangePos * 100); return G('Vị trí giá trong biên độ 30 nến', pct <= 20 ? 'sát ĐÁY' : pct >= 80 ? 'sát ĐỈNH' : 'giữa biên độ', pct, { mid: 50, l0: 'đáy 30 nến', l1: 'đỉnh 30 nến', zone: null }); }
    if (m.id === 'PP6') { const z = Math.max(-4, Math.min(4, ctx.volZ)); const pct = 50 + (z / 4) * 50; return G('Khối lượng so với 96 nến gần nhất', Math.abs(z) > 2 ? 'BẤT THƯỜNG (' + (z > 0 ? 'cao' : 'thấp') + ')' : Math.abs(z) > 1 ? 'nhỉnh hơn bình thường' : 'bình thường', pct, { mid: 50, fillFrom: 50, l0: '◀ thấp bất thường', l1: 'cao bất thường ▶', zone: [75, 100], zoneLabel: 'ngưỡng bất thường' }); }
    if (m.id === 'PP5') { return h('div', { class: 'gauge' }, h('div', { class: 'gauge-h' }, h('span', {}, 'Vừa có cú xuyên thủng đỉnh/đáy rồi lấy lại?'), h('b', {}, ctx.sweep ? 'CÓ — nến vừa rồi' : 'không')), h('div', { class: 'gauge-track' }, h('span', { class: 'gauge-fill', style: { left: 0, width: ctx.sweep ? '100%' : '0%' } })), h('div', { class: 'gauge-l' }, h('span', {}, 'không có sự kiện'), h('span', {}, 'có sự kiện'))); }
    return null;
  }

  /** Dòng phiếu 30 nến gần nhất của một phương pháp + số đúng/sai (chấm tại close cuối chân trời). */
  function voteTimeline(mth, closed) {
    const m = CP.market.model; const N = 30; const cells = [];
    const start = Math.max(60, closed.length - N);
    let n = 0, k = 0;
    for (let i = start; i < closed.length; i++) {
      const v = mth.vote(closed.slice(0, i + 1));
      let scored = null;
      if (v && v !== 'FLAT' && i + m.bars < closed.length) { const o = closed[i + m.bars].c; scored = (v === 'UP' && o > closed[i].c) || (v === 'DOWN' && o < closed[i].c); n++; if (scored) k++; }
      cells.push({ v, scored, t: closed[i].t });
    }
    return h('div', { class: 'vt' },
      h('div', { class: 'vt-h' }, h('span', {}, '30 nến gần nhất nó đã nói gì'), h('b', { class: 'num' }, n ? `đúng ${k}/${n}` : 'chưa có phiếu nào được chấm')),
      h('div', { class: 'vt-row', role: 'img', 'aria-label': 'Dòng phiếu 30 nến' }, cells.map((c) => h('i', { class: (c.v === 'UP' ? 'u' : c.v === 'DOWN' ? 'd' : 'n') + (c.scored === false ? ' miss' : ''), title: fmt.dateTimeUTC(c.t) + ' UTC · ' + (c.v === 'UP' ? '▲ tăng' : c.v === 'DOWN' ? '▼ giảm' : '● trung lập') + (c.scored == null ? (c.v && c.v !== 'FLAT' ? ' · chưa tới hạn' : '') : c.scored ? ' · ✓ đúng' : ' · ✗ sai') }))),
      h('div', { class: 'vt-legend' }, h('span', {}, h('i', { style: { background: 'var(--up)' } }), '▲ tăng'), h('span', {}, h('i', { style: { background: 'var(--down)' } }), '▼ giảm'), h('span', {}, h('i', { style: { background: 'var(--surface-3)' } }), '● trung lập'), h('span', {}, h('i', { style: { background: 'var(--text-3)', opacity: .35 } }), 'mờ = phiếu sai')));
  }

  function renderBoards() {
    const el = els.boards; clear(el);
    const closed = CP.market.closed();
    if (closed.length < 60) { el.append(empty('Chưa đủ nến để chấm')); return; }
    const ranked = CP.theory.rank(closed); const ctx = CP.theory.context(closed);
    if (!methodStats) methodStats = computeMethodStats();
    const c = CP.consensus(closed, CP.state.get('tf'));
    put(el,
      h('div', { class: 'row-between' },
        h('p', { class: 'small muted', style: { maxWidth: '70ch' } }, 'Bốn ', h('b', {}, 'góc nhìn'), ' — không phải bốn dự đoán; kết luận duy nhất của hệ ở ô trên cùng. Xếp theo ', h('b', {}, 'độ hợp với thị trường lúc này'), ' (điều kiện hiện tại có khớp với điều kiện phương pháp được thiết kế cho không), ', h('b', {}, 'không'), ' theo thắng thua gần đây.'),
        h('div', { class: 'stack-sm', style: { minWidth: '220px', gap: '4px' } },
          h('div', { class: 'row-between small num' }, h('span', {}, `▲ ${c.up}`), h('span', { class: 'muted' }, `● ${c.flat}`), h('span', {}, `▼ ${c.down}`)),
          h('div', { class: 'votebar', role: 'img', 'aria-label': `Đếm phiếu: tăng ${c.up}, trung lập ${c.flat}, giảm ${c.down}` }, h('span', { class: 'u', style: { width: (c.up / c.total * 100) + '%' } }), h('span', { class: 'n', style: { width: (c.flat / c.total * 100) + '%' } }), h('span', { class: 'd', style: { width: (c.down / c.total * 100) + '%' } })),
          h('div', { class: 'faint tiny' }, 'đếm phiếu — không phải xác suất'))),
      h('div', { class: 'boards mt-3' }, ranked.map((m, i) => {
        const mth = CP.methods.find((x) => x.id === m.id);
        const vote = voteOf(m.id, closed);
        const say = vote === 'UP' ? 'nghiêng về tăng' : vote === 'DOWN' ? 'nghiêng về giảm' : vote === 'FLAT' ? 'chưa rõ — đứng ngoài' : 'không có ý kiến';
        const st = methodStats[m.id]; const v = CP.verify.ofMethod(m.id, st ? st.n : 0);
        const fail = m.failures && m.failures[0];
        return h('section', { class: 'board ' + (i === 0 ? 'top' : ''), 'aria-label': m.name },
          h('div', { class: 'board-head' }, h('span', { class: 'board-rank' }, '#' + (i + 1)), h('div', { style: { minWidth: 0, flex: 1 } }, methodTitle(m), h('div', { class: 'board-role' }, m.badge + ' · điểm quy tắc hoá ' + m.score)), m.warn && chip('đã bị cắt gần hết', 'chip-rejected'), i === 0 && chip('hợp nhất lúc này', 'chip-official')),
          h('div', { class: 'board-say' }, h('span', { class: 'plain' }, 'Đang nói:'), vote ? dirBadge(vote, null) : chip('không bỏ phiếu', 'chip-pending'), h('span', { class: 'plain' }, say)),
          gauge(m, ctx),
          h('div', { class: 'fit-row' }, fitDots(m.fit.score), h('span', {}, h('b', {}, m.fit.label), ' — ', m.fit.reason)),
          mth && voteTimeline(mth, closed),
          h('div', { class: 'board-facts' },
            h('span', { class: 'k' }, 'Cách làm'), h('span', {}, m.oneLine),
            h('span', { class: 'k' }, 'Hợp khi'), h('span', {}, m.designedFor),
            fail && h('span', { class: 'k' }, 'Sai khi'), fail && h('span', {}, fail[0] + ' — ' + fail[1])),
          h('div', { class: 'board-foot' }, chip(v.label + (st ? ` · n=${st.n}` : ''), 'chip-pred'), h('span', { class: 'spacer' }), h('button', { class: 'btn btn-sm', onClick: () => select(m.slug) }, 'Lý thuyết & thông số đầy đủ →')));
      })));
  }

  /* ══════════════════════════════════════════════════════════════
     LỚP 2 · CHI TIẾT MỘT PHƯƠNG PHÁP — mọi ký hiệu xuất hiện ở đây
     ══════════════════════════════════════════════════════════════ */

  const sec = (title, ...body) => h('section', { class: 'sec' }, h('h2', { class: 'sec-h' }, title), ...body);

  function renderDetail(outlet, id) {
    const t = CP.theory.of(id);
    if (!t) { outlet.append(empty('Không có phương pháp “' + id + '”')); return; }
    const closed = CP.market.closed();
    if (closed.length < 60) { outlet.append(h('div', { class: 'page' }, CP.ui.skeleton(400))); return; }
    const ctx = CP.theory.context(closed);
    const fit = ctx ? { ...t.fit(ctx), label: CP.theory.FIT_LABEL(t.fit(ctx).score) } : null;
    // t.id là khoá nội bộ để nối với CP.methods — `id` truyền vào là slug trên URL
    const vote = voteOf(t.id, closed);
    if (!methodStats) methodStats = computeMethodStats();
    const st = methodStats[t.id];
    const v = CP.verify.ofMethod(t.id, st ? st.n : 0);
    const p = CP.market.pred;

    const page = h('div', { class: 'page' },
      h('div', { class: 'subhead' },
        h('button', { class: 'btn btn-sm', onClick: () => select(null) }, '← Tất cả phương pháp'),
        h('span', { class: 'spacer' }),
        freshness(CP.data.freshness, CP.data.lastTick, 'Giá'), modeTag(CP.mode.get())),

      h('header', { class: 'dt-head' },
        methodTitle(t, { lg: true, tag: 'h1' }),
        h('div', { class: 'row' }, chip(t.badge, t.warn ? 'chip-warn' : 'chip-official'), chip('điểm quy tắc hoá ' + t.score, 'chip-pred'),
          chip(v.label + (st ? ' · n=' + st.n : ''), 'chip-sim')),
        h('p', { class: 'dt-one' }, t.oneLine)),

      t.warn && h('div', { class: 'note note-warn' }, h('span', { class: 'strong' }, '⚠ '), t.warn),

      // ── Nó đang nói gì lúc này (kèm số kỹ thuật) ──
      sec('Lúc này nó đang nói gì',
        h('div', { class: 'row gap-2' },
          vote ? dirBadge(vote, null, { size: 'lg' }) : chip('không bỏ phiếu', 'chip-pending'),
          fit && h('span', { class: 'small' }, fitDots(fit.score), h('b', {}, fit.label))),
        fit && h('p', { class: 'mt-2' }, fit.reason),
        h('p', { class: 'faint small' }, 'Phương pháp này được thiết kế cho: ', t.designedFor),
        p && h('div', { class: 'note note-pred mt-2' },
          h('div', { class: 'strong small' }, 'Thông số kỹ thuật của dự đoán hiện hành (do cả hệ sinh, không riêng phương pháp này)'),
          h('div', { class: 'mt-2 mono small' },
            `p_up = ${Math.round(p.pUp * 100)}%  ·  p_required = ${Math.round(p.pRequired * 100)}%  ·  level = ${p.level}`,
            h('br'),
            `q10 / q50 / q90 = ${fmt.price(p.q10)} / ${fmt.price(p.q50)} / ${fmt.price(p.q90)}`,
            h('br'),
            `σ̂ (chân trời) = ${p.expectedMovePct.toFixed(2)}%  ·  cắt lỗ ${p.barrier.slSigma}σ̂  ·  chốt lời ${p.barrier.tpSigma}σ̂`)),
        st && h('p', { class: 'small mt-2' }, 'Track record riêng của phương pháp này trong phiên: ',
          h('b', { class: 'num' }, `đúng ${st.k}/${st.n}`), ` (n=${st.n}, 80 nến gần nhất, mô phỏng)`,
          st.n < 100 ? ' — chưa đủ dữ liệu để kết luận.' : '.')),

      sec('Phương pháp này làm gì', t.idea.map((x) => h('p', {}, x))),
      sec('Vì sao nó ở trong hệ', h('p', {}, t.why)),
      t.honest && sec('Điều trung thực nhất phải nói', h('div', { class: 'note note-warn' }, t.honest)),

      sec('Đặc tả chính thức',
        h('div', { class: 'spec-lbl' }, 'Nguồn: docs/Old/11 · docs/Old/12 — quy tắc viết được thành mã, hai người cài đặt độc lập phải cho cùng kết quả.'),
        h('pre', { class: 'spec' }, t.spec)),

      sec('Prototype v15 đang chạy gì',
        h('div', { class: 'spec-lbl' }, 'Prototype không có backend, nên chạy bản rút gọn. Nêu ra đây để bạn không nhầm bản rút gọn với đặc tả thật.'),
        h('pre', { class: 'spec' }, t.protoSpec)),

      sec('Tham số kỹ thuật',
        table(['Tham số', { label: 'Giá trị', num: 1 }, 'Nghĩa là gì'],
          t.params.map(([k, val, note]) => [h('span', { class: 'mono' }, k), h('span', { class: 'num' }, val), note])),
        t.paramNote && h('p', { class: 'faint small mt-2' }, t.paramNote)),

      t.rejected && sec('Cái gì đã bị bác và vì sao',
        table(['Thành phần', 'Lý do bị bác'],
          t.rejected.map(([k, why]) => [h('span', { class: 'strong' }, k), why]))),

      sec('Bằng chứng đã đo',
        table(['Khẳng định được kiểm', 'Kết quả đo', 'Phán quyết'],
          t.evidence.map(([claim, measured, kind, verdict]) => [
            claim, h('span', { class: 'small' }, measured),
            h('span', { class: 'vd vd-' + kind }, verdict)])),
        t.evidenceNote && h('p', { class: 'faint small mt-2' }, t.evidenceNote)),

      sec('Khi nào nó sai',
        h('p', {}, 'Phương pháp nào không nói được lúc nào mình sai thì không đáng tin. Đây là các chế độ hỏng đã đăng ký trước — biết trước để không hoảng.'),
        table(['Chế độ hỏng', 'Biểu hiện', 'Có phải lỗi không'],
          t.failures.map(([mode, sign, isbug]) => [h('span', { class: 'strong' }, mode), sign, h('span', { class: 'small muted' }, isbug)]))),

      t.banned && sec('Cấm định danh trong mã nguồn',
        h('div', { class: 'banned' }, t.banned.map((b) => chip(b, 'chip-rejected'))),
        h('p', { class: 'mt-3' }, t.bannedWhy)),

      sec('Ký hiệu dùng ở phương pháp này',
        h('div', { class: 'gloss' }, t.symbols.map((k) => {
          const g = CP.theory.GLOSSARY[k]; if (!g) return null;
          return h('div', { class: 'gitem' },
            h('div', { class: 'gsym' }, g.sym),
            h('div', { class: 'gname' }, g.name),
            h('div', { class: 'gplain' }, g.plain),
            h('div', { class: 'gwhy' }, g.why));
        }))),

      h('div', { class: 'sec' }, CP.ui.disclaimer(),
        h('div', { class: 'passport mt-2' },
          `nguồn: phán quyết chín phương pháp §${t.src} · đo sâu bốn phương pháp · ADR-017 rào chắn 1,2σ̂/6,0σ̂ · ADR-018 tầng độ chọn lọc`)),

      h('div', { class: 'row mt-4' }, h('button', { class: 'btn', onClick: () => select(null) }, '← Tất cả phương pháp')));

    outlet.append(page);
  }

  /* ══════════════════════════════════════════════════════════════
     PHẦN TỰ KIỂM CHỨNG — gập sẵn ở cuối dashboard
     ══════════════════════════════════════════════════════════════ */

  function renderTiers() {
    const el = els.tiers; clear(el); const cur = CP.state.get('tier');
    put(el,
      h('p', { class: 'small muted' }, 'Tầng cắt cùng một danh sách đã kiểm định. Ít lệnh hơn ⇒ ít tổng lãi hơn, ',
        h('b', {}, 'cùng chất lượng kỳ vọng mỗi lệnh'), '. Không tầng nào là bẫy — đã đo, chênh lệch nằm trong nhiễu (ADR-018 §2).'),
      h('div', { class: 'tiers' }, CP.tiers.map((t) => h('button', {
        class: 'btn ' + (t.id === cur ? 'is-on' : ''), 'aria-pressed': String(t.id === cur),
        onClick: () => {
          if (t.id === cur) return;
          CP.state.set({ tier: t.id });
          if (CP.auth.current()) CP.auth.setPrefs({ tier: t.id });
          toast(`Tầng ${t.name}: ~${t.perYear} khuyến nghị/đồng/năm · tổng R kỳ vọng ${t.totalR}R — điều tiết TẦN SUẤT, không phải chất lượng. Hiệu lực từ chu kỳ sau.`, 'info', 6000);
          renderTiers(); renderTrack();
        },
      }, t.name, h('small', {}, `~${t.perYear}/đồng/năm`)))),
      h('p', { class: 'faint small' }, 'Đổi tầng có độ trễ: hiệu lực từ chu kỳ sau; quá khứ chấm theo tầng lúc phát. Số lần đổi tầng 90 ngày: ',
        h('span', { class: 'num strong' }, tierChanges90d())));
  }

  const kpi = (l, v, sub) => h('div', { class: 'kpi' }, h('span', { class: 'kpi-label' }, l), h('span', { class: 'kpi-value num' }, v), h('span', { class: 'kpi-delta faint' }, sub));

  function calib(hist) {
    const bins = [[0.34, 0.42], [0.42, 0.5], [0.5, 0.58], [0.58, 0.66], [0.66, 1]];
    const rows = bins.map(([a, b]) => {
      const g = hist.filter((x) => x.pUp >= a && x.pUp < b); const n = g.length;
      const up = g.filter((x) => x.outcomeClose > x.anchor).length;
      return { a, b, n, pred: n ? g.reduce((s, x) => s + x.pUp, 0) / n : null, real: n ? up / n : null };
    });
    return h('div', { class: 'stack-sm mt-2' },
      h('div', { class: 'strong small' }, 'Hệ nói “chắc bao nhiêu” có khớp thực tế không? — mức chắc chắn hệ nêu (tím) so với tỉ lệ tăng thật (xám), theo 5 nhóm'),
      h('div', { class: 'calib' }, rows.map((r) => h('div', {},
        h('div', { class: 'bar' },
          h('i', { class: 'pred', style: { height: ((r.pred || 0) * 100) + '%' }, title: 'dự báo' }),
          h('i', { style: { height: ((r.real || 0) * 100) + '%' }, title: 'thực tế' })),
        h('div', { class: 'num faint' }, `${Math.round(r.a * 100)}–${Math.round(r.b * 100)}%`),
        h('div', { class: 'num' }, r.n ? `${Math.round(r.real * 100)}% · n=${r.n}` : 'n=0')))),
      h('div', { class: 'faint tiny' }, 'Đạt yêu cầu khi thực tế nằm trong ±10 điểm quanh dự báo ở mọi bin có đủ mẫu.'));
  }

  function renderTrack() {
    const el = els.track; clear(el);
    const hist = CP.market.hist, tier = curTier();
    const st = CP.pred.stats(hist, tier.level), v = CP.verify.current();
    if (!st.n) { el.append(empty('Chưa có khuyến nghị nào đã chấm ở tầng này')); return; }
    const acc = st.accuracy * 100, ci = wilson(st.hits, st.n);
    const acted = hist.filter((x) => x.direction !== 'FLAT' && x.level >= tier.level);
    let cum = 0; const rSeries = acted.map((x) => [x.issuedAt, (cum += x.R)]);
    const closed = CP.market.closed();
    const base0 = closed[Math.max(0, closed.length - hist.length)] || closed[0];
    const bh = hist.map((x) => [x.issuedAt, Math.log(x.outcomeClose / base0.c) / (x.sigma * x.barrier.slSigma || 1)]);
    const chartEl = h('div', {}), bhEl = h('div', {});
    put(el,
      h('div', { class: 'row' }, chip('HIỆU SUẤT GIẢ ĐỊNH · mô phỏng', 'chip-sim'), chip(v.label + ' · n=' + st.n, 'chip-pred'),
        !st.enough && chip('chưa đủ dữ liệu (< 100)', 'chip-warn')),
      h('div', { class: 'kpi-row' },
        kpi('Đoán đúng hướng', `${acc.toFixed(1)}% ±${ci.toFixed(1)}`, `${st.hits} đúng · ${st.misses} sai · trên ${st.n} lần lên tiếng`),
        kpi('Lãi gộp ÷ lỗ gộp', st.profitFactor == null ? '—' : st.profitFactor === Infinity ? '∞' : st.profitFactor.toFixed(2), 'trên 1 là có lãi, sau phí'),
        kpi('Kết quả cộng dồn sau phí', (st.totalR >= 0 ? '+' : '') + st.totalR.toFixed(1), 'đơn vị rủi ro (1 = một lần chạm dừng lỗ)'),
        kpi('Tầng đang chấm', tier.name, `~${tier.perYear} khuyến nghị/đồng/năm`)),
      h('div', { class: 'note' }, 'Lưu ý khi đọc: “Đoán đúng hướng” chấm bằng giá đóng cửa cuối chân trời, còn “Kết quả cộng dồn” chấm bằng chạm dừng lỗ/chốt lời. Hai định nghĩa thắng khác nhau — đừng so trực tiếp tỉ lệ đúng với ngưỡng hoà vốn.'),
      h('div', { class: 'strong small mt-2' }, 'Kết quả cộng dồn của các khuyến nghị (đơn vị rủi ro)'), chartEl,
      h('div', { class: 'strong small mt-2' }, 'Đối chứng: mua-và-giữ đều đặn cùng kỳ (quy về cùng đơn vị, gần đúng)'), bhEl,
      h('div', { class: 'legend' },
        h('span', {}, h('i', { style: { background: 'var(--text-2)' } }), 'khuyến nghị'),
        h('span', {}, h('i', { style: { background: 'var(--series-1)' } }), 'mua-và-giữ đều đặn (DCA)')),
      calib(hist),
      h('p', { class: 'faint small' }, 'Không trộn với lệnh Paper/Trading của bạn (TRACK-04). ✗ ngang hàng ✓; sổ chỉ thêm, không sửa, không xoá.'));
    CP.charts.line(chartEl, rSeries, { color: 'text-2', hgt: 120, baseline: 0 });
    CP.charts.line(bhEl, bh, { color: 'series-1', hgt: 90, baseline: 0, fillArea: false });
  }

  function renderLog() {
    const el = els.log; clear(el);
    const hist = CP.market.hist.slice().reverse();
    const rows = hist.filter((x) => logTier === 'all' || x.level >= +logTier).slice(0, 40).map((x) => [
      h('span', { class: 'num' }, fmt.dateTimeUTC(x.issuedAt)),
      dirBadge(x.direction, x.pUp),
      h('span', { class: 'num' }, Math.round(x.pUp * 100) + '%'),
      h('span', { class: 'num' }, x.level),
      x.direction === 'FLAT' ? h('span', { class: 'muted' }, '— im lặng') : x.hit ? h('span', { class: 'up-text' }, '✓ đúng') : h('span', { class: 'down-text' }, '✗ sai'),
      h('span', { class: 'num' }, x.direction === 'FLAT' ? '—' : (x.R >= 0 ? '+' : '') + x.R.toFixed(2)),
      h('span', { class: 'mono faint tiny' }, x.id.split('|')[1]),
    ]);
    put(el,
      h('div', { class: 'row' }, h('span', { class: 'small muted' }, 'Lọc tầng:'),
        h('div', { class: 'seg' }, [['all', 'Tất cả'], ['0.25', 'Đầy đủ'], ['0.5', 'Cân bằng'], ['0.75', 'Chọn lọc'], ['1', 'Tối thiểu']].map(([k, l]) =>
          h('button', { class: 'seg-btn ' + (logTier === k ? 'is-active' : ''), onClick: () => { logTier = k; renderLog(); } }, l))),
        h('span', { class: 'spacer' }),
        h('button', {
          class: 'btn btn-sm', onClick: () => modal({
            title: 'CSV (40 dòng)',
            body: h('textarea', { class: 'input', rows: 12, readonly: true, style: { fontFamily: 'var(--font-mono)', height: 'auto' } },
              'issued_at_utc,direction,p_up,level,hit,R,id\n' + hist.slice(0, 40).map((x) => [new Date(x.issuedAt).toISOString(), x.direction, x.pUp.toFixed(3), x.level, x.hit == null ? '' : x.hit ? 1 : 0, x.R.toFixed(3), x.id].join(',')).join('\n')),
          }),
        }, '⊞ CSV')),
      table(['Phát (UTC)', 'Hướng', { label: 'Độ chắc', num: 1 }, { label: 'Mức dứt khoát', num: 1 }, 'Kết quả', { label: 'Lãi/lỗ (đơn vị rủi ro)', num: 1 }, 'mã'],
        rows, { empty: 'Chưa có bản ghi ở tầng này' }),
      h('p', { class: 'faint tiny' }, 'Độ chắc = xác suất tăng đã hiệu chỉnh (đọc chi tiết ở trang lý thuyết). Mức dứt khoát 0,25–1 quyết định khuyến nghị thuộc tầng nào. ✗ ngang hàng ✓, không xoá.'));
  }

  /* ══════════════════════════════════════════════════════════════
     ĐIỀU PHỐI
     ══════════════════════════════════════════════════════════════ */

  function select(id) {
    selected = id;
    if (id) CP.router.go('consult', { m: id }); else CP.router.go('consult');
  }

  function renderHead() {
    const el = els.head; if (!el) return; clear(el);
    const tf = CP.state.get('tf');
    put(el,
      h('h1', {}, 'Phương pháp'),
      h('button', { class: 'pairbtn', onClick: () => CP.openPairs() }, fmt.base(CP.state.get('symbol')) + '/USDT ▾'),
      h('div', { class: 'tfbar' }, ['1h', '4h', '1d'].map((x) =>
        h('button', { class: 'ibtn model ' + (x === tf ? 'is-active' : ''), title: 'Khung nến ' + x, onClick: () => CP.state.set({ tf: x }) }, x))),
      h('span', { class: 'spacer' }),
      freshness(CP.data.freshness, CP.data.lastTick, 'Giá'), modeTag(CP.mode.get()));
  }

  function renderDash() {
    renderHead(); renderStrip(); renderBoards(); renderTiers(); renderTrack(); renderLog();
  }

  function mountDash(outlet) {
    els = {
      head: h('div', { class: 'subhead' }), strip: h('div', { class: 'stack-sm' }),
      boards: h('div', {}), tiers: h('div', { class: 'stack-sm' }),
      track: h('div', { class: 'stack-sm' }), log: h('div', { class: 'stack-sm' }),
    };
    // Mọi dashboard luôn hiển thị (collapsible:false) — không tap-to-open (yêu cầu chủ dự án 28/08/2026)
    outlet.append(h('div', { class: 'page' }, els.head,
      panel({ id: 'cs-strip', title: 'Hệ thống nói gì', subtitle: 'một kết luận duy nhất', collapsible: false, body: els.strip }),
      panel({ id: 'cs-boards', title: 'Bốn phương pháp — mỗi cái một dashboard', subtitle: 'xếp theo độ hợp với thị trường lúc này', collapsible: false, body: els.boards, cls: 'mt-3' }),
      h('div', { class: 'grid-2 mt-3' },
        panel({ id: 'cs-tier', title: 'Tầng độ chọn lọc', subtitle: 'điều tiết số lượng khuyến nghị bạn nhận — không phải chất lượng', collapsible: false, body: els.tiers }),
        panel({ id: 'cs-track', title: 'Hiệu suất giả định', subtitle: 'tỉ lệ đúng · tổng R · hiệu chỉnh — luôn kèm n=', collapsible: false, body: els.track })),
      panel({ id: 'cs-log', title: 'Nhật ký dự đoán', subtitle: 'ghi trước kết cục · chỉ thêm, không sửa', collapsible: false, body: els.log, cls: 'mt-3' })));
  }

  CP.screens.register('consult', {
    title: 'Phương pháp', auth: false,
    async mount(outlet, { params }) {
      selected = params && params.m && CP.theory.of(params.m) ? params.m : null;
      const draw = () => {
        clear(outlet);
        if (selected) renderDetail(outlet, selected); else { mountDash(outlet); renderDash(); }
      };

      if (!['1h', '4h', '1d'].includes(CP.state.get('tf'))) CP.state.set({ tf: '1h' });

      offs.push(
        CP.market.on('klines', () => { methodStats = null; draw(); }),
        CP.market.on('closed', () => { methodStats = null; draw(); }),
        CP.market.on('fresh', () => { if (!selected) renderHead(); }),
        CP.state.subscribe((keys) => {
          if (keys.includes('symbol') || keys.includes('tf')) {
            methodStats = null;
            CP.market.load(CP.state.get('symbol'), CP.state.get('tf'));
          }
        }));

      if (selected) outlet.append(h('div', { class: 'page' }, CP.ui.skeleton(400)));
      else { mountDash(outlet); renderHead(); els.strip.append(CP.ui.skeleton(60)); }
      await CP.market.load(CP.state.get('symbol'), CP.state.get('tf'));
      if (CP.market.klines.length) draw();
      else { clear(outlet); outlet.append(h('div', { class: 'page' }, empty('Chưa tải được nến', 'Kiểm tra kết nối rồi tải lại trang.'))); }
    },
    unmount() {
      offs.forEach((f) => f()); offs = [];
      timers.forEach(clearInterval); timers = [];
      methodStats = null; els = {};
    },
  });
})();
