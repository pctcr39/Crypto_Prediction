"""M8 · Backtest vectorbt — RULE 5: mọi con số đều đã trừ phí và trượt giá.

Cấu hình mặc định BẮT BUỘC (config/model.yaml → costs):
    phí taker 0,10% mỗi chiều · trượt giá 0,05% · futures cộng funding 8h/lần

Một chiến lược intraday vào ra 6 lần/ngày trả 1,2% phí/ngày. Không edge nghiệp
dư nào sống nổi qua con số đó — rất nhiều repo "70% accuracy" sụp đổ ngay khi
bật phí.

Báo cáo phải chạy trên MỌI fold và trình bày PHÂN PHỐI, không chỉ giá trị trung
bình. GATE 1 yêu cầu ≥ 6/8 fold có lãi — không được để một fold gánh tất cả.
"""

from __future__ import annotations


def run_backtest(*args, **kwargs):
    raise NotImplementedError("M8 — xem docs/03_MODULE_SPECS.md §M8")
