# CHÍN PHƯƠNG PHÁP GIAO DỊCH — PHÂN TÍCH, KỊCH BẢN ÁP DỤNG, VÀ MỨC ĐỘ KHẢ THI

> Phiên bản 2.0 · 26/08/2026
> Trả lời bốn câu hỏi: ① mỗi phương pháp có gì thật? ② phần thật đó cắm vào chỗ nào trong module Prediction dưới dạng quy tắc? ③ **kịch bản áp dụng nào phù hợp nhất?** ④ **khả thi tới mức nào khi bắt tay vào làm?**
> Quan hệ: `07` (họ tín hiệu) · `08` (kiến trúc chiến lược) · `09` (review đã qua phản biện đối kháng) · **`10` (kiến trúc phần dự đoán — tài liệu này là lớp áp dụng của nó)**
> Mọi con số trong Phần 2 và Phần 7 **tính lại độc lập trong phiên này**. **Không phải lời khuyên đầu tư.**

**Quy ước tên gọi:** tài liệu này gọi đầy đủ tên từng phương pháp ở mọi lần nhắc tới. Không dùng ký hiệu rút gọn.

---

# PHẦN 0 · KẾT LUẬN TRONG MỘT TRANG

## 0.1 · Ba phát hiện quyết định

**Phát hiện thứ nhất — Hợp đồng vĩnh cửu có một cái sàn không hạ được.**

Đạo hàm bảng chi phí theo thời gian nắm giữ ra hết:

```
Trên hợp đồng vĩnh cửu:
    p*(d) = 50% + (c₀ + f·d) / (2·A·√d)
    ⟹  thời gian nắm giữ tối ưu:  d* = c₀ / f
    ⟹  ngưỡng thắng thấp nhất có thể đạt:  p*_min = 50% + √(c₀·f) / A
```

trong đó `c₀` là phí khứ hồi, `f` là funding mỗi ngày, `A` là biên độ kỳ vọng trên một ngày, `d` là số ngày nắm giữ.

| | Kết quả |
|---|---|
| Hợp đồng vĩnh cửu, funding nền | **ngưỡng thắng thấp nhất ≈ 52,8 – 53,6%** (tối ưu tại 6,7 ngày) |
| Hợp đồng vĩnh cửu, funding nóng | 56,2 – 58,1% |
| Giao ngay | **không có sàn** — 7 ngày 52,4% · 30 ngày 51,2% · 90 ngày 50,7% |
| Trần năng lực dự báo hướng đo được | **52 – 56%** khung ngày |

Cái sàn đó **bất biến theo tài sản**: đồng biến động cao hạ được `A`, nhưng trượt giá nâng `c₀` đúng bằng phần đó. Thử qua năm lớp thanh khoản, sàn đứng yên quanh 53%. **Không mua được biên bằng cách đổi đồng.**

**Phát hiện thứ hai — bạn không thể tự chứng minh edge định hướng trong đời dự án này.**

Để chứng minh win-rate thật 35% vượt hoà vốn 27,5% (một phía, α = 0,05, công suất 80%) cần **229 lệnh độc lập**. Bốn mươi cặp tương quan 0,9 chỉ cho **1,11 "đồng độc lập"**, tức khoảng **17 lệnh hiệu dụng mỗi năm**.

| Tương quan giả định | Lệnh hiệu dụng/năm | **Số năm để đủ công suất** |
|---|---|---|
| 0,9 (thực tế crypto) | 16,6 | **13,8 năm** |
| 0,5 (lạc quan) | 29,3 | 7,8 năm |
| 0,3 (rất lạc quan) | 47,2 | 4,9 năm |

Với ba năm dữ liệu bốn mươi cặp, công suất thống kê thực tế chỉ **33 – 63%**, trong khi chuẩn là 80%.

> **Hệ quả không thể né:** GATE 1 **không phải và không thể là** một phép chứng minh có edge. Nó chỉ là **màng lọc chống thất bại hiển nhiên**. Bất kỳ kiến trúc nào cần "chứng minh edge trước khi đi tiếp" sẽ không bao giờ đi tiếp. Đối chiếu: mô hình biến động chỉ cần **11 quan sát** để chứng minh R² = 0,5 — **ít hơn 21 lần**. Đây là con số "chênh 100 lần" của `10 §0` dịch sang đơn vị *thời gian để biết*.

**Phát hiện thứ ba — bạn đang MƯỢN bằng chứng, không tạo ra nó.**

Từ hai phát hiện trên suy ra một điều về nhận thức luận, và nó chi phối toàn bộ lựa chọn phương pháp:

> Vì bạn không đủ dữ liệu để tự chứng minh, mọi quy tắc định hướng bạn chạy đều đứng trên **bằng chứng bên ngoài** chứ không phải bằng chứng của bạn.
> ⟹ **Chỉ được phép chạy quy tắc nào có bằng chứng ngoại sinh dày.** Một quy tắc bạn tự nghĩ ra, dù backtest đẹp, không có gì đỡ nó cả.

Điều này giải thích vì sao **Phương Pháp 4: Position Trading & Trend Following** thắng: nó có literature nhiều thập kỷ, qua nhiều lớp tài sản, ngoài crypto. Và vì sao mọi biến thể "sáng tạo" của **Phương Pháp 5: Smart Money Concepts & Price Action Hiện Đại** thua: chúng chỉ có backtest của chính người bán.

## 0.2 · Bảng phán quyết chín phương pháp

| Phương pháp | Điểm quy tắc hoá | Vai trò trong module Prediction |
|---|---|---|
| **Phương Pháp 1: Scalping (Lướt Sóng Siêu Ngắn)** | 0/5 | **Loại** — giữ hai quy tắc né thời điểm thực thi |
| **Phương Pháp 2: Day Trading (Giao Dịch Trong Ngày)** | 1/5 | **Chỉ hiển thị** — nowcast biến động, không phát ý định giao dịch |
| **Phương Pháp 3: Swing Trading (Giao Dịch Theo Sóng Trung Hạn)** | 4/5 phần lõi | **Chân trời + cấu trúc điểm vào** |
| **Phương Pháp 4: Position Trading & Trend Following (Giao Dịch Vị Thế & Chu Kỳ)** | **5/5** | **Quy tắc hướng sơ cấp ★** |
| **Phương Pháp 5: Smart Money Concepts & Price Action Hiện Đại** | 4/5 sau khi lột bỏ | **Ba đặc trưng** |
| **Phương Pháp 6: Order Flow, Volume Profile & Liquidation Heatmap** | 4/5 · 3/5 · **0/5** | **Hai đặc trưng** · chờ · **loại** |
| **Phương Pháp 7: Funding Rate & Cash-and-Carry Arbitrage (Delta-Neutral)** | **5/5 với vai trò hàm chi phí** | **Hàm chi phí ★★** + hai đặc trưng + sản phẩm riêng |
| **Phương Pháp 8: On-Chain & Narrative Trading (Săn Altcoin & Theo Dấu Cá Mập)** | 1/5 · **5/5 nhưng bị khoá** | Bối cảnh · **quy tắc hướng thay thế, khoá 12 tháng** |
| **Phương Pháp 9: Dynamic DCA & Grid Trading (Chiến Lược Tích Lũy Bán Tự Động)** | 3/5 · 0/5 · 5/5 | Sản phẩm hoãn · **loại** · **đối chứng** |

## 0.3 · Kịch bản khuyến nghị, một dòng

> **Đài quan trắc biến động trước, rồi Theo Xu Hướng trên giao ngay** — dùng **Phương Pháp 4: Position Trading & Trend Following** làm quy tắc hướng, **Phương Pháp 7: Funding Rate & Cash-and-Carry Arbitrage** làm hàm chi phí (không phải làm tín hiệu), **Phương Pháp 3: Swing Trading** đóng góp cấu trúc điểm vào, **Phương Pháp 6 (nhánh Order Flow)** và **Phương Pháp 5** đóng góp năm suất đặc trưng cho lớp lọc, **Phương Pháp 9 (nhánh Dollar-Cost Averaging mua và giữ)** làm đối chứng trung thực nhất.

Chi tiết ở **Phần 6**, chấm khả thi ở **Phần 7**.

---

# PHẦN 1 · SỬA TRỤC TRƯỚC KHI PHÂN TÍCH

Chín phương pháp không nằm trên cùng một trục. Xếp chung một danh sách là lỗi phân loại, và chính lỗi đó khiến người ta so **Phương Pháp 1: Scalping** với **Phương Pháp 7: Funding Rate & Cash-and-Carry Arbitrage** như thể phải chọn một trong hai.

| Nhóm trục | Gồm | Câu hỏi thật sự đang hỏi |
|---|---|---|
| **Trục A · Chân trời thời gian** | Phương Pháp 1: Scalping · Phương Pháp 2: Day Trading · Phương Pháp 3: Swing Trading · Phương Pháp 4: Position Trading & Trend Following | *Giữ lệnh bao lâu?* — quyết định bằng **số học phí**, không bằng sở thích |
| **Trục B · Nguồn tín hiệu** | Phương Pháp 5: Smart Money Concepts · Phương Pháp 6: Order Flow, Volume Profile & Liquidation Heatmap · Phương Pháp 8: On-Chain & Narrative Trading | *Nhìn vào đâu?* — mỗi cái là **nhà cung cấp đặc trưng**, không phải chiến lược |
| **Trục C · Phi định hướng** | Phương Pháp 7: Funding Rate & Cash-and-Carry Arbitrage · Phương Pháp 9: Dynamic DCA & Grid Trading | *Không đoán hướng thì kiếm tiền bằng gì?* — **sản phẩm khác**, nằm ngoài module Prediction |

> **Sai lầm phổ biến nhất do trộn trục:** người ta chọn "phong cách swing" rồi mới đi tìm tín hiệu. Thứ tự đúng ngược lại — **chọn chân trời bằng bảng phí trước**, vì chân trời quyết định *ngưỡng đúng cần đạt*, còn tín hiệu chỉ quyết định *có đạt được hay không*. Chọn sai chân trời thì tín hiệu tốt đến mấy cũng vô nghĩa.

---

# PHẦN 2 · HAI BẤT BIẾN SỐ HỌC GIẢI QUYẾT NỬA DANH SÁCH

## 2.1 · Bức tường phí theo tần suất — trục A bị đóng khung trước khi bàn tới tín hiệu

Phí khứ hồi: giao ngay 0,30% (taker 0,10% × 2 + trượt giá 0,05% × 2) · hợp đồng vĩnh cửu 0,20%. Biên độ kỳ vọng neo tại số đo thật của `09 §3.2`.

| Phương pháp | Biên độ kỳ vọng | Ngưỡng thắng cần — giao ngay | Ngưỡng thắng cần — vĩnh cửu | **Tiền phí mỗi năm (giao ngay)** |
|---|---|---|---|---|
| **Phương Pháp 1: Scalping** — 10 lệnh/ngày, chân trời 1 phút | 0,045% | **383,3%** | **272,2%** | **1.095%** |
| **Phương Pháp 2: Day Trading** — 1 lệnh/ngày, chân trời 4 giờ | 0,77% | 69,5% | 63,0% | **109,5%** |
| **Phương Pháp 3: Swing Trading** — 3 lệnh/tháng, chân trời 1 ngày | 2,33% | 56,4% | 54,3% | 10,8% |
| **Phương Pháp 3: Swing Trading** — 1 lệnh/tuần, chân trời 1 tuần | 6,58% | **52,3%** | 51,5% | 15,6% |
| **Phương Pháp 4: Position Trading & Trend Following** — 15 lệnh/năm | 13,8% | **51,1%** | 50,7% | **4,5%** |
| | | *trần năng lực đo được* | **52 – 56%** | |

> Ngưỡng thắng **vượt 100%** không có nghĩa "rất khó" — nó có nghĩa **không tồn tại**: đoán đúng cả 100% số lần vẫn lỗ. **Phương Pháp 1: Scalping** nằm ở đó. Đây là mệnh đề **số học**, không phải ý kiến về kỹ năng của ai.

## 2.2 · Chi phí là hàm của thời gian nắm giữ — và hợp đồng vĩnh cửu có sàn

`10 §1.1` phát hiện chi phí phải là hàm thời gian nắm giữ. Đạo hàm nó ra hết:

```
p*(d) = 50 + (c₀ + f·d) / (2·A·√d)
d/dd = 0  ⟺  f·d = c₀   ⟹   d* = c₀/f   ⟹   p*_min = 50 + √(c₀·f)/A
```

| Giữ (ngày) | Biên độ kỳ vọng | Giao ngay | Vĩnh cửu, chỉ phí | Vĩnh cửu + funding **nền** | Vĩnh cửu + funding **nóng** |
|---|---|---|---|---|---|
| 1 | 2,33% | 56,4% | 54,3% | 54,9% | 57,5% |
| 3 | 4,04% | 53,7% | 52,5% | 53,6% | 58,1% |
| **6,7** ← tối ưu | 6,02% | 52,5% | 51,7% | **53,3%** ← sàn | — |
| 7 | 6,16% | **52,4%** | 51,6% | 53,3% | 60,1% |
| 14 | 8,72% | 51,7% | 51,1% | 53,6% | 63,2% |
| **35** *(Trend Following)* | 13,78% | **51,1%** | 50,7% | 54,5% | **69,8%** |
| 90 | 22,10% | 50,7% | 50,5% | 56,6% | 81,0% |

> *Ghi chú neo số:* mục 2.1 dùng **biên độ đo trực tiếp tại từng khung** (`09 §3.2`), mục 2.2 dùng **co giãn theo căn bậc hai thời gian** từ mức ngày 2,33%. Hai cách lệch nhau khoảng 0,1 điểm ở khung tuần (6,58% so với 6,16%). Giữ cả hai có chủ ý: cách một trung thực với dữ liệu, cách hai cho phép đạo hàm ra thời gian nắm giữ tối ưu. Chênh lệch nhỏ hơn mọi biên đang bàn.

**Ba điều đọc ra:**

1. **Giao ngay đơn điệu giảm — hợp đồng vĩnh cửu hình chữ U.** Kéo dài chân trời là nước cờ **luôn đúng trên giao ngay**, và **chỉ đúng tới 6,7 ngày trên hợp đồng vĩnh cửu**.
2. **Theo xu hướng bằng hợp đồng vĩnh cửu là kết hợp tệ nhất có thể.** Giữ 35 ngày với funding nóng cho ngưỡng thắng 69,8%. Và `09 §2` đã đo trên toàn bộ lịch sử funding kéo từ giao diện lập trình của Binance: **sau cực trị funding dương, giá TIẾP DIỄN tăng**. Nghĩa là hệ theo xu hướng mua vào và nắm giữ **chính xác vào lúc funding đắt nhất**. Hai sự thật này **nhân nhau**, không cộng.
3. Con số Sharpe sau phí 1,07 – 1,32 đã được kiểm là số của cấu hình **giao ngay, chỉ mua hoặc đứng ngoài**. Chuyển sang hợp đồng vĩnh cửu không phải "tối ưu phí" — là **đổi bài toán**.

**Quy tắc chọn công cụ, dạng công thức đóng:**

```
giao ngay rẻ hơn hợp đồng vĩnh cửu  ⟺  d > (c_giao_ngay − c_vĩnh_cửu) / f
                                     = 3,33 ngày  (funding nền)
                                     = 0,67 ngày  (funding nóng)
```

## 2.3 · Sàn của hợp đồng vĩnh cửu bất biến theo tài sản — bịt luôn đường lách

Phản bác hiển nhiên: *"chọn đồng biến động cao, biên độ lớn thì sàn hạ xuống."* Đo thử:

| Tài sản | Biên độ 1 ngày | Phí khứ hồi kèm trượt giá thực tế (`08 §E2`) | Sàn — funding nền | Sàn — funding nóng |
|---|---|---|---|---|
| Bitcoin (trượt 0,02%) | 2,33% | 0,14% | 52,8% | 56,2% |
| Bitcoin (giả định repo 0,05%) | 2,33% | 0,20% | 53,3% | 57,4% |
| Altcoin top 20 (trượt 0,08%) | 3,20% | 0,26% | 52,8% | 56,2% |
| Altcoin top 50 (trượt 0,20%) | 4,00% | 0,50% | 53,1% | 56,8% |
| Altcoin ngoài top 50 (trượt 0,50%) | 5,00% | 1,10% | 53,6% | 58,1% |

> **Sàn đứng yên quanh 53% qua toàn bộ phổ thanh khoản.** Vì sàn tỉ lệ với `√c₀ / A`, mà trượt giá tăng gần tuyến tính theo biến động — hai hiệu ứng triệt tiêu nhau. Đây là kết quả **bền vững**, không phải trùng hợp.

---

# PHẦN 3 · NĂM TIÊU CHÍ "CÓ PHẢI QUY TẮC KHÔNG"

Một phương pháp **quy tắc hoá được** khi và chỉ khi cả năm điều sau đúng.

| Tiêu chí | Nội dung | Cách kiểm |
|---|---|---|
| **Tiêu chí 1 · Đầu vào khách quan** | Tính được từ dữ liệu nến, funding, khối lượng hợp đồng mở — không cần mắt người | Thử viết mã từ đúng bản mô tả |
| **Tiêu chí 2 · Tái lập giữa hai người cài đặt** ★ | Hai người cài đặt độc lập cho **cùng kết quả trên ≥95% số nến** | *Phép thử phân biệt mạnh nhất* |
| **Tiêu chí 3 · Ít hơn hoặc bằng ba tham số tự do** | Số quan sát hiệu dụng chỉ vài trăm | Mỗi tham số là một bậc tự do để tự lừa |
| **Tiêu chí 4 · Bác bỏ được** | Có ngưỡng thất bại viết trước, so với tỉ lệ nền khớp cửa sổ | Đăng ký trước, kiểm soát tỉ lệ phát hiện sai |
| **Tiêu chí 5 · Sống qua bức tường phí của chính chân trời nó** | | Bảng 2.1 |

> **Tiêu chí 2 là con dao mổ.** Phần lớn nội dung của **Phương Pháp 5: Smart Money Concepts & Price Action Hiện Đại** chết ở đây chứ không phải ở tiêu chí phí: đưa cùng một bản mô tả "order block" cho hai người, họ khoanh ra hai tập nến khác nhau. Một khái niệm không tái lập được **không phải quy tắc** — nó là một câu chuyện, và câu chuyện thì luôn khớp dữ liệu sau khi đã biết đáp án.
>
> **Tiêu chí 3 là con dao thứ hai.** Một "quy tắc" tám tham số chạy trên bốn trăm sự kiện hiệu dụng không phải quy tắc — đó là một mô hình dung lượng cao được nguỵ trang bằng câu chữ, và nó khớp quá mức y hệt một cây quyết định hai nghìn nhánh, chỉ khác là không ai kiểm định nó.

---

# PHẦN 4 · PHÁN QUYẾT NGẮN TỪNG PHƯƠNG PHÁP

Phần này nêu kết luận. **Bốn phương pháp phù hợp nhất được trình bày chi tiết ở Phần 5.**

## Phương Pháp 1: Scalping (Lướt Sóng Siêu Ngắn) — loại bằng số học

**Điều trớ trêu nhất của cả lĩnh vực nằm ở đây:** độ chính xác dự đoán **cao nhất từng đo được** thuộc về chân trời này — mất cân bằng dòng lệnh dự báo hướng giá giữa vài tick đạt **60 – 75%** (Cont 2014; DeepLOB). Cao gấp rưỡi bất cứ thứ gì ở khung ngày.

**Và nó vô dụng, vì lý do không sửa được:** biên độ ở chân trời đó là **1 – 5 điểm cơ bản**, phí là **10 – 25 điểm cơ bản**. Đúng 70% × 3 điểm − 30% × 3 điểm = +1,2 điểm mỗi lệnh, trừ 20 điểm phí = **−18,8 điểm**. Không phiên bản nào của "làm tốt hơn" cứu được.

**Toán đòn bẩy — chỗ người Việt mất tiền nhiều nhất (`09 §6.1`):**
- Đòn bẩy 125 lần: phí tính trên giá trị danh nghĩa ⇒ khứ hồi 0,10% danh nghĩa = **12,5% ký quỹ mỗi lệnh**
- Đòn bẩy 125 lần: thanh lý khi giá đi ngược **0,4 – 0,8%** — đúng bằng độ lệch chuẩn một giờ của Bitcoin (0,53 – 0,75%). **Nhiễu ngẫu nhiên đủ giết lệnh trước khi bạn kịp sai.**
- Chốt lời bằng cắt lỗ bằng 0,5% với phí 0,2%: hoà vốn cần thắng **đúng 70,0%**

**Chấm năm tiêu chí:** 1 ✅ · 2 ✅ · 3 ✅ · 4 ✅ · **5 ❌**. Bốn trên năm — và đó chính là **cái bẫy**: phương pháp này *rất dễ viết mã*, backtest chạy trong hai mươi giây và trông tuyệt vời **trước phí**. Độ dễ viết mã không phải bằng chứng khả thi.

| | |
|---|---|
| **Vai trò** | **Loại** khỏi tầng dự đoán · giữ **hai quy tắc thời điểm thực thi**: né phút funding 00:00 / 08:00 / 16:00 UTC · né khung 02:00 – 06:00 UTC thanh khoản mỏng |
| **Điểm quy tắc hoá** | **0/5** |
| **Phải làm gì** | Không phải "kỷ luật không lướt sóng" mà là **chặn bằng mã** — Hàng rào 1, Phần 8 |

## Phương Pháp 2: Day Trading (Giao Dịch Trong Ngày) — giao của «đủ lãi» và «đáng tin» là tập rỗng

**Phần thật:** nhịp phiên Á – Âu – Mỹ có thật (thị trường chạy 24/7 nhưng **dòng tiền thì không**); biến động trong ngày dự báo được tốt.

**Vì sao vẫn chết:** khung 4 giờ cho ngưỡng thắng cần **63,0 – 69,5%**, trong khi trần năng lực là 51 – 53% và `RULE 11` của repo **giả định có rò rỉ** với mọi kết quả vượt 60%. Nghĩa là: một mô hình khung 4 giờ đủ tốt để có lãi sẽ **tự động bị chính hệ kiểm định của repo tuyên là hỏng**. Đây không phải tập hẹp — là **tập rỗng**. Bốn trường phái kiến trúc độc lập ra cùng kết luận (`10 §1.1`).

Cộng thêm: một lệnh mỗi ngày là **109,5% mỗi năm tiền phí giao ngay**.

**Phần thật còn lại, và nó không nhỏ:** ở khung 1 giờ và 4 giờ, **độ lệch chuẩn dự báo và dải giá vẫn dự báo được với R² 0,4 – 0,6**. Nowcast biến động là sản phẩm thật ở khung này. Chỉ *ý định giao dịch* là không.

| | |
|---|---|
| **Vai trò** | **Chỉ hiển thị** — khung 1 giờ và 4 giờ khoá thành output nowcast (`10 mandate 5`, sẽ thành ADR-002) + hai quy tắc thời điểm |
| **Điểm quy tắc hoá** | **1/5** |
| **Yêu cầu giao diện** | Panel 1 giờ và 4 giờ phải in **ngưỡng thắng cần** ngay cạnh xác suất tăng, để người dùng **thấy** vì sao nó im lặng chứ không phải đoán rằng hệ thống hỏng |

## Phương Pháp 5: Smart Money Concepts & Price Action Hiện Đại — giữ ba đặc trưng, vứt toàn bộ hệ thuật ngữ

**Phần THẬT, có literature độc lập:** dừng lỗ cụm ngoài số tròn và ngoài đỉnh/đáy gần nhất — Osler (2000, 2003), đăng trên *Journal of Finance*, dữ liệu sổ lệnh ngoại hối thật. Đây là nền kinh tế học của toàn bộ trường phái, và nó vững. Cộng thêm: quét thanh khoản rồi lấy lại (sweep-then-reclaim) là hiện tượng đo được, và hiệu ứng phiên có thật.

**Phần HUYỀN HỌC, và vì sao:**

| Khái niệm | Vì sao sập |
|---|---|
| *Order block* = "một nến dấu chân tổ chức" | Tổ chức đi lệnh chia nhỏ theo thời gian qua hàng giờ. **Không nến nào là dấu chân của họ.** Cơ chế sai từ gốc, không phải "khó đo". |
| *Fair Value Gap phải được lấp* | **Bẫy tỉ lệ nền:** mọi mức giá đều được thăm lại nếu chờ đủ lâu. Mệnh đề không có nội dung cho tới khi kèm cửa sổ thời gian và so với tỉ lệ nền khớp. |
| *Premium/discount array*, *killzone* có tên riêng | Đổi tên cho hiệu ứng phiên đã biết rồi bán lại. |

**Ba đặc trưng sống sót** được đặc tả chi tiết ở **mục 5.5**.

| | |
|---|---|
| **Vai trò** | **Ba suất đặc trưng** cho lớp lọc, sau khi qua kiểm soát tỉ lệ phát hiện sai |
| **Điểm quy tắc hoá** | **4/5** cho ba đặc trưng sống sót · **0/5** cho hệ thuật ngữ |
| **Bắt buộc kèm** | **Cấm định danh trong mã nguồn** — Hàng rào 2, Phần 8 |

## Phương Pháp 6: Order Flow, Volume Profile & Liquidation Heatmap — ba thứ rất khác nhau bị gộp

**Nhánh Order Flow** là ứng viên đặc trưng tốt nhất trong cả nhóm bán lẻ — đặc tả chi tiết ở **mục 5.4**.

**Nhánh Volume Profile:** khoảng cách tới điểm kiểm soát khối lượng ba mươi ngày viết mã được, không phụ thuộc thang giá, đạt tiêu chí 1 đến 3. Nhưng bằng chứng mỏng và **cộng tuyến nặng với khoảng cách tới đỉnh/đáy gần nhất** — nó phần lớn mô tả lại cùng một sự thật. Vào **danh sách chờ**, không vào mười tám suất.

**Nhánh Liquidation Heatmap — cái "không" mạnh nhất trong cả chín phương pháp.** Ba lý do độc lập, mỗi lý do tự nó đủ:

1. **Nguồn dữ liệu chứng minh được là thiếu.** Luồng dữ liệu lệnh thanh lý của Binance bị **giới hạn một lệnh mỗi giây từ năm 2021** (xác nhận qua tài liệu lập trình viên của Binance, `09 §7`). Mọi bản đồ nhiệt thương mại dựng trên luồng này đang vẽ từ dữ liệu khuyết — và không cái nào nói ra.
2. **"Mức thanh lý" trên bản đồ nhiệt là ƯỚC LƯỢNG**, suy từ khối lượng hợp đồng mở nhân với đòn bẩy **giả định**. Đó là **kết quả của một mô hình được bán như dữ liệu quan sát**. Đưa vào đặc trưng là nhập giả định của người khác mà không kiểm được.
3. **Bức tường lệnh trên bản đồ nhiệt có thể là giả** — sàn nước ngoài không ai phạt (ở Mỹ là án hình sự từ đạo luật Dodd-Frank).

**Nhưng hành vi phía sau nó là THẬT** (`08 §B8`): thanh lý ép thanh lý, người bán bị **cưỡng bức** chứ không quyết định, giá thường hồi một phần. Cách đo đúng: **khối lượng hợp đồng mở sụt dưới phân vị 5 kèm lợi suất dưới phân vị 5**, rồi đo mức hồi 24 – 72 giờ — từ khối lượng hợp đồng mở và giá, **không từ bản đồ nhiệt**.

## Phương Pháp 8: On-Chain & Narrative Trading — bị chặn bởi dữ liệu, nhưng có một cửa sau giá trị

Bốn thứ rất khác nhau bị gộp dưới một tên:

**Nhánh chỉ số định giá on-chain** (MVRV, SOPR, NUPL) — cơ chế đẹp, nhưng **n ≈ 4 chu kỳ**, ngưỡng trôi mỗi chu kỳ, không kiểm định thống kê được. Và một bề mặt rò rỉ ít ai nói: **chỉ số của nhà cung cấp bị hiệu chỉnh về sau, và dấu thời gian là lúc CÔNG BỐ chứ không phải lúc QUAN SÁT.** Không có kho lưu trữ theo thời điểm miễn phí ⇒ backtest bằng chuỗi hiện tại là **rò rỉ tương lai được đóng gói sẵn**. **Bối cảnh, không bao giờ dùng để chọn thời điểm.**

**Nhánh lịch mở khoá token** — tín hiệu mạnh nhất họ này: Keyrock, hơn mười sáu nghìn sự kiện, **khoảng 90% kèm áp lực giá âm, phần lớn mức giảm rơi vào ba mươi ngày TRƯỚC ngày mở khoá**, dốc nhất tuần cuối. Quy tắc hoá hoàn hảo *nếu có dữ liệu*. Nhưng `10 §5.14` đã chốt: **không nguồn miễn phí đáng tin ⇒ cắt bộ chặn theo lịch mở khoá.** Giữ nguyên quyết định đó.

**Nhánh theo dấu cá voi / sao chép ví** — bác. Lợi nhuận của các ví đứng đầu đến từ vị thế **không sao chép được** (mua khối đầu tiên, thông tin nội bộ, giao dịch giả) · độ trễ thực tế tính bằng phút tới giờ trong khi bot chạy trước giao dịch sao chép **cùng khối** · công cụ phân tích on-chain không thấy dòng tiền bên trong sàn vì sổ cái nằm ngoài chuỗi. Cảnh báo cá voi đơn lẻ phần lớn là chuyển nội bộ hoặc chuyển ví lưu ký.

**Nhánh Narrative — cửa sau, và là phần đáng giá nhất của phương pháp này:**

> **Narrative Trading, khi quy tắc hoá, CHÍNH LÀ động lượng cắt ngang (cross-sectional momentum).**

"Bắt narrative sớm" chính là "mua thứ đang mạnh hơn rổ". Bản viết mã được: mỗi kỳ xếp hạng bốn mươi đồng theo lợi suất N ngày, mua nhóm mười phần trăm đầu. Và bản đó có **bằng chứng vững nhất trong cả họ**: Liu, Tsyvinski & Wu (*Journal of Finance* 2022) — **4,2% mỗi tuần có ý nghĩa thống kê ở nhóm đồng trên trung vị vốn hoá**, chỉ 0,6% và **không** có ý nghĩa ở nhóm nhỏ. Tức là bản khả thi là **chỉ mua, nhóm thanh khoản cao** — đúng vũ trụ bốn mươi cặp của repo.

**Nhưng nó bị KHOÁ THỜI GIAN, và đây là điều cấp bách nhất của cả tài liệu:**

`data/raw/universe/` trên đĩa có **đúng một** ảnh chụp (`month=2026-08`). Động lượng cắt ngang cần **ít nhất mười hai tháng ảnh chụp vũ trụ** để tránh bẫy sống sót. Ảnh chụp quá khứ **không tạo lại được**.

⇒ **Không bật tác vụ định kỳ chụp vũ trụ hôm nay = dời phương án dự phòng số một thêm mười hai tháng.** `10` xếp việc này ở ngày một vì lý do đặc trưng. Lý do thật lớn hơn nhiều: nó là **cả một chiến lược dự phòng**.

## Phương Pháp 9: Dynamic DCA & Grid Trading — không phải dự đoán, và một nhánh là martingale

**Nhánh Grid Trading — bán biến động mà không được trả phí bảo hiểm.** Đây là mô tả đúng về cấu trúc: lưới giao dịch là vị thế **âm gamma**. Trong biên độ nó in ra chuỗi lãi nhỏ; trong xu hướng nó tích luỹ đúng chân sai. "Lãi mỗi ngày" là **trả trước cho cú lỗ đuôi**.

Hoà vốn bước lưới = **một lần phí khứ hồi** (0,20% taker, 0,15% nếu trả phí bằng token sàn) — `09` đã sửa con số "hai lần" lan truyền phổ biến. Đúng theo hướng thuận lợi, nhưng không đổi bản chất: **bán biến động mà không được trả phí bảo hiểm là kỳ vọng âm cộng phương sai dương.**

**Một nâng cấp thật — và là chỗ duy nhất trong cả chín phương pháp mà edge có thật của dự án mua được thứ gì đó trực tiếp:** nếu độ lệch chuẩn dự báo được với R² 0,4 – 0,6 — mà nó dự báo được — thì **lưới có điều kiện theo độ lệch chuẩn dự báo** là hợp lý: chỉ chạy ở nhóm ba biến động thấp nhất, tự dừng khi dự báo vượt ngưỡng.

> Nhưng nói cho hết: **điều đó cắt đuôi, không tạo ra phí bảo hiểm.** Nó biến một vị thế bán biến động không được trả tiền thành một vị thế bán biến động không được trả tiền **có quản trị rủi ro**. Kỳ vọng không tự dương lên. Ghi vào danh sách sản phẩm hoãn lại, sau GATE 1.

**Nhánh Dollar-Cost Averaging với lệnh an toàn (kiểu 3Commas) — martingale trá hình, loại.** Mô phỏng hai mươi nghìn kịch bản: **tỉ lệ thắng 93 – 99% VÀ kỳ vọng ÂM**. Lệnh thua cuối cùng ăn **−21 đến −66% vốn**. Tỉ lệ thắng cao **chính là công cụ tiếp thị** — nó là hệ quả toán học của việc gấp lệnh, không phải bằng chứng kỹ năng. Bất kỳ hệ thống nào quảng cáo tỉ lệ thắng trên 90% đều đang mô tả hình dạng phân phối, không phải edge.

**Nhánh Dollar-Cost Averaging mua và giữ Bitcoin/Ethereum bằng tiền nhàn rỗi** — kỳ vọng dương, nhưng là **beta chứ không phải alpha**. Bitcoin dương với mọi cửa sổ từ bốn năm trở lên. Trung thực kèm theo: mua đỉnh tháng 11/2021 giữ 4,8 năm chỉ **+15% (khoảng 3% mỗi năm)**. Và mua-giữ **altcoin** thì ngược lại — phần lớn altcoin top 100 mùa 2017 và 2021 mất trên 90% và không bao giờ về đỉnh.

Đây đã là **đối chứng bắt buộc** (`09 §8`) — và là đối chứng trung thực nhất, vì nó là câu hỏi thật của người dùng: *"cái này có hơn việc tôi cứ mua đều rồi giữ không?"*

---

# PHẦN 5 · CHI TIẾT NĂM PHƯƠNG PHÁP PHÙ HỢP NHẤT

## 5.1 · ★ Phương Pháp 4: Position Trading & Trend Following — quy tắc hướng sơ cấp

### Vì sao nó thắng

**Bằng chứng mạnh nhất trong toàn bộ nhóm định hướng, và bằng chứng đó nằm NGOÀI crypto** — động lượng theo chuỗi thời gian có literature nhiều thập kỷ, qua cổ phiếu, trái phiếu, hàng hoá, tiền tệ. Theo Phát hiện thứ ba ở Phần 0, đây chính là tiêu chí quyết định: bạn không đủ dữ liệu để tự chứng minh, nên bạn cần một quy tắc mà **người khác đã chứng minh trên tài sản khác**.

Backtest lại độc lập trên Bitcoin 2014 – 2026, khớp lệnh tại giá mở nến kế tiếp, **đã trừ phí: Sharpe 1,07 – 1,32** so với mua và giữ 0,96 · **7 – 18 lệnh mỗi năm** · tiền phí chỉ **4,5% mỗi năm**.

### Đặc tả quy tắc — dạng viết được thành mã ngay

```
# Tính tại giá đóng nến t · Khớp tại giá MỞ nến t+1 (RULE: khớp tại close t là lookahead)

ema_nhanh   = EMA(close, 20)
ema_chậm    = EMA(close, 200)
donchian_hi = max(high[t-55 … t-1])          # KHÔNG bao gồm nến t

VÀO (chỉ mua):   close[t] > ema_chậm[t]  VÀ  close[t] > donchian_hi[t]
RA:              close[t] < ema_nhanh[t]  HOẶC  chạm cắt lỗ / chốt lời / hết hạn thời gian

Trạng thái hợp lệ: MUA hoặc ĐỨNG NGOÀI. KHÔNG BAO GIỜ BÁN KHỐNG.
Công cụ: GIAO NGAY.  (theo mục 2.2 — giữ 35 ngày thì giao ngay luôn rẻ hơn)
```

**Ba tham số: 20, 200, 55.** Đúng giới hạn của Tiêu chí 3.

### Sinh sự kiện cho lớp lọc phía sau

```
cắt lỗ    = giá_vào × (1 − 1,2 · σ̂ · √H)
chốt lời  = giá_vào × (1 + 4,0 · σ̂ · √H)
hết hạn   = 60 ngày
```

Hình dạng rào `1,2σ̂ / 4,0σ̂` cho payoff **3,33:1** và hoà vốn **25,0%**, so với random walk thuần cho **23,1%**.
> ⚠️ **SỬA 27/08/2026 — xem `docs/adr/013-sua-loi-thu-nguyen-payoff.md`.** Số cũ 22,0% kế thừa lỗi thứ nguyên từ `10 §2/C`. Ngưỡng cổng **27,5% giữ nguyên** — nó vốn là biên thận trọng, và vẫn nằm trên hoà vốn đúng 25,0–25,5%.


> ⚠️ **Cảnh báo trung thực bắt buộc lặp lại từ `10`:** con số thắng 35% được **mượn** từ hệ đường trung bình mua-hoặc-đứng-ngoài đã kiểm toán, **không phải** đo trên khung rào chắn 1,2σ / 4,0σ. **Hình dạng cược CHUYỂN gánh nặng, không TẠO RA biên.** Toàn bộ edge vẫn nằm ở khẳng định "theo xu hướng nâng 23,1% lên 35%", và khẳng định đó phải được đo trước khi xây bất cứ thứ gì đứng lên nó — đó là Phép đo 2 ở Phần 8.

### Cách đo — và cái bẫy chọn tham số

**Bộ ba 20 / 200 / 55 đã qua một vòng chọn lọc công khai của cả thế giới** ⇒ khai thác dữ liệu nhẹ nhưng có thật.

**Bắt buộc:** quét lưới `ema_nhanh ∈ {10, 20, 50} × ema_chậm ∈ {100, 150, 200} × donchian ∈ {20, 55, 100}` = **27 ô**, báo cáo **toàn bộ bề mặt**, và đòi **ô TRUNG VỊ** của lưới đạt ngưỡng — **không phải ô tốt nhất**. Ô tốt nhất của một lưới bất kỳ luôn đẹp; đó là định nghĩa của cực đại.

### Chế độ hỏng — phải biết trước để không hoảng

| Chế độ hỏng | Biểu hiện | Có phải lỗi không |
|---|---|---|
| Cưa răng cưa trong biên độ | Chuỗi thua 5 – 10 lệnh liên tiếp | **Không** — là đặc tính, đã nằm trong Sharpe 1,07 |
| Sụt giảm sâu | Đường trung bình 50 vẫn chịu **−60%** | **Không** — nhưng phải đăng ký trước con số này |
| Vào muộn đỉnh sóng | Bản chất của phá vỡ biên | **Không** |
| Im lặng nhiều tuần | 15 lệnh/năm nghĩa là **im lặng là mặc định** | **Không** — Hàng rào 3 |

> **Điều trung thực nhất phải nói về phương pháp này:** lợi thế so với mua và giữ chỉ là **0,11 – 0,36 Sharpe**. Giá trị thật của nó **không phải lợi nhuận vượt trội** — là **cắt đuôi**: sụt giảm thị trường gấu từ −77…−83% giảm đáng kể. Bán nó cho chính mình như "máy in tiền" là bước đầu tiên của việc bỏ nó đúng lúc sụt giảm.

### Khả thi

| Trục | Đánh giá |
|---|---|
| Kỹ thuật | ✅ **Rất cao** — khoảng 150 dòng mã, không phụ thuộc thư viện ngoài |
| Dữ liệu | ✅ Chỉ cần nến — đã có sẵn cơ chế tải |
| Vốn tối thiểu | ✅ **Khoảng 165 USD** (tính ở mục 7.4) — **vốn không phải ràng buộc** |
| Chứng minh thống kê | ❌ **Thấp** — cần 229 lệnh độc lập, xem mục 7.2 |
| Vận hành | 🔶 Phụ thuộc số đồng — xem mục 7.3 |

---

## 5.2 · ★★ Phương Pháp 7: Funding Rate & Cash-and-Carry Arbitrage — hàm chi phí, không phải tín hiệu

Đây là phương pháp bị hiểu sai **vị trí** nhiều nhất trong cả chín. Nó có **ba vai trò hoàn toàn khác nhau**, và vai trò quan trọng nhất không phải vai trò mà tên gọi gợi ý.

### Vai trò thứ nhất — HÀM CHI PHÍ ★★ (quan trọng nhất, và không ai gọi tên nó)

Funding biến chi phí từ **hằng số** thành **hàm hai biến**. Toàn bộ mục 2.2 và 2.3 của tài liệu này là hệ quả của đúng điều đó. Nó **không phải tín hiệu** — nó là **thứ quyết định mọi tín hiệu khác sống hay chết**.

```
def chi_phí(chân_trời_ngày, công_cụ, funding_mỗi_ngày):
    if công_cụ == GIAO_NGAY:
        return 0.30                                        # taker 0,10 × 2 + trượt 0,05 × 2
    if công_cụ == VĨNH_CỬU:
        return 0.20 + funding_mỗi_ngày × chân_trời_ngày    # ← số hạng ai cũng quên

def ngưỡng_thắng_cần(σ̂, chân_trời_ngày, công_cụ, funding_mỗi_ngày):
    biên_độ_kỳ_vọng = σ̂ × sqrt(2/π) × sqrt(chân_trời_ngày)
    c = chi_phí(chân_trời_ngày, công_cụ, funding_mỗi_ngày)
    return 0.5 + c / (2 × biên_độ_kỳ_vọng)                 # TÍNH TỪNG NẾN, TRONG MÃ

def chọn_công_cụ(chân_trời_ngày, funding_mỗi_ngày):
    ngưỡng = (0.30 − 0.20) / funding_mỗi_ngày              # = 3,33 ngày ở funding nền
    return GIAO_NGAY if chân_trời_ngày > ngưỡng else VĨNH_CỬU
```

> **Ba điều bắt buộc về đoạn mã trên:**
> ① Nó nằm **trong mã nguồn**, không đọc từ tệp cấu hình — vì đây chính là dòng sẽ bị sửa vào cái đêm bảng điều khiển trống ba tuần liền, và khi nó bị sửa thì **không test nào đỏ, không tiếng động nào**.
> ② Công cụ giao ngay hay vĩnh cửu là **kết quả** của hàm, không phải **giả định** đầu vào.
> ③ `config/model.yaml` **đã có sẵn** `funding_rate_8h_pct: 0.01` mà chưa kiến trúc nào dùng tới.

### Vai trò thứ hai — hai suất đặc trưng, chiều TIẾP DIỄN

`09 §2` đã kéo **toàn bộ lịch sử funding** từ giao diện lập trình Binance (Bitcoin 7.624 kỳ · Ethereum 7.390 · Solana 6.591 · Dogecoin 6.712, 2019 – 2026) và đo lợi suất sau cực trị:

| Đồng | Lợi suất 7 ngày sau khi funding vượt phân vị 95 | Nền không điều kiện | Tỉ lệ đúng của chiến thuật ngược chiều |
|---|---|---|---|
| Bitcoin | **+1,42%** | +1,07% | dưới 50% |
| Ethereum | **+4,36%** | +1,33% | dưới 50% |
| Solana (phân vị 99) | **+23,0%** | +2,33% | dưới 50% |
| Dogecoin (phân vị 99) | **+36,5%** | +3,14% | dưới 50% |

**Niềm tin phổ biến "funding cao ⇒ sắp giảm" bị dữ liệu đầy đủ bác thẳng.** Cực trị funding trùng với xu hướng mạnh; đứng ngược nó là đứng chắn tàu.

⇒ Hai đặc trưng: `funding_z96` (chuẩn hoá 96 kỳ) và `funding_level_pct`, dùng theo **chiều tiếp diễn**.

### Vai trò thứ ba — sản phẩm riêng, không thuộc module Prediction

Chiến lược mua giao ngay + bán khống vĩnh cửu cùng khối lượng. Bằng chứng vững nhất toàn bộ tài liệu, kỹ năng dự đoán yêu cầu **bằng không**. Nhưng con số trung thực khiêm tốn hơn quảng cáo:

| Khoản | Giá trị |
|---|---|
| Điểm hoà vốn | **11,4 ngày** (dùng lệnh chờ: 9,4 ngày) |
| Mức 0,0100% mỗi 8 giờ | **Giá trị nền mặc định** của Binance khi chênh lệch ≈ 0 — **không phải** dấu hiệu thị trường nóng |
| Lợi suất năm trên **tổng vốn** (nuôi hai chân) | ký quỹ 1 lần → 5,5% · 2 lần → 7,3% · thực tế giữ 30 ngày ký quỹ 2 lần ≈ **4,5%** |
| Rủi ro thật | Funding đảo dấu, và các đợt âm **co cụm hàng tuần** (5–7/2021, cuối 2022) — không rải đều |

Kinh tế học lao động của nó tính ở mục 7.4. **Không xây bây giờ** — nhưng dữ liệu funding cần cho vai trò một và hai là **cùng một dữ liệu**, nên tác vụ định kỳ ngày một phục vụ cả ba vai trò.

### Khả thi

| Trục | Đánh giá |
|---|---|
| Vai trò hàm chi phí | ✅ **Rất cao** — khoảng 30 dòng mã, tham số đã có trong cấu hình |
| Vai trò đặc trưng | 🔶 Cần tác vụ định kỳ ngày một (funding lấy lại được, khối lượng hợp đồng mở **chỉ 30 ngày — mất là mất vĩnh viễn**) |
| Vai trò sản phẩm riêng | 🔶 Kỹ thuật vừa · **vốn là ràng buộc thật** — xem mục 7.4 |

---

## 5.3 · Phương Pháp 3: Swing Trading — chân trời sống, và cấu trúc điểm vào

### Vì sao nó quan trọng dù không phải quy tắc sơ cấp

**Đây là chân trời duy nhất mà ngưỡng thắng cần và trần năng lực giao nhau.** Khung ngày: 54,3 – 56,4% so với trần 52 – 56% ⇒ biên **−4,4 đến +1,7 điểm**. Khung tuần giao ngay: 52,3% ⇒ biên **−0,3 đến +3,7 điểm**. Mỏng, nhưng **khác rỗng** — và mọi chân trời ngắn hơn thì rỗng thật.

### Nhưng "swing trading" như được dạy phổ biến KHÔNG quy tắc hoá được

| Thành phần | Tiêu chí 2 (hai người cùng kết quả?) | Tiêu chí 3 (≤3 tham số?) | Phán quyết |
|---|---|---|---|
| Kẻ đường xu hướng bằng mắt | ❌ | ❌ | Loại |
| Vẽ vùng cung – cầu bằng mắt | ❌ | ❌ | Loại |
| Fibonacci thoái lui, chọn đỉnh đáy bằng mắt | ❌ | ❌ | Loại — điểm đảo chiều **không** cụm tại mức Fibonacci (Batchelor & Ramyar) |
| Phân kỳ chỉ báo sức mạnh tương đối | ❌ (định nghĩa "đỉnh" không duy nhất) | ❌ | Loại |
| **Phá vỡ biên Donchian N kỳ** | ✅ | ✅ (1 tham số) | **Giữ** |
| **Hồi về đường trung bình rồi đóng cửa phía trên** | ✅ | ✅ (2 tham số) | **Giữ** |
| **Phá vỡ thất bại / quét rồi lấy lại** | ✅ nếu viết chặt | ✅ (3 tham số) | **Giữ** — đặc tả ở mục 5.5 |

> **Điều đáng nói thẳng: phần quy tắc hoá được của Swing Trading, sau khi lột xong, hội tụ về Phương Pháp 4.** Cả ba dòng "Giữ" đều là biến thể của theo xu hướng và phá vỡ biên, chỉ ở chân trời ngắn hơn. Phần khiến Swing Trading "khác" chính là **phần tuỳ nghi** — và phần đó không viết mã được.

### Đóng góp cụ thể

1. **Chân trời:** một ngày tới một tuần. Đây là khung mà ý định giao dịch được phép tồn tại.
2. **Quy tắc chọn công cụ:** giữ 1 – 3 ngày ⇒ hợp đồng vĩnh cửu rẻ hơn. Giữ từ 7 ngày ⇒ **giao ngay rẻ hơn**. Ranh giới 3,33 ngày ở funding nền — **là hàm trong mã**, không phải giả định trong đầu.
3. **Ba cấu trúc điểm vào** kể trên, dùng cho quy tắc sơ cấp ở chân trời ngắn hơn Position Trading.

### Khả thi

| Trục | Đánh giá |
|---|---|
| Kỹ thuật | ✅ Cao — dùng lại đúng mã của Phương Pháp 4 với tham số ngắn hơn |
| Biên kinh tế | ⚠️ **Mỏng** — có thể âm ở khung ngày. Chỉ khung tuần giao ngay có biên dương chắc |
| Chứng minh | ❌ Thấp, cùng lý do mục 7.2 — nhưng **tần suất cao hơn nên nhanh hơn Phương Pháp 4** |

---

## 5.4 · Phương Pháp 6, nhánh Order Flow — họ đặc trưng tốt nhất

### Vì sao nhánh này khác hẳn hai nhánh kia

Tính **miễn phí** từ dữ liệu giao dịch gộp của Binance (cờ `isBuyerMaker`), độ trễ mili-giây, không cần nhà cung cấp bên thứ ba. Cơ chế mất cân bằng dòng lệnh dẫn tới giá có literature vững (Cont 2014). Repo **đã có** `taker_buy_ratio` khai báo trong `config/features.yaml`.

### Đặc tả

```
tỉ_lệ_mua_chủ_động[t] = taker_buy_volume[t] / volume[t]

chênh_lệch[t]         = taker_buy_volume[t] − (volume[t] − taker_buy_volume[t])
khối_lượng_tích_luỹ   = cumsum(chênh_lệch)
độ_dốc_24[t]          = hồi_quy_tuyến_tính(khối_lượng_tích_luỹ[t-24 … t]) / trung_bình(volume)
                        ↑ chia cho khối lượng để không phụ thuộc thang đo (RULE 1)
```

Hai suất đặc trưng: `taker_buy_ratio_z` và `cvd_slope_24`.

> ⚠️ **Tuyệt đối không nhập khẩu con số 60 – 75% từ Phương Pháp 1: Scalping sang đây.** Đó là độ chính xác ở **chân trời tick**. Gộp về nến ngày là một **đối tượng khác**, yếu hơn nhiều bậc. Cái gộp lại có thể vẫn có giá trị — nhưng phải **tự đo**, không được thừa kế uy tín của con số kia. Đây là dạng nguỵ biện phổ biến nhất trong tài liệu bán khoá học order flow.

**Giả thuyết đáng đo, chưa có literature** (thuộc loại kinh nghiệm hành nghề): **đợt tăng do giao ngay dẫn dắt bền hơn đợt tăng do hợp đồng vĩnh cửu dẫn dắt** — đo bằng phân kỳ giữa khối lượng tích luỹ giao ngay và vĩnh cửu.

### Khả thi

| Trục | Đánh giá |
|---|---|
| Kỹ thuật | ✅ Cao — cột `taker_buy_volume` có sẵn trong dữ liệu nến Binance |
| Dữ liệu | 🔶 Cần thêm cột vào mẻ tải (`10` tuần 1–2 đã có kế hoạch) |
| Bằng chứng ở chân trời ngày | 🔶 **Chưa biết** — phải tự đo, Phép đo 5 |

---

## 5.5 · Phương Pháp 5, ba đặc trưng sống sót — đặc tả chặt

Sau khi lột bỏ toàn bộ hệ thuật ngữ, ba thứ còn lại vượt được cả năm tiêu chí:

```
# 1 · Quét rồi lấy lại — phiên bản viết chặt, ba tham số (N, k, ngưỡng độ sâu)
đáy_trước = min(low[t-N … t-1])
quét      = low[t] < đáy_trước × (1 − ngưỡng_độ_sâu)
lấy_lại   = close[t] > đáy_trước
cờ_quét_lấy_lại[t] = quét VÀ lấy_lại VÀ (xảy ra trong ≤ k nến)

# 2 · Khoảng cách tới đỉnh/đáy gần nhất, chuẩn hoá theo độ lệch chuẩn
khoảng_cách_đỉnh_đáy[t] = (close[t] − đỉnh_swing_gần_nhất) / (σ̂ × close[t])

# 3 · Khoảng cách tới số tròn (nền kinh tế học: Osler 2000/2003)
khoảng_cách_số_tròn[t] = |close[t] − số_tròn_gần_nhất| / close[t]
```

Cả ba **không phụ thuộc thang giá** (tuân RULE 1), đều qua đúng một hàm dịch nến (tuân RULE 2).

**Đặc trưng số 3 xếp vào danh sách chờ** vì cộng tuyến với số 2 — chỉ vào khi một suất khác bị loại.

**Bắt buộc kèm — cấm định danh trong mã nguồn:** `order_block` · `fvg` · `bos` · `choch` · `liquidity_grab` · `killzone` · `elliott` · `wave_count` · `harmonic` · `gartley` · `smart_money`.

> Vì sao cấm tên chứ không chỉ cấm khái niệm: **đặt tên là nhập khẩu hệ thuật ngữ.** Khi trong mã có biến tên `order_block`, người viết sẽ vô thức chỉnh tham số cho khớp câu chuyện mà cái tên gợi ra, chứ không cho khớp dữ liệu. Đây là một dạng rò rỉ **qua đầu người viết mã**, và không có test thống kê nào bắt được nó.

---

# PHẦN 6 · BỐN KỊCH BẢN ÁP DỤNG — VÀ KHUYẾN NGHỊ

## 6.1 · Bảng so sánh

| | **Kịch bản 1 · ĐÀI QUAN TRẮC** | **★ Kịch bản 2 · QUAN TRẮC + THEO XU HƯỚNG GIAO NGAY** | **Kịch bản 3 · TRUNG TÍNH THỊ TRƯỜNG** | **Kịch bản 4 · CƯỢC ĐỐI XỨNG KHUNG NGÀY** |
|---|---|---|---|---|
| **Phương pháp chạy** | Không phương pháp nào cược · Phương Pháp 2 làm hiển thị | **Phương Pháp 4** (hướng) + **Phương Pháp 7** (chi phí) + **Phương Pháp 3** (cấu trúc vào) + **Phương Pháp 6 & 5** (đặc trưng) + **Phương Pháp 9, nhánh mua và giữ** (đối chứng) | **Phương Pháp 7** làm sản phẩm chính | Phương Pháp 3 cược hai chiều |
| **Câu hỏi trả lời** | «Biến động sắp tới rộng bao nhiêu?» | **«Cược bao nhiêu, và có nên bỏ lệnh này không?»** | «Thu funding thế nào cho an toàn?» | «Lên hay xuống?» |
| **Cần dự đoán hướng?** | Không | **Có, nhưng bằng quy tắc mượn bằng chứng ngoài** | **Không** | Có, và phải tự chứng minh |
| **Hình dạng cược** | Không cược | **Bốn ăn một** | Trung tính | Một ăn một |
| **Hoà vốn phải vượt** | — | **22,0%** | — | 52,3 – 56,7% |
| **Biên so trần năng lực** | — | **+13 điểm** (có điều kiện) | — | **−2,9 đến +1,1 điểm** |
| **Vốn tối thiểu có ý nghĩa** | 0 | **~165 USD** | **~50.000 USD** | ~165 USD |
| **Tuần công tới bản đầu** | 8 – 9 | **13 – 15** | 4 – 5 (nhưng cần vốn) | 17 – 19 |
| **Tải vận hành** | ~2 h/tháng | **~3,2 h/tháng** | ~2 h/tháng + rủi ro thanh lý | ~3 h/tháng |
| **Xác suất có sản phẩm ngày 90** | Rất cao | **Trung bình – cao** | Cao | Thấp |
| **Chứng minh được edge không?** | **Có** (11 quan sát đủ) | Không — **mượn bằng chứng ngoài** | Không cần | **Không, và nó cần** |

## 6.2 · ★ Khuyến nghị: chọn Kịch bản 2, đi qua Kịch bản 1

**Sáu mươi ngày đầu của Kịch bản 1 và Kịch bản 2 là CÙNG MỘT MÃ NGUỒN.** Độ lệch chuẩn dự báo là đầu vào của cắt lỗ 1,2σ̂, chốt lời 4,0σ̂, dải giá, và hàm ngưỡng thắng cần. Không có Kịch bản 1 thì không có Kịch bản 2 — nên sáu mươi ngày đầu đúng bất kể sau đó rẽ đâu.

**Vì sao Kịch bản 2 chứ không phải Kịch bản 4.** Kịch bản 4 (cược đối xứng khung ngày, tức giải pháp B của `10`) trung thực nhất về đo lường nhưng **không có lối thoát kinh tế**: sau khi cộng funding, cược đối xứng cần 52,3 – 56,7% trong khi trần là 52 – 56%. Biên **−2,9 đến +1,1 điểm** — và toàn bộ biên đó dựa trên một giả định chưa ai đo (tỉ lệ đúng có giữ nguyên ở chế độ biến động cao không). Cộng thêm Phát hiện thứ hai: nó **cần** tự chứng minh, mà tự chứng minh thì bất khả trong 5 – 14 năm. Kịch bản 4 tự mâu thuẫn.

**Vì sao đi qua Kịch bản 1 chứ không nhảy thẳng.**
1. Kịch bản 1 là **mức sàn trung thực** — nếu Kịch bản 2 trượt, vẫn còn một sản phẩm thật dựng trên tầng duy nhất có R² 0,5.
2. Kịch bản 1 **ship sớm**. Khoảng ngày 50, bảng điều khiển lần đầu hiển thị một con số dám bảo vệ. Với một người làm ngoài giờ, **năm sáu tuần không thấy sản phẩm là cửa tử về động lực** — đây là rủi ro lớn hơn mọi rủi ro kỹ thuật trong tài liệu này.
3. Kịch bản 1 là kịch bản **duy nhất mà bạn tự chứng minh được** (11 quan sát so với 229). Nó cho bạn một chiến thắng thật, sớm, có thể kiểm chứng.

**Kịch bản 3 là phương án song song, không phải phương án thay thế.** Nếu vốn từ 50.000 USD trở lên thì nó đứng riêng được và không cạnh tranh thời gian với Kịch bản 2 sau khi dựng xong (khoảng 2 giờ mỗi tháng). Dưới mức đó, kinh tế học lao động không đứng vững — xem mục 7.4.

## 6.3 · Điểm rẽ nhánh — đăng ký trước ngay hôm nay

`10` đã chốt điểm rẽ ở ngày 70. Tài liệu này thêm một nhánh và làm rõ hai nhánh cũ:

| Kết quả đo ở tuần 9 – 10 | Hành động |
|---|---|
| Tỉ lệ thắng khung rào chắn ≥ **27,5%** VÀ Sharpe sau phí của ô trung vị lưới ≥ **0,8** | → Đi tiếp **Kịch bản 2** đầy đủ |
| Tỉ lệ thắng 23,1 – 27,5% | → Giữ **Phương Pháp 4 làm sản phẩm**, **không** xây lớp lọc học máy. Ship Kịch bản 1 + Phương Pháp 4 |
| Tỉ lệ thắng ≤ **23,1%** (mức random walk) HOẶC Sharpe < 0,8 | → **Dừng nhánh giao dịch, ship Kịch bản 1.** Đây là **THÀNH CÔNG**, không phải thất bại |
| **Mới:** trượt, và ảnh chụp vũ trụ đã đủ 12 tháng | → **Phương Pháp 8, nhánh Narrative** (động lượng cắt ngang) là dự phòng số một |
| **Mới:** trượt, ảnh chụp chưa đủ, và có vốn ≥ 50.000 USD | → **Kịch bản 3** (Phương Pháp 7) là dự phòng số hai |

> **Tuyệt đối KHÔNG khi trượt:** chạy thêm vòng tối ưu tham số · nới ngưỡng · đổi giai đoạn kiểm định.

---

# PHẦN 7 · MỨC ĐỘ KHẢ THI — BỐN TRỤC, CÓ SỐ

## 7.1 · Khả thi kỹ thuật — cao, và đây là tin tốt duy nhất không kèm điều kiện

| Thành phần | Ngày công | Phụ thuộc |
|---|---|---|
| Hàm chi phí + ngưỡng thắng cần (Phương Pháp 7, vai trò một) | **0,5** | Không |
| Quy tắc Phương Pháp 4 + sinh sự kiện rào chắn | **2** | Nến |
| Mô hình biến động HAR-RV + dự phòng làm mượt luỹ thừa | **3** | Nến |
| Dải giá suy ra từ độ lệch chuẩn + kiểm toán độ phủ | **2** | Trên |
| Năm đặc trưng của Phương Pháp 5 và 6 | **2** | Cột khối lượng mua chủ động |
| Lớp lọc học máy + hiệu chỉnh xác suất + định cỡ lệnh | **5** | Toàn bộ trên |
| Bốn hàng rào bằng mã | **0,5** | Không |
| **Tổng phần riêng của tài liệu này** | **≈ 15 ngày công** | |

Không cần thư viện đặc biệt, không cần card đồ hoạ, không cần dữ liệu trả tiền. `10 §5.14` đã chốt ba thứ **không mua**: card đồ hoạ, dữ liệu tick và một phút, tối ưu thông lượng.

## 7.2 · ★ Khả thi thống kê — thấp, và đây là ràng buộc thật sự

Đây là phần chưa doc nào trong repo tính, và nó đổi cách đọc toàn bộ kế hoạch.

**Cần bao nhiêu lệnh để chứng minh tỉ lệ thắng vượt hoà vốn 27,5%?** (một phía, α = 0,05, công suất 80%)

| Tỉ lệ thắng thật | Biên so hoà vốn | **Số lệnh độc lập cần** |
|---|---|---|
| 30% | 2,5 điểm | **2.008** |
| 32% | 4,5 điểm | 627 |
| **35%** *(con số đang giả định)* | 7,5 điểm | **229** |
| 40% | 12,5 điểm | 84 |
| 45% | 17,5 điểm | 43 |

**Bốn mươi cặp cho bao nhiêu bằng chứng độc lập?** Với `N_hiệu_dụng = n / (1 + (n−1)·ρ)`:

| Tương quan | "Đồng độc lập" | Lệnh hiệu dụng/năm | **Số năm để đủ công suất** |
|---|---|---|---|
| **0,9** *(thực tế crypto)* | **1,11** | 16,6 | **13,8 năm** |
| 0,7 | 1,41 | 21,2 | 10,8 năm |
| 0,5 | 1,95 | 29,3 | 7,8 năm |
| 0,3 | 3,15 | 47,2 | 4,9 năm |

**Công suất thực tế với ba năm dữ liệu bốn mươi cặp:**

| Tương quan | Lệnh hiệu dụng | Công suất đạt được | Chuẩn |
|---|---|---|---|
| 0,9 | 50 | **33,4%** | 80% |
| 0,5 | 88 | 47,4% | 80% |
| 0,3 | 142 | 63,0% | 80% |

**Đối chiếu — mô hình biến động cần bao nhiêu?** Để chứng minh R² = 0,5 khác 0: **11 quan sát**. Ít hơn **21 lần**.

> **Ba hệ quả bắt buộc:**
> 1. **GATE 1 không phải phép chứng minh.** Nó là màng lọc chống thất bại hiển nhiên. Đọc nó như một phép chứng minh sẽ dẫn tới hai sai lầm đối xứng: tin quá mức khi qua, và bỏ cuộc sai khi trượt.
> 2. **Vì bạn không tự chứng minh được, mọi quy tắc định hướng đều đứng trên bằng chứng ngoại sinh.** ⇒ **Chỉ chạy quy tắc có literature dày ngoài crypto.** Đây là lập luận quyết định chọn Phương Pháp 4 và bác mọi biến thể tự nghĩ của Phương Pháp 5.
> 3. **Ngược lại, tầng biến động thì bạn tự chứng minh được, nhanh.** Đó là lý do Kịch bản 1 phải đi trước — nó là phần duy nhất của dự án nơi *bạn* là nguồn bằng chứng.

## 7.3 · Khả thi vận hành — vừa, và có một quyết định thiết kế bị bỏ sót

**Tải hàng tháng cho một người làm ngoài giờ:**

| Việc | Giờ/tháng |
|---|---|
| Kiểm tra tác vụ định kỳ + báo cáo chất lượng dữ liệu | 0,5 |
| Đối soát lệnh và vị thế | 1,0 |
| Khớp lại mô hình biến động hàng tuần (tự động, chỉ xem nhật ký) | 0,2 |
| Đọc bảng điểm kỹ năng + kiểm toán độ phủ | 0,5 |
| Xử lý sự cố (trung bình) | 1,0 |
| **Tổng** | **3,2 giờ/tháng ≈ 38 giờ/năm** |

**Và đây là quyết định bị bỏ sót trong mọi tài liệu trước — cỡ vũ trụ giao dịch:**

| Số đồng | Đa dạng hoá hiệu dụng (ρ = 0,9) | Lệnh/năm | Lệnh mỗi ngày giao dịch |
|---|---|---|---|
| 1 | 1,00 | 15 | 0,12 |
| 5 | 1,09 | 75 | 0,60 |
| **10** | **1,10** | **150** | **1,19** |
| 20 | 1,10 | 300 | 2,38 |
| 40 | 1,11 | 600 | 4,76 |

> **Từ mười lên bốn mươi đồng: đa dạng hoá tăng 0,01 đơn vị, tải vận hành tăng bốn lần.**
>
> **Khuyến nghị: vũ trụ GIAO DỊCH là 8 – 10 đồng thanh khoản nhất. Bốn mươi cặp giữ nguyên cho HIỂN THỊ và cho tầng động lượng cắt ngang về sau.** Đây là điều chỉnh cụ thể so với `10 §4` (vốn để vũ trụ giao dịch bằng bốn mươi) — và nó không mất gì, vì ở tương quan 0,9 thì ba mươi đồng thêm vào cho đúng 0,01 đơn vị đa dạng hoá.

## 7.4 · Khả thi kinh tế — vốn không phải ràng buộc, trừ một trường hợp

**Phương Pháp 4: Position Trading & Trend Following — vốn KHÔNG phải ràng buộc.**

```
cắt lỗ = 1,2 × σ̂(35 ngày) = 1,2 × 13,78% = 16,5% giá
rủi ro 1% vốn mỗi lệnh  ⟹  giá trị mỗi vị thế = 6,05% vốn
mười vị thế đồng thời   ⟹  triển khai 60,5% vốn
lệnh tối thiểu Binance ~10 USD  ⟹  vốn tối thiểu ≈ 165 USD
```

**Phương Pháp 7 làm sản phẩm riêng — vốn LÀ ràng buộc, và nó gắt:**

| Vốn | Thu mỗi năm (4,5%) | Giờ mỗi năm | **Thu mỗi giờ** |
|---|---|---|---|
| 5.000 USD | 225 USD | 24 | **9,4 USD** |
| 10.000 USD | 450 USD | 24 | 18,8 USD |
| **50.000 USD** | 2.250 USD | 24 | **93,8 USD** |
| 100.000 USD | 4.500 USD | 24 | 187,5 USD |

*(chưa trừ thuế thu nhập cá nhân 0,1% mỗi giao dịch theo Thông tư 32/2026, và chưa tính rủi ro thanh lý chân bán khống)*

> **Ngưỡng hợp lý: khoảng 50.000 USD.** Dưới mức đó, thời gian bỏ ra đáng giá hơn nếu dồn vào việc khác. Đây không phải nhận định về mức vốn nên có — chỉ là phép chia đơn giản giữa thu nhập kỳ vọng và giờ công bỏ ra.

## 7.5 · Bảng chấm khả thi tổng hợp

| Phương pháp | Kỹ thuật | Dữ liệu | Bằng chứng | Vốn | **Khả thi tổng** |
|---|---|---|---|---|---|
| **Phương Pháp 4: Position Trading & Trend Following** | ✅ Rất cao | ✅ Có sẵn | ✅ **Ngoại sinh, dày** | ✅ ~165 USD | **★★★★★** |
| **Phương Pháp 7 — vai trò hàm chi phí** | ✅ Rất cao | ✅ Có trong cấu hình | ✅ Số học thuần | ✅ Không cần | **★★★★★** |
| **Phương Pháp 3: Swing Trading** | ✅ Cao | ✅ Có sẵn | 🔶 Biên mỏng | ✅ ~165 USD | **★★★★** |
| **Phương Pháp 6 — nhánh Order Flow** | ✅ Cao | 🔶 Cần cột mới | 🔶 Phải tự đo | ✅ Không cần | **★★★** |
| **Phương Pháp 5 — ba đặc trưng** | ✅ Cao | ✅ Có sẵn | 🔶 Nền ngoại hối | ✅ Không cần | **★★★** |
| **Phương Pháp 7 — sản phẩm riêng** | 🔶 Vừa | ✅ Có sẵn | ✅ Vững nhất | ❌ **≥50.000 USD** | **★★★** |
| **Phương Pháp 8 — nhánh Narrative** | ✅ Cao | ❌ **Khoá 12 tháng** | ✅ Vững | ✅ Không cần | **★★** *(thời gian)* |
| **Phương Pháp 9 — nhánh Grid có điều kiện** | ✅ Cao | ✅ Có sẵn | ❌ Không có phí bảo hiểm | 🔶 Vừa | **★★** *(hoãn)* |
| **Phương Pháp 2: Day Trading** | ✅ Cao | ✅ Có sẵn | ❌ Số học bác | ✅ | **★** *(chỉ hiển thị)* |
| **Phương Pháp 1: Scalping** | ✅ Cao | ❌ Không có | ❌ Số học bác | ❌ | **☆** |
| Phương Pháp 6 — Liquidation Heatmap · Phương Pháp 8 — cá voi · Phương Pháp 9 — lệnh an toàn | — | — | ❌ Bác | — | **Loại** |

---

# PHẦN 8 · KẾ HOẠCH — CHÍN PHƯƠNG PHÁP THÀNH TÁM PHÉP ĐO

> **Nguyên tắc:** tài liệu này **không thêm tuần nào** vào lộ trình 90 ngày của `10`. Chín phương pháp **không được quyền trở thành chín nhánh mã nguồn** — chúng co lại thành **tám phép đo đăng ký trước**, chạy đúng một lần ở tuần 9 – 10, chấm bằng kiểm soát tỉ lệ phát hiện sai Benjamini–Hochberg ở mức 0,10.

## 8.1 · Điều chỉnh so với lộ trình của `10 §4`

| Mốc | Thêm gì từ tài liệu này |
|---|---|
| **Ngày 1** | *(không đổi việc — đổi lý do)* Tác vụ chụp vũ trụ **không phải để lấy đặc trưng — nó là toàn bộ phương án dự phòng số một** (Phương Pháp 8, nhánh Narrative). Không bật hôm nay là dời mười hai tháng. |
| **Tuần 1 – 2 · dữ liệu** | Phân loại rõ độ ưu tiên: **khối lượng hợp đồng mở = mất vĩnh viễn** (chỉ 30 ngày lịch sử) · **dữ liệu giao dịch gộp = lấy lại được sau** *(cần xác minh phạm vi kho lưu trữ trước khi dựa vào)*. |
| **Tuần 2 – 4 · trọng tài** | Không đổi. |
| **Tuần 4 – 6 · đặc trưng** | Áp **ngân sách mười tám suất** (mục 8.3). Thêm **Hàng rào 2** vào bộ test. |
| **Tuần 6 – 8 · mô hình biến động** | Không đổi. **Đây là phần duy nhất bạn tự chứng minh được** — mục 7.2. |
| **Tuần 8 – 9 · dải giá** | Thêm **Hàng rào 1** và **Hàng rào 3** — khoảng 4 giờ. |
| **Tuần 9 – 10 · đo** | **Chạy trọn bộ tám phép đo.** |
| **Tuần 10+** | **Mới:** chốt vũ trụ giao dịch xuống **8 – 10 đồng** (mục 7.3), giữ bốn mươi cặp cho hiển thị. |

## 8.2 · Tám phép đo đăng ký trước — viết ngưỡng TRƯỚC khi chạy

> Chín phương pháp nhân với vài biến thể mỗi cái là một bãi săn giá trị p. **Chốt cứng: tối đa tám phép thử, ngưỡng viết trước, Benjamini–Hochberg 0,10 trên cả tám.**

| Phép đo | Từ phương pháp | Giả thuyết | Ngưỡng sống (viết trước) |
|---|---|---|---|
| **1** ★ | Position Trading & Trend Following | Lưới 27 ô, giao ngay mua-hoặc-đứng-ngoài, khớp nến kế tiếp | **Ô TRUNG VỊ** của lưới, Sharpe sau phí ≥ **0,8**. Báo cáo toàn bộ bề mặt. |
| **2** ★ | Position Trading & Swing Trading | Tỉ lệ thắng thật của khung rào chắn 1,2σ̂ / 4,0σ̂ | ≥ **27,5%**. Random walk = 23,1%. **≤23,1% ⇒ dừng nhánh giao dịch.** |
| **3** ★ | Swing Trading | Tỉ lệ đúng hướng **theo nhóm ba biến động** | Không có ngưỡng đạt/trượt — đây là phép đo **thông tin**, trả lời giả định chịu lực của Kịch bản 4. Kết quả nào cũng hợp lệ. |
| **4** | Smart Money Concepts | Cờ quét-rồi-lấy-lại → tỉ lệ đúng hướng khung ngày có điều kiện | ≥ **+3 điểm** so **tỉ lệ nền khớp cửa sổ**. Không so với 50%. |
| **5** | Order Flow | Nhóm ba của tỉ lệ mua chủ động và độ dốc khối lượng tích luỹ → lợi suất ngày kế | **Đơn điệu** qua ba nhóm, chênh đầu-cuối ≥ 2 lần sai số chuẩn |
| **6** | Funding Rate | **Tái lập** `09 §2` trên dữ liệu của chính mình: funding chuẩn hoá > 2 → lợi suất 7 ngày | Dấu **DƯƠNG** (tiếp diễn). Ra âm ⇒ có lỗi đường ống hoặc `09` sai — **cả hai đều phải điều tra trước khi đi tiếp** |
| **7** | Order Flow, nhánh chuỗi thanh lý | Khối lượng hợp đồng mở dưới phân vị 5 kèm lợi suất dưới phân vị 5 → hồi 24 – 72 giờ | ≥ **+3 điểm** so tỉ lệ nền. Đo từ **khối lượng hợp đồng mở và giá**, tuyệt đối không từ bản đồ nhiệt |
| **8** | Day Trading | Tỉ lệ đúng khung 4 giờ so **chính ngưỡng thắng cần của nó** | **Kỳ vọng TRƯỢT.** Chạy để thất bại được *ghi nhận*, không phải *giả định*. Bất ngờ đạt ⇒ `RULE 11`: giả định rò rỉ |

**Sáu điều bị cấm khi chạy bộ này** *(chốt lúc đầu lạnh, hôm nay)*: thêm phép thử thứ chín · nới ngưỡng đã viết · đổi giai đoạn kiểm định · chạy lại với tham số khác rồi báo cáo lần chạy đẹp · bỏ một phép thử vì "rõ ràng nó không hợp lý" · diễn giải kết quả không đạt thành "gần đạt".

## 8.3 · Ngân sách mười tám suất đặc trưng cho lớp lọc

`10` giới hạn mười tám đặc trưng vì số quan sát hiệu dụng chỉ vài trăm. Suất phải cạnh tranh nhau:

| Nhóm | Suất | Đặc trưng | Từ phương pháp |
|---|---|---|---|
| **Chế độ** | 4 | Phân vị biến động 720 · tỉ số độ lệch chuẩn 90 ngày · phân vị khối lượng 720 · biên độ thực trung bình trên giá | Nền tảng |
| **Dòng lệnh** | 4 | Tỉ lệ mua chủ động chuẩn hoá · độ dốc khối lượng tích luỹ 24 · khối lượng chuẩn hoá 96 · dấu biến động giá nhân dấu biến động hợp đồng mở | **Phương Pháp 6** |
| **Chen chúc** | 2 | Funding chuẩn hoá 96 · mức funding | **Phương Pháp 7** |
| **Chất lượng cấu trúc** | 3 | Độ vượt biên phá vỡ theo độ lệch chuẩn · khoảng cách tới đỉnh/đáy · cờ quét-rồi-lấy-lại | **Phương Pháp 5 + 3** |
| **Liên thị trường** | 3 | Lợi suất Bitcoin · lợi suất vượt trội so Bitcoin · hệ số beta 30 ngày | `features.yaml` |
| **Thời gian** | 2 | Thứ trong tuần dạng sin và cos | **Phương Pháp 2** |
| **Tổng** | **18** | | |

**Danh sách chờ:** khoảng cách tới số tròn · khoảng cách tới điểm kiểm soát khối lượng · độ mới của chuỗi thanh lý · tương quan 30 ngày với Bitcoin.

> **Không có đặc trưng xu hướng hay động lượng nào trong mười tám suất. Cố ý.** Quy tắc vào lệnh **đã là** một bộ lọc xu hướng — nhét lại tỉ lệ giá trên đường trung bình vào lớp lọc là bắt mô hình học lại chính quyết định vừa được đưa ra, tiêu suất mà không thêm thông tin.

## 8.4 · Bốn hàng rào bằng mã

> Mọi kết luận ở trên đúng **hôm nay, lúc đầu lạnh**. Chúng sẽ bị thử thách vào cái đêm bảng điều khiển im lặng ba tuần liền. Hàng rào phải nằm trong mã và có test, không nằm trong trí nhớ.

**Hàng rào 1 · Chặn tường phí** *(giết Phương Pháp 1 và Phương Pháp 2 về mặt cấu trúc)*
```
với mọi (khung thời gian, công cụ):
    nếu ngưỡng_thắng_cần > sanity.suspicious_accuracy_1h:
        ý_định_giao_dịch PHẢI là None
```
Test: cố tình phát tín hiệu khung 4 giờ ⇒ khẳng định output là KHÔNG RÕ. Không cờ nào bật được nó.

**Hàng rào 2 · Cấm định danh hệ thuật ngữ** — mở rộng `config/features.yaml → forbidden` sang tên biến, kèm test quét `src/`.

**Hàng rào 3 · Chọn công cụ là hàm, không phải giả định** — test tại biên 3,33 ngày và tại 35 ngày (phải ra giao ngay).

**Hàng rào 4 · Bất biến sàn hợp đồng vĩnh cửu**
```
ngưỡng_thắng_cần(vĩnh_cửu, d) ≥ 50 + √(c₀·f)/A   với mọi d > 0
```
Một lỗi dấu trong số hạng funding sẽ khiến ngưỡng tụt xuống dưới sàn này. **Không test nào khác bắt được lỗi đó**, và mọi con số sau đó là số bịa.

---

# PHẦN 9 · MỘT ĐOẠN

> Chín phương pháp, xếp theo mức độ được nói tới trên mạng, gần như **đảo ngược hoàn toàn** thứ tự theo giá trị thật. Cái ồn ào nhất — **Phương Pháp 1: Scalping** đòn bẩy cao, **Phương Pháp 5: Smart Money Concepts**, bản đồ nhiệt thanh lý của **Phương Pháp 6**, bot tích luỹ tỉ lệ thắng 97% của **Phương Pháp 9** — đóng góp từ **không tới ba đặc trưng** cho module dự đoán. Cái ít ai gọi là "phương pháp" — **hàm chi phí của Phương Pháp 7** — quyết định tất cả những cái còn lại sống hay chết. Và thứ duy nhất có biên dương chứng minh được là thứ nhàm chán nhất: **Phương Pháp 4, theo xu hướng, trên giao ngay, mười lăm lệnh một năm, giữ hàng tháng.**
>
> Đó không phải trùng hợp. Bức tường phí là bộ lọc chọn lọc theo đúng một chiều — nó **thưởng cho kiên nhẫn và phạt sốt ruột**, và mọi phương pháp phổ biến đều được thiết kế để bán cho người sốt ruột.
>
> Nhưng điều đáng nhớ nhất của tài liệu này không nằm ở xếp hạng. Nó nằm ở Phát hiện thứ hai: **bạn không đủ dữ liệu để tự chứng minh một edge định hướng, và sẽ không đủ trong nhiều năm.** Chấp nhận điều đó không phải bi quan — nó là thứ duy nhất ngăn bạn diễn giải một kết quả may mắn thành kỹ năng, rồi đặt tiền thật lên đó.

---

*Nguồn số liệu: `09` (đã qua phản biện đối kháng) · `10` (kiến trúc và mười bốn điều bắt buộc). Các bảng ở Phần 2 và toàn bộ Phần 7, cùng các công thức `d* = c₀/f`, `p*_min = 50 + √(c₀·f)/A`, và toàn bộ phép tính công suất thống kê, **được tính lại độc lập trong phiên 26/08/2026**. Trạng thái repo kiểm trên đĩa cùng ngày.*
