# ══════════════════════════════════════════════════════════════════
#  CRYPTO PREDICTION — lệnh tắt
#  Chạy `make` không tham số để xem danh sách.
# ══════════════════════════════════════════════════════════════════

PY  := .venv/bin/python
SYM ?= BTCUSDT
TF  ?= 1h

.DEFAULT_GOAL := help
.PHONY: help setup setup-model test test-network test-leakage lint fmt \
        download universe check-data train mlflow api clean clean-data

help:  ## Danh sách lệnh
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

setup:  ## Tạo môi trường + cài phụ thuộc (uv)
	uv sync --extra dev
	echo "✓ Xong. Kích hoạt bằng: source .venv/bin/activate"

setup-model:  ## Cài thêm nhóm model (M5+) — lightgbm, mlflow, optuna…
	uv sync --extra dev --extra model

test:  ## Chạy test (bỏ qua test cần mạng)
	$(PY) -m pytest

test-network:  ## Chạy test có gọi API Binance thật
	$(PY) -m pytest -m network -v

test-leakage:  ## ★ Chỉ chạy bộ dò rò rỉ — chạy trước mỗi commit
	$(PY) -m pytest -m leakage -v

lint:  ## Kiểm tra code style
	$(PY) -m ruff check src tests scripts
	$(PY) -m ruff format --check src tests scripts

fmt:  ## Tự sửa style
	$(PY) -m ruff check --fix src tests scripts
	$(PY) -m ruff format src tests scripts

download:  ## Tải nến — vd: make download SYM=ETHUSDT TF=4h
	$(PY) -m cryptopred.data.download $(SYM) $(TF)

universe:  ## Dựng ảnh chụp vũ trụ coin của tháng này
	$(PY) -m cryptopred.data.universe --refresh

check-data:  ## Liệt kê dữ liệu đang có trên đĩa
	$(PY) scripts/check_data.py

train:  ## (M5 — chưa làm)
	echo "M5 chưa được xây. Trước đó phải xong M3 (feature), M4 (nhãn), M6 (kiểm định)."
	echo "Xem docs/03_MODULE_SPECS.md §M5 · RULE 4: chạy 3 baseline TRƯỚC khi train."
	exit 1

mlflow:  ## Mở giao diện MLflow (cần: make setup-model)
	$(PY) -m mlflow ui --backend-store-uri file:./mlruns

api:  ## (M9 — chưa làm) Chạy FastAPI
	echo "M9 chưa được xây. Xem docs/03_MODULE_SPECS.md §M9."
	exit 1

clean:  ## Xoá cache công cụ (KHÔNG đụng dữ liệu)
	rm -rf .pytest_cache .ruff_cache htmlcov .coverage
	find . -type d -name __pycache__ -not -path "./.venv/*" -exec rm -rf {} +

clean-data:  ## ⚠️ Xoá clean/features/labels — GIỮ NGUYÊN raw/ (raw là bất biến)
	rm -rf data/clean/* data/features/* data/labels/*
	echo "✓ Đã xoá từ tầng clean/ trở xuống. data/raw/ còn nguyên."
