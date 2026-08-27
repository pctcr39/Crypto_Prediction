# THIẾT KẾ MODULE PREDICTION — BẢN HỆ THỐNG HOÁ

> **Trạng thái: CHỜ DUYỆT** · Phiên bản 1.0-rc1 · 27/08/2026
> Tài liệu này **thay thế** vai trò tra cứu của `10`–`17` cho việc implement. Các tài liệu đó giữ nguyên làm **hồ sơ bằng chứng**; mọi con số ở đây truy về chúng qua Phụ lục A.
> Đọc được một mạch, không cần mở tài liệu khác để viết mã.
> **Không phải lời khuyên đầu tư.**

---

# PHẦN 0 · PHẠM VI VÀ HỢP ĐỒNG SẢN PHẨM

## 0.1 · Quyết định phạm vi — chốt 27/08/2026

> **Hệ thống này DỰ ĐOÁN và KHUYẾN NGHỊ. Nó không đặt lệnh, không giữ khoá API giao dịch, không chạm vào tiền.**
> **Người dùng đọc, quyết định, và tự thực thi.**

## 0.2 · Bốn thứ hệ phát ra

| # | Đầu ra | Bản chất | Có ở khung nào |
|---|---|---|---|
| **1** | `expected_vol_pct` — biến động kỳ vọng | Dự báo, có bằng chứng | Mọi khung |
| **2** | `q10 / q50 / q90` — dải giá | Dự báo, suy từ (1) | Mọi khung |
| **3** | `p_up` — xác suất tăng | Dự báo, suy từ cùng một phân phối | Mọi khung |
| **4** | **Khuyến nghị vào lệnh** — hướng · mức dừng lỗ · mức chốt lời · cỡ gợi ý | **Lời khuyên có điều kiện**, kèm ngưỡng hoà vốn của chính nó | **Chỉ khung 1 ngày** |

Kèm theo mọi lúc, không bao giờ ẩn: **`p_required`** (ngưỡng thắng cần để hoà vốn) · **`trend_weight`** (đồng hồ xu hướng) · **`data_freshness`** · **`silence_reason`**.

## 0.3 · Phạm vi thay đổi những gì so với `17`

| Hạng mục | Trước (hệ tự giao dịch) | **Nay (hệ khuyến nghị)** |
|---|---|---|
| Tầng L7 | Định cỡ + veto **thực thi** | **Khuyến nghị cỡ + cảnh báo rủi ro** — người dùng quyết |
| Lệnh dừng lỗ | Lệnh stop-limit **treo trên sàn** | **Mức giá khuyến nghị**, hiển thị; người dùng tự đặt |
| Đối soát (L8) | Đối soát vị thế với sàn mỗi 5 phút | **Theo dõi kết cục của khuyến nghị đã phát** |
| Khoá API | Cần khoá giao dịch từ GATE 4 | **Không cần khoá giao dịch. Chỉ đọc dữ liệu công khai** |
| GATE 2–4 (tiền thật) | Trong phạm vi | **Ngoài phạm vi hiện tại** |
| **GATE 1 (kỹ năng dự báo)** | Trong phạm vi | **Vẫn trong phạm vi — và là cổng DUY NHẤT còn lại** |
| Câu hỏi về vốn | Cần trả lời | **Không áp dụng** |

## 0.4 · Vì sao phạm vi này NÂNG chuẩn trung thực, không hạ

Khi hệ tự giao dịch, sai lầm của nó hiện ra thành lỗ — một cơ chế phản hồi tàn nhẫn nhưng tự động. **Khi hệ chỉ khuyên, không có cơ chế nào tự động phát hiện nó sai.** Người dùng có thể làm theo lời khuyên tồi trong nhiều tháng mà không ai biết.

⇒ Ba yêu cầu **chặt hơn** hệ tự giao dịch:

| # | Yêu cầu | Vì sao |
|---|---|---|
| **1** | **Mọi khuyến nghị đã phát đều bất biến và được chấm điểm** — không sửa, không xoá, không "quên" | Không có sổ lệnh sàn làm bằng chứng khách quan. Sổ của hệ **chính là** bằng chứng duy nhất |
| **2** | **Bảng điểm công khai là một phần của sản phẩm**, không phải trang phụ | Người dùng không thể đánh giá lời khuyên nếu không thấy lịch sử đúng/sai |
| **3** | **Mọi khuyến nghị đứng cạnh ngưỡng hoà vốn của chính nó** | Một khuyến nghị không kèm `p_required` là con số vô nghĩa được trình bày như con số có nghĩa |

---

# PHẦN 1 · KIẾN TRÚC

## 1.1 · Chín tầng

```
┌─ L0 · TIẾP NHẬN & ĐỘ TƯƠI ─────────────────────────── QUY TẮC ─┐
│  gộp nến · khử trùng lặp theo open_time                          │
│  máy trạng thái: LIVE / CHẬM / MẤT KẾT NỐI / CŨ                  │
│  ⛔ CHẬM hoặc MẤT KẾT NỐI ⇒ CHẶN PREDICT, không phải cờ hiển thị │
└──────────────────────────────────────────────────────────────────┘
┌─ L1 · LÕI ĐẶC TRƯNG ───────────────────────────────── QUY TẮC ─┐
│  MỘT đường mã dùng chung batch ↔ live                            │
│  shift_all(1) · assert_scale_free() · MỘT hàm biến động          │
└──────────────────────────────────────────────────────────────────┘
┌─ L2 · HAI ĐẠI LƯỢNG DỰ BÁO ĐƯỢC ──────────────────── HỌC MÁY ─┐
│  σ̂ ← HAR-RV (fallback EWMA λ=0,94 tất định)                     │
│  f̂ ← funding EWMA bán rã 7 ngày                                 │
│  ★ TẦNG DUY NHẤT TỰ CHỨNG MINH ĐƯỢC (11 quan sát, xem §8.4)     │
└──────────────────────────────────────────────────────────────────┘
┌─ L3 · MỘT PHÂN PHỐI F ─────────────────────────────── QUY TẮC ─┐
│  F = Normal(0, σ̂√H) trên LOG-RETURN                             │
│  q_α = last_close·exp(z_α·σ̂·√H)  ·  p_up = 1 − F(0)             │
│  ✅ Ba đầu ra là BA CÁCH ĐỌC của MỘT F ⇒ mâu thuẫn bất khả       │
└──────────────────────────────────────────────────────────────────┘
┌─ L4 · CỔNG PHÍ ────────────────────────────────────── QUY TẮC ─┐
│  p_required (hiển thị, mọi khung)  ·  p*_event (quyết định, 4:1) │
│  ⛔ Khung không thuộc TRADE_TF ⇒ dừng ở đây, chỉ hiển thị        │
└──────────────────────────────────────────────────────────────────┘
┌─ L5 · HƯỚNG SƠ CẤP ────────────────────────────────── QUY TẮC ─┐
│  Tổ hợp 27 ô xu hướng → w ∈ {0; 0,25; 0,50; 0,75; 1}            │
│  Máy trạng thái TRANCHE sinh sự kiện khuyến nghị                 │
└──────────────────────────────────────────────────────────────────┘
┌─ L6 · LỌC BỎ ──────────────────────────────────────── HỌC MÁY ─┐
│  «sự kiện này chạm chốt lời trước dừng lỗ không?»                │
│  ⛔ KHÔNG BAO GIỜ tạo hướng — chỉ được LOẠI BỎ tranche           │
└──────────────────────────────────────────────────────────────────┘
┌─ L7 · CỠ GỢI Ý & CẢNH BÁO ─────────────────── HỌC MÁY + QUY TẮC ┐
│  suggested_size_pct + danh sách cảnh báo rủi ro                  │
│  KHÔNG đặt lệnh. Người dùng quyết định.                          │
└──────────────────────────────────────────────────────────────────┘
┌─ L8 · SỔ KHUYẾN NGHỊ & BẢNG ĐIỂM ──────────────────── QUY TẮC ─┐
│  Sổ bất biến · chấm kết cục · QLIKE · độ phủ · CRPSS · FVA      │
│  ✅ Chạy VÔ ĐIỀU KIỆN, kể cả khi hệ im lặng hoàn toàn           │
└──────────────────────────────────────────────────────────────────┘
```

## 1.2 · Nguyên tắc phân bổ rule ↔ học máy

| Thuộc về **QUY TẮC** | Thuộc về **HỌC MÁY** |
|---|---|
| Phí, funding, ngưỡng hoà vốn, chọn công cụ | Mức biến động có điều kiện (σ̂) |
| Hướng sơ cấp (tổ hợp xu hướng) | Mức funding có điều kiện (f̂) |
| Hình dạng cược, mức dừng lỗ/chốt lời | Ánh xạ hiệu chỉnh xác suất |
| Máy trạng thái tranche, độ tươi, giới hạn | **Sự kiện nào nên bỏ** (L6) |

> **Bất biến trung tâm — QUYỀN ĐƠN ĐIỆU:** học máy chỉ được **thu hẹp** tập khuyến nghị. Nó không bao giờ tạo ra một hướng và không bao giờ đảo hướng. Fuzz-test được ở mức tranche (§6).

## 1.3 · Ba đại lượng và năng lực dự báo — nền tảng của mọi lựa chọn

| Đại lượng | Công cụ | OOS R² | Hệ quả kiến trúc |
|---|---|---|---|
| **Hướng giá** | — | **0,00 – 0,01** | Giao cho **quy tắc** có bằng chứng ngoại sinh, không giao cho học máy |
| **Biến động** | HAR-RV | **0,40 – 0,60** | Học máy, và là tầng tự chứng minh được |
| **Funding** | EWMA bán rã 7 | **0,44 – 0,51** | Học máy, cùng đợt với biến động |

Cả **tử số** (chi phí, qua f̂) lẫn **mẫu số** (biên độ, qua σ̂) của ngưỡng quyết định đều dự báo được tốt. Chỉ đại lượng đem so với nó — hướng — là không. **Vì thế cổng phí là bộ phận đáng tin cậy nhất của toàn hệ.**

---

# PHẦN 2 · HỢP ĐỒNG DỮ LIỆU

```python
from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime
from typing import Literal, Optional

Freshness = Literal["live", "delayed", "disconnected", "stale"]
TrancheStatus = Literal["active", "hit_target", "hit_stop", "expired", "superseded"]

@dataclass(frozen=True)
class Tranche:
    """MỘT KHUYẾN NGHỊ vào lệnh. Bất biến sau khi phát — mọi thay đổi trạng thái
    tạo bản ghi MỚI trong sổ, không sửa bản ghi cũ."""
    tranche_id: str                    # symbol|open_time|level|model_sha
    symbol: str
    level: float                       # 0,25 | 0,50 | 0,75 | 1,00
    entry_ref_price: float             # giá tham chiếu lúc phát khuyến nghị
    entry_time: datetime               # UTC
    sigma_entry: float                 # σ̂ tại lúc phát — đóng băng cùng khuyến nghị
    stop_price: float                  # MỨC KHUYẾN NGHỊ — người dùng tự đặt lệnh
    target_price: float
    deadline: datetime                 # entry_time + 60 ngày
    suggested_size_pct: float          # % NAV — GỢI Ý, không phải chỉ thị
    instrument: Literal["spot"]        # không có giá trị khác ở tầng kiểu
    status: TrancheStatus
    p_star_at_entry: float             # ngưỡng hoà vốn lúc phát — để chấm lại sau

@dataclass(frozen=True)
class Prediction:
    """Một lần suy luận. HÀM THUẦN sinh ra nó: không đồng hồ, không I/O, không global."""
    # ── định danh · khoá idempotent từ bản ghi ĐẦU TIÊN ──
    symbol: str
    timeframe: Literal["1h", "4h", "1d"]
    open_time: datetime                # nến ĐÓNG sinh ra dự đoán này, UTC
    model_sha: str                     # git hash + hash config

    # ── ba đầu ra: BA CÁCH ĐỌC CỦA MỘT PHÂN PHỐI ──
    expected_vol_pct: float            # σ̂ — nguồn duy nhất
    q10: float
    q50: float
    q90: float
    p_up: float                        # = 1 − F(0). SUY RA, không mô hình riêng

    # ── kinh tế học quyết định · LUÔN hiện diện, kể cả khi im lặng ──
    p_required: float                  # tính TRONG MÃ, không đọc từ config
    e_move_pct: float
    cost_assumed_pct: float
    instrument: Literal["spot", "perp"]  # ĐẦU RA của bảng chi phí (hiển thị)

    # ── khuyến nghị · None và () là giá trị HỢP LỆ và THƯỜNG GẶP ──
    trend_weight: Optional[float]      # w — đồng hồ xu hướng, hiển thị cả khi im lặng
    new_tranches: tuple[Tranche, ...]  # khuyến nghị MỚI phát lần này
    active_tranches: tuple[Tranche, ...]  # khuyến nghị còn hiệu lực
    warnings: tuple[str, ...]          # cảnh báo rủi ro từ L7

    # ── trung thực · bắt buộc ──
    data_freshness: Freshness
    silence_reason: Optional[str]      # BẮT BUỘC khi new_tranches rỗng

@dataclass(frozen=True)
class TrancheBook:
    """Trạng thái giữa hai lần suy luận. Vào-ra qua tham số để predict() thuần."""
    active: tuple[Tranche, ...]
    closed: tuple[Tranche, ...]
```

**Ba quyết định nằm trong hợp đồng, không nằm trong tài liệu:**

1. `p_required` là **trường bắt buộc** — mọi con số phải đứng cạnh hoà vốn của chính nó.
2. `silence_reason` **bắt buộc khi không có khuyến nghị mới** — im lặng phải tự giải thích, nếu không người dùng đọc nó là hỏng hóc rồi tự hạ ngưỡng.
3. Không có giá trị `"SHORT"`, không có `instrument` nào khác `"spot"` cho tranche — loại ở **tầng kiểu**, không ở tầng quy ước.

---

# PHẦN 3 · ĐẶC TẢ TỪNG TẦNG

## L0 · Tiếp nhận và độ tươi

```python
def freshness(bars, now_hint, cfg) -> Freshness:
    """now_hint truyền VÀO — predict() không đọc đồng hồ."""
    age = now_hint - bars.index[-1] - timeframe_delta(cfg.tf)
    if age <= cfg.live_max:          return "live"          # ≤ 1 chu kỳ
    if age <= cfg.delayed_max:       return "delayed"       # ≤ 3 chu kỳ
    return "disconnected"
```

**Bất biến:** `delayed` hoặc `disconnected` ⇒ `new_tranches == ()` và `silence_reason` được điền. Không cờ nào bật được nó.

## L1 · Lõi đặc trưng

- Đúng **một** hàm `shift_all(1)`; không đường vòng.
- `assert_scale_free()` chạy trên mọi cột.
- **Một** hàm biến động duy nhất, dùng chung batch ↔ live, định nghĩa **đóng băng**.
- Bộ đặc trưng: **13 suất dựng được + 5 suất chờ dữ liệu** (Phụ lục B).

**Phép thử rò rỉ thứ sáu:** chạy cùng đoạn lịch sử qua hai đường (batch và live), `assert σ̂ khớp 1e-6`.

## L2 · Hai đại lượng dự báo được

```python
def har_rv(feats) -> float:
    """HAR-RV: OLS trên log(RV) ba thang 1d/5d/22d. 4 hệ số, refit hàng tuần.
    Chấm bằng QLIKE (Patton 2011), KHÔNG phải MSE."""

def ewma_sigma(feats, lam=0.94) -> float:
    """Fallback TẤT ĐỊNH khi HAR phân kỳ. λ=0,94 — quy ước RiskMetrics 1996,
    không tinh chỉnh."""

def forecast_funding_daily(hist_8h, *, asof) -> float:
    """OOS R² 0,437–0,514. TIỀN ĐIỀU KIỆN: hist_8h chỉ gồm kỳ ĐÃ CHỐT trước asof."""
    hist  = hist_8h[hist_8h.index < asof]
    cnt   = hist.resample("1D").count()
    daily = (hist.resample("1D").sum() / cnt * 3)[cnt >= 3]   # loại bin chưa đủ 3 kỳ
    return clamp(daily.ewm(halflife=7).mean().iloc[-1] * 100, -1.40, +1.40)
```

| Chế độ hỏng | Phản ứng |
|---|---|
| HAR phân kỳ (σ̂ ngoài khoảng hợp lý) | Rơi về `ewma_sigma`, ghi nhật ký |
| Chuỗi funding thiếu hoặc cũ > 24 giờ | `f̂ = p95 EXPANDING tới t` (giả định xấu nhất — luồng dữ liệu hỏng đúng lúc thị trường động) |

## L3 · Một phân phối

```python
F = Normal(mu=0.0, sd=sigma_hat * sqrt(H_days))       # trên LOG-RETURN
q_alpha = last_close * exp(F.ppf(alpha))
p_up    = 1 - F.cdf(0.0)                              # ≡ 0,50 khi mu = 0
```

> **`p_up ≡ 0,50` là ĐẦU RA TRUNG THỰC, không phải lỗi.** Tỉ số phương sai đo được ≈ 1 (gần bước ngẫu nhiên) ⇒ ở tầng phân phối hệ **không có ý kiến về hướng**. Trạng thái xu hướng được thể hiện bằng **`trend_weight`**, một đồng hồ quy tắc — không bằng một xác suất bịa ra để trông có vẻ thông minh.
>
> Nếu về sau có bằng chứng μ ≠ 0 ở chân trời nào đó, μ vào đây và `p_up` tự lệch khỏi 0,50 — kiến trúc không phải đổi.

## L4 · Cổng phí

```python
ABS_MOVE_RATIO = 0.685    # E|move|/σ̂ ĐO ĐƯỢC (2,06/3,00 trên BTC ngày)
                          # KHÔNG dùng hệ số Gauss 0,798 — đuôi dày làm nó lệch ~16%

def cost_pct(H_days, instrument, f_daily) -> float:
    if instrument == "spot": return 0.30          # taker 0,10×2 + trượt 0,05×2
    return 0.20 + f_daily * H_days                # perp — chỉ để HIỂN THỊ

def cost_gate(H_days, instrument, f_daily) -> float:
    """Funding âm là thu nhập nhưng KHÔNG BAO GIỜ được hạ ngưỡng quyết định
    xuống dưới mức phí giao dịch thuần."""
    return max(cost_pct(H_days, instrument, max(f_daily, 0.0)), 0.20)

def p_required_symmetric(sigma_d, H_days, instrument, f_daily) -> PReq:
    """CỔNG HIỂN THỊ — cược đối xứng 1:1. In trên MỌI panel."""
    e_move = sigma_d * ABS_MOVE_RATIO * sqrt(H_days) * 100
    return PReq(0.5 + cost_gate(H_days, instrument, f_daily) / (2 * e_move))

def p_star_event(sigma_d, sl_mult=1.2, tp_mult=4.0) -> PStar:
    """CỔNG QUYẾT ĐỊNH — GIAO NGAY (chi phí không phụ thuộc thời gian giữ
    ⇒ không cần tham số thời gian). sigma_d là PHÂN SỐ (vd 0.030).

    ★ payoff = tp_mult / sl_mult = 4,0/1,2 = 3,333R — KHÔNG phải 4,0R.
      sl_mult và tp_mult là hệ số của σ̂, không phải tỉ số R. Nhầm hai thứ này
      là lỗi thứ nguyên đã lan qua sáu tài liệu — xem ADR-013."""
    payoff = tp_mult / sl_mult
    c_R    = 0.30 / (sl_mult * sigma_d * 100)     # chi phí quy về đơn vị R
    return PStar((1 + c_R) / (payoff + 1))
```

**Hai cổng là hai kiểu dữ liệu `PReq` / `PStar` — không so sánh chéo được.** Đây là biện pháp chống lặp lại lỗi thứ nguyên đã xảy ra hai lần trong dự án này.

**Kiểm số học:**

| σ̂ (độ lệch chuẩn log-return ngày) | R = 1,2σ̂ | c_R | **p\*** |
|---|---|---|---|
| 3,00% (BTC 2021–26) | 3,60% | 0,083 | **25,0%** |
| 2,43% (chế độ vol thấp 2023–26) | 2,92% | 0,103 | **25,5%** |
| | | *dao động* | **0,5 điểm** |
| *Đối chiếu: cược đối xứng giao ngay, cùng hai chế độ* | | | *56,4% → 58,8% = 2,4 điểm* |

> **Đây là lý do tồn tại của hình dạng cược bất đối xứng:** nó làm ngưỡng hoà vốn **gần bất biến theo chế độ thị trường** (0,5 so với 2,4 điểm). Đó là cách duy nhất đã tìm thấy để biến một trần năng lực cố định (51–56%) thành kỳ vọng dương mà không cần giả định nào về chế độ.

**Bất biến khoảng cách — hình dạng cược KHÔNG tạo ra edge:**

```
null(bước ngẫu nhiên không trôi) = sl/(sl+tp)              = 23,1%
hoà vốn                          = (1+c_R)/(tp/sl + 1)     = 25,0%
khoảng cách                      = c_R/(1 + tp/sl)         = 1,92 điểm   ← LUÔN DƯƠNG
```

> Dưới bước ngẫu nhiên, **mọi** cấu hình rào chắn đều lỗ, đúng bằng `c_R/(1+r)`. Hình dạng cược chỉ đổi **mức nâng tỉ lệ thắng mà tín hiệu phải cung cấp** — với 1,2/4,0 là 1,92 điểm; tín hiệu đo được nâng **10,6 điểm** (23,1% → 33,7%).

**Kiểm độ bền qua bề mặt tham số rào** *(89 lệnh, 4 cặp — kiểm tra, KHÔNG phải thủ tục chọn)*:

| stop / target | payoff | null | hoà vốn | đo được | **biên** |
|---|---|---|---|---|---|
| 1,0 / 4,0 | 4,00R | 20,0% | 22,0% | 29,2% | +7,2 |
| **1,2 / 4,0** ← dùng | **3,33R** | **23,1%** | **25,0%** | **33,7%** | **+8,7** |
| 1,2 / 4,8 | 4,00R | 20,0% | 21,7% | 29,2% | +7,5 |
| 1,5 / 4,0 | 2,67R | 27,3% | 29,1% | 36,0% | +6,9 |
| 2,0 / 3,0 | 1,50R | 40,0% | 42,0% | 56,2% | +14,2 |

**16/16 ô cho biên dương** (trung vị +8,2 · độ lệch 2,8) ⇒ kết luận không phụ thuộc lựa chọn rào. Ô đang dùng nằm **trên** trung vị. Nâng target lên 4,8σ̂ để có payoff 4:1 thật cho biên **thấp hơn** (+7,5). *Biên không đơn điệu theo payoff — ô 2,0/3,0 cho biên lớn nhất; chọn nó sẽ là selection-on-data bị cấm, nhưng nó cho thấy luận điểm của hình dạng cược là về **bất biến theo chế độ**, không phải về tối đa hoá biên.*

**Sức chịu trượt giá của mức dừng lỗ:**

Tỉ lệ chốt lời đo được: **33,7%** (89 lệnh, 4 cặp, vào tại `open[t+1]`).

| Lỗ thực nhận | EV mỗi lệnh |
|---|---|
| **1,00R** *(giả định nền)* | **+0,377R** |
| 1,30R *(ngưỡng cảnh báo)* | +0,171R |
| 1,40R *(ngưỡng chặn)* | +0,105R |
| 1,50R | +0,046R |
| **1,57R** | **−0,001R** ← hoà vốn |

Ngưỡng cảnh báo 1,3R và chặn 1,4R nằm **trong vùng kỳ vọng dương** — chúng là cổng thận trọng, không phải điểm kỳ vọng âm.

## L5 · Hướng sơ cấp

### Tín hiệu một ô

```python
# QUY ƯỚC CHỈ SỐ (duy nhất, toàn tài liệu):
#   "high N nến trước t" = rolling(N).max().shift(1) — BAO GỒM t−1, KHÔNG gồm t
def cell_signal(bars, ef, es, dn) -> int:            # 0 hoặc 1
    vao = close[t] > EMA(close, es)[t] and close[t] > rolling_max(high, dn).shift(1)[t]
    ra  = close[t] < EMA(close, ef)[t]
    # máy trạng thái 0 ⇄ 1. Không có trạng thái bán khống.
```

**Lưới đóng băng:** `{10,20,50} × {100,150,200} × {20,55,100}` = **27 ô**, hash pin trong test.

> ⚠️ **Nhãn trung thực:** lưới này, quyết định tổ hợp, và k=1 đều được chốt **sau khi nhìn** BTC/ETH/SOL/DOGE 2021–2026. Chúng "đóng băng kể từ hôm nay", **không phải** "đăng ký trước khi thấy dữ liệu". Hệ quả nằm ở giao thức khử nhiễm khi chấm GATE 1 — §8.3.

### Tổ hợp

```python
w = round_to(mean(cell_signal(bars, *c) for c in GRID_27), {0, .25, .50, .75, 1.0})
```

| Quyết định | Lý do (đã đo) |
|---|---|
| Tổ hợp thay vì chọn ô | Tương quan hạng tham số giữa hai đoạn thời gian chỉ **+0,19**; ô tốt nhất quá khứ cho đúng bằng mua-và-giữ ở tương lai |
| Trọng số đều 27 ô | Mọi trọng số khác là tham số mới |
| 5 mức rời rạc | Làm **sự kiện đếm được và gán nhãn được**. Nó **không** giảm phí (đo: turnover rời rạc 8,0 vs liên tục 8,1/năm) |
| Không hysteresis | Flapping đo được 0,8–1,8 cặp/năm, phí 0,09–0,18%/năm — nhỏ hơn giá của một tham số mới |

### Máy trạng thái tranche

```
SỰ KIỆN MỞ = mỗi bước 0,25 mà w vượt LÊN và slot đó đang TRỐNG
    · bước nhảy k mức trong một nến ⇒ k SỰ KIỆN RIÊNG (cùng entry, cùng σ̂)
    · stop  = entry × (1 − 1,2·σ̂)      ← σ̂ NGÀY (k = 1)
    · target= entry × (1 + 4,0·σ̂)
    · deadline = entry_time + 60 ngày

★ TÁI VŨ TRANG — quy tắc KHÔNG tham số:
    khi một tranche đóng, slot thành TRỐNG ngay;
    tại close kế tiếp, nếu w vẫn ≥ mức slot ⇒ SỰ KIỆN MỚI (entry mới, σ̂ mới).
    Không cooldown — cooldown là tham số mới.

SỰ KIỆN ĐÓNG:
    · chạm target/stop  — soi INTRABAR (high/low); cùng nến chạm cả hai ⇒ STOP trước
    · w bước XUỐNG      — đóng theo LIFO
    · quá deadline
    (Người dùng có thể đã thoát sớm hoặc không vào — sổ ghi nhận điều đó riêng, §5.3)
```

**Vì sao k = 1 (thang σ̂ ngày):** ở thang 35 ngày, đo được **11/23 lệnh kết thúc bằng hết hạn** thay vì chạm rào giá ⇒ hình dạng 4:1 **không xảy ra**, và toàn bộ lập luận kinh tế sụp. Ở k=1: **0/23 hết hạn**, thời gian nắm giữ thực tế ~6 ngày.

**Ba tham số của rào chắn là ràng buộc lẫn nhau, chỉ chọn được hai trong ba.** Dưới bước ngẫu nhiên, thời gian kỳ vọng chạm một trong hai rào = `1,2k · 4,0k = 4,8k²` ngày; với hạn 60 ngày thì `k ≈ 1` là điểm mà rào giá chi phối.

## L6 · Lọc bỏ

```python
# LightGBM năng lực thấp: depth 3 · ≤15 lá · ≤18 đặc trưng · ≤300 cây
# trọng số mẫu theo ĐỘ DUY NHẤT NHÃN
# isotonic: fit trên tập validation TÁCH RIÊNG trong từng fold purged walk-forward,
#           GỘP TOÀN VŨ TRỤ (số sự kiện mỗi đồng không đủ hiệu chỉnh riêng)
# ĐIỀU KIỆN BẬT: ≥300 sự kiện đã chấm. Trước đó meta.predict ≡ 1,0 (hệ chạy thuần quy tắc)
kept = [ev for ev in events if calibrate(meta.predict(feats, ev)) >= p_star + 0.02]
```

**Nhãn:**

| Kết cục | Nhãn |
|---|---|
| Chạm target trước stop | `1` |
| Chạm stop trước | `0` |
| **Thoát bằng LIFO hoặc deadline** | **RIGHT-CENSORING**: nhãn = dấu(lợi suất thực nhận sau phí), trọng số × (thời gian sống / trung vị) |

> ⛔ **CẤM nhãn phản thực** ("nếu để nguyên thì chạm gì") — nó dùng dữ liệu **sau** thời điểm thoát, là rò rỉ đúng nghĩa RULE 2. Quy mô hiện tượng: LIFO-thoát ≈ **16%** tổng tranche (BTC 28% · ETH 14%, trong đó 56% số tranche ETH bị LIFO lẽ ra chạm target).

**Cổng sống của L6:** precision **+≥5pp** so với không lọc. **< +3pp ⇒ XOÁ TẦNG NÀY** — đó là kết quả hợp lệ.

## L7 · Cỡ gợi ý và cảnh báo

```python
size_base(coin)      = 4% NAV theo NOTIONAL
một tranche 0,25     = 1% NAV                    ← trần "≤1% mỗi khuyến nghị"
Σ notional một coin ≤ 4% NAV
```

> **Sizing theo rủi-ro-cố-định bị TỪ CHỐI:** nghịch đảo σ̂ làm notional một tranche lên **32–55% vốn** khi biến động thấp — phá mọi trần. Cỡ theo notional cố định là quy ước 0 tham số và luôn nằm trong trần.

**Cảnh báo (không chặn — người dùng quyết):**

| Cảnh báo | Kích hoạt |
|---|---|
| `TUONG_QUAN_CAO` | > 3 coin cùng có tranche mở đồng thời (tương quan → 1 khi thị trường sập) |
| `CHUOI_THUA` | ≥ 5 tranche đóng bằng stop liên tiếp *(xác suất 5,8% ở tỉ lệ thắng 30% — nằm trong thiết kế, không phải lỗi)* |
| `VOL_CUC_DOAN` | σ̂ vượt phân vị 95 của 90 ngày |
| `FUNDING_NONG` | f̂ > 0,05%/ngày *(bối cảnh: chi phí giữ vị thế trên perp — hệ khuyến nghị giao ngay)* |
| `DU_LIEU_CHAM` | freshness ≠ live |

## L8 · Sổ khuyến nghị và bảng điểm

Xem Phần 5 và Phần 9 — với hệ khuyến nghị, đây là tầng **quan trọng nhất**.

---

# PHẦN 4 · HÀM QUYẾT ĐỊNH

```python
TRADE_TF   = frozenset({"1d"})                    # DANH SÁCH TRẮNG — rào CHÍNH
RULE11_ACC = 0.60                                 # dây an toàn thứ hai (RULE 11)
H_DAYS     = {"1h": 4/24, "4h": 1.0, "1d": 1.0}   # từ config horizon_bars

def predict(bars, funding_hist, book: TrancheBook, now_hint, cfg
            ) -> tuple[Prediction, TrancheBook]:
    """HÀM THUẦN: mọi trạng thái vào-ra qua tham số; không đồng hồ, không I/O,
    không global. Gọi hai lần cùng đầu vào ⇒ giống hệt từng byte."""

    # ── L0 ── độ tươi chặn trước mọi thứ
    fresh = freshness(bars, now_hint, cfg)
    if fresh in ("delayed", "disconnected"):
        return no_opinion(fresh, "dữ liệu không đủ tươi"), book

    # ── L1–L2 ──
    feats = build_features(bars)                          # shift_all(1) bên trong
    sigma = har_rv(feats) or ewma_sigma(feats, lam=0.94)
    f_hat = forecast_funding_daily(funding_hist, asof=bars.close_time)

    # ── L3 ── một phân phối, ba cách đọc
    H = H_DAYS[cfg.tf]
    F = Normal(mu=0.0, sd=sigma * sqrt(H))
    q10, q50, q90 = (last_close * exp(F.ppf(a)) for a in (0.10, 0.50, 0.90))
    p_up  = 1 - F.cdf(0.0)

    # ── L4 ── cổng phí
    p_req = p_required_symmetric(sigma, H, "spot", f_hat)
    if cfg.tf not in TRADE_TF or p_req.value > RULE11_ACC:
        return display_only(F, p_req, w=None,
                            reason="khung hiển thị — không phát khuyến nghị"), book

    # ── L5 ── hướng + máy trạng thái tranche
    w = ensemble_weight(bars, GRID_27)
    events, book2 = tranche_step(w, book, sigma, last_close, bars.close_time)
    if not events:
        return display_only(F, p_req, w, f"w={w:.2f} — không có slot mở"), book2

    # ── L6 ── học máy CHỈ LỌC BỎ
    p_star = p_star_event(sigma)
    kept = [ev for ev in events
            if calibrate(meta.predict(feats, ev)) >= p_star.value + 0.02]
    if not kept:
        return display_only(F, p_req, w,
                            f"L6 loại {len(events)} sự kiện (p_win < {p_star.value:.3f}+2pp)"), book2

    # ── L7 ── cỡ gợi ý + cảnh báo (KHÔNG chặn)
    sized = [with_size(ev, cfg) for ev in kept]
    warns = collect_warnings(book2, sigma, f_hat, fresh)

    return Prediction(
        symbol=cfg.symbol, timeframe=cfg.tf, open_time=bars.index[-1],
        model_sha=cfg.model_sha,
        expected_vol_pct=sigma * 100, q10=q10, q50=q50, q90=q90, p_up=p_up,
        p_required=p_req.value, e_move_pct=..., cost_assumed_pct=...,
        instrument=choose_instrument_display(H, f_hat),
        trend_weight=w, new_tranches=tuple(sized),
        active_tranches=book2.active, warnings=warns,
        data_freshness=fresh, silence_reason=None,
    ), book2.with_new(sized)
```

**Bất biến của hàm này:** mọi nhánh hoặc trả `display_only` (không khuyến nghị mới), hoặc trả khuyến nghị **theo đúng hướng mà L5 quyết**. **Không nhánh nào tạo ra hướng.** L6 chỉ xuất hiện ở vị trí có thể trả `display_only`.

---

# PHẦN 5 · VÒNG ĐỜI KHUYẾN NGHỊ

## 5.1 · Sổ bất biến

| Thuộc tính | Đặc tả |
|---|---|
| Lưu trữ | SQLite hoặc Parquet, **chỉ ghi thêm** (append-only) |
| Khoá idempotent | `symbol\|open_time\|level\|model_sha` — từ bản ghi **đầu tiên** |
| Sửa đổi | **Không.** Đổi trạng thái ⇒ bản ghi **mới**, giữ nguyên bản cũ |
| Xoá | **Không bao giờ.** Kể cả khuyến nghị sai, kể cả bug |

> Với hệ tự giao dịch, sổ lệnh của sàn là bằng chứng khách quan. **Với hệ khuyến nghị, sổ này LÀ bằng chứng duy nhất.** Một sổ có thể sửa là một sổ không có giá trị.

## 5.2 · Máy trạng thái

```
      phát khuyến nghị
            │
            ▼
        [ active ] ──── chạm target ──────► [ hit_target ]
            │      ──── chạm stop ────────► [ hit_stop   ]
            │      ──── quá deadline ─────► [ expired    ]
            │      ──── w bước xuống ─────► [ superseded ]  (LIFO)
            │
            └──── slot trống ⇒ đủ điều kiện tái vũ trang ở close kế tiếp
```

## 5.3 · Theo dõi việc người dùng có làm theo hay không

Hệ **không biết** người dùng có vào lệnh không, và **không được giả định**. Sổ tách hai lớp:

| Lớp | Nội dung | Ai ghi |
|---|---|---|
| **Lớp khuyến nghị** (bắt buộc, tự động) | Hệ đã khuyên gì, kết cục theo quy tắc của chính nó | Hệ |
| **Lớp thực thi** (tuỳ chọn, thủ công) | Người dùng có vào không, giá vào thật, thoát khi nào | Người dùng, nếu muốn |

**Bảng điểm chấm trên LỚP KHUYẾN NGHỊ.** Đây là điểm quan trọng: nếu chấm trên lớp thực thi, hệ sẽ được tha bổng cho những lời khuyên tồi mà người dùng tình cờ bỏ qua — và bị đổ lỗi cho những lệnh người dùng tự nghĩ ra. Hai lớp phải tách bạch, và **chỉ lớp đầu quyết định hệ có kỹ năng hay không**.

## 5.4 · Khởi động lại

```
đọc sổ → dựng lại TrancheBook từ các bản ghi status="active"
       → đối chiếu: mọi tranche active phải có deadline > hiện tại
       → tranche quá hạn mà chưa đóng ⇒ đóng với status="expired", ghi cảnh báo
       → KHÔNG BAO GIỜ tự tạo lại rào chắn từ trí nhớ hoặc từ giá hiện tại
```

---

# PHẦN 6 · BẤT BIẾN VÀ TEST

| # | Bất biến | Test làm nó đỏ |
|---|---|---|
| 1 | Ba đầu ra từ **một** phân phối | `assert p_up > 0,5 ⟺ q50 > last_close` trên toàn lịch sử |
| 2 | Dải giá đơn điệu | `assert q10 ≤ q50 ≤ q90` — **số lần cắt nhau = 0** |
| 3 | Học máy chỉ **thu hẹp** | Fuzz: quét `p_win ∈ [0,1]` khi cổng đóng hoặc slot đầy ⇒ **không sự kiện nào** sinh ra |
| 4 | Khung không giao dịch không phát khuyến nghị | Ép phát ở `"1h"`/`"4h"` ⇒ đỏ. Không cờ cấu hình nào bật được |
| 5 | Sàn perp | `p_required ≥ 0,5 + √(c₀·f)/A` **trên miền f̂ > 0** |
| 6 | Miền f̂ ≤ 0 | `cost_gate ≥ 0,20` và `p_star > 0` với **mọi** f̂ ∈ [−1,40; +1,40], ca test tại đúng biên |
| 7 | Hai cổng hai kiểu | `PReq` và `PStar` không so sánh chéo được (kiểu) |
| 8 | Hằng số tỉ lệ biên độ | Pin `ABS_MOVE_RATIO` = 0,685 ± 0,02 bằng phép đo lại trong test |
| 9 | Thiếu funding ⇒ giả định xấu | Cắt chuỗi ⇒ `f̂` **tăng** lên p95-expanding, không rơi về mặc định |
| 10 | Rò rỉ funding | Đưa kỳ funding tương lai vào ⇒ đỏ |
| 11 | Một hàm biến động, batch ≡ live | Hai đường, `assert khớp 1e-6` |
| 12 | Lưới đóng băng | Hash 27 ô pin trong test |
| 13 | Máy trạng thái tranche | Property test: slot mở ⟺ w ≥ mức và slot trống · đóng đúng LIFO · không tranche nào sống quá deadline · Σ notional ≤ w × size_base |
| 14 | Nhãn không phản thực | Hàm nhãn **không được đọc** giá sau thời điểm thoát |
| 15 | Quy ước soi rào | Null mô phỏng = **23,1% ± 0,5 điểm** (soi-close cho 28,0% ⇒ refactor lệch quy ước sẽ đỏ) |
| 16 | Mọi tranche là giao ngay | `instrument == "spot"` toàn sổ |
| 17 | `predict()` thuần | Gọi hai lần cùng đầu vào ⇒ giống hệt từng byte |
| 18 | Độ tươi chặn trước | `delayed`/`disconnected` ⇒ `new_tranches == ()`, mọi trường hợp |
| 19 | Im lặng tự giải thích | `new_tranches == () ⟹ silence_reason is not None` |
| 20 | Không bán khống | Kiểu dữ liệu không chứa `"SHORT"` |
| 21 | Sổ bất biến | Thử `UPDATE`/`DELETE` trên bản ghi cũ ⇒ đỏ |
| 22 | Cấm định danh hệ thuật ngữ | Quét `src/`: `order_block` · `fvg` · `bos` · `choch` · `liquidity_grab` · `killzone` · `elliott` · `wave_count` · `harmonic` · `gartley` · `smart_money` |
| 23 | **Kỳ vọng tại `p_star` bằng 0** | `assert abs(EV(p_star_event(σ), sl, tp, cost)) < 1e-9` với σ ∈ {0,005 … 0,20} — tính trực tiếp từ `sl_mult`/`tp_mult`/`cost`, **không** đọc lại công thức. Bất biến này bắt lớp lỗi thứ nguyên mà bảng số không bắt được (ADR-013) |
| 24 | **Khoảng cách null → hoà vốn** | `assert p_star − sl/(sl+tp) == c_R/(1 + tp/sl)` và luôn **dương** — hình dạng cược không tạo ra edge |

**Quy tắc chọn chỗ đặt:**

| Đặt ở đâu | Cái gì |
|---|---|
| **Trong mã, kèm test** | Mọi thứ ảnh hưởng tới khuyến nghị hoặc tới con số báo cáo |
| Trong cấu hình | Chỉ sự thật môi trường (biểu phí sàn, đường dẫn) |
| Trong tài liệu | Lý do **vì sao**, không phải bản thân quy tắc |

> **Ngưỡng quyết định tuyệt đối không nằm trong tệp cấu hình.** Đó chính là dòng sẽ bị sửa vào cái đêm bảng điều khiển trống ba tuần. Khi nó bị sửa, không test nào đỏ trừ khi có test này.

---

# PHẦN 7 · THAM SỐ — BẢNG ĐẦY ĐỦ

## 7.1 · Cột A — ảnh hưởng kết quả đánh giá (17)

| Tham số | Giá trị | Nguồn gốc | Nhãn trung thực |
|---|---|---|---|
| Lưới EMA nhanh | {10, 20, 50} | `12 §2.5` | **đóng băng sau khi nhìn** 4 đồng 2021–26 |
| Lưới EMA chậm | {100, 150, 200} | ↑ | ↑ |
| Lưới Donchian | {20, 55, 100} | ↑ | ↑ |
| Tổ hợp trọng số đều | — | `12 §6.5` | quyết định thiết kế |
| Rời rạc hoá | 5 mức | ↑ | quy ước |
| Hệ số dừng lỗ | 1,2σ̂ | `10 §2/C` | đóng băng sau khi nhìn |
| Hệ số chốt lời | 4,0σ̂ | ↑ | ↑ |
| Hạn thời gian | 60 ngày | ↑ | ↑ |
| Thang σ̂ | **k = 1 (ngày)** | `12 §2.8` — 0/23 hết hạn | bằng chứng đo trên **ô tốt nhất in-sample, n=23, một đồng** ⇒ **đo lại trên tổ hợp ở GATE 1** |
| LIFO khi w giảm | LIFO | — | **1-trong-3** (LIFO/FIFO/pro-rata), ảnh hưởng P&L ⇒ phép đo đối chứng LIFO/FIFO trong bộ đo |
| Biên cổng L6 | +2pp | `10 §2/B` | quy ước |
| `RULE11_ACC` | 0,60 | RULE 11 | trong mã, không trong config |
| `ABS_MOVE_RATIO` | 0,685 | đo (2,06/3,00) | pin bằng test |
| f̂ bán rã | 7 ngày | `13 §4.2` | đo |
| f̂ biên kẹp | ±1,40%/ngày | max(p99 ngày × 3) = 1,36 (DOGE), làm tròn lên | tái lập được |
| f̂ fallback | p95 **expanding** | `13 §9` | không dùng phân vị toàn mẫu trong backtest |
| λ fallback σ̂ | 0,94 | RiskMetrics 1996 | quy ước, không tinh chỉnh |
| Cửa sổ đặc trưng | z: 96 · slope: 24 · swing: 20 | — | quy ước đăng ký trước, **chưa đo độ nhạy** |

## 7.2 · Cột B — vận hành, không chạm kết quả (9)

`size_base` 4% NAV · tranche 1% NAV · ngưỡng freshness (live ≤1 chu kỳ, delayed ≤3) · staleness funding 24h · `H_DAYS` theo config · điều kiện bật L6 ≥300 sự kiện · trần cảnh báo tương quan (3 coin) · trần cảnh báo chuỗi thua (5) · phân vị cảnh báo vol (95).

## 7.3 · Điều KHÔNG có trong hệ

| Không có | Vì sao |
|---|---|
| Tham số nào được **tối ưu bằng dữ liệu** ở tầng quyết định | Nguyên tắc: biến thể không phân biệt được thì tổ hợp, không chọn |
| Ngưỡng quyết định trong tệp cấu hình | §6, quy tắc chọn chỗ đặt |
| Trạng thái `SHORT` | Ba lý do độc lập: trôi dương · funding bất đối xứng · phí vay 5–30%/năm |
| Hợp đồng vĩnh cửu cho khuyến nghị | Giữ ~6 ngày > ngưỡng đổi công cụ 2,0–3,4 ngày ⇒ giao ngay luôn rẻ hơn |
| Cooldown sau khi tranche đóng | Là tham số mới; tái vũ trang không tham số thay thế nó |
| Hysteresis trên w | Flapping đo được nhỏ (0,09–0,18%/năm) — rẻ hơn một tham số |

> **HAR-RV là hồi quy khớp dữ liệu** (4 hệ số OLS), và σ̂ chảy vào dừng lỗ/chốt lời/cổng. Tuyên bố "không tham số khớp dữ liệu" **chỉ áp cho tầng quyết định**; L2 là mô hình khớp có kiểm định riêng (QLIKE, §8.4).

---

# PHẦN 8 · CỔNG ĐÁNH GIÁ

## 8.1 · Vì sao chỉ còn một cổng

Với phạm vi khuyến nghị, GATE 2–4 (giao dịch giấy, tiền thật, vận hành) **ngoài phạm vi**. **GATE 1 — hệ có kỹ năng dự báo không — là cổng duy nhất, và nó quyết định sản phẩm có được ship hay không.**

## 8.2 · Cổng kép

```
GATE 1a · TÁI LẬP ĐƯỢC (chỉ tiêu ổn định):
    tỉ số sụt giảm (chiến lược / mua-và-giữ) ≤ 0,60
    ở ≥80% số ô lưới, trên MỌI fold purged walk-forward

GATE 1b · KINH TẾ (so tương đối, không hằng số tuyệt đối):
    net Sharpe của TỔ HỢP ≥ net Sharpe mua-và-giữ, ở ≥6/8 fold
```

**Vì sao không dùng ngưỡng Sharpe tuyệt đối:** Sharpe của mua-và-giữ dao động 0,52–0,96 tuỳ cửa sổ — một ngưỡng tuyệt đối đo **chế độ thị trường**, không đo **chiến lược**. Và Sharpe của chính chiến lược không tái lập giữa hai đoạn (0,07 → 0,77) trong khi tỉ số sụt giảm tái lập **54/54 quan sát** (0,39 → 0,36).

**Chấm trên chính máy trạng thái tranche sản xuất** — một mã, hai chế độ chạy. Không chấm trên "chiến lược tỉ trọng w" rồi ship máy tranche: mô phỏng cho thấy hai thứ đó khác nhau rất xa (một hệ đứng ngoài thị trường 85–95% số ngày-có-tín-hiệu nếu thiếu tái vũ trang).

## 8.3 · Giao thức khử nhiễm — bắt buộc

Vì lưới/k=1/ngưỡng được chốt sau khi nhìn 4 đồng:

| Quy tắc | Nội dung |
|---|---|
| **Tập chấm** | Thống kê đạt/trượt tính trên **36 cặp KHÔNG thuộc nhóm hiệu chuẩn**; BTC/ETH/SOL/DOGE báo cáo **riêng**, không gộp |
| **Giai đoạn sạch** | 6 tháng cuối chưa từng chạm (đã có trong config) |
| **Sạch tuyệt đối** | Mọi dữ liệu sau 2026-08 |
| **Khi trượt** | **Không** được chỉnh lưới, k, tỉ lệ rào, hay ngưỡng. Thứ tự sửa được phép (chốt lúc đầu lạnh): ① kéo dài chân trời sang tuần ② siết độ chọn lọc ③ thêm phái sinh vào L6 |

## 8.4 · Cổng riêng của tầng L2

L2 là tầng **tự chứng minh được** (cần ~11 quan sát, so với 229 lệnh cho tỉ lệ thắng) — nên nó có cổng riêng và ship được độc lập:

```
σ̂ :  QLIKE tốt hơn EWMA(0,94) ≥5% (Diebold–Mariano p<0,05)
      VÀ OOS R² log-RV ≥ 0,30
f̂ :  OOS R² ≥ 0,35 (đo được 0,44–0,51 trên 4 cặp)
Dải:  độ phủ [q10,q90] = 80% ± 3pp trên ≥500 dự đoán đã chấm
      VÀ số lần quantile cắt nhau = 0
```

> **Nếu L2 đạt và GATE 1 trượt: vẫn có sản phẩm thật.** Đài quan trắc biến động — dải giá, biến động kỳ vọng, `p_required` — dựng trên tầng duy nhất có R² 0,5. Đó là **kết quả hợp lệ**, không phải thất bại.

## 8.5 · Bộ phép đo bắt buộc trước khi chấm cổng

| # | Phép đo | Ngưỡng viết trước |
|---|---|---|
| 1 | Lưới 27 ô, purged WF, spot long/flat | Ô **trung vị** — không phải ô tốt nhất |
| 2 | Tỉ lệ chốt lời thật của khung rào chắn | ≥ **27,5%** *(hoà vốn 25,0–25,5% + biên thận trọng 2 điểm)*; ≤ 23,1% (mức bước ngẫu nhiên) ⇒ **dừng nhánh khuyến nghị** |
| 3 | Tỉ lệ đúng **theo nhóm ba biến động** | Không ngưỡng — phép đo **thông tin** |
| 4 | Trượt giá của mức dừng lỗ | Cảnh báo 1,3R · chặn 1,4R **(hoà vốn 1,57R)** |
| 5 | Tương quan E\|move\| ↔ funding toàn vũ trụ | Không ngưỡng — quyết định cổng phí có ý nghĩa trên perp không |
| 6 | LIFO đối chứng FIFO | Chênh lệch không được là nguồn nhạy cảm chính |
| 7 | Thời gian nắm giữ thật của **tổ hợp** | Nếu lệch xa 6,3 ngày ⇒ mở lại quyết định k=1 |
| 8 | Chênh giá mở nến t+1 ↔ TWAP 00:15–00:45 | Vào mô hình chi phí |
| 9 | Tỉ số phương sai VR(2..30 ngày), 4 cặp | Xác nhận giả định μ=0 ở chân trời nhiều ngày |
| 10 | Đo lại cụm đặc trưng trên ≥3 **altcoin** | Nhóm liên thị trường chưa từng kiểm được |
| 11 | Bảy baseline (RULE 4) | `always_up` dùng 49,6% từ 2022 · `seasonal_naive` · `random_5050` · `buy_and_hold` · `tsmom_grid_median` · `dca_hold` · `naive_rw` |

**Sáu điều bị cấm khi chạy bộ này:** thêm phép thử thứ 12 · nới ngưỡng đã viết · đổi giai đoạn kiểm định · chạy lại với tham số khác rồi báo cáo lần đẹp · bỏ một phép thử vì "rõ ràng nó không hợp lý" · diễn giải kết quả không đạt thành "gần đạt".

**RULE 10:** mọi phép đo chặn cửa và mọi lần train L6 (kể cả thử tay) ghi MLflow — git hash, seed, hash dữ liệu, config, metric. Deflated Sharpe tính theo **số trial thật** lấy từ MLflow.

---

# PHẦN 9 · BẢNG ĐIỂM VÀ ĐỘ TRUNG THỰC

> Với hệ khuyến nghị, đây **là** sản phẩm. Một lời khuyên không có lịch sử đúng/sai công khai là một lời khuyên không kiểm chứng được.

## 9.1 · Chấm điểm — chạy vô điều kiện, kể cả khi hệ im lặng

| Đại lượng | Thước đo | Đối chứng bắt buộc |
|---|---|---|
| Biến động | **QLIKE** (Patton 2011) | EWMA(0,94) |
| Dải giá | Độ phủ + PIT / rank histogram | Danh nghĩa 80% |
| Xác suất | Reliability diagram + Brier | Climatology |
| Phân phối | **CRPSS** | Climatology + persistence |
| Khuyến nghị | Tỉ lệ chốt lời, lợi suất theo R | **`p_star` tại lúc phát** + 7 baseline |
| Tổng thể | **FVA** (Forecast Value Added) | Từng baseline |

## 9.2 · Ngân sách im lặng — ba con số có tên riêng, in trên màn hình

| Con số | Giá trị đăng ký | Ghi chú |
|---|---|---|
| **Tranche-mở / đồng / năm** ← in to nhất | **~9** + phần tái vũ trang (đo ở GATE 1) | Số người dùng cần biết để hiểu im lặng là bình thường |
| Thay-đổi-tỉ-trọng / đồng / năm | 17–24 (đo: BTC 21,8 · ETH 20,5 · SOL 17,1 · DOGE 18,2) | |
| Lệnh-ô-đơn / đồng / năm (tham chiếu) | 3,5 | |
| Trần phát khung 1h · 4h | **0 tuyệt đối** — một lần phát bất kỳ ⇒ test đỏ | |
| Trần phát khung 1d | > 2× kỳ vọng tranche-mở ⇒ **cảnh báo** | Hệ nói quá nhiều cũng là chế độ hỏng |

## 9.3 · Bốn thứ bảng điều khiển BẮT BUỘC hiển thị

1. **`p_required` ngay cạnh `p_up`, ở mọi khung** — kể cả khung không giao dịch. Người dùng thấy khoảng cách, không phải đoán.
2. **Im lặng có số**: *"0/2.400 nến qua cổng trong 7 ngày — đây là hành vi ĐÚNG. Kỳ vọng ~9 khuyến nghị/đồng/năm."*
3. **Độ tươi dữ liệu**: Live / Chậm / Mất kết nối / Dự đoán cũ.
4. **Bảng điểm lịch sử** — không phải trang phụ, không ẩn sau menu.

## 9.4 · Quy ước thị giác — không thương lượng

| Quy tắc | Lý do |
|---|---|
| Dự đoán **tím, nét đứt**; không bao giờ xanh/đỏ | Dự đoán không được nhìn giống dữ liệu thật |
| Hướng **không bao giờ chỉ mã hoá bằng màu** | Khả năng tiếp cận + chống đọc nhầm |
| Dải giá in kèm **độ phủ 30 ngày đo được** | Con số trung thực nhất của cả hệ |
| Bỏ đường nối tới q50 | q50 ≈ last_close — vẽ nó là gợi ý một dự báo không tồn tại |

---

# PHẦN 10 · MA TRẬN ĐƯỜNG DỮ LIỆU HỎNG

| Nguồn \ Kiểu | Trễ | Thiếu | Sai / bất thường |
|---|---|---|---|
| **Nến (kline)** | L0 chặn predict, hiển thị CHẬM | L0 chặn, MẤT KẾT NỐI | Cổng chất lượng chặn từ tầng dữ liệu |
| **Funding** | > 24h ⇒ coi như thiếu | `f̂` = p95-expanding (giả định xấu nhất) | Kẹp ±1,40 nuốt outlier; ngoài kẹp ⇒ cảnh báo |
| **Open Interest** *(chỉ nuôi đặc trưng L6)* | Đặc trưng = NaN ⇒ L6 bỏ qua sự kiện (**thu hẹp** — hợp bất biến đơn điệu) | Như trễ | z-score tự hấp thụ; \|z\| > 8 ⇒ NaN |
| **Ảnh chụp vũ trụ** *(chỉ tầng cắt ngang tương lai)* | Dùng ảnh gần nhất TRƯỚC kỳ; quá 45 ngày ⇒ tầng đó đứng ngoài + cảnh báo | Tầng đó đứng ngoài | Số symbol lệch > 20% so tháng trước ⇒ chặn + cảnh báo |

**Chế độ hỏng của mô hình:**

| Chế độ | Dấu hiệu | Phản ứng |
|---|---|---|
| HAR-RV phân kỳ | σ̂ ngoài khoảng hợp lý | Rơi về EWMA λ=0,94 **tất định**, ghi nhật ký |
| Độ phủ dải trôi | Kiểm toán cuộn 500 dự đoán lệch khỏi 80% ± 3pp | **Cảnh báo, KHÔNG tự chỉnh** — tự chỉnh che mất nguyên nhân |
| Hệ im lặng quá lâu | 0 khuyến nghị trong N tuần | Hiển thị số **kỳ vọng** cạnh số **thực tế**. Không hành động |
| Hệ phát quá nhiều | Vượt trần tỉ lệ phát | **Cảnh báo** — nghi rò rỉ hoặc lỗi cổng |
| Chuỗi thua dài | 8 khuyến nghị thua liên tiếp | **Không phản ứng** — xác suất 5,8% ở tỉ lệ thắng 30%, nằm trong thiết kế |
| Tỉ lệ đúng khung 1h > 60% | | **RULE 11: giả định rò rỉ** cho tới khi chứng minh ngược lại |

---

# PHẦN 11 · LỘ TRÌNH IMPLEMENT

## 11.1 · Thứ tự có lý do nhân quả

| # | Việc | Vì sao ở vị trí này | Chặn bởi |
|---|---|---|---|
| **0** | Cron: Open Interest · ảnh chụp vũ trụ · sổ lệnh (spread/độ sâu) | **Thứ duy nhất mất vĩnh viễn nếu hoãn** (OI chỉ 30 ngày lịch sử) | — |
| **0b** | Điều tra 2h: kho lưu trữ Binance có chứa cặp đã huỷ niêm yết không? | Quyết định cách tải ở bước 1; có thể mở khoá tầng cắt ngang sớm 12 tháng | — |
| **1** | **Mẻ tải 40 cặp × 1d × ≥3 năm** + cột `taker_buy_volume` + cổng chất lượng | Điều kiện tiên quyết của GATE 1a. `ccxt.fetch_ohlcv` không trả cột 9 ⇒ cần đường tải khác | 0b |
| **2** | **Hàm chi phí + `p_required` + `p_star`** (L4) | ~40 dòng, không cần dữ liệu mới, và **mọi tầng khác đọc nó**. Xây sau là phải sửa lại tất cả | — |
| **3** | **Trọng tài** (`purged.py` thật) + tiêm rò rỉ, gỡ 5 probe | *Một bộ dò chưa từng bắt được gì không phải bộ dò.* Trọng tài trước cầu thủ | 1 |
| **4** | Lõi đặc trưng L1 + đo lại cụm trên altcoin | Đóng băng định nghĩa; phép thử rò rỉ thứ sáu | 1, 3 |
| **5** | **σ̂ (HAR-RV) + f̂** — cùng đợt | Tầng duy nhất tự chứng minh được. **Giá trị thật đầu tiên của cả dự án** | 4 |
| **6** | L3 phân phối + dải giá + kiểm toán độ phủ | Hoàn tất 3/4 đầu ra, chưa train cây quyết định nào | 5 |
| **7** | L5 tổ hợp + máy trạng thái tranche + sổ | Quy tắc, không học. Sinh sự kiện cho bước 8 | 6 |
| **8** | **Bộ 11 phép đo + chấm GATE 1** | Điểm rẽ nhánh | 7 |
| **9** | *(chỉ khi qua cổng)* L6 lọc bỏ + L7 cỡ gợi ý | Tầng đắt nhất, xây cuối, **có thể không bao giờ xây** | 8 |

> **Đảo thứ tự 2 và 5 là sai lầm tốn kém nhất có thể mắc**: xây mô hình trước hàm chi phí thì mọi chỉ tiêu đánh giá trong nhiều tuần đều thiếu mẫu số, và bạn tối ưu vào một mục tiêu sai.

## 11.2 · Mốc ship

| Mốc | Sau bước | Sản phẩm thật |
|---|---|---|
| **M-A** | 6 | **Đài quan trắc**: dải giá + biến động + `p_required` + độ phủ đo được. Ship được ngay cả khi GATE 1 sau đó trượt |
| **M-B** | 8 | GATE 1 chấm xong. Đạt ⇒ đi tiếp; trượt ⇒ ship M-A, và **đó là kết quả hợp lệ** |
| **M-C** | 9 | Khuyến nghị đầy đủ có lớp lọc |

## 11.3 · Diff cấu hình cần làm

| Tệp | Thay đổi |
|---|---|
| `config/model.yaml` | **Xoá** `decision.p_up_threshold` / `p_down_threshold` (thay bằng `TRADE_TF` + `p_required` trong mã) · **xoá** khối `quantile` · `classifier` → `meta_label` (depth 3 · ≤15 lá · ≤300 cây) · `drop_flat_from_train: false` · `tuning.n_trials: 20` · `baselines` += `tsmom_grid_median`, `dca_hold`, `naive_rw` · `costs.funding_rate_8h_pct` giữ làm tham chiếu hiển thị, **cấm** dùng trong cổng |
| `config/features.yaml` | Theo Phụ lục B — làm ở bước 4, **cùng lúc** viết `build_features` |
| `config/symbols.yaml` | Mở rộng exclude: neo pháp định (EUR…) · vàng/hàng hoá (XAUT, PAXG) · RLUSD · cổ phiếu token hoá |
| `serving/schemas.py` | Theo Phần 2 |

## 11.4 · Tài liệu quyết định cần viết

| ADR | Nội dung |
|---|---|
| **ADR-002** ✅ | Khoá khung 1h/4h thành hiển thị *(đã viết, đã vá)* |
| **ADR-003** | Cổng phí động thay vùng chết cố định |
| **ADR-004** | Bỏ ba mô hình quantile, sinh dải bằng số học từ σ̂ |
| **ADR-005** | `p_up` suy từ phân phối, đổi nghĩa |
| **ADR-006** | Chi phí là hàm của thời gian nắm giữ |
| **ADR-007** | GATE 1 đổi từ ngưỡng Sharpe tuyệt đối sang cổng kép |
| **ADR-008** | Hướng sơ cấp dùng tổ hợp lưới, không chọn ô |
| **ADR-009** | Thang rào chắn khoá k=1; thời gian nắm giữ thực tế ~6 ngày |
| **ADR-010** | f̂ là thành phần L2 ngang hàng σ̂ |
| **ADR-012** | **Phạm vi: hệ khuyến nghị, không tự giao dịch** *(mới, từ quyết định 27/08)* |

---

# PHỤ LỤC A · TRUY VẾT NGUỒN

| Con số | Giá trị | Nguồn |
|---|---|---|
| R² hướng · biến động · funding | 0,00–0,01 · 0,40–0,60 · 0,44–0,51 | `09 §3.1` · `13 §4.2` |
| σ̂ ngày BTC 2021–26 / 2023–26 | 3,00% / 2,43% | `12 §2.8`, đo lại |
| E\|move\| / σ̂ | 0,685 | đo trên BTC ngày |
| p\* hình dạng 1,2σ̂/4,0σ̂ (payoff 3,33R) | **25,0% / 25,5%** | ADR-013 · `barrier_surface.py` |
| Hoà vốn trượt giá | **1,57R** | ADR-013 |
| Tương quan hạng tham số hai đoạn | +0,19 | `12 §2.6` |
| Tỉ số sụt giảm tổ hợp | 0,29 / 0,29 / 0,31 | `12 §6.5` |
| Tỉ số sụt giảm tái lập | 54/54 quan sát | `12 §2.7` |
| Tỉ lệ chốt lời đo được | **33,7%** (89 lệnh, 4 cặp) | `15 §1.5` **đã sửa** — ADR-013 |
| Tỉ lệ nền khớp cửa sổ | 23,7% | `12 §2.9` |
| Null bước ngẫu nhiên | 23,1% | **giải tích** `sl/(sl+tp)` = 1,2/5,2 — không phải mô phỏng |
| Rào 35 ngày ⇒ hết hạn | 11/23 | `12 §2.8` |
| Rào k=1 ⇒ hết hạn | 0/23 | ↑ |
| LIFO-thoát | 16% tổng tranche | mô phỏng phản biện |
| Số năm cần: sụt giảm / Sharpe / tỉ lệ thắng | 3 / >5 / 34 | `15 §3.4` |
| Kappa kết cục lệnh | 0,501 (61 cặp chồng lấn) | `15 §3.3` |
| Funding: đúng sàn 0,01% | 34,8–41,4% số kỳ | `13 §3.1` |
| Funding âm | 13,7–28,6% số kỳ | ↑ |
| SOL 11/2022 | −42,47% notional, 141/165 kỳ âm | `13 §7.4` |
| Sụt giảm chuỗi funding | BTC −1,52% · SOL −43,40% | ↑ |
| Đặc trưng: 57 đề xuất → 13 chiều | | `14 §0.1` |
| Khung 4h: p_required | 69,0% spot / 62,7% perp | `ADR-002 §2.3` |
| Khung 4h: R² biến động / hướng | 0,278 / 52,27% vs 51,04% | ↑ §2.4 |

Mã tái tạo: `scripts/measurements_2026_08_26/` (13 script, có README).

---

# PHỤ LỤC B · BỘ ĐẶC TRƯNG

## B.1 · 13 suất dựng được ngay

| # | Đặc trưng | Cụm | Vai trò |
|---|---|---|---|
| 1 | `sigma_ratio_90d` | 5 | Chế độ biến động |
| 2 | `rv_24` | 2 | Mức biến động |
| 3 | `rv_ratio_5d_20d` | 7 | Cấu trúc kỳ hạn biến động |
| 4 | `volume_z96` | 3 | Bất thường khối lượng |
| 5 | `log_ret_12` | 1 | Động lượng |
| 6 | `ema50_ema200` | 8 | Xu hướng chậm |
| 7 | `log_ret_1` | 4 | Nến gần nhất |
| 8 | `close_position_in_range` | 4 | Vị trí đóng cửa |
| 9 | `upper_wick_pct` | 9 | Áp lực bán trong nến |
| 10 | `dist_to_prior_swing_sigma` | 1 | Cấu trúc |
| 11 | `funding_level_pct` | 6 | **Chi phí thật** |
| 12 | `funding_z96` | 13 | Chế độ chen chúc |
| 13 | `dow_sin` + `dow_cos` | 10, 11 | Mùa vụ tuần |

## B.2 · 5 suất chờ dữ liệu

| # | Đặc trưng | Cần | Ưu tiên |
|---|---|---|---|
| 14 | `taker_buy_ratio` | Cột 9 klines (ccxt không trả) | ★★★ |
| 15 | `oi_price_div` | Cron OI — **30 ngày, mất vĩnh viễn** | ★★★ |
| 16 | `excess_return_vs_btc` | 40 cặp cùng khung | ★★★ |
| 17 | `cvd_slope_24` | `aggTrades` | ★★ |
| 18 | `basis` | mark − giao ngay | ★ |

## B.3 · Đã bị đo và BÁC — không được quay lại

| Đặc trưng | Kết quả đo |
|---|---|
| `sweep_reclaim_flag` | Lợi suất 5 ngày sau **−0,30%** vs nền +0,43%, p=0,92 — **edge âm** |
| `dist_to_round_number` | Không hiệu ứng; ô mạnh nhất lại là **giữa khoảng** |
| Fair Value Gap | Lấp 79,5% vs **nền 85,1%** — lấp **ít hơn** mức ngẫu nhiên |
| Nhóm `momentum` (RSI, MACD, Stoch, ROC) | Trùng cụm 1: r = 0,735–0,997 với log return thuần |
| `breakout_extension_sigma` | r = **1,000** với `dist_to_prior_swing` — cùng công thức |
| Bản đồ nhiệt thanh lý | Feed bị giới hạn 1 lệnh/giây từ 2021; "mức thanh lý" là output mô hình bán như dữ liệu |
| Chỉ số on-chain (MVRV/SOPR/NUPL) | Hiệu chỉnh hồi tố do sửa thuật toán gom nhóm thực thể — rò rỉ đóng gói sẵn |

> **Quy tắc:** đặc trưng bị bác bằng phép đo **không được quay lại** mà không có phép đo mới trên dữ liệu mới.

---

# PHẦN 12 · MỘT ĐOẠN

> Module này trả lời ba câu hỏi và từ chối câu thứ tư. Nó nói **giá sẽ dao động bao nhiêu** (R² 0,4–0,6), **dải nào chứa giá với xác suất 80%** (độ phủ đo được từng nến), và **chi phí để có ý kiến là bao nhiêu** (R² 0,44–0,51 ở vế funding). Nó **từ chối** nói giá sẽ lên hay xuống ở khung giờ — không phải vì khiêm tốn, mà vì bức tường phí ở khung đó đòi thắng 63–69% trong khi trần năng lực đo được là 51–53%, và giao của hai tập đó rỗng.
>
> Ở khung ngày, nó phát khuyến nghị — nhưng bằng một quy tắc mượn bằng chứng ngoại sinh nhiều thập kỷ chứ không bằng một mô hình tự nghĩ ra, vì để tự chứng minh tỉ lệ thắng cần **34 năm** dữ liệu. Nó chọn tỉ số sụt giảm làm cổng thay vì Sharpe, vì đó là chỉ tiêu duy nhất tái lập được bằng lượng dữ liệu tồn tại. Và nó ghi mọi lời khuyên vào một cuốn sổ không sửa được, vì khi sản phẩm là lời khuyên chứ không phải giao dịch, **cuốn sổ đó là bằng chứng duy nhất rằng hệ thống có kỹ năng hay chỉ đang may.**

---

*Bản hệ thống hoá 1.0-rc1 · Nguồn bằng chứng: `docs/09`–`17` + `scripts/measurements_2026_08_26/`. Chờ duyệt trước khi hợp nhất vào SYSTEM DESIGN.*
