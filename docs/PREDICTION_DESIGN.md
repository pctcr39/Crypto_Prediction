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
| **4a** | **Khuyến nghị VÀO** — hướng · mức dừng lỗ · mức chốt lời · cỡ gợi ý | **Lời khuyên có điều kiện**, kèm ngưỡng hoà vốn của chính nó | **Chỉ khung 1 ngày** |
| **4b** | **Khuyến nghị THOÁT** — khuyến nghị nào vừa đóng, vì sao, R thực nhận | **Khẩn cấp nhất** — hiển thị ngang hàng 4a, không ẩn | **Chỉ khung 1 ngày** |

Kèm theo mọi lúc, không bao giờ ẩn: **`p_required`** (ngưỡng thắng cần để hoà vốn) · **`trend_weight`** (đồng hồ xu hướng) · **`data_freshness`** · **`silence_reason`**.

## 0.3 · Phạm vi thay đổi những gì so với `17`

| Hạng mục | Trước (hệ tự giao dịch) | **Nay (hệ khuyến nghị)** |
|---|---|---|
| Tầng L7 | Định cỡ + veto **thực thi** | **Khuyến nghị cỡ + cảnh báo rủi ro** — người dùng quyết |
| Lệnh dừng lỗ | Lệnh stop-limit **treo trên sàn** | **Khuyến nghị BẮT BUỘC kèm chỉ dẫn đặt lệnh stop-limit treo ngay lúc vào** — xem §L5 «Vì sao lệnh treo là bắt buộc» |
| Đối soát (L8) | Đối soát vị thế với sàn mỗi 5 phút | **Theo dõi kết cục của khuyến nghị đã phát** |
| Khoá API | Cần khoá giao dịch từ GATE 4 | **Không cần khoá giao dịch. Chỉ đọc dữ liệu công khai** |
| **GATE 2** — hiệu chỉnh xác suất (Brier + reliability) | Trong phạm vi | **VẪN TRONG PHẠM VI** — RULE 6 bắt buộc, và hệ khuyến nghị phát ra `p_win`; xác suất chưa hiệu chỉnh là con số gây hiểu lầm |
| **GATE 3** (chạy tiền ảo) · **GATE 4** (an toàn vận hành tiền thật) | Trong phạm vi | **Ngoài phạm vi hiện tại** |
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

## 0.5 · Mười hai luật dưới phạm vi khuyến nghị (m01)

| # | Luật | Dưới phạm vi này |
|---|---|---|
| 1 | Không train trên giá tuyệt đối | ✅ Ràng buộc — `assert_scale_free()` |
| 2 | Mọi đặc trưng dịch ít nhất 1 nến | ✅ Ràng buộc — một hàm `shift_all(1)`, bất biến #33 |
| 3 | Chỉ chia theo thời gian | ✅ Ràng buộc — §LV, bất biến #39–41 |
| 4 | Đánh bại 3 baseline trước | ✅ Ràng buộc — mở rộng lên **7 baseline**, phép đo #11 |
| 5 | Mọi con số đã trừ phí | 🔶 **Đổi nghĩa** — hệ **giả định** chi phí của người dùng, xem §0.6 |
| **6** | **Xác suất phải hiệu chỉnh** | 🔶 **Chuyển đối tượng** — `p_up ≡ 0,50` theo cấu tạo (μ=0) nên hiệu chỉnh nó là **rỗng**. RULE 6 ràng buộc trên **`p_win` của L6**, và đó là **GATE 2** |
| 7 | Dự đoán không nhìn giống dữ liệu thật | ✅ Ràng buộc — §9.4 |
| 8 | Dashboard luôn nói thật về độ tươi | ✅ Ràng buộc — `data_freshness` + `valid_until`, bất biến #37 |
| **9** | **Tiền thật chỉ mở qua 4 gate** | ⚠️ **Mất nghĩa một phần** — xem khối dưới |
| 10 | Mỗi lần train ghi MLflow | ✅ Ràng buộc — §8.6.2, bước 2b |
| 11 | Accuracy > 60% khung 1h ⇒ giả định rò rỉ | ✅ Ràng buộc — `RULE11_ACC`, và Phần 10 |
| 12 | Foundation model đã thấy quá khứ của bạn | ✅ Không dùng foundation model nào |

> ### ⚠️ RULE 9 — bốn cổng còn hai, và khoảng trống phải được lấp
>
> GATE 3 (chạy tiền ảo) và GATE 4 (an toàn vận hành) ngoài phạm vi vì hệ không chạm tiền. **Nhưng vai trò của GATE 3 — kiểm chứng THỜI GIAN THỰC trước khi tin — không biến mất; nó chỉ chuyển sang người dùng.** Và người dùng chịu rủi ro thật.
>
> **Thay GATE 3 bằng: 60 ngày phát khuyến nghị FORWARD công khai, chấm xong rồi mới được gọi là sản phẩm.**
>
> | | |
> |---|---|
> | Vì sao 60 ngày | Bằng đúng `DEADLINE_DAYS` — đủ để mọi tranche phát trong 30 ngày đầu đóng xong |
> | Chấm gì | Cùng bộ chỉ tiêu §9.1, trên dữ liệu **hệ chưa từng thấy lúc chấm GATE 1** |
> | Vì sao không thay được bằng backtest | Backtest không bắt được lỗi vận hành: cron chết, sổ lệch, dữ liệu trễ, `predict()` không thuần. GATE 1 chấm **mô hình**; 60 ngày forward chấm **hệ thống** |
> | Kết quả xấu | Lệch có hệ thống so GATE 1 ⇒ **điều tra trước khi ship**, không phải "chạy thêm cho quen" |

## 0.6 · RULE 5 dưới phạm vi khuyến nghị — hệ giả định, người dùng trả (m02 · m03)

Hệ áp một biểu phí mà **người dùng mới là người trả**. Ba quy tắc:

| # | Quy tắc |
|---|---|
| **1** | `cost_assumed_pct` **in trên mọi panel và ghi vào MỌI bản ghi `Tranche`** — người dùng luôn thấy hệ đang giả định gì |
| **2** | Người dùng **được nhập biểu phí của mình** cho lớp **HIỂN THỊ** (`p_required`, `p_star` hiển thị tính lại theo đó) |
| **3** | Biểu phí dùng để **CHẤM** thì **khoá cứng** — `0,10% taker × 2 + 0,05% trượt × 2 = 0,30%`, pin bằng test. Nếu người dùng đổi được phí chấm điểm, bảng điểm không so sánh được giữa các phiên |

**Thuế giao dịch Việt Nam 0,1%/lệnh** *(Thông tư 32/2026, `09 §6.3`)*: **có trong mô hình chi phí**, mặc định `tax_pct = 0` và người dùng bật theo kênh giao dịch của mình.

> Với chân trời ~6 ngày và ~9 khuyến nghị/đồng/năm, thuế 0,1%/lệnh cộng vào chi phí khứ hồi thành **0,50%** thay vì 0,30% ⇒ `c_R` tăng từ 0,083 lên **0,139**, hoà vốn từ 25,0% lên **26,3%**, biên co từ +5,0 xuống **+3,7 điểm**. Đây là con số người dùng Việt Nam phải thấy, không phải một cước chú.


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
from datetime import datetime, timedelta
from typing import Literal, Optional
import pandas as pd

@dataclass(frozen=True)
class PReq:
    """Ngưỡng thắng của cược ĐỐI XỨNG 1:1 — chỉ để HIỂN THỊ."""
    value: float          # đã kẹp [0,5 ; 1,0]
    unreachable: bool     # raw ≥ 1,0 ⇒ không đạt được ở mọi tỉ lệ thắng

@dataclass(frozen=True)
class PStar:
    """Ngưỡng thắng của cược RÀO CHẮN 3,33:1 — cổng QUYẾT ĐỊNH."""
    value: float
# ⛔ Hai kiểu KHÁC NHAU có chủ ý: `PReq < PStar` không biên dịch được.
#    Đây là biện pháp chống lặp lại lỗi thứ nguyên đã xảy ra ba lần (ADR-013).

# ══ ĐỘ TƯƠI — HAI KHÁI NIỆM KHÁC NHAU, trước đây bị gộp làm một (B10 · B15) ══
DataFreshness = Literal["live", "delayed", "disconnected"]   # thuộc tính của DỮ LIỆU VÀO
#   «stale» KHÔNG nằm ở đây: nó là thuộc tính của DỰ ĐOÁN so với thời điểm HIỆN TẠI,
#   nên tầng phục vụ tính:  stale ⟺ now > prediction.valid_until   (RULE 8)

TrancheStatus = Literal["active", "hit_target", "hit_stop", "expired", "superseded"]
CloseReason   = Literal["hit_target", "hit_stop", "expired", "superseded"]

@dataclass(frozen=True)
class Bar:
    """Nến đã đóng. index của chuỗi = open_time (UTC)."""
    open_time: datetime
    open: float; high: float; low: float; close: float

@dataclass(frozen=True)
class PredictCtx:
    """Mọi thứ định danh một lần suy luận — để constructor duy nhất dựng được Prediction."""
    symbol: str
    tf: Literal["1h", "4h", "1d"]
    open_time: datetime          # nến ĐÓNG sinh ra dự đoán này
    model_sha: str
    last_close: float
    next_open: Optional[float]   # OPEN nến t+1 nếu đã có; None ⇒ không mở tranche được
    in_training_universe: bool

@dataclass(frozen=True)
class PendingEvent:
    """Sự kiện mở CHƯA có cỡ. `with_size` biến nó thành Tranche."""
    level: float                 # 0,25 | 0,50 | 0,75 | 1,00
    entry_ref_price: float       # = OPEN nến t+1 (B6)
    sigma_entry: float           # σ̂ NGÀY tại lúc phát
    entry_time: datetime

@dataclass(frozen=True)
class PortfolioSnapshot:
    """Trạng thái TOÀN DANH MỤC — do NGƯỜI GỌI dựng từ sổ của mọi symbol.
    predict() vẫn THUẦN: đây là tham số vào, không phải trạng thái toàn cục (B18)."""
    symbols_with_open_tranches: int
    consecutive_stops: int       # chuỗi tranche đóng bằng stop liên tiếp, toàn danh mục

@dataclass(frozen=True)
class Tranche:
    """MỘT KHUYẾN NGHỊ. Bất biến sau khi phát — đổi trạng thái tạo bản ghi MỚI."""
    tranche_id: str              # symbol|open_time|level|model_sha
    symbol: str
    level: float
    entry_ref_price: float       # = OPEN nến t+1 (B6). KHÔNG BAO GIỜ close[t]
    entry_time: datetime
    sigma_entry: float           # σ̂ NGÀY, đóng băng cùng khuyến nghị
    stop_price: float            # entry × (1 − 1,2·σ̂) — KHUYẾN NGHỊ đặt lệnh treo
    target_price: float          # entry × (1 + 4,0·σ̂)
    deadline: datetime           # entry_time + 60 ngày
    suggested_size_pct: float    # % NAV — GỢI Ý
    instrument: Literal["spot"]
    status: TrancheStatus
    p_star_at_entry: float
    # ── kết cục · None khi status == "active" (B3) ──
    exit_time: Optional[datetime] = None
    exit_price: Optional[float] = None
    close_reason: Optional[CloseReason] = None
    realized_r: Optional[float] = None       # (exit − entry)/(entry · 1,2·σ̂_entry)
    unverified_since: Optional[datetime] = None   # mất kết nối ⇒ sổ chưa tiến (B1)

@dataclass(frozen=True)
class TrancheBook:
    active: tuple[Tranche, ...]
    closed: tuple[Tranche, ...]
    last_bar_processed: Optional[datetime]   # để advance_book biết bắt kịp từ đâu

@dataclass(frozen=True)
class Prediction:
    # ── định danh · khoá idempotent từ bản ghi ĐẦU TIÊN ──
    symbol: str
    timeframe: Literal["1h", "4h", "1d"]
    open_time: datetime
    model_sha: str
    last_close: float
    valid_until: datetime        # sau mốc này tầng phục vụ hiện «Dự đoán cũ» (RULE 8, B10)

    # ── ba đầu ra: BA CÁCH ĐỌC CỦA MỘT PHÂN PHỐI · LUÔN có giá trị ──
    expected_vol_pct: float      # = σ̂_ngày · √(H_DAYS[tf]) · 100
    q10: float; q50: float; q90: float
    p_up: float                  # = 1 − F(0). SUY RA, không mô hình riêng

    # ── kinh tế học quyết định · LUÔN hiện diện, kể cả khi im lặng ──
    p_required: float            # tính TRONG MÃ
    e_move_pct: float
    cost_assumed_pct: float
    instrument: Literal["spot", "perp"]   # HIỂN THỊ — choose_instrument_display()

    # ── khuyến nghị · () là giá trị HỢP LỆ và THƯỜNG GẶP ──
    trend_weight: Optional[float]
    new_tranches: tuple[Tranche, ...]
    closed_tranches: tuple[Tranche, ...]   # ★ KHUYẾN NGHỊ THOÁT
    active_tranches: tuple[Tranche, ...]
    warnings: tuple[str, ...]

    # ── trung thực · bắt buộc ──
    data_freshness: DataFreshness
    in_training_universe: bool   # false ⇒ dashboard gắn nhãn «ngoài tập huấn luyện»
    silence_reason: Optional[str]   # BẮT BUỘC khi new_tranches rỗng
```

> ### ★ Vì sao `stale` rời khỏi `DataFreshness` (B10 + B15 giải nhau)
>
> Bản rc1 gộp hai khái niệm vào một enum, sinh ra hai lỗi cùng lúc: `freshness()` chỉ trả ba giá trị trong khi enum có bốn (không ai sinh ra `stale`), và nhánh dữ liệu-không-tươi phải trả một `Prediction` mà **chín trường bắt buộc chưa tính được**.
>
> | Khái niệm | Thuộc về | Ai tính | Khi nào |
> |---|---|---|---|
> | **Độ tươi DỮ LIỆU** — `live` / `delayed` / `disconnected` | Nến đầu vào | `predict()` | Lúc suy luận |
> | **Độ tươi DỰ ĐOÁN** — `stale` | Bản dự đoán so với **hiện tại** | Tầng phục vụ | Mỗi lần hiển thị: `now > valid_until` |
>
> Tách ra thì nhánh L0 **không còn cần tồn tại**: σ̂ vẫn tính được từ những nến đang có — chỉ là chúng cũ. Dự đoán vẫn đầy đủ, `data_freshness` nói thật về đầu vào, và `new_tranches` rỗng vì không mở vị thế trên dữ liệu cũ. Khớp `03 M10`: *«giữ dự đoán cũ + đánh dấu stale, không bao giờ im lặng»*.
>
> Đồng thời khôi phục ba trường mà rc1 làm rơi so với `serving/schemas.py` gốc: `last_close` · `valid_until` (RULE 8) · `in_training_universe` (`00 §4.2`).

**Ba quyết định nằm trong hợp đồng, không nằm trong tài liệu:**

1. `p_required` là **trường bắt buộc** — mọi con số phải đứng cạnh hoà vốn của chính nó.
2. `silence_reason` **bắt buộc khi không có khuyến nghị mới** — im lặng phải tự giải thích, nếu không người dùng đọc nó là hỏng hóc rồi tự hạ ngưỡng.
3. Không có giá trị `"SHORT"`, không có `instrument` nào khác `"spot"` cho tranche — loại ở **tầng kiểu**, không ở tầng quy ước.

---

# PHẦN 3 · ĐẶC TẢ TỪNG TẦNG

## L0 · Tiếp nhận và độ tươi

**Quy ước `bars` — một, dùng khắp nơi:** `index` = `open_time` **UTC** của nến đã đóng ·
`close_time(t) = index[t] + timeframe_delta(tf)` · `timeframe_delta` = `{1h: 1h, 4h: 4h, 1d: 24h}`.

```python
def freshness(bars, now_hint: datetime, cfg: PredictConfig) -> DataFreshness:
    """now_hint truyền VÀO — predict() không đọc đồng hồ (bất biến #17)."""
    if len(bars) == 0:               return "disconnected"
    age = now_hint - (bars.index[-1] + timeframe_delta(cfg.tf))
    if age < timedelta(0):           return "disconnected"   # lệch đồng hồ ⇒ không đoán
    if age <= cfg.live_max:          return "live"           # mặc định 1 × timeframe_delta
    if age <= cfg.delayed_max:       return "delayed"        # mặc định 3 × timeframe_delta
    return "disconnected"
```

### Dịch vụ suy luận — ai gọi `predict()` và khi nào (m05)

| | |
|---|---|
| **Kích hoạt** | **Theo SỰ KIỆN nến đóng** (`x: true` của luồng kline), **không theo đồng hồ máy**. Một nến chưa đóng không bao giờ vào `bars` |
| **Nguồn `now_hint`** | **Thời gian của SÀN** (`E` trong thông điệp websocket, hoặc `serverTime`), không phải giờ máy — máy lệch giờ sẽ làm mọi phán quyết độ tươi sai |
| **Gộp nến** | 1h → 4h/1d bằng `open=first · high=max · low=min · close=last · volume=sum`, khử trùng lặp theo `open_time` |
| **Nghiệm thu gộp nến** | So với REST Binance trên **1.000 mốc ngẫu nhiên**, khớp từng trường — trước khi tin bất kỳ con số nào tính từ nến gộp |

**Bất biến:** `delayed` hoặc `disconnected` ⇒ `new_tranches == ()` và `silence_reason` được điền. Không cờ nào bật được nó.

## L1 · Lõi đặc trưng

- Đúng **một** hàm `shift_all(1)`; không đường vòng.
- `assert_scale_free()` chạy trên mọi cột.

### ★ Hàm biến động — định nghĩa ĐÓNG BĂNG (B4 · B5)

```python
LN2 = math.log(2)

def realized_variance(bars_1d):
    # PARKINSON (1980) — ước lượng phương sai NGÀY từ high/low.
    # Chọn bằng phép đo, không bằng quy ước — xem bảng dưới.
    return (np.log(bars_1d.high / bars_1d.low) ** 2) / (4 * LN2)

def sigma_hat_daily(bars_1d, *, window: int = 20) -> float:
    # σ̂ LUÔN là độ lệch chuẩn log-return NGÀY — bất kể panel nào đang phục vụ.
    # Tính từ NẾN NGÀY, không phải nến của cfg.tf.
    # Đây là hàm DUY NHẤT sinh ra σ̂ (bất biến #11).
    return float(np.sqrt(realized_variance(bars_1d).rolling(window).mean().shift(1).iloc[-1]))
```

**Vì sao Parkinson — đo trên 2.062 ngày BTC, mục tiêu là RV THẬT tính từ nến 1 giờ:**

| Ước lượng đầu vào | OOS R² (mục tiêu 1 ngày) | OOS R² (mục tiêu **5 ngày**) | QLIKE 5 ngày |
|---|---|---|---|
| Close-to-close | 0,059 | **−0,057** | 0,239 |
| **Parkinson** ← chọn | **0,202** | **0,248** | **0,190** |
| Garman-Klass | 0,185 | 0,248 | 0,193 |
| Rogers-Satchell | 0,160 | 0,241 | 0,195 |

> **Close-to-close cho R² ÂM ở chân trời nhiều ngày.** Đó chính là ước lượng mà mọi phép đo trước đây trong repo đã dùng — và cũng là ước lượng tệ nhất cho đúng việc mà σ̂ phải làm.

**Đổi sang Parkinson KHÔNG làm lệch các hằng số đã đo** *(89–90 lệnh, 4 cặp, quy ước rào bất đối xứng)*:

| Ước lượng | n | % thắng | R TB thắng | EV | Ngày TB | % hết hạn |
|---|---|---|---|---|---|---|
| Close-to-close | 89 | 28,1% | 4,76R | +0,536R | 5,4 | **0,0%** |
| **Parkinson** | 90 | 30,0% | 4,48R | +0,559R | 5,8 | **0,0%** |

⇒ Quyết định `k = 1` (0% hết hạn) và thời gian nắm giữ ~6 ngày **bền vững qua cả hai ước lượng**.

### Thang thời gian — σ̂ nội bộ LUÔN là NGÀY

| Dùng ở đâu | Đại lượng |
|---|---|
| Rào chắn `1,2σ̂` / `4,0σ̂` | **σ̂ ngày** |
| `p_star_event(σ̂)` | **σ̂ ngày** |
| `F = Normal(0, σ̂·√H)` với `H` tính bằng **ngày** | **σ̂ ngày** |
| **Hiển thị** `expected_vol_pct` cho panel khung `tf` | **σ̂ ngày · √(H_DAYS[tf]) · 100** |

⇒ Panel 1h in `σ̂·√(4/24) = 0,408·σ̂`; panel 4h và 1d in `σ̂` (vì `H_DAYS` của cả hai = 1,0). Đây cũng đúng bằng **độ rộng dải giá** — nhất quán theo cấu tạo.

> ⚠️ `ADR-002 §2.4` báo cáo `R² = 0,278` cho *"biến động nến 4 giờ tiếp theo"* — **thang khác**, không so sánh trực tiếp với các số ở đây (thang ngày).
- Bộ đặc trưng: **13 suất dựng được + 5 suất chờ dữ liệu** (Phụ lục B).

**Phép thử rò rỉ thứ sáu:** chạy cùng đoạn lịch sử qua hai đường (batch và live), `assert σ̂ khớp 1e-6`.

## L2 · Hai đại lượng dự báo được

```python
def har_rv(bars_1d) -> float:
    # HAR-RV: OLS trên log(realized_variance) ba thang 1d/5d/22d -> 4 hệ số,
    # refit hàng tuần. Trả σ̂ NGÀY.
    #
    # ★ MỤC TIÊU DỰ BÁO: trung bình RV 5 NGÀY TỚI, không phải ngày kế tiếp.
    #   Lý do đo được: ở chân trời 1 ngày HAR THUA EWMA(0,94) 10% theo QLIKE;
    #   ở chân trời 5 ngày HAR THẮNG 15,8%. Và 5 ngày đúng bằng thời gian
    #   nắm giữ thực tế của rào chắn (5,8 ngày).
    # Chấm bằng QLIKE (Patton 2011), KHÔNG phải MSE.

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
    """CỔNG HIỂN THỊ — cược đối xứng 1:1. In trên MỌI panel.
    ★ KẸP TRẦN 1,0: với coin biến động rất thấp, giá trị thô vượt 100% (σ̂=0,20%
      cho 159,5%) và dashboard sẽ in một 'xác suất' > 1. Kẹp, kèm cờ để giao diện
      hiện «không đạt được ở mọi tỉ lệ thắng» thay vì một con số vô nghĩa."""
    e_move = sigma_d * ABS_MOVE_RATIO * sqrt(H_days) * 100
    raw = 0.5 + cost_gate(H_days, instrument, f_daily) / (2 * e_move)
    return PReq(value=min(raw, 1.0), unreachable=raw >= 1.0)

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
| *Đối chiếu: cược đối xứng giao ngay, cùng hai chế độ* | | | *57,30% → 59,01% = **1,71 điểm*** |

> **Đây là lý do tồn tại của hình dạng cược bất đối xứng:** nó làm ngưỡng hoà vốn **gần bất biến theo chế độ thị trường** (0,5 so với 1,71 điểm — chặt hơn **3,4 lần**). Đó là cách duy nhất đã tìm thấy để biến một trần năng lực cố định (51–56%) thành kỳ vọng dương mà không cần giả định nào về chế độ.

**Bất biến khoảng cách — hình dạng cược KHÔNG tạo ra edge:**

```
null (bước ngẫu nhiên không trôi, MÔ PHỎNG đúng quy ước) = 23,42%
hoà vốn = (1 + c_R)/(tp/sl + 1)                          = 25,00%
khoảng cách = c_R/(1 + tp/sl)                            =  1,92 điểm   ← LUÔN DƯƠNG
```

> Dưới bước ngẫu nhiên, **mọi** cấu hình rào chắn đều lỗ, đúng bằng `c_R/(1+r)`. Hình dạng cược chỉ đổi **mức nâng tỉ lệ thắng mà tín hiệu phải cung cấp** — với 1,2/4,0 là 1,92 điểm; tín hiệu đo được nâng **6,6 điểm** (23,42% → 30,0%).

### ⚠️ Null KHÔNG phải `1,2/5,2 = 23,08%` — ba tầng sai lệch chồng nhau

Công thức gambler's ruin `sl/(sl+tp)` chỉ đúng cho chuyển động Brown **không trôi · giám sát liên tục CẢ HAI rào · không có hạn thời gian**. Thiết kế thật khác cả ba:

| # | Sai lệch | Ảnh hưởng |
|---|---|---|
| 1 | Rào định nghĩa **nhân trong giá** (`e·(1±kσ)`) nhưng bước ngẫu nhiên **cộng trong log** ⇒ tỉ lệ rào trong log-space là `\|log(1−1,2σ)\| : log(1+4,0σ)` = 3,67% : 11,33%, **không phải** 1,2 : 4,0 | **+1,37 điểm** |
| 2 | Bước **ngày rời rạc**, không liên tục | +1,1 điểm |
| 3 | **TP soi tại CLOSE**, không intrabar (§L5) | −2,1 điểm |
| | **Ròng** | 23,08% → **23,42%** *(gần nhau do trùng hợp, không do đúng)* |

**Null đúng phải MÔ PHỎNG, và mô phỏng phải tái lập được:**

```python
NULL_SEED, NULL_PATHS, SUB_STEPS = 20_260_827, 200_000, 24
# GBM μ=0 · σ = σ̂ đang dùng · 24 bước/ngày để sinh high/low trong ngày
# · stop soi low (ưu tiên khi cùng nến) · target soi close · hạn 60 ngày
```

| σ̂ ngày | Null — quy ước vận hành | Null — cả hai intrabar |
|---|---|---|
| 2,43% | **23,19%** | 25,26% |
| **3,00%** | **23,42%** | 25,52% |
| 4,00% | **23,82%** | 25,99% |

Ổn định theo seed *(5 seed, σ̂ = 3,00%)*: 23,42 · 23,70 · 23,51 · 23,28 · 23,41 — **độ lệch 0,138 điểm**.

**Đối chiếu tỉ lệ nền thực nghiệm** *(vào lệnh mọi ngày trong mẫu, cùng quy ước, σ̂ Parkinson, n = 9.046)*: **23,67%** — cao hơn null mô phỏng **+0,25 điểm**, đúng bằng phần trôi dương của thị trường crypto.

> Tỉ lệ nền thực nghiệm **23,67%** là đối chứng dùng cho cổng — nó bao gồm cả phần trôi, nên nó là thanh xà đúng. Null mô phỏng 23,42% dùng cho **bất biến test**, nơi cần một con số tái lập được không phụ thuộc dữ liệu.

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

Tỉ lệ chốt lời **theo quy ước vận hành** (stop treo · TP tại close · σ̂ Parkinson): **30,0%** (n = 90). Thấp hơn quy ước cả-hai-intrabar nhưng **EV cao hơn** vì lệnh thắng trung bình đạt **4,48R** thay vì bị chặn ở 3,33R.

> Cổng `p_star = 25,0%` tính theo payoff **hợp đồng** 3,33R ⇒ nó **thận trọng theo cấu tạo**: bỏ qua toàn bộ upside của việc để lệnh thắng chạy.
>
> | | |
> |---|---|
> | Biên trên điều kiện của chính cổng | **+5,0 điểm** (30,0% vs 25,0%) |
> | Nâng so tỉ lệ nền thực nghiệm | **+6,3 điểm** (30,0% vs 23,67%) |
> | **EV thực đo, kể cả phần chạy** | **+0,559R** |

| Lỗ thực nhận | EV mỗi lệnh |
|---|---|
| **1,00R** *(giả định nền)* | **+0,377R** |
| 1,30R *(ngưỡng cảnh báo)* | +0,171R |
| 1,40R *(ngưỡng chặn)* | +0,105R |
| 1,50R | +0,046R |
| **1,57R** | **−0,001R** ← hoà vốn |

Ngưỡng cảnh báo 1,3R và chặn 1,4R nằm **trong vùng kỳ vọng dương** — chúng là cổng thận trọng, không phải điểm kỳ vọng âm.

## L5 · Hướng sơ cấp

### ★ Quy ước khớp lệnh — ĐÓNG BĂNG (B6)

```
Tín hiệu tính tại CLOSE nến t          (dùng dữ liệu tới hết t, không hơn)
Điểm vào tham chiếu = OPEN nến t+1     ← entry_ref_price
Thực thi thật        = TWAP 00:15–00:45 UTC của ngày t+1
```

> ⛔ **Dùng `close[t]` làm điểm vào là LOOKAHEAD** — tín hiệu và giá khớp cùng một thời điểm đóng nến, tức bạn giả định khớp được ở đúng giá mà bạn vừa dùng để ra quyết định. `11 §5.1` gọi tên nó; bất biến #33 chặn nó.

| | |
|---|---|
| **Vì sao lệch khỏi 00:00 UTC khi thực thi** | 00:00 UTC vừa là mốc funding vừa là mốc dồn cụm turn-of-candle (+0,58 bps/phút, `09 §4`) |
| **Vì sao backtest vẫn dùng `open[t+1]`** | Là ước lượng có sẵn, không cần dữ liệu phút. **Chênh lệch `open[t+1]` ↔ TWAP CHƯA ĐO** — nằm ở phép đo #8; trước khi đo xong, không được gọi nó là "thận trọng" |
| **Mọi phép đo trong repo dùng quy ước này** | `trend.py` · `null.py` · `all27.py` · `barrier_surface.py` · `groupB.py`. Lần duy nhất lệch khỏi nó là lỗi off-by-one của `pp4_final.py` (ADR-013) |

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

SỰ KIỆN ĐÓNG — QUY ƯỚC BẤT ĐỐI XỨNG, có chủ ý:
    · chạm STOP    — soi INTRABAR (low ≤ stop). Khớp với lệnh stop-limit TREO
    · chạm TARGET  — kiểm tại CLOSE (close ≥ target), KHÔNG soi intrabar
    · cùng nến chạm cả hai ⇒ STOP trước (thận trọng)
    · w bước XUỐNG ⇒ đóng theo LIFO   ·   quá deadline
    (Người dùng có thể đã thoát sớm hoặc không vào — sổ ghi riêng, §5.3)
```

### ★ Vì sao lệnh stop treo là BẮT BUỘC, còn target thì KHÔNG

Hai rào có bản chất khác nhau, và phép đo xác nhận sự bất đối xứng đó là **đúng**:

| Quy ước | % thắng | R TB lệnh thắng | **EV sau phí** |
|---|---|---|---|
| Stop treo **+ limit treo tại target** | 33,7% | 3,33R *(bị chặn)* | +0,377R |
| **Stop treo, TP kiểm tại close** ← dùng | **29,2%** | **4,74R** *(chạy tiếp)* | **+0,593R** |

*89 lệnh, 4 cặp — `scripts/measurements_2026_08_26/groupB.py`*

> **Tỉ lệ thắng thấp hơn nhưng EV cao hơn 57%.** Đặt lệnh limit tại target **chặn mất lệnh thắng lớn** — đúng thứ mà một hệ theo xu hướng sống nhờ. Stop thì ngược lại: nó bảo vệ, và phải chắc chắn.

**Chỉ dẫn bắt buộc in cùng mọi khuyến nghị vào:**

> *«Đặt lệnh stop-limit treo tại {stop_price} NGAY khi vào lệnh. KHÔNG đặt lệnh chờ tại mức chốt lời — hệ sẽ báo khi đến lúc thoát.»*

**Vì sao không để tuỳ người dùng** — lập luận không phải về lợi nhuận mà về **đo lường được**:

| | |
|---|---|
| **Có lệnh treo** | Lỗ = 1,0R **theo cấu tạo**. Đặc tả kiểm chứng được |
| **Không có lệnh treo** | Lỗ phụ thuộc **người dùng có mở máy hôm đó không** — hệ **không quan sát được, không kiểm soát được** |

Đo trên 59 lệnh chạm stop, quy ước «kiểm mỗi ngày, thoát tại close»: lỗ TB **0,86R** — *tốt hơn 1,0R về trung bình* — nhưng **p90 = 1,58R** (vượt hoà vốn 1,57R), **max 4,23R**, và **18,6% số stop vượt ngưỡng chặn 1,4R**.

> Hình dạng *nhặt xu trước xe lu*: trung bình đẹp hơn, đuôi trái dày hơn nhiều. Với n=59, trung bình chưa đáng tin còn đuôi thì đã thấy. **Và quan trọng hơn cả: nó không phải một đặc tả — nó là một hi vọng.** Với hệ mà sản phẩm là bảng điểm trung thực, một đầu vào không quan sát được là chí mạng: bạn không bao giờ biết bảng điểm đang đo kỹ năng của hệ hay thói quen của người dùng.

**Bảng điểm chấm SONG SONG cả hai quy ước** (§9.1) — chi phí gần bằng 0, và nó cho người dùng thấy đúng cái giá của việc không đặt lệnh treo.

**Vì sao k = 1 (thang σ̂ ngày):** ở thang 35 ngày, đo được **11/23 lệnh kết thúc bằng hết hạn** thay vì chạm rào giá ⇒ hình dạng 4:1 **không xảy ra**, và toàn bộ lập luận kinh tế sụp. Ở k=1: **0/23 hết hạn**, thời gian nắm giữ thực tế ~6 ngày.

**Ba tham số của rào chắn là ràng buộc lẫn nhau, chỉ chọn được hai trong ba.** Dưới bước ngẫu nhiên, thời gian kỳ vọng chạm một trong hai rào = `1,2k · 4,0k = 4,8k²` ngày; với hạn 60 ngày thì `k ≈ 1` là điểm mà rào giá chi phối.

## L6 · Lọc bỏ

```python
# LightGBM năng lực thấp: depth 3 · ≤15 lá · ≤18 đặc trưng · ≤300 cây
# trọng số mẫu theo ĐỘ DUY NHẤT NHÃN
# isotonic: fit trên tập validation TÁCH RIÊNG trong từng fold purged walk-forward,
#           GỘP TOÀN VŨ TRỤ (số sự kiện mỗi đồng không đủ hiệu chỉnh riêng).
#           ★ Lát calibration phải được PURGE + EMBARGO ở CẢ HAI BIÊN (03 M7) —
#             nó nằm giữa train và test nên rò rỉ được về cả hai phía.
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

## LV · TRỌNG TÀI — purged walk-forward (B7)

> Tầng này không nằm trên đường suy luận. Nó là thứ quyết định **mọi con số của hệ nói thật hay nói dối**, nên nó có mục riêng và phải tồn tại **trước** mọi model.

### LV.1 · Bộ chia fold

```
|--- train ---|  purge  |--- test ---|  embargo  |--- train ---| ...
                (P nến)               (E nến)

n_folds = 8 · mỗi fold trải ≥ 24 tháng
P = E = ĐỘ DÀI NHÃN, không phải horizon_bars
```

> ### ⚠️ `purge = horizon_bars` là một rò rỉ chờ sẵn (B16)
>
> `config/model.yaml` để `purge_bars: null` ⇒ tự lấy bằng `horizon_bars["1d"] = 1`. Nhưng **nhãn của L6 là kết cục rào chắn, kéo dài tới `DEADLINE_DAYS = 60` ngày**. Purge 1 nến trong khi nhãn dài 60 nến ⇒ **59 nến chồng lấn** giữa train và test, mỗi nến mang một nhãn nhìn thẳng vào vùng test.
>
> ⇒ **`P = E = 60` cho khung 1d.** Và quy tắc chung: `P = E = max(độ dài nhãn của MỌI tầng dùng fold này)`.

**⚠️ Một trục thời gian TOÀN CỤC duy nhất, áp cùng một mốc cho mọi symbol.** Ta gộp 40 cặp và có đặc trưng liên thị trường BTC. Chia fold riêng từng coin thì lát test của coin A trùng mốc với lát train của coin B — mà các cặp USDT tương quan rất cao trong ngày. **Rò rỉ gần như trực tiếp và rất khó phát hiện bằng các phép thử thông thường.**

### LV.2 · Năm phép dò rò rỉ — chạy tự động trong `pytest`

| # | Phép thử | Cách làm | Dấu hiệu rò rỉ |
|---|---|---|---|
| 1 | **Dịch nhãn** | Dịch toàn bộ nhãn thêm 1 bước, train lại | Điểm số **tăng** ⇒ rò rỉ chắc chắn |
| 2 | **Xáo trộn nhãn** | Xáo ngẫu nhiên nhãn, train lại | Điểm vẫn > 50% đáng kể ⇒ rò rỉ |
| 3 | **Tương quan đặc trưng** | `corr(feature, label)` | Bất kỳ đặc trưng nào > 0,99 ⇒ rò rỉ |
| 4 | **Ranh giới chéo coin** | Mọi symbol dùng chung một mốc cắt fold | Mốc khác nhau giữa các coin ⇒ rò rỉ chéo |
| 5 | **Kiểm tra ranh giới** | So mẫu cuối train và đầu test | Chồng lấn thời gian ⇒ purge sai |

> **Một phép thử CỐ Ý không đưa vào:** *"train trên tương lai, test trên quá khứ"*. Nhiều hướng dẫn coi kết quả tương đương ở phép thử này là bằng chứng rò rỉ — **không đúng**. Một tín hiệu dừng hợp lệ (hiệu ứng ổn định qua nhiều năm) cũng cho kết quả tương đương. Dùng nó sẽ vứt đi những model tốt.

### LV.3 · Điều kiện nghiệm thu — KHÔNG phải «test xanh»

```
Với mỗi phép thử: TIÊM một rò rỉ đã biết, xác nhận phép thử đó BẮT ĐƯỢC,
rồi mới gỡ rò rỉ ra.
   probe 1 ⟵ tiêm: một nhãn lệch một nến
   probe 2 ⟵ tiêm: một đặc trưng = nhãn tương lai cộng nhiễu
   probe 3 ⟵ tiêm: một đặc trưng sao chép nhãn
   probe 4 ⟵ tiêm: chia fold theo từng symbol
   probe 5 ⟵ tiêm: purge = 0
```

> **Một bộ dò chưa từng bắt được gì không phải bộ dò.**

**Đối chiếu độc lập:** sau khi viết xong, chạy song song với `purgedcv` (MIT, tương thích sklearn) trên cùng dữ liệu và so ranh giới từng fold. Lệch nhau nghĩa là **một trong hai sai** — và phải biết bên nào trước khi tin bất kỳ kết quả nào.

### LV.4 · Ràng buộc cỡ mẫu (B16)

| Khoá | Hiện tại | Phải thành | Vì sao |
|---|---|---|---|
| `min_train_bars` | **5000** | **theo khung**: 1d ≈ 500 · 1h 5000 | Khung ngày chỉ có 1.095 nến (3 năm) — 8 fold × (train ≥ 5000 + purge 60 + test + embargo 60) là **bất khả**; bộ chia sẽ không sinh nổi **một fold nào** |
| `purge_bars` / `embargo_bars` | `null` ⇒ `horizon_bars` | **60** cho khung 1d | Xem khối cảnh báo LV.1 |

**Số học fold cho khung ngày, 3 năm × 40 cặp:**

```
1.095 nến ngày · 8 fold · P = E = 60
train tối thiểu 500 + purge 60 + test 60 + embargo 60 = 680 nến cho fold đầu
mỗi fold sau thêm ~60 nến test  ⇒  680 + 7×60 = 1.100 nến  ≈ vừa đủ
```

⇒ **Ba năm là mức SÀN, không phải mức thoải mái.** Nếu mẻ tải cho ít hơn 1.100 nến ngày ở đa số cặp, phải giảm `n_folds` xuống 6 và ghi rõ hệ quả về công suất — **không** được giảm `purge`.


## L8 · Sổ khuyến nghị và bảng điểm

Xem Phần 5 và Phần 9 — với hệ khuyến nghị, đây là tầng **quan trọng nhất**.

---

# PHẦN 4 · HÀM QUYẾT ĐỊNH

## 4.1 · Hằng số và cấu hình

```python
TRADE_TF   = frozenset({"1d"})            # DANH SÁCH TRẮNG — rào CHÍNH (ADR-002)
RULE11_ACC = 0.60                         # dây an toàn thứ hai (RULE 11)
H_DAYS     = {"1h": 4/24, "4h": 1.0, "1d": 1.0}    # = horizon_bars × giờ_mỗi_nến / 24
GRID_27    = tuple(itertools.product((10,20,50), (100,150,200), (20,55,100)))  # THỨ TỰ CỐ ĐỊNH
EXP_HOLD_DAYS = 5.8                       # đo được — dùng cho choose_instrument_display
SL_MULT, TP_MULT, DEADLINE_DAYS = 1.2, 4.0, 60
MARGIN_PP  = 0.02                         # biên cổng L6
SIZE_BASE_PCT, TRANCHE_PCT = 4.0, 1.0     # % NAV

@dataclass(frozen=True)
class PredictConfig:
    symbol: str
    tf: Literal["1h","4h","1d"]
    model_sha: str
    live_max: timedelta      # mặc định = 1 × timeframe_delta(tf)
    delayed_max: timedelta   # mặc định = 3 × timeframe_delta(tf)
    valid_for: timedelta     # mặc định = 1 × timeframe_delta(tf); sinh valid_until
    rv_window: int = 20
    har_target_days: int = 5
```

## 4.2 · Bảy hàm mà rc1 gọi nhưng không đặc tả (B9 · B14 · B15 · B18)

```python
# ── B15 · CONSTRUCTOR DUY NHẤT — mọi nhánh đi qua đây ⇒ không nhánh nào làm rơi trường
def _emit(ctx: PredictCtx, *, fresh: DataFreshness, sigma_d: float, f_hat: float,
          w: Optional[float], book: TrancheBook, closed: tuple[Tranche, ...],
          new: tuple[Tranche, ...] = (), warns: tuple[str, ...] = (),
          reason: Optional[str], cfg: PredictConfig) -> Prediction:
    H  = H_DAYS[ctx.tf]
    F  = Normal(mu=0.0, sd=sigma_d * sqrt(H))                    # trên LOG-RETURN
    q  = tuple(ctx.last_close * exp(F.ppf(a)) for a in (0.10, 0.50, 0.90))
    pr = p_required_symmetric(sigma_d, H, "spot", f_hat)
    assert (new == ()) == (reason is not None)                   # bất biến #19, ép ở đây
    return Prediction(
        symbol=ctx.symbol, timeframe=ctx.tf, open_time=ctx.open_time,
        model_sha=ctx.model_sha, last_close=ctx.last_close,
        valid_until=ctx.open_time + cfg.valid_for,
        expected_vol_pct=sigma_d * sqrt(H) * 100,                # B5 — quy đổi hiển thị
        q10=q[0], q50=q[1], q90=q[2], p_up=1 - F.cdf(0.0),
        p_required=pr.value, e_move_pct=sigma_d*ABS_MOVE_RATIO*sqrt(H)*100,
        cost_assumed_pct=cost_gate(H, "spot", f_hat),
        instrument=choose_instrument_display(EXP_HOLD_DAYS, f_hat),
        trend_weight=w, new_tranches=new, closed_tranches=closed,
        active_tranches=book.active, warnings=warns,
        data_freshness=fresh, in_training_universe=ctx.in_training_universe,
        silence_reason=reason)

# ── B9 · CHỌN CÔNG CỤ — CHỈ ĐỂ HIỂN THỊ, không nằm trên đường quyết định
def choose_instrument_display(exp_hold_days: float, f_daily: float) -> Literal["spot","perp"]:
    """Ngưỡng d* = (c_spot − c_perp)/f̂ = 0,10/f̂.
    ⚠️ Truyền EXP_HOLD_DAYS (5,8), KHÔNG phải H_DAYS — rc1 truyền nhầm H_DAYS[1d]=1,0
       và hàm sẽ trả "perp", trái kết luận spot-only."""
    return "spot" if exp_hold_days > 0.10 / max(f_daily, 1e-6) else "perp"

# ── B14 · TIẾN SỔ — do GIÁ và w điều khiển. Nhận Bar (có high/low), không nhận last_close
def advance_book(book: TrancheBook, bars: pd.DataFrame, w: Optional[float],
                 cfg: PredictConfig) -> tuple[TrancheBook, tuple[Tranche, ...]]:
    """Bắt kịp qua MỌI nến chưa xử lý kể từ book.last_bar_processed (bất biến #27).
    THỨ TỰ TRONG MỘT NẾN LÀ CỐ ĐỊNH — nó quyết định kết quả khi nhiều điều kiện
    cùng đúng, nên phải đóng băng:
        ① STOP     low ≤ stop_price          ← ưu tiên cao nhất (thận trọng)
        ② TARGET   close ≥ target_price      ← tại CLOSE, không intrabar (B11)
        ③ DEADLINE now ≥ deadline
        ④ LIFO     w tụt dưới level ⇒ đóng tranche mức cao nhất trước
    Trả (sổ mới, tranche vừa đóng — mỗi cái đủ exit_time/exit_price/close_reason/realized_r)."""

def open_tranches(w: float, book: TrancheBook, sigma_d: float,
                  ctx: PredictCtx, now: datetime) -> tuple[PendingEvent, ...]:
    """CHỈ mở. Mỗi bước 0,25 mà w vượt LÊN và slot TRỐNG ⇒ một PendingEvent.
    Bước nhảy k mức ⇒ k sự kiện riêng, cùng entry/σ̂ (mỗi cái ≤1% NAV).
    ctx.next_open is None ⇒ trả () — chưa có giá vào (B6)."""

def cell_signal(bars_1d: pd.DataFrame, ef: int, es: int, dn: int) -> pd.Series:
    """Trả CHUỖI 0/1 trên toàn lịch sử (máy trạng thái cần trạng thái trước,
    nên không thể là hàm vô hướng như rc1 khai báo `-> int`).
    EMA dùng `adjust=False`. Donchian = rolling(dn).max().shift(1)."""

def ensemble_weight(bars_1d: pd.DataFrame, grid: tuple) -> Optional[float]:
    """Trung bình cell_signal qua `grid`, rồi làm tròn về {0; ,25; ,5; ,75; 1}.
    Trả None khi len(bars_1d) < max(es) + max(dn) — chưa đủ nến cho EMA200.
    GRID_27 là TUPLE có thứ tự cố định (itertools.product theo đúng thứ tự đã
    liệt kê) — không phải set, vì bất biến #12 pin hash của nó.
    Không có ca hoà khi làm tròn: mọi k/27 đều không rơi đúng trung điểm."""

def with_size(ev: PendingEvent, ctx: PredictCtx, cfg) -> Tranche:
    """PendingEvent → Tranche. size = TRANCHE_PCT (1% NAV) cố định theo NOTIONAL.
    stop/target/deadline tính từ ev.entry_ref_price và ev.sigma_entry."""

# ── B18 · CẢNH BÁO — cần lịch sử σ̂ và trạng thái TOÀN DANH MỤC
def collect_warnings(book: TrancheBook, sigma_hist: pd.Series, f_hat: float,
                     fresh: DataFreshness, pf: PortfolioSnapshot) -> tuple[str, ...]:
    """rc1 truyền `sigma: float` và `book` một symbol ⇒ KHÔNG tính được 2/5 cảnh báo.
    TUONG_QUAN_CAO cần pf.symbols_with_open_tranches; VOL_CUC_DOAN cần phân phối
    σ̂ 90 ngày, không phải một số vô hướng.
    predict() vẫn THUẦN — pf là tham số vào, do người gọi dựng từ sổ mọi symbol."""
```

## 4.3 · Hàm quyết định

```python
def predict(bars: pd.DataFrame, bars_1d: pd.DataFrame, funding_hist: pd.Series,
            book: TrancheBook, pf: PortfolioSnapshot, now_hint: datetime,
            cfg: PredictConfig) -> tuple[Prediction, TrancheBook]:
    """HÀM THUẦN: mọi trạng thái vào-ra qua tham số; không đồng hồ, không I/O,
    không global. Gọi hai lần cùng đầu vào ⇒ giống hệt từng byte."""

    ctx   = build_ctx(bars, cfg)
    fresh = freshness(bars, now_hint, cfg)          # live | delayed | disconnected

    # ── L1–L2 ── LUÔN tính được, kể cả trên nến cũ (B15)
    sigma_d = sigma_hat_daily(bars_1d, window=cfg.rv_window)     # σ̂ NGÀY, Parkinson
    f_hat   = forecast_funding_daily(funding_hist, asof=ctx.open_time)
    w       = ensemble_weight(bars_1d, GRID_27)                  # None nếu chưa đủ nến

    # ── L5a ── TIẾN SỔ TRƯỚC MỌI QUYẾT ĐỊNH (B1)
    if fresh == "disconnected":
        book, closed = book.mark_unverified(ctx.open_time), ()   # không có nến ⇒ không đoán
    else:
        book, closed = advance_book(book, bars_1d, w, cfg)       # nến trễ vẫn là nến thật

    warns = collect_warnings(book, sigma_hist(bars_1d), f_hat, fresh, pf)
    emit  = partial(_emit, ctx, fresh=fresh, sigma_d=sigma_d, f_hat=f_hat,
                    w=w, book=book, closed=closed, warns=warns, cfg=cfg)

    # ── CÁC CỔNG — mỗi cái chỉ có thể làm hệ IM LẶNG, không bao giờ tạo hướng ──
    if fresh != "live":            return emit(reason=f"dữ liệu {fresh}"), book
    if cfg.tf not in TRADE_TF:     return emit(reason="khung hiển thị (ADR-002)"), book
    if p_required_symmetric(sigma_d, H_DAYS[cfg.tf], "spot", f_hat).value > RULE11_ACC:
                                   return emit(reason="ngưỡng thắng cần vượt RULE 11"), book
    if w is None:                  return emit(reason="chưa đủ nến cho EMA200"), book
    if ctx.next_open is None:      return emit(reason="chưa có giá mở nến kế tiếp"), book

    events = open_tranches(w, book, sigma_d, ctx, now_hint)
    if not events:                 return emit(reason=f"w={w:.2f} — không có slot mở"), book

    # ── L6 · học máy CHỈ LỌC BỎ ──
    p_star = p_star_event(sigma_d)
    kept = [e for e in events
            if calibrate(meta.predict(build_features(bars_1d), e)) >= p_star.value + MARGIN_PP]
    if not kept:                   return emit(reason=f"L6 loại {len(events)} sự kiện"), book
    # ★ M06 · SLOT chỉ bị chiếm bởi tranche THẬT SỰ được phát.
    #   open_tranches trả PendingEvent (chưa chiếm slot); chỉ book.with_new(new)
    #   mới đánh dấu slot. Sự kiện bị L6 loại ⇒ slot vẫn TRỐNG ⇒ đủ điều kiện
    #   tái vũ trang ở close kế tiếp. Nếu làm ngược lại, một lần L6 từ chối sẽ
    #   khoá slot đó vĩnh viễn cho tới khi w tụt xuống rồi leo lại.

    # ── L7 · cỡ gợi ý ──
    new = tuple(with_size(e, ctx, cfg) for e in kept)
    return emit(new=new, reason=None), book.with_new(new)
```

**Ba thứ đọc ra từ hình dạng của hàm này:**

| | |
|---|---|
| **Mọi cổng đều là `return emit(reason=...)`** | Không nhánh nào tạo hướng. `kept ⊆ events` theo cấu tạo — L6 lọc một danh sách, không sinh phần tử |
| **`emit` là constructor duy nhất** | Không nhánh nào làm rơi trường; `assert (new == ()) == (reason is not None)` ép bất biến #19 ngay tại chỗ |
| **Tiến sổ nằm TRƯỚC mọi cổng** | B1 — một khuyến nghị đã phát phải được theo dõi tới cùng, kể cả khi hệ ngừng phát khuyến nghị mới |

### Ma trận: tiến sổ so với mở khuyến nghị mới

| Trạng thái | **Tiến sổ** (soi rào · LIFO · deadline) | Mở tranche mới |
|---|---|---|
| `live` | ✅ qua mọi nến mới | ✅ nếu cổng mở |
| `delayed` | ✅ **có** — nến trễ vẫn là nến thật | ❌ |
| `disconnected` | ❌ không có dữ liệu ⇒ gắn `unverified_since`, **không đoán** | ❌ |
| **Cổng phí đóng** (σ̂ thấp) | ✅ **bình thường** | ❌ |
| Khung không giao dịch | ✅ *(sổ chỉ tồn tại ở khung 1d)* | ❌ |

> **Vì sao đây là blocker, không phải tinh chỉnh:** cổng phí đóng khi `σ̂ < 2,19%/ngày`. Đo trên BTC: **32,3% số ngày**, chuỗi liên tục dài nhất **155 ngày** — **dài hơn chính deadline 60 ngày**. Dưới thiết kế cũ, một khuyến nghị mở ra rồi thị trường vào chế độ vol thấp, người dùng **không nhận được tín hiệu thoát nào trong năm tháng**, trong khi sổ — thứ §5.1 gọi là *bằng chứng duy nhất* — vẫn ghi nó là `active`.
>
> | Cặp | % ngày cổng đóng | Chuỗi dài nhất |
> |---|---|---|
> | **BTCUSDT** | **32,3%** | **155 ngày** |
> | ETHUSDT · DOGEUSDT | 9,2% | 111 · 49 ngày |
> | SOLUSDT | 2,0% | 21 ngày |

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
      phát khuyến nghị VÀO
            │
            ▼
        [ active ] ──── close ≥ target ───► [ hit_target ]  ─┐
            │      ──── low ≤ stop ───────► [ hit_stop   ]  ─┤ mọi nhánh này
            │      ──── quá deadline ─────► [ expired    ]  ─┤ phát KHUYẾN NGHỊ
            │      ──── w bước xuống ─────► [ superseded ]  ─┘ THOÁT (§0.2 · 4b)
            │           (LIFO)                                 và ghi exit_time,
            │                                                  exit_price,
            │      ──── mất kết nối ──────► [ active + unverified_since ]
            │                                (KHÔNG đổi trạng thái — không đoán)
            └──── slot trống ⇒ đủ điều kiện tái vũ trang ở close kế tiếp

★ Bước tiến sổ chạy VÔ ĐIỀU KIỆN mỗi lần predict() có nến mới — kể cả khi cổng
  phí đóng và hệ không phát khuyến nghị vào nào (B1). Xem ma trận ở Phần 4.
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
       → advance_book bắt kịp qua MỌI nến kể từ lần chạy cuối (bất biến 27)
       → mọi tranche đóng trong lúc bắt kịp ⇒ vào closed_tranches của lần phát đầu tiên
         sau khởi động, kèm cảnh báo "khuyến nghị thoát bị TRỄ từ <exit_time>"
       → KHÔNG BAO GIỜ tự tạo lại rào chắn từ trí nhớ hoặc từ giá hiện tại
```

---

# PHẦN 6 · BẤT BIẾN VÀ TEST

| # | Bất biến | Test làm nó đỏ |
|---|---|---|
| 1 | Ba đầu ra từ **một** phân phối | **Tham số hoá bơm μ**: với μ ∈ {−0,01; 0; +0,01} ⇒ `assert sign(p_up − 0,5) == sign(q50 − last_close)`. *(Với μ=0 cả hai vế bằng 0 — test chỉ có nghĩa khi bơm μ, và nó bảo vệ đúng lúc ai đó bật μ)* |
| 2 | Dải giá đơn điệu | `assert q10 ≤ q50 ≤ q90` trên **đầu ra thật của `_emit`** (không phải trên `ppf`, vốn đơn điệu theo định nghĩa); và σ̂ ≤ 0 ⇒ **phải ném lỗi**, không trả dải vô nghĩa |
| 3 | Học máy chỉ **thu hẹp** | ① cổng đóng/slot đầy ⇒ quét `p_win ∈ [0,1]` cho **không sự kiện nào** ② **slot trống** ⇒ `set(kept) ⊆ set(events)` với **mọi** `p_win` — vế này rc1 thiếu, và nó mới là vế kiểm tính đơn điệu thật |
| 4 | Khung không giao dịch không phát khuyến nghị | Ép phát ở `"1h"`/`"4h"` ⇒ đỏ. Không cờ cấu hình nào bật được |
| 5 | Sàn perp | `A = σ̂ · ABS_MOVE_RATIO · 100` (biên độ 1 ngày, %). `assert p_required ≥ 0,5 + √(c₀·f̂)/A` với **f̂ > 0** và quét `d ∈ [0,25 ; 90]` ngày |
| 6 | Miền f̂ ≤ 0 | `cost_gate ≥ 0,20` và `p_star > 0` với **mọi** f̂ ∈ [−1,40; +1,40], ca test tại đúng biên |
| 7 | Hai cổng hai kiểu | `PReq` và `PStar` không so sánh chéo được (kiểu) |
| 8 | Hằng số tỉ lệ biên độ | Pin `ABS_MOVE_RATIO` = 0,685 ± 0,02 bằng phép đo lại trong test |
| 9 | Thiếu funding ⇒ giả định xấu | Cắt chuỗi ⇒ `f̂` **tăng** lên p95-expanding, không rơi về mặc định |
| 10 | Rò rỉ funding | Đưa kỳ funding tương lai vào ⇒ đỏ |
| 11 | Một hàm biến động, batch ≡ live | Hai đường, `assert khớp 1e-6` |
| 12 | Lưới đóng băng | Hash 27 ô pin trong test |
| 13 | Máy trạng thái tranche | Property test: slot mở ⟺ w ≥ mức và slot trống · đóng đúng LIFO · không tranche nào sống quá deadline · Σ notional ≤ w × size_base |
| 14 | Nhãn không phản thực | Hàm nhãn **không được đọc** giá sau thời điểm thoát |
| 15 | **Quy ước soi rào** | `simulate_null(σ=0,03, seed=NULL_SEED, n=200k, sub=24)` phải cho **23,42% ± 0,4 điểm**. Đổi sang cả-hai-intrabar cho 25,5% ⇒ refactor lệch quy ước làm test đỏ. *(Con số 23,1% cũ là giải tích sai — xem §L4)* |
| 16 | Mọi tranche là giao ngay | `instrument == "spot"` toàn sổ |
| 17 | `predict()` thuần | Gọi hai lần cùng đầu vào ⇒ giống hệt từng byte |
| 18 | Độ tươi chặn trước | `delayed`/`disconnected` ⇒ `new_tranches == ()`, mọi trường hợp |
| 19 | Im lặng tự giải thích | `new_tranches == () ⟹ silence_reason is not None` |
| 20 | Không bán khống | Kiểu dữ liệu không chứa `"SHORT"` |
| 21 | Sổ bất biến | **Cơ chế thực thi, không chỉ quy ước**: SQLite trigger `BEFORE UPDATE`/`BEFORE DELETE ... RAISE(ABORT)` trên bảng tranche. Test: thử `UPDATE` ⇒ ném `IntegrityError` |
| 22 | Cấm định danh hệ thuật ngữ | Quét `src/`: `order_block` · `fvg` · `bos` · `choch` · `liquidity_grab` · `killzone` · `elliott` · `wave_count` · `harmonic` · `gartley` · `smart_money` |
| 23 | **Kỳ vọng tại `p_star` bằng 0** | `assert abs(EV(p_star_event(σ), sl, tp, cost)) < 1e-9` với σ ∈ {0,005 … 0,20} — tính trực tiếp từ `sl_mult`/`tp_mult`/`cost`, **không** đọc lại công thức. Bất biến này bắt lớp lỗi thứ nguyên mà bảng số không bắt được (ADR-013) |
| 24 | **Khoảng cách null → hoà vốn** | `assert p_star − sl/(sl+tp) == c_R/(1 + tp/sl)` và luôn **dương** — hình dạng cược không tạo ra edge |
| 25 | **Tiến sổ vô điều kiện** (B1) | Ép `p_required > 0,60` trên nến mà giá đã xuyên stop ⇒ tranche đó **phải** chuyển `hit_stop`. Và: gọi `predict()` N lần liên tiếp với cổng đóng ⇒ mọi tranche quá deadline **phải** thành `expired` |
| 26 | **Mất kết nối không đoán** (B1) | `disconnected` ⇒ sổ không đổi trạng thái tranche nào, mọi tranche active mang `unverified_since` |
| 27 | **Bắt kịp qua gap** (B1) | Cho `advance_book` một chuỗi 10 nến sau gián đoạn ⇒ kết cục giống hệt khi chạy từng nến một |
| 28 | **Mọi tranche đóng đều xuất hiện** (B3) | Tranche rời `active` ⇒ **phải** có mặt trong `closed_tranches` của đúng lần `predict()` đó, kèm đủ `exit_time`/`exit_price`/`close_reason`/`realized_r` |
| 29 | **Quy ước rào bất đối xứng** (B11) | Stop soi `low`, target soi `close` — test một nến có `high ≥ target` nhưng `close < target` ⇒ tranche **vẫn active** |
| 30 | **Một hàm biến động duy nhất** (B4) | `sigma_hat_daily` là đường DUY NHẤT sinh σ̂ — quét `src/` cấm mọi `.std()`/`rolling` tính vol ngoài nó |
| 31 | **σ̂ luôn thang NGÀY** (B5) | Gọi `predict()` với `tf` ∈ {1h, 4h, 1d} trên cùng mốc thời gian ⇒ σ̂ nội bộ **giống hệt**; chỉ `expected_vol_pct` khác theo `√H_DAYS[tf]` |
| 32 | **Chân trời dự báo khớp thời gian nắm giữ** (C3) | `assert har_target_days == 5` và test hồi quy: nếu ai đổi sang 1 ngày, phép so QLIKE với EWMA phải **đỏ** |
| 33 | **Điểm vào không bao giờ là `close[t]`** (B6) | `assert tranche.entry_ref_price == bars.open[t+1]` cho mọi tranche; và test rò rỉ: đưa vào chuỗi mà `open[t+1] != close[t]` ⇒ hai giá trị phải khác nhau |
| 34 | **Constructor duy nhất** (B15) | Mọi nhánh `predict()` đi qua `_emit`; grep `Prediction(` trong `src/` chỉ được có **một** kết quả |
| 35 | **Thứ tự đóng trong một nến** (B14) | Nến vừa xuyên stop vừa có `close ≥ target` ⇒ **`hit_stop`**. Nến vừa quá deadline vừa chạm target ⇒ **`hit_target`** (rào giá trước thời gian) |
| 36 | **Chọn công cụ nhận thời gian NẮM GIỮ** (B9) | `choose_instrument_display(5,8; f̂=0,0292)` ⇒ `"spot"`; truyền nhầm `H_DAYS["1d"]=1,0` ⇒ `"perp"` ⇒ test đỏ |
| 37 | **`stale` không do `predict()` sinh** (B10) | `DataFreshness` không chứa `"stale"` ở tầng kiểu; tầng phục vụ tính từ `valid_until` |
| 38 | **Thang chấm cổng cố định** (B2) | Đổi `SIZE_BASE_PCT` từ 4 sang 8 ⇒ tỉ số sụt giảm của GATE 1a **không đổi** (cổng chấm ở thang `w`, không ở thang NAV) |
| 39 | **Purge bằng độ dài NHÃN** (B16) | `assert purge_bars == embargo_bars == max(độ dài nhãn mọi tầng)`; ép `purge = horizon_bars = 1` ⇒ probe #5 (kiểm tra ranh giới) phải **đỏ** |
| 40 | **Một trục thời gian toàn cục** (B7) | Chia fold cho 3 symbol có lịch sử khác nhau ⇒ mọi mốc cắt **giống hệt**; chia theo từng symbol ⇒ probe #4 phải **đỏ** |
| 41 | **Probe phải tự chứng minh** (B7) | Với mỗi phép thử 1–5: tiêm rò rỉ tương ứng ⇒ **phải đỏ**; gỡ ra ⇒ **phải xanh**. Chạy trong `pytest`, chặn commit |
| 42 | **`p_required` bị kẹp trần** (M29) | `0,5 ≤ p_required ≤ 1,0` với mọi σ̂ ∈ [0,0001; 1,0] và mọi H; raw ≥ 1,0 ⇒ `unreachable is True` |
| 43 | **Hai ngưỡng không lẫn nhau** (M05) | `PReq` và `PStar` là hai kiểu; giao diện in `p_required` cạnh `p_up`, `p_star` cạnh `p_win` — test snapshot giao diện |
| 44 | **Slot chỉ bị chiếm bởi tranche đã phát** (M06) | L6 loại toàn bộ sự kiện ⇒ ở close kế tiếp với `w` không đổi, sự kiện **phải được phát lại** |
| 45 | **Nhãn giả định luôn hiện** (M03) | Mọi phản hồi chứa số bảng điểm ⇒ có trường `disclaimer` khác rỗng |
| 46 | **Thiếu funding ≠ không có perp** (M25) | Cặp không có hợp đồng vĩnh cửu ⇒ `f̂ is None`, KHÔNG phải `p95_expanding`; hai ca phân biệt được ở tầng kiểu |
| 47 | **FDR trước khi xếp hạng** (M08) | Bảng xếp hạng coin theo kỹ năng ⇒ phải có trường `fdr_q` khác None, nếu không thì từ chối render |
| 48 | **`H_DAYS` suy từ config, không hằng số cứng** (m08) | `assert H_DAYS[tf] == horizon_bars[tf] * timeframe_hours[tf] / 24` cho cả ba khung — đổi `horizon_bars` trong config mà quên sửa mã ⇒ đỏ |

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

`size_base` 4% NAV · tranche 1% NAV *(gợi ý phân bổ cho người dùng — KHÔNG vào cổng, xem §8.2)* · ngưỡng freshness (live ≤1 chu kỳ, delayed ≤3) · staleness funding 24h · `H_DAYS` theo config · điều kiện bật L6 ≥300 sự kiện · trần cảnh báo tương quan (3 coin) · trần cảnh báo chuỗi thua (5) · phân vị cảnh báo vol (95).

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

Với phạm vi khuyến nghị, **GATE 3** (chạy tiền ảo) và **GATE 4** (an toàn vận hành tiền thật) ngoài phạm vi. Còn lại **hai** cổng:

| Cổng | Nội dung | Vì sao vẫn cần |
|---|---|---|
| **GATE 1** | Hệ có kỹ năng dự báo không | Quyết định sản phẩm có được ship hay không |
| **GATE 2** | Hiệu chỉnh xác suất — Brier + reliability diagram | **RULE 6**: hệ phát ra `p_win` cho người dùng đọc. `predict_proba()` thô **không phải xác suất** |

*(rc1 dán nhãn sai GATE 2 là «giao dịch giấy» và gạt nó khỏi phạm vi — `00_MASTER_PLAN` định nghĩa GATE 2 = hiệu chỉnh xác suất.)*

## 8.2 · Cổng kép — và thang đo mà nó chấm trên (B2)

```
GATE 1a · TÁI LẬP ĐƯỢC (chỉ tiêu ổn định qua chế độ)
    tỉ số sụt giảm (chiến lược / mua-và-giữ) ≤ 0,60
    ở ≥80% số ô lưới, trên MỌI fold purged walk-forward

GATE 1b · KINH TẾ (so tương đối, không hằng số tuyệt đối)
    net Sharpe của TỔ HỢP ≥ net Sharpe mua-và-giữ, ở ≥6/8 fold
```

### ⚠️ Tỉ số sụt giảm KHÔNG bất biến theo tỉ lệ — cổng phải nói rõ thang đo

Cùng **một** chiến lược, cùng **một** chuỗi `w`, chỉ khác tỉ lệ triển khai *(BTC, lưới 27 ô, đã rời rạc hoá)*:

| Quy ước phơi bày | Sụt giảm | **Tỉ số** | So ngưỡng 0,60 |
|---|---|---|---|
| **`w` trên VỐN CỦA CHIẾN LƯỢC (0–100%)** ← chấm ở đây | **−24,67%** | **0,322** | đạt, biên thật |
| 50% NAV | −12,95% | 0,169 | đạt |
| 20% NAV | −5,36% | 0,070 | đạt |
| **4% NAV** *(quy ước cỡ gợi ý §L7)* | −1,09% | **0,0143** | đạt **dư 42 lần** |
| 1% NAV | −0,27% | 0,0036 | đạt dư 167 lần |

> **Tỉ số tỉ lệ gần thuận với tỉ lệ triển khai.** Chấm ở 4% NAV thì cổng đo **quy ước cỡ lệnh**, không đo **chiến lược** — nó đạt tự động và không nói lên điều gì.

### Hai tỉ lệ, hai mục đích — tách bạch

| | Thang đo | Ai quyết | Nằm ở đâu |
|---|---|---|---|
| **Tỉ lệ để CHẤM** | `w` ∈ [0; 1] = phần vốn **của chiến lược** đang triển khai. Tranche mức 0,25 = 25% vốn chiến lược | **Cố định trong mã**, pin bằng test | Cột A của bảng tham số |
| **Tỉ lệ GỢI Ý cho người dùng** | 4% NAV cho mỗi coin · 1% NAV mỗi tranche | **Người dùng** — đây là quyết định phân bổ vốn của họ, không phải thuộc tính của model | Cột B |

> Đây là hai câu hỏi khác nhau mà rc1 gộp làm một: *«chiến lược này có cắt được sụt giảm không?»* (cổng) và *«tôi nên dành bao nhiêu vốn cho nó?»* (người dùng). Với phạm vi hệ khuyến nghị, câu thứ hai **không thuộc phạm vi hệ** — nên nó càng không được lọt vào cổng.

**Chấm trên CHÍNH máy trạng thái tranche sản xuất** — một mã, hai chế độ chạy. Không chấm trên «chiến lược tỉ trọng `w`» rồi ship máy tranche: mô phỏng cho thấy hai thứ đó khác nhau rất xa nếu thiếu quy tắc tái vũ trang (B1).

**Vì sao không dùng ngưỡng Sharpe tuyệt đối:** Sharpe của mua-và-giữ dao động 0,52–0,96 tuỳ cửa sổ — ngưỡng tuyệt đối đo **chế độ thị trường**, không đo **chiến lược**. Và Sharpe của chính chiến lược không tái lập giữa hai đoạn (0,07 → 0,77) trong khi tỉ số sụt giảm tái lập **54/54 quan sát** (0,39 → 0,36).

## 8.3 · Giao thức khử nhiễm — bắt buộc

Vì lưới/k=1/ngưỡng được chốt sau khi nhìn 4 đồng:

| Quy tắc | Nội dung |
|---|---|
| **Tập chấm** | Thống kê đạt/trượt tính trên **36 cặp KHÔNG thuộc nhóm hiệu chuẩn**; BTC/ETH/SOL/DOGE báo cáo **riêng**, không gộp |
| **Giai đoạn sạch** | 6 tháng cuối chưa từng chạm (đã có trong config) |
| **Sạch tuyệt đối** | Mọi dữ liệu sau 2026-08 |
| **Khi trượt** | **Không** được chỉnh lưới, k, tỉ lệ rào, hay ngưỡng. Thứ tự sửa được phép (chốt lúc đầu lạnh): ① kéo dài chân trời sang tuần ② siết độ chọn lọc ③ thêm phái sinh vào L6 |

## 8.4 · Cổng riêng của tầng L2

L2 là tầng **tự chứng minh được** (cần ~11 quan sát, so với 229 lệnh cho tỉ lệ thắng) — nên nó có cổng riêng và ship được độc lập.

**Nguyên tắc: mọi vế đều TƯƠNG ĐỐI so với một đối chứng cụ thể.** Cùng bài học đã áp cho GATE 1a — chỉ tiêu tuyệt đối đo **chế độ thị trường**, chỉ tiêu tương đối đo **mô hình**.

```
σ̂  ·  mục tiêu = trung bình RV 5 NGÀY tới, ước lượng Parkinson
      ① QLIKE tốt hơn EWMA(0,94)   ≥  5%   (Diebold–Mariano p < 0,05)
                                              đo được: +15,8%   ✅
      ② QLIKE tốt hơn climatology  ≥ 20%
      ⛔ KHÔNG có vế R² tuyệt đối — xem khối cảnh báo dưới

f̂  ·  ① QLIKE tốt hơn "giữ nguyên giá trị hôm nay" ≥ 10%
      ② dấu dự báo đúng ≥ 60% số kỳ            (đo được R² 0,44–0,51 trên 4 cặp)

Dải ·  ① độ phủ [q10,q90] = 80% ± 3pp trên ≥500 dự đoán đã chấm
      ② số lần quantile cắt nhau = 0
      ③ PIT histogram không lệch (Kolmogorov–Smirnov p > 0,05)
```

> ### ⚠️ Vì sao BỎ vế «OOS R² log-RV ≥ 0,30»
>
> Ngưỡng 0,30 mượn từ `09 §3.1` — *"tái lập 0,512 trên 700k nến 5m Binance"*. Đó là dự báo **RV thang 5 phút từ dữ liệu tần suất cao, 700.000 quan sát**. Bài toán ở đây là **RV thang ngày từ nến ngày, 2.062 quan sát**. **Ngưỡng chưa bao giờ áp dụng được cho bài toán này.**
>
> Đo thật, với ước lượng tốt nhất trong bốn ứng viên:
>
> | Chân trời mục tiêu | OOS R² tốt nhất | So ngưỡng 0,30 |
> |---|---|---|
> | 1 ngày | 0,202 | trượt |
> | **5 ngày** *(chân trời dùng thật)* | **0,248** | trượt |
>
> Giữ nguyên 0,30 thì L2 trượt, và **không còn sản phẩm nào** — kể cả nhánh dự phòng Đài quan trắc. Nhưng hạ xuống 0,20 cho khớp con số vừa đo là **đặt ngưỡng sau khi nhìn kết quả**, đúng thứ `16` cấm.
>
> Lối thoát đúng là lối đã dùng cho GATE 1a: **so tương đối**. Vế ① và ② ở trên không phụ thuộc chế độ biến động của giai đoạn kiểm định, và chúng bác bỏ được — nếu HAR không thắng nổi một EWMA một tham số thì nó không đáng tồn tại.

> ### ★ Một phát hiện đi kèm: HAR chỉ đáng dùng ở chân trời nhiều ngày
>
> | Chân trời mục tiêu | QLIKE EWMA(0,94) | QLIKE HAR-Parkinson | |
> |---|---|---|---|
> | **1 ngày** | 0,4311 | 0,4744 | **HAR THUA 10%** |
> | **5 ngày** | 0,2254 | **0,1897** | **HAR THẮNG 15,8%** |
>
> Nếu đặc tả để σ̂ dự báo *ngày kế tiếp* — cách đọc tự nhiên và là cách bản rc1 ngầm giả định — thì **toàn bộ tầng HAR là phí công**, một EWMA đơn giản tốt hơn. Chân trời dự báo phải bằng **thời gian nắm giữ thực tế** (5,8 ngày), và điều đó phải nằm trong đặc tả chứ không nằm trong đầu người viết mã.

> **Nếu L2 đạt và GATE 1 trượt: vẫn có sản phẩm thật.** Đài quan trắc biến động — dải giá, biến động kỳ vọng, `p_required` — dựng trên tầng duy nhất tự chứng minh được. Đó là **kết quả hợp lệ**, không phải thất bại.

## 8.5 · Bộ phép đo bắt buộc trước khi chấm cổng

| # | Phép đo | Ngưỡng viết trước |
|---|---|---|
| 1 | Lưới 27 ô, purged WF, spot long/flat | Ô **trung vị** — không phải ô tốt nhất |
| 2 | Tỉ lệ chốt lời thật của khung rào chắn | ≥ **27,5%** *(hoà vốn 25,0–25,5% + biên thận trọng 2 điểm)*; ≤ 23,1% (mức bước ngẫu nhiên) ⇒ **dừng nhánh khuyến nghị** |
| 3 | Tỉ lệ đúng **theo nhóm ba biến động** | Không ngưỡng — phép đo **thông tin** |
| 4 | Trượt giá của mức dừng lỗ | Cảnh báo 1,3R · chặn 1,4R **(hoà vốn 1,57R)**. **Phương pháp đo đăng ký trước:** ① cron chụp sổ lệnh top-20 mức (spread + độ sâu) cho vũ trụ khuyến nghị **từ ngày 1** ② ước lượng bằng mô phỏng ăn-độ-sâu trên các nến σ̂ ≥ p95 ③ với hệ khuyến nghị, đo lại bằng **lệnh shadow** chứ không phải lệnh thật |
| 5 | Tương quan E\|move\| ↔ funding toàn vũ trụ | Không ngưỡng — quyết định cổng phí có ý nghĩa trên perp không |
| 6 | LIFO đối chứng FIFO | Chênh lệch không được là nguồn nhạy cảm chính |
| 7 | Thời gian nắm giữ thật của **tổ hợp** | Nếu lệch xa 6,3 ngày ⇒ mở lại quyết định k=1 |
| 8 | Chênh giá mở nến t+1 ↔ TWAP 00:15–00:45 | Vào mô hình chi phí |
| 9 | Tỉ số phương sai VR(2..30 ngày), 4 cặp | Xác nhận giả định μ=0 ở chân trời nhiều ngày |
| 10 | Đo lại cụm đặc trưng trên ≥3 **altcoin** | Nhóm liên thị trường chưa từng kiểm được |
| 11b | **Bộ nhãn MỨC NẾN** — cần cho 3/7 baseline hướng (`always_up`, `seasonal_naive`, `random_5050`) | Sinh song song với nhãn mức sự kiện; `drop_flat_from_train: false`; **chỉ dùng để chấm baseline**, KHÔNG train L6 |
| 11 | Bảy baseline (RULE 4) | `always_up` dùng 49,6% từ 2022 · `seasonal_naive` · `random_5050` · `buy_and_hold` · `tsmom_grid_median` · `dca_hold` · `naive_rw` |

**Sáu điều bị cấm khi chạy bộ này:** thêm phép thử thứ 12 · nới ngưỡng đã viết · đổi giai đoạn kiểm định · chạy lại với tham số khác rồi báo cáo lần đẹp · bỏ một phép thử vì "rõ ràng nó không hợp lý" · diễn giải kết quả không đạt thành "gần đạt".

**RULE 10:** mọi phép đo chặn cửa và mọi lần train L6 (kể cả thử tay) ghi MLflow — git hash, seed, hash dữ liệu, config, metric. Deflated Sharpe tính theo **số trial thật** lấy từ MLflow.

---

## 8.6 · Kiểm soát đa phép thử và công suất (M08 · M09)

> Bản rc1 mở rộng bộ đo từ 8 lên 11 phép thử **và** đưa bảng điểm kỹ năng theo từng đồng thành sản phẩm chính — trong khi làm rơi toàn bộ cơ chế chống dương-tính-giả của `10 mandate 9` và `mandate 10`. Hai thứ này là **hai bài toán khác nhau**, cần hai công cụ khác nhau.

### 8.6.1 · FDR — theo số CHUỖI được xếp hạng

```
α = 0,05 trên 1.200 chuỗi  ⇒  kỳ vọng ~60 dương tính giả
```

| Áp ở đâu | Quy tắc |
|---|---|
| Bộ 11 phép đo §8.5 | **Benjamini–Hochberg q = 0,10** trên toàn bộ 11 giá trị p |
| **Bảng điểm kỹ năng theo từng đồng** | ⛔ **CẤM hiển thị bảng xếp hạng coin theo kỹ năng trước khi áp FDR.** Một bảng 40 dòng chưa hiệu chỉnh sẽ luôn có vài dòng "xuất sắc" thuần tuý do may |
| Đặc trưng qua L6 | BH q = 0,10 trên tập đặc trưng ứng viên |

### 8.6.2 · DSR — theo số TRIAL đã chạy

Deflated Sharpe Ratio (Bailey–López de Prado) hiệu chỉnh theo **số lần thử thật**, lấy từ MLflow — bao gồm **cả những lần thử tay** (RULE 10). Hai đại lượng dễ nhầm:

| | Đếm cái gì | Công cụ |
|---|---|---|
| **DSR** | Số **trial** đã chạy để tìm ra kết quả này | Deflated Sharpe |
| **FDR** | Số **chuỗi/giả thuyết** đang được xếp hạng cùng lúc | Benjamini–Hochberg |

### 8.6.3 · n hiệu dụng — trần tham số

```
số tham số tự do tối đa  =  n_hiệu_dụng / 20

n_hiệu_dụng ≠ số hàng dữ liệu:
  · 40 cặp tương quan κ = 0,501 (kết cục lệnh)  ⇒  ~1,95 "cặp độc lập"
  · nhãn chồng lấn tới H nến                    ⇒  chia thêm cho tới H
  · block bootstrap: block ≥ H (= 60 ngày cho khung 1d)
```

**Bootstrap CI Sharpe theo fold, đòi phân vị 5% > 0** — không chấp nhận điểm ước lượng trần trụi.

### 8.6.4 · Con số công suất phải in cạnh mọi kết quả

| Chỉ tiêu | Số năm cần (40 cặp) | Trạng thái |
|---|---|---|
| Tỉ số sụt giảm (phát hiện khác biệt 0,20) | **3 năm** | ✅ đạt được |
| Sharpe vượt mua-và-giữ (0,30) | **hơn 5 năm** | 🔶 ranh giới |
| Tỉ lệ thắng (229 lệnh độc lập) | **34 năm** | ❌ không bao giờ |

> **GATE 1 không phải và không thể là một phép chứng minh có edge** — nó là **màng lọc chống thất bại hiển nhiên**. Đọc nó như phép chứng minh dẫn tới hai sai lầm đối xứng: tin quá mức khi qua, và bỏ cuộc sai khi trượt.

## 8.7 · Bốn nhánh kết cục của cổng kép (M12)

Cổng kép có **bốn** kết cục, không phải hai. Đăng ký hành động cho cả bốn, **hôm nay**:

| 1a · tỉ số sụt giảm | 1b · Sharpe | Hành động đã đăng ký |
|---|---|---|
| ✅ đạt | ✅ đạt | Xây L6 (lọc bỏ). Lộ trình bước 9 |
| ✅ đạt | ❌ trượt | **Ship tổ hợp như một sản phẩm QUẢN TRỊ RỦI RO, không phải sản phẩm alpha.** Khuyến nghị được phát, nhưng dashboard nói thẳng: *«hệ này cắt sụt giảm, nó KHÔNG hứa vượt mua-và-giữ»*. **KHÔNG** xây L6 |
| ❌ trượt | ✅ đạt | **Nghi ngờ trước, tin sau.** Sharpe không tái lập (0,07 → 0,77) còn tỉ số sụt giảm thì tái lập 54/54 — một kết quả ngược lại là dấu hiệu của may mắn hoặc lỗi, không phải kỹ năng. Điều tra rồi mới quyết; mặc định là **dừng** |
| ❌ trượt | ❌ trượt | **Dừng nhánh khuyến nghị, ship Đài quan trắc.** Đây là **KẾT QUẢ HỢP LỆ**, không phải thất bại |

> **Kịch bản dễ xảy ra nhất là hàng thứ hai** — 1a đạt, 1b trượt — vì đó chính là hình dạng mà mọi phép đo tới nay cho thấy. Nó phải có một hành động cụ thể chứ không phải một khoảng trống.


# PHẦN 9 · BẢNG ĐIỂM VÀ ĐỘ TRUNG THỰC

> Với hệ khuyến nghị, đây **là** sản phẩm. Một lời khuyên không có lịch sử đúng/sai công khai là một lời khuyên không kiểm chứng được.

## 9.0 · Bảng điểm là HIỆU SUẤT GIẢ ĐỊNH — nhãn bắt buộc (M02 · M03)

§0.4 nâng bảng điểm thành *«một phần của sản phẩm»*. Điều đó **bắt buộc kèm một nhãn**, vì con số được tính từ một chuỗi giả định mà không ai kiểm chứng được:

| Giả định | Thực tế |
|---|---|
| Vào tại `entry_ref_price` = **OPEN nến t+1** | Người dùng thực thi TWAP 00:15–00:45, **chênh lệch chưa đo** (phép đo #8) |
| Lỗ khi chạm stop = **1,00R** | Chỉ đúng **nếu** người dùng đã đặt lệnh treo. Không đặt: TB 0,86R nhưng p90 **1,58R**, max 4,23R |
| Thoát tại `target`/`stop`/`deadline` **đúng lúc hệ ghi nhận** | Người dùng có thể thoát sớm, muộn, hoặc **không bao giờ vào** |
| Mọi khuyến nghị **đều được thực hiện** | Hệ **không quan sát được** điều này |

**Nhãn bắt buộc, in cùng mọi con số bảng điểm — không thu gọn, không ẩn:**

> ### HIỆU SUẤT GIẢ ĐỊNH
> Các con số dưới đây đo **chất lượng lời khuyên của hệ**, tính theo giá tham chiếu và quy ước thoát của chính hệ. Chúng **không phải** kết quả giao dịch của bạn, và **không** bao gồm trượt giá thực thi của bạn.

**Chấm SONG SONG hai quy ước stop** (§9.1) — cho người dùng thấy đúng cái giá của việc bỏ lệnh treo.

> ### Vì sao chấm trên LỚP KHUYẾN NGHỊ, không trên lớp thực thi
>
> Nếu chấm trên lớp thực thi, hệ được **tha bổng** cho những lời khuyên tồi mà người dùng tình cờ bỏ qua, và bị **đổ lỗi** cho những lệnh người dùng tự nghĩ ra. Hai lớp phải tách bạch, và **chỉ lớp khuyến nghị quyết định hệ có kỹ năng hay không**. Nhưng đúng vì thế, nó phải mang nhãn giả định.

## 9.0b · `p_required` nào đứng cạnh khuyến nghị (M05)

§0.4 đòi *«mọi khuyến nghị đứng cạnh ngưỡng hoà vốn của CHÍNH NÓ»*. Hệ có **hai** ngưỡng, và chúng khác nhau hơn 30 điểm:

| Ngưỡng | Của cược nào | Giá trị điển hình | In ở đâu |
|---|---|---|---|
| `p_required` — kiểu `PReq` | Đối xứng 1:1 | **~57%** | Mọi panel, cạnh `p_up` — trả lời *«cược đối xứng có đáng không?»* → gần như luôn **không** |
| `p_star` — kiểu `PStar` | Rào chắn 3,33:1 | **25,0%** | **Cạnh mỗi khuyến nghị**, cùng `p_win` đã hiệu chỉnh — đây mới là ngưỡng của **chính khuyến nghị đó** |

> ⚠️ In `p_required` ≈ 57% cạnh một khuyến nghị có `p_win` ≈ 30% khiến người dùng đọc thành *«hệ khuyên vào lệnh mà tự nó nói chưa đủ ngưỡng»* — **sai hoàn toàn**, vì hai con số nói về hai hình dạng cược khác nhau. Đó là lý do hai kiểu dữ liệu `PReq`/`PStar` không so sánh chéo được (Phần 2), và giao diện phải giữ đúng ranh giới ấy.

**Mỗi khuyến nghị in đủ bốn số:** `p_win` (đã hiệu chỉnh) · `p_star` (hoà vốn của chính nó) · `stop_price` · `target_price`.


## 9.1 · Chấm điểm — chạy vô điều kiện, kể cả khi hệ im lặng

| Đại lượng | Thước đo | Đối chứng bắt buộc |
|---|---|---|
| Biến động | **QLIKE** (Patton 2011) | EWMA(0,94) |
| Dải giá | Độ phủ + PIT / rank histogram | Danh nghĩa 80% |
| Xác suất | Reliability diagram + Brier | Climatology |
| Phân phối | **CRPSS** | Climatology + persistence |
| Khuyến nghị | Tỉ lệ chốt lời, lợi suất theo R | **`p_star` tại lúc phát** + 7 baseline |
| **Khuyến nghị — quy ước phụ** | Cùng chỉ tiêu, nhưng giả định **không có lệnh stop treo** (thoát tại close nến xuyên stop) | Quy ước chính. **Hiển thị cả hai** — cho người dùng thấy giá của việc bỏ lệnh treo (B11) |
| Tổng thể | **FVA** (Forecast Value Added) | Từng baseline |

## 9.2 · Ngân sách im lặng — ba con số có tên riêng, in trên màn hình

| Con số | Giá trị đăng ký | Ghi chú |
|---|---|---|
| **Tranche-mở / đồng / năm** ← in to nhất | **~9** + phần tái vũ trang (đo ở GATE 1) | Số người dùng cần biết để hiểu im lặng là bình thường |
| Thay-đổi-tỉ-trọng / đồng / năm | 17–24 (đo: BTC 21,8 · ETH 20,5 · SOL 17,1 · DOGE 18,2) | |
| **Sự kiện ĐÓNG / đồng / năm** | **~9** *(bảo toàn: mỗi tranche mở rồi cũng đóng)* — trong đó ~63% bằng stop |
| Lệnh-ô-đơn / đồng / năm (tham chiếu) | 3,5 | |
| Trần phát khung 1h · 4h | **0 tuyệt đối** — một lần phát bất kỳ ⇒ test đỏ | |
| Trần phát khung 1d | > 2× kỳ vọng tranche-mở ⇒ **cảnh báo** | Hệ nói quá nhiều cũng là chế độ hỏng |

## 9.3 · Bốn thứ bảng điều khiển BẮT BUỘC hiển thị

1. **`p_required` ngay cạnh `p_up`, ở mọi khung** — kể cả khung không giao dịch. Người dùng thấy khoảng cách, không phải đoán. **Và `p_star` cạnh mỗi khuyến nghị** — hai ngưỡng khác nhau, xem §9.0b.
1b. **Nhãn «HIỆU SUẤT GIẢ ĐỊNH»** trên mọi con số bảng điểm (§9.0).
2. **Im lặng có số**: *"0/2.400 nến qua cổng trong 7 ngày — đây là hành vi ĐÚNG. Kỳ vọng ~9 khuyến nghị/đồng/năm."*
3. **Độ tươi dữ liệu**: Live / Chậm / Mất kết nối / Dự đoán cũ.
4. **Bảng điểm lịch sử** — không phải trang phụ, không ẩn sau menu. **Chấm song song hai quy ước stop** (§9.1).
5. **Khuyến nghị THOÁT hiển thị ngang hàng khuyến nghị VÀO** — cùng vùng, cùng cỡ chữ. Với hệ khuyến nghị, tín hiệu thoát là thứ khẩn cấp nhất.
6. **Chỉ dẫn đặt lệnh stop treo** in kèm mọi khuyến nghị vào, không thu gọn, không ẩn.

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

**Độ trễ phản ứng của người dùng** *(chỉ tồn tại vì hệ là khuyến nghị — B11)*:

| Mức | Lỗ thực nhận khi chạm stop | Hệ quả |
|---|---|---|
| **Đặt lệnh stop treo** ← khuyến nghị | **1,00R theo cấu tạo** | Đặc tả kiểm chứng được |
| Kiểm hằng ngày | TB 0,86R · **p90 1,58R** · max 4,23R · 18,6% vượt 1,4R | Trung bình tốt hơn, **đuôi không kiểm soát được** |
| Kiểm thưa hơn | **Không đo được** | Ngoài khả năng quan sát của hệ |

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

## 11.0 · Hai vũ trụ, bẫy sống sót, và phụ thuộc (M10 · M11 · M17 · M25 · M31)

### 11.0.1 · Hai vũ trụ — có chủ ý, kèm nghĩa vụ ADR (M10)

| Mục đích | Số cặp | Vì sao |
|---|---|---|
| **ĐO** — chấm GATE 1 | **40** | Cần tối đa quan sát độc lập; 3 năm × 40 cặp cho sai số 0,093 trên khác biệt 0,20 |
| **KHUYẾN NGHỊ** — phát cho người dùng | **8 – 10** thanh khoản nhất | Từ 10 lên 40 cặp chỉ thêm **0,01 đơn vị** đa dạng hoá (ρ = 0,9) nhưng tải theo dõi gấp **bốn lần** |

> ⚠️ **Nghĩa vụ đăng ký: hệ được KIỂM ĐỊNH không hoàn toàn là hệ được CHẠY.** Phải ghi **ADR-014**, và thêm một phép kiểm bắt buộc: **nhóm 8–10 cặp khuyến nghị không được lệch hệ thống so với toàn bộ 40** (tỉ số sụt giảm của nhóm nhỏ nằm trong khoảng tin cậy của nhóm lớn). Lệch ⇒ hoặc mở rộng vũ trụ khuyến nghị, hoặc chấm lại chỉ trên nhóm nhỏ và chịu mất công suất.

### 11.0.2 · Bẫy sống sót — rủi ro đã đặt tên, không phải câu hỏi tải dữ liệu (M11)

Backtest trên top-40 **của hôm nay** dùng thông tin *«cặp này còn tồn tại năm 2026»* để ra quyết định năm 2023. Cặp đã chết bị loại khỏi mẫu — **chính những cặp mà xu hướng tăng sẽ mua rồi mất tiền**.

| Kịch bản của điều tra 2 giờ (bước 0b) | Hành động đã đăng ký |
|---|---|
| Kho lưu trữ **có** cặp đã huỷ niêm yết | Tải cả chúng. Vũ trụ đo = mọi cặp **tồn tại tại thời điểm đó** |
| Kho lưu trữ **không có** | **Không được im lặng bỏ qua.** Bắt buộc: ① in số cặp đã huỷ niêm yết trong giai đoạn (từ thông báo Binance) ② ước lượng chặn trên của thiên lệch bằng cách giả định **mọi** cặp đã chết đều cho kết cục xấu nhất ③ ghi con số đó **cạnh** kết quả GATE 1, không phải trong phụ lục |

### 11.0.3 · Tầng cắt ngang — hoãn, không xoá (M17)

Tầng R8 (động lượng cắt ngang — `17 §3`) **không nằm trong bản thiết kế này**, vì nó bị khoá chờ ≥12 ảnh chụp vũ trụ (sớm nhất 2027-08) hoặc kết quả điều tra 0b. Nhưng **dấu vết của nó vẫn phải giữ** ở ba chỗ, vì cron ngày 1 tồn tại chính vì nó:

| Chỗ | Nội dung |
|---|---|
| Ma trận hỏng (Phần 10) | Dòng «ảnh chụp vũ trụ» — chỉ nuôi tầng cắt ngang tương lai |
| Lộ trình bước 0 | Cron ảnh chụp hằng tháng — **không tạo lại được**, mỗi tháng hoãn là mất vĩnh viễn |
| §8.7 nhánh «1a trượt» | Nếu GATE 1 trượt và ảnh chụp đã đủ 12 tháng ⇒ R8 là **phương án dự phòng số một** (đặc tả đầy đủ ở `17 §3`) |

⇒ **Không có tầng R8 trong `predict()` hiện tại. Có một chỗ trống đã đặt tên, và một cron nuôi nó.**

### 11.0.4 · Dữ liệu funding cho toàn vũ trụ (M25)

Bước 5 (*σ̂ + f̂ cùng đợt*) **không có đầu vào**: `data/raw/funding/` chỉ có 4 symbol, tải bằng một script ngoài `src/` **tự tạo client ccxt** — vi phạm luật repo *«Chỉ `cryptopred.data.exchange` được tạo client ccxt»*.

| Việc | Nội dung |
|---|---|
| **Bước 1b (mới)** | Module `cryptopred.data.funding`, dùng `data.exchange`, tải lịch sử funding 8 giờ cho **toàn vũ trụ đo** |
| **Cặp không có hợp đồng vĩnh cửu** | `f̂ = None` · `instrument` hiển thị khoá `"spot"` · **KHÔNG** dùng `p95_expanding` — đó là chế độ *«dữ liệu hỏng»*, không phải *«không tồn tại»*. Hai ca này phải phân biệt được, kèm bất biến |

### 11.0.5 · Phụ thuộc chưa khai báo (M31)

Đã kiểm trong `.venv`: **`scipy` và `statsmodels` không có trong bất kỳ nhóm phụ thuộc nào** của `pyproject.toml`; `lightgbm`/`sklearn`/`mlflow` chưa cài.

| Gói | Nhóm | Cần cho |
|---|---|---|
| **`scipy`** | **dependencies lõi** | L3 `norm.ppf`/`cdf` — mốc M-A phải chạy được **không cần** nhóm `model` |
| `statsmodels` | `model` | HAR-RV (hoặc dùng `numpy.linalg.lstsq`, đủ cho 4 hệ số) |
| `mlflow` | `model` | RULE 10 — **thêm bước 2b vào lộ trình**: dựng tracking + `log_run(git_hash, seed, data_hash, config, metrics)`, **trước** bước 3, vì bước 3 (tiêm rò rỉ) đã là phép đo chặn cửa |
| `lightgbm` | `model` | Chỉ L6 — bước 9, có thể không bao giờ cần |


## 11.1 · Thứ tự có lý do nhân quả — kèm ước lượng công sức (m09)

| # | Việc | Ngày công | Vì sao ở vị trí này | Chặn bởi |
|---|---|---|---|---|
| **0** | Cron: khối lượng hợp đồng mở · ảnh chụp vũ trụ · **sổ lệnh** (spread/độ sâu) | **1,0** | **Thứ duy nhất mất vĩnh viễn nếu hoãn** — OI chỉ 30 ngày lịch sử | — |
| **0b** | ★ Điều tra: kho lưu trữ Binance có cặp đã huỷ niêm yết không? | **0,25** | Quyết định cách tải ở bước 1; có thể mở khoá tầng cắt ngang sớm 12 tháng | — |
| **1** | **Mẻ tải 40 cặp × 1d × ≥3 năm** + `taker_buy_volume` + cổng chất lượng | **1,5** | Điều kiện tiên quyết của GATE 1a | 0b |
| **1b** | Module `cryptopred.data.funding` — funding 8h toàn vũ trụ | **0,5** | Bước 5 không có đầu vào nếu thiếu | 1 |
| **2** | **Hàm chi phí + `p_required` + `p_star`** (L4) | **0,5** | ~40 dòng, **mọi tầng khác đọc nó**. Xây sau là phải sửa lại tất cả | — |
| **2b** | MLflow tracking + `log_run(...)` | **0,5** | RULE 10; bước 3 đã là phép đo chặn cửa | — |
| **3** | **Trọng tài §LV** + tiêm rò rỉ, gỡ 5 probe, đối chiếu `purgedcv` | **5,0** | *Một bộ dò chưa từng bắt được gì không phải bộ dò* | 1 |
| **4** | Lõi đặc trưng L1 + đo lại cụm trên altcoin | **3,0** | Đóng băng định nghĩa; phép thử rò rỉ thứ sáu | 1, 3 |
| **5** | **σ̂ (HAR-Parkinson) + f̂** — cùng đợt | **3,0** | Tầng duy nhất tự chứng minh được | 4, 1b |
| **6** | L3 phân phối + dải giá + kiểm toán độ phủ | **2,0** | ✅ **Mốc M-A** — sản phẩm thật đầu tiên | 5 |
| **7** | L5 tổ hợp + máy trạng thái tranche + sổ bất biến | **4,0** | Quy tắc, không học. Sinh sự kiện cho bước 8 | 6 |
| **8** | **Bộ 11 phép đo + chấm GATE 1** | **3,0** | ✅ **Mốc M-B** — điểm rẽ nhánh | 7 |
| **9** | *(chỉ khi qua cổng)* L6 lọc bỏ + GATE 2 hiệu chỉnh + L7 | **6,0** | ✅ Mốc M-C. **Tầng đắt nhất, có thể không bao giờ xây** | 8 |
| **10** | *(trước khi gọi là sản phẩm)* **60 ngày forward công khai** | *60 ngày lịch* | Thay vai trò GATE 3 — §0.5 | 6 hoặc 9 |
| | **Tới M-A (sản phẩm thật đầu tiên)** | **≈ 17 ngày** | | |
| | **Tới M-B (chấm cổng)** | **≈ 24 ngày** | | |
| | **Tới M-C (đầy đủ)** | **≈ 30 ngày** | | |

> **Bước 9 tốn 6 ngày và có thể không bao giờ cần** — trong khi bước 6 (17 ngày) đã cho một sản phẩm ship được. Đó là lý do thứ tự này, và là con số người duyệt cần để quyết định.

**Bước 1 — hai phương án tải, tiêu chí chọn do bước 0b quyết:**

| Phương án | Ưu | Nhược |
|---|---|---|
| **REST `/api/v3/klines` trực tiếp** (httpx) | Đủ 12 trường kể cả `taker_buy_volume`; đơn giản | Chậm hơn ~50 lần; **không** lấy được cặp đã huỷ niêm yết |
| **Kho `data.binance.vision`** (dump tháng) | Nhanh; **có thể có** cặp đã huỷ niêm yết ⇒ giải luôn bẫy sống sót | Phải xác minh phạm vi (chính là bước 0b) |

> ⚠️ Cả hai đều là **client HTTP thô**, không phải `ccxt`. Luật repo hiện chỉ nói *«chỉ `cryptopred.data.exchange` được tạo client ccxt»* — **cần thêm một dòng vào `CLAUDE.md`**: `cryptopred.data.klines_raw` được phép dùng `httpx`, và **chỉ module đó**.


## 11.2 · Mốc ship

| Mốc | Sau bước | Sản phẩm thật |
|---|---|---|
| **M-A** | 6 | **Đài quan trắc**: dải giá + biến động + `p_required` + độ phủ đo được. Ship được ngay cả khi GATE 1 sau đó trượt |
| **M-B** | 8 | GATE 1 chấm xong. Đạt ⇒ đi tiếp; trượt ⇒ ship M-A, và **đó là kết quả hợp lệ** |
| **M-C** | 9 | Khuyến nghị đầy đủ có lớp lọc |

## 11.3 · Diff cấu hình cần làm

| Tệp | Thay đổi |
|---|---|
| `config/model.yaml` | **Xoá** `decision.p_up_threshold` / `p_down_threshold` (thay bằng `TRADE_TF` + `p_required` trong mã) · **xoá** khối `quantile` · `classifier` → `meta_label` (depth 3 · ≤15 lá · ≤300 cây) · `drop_flat_from_train: false` · `tuning.n_trials: 20` · **`tuning.objective` → `mean_oos_drawdown_ratio`** *(hiện là `mean_oos_sharpe_after_costs` — tối ưu vào đúng đại lượng mà §8.2 vừa loại khỏi cổng)* · **xoá khối `label.dead_zone`** *(nhãn ba lớp đã bị ADR-005 loại)* · `baselines` += `tsmom_grid_median`, `dca_hold`, `naive_rw` · `costs.funding_rate_8h_pct` giữ làm tham chiếu hiển thị, **cấm** dùng trong cổng |
| `config/features.yaml` | **Theo bảng Phụ lục B.3** — làm ở bước 4, **cùng lúc** viết `build_features` |
| `config/symbols.yaml` | Mở rộng exclude: neo pháp định (EUR…) · vàng/hàng hoá (XAUT, PAXG) · RLUSD · cổ phiếu token hoá |
| **`CLAUDE.md`** | Thêm dòng cho `data.klines_raw` dùng `httpx` (m09) · bảng trạng thái + dòng «prototype dashboard v6 là hợp đồng UI» — **đầu ra thứ 4 (khuyến nghị vào/ra) là SỬA HỢP ĐỒNG UI**, phải khai báo, không để lệch âm thầm |
| **`docs/00_MASTER_PLAN.md §5`** | Hợp đồng ba đầu ra → **bốn** (thêm khuyến nghị vào/ra). Cần **ADR-015** |
| `serving/schemas.py` | Theo Phần 2 — kèm khôi phục `last_close` · `valid_until` · `in_training_universe` mà rc1 làm rơi |
| `config/model.yaml` *(bổ sung)* | `validation.min_train_bars`: **theo khung** (1d ≈ 500, 1h 5000) — hiện 5000 khiến purged WF không sinh nổi fold nào ở khung ngày · `validation.purge_bars`/`embargo_bars`: **60** cho khung 1d *(nhãn L6 là kết cục rào chắn kéo dài tới 60 ngày, không phải `horizon_bars`=1)* · `tuning.objective` → `mean_oos_drawdown_ratio` · xoá `label.dead_zone` |

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
| R² hướng | 0,00–0,01 | `09 §3.1` |
| R² biến động — **thang ngày, dữ liệu của repo** | **0,202 (1 ngày) · 0,248 (5 ngày)** | `rv_estimators.py` |
| *R² biến động — thang 5 phút, 700k quan sát (KHÔNG áp dụng được)* | *0,40–0,60* | *`09 §3.1` — bối cảnh khác* |
| R² funding | 0,44–0,51 | `13 §4.2` |
| QLIKE HAR-Parkinson vs EWMA(0,94), chân trời 5 ngày | **+15,8%** | `rv_estimators.py` |
| σ̂ ngày BTC 2021–26 / 2023–26 | 3,00% / 2,43% | `12 §2.8`, đo lại |
| E\|move\| / σ̂ | 0,685 | đo trên BTC ngày |
| p\* hình dạng 1,2σ̂/4,0σ̂ (payoff 3,33R) | **25,0% / 25,5%** | ADR-013 · `barrier_surface.py` |
| Hoà vốn trượt giá | **1,57R** | ADR-013 |
| Tương quan hạng tham số hai đoạn | +0,19 | `12 §2.6` |
| Tỉ số sụt giảm tổ hợp — **thang `w`** | 0,29 / 0,29 / 0,31 · rời rạc hoá: **0,322** | `12 §6.5` · `ens.py` |
| *Tỉ số sụt giảm ở 4% NAV (KHÔNG dùng cho cổng)* | *0,0143 — đạt dư 42 lần* | *§8.2* |
| Tỉ số sụt giảm tái lập | 54/54 quan sát | `12 §2.7` |
| **Tỉ lệ chốt lời — quy ước vận hành + Parkinson** | **30,0%** (90 lệnh, 4 cặp) | `rv_estimators.py` |
| *Tỉ lệ chốt lời — cả hai intrabar + close-to-close* | *33,7%* | `15 §1.5` đã sửa — ADR-013 |
| **EV mỗi lệnh (kể cả phần chạy)** | **+0,559R** · R TB thắng 4,48R | `rv_estimators.py` |
| Tỉ lệ nền khớp cửa sổ | 23,7% | `12 §2.9` |
| **Null bước ngẫu nhiên** | **23,42%** (mô phỏng, seed 20260827, 200k đường) | `null_barrier.py` |
| *Null — giá trị giải tích `1,2/5,2` (SAI, ba tầng sai lệch)* | *23,08%* | *§L4 — bỏ* |
| **Tỉ lệ nền thực nghiệm** (n = 9.046) | **23,67%** | `null_barrier.py` |
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
| Khung 4h, **chân trời 4 GIỜ**: p_required | 69,0% spot / 62,7% perp | `ADR-002 §2.3` |
| Khung 4h, **chân trời `H_DAYS["4h"] = 1,0 ngày`** *(giá trị hệ thực sự in)* | **57,3%** | công thức §L4 |
| Khung 4h: R² biến động / hướng | 0,278 / 52,27% vs 51,04% | ↑ §2.4 |

Mã tái tạo: `scripts/measurements_2026_08_26/` (13 script, có README).

---

# PHỤ LỤC B · BỘ ĐẶC TRƯNG

## B.1 · 13 suất dựng được ngay — CÔNG THỨC ĐẦY ĐỦ

Mọi đặc trưng đi qua đúng một hàm `shift_all(1)` và qua `assert_scale_free()`.
Ký hiệu: `c/h/l/o/v` = close/high/low/open/volume nến **ngày** · `lr = log(c).diff()` ·
`z(x,n) = (x − mean(x,n)) / std(x,n)` · `σ̂` = `sigma_hat_daily` (Parkinson, §L1).

| # | Đặc trưng | Công thức | Cửa sổ | Cụm |
|---|---|---|---|---|
| 1 | `sigma_ratio_90d` | `σ̂ / median(σ̂, 90)` | 90 | 5 |
| 2 | `rv_24` | `sqrt(mean(parkinson_var, 24))` | 24 | 2 |
| 3 | `rv_ratio_5d_20d` | `sqrt(mean(pv,5)) / sqrt(mean(pv,20))` | 5 · 20 | 7 |
| 4 | `volume_z96` | `z(v, 96)` | 96 | 3 |
| 5 | `log_ret_12` | `log(c).diff(12)` | 12 | 1 |
| 6 | `ema50_ema200` | `EMA(c,50) / EMA(c,200)` — `adjust=False` | 50 · 200 | 8 |
| 7 | `log_ret_1` | `log(c).diff(1)` | 1 | 4 |
| 8 | `close_position_in_range` | `(c − l) / (h − l)`, `h==l ⇒ 0,5` | 1 | 4 |
| 9 | `upper_wick_pct` | `(h − max(c,o)) / c` | 1 | 9 |
| 10 | `dist_to_prior_swing_sigma` | `(c − rolling_max(h,20).shift(1)) / (σ̂ · c)` | 20 | 1 |
| 11 | `funding_level_pct` | `f_8h · 3 · 100` — **%/ngày** | 1 | 6 |
| 12 | `funding_z96` | `z(f_8h, 96)` — 96 **kỳ** ≈ 32 ngày | 96 | 13 |
| 13 | `dow_sin` · `dow_cos` | `sin/cos(2π · dayofweek / 7)` | — | 10 · 11 |

## B.2 · 5 suất chờ dữ liệu — công thức viết sẵn

| # | Đặc trưng | Công thức | Nguồn cần | Ưu tiên |
|---|---|---|---|---|
| 14 | `taker_buy_ratio_z` | `z(taker_buy_vol / v, 96)` | cột 9 klines *(ccxt không trả)* | ★★★ |
| 15 | `oi_price_div` | `sign(c.diff(24)) · sign(oi.diff(24))` | cron OI — **30 ngày, mất vĩnh viễn** | ★★★ |
| 16 | `excess_return_vs_btc` | `log_ret_H − log_ret_H(BTC)`, timestamp căn khớp | 40 cặp cùng khung | ★★★ |
| 17 | `cvd_slope_24` | `slope(cumsum(2·taker_buy − v), 24) / mean(v,24)` | `aggTrades` | ★★ |
| 18 | `basis` | `(mark − spot) / spot · 100` | mark price | ★ |

> ⚠️ Bốn đặc trưng dùng dữ liệu chưa có (**14 · 15 · 17 · 18**) **chưa qua đo trùng lặp**. Theo `14 §5` quy tắc 1: phải khai báo cụm trước khi chiếm suất; nếu `\|r\| ≥ 0,70` với một suất đã có thì **thay thế**, không **thêm vào**.

## B.3 · Diff `config/features.yaml` (B8)

| Khoá | Hiện tại | Phải thành | Vì sao |
|---|---|---|---|
| `momentum.enabled` | `true` | **`false`** | Cả nhóm rơi vào cụm 1: RSI r=0,854 · MACD 0,735 · Stoch 0,765 · ROC 0,997 với log return thuần |
| `trend.ratios` | ba tỉ số | **chỉ `ema50_ema200`** | `close/ema20` r=0,904 và `ema20/ema50` r=0,906 với log return |
| `volatility` | 4 ước lượng | **`parkinson` duy nhất** + thêm `rv_ratio_5d_20d` | B4 — và `rv_24`/`atr`/`parkinson` trùng cụm 2 |
| `returns.log_return_periods` | 7 chu kỳ | **`[1, 12]`** | Năm chu kỳ còn lại trùng cụm 1 |
| `volume.obv_slope_window` | có | **bỏ** | Rơi vào cụm 1 — OBV là return có trọng số khối lượng |
| `time.features` | có `hour_sin/cos` | **bỏ ở khung ngày**, giữ cho panel hiển thị | Vô nghĩa khi chân trời là ngày |
| `candle.features` | 4 | **`close_position_in_range` · `upper_wick_pct`** | `hl_range_pct`/`body_pct` trùng cụm 3 |
| — | *(không có)* | **thêm nhóm `derivatives`** | funding · OI · taker · basis |

**Sửa `features.yaml` ở bước 4 của lộ trình — cùng lúc viết `build_features`, không sớm hơn.** Sửa cấu hình trước khi có mã đọc nó là tạo ra một tài liệu thứ hai để lệch pha.

## B.4 · Đã bị đo và BÁC — không được quay lại

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
