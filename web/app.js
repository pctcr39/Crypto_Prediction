/* ══════════════════════════════════════════════════════════════════
   M11 · Dashboard — CHƯA XÂY
   Đặc tả: docs/03_MODULE_SPECS.md §M9–M11 · docs/02_DESIGN_SYSTEM.md

   Ba đường dữ liệu ĐỘC LẬP (MASTER_PLAN §2) — điểm mấu chốt của thiết kế:

     1. GIÁ      — trình duyệt nối THẲNG tới wss://stream.binance.com.
                   Backend không tham gia. Backend chết thì giá vẫn chạy.
     2. DỰ ĐOÁN  — WebSocket riêng của backend, chỉ đẩy KHI NẾN ĐÓNG.
                   Đừng gọi model mỗi giây: trong một nến chưa đóng, đầu vào
                   gần như không đổi — chỉ tạo ra con số rung lắc vô nghĩa.
     3. LỊCH SỬ  — REST /api/ohlcv một lần khi mở trang (500 nến).

   Ba luật giao diện không được quên:
     RULE 7  — dự đoán vẽ TÍM, NÉT ĐỨT, kèm dải mờ. Không bao giờ xanh/đỏ.
     RULE 8  — luôn hiển thị độ tươi: Live / Chậm / Mất kết nối / Dự đoán cũ.
               Chế độ hỏng nguy hiểm nhất không phải báo lỗi — mà là im lặng
               hiển thị số cũ như thể nó vẫn đúng.
     DS-RULE 3 — hướng luôn có mũi tên VÀ chữ, không chỉ mã hoá bằng màu.

   Chart: gọi thẳng TradingView lightweight-charts v5 (Apache-2.0).
   KHÔNG dùng bản bọc Python `lightweight-charts-python` — đứng yên từ 2024,
   còn kẹt ở v4.
   ══════════════════════════════════════════════════════════════════ */

console.info("[cryptopred] M11 chưa xây — xem docs/03_MODULE_SPECS.md §M11");

/* ══════════════════════════════════════════════════════════════════
   PAPER TRADING — Phase 1 của "Swap Mode Paper ⇄ Live"
   Kế hoạch: /Users/pct/.claude/plans/deep-wandering-catmull.md

   Cố ý KHÔNG làm ở đây: không đăng nhập, không tài khoản, không lưu
   khoá API của ai. Ví paper sống trong localStorage của TRÌNH DUYỆT
   NÀY — mỗi trình duyệt là một "người" độc lập, không đồng bộ thiết bị.

   Live vẫn khoá — xem panel #panel-live trong index.html. RULE 9:
   tiền thật chỉ mở sau RiskEngine M13 + đủ 4 GATE. Không có đường nào
   ở file này đọc hay gửi khoá API.
   ══════════════════════════════════════════════════════════════════ */

(function paperTrading() {
  const $ = (id) => document.getElementById(id);

  const SYMBOL = "BTCUSDT"; // hardcode — SymbolPicker (M11) chưa xây
  const BASE = "BTC";
  const FEE_SIDE = 0.001; // taker 0,10%/chiều — khớp docs/design/dashboard-prototype.html
  const PRICE_POLL_MS = 5000;
  const PRICE_STALE_MS = 15000; // không nhận được giá mới > 15s → coi là stale (RULE 8)

  const MODE_KEY = "cryptopred.mode";
  const PAPER_KEY = "cryptopred.paper.v1";
  const MAX_LOG = 40;

  const fmtUsd = (n) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ── Persist: localStorage có thể bị chặn (chế độ riêng tư) — luôn try/catch ──
  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }
  function saveJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* riêng tư/hết dung lượng — bỏ qua, ví chỉ sống hết phiên này */
    }
  }

  const paper = loadJson(PAPER_KEY, { cash: 10000, assets: {}, orderLog: [] });
  let lastPrice = null;
  let lastPriceAt = 0;

  function savePaper() {
    saveJson(PAPER_KEY, paper);
  }

  // ── Mode switcher ────────────────────────────────────────────────
  function setMode(mode) {
    saveJson(MODE_KEY, mode); // string đơn giản cũng JSON.stringify được, đọc lại bằng loadJson
    const isPaper = mode === "paper";
    $("panel-paper").hidden = !isPaper;
    $("panel-live").hidden = isPaper;
    $("tab-paper").classList.toggle("mode-tab--active", isPaper);
    $("tab-live").classList.toggle("mode-tab--active", !isPaper);
    $("tab-paper").setAttribute("aria-selected", String(isPaper));
    $("tab-live").setAttribute("aria-selected", String(!isPaper));
  }
  $("tab-paper").addEventListener("click", () => setMode("paper"));
  $("tab-live").addEventListener("click", () => setMode("live"));
  setMode(loadJson(MODE_KEY, "paper"));

  // ── Giá tham chiếu — REST công khai Binance, KHÔNG cần API key ──
  async function pollPrice() {
    try {
      const res = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbol=${SYMBOL}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const price = parseFloat(data.price);
      if (Number.isFinite(price) && price > 0) {
        lastPrice = price;
        lastPriceAt = Date.now();
      }
    } catch {
      /* mất mạng/CORS — renderPriceStatus() bên dưới sẽ tự báo cũ/mất kết nối */
    }
    renderPriceStatus();
    renderWallet();
  }

  function renderPriceStatus() {
    const dot = $("ref-status");
    const val = $("ref-price-val");
    if (!lastPrice) {
      dot.className = "status status--down";
      val.textContent = "mất kết nối";
      return;
    }
    const age = Date.now() - lastPriceAt;
    dot.className = "status " + (age > PRICE_STALE_MS ? "status--stale" : "status--live");
    val.textContent = fmtUsd(lastPrice) + " USDT" + (age > PRICE_STALE_MS ? " (cũ)" : "");
  }

  // ── Ví PAPER: BUY/SELL cơ chế spot, phí taker mỗi chiều ─────────
  function renderWallet() {
    $("paper-cash").textContent = fmtUsd(paper.cash) + " USDT";
    const h = paper.assets[SYMBOL];
    $("paper-asset").textContent = (h ? h.qty : 0).toFixed(6) + " " + BASE;

    const box = $("pos-box");
    if (h && h.qty > 0 && lastPrice) {
      box.hidden = false;
      const pnl = (lastPrice - h.entry) * h.qty;
      const pnlPct = (lastPrice / h.entry - 1) * 100;
      $("pos-qty").textContent = h.qty.toFixed(6) + " " + BASE;
      $("pos-entry").textContent = fmtUsd(h.entry) + " USDT";
      $("pos-pnl").innerHTML =
        `<b class="${pnl >= 0 ? "pos" : "neg"}">${pnl >= 0 ? "+" : "−"}` +
        `${fmtUsd(Math.abs(pnl))} USDT (${pnl >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%)</b>`;
    } else {
      box.hidden = true;
    }
  }

  function renderLog() {
    const el = $("ord-log");
    if (!paper.orderLog.length) {
      el.innerHTML = '<li class="ord-log__empty">Chưa có lệnh nào.</li>';
      return;
    }
    el.innerHTML = paper.orderLog
      .map((e) => `<li class="${e.kind === "sell" ? "neg" : "pos"}">${e.text}</li>`)
      .join("");
  }

  function logOrder(text, kind) {
    paper.orderLog.unshift({ text, kind, ts: Date.now() });
    if (paper.orderLog.length > MAX_LOG) paper.orderLog.length = MAX_LOG;
    renderLog();
  }

  function placeOrder(side) {
    if (!lastPrice) {
      logOrder("Chưa có giá tham chiếu — thử lại sau.", "info");
      return;
    }
    const price = lastPrice;
    const usdIn = Math.max(0, parseFloat($("ord-amt").value) || 0);

    if (side === "buy") {
      const usd = Math.min(paper.cash, usdIn);
      if (usd < 10) {
        logOrder("Lệnh tối thiểu 10 USDT (hoặc số dư không đủ).", "info");
        return;
      }
      const qty = (usd * (1 - FEE_SIDE)) / price;
      const h = paper.assets[SYMBOL] || { qty: 0, entry: price };
      h.entry = (h.entry * h.qty + price * qty) / (h.qty + qty); // giá vào trung bình
      h.qty += qty;
      paper.assets[SYMBOL] = h;
      paper.cash -= usd;
      logOrder(`Mua ${qty.toFixed(6)} ${BASE} @ ${fmtUsd(price)} · phí 0,10%`, "buy");
    } else {
      const h = paper.assets[SYMBOL];
      if (!h || h.qty <= 0) {
        logOrder(`Không có ${BASE} để bán — PAPER theo cơ chế spot.`, "info");
        return;
      }
      const qty = usdIn > 0 ? Math.min(h.qty, usdIn / price) : h.qty;
      paper.cash += qty * price * (1 - FEE_SIDE);
      const pnl = (price - h.entry) * qty;
      h.qty -= qty;
      if (h.qty < 1e-9) delete paper.assets[SYMBOL];
      logOrder(
        `Bán ${qty.toFixed(6)} ${BASE} @ ${fmtUsd(price)} · PnL ${pnl >= 0 ? "+" : "−"}${fmtUsd(Math.abs(pnl))} USDT`,
        "sell"
      );
    }
    savePaper();
    renderWallet();
  }

  $("btn-buy").addEventListener("click", () => placeOrder("buy"));
  $("btn-sell").addEventListener("click", () => placeOrder("sell"));

  document.querySelectorAll(".pct-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pct = Number(btn.dataset.p) / 100;
      const h = paper.assets[SYMBOL];
      // đang giữ coin → % theo giá trị nắm giữ (để bán); chưa giữ → % theo số dư (để mua)
      const baseVal = h && h.qty > 0 && lastPrice ? h.qty * lastPrice : paper.cash;
      $("ord-amt").value = Math.floor(baseVal * pct);
    });
  });

  renderWallet();
  renderLog();
  pollPrice();
  setInterval(pollPrice, PRICE_POLL_MS);
})();
