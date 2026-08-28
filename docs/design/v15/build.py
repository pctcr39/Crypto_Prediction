"""Ghép prototype v15 thành file HTML tự chứa.

Sinh HAI sản phẩm — nguồn sự thật vẫn là các file tách rời trong docs/design/v15/,
file ghép không sửa tay:

  · v15-dashboard.html — tài liệu HTML đầy đủ, mở trực tiếp bằng trình duyệt
  · v15-artifact.html  — cùng nội dung nhưng BỎ khung <!doctype>/<html>/<head>/<body>
                         vì Artifact tự bọc khung; giữ <title>, font Google, <style>, <script>

Chạy:  python3 docs/design/v15/build.py
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).parent
OUT = ROOT.parent / "v15-dashboard.html"
OUT_ART = ROOT.parent / "v15-artifact.html"
CSS = ["tokens.css", "components.css"]
JS = ["fallback-data.js", "data.js", "domain.js", "theory.js", "core.js",
      "screens/trade.js", "screens/markets.js", "screens/indicators.js", "screens/consult.js",
      "screens/portfolio.js", "screens/bots.js", "screens/account.js", "screens/auth.js", "app.js"]


def main() -> None:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    # bỏ các thẻ link/script rời, thay bằng nội dung inline
    html = re.sub(r'<link rel="stylesheet" href="[^"]+">\n', "", html)
    html = re.sub(r'<script src="[^"]+"></script>\n', "", html)
    css = "\n".join(f"/* ── {f} ── */\n" + (ROOT / f).read_text(encoding="utf-8") for f in CSS)
    js = "\n".join(f"/* ── {f} ── */\n" + (ROOT / f).read_text(encoding="utf-8") for f in JS)
    js = js.replace("</script>", "<\\/script>")
    html = html.replace("<!-- BUILD:CSS -->", f"<style>\n{css}\n</style>")
    html = html.replace("<!-- BUILD:JS -->", f"<script>\n{js}\n</script>")
    OUT.write_text(html, encoding="utf-8")
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB)")

    # ── Bản cho Artifact: bóc khung ngoài, giữ nguyên phần bên trong ──
    # data-theme / data-mode không cần giữ: app.js tự đặt lại lúc khởi động.
    head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
    body = re.search(r"<body[^>]*>(.*?)</body>", html, re.S).group(1)
    # giữ NGUYÊN VĂN: <title>, các <link> (font Google được phép), và cả khối <style>
    keep = [
        re.search(r"<title>.*?</title>", head, re.S).group(0),
        *re.findall(r"<link\b[^>]*>", head),
        re.search(r"<style>.*?</style>", head, re.S).group(0),
    ]
    OUT_ART.write_text("\n".join(keep) + "\n" + body.strip() + "\n", encoding="utf-8")
    print(f"wrote {OUT_ART} ({OUT_ART.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
