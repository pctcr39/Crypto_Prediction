---
name: visualize-dashboard
description: Quy tắc thiết kế và dựng giao diện dashboard cho repo cryptopred.
  Dùng khi người dùng yêu cầu dựng dashboard, vẽ chart, biểu đồ nến, hiển thị
  dự đoán, component UI (badge, meter, freshness), prototype giao diện, sửa
  web/, hay bất kỳ việc visualize dữ liệu nào. Bảo đảm mọi pixel tuân
  docs/Old/02_DESIGN_SYSTEM.md — màu chỉ từ tokens.css, dự đoán tím nét đứt,
  hướng không bao giờ chỉ mã hoá bằng màu, luôn hiển thị độ tươi dữ liệu.
---

# Visualize Dashboard — luật giao diện của repo này

Nguồn chân lý: `docs/Old/02_DESIGN_SYSTEM.md` (đặc tả) + `web/tokens.css` (giá trị).
Skill này là bản checklist thao tác — khi mâu thuẫn, 02 thắng.

## 0 · Trước khi vẽ bất cứ thứ gì

1. Nạp skill `dataviz` nếu sắp viết code chart — quy trình 7 bước của nó áp
   dụng nguyên vẹn; design system này chỉ là bộ tham số cắm vào.
2. Prototype dạng **artifact trước, code thật sau** (03 §M11). Prototype đặt ở
   `docs/design/`, code thật ở `web/` — không trộn.
3. Màu **chỉ** lấy từ `var(--token)`. Thấy mã hex trong file ngoài `tokens.css`
   là lỗi (DS-RULE 8). Bộ up/down/pred đã validate ΔE deutan 11.6 (tối) /
   10.7 (sáng) — đừng "tinh chỉnh" màu, sẽ phá kiểm định.

## 1 · Tám luật DS — bản rút gọn thao tác

| # | Luật | Trong code nghĩa là |
|---|---|---|
| 1 | Số dùng chữ số đều bề rộng | mọi con số có class `.num` (JetBrains Mono + `tabular-nums`) |
| 2 | Không hoạt hoạ vị trí khi giá đổi | chỉ nháy nền 150ms (`--dur-flash`); cấm transition trên `top/left/transform` của số |
| 3 | Hướng không bao giờ chỉ bằng màu | badge luôn đủ bộ ba: màu + ký hiệu ▲/▼/● + chữ TĂNG/GIẢM/KHÔNG RÕ |
| 4 | Dự đoán mặc tím, nét đứt | mọi thứ model sinh ra dùng `--pred` + dash; **không bao giờ** xanh/đỏ |
| 5 | Vàng Binance chỉ cho giao diện | `--accent` cho nút/focus ring; cấm làm màu dữ liệu (ΔE 4.5 với đỏ — hỏng) |
| 6 | Tối đa 3 chuỗi một chart | quá 3 → small multiples; bộ so sánh riêng `--series-1..3` |
| 7 | Mọi số kèm trạng thái tươi | `FreshnessIndicator` 4 trạng thái luôn hiện; mất kết nối → giá xám + timestamp cuối |
| 8 | Token là nguồn chân lý duy nhất | xem §0.3 |

## 2 · Chart giá — cấu tạo bắt buộc (02 §3)

- Nến: thân đặc `--up`/`--down`, bấc 1px cùng màu, khe 2px giữa nến.
- Đường dự đoán: **2px nét đứt `--pred`** từ nến cuối sang phải; dải tin cậy
  q10–q90 tô `--pred-band` không viền; điểm neo 8px viền 2px `--surface-1`.
- **Ranh giới "Bây giờ"**: đường dọc 1px `--border` tại nến đóng cuối + nhãn.
  Bên trái sự thật, bên phải phỏng đoán — người xem không phải tự suy luận.
- Lưới: chỉ ngang, 1px `--border` 20% mờ. Trục: chữ `--text-2xs`, không vẽ đường trục.
- **Crosshair + tooltip bắt buộc** — chart HTML là thứ tương tác được. Tooltip:
  thời gian + OHLC; vào vùng dự đoán thêm q10/q50/q90 + p_up. Vùng bắt chuột
  ≥24px/nến. Bộ lọc (coin, khung) nằm một hàng trên chart.
- Cấm: hai trục y · cầu vồng · nhãn số mọi điểm · chữ mang màu chuỗi · 3D/bóng/gradient.

## 3 · Component — 14 mục theo 02 §4, mỗi cái đủ trạng thái

Bảng đầy đủ ở 02 §4. Ba đặc tả hay làm sai:

- **DirectionBadge**: "KHÔNG RÕ" phải trông *bình thường*, không giống lỗi —
  hệ thống trung thực im lặng phần lớn thời gian.
- **ProbabilityMeter**: thanh 6px, vạch mốc tại đúng 50%; số hiển thị là độ tin
  cậy của *hướng đang hiện* (GIẢM hiện `1−p_up`), luôn kèm nhãn "đã hiệu chỉnh";
  tooltip dịch nghĩa: "Trong 100 lần model nói ~62%, thực tế tăng 58 lần (n=340)".
- **AccuracyPanel**: tỉ lệ đúng **luôn kèm n=**; <100 mẫu → trạng thái "chưa đủ dữ liệu".

Coin ngoài tập huấn luyện → nhãn "Ngoài tập huấn luyện — độ tin cậy thấp hơn"
(trung thực là yêu cầu thiết kế, 00 §4.2).

## 4 · Bố cục & theme

- ≥1280px: 3 cột (selector 280px · chart co giãn · panel 360px); 768–1279: 2 cột;
  <768: 1 cột. Chart tối thiểu cao 320px — dưới ngưỡng đó thà hiện bảng số.
- Tối là mặc định; **sáng là bảng màu được chọn riêng đã kiểm định**, không phải
  đảo tự động. Cả hai bộ nằm sẵn trong `tokens.css`.
- Canvas/JS đọc màu bằng `getComputedStyle` lúc vẽ, vẽ lại khi đổi theme.

## 5 · Checklist trước khi báo xong (02 §6 — tick đủ mới xong)

- [ ] Hướng đủ màu + ký hiệu + chữ  ·  [ ] `.num` cho mọi số
- [ ] Chế độ bảng cho mọi biểu đồ ("Xem dạng bảng")
- [ ] Focus ring `--accent` 2px offset 2px, điều hướng bàn phím đủ
- [ ] `prefers-reduced-motion` tắt toàn bộ nháy/transition
- [ ] `aria-live="polite"` cho thay đổi dự đoán (KHÔNG cho thay đổi giá)
- [ ] Vùng chạm ≥44×44px  ·  [ ] Chạy được cả hai theme  ·  [ ] Freshness luôn hiện
- Đổi màu dữ liệu → chạy lại `validate_palette.js` (dataviz skill), không eyeball.

## 6 · Ba luồng dữ liệu — không trộn (khi nối dashboard thật, M11)

`priceStream.js` (WS Binance thẳng, không qua backend) · `predictionStream.js`
(WS backend, chỉ khi nến đóng) · `history.js` (REST một lần lúc mở trang).
Backend chết thì giá vẫn chạy — đó là thiết kế, giữ nguyên.
