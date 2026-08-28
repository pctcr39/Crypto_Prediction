/* ══════════════════════════════════════════════════════════════════
   theory.js — LÝ THUYẾT ĐẦY ĐỦ CỦA TỪNG PHƯƠNG PHÁP + XẾP HẠNG ĐỘ PHÙ HỢP

   Tab "Phương pháp" có hai lớp (quyết định chủ dự án 28/08/2026):
     · Lớp 1 — Dashboard: CHỈ xu hướng, bằng chữ. Không ký hiệu, không con số.
     · Lớp 2 — Chọn một phương pháp: hiện toàn bộ lý thuyết + thông số kỹ thuật.

   Nội dung trong file này KHÔNG được bịa. Mỗi khẳng định trích từ:
     docs/Old/11_RULEBASED_TRADING_METHODS.md  (phán quyết 9 phương pháp)
     docs/Old/12_DEEP_FOUR_METHODS.md          (phép đo trên dữ liệu của chính repo)
     docs/adr/017-doi-target-6-sigma.md        (rào chắn 1,2σ̂ / 6,0σ̂)
     docs/adr/018-phan-tang-theo-do-chon-loc.md

   ⚠️ Chỗ nào đặc tả chính thức KHÁC với thứ prototype đang chạy thì phải
   nói ra cả hai (`spec` và `protoSpec`). Giấu chênh lệch đó là nói dối.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const CP = (window.CP = window.CP || {});

  // ── SỔ KÝ HIỆU — chỉ hiện ở lớp 2, sau khi user chọn phương pháp ──
  const GLOSSARY = {
    sigma: {
      sym: 'σ̂', name: 'Độ rung (sigma mũ)',
      plain: 'Giá thường nhúc nhích bao nhiêu trong một nến. Đo bằng độ lệch chuẩn của log return 24 nến gần nhất.',
      why: 'Mọi thứ trong hệ đo bằng σ̂ chứ không đo bằng %. BTC rung 1%/4h và một altcoin rung 5%/4h thì "đi 2%" có nghĩa hoàn toàn khác nhau. Đo bằng σ̂ làm mọi cặp coin so sánh được (RULE 1).',
    },
    R: {
      sym: 'R', name: 'Đơn vị rủi ro',
      plain: '1R = số tiền bạn mất nếu chạm dừng lỗ. Dừng lỗ đặt ở 1,2σ̂, nên 1R = 1,2σ̂.',
      why: '"Lãi +3R" nghĩa là lãi gấp 3 lần số tiền bạn sẵn sàng mất mỗi lệnh — so sánh được bất kể vốn to nhỏ, coin nào, thị trường êm hay động.',
    },
    p_up: {
      sym: 'p_up', name: 'Xác suất giá tăng (đã hiệu chỉnh)',
      plain: 'p_up = 58% nghĩa là: trong 100 lần hệ nói 58%, mong đợi khoảng 58 lần giá thật sự tăng.',
      why: 'Hai chữ "đã hiệu chỉnh" là RULE 6. Đầu ra thô của model không phải xác suất — nó chỉ là điểm số tự tin quá đà, phải nắn lại bằng isotonic regression thì con số mới có nghĩa đen như trên. Model trung thực về crypto hiếm khi vượt 65%; thấy 85% ⇒ nghi rò rỉ dữ liệu (RULE 11).',
    },
    p_required: {
      sym: 'p_required', name: 'Ngưỡng thắng để hoà vốn',
      plain: 'Bạn cần đúng tối thiểu bao nhiêu phần trăm số lệnh để không lỗ. Ở hệ này rơi vào khoảng 19–25%, KHÔNG phải 50%.',
      why: 'Vì chốt lời đặt ở 6,0σ̂ còn dừng lỗ ở 1,2σ̂ — thắng thì thắng gấp 5 lần thua. Hệ quả: "tỉ lệ đúng cao" không đồng nghĩa với "lãi". Cấu hình đúng nhiều nhất (41,4% thắng) lại lỗ, và tương quan giữa tỉ lệ đúng với lợi nhuận là −0,263 (ADR-018 §6).',
    },
    quantile: {
      sym: 'q10 · q50 · q90', name: 'Dải giá',
      plain: 'q50 là giá "ở giữa" — 50% khả năng cao hơn, 50% thấp hơn. Khoảng từ q10 đến q90 chứa 80% khả năng.',
      why: 'Trả lời trung thực hơn nhiều so với một con số dự đoán đơn lẻ.',
    },
    level: {
      sym: 'level', name: 'Mức dứt khoát',
      plain: 'Khoảng cách của p_up khỏi 50%, quy về 4 bậc: 0,25 · 0,5 · 0,75 · 1,0.',
      why: 'Tầng độ chọn lọc cắt trên trường này. Tầng chặt hơn ⇒ ít lệnh hơn và ít tổng lãi hơn, cùng chất lượng mỗi lệnh (ADR-018).',
    },
    n: {
      sym: 'n=', name: 'Số mẫu',
      plain: 'Số lần đã chấm được kết quả. Không có n thì con số vô nghĩa.',
      why: 'n < 100 ⇒ hệ tự dán nhãn "chưa đủ dữ liệu". Khoảng tin cậy càng rộng khi n càng nhỏ — nếu khoảng đó chứa 50% thì bạn chưa chứng minh được gì cả.',
    },
    zscore: {
      sym: 'z', name: 'Điểm z',
      plain: 'Giá trị hiện tại lệch bao nhiêu lần độ lệch chuẩn so với trung bình gần đây. z = 2 nghĩa là "cao bất thường".',
      why: 'Cách chuẩn hoá quen thuộc để so sánh những thứ khác thang đo — cũng là cách giữ đặc trưng không phụ thuộc giá tuyệt đối (RULE 1).',
    },
    ema: {
      sym: 'EMA', name: 'Trung bình động luỹ thừa',
      plain: 'Giá trung bình có trọng số, nến mới nặng hơn nến cũ. EMA200 = xu hướng dài hạn, EMA20 = xu hướng ngắn hạn.',
      why: 'Không phải chỉ báo huyền bí — chỉ là cách làm mượt chuỗi giá để so hai tốc độ với nhau.',
    },
    donchian: {
      sym: 'Donchian N', name: 'Biên cao/thấp N kỳ',
      plain: 'Đỉnh cao nhất (hoặc đáy thấp nhất) của N nến gần nhất, KHÔNG tính nến hiện tại.',
      why: 'Chỗ "không tính nến hiện tại" chính là RULE 2 — tính cả nến hiện tại là nhìn trước tương lai.',
    },
    cvd: {
      sym: 'CVD', name: 'Chênh lệch khối lượng tích luỹ',
      plain: 'Cộng dồn (khối lượng người mua chủ động − khối lượng người bán chủ động) qua thời gian.',
      why: 'Đo AI đang chủ động, chứ không phải chỉ đo có bao nhiêu giao dịch. Lấy từ cờ isBuyerMaker của Binance — miễn phí, không cần nhà cung cấp bên thứ ba.',
    },
    baserate: {
      sym: 'tỉ lệ nền', name: 'Tỉ lệ nền khớp cửa sổ',
      plain: 'Kết quả bạn sẽ có nếu chọn ngẫu nhiên, trên cùng cửa sổ thời gian và cùng độ sâu.',
      why: 'Đối chứng bắt buộc của mọi khẳng định. So với 50% hoặc so với 0 là vô nghĩa. Chính phép so này đã bác Fair Value Gap: lấp 79,5% nghe hay, nhưng nền là 85,1%.',
    },
  };

  // ── BỐN PHƯƠNG PHÁP ĐANG BỎ PHIẾU ────────────────────────────────
  const M = {

    /* ─────────────────────────── PP4 ─────────────────────────── */
    PP4: {
      id: 'PP4', slug: 'giao-dich-theo-xu-huong', src: '5.1',
      name: 'Giao dịch theo xu hướng', full: 'Position Trading & Trend Following',
      badge: 'Quyết định hướng', score: '5/5', weight: 'chủ',
      oneLine: 'Đi theo hướng giá đang đi: giá vượt lên trên mức trung bình dài hạn và phá đỉnh gần đây thì vào, tụt xuống dưới trung bình ngắn hạn thì ra.',
      designedFor: 'Thị trường đang có xu hướng rõ — giá đi một chiều nhiều nến liền.',
      idea: [
        'Ý tưởng gốc rất cũ và rất đơn giản: cái gì đang tăng thì có xu hướng tăng tiếp, cái gì đang giảm thì có xu hướng giảm tiếp. Không đoán đỉnh, không đoán đáy, không hỏi vì sao — chỉ đi theo.',
        'Phương pháp này chỉ có hai trạng thái hợp lệ: ĐANG MUA hoặc ĐỨNG NGOÀI. Không bao giờ bán khống. Công cụ là giao ngay (spot), vì với thời gian giữ dài thì giao ngay luôn rẻ hơn hợp đồng vĩnh cửu.',
      ],
      why: 'Đây là bằng chứng mạnh nhất trong cả chín phương pháp, và bằng chứng đó nằm NGOÀI crypto — động lượng theo chuỗi thời gian có literature hàng chục năm, qua cổ phiếu, trái phiếu, hàng hoá, tiền tệ. Điều đó quyết định, vì bạn không đủ dữ liệu để tự chứng minh: cần 229 lệnh độc lập, mà 40 cặp tương quan 0,9 chỉ cho khoảng 17 lệnh hiệu dụng mỗi năm — tức 13,8 năm. Bạn đang MƯỢN bằng chứng của người khác, nên chỉ được chạy quy tắc nào có bằng chứng ngoại sinh dày.',
      honest: 'Điều trung thực nhất phải nói: lợi thế so với mua-và-giữ chỉ 0,11–0,36 Sharpe. Giá trị thật của nó KHÔNG phải lợi nhuận vượt trội — là CẮT ĐUÔI: sụt giảm thị trường gấu từ −77…−83% giảm đáng kể. Bán nó cho chính mình như "máy in tiền" là bước đầu tiên của việc bỏ nó đúng lúc sụt giảm.',
      spec: `# Tính tại giá ĐÓNG nến t · Khớp tại giá MỞ nến t+1
# (khớp tại close t là nhìn trước tương lai — RULE 2)

ema_nhanh   = EMA(close, 20)
ema_chậm    = EMA(close, 200)
donchian_hi = max(high[t-55 … t-1])      # KHÔNG gồm nến t

VÀO (chỉ mua):  close[t] > ema_chậm[t]  VÀ  close[t] > donchian_hi[t]
RA:             close[t] < ema_nhanh[t]  HOẶC  chạm cắt lỗ / chốt lời / hết hạn

Trạng thái hợp lệ: MUA hoặc ĐỨNG NGOÀI. KHÔNG BAO GIỜ BÁN KHỐNG.`,
      protoSpec: `# Prototype v15 chạy bản RÚT GỌN (chỉ để dựng giao diện)
d = (EMA(close,50) − EMA(close,200)) / EMA(close,200)
phiếu = TĂNG nếu d > +0,004 · GIẢM nếu d < −0,004 · TRUNG LẬP nếu ở giữa`,
      params: [
        ['ema_nhanh', '20', 'Trung bình ngắn hạn — dùng cho tín hiệu RA'],
        ['ema_chậm', '200', 'Trung bình dài hạn — lọc hướng, chỉ mua khi giá ở trên'],
        ['donchian', '55', 'Phá đỉnh 55 nến gần nhất (không tính nến hiện tại) thì vào'],
        ['cắt lỗ', '1,2σ̂', 'Đóng cố định — ADR-017 §2, user KHÔNG được chỉnh'],
        ['chốt lời', '6,0σ̂', 'Đóng cố định — payoff 5:1, hoà vốn ~16,7% trước phí'],
        ['hết hạn', '60 ngày', 'Thoát bằng thời gian nếu không chạm rào nào'],
      ],
      paramNote: 'Đúng ba tham số tự do (20 · 200 · 55) — chạm trần Tiêu chí 3. Mỗi tham số thêm là một bậc tự do để tự lừa mình.',
      evidence: [
        ['Sharpe 1,07–1,32 (cửa sổ 2014–2026, nguồn ngoài)', 'Đo lại 2021–2026: ô trung vị lưới 27 ô chỉ 0,47 · mua-và-giữ 0,59', 'bad', 'Không tái lập trên cửa sổ mới'],
        ['Bộ tham số 20/200/55 có ổn định không?', '2021–23: −0,16 · 2024–26: +1,12', 'bad', 'Cực kỳ bất ổn giữa hai đoạn'],
        ['Chọn tham số tốt nhất trên quá khứ có chuyển sang tương lai?', 'Ô tốt nhất đoạn 1 (1,04) → đoạn 2 chỉ 0,72 = đúng bằng mua-và-giữ', 'bad', 'Lợi thế chọn tham số = 0'],
        ['Cắt sụt giảm', 'Mua-và-giữ −76,6% / −53,0% → lưới trung vị −29,9% / −18,9%. 54/54 quan sát đều cắt', 'ok', '✅ VỮNG NHẤT trong toàn bộ phép đo'],
        ['Tỉ lệ chốt lời khung rào chắn', 'Ô trung vị 30,0% · tỉ lệ nền 23,7% · hoà vốn 25,0%', 'warn', 'Dấu đúng, p = 0,24 — chưa đủ công suất'],
      ],
      evidenceNote: 'Đo trên 2.062 nến ngày BTCUSDT (2021-01-01 → 2026-08-24), phí 0,30% khứ hồi, khớp tại giá mở nến kế tiếp — docs/Old/12 §0.1.',
      failures: [
        ['Cưa răng cưa trong biên độ', 'Thua 5–10 lệnh liên tiếp', 'Không phải lỗi — là đặc tính, đã nằm trong Sharpe'],
        ['Sụt giảm sâu', 'Vẫn chịu −60% ở đường trung bình 50', 'Không phải lỗi — nhưng phải đăng ký trước con số này'],
        ['Vào muộn đỉnh sóng', 'Mua xong giá quay đầu ngay', 'Không phải lỗi — là bản chất của phá vỡ biên'],
        ['Im lặng nhiều tuần', '15 lệnh/năm ⇒ im lặng là mặc định', 'Không phải lỗi'],
      ],
      symbols: ['ema', 'donchian', 'sigma', 'R', 'p_required'],
      /** Hợp khi thị trường đang có xu hướng rõ. */
      fit(c) {
        const s = Math.min(1, c.trendZ / 6);
        return { score: s, reason: s >= 0.55
          ? `Giá đang đi một chiều rõ rệt — hai đường trung bình tách xa nhau. Đây đúng là điều kiện phương pháp này được thiết kế cho.`
          : s >= 0.25
            ? `Xu hướng có nhưng chưa mạnh. Phương pháp vẫn nói được, độ tin cậy vừa phải.`
            : `Thị trường đang đi ngang — hai đường trung bình dính nhau. Đây là lúc phương pháp này hay bị cưa qua cưa lại.` };
      },
    },

    /* ─────────────────────────── PP3 ─────────────────────────── */
    PP3: {
      id: 'PP3', slug: 'giao-dich-theo-song', src: '5.3',
      name: 'Giao dịch theo sóng', full: 'Swing Trading',
      badge: 'Chọn điểm vào', score: '4/5 phần lõi', weight: 'phụ',
      oneLine: 'Không quyết định hướng — quyết định VÀO Ở ĐÂU. Đo giá đang nằm chỗ nào trong biên độ gần đây: sát đáy hay sát đỉnh.',
      designedFor: 'Khi giá đang ở gần mép biên độ — sát đỉnh hoặc sát đáy 30 nến gần nhất.',
      idea: [
        'Swing trading là giữ vị thế vài ngày tới một tuần. Trong hệ này nó KHÔNG được giao việc quyết định hướng — việc đó của Giao dịch theo xu hướng. Nó đóng ba việc khác: chọn chân trời, chọn công cụ, và chọn cấu trúc điểm vào.',
        'Lý do nó quan trọng: đây là chân trời duy nhất mà ngưỡng thắng cần và trần năng lực dự báo giao nhau. Khung ngày cần 54,3–56,4% trong khi trần đo được là 52–56% ⇒ biên −4,4 đến +1,7 điểm. Khung tuần giao ngay cần 52,3% ⇒ biên −0,3 đến +3,7 điểm. Mỏng, nhưng khác rỗng — và mọi chân trời ngắn hơn thì rỗng thật.',
      ],
      why: 'Nó cũng quyết định một thứ rất thực tế mà không ai gọi tên: dùng giao ngay hay hợp đồng vĩnh cửu. Ranh giới là 3,33 ngày ở funding nền — giữ 1–3 ngày thì vĩnh cửu rẻ hơn, giữ từ 7 ngày thì giao ngay rẻ hơn. Đây là một hàm trong mã, không phải giả định trong đầu.',
      honest: 'Phần quy tắc hoá được của Swing Trading, sau khi lột xong, HỘI TỤ VỀ Giao dịch theo xu hướng. Cả ba thành phần giữ lại đều là biến thể của theo xu hướng và phá vỡ biên, chỉ ở chân trời ngắn hơn. Phần khiến Swing Trading "khác" chính là phần tuỳ nghi — và phần đó không viết mã được.',
      spec: `# Ba cấu trúc điểm vào ĐƯỢC GIỮ (đều tái lập được giữa hai người)
1 · Phá vỡ biên Donchian N kỳ                       (1 tham số)
2 · Hồi về đường trung bình rồi đóng cửa phía trên   (2 tham số)
3 · Phá vỡ thất bại / quét rồi lấy lại               (3 tham số)

# Quy tắc chọn công cụ — là HÀM trong mã, không phải giả định
giữ ≤ 3 ngày  ⇒ hợp đồng vĩnh cửu rẻ hơn
giữ ≥ 7 ngày  ⇒ giao ngay rẻ hơn      (ranh giới 3,33 ngày ở funding nền)`,
      protoSpec: `# Prototype v15 chạy bản RÚT GỌN
hi = max(high[30 nến]) · lo = min(low[30 nến])
vị_trí = (close − lo) / (hi − lo)
phiếu = TĂNG nếu vị_trí > 0,8 · GIẢM nếu < 0,2 · TRUNG LẬP nếu ở giữa`,
      params: [
        ['Biên nhìn lại', '30 nến', 'Cửa sổ tính đỉnh/đáy gần nhất (prototype)'],
        ['Ngưỡng sát đỉnh', '0,80', 'Giá nằm ở 80% trên của biên độ'],
        ['Ngưỡng sát đáy', '0,20', 'Giá nằm ở 20% dưới của biên độ'],
        ['Chân trời sống', '1 ngày – 1 tuần', 'Khung mà ý định giao dịch được phép tồn tại'],
        ['Ranh giới công cụ', '3,33 ngày', 'Dưới ⇒ vĩnh cửu · trên ⇒ giao ngay'],
      ],
      paramNote: 'Ba thành phần được giữ dùng tổng cộng ≤ 3 tham số mỗi cái — đạt Tiêu chí 3.',
      rejected: [
        ['Kẻ đường xu hướng bằng mắt', 'Hai người vẽ ra hai đường khác nhau — trượt Tiêu chí 2'],
        ['Vẽ vùng cung – cầu bằng mắt', 'Cùng lý do — không tái lập được'],
        ['Fibonacci thoái lui', 'Điểm đảo chiều KHÔNG cụm tại mức Fibonacci (Batchelor & Ramyar). Cộng thêm việc chọn đỉnh/đáy bằng mắt'],
        ['Phân kỳ chỉ báo sức mạnh (RSI divergence)', 'Định nghĩa "đỉnh" không duy nhất ⇒ không tái lập'],
      ],
      evidence: [
        ['Biên khung ngày', 'Cần 54,3–56,4% · trần năng lực 52–56%', 'warn', 'Biên −4,4 đến +1,7 điểm — có thể âm'],
        ['Biên khung tuần, giao ngay', 'Cần 52,3% · trần 52–56%', 'warn', 'Biên −0,3 đến +3,7 điểm — mỏng nhưng khác rỗng'],
        ['Mọi chân trời ngắn hơn ngày', '—', 'bad', 'Rỗng thật — phí ăn hết biên'],
      ],
      evidenceNote: 'Bảng bức tường phí theo tần suất — docs/Old/11 §2.1–2.2.',
      failures: [
        ['Giá lửng lơ giữa biên độ', 'Phương pháp không nói gì', 'Không phải lỗi — nó chỉ có ý kiến ở mép biên'],
        ['Biên độ vỡ ngay sau khi vào', 'Vào sát đỉnh rồi giá phá lên tiếp', 'Là rủi ro thật — đây là lý do nó KHÔNG được quyết định hướng'],
        ['Chân trời ngày', 'Biên có thể âm sau phí', 'Đã đăng ký trước — chỉ khung tuần giao ngay có biên dương chắc'],
      ],
      symbols: ['donchian', 'sigma', 'baserate'],
      /** Hợp khi giá đang sát mép biên độ (có cấu trúc điểm vào rõ). */
      fit(c) {
        const edge = Math.abs(c.rangePos - 0.5) * 2;     // 0 = giữa biên, 1 = sát mép
        const s = Math.min(1, edge * 1.25);
        return { score: s, reason: s >= 0.55
          ? `Giá đang nằm sát mép biên độ 30 nến — đúng chỗ phương pháp này có ý kiến về điểm vào.`
          : s >= 0.25
            ? `Giá đang tiến về một mép biên độ nhưng chưa tới nơi.`
            : `Giá đang lửng lơ giữa biên độ. Phương pháp này không có gì để nói lúc này — và đó là câu trả lời đúng của nó.` };
      },
    },

    /* ─────────────────────────── PP5 ─────────────────────────── */
    PP5: {
      id: 'PP5', slug: 'doc-hanh-vi-gia', src: '5.5',
      name: 'Đọc hành vi giá', full: 'Price Action & Smart Money Concepts',
      badge: 'Đã bị cắt gần hết', score: '4/5 phần đo được · 0/5 hệ thuật ngữ', weight: 'phụ',
      warn: 'Cả ba đặc trưng của phương pháp này đều bị BÁC khi đo trên dữ liệu của chính repo. Chỉ còn giữ một suất, và giữ vì lý do khác.',
      oneLine: 'Đọc hành vi giá thuần, không dùng chỉ báo: giá có vừa xuyên thủng đáy rồi bật lại ngay không.',
      designedFor: 'Khi vừa có một cú xuyên thủng đỉnh/đáy gần nhất rồi giá lấy lại ngay trong vài nến.',
      idea: [
        'Ý tưởng gốc có nền kinh tế học thật: lệnh dừng lỗ của số đông cụm lại ngay ngoài số tròn và ngoài đỉnh/đáy gần nhất. Khi giá chọc qua đó, chuỗi dừng lỗ kích hoạt, giá vọt thêm một đoạn rồi quay lại. Đây là Osler (2000, 2003), đăng trên Journal of Finance, dữ liệu sổ lệnh ngoại hối thật.',
        'Nhưng phần lớn thứ được dạy dưới tên "Smart Money Concepts" không phải cái đó. Toàn bộ hệ thuật ngữ — order block, fair value gap, break of structure, killzone — đã bị bác, và bị bác vì những lý do khác nhau chứ không phải vì "khó đo".',
      ],
      why: 'Vì sao nó vẫn còn trong hệ: nó cấp một đặc trưng đo cấu trúc — khoảng cách từ giá tới đỉnh/đáy gần nhất, chuẩn hoá theo σ̂. Suất đó được giữ vì nó là phép ĐO CẤU TRÚC, không phải vì khẳng định nào của Smart Money Concepts đúng.',
      honest: 'docs/Old/11 cấp cho phương pháp này BA suất đặc trưng vì tin rằng phần lõi có literature vững. Rồi docs/Old/12 đo lại trên Bitcoin khung ngày: cả ba đều không có edge, và quét-rồi-lấy-lại còn có edge ÂM. Đây chính là quy trình đã được đòi hỏi — "nền literature là ngoại hối/cổ phiếu, phải tự tái lập trên dữ liệu Binance trước khi tin" — và phép tái lập đó vừa thất bại. Số suất bị cắt từ 3 xuống 1.',
      spec: `# Đặc tả gốc — ba đặc trưng, đã đo và BỊ BÁC hai trong ba
1 · Quét rồi lấy lại        (3 tham số: N, k, ngưỡng độ sâu)
    đáy_trước = min(low[t-N … t-1])
    quét      = low[t] < đáy_trước × (1 − ngưỡng_độ_sâu)
    lấy_lại   = close[t] > đáy_trước
    cờ[t]     = quét VÀ lấy_lại VÀ (xảy ra trong ≤ k nến)      ❌ BỊ BÁC

2 · Khoảng cách tới đỉnh/đáy gần nhất                          ✅ GIỮ
    kc[t] = (close[t] − đỉnh_swing_gần_nhất) / (σ̂ × close[t])

3 · Khoảng cách tới số tròn (Osler 2000/2003)                  ❌ BỊ BÁC
    kc[t] = |close[t] − số_tròn_gần_nhất| / close[t]`,
      protoSpec: `# Prototype v15 chạy bản RÚT GỌN của đặc trưng số 1
quét_đáy = low[t] < min(low[10 nến trước])  VÀ  close[t] > close[t-1]
quét_đỉnh = high[t] > max(high[10 nến trước])  VÀ  close[t] < close[t-1]
phiếu = TĂNG nếu quét_đáy · GIẢM nếu quét_đỉnh · TRUNG LẬP nếu không có gì`,
      params: [
        ['N', '10 nến', 'Cửa sổ tìm đáy/đỉnh trước (prototype; đặc tả gốc để mở)'],
        ['k', '≤ 3 nến', 'Quét và lấy lại phải xảy ra trong bao nhiêu nến'],
        ['ngưỡng độ sâu', 'tham số thứ 3', 'Phải xuyên sâu bao nhiêu mới tính là "quét"'],
      ],
      paramNote: 'Đúng ba tham số — vừa chạm trần Tiêu chí 3, không còn chỗ để thêm.',
      rejected: [
        ['Order block — "một nến dấu chân tổ chức"', 'Tổ chức đi lệnh chia nhỏ theo thời gian qua hàng giờ. KHÔNG nến nào là dấu chân của họ. Cơ chế sai từ gốc, không phải "khó đo"'],
        ['Fair Value Gap "phải được lấp"', 'Bẫy tỉ lệ nền: mọi mức giá đều được thăm lại nếu chờ đủ lâu. Mệnh đề không có nội dung cho tới khi kèm cửa sổ thời gian và so với tỉ lệ nền'],
        ['Premium/discount array · killzone', 'Đổi tên cho hiệu ứng phiên đã biết rồi bán lại'],
        ['Break of structure · CHoCH · liquidity grab', 'Đưa cùng một bản mô tả cho hai người, họ khoanh ra hai tập nến khác nhau — trượt Tiêu chí 2'],
      ],
      evidence: [
        ['Fair Value Gap được lấp trong 5/10/20/60 ngày', 'Lấp 50,0 / 59,8 / 69,4 / 79,5% — nền cùng độ sâu 45,5 / 60,7 / 70,3 / 85,1%', 'bad', 'BỊ BÁC — chênh −5,6 đến +4,5 điểm'],
        ['Quét rồi lấy lại có edge dương?', 'Lợi suất 5 ngày sau: tín hiệu −0,30% · nền +0,43% · p = 0,92', 'bad', 'BỊ BÁC — edge ÂM'],
        ['Số tròn hút giá (Osler)', 'Dưới mốc +0,06% · trên mốc +0,35% · GIỮA khoảng +1,24% · nền +0,26%', 'bad', 'Không có hiệu ứng — giữa khoảng lại mạnh nhất'],
      ],
      evidenceNote: 'Đo trên 2.062 nến ngày BTCUSDT — docs/Old/12 §0.1, §3.3. Đây là ví dụ giáo khoa cho luật "tỉ lệ nền khớp cửa sổ là đối chứng bắt buộc": 79,5% nghe rất thuyết phục cho tới khi biết nền là 85,1%.',
      failures: [
        ['Tín hiệu quét-lấy-lại xuất hiện', 'Prototype cho phiếu', 'Trên dữ liệu thật phép đo cho edge ÂM — đừng dùng phiếu này để quyết định'],
        ['Không có sự kiện quét nào', 'Phương pháp im lặng', 'Không phải lỗi — im lặng là mặc định của nó'],
      ],
      banned: ['order_block', 'fvg', 'bos', 'choch', 'liquidity_grab', 'killzone', 'elliott', 'wave_count', 'harmonic', 'gartley', 'smart_money'],
      bannedWhy: 'Cấm ĐẶT TÊN chứ không chỉ cấm khái niệm. Khi trong mã có biến tên order_block, người viết sẽ vô thức chỉnh tham số cho khớp câu chuyện mà cái tên gợi ra, chứ không cho khớp dữ liệu. Đây là rò rỉ QUA ĐẦU NGƯỜI VIẾT MÃ, và không test thống kê nào bắt được nó.',
      symbols: ['sigma', 'baserate', 'n'],
      /** Hợp khi vừa có sự kiện quét đỉnh/đáy. */
      fit(c) {
        const s = c.sweep ? 0.8 : 0.12;
        return { score: s, reason: c.sweep
          ? `Vừa có một cú xuyên thủng đỉnh/đáy 10 nến rồi giá lấy lại — đúng sự kiện phương pháp này chờ. Lưu ý: phép đo trên dữ liệu thật cho tín hiệu này edge ÂM.`
          : `Không có cú quét đỉnh/đáy nào gần đây. Phương pháp này không có sự kiện để nói.` };
      },
    },

    /* ─────────────────────────── PP6 ─────────────────────────── */
    PP6: {
      id: 'PP6', slug: 'doc-dong-lenh', src: '5.4',
      name: 'Đọc dòng lệnh', full: 'Order Flow',
      badge: 'Đo áp lực mua/bán', score: '4/5 · 3/5 · 0/5 (ba nhánh)', weight: 'phụ',
      oneLine: 'Đo AI đang chủ động — người chấp nhận giá thị trường để mua, hay để bán. Khác hẳn với việc chỉ đếm khối lượng.',
      designedFor: 'Khi khối lượng đang bất thường so với 96 nến gần nhất — có chuyện đang xảy ra.',
      idea: [
        'Mỗi giao dịch có hai phía: một người đặt lệnh chờ (maker) và một người chấp nhận giá đó (taker). Người taker là người vội — họ trả thêm phí để được khớp ngay. Đo tỉ lệ taker mua so với taker bán là đo áp lực thật, chứ không phải đo có bao nhiêu giao dịch.',
        'Binance công khai cờ isBuyerMaker trong dữ liệu giao dịch gộp. Miễn phí, độ trễ mili-giây, không cần nhà cung cấp bên thứ ba. Cơ chế mất cân bằng dòng lệnh dẫn tới giá có literature vững (Cont 2014).',
      ],
      why: 'Đây là họ đặc trưng tốt nhất trong cả nhóm bán lẻ — chính vì nó rẻ, sạch, và có nền lý thuyết. Repo đã khai báo sẵn taker_buy_ratio trong config/features.yaml.',
      honest: 'Tuyệt đối không nhập khẩu con số 60–75% từ Scalping (lướt sóng siêu ngắn, đã bị loại 0/5) sang đây. Đó là độ chính xác ở chân trời TICK. Gộp về nến ngày là một đối tượng khác, yếu hơn nhiều bậc. Cái gộp lại có thể vẫn có giá trị — nhưng phải TỰ ĐO, không được thừa kế uy tín của con số kia. Đây là dạng nguỵ biện phổ biến nhất trong tài liệu bán khoá học order flow.',
      spec: `tỉ_lệ_mua_chủ_động[t] = taker_buy_volume[t] / volume[t]

chênh_lệch[t]       = taker_buy_volume[t] − (volume[t] − taker_buy_volume[t])
khối_lượng_tích_luỹ = cumsum(chênh_lệch)                         # CVD
độ_dốc_24[t]        = hồi_quy_tuyến_tính(CVD[t-24 … t]) / trung_bình(volume)
                      ↑ chia cho khối lượng để không phụ thuộc thang đo (RULE 1)

Hai suất đặc trưng: taker_buy_ratio_z · cvd_slope_24`,
      protoSpec: `# Prototype v15 chưa có cột taker_buy_volume (còn nợ ở M1/G3)
# nên chạy bản THAY THẾ bằng khối lượng chung:
z = zscore(volume[96 nến])
phiếu = (nếu |z| > 2) → theo màu nến hiện tại · ngược lại TRUNG LẬP`,
      params: [
        ['Cửa sổ z-score', '96 nến', 'So khối lượng hiện tại với 96 nến gần nhất'],
        ['Ngưỡng bất thường', '|z| > 2', 'Trên 2 độ lệch chuẩn mới coi là bất thường'],
        ['Cửa sổ độ dốc CVD', '24 nến', 'Đặc tả gốc — chưa chạy trong prototype'],
      ],
      paramNote: 'Chuẩn hoá bằng z-score và chia cho khối lượng trung bình để đặc trưng không phụ thuộc thang đo (RULE 1).',
      rejected: [
        ['Nhánh Volume Profile', 'Viết mã được và đạt Tiêu chí 1–3, nhưng bằng chứng mỏng và CỘNG TUYẾN NẶNG với khoảng cách tới đỉnh/đáy gần nhất — nó phần lớn mô tả lại cùng một sự thật. Vào danh sách chờ'],
        ['Nhánh Liquidation Heatmap — cái "không" mạnh nhất trong cả chín phương pháp', 'Ba lý do độc lập, mỗi lý do tự nó đủ: ① luồng dữ liệu thanh lý của Binance bị giới hạn MỘT LỆNH MỖI GIÂY từ 2021 — mọi bản đồ nhiệt thương mại đang vẽ từ dữ liệu khuyết, và không cái nào nói ra ② "mức thanh lý" là ƯỚC LƯỢNG suy từ khối lượng mở nhân đòn bẩy GIẢ ĐỊNH — kết quả của một mô hình được bán như dữ liệu quan sát ③ bức tường lệnh có thể là giả, sàn nước ngoài không ai phạt'],
      ],
      evidence: [
        ['Cơ chế mất cân bằng dòng lệnh → giá', 'Literature vững (Cont 2014), ngoài crypto', 'ok', 'Nền lý thuyết chắc'],
        ['Độ chính xác ở chân trời nến ngày', 'CHƯA ĐO — cột taker_buy_volume chưa tải về', 'warn', 'Phép đo 5, còn nợ'],
        ['Hành vi phía sau thanh lý có thật không?', 'Có — thanh lý ép thanh lý, người bán bị CƯỠNG BỨC, giá thường hồi một phần', 'ok', 'Nhưng phải đo từ khối lượng mở + giá, KHÔNG từ bản đồ nhiệt'],
      ],
      evidenceNote: 'docs/Old/11 §5.4 và §4. Giả thuyết đáng đo chưa có literature: đợt tăng do giao ngay dẫn dắt bền hơn đợt tăng do hợp đồng vĩnh cửu dẫn dắt.',
      failures: [
        ['Khối lượng đột biến nhưng giá đi ngang', 'Phương pháp cho phiếu theo màu nến', 'Điểm yếu thật: khối lượng đột biến cho biết "có chuyện", KHÔNG cho biết hướng'],
        ['Khối lượng bình thường', 'Im lặng', 'Không phải lỗi'],
        ['Dùng bản thay thế vì thiếu dữ liệu', 'Prototype đang đo khối lượng chung, không đo taker', 'Là nợ kỹ thuật đã ghi — không phải kết quả của phương pháp thật'],
      ],
      symbols: ['cvd', 'zscore', 'sigma'],
      /** Hợp khi khối lượng đang bất thường. */
      fit(c) {
        const s = Math.min(1, Math.abs(c.volZ) / 2.5);
        return { score: s, reason: s >= 0.55
          ? `Khối lượng đang bất thường mạnh so với 96 nến gần nhất — có chuyện đang xảy ra, đúng lúc phương pháp này có tín hiệu.`
          : s >= 0.25
            ? `Khối lượng nhỉnh hơn bình thường một chút.`
            : `Khối lượng bình thường. Phương pháp này không có gì để nói — nó chỉ lên tiếng khi có bất thường.` };
      },
    },
  };

  // ── BỐI CẢNH THỊ TRƯỜNG — đầu vào của phép chấm độ phù hợp ───────
  /**
   * Tính đặc điểm thị trường từ nến ĐÃ ĐÓNG. Chỉ dùng để chấm "phương pháp
   * nào hợp với lúc này", KHÔNG dùng để dự đoán.
   */
  function context(closed) {
    const n = closed.length;
    if (n < 60) return null;
    const cs = closed.map((k) => k.c);
    const lr = closed.slice(1).map((k, i) => Math.log(k.c / closed[i].c));
    const sd = (a) => { if (a.length < 2) return 0; const m = a.reduce((x, y) => x + y, 0) / a.length; return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1)); };
    const ema = (a, p) => { const k = 2 / (p + 1); let e = a[0]; for (let i = 1; i < a.length; i++) e = a[i] * k + e * (1 - k); return e; };
    const sigma = sd(lr.slice(-24)) || 1e-4;
    const e50 = ema(cs, 50), e200 = ema(cs, Math.min(200, n - 1));

    const win30 = closed.slice(-30);
    const hi = Math.max(...win30.map((k) => k.h)), lo = Math.min(...win30.map((k) => k.l));
    const last = closed[n - 1], prev = closed[n - 2];
    const prev10 = closed.slice(-11, -1);

    const vols = closed.slice(-96).map((k) => k.v);
    const vm = vols.reduce((a, b) => a + b, 0) / vols.length, vs = sd(vols);

    return {
      // độ mạnh xu hướng: hai đường trung bình tách nhau bao nhiêu σ̂
      trendZ: Math.abs(e50 - e200) / (e200 * sigma),
      trendUp: e50 > e200,
      // vị trí trong biên độ 30 nến: 0 = sát đáy, 1 = sát đỉnh
      rangePos: (last.c - lo) / (hi - lo || 1),
      // khối lượng bất thường
      volZ: vs ? (last.v - vm) / vs : 0,
      // vừa quét đỉnh/đáy 10 nến rồi lấy lại?
      sweep: (last.l < Math.min(...prev10.map((k) => k.l)) && last.c > prev.c)
        || (last.h > Math.max(...prev10.map((k) => k.h)) && last.c < prev.c),
      sigma,
    };
  }

  const FIT_LABEL = (s) => (s >= 0.7 ? 'Rất hợp' : s >= 0.45 ? 'Hợp' : s >= 0.2 ? 'Ít hợp' : 'Không hợp lúc này');

  /**
   * Xếp hạng 4 phương pháp theo ĐỘ PHÙ HỢP VỚI THỊ TRƯỜNG LÚC NÀY.
   *
   * ⚠️ Đây KHÔNG phải xếp hạng theo thắng thua gần đây. Chấm theo cơ chế:
   * điều kiện thị trường hiện tại có khớp với điều kiện mà phương pháp được
   * THIẾT KẾ cho hay không. Xếp theo kết quả gần đây là đuổi theo hiệu suất —
   * đúng thứ ADR-018 §5 dựng rào để chống.
   */
  function rank(closed) {
    const ctx = context(closed);
    if (!ctx) return [];
    return CP.theory.ORDER.map((id) => {
      const m = M[id];
      const f = m.fit(ctx);
      return { ...m, fit: { ...f, label: FIT_LABEL(f.score) } };
    }).sort((a, b) => b.fit.score - a.fit.score);
  }

  CP.theory = {
    ORDER: ['PP4', 'PP3', 'PP5', 'PP6'],
    GLOSSARY,
    /** Nhận slug (dùng trên URL) hoặc khoá nội bộ. UI chỉ bao giờ dùng slug. */
    of: (key) => M[key] || CP.theory.ORDER.map((i) => M[i]).find((m) => m.slug === key) || null,
    all: () => CP.theory.ORDER.map((id) => M[id]),
    context, rank, FIT_LABEL,
    /** Câu mô tả chân trời bằng tiếng Việt, không ký hiệu. */
    horizonText(model) {
      if (!model) return '';
      return model.horizonH === 4 ? '4 giờ tới' : model.horizonH === 24 ? '24 giờ tới' : `${model.horizonH} giờ tới`;
    },
    /** Mức độ chắc chắn bằng CHỮ — dashboard không hiện con số (RULE 9: vẫn phải nói ra độ chắc). */
    certaintyText(pUp) {
      const d = Math.abs(pUp - 0.5);
      return d >= 0.13 ? 'khá rõ' : d >= 0.10 ? 'vừa phải' : 'còn yếu';
    },
  };
})();
