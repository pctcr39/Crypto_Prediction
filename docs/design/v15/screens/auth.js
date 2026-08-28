/* ══════════════════════════════════════════════════════════════════
   screens/auth.js — ĐĂNG NHẬP / ĐĂNG KÝ (ACC-01, ACC-03, LEGAL-02)
   Tài khoản nền tảng tách biệt — KHÔNG có "Đăng nhập bằng Binance".
   Mọi thứ cần hộp thư/ứng dụng xác thực được giả lập ngay trên màn (prototype).
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const CP = window.CP;
  const { h, clear, put, toast, modal } = CP.ui;
  let timers = [], tab = 'login';

  const authenticator = (title, code) => h('div', { class: 'authenticator' }, h('div', { class: 'small strong' }, title + ' (chỉ prototype — bản thật gửi qua email/ứng dụng xác thực)'), h('div', { class: 'code num' }, code));
  const otpInput = (onInput) => h('input', { class: 'input', inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: '6', placeholder: '000000', 'aria-label': 'Mã 6 số', onInput });
  const errBox = () => h('div', { class: 'auth-err' });
  const setErr = (box, msg) => { clear(box); if (msg) box.append(h('div', { class: 'inline-err', role: 'alert' }, msg)); };
  const finish = (next) => { window.dispatchEvent(new Event('cp:auth')); CP.router.go(next || 'trade'); };

  // ── ĐĂNG NHẬP ────────────────────────────────────────────────────
  function loginForm(card, next) {
    let fails = +(sessionStorage.getItem('cp15.fails') || 0), lockUntil = +(sessionStorage.getItem('cp15.lock') || 0);
    const err = errBox();
    const email = h('input', { class: 'input', type: 'email', autocomplete: 'email', required: true, 'aria-label': 'Email' });
    const pw = h('input', { class: 'input', type: 'password', autocomplete: 'current-password', required: true, 'aria-label': 'Mật khẩu' });
    const showBtn = h('button', { class: 'ibtn', type: 'button', 'aria-label': 'Hiện/ẩn mật khẩu', onClick: () => { pw.type = pw.type === 'password' ? 'text' : 'password'; } }, '👁');
    const btn = h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'Đăng nhập');
    const lockLine = h('div', { class: 'small faint' });
    const tickLock = () => { const left = lockUntil - Date.now(); if (left > 0) { btn.disabled = true; lockLine.textContent = `Tạm khoá sau 5 lần sai — thử lại sau ${Math.ceil(left / 1000)} s`; } else { btn.disabled = false; lockLine.textContent = ''; } };
    timers.push(setInterval(tickLock, 500)); tickLock();
    const form = h('form', { class: 'stack', onSubmit: async (e) => {
      e.preventDefault(); setErr(err, null);
      try {
        const u = await CP.auth.login(email.value, pw.value);
        sessionStorage.setItem('cp15.fails', '0');
        if (u.twoFA) return twoFAStep(card, next);
        toast('Đã đăng nhập · bạn đang ở PAPER · ví ảo 10.000 USDT', 'ok'); finish(next);
      } catch (ex) {
        fails++; sessionStorage.setItem('cp15.fails', String(fails));
        if (fails >= 5) { lockUntil = Date.now() + 30000; sessionStorage.setItem('cp15.lock', String(lockUntil)); fails = 0; sessionStorage.setItem('cp15.fails', '0'); }
        setErr(err, 'Email hoặc mật khẩu không đúng' + (fails ? ` (còn ${5 - fails} lần)` : ''));
        tickLock();
      } } },
      h('label', { class: 'frow' }, h('span', { class: 'flabel' }, 'Email'), email),
      h('label', { class: 'frow' }, h('span', { class: 'flabel' }, 'Mật khẩu'), h('div', { class: 'row', style: { flexWrap: 'nowrap' } }, pw, showBtn)),
      err, lockLine, btn,
      h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onClick: () => modal({ title: 'Quên mật khẩu', body: h('p', { class: 'muted' }, 'Prototype chưa có luồng đặt lại mật khẩu qua email. Bản thật: gửi liên kết một lần, hạn 30 phút, kèm mã chống lừa đảo của bạn.') }) }, 'Quên mật khẩu?'));
    return form;
  }
  function twoFAStep(card, next) {
    clear(card);
    const err = errBox();
    const inp = otpInput();
    const auth = authenticator('Ứng dụng xác thực giả lập', CP.auth.twoFACode());
    timers.push(setInterval(() => { auth.querySelector('.code').textContent = CP.auth.twoFACode(); }, 5000));
    put(card, h('h1', {}, 'Xác thực hai bước'), h('p', { class: 'muted small' }, 'Nhập mã 6 số từ ứng dụng xác thực của bạn.'), auth,
      h('form', { class: 'stack', onSubmit: (e) => { e.preventDefault(); try { CP.auth.verify2FA(inp.value.trim()); toast('Đã xác thực', 'ok'); finish(next); } catch (ex) { setErr(err, ex.message); } } },
        h('label', { class: 'frow' }, h('span', { class: 'flabel' }, 'Mã xác thực'), inp), err, h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'Xác nhận')),
      h('button', { class: 'btn btn-ghost btn-sm', onClick: () => { CP.auth.logout(); render(card, next); } }, 'Huỷ, quay lại'));
    inp.focus();
  }

  // ── ĐĂNG KÝ — 4 bước ─────────────────────────────────────────────
  function signupForm(card, next) {
    const err = errBox();
    const email = h('input', { class: 'input', type: 'email', autocomplete: 'email', required: true, 'aria-label': 'Email' });
    const pw = h('input', { class: 'input', type: 'password', autocomplete: 'new-password', required: true, 'aria-label': 'Mật khẩu', onInput: () => checks() });
    const rules = [['≥ 10 ký tự', (v) => v.length >= 10], ['≥ 1 chữ hoa', (v) => /[A-Z]/.test(v)], ['≥ 1 chữ số', (v) => /\d/.test(v)]];
    const checkEl = h('div', { class: 'pw-checks' });
    const checks = () => { clear(checkEl); rules.forEach(([l, f]) => checkEl.append(h('span', { class: f(pw.value) ? 'ok' : '' }, (f(pw.value) ? '✓ ' : '○ ') + l))); };
    checks();
    const terms = h('input', { type: 'checkbox', required: true });
    const form = h('form', { class: 'stack', onSubmit: async (e) => {
      e.preventDefault(); setErr(err, null);
      if (!rules.every(([, f]) => f(pw.value))) return setErr(err, 'Mật khẩu chưa đủ điều kiện');
      try { await CP.auth.signUp(email.value, pw.value, terms.checked); step2(card, next); } catch (ex) { setErr(err, ex.message); }
    } },
      h('label', { class: 'frow' }, h('span', { class: 'flabel' }, 'Email'), email),
      h('label', { class: 'frow' }, h('span', { class: 'flabel' }, 'Mật khẩu'), pw, checkEl),
      h('label', { class: 'check' }, terms, h('span', {}, 'Tôi đã đọc ', h('a', { href: '#', onClick: (e) => { e.preventDefault(); modal({ title: 'Điều khoản & tuyên bố miễn trừ', body: legal() }); } }, 'Điều khoản & tuyên bố miễn trừ'))),
      h('div', { class: 'note' }, 'Hệ đưa khuyến nghị; quyết định và trách nhiệm thuộc về bạn. Không đảm bảo lợi nhuận. Không custody — tiền luôn ở Binance của bạn.'),
      err, h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'Tạo tài khoản'));
    return form;
  }
  const legal = () => h('div', { class: 'stack-sm small muted' }, h('p', {}, '1. cryptopred đưa ra dự đoán và khuyến nghị để tham khảo. Quyết định giao dịch và trách nhiệm thuộc về bạn.'), h('p', {}, '2. Không đảm bảo lợi nhuận; mọi thành tích hiển thị kèm số mẫu và nhãn trạng thái kiểm chứng.'), h('p', {}, '3. Không custody: nền tảng không giữ tiền, chỉ nhận khoá API không có quyền rút tiền.'), h('p', {}, '4. Bạn có quyền xem và xoá dữ liệu cá nhân; track record đã phát được ẩn danh hoá, không xoá.'), h('p', {}, '5. Thuế (nếu có) do bạn tự khai — hệ không ước tính.'));

  function steps(n) { return h('div', { class: 'steps', 'aria-label': 'Bước ' + n + '/4' }, [1, 2, 3, 4].map((i) => h('span', { class: i <= n ? 'done' : '' }))); }
  function step2(card, next) {
    clear(card);
    const code = String(100000 + Math.floor(Math.random() * 900000));
    const err = errBox(); const inp = otpInput();
    let resendAt = Date.now() + 60000; const resend = h('button', { class: 'btn btn-ghost btn-sm', type: 'button', disabled: true }, 'Gửi lại');
    timers.push(setInterval(() => { const left = resendAt - Date.now(); resend.disabled = left > 0; resend.textContent = left > 0 ? `Gửi lại sau ${Math.ceil(left / 1000)} s` : 'Gửi lại'; }, 500));
    resend.addEventListener('click', () => { resendAt = Date.now() + 60000; toast('Đã gửi lại mã (giả lập)', 'info'); });
    put(card, steps(2), h('h1', {}, 'Xác nhận email'), h('p', { class: 'muted small' }, 'Nhập mã 6 số đã gửi tới ' + CP.auth.current().email + ' (hạn 30 phút).'),
      authenticator('Hộp thư giả lập', code),
      h('form', { class: 'stack', onSubmit: (e) => { e.preventDefault(); if (inp.value.trim() !== code) return setErr(err, 'Mã không đúng'); step3(card, next); } },
        h('label', { class: 'frow' }, h('span', { class: 'flabel' }, 'Mã xác nhận'), inp), err, h('div', { class: 'row' }, h('button', { class: 'btn btn-primary', type: 'submit', style: { flex: 1 } }, 'Tiếp tục'), resend)));
    inp.focus();
  }
  function step3(card, next) {
    clear(card);
    const err = errBox(); const inp = h('input', { class: 'input', maxlength: '8', placeholder: 'ví dụ: cpVN2026', 'aria-label': 'Mã chống lừa đảo' });
    put(card, steps(3), h('h1', {}, 'Mã chống lừa đảo'), h('p', { class: 'muted small' }, 'Mọi email từ cryptopred sẽ chứa mã này. Chúng tôi không bao giờ hỏi mật khẩu hay Secret Binance.'),
      h('form', { class: 'stack', onSubmit: (e) => { e.preventDefault(); const v = inp.value.trim(); if (v.length < 6 || v.length > 8) return setErr(err, 'Mã cần 6–8 ký tự'); localStorage.setItem('cp15.antiphish', v); CP.auth.audit('antiphish_set', { email: CP.auth.current().email }); step4(card, next); } },
        h('label', { class: 'frow' }, h('span', { class: 'flabel' }, 'Mã 6–8 ký tự'), inp), err, h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'Lưu mã')));
    inp.focus();
  }
  function step4(card, next) {
    clear(card);
    const err = errBox(); const inp = otpInput();
    const auth = authenticator('Ứng dụng xác thực giả lập', CP.auth.twoFACode());
    timers.push(setInterval(() => { auth.querySelector('.code').textContent = CP.auth.twoFACode(); }, 5000));
    const done = () => { toast('Bạn đang ở PAPER · ví ảo 10.000 USDT', 'ok', 5000); finish(next); };
    put(card, steps(4), h('h1', {}, 'Bật xác thực hai bước'), h('p', { class: 'muted small' }, 'Bắt buộc trước khi liên kết Binance hoặc bật bot (ACC-03). Có thể làm sau trong Tài khoản › Bảo mật.'), auth,
      h('form', { class: 'stack', onSubmit: (e) => { e.preventDefault(); try { CP.auth.enable2FA(inp.value.trim()); toast('Đã bật xác thực hai bước', 'ok'); done(); } catch (ex) { setErr(err, ex.message); } } },
        h('label', { class: 'frow' }, h('span', { class: 'flabel' }, 'Mã 6 số'), inp), err, h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'Bật 2FA')),
      h('button', { class: 'btn btn-ghost btn-sm', onClick: done }, 'Bỏ qua, làm sau'));
    inp.focus();
  }

  // ── KHUNG ────────────────────────────────────────────────────────
  function render(card, next) {
    clear(card); timers.forEach(clearInterval); timers = [];
    const tabs = h('div', { class: 'tabs', role: 'tablist' }, [['login', 'Đăng nhập'], ['signup', 'Đăng ký']].map(([k, l]) => h('button', { class: 'tab ' + (tab === k ? 'is-active' : ''), role: 'tab', 'aria-selected': String(tab === k), onClick: () => { tab = k; render(card, next); } }, l)));
    put(card, h('div', { class: 'row' }, h('span', { class: 'logo', style: { width: '28px', height: '28px', borderRadius: '6px', background: 'var(--accent)', color: 'var(--on-accent)', display: 'grid', placeItems: 'center', fontWeight: '700', fontFamily: 'var(--font-mono)' } }, 'cp'), h('h1', {}, 'cryptopred')),
      tabs, tab === 'login' ? loginForm(card, next) : signupForm(card, next),
      h('button', { class: 'btn btn-ghost btn-sm', onClick: async () => { await CP.demo.seed(); toast('Đang dùng tài khoản demo (2FA, kênh thông báo, liên kết Binance giả lập đã sẵn)', 'info', 6000); finish(next); } }, 'Dùng thử với tài khoản demo (prototype)'),
      h('p', { class: 'faint tiny' }, 'Không có đăng nhập bằng Binance — tài khoản nền tảng tách biệt; Binance chỉ liên kết bằng API key chỉ-quyền-giao-dịch, sau khi bật xác thực hai bước.'));
    setTimeout(() => card.querySelector('input')?.focus(), 30);
  }

  CP.screens.register('auth', {
    title: 'Đăng nhập', auth: false,
    mount(outlet, { params }) {
      if (CP.auth.current() && !params.force) { CP.router.go(params.next || 'account'); return; }
      tab = params.tab === 'signup' ? 'signup' : 'login';
      const card = h('div', { class: 'auth-card' });
      outlet.append(h('div', { class: 'auth-wrap' }, card));
      render(card, params.next);
    },
    unmount() { timers.forEach(clearInterval); timers = []; },
  });
})();
