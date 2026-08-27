# 01 · YÊU CẦU HỆ THỐNG (REQ) — cryptopred

> **Trạng thái:** nháp 3 · 28/08/2026 · chờ chủ dự án duyệt
> **Căn cứ:** `00_VISION.md` · `adr/019` (phạm vi: đa người dùng, hai mode) · `adr/020` (**bỏ hệ thống GATE**) · `adr/016` (luật soạn thảo) · `adr/017`, `adr/018`, `adr/002`
> **Nháp 2 khác nháp 1:** bỏ toàn bộ nhóm `REQ-GATE`; thêm `REQ-SAFE` (bộ an toàn đường lệnh) và `REQ-NOTIFY` (thông báo ngoài màn hình); áp 72 phát hiện MAJOR đã xác nhận của vòng phản biện đối kháng; bỏ thuế khỏi mô hình chi phí.
> **Nháp 3 khác nháp 2:** bỏ hoàn toàn `SAFE-06` (kỳ chạy thử đường lệnh) và mọi điều kiện kỳ-bot-Paper — **không còn bất kỳ con số nào đóng vai trò điều kiện mở tính năng**; `SAFE-05` thành lớp bảo đảm duy nhất của đường lệnh; áp tiếp các phát hiện MINOR của vòng phản biện.
> **Vai trò:** nói **CÁI GÌ** hệ phải làm và **KIỂM BẰNG GÌ**. Không nói làm thế nào (`02_FRD`) hay bằng gì (`03_ARCHITECTURE`).

---

## 0 · Cách đọc

- **ID** `REQ-<NHÓM>-<số>` — ổn định vĩnh viễn. Bỏ một REQ thì đánh dấu *đã bỏ*,
  **không tái dùng số**. Tách một REQ thì dùng hậu tố chữ (`03a`, `03b`).
- **Mức**: **PHẢI** (không có thì không phát hành) · **NÊN** (thiếu phải có ADR
  giải thích) · **CÓ THỂ** (làm khi rảnh).
- **Kiểm bằng**: test tự động / probe / checklist duyệt tay / ADR. *Một REQ không
  kiểm được là một REQ chưa viết xong.*
- **Phase** (`§16`): P1 dữ liệu + dự đoán · P2 nhiều người dùng + bot Paper ·
  P3 liên kết Binance + trade thủ công · P4 bot tiền thật · P5 ML tầng 2.
  "Xuyên suốt" = áp từ P1.
- **Luật soạn thảo (ADR-016):** tài liệu này **không chép con số đo được**. Số ở
  đây là *luật* (ngưỡng quyết định, phí, giới hạn rủi ro). Kết quả đo luôn trỏ
  `docs/generated/spec_numbers.md`.

### 0.1 · Ranh giới trách nhiệm (ADR-020)

> **Người dùng quyết định có tin dự đoán hay không.**
> **Nền tảng chịu trách nhiệm không để phần mềm của mình làm mất tiền vì lỗi kỹ thuật.**

Không có ngưỡng thống kê nào chặn người dùng bật một tính năng — hệ GATE đã bị bỏ
(ADR-020). Đổi lại, hai nghĩa vụ được siết:

1. **Nhãn trung thực** (`PRED-12`, `UI-11`): mỗi phương pháp mang trạng thái kiểm
   chứng công khai, hiển thị cạnh mọi khuyến nghị của nó, kèm số mẫu. Hệ không
   bao giờ gợi ý nhiều tự tin hơn bằng chứng nó có.
2. **Bộ an toàn kỹ thuật** (`§8 REQ-SAFE`): tính năng chạm tiền thật chỉ được phát
   hành khi đủ bộ an toàn. Đây không phải cổng cấp phép — đây là định nghĩa
   "đã viết xong".

*ID đã bỏ:* `GATE-01`…`GATE-04` (ADR-020) · `SAFE-06` (bỏ kỳ chạy thử, 28/08) · `TRADE-07`, `LEGAL-03` (bỏ thuế).

> **Không còn điều kiện định lượng nào chặn việc mở một tính năng.** Mọi thứ còn
> lại trong `§8 REQ-SAFE` là **cơ chế phải tồn tại và phải có test**, không phải
> ngưỡng phải đạt. Điều kiện duy nhất còn tính chất "chờ bên ngoài" là `LEGAL-01`
> (tư vấn pháp lý) — và đó không phải quyết định kỹ thuật.

## 1 · Tác nhân

| Tác nhân | Là ai | Chạm gì |
|---|---|---|
| **Người dùng** | Bất kỳ ai được mời (P2) / đăng ký (sau P3); hai mode Paper / Trading | Dự đoán, ví ảo, tài khoản Binance của chính họ |
| **Chủ hệ (admin)** | Chủ dự án | Nút dừng khẩn cấp toàn hệ, vận hành hạ tầng, mời tài khoản |
| **Hệ tự động** | Cron thu dữ liệu, bộ dự đoán, bot của từng user | Dữ liệu, sổ khuyến nghị, lệnh (Paper và Trading) |
| **Binance** | Bên ngoài — nguồn giá công khai + sàn khớp lệnh của user | REST/WS công khai; API có ký với khoá của user |

---

## 2 · REQ-ACC · Tài khoản và định danh (P2)

| ID | Mức | Yêu cầu | Kiểm bằng |
|---|---|---|---|
| ACC-01 | PHẢI | Đăng ký/đăng nhập bằng email + mật khẩu (băm bằng thuật toán chậm chuẩn hiện hành), email phải **xác minh**, phiên có hạn, đăng xuất mọi thiết bị | Test auth; checklist bảo mật |
| ACC-02 | PHẢI | **Cách ly dữ liệu theo user**: ví ảo, tuỳ chọn, track record, khoá API, bot — không user nào đọc/sửa được của user khác | Test truy cập chéo phải bị từ chối ở tầng truy vấn, không chỉ tầng giao diện |
| ACC-03 | PHẢI (P3) | Xác thực 2 bước **bắt buộc** trước khi liên kết Binance hoặc bật bot tiền thật; **NÊN** có từ P2 | Test: thao tác nhạy cảm không 2FA bị chặn |
| ACC-04 | PHẢI | Tuỳ chọn người dùng (`user_prefs`: tầng chọn lọc, hiển thị, ngôn ngữ, biểu phí hiển thị, kênh thông báo) tách khỏi `Prediction`/`Tranche` và lưu theo tài khoản (ADR-018) | Kiểm hợp đồng: không trường nào của `user_prefs` xuất hiện trong `Prediction` |
| ACC-05 | PHẢI | Nhật ký kiểm toán bất biến cho hành động nhạy cảm: liên kết/thu hồi khoá, bật/tắt bot, đổi giới hạn rủi ro, đổi tầng chọn lọc, đăng nhập lạ, mọi thao tác admin | Test: mỗi hành động sinh đúng 1 bản ghi; UPDATE/DELETE bị kho từ chối |
| ACC-06 | PHẢI | Hai vai trò: `user`, `admin`. Admin **chỉ** có: nút dừng khẩn cấp toàn hệ (`SAFE-02`), xem sức khoẻ hệ, mời/khoá tài khoản, vận hành hạ tầng. Admin **không có đường ứng dụng nào** để: đọc khoá user ở bất kỳ tầng nào (DB, log, sao lưu, phản hồi API); đặt/đóng lệnh trên tài khoản user (ngoại lệ duy nhất: huỷ lệnh **vào** đang chờ khi dừng khẩn cấp); bật/tắt bot hộ; sửa giới hạn rủi ro hay tuỳ chọn của user; đăng nhập dưới danh tính user (**không có chế độ impersonate**). Tài khoản admin cũng là user thường khi giao dịch của chính mình | Test cho từng đường bị cấm: gọi trực tiếp API với vai admin phải bị từ chối; grep mã tìm đường impersonate |
| ACC-07 | PHẢI | Xoá tài khoản là **trình tự có thứ tự**, không phải một chạm: (1) bot phải TẮT và sổ không còn ý định `PENDING`; (2) hệ liệt kê mọi vị thế mở và lệnh chờ **do hệ tạo** còn trên Binance, user chọn từng mục **HUỶ** (hệ huỷ trước) hay **GIỮ** (nằm lại trên tài khoản user — Luật 13 — hệ ngừng quản lý, ngừng thoát theo hạn); (3) thu hồi khoá (`LINK-03`); (4) xoá dữ liệu định danh. Sổ bất biến **không bị sửa hay xoá** — xem `LEGAL-04` | Test trình tự: xoá khi còn vị thế mở phải chặn ở bước 2 cho tới khi user chọn |
| ACC-08 | CÓ THỂ | Đăng nhập bằng nhà cung cấp ngoài (Google) | — |
| ACC-09 | PHẢI (P2) | **Đăng ký kín khi còn chạy trên Mac mini**: chỉ tài khoản được admin mời mới đăng ký được; **trần số tài khoản** là hằng số trong mã kèm ADR (giá trị chủ dự án chốt — `§17` mục 5), không phải cấu hình; đạt trần ⇒ từ chối đăng ký và ghi audit. Mở đăng ký công khai là một quyết định riêng, cần ADR + `NFR-03` đạt | Test: đăng ký không lời mời bị từ chối; tài khoản thứ N+1 bị từ chối |

## 3 · REQ-LINK · Liên kết Binance và Key Vault (P3)

| ID | Mức | Yêu cầu | Kiểm bằng |
|---|---|---|---|
| LINK-01 | PHẢI | **Danh sách trắng quyền khoá** (Luật 13), không phải danh sách đen. Khoá chỉ được nhận khi tập cờ đang bật **là tập con của** {đọc, giao dịch giao ngay}. Mọi cờ khác — rút tiền, chuyển nội bộ, chuyển vạn năng, margin, futures, options, portfolio margin — **bật một cái là từ chối**. Kiểm lúc liên kết **và** định kỳ (chu kỳ ghi ở `05_TRADING_SPEC`); quyền đổi giữa chừng ⇒ vô hiệu khoá + báo user qua kênh ngoài (`NOTIFY-02`) | Test với khoá giả cho từng cờ cấm: mỗi cờ phải bị từ chối riêng |
| LINK-02 | PHẢI | Khoá mã hoá khi lưu bằng khoá dữ liệu riêng cho từng user; khoá chủ nằm **ngoài** cơ sở dữ liệu; chỉ giải mã trong tiến trình gửi lệnh; **không bao giờ** xuất hiện trong log, thông báo lỗi, giao diện, phản hồi API, hay ảnh chụp lỗi (Luật 14) | Test tích hợp: grep toàn bộ log và phản hồi tìm chuỗi khoá thử; review mã |
| LINK-03 | PHẢI | **Thu hồi một chạm, thực hiện theo đúng thứ tự**: (1) huỷ mọi lệnh **vào** còn chờ do hệ tạo bằng khoá đó — lệnh dừng lỗ đang treo **giữ nguyên** trên sàn; (2) xoá khoá dữ liệu của user ⇒ sau bước này không tiến trình nào giải mã được, kể cả từ bản sao lưu cũ (`LINK-08`); (3) bot về TẮT, không tự bật lại; (4) mọi vị thế còn mở đánh dấu **"mất quyền quản lý"** — hệ ngừng thoát theo hạn, ngừng đối soát, hiển thị cảnh báo cho user | Test thu hồi khi đang có lệnh chờ **và** vị thế mở: đúng thứ tự, stop không bị huỷ |
| LINK-04 | PHẢI | Hiển thị số dư, vị thế, lịch sử lệnh của tài khoản user (chỉ đọc). **Đường chỉ-đọc phải đạt trước khi mở đặt lệnh** (`TRADE-01`), tiêu chí: khớp 100% với REST sàn qua số lần đối chiếu tự động và số ngày liên tục đăng ký ở `05_TRADING_SPEC`, 0 lần lệch chưa giải thích | Báo cáo đối chiếu tự sinh |
| LINK-05 | PHẢI (P3) | **Khoá dùng gửi lệnh phải ràng buộc IP** về đúng IP đi ra của máy chủ. Kiểm cùng lượt với `LINK-01`: cờ giới hạn IP bật **và** một request có ký từ IP máy chủ thành công; sai một trong hai ⇒ khoá chỉ dùng được ở chế độ chỉ-đọc, không mở đặt lệnh/bot. Hệ hiển thị IP đi ra để user điền; IP đi ra phải **cố định** (điều kiện thêm của `NFR-03`); IP đổi ⇒ báo "khoá vô hiệu" ồn ào, không âm thầm | Test cả hai nhánh; probe IP đi ra định kỳ |
| LINK-06 | PHẢI | Hạn mức gọi Binance có **ba** tầng: (a) dữ liệu thị trường — dùng chung, không nhân theo user; (b) đếm lệnh — theo tài khoản từng user; (c) **ngân sách trọng số REST và nguy cơ bị cấm IP — theo IP máy chủ, dùng chung cho MỌI user và MỌI endpoint** kể cả đặt/huỷ lệnh, đọc số dư, đối soát. Vì cả hệ đi ra bằng một IP, tầng (c) là tài nguyên toàn hệ: phải có bộ điều phối chung, hạn ngạch theo user, và cơ chế ưu tiên **huỷ lệnh/đặt stop trước** khi ngân sách cạn | Test: một user spam không được làm cạn ngân sách của user khác; test ưu tiên khi gần hạn |
| LINK-07 | PHẢI | Chỉ giao ngay (spot). Futures/margin ngoài phạm vi cho tới khi có ADR | Khoá ở tầng kiểu dữ liệu (`instrument="spot"`), test cố tạo lệnh khác phải đỏ |
| LINK-08 | PHẢI (P3) | **Bản sao lưu không được là cửa hậu của Key Vault**: kho khoá (khoá dữ liệu từng user + khoá chủ) lưu tách biệt, **ngoài đường sao lưu** `NFR-05`; thu hồi (`LINK-03`) và xoá tài khoản (`ACC-07`) = xoá khoá dữ liệu của user ⇒ bản mã trong mọi bản sao lưu cũ vĩnh viễn không giải mã được; khoá chủ có thủ tục xoay vòng | Test: khôi phục từ bản sao lưu sau thu hồi ⇒ không giải mã được |

## 4 · REQ-PRED · Dự đoán và khuyến nghị (P1, xuyên suốt)

| ID | Mức | Yêu cầu | Kiểm bằng |
|---|---|---|---|
| PRED-01 | PHẢI | Ba đầu ra — biến động kỳ vọng, dải q10/q50/q90, xác suất tăng — là **ba cách đọc của MỘT phân phối**: `q_α = F⁻¹(α)`, `p_up = 1 − F(0)`. `p_up` là đại lượng **suy ra**, không có mô hình hướng riêng và **không được hiệu chỉnh tách rời** khỏi phân phối (xem `PRED-10`). Bất biến `sign(p_up − 0,5) == sign(q50 − close)` phải đúng trên **đúng các trường phát tới người dùng**, sau mọi bước hậu xử lý | Test bất biến chạy trên toàn bộ lịch sử đã phát, không phải trên giá trị nội bộ |
| PRED-02 | PHẢI | Khuyến nghị vào/thoát **chỉ ở khung 1 ngày** (danh sách trắng cứng trong mã, ADR-002); 1h/4h là đầu ra hiển thị, không bao giờ phát ý định giao dịch, **không cấu hình nào bật được** | Test cố phát ở 1h/4h phải đỏ |
| PRED-03a | PHẢI | **Ngưỡng hiển thị `p_required`**: hoà vốn của cược **đối xứng 1:1**, tính trong mã từ hàm chi phí `PRED-17`; in **cạnh `p_up`** ở mọi khung, kể cả 1h/4h bị khoá — để người dùng thấy khoảng cách. `p_required` **không** phải cổng của khuyến nghị và **không** được in cạnh khuyến nghị | Test kiểu dữ liệu: `p_required` và `p_star` là hai kiểu khác nhau, không gán chéo được |
| PRED-03b | PHẢI | **Mỗi khuyến nghị in đủ bốn số**: `p_win` (đã hiệu chỉnh) · `p_star` (hoà vốn của **chính rào chắn đó**) · giá dừng lỗ · giá mục tiêu. Khi một nến không phát khuyến nghị, `Prediction` mang `silence_reason` khác rỗng (im lặng tự giải thích theo từng nến). **Không** hiển thị bộ đếm im lặng luỹ kế kiểu "0/N nến qua cổng" — khung tường thuật đó đã bị ADR-016 xoá bỏ; đại lượng cần canh là quay vòng luỹ kế và phí đã trả | Kiểm hợp đồng: không phát khuyến nghị ⇒ `silence_reason` khác rỗng; grep UI không có bộ đếm luỹ kế |
| PRED-04 | PHẢI | **Hai sổ bất biến, hai khoá idempotent** (lấy từ bản ghi đầu tiên): `Prediction` (mọi khung) khoá `symbol\|timeframe\|open_time\|method_id\|model_sha` — **bắt buộc có `timeframe`** vì nến 1h/4h/1d trùng `open_time` tại 00:00 UTC, **bắt buộc có `method_id`** vì nhiều phương pháp dùng chung sổ; `Tranche` (khuyến nghị, chỉ 1d) khoá thêm `level`, tham chiếu `Prediction` cha. Ghi sổ **trước** khi biết kết cục; đổi trạng thái tạo bản ghi **mới**. Tính append-only **cưỡng chế ở tầng lưu trữ** — kho tự từ chối UPDATE/DELETE, không dựa vào "mã ứng dụng không gọi" | Bộ test dùng chung: ① UPDATE/DELETE trực tiếp lên kho phải lỗi; ② ghi trùng khoá không tạo bản mới; ③ ghi 1h/4h/1d cùng `open_time` tạo đúng 3 bản ghi |
| PRED-05a | PHẢI | **Bộ lọc trong tầng 1**: học máy lọc trên chính danh sách khuyến nghị tầng 1 đã sinh — chỉ được **thu hẹp** (tập con theo cấu tạo), không tạo hướng, không đảo hướng, không phát `Prediction` riêng. Tắt mặc định. Chỉ bật khi có **≥ 300 sự kiện forward đã chấm** (sự kiện backtest không tính) **và** precision tăng ≥ 5 điểm trên holdout chưa chạm; tăng < 3 điểm ⇒ **xoá tầng** (là kết quả hợp lệ) | Fuzz-test đơn điệu: mọi đầu vào, tập ra ⊆ tập vào; test cờ bật/tắt |
| PRED-05b | PHẢI (P5) | **Phương pháp thứ hai (ML) là method độc lập** trong registry: phát `Prediction` riêng, có `method_id` riêng, track record riêng, qua **cùng** bộ kiểm định `PRED-09`/`PRED-10`/`PRED-11`. Nó không thay tầng 1 và không "thu hẹp" tầng 1 — hai vai trò khác nhau, đừng lẫn với `PRED-05a` | Test hợp đồng registry cho method mới |
| PRED-06 | PHẢI | Mọi phương pháp cắm qua **một hợp đồng** (registry): cùng đầu vào, cùng kiểu `Prediction`, cùng bộ kiểm định, cùng sổ track record, cùng hàm chi phí | Bộ test hợp đồng chạy cho từng method đã đăng ký |
| PRED-07 | PHẢI | Người dùng chọn **tầng độ chọn lọc** và **cách hiển thị**; **không** chọn tham số rào chắn, nguồn tín hiệu, chân trời (ADR-018 §1). Bốn tầng là **tập lồng nhau** cắt trên cùng danh sách đã phát; mọi tầng dùng cùng mô hình, cùng bộ hiệu chỉnh, cùng `p_star` — tầng chỉ lọc, không đổi gì phía trước. Tầng **không phải thang chất lượng**: cấm ngôn từ "cao cấp/độ tin cao", cấm sao/huy hiệu/xếp hạng, cấm sắp xếp mặc định theo tầng. Khi đổi tầng, UI **phải** nêu tần suất và tổng R kỳ vọng thay đổi, **không** nêu chất lượng thay đổi | Test lồng nhau: `tranches(tầng chặt) ⊆ tranches(tầng rộng)`; test từ vựng cấm chạy trên chuỗi UI |
| PRED-07b | PHẢI | **Rào chống đổi tầng theo kết quả** (ADR-018 §5): (a) lựa chọn tầng là **dòng thời gian append-only** trong `user_prefs`, mỗi bản ghi có mốc hiệu lực, không có đường sửa/xoá; (b) đổi tầng **có độ trễ** — hiệu lực từ chu kỳ khuyến nghị kế tiếp, không tức thì, không hồi tố; (c) track record cá nhân và mọi hành động bot **chấm theo tầng hiệu lực tại lúc phát**, đổi tầng hôm nay không đổi số quá khứ; (d) UI hiện **số lần đổi tầng trong 90 ngày** cạnh bảng thành tích | Test: đổi tầng rồi tải lại track record ⇒ số cũ không đổi; test độ trễ hiệu lực |
| PRED-08 | PHẢI | Nhịp: dự đoán **khoá khi nến đóng**; lớp bám sát cập nhật realtime bằng số học trên dự đoán đã khoá, không gọi lại mô hình giữa nến | Test: một nến ⇒ đúng một `Prediction` cho mỗi (symbol, tf, method) |
| PRED-09 | PHẢI | Kiểm định: purged walk-forward tự viết, **một trục thời gian toàn cục** cho mọi cặp, purge = embargo = độ dài nhãn, ≥ 8 fold trải ≥ 24 tháng, sàn cỡ lát test (giá trị ở `04_PREDICTION_SPEC`), holdout cuối **chưa từng chạm** khi tinh chỉnh. 5 phép dò rò rỉ + **probe phải tự chứng minh bằng tiêm rò rỉ** (tiêm vào thì probe phải đỏ). RULE 11: accuracy > 60% ở khung 1h ⇒ giả định có rò rỉ | `make test-leakage` xanh **và** bộ tiêm rò rỉ làm probe đỏ |
| PRED-10 | PHẢI | Hiệu chỉnh isotonic **theo từng fold**, lát hiệu chỉnh tách riêng khỏi cả tập fit lẫn tập test, purge + embargo ở **cả hai biên**, lát ≥ 300 mẫu đã chấm (chưa đủ ⇒ tầng đó tắt, không phát xác suất). **Một bộ hiệu chỉnh chung cho mọi tầng** chọn lọc. Áp cho **mọi** xác suất phát tới người dùng. Đạt khi reliability nằm trong ±10% quanh đường chéo ở **mọi bin có ≥ 50 mẫu**, đo trên **toàn bộ** đơn vị out-of-sample mà xác suất được phát — **chưa lọc vùng chết, chưa lọc cổng phí, chưa lọc tầng**; cách chia bin đăng ký trước trong mã. Xác suất thô không bao giờ rời tầng model (RULE 6) | Phép kiểm đạt/trượt tự động (không phải hình vẽ); test bin < 50 mẫu bị loại khỏi phán quyết |
| PRED-11 | PHẢI | Một phương pháp chỉ được gắn `has_skill=true` khi thắng **toàn bộ** bộ baseline đăng ký ở `04_PREDICTION_SPEC` (kế thừa danh sách của `Old/PREDICTION_DESIGN §8.5`), trên **cùng fold, cùng holdout chưa chạm, sau phí** (`PRED-09`, `PRED-17`), theo thước đo đăng ký trước cho từng lớp baseline. Số lượng và danh tính baseline nằm ở `04`, không chép vào đây (ADR-016) | Bảng baseline tự sinh, ghi MLflow; test: thiếu một baseline ⇒ không được gắn nhãn |
| PRED-12 | PHẢI | **Nhãn trạng thái kiểm chứng** (thay vai trò GATE 1–2, ADR-020): mỗi phương pháp mang đúng một trạng thái máy-đọc-được — `chưa kiểm chứng` / `đang thu bằng chứng` / `đã kiểm chứng` — sinh **tự động** từ kết quả `PRED-09`+`PRED-10`+`PRED-11`, không đặt tay. Nhãn kèm **số mẫu** và ngày chấm gần nhất. Nhãn `đã kiểm chứng` chỉ gắn khi đủ cả ba; thiếu một ⇒ hạ nhãn ngay, không có trạng thái trung gian do người quyết | Test: sửa một điều kiện ⇒ nhãn tự hạ; không có API đặt nhãn tay |
| PRED-13 | PHẢI | Hai vũ trụ có chủ ý: **đo** trên vũ trụ rộng, **khuyến nghị** trên vũ trụ hẹp (kích cỡ ở `04`); lọc công cụ phi-hướng/phi-crypto; vá survivorship bằng lịch sử niêm yết | ADR + test lọc |
| PRED-14 | NÊN | "Tham vấn phương pháp": mỗi phương pháp có giải thích cơ chế, điều kiện nó sai, track record riêng kèm số mẫu, và đối chứng mua-và-giữ / DCA | Checklist UI |
| PRED-15 | PHẢI | Chỉ số kỹ thuật hiển thị mang **chip nguồn gốc**: `BỘ CHÍNH THỨC` / `BỊ BÁC — không vào model` / `CHỜ DỮ LIỆU`; chỉ số bị bác vẫn hiển thị cho trader quen mắt nhưng không được trình bày như tín hiệu | Test: mọi chỉ số render đều có chip; review UI |
| PRED-16 | PHẢI | Mọi **ngưỡng quyết định** (rào chắn, cổng phí, chân trời, giới hạn rủi ro) nằm **trong mã** kèm ADR, pin bằng test. Cấu hình chỉ giữ sự thật môi trường (đường dẫn, khoá, địa chỉ). Không biến môi trường, không API, không quyền admin nào đổi được ngưỡng | Test pin hằng số; review mã |
| PRED-17 | PHẢI | **Một hàm chi phí duy nhất** cho toàn hệ: khứ hồi giao ngay = 2 × (phí taker 0,10% + trượt giá 0,05%) = **0,30%**. Không tính thuế (ADR-019, quyết định chủ dự án — thuế là việc user tự khai). Là nguồn **duy nhất** cho `p_required`, `p_star`, baseline sau phí, khớp Paper, ước tính lệnh thật, và `spec_numbers.md`. Biểu phí **chấm điểm** khoá cứng trong mã, pin bằng test, đổi qua ADR. Biểu phí **hiển thị** (phí thật của user, giảm giá phí) lưu ở `user_prefs`, chỉ đổi con số user nhìn, **không bao giờ** đổi số chấm điểm. Mọi bản ghi lệnh và mọi panel ghi rõ biểu phí đã dùng | Test: cùng một lệnh ⇒ chi phí Paper == chi phí Trading == chi phí backtest |
| PRED-18 | PHẢI | **Độ tươi chặn TRƯỚC quyết định, không phải cờ hiển thị**: `predict()` tự suy độ tươi dữ liệu vào từ tuổi nến đã đóng so với **giờ sàn** truyền vào (không đọc đồng hồ máy). Trạng thái ≠ `live` ⇒ **không phát khuyến nghị mới** (`silence_reason` ghi rõ lý do độ tươi), trong mọi trường hợp, không cấu hình nào bật được. Ngưỡng phân loại nằm trong mã (`PRED-16`). Sổ tranche **không đoán** kết cục khi mất dữ liệu — giữ nguyên trạng thái và đánh dấu | Test: đưa nến cũ ⇒ không có khuyến nghị mới; test tuổi âm do lệch giờ ⇒ coi như mất kết nối |
| PRED-19 | PHẢI | **Dải giá phải đúng thực đo**: trên số dự đoán đã chấm tối thiểu theo từng cặp (ngưỡng ở `04`), độ phủ `[q10, q90]` phải đạt 80% ± sai số đăng ký trước, phân phối PIT không lệch theo phép kiểm đăng ký trước, số lần quantile cắt nhau = 0. Kiểm toán cuộn chạy **vô điều kiện**, kể cả khi hệ đang im lặng; ra ngoài dải ⇒ cảnh báo và hạ nhãn `PRED-12` | Kiểm toán cuộn tự động, báo cáo theo cặp |
| PRED-20 | PHẢI | **σ̂ có đúng một đường sinh** (HAR-RV, thang ngày, mục tiêu khớp thời gian nắm giữ); ước lượng phụ chỉ là đầu vào. Phân kỳ ⇒ rơi về đường dự phòng **tất định** + ghi nhật ký; **không có đường thứ ba**. Cổng chọn σ̂ là **tương đối** (thắng đường tham chiếu theo phép kiểm đăng ký trước), không phải ngưỡng tuyệt đối | Test: một đầu vào ⇒ một σ̂; test nhánh dự phòng |
| PRED-21 | PHẢI | **Kiểm soát đa phép thử**: mọi bảng xếp hạng hoặc khẳng định "có kỹ năng" trên nhiều chuỗi cùng lúc phải qua hiệu chỉnh FDR (mức đăng ký ở `04`); kết quả thiếu trường hiệu chỉnh ⇒ **từ chối hiển thị**. Số tham số tự do ≤ cỡ mẫu hiệu dụng / 20. Công suất thống kê in cạnh mọi kết quả. Sharpe cao bất thường ⇒ nghi rò rỉ, không ăn mừng | Test: bảng thiếu trường FDR không render; test trần tham số |
| PRED-22 | PHẢI | **Một quy ước khớp/thoát duy nhất** cho mọi đường: backtest, chấm sổ khuyến nghị, bot Paper, bot Trading. Tín hiệu tại close nến t ⇒ giá tham chiếu vào = **open t+1**, không bao giờ close t (lookahead). Quy ước thoát (dừng lỗ soi trong nến, mục tiêu soi tại đóng nến, cùng nến ⇒ dừng lỗ trước, right-censoring) đăng ký ở `04` và dùng chung | Test: cùng chuỗi giá ⇒ backtest và bot Paper cho cùng điểm vào/ra |

## 5 · REQ-PAPER · Mode tập luyện (P1 ẩn danh → P2 theo tài khoản)

| ID | Mức | Yêu cầu | Kiểm bằng |
|---|---|---|---|
| PAPER-01 | PHẢI | Ví ảo khởi tạo 10.000 USDT; khớp mô phỏng tại **giá khớp gần nhất trên sàn thật tại thời điểm hệ nhận lệnh** (không phải giá lúc bấm nút, không phải giá giữa của sổ lệnh); chi phí tính bằng **cùng hàm chi phí** `PRED-17` — Paper **không được rẻ hơn** Trading ở bất kỳ thành phần nào | Test: cùng đầu vào ⇒ Paper và backtest ra cùng giá vào/ra và cùng chi phí |
| PAPER-02 | PHẢI | Cơ chế giao ngay (không bán khống). Mọi quy ước — lệnh tối thiểu, ý nghĩa nút phần trăm, ô trống nghĩa là bán hết — **hiển thị trước khi bấm**, không chỉ lộ ra sau lỗi | Checklist UI; test: mỗi quy ước có nhãn tương ứng trong DOM |
| PAPER-03 | PHẢI | Track record Paper cá nhân bất biến. **"Reset ví" mở kỳ mới, không xoá lịch sử**; mọi kỳ đều hiển thị được và **số lần reset hiện cạnh thành tích** — chống chọn kỳ đẹp nhất | Test: reset ⇒ kỳ cũ vẫn truy vấn được; UI hiện số kỳ |
| PAPER-04 | PHẢI (P2) | Ví Paper lưu theo tài khoản, đồng bộ mọi thiết bị; bản lưu trên trình duyệt hiện tại chỉ là mầm P1, phải di trú lên server khi có tài khoản | Test di trú |
| PAPER-05 | PHẢI | Nhãn **PAPER** ở mọi panel, không thể nhầm với tiền thật | Review UI; test: mọi panel có nhãn mode |
| PAPER-06 | PHẢI (P2) | **Bot chạy trên ví Paper** mở cho mọi user từ P2, đi qua **đúng đường mã** của bot tiền thật (cùng registry, cùng Risk Engine `BOT-03`, cùng nút dừng `BOT-04`, cùng nhật ký `BOT-05`, cùng sổ `BOT-07`), chỉ khác đích lệnh là ví ảo và **không có đường nào tới Key Vault hay Binance có ký**. Là công cụ để user tự đánh giá — **không** phải điều kiện bắt buộc trước khi bật bot tiền thật (`SAFE-06` đã bỏ) | Test: bot Paper và bot Trading dùng chung module; test không có đường tới vault |

## 6 · REQ-TRADE · Đặt lệnh thủ công tiền thật (P3)

| ID | Mức | Yêu cầu | Kiểm bằng |
|---|---|---|---|
| TRADE-01 | PHẢI | Đặt lệnh giao ngay (market/limit) trên tài khoản user; **xác nhận hai bước, bước hai là xác thực lại** (không phải hai cú click); hiển thị phí ước tính + cỡ so với NAV + nhãn trạng thái kiểm chứng của phương pháp (`PRED-12`) **trước** khi gửi | Checklist UI + test: bỏ qua bước xác thực ⇒ lệnh bị từ chối |
| TRADE-02 | PHẢI | **Idempotency do HỆ bảo đảm, không dựa vào sàn** (sàn chỉ bảo đảm mã lệnh duy nhất trong số lệnh *đang mở*; lệnh đã khớp thì mã tái dùng được). Mỗi **ý định đặt lệnh** nhận một mã do server cấp, ghi sổ **trước** khi gửi. Trạng thái **KHÔNG BIẾT** (gửi xong, hết giờ chờ, không có phản hồi) là trạng thái hợp lệ phải xử lý: không gửi lại mù, mà truy vấn sàn theo mã ý định rồi mới quyết | Test: tiêm timeout giữa chừng ⇒ không sinh lệnh thứ hai; test gửi lại cùng ý định |
| TRADE-03 | PHẢI | **Đối soát theo LỆNH DO HỆ TẠO, không theo tổng số dư** — tài khoản là của user (Luật 13) nên số dư lệch với sổ là **bình thường**, không phải lỗi. Đơn vị đối soát: từng ý định/tranche hệ đã ghi — trạng thái, khối lượng khớp thật (kể cả **khớp một phần**), giá khớp bình quân, và bất biến *một tranche mở ↔ đúng một lệnh dừng lỗ đang treo*. Chạy sau mỗi lệnh và định kỳ ≤ 5 phút. **Sàn là sự thật** về khối lượng khớp: chênh ⇒ ghi bản append mới theo sàn, không sửa bản cũ. Chỉ lệch **loại nghiêm trọng** (lệnh hệ tạo mà sàn không có, hoặc ngược lại; tranche mở thiếu stop) mới chặn lệnh mới; dung sai làm tròn và bụi số dư đăng ký trước ở `05` | Test tiêm từng loại lệch; test khớp một phần không gây chặn |
| TRADE-04 | PHẢI | **Đường lệnh thủ công chỉ phát hành khi đủ `§8 REQ-SAFE`** — đây là định nghĩa hoàn thành, không phải cổng cấp phép (ADR-020) | Checklist `SAFE-01`…`SAFE-07` |
| TRADE-05 | PHẢI | **Định nghĩa dùng chung**: `NAV` = tổng giá trị tài khoản giao ngay của user quy USDT theo giá sàn tại thời điểm kiểm; `exposure hệ` = tổng giá trị các vị thế **do hệ mở và còn mở**, **không** tính tài sản user tự nắm ngoài hệ. **Trần hệ thống** — cỡ lệnh ≤ 1% NAV, tổng exposure hệ ≤ 5% NAV — là **hằng số trong mã** (`risk/limits.py`), pin bằng test, đổi **chỉ qua ADR** (`PRED-16`); không cấu hình, không quyền admin nào đổi được. **Giới hạn riêng của user** ≤ trần: **siết có hiệu lực ngay, nới có độ trễ** (chu kỳ ghi ở `05`) — chống "thua thì siết, thắng thì nới" | Test vượt trần bị chặn; test độ trễ khi nới |
| ~~TRADE-07~~ | *đã bỏ* | Không tính thuế vào mô hình chi phí (ADR-019). Giữ ID để không ai đưa lại mà không có ADR | — |
| TRADE-08 | PHẢI | Quy ước khớp theo `PRED-22` (vào tại open t+1) — áp cho cả lệnh tay, để track record so sánh được | Test |
| TRADE-09 | PHẢI | **Bộ lọc sàn không được nới trần**: cỡ lệnh làm tròn **xuống** theo bước khối lượng và bước giá của từng cặp, đọc từ sàn lúc chạy (không chép số vào mã hay tài liệu — ADR-016), làm mới định kỳ. Sau làm tròn mà nhỏ hơn **giá trị lệnh tối thiểu** của cặp ⇒ **không gửi lệnh, không bao giờ làm tròn lên**; lệnh tay báo lỗi cạnh nút, bot ghi lý do vào nhật ký. Áp cho cả Paper (`PAPER-01`) để Paper không lạc quan giả | Test với NAV nhỏ: lệnh bị từ chối, không có lệnh nào vượt trần 1% |
| TRADE-10 | PHẢI | Nhãn **TIỀN THẬT** ở mọi panel, khác biệt thị giác rõ với PAPER; chuyển mode có xác nhận | Review UI; test nhãn |

## 7 · REQ-BOT · Bot tự giao dịch (Paper từ P2 · Trading P4)

| ID | Mức | Yêu cầu | Kiểm bằng |
|---|---|---|---|
| BOT-01 | PHẢI | **Không có cổng thống kê và không có kỳ chạy thử bắt buộc nào chặn bot** (ADR-020). Bot tiền thật phát hành khi: (a) đủ `§8 REQ-SAFE`; (b) `LEGAL-01` đã xong. Khi bật, UI hiện **nhãn trạng thái kiểm chứng** của phương pháp (`PRED-12`) và, nếu nhãn không phải `đã kiểm chứng`, một xác nhận riêng nói rõ điều đó bằng tiếng người | Test cờ phát hành; test: nhãn chưa kiểm chứng ⇒ có bước xác nhận thêm |
| BOT-02 | PHẢI | Per-user opt-in. Bot chỉ hành động theo khuyến nghị của phương pháp user đã chọn, ở tầng chọn lọc user đã chọn (`PRED-07`), trong giới hạn rủi ro của user (`TRADE-05`) | Test |
| BOT-03 | PHẢI | **Giới hạn lỗ ngày per-user, định nghĩa đủ ba chiều**: *lỗ ngày* = PnL đã thực hiện **+** PnL chưa thực hiện tại giá sàn, của các vị thế **do bot mở**, sau chi phí; *ngày* tính từ **00:00 UTC**; *NAV đầu ngày* theo định nghĩa `TRADE-05` đo tại 00:00 UTC. Chạm −2% NAV đầu ngày ⇒ bot sang **chế độ an toàn**, **không tự bật lại** | Test cố tình vi phạm; test ranh giới ngày |
| BOT-03b | PHẢI | **Chế độ an toàn định nghĩa rõ**: không mở vị thế mới, **giữ nguyên lệnh dừng lỗ đang treo trên sàn**, tiếp tục đối soát, thông báo user (`NOTIFY-02`). Kích hoạt bởi: chạm giới hạn lỗ ngày, mất tick > 60 giây, đối soát lệch nghiêm trọng, khoá bị vô hiệu. Rời chế độ an toàn **chỉ bằng thao tác tay của user** sau khi đối soát sạch | Test từng nguyên nhân kích hoạt; test không tự rời |
| BOT-04 | PHẢI | **Nút dừng khẩn cấp hai tầng** — user dừng bot mình, admin dừng **mọi** bot — là cổng chặn **ngay trước điểm ký lệnh**: cờ đọc nguyên tử trước khi ký; ý định đã qua Risk Engine nhưng tới sau thời điểm dừng bị từ chối và ghi sổ. Dừng = (a) ngừng vòng lặp, chặn lệnh mới; (b) huỷ lệnh **vào** chưa khớp; (c) **giữ nguyên lệnh dừng lỗ đang treo** — nút dừng khẩn cấp **không bao giờ** huỷ stop, vì huỷ stop giữa khủng hoảng là để lại vị thế trần. Tuỳ chọn "thoát hết" là thao tác riêng, xác nhận riêng | Test khi đang có vị thế mở + lệnh chờ; test race: kill giữa lúc đang gửi |
| BOT-05 | PHẢI | Nhật ký quyết định: mỗi hành động của bot ghi vì sao vào/ra, tham chiếu `Prediction` gốc, tầng hiệu lực lúc phát, nhãn kiểm chứng lúc đó — người dùng đọc được | Checklist; test mỗi lệnh có bản ghi |
| BOT-06 | PHẢI | Cách ly lỗi giữa bot các user; giới hạn tài nguyên mỗi bot; một bot hỏng không dừng bot khác và không làm cạn ngân sách gọi sàn của người khác (`LINK-06`) | Test tiêm lỗi vào một bot |
| BOT-07 | PHẢI | **Lệnh dừng lỗ phải là lệnh TRÊN SÀN**, đặt **cùng lúc** với lệnh vào — không phải điều kiện nằm trong bộ nhớ bot (bot tắt thì không ai canh rào). Sổ tranche append-only; tranche mồ côi **không** tự dựng lại rào từ trí nhớ mà chuyển trạng thái chờ người xử lý; khởi động lại phải **đối soát trước khi rời trạng thái tắt** | Test: giết tiến trình bot khi đang có vị thế ⇒ stop vẫn trên sàn; test khởi động lại |
| BOT-08 | PHẢI | **Ý định vào lệnh có hạn, không thực thi bù**: mỗi ý định mang cửa sổ hiệu lực đăng ký trước. Ngoài cửa sổ ⇒ **hết hạn**, ghi lý do vào nhật ký, **không bao giờ khớp bù** — kể cả sau khởi động lại, sau tắc nghẽn hàng đợi, sau khi rời chế độ an toàn | Test: giữ ý định qua cửa sổ ⇒ bị từ chối |
| BOT-09 | PHẢI | Bật lại sau khi bot tự tắt (`BOT-03`) là **thao tác tay của user**, có xác nhận nêu rõ nguyên nhân tắt và tình trạng vị thế hiện tại | Test |

## 8 · REQ-SAFE · Bộ an toàn bắt buộc của đường lệnh (thay GATE 4)

> Đây **không phải cổng cấp phép** mà là **định nghĩa hoàn thành**: một tính năng
> chạm tiền thật thiếu bất kỳ mục nào dưới đây thì chưa viết xong, không phát hành.
> Áp cho cả đường lệnh thủ công (P3) và bot (P4). Kế thừa nội dung `Old/00 §7` GATE 4.

| ID | Mức | Yêu cầu | Kiểm bằng |
|---|---|---|---|
| SAFE-01 | PHẢI | **Nút dừng khẩn cấp** (`BOT-04`) — có, đã kiểm khi đang có vị thế mở | Test cố tình |
| SAFE-02 | PHẢI | **Nút dừng toàn hệ của admin**: một thao tác chặn **mọi** đường gửi lệnh — thủ công lẫn bot, mọi user — và huỷ mọi lệnh **vào** đang chờ; giữ nguyên stop. Trạng thái đã dừng **không tự mở lại**, chỉ admin mở tay và ghi audit | Test: sau khi dừng, mọi lời gọi gửi lệnh bị từ chối |
| SAFE-03 | PHẢI | **Giới hạn cỡ lệnh và tổng exposure** (`TRADE-05`) — hằng số trong mã, pin test | Test vượt trần |
| SAFE-04 | PHẢI | **Giới hạn lỗ ngày, không tự bật lại** (`BOT-03`) | Test |
| SAFE-05 | PHẢI | **Chống gửi trùng lệnh** (`TRADE-02`) + **đối soát** (`TRADE-03`). Vì `SAFE-06` (kỳ chạy thử) đã bị bỏ, đây là **lớp bảo đảm duy nhất còn lại** cho tính đúng đắn của đường lệnh — bộ test tiêm lỗi phải phủ tối thiểu: hết giờ chờ giữa lúc gửi, mất mạng sau khi sàn đã nhận, phản hồi trùng, khớp một phần, sàn trả trạng thái khác sổ | Test tiêm lỗi cho từng kịch bản kể trên, chạy trong CI |
| ~~SAFE-06~~ | *đã bỏ* | Yêu cầu "đường lệnh phải chạy thử đủ ngày/đủ số lệnh trước khi phát hành" **đã bị bỏ hoàn toàn** (quyết định chủ dự án 27/08/2026, ADR-020 phụ lục). Không có kỳ chạy thử bắt buộc nào. Bảo đảm đúng đắn của đường lệnh nay dựa **hoàn toàn** vào `SAFE-05` (test tiêm lỗi mạng cho chống-trùng-lệnh và đối soát) và các test cố-tình-vi-phạm của `SAFE-01`…`SAFE-09`. Giữ ID để không ai đưa lại mà không có ADR | — |
| SAFE-07 | PHẢI | **Khoá API đúng quyền và ràng buộc IP** (`LINK-01`, `LINK-05`) — danh sách trắng, không quyền rút tiền, IP cố định | Test từng cờ cấm |
| SAFE-08 | PHẢI | **Khởi động lại về trạng thái tắt**; rời trạng thái tắt chỉ sau khi đối soát sạch (`BOT-07`) | Test khởi động lại khi có vị thế |
| SAFE-09 | PHẢI | **Lối ra định nghĩa trước lối vào**: mỗi vị thế do hệ mở có lệnh dừng lỗ trên sàn (`BOT-07`), có hạn thời gian giữ, và quy tắc thoát khi tín hiệu hết hiệu lực — cả ba đăng ký ở `05_TRADING_SPEC` theo thiết kế tranche hiện hành (**không** dùng ba mục lỗi thời của `Old/00 §7`) | Test từng lối ra |

## 9 · REQ-NOTIFY · Thông báo ngoài màn hình (P3 · bắt buộc cho bot P4)

| ID | Mức | Yêu cầu | Kiểm bằng |
|---|---|---|---|
| NOTIFY-01 | PHẢI (P3) | Mỗi user có **ít nhất một kênh ngoài dashboard đã xác minh** (tối thiểu là email `ACC-01`; Telegram là kênh bổ sung) **trước khi** liên kết Binance hoặc bật bot. Thu hồi kênh cuối cùng ⇒ chặn bật bot | Test: chưa xác minh ⇒ không liên kết/bật bot được |
| NOTIFY-02 | PHẢI | Sự kiện **bắt buộc** báo qua kênh ngoài, không chỉ hiện trên web: bot vào chế độ an toàn (kèm nguyên nhân) · bot tự tắt do lỗ ngày · admin dừng toàn hệ · khoá bị vô hiệu hoặc đổi quyền · đối soát lệch nghiêm trọng · vị thế mất quyền quản lý | Test từng sự kiện sinh đúng một thông báo |
| NOTIFY-03 | PHẢI | Thông báo **không chứa bí mật** (không khoá, không mã phiên); có chống spam (gộp sự kiện lặp) nhưng **không bao giờ nuốt** sự kiện nhóm `NOTIFY-02` | Test nội dung; test gộp không mất sự kiện |
| NOTIFY-04 | NÊN (P1) | Kênh cảnh báo cho admin về sức khoẻ hệ (thu dữ liệu thất bại, đối soát lỗi, tiến trình chết) — có từ P1 để chính chủ dự án không mất dữ liệu âm thầm | Test |

## 10 · REQ-TRACK · Sổ thành tích (P1)

| ID | Mức | Yêu cầu | Kiểm bằng |
|---|---|---|---|
| TRACK-01 | PHẢI | Sổ khuyến nghị append-only, ghi **trước** kết cục, chấm tự động khi có kết cục; công khai. Cưỡng chế bất biến ở tầng lưu trữ như `PRED-04` | Bộ test bất biến dùng chung |
| TRACK-02 | PHẢI | Hiển thị: ✓/✗ **ngang hàng nhau**, thành tích **luôn kèm số mẫu**, profit factor cạnh accuracy, "KHÔNG RÕ" là câu trả lời bình thường, nhãn kiểm chứng `PRED-12` luôn đi kèm | Review UI; test: không có số nào render thiếu `n` |
| TRACK-03 | PHẢI | Track record tách theo **phương pháp** và theo **user**; Paper và Trading tách riêng, không gộp | Test |
| TRACK-04 | PHẢI | **Sổ có hai lớp tách bạch.** *Lớp khuyến nghị*: hệ ghi mọi khuyến nghị đã phát và kết cục theo quy ước của chính hệ (`PRED-22`, chi phí chấm khoá cứng) — đây là lớp **duy nhất** dùng để phán quyết một phương pháp có kỹ năng (`PRED-11`, `PRED-12`). *Lớp thực thi*: lệnh Paper/Trading của từng user. Thành tích lớp khuyến nghị hiển thị kèm nhãn **"hiệu suất giả định"**; không bao giờ trộn hai lớp trong một con số | Test: đổi lệnh thực thi của user không làm đổi thành tích phương pháp |

## 11 · REQ-DATA · Nền dữ liệu (P1)

| ID | Mức | Yêu cầu | Kiểm bằng |
|---|---|---|---|
| DATA-01 | PHẢI | `raw/` bất biến, chỉ nến đã đóng, timestamp UTC đơn điệu + duy nhất; sàn sửa nến ⇒ **ghi log chênh**, không ghi đè im lặng | Test |
| DATA-02 | PHẢI | `store` là cửa đọc duy nhất; chỉ `exchange` tạo client sàn; tầng clean **đánh dấu** lỗ hổng, không điền | Lint/review; test kiến trúc |
| DATA-03 | PHẢI | Streaming theo **10 luật streaming** (`Old/05_STREAMING`): chỉ subscribe khung nhỏ nhất rồi tự gộp, khử trùng theo đủ ba thành phần khoá, xử lý sự kiện đóng nến theo ngữ nghĩa upsert, đối soát REST định kỳ, kết nối lại chủ động có chồng lấn, watchdog đo "có dữ liệu mới" | Test cho từng luật |
| DATA-04 | PHẢI | Cron **hằng ngày** thu funding + open interest — dữ liệu OI chỉ giữ 30 ngày, **trễ là mất vĩnh viễn**; thất bại phải **ồn ào** (`NOTIFY-04`), không nuốt lỗi, mã thoát đúng | Test: tiêm lỗi ⇒ cảnh báo + mã thoát khác 0 |
| DATA-05 | PHẢI | Universe snapshot theo tháng; ngày niêm yết bắt buộc (thiếu ⇒ ném lỗi, không đoán); lọc công cụ phi-hướng; vá survivorship bằng kho lịch sử của sàn | Test |
| DATA-06 | PHẢI | Feature: scale-free, dịch qua **đúng một** hàm `shift_all()`, chỉ báo tính bằng **một** thư viện, làm ấm ≥ 5 lần chu kỳ dài nhất, bản batch và bản tăng dần khớp tới sai số đăng ký trước; chưa làm ấm ⇒ **cấm dự đoán** | `make test-leakage` |
| DATA-07 | PHẢI | Sổ đăng ký đặc trưng (`Old/14`) là nguồn duy nhất; danh sách bác vĩnh viễn không quay lại nếu không có phép đo mới; thêm đặc trưng vào cụm tương quan cao là **thay**, không phải **thêm** | Review + test |
| DATA-08 | PHẢI | Trước khi công bố bất kỳ số đo nào: tải dữ liệu ngày thật cho mọi cặp (hiện một số cặp đang resample từ khung nhỏ) + mẻ vũ trụ rộng; mọi số ở `spec_numbers.md` sinh lại **có cổng phí** | Checklist P1; test nguồn dữ liệu |

## 12 · REQ-UI · Giao diện (mức yêu cầu — thiết kế ở `07_UIUX_SPEC`)

| ID | Mức | Yêu cầu | Kiểm bằng |
|---|---|---|---|
| UI-01 | PHẢI | Tuân design system: màu chỉ từ token; dự đoán tím nét đứt, không bao giờ xanh/đỏ (RULE 7); hướng luôn có mũi tên + chữ, không chỉ mã hoá bằng màu | Lint CSS + review |
| UI-02 | PHẢI | Độ tươi 4 trạng thái **cho từng nguồn** (giá, dự đoán, tài khoản); trạng thái cũ không bao giờ im lặng; "hỏng chỉ được bớt sáng" (RULE 8). Đây là lớp hiển thị của `PRED-18` — không thay thế nó | Test trạng thái |
| UI-03 | PHẢI | Tiếng Việt mặc định, tiếng Anh phụ; thuật ngữ theo từ điển chung, không trùng lặp từ | Review; test từ điển |
| UI-04 | PHẢI | Hai mode tách bạch: **PAPER** / **TIỀN THẬT** phân biệt ở mọi panel; chuyển mode có xác nhận | Review; test nhãn |
| UI-05 | PHẢI | Bốn khu dashboard tối thiểu: **Giao dịch** (chart + khuyến nghị + đặt lệnh) · **Chỉ số** (kỹ thuật + phái sinh, có chip nguồn gốc) · **Phương pháp** (tham vấn, so sánh, track record) · **Tài khoản** (equity, vị thế, bot, liên kết) | Checklist |
| UI-06 | PHẢI | Luồng đăng ký/đăng nhập/2FA và luồng liên kết Binance (kiểm quyền → từ chối khoá sai quyền → hướng dẫn khoá IP → xác nhận → thu hồi) | Checklist |
| UI-07 | PHẢI | Một câu hỏi — một panel chủ: chỉ **một** badge hướng chính; nguồn phụ là dòng phụ có nhãn rõ | Review |
| UI-08 | PHẢI | Mọi số thống kê kèm số mẫu; mọi khuyến nghị kèm bốn số của `PRED-03b`; **không dark pattern** — không đếm ngược giả, không nhấp nháy vô cớ, không giấu lần sai, không confetti | Review; test từ vựng cấm |
| UI-09 | PHẢI | Mobile: **chart là thứ đầu tiên thấy ở mọi breakpoint**; vùng chạm ≥ 44px; một bảng breakpoint và chiều cao chart duy nhất cho toàn hệ | Test responsive |
| UI-10 | NÊN | Phím tắt có bảng tra; lỗi hiển thị cạnh nút gây lỗi; xác nhận khi lệnh vượt ngưỡng phần trăm số dư | Checklist |
| UI-11 | PHẢI | **Nhãn trạng thái kiểm chứng** (`PRED-12`) hiển thị cạnh mọi khuyến nghị và trong mọi luồng bật tính năng tiền thật, bằng tiếng người, không viết tắt. Hệ **không được** trình bày phương pháp `chưa kiểm chứng` bằng bất kỳ hình thức nào gợi ý độ tin cậy nó chưa có | Review UI; test: nhãn có mặt ở mọi điểm phát |

## 13 · REQ-NFR · Phi chức năng

| ID | Mức | Yêu cầu | Kiểm bằng |
|---|---|---|---|
| NFR-01 | PHẢI | Dự đoán cho toàn vũ trụ hoàn tất trong ngưỡng thời gian đăng ký ở `03_ARCHITECTURE` sau khi nến đóng; `store` đọc dưới ngưỡng đăng ký | Đo tự động, có ngưỡng đỏ |
| NFR-02 | PHẢI | Watchdog đo "có dữ liệu mới", không phải "tiến trình còn sống"; mất dữ liệu quá ngưỡng ⇒ cảnh báo (`NOTIFY-04`) | Test |
| NFR-03 | PHẢI | Chạy trọn trên **Mac mini M4 tại nhà**, host qua **Cloudflare Tunnel + Access** — không mở port ra ngoài. **IP đi ra cố định** (điều kiện của `LINK-05`). Docker hoá từ đầu. **UPS + watchdog + sao lưu ngoài máy đạt trước khi mời người dùng ngoài**. VPS chỉ khi Mac mini không kham nổi | Checklist hạ tầng |
| NFR-04 | PHẢI | Bí mật hệ thống ngoài repo; **không log khoá**; **threat model đa user viết trước khi mời người ngoài (P2)**, cập nhật lại trước P3 khi có khoá Binance | Review + checklist bảo mật |
| NFR-05 | PHẢI | Sao lưu dữ liệu user + sổ khuyến nghị hằng ngày, có diễn tập phục hồi. Kho khoá **không** nằm trong đường sao lưu này (`LINK-08`) | Diễn tập phục hồi định kỳ |
| NFR-06 | PHẢI | Mỗi module chạy độc lập, có test; `validation/` không sửa nếu không kèm test; lint xanh là cổng commit | CI cục bộ |
| NFR-07 | PHẢI | Rà license trước khi mở cho người ngoài: giả định "dự án cá nhân nên ổn" **không còn đúng** với nền tảng nhiều người dùng | ADR |
| NFR-08 | NÊN | Tách môi trường thử nghiệm/chạy thật; migration có phiên bản | — |
| NFR-09 | PHẢI (P2) | **An toàn kênh và phiên**: mọi đường vào chỉ phục vụ qua HTTPS, bất kể hạ tầng; chống dò mật khẩu; hạn chế tần suất đăng nhập; phiên có hạn và thu hồi được; thao tác nhạy cảm cần xác thực lại (`TRADE-01`, `ACC-03`) | Test bảo mật |

## 14 · REQ-LEGAL · Pháp lý và tuân thủ

| ID | Mức | Yêu cầu | Kiểm bằng |
|---|---|---|---|
| LEGAL-01 | PHẢI | **Tư vấn pháp lý trước khi mở Trading cho người ngoài** (P3): tư cách nền tảng đặt lệnh hộ, điều kiện tại Việt Nam, trách nhiệm khi bot gây lỗ. **Sau ADR-020 (bỏ GATE), đây là điều kiện chặn quan trọng nhất của P3** — vì lớp bảo vệ thống kê không còn | Chủ dự án xác nhận bằng ADR |
| LEGAL-02 | PHẢI | Điều khoản sử dụng + disclaimer: hệ đưa khuyến nghị nhưng **quyết định và trách nhiệm thuộc người dùng**; không đảm bảo lợi nhuận; hiển thị lúc đăng ký, khi bật Trading/bot, và cạnh mọi khuyến nghị | Review |
| ~~LEGAL-03~~ | *đã bỏ* | Hệ không ước tính, không khấu trừ thuế (ADR-019) | — |
| LEGAL-04 | PHẢI | **Định danh tách khỏi sổ ngay từ thiết kế**: mọi sổ bất biến chỉ lưu mã giả danh ngẫu nhiên (cấp một lần khi đăng ký, không suy ngược được). Bảng ánh xạ danh tính ↔ mã giả danh, cùng email, mật khẩu, khoá API, `user_prefs` nằm **ngoài** sổ và là thứ duy nhất bị xoá khi user yêu cầu. Nhờ vậy quyền xoá và tính bất biến của sổ (`TRACK-01`, `PRED-04`) **không loại trừ nhau** | Test: xoá tài khoản ⇒ sổ không có UPDATE/DELETE nào, thống kê không đổi |
| LEGAL-05 | NÊN | Vì **không custody**, KYC/AML dự kiến tối thiểu — xác nhận trong `LEGAL-01` | — |
| LEGAL-06 | PHẢI (P3) | **Rà điều khoản của Binance** — tách khỏi pháp luật VN: điều khoản API với nền tảng bên thứ ba gửi lệnh bằng khoá của **nhiều** người dùng, điều kiện dùng thương mại, hạn chế khu vực, hệ quả của việc mọi khoá trỏ về một IP máy chủ (`LINK-05`, `LINK-06`). Vi phạm ⇒ sàn có thể vô hiệu khoá của **mọi** user cùng lúc, mất kiểm soát vị thế hàng loạt. Kết luận ghi ADR kèm ngày rà | ADR |

## 15 · REQ-DOC · Kỷ luật tài liệu

| ID | Mức | Yêu cầu | Kiểm bằng |
|---|---|---|---|
| DOC-01 | PHẢI | Tài liệu **trỏ số, không chép số** (ADR-016); số không sinh được từ script thì không xuất hiện | Review |
| DOC-02 | PHẢI | Mọi thay đổi ngưỡng/phạm vi qua ADR. **ADR bị thay thế không xoá, không viết lại**: giữ nguyên văn, thêm dòng trạng thái *ĐÃ THAY THẾ bởi ADR-xxx* ở đầu; ADR thay thế ghi rõ thay mục nào. Chuỗi ADR là sử liệu | Script quét `docs/adr/`: mọi ADR bị ADR khác nêu "thay thế" phải mang dòng trạng thái tương ứng |
| DOC-03 | PHẢI | `CLAUDE.md` luôn phản ánh trạng thái thật; dấu ✅ chỉ gắn **sau khi commit** | Review |
| DOC-04 | PHẢI | Bằng chứng đo nằm trong repo (`scripts/`), không ở thư mục nháp phiên | Checklist |
| DOC-05 | PHẢI | **Nhãn trung thực của bảng tham số** được bảo tồn: tham số nào chọn *sau khi nhìn dữ liệu*, tham số nào *đăng ký trước*, tham số nào đo *in-sample* — ghi ngay trong bảng, không được xoá khi viết lại tài liệu. Xoá nhãn này là biến chọn-sau-khi-nhìn thành đăng-ký-trước giả | Review; checklist khi viết `04` |

---

## 16 · Ma trận phase

| Phase | Nhóm REQ mở | Điều kiện vào phase |
|---|---|---|
| **P1** | PRED, PAPER (ẩn danh), TRACK, DATA, UI cơ bản, NFR, DOC, NOTIFY-04 | Bộ doc 00–08 duyệt |
| **P2** | ACC (kín, có trần), PAPER theo tài khoản, **bot Paper**, UI đầy đủ, NFR-09 | P1 chạy ổn · `NFR-03` (Mac mini + Cloudflare) chịu tải · `NFR-04` threat model |
| **P3** | LINK, TRADE, NOTIFY, ACC-03 | `LEGAL-01` **và** `LEGAL-06` xong · `§8 REQ-SAFE` đủ cho đường lệnh tay (đã trừ `SAFE-06`) · `NFR-05` sao lưu + `LINK-08` |
| **P4** | BOT (tiền thật) | `§8 REQ-SAFE` đủ (đã trừ `SAFE-06`) · `NOTIFY-01/02` chạy |
| **P5** | `PRED-05b` (method ML) | Method mới qua `PRED-09`/`10`/`11` như mọi method |

> **Không còn điều kiện GATE nào trong bảng này** (ADR-020). Mỗi phase mở khi phần
> mềm của phase đó **viết xong và chạy đúng** — không chờ một điểm số thống kê.

## 17 · Điểm chờ chủ dự án quyết

| # | Việc | Chặn gì |
|---|---|---|
| 1 | Trần số tài khoản `ACC-09` khi còn chạy trên Mac mini | P2 |
| 2 | Ngưỡng thanh khoản của vũ trụ (`PRED-13`) | P1 |
| 3 | Tư vấn pháp lý `LEGAL-01` + rà điều khoản Binance `LEGAL-06` | P3 |
| 4 | ADR còn nợ từ thế hệ 1: 005, 008, 009, 010, 015 — viết mới hoặc khai tử. (**007, 011, 014 đã tự tiêu** cùng hệ GATE — ADR-020) | P1 |

> Hai điểm chờ của nháp 2 — ngưỡng `SAFE-06` và ngưỡng kỳ bot Paper — **đã tự tiêu**
> khi chủ dự án bỏ hoàn toàn `SAFE-06` (28/08/2026). Không còn con số nào đóng vai
> trò điều kiện mở tính năng trong toàn bộ tài liệu này.
