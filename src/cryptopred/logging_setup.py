"""Thiết lập log dùng chung.

Gọi `setup_logging()` một lần ở đầu mỗi entry point (script, API, job).
Thư viện bên trong `src/` chỉ dùng `logging.getLogger(__name__)`.
"""

from __future__ import annotations

import logging
import os
import sys

_FORMAT = "%(asctime)s │ %(levelname)-7s │ %(name)-28s │ %(message)s"
_DATEFMT = "%H:%M:%S"


def setup_logging(level: str | None = None) -> None:
    logging.basicConfig(
        level=(level or os.getenv("LOG_LEVEL", "INFO")).upper(),
        format=_FORMAT,
        datefmt=_DATEFMT,
        stream=sys.stdout,
        force=True,
    )
    # ccxt rất ồn ở mức DEBUG
    logging.getLogger("ccxt").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
