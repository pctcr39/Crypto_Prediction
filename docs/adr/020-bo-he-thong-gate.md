# ADR-020 · Bỏ hệ thống GATE — thay bằng nhãn trung thực và bộ an toàn kỹ thuật

**Ngày:** 2026-08-27 · **bổ sung 2026-08-28**
**Trạng thái:** đã chốt — **quyết định của chủ dự án**

> ### Bổ sung 28/08/2026 — bỏ nốt kỳ chạy thử đường lệnh
> Bản gốc dưới đây chuyển GATE 3 (chạy tiền ảo 60 ngày / 100 lệnh) thành `SAFE-06`
> — một kỳ chạy thử kỹ thuật trước khi phát hành. Chủ dự án quyết định **bỏ luôn
> `SAFE-06`**: không còn kỳ chạy thử bắt buộc nào, và không còn điều kiện "user
> phải chạy bot Paper một kỳ" trước khi bật bot tiền thật.
>
> **Hệ quả phải ghi rõ:** bảo đảm về tính đúng đắn của đường lệnh nay dựa **hoàn
> toàn vào test tự động** (`SAFE-05` và các test cố-tình-vi-phạm của `SAFE-01`…`09`),
> không còn bằng chứng vận hành thật nào trước lần đặt lệnh tiền thật đầu tiên.
> Các lỗi chỉ lộ ra khi chạy dài — rò rỉ bộ nhớ, trôi trạng thái sau nhiều ngày,
> hành vi của sàn ở biên, tắc nghẽn hàng đợi — sẽ được phát hiện **trên tiền thật
> của người dùng** thay vì trong kỳ chạy thử. Đổi lại, `SAFE-05` được siết: bộ test
> tiêm lỗi phải phủ tối thiểu 5 kịch bản mạng/sàn liệt kê trong REQ.
>
> Bảng ở §Quyết định bên dưới giữ nguyên văn làm sử liệu; dòng "GATE 3 → SAFE-06"
> nay đọc là **"GATE 3 → đã bỏ hẳn"**.
**Thay thế:** `RULE 9` trong `CLAUDE.md` · `docs/00_VISION.md` Luật 15 · nhóm `REQ-GATE` trong `docs/01_REQUIREMENTS.md` · `docs/Old/00_MASTER_PLAN.md §7` (bốn cổng) · `docs/adr/019` mục 4
**Liên quan:** ADR-017 (rào chắn), ADR-018 (tầng chọn lọc)

## Bối cảnh

Kiến trúc thế hệ 1 khoá mọi tính năng chạm tiền thật sau **4 GATE**: GATE 1 thống
kê (Sharpe, drawdown, profit factor), GATE 2 hiệu chỉnh xác suất, GATE 3 chạy
tiền ảo 60 ngày, GATE 4 checklist an toàn kỹ thuật. `RULE 9` phát biểu:
*"Tiền thật chỉ mở qua 4 gate, mỗi gate có ngưỡng số. Không có ngoại lệ vì cảm tính."*

Chủ dự án đặt lại vấn đề: **"tiền là quyết định của user"**. Người dùng đọc dự
đoán, tự đánh giá, và giao dịch trên tài khoản của chính họ — nền tảng không giữ
tiền của ai (Luật 13). Một cổng thống kê do nền tảng dựng lên để quyết định thay
người dùng rằng họ *chưa được phép* dùng tiền của mình là một quyết định gia trưởng
không thuộc về nền tảng.

Vòng phản biện đối kháng ngày 27/08/2026 (183 phát hiện, 72 MAJOR xác nhận) còn
cho thấy hệ GATE tự nó đã hỏng về mặt kỹ thuật: ngưỡng GATE 1 trong `Old/00 §7`
(Sharpe ≥ 1,0) **đã bị chính phép đo của dự án bác bỏ** và thay bằng "cổng kép"
trong `PREDICTION_DESIGN §8.2`, nhưng cả `VISION` lẫn `REQ` vẫn chép ngưỡng cũ;
ba mục của GATE 4 mâu thuẫn với thiết kế tranche hiện hành; và ma trận phase tạo
**vòng lặp phụ thuộc** — GATE 3 cần bot chạy để thu bằng chứng, mà bot lại bị GATE
3 khoá. Sửa hệ GATE cho đúng đòi ít nhất 3 ADR nợ (007, 011, 014) chưa ai viết.

## Quyết định

**Bỏ toàn bộ khung GATE.** Không còn GATE 1/2/3/4, không còn "cổng mở tính năng",
không còn `RULE 9`. Nội dung bên trong các GATE **không biến mất** — nó được tách
đúng theo bản chất và đặt lại vào nơi thuộc về:

| Nội dung GATE cũ | Bản chất thật | Nay nằm ở |
|---|---|---|
| GATE 1 (thống kê) · GATE 2 (hiệu chỉnh) | *Cơ sở để tuyên bố một phương pháp có kỹ năng* — chuyện **nói thật**, không phải chuyện cấp phép | `REQ-PRED` + **Luật 15 mới**: nhãn trạng thái kiểm chứng, hiển thị bắt buộc |
| GATE 4 (checklist an toàn) | *Định nghĩa hoàn thành của đường lệnh* — phần mềm chạm tiền mà thiếu nút dừng khẩn cấp thì **chưa viết xong**, không phải "chưa qua cổng" | `REQ-SAFE` — bộ an toàn bắt buộc |
| GATE 3 (chạy tiền ảo, shadow run) | *Phép thử kỹ thuật của đường lệnh* trước khi phát hành | `REQ-SAFE` — chạy thử đường lệnh |

**Ranh giới mới, phát biểu một lần:**

> **Người dùng quyết định có tin dự đoán hay không. Nền tảng chịu trách nhiệm
> không để phần mềm của mình làm mất tiền vì lỗi kỹ thuật.**

Vế thứ nhất: không có ngưỡng thống kê nào chặn người dùng bật một tính năng. Vế
thứ hai: **không thương lượng** — nút dừng khẩn cấp, chống gửi trùng lệnh, đối
soát với sàn, giới hạn cỡ lệnh, khoá API không quyền rút tiền, khởi động lại về
trạng thái tắt. Đây không phải cổng cấp phép; đây là định nghĩa "đã viết xong".

**Đổi lại cho việc bỏ cổng thống kê, nghĩa vụ nói thật được siết:** mỗi phương
pháp mang một trạng thái kiểm chứng công khai (`chưa kiểm chứng` / `đang thu bằng
chứng` / `đã kiểm chứng`), hiển thị ngay cạnh mọi khuyến nghị của nó, kèm số mẫu.
Nhãn `đã kiểm chứng` chỉ được gắn khi thắng bộ baseline out-of-sample sau phí,
trên holdout chưa chạm, xác suất đã hiệu chỉnh. Nhãn không chặn ai làm gì — nó
bảo đảm người dùng quyết định khi biết mình đang quyết định điều gì.

## Phương án đã cân nhắc và loại bỏ

| Phương án | Vì sao loại |
|---|---|
| Giữ 4 GATE nguyên trạng | Chủ dự án bác về nguyên tắc; và hệ GATE tự nó đang mâu thuẫn nội bộ (ngưỡng đã bị phép đo bác, vòng lặp phase) — sửa cho đúng tốn 3 ADR nợ mà vẫn không giải quyết phản đối gốc |
| Giữ GATE nhưng cho người dùng bấm bỏ qua | Biến một yêu cầu về bằng chứng thành một cú click-through: tệ hơn cả hai phương án, vì vẫn tốn công dựng cổng mà không còn tác dụng |
| Bỏ GATE và bỏ luôn bộ an toàn kỹ thuật | Lẫn hai chuyện khác nhau. "Người dùng tự chịu rủi ro thị trường" không có nghĩa "người dùng tự chịu bug của tôi". Gửi trùng lệnh vì lỗi mạng không phải rủi ro thị trường |

## Hệ quả

**Được:**
- Ranh giới trách nhiệm rõ và đúng: rủi ro thị trường thuộc người dùng, rủi ro
  phần mềm thuộc nền tảng. Trước đây hai thứ này bị trộn trong một hệ cổng.
- Gỡ vòng lặp phụ thuộc: bot chạy trên ví Paper trở thành việc của Phase 2, không
  còn bị khoá sau một cổng cần chính nó để thu bằng chứng.
- Xoá được 3 ADR nợ (007 sửa ngưỡng GATE 1, 011 sửa GATE 4, 014) — chúng chỉ tồn
  tại để vá hệ GATE, nay không còn đối tượng.
- Lộ trình đơn giản hơn: mỗi phase mở khi *phần mềm của phase đó viết xong và
  chạy đúng*, không chờ một điểm số.

**Mất / phải trả:**
- **Mất lớp bảo vệ người dùng khỏi chính họ.** Trước đây một người dùng không thể
  bật bot tiền thật dựa trên một mô hình chưa được chứng minh. Nay họ có thể. Nhãn
  trung thực là thứ duy nhất đứng giữa — nó phải được thi hành nghiêm, và nghĩa vụ
  không-được-gợi-ý-nhiều-hơn-bằng-chứng trở thành ràng buộc quan trọng nhất của UI.
- **Trách nhiệm pháp lý và uy tín tăng.** "Người dùng tự quyết" là lập luận yếu khi
  họ quyết dựa trên số do nền tảng in ra. `LEGAL-01` (tư vấn pháp lý trước khi mở
  Trading cho người ngoài) từ "nên có" thành **điều kiện chặn**.
- **Kỷ luật đo lường mất chỗ dựa hình thức.** Trước đây GATE là lý do để không tự
  lừa mình. Nay chỉ còn 12 RULE (trừ RULE 9) và nhãn trung thực. Cụ thể: RULE 4
  (thắng baseline), RULE 6 (hiệu chỉnh xác suất), RULE 11 (accuracy > 60% ở 1h là
  nghi rò rỉ) gánh phần việc GATE 1–2 từng gánh — chúng **không được nới**.
- `docs/Old/00_MASTER_PLAN.md §7` và mọi tham chiếu "4 GATE" trong `docs/Old/` trở
  thành sử liệu. Không sửa file cũ; ADR này là con trỏ.

## Ghi chú thi hành

1. `CLAUDE.md` — RULE 9 viết lại thành nghĩa vụ nhãn trung thực + bộ an toàn.
2. `docs/00_VISION.md` — Luật 15 viết lại; §10 lộ trình bỏ điều kiện GATE.
3. `docs/01_REQUIREMENTS.md` — bỏ nhóm `REQ-GATE` (GATE-01…04 đánh dấu *đã bỏ*,
   không tái dùng số); thêm nhóm `REQ-SAFE`; `BOT-01` viết lại.
4. `src/cryptopred/risk/limits.py` — docstring bỏ tham chiếu GATE 4, giữ nguyên
   nội dung 11 hạng mục dưới tên "bộ an toàn bắt buộc".
5. `web/index.html` — panel Live viết lại lần nữa: không còn "bốn điều kiện".
