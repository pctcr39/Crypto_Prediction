"""Điểm vào dòng lệnh gộp: `cryptopred <lệnh> [tham số...]`.

Mỗi lệnh con vẫn chạy độc lập được bằng `python -m cryptopred.<module>` —
đó là yêu cầu của MASTER_PLAN §0 (mỗi module có script chạy độc lập).
"""

from __future__ import annotations

import sys

COMMANDS = {
    "download": ("cryptopred.data.download", "Tải nến từ sàn về data/raw/"),
    "universe": ("cryptopred.data.universe", "Lọc vũ trụ coin, lưu ảnh chụp theo tháng"),
}


def _usage() -> str:
    lines = ["cryptopred <lệnh> [tham số...]", "", "Các lệnh:"]
    lines += [f"  {name:<10} {desc}" for name, (_, desc) in COMMANDS.items()]
    lines += ["", "Ví dụ:", "  cryptopred download BTCUSDT 1h", "  cryptopred universe --refresh"]
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    argv = list(sys.argv[1:] if argv is None else argv)
    if not argv or argv[0] in {"-h", "--help", "help"}:
        print(_usage())
        return 0

    name = argv[0]
    if name not in COMMANDS:
        print(f"Không có lệnh '{name}'.\n\n{_usage()}", file=sys.stderr)
        return 2

    module_path = COMMANDS[name][0]
    module = __import__(module_path, fromlist=["main"])
    return int(module.main(argv[1:]) or 0)


if __name__ == "__main__":
    sys.exit(main())
