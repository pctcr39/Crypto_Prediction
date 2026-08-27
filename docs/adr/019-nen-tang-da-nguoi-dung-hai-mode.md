# ADR-019 · Nền tảng nhiều người dùng, hai mode Paper/Trading — thay quyết định phạm vi §0.1 của PREDICTION_DESIGN

**Ngày:** 2026-08-27
**Trạng thái:** đã chốt — **quyết định của chủ dự án**, trả lời trực tiếp 4 câu hỏi phạm vi
**Thay thế:** `docs/Old/PREDICTION_DESIGN.md §0.1–0.3` (phần *phạm vi sản phẩm*) · `docs/Old/18_BUILD_AND_DEPLOY_PLAN.md` (phần *cắt đường khoá giao dịch* và *một người dùng*)
**Không thay thế:** toàn bộ phần đo lường, phương pháp, hợp đồng dữ liệu của PREDICTION_DESIGN và các tài liệu 07–17 — chúng trở thành lõi tầng 1 của hệ dự đoán.

## Bối cảnh

Ngày 27/08/2026, `PREDICTION_DESIGN.md §0.1` (trạng thái CHỜ DUYỆT) đề xuất chốt phạm
vi "chỉ dự đoán và khuyến nghị — không đặt lệnh, không giữ khoá API, không chạm tiền".
Cùng ngày, chủ dự án quyết định phạm vi khác khi được hỏi trực tiếp: sản phẩm là
**nền tảng cho nhiều người dùng**, mỗi người đăng nhập và liên kết tài khoản Binance
riêng, với **hai mode** — Paper (tập luyện) và Trading (trade thủ công trực tiếp hoặc
dùng bot). Cả hai mode đều được hệ dự đoán/gợi ý phục vụ.

Hai quyết định trái nhau không thể cùng đứng. ADR này ghi nhận quyết định của chủ
dự án là quyết định hiệu lực, và ghi rõ cái giá phải trả.

## Quyết định

1. **Sản phẩm**: nền tảng dự đoán + giao dịch crypto đa người dùng. Hai mode:
   - **Paper** — ví ảo, khớp mô phỏng tại giá thật, dùng để tập luyện và để hệ
     chứng minh mình trước khi ai đó dùng tiền thật.
   - **Trading** — trên chính tài khoản Binance của từng người dùng: đặt lệnh
     thủ công qua hệ, hoặc bật bot trade theo tín hiệu.
2. **Lõi dự đoán hai tầng**: tầng 1 rule-based (phương pháp rào chắn đã đo —
   kế thừa nguyên vẹn từ PREDICTION_DESIGN), tầng 2 ML (LightGBM…) chỉ cắm vào
   sau khi qua cùng bộ kiểm định, qua cùng một hợp đồng `Prediction`.
3. **Không custody — bất biến vĩnh viễn**: tiền của người dùng luôn nằm trên tài
   khoản Binance của chính họ. Hệ chỉ nhận khoá API **chỉ-quyền-giao-dịch**,
   không bao giờ chấp nhận khoá có quyền rút tiền; khoá được mã hoá khi lưu,
   không bao giờ xuất hiện trong log, người dùng thu hồi được ngay.
4. **4 GATE đổi vai trò, không đổi ngưỡng**: từ "điều kiện bật auto-trade cho một
   người" thành **cổng mở tính năng cho mọi người dùng** — bot trading khoá sau
   GATE 1–4 nguyên ngưỡng số (`docs/Old/00_MASTER_PLAN.md §7`); trade thủ công mở
   sớm hơn nhưng phải qua cổng kỹ thuật riêng của đường đặt lệnh (idempotent,
   đối soát, kill switch — nhóm 2 của GATE 4). 12 RULE giữ nguyên toàn bộ.
5. **Các quyết định vận hành kèm theo** (chủ dự án chốt cùng ngày, làm rõ buổi
   chiều): miễn phí, không thu phí người dùng (không xây billing) · hạ tầng Mac
   mini M4 tại nhà, host qua Cloudflare Tunnel · không đưa thuế vào mô hình chi
   phí (người dùng tự khai) · nguồn lực một người + Claude, làm tới khi xong
   (roadmap xếp theo thứ tự phụ thuộc, không theo lịch cứng) · thị trường Việt
   Nam trước, UI tiếng Việt mặc định, tiếng Anh phụ.

## Phương án đã cân nhắc và loại bỏ

| Phương án | Vì sao loại |
|---|---|
| Giữ phạm vi "chỉ khuyến nghị" (§0.1 cũ) | Chủ dự án muốn người dùng giao dịch được qua hệ; mô hình chỉ-khuyên không đáp ứng mục tiêu sản phẩm |
| Auto-trade cá nhân một người (MASTER_PLAN gốc) | Không đáp ứng yêu cầu nhiều người dùng |
| Đa user nhưng hệ giữ hộ tiền (custody) | Rủi ro pháp lý và an toàn không thể biện minh; không custody là lựa chọn duy nhất chấp nhận được |

## Hệ quả

**Được:** sản phẩm đúng tầm nhìn của chủ dự án; toàn bộ đầu tư đo lường 07–17 +
PREDICTION_DESIGN được giữ nguyên làm lõi tầng 1; đường nâng cấp ML rõ ràng.

**Mất / phải trả:**
- Phải xây thêm toàn bộ mảng chưa từng có trong thiết kế cũ: đăng nhập đa user,
  kho khoá mã hoá, giới hạn rủi ro theo từng người, đối soát theo từng tài khoản.
- Lý lẽ an toàn "cách rẻ nhất để không bao giờ đặt lệnh là không có mã nào đọc
  được khoá" (doc 18 cũ) **mất hiệu lực** — thay bằng phòng thủ chủ động: khoá
  chỉ-trade, mã hoá, GATE, kill switch, đối soát.
- **Ràng buộc pháp lý thành việc chặn đường**: vận hành nền tảng đặt lệnh hộ
  người khác có thể cần điều kiện pháp lý. Phải có tư vấn pháp lý **trước khi mở
  Trading mode cho người ngoài** — ghi thành REQ ở `docs/01_REQUIREMENTS.md`.
  Thuế không nằm trong mô hình chi phí của hệ (quyết định chủ dự án).
- Khi hệ chỉ khuyên, sai lầm hiện ra chậm; khi hệ đặt lệnh, sai lầm hiện ra
  bằng tiền của người khác. Chuẩn kiểm định vì thế chỉ được siết, không được nới.
