# Hợp đồng màn hình — prototype v15

Mỗi màn hình là một file `screens/<name>.js`, tự đăng ký:

```js
(function () {
  const { h, fmt, panel, dirBadge, freshness, chip, table, confirm, toast } = CP.ui;
  CP.screens.register('trade', {
    title: 'Giao dịch',      // tiêu đề tab
    auth: false,             // true ⇒ bắt đăng nhập (router tự chuyển tới #/auth)
    mount(outlet, { params, user }) { /* dựng DOM vào outlet, đăng ký listener */ },
    unmount() { /* huỷ listener, destroy chart, clearInterval */ },
  });
})();
```

Quy tắc bắt buộc (docs/01_REQUIREMENTS §11 + docs/Old/02):
- **Không mã màu trong JS/CSS màn hình.** Chỉ `var(--token)`; canvas đọc `CP.tokens([...])` lúc vẽ.
- **Dự đoán chỉ tím** (`--pred`), nét đứt/nghiêng; **không bao giờ** dùng `--up/--down` cho thứ model sinh ra.
- **Hướng luôn đủ bộ ba** màu + ▲▼● + chữ: dùng `CP.ui.dirBadge(dir, pUp)`.
- **Mọi con số** có class `.num`. Số hero (giá lớn) dùng `.num-hero` (proportional).
- **Mọi thống kê kèm `n=`**; `< 100` mẫu ⇒ ghi "chưa đủ dữ liệu".
- **Mọi khuyến nghị kèm `p_required`** (ngưỡng thắng để hoà vốn) và disclaimer LEGAL-02 (`CP.ui.disclaimer()`).
- **Nhãn mode** `CP.ui.modeTag(CP.mode.get())` trên mọi panel liên quan tới tiền.
- Freshness luôn hiện: `CP.ui.freshness(CP.data.freshness, CP.data.lastTick, 'Giá')`.
- Mọi con số dự đoán trong prototype là **mô phỏng** — hiển thị chip `MÔ PHỎNG · ` + `CP.verify.current().label` (nhãn trạng thái kiểm chứng PRED-12) cạnh badge chủ. Không còn GATE (ADR-020).
- Text từ dữ liệu ngoài đưa vào DOM bằng `textContent`/`h()` (không `innerHTML`).
- Vùng chạm ≥ 44px (`.btn`, `.ibtn`, `.input` đã có `min-height`); focus ring do CSS chung lo.
- Ngôn ngữ nhãn: tiếng Việt; thuật ngữ là tên riêng/ký hiệu giữ nguyên (RSI, MACD, EMA, q10/q50/q90, SL/TP, taker/maker, funding, OI).

## API dùng chung

### `CP.state`
`get(k)` · `set({...})` · `subscribe((changedKeys, state) => {})` — khoá: `symbol, tf, tier, theme, lang, layout, favorites`.

### `CP.market` (phiên thị trường dùng chung)
- `await CP.market.load(symbol, tf)` — tải nến + mở WS (hoặc mô phỏng). Thường gọi trong `mount`.
- `CP.market.klines` `[ {t,o,h,l,c,v} ]` (nến cuối đang hình thành) · `closed()` bỏ nến cuối · `last()` giá cuối
- `CP.market.ticker` `{last, pct, high, low, qv, bid, ask}` · `depth` `{bids:[[p,q]],asks}` · `trades` `[{t,p,q,m}]`
- `CP.market.pred` — dự đoán hiện hành (khoá khi nến đóng), `hist` — lịch sử đã chấm, `model` `{model, horizonH, bars}`
- `CP.market.on('klines'|'tick'|'ticker'|'closed'|'depth'|'trade'|'fresh'|'tickers'|'loading', cb)` → trả hàm huỷ
- `await CP.market.loadTickers()` → `[{symbol,last,pct,high,low,qv}]` (cũng emit `'tickers'`)

### `CP.pred`
- `series(klines, tf, symbol, {back})` → `{current, history, model}`
- `stats(history, minLevel)` → `{n, hits, misses, silent, accuracy, profitFactor, totalR, enough}`
- Dự đoán: `{id, symbol, tf, model, horizonH, issuedAt, validUntil, anchor, direction:'UP'|'DOWN'|'FLAT', pUp, pRequired, level, q10, q50, q90, sigma, expectedMovePct, barrier:{sl,tp,slSigma,tpSigma}, silenceReason, simulated:true}`
- Lịch sử thêm: `{outcomeClose, retPct, hit, R}`
- `CP.tiers` `[ {id, name, level, perYear, totalR} ]` — **tầng điều tiết tần suất, không phải chất lượng** (ADR-018): khi user đổi tầng, nói "tần suất/tổng R đổi", không nói "chất lượng".

### `CP.methods` · `CP.consensus(closed, tf)`
- 9 phương pháp `{id, name, role, score, votes, weight, mechanism, fails, locked?, pending?}`
- `consensus` → `{rows (kèm .vote), up, down, flat, total, note}` — hiển thị **đếm phiếu, không phải xác suất**; badge chủ vẫn là `CP.market.pred`.

### `CP.theory` (theory.js) — lý thuyết đầy đủ + xếp hạng độ phù hợp
Dùng cho tab **Phương pháp**, vốn có **hai lớp**:
- **Lớp 1 · Dashboard** — CHỈ xu hướng, viết bằng chữ. Không `p_up`, không `σ̂`, không `R`, không `q10/q50/q90`. Ký hiệu bị cấm ở lớp này.
- **Lớp 2 · `#/consult?m=<slug>`** — sau khi user chọn một phương pháp mới hiện lý thuyết, đặc tả, tham số, bằng chứng đã đo, chế độ hỏng, và sổ ký hiệu.

API:
- `CP.theory.ORDER` → khoá nội bộ của **4 phương pháp đang bỏ phiếu**; năm cái còn lại không hiện ở tab này.

⚠️ **Mã nội bộ (`PP1`…`PP9`) KHÔNG BAO GIỜ được hiện ra giao diện.** Nó chỉ để nối `CP.theory` với `CP.methods`. Trên UI và trên URL dùng `slug`; trong prose cũng viết tên thật ("Giao dịch theo xu hướng"), không viết "PP4".

⚠️ **Tên phương pháp có ĐÚNG MỘT cách trình bày**, dùng y hệt ở thẻ dashboard, ô "hệ thống đề xuất", và đầu trang chi tiết — dựng bằng `methodTitle(m, {lg?, tag?})`: tên tiếng Việt cụ thể (`.mtitle-vi`) + tên gốc tiếng Anh ngay dưới (`.mtitle-en`). Không thêm biến thể mới.

| slug | tên hiển thị | tên gốc |
|---|---|---|
| `giao-dich-theo-xu-huong` | Giao dịch theo xu hướng | Position Trading & Trend Following |
| `giao-dich-theo-song` | Giao dịch theo sóng | Swing Trading |
| `doc-hanh-vi-gia` | Đọc hành vi giá | Price Action & Smart Money Concepts |
| `doc-dong-lenh` | Đọc dòng lệnh | Order Flow |

- `of(key)` — nhận **slug** (dùng ở UI/URL) hoặc khoá nội bộ → `{id, slug, src, name, full, badge, score, weight, oneLine, designedFor, idea[], why, honest, warn?, spec, protoSpec, params[[k,v,note]], paramNote, rejected?[[tên,lý do]], evidence[[khẳng định, đo được, 'ok'|'warn'|'bad', phán quyết]], evidenceNote, failures[[chế độ, biểu hiện, có phải lỗi]], banned?[], bannedWhy?, symbols[], fit(ctx)}`
- `context(closed)` → `{trendZ, trendUp, rangePos, volZ, sweep, sigma}` — đặc điểm thị trường lúc này.
- `rank(closed)` → 4 phương pháp **đã sắp xếp**, mỗi cái kèm `fit {score 0..1, label, reason}`.
- `GLOSSARY` → sổ ký hiệu `{sym, name, plain, why}` — **chỉ được hiện ở lớp 2**.
- `horizonText(model)` · `certaintyText(pUp)` → chân trời và mức độ chắc chắn viết bằng **chữ**, không con số.

⚠️ **`fit` chấm theo CƠ CHẾ, không theo thắng thua gần đây.** Câu hỏi là "điều kiện thị trường lúc này có khớp với điều kiện phương pháp được THIẾT KẾ cho không", không phải "phương pháp nào đang thắng". Xếp theo kết quả gần đây là đuổi theo hiệu suất — đúng thứ `ADR-018 §5` dựng rào để chống. Khi hiển thị phải nói rõ điều đó.

⚠️ **Đặc tả chính thức (`spec`) và bản prototype đang chạy (`protoSpec`) phải hiện CẢ HAI.** Giấu chênh lệch giữa hai cái là nói dối về thứ hệ thật sự đang tính.

### `CP.indicators`
- `compute(closed)` → `[{id, name, group, chip, fmt:'x'|'%'|'z'|'n'|'d'|'-', value, note}]`
- chip ∈ `OFFICIAL` ("BỘ CHÍNH THỨC") · `REJECTED` ("BỊ BÁC — không vào model") · `PENDING` ("CHỜ DỮ LIỆU"). Chỉ số bị bác vẫn hiển thị nhưng **không gợi ý là tín hiệu**.

### `CP.auth`
`current()` · `signUp(email, pw, acceptTerms)` · `login(email, pw)` · `logout()` · `twoFACode()` (mã 6 số của "ứng dụng xác thực giả lập") · `enable2FA(code)` · `verify2FA(code)` · `twoFAVerified()` · `setPrefs({tier, lang, theme})` · `auditLog()` · `deleteAccount()`

### `CP.link` (Binance)
`get()` → `{fp:'…abcd', perms, status:'trade'|'readonly', linkedAt, lastCheck, balances}` hoặc `null`
`await connect({apiKey, secret, simulate:'ok'|'withdraw'|'readonly'})` — ném lỗi `code:'WITHDRAW'` khi khoá có quyền rút · `recheck()` · `revoke()` · `serverIp`

### `CP.verify` (ADR-020 · PRED-12 · UI-11 — thay GATE 1–2)
`LABEL` {unverified:'chưa kiểm chứng', collecting:'đang thu bằng chứng', verified:'đã kiểm chứng'} · `current()` → `{status, label, n, why, sentence}` của tầng 1 hiện hành (prototype: luôn "chưa kiểm chứng" vì mô phỏng) · `ofMethod(id, n)` · `derive({n, hasSkill, calibrated, leakageClean, simulated})`

### `CP.safe` (REQ-SAFE — "định nghĩa hoàn thành", không phải cổng)
`items[]` `{id, name, detail, done}` · `ready()` · `missing()` · `summary()` · `legalOk`

### `CP.notify` (REQ-NOTIFY)
`list()` · `hasVerified()` · `add(type, address)` → kênh có `code` giả lập · `verify(id, code)` · `remove(id)` · `events[]`

### `CP.mode`
`get()` → `'PAPER'|'TRADING'` · `canTrade()` → `{ok, reasons[]}` · `set(mode)` (ném lỗi nếu chưa đủ điều kiện)

### `CP.paper`
- `state()` → `{period, cash, positions:{SYM:{qty, avg, realized}}, orders[], fills[], equityLog:[[t, equity]]}`
- `preview({symbol, side:'BUY'|'SELL', type:'MARKET'|'LIMIT', price, quoteQty|baseQty, last})` → `{ok, errors, warnings, px, base, quote, fee, slip, total, pctNav, needsConfirm}` (không có thuế) — **hiển thị trước khi bấm**
- `place(req)` · `cancel(id)` · `cancelAll()` · `equity(prices)` · `reset()` (mở kỳ mới, giữ lịch sử) · `MIN_NOTIONAL`

### `CP.bots`
`list()` · `create({name, symbol, tier, maxPerTradePct≤1, dailyLossPct≤2, maxExposurePct≤5, mode})` · `setStatus(id,'ON'|'OFF')` · `stopAll()` (kill switch) · bot `{status, log:[{at, kind, text, predictionId}], stats}`

### `CP.ui`
`h(tag, attrs, ...children)` · `clear(el)` · `fmt.{price, pct, num, compact, qty, timeUTC, dateUTC, dateTimeUTC, countdown, ago, base}` · `dirBadge(dir, pUp, {size:'lg'})` · `freshness(status, lastAt, label)` · `chip(text, cls)` · `modeTag(mode)` · `panel({id, title, subtitle, actions, body, collapsible, cls})` · `toast(msg, 'info'|'ok'|'warn'|'error')` · `confirm({title, body, okText, danger, requireText})` · `modal({title, body, wide})` · `table(headers, rows, {empty})` · `empty(text, hint)` · `skeleton(h)` · `sparkline(values, {w,h,cls})` · `probMeter(dir, pUp, pReq)` · `formRow(label, control, hint)` · `inlineError(el, msg)` · `kbd(k)` · `disclaimer()`

### `CP.CandleChart(container, {getKlines, getPred, getHist, onHover})`
`draw()` · `setVisible(n)` · `resize()` · `destroy()` · `tableView()` → Node

### `CP.charts.line(container, [[t,v]], {color:'up'|'down'|'pred'|'text-2', hgt, baseline})`

### `CP.router.go(name, params)` · `CP.hotkeys.show()` · `CP.nextClose(tf)` · `CP.costs`

## Lớp CSS chung (components.css)
`.panel .panel-head .panel-title .panel-sub .panel-actions .panel-body .is-collapsed` · `.btn .btn-primary .btn-buy .btn-sell .btn-danger .btn-ghost .btn-sm` · `.ibtn` · `.input .select .frow .flabel .fhint .inline-err` · `.chip .chip-official .chip-rejected .chip-pending .chip-sim .chip-pred` · `.badge .badge-up .badge-down .badge-flat .lg` · `.fresh .fresh-live .fresh-slow .fresh-down .fresh-stale` · `.modetag .modetag-paper .modetag-real` · `.tbl .tbl-wrap .num-col .empty` · `.num .num-hero .up-text .down-text .pred-text .muted` · `.kpi .kpi-label .kpi-value .kpi-delta` · `.grid-2 .grid-3 .stack .row .gap-*` · `.pmeter*` · `.seg .seg-btn .is-active` · `.card` · `.tabs .tab .is-active` · `.empty-state .skeleton` · `.list .list-item`

## Bổ sung
- `CP.ui.injectCSS(id, cssText)` — chèn CSS riêng của màn (chỉ `var(--token)`, không hex).
- **Chi phí = phí taker 0,10%/chiều + trượt giá 0,05%. KHÔNG có thuế** — hệ không ước tính/khấu trừ thuế (quyết định chủ dự án 27/08/2026, `docs/00_VISION.md §4`). Không hiển thị dòng "thuế" ở bất kỳ đâu.
- Kiểm tra màn bằng headless Chrome: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --window-size=1440,900 --virtual-time-budget=6000 --screenshot=/path/out.png "file:///Users/pct/Personal/Crypto_Prediction/docs/design/v15/index.html#/<name>"` (đổi `--window-size=375,812` cho mobile). Lỗi JS: thêm `--enable-logging=stderr --v=0` và đọc stderr.
