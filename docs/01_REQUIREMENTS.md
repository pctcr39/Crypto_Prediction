# 01 · YÊU CẦU HỆ THỐNG (REQ) — cryptopred

> **Trạng thái:** bản nháp 1 · 27/08/2026 · chờ chủ dự án duyệt (Bước 3)
> **Cập nhật cùng ngày (quyết định chủ dự án):** không thu phí người dùng · không tính thuế vào mô hình chi phí · hạ tầng Mac mini M4 + Cloudflare Tunnel — đã phản ánh ở TRADE-01/07, LEGAL-03, NFR-03, §15
> **Căn cứ:** `00_VISION.md` (phạm vi, luật) · `adr/019` (quyết định gốc) · bản kiểm kê 20+ tài liệu thế hệ 1 (`docs/Old/`)
> **Vai trò:** nói **CÁI GÌ** hệ phải làm và **KIỂM BẰNG GÌ**. Không nói làm thế nào (`02_FRD`) hay bằng gì (`03_ARCHITECTURE`).

---

## 0 · Cách đọc

- **ID** `REQ-<NHÓM>-<số>` — ổn định vĩnh viễn; bỏ một REQ thì đánh dấu *đã bỏ*, không tái dùng số.
- **Mức**: **PHẢI** (không có thì không phát hành) · **NÊN** (thiếu phải có ADR giải thích) · **CÓ THỂ** (làm khi rảnh).
- **Kiểm bằng**: test tự động / probe / checklist duyệt tay / ADR. Một REQ không kiểm được là một REQ chưa viết xong.
- **Phase** theo `00_VISION §10`: P1 dữ liệu + dự đoán · P2 nhiều người dùng · P3 liên kết Binance + trade thủ công · P4 bot · P5 ML tầng 2. "Xuyên suốt" = áp từ P1.
- **Luật soạn thảo (ADR-016):** tài liệu này **không chép con số đo được**. Số xuất hiện ở đây là *luật* (ngưỡng quyết định, phí, thuế) — kết quả đo luôn trỏ `docs/generated/spec_numbers.md`.

## 1 · Tác nhân

| Tác nhân | Là ai | Chạm gì |
|---|---|---|
| **Người dùng** | Bất kỳ ai đăng ký; hai mode Paper / Trading | Dự đoán, ví ảo, tài khoản Binance của chính họ |
| **Chủ hệ (admin)** | Chủ dự án | Kill switch toàn hệ, trạng thái GATE, vận hành |
| **Hệ tự động** | Cron thu dữ liệu, bộ dự đoán, bot của từng user | Dữ liệu, sổ khuyến nghị, lệnh (khi được mở) |
| **Binance** | Bên ngoài — nguồn giá công khai + sàn khớp lệnh của user | REST/WS công khai; API có ký với khoá của user |

---

## 2 · REQ-ACC · Tài khoản và định danh (P2)

| ID | Mức | Yêu cầu | Kiểm bằng |
|---|---|---|---|
| ACC-01 | PHẢI | Đăng ký/đăng nhập bằng email + mật khẩu (băm bằng thuật toán chậm chuẩn hiện hành), phiên có hạn, đăng xuất mọi thiết bị | Test auth; checklist bảo mật |
| ACC-02 | PHẢI | **Cách ly dữ liệu theo user**: ví ảo, tuỳ chọn, track record, khoá API, bot — không user nào đọc/sửa được của user khác | Test truy cập chéo phải bị từ chối |
| ACC-03 | PHẢI (P3) | Xác thực 2 bước **bắt buộc** trước khi liên kết Binance hoặc bật bot; NÊN có từ P2 | Test: thao tác nhạy cảm không 2FA bị chặn |
| ACC-04 | PHẢI | Tuỳ chọn người dùng (`user_prefs`: tầng chọn lọc, hiển thị, ngôn ngữ) tách khỏi `Prediction` và lưu theo tài khoản (ADR-018) | Kiểm hợp đồng dữ liệu |
| ACC-05 | PHẢI | Nhật ký kiểm toán (audit log) cho hành động nhạy cảm: liên kết/thu hồi khoá, bật/tắt bot, đổi giới hạn rủi ro, đăng nhập lạ | Test: mỗi hành động sinh đúng 1 bản ghi bất biến |
| ACC-06 | PHẢI | Hai vai trò tối thiểu: `user`, `admin`. Admin có kill switch toàn hệ và xem trạng thái GATE; admin **không** xem được khoá của user | Test phân quyền |
| ACC-07 | PHẢI | Xoá tài khoản: thu hồi khoá ngay, xoá dữ liệu cá nhân; track record đã phát được **ẩn danh hoá**, không xoá (Luật 17 vs quyền xoá — xem LEGAL-04) | Checklist + test |
| ACC-08 | CÓ THỂ | Đăng nhập bằng nhà cung cấp ngoài (Google) | — |

## 3 · REQ-LINK · Liên kết Binance và Key Vault (P3)

| ID | Mức | Yêu cầu | Kiểm bằng |
|---|---|---|---|
| LINK-01 | PHẢI | **Chỉ nhận khoá có quyền đọc + giao dịch giao ngay. Từ chối mọi khoá có quyền rút tiền** — kiểm quyền lúc liên kết và định kỳ; quyền đổi ⇒ vô hiệu khoá + báo user (Luật 13) | Test với khoá giả có quyền rút phải bị từ chối |
| LINK-02 | PHẢI | Khoá mã hoá khi lưu (khoá mã hoá chủ nằm ngoài cơ sở dữ liệu), chỉ giải mã trong tiến trình gửi lệnh, **không bao giờ** xuất hiện trong log, thông báo lỗi, giao diện, phản hồi API (Luật 14) | Grep log/response trong test tích hợp; review mã |
| LINK-03 | PHẢI | Thu hồi một chạm: xoá khoá ngay, dừng bot của user, ghi audit | Test |
| LINK-04 | PHẢI | Hiển thị số dư, vị thế, lịch sử lệnh của tài khoản user (chỉ đọc) — phải chạy ổn **trước** khi mở đặt lệnh | Checklist duyệt P3 |
| LINK-05 | NÊN | Hướng dẫn user khoá IP trên Binance; hiển thị IP máy chủ để user điền | — |
| LINK-06 | PHẢI | Hạn mức gọi Binance tách hai tầng: dữ liệu thị trường là tài nguyên **dùng chung** (không nhân theo user); lệnh/tài khoản tính theo khoá từng user | Test giới hạn |
| LINK-07 | PHẢI | Chỉ giao ngay (spot) trong phạm vi hiện tại; futures/margin ngoài phạm vi cho tới khi có ADR | Kiểu dữ liệu `instrument="spot"` khoá ở tầng kiểu |

## 4 · REQ-PRED · Dự đoán và khuyến nghị (P1, xuyên suốt)

| ID | Mức | Yêu cầu | Kiểm bằng |
|---|---|---|---|
| PRED-01 | PHẢI | Ba đầu ra dự báo cho mọi khung: biến động kỳ vọng, dải q10/q50/q90, xác suất tăng đã hiệu chỉnh — **từ một phân phối duy nhất** (bất biến: `p_up > 0,5 ⟺ q50 > close`) | Test bất biến trên toàn lịch sử |
| PRED-02 | PHẢI | Khuyến nghị vào/thoát **chỉ ở khung 1 ngày** (`TRADE_TF = {"1d"}` cứng trong mã, ADR-002); 1h/4h là đầu ra hiển thị, không bao giờ phát ý định giao dịch, không cờ cấu hình nào bật được | Test cố phát ở 1h/4h phải đỏ |
| PRED-03 | PHẢI | Mọi khuyến nghị kèm **ngưỡng thắng cần để hoà vốn** (`p_required`, tính từ chi phí thật) cạnh `p_up`; khi im lặng phải có `silence_reason` và số "0/N nến qua cổng" | Kiểm hợp đồng + UI |
| PRED-04 | PHẢI | `Prediction` bất biến, khoá idempotent `symbol|open_time|level|model_sha`, ghi vào sổ **trước** khi biết kết cục (Luật 17) | Test ghi trùng không tạo bản mới |
| PRED-05 | PHẢI | Lõi hai tầng: tầng 1 rule-based là **nguồn duy nhất** của khuyến nghị cho tới khi tầng 2 qua cùng bộ kiểm định; ML chỉ được **thu hẹp**, không tạo/đảo hướng (quyền đơn điệu) | Fuzz-test đơn điệu; ADR khi bật tầng 2 |
| PRED-06 | PHẢI | Mọi phương pháp cắm qua **một hợp đồng** (registry): cùng đầu vào, cùng `Prediction`, cùng bộ kiểm định, cùng sổ track record | Test hợp đồng cho từng method |
| PRED-07 | PHẢI | Người dùng chọn **tầng độ chọn lọc** và **cách hiển thị**; **không** chọn tham số rào chắn, nguồn tín hiệu, chân trời (ADR-018). Tầng không phải thang chất lượng — cấm ngôn từ "cao cấp/độ tin cao" | Review UI; test không có API đổi tham số |
| PRED-08 | PHẢI | Nhịp "phương án C": dự đoán **khoá khi nến đóng**; lớp bám sát cập nhật realtime bằng số học trên dự đoán đã khoá, không gọi lại model giữa nến | Test: 1 nến ⇒ đúng 1 bản ghi |
| PRED-09 | PHẢI | Kiểm định: purged walk-forward tự viết, **một trục thời gian toàn cục** mọi cặp, purge = embargo = độ dài nhãn, 5 phép dò rò rỉ + probe tự chứng minh bằng tiêm rò rỉ, holdout cuối không chạm khi tinh chỉnh; RULE 11 | `make test-leakage` xanh + probe đỏ khi tiêm |
| PRED-10 | PHẢI | Hiệu chỉnh xác suất isotonic theo fold; reliability trong ±10% mọi bin; xác suất chưa hiệu chỉnh không bao giờ tới người dùng (RULE 6) | Reliability diagram tự động |
| PRED-11 | PHẢI | Thắng 4 baseline (always-up, seasonal-naive, random, buy&hold) out-of-sample **sau phí** trước khi bất kỳ method nào được hiển thị là "có kỹ năng" (RULE 4) | Bảng baseline trong MLflow |
| PRED-12 | PHẢI | Mỗi lần train/đo ghi MLflow: git hash, seed, hash dữ liệu, config, metric (RULE 10) | Test tag bắt buộc |
| PRED-13 | PHẢI | Hai vũ trụ có chủ ý: **đo** trên ~40 cặp, **khuyến nghị** trên 8–10 cặp; lọc công cụ phi-hướng/phi-crypto; vá survivorship bằng lịch sử niêm yết | ADR + test lọc |
| PRED-14 | NÊN | "Tham vấn phương pháp" trên UI: mỗi phương pháp có giải thích cơ chế, khi nào sai, track record riêng kèm n=, vai trò (theo phán quyết `Old/11`); có DCA/buy-hold đối chứng | Checklist UI |
| PRED-15 | PHẢI | Chỉ số kỹ thuật hiển thị phải mang **chip nguồn gốc**: `BỘ CHÍNH THỨC` / `BỊ BÁC — không vào model` / `CHỜ DỮ LIỆU`; chỉ số bị bác vẫn được hiển thị cho trader quen mắt nhưng không được gợi ý là tín hiệu | Review UI |
| PRED-16 | PHẢI | Mọi ngưỡng quyết định (rào chắn, cổng, chân trời) nằm **trong mã** kèm ADR, không trong config; config chỉ giữ sự thật môi trường | Review mã |

## 5 · REQ-PAPER · Mode tập luyện (P1 ẩn danh → P2 theo tài khoản)

| ID | Mức | Yêu cầu | Kiểm bằng |
|---|---|---|---|
| PAPER-01 | PHẢI | Ví ảo khởi tạo 10.000 USDT, khớp mô phỏng tại giá thật, trừ phí taker 0,10%/chiều **và** trượt giá 0,05% (RULE 5) | Test toán khớp |
| PAPER-02 | PHẢI | Cơ chế giao ngay (không bán khống); lệnh tối thiểu và mọi quy ước (nút %, ô trống = bán hết) **hiển thị trước khi bấm**, không chỉ lộ sau lỗi | Checklist UI |
| PAPER-03 | PHẢI | Track record Paper cá nhân bất biến; "reset ví" = mở kỳ mới, không xoá lịch sử | Test |
| PAPER-04 | PHẢI (P2) | Ví Paper lưu theo tài khoản, đồng bộ mọi thiết bị; bản localStorage hiện tại chỉ là mầm P1 | Test |
| PAPER-05 | PHẢI | Nhãn **PAPER** ở mọi panel, không thể nhầm với tiền thật (Luật 16) | Review UI |
| PAPER-06 | PHẢI (P4) | Bot của user **phải chạy Paper trước** khi được phép chạy Trading; ngưỡng ở `05_TRADING_SPEC` | Test cờ |

## 6 · REQ-TRADE · Đặt lệnh thủ công tiền thật (P3)

| ID | Mức | Yêu cầu | Kiểm bằng |
|---|---|---|---|
| TRADE-01 | PHẢI | Đặt lệnh giao ngay (market/limit) trên tài khoản user qua hệ; **xác nhận 2 bước**; hiển thị phí ước tính + cỡ so với NAV **trước** khi gửi | Checklist UI + test |
| TRADE-02 | PHẢI | Idempotent: mỗi lệnh một `clientOrderId`; gửi lại không tạo lệnh mới; sổ lệnh append-only **ghi trước khi gửi** | Test gửi trùng |
| TRADE-03 | PHẢI | Đối soát trạng thái nội bộ với sàn sau mỗi lệnh và định kỳ ≤ 5 phút; lệch ⇒ cảnh báo + **chặn lệnh mới** cho tới khi khớp | Test tiêm lệch |
| TRADE-04 | PHẢI | **Cổng kỹ thuật đường lệnh** trước khi mở cho người ngoài: chạy trên Binance Demo Mode với số ngày/số lệnh tối thiểu, 0 lệnh trùng, 0 lệnh mồ côi, 0 lệch trạng thái (vế A của GATE 3 áp riêng cho đường lệnh; ngưỡng ở `05`) | Báo cáo chạy thử + ADR mở |
| TRADE-05 | PHẢI | Giới hạn theo user: cỡ lệnh và tổng exposure có **trần hệ thống** (mặc định ≤1%/lệnh, ≤5% tổng — nhóm 1 GATE 4); user chỉ được siết, không nới quá trần | Test vượt trần bị chặn |
| TRADE-06 | PHẢI | Nhãn **TIỀN THẬT** ở mọi panel, màu/nhãn khác hẳn Paper | Review UI |
| TRADE-07 | *đã bỏ* | Không tính thuế vào mô hình chi phí (quyết định chủ dự án 27/08/2026). `config → costs` chỉ gồm phí taker 0,10%/chiều + trượt giá 0,05%; thuế là việc người dùng tự khai. Ghi lại để không ai đưa thuế vào lại mà không có ADR | — |
| TRADE-08 | PHẢI | Khớp lệnh theo quy ước đo: tín hiệu tại close nến t ⇒ vào **open t+1**; không dùng close t (lookahead) | Test |

## 7 · REQ-BOT · Bot tự giao dịch (P4)

| ID | Mức | Yêu cầu | Kiểm bằng |
|---|---|---|---|
| BOT-01 | PHẢI | Bot tiền thật chỉ mở khi **toàn hệ** qua GATE 1–4 (ngưỡng nguyên văn `Old/00 §7`); cờ mở là hằng số trong mã + ADR, không phải config (RULE 9, Luật 15) | Test: cờ tắt ⇒ mọi đường bot tiền thật đỏ |
| BOT-02 | PHẢI | Per-user opt-in; bot chỉ hành động theo khuyến nghị của tầng đã qua kiểm định; user chọn tầng chọn lọc + giới hạn riêng (trong trần hệ thống) | Test |
| BOT-03 | PHẢI | Risk Engine per-user: lỗ 2% NAV/ngày ⇒ tắt, **không tự bật lại**; heartbeat — mất kết nối > 60 giây ⇒ chế độ an toàn; dừng lỗ đặt **cùng lúc** lệnh vào; thoát khi hết chân trời; khởi động lại = TẮT (Luật 16, GATE 4) | Test cố tình vi phạm từng luật |
| BOT-04 | PHẢI | Kill switch hai tầng: user dừng bot mình; admin dừng **mọi** bot cùng lúc; cả hai huỷ lệnh chờ | Test khi có vị thế mở |
| BOT-05 | PHẢI | Nhật ký quyết định: mỗi lệnh bot ghi vì sao vào/ra, tham chiếu `Prediction` gốc — người dùng đọc được | Checklist |
| BOT-06 | PHẢI | Cách ly lỗi giữa bot của các user; giới hạn tài nguyên mỗi bot; một bot hỏng không dừng bot khác | Test tiêm lỗi |
| BOT-07 | PHẢI | Sổ tranche append-only; tranche mồ côi không được tự tạo lại rào từ trí nhớ; unlock có veto | Test |

## 8 · REQ-GATE · Cổng mở tính năng (xuyên suốt)

| ID | Mức | Yêu cầu | Kiểm bằng |
|---|---|---|---|
| GATE-01 | PHẢI | Bốn GATE với ngưỡng số **giữ nguyên** từ `Old/00 §7`; GATE 1 dùng giao thức kép + khử nhiễm (ADR-017), chấm trên holdout không chạm | Báo cáo GATE tự sinh |
| GATE-02 | PHẢI | Trạng thái GATE toàn hệ **công khai** trên UI (đèn NO-GO/GO); tính năng tiền thật ẩn/khoá khi đèn đỏ | Review UI |
| GATE-03 | PHẢI | "Cấm khi trượt": không thêm tham số, nới ngưỡng, đổi giai đoạn, hay báo ô tốt nhất; thứ tự sửa đăng ký trước | ADR mỗi lần trượt |
| GATE-04 | PHẢI | Tiền đề GATE 3: **60 ngày phát khuyến nghị forward công khai** đã chấm xong; GATE 3 hai vế: Demo Mode chứng kỹ thuật, shadow-run mainnet chấm PnL — **không bao giờ chấm PnL trên Testnet/Demo** | Checklist |

## 9 · REQ-TRACK · Sổ thành tích (P1)

| ID | Mức | Yêu cầu | Kiểm bằng |
|---|---|---|---|
| TRACK-01 | PHẢI | Sổ khuyến nghị append-only, ghi trước kết cục, chấm tự động khi có kết cục; công khai | Test bất biến |
| TRACK-02 | PHẢI | Hiển thị: ✓/✗ ngang hàng, accuracy **luôn kèm n=**, profit factor cạnh accuracy, KHÔNG RÕ là câu trả lời bình thường | Review UI |
| TRACK-03 | PHẢI | Track record theo **phương pháp** và theo **user** (Paper và Trading tách) | Test |

## 10 · REQ-DATA · Nền dữ liệu (P1)

| ID | Mức | Yêu cầu | Kiểm bằng |
|---|---|---|---|
| DATA-01 | PHẢI | `raw/` bất biến, chỉ nến đã đóng, timestamp UTC đơn điệu + duy nhất; sàn sửa nến ⇒ log chênh, không ghi đè im lặng | Test |
| DATA-02 | PHẢI | `store` là cửa đọc duy nhất; chỉ `exchange` tạo client sàn; tầng clean đánh dấu lỗ hổng, không điền | Lint/review |
| DATA-03 | PHẢI | Streaming theo **10 S-RULE** (`Old/05_STREAMING`): chỉ subscribe 1h rồi tự gộp, dedupe 3 thành phần, upsert `x:true`, đối soát REST định kỳ, kết nối lại chủ động có chồng lấn, watchdog đo "có dữ liệu" | Test theo từng S-RULE |
| DATA-04 | PHẢI | Cron **hằng ngày** thu funding + open interest — OI chỉ có 30 ngày lịch sử, trễ là mất vĩnh viễn; thất bại phải ồn ào, không nuốt lỗi | Test + cảnh báo |
| DATA-05 | PHẢI | Universe snapshot theo tháng, `listed_at` bắt buộc, lọc công cụ phi-hướng, vá survivorship (kho binance.vision) | Test |
| DATA-06 | PHẢI | Feature: scale-free (`assert_scale_free`), dịch qua đúng một `shift_all()`, chỉ báo tính bằng **một** thư viện (hexital), làm ấm ≥ 5× chu kỳ dài nhất, batch ↔ incremental khớp 1e-9 | `make test-leakage` |
| DATA-07 | PHẢI | Sổ đăng ký đặc trưng (`Old/14`) là nguồn duy nhất: 13 suất chính thức + 5 chờ dữ liệu; danh sách bác vĩnh viễn không quay lại nếu không có phép đo mới | Review |
| DATA-08 | PHẢI | Trước khi đo lại GATE 1a: tải BTC 1d thật (hiện resample từ 1h) + mẻ 40 cặp; mọi số ở `spec_numbers.md` phải sinh lại có cổng phí | Checklist P1 |

## 11 · REQ-UI · Giao diện (mức yêu cầu — thiết kế ở `07_UIUX_SPEC`)

| ID | Mức | Yêu cầu | Kiểm bằng |
|---|---|---|---|
| UI-01 | PHẢI | Tuân design system: màu chỉ từ token; dự đoán tím nét đứt, không bao giờ xanh/đỏ (RULE 7); hướng luôn có mũi tên + chữ, không chỉ màu | Lint CSS + review |
| UI-02 | PHẢI | Độ tươi 4 trạng thái Live/Chậm/Mất kết nối/Cũ **cho từng nguồn** (giá, dự đoán, tài khoản); trạng thái cũ không bao giờ im lặng; "hỏng chỉ được bớt sáng" (RULE 8) | Test trạng thái |
| UI-03 | PHẢI | Tiếng Việt mặc định, tiếng Anh phụ; thuật ngữ theo từ điển chung | Review |
| UI-04 | PHẢI | Hai mode tách bạch: PAPER / TIỀN THẬT phân biệt ở mọi panel; chuyển mode có xác nhận | Review |
| UI-05 | PHẢI | Bốn khu dashboard tối thiểu: **Giao dịch** (chart + khuyến nghị + đặt lệnh), **Chỉ số** (kỹ thuật + phái sinh, có chip nguồn gốc), **Phương pháp** (tham vấn, so sánh, track record), **Tài khoản** (equity, vị thế, bot, liên kết) | Checklist |
| UI-06 | PHẢI | Luồng đăng ký/đăng nhập/2FA và luồng liên kết Binance (kiểm quyền → từ chối khoá rút tiền → xác nhận → thu hồi) | Checklist |
| UI-07 | PHẢI | Một câu hỏi — một panel chủ: chỉ **một** badge hướng chính; các nguồn phụ (nowcast, đồng thuận phương pháp) là dòng phụ có nhãn rõ | Review |
| UI-08 | PHẢI | Mọi con số thống kê kèm n=; mọi khuyến nghị kèm `p_required`; không dark pattern (không đếm ngược giả, không nhấp nháy vô cớ, không giấu lần sai) | Review |
| UI-09 | PHẢI | Mobile: chart là thứ đầu tiên thấy ở mọi breakpoint; vùng chạm ≥ 44px; một bảng breakpoint + chiều cao chart duy nhất | Test responsive |
| UI-10 | NÊN | Phím tắt có bảng tra (`?`); lỗi hiển thị cạnh nút; xác nhận khi lệnh > 50% số dư | Checklist |

## 12 · REQ-NFR · Phi chức năng

| ID | Mức | Yêu cầu | Kiểm bằng |
|---|---|---|---|
| NFR-01 | PHẢI | Dự đoán cho toàn vũ trụ hoàn tất trong vòng vài giây sau khi nến đóng; store đọc < 200 ms | Đo |
| NFR-02 | PHẢI | Ingest có watchdog đo "có dữ liệu mới", không phải "tiến trình còn sống"; mất dữ liệu > ngưỡng ⇒ cảnh báo | Test |
| NFR-03 | PHẢI | Chạy trọn trên **Mac mini M4 tại nhà**, host qua **Cloudflare Tunnel + Access** — không mở port nào ra ngoài (quyết định chủ dự án); Docker hoá từ đầu; UPS + watchdog + sao lưu ngoài máy **trước** khi mở đăng ký cho người ngoài; VPS chỉ khi Mac mini không kham nổi | Checklist |
| NFR-04 | PHẢI | Bí mật hệ thống (khoá mã hoá chủ, mật khẩu DB) ngoài repo; **không log khoá**; threat model đa user viết trước P3 | Review |
| NFR-05 | PHẢI | Sao lưu dữ liệu user + sổ khuyến nghị hằng ngày, phục hồi có kiểm | Diễn tập |
| NFR-06 | PHẢI | Mỗi module chạy độc lập, có test; `validation/` không sửa nếu không kèm test; lint xanh là cổng commit | CI cục bộ |
| NFR-07 | PHẢI | Rà license trước khi thương mại hoá: vectorbt (Commons Clause), freqtrade (GPL) — giả định "dự án cá nhân nên ổn" **không còn đúng** | ADR |
| NFR-08 | NÊN | Tách môi trường staging/prod khi có VPS; migration có phiên bản | — |

## 13 · REQ-LEGAL · Pháp lý và tuân thủ

| ID | Mức | Yêu cầu | Kiểm bằng |
|---|---|---|---|
| LEGAL-01 | PHẢI | **Tư vấn pháp lý trước khi mở Trading mode cho người ngoài** (P3): tư cách nền tảng đặt lệnh hộ, điều kiện tại Việt Nam, trách nhiệm khi bot gây lỗ | Chủ dự án xác nhận bằng ADR |
| LEGAL-02 | PHẢI | Điều khoản sử dụng + disclaimer: hệ đưa khuyến nghị nhưng **quyết định và trách nhiệm thuộc người dùng**; không đảm bảo lợi nhuận; hiển thị lúc đăng ký và cạnh mọi khuyến nghị | Review |
| LEGAL-03 | *đã bỏ* | Hệ không ước tính, không khấu trừ thuế — xem TRADE-07 | — |
| LEGAL-04 | PHẢI | Dữ liệu cá nhân: quyền xem/xoá; xoá ⇒ ẩn danh hoá track record (giữ bất biến thống kê, bỏ định danh) | Test |
| LEGAL-05 | NÊN | Vì **không custody**, KYC/AML dự kiến tối thiểu — xác nhận với luật sư trong LEGAL-01 | — |

## 14 · REQ-DOC · Kỷ luật tài liệu

| ID | Mức | Yêu cầu | Kiểm bằng |
|---|---|---|---|
| DOC-01 | PHẢI | Tài liệu trỏ số, không chép số (ADR-016); số không sinh được từ script thì không xuất hiện | Review |
| DOC-02 | PHẢI | Mọi thay đổi ngưỡng/phạm vi qua ADR; ADR bị thay phải đánh dấu | Review |
| DOC-03 | PHẢI | `CLAUDE.md` luôn phản ánh trạng thái thật; dấu ✅ chỉ sau khi commit | Review |
| DOC-04 | PHẢI | Bằng chứng đo phải nằm trong repo (`scripts/`), không ở thư mục nháp | Checklist |

---

## 15 · Ma trận phase (tóm)

| Phase | Nhóm REQ mở | Điều kiện vào phase |
|---|---|---|
| P1 | PRED, PAPER (ẩn danh), TRACK, DATA, UI cơ bản, NFR, DOC | Bộ doc 00–08 duyệt |
| P2 | ACC, PAPER theo tài khoản, UI đầy đủ | P1 chạy ổn; NFR-03 (Mac mini + Cloudflare) chịu tải |
| P3 | LINK, TRADE, ACC-03 2FA | LEGAL-01 xong · TRADE-04 cổng đường lệnh đạt · NFR-05 sao lưu ngoài máy đạt |
| P4 | BOT | GATE 1–4 đạt toàn hệ · PAPER-06 |
| P5 | PRED-05 tầng 2 | Tầng 2 thắng tầng 1 out-of-sample sau phí |

## 16 · Điểm chờ quyết định

| # | Việc | Ai | Chặn gì |
|---|---|---|---|
| 1 | Ngưỡng cổng đường lệnh thủ công (số ngày / số lệnh trên Demo Mode) | đề xuất ở `05`, chủ dự án chốt | P3 |
| 2 | Ngưỡng thanh khoản universe (G4 cũ) | chủ dự án | P1 |
| 3 | Chính sách khi trượt GATE 1 (ngoài "cấm khi trượt") | chủ dự án | P1 → P4 |
| 4 | ADR còn nợ từ thế hệ 1: 005, 007–011, 014, 015 — viết mới hoặc khai tử | phiên viết `04`/`05` | P1 |
| 5 | Tư vấn pháp lý (LEGAL-01) | chủ dự án | P3 |
