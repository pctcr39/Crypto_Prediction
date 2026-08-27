# Mã đo cho `docs/12_DEEP_FOUR_METHODS.md`

Sinh ra toàn bộ con số ở Phần 2 và Phần 3 của tài liệu 12. Chạy từ **gốc repo**:

```bash
.venv/bin/python scripts/measurements_2026_08_26/trend.py        # lưới 27 ô
.venv/bin/python scripts/measurements_2026_08_26/split.py        # chia đôi thời gian
.venv/bin/python scripts/measurements_2026_08_26/barrier.py      # khung rào chắn, 4 thang σ̂
.venv/bin/python scripts/measurements_2026_08_26/null.py         # hoán vị so tỉ lệ nền
.venv/bin/python scripts/measurements_2026_08_26/all27.py        # hoán vị cả 27 ô + FDR
.venv/bin/python scripts/measurements_2026_08_26/median_test.py  # phép thử ô trung vị
.venv/bin/python scripts/measurements_2026_08_26/ens.py          # tổ hợp 27 ô
.venv/bin/python scripts/measurements_2026_08_26/smc.py          # Phương Pháp 5: FVG · quét-lấy-lại · số tròn
```

Dữ liệu: `data/raw/ohlcv/symbol=BTCUSDT/timeframe=1h` — 2.062 nến ngày, 2021-01-01 → 2026-08-24.

> ⚠️ **Đây là phép thử khói, KHÔNG phải phép đo của tuần 9–10.** Một đồng · không purged walk-forward · không phí funding · trung bình 22 lệnh mỗi ô. Giới hạn đầy đủ ở `docs/12_DEEP_FOUR_METHODS.md §1`.

## Phương Pháp 7 — funding (`docs/13_FUNDING_METHOD_7.md`)

```bash
.venv/bin/python scripts/measurements_2026_08_26/fetch_funding.py    # tải 28.333 kỳ funding, 4 cặp
.venv/bin/python scripts/measurements_2026_08_26/funding_stats.py    # phân phối + khả năng dự báo
.venv/bin/python scripts/measurements_2026_08_26/funding_deep.py     # vol · tiếp diễn · carry · rủi ro
.venv/bin/python scripts/measurements_2026_08_26/funding_verify.py   # đợt SOL 2022 + bảng p_required
```

Dữ liệu ghi vào `data/raw/funding/symbol=<SYM>/data.parquet` (gitignored).

## Sổ đăng ký đặc trưng (`docs/14_FEATURE_REGISTRY.md`)

```bash
.venv/bin/python scripts/measurements_2026_08_26/feature_audit.py     # dựng 38 đặc trưng + đo trùng lặp
.venv/bin/python scripts/measurements_2026_08_26/feature_clusters.py  # gom 13 cụm + kiểm Levine-Pedersen
```

`feature_audit.py` ghi `features_btc.parquet` cạnh nó để `feature_clusters.py` đọc lại.

## Phương Pháp 4 — lượng dữ liệu cần (`docs/15_METHOD_4_DATA_REQUIREMENTS.md`)

```bash
.venv/bin/python scripts/measurements_2026_08_26/pp4_data_needs.py  # tương quan chéo thật giữa 4 cặp
.venv/bin/python scripts/measurements_2026_08_26/pp4_stability.py   # đường ổn định theo độ dài cửa sổ
.venv/bin/python scripts/measurements_2026_08_26/pp4_final.py       # kappa kết cục lệnh + số năm cần
```

`pp4_stability.py` và `pp4_final.py` import từ `pp4_data_needs.py` (chạy lại phần tải dữ liệu ở đầu).

## Khung 4 giờ (`docs/adr/002-khoa-khung-1h-4h.md`)

```bash
.venv/bin/python scripts/measurements_2026_08_26/h4_reality.py   # Phương Pháp 4 ở khung 4h + cái gì dự báo được
```
