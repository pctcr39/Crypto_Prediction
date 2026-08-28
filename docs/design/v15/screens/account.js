/* ══════════════════════════════════════════════════════════════════
   screens/account.js — TÀI KHOẢN: hồ sơ · bảo mật (2FA) · liên kết Binance
   (LINK-01..05) · kênh thông báo (REQ-NOTIFY) · giới hạn rủi ro · tuỳ chọn ·
   dữ liệu & audit (ACC-05/07). Không bao giờ hiển thị lại Secret (Luật 14).
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const CP = window.CP;
  const { h, clear, put, fmt, panel, chip, modeTag, table, confirm, toast, modal, formRow, inlineError, empty } = CP.ui;
  const TABS = [['profile', 'Hồ sơ'], ['security', 'Bảo mật'], ['binance', 'Liên kết Binance'], ['notify', 'Kênh thông báo'], ['risk', 'Giới hạn rủi ro'], ['prefs', 'Tuỳ chọn'], ['data', 'Dữ liệu & audit']];
  let timers = [], content = null, curTab = 'profile';

  CP.ui.injectCSS('account', `
    .acc-h{display:flex;align-items:center;gap:8px;margin-bottom:12px}
    .acc-h h1{font-size:var(--fs-16);font-weight:600}
    .ipbox{display:flex;gap:6px;align-items:center}
    .ipbox code{font-family:var(--font-mono);background:var(--surface-2);padding:4px 8px;border-radius:var(--r-1)}
    .steps-ol{padding-left:18px;display:flex;flex-direction:column;gap:6px;font-size:var(--fs-12);color:var(--text-2)}
  `);

  const need = () => h('div', { class: 'stack' }, empty('Cần đăng nhập để xem mục này'), h('a', { class: 'btn btn-primary', href: '#/auth?next=account' }, 'Đăng nhập'));
  const relogin = () => { window.dispatchEvent(new Event('cp:auth')); };

  // ── HỒ SƠ ────────────────────────────────────────────────────────
  function profile(u) {
    return h('div', { class: 'stack' },
      panel({ id: 'acc-profile', title: 'Hồ sơ', collapsible: false, body: h('div', { class: 'stack-sm' },
        h('div', { class: 'row-between' }, h('span', { class: 'muted' }, 'Email'), h('span', { class: 'mono' }, u.email)),
        h('div', { class: 'row-between' }, h('span', { class: 'muted' }, 'Tạo lúc'), h('span', { class: 'num' }, fmt.dateTimeUTC(u.createdAt) + ' UTC')),
        h('div', { class: 'row-between' }, h('span', { class: 'muted' }, 'Chế độ'), h('div', { class: 'row' }, modeTag(CP.mode.get()), h('button', { class: 'btn btn-sm', onClick: () => document.getElementById('modebtn')?.click() }, 'Đổi chế độ'))),
        h('div', { class: 'row-between' }, h('span', { class: 'muted' }, 'Xác thực hai bước'), u.twoFA ? chip('đã bật', 'chip-up') : chip('chưa bật', 'chip-warn')),
        h('div', { class: 'row-between' }, h('span', { class: 'muted' }, 'Liên kết Binance'), CP.link.get() ? chip('đã liên kết · ' + (CP.link.get().status === 'trade' ? 'giao dịch' : 'chỉ đọc'), 'chip-up') : chip('chưa', '')),
        h('div', { class: 'row-between' }, h('span', { class: 'muted' }, 'Kênh thông báo đã xác minh'), CP.notify.hasVerified() ? chip('có', 'chip-up') : chip('chưa', 'chip-warn'))) }),
      panel({ id: 'acc-sess', title: 'Phiên', collapsible: false, body: h('div', { class: 'row' },
        h('button', { class: 'btn', onClick: () => { CP.auth.logout(); relogin(); CP.router.go('trade'); toast('Đã đăng xuất', 'info'); } }, 'Đăng xuất'),
        h('button', { class: 'btn', onClick: () => { CP.auth.logout(); relogin(); CP.router.go('trade'); toast('Đã đăng xuất mọi thiết bị (giả lập)', 'info'); } }, 'Đăng xuất mọi thiết bị')) }));
  }

  // ── BẢO MẬT ──────────────────────────────────────────────────────
  function security(u) {
    const body = h('div', { class: 'stack' });
    const draw = () => {
      clear(body); const user = CP.auth.current();
      if (!user.twoFA) {
        const code = h('div', { class: 'code num' }, CP.auth.twoFACode());
        timers.push(setInterval(() => { code.textContent = CP.auth.twoFACode(); }, 5000));
        const inp = h('input', { class: 'input', inputmode: 'numeric', maxlength: '6', placeholder: '000000', autocomplete: 'one-time-code', 'aria-label': 'Mã 6 số' });
        const wrap = h('div', { class: 'stack-sm' });
        put(body, h('p', { class: 'muted small' }, 'Bắt buộc trước khi liên kết Binance hoặc bật bot (ACC-03).'),
          h('div', { class: 'authenticator' }, h('div', { class: 'small strong' }, 'Ứng dụng xác thực giả lập (chỉ prototype)'), code),
          put(wrap, formRow('Mã 6 số', inp), h('button', { class: 'btn btn-primary', onClick: () => { try { CP.auth.enable2FA(inp.value.trim()); toast('Đã bật xác thực hai bước', 'ok'); draw(); } catch (e) { inlineError(wrap, e.message); } } }, 'Bật xác thực hai bước')));
      } else {
        const ok = CP.auth.twoFAVerified();
        const inp = h('input', { class: 'input', inputmode: 'numeric', maxlength: '6', placeholder: '000000', 'aria-label': 'Mã 6 số' });
        const wrap = h('div', { class: 'stack-sm' });
        put(body, h('div', { class: 'row' }, chip('Xác thực hai bước: đã bật', 'chip-up'), ok ? chip('phiên này đã xác minh', 'chip-up') : chip('phiên này chưa xác minh', 'chip-warn')),
          !ok && h('div', { class: 'authenticator' }, h('div', { class: 'small strong' }, 'Ứng dụng xác thực giả lập'), h('div', { class: 'code num' }, CP.auth.twoFACode())),
          !ok && put(wrap, formRow('Mã 6 số', inp), h('button', { class: 'btn', onClick: () => { try { CP.auth.verify2FA(inp.value.trim()); toast('Đã xác minh phiên', 'ok'); draw(); } catch (e) { inlineError(wrap, e.message); } } }, 'Xác minh lại')));
      }
      const ap = h('input', { class: 'input', maxlength: '8', value: localStorage.getItem('cp15.antiphish') || '', placeholder: '6–8 ký tự', 'aria-label': 'Mã chống lừa đảo' });
      put(body, h('div', { class: 'divider' }), h('div', { class: 'strong small' }, 'Mã chống lừa đảo'), h('p', { class: 'muted small' }, 'Mọi email từ cryptopred sẽ chứa mã này. Chúng tôi không bao giờ hỏi mật khẩu hay Secret Binance.'),
        h('div', { class: 'row' }, ap, h('button', { class: 'btn btn-sm', onClick: () => { const v = ap.value.trim(); if (v.length < 6) return toast('Mã cần 6–8 ký tự', 'error'); localStorage.setItem('cp15.antiphish', v); toast('Đã lưu mã chống lừa đảo', 'ok'); } }, 'Lưu')));
    };
    draw();
    return panel({ id: 'acc-sec', title: 'Bảo mật', collapsible: false, body });
  }

  // ── LIÊN KẾT BINANCE ─────────────────────────────────────────────
  const permTable = (perms) => h('div', { class: 'perm' },
    h('span', {}, 'Enable Reading'), h('span', { class: perms.enableReading ? 'yes' : 'no' }, perms.enableReading ? '✓ có' : '✗ không'),
    h('span', {}, 'Enable Spot & Margin Trading'), h('span', { class: perms.enableSpotAndMarginTrading ? 'yes' : 'no' }, perms.enableSpotAndMarginTrading ? '✓ có' : '✗ không'),
    h('span', {}, 'Enable Withdrawals'), h('span', { class: perms.enableWithdrawals ? 'bad' : 'yes' }, perms.enableWithdrawals ? '✗ CÓ — bị từ chối' : '✓ không (đúng)'),
    h('span', {}, 'Khoá theo IP (ipRestrict)'), h('span', { class: perms.ipRestrict ? 'yes' : 'no' }, perms.ipRestrict ? '✓ có' : '✗ không'));
  function binance(u) {
    const body = h('div', { class: 'stack' });
    const draw = () => {
      clear(body); const l = CP.link.get();
      if (l) {
        put(body,
          h('div', { class: 'row' }, chip('Đã liên kết · ' + (l.status === 'trade' ? 'Giao dịch' : 'Chỉ đọc'), 'chip-up'), h('span', { class: 'mono muted' }, 'khoá ' + l.fp), h('span', { class: 'muted small' }, 'kiểm quyền lần cuối ' + fmt.dateTimeUTC(l.lastCheck) + ' UTC'), h('button', { class: 'btn btn-sm', onClick: () => { CP.link.recheck(); toast('Quyền không đổi (giả lập)', 'ok'); draw(); } }, 'Kiểm tra lại')),
          !l.perms.ipRestrict && h('div', { class: 'note note-warn' }, 'Khoá chưa giới hạn IP: Binance sẽ xoá key sau 30 ngày không dùng; hãy khoá IP theo hướng dẫn bên dưới.'),
          permTable(l.perms),
          h('div', { class: 'strong small' }, 'Số dư trên Binance (chỉ đọc)'),
          table(['Tài sản', { label: 'Khả dụng', num: 1 }, { label: 'Đang khoá', num: 1 }], l.balances.map((b) => [b.asset, fmt.qty(b.free), fmt.qty(b.locked)])),
          h('p', { class: 'faint small' }, 'Khoá API được mã hoá khi lưu; không bao giờ hiển thị lại Secret. Thu hồi bất cứ lúc nào: xoá key tại Binance › API Management — chúng tôi mất quyền ngay lập tức. Không dùng key này cho dịch vụ khác.'),
          h('button', { class: 'btn btn-danger', onClick: async () => { if (await confirm({ title: 'Thu hồi liên kết Binance?', body: h('p', {}, 'Thu hồi ngay: xoá khoá, dừng mọi bot của bạn, ghi audit. Bạn nên xoá key ở Binance nữa.'), okText: 'Thu hồi', danger: true })) { CP.link.revoke(); toast('Đã thu hồi khoá và dừng bot', 'ok'); draw(); relogin(); } } }, 'Thu hồi một chạm'));
        return;
      }
      const ip = CP.link.serverIp;
      const label = h('input', { class: 'input', value: 'cryptopred', 'aria-label': 'Nhãn' });
      const key = h('input', { class: 'input mono', autocomplete: 'off', placeholder: '64 ký tự', 'aria-label': 'API Key' });
      const sec = h('input', { class: 'input mono', type: 'password', autocomplete: 'off', placeholder: 'chỉ dán, không hiển thị lại', 'aria-label': 'Secret key' });
      const noWd = h('input', { type: 'checkbox' });
      const sim = h('select', { class: 'select', 'aria-label': 'Giả lập kết quả kiểm quyền' }, h('option', { value: 'ok' }, 'Khoá đúng: đọc + giao dịch giao ngay, khoá IP'), h('option', { value: 'withdraw' }, 'Khoá CÓ quyền rút tiền (phải bị từ chối)'), h('option', { value: 'readonly' }, 'Khoá chỉ đọc, không khoá IP'));
      const res = h('div', {}); const wrap = h('div', { class: 'stack-sm' });
      const btn = h('button', { class: 'btn btn-primary', onClick: async () => {
        clear(res); inlineError(wrap, null);
        if (!noWd.checked) return inlineError(wrap, 'Hãy xác nhận bạn KHÔNG bật Enable Withdrawals');
        if (!CP.auth.current().twoFA || !CP.auth.twoFAVerified()) { inlineError(wrap, 'Cần bật và xác minh xác thực hai bước trước (tab Bảo mật)'); return; }
        btn.disabled = true; btn.textContent = 'Đang kiểm quyền…';
        try {
          const r = await CP.link.connect({ apiKey: key.value.trim(), secret: sec.value, simulate: sim.value });
          sec.value = ''; key.value = '';
          toast('Đã liên kết · ' + (r.status === 'trade' ? 'quyền giao dịch' : 'chỉ đọc'), 'ok'); relogin(); draw();
        } catch (e) {
          sec.value = '';
          if (e.code === 'WITHDRAW') put(res, h('div', { class: 'note note-danger', role: 'alert' }, h('div', { class: 'strong' }, 'Từ chối liên kết'), e.message, h('div', { class: 'mt-2' }, permTable({ enableReading: true, enableSpotAndMarginTrading: true, enableWithdrawals: true, ipRestrict: false }))));
          else inlineError(wrap, e.message);
        } finally { btn.disabled = false; btn.textContent = 'Kiểm tra quyền & liên kết'; }
      } }, 'Kiểm tra quyền & liên kết');
      put(body,
        h('div', { class: 'note note-info' }, 'Chúng tôi không đăng nhập Binance thay bạn. Bạn tự tạo API key ở Binance › API Management rồi dán vào đây. ', h('a', { href: 'https://www.binance.com/en/my/settings/api-management', target: '_blank', rel: 'noopener noreferrer' }, 'Mở Binance API Management ↗')),
        h('ol', { class: 'steps-ol' },
          h('li', {}, 'Tạo API key mới (System-generated HMAC hoặc Ed25519), đặt nhãn ', h('code', {}, 'cryptopred'), '.'),
          h('li', {}, 'Chọn "Restrict access to trusted IPs only" và thêm IP máy chủ: ', h('span', { class: 'ipbox' }, h('code', {}, ip), h('button', { class: 'btn btn-sm', onClick: () => { navigator.clipboard?.writeText(ip); toast('Đã sao chép IP', 'ok'); } }, 'Sao chép'))),
          h('li', {}, 'Bật "Enable Reading". Chỉ bật "Enable Spot & Margin Trading" nếu bạn sẽ dùng TIỀN THẬT.'),
          h('li', {}, h('span', { class: 'strong' }, 'KHÔNG bật "Enable Withdrawals"'), ' — hệ từ chối mọi khoá có quyền rút tiền (Luật 13) và kiểm lại định kỳ.')),
        put(wrap, formRow('Nhãn', label), formRow('API Key', key), formRow('Secret key', sec, 'Mã hoá khi lưu; không bao giờ hiển thị lại.'), h('label', { class: 'check' }, noWd, 'Tôi KHÔNG bật Enable Withdrawals'), formRow('Giả lập kết quả kiểm quyền (chỉ prototype)', sim), btn),
        res,
        h('p', { class: 'faint small' }, 'Cần trước khi liên kết: xác thực hai bước đã bật (ACC-03) và một kênh thông báo đã xác minh (NOTIFY-01).'));
    };
    draw();
    return panel({ id: 'acc-bnb', title: 'Liên kết Binance', subtitle: 'không custody · khoá chỉ-quyền-giao-dịch', collapsible: false, body });
  }

  // ── KÊNH THÔNG BÁO (REQ-NOTIFY) ──────────────────────────────────
  function notify(u) {
    const body = h('div', { class: 'stack' });
    const draw = () => {
      clear(body); const list = CP.notify.list();
      const rows = list.map((c) => [c.type === 'email' ? 'Email' : 'Telegram', h('span', { class: 'mono' }, c.address), c.verified ? chip('đã xác minh', 'chip-up') : chip('chưa xác minh', 'chip-warn'),
        h('div', { class: 'row' }, !c.verified && h('button', { class: 'btn btn-sm', onClick: () => verifyDlg(c) }, 'Nhập mã'), h('button', { class: 'btn btn-sm btn-ghost', onClick: async () => { if (await confirm({ title: 'Gỡ kênh?', body: h('p', {}, 'Gỡ kênh đã xác minh cuối cùng sẽ dừng mọi bot (NOTIFY-01).'), okText: 'Gỡ', danger: true })) { CP.notify.remove(c.id); draw(); } } }, 'Gỡ'))]);
      const type = h('select', { class: 'select', 'aria-label': 'Loại kênh' }, h('option', { value: 'email' }, 'Email'), h('option', { value: 'telegram' }, 'Telegram'));
      const addr = h('input', { class: 'input', placeholder: 'địa chỉ email hoặc @telegram', 'aria-label': 'Địa chỉ' });
      const wrap = h('div', { class: 'stack-sm' });
      put(body, h('p', { class: 'muted small' }, 'Cần ít nhất một kênh ngoài màn hình đã xác minh trước khi liên kết Binance hoặc bật bot. Thông báo không bao giờ chứa khoá hay mã phiên.'),
        table(['Kênh', 'Địa chỉ', 'Trạng thái', ''], rows, { empty: 'Chưa có kênh nào' }),
        put(wrap, h('div', { class: 'row' }, type, addr, h('button', { class: 'btn', onClick: () => { try { const c = CP.notify.add(type.value, addr.value.trim() || u.email); draw(); verifyDlg(c); } catch (e) { inlineError(wrap, e.message); } } }, 'Thêm kênh'))),
        h('div', { class: 'divider' }), h('div', { class: 'strong small' }, 'Sự kiện bắt buộc báo qua kênh ngoài (NOTIFY-02)'), h('ul', { class: 'small muted', style: { margin: 0, paddingLeft: '18px' } }, CP.notify.events.map((e) => h('li', {}, e))));
    };
    const verifyDlg = (c) => { const inp = h('input', { class: 'input', inputmode: 'numeric', maxlength: '6', 'aria-label': 'Mã' }); const w = h('div', { class: 'stack-sm' }); const close = modal({ title: 'Xác minh kênh', body: put(w, h('div', { class: 'authenticator' }, h('div', { class: 'small strong' }, 'Hộp thư giả lập (chỉ prototype)'), h('div', { class: 'code num' }, c.code)), formRow('Mã 6 số', inp), h('button', { class: 'btn btn-primary', onClick: () => { try { CP.notify.verify(c.id, inp.value.trim()); toast('Đã xác minh kênh', 'ok'); close(); draw(); relogin(); } catch (e) { inlineError(w, e.message); } } }, 'Xác minh')) }); };
    draw();
    return panel({ id: 'acc-notify', title: 'Kênh thông báo ngoài màn hình', collapsible: false, body });
  }

  // ── GIỚI HẠN RỦI RO ─────────────────────────────────────────────
  function risk() {
    return panel({ id: 'acc-risk', title: 'Giới hạn rủi ro theo người dùng', subtitle: 'trong trần hệ thống · đổi giới hạn ghi audit', collapsible: false, body: h('div', { class: 'stack-sm' },
      table(['Giới hạn', 'Giá trị', 'Ghi chú'], [['Cỡ mỗi lệnh', '≤ 1% NAV', 'hằng số trong mã'], ['Tổng exposure', '≤ 5% NAV', 'khi mới bắt đầu'], ['Lỗ ngày', '−2% NAV đầu ngày (00:00 UTC) ⇒ chế độ an toàn, không tự bật lại', 'PnL thực hiện + chưa thực hiện, sau chi phí'], ['Mất tick', '> 60 giây ⇒ chế độ an toàn', 'giữ nguyên dừng lỗ trên sàn'], ['Dừng khẩn cấp', 'người dùng dừng bot mình · admin dừng mọi bot', 'không bao giờ huỷ lệnh dừng lỗ']]),
      h('p', { class: 'faint small' }, 'Prototype chỉ hiển thị; bản thật cho phép siết (không nới) trong trần hệ thống.')) });
  }

  // ── TUỲ CHỌN (ACC-04) ────────────────────────────────────────────
  function prefs(u) {
    const tier = CP.state.get('tier');
    const tierSel = h('select', { class: 'select', 'aria-label': 'Tầng độ chọn lọc', onChange: (e) => { const t = CP.tiers.find((x) => x.id === e.target.value); CP.state.set({ tier: t.id }); CP.auth.setPrefs({ tier: t.id }); toast(`Tầng ${t.name}: ~${t.perYear} khuyến nghị/đồng/năm · tổng R kỳ vọng ${t.totalR}R — điều tiết tần suất, không phải chất lượng. Hiệu lực từ chu kỳ sau.`, 'info', 6000); } }, CP.tiers.map((t) => h('option', { value: t.id, selected: t.id === tier }, `${t.name} · ~${t.perYear}/đồng/năm`)));
    const toggle = (label, get, set) => h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: get(), onChange: (e) => set(e.target.checked) }), label);
    return panel({ id: 'acc-prefs', title: 'Tuỳ chọn', collapsible: false, body: h('div', { class: 'stack' },
      formRow('Giao diện', h('div', { class: 'seg' }, [['dark', 'Tối'], ['light', 'Sáng']].map(([k, l]) => h('button', { class: 'seg-btn ' + (CP.state.get('theme') === k ? 'is-active' : ''), onClick: () => { CP.applyTheme(k); CP.router.render(); } }, l)))),
      toggle('Chế độ mù màu đỏ-lục (xanh dương / cam)', () => document.documentElement.getAttribute('data-cvd') === 'true', (v) => { document.documentElement.toggleAttribute('data-cvd', v); if (v) document.documentElement.setAttribute('data-cvd', 'true'); localStorage.setItem('cp15.cvd', v ? '1' : '0'); window.dispatchEvent(new Event('cp:theme')); }),
      toggle('Quy ước Á Đông: đỏ = tăng, xanh = giảm', () => document.documentElement.getAttribute('data-updown') === 'asia', (v) => { if (v) document.documentElement.setAttribute('data-updown', 'asia'); else document.documentElement.removeAttribute('data-updown'); localStorage.setItem('cp15.updown', v ? 'asia' : ''); window.dispatchEvent(new Event('cp:theme')); }),
      formRow('Ngôn ngữ', h('select', { class: 'select' }, h('option', {}, 'Tiếng Việt'), h('option', { disabled: true }, 'English — sắp có'))),
      formRow('Tầng độ chọn lọc (ADR-018)', tierSel, 'Tầng điều tiết TẦN SUẤT khuyến nghị và tổng R, không phải chất lượng. Lựa chọn ghi append-only, hiệu lực từ chu kỳ sau.'),
      formRow('Bố cục màn Giao dịch', h('select', { class: 'select', onChange: (e) => CP.state.set({ layout: e.target.value }) }, [['simple', 'Đơn giản'], ['standard', 'Chuẩn'], ['terminal', 'Terminal']].map(([k, l]) => h('option', { value: k, selected: CP.state.get('layout') === k }, l))))) });
  }

  // ── DỮ LIỆU & AUDIT ─────────────────────────────────────────────
  function data(u) {
    const log = CP.auth.auditLog().slice(0, 100);
    return h('div', { class: 'stack' },
      panel({ id: 'acc-audit', title: 'Nhật ký kiểm toán', subtitle: 'hành động nhạy cảm · bất biến · không chứa khoá', collapsible: false, body: table(['Giờ UTC', 'Hành động', 'Chi tiết'], log.map((a) => [h('span', { class: 'num' }, fmt.dateTimeUTC(a.at)), h('span', { class: 'mono' }, a.action), h('span', { class: 'muted' }, Object.entries(a).filter(([k]) => !['id', 'at', 'action', 'email'].includes(k)).map(([k, v]) => k + '=' + v).join(' · '))]), { empty: 'Chưa có bản ghi' }) }),
      panel({ id: 'acc-del', title: 'Xoá tài khoản', collapsible: false, body: h('div', { class: 'stack-sm' }, h('p', { class: 'muted small' }, 'Thu hồi khoá ngay, xoá dữ liệu cá nhân. Track record đã phát được ẩn danh hoá, không xoá (Luật 17 / LEGAL-04).'), h('button', { class: 'btn btn-danger', onClick: async () => { if (await confirm({ title: 'Xoá tài khoản?', body: h('p', {}, 'Gõ email của bạn để xác nhận. Không hoàn tác được.'), okText: 'Xoá vĩnh viễn', danger: true, requireText: u.email })) { CP.auth.deleteAccount(); relogin(); CP.router.go('trade'); toast('Đã xoá tài khoản', 'info'); } } }, 'Xoá tài khoản')) }));
  }

  function draw(u) {
    clear(content); timers.forEach(clearInterval); timers = [];
    if (!u) { content.append(need()); return; }
    const fn = { profile, security, binance, notify, risk, prefs, data }[curTab] || profile;
    content.append(fn(u));
  }

  CP.screens.register('account', {
    title: 'Tài khoản', auth: true,
    mount(outlet, { params, user }) {
      curTab = TABS.some(([k]) => k === params.tab) ? params.tab : 'profile';
      content = h('div', { class: 'stack' });
      const nav = h('nav', { class: 'sidenav', 'aria-label': 'Tài khoản' }, TABS.map(([k, l]) => h('a', { href: '#/account?tab=' + k, class: k === curTab ? 'is-active' : '', onClick: (e) => { e.preventDefault(); curTab = k; history.replaceState(null, '', '#/account?tab=' + k); nav.querySelectorAll('a').forEach((a) => a.classList.toggle('is-active', a.getAttribute('href').endsWith(k))); draw(CP.auth.current()); } }, l)));
      outlet.append(h('div', { class: 'account' }, h('div', {}, h('div', { class: 'acc-h' }, h('h1', {}, 'Tài khoản'), user && modeTag(CP.mode.get())), nav), content));
      draw(user || CP.auth.current());
    },
    unmount() { timers.forEach(clearInterval); timers = []; },
  });
})();
