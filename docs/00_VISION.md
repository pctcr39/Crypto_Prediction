# 00 · TẦM NHÌN VÀ PHẠM VI — cryptopred

> **Trạng thái:** bản nháp 1 · 27/08/2026 · chờ chủ dự án duyệt (Bước 2 của lộ trình tài liệu)
> **Căn cứ:** `docs/adr/019-nen-tang-da-nguoi-dung-hai-mode.md` (quyết định phạm vi) · 12 RULE kế thừa từ `docs/Old/00_MASTER_PLAN.md §1`
> **Vai trò:** tài liệu gốc của bộ `docs/00–08`. Mọi tài liệu sau chỉ được *chi tiết hoá* những gì ghi ở đây, không được mâu thuẫn. Khi một tài liệu sau cần nói ngược, phải sửa tài liệu này trước — bằng ADR.

---

## 1 · Sản phẩm là gì

**cryptopred** là nền tảng web cho nhiều người dùng, giúp mỗi người **dự đoán hướng
giá crypto một cách trung thực** và **giao dịch trên chính tài khoản Binance của
mình** — bằng tay hoặc bằng bot — với toàn bộ rủi ro được đo và giới hạn trước.

Ba việc hệ làm, theo đúng thứ tự tin cậy:
1. **Dự đoán** — biến động kỳ vọng, dải giá (q10/q50/q90), xác suất tăng đã hiệu
   chỉnh — cho mọi khung thời gian, mọi cặp USDT trên Binance.
2. **Khuyến nghị** — điểm vào, mức dừng lỗ, mức chốt lời, cỡ gợi ý — chỉ ở khung
   đủ bằng chứng (hiện là 1 ngày, theo ADR-002), luôn kèm ngưỡng thắng cần để hoà vốn.
3. **Thực thi** — trong Paper (ví ảo) ngay từ đầu; trong Trading (tiền thật, tài
   khoản của người dùng) chỉ sau khi qua các cổng ở §5.

Một câu để nhớ: *hệ này thà im lặng còn hơn nói bừa, và thà khoá tính năng còn
hơn để người dùng mất tiền vì một con số chưa được kiểm chứng.*

## 2 · Hai mode

| | **PAPER** — tập luyện | **TRADING** — tiền thật |
|---|---|---|
| Tiền | Ví ảo (khởi tạo 10.000 USDT), lưu theo tài khoản người dùng | Tài khoản Binance của chính người dùng, liên kết bằng khoá API chỉ-quyền-giao-dịch |
| Khớp lệnh | Mô phỏng tại giá thật + phí taker 0,10%/chiều + trượt giá 0,05% | Lệnh thật gửi lên Binance qua đường lệnh có đối soát |
| Dự đoán & khuyến nghị | Có, đầy đủ | Có, đầy đủ — cùng một nguồn, cùng một con số |
| Đặt lệnh thủ công | Có | Có — sau cổng kỹ thuật đường lệnh (§5) |
| Bot tự giao dịch | Có (để đo bot trước) | Chỉ sau GATE 1–4 (§5), người dùng tự bật, có giới hạn rủi ro riêng |
| Thành tích | Track record cá nhân, bất biến | Track record cá nhân + đối soát với số dư thật |
| Phân biệt thị giác | Nhãn PAPER ở mọi panel | Nhãn TIỀN THẬT ở mọi panel — không bao giờ để nhầm |

Hai mode dùng **chung** lõi dự đoán, chung giao diện, chung sổ thành tích. Khác nhau
duy nhất ở chỗ tiền đi đâu — và vì thế khác nhau ở cổng an toàn.

## 3 · Người dùng và thị trường

- **Nhiều người dùng**, mỗi người một tài khoản đăng nhập, dữ liệu tách biệt.
- **Việt Nam trước**: giao diện tiếng Việt mặc định, tiếng Anh phụ. Thị trường
  khác xét sau. Hệ **không** đưa thuế vào mô hình chi phí — thuế là việc từng
  người dùng tự khai (quyết định chủ dự án 27/08/2026).
- Hai nhóm người dùng hình dung khi thiết kế:
  - *Người mới* — cần hiểu một con số trong một chạm, cần Paper để tập, cần được
    hệ nói "không rõ" thay vì bị dụ.
  - *Trader có kinh nghiệm* — cần chỉ số kỹ thuật, so sánh phương pháp, track
    record có n=, và đường đặt lệnh nhanh, đáng tin.

## 4 · Mô hình vận hành (chủ dự án chốt 27/08/2026)

| Hạng mục | Quyết định | Hệ quả thiết kế |
|---|---|---|
| Kinh doanh | **Miễn phí — không thu phí người dùng** | Không xây billing, không gói trả phí; nếu sau này đổi ý phải qua ADR |
| Hạ tầng | **Mac mini M4 tại nhà, host qua Cloudflare Tunnel** | Toàn bộ chạy trên một máy; Cloudflare Tunnel + Access là cửa vào duy nhất (không mở port); Docker hoá để tách môi trường và sao lưu; VPS chỉ khi Mac mini không kham nổi |
| Chi phí giao dịch | **Chỉ phí sàn + trượt giá, không tính thuế** | `config → costs` gồm taker 0,10%/chiều + trượt giá 0,05%; hệ không ước tính, không khấu trừ thuế — người dùng tự khai |
| Nguồn lực | **Một người + Claude, làm tới khi xong** | Lộ trình xếp theo *thứ tự phụ thuộc*, không theo lịch; mỗi module chạy độc lập, có test, để tiến độ chậm không làm hỏng cái đã xong |
| Thị trường | **Việt Nam trước** | Xem §3 |

## 5 · Nguyên tắc bất biến

### 5.1 · Mười hai luật kế thừa — giữ nguyên toàn văn

Bản đầy đủ và lý do từng luật ở `docs/Old/00_MASTER_PLAN.md §1`. Tóm để nhớ:

| # | Luật |
|---|---|
| 1 | Không train trên giá tuyệt đối — mọi feature scale-free |
| 2 | Mọi feature dịch ít nhất 1 nến, qua đúng một hàm `shift_all()` |
| 3 | Chỉ chia theo thời gian — purged walk-forward, cấm chia ngẫu nhiên |
| 4 | Đánh bại 3 baseline trước, out-of-sample, sau phí |
| 5 | Mọi con số đánh giá đều đã trừ phí taker 0,10%/chiều + trượt giá 0,05% |
| 6 | Xác suất phải hiệu chỉnh — isotonic trên tập validation riêng |
| 7 | Dự đoán không được nhìn giống dữ liệu thật — tím, nét đứt, không bao giờ xanh/đỏ |
| 8 | Dashboard luôn nói thật về độ tươi: Live / Chậm / Mất kết nối / Dự đoán cũ |
| 9 | Tiền thật chỉ mở qua 4 GATE có ngưỡng số — không có ngoại lệ vì cảm tính |
| 10 | Mỗi lần train ghi vào MLflow: git hash, seed, hash dữ liệu, config, metric |
| 11 | Accuracy > 60% ở khung 1h ⇒ giả định có rò rỉ cho tới khi chứng minh ngược lại |
| 12 | Foundation model đã thấy quá khứ — chỉ đánh giá sau cutoff của chúng |

**Khi luật va chạm với kết quả đẹp, luật thắng.**

### 5.2 · Năm luật mới cho kỷ nguyên nhiều người dùng và tiền thật

| # | Luật | Vì sao |
|---|---|---|
| 13 | **Không custody.** Tiền luôn nằm trên Binance của người dùng. Hệ từ chối mọi khoá API có quyền rút tiền — kiểm tra quyền lúc liên kết và định kỳ. | Loại bỏ cả lớp rủi ro (hệ bị hack ⇒ mất tiền) và phần lớn gánh pháp lý về giữ tài sản |
| 14 | **Khoá API là bí mật cấp cao nhất.** Mã hoá khi lưu, chỉ giải mã trong tiến trình đặt lệnh, không bao giờ vào log/lỗi/giao diện, người dùng thu hồi một chạm. | Một lần lộ khoá là mất niềm tin vĩnh viễn |
| 15 | **GATE là cổng mở tính năng.** Bot trading với tiền thật chỉ mở sau GATE 1–4 (ngưỡng nguyên văn `docs/Old/00_MASTER_PLAN.md §7`). Trade thủ công tiền thật chỉ mở sau cổng kỹ thuật đường lệnh (idempotent, đối soát, kill switch). Không tính năng nào mở vì "có vẻ ổn". | RULE 9 áp cho mọi người dùng, không chỉ chủ dự án |
| 16 | **Mỗi lần khởi động về trạng thái an toàn, mỗi người dùng có giới hạn riêng.** Bot tắt sau restart; giới hạn lỗ ngày, cỡ lệnh, tổng exposure tính theo từng tài khoản; kill switch toàn hệ dừng mọi bot cùng lúc. | Sự cố không được lan từ người này sang người khác |
| 17 | **Track record bất biến và công khai.** Mọi dự đoán/khuyến nghị đã phát được ghi trước khi biết kết cục, không sửa, không xoá; thành tích luôn kèm n=. | Khi hệ đặt lệnh hộ người khác, cách duy nhất để họ tin là cho họ kiểm |

## 6 · Lõi dự đoán hai tầng

- **Tầng 1 — rule-based, đã đo** (`docs/04_PREDICTION_SPEC.md`, kế thừa
  `docs/Old/PREDICTION_DESIGN.md` phần đo lường): phương pháp rào chắn 1,2σ̂ dừng
  lỗ / 6,0σ̂ chốt lời trên khung 1 ngày, xác suất thắng cần để hoà vốn tính từ chi
  phí thật, kiểm định bằng purged walk-forward + 5 phép thử rò rỉ. Đây là tầng
  **duy nhất** được phát khuyến nghị cho tới khi tầng 2 qua cùng bộ kiểm định.
- **Tầng 2 — ML, cắm sau**: LightGBM (hoặc method khác) cắm vào **cùng một hợp
  đồng** `Prediction`, chạy **cùng một bộ kiểm định**, và chỉ được hiển thị/đặt
  lệnh khi thắng tầng 1 out-of-sample sau phí. Người dùng có thể *xem* nhiều
  method, nhưng chỉ chọn ở tầng độ chọn lọc (ADR-018), không chọn tham số rào chắn.
- Khung 1 giờ và 4 giờ là **đầu ra hiển thị**, không phát ý định giao dịch
  (ADR-002) — cho tới khi có bằng chứng ngược lại qua GATE.

## 7 · Những điều hệ KHÔNG làm — cố ý, có bằng chứng

Kế thừa từ các vòng phản biện (`docs/Old/09`, `11`, `12`); chi tiết và lý do ở `docs/04`, `05`:
- Không giữ hộ tiền, không nhận quyền rút tiền (Luật 13).
- Không phát ý định giao dịch ở khung 1h/4h (ADR-002).
- Không cho người dùng chọn tham số rào chắn (ADR-018, trục A — cấm vĩnh viễn).
- Không dùng chỉ báo/họ phương pháp đã bị đo là vô giá trị sau phí: funding-contrarian,
  11 định danh SMC, on-chain MVRV dạng tải-hôm-nay (rò rỉ đóng gói sẵn).
- Không hiển thị con số "đẹp" mà không có n=, không có ngưỡng hoà vốn bên cạnh.
- Không dùng dark pattern để giữ chân: không đếm ngược giả, không đỏ/xanh nhấp nháy vô cớ.

## 8 · Ràng buộc mở — phải xử lý trước khi mở Trading cho người ngoài

| Ràng buộc | Ai xử lý | Chặn phase nào |
|---|---|---|
| Pháp lý vận hành nền tảng đặt lệnh hộ người dùng tại Việt Nam (điều kiện tư vấn/môi giới nếu có) | Chủ dự án — cần tư vấn pháp lý | Trading mode cho người ngoài (Phase 3) |
| Mac mini tại nhà: điện và mạng gia đình là điểm hỏng đơn | Chủ dự án — UPS, watchdog, sao lưu ngoài máy | Mở đăng ký công khai (Phase 2 muộn) |
| Chưa có mô hình nào qua GATE 1 — mọi khuyến nghị hiện chỉ có giá trị đo lường | Lộ trình Phase 1 | Bot trading tiền thật (Phase 4) |

## 9 · Bản đồ bộ tài liệu và trạng thái duyệt

| Tài liệu | Nội dung | Trạng thái |
|---|---|---|
| `00_VISION.md` (file này) | Tầm nhìn, phạm vi, nguyên tắc | 🟡 nháp 1 — chờ duyệt |
| `01_REQUIREMENTS.md` | REQ-xxx: yêu cầu nghiệp vụ, phi chức năng, ràng buộc | ⬜ |
| `02_FRD.md` | FR-xxx: đặc tả chức năng | ⬜ |
| `03_ARCHITECTURE.md` | Kiến trúc end-to-end | ⬜ |
| `04_PREDICTION_SPEC.md` | Lõi dự đoán hai tầng | ⬜ |
| `05_TRADING_SPEC.md` | Paper / thủ công / bot, Risk Engine, Key Vault, GATE | ⬜ |
| `06_DATA_SPEC.md` | Nền dữ liệu | ⬜ |
| `07_UIUX_SPEC.md` | Design system + dashboard (nền: prototype v14) | ⬜ |
| `08_ROADMAP.md` | Lộ trình theo phụ thuộc, mốc duyệt | ⬜ |
| `adr/` | Dòng quyết định — ADR-019 là quyết định gốc của bộ này | ✅ |
| `Old/` | Hồ sơ thế hệ 1 — chỉ đọc | ✅ |

## 10 · Lộ trình — bản khung (chi tiết ở `08_ROADMAP.md`)

Xếp theo phụ thuộc, không theo lịch:

0. **Nền tài liệu** — bộ `00–08` + ADR-019 *(đang làm)*
1. **Dữ liệu + Dự đoán tầng 1** — pipeline dữ liệu, method rào chắn, bộ kiểm định
   rò rỉ thật, sổ khuyến nghị bất biến; dashboard xem + Paper ẩn danh *(mầm đã có ở `web/`)*
2. **Nhiều người dùng** — đăng nhập, hồ sơ, ví Paper theo tài khoản, track record cá nhân
3. **Liên kết Binance + trade thủ công** — Key Vault, xem số dư/lịch sử, đặt lệnh thủ công
   sau cổng kỹ thuật đường lệnh và sau khi gỡ ràng buộc pháp lý (§8)
4. **Bot trading** — chỉ sau GATE 1–4; từng người tự bật, giới hạn rủi ro riêng
5. **ML tầng 2** — cắm method thứ hai qua cùng bộ kiểm định
