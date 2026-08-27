# docs/Old — hồ sơ tài liệu thế hệ 1 (đã được thay thế về vai trò, giữ nguyên về nội dung)

> Chuyển vào đây ngày 27/08/2026, theo quyết định tái cấu trúc tài liệu của chủ dự án
> (xem `docs/adr/019-*.md`). **Không sửa nội dung các file trong thư mục này** —
> chúng là hồ sơ bằng chứng: mọi con số đo được, mọi vòng phản biện, mọi quyết định
> trung gian đều truy về đây.

## Vì sao chuyển

Phạm vi sản phẩm đổi (27/08/2026): từ hệ một-người-dùng sang **nền tảng nhiều người
dùng** có đăng nhập, liên kết tài khoản Binance riêng, 2 mode Paper/Trading (thủ công
+ bot), lõi dự đoán 2 tầng (rule-based → ML). Bộ tài liệu mới `docs/00–08` là nguồn
sự thật hiện hành; bộ cũ giữ vai trò hồ sơ.

## Đọc file nào khi cần gì

| Cần | Đọc |
|---|---|
| 12 RULE bản đầy đủ + 4 GATE ngưỡng số | `00_MASTER_PLAN.md` §1, §7 |
| Design system (DS-RULE, token, kiểm định màu) | `02_DESIGN_SYSTEM.md` |
| Đặc tả module M0–M14 thế hệ 1 | `03_MODULE_SPECS.md` |
| 10 luật streaming WebSocket Binance | `05_STREAMING_ARCHITECTURE.md` |
| Backlog UX-1→38 + tham số đã chốt | `05_DASHBOARD_UX_PLAN.md` |
| Phương pháp dự đoán/giao dịch đã đo + vòng phản biện | `07`–`13`, đặc biệt `09` (bên bác) và `12` (số đo 2.062 nến) |
| Sổ đăng ký 13 đặc trưng chính thức | `14_FEATURE_REGISTRY.md` |
| Thiết kế rule-based hoàn chỉnh (rào chắn 1,2σ̂/6,0σ̂) | `PREDICTION_DESIGN.md` — **phần phạm vi §0.1 đã bị ADR-019 thay; phần đo lường còn nguyên giá trị** |
| Audit trạng thái 27/08/2026 | `19_REVIEW_MODULE_PREDICTION.md` |

Script đo tái tạo các con số: `scripts/measurements_2026_08_26/` (đã commit đầy đủ
trong repo — ghi chú "mã đo ở thư mục nháp" trong `12` là câu cũ, đã lỗi thời).

Bản kiểm kê chi tiết "file nào giữ gì, chuyển vào doc mới nào" được lập ngày
27/08/2026 bằng 14 agent đọc toàn văn — kết quả đã dùng để viết bộ `docs/00–08`.

## Lưu ý cho phiên Claude sau

Mã nguồn trong `src/` và `web/` có thể còn comment trỏ `docs/XX_...` theo đường dẫn
cũ — đọc là `docs/Old/XX_...`. Các con trỏ này sẽ được dọn dần khi từng module được
xây lại theo bộ doc mới.
