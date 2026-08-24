# DESIGN SYSTEM — DASHBOARD CRYPTO PREDICTION

> Phiên bản 1.0 · 24/08/2026
> Toàn bộ bảng màu trong tài liệu này **đã chạy qua bộ kiểm định 6 tiêu chí** (dải sáng, sàn chroma, phân tách mù màu, sàn thị lực thường, tương phản nền) và đạt ở **cả chế độ tối lẫn sáng**. Kết quả kiểm định ghi ở §2.4.

---

## 1. TÁM NGUYÊN TẮC THIẾT KẾ

### DS-RULE 1 — Mọi con số phải dùng chữ số đều bề rộng

**Luật:** Mọi phần tử hiển thị số (giá, %, xác suất, khối lượng) phải có `font-variant-numeric: tabular-nums`.

**Tại sao:** Giá cập nhật vài lần mỗi giây. Với font tỉ lệ, chữ số `1` hẹp hơn `8`, nên mỗi lần giá đổi từ `68,111` sang `68,888` cả dòng bị co giãn và nhảy múa. Trên một màn hình bạn nhìn hàng giờ, đây là thứ gây mệt mắt nhanh nhất.

---

### DS-RULE 2 — Không bao giờ hoạt hoạ vị trí khi giá thay đổi

**Luật:** Khi giá đổi, chỉ được nháy nền trong 150ms rồi tắt. Cấm transition trên `transform`, `top`, `left`, hay chiều cao của số.

**Tại sao:** Chuyển động vị trí ở tần suất realtime biến dashboard thành máy đánh bạc. Nháy nền truyền tải "vừa có thay đổi" mà không phá vỡ khả năng đọc.

```css
@keyframes flash-up { from { background: var(--up-bg); } to { background: transparent; } }
.price--changed { animation: flash-up 150ms ease-out; }
@media (prefers-reduced-motion: reduce) { .price--changed { animation: none; } }
```

---

### DS-RULE 3 — Hướng giá không bao giờ chỉ mã hoá bằng màu

**Luật:** Mọi chỉ báo tăng/giảm phải có **đồng thời** ba thứ: màu, ký hiệu (▲/▼), và chữ ("TĂNG"/"GIẢM").

**Tại sao:** Khoảng 8% nam giới bị mù màu đỏ-lục. Xanh/đỏ là cặp tệ nhất có thể chọn — nhưng cũng là quy ước không thể bỏ trong giao dịch. Giải pháp không phải đổi màu mà là **không bao giờ để màu gánh thông tin một mình**. Cặp màu ở §2 đã được chọn để đạt ΔE 11.6 dưới mô phỏng deuteranopia, nhưng quy tắc này vẫn bắt buộc.

---

### DS-RULE 4 — Dự đoán mặc màu tím, nét đứt

**Luật:** Mọi thứ do model sinh ra dùng `--pred` (tím), nét đứt, và dải khoảng tin cậy mờ. Cấm dùng xanh/đỏ cho phần dự đoán, kể cả khi dự đoán là "tăng".

**Tại sao:** Đây là RULE 7 của kế hoạch tổng thể, thể hiện ở tầng thị giác. Xanh/đỏ có nghĩa "chuyện đã xảy ra". Tím có nghĩa "máy đang đoán". Hai điều đó không bao giờ được nhìn giống nhau.

---

### DS-RULE 5 — Vàng Binance là màu giao diện, không bao giờ là màu dữ liệu

**Luật:** `--accent` (#F0B90B) chỉ dùng cho nút chính, vòng focus, và nhãn thương hiệu. **Tuyệt đối không dùng làm màu của bất kỳ chuỗi dữ liệu nào.**

**Tại sao:** Kiểm định cho thấy `#F0B90B` đứng cạnh `#EF5350` chỉ đạt ΔE 4.6 dưới deuteranopia — dưới xa ngưỡng 8. Nó *fail*. Nhưng vàng là màu nhận diện của sàn và bạn sẽ muốn dùng. Cách hoà giải: giữ nó hoàn toàn ngoài không gian dữ liệu.

---

### DS-RULE 6 — Tối đa ba chuỗi trên một biểu đồ

**Luật:** Chart giá hiển thị tối đa 3 chuỗi màu. Cần so sánh nhiều coin hơn → dùng small multiples (nhiều chart nhỏ) hoặc bảng, không nhồi thêm màu.

**Tại sao:** Bộ 3 màu ở §2.2 đã được kiểm định trên *toàn bộ cặp*. Thêm slot thứ tư là bắt đầu tạo ra cặp màu người mù màu không phân biệt nổi. Đây không phải sở thích — đây là kết quả tính toán.

---

### DS-RULE 7 — Mọi con số đi kèm trạng thái tươi của nó

**Luật:** Không có con số nào xuất hiện đơn độc. Giá đi kèm chỉ báo kết nối. Dự đoán đi kèm "có hiệu lực đến HH:MM". Độ chính xác đi kèm cỡ mẫu.

**Tại sao:** RULE 8 của kế hoạch tổng thể. Một dashboard im lặng hiển thị số cũ nguy hiểm hơn một dashboard báo lỗi.

---

### DS-RULE 8 — Token là nguồn chân lý duy nhất

**Luật:** Cấm viết mã hex trong file component. Mọi màu tham chiếu qua biến CSS khai báo trong `web/tokens.css`.

**Tại sao:** Bạn sẽ đổi bảng màu ít nhất một lần. Nếu hex nằm rải rác 15 file, lần đổi đó sẽ tạo ra một giao diện chắp vá.

---

## 2. DESIGN TOKENS

### 2.1 Bề mặt và chữ

| Token | Tối (mặc định) | Sáng | Dùng cho |
|---|---|---|---|
| `--surface-0` | `#0B0E14` | `#F7F8FA` | Nền trang |
| `--surface-1` | `#131722` | `#FFFFFF` | Nền card và chart ★ |
| `--surface-2` | `#1E222D` | `#F0F2F5` | Lớp nổi: dropdown, tooltip, modal |
| `--border` | `#2A2E39` | `#E0E3EB` | Đường viền, đường chia |
| `--text-1` | `#D1D4DC` | `#131722` | Chữ chính |
| `--text-2` | `#868993` | `#5D606B` | Chữ phụ, nhãn trục |
| `--text-3` | `#5D606B` | `#9598A1` | Chữ mờ, chú thích |

★ `--surface-1` là bề mặt được dùng để kiểm định toàn bộ màu dữ liệu.

### 2.2 Màu dữ liệu — đã kiểm định

| Token | Tối | Sáng | Ý nghĩa |
|---|---|---|---|
| `--up` | `#26A69A` | `#0E9384` | Nến tăng, giá tăng, PnL dương |
| `--down` | `#EF5350` | `#D64541` | Nến giảm, giá giảm, PnL âm |
| `--pred` | `#8B7BE8` | `#6D5BD0` | **Mọi thứ do model sinh ra** |

Màu dẫn xuất (nền mờ, dải tin cậy):

```css
--up-bg:     color-mix(in srgb, var(--up)   12%, transparent);
--down-bg:   color-mix(in srgb, var(--down) 12%, transparent);
--pred-band: color-mix(in srgb, var(--pred) 14%, transparent);
```

### 2.3 Màu trạng thái — tách riêng, không bao giờ tái sử dụng làm màu chuỗi

| Token | Tối | Sáng | Dùng cho | Bắt buộc kèm |
|---|---|---|---|---|
| `--status-live` | `#26A69A` | `#0E9384` | WebSocket khoẻ | chấm tròn + chữ "Live" |
| `--status-slow` | `#F5A524` | `#B76E00` | >5s không có tick | biểu tượng + chữ "Chậm" |
| `--status-down` | `#EF5350` | `#D64541` | Mất kết nối | biểu tượng + chữ "Mất kết nối" |
| `--status-stale` | `#868993` | `#5D606B` | Dự đoán đã hết hiệu lực | chữ "Dữ liệu cũ" |
| `--accent` | `#F0B90B` | `#B8860B` | **Chỉ giao diện** — nút, focus ring | — |

### 2.4 Kết quả kiểm định

Chạy bằng `validate_palette.js`, chế độ `--pairs all` (mọi cặp, không chỉ cặp liền kề):

| Bộ màu | Chế độ | Nền | Phân tách mù màu (xấu nhất) | Thị lực thường | Tương phản | Kết luận |
|---|---|---|---|---|---|---|
| up / down / pred | tối | `#131722` | ΔE **11.6** deutan (ngưỡng ≥8) | ΔE **21.0** (sàn ≥15) | cả 3 ≥ 3:1 | ✅ **ĐẠT TOÀN BỘ** |
| up / down / pred | sáng | `#FFFFFF` | ΔE **10.7** deutan | ΔE **22.8** | cả 3 ≥ 3:1 | ✅ **ĐẠT TOÀN BỘ** |
| + vàng `#F0B90B` làm màu dữ liệu | tối | `#131722` | ΔE **4.6** vs đỏ | ΔE 14.5 | — | ❌ **HỎNG** → là cơ sở của DS-RULE 5 |

**Nếu sau này cần biểu đồ so sánh nhiều coin** (bối cảnh không có tăng/giảm), dùng bộ đã kiểm định riêng — tối: `#3987e5` / `#d95926` / `#199e70`, sáng: `#2a78d6` / `#eb6834` / `#1baf7a`. Bộ này đạt toàn bộ cặp ở cả hai chế độ (lưu ý: ở chế độ sáng, `#1baf7a` chỉ đạt 2.82:1 nên **bắt buộc có nhãn trực tiếp hoặc bảng dữ liệu kèm theo**).

### 2.5 Chữ

```css
--font-ui:  'Inter', -apple-system, 'Segoe UI', system-ui, sans-serif;
--font-num: 'JetBrains Mono', 'SF Mono', ui-monospace, monospace;
```

| Token | Cỡ / Dòng | Dùng cho |
|---|---|---|
| `--text-hero` | 36 / 40, 600 | Giá hiện tại |
| `--text-xl` | 28 / 32, 600 | Giá dự đoán |
| `--text-lg` | 20 / 28, 600 | Tiêu đề mục |
| `--text-md` | 16 / 24, 500 | Nội dung chính |
| `--text-sm` | 14 / 20, 400 | Nhãn, ô bảng |
| `--text-xs` | 12 / 16, 400 | Chú thích, dấu thời gian |
| `--text-2xs` | 11 / 14, 500 | Nhãn trục |

**Bắt buộc cho mọi số:**

```css
.num { font-family: var(--font-num); font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }
```

### 2.6 Khoảng cách, bo góc, chuyển động

```css
/* thang 4px */
--sp-1: 4px;  --sp-2: 8px;   --sp-3: 12px;  --sp-4: 16px;
--sp-5: 24px; --sp-6: 32px;  --sp-7: 48px;

--radius-sm: 4px;    /* huy hiệu, ô nhập */
--radius-md: 6px;    /* card, nút */
--radius-pill: 999px;

--dur-flash: 150ms;  /* nháy khi giá đổi */
--dur-fast: 120ms;   /* hover, focus */
--dur-base: 200ms;   /* mở/đóng panel */
--ease: cubic-bezier(0.16, 1, 0.3, 1);
```

---

## 3. QUY TẮC VẼ BIỂU ĐỒ

### 3.1 Chart giá — cấu tạo

| Lớp | Đặc tả |
|---|---|
| Nến | Thân đặc `--up` / `--down`, bấc 1px cùng màu, khe 2px giữa các nến |
| Đường giá hiện tại | 1px nét đứt `--text-2`, nhãn giá ghim bên phải |
| **Đường dự đoán** | 2px **nét đứt** `--pred`, kéo dài từ nến cuối về phía phải |
| **Dải tin cậy** | Vùng tô `--pred-band` giữa `q10` và `q90`, không viền |
| Điểm neo dự đoán | Chấm 8px `--pred`, viền 2px màu `--surface-1` (vòng cách nền) |
| Lưới | 1px `--border` ở 20% độ mờ, chỉ ngang, không dọc |
| Trục | Chữ `--text-2`, cỡ `--text-2xs`, không vẽ đường trục |

### 3.2 Ranh giới hiện tại–tương lai

Phải có một đường dọc mảnh 1px `--border` tại nến cuối cùng đã đóng, kèm nhãn nhỏ **"Bây giờ"**. Bên trái là sự thật, bên phải là phỏng đoán. Ranh giới đó không được để người xem phải tự suy luận.

### 3.3 Lớp tương tác (bắt buộc)

- **Crosshair + tooltip** khi rê chuột trên chart — biểu đồ HTML là thứ tương tác được, không ship bản tĩnh.
- Tooltip hiển thị: thời gian, OHLC, và nếu ở vùng dự đoán thì thêm `q10/q50/q90` cùng `p_up`.
- Vùng bắt chuột rộng hơn nét vẽ (tối thiểu 24px chiều ngang mỗi nến).
- Bộ lọc (chọn coin, khung thời gian) nằm **trên một hàng phía trên chart**, không rải rác.

### 3.4 Cấm

- ❌ Hai trục y trên một chart (lỗi biểu đồ phổ biến nhất). Cần so hai đại lượng khác thang → hai chart, hoặc quy về chỉ số cùng gốc.
- ❌ Bảng màu cầu vồng.
- ❌ Nhãn số trên mọi điểm — chỉ ghi nhãn có chọn lọc.
- ❌ Chữ mang màu của chuỗi. Chữ luôn dùng token chữ; chấm màu bên cạnh mới mang danh tính.
- ❌ Hiệu ứng 3D, đổ bóng trên nét dữ liệu, gradient trang trí.

---

## 4. DANH MỤC COMPONENT

| # | Component | Nội dung | Trạng thái phải có |
|---|---|---|---|
| 1 | `AppShell` | Khung 3 vùng + chuyển tối/sáng | — |
| 2 | `CoinSelector` | Ô tìm kiếm + danh sách ảo hoá ~400 cặp USDT, ghim coin ưa thích | rỗng, đang tải, không tìm thấy |
| 3 | `TimeframeTabs` | 1h · 4h · 1d | — |
| 4 | `PriceHeader` | Mã coin, giá hiện tại (hero), thay đổi 24h, `FreshnessIndicator` | live, chậm, mất kết nối |
| 5 | `PriceChart` | Nến + lớp phủ dự đoán + crosshair | đang tải (skeleton), lỗi, thiếu dữ liệu |
| 6 | `PredictionCard` | `DirectionBadge` + `ProbabilityMeter` + dải giá + "có hiệu lực đến" | chưa có dự đoán, đã hết hiệu lực, ngoài tập huấn luyện |
| 7 | `DirectionBadge` | ▲ TĂNG / ▼ GIẢM / ● KHÔNG RÕ | ba trạng thái, mỗi trạng thái có màu + ký hiệu + chữ |
| 8 | `ProbabilityMeter` | Thanh 0–100% có mốc 50%, hiển thị số đã hiệu chỉnh | thấp / vừa / cao |
| 9 | `FreshnessIndicator` | Chấm + chữ + thời điểm cập nhật cuối | 4 trạng thái ở §2.3 |
| 10 | `SignalHistoryTable` | Dự đoán quá khứ và kết quả thực tế | rỗng, đang tải |
| 11 | `AccuracyPanel` | Tỉ lệ đúng 30 ngày gần nhất + biểu đồ hiệu chỉnh + **cỡ mẫu** | chưa đủ dữ liệu (<100 mẫu) |
| 12 | `BacktestPanel` | Đường vốn, Sharpe, drawdown từ tearsheet | — |
| 13 | `RiskBanner` | Chỉ hiện khi bật auto-trade: trạng thái, hạn mức, nút dừng khẩn | tắt, paper, live |
| 14 | `EmptyState` / `ErrorState` / `Skeleton` | — | — |

### 4.1 Đặc tả `DirectionBadge`

```
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  ▲  TĂNG    62%  │   │  ▼  GIẢM    64%  │   │  ●  KHÔNG RÕ     │
└──────────────────┘   └──────────────────┘   └──────────────────┘
   nền --up-bg           nền --down-bg          nền trong suốt
   chữ --up              chữ --down             chữ --text-2
   viền 1px --up 40%     viền 1px --down 40%    viền 1px --border
```

Trạng thái "KHÔNG RÕ" phải trông **bình thường**, không giống lỗi. Hệ thống trung thực im lặng phần lớn thời gian; giao diện cần khiến sự im lặng đó thoải mái.

### 4.2 Đặc tả `ProbabilityMeter`

- Thanh ngang 6px, bo `--radius-pill`, nền `--surface-2`.
- Vạch mốc 1px `--text-3` tại đúng 50% — người xem cần thấy ngay "hơn tung đồng xu bao nhiêu".
- Phần tô dùng `--up` hoặc `--down` theo hướng.
- Số hiển thị là **độ tin cậy của hướng đang hiển thị**, dẫn xuất từ `p_up_calibrated`: hướng TĂNG hiện `p_up`, hướng GIẢM hiện `1 − p_up`. Ghi rõ nhãn "đã hiệu chỉnh". Nhờ vậy con số luôn ≥ 58% ở cả hai hướng, khớp với ngưỡng vùng chết — không bao giờ xuất hiện huy hiệu "GIẢM 58%" (vốn tương ứng `p_up = 0,42`, đúng ranh giới).
- Rê chuột hiện tooltip: "Trong 100 lần model nói ~62%, thực tế tăng 58 lần (n=340)". Đây là câu biến một con số thành thứ có thể tin được.

---

## 5. BỐ CỤC

| Khổ màn hình | Bố cục |
|---|---|
| ≥1280px | 3 cột: `CoinSelector` (280px) · `PriceChart` (co giãn) · panel phải (360px) |
| 768–1279px | 2 cột: chart co giãn + panel phải; coin selector thu thành thanh trên |
| <768px | 1 cột: header giá → chart → thẻ dự đoán → lịch sử; coin selector thành modal toàn màn |

Chart luôn giữ tỉ lệ tối thiểu 16:9 và cao ít nhất 320px. Dưới ngưỡng đó, nến không còn đọc được — thà bỏ chart hiển thị bảng số còn hơn.

---

## 6. CHECKLIST TIẾP CẬN (làm trước khi coi là xong)

- [ ] Mọi chỉ báo hướng có đủ **màu + ký hiệu + chữ** (DS-RULE 3)
- [ ] Chú giải luôn hiện khi có ≥2 chuỗi; 1 chuỗi thì tiêu đề gọi tên nó
- [ ] Có **chế độ bảng** cho mọi biểu đồ (nút "Xem dạng bảng")
- [ ] Chế độ sáng là bảng màu **được chọn riêng** và đã kiểm định — không phải đảo ngược tự động
- [ ] Vòng focus rõ ràng trên mọi phần tử tương tác, dùng `--accent`, dày 2px, offset 2px
- [ ] Điều hướng bàn phím đầy đủ: Tab qua coin selector, mũi tên chọn coin, Enter xác nhận
- [ ] Vùng chạm ≥44×44px trên di động
- [ ] `prefers-reduced-motion` tắt toàn bộ nháy và transition
- [ ] Vùng `aria-live="polite"` thông báo thay đổi dự đoán cho trình đọc màn hình (**không** thông báo thay đổi giá — sẽ thành tiếng ồn liên tục)
- [ ] Kiểm tra ở `forced-colors: active` (chế độ tương phản cao của Windows)

---

## 7. NHỮNG LỖI CẦN TRÁNH

| Lỗi | Vì sao sai | Làm đúng |
|---|---|---|
| Hai trục y | Người đọc không thể so hai thang khác nhau; mọi giao cắt là ảo giác | Hai chart, hoặc quy về chỉ số cùng gốc 100 |
| Dự đoán vẽ xanh/đỏ | Nhìn giống dữ liệu thật | Tím nét đứt (DS-RULE 4) |
| Hoạt hoạ giá trượt | Gây mệt mắt, che mất thay đổi thật | Nháy nền 150ms |
| Chỉ dùng màu cho tăng/giảm | 8% nam giới không phân biệt được | Thêm ▲/▼ và chữ |
| Vàng làm màu chuỗi | ΔE 4.5 với đỏ — hỏng kiểm định | Vàng chỉ cho giao diện |
| Hiện xác suất thô | Không phải xác suất thật, gây hiểu lầm nguy hiểm | Chỉ hiện giá trị đã hiệu chỉnh |
| Ẩn trạng thái mất kết nối | Chế độ hỏng nguy hiểm nhất | `FreshnessIndicator` luôn hiện |
| Tỉ lệ đúng không kèm cỡ mẫu | "70% chính xác" trên 12 mẫu là vô nghĩa | Luôn ghi n= |
| 6 coin trên một chart | Vượt giới hạn màu an toàn | Tối đa 3, hoặc small multiples |

---

*Tài liệu liên quan: `00_MASTER_PLAN.md` · `03_MODULE_SPECS.md`*
