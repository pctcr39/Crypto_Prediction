# KẾ HOẠCH THI CÔNG & TRIỂN KHAI — CryptoPred v1

> Phiên bản 1.0 · 27/08/2026 · **Trạng thái: đề xuất, chờ duyệt**
> Nguồn ràng buộc: `PREDICTION_DESIGN.md` 1.0-rc1 · `generated/spec_numbers.md` (sinh tự động) · ADR-013/016/017
> Quy trình: 4 agent audit (khoảng cách mã · vận hành · trình tự) → tổng hợp → **1 vòng phản biện đối kháng (15 phát hiện, 5 P0)**.
> Ba khẳng định chặn cửa đã được **tự đo lại** trong tài liệu này, không relay.
> Đối tượng: một người, Python cơ bản, ~10 giờ/tuần.

---

# 0 · TRẠNG THÁI THẬT HÔM NAY

Kiểm trên đĩa 27/08/2026, không lấy từ tài liệu:

| Hạng mục | Thực tế | |
|---|---|---|
| **Bộ thu perishable** | `data/derivatives.py` **240 dòng** — OI + funding + sổ lệnh | ✅ **XONG** |
| **Trọng tài (M6)** | `validation/purged.py` **171 dòng** (từ 63), `tests/test_leakage.py` +258 dòng | ✅ **XONG** |
| **Probe rò rỉ** | **0 test còn skip** · `pytest tests/` = **37 xanh** | ✅ **XONG** |
| Đặc tả thi công | `PREDICTION_DESIGN.md` 1.709 dòng, sau vòng phản biện 58 phát hiện | ✅ |
| Số liệu đặc tả | `spec_numbers.md` sinh tự động bởi `measure_spec.py` | ✅ |
| Nháp L1/L2/L5 | `measure_spec.py` đã cài ~40% (Parkinson, HAR, lưới 27 ô, máy tranche) | 🔶 nháp |
| L0/L3/L4/L7/L8 | chưa có dòng nào | ⬜ |
| L6 lọc bỏ | chưa có — **và nên hoãn**, xem §1.3 | ⬜ |
| `serving/schemas.py` | 68 dòng, **hợp đồng SAI** (còn `direction`/`p_up_calibrated`/3 model quantile) | ❌ phải viết lại |
| `features/builder.py` | `NotImplementedError` | ⬜ |
| `scipy` | **không có trong `.venv` lẫn `pyproject.toml`** — L3 cần `norm.ppf` | ❌ chặn M-A |
| `hexital` | không có trong `pyproject.toml` dù `00 §3` chốt làm nguồn chân lý chỉ báo | ❌ |
| `apscheduler` | vẫn còn trong nhóm `ops` dù `00` đã chốt bỏ (dùng asyncio + systemd) | ❌ |

> **Hai việc khó nhất và mất-vĩnh-viễn-nếu-hoãn đều đã xong.** Kế hoạch này bắt đầu từ một điểm tốt hơn mọi tài liệu trước mô tả.

---

# 1 · KẾT LUẬN MỘT TRANG

## 1.1 · Giờ công

| Giai đoạn | Nội dung | Giờ | Cộng dồn | Tuần |
|---|---|---|---|---|
| **GĐ 0** | Sửa ba lỗi chặn cửa + trả nợ phụ thuộc + cấu hình | **34** | 34 | 3,4 |
| **GĐ A** | Dữ liệu → σ̂ → phân phối → cổng phí → `predict()` chạy hằng ngày | **64** | 98 | 9,8 |
| **GĐ F1** | Giám sát + sao lưu (ngay khi có thứ chạy 24/7) | **20** | 118 | 11,8 |
| **GĐ A′** | Kiểm toán độ phủ · API · dashboard pha 1 → **Đài quan trắc có mặt** | **23** | 141 | 14,1 |
| **GĐ B** | Baseline + đối chiếu trọng tài + cổng L2 §8.4 | **48** | 189 | 18,9 |
| **GĐ F2** | Quy trình deploy + runbook + diễn tập khôi phục | **24** | 213 | 21,3 |
| **GĐ D** | Khuyến nghị thuần quy tắc — lưới, sổ, máy tranche, bảng điểm, dashboard pha 2 | **112** | 325 | 32,5 |
| **GĐ E** | Bộ phép đo + GATE 1 + FDR/DSR + gom bất biến | **42** | **367** | 36,7 |

**TỔNG ≈ 367 giờ ≈ 37 tuần ≈ 9 tháng** ở nhịp 10h/tuần. Sai số ±25%.

> Đã cộng khoản **rebudget +42h** mà phản biện đòi ở ba việc chủ dự án chưa từng viết:
> `PurgedWalkForward` 12→20h · năm probe tự chứng minh 20→40h · máy trạng thái tranche 22→36h.
> Đã trừ ~30h vì bộ thu và trọng tài **đã xong**.

## 1.2 · Mốc — mỗi mốc là một thứ CHẠY ĐƯỢC

| Mốc | Tuần | Chạy được cái gì |
|---|---|---|
| **M-0** | 3 | Ba lỗi chặn cửa đã sửa · `make test` xanh · `spec_numbers` sinh lại có cổng phí |
| **M-A0** | 10 | `predict()` chạy tự động 00:05 UTC, ghi JSON thật cho 40 cặp. Chưa có mặt tiền |
| **M-A1** | 14 | **Đài quan trắc có mặt** — dashboard v14 nối API thật: dải giá, biến động, độ tươi thật |
| **M-A** | 19 | σ̂ qua cổng L2 §8.4 — không còn chạy trên hằng số quy ước |
| **M-B0** | 33 | Đường quyết định **đóng băng** · sổ bất biến ghi dòng đầu · **60 ngày forward bắt đầu đếm** |
| **M-B** | 37 | GATE 1 kép chấm xong → rẽ theo một trong bốn nhánh `§8.7` |
| **Sản phẩm** | ~42 | 60 ngày forward chấm xong |

## 1.3 · Cắt khỏi v1 — và vì sao

| Cắt | Tiết kiệm | Lý do |
|---|---|---|
| **L6 lọc bỏ + GATE 2** | ~40h | Điều kiện bật là **≥300 sự kiện đã chấm**. Ở 38–48 sự kiện/đồng/năm, 300 sự kiện *forward* là 8–10 tháng. Xây L6 trên 1.114 sự kiện backtest rồi gọi là «đã hiệu chỉnh» chính là kiểu tự lừa mình mà cả đặc tả dựng lên để chống. Để `meta.predict ≡ 1,0` |
| **Tầng streaming WebSocket 6 tầng** | ~23h | `TRADE_TF = {"1d"}` ⇒ khoảnh khắc quyết định là **00:00 UTC, một lần/ngày**. 40 request REST/giờ tiêu <1% ngân sách weight *của một phút*. WS cho khuyến nghị **y hệt**. Là nâng cấp, không phải nền móng |
| **Mẻ tải 40 cặp × 3 khung** → chỉ **× 1d** | ~6h | Không tầng nào đọc nến 1h/4h: σ̂ thang ngày, rào chắn thang ngày, lưới 27 ô chạy trên nến ngày. Panel 1h/4h là hiển thị — dashboard tự gọi Binance |
| **Toàn bộ đường khoá giao dịch** | ~8h nợ | `§0.1` đã chốt phạm vi khuyến nghị. Cách rẻ nhất để hệ không bao giờ đặt lệnh là **không có mã nào đọc được khoá** |

Tổng cắt ≈ **77 giờ + một lớp chế độ hỏng**. Chỗ trống có tên vẫn giữ trong `predict()` và trong bất biến #3.

---

# 2 · ★ BA LỖI CHẶN CỬA — SỬA TRƯỚC MỌI THỨ

Cả ba do vòng phản biện tìm ra và **đã được tự đo lại trong phiên này**.

## 2.1 · Cổng G-A không thể đạt theo cấu tạo — ĐÃ ĐO

Đài quan trắc là sản phẩm ship ở tuần 14, và cổng G-A của nó đòi: độ phủ `[q10,q90]` = 80% ± 3pp, PIT KS p > 0,01.

**Đo trên chính 4 cặp hiệu chuẩn** (`har_sigma_daily` và `ewma_sigma_daily` của `measure_spec.py`, log-return ngày kế):

| Cặp | n | Độ phủ HAR | Độ phủ EWMA | PIT KS p | Kurtosis |
|---|---|---|---|---|---|
| BTCUSDT | 1.784 | **84,5%** | 85,7% | 1,8e-07 | 4,3 |
| ETHUSDT | 2.273 | 82,0% | 84,7% | 1,8e-07 | 6,3 |
| SOLUSDT | 1.928 | **84,7%** | 85,1% | 3,4e-05 | 4,2 |
| DOGEUSDT | 2.273 | **84,6%** | 88,1% | 2,0e-10 | **162,2** |

**3/4 trượt độ phủ · 4/4 trượt PIT**, với cả HAR lẫn EWMA.

**Nguyên nhân, đọc thẳng từ số:**
1. **Dải quá RỘNG** — phủ 84–85% ở dải danh nghĩa 80%. σ̂ Parkinson rộng hơn độ lệch close-to-close (Parkinson dùng biên độ trong ngày).
2. **Đuôi quá DÀY cho phân phối Normal** — kurtosis 4,2–6,3 ở ba cặp lớn và **162,2** ở DOGE. Normal có kurtosis 3. PIT không thể qua được.

**Sửa (H0.5, 8h, làm TRƯỚC khi hứa mốc M-A1):**
- ① Đo và **đóng băng** hằng số thang Parkinson→close-to-close, pin bằng test như `ABS_MOVE_RATIO`.
- ② Đổi `F` từ `Normal(0, σ̂√H)` sang **Student-t** với ν đóng băng theo cặp (ν≈7 cho BTC/SOL, ν≈5 cho ETH; DOGE cần ν≈3 hoặc bị loại khỏi vũ trụ hiệu chuẩn).
- ③ Ghi **ADR-018** — đây là sửa kiến trúc tầng L3, không phải tinh chỉnh tham số.

> ⚠️ Không được «nhân thang cho vừa cổng» rồi đi tiếp. Nhân thang sửa được độ phủ nhưng **không sửa được PIT** — đuôi vẫn dày. Hai lỗi độc lập, phải sửa cả hai.

## 2.2 · `spec_numbers` sinh từ mô phỏng KHÔNG có cổng phí

`measure_spec.py::run_tranches` mở tranche chỉ dựa trên `w >= level` và slot trống — **không có** `p_required`, `p_star`, `cost_gate`, hay kiểm tra độ tươi. Nhưng **mọi ngưỡng đăng-ký-trước** (hoà vốn 18,1%, biên +11,1 điểm, ngân sách im lặng 38–48 sự kiện/năm) đều lấy từ file đó.

**Sửa (H0.6, 3h):** đưa cổng L4 vào `run_tranches`, sinh lại `spec_numbers.md`, **suy lại toàn bộ ngưỡng** từ bản có cổng. Thêm một dòng trong file ghi rõ mô phỏng đã bật cổng nào.

## 2.3 · Bộ lọc tuổi niêm yết đang chết âm thầm

Ảnh chụp `data/raw/universe/month=2026-08`: **474 dòng**, `listed_at` = NaT cho **cả 474**, `listed_days` = None, nhưng `pass_age` = **True cho cả 474**. Nhánh else ở `data/universe.py` mặc định cho ĐẠT khi thiếu ngày niêm yết.

Cron hằng tháng sắp đóng băng lỗi này thành bằng chứng lịch sử không sửa được.

**Sửa (H0.7, 2h):** ① đổi nhánh else thành `raise` — thiếu ngày niêm yết là **chế độ hỏng**, không phải mặc định đạt; ② lấy ngày niêm yết từ **nến ngày đầu tiên** của mỗi cặp (luôn có, không cần API riêng); ③ test khẳng định `pass_age` False khi `listed_at` là NaT.

---

# 3 · WBS THEO GIAI ĐOẠN

> Quy ước: **mọi DoD là một lệnh chạy được từ gốc repo.** Chưa chạy được thì hạng mục chưa xong.

## GĐ 0 · Chặn cửa và trả nợ — 34h (tuần 1–3)

| # | Việc | File | h | DoD |
|---|---|---|---|---|
| H0.1 | Thêm `scipy` vào deps **lõi** (L3 cần), `hexital` vào lõi, **xoá `apscheduler`** | `pyproject.toml` | 2 | `uv sync && .venv/bin/python -c "import scipy, hexital"` |
| H0.2 | Số học fold thành **mã**: `min_bars_required(n_folds, test_len, purge, embargo, min_train)` | `validation/purged.py` · `tests/test_config_contract.py` | 4 | `pytest tests/test_config_contract.py` — assert cấu hình hiện tại **đủ** nến cho 8 fold |
| H0.3 | Sửa `config/model.yaml`: `purge_bars = embargo_bars = 60` (nhãn dài 60 nến!) · `min_train_bars` theo khung · xoá `decision.*`, `quantile`, `label.dead_zone` · `drop_flat_from_train: false` | `config/model.yaml` | 3 | test hợp đồng cấu hình xanh |
| **H0.5** | ★ **Sửa cổng G-A** — thang Parkinson + Student-t + ADR-018 | `measure_spec.py` · `serving/` · `docs/adr/018-*.md` | **8** | phủ 77–83% **và** PIT p > 0,01 trên ≥3/4 cặp |
| **H0.6** | ★ **Cổng phí vào `run_tranches`** + sinh lại số | `scripts/spec/measure_spec.py` | **3** | `spec_numbers.md` có dòng «mô phỏng bật cổng: L4 ✓» |
| **H0.7** | ★ **Bộ lọc tuổi niêm yết** | `data/universe.py` | **2** | test đỏ khi `listed_at` NaT |
| H0.8 | `tracking.py` — `log_run(git_hash, seed, data_hash, config, metrics)` (RULE 10) | `src/cryptopred/tracking.py` | 5 | `python -m cryptopred.tracking --selftest` tạo run có đủ 5 trường |
| H0.9 | **Tính công suất tường minh** trước khi tiêu 105h cho GATE 1b | `scripts/spec/power.py` | 4 | in ra: với n_hiệu_dụng ≈ 1,95, khác biệt Sharpe nhỏ nhất phát hiện được ở 8 fold |
| H0.10 | Mẻ tải **40 cặp × 1d × 5 năm** (chạy nền, song song với code) | — | 3 | `make check-data` — 40 cặp × ≥1.100 nến |

> **H0.9 đáng giá nhất bảng.** Phản biện chỉ ra GATE 1b có thể đã được định đoạt trước khi chạy: với κ = 0,501, 40 cặp cho ~1,95 cặp độc lập; đặc tả tự tính «tỉ lệ thắng: 34 năm — không bao giờ». Bốn giờ ở tuần 2 có thể tiết kiệm 105h ở tuần 34.

## GĐ A · Đường suy luận — 64h (tuần 4–10) → **M-A0**

L0 tiếp nhận & độ tươi (10h) · L1 lõi đặc trưng một-đường-mã (14h) · L3 phân phối F (6h, sau H0.5) · L4 cổng phí (7h — **làm sớm, mọi tầng khác đọc nó**) · `predict()` hàm thuần (12h) · `schemas.py` **viết lại** (6h) · systemd oneshot 00:05 UTC (9h).

**DoD giai đoạn:** `systemctl --user start cryptopred-predict` → `state/predictions/2026-xx-xx.json` có 40 cặp, mỗi cặp đủ `sigma_hat`, `q10/q50/q90`, `p_required`, `freshness`.

## GĐ F1 · Giám sát — 20h (tuần 11–12)

Healthchecks.io ping sau mỗi lần chạy · `restic` sao lưu `state/` + `data/raw/{oi,funding,universe}` lên R2 · journald persistent · `make collect-status`.

**DoD:** rút mạng VPS 10 phút → nhận email cảnh báo; `restic restore` về máy khác cho ra sổ giống hệt.

## GĐ A′ · Đài quan trắc có mặt — 23h (tuần 13–14) → **M-A1**

Kiểm toán độ phủ cuộn 500 (5h) · FastAPI `/api/predictions` (8h) · dashboard v14 pha 1: thay lớp climatology bằng API thật (10h).

**DoD:** mở dashboard trên điện thoại → thấy dải giá và biến động **từ API của mình**, chip độ tươi phản ánh lần chạy thật, nhãn «minh hoạ» đã gỡ khỏi hai đầu ra này.

## GĐ B · Trọng tài đầy đủ — 48h (tuần 15–19) → **M-A**

7 baseline + FVA + Diebold–Mariano (16h) · đối chiếu ranh giới fold với `purgedcv` (8h) · cổng L2 §8.4 cho σ̂ (12h) · HAR-RV thật thay EWMA (12h).

> Đến đây EWMA λ=0,94 (hằng số RiskMetrics 1996, «quy ước, không tinh chỉnh») mới được thay bằng HAR-RV — **cầu thủ thật duy nhất chỉ vào sân sau khi trọng tài đã đứng đó**.

## GĐ F2 · Quy trình deploy — 24h (tuần 20–21)

Quy trình phát hành hai bước (staging → prod) · shadow-diff (10h) · runbook · **diễn tập khôi phục thật**.

## GĐ D · Khuyến nghị — 112h (tuần 22–33) → **M-B0**

Lưới 27 ô đóng băng bằng hash (8h) · **máy trạng thái tranche 36h** · sổ khuyến nghị + chuỗi hash (16h) · bảng điểm + chấm điểm vô điều kiện (14h) · L7 cỡ gợi ý + cảnh báo (12h) · dashboard pha 2 + **ADR-015** hợp đồng UI (26h).

## GĐ E · Cổng — 42h (tuần 34–37) → **M-B**

Bộ phép đo (tách E1a **trước** đóng băng cho 4 phép đo có đường về đường quyết định) · GATE 1 kép · FDR + DSR · gom bất biến.

---

# 4 · TẦNG KIỂM THỬ

> Agent kiểm thử của phiên chết vì lỗi schema — phần này tôi tự viết, dựa trên `PHẦN 6` của đặc tả và `tests/` hiện có.

| Tầng | Chạy khi nào | Lệnh | Chặn phát hành? |
|---|---|---|---|
| **Nhanh** — hợp đồng cấu hình, số học fold, đơn điệu dải, kiểu `PReq`≠`PStar` | mỗi commit | `make test` | ✅ |
| **Rò rỉ** — 5 probe tự chứng minh | mỗi commit | `make test-leakage` | ✅ |
| **Bất biến** — property test máy tranche, batch≡live 1e-6, pin hash lưới, `simulate_null` | mỗi commit | `pytest -m invariant` | ✅ |
| **Mạng** — downloader, derivatives | trước mỗi phát hành | `make test-network` | ✅ |
| **Chậm** — độ phủ cuộn, PIT, đối chiếu `purgedcv` | hằng đêm trên VPS | `make test-nightly` | ⚠️ cảnh báo |

**Ba nguyên tắc không thương lượng:**
1. **Probe phải tự chứng minh trước khi được tin.** Tiêm rò rỉ nhân tạo (feature không shift · scaler fit toàn mẫu · nhãn lệch một nến) ⇒ xác nhận probe bắt được ⇒ *rồi mới* gỡ. Việc này đã làm xong cho M6 — giữ nguyên khuôn cho mọi probe mới.
2. **Không xoá test để xanh.** Đúng câu đã ghi sẵn trong `tests/test_leakage.py`.
3. **Test hợp đồng cấu hình phải có con số đọc nó.** Một test khẳng định `purge_bars == 60` mà không mã nào đọc `purge_bars` là test tự-khẳng-định — vô giá trị cho tới GĐ B.

---

# 5 · KIẾN TRÚC TRIỂN KHAI

## 5.1 · Quyết định nền

| Câu hỏi | Chốt | Lý do |
|---|---|---|
| Chạy ở đâu | **VPS từ tuần 1** (~5 USD/tháng) | Máy cá nhân: FileVault + tự khởi động lại sau cập nhật macOS ⇒ đứng ở màn hình đăng nhập với 0 tiến trình. launchd không có tương đương `WatchdogSec`. Và đó là máy đang sửa code |
| Daemon hay oneshot | **systemd oneshot + timer** | `predict()` là hàm thuần (bất biến #17), sổ nằm trên đĩa, `§5.4` coi khởi động lại là đường **bình thường** ⇒ trạng thái tranche **không bao giờ ở RAM** ⇒ «cập nhật code không mất tranche» đúng theo **cấu tạo**, không theo quy trình |
| Thu dữ liệu | `cryptopred-collect.timer` `OnCalendar=hourly` `Persistent=true` | Không phải daemon `Type=notify` + `WatchdogSec` — đó là di sản của kiến trúc WebSocket đã cắt |
| Đưa lên internet? | **Không public.** Cloudflare Tunnel + Access, chỉ mình truy cập | Hệ phát khuyến nghị tài chính. Public = trách nhiệm pháp lý và áp lực «làm cho đẹp» lên số liệu |

## 5.2 · Sơ đồ tiến trình

```
VPS (1 vCPU / 1 GB / 25 GB)
├─ cryptopred-collect.timer   OnCalendar=hourly     → OI · funding · sổ lệnh (perishable)
├─ cryptopred-predict.timer   OnCalendar=*-*-* 00:05 UTC → predict() → state/predictions/
├─ cryptopred-score.timer     OnCalendar=daily      → chấm điểm vô điều kiện → state/scorecard/
├─ cryptopred-backup.timer    OnCalendar=daily      → restic → Cloudflare R2
├─ cryptopred-api.service     uvicorn (Type=simple, Restart=always) → :8000
└─ cloudflared.service        tunnel → dashboard + API, sau Cloudflare Access
```

**Chi phí:** VPS ~5 USD + R2 ~0 (dưới free tier) + Healthchecks free + Cloudflare free ≈ **5 USD/tháng**.

## 5.3 · Runbook

```bash
# cài lần đầu
git clone … && cd Crypto_Prediction && make setup
cp .env.example .env                     # KHÔNG có khoá sàn — hệ chỉ đọc dữ liệu công khai
systemctl --user enable --now cryptopred-{collect,predict,score,backup}.timer

# xem hệ còn sống không (không cần mở dashboard)
make collect-status                      # in: đã bắt N giờ OI, M lỗ, lần chạy cuối
journalctl --user -u cryptopred-predict -n 50

# cập nhật code (an toàn vì trạng thái nằm trên đĩa, không ở RAM)
git pull && make test && systemctl --user restart cryptopred-api

# khôi phục sau sự cố
restic restore latest --target /            # sổ + dữ liệu perishable
systemctl --user start cryptopred-predict   # bắt kịp qua mọi nến bỏ lỡ (bất biến #27)
```

---

# 6 · CHẾ ĐỘ HỎNG VÀ THANG XUỐNG CẤP

| Hỏng | Phát hiện | Hệ tự làm | Người phải làm |
|---|---|---|---|
| Mạng rớt lúc 3h sáng | `predict` không ping Healthchecks | timer chạy lại giờ kế, `Persistent=true` bắt kịp | không gì — trừ khi 3 lần liên tiếp |
| Binance chặn IP | REST 451/403 | `freshness = MẤT KẾT NỐI` ⇒ **CHẶN predict**, dashboard nói thật | đổi vùng VPS |
| σ̂ trôi khỏi cổng L2 | test đêm | xuống `VOL_ONLY`, ngừng phát khuyến nghị mới | điều tra RV |
| Độ phủ ra ngoài 77–83% | kiểm toán cuộn 500 | cảnh báo, **không tự sửa thang** | tái hiệu chuẩn + ADR |
| Tranche quá hạn chưa đóng | bất biến #13 | đóng `status="expired"` + ghi cảnh báo | — |
| Đĩa đầy | cảnh báo 80% | ngừng ghi parquet mới, giữ sổ | dọn `data/clean` (tái tạo được) |
| **Im lặng kéo dài** | quay vòng `w`/năm ra ngoài 6,2–7,9 | in ngân sách im lặng lên dashboard | ⛔ **không hạ ngưỡng.** Đọc §9.2 |

---

# 7 · RỦI RO BỎ DỞ

| Rủi ro | Chống bằng |
|---|---|
| **9 tháng không thấy sản phẩm** | Đài quan trắc có mặt ở **tuần 14**, không phải tuần 37. Mỗi giai đoạn kết thúc bằng một thứ chạy được |
| **Ba việc chưa từng viết ăn gấp 2–3× thời gian** | Đã rebudget +42h. Nếu vẫn trượt: cắt dashboard pha 2, giữ API |
| **GATE 1b có thể đã được định đoạt** | H0.9 ở tuần 2 trả lời trước khi tiêu 105h |
| **Sửa xong rồi phải sửa lại** | E1a (4 phép đo có đường về đường quyết định) chạy **trước** đóng băng tuần 33 |
| **Cổng G-A không đạt** | Đã đo, đã có H0.5. Nếu Student-t vẫn không cứu DOGE: loại DOGE khỏi vũ trụ hiệu chuẩn và ghi ADR |
| **Nhánh «1a trượt» là kịch bản dẫn** | Đài quan trắc (GĐ 0–A′, ~141h) là **mục tiêu thật**; 226h còn lại là tuỳ chọn có điều kiện. Đừng lập kế hoạch như thể M-B là đích |

---

# 8 · BA VIỆC LÀM NGAY TUẦN NÀY

1. **H0.1** (2h) — thêm `scipy` + `hexital`, xoá `apscheduler`. Không có scipy thì mốc M-A không chạy được dù mọi thứ khác xong.
2. **H0.7** (2h) — sửa bộ lọc tuổi niêm yết trước khi cron hằng tháng đóng băng lỗi thành lịch sử.
3. **H0.10** (3h, chạy nền) — mẻ tải 40 cặp × 1d × 5 năm. Chạy trong lúc làm việc khác.

---

*Nguồn: 4 agent audit + 1 tổng hợp + 1 phản biện đối kháng (15 phát hiện, 5 P0) · Ba khẳng định chặn cửa tự đo lại trong phiên · Trạng thái mã kiểm trên đĩa 27/08/2026 · `pytest tests/` = 37 xanh, 0 skip.*
