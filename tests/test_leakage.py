"""★ FILE TEST QUAN TRỌNG NHẤT REPO — bộ dò rò rỉ dữ liệu.

Rò rỉ dữ liệu là cách duy nhất khiến dự án này nói dối bạn một cách thuyết phục.
Backtest 85% chính xác, thực tế bằng 0. Mọi phép thử ở đây tồn tại để bắt đúng
tình huống đó.

Trạng thái hiện tại (P0):
  · Phần kiểm tra HÀNG RÀO (guardrail) đã chạy — RULE 1, RULE 2.
  · Năm phép thử thống kê của M6 đang `skip` vì module chưa tồn tại.

Khi làm M6, bỏ `skip` từng phép một. **Không được xoá phép thử để test xanh** —
nếu một phép thử đỏ, thứ sai là pipeline, không phải test.

Tham chiếu: RULE 2, RULE 3, RULE 11 · docs/03_MODULE_SPECS.md §M6
"""

from __future__ import annotations

import numpy as np
import pandas as pd
import pytest

from cryptopred.features.builder import RAW_LEVEL_COLUMNS, assert_scale_free, shift_all

M6_CHUA_LAM = pytest.mark.skip(reason="Chờ M6 — bỏ skip khi cryptopred.validation đã có thật")


# ══════════════════════════════════════════════════════════════════
#  HÀNG RÀO — đã chạy được ngay từ P0
# ══════════════════════════════════════════════════════════════════


@pytest.mark.leakage
def test_shift_all_thuc_su_dich_mot_nen(synthetic_ohlcv):
    """RULE 2 — feature của nến t phải rời sang hàng t+1."""
    feat = pd.DataFrame({"r1": np.log(synthetic_ohlcv["close"]).diff()})
    out = shift_all(feat)

    assert pd.isna(out["r1"].iloc[0]), "Hàng đầu phải là NaN sau khi dịch"
    assert out["r1"].iloc[5] == pytest.approx(feat["r1"].iloc[4]), "Giá trị phải đến từ nến trước"


@pytest.mark.leakage
def test_shift_all_tu_choi_shift_0():
    """RULE 2 không có ngoại lệ — shift 0 nghĩa là nhìn thấy hiện tại."""
    feat = pd.DataFrame({"x": [1.0, 2.0, 3.0]})
    with pytest.raises(ValueError, match="RULE 2"):
        shift_all(feat, bars=0)


@pytest.mark.leakage
def test_assert_scale_free_chan_gia_tho(synthetic_ohlcv):
    """RULE 1 — giá thô lọt vào feature là hỏng toàn bộ tính đa-coin."""
    with pytest.raises(ValueError, match="RULE 1"):
        assert_scale_free(synthetic_ohlcv)


@pytest.mark.leakage
def test_assert_scale_free_chap_nhan_ti_le(synthetic_ohlcv):
    feat = pd.DataFrame(
        {
            "log_return_1": np.log(synthetic_ohlcv["close"]).diff(),
            "hl_range_pct": (synthetic_ohlcv["high"] - synthetic_ohlcv["low"])
            / synthetic_ohlcv["close"],
        }
    )
    assert_scale_free(feat)  # không được ném lỗi
    assert not (set(feat.columns) & RAW_LEVEL_COLUMNS)


@pytest.mark.leakage
def test_config_features_khong_cho_phep_bfill():
    """`bfill` kéo dữ liệu tương lai về quá khứ — phải nằm trong danh sách cấm."""
    from cryptopred.config import features_config

    forbidden = " ".join(features_config()["forbidden"]).lower()
    assert "bfill" in forbidden
    assert "center=true" in forbidden


@pytest.mark.leakage
def test_shift_bars_trong_config_luon_it_nhat_1():
    from cryptopred.config import features_config

    assert features_config()["shift_bars"] >= 1, "Đổi shift_bars về 0 là mở cửa cho rò rỉ"


# ══════════════════════════════════════════════════════════════════
#  NĂM PHÉP THỬ CỦA M6 — bỏ skip lần lượt khi làm tới
#  docs/03_MODULE_SPECS.md §M6, bảng "Bộ dò rò rỉ"
# ══════════════════════════════════════════════════════════════════


@M6_CHUA_LAM
@pytest.mark.leakage
def test_shifted_labels():
    """Dịch toàn bộ nhãn thêm 1 bước rồi train lại.

    Điểm số **TĂNG** ⇒ chắc chắn có rò rỉ: model đang đọc được tương lai và
    việc dịch nhãn đã đưa nó tới gần hơn thứ nó vốn đã nhìn thấy.
    """


@M6_CHUA_LAM
@pytest.mark.leakage
def test_shuffled_labels():
    """Xáo ngẫu nhiên nhãn rồi train lại.

    Điểm số vẫn > 50% một cách đáng kể ⇒ rò rỉ: không còn tín hiệu nào để học
    mà model vẫn "đúng" nghĩa là nó đang đọc thứ khác.
    """


@M6_CHUA_LAM
@pytest.mark.leakage
def test_feature_label_correlation():
    """Bất kỳ feature nào có |corr| với nhãn > 0.99 ⇒ rò rỉ kinh điển."""


@M6_CHUA_LAM
@pytest.mark.leakage
def test_time_reversal():
    """Train trên tương lai, test trên quá khứ.

    Điểm số tương đương ⇒ model đang học thứ không phụ thuộc thời gian. Đáng nghi.
    """


@M6_CHUA_LAM
@pytest.mark.leakage
def test_fold_boundaries_khong_chong_lan():
    """So mẫu cuối tập train với mẫu đầu tập test.

    Chồng lấn thời gian ⇒ purge sai. Đây là lỗi âm thầm nhất trong cả pipeline.
    """


@M6_CHUA_LAM
@pytest.mark.leakage
def test_accuracy_1h_khong_vuot_nguong_nghi_ngo():
    """RULE 11 — vượt 60% ở khung 1h thì GIẢ ĐỊNH CÓ RÒ RỈ, không ăn mừng.

    Thị trường crypto thanh khoản cao ở khung ngắn gần như là random walk.
    52–55% đã là một edge thật và đáng giá.
    """
