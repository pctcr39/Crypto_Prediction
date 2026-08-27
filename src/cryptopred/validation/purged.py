"""M6 ★★★ · Walk-forward có purge + embargo — MODULE QUAN TRỌNG NHẤT REPO.

    |--- train ---| purge |--- test ---| embargo |--- test ---| embargo | ...
                   (P nến)              (E nến)

`purge`   cắt bỏ P nến cuối tập train, vì nhãn của chúng nhìn vào vùng test.
`embargo` chừa E nến sau mỗi tập test — fold sau không được train trên đó.

★ P VÀ E PHẢI BẰNG ĐỘ DÀI NHÃN, KHÔNG PHẢI `horizon_bars`:
    Nhãn của L6 là kết cục rào chắn, kéo dài tới `DEADLINE_DAYS` (60 ngày).
    Lấy P = horizon_bars["1d"] = 1 sẽ để 59 nến chồng lấn giữa train và test,
    mỗi nến mang một nhãn nhìn thẳng vào vùng test. Đó là một rò rỉ chờ sẵn.
    Quy tắc: P = E = max(độ dài nhãn của MỌI tầng dùng bộ chia này).

⚠️ MỘT TRỤC THỜI GIAN TOÀN CỤC, áp cùng mốc cho mọi symbol.
    Ta gộp 40 cặp và có đặc trưng liên thị trường BTC. Chia fold riêng từng coin
    thì lát test của coin A trùng mốc với lát train của coin B — mà các cặp USDT
    tương quan rất cao trong ngày. Rò rỉ gần như trực tiếp, rất khó phát hiện
    bằng các phép thử thông thường. Dùng `split_panel` cho dữ liệu nhiều symbol.

Vì sao phải tự viết: `mlfinlab` đã đóng mã nguồn. Đây là năng lực đã rời khỏi
thế giới mã nguồn mở, và là thứ quyết định dự án này nói thật hay nói dối.

RULE 3 — CẤM `train_test_split`, CẤM `KFold`, CẤM mọi kiểu chia ngẫu nhiên.

⚠️ Quy ước repo: KHÔNG sửa file này nếu không kèm test. Xem CLAUDE.md.
"""

from __future__ import annotations

from collections.abc import Iterator
from dataclasses import dataclass

import numpy as np
import pandas as pd


@dataclass(frozen=True)
class Fold:
    """Một fold: chỉ số mẫu train và test, kèm mốc thời gian để kiểm tra ranh giới."""

    index: int
    train_idx: np.ndarray
    test_idx: np.ndarray
    train_end: pd.Timestamp
    test_start: pd.Timestamp
    test_end: pd.Timestamp

    @property
    def gap_bars(self) -> pd.Timedelta:
        """Khoảng trống thời gian giữa cuối train và đầu test. Phải > 0."""
        return self.test_start - self.train_end


class PurgedWalkForward:
    """Bộ chia walk-forward có purge và embargo.

    Args:
        n_folds: số fold. GATE 1 yêu cầu ≥ 8, trải ≥ 24 tháng.
        purge_bars: số nến cắt ở cuối train — BẰNG ĐỘ DÀI NHÃN.
        embargo_bars: số nến chừa sau mỗi test — thường bằng purge_bars.
        min_train_bars: fold đầu tiên phải có ít nhất bấy nhiêu nến train.
    """

    def __init__(
        self,
        *,
        n_folds: int = 8,
        purge_bars: int,
        embargo_bars: int,
        min_train_bars: int = 5000,
    ) -> None:
        if n_folds < 1:
            raise ValueError("n_folds phải ≥ 1")
        if purge_bars < 1 or embargo_bars < 1:
            raise ValueError(
                "RULE 3 — purge_bars và embargo_bars phải ≥ 1. "
                "Đặt 0 là mở cửa cho nhãn chồng lấn giữa train và test."
            )
        if min_train_bars < 1:
            raise ValueError("min_train_bars phải ≥ 1")
        self.n_folds = n_folds
        self.purge_bars = purge_bars
        self.embargo_bars = embargo_bars
        self.min_train_bars = min_train_bars

    # ── bố cục trên MỘT trục thời gian ────────────────────────────
    def _layout(self, n: int) -> list[tuple[int, int, int]]:
        """Trả [(train_end, test_start, test_end)] theo VỊ TRÍ trên trục toàn cục.

        Mỗi fold tiến `test_size + embargo_bars`, nên khoảng trống giữa hai lát
        test liền nhau đúng bằng embargo; và `train_end = test_start − purge`
        khiến train của fold sau dừng trước vùng embargo của fold trước.
        """
        first_test = self.min_train_bars + self.purge_bars
        usable = n - first_test - (self.n_folds - 1) * self.embargo_bars
        test_size = usable // self.n_folds
        if test_size < 1:
            raise ValueError(
                f"Không đủ dữ liệu: {n} nến cho {self.n_folds} fold "
                f"(cần ≥ {first_test + self.n_folds + (self.n_folds - 1) * self.embargo_bars}). "
                f"Giảm n_folds hoặc min_train_bars — KHÔNG được giảm purge."
            )
        out = []
        for k in range(self.n_folds):
            ts = first_test + k * (test_size + self.embargo_bars)
            out.append((ts - self.purge_bars, ts, ts + test_size))
        return out

    def split(self, index: pd.DatetimeIndex) -> Iterator[Fold]:
        """Chia một chuỗi thời gian đơn (một symbol)."""
        index = pd.DatetimeIndex(index)
        if not index.is_monotonic_increasing:
            raise ValueError("index phải tăng dần — sắp xếp trước khi chia")
        for k, (tr_end, ts, te) in enumerate(self._layout(len(index))):
            yield Fold(
                index=k,
                train_idx=np.arange(0, tr_end),
                test_idx=np.arange(ts, te),
                train_end=index[tr_end - 1],
                test_start=index[ts],
                test_end=index[te - 1],
            )

    def split_panel(
        self, times: pd.Series | pd.DatetimeIndex, *, symbols: pd.Series | None = None
    ) -> Iterator[Fold]:
        """★ Chia dữ liệu NHIỀU SYMBOL trên MỘT TRỤC THỜI GIAN TOÀN CỤC.

        `times` là cột thời gian của bảng dài (một hàng = một (symbol, thời điểm)).
        Mốc cắt tính trên tập thời điểm DUY NHẤT, rồi ánh xạ ngược về hàng — nên
        mọi symbol dùng chung đúng một mốc.

        Truyền `symbols` để bật một phép kiểm rẻ: cặp (symbol, thời điểm) trùng
        lặp là lỗi dữ liệu âm thầm — nó nhân đôi trọng số một số mẫu trong train
        mà không có dấu hiệu nào.
        """
        times = pd.Series(pd.to_datetime(times)).reset_index(drop=True)
        if symbols is not None:
            sym = pd.Series(symbols).reset_index(drop=True)
            if len(sym) != len(times):
                raise ValueError("`symbols` và `times` phải cùng độ dài")
            dup = pd.DataFrame({"s": sym, "t": times}).duplicated()
            if dup.any():
                raise ValueError(
                    f"{int(dup.sum())} cặp (symbol, thời điểm) trùng lặp — "
                    "dữ liệu bị nhân bản, trọng số train sẽ lệch âm thầm."
                )
        axis = pd.DatetimeIndex(sorted(times.unique()))
        for k, (tr_end, ts, te) in enumerate(self._layout(len(axis))):
            t_train_end, t_test_start, t_test_end = axis[tr_end - 1], axis[ts], axis[te - 1]
            yield Fold(
                index=k,
                train_idx=np.flatnonzero(times <= t_train_end),
                test_idx=np.flatnonzero((times >= t_test_start) & (times <= t_test_end)),
                train_end=t_train_end,
                test_start=t_test_start,
                test_end=t_test_end,
            )

    # ── tự kiểm ───────────────────────────────────────────────────
    def assert_no_overlap(self, folds: list[Fold]) -> None:
        """Phép dò rò rỉ #5 — chồng lấn thời gian giữa train và test là purge sai."""
        for f in folds:
            if f.train_end >= f.test_start:
                raise AssertionError(
                    f"Fold {f.index}: train kết thúc {f.train_end} ≥ test bắt đầu "
                    f"{f.test_start}. Purge sai — đây là rò rỉ trực tiếp."
                )
            if len(np.intersect1d(f.train_idx, f.test_idx)):
                raise AssertionError(f"Fold {f.index}: train_idx và test_idx giao nhau.")
