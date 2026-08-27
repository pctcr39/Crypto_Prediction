# `measure_spec.py` — thực thi đặc tả

Nguồn **duy nhất** của mọi con số định lượng trong `docs/PREDICTION_DESIGN.md`.

```bash
.venv/bin/python scripts/spec/measure_spec.py
```

Sinh ra `docs/generated/spec_numbers.md`. Tài liệu thiết kế **trỏ tới** tệp đó, **không chép** số.

**Quy tắc (ADR-016):** số nào script này không sinh được thì **không được xuất hiện** trong tài liệu thiết kế.

Script cài đặt đúng đặc tả:
- σ̂ = HAR-RV trên `log(Parkinson RV)`, mục tiêu TB RV 5 ngày tới, walk-forward có purge
- `w` = tổ hợp 27 ô, rời rạc hoá 5 mức
- Sự kiện = máy trạng thái tranche: mở theo bước tăng vào slot trống · LIFO · **tái vũ trang không cooldown** · stop soi INTRABAR · target soi tại CLOSE · hạn 60 ngày
- Vào tại `open[t+1]` · phí 0,30% khứ hồi

> ⚠️ **Điều kiện nghiệm thu bước 7 của lộ trình:** khi `src/cryptopred` tồn tại, script này phải **import từ đó** thay vì cài đặt lại — nếu không nó sẽ lệch khỏi mã sản xuất, đúng lỗi mà nó được tạo ra để chặn.
