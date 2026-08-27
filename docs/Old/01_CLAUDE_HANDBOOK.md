# SỔ TAY NGƯỜI MỚI: TOÀN BỘ TÍNH NĂNG CỦA CLAUDE

**Dành cho:** lập trình viên solo, biết Python cơ bản, dùng **Claude desktop app ở chế độ Cowork** và muốn học thêm **Claude Code (CLI)**.
**Dự án xuyên suốt:** một hệ thống dự đoán giá crypto — lấy dữ liệu nến từ Binance, huấn luyện mô hình LightGBM, phục vụ qua dashboard FastAPI.
**Thời điểm:** tháng 8/2026. Mọi thông tin bên dưới đều được đối chiếu với tài liệu chính thức tại `docs.claude.com` (nay chuyển hướng sang `platform.claude.com` và `code.claude.com`) và `support.claude.com`. Chỗ nào tôi không kiểm chứng được, tôi ghi rõ **"cần kiểm tra lại"**.

> **Một lời khuyên trước khi bắt đầu.** Đừng đọc hết cuốn này rồi mới làm. Hãy đọc mục 1, 2, 3, rồi mở dự án crypto của bạn ra và làm theo. Quay lại các mục sau khi bạn thực sự gặp vấn đề mà mục đó giải quyết. Công cụ chỉ có ý nghĩa khi bạn đã đau đầu vì thiếu nó.

---

## MỤC LỤC

| # | Chủ đề | Bạn cần khi... |
|---|--------|----------------|
| 1 | Bản đồ hệ sinh thái | Không biết nên mở cái nào |
| 2 | Prompting cơ bản | Claude làm sai ý bạn |
| 3 | Projects & Project Instructions | Phải lặp lại bối cảnh mỗi lần chat |
| 4 | Memory (bộ nhớ dự án) | Claude quên những gì bạn đã sửa |
| 5 | Files & cầu nối thiết bị (device bridge) | Cần đọc/ghi file trên máy Mac |
| 6 | Artifacts | Cần một trang web/báo cáo xem được |
| 7 | Skills | Bạn dán đi dán lại cùng một quy trình |
| 8 | Plugins & Marketplaces | Muốn cài trọn bộ tính năng của người khác |
| 9 | MCP (connector) | Cần Claude nói chuyện với DB/sàn giao dịch |
| 10 | Subagents | Context đầy vì nghiên cứu quá nhiều |
| 11 | Plan Mode | Sợ Claude sửa bừa code |
| 12 | Slash commands | Muốn phím tắt cho việc lặp lại |
| 13 | Hooks | Cần thứ gì đó *luôn luôn* chạy |
| 14 | Scheduled tasks / Routines | Muốn retrain mô hình mỗi đêm |
| 15 | Task lists | Việc dài, muốn theo dõi tiến độ |
| 16 | Web search & fetch | Cần thông tin mới hơn dữ liệu huấn luyện |
| 17 | Claude in Chrome | Cần thao tác trên trình duyệt |
| 18 | Git/GitHub | Commit, PR, code review |
| 19 | CLAUDE.md | Claude lặp lại cùng một lỗi trong repo |
| 20 | Chi phí & giới hạn | Hết quota giữa chừng |
| 21 | Bảng tra cứu nhanh | Cần tra ngay |
| 22 | 10 sai lầm phổ biến | Trước khi bạn mắc phải |

---

## 1. BẢN ĐỒ HỆ SINH THÁI CLAUDE

> **RULE: Chọn bề mặt (surface) theo *nơi công việc đang nằm*, chứ không theo thói quen — file trên máy thì dùng Cowork desktop, code trong git repo thì dùng Claude Code, việc chạy khi máy tắt thì đẩy lên cloud.**

Anthropic không làm một sản phẩm, họ làm một *họ* sản phẩm dùng chung một engine. Hiểu bản đồ này tiết kiệm cho bạn hàng giờ mò mẫm.

| Sản phẩm | Nó là gì | Dùng khi |
|---|---|---|
| **Claude app** (web/desktop/mobile) | Giao diện chat quen thuộc, có Projects, Artifacts, connectors | Hỏi đáp, viết lách, phân tích một lần |
| **Cowork mode** | Chế độ *agentic* trong app: Claude tự chạy nhiều bước, có shell, đọc/ghi file, chạy trong sandbox đám mây | Việc nhiều bước ngoài lập trình thuần: dọn dữ liệu, dựng báo cáo, xử lý hàng loạt file |
| **Claude Code (CLI)** | Công cụ code trong terminal, hiểu cả codebase, sửa nhiều file, chạy lệnh, tích hợp git | Viết code thật trong repo có git |
| **Claude Agent SDK** | Thư viện Python & TypeScript, cho bạn chính vòng lặp agent của Claude Code | Bạn muốn *nhúng* agent vào sản phẩm của mình |
| **Claude API** | Gọi model trực tiếp, bạn tự viết vòng lặp tool | Bạn cần kiểm soát tuyệt đối, hoặc backend production |
| **Claude in Chrome** | Extension điều khiển trình duyệt | Việc chỉ làm được trên web UI |
| **Claude in Excel** | Add-in cho Excel (và có bản Word/PowerPoint/Outlook) | Mô hình tài chính, bảng tính |

Về **Cowork**: tài liệu mô tả nó "mang năng lực agentic tới công việc tri thức ngoài lập trình... dùng chính kiến trúc agentic đứng sau Claude Code, không cần terminal". Có trên Pro, Max, Team, Enterprise. Phiên chạy trong một **sandbox tạm thời, cô lập** trên hạ tầng Anthropic, được tạo khi phiên bắt đầu và huỷ khi phiên kết thúc — không chia sẻ trạng thái giữa các phiên ([kiến trúc Cowork](https://support.claude.com/en/articles/14479288-claude-cowork-architecture-overview)).

Về **Claude Code**: chạy trên terminal, VS Code, JetBrains, desktop app và web — tất cả nối cùng một engine, nên `CLAUDE.md`, settings và MCP servers dùng chung giữa các bề mặt ([tổng quan](https://code.claude.com/docs/en/overview)). Cài trên macOS:

```bash
curl -fsSL https://claude.ai/install.sh | bash
cd ~/projects/crypto-predictor
claude
```

**Ví dụ dự án crypto — chọn công cụ cho từng việc:**

| Việc | Công cụ đúng |
|---|---|
| "Tải 2 năm nến 1h của BTCUSDT từ Binance, lưu parquet" | Cowork (sandbox có shell + mạng) |
| "Refactor `features.py`, tách phần tính RSI ra module riêng, chạy test" | Claude Code trong repo |
| "Mỗi đêm 2h sáng retrain LightGBM và mở PR nếu MAE cải thiện" | Routine (cloud, chạy khi Mac tắt) |
| "Đọc file `~/Downloads/binance_export.csv` trên máy tôi" | Cowork desktop + connected folder |
| "Nhúng agent tự động vào dashboard FastAPI cho khách hàng dùng" | Agent SDK (Python) |

---

## 2. PROMPTING CƠ BẢN

> **RULE: Viết prompt như đang giao việc cho một đồng nghiệp giỏi nhưng vừa vào công ty ngày đầu — họ thông minh, nhưng không biết gì về dự án của bạn.**

Đây là "quy tắc vàng" (golden rule) mà Anthropic nêu thẳng trong [tài liệu prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices): đưa prompt của bạn cho một đồng nghiệp không có bối cảnh; nếu họ bối rối thì Claude cũng vậy.

Sáu kỹ thuật được tài liệu chính thức khuyến nghị:

**1. Rõ ràng và trực tiếp.** Nói cụ thể định dạng đầu ra và ràng buộc. Dùng danh sách đánh số khi thứ tự quan trọng.

**2. Cho ví dụ (multishot / few-shot).** Tài liệu khuyên **3–5 ví dụ**, phải *sát* với ca dùng thật và *đa dạng* để phủ ca biên. Bọc chúng trong thẻ `<example>`.

**3. Dùng thẻ XML để cấu trúc prompt.** Khi prompt trộn lẫn hướng dẫn + bối cảnh + ví dụ + dữ liệu, XML giúp Claude phân biệt rạch ròi.

**4. Đặt vai trò (role) trong system prompt.** Chỉ một câu cũng tạo khác biệt rõ rệt.

**5. Cho Claude suy nghĩ.** Model đời mới hỗ trợ *adaptive thinking*, tự bật khi bài toán khó. Với prompt phức tạp, thêm câu "trước khi trả lời, kiểm tra lại đáp án theo các tiêu chí sau".

**6. Chỉ định độ dài và định dạng — bằng cách nói *nên làm gì*, không phải *đừng làm gì*.** Thay vì "đừng dùng markdown", hãy viết "viết thành đoạn văn xuôi liền mạch".

Thêm hai mẹo quan trọng: đặt **tài liệu dài ở ĐẦU prompt, câu hỏi ở CUỐI** — tài liệu nói cách này có thể cải thiện hiệu năng khoảng 30%. Và giải thích *tại sao* bạn muốn thế, không chỉ *cái gì*.

**Ví dụ dự án crypto — prompt tồi vs prompt tốt:**

Tồi: *"Viết code dự đoán giá Bitcoin."*

Tốt (copy được ngay):

```text
<bối_cảnh>
Tôi có file /data/btcusdt_1h.parquet: 17.000 dòng nến 1 giờ của BTCUSDT
từ Binance, cột: open_time, open, high, low, close, volume.
Mục tiêu: dự đoán log-return của cây nến kế tiếp (không phải giá tuyệt đối).
Dùng LightGBM vì tôi cần feature importance để giải thích cho chính mình.
</bối_cảnh>

<yêu_cầu>
1. Viết file src/features.py với hàm build_features(df) -> DataFrame.
2. Feature cần có: RSI 14, EMA 12/26, MACD histogram, ATR 14,
   log-return của 1/3/6/24 nến trước, giờ trong ngày (sin/cos).
3. TUYỆT ĐỐI không dùng dữ liệu tương lai. Mọi rolling window phải
   shift(1) trước khi làm feature.
4. Viết kèm tests/test_features.py kiểm tra chống rò rỉ dữ liệu:
   với một hàng bất kỳ ở index t, feature chỉ được phụ thuộc index <= t-1.
</yêu_cầu>

<định_dạng>
Trả về code hoàn chỉnh cho 2 file. Sau đó liệt kê 3 rủi ro rò rỉ dữ liệu
mà bạn thấy khả năng cao nhất, mỗi rủi ro 1 câu.
</định_dạng>
```

Khác biệt: prompt thứ hai nêu dữ liệu thật, nêu *lý do* chọn LightGBM, nêu ràng buộc nghiệp vụ nguy hiểm nhất (rò rỉ dữ liệu tương lai — kẻ giết chết mọi mô hình tài chính), và chỉ định định dạng đầu ra.

---

## 3. PROJECTS & PROJECT INSTRUCTIONS

> **RULE: Bất cứ điều gì bạn phải giải thích lại ở lần chat thứ hai đều thuộc về Project Instructions, không thuộc về khung chat.**

**Projects trong Claude app** là "không gian làm việc khép kín với lịch sử chat và kho tri thức riêng" ([Projects là gì](https://support.claude.com/en/articles/9517075-what-are-projects)). Bạn tải tài liệu lên kho tri thức của project, và viết **project instructions** để điều chỉnh cách Claude trả lời. Tài khoản Free tạo được tối đa 5 project; các gói trả phí bật RAG để mở rộng dung lượng tri thức "lên tới 10 lần".

**Projects trong Cowork** là một thứ khác và quan trọng hơn với bạn: đó là "không gian làm việc riêng với file, bối cảnh, instructions và **memory** riêng" ([Projects trong Cowork](https://support.claude.com/en/articles/14116274-organize-your-tasks-with-projects-in-claude-cowork)). Mỗi Cowork project có:

- **Instructions** — giọng điệu, định dạng, quy tắc áp cho mọi task trong project
- **Connected context** — thư mục local, project chat liên kết, hoặc URL
- **Memory** — Claude nhớ bối cảnh giữa các task, **phạm vi trong project** (những gì học ở project này không lan sang project khác)

Ba hạn chế cần biết: Cowork projects **chỉ có trên desktop** (macOS/Windows), **không đồng bộ cloud** (dữ liệu nằm trên máy bạn), và **chưa dùng được trong Claude Code**.

**Ví dụ dự án crypto — Project Instructions nên viết gì:**

```text
Dự án: crypto-predictor. Dự đoán log-return nến kế tiếp của BTCUSDT/ETHUSDT.

Stack: Python 3.11, pandas, LightGBM, FastAPI, DuckDB. Không dùng TensorFlow.
Dữ liệu: /Users/nam/crypto/data/*.parquet, nến 1h từ Binance REST API.
Chạy test bằng: pytest -q. Format bằng: ruff format .

QUY TẮC BẤT DI BẤT DỊCH:
- Mọi backtest phải walk-forward, KHÔNG BAO GIỜ random train_test_split
  trên chuỗi thời gian.
- Mọi feature phải shift(1). Nếu tôi quên, hãy nhắc tôi.
- Không bao giờ hard-code API key. Đọc từ biến môi trường BINANCE_KEY.
- Khi báo cáo kết quả mô hình, luôn kèm baseline "dự đoán = 0"
  để tôi biết mô hình có thực sự hơn không.

Giọng điệu: ngắn gọn, thẳng vào việc. Nếu tôi sai về mặt thống kê, nói thẳng.
```

Dòng cuối cùng đó có giá trị hơn bạn nghĩ. Trong dự án tài chính, nguy hiểm lớn nhất là một mô hình *có vẻ* tốt.

---

## 4. MEMORY (BỘ NHỚ DỰ ÁN)

> **RULE: Memory dành cho những gì Claude KHÔNG thể suy ra từ file của bạn — sở thích, quyết định, sai lầm đã sửa. Đừng lưu những gì đọc code là biết.**

Có hai cơ chế nhớ, đừng lẫn lộn:

**Auto memory (Claude tự viết).** Trong Claude Code, Claude tự lưu ghi chú giữa các phiên vào `~/.claude/projects/<project>/memory/`, gồm một file chỉ mục `MEMORY.md` và các file chủ đề. Tài liệu nêu bốn loại ghi chú, đánh dấu bằng trường `type` trong frontmatter:

- `user` — vai trò, chuyên môn, thói quen làm việc của bạn
- `feedback` — các sửa lỗi bạn góp ý, cách tiếp cận bạn xác nhận
- `project` — công việc đang chạy, deadline, quyết định không suy ra được từ code hay git
- `reference` — nơi tìm thông tin bên ngoài dự án

Quan trọng: **Claude chủ động bỏ qua** những gì suy ra được từ codebase (kiến trúc, đường dẫn file, cách fix bug) và những gì `CLAUDE.md` đã nói. Chỉ **200 dòng đầu hoặc 25KB đầu** của `MEMORY.md` được nạp vào mỗi phiên, tuỳ cái nào tới trước ([tài liệu memory](https://code.claude.com/docs/en/memory)). Auto memory bật mặc định; tắt bằng `/memory` hoặc `"autoMemoryEnabled": false`.

**Project memory trong Cowork** hoạt động theo tinh thần tương tự nhưng lưu cục bộ theo project và không đồng bộ cloud.

**Nên lưu:**
- "Nam thích xem feature importance dạng bảng, không thích SHAP plot."
- "Đã thử LSTM tháng 6/2026, tệ hơn LightGBM 12% MAE. Đừng gợi ý lại."
- "Binance rate limit thực tế của tài khoản này là 1200 req/phút, không phải 2400."
- "Dashboard deploy trên Fly.io, không phải Heroku."

**Không nên lưu:**
- "File features.py có hàm build_features()" — đọc file là biết.
- "Dự án dùng LightGBM" — đã có trong `CLAUDE.md`.
- Bất cứ thứ gì là API key hoặc secret.

**Prompt copy được:**

```text
Ghi nhớ giúp tôi: tôi đã thử LSTM 2 lớp cho bài toán này hồi tháng 6/2026,
MAE tệ hơn LightGBM 12% và train chậm gấp 8 lần. Đừng gợi ý deep learning
cho bài toán tabular này nữa trừ khi tôi hỏi thẳng.
```

Xem lại Claude đã nhớ gì: gõ `/memory` trong Claude Code. Tất cả là file markdown thường, bạn sửa hoặc xoá được.

---

## 5. FILES & CẦU NỐI THIẾT BỊ TRONG COWORK

> **RULE: Sandbox đám mây và máy Mac của bạn là hai thế giới tách biệt — file phải được *đưa lên* (stage) để Claude đọc, và *ghi về* (commit) để bạn có trên đĩa. Việc chưa commit về là việc chưa xong.**

Đây là khái niệm dễ gây bối rối nhất với người mới dùng Cowork, nên hãy đọc kỹ.

Phiên Cowork chạy trong **sandbox cô lập trên hạ tầng Anthropic**. Khi phiên cần tài nguyên trên máy bạn, "yêu cầu đi qua Claude Desktop app trên thiết bị đó qua một kết nối do Anthropic làm trung gian". Quyền truy cập file bị **giới hạn trong các thư mục bạn đã connect trên desktop**, và quyền được kiểm tra trước *mỗi* lần gọi tool cục bộ ([kiến trúc Cowork](https://support.claude.com/en/articles/14479288-claude-cowork-architecture-overview)).

Bốn năng lực **chỉ có trên desktop app**: live artifacts, truy cập file cục bộ (connected folders), connector/MCP server cục bộ, và computer use. Đặc biệt lưu ý: ngay cả phiên chạy trên cloud "chỉ đọc và ghi file trong thư mục bạn đã connect **khi desktop app đang mở**" ([Cowork trên web/desktop/mobile](https://support.claude.com/en/articles/15520349-use-claude-cowork-on-web-desktop-and-mobile)).

**Vòng đời một file, ba bước:**

1. **Connect folder** — trên desktop app, bạn cấp quyền cho một thư mục. Chỉ thư mục đó và cây con của nó là với tới được; phần còn lại của máy thì không.
2. **Stage** — Claude sao chép file từ máy bạn vào sandbox để đọc/xử lý. Bản sao này là **ảnh chụp tại một thời điểm**: nếu bạn sửa file trên Mac sau đó, bản trong sandbox vẫn là bản cũ.
3. **Commit** — Claude ghi file kết quả ngược về đĩa của bạn. Có cơ chế bảo vệ theo mtime: nếu file trên máy đã thay đổi kể từ lúc stage, thao tác ghi bị từ chối để không đè lên sửa đổi của bạn.

Về mạng: sandbox **không** với tới địa chỉ nội bộ/private/link-local/cloud-metadata; toàn bộ traffic ra ngoài đi qua một proxy bắt buộc mà sandbox không thể cấu hình lại hay đi vòng, chỉ các đích trong allowlist được phép.

**Ví dụ dự án crypto:**

```text
Tôi đã connect thư mục ~/crypto trên máy. Hãy:
1. Liệt kê nội dung ~/crypto/data để xem tôi có những file nào.
2. Stage file btcusdt_1h.parquet lên sandbox.
3. Kiểm tra: có bao nhiêu nến bị thiếu (gap) trong chuỗi thời gian?
   In ra 10 khoảng gap dài nhất kèm độ dài.
4. Tạo file data_quality_report.md tóm tắt phát hiện.
5. Ghi report đó về lại ~/crypto/reports/ trên máy tôi.
```

Bước 5 là bước người mới hay quên. Nếu bạn không yêu cầu ghi về, file chỉ tồn tại trong sandbox và biến mất khi phiên kết thúc.

**Giới hạn (theo tài liệu tool trong phiên này — cần kiểm tra lại vì con số có thể đổi):** khi đưa file lên sandbox, giới hạn thường thấy là 50 file/lần, ≤400MB/file và ≤500MB/lần; khi ghi về máy thì chặt hơn: 50 file, ≤20MB/file, ≤100MB tổng mỗi lần. Với file lớn hơn, hãy xử lý *tại chỗ* trên máy bằng shell thay vì chuyển qua lại.

---

## 6. ARTIFACTS

> **RULE: Artifact dành cho thứ người khác sẽ *xem*; file dành cho thứ bạn sẽ *chạy*. Đừng publish code nguồn thành artifact, và đừng chôn một dashboard đẹp vào file .html nằm im trong thư mục.**

**Artifacts** là cửa sổ riêng nơi Claude đặt nội dung độc lập, đáng kể — tài liệu nói thường là nội dung "trên 15 dòng" và là thứ bạn muốn sửa hoặc tái dùng ([Artifacts là gì](https://support.claude.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them)). Kiểu nội dung hỗ trợ: tài liệu Markdown/text, code, trang HTML, ảnh SVG, sơ đồ, và component React tương tác.

Những điểm đã kiểm chứng:
- Có **version selector** — mỗi lần sửa tạo một phiên bản, bạn quay lại được.
- Với tài liệu Markdown, có thể bôi đen đoạn text rồi bấm **"Edit with Claude"** để sửa tại chỗ.
- Muốn chia sẻ công khai, phải **publish** từ trong cuộc hội thoại trước.
- Giới hạn lưu trữ **20 MB mỗi artifact** (cho phần lưu trữ bền vững), và lưu trữ bền vững chỉ hoạt động sau khi publish.
- Cần bật "Code execution and file creation" trong Settings.

Về **comments**: tài liệu tổng quan artifact không mô tả chi tiết chức năng bình luận, nhưng trong môi trường Claude Code, người xem artifact đã publish có thể để lại luồng bình luận, và bạn đọc/trả lời/đánh dấu resolved được. Chi tiết cụ thể của luồng comment trên claude.ai — **cần kiểm tra lại**.

**Khi nào publish vs khi nào chỉ giao file:**

| Tình huống | Cách làm |
|---|---|
| Dashboard so sánh 5 mô hình để bạn *tự* xem | Artifact — publish, mở bằng browser |
| File `train_lgbm.py` để bạn chạy | File thường, không artifact |
| Báo cáo backtest gửi cho bạn cùng team | Artifact — publish rồi gửi link |
| `requirements.txt` | File thường |

**Ví dụ dự án crypto:**

```text
Từ file backtest_results.csv (cột: model_name, fold, mae, rmse,
directional_accuracy, sharpe), tạo cho tôi một trang HTML tự chứa:
- Bảng xếp hạng mô hình theo MAE trung bình các fold
- Biểu đồ đường: directional_accuracy theo từng fold cho mỗi mô hình
- Một đường ngang màu xám ở mức 50% để tôi thấy ngay mô hình nào
  chỉ đang đoán mò
- Toàn bộ CSS/JS inline, không gọi CDN
Publish thành artifact rồi đưa tôi link.
```

Lưu ý kỹ thuật: artifact chịu Content Security Policy nghiêm ngặt — không tải được script/CSS/ảnh từ host bên ngoài (ngoại lệ duy nhất là Google Fonts). Mọi thứ phải inline hoặc nhúng dạng `data:` URI.

---

## 7. SKILLS

> **RULE: Tạo skill khi bạn dán lại cùng một quy trình lần thứ ba — và viết `description` như một quảng cáo cho chính Claude, vì đó là thứ duy nhất Claude thấy trước khi quyết định có mở skill hay không.**

**Skill** là một năng lực đóng gói: hướng dẫn + metadata + tài nguyên tuỳ chọn (script, template) mà Claude tự dùng khi thấy phù hợp ([tổng quan Agent Skills](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)). Claude Code tuân theo chuẩn mở [agentskills.io](https://agentskills.io).

### Cấu trúc SKILL.md

```markdown
---
name: backtest-crypto-model
description: Chạy backtest walk-forward cho mô hình dự đoán giá crypto và
  sinh báo cáo chuẩn. Dùng khi người dùng nhắc tới backtest, đánh giá mô hình,
  walk-forward, out-of-sample, hoặc hỏi mô hình có tốt không.
---

# Backtest mô hình crypto

## Quy trình
1. Nạp dữ liệu từ data/*.parquet, sắp xếp theo open_time tăng dần.
2. Chia walk-forward: 6 fold, mỗi fold train 180 ngày, test 30 ngày,
   KHÔNG shuffle, KHÔNG random split.
3. Với mỗi fold: fit mô hình, dự đoán, tính MAE / RMSE /
   directional accuracy / Sharpe của chiến lược long-short đơn giản.
4. LUÔN tính baseline "dự đoán = 0" và baseline "dự đoán = return trước đó".
5. Sinh báo cáo theo mẫu trong reference/report_template.md.

## Cảnh báo bắt buộc nêu trong báo cáo
- Nếu directional accuracy < 52%, ghi rõ: mô hình chưa có tín hiệu thực.
- Nếu Sharpe > 3, ghi rõ: nghi ngờ rò rỉ dữ liệu, kiểm tra lại shift(1).
```

**Trường frontmatter — hai trường bắt buộc:**

| Trường | Yêu cầu |
|---|---|
| `name` | ≤ 64 ký tự, chỉ chữ thường/số/gạch nối, không chứa "anthropic" hay "claude" |
| `description` | Không rỗng, ≤ 1024 ký tự, phải nói **cái gì** và **khi nào** dùng |

**Trường tuỳ chọn trong Claude Code:** `allowed-tools`, `disallowed-tools`, `disable-model-invocation` (đặt `true` để chỉ bạn gọi được bằng `/tên`), `user-invocable` (đặt `false` để chỉ Claude gọi), `license`, `compatibility`, `metadata`.

### Claude quyết định dùng skill thế nào — "progressive disclosure"

Tài liệu mô tả ba tầng nạp:

- **Tầng 1 (luôn nạp):** chỉ `name` + `description`, khoảng **~100 token mỗi skill**. Claude so khớp `description` với yêu cầu của bạn.
- **Tầng 2 (khi kích hoạt):** toàn bộ thân `SKILL.md` được nạp, thường dưới 5k token.
- **Tầng 3 (khi cần):** file phụ, script. Script chạy qua bash và **chỉ output vào context** — bản thân code không tốn token.

Vì vậy `description` là tất cả. Viết ở **ngôi thứ ba** ("Chạy backtest..."), không phải "Tôi có thể giúp bạn...". Nhồi từ khoá kích hoạt vào.

### Nơi đặt skill

| Phạm vi | Đường dẫn |
|---|---|
| Cá nhân | `~/.claude/skills/<tên>/SKILL.md` |
| Dự án | `.claude/skills/<tên>/SKILL.md` |
| Plugin | `<plugin>/skills/<tên>/SKILL.md` → gọi bằng `/plugin:tên` |

**Lưu ý quan trọng cho bạn:** phiên **Cowork và phiên cloud KHÔNG đọc `~/.claude/skills/` trên máy bạn**. Chúng nạp các skill bạn đã bật cho tài khoản claude.ai, đồng bộ lúc bắt đầu phiên — quản lý ở mục **Customize** trong sidebar desktop app, hoặc trong phần cài đặt skills trên claude.ai.

### Best practices (từ tài liệu chính thức)

- Thân `SKILL.md` **dưới 500 dòng**.
- Đặt tên dạng danh động từ: `processing-pdfs`, `analyzing-spreadsheets` — tránh `helper`, `utils`, `tools`.
- Tham chiếu file phụ **chỉ một tầng** từ SKILL.md.
- Tránh thông tin gắn mốc thời gian ("nếu bạn làm trước tháng 8/2025...").
- Dùng thuật ngữ nhất quán: đã chọn "endpoint" thì đừng lúc gọi "URL", lúc gọi "route".
- Viết **3+ bài đánh giá (eval)** trước khi viết tài liệu dài.

### skill-creator

Anthropic có sẵn skill tên **`skill-creator`** trong repo công khai [github.com/anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/skill-creator) — nó phỏng vấn bạn rồi sinh ra skill. Trong môi trường Cowork/Claude Code có bật, gọi bằng:

```text
/skill-creator

Tôi muốn tạo một skill tên "backtest-crypto-model". Mỗi lần tôi bảo
"backtest mô hình này", tôi luôn phải nhắc lại: dùng walk-forward 6 fold,
luôn so với baseline dự đoán-bằng-0, và cảnh báo tôi nếu Sharpe > 3
vì đó gần như chắc chắn là rò rỉ dữ liệu. Giúp tôi đóng gói quy trình này.
```

---

## 8. PLUGINS & MARKETPLACES

> **RULE: Skill lẻ dành cho bạn; plugin dành cho lúc bạn muốn *phát cho người khác* — và chỉ cài plugin từ nguồn bạn tin, vì plugin mang theo cả hook và MCP server chạy được lệnh.**

**Plugin** là thư mục tự chứa gói nhiều thành phần lại. Cấu trúc chuẩn ([tài liệu plugins](https://code.claude.com/docs/en/plugins)):

| Thư mục | Nội dung |
|---|---|
| `.claude-plugin/plugin.json` | Manifest: `name`, `description`, `version`, `author` |
| `skills/` | Các skill dạng `<tên>/SKILL.md` |
| `agents/` | Định nghĩa subagent |
| `hooks/hooks.json` | Trình xử lý sự kiện |
| `.mcp.json` | Cấu hình MCP server |
| `.lsp.json` | Language server |
| `monitors/monitors.json` | Monitor chạy nền |
| `bin/` | File thực thi được thêm vào PATH của Bash tool |

**Lỗi phổ biến nhất:** đặt `skills/`, `agents/`, `hooks/` **bên trong** `.claude-plugin/`. Chỉ `plugin.json` nằm trong đó; mọi thư mục khác nằm ở gốc plugin.

Anthropic duy trì hai marketplace công khai: **`claude-plugins-official`** (Anthropic tuyển chọn, tự đăng ký lần đầu bạn chạy Claude Code) và **`claude-community`** (cộng đồng, qua kiểm duyệt).

```bash
# Thêm marketplace cộng đồng
claude plugin marketplace add anthropics/claude-plugins-community

# Quản lý plugin trong phiên
/plugin

# Thử plugin bạn tự viết mà không cần cài
claude --plugin-dir ./my-crypto-plugin

# Kiểm tra plugin trước khi phát hành
claude plugin validate ./my-crypto-plugin
```

**Ví dụ dự án crypto:** giả sử sau vài tháng bạn có 4 skill (`fetch-binance-data`, `backtest-crypto-model`, `feature-audit`, `deploy-dashboard`), một subagent `data-quality-checker`, và một hook chặn commit khi test fail. Bạn gói tất cả thành plugin `crypto-quant`:

```
crypto-quant/
├── .claude-plugin/plugin.json
├── skills/
│   ├── fetch-binance-data/SKILL.md
│   ├── backtest-crypto-model/SKILL.md
│   ├── feature-audit/SKILL.md
│   └── deploy-dashboard/SKILL.md
├── agents/data-quality-checker.md
└── hooks/hooks.json
```

Giờ trên máy mới, hoặc khi bạn mở dự án ETH riêng, chỉ cần cài plugin là có đủ bộ. Skill của plugin được đặt namespace: `/crypto-quant:backtest-crypto-model`.

---

## 9. MCP (MODEL CONTEXT PROTOCOL)

> **RULE: Thêm MCP server khi bạn thấy mình đang copy dữ liệu từ công cụ khác dán vào chat — và nhớ rằng mỗi server bạn thêm đều tốn context và mở rộng bề mặt tấn công.**

**MCP** là chuẩn mở để nối công cụ AI với nguồn dữ liệu ngoài. Một **connector** là một MCP server đã được kết nối vào tài khoản của bạn ([tài liệu MCP](https://code.claude.com/docs/en/mcp)).

### Thêm server

```bash
# Server từ xa qua HTTP
claude mcp add --transport http <tên> <url>
claude mcp add --transport http notion https://mcp.notion.com/mcp

# Server từ xa qua SSE
claude mcp add --transport sse <tên> <url>

# Server chạy trên máy (stdio) — mọi thứ sau -- là lệnh chạy server
claude mcp add --env API_KEY=xxx --transport stdio myserver -- python server.py

# Quản lý
claude mcp list        # xem trạng thái: ✔ Connected / ! Needs authentication / ✘ Failed
claude mcp get <tên>
claude mcp remove <tên>
/mcp                   # panel trong phiên: xem tool, OAuth
```

**Ba phạm vi cài đặt:** `local` (mặc định, chỉ bạn trên máy này), `project` (ghi vào `.mcp.json` ở gốc repo, commit được, cả team dùng), `user` (mọi dự án của bạn). Thêm `--scope project` hoặc `--scope user`.

Với **Cowork**, connector là các tích hợp claude.ai trên tài khoản bạn, quản lý ở [claude.ai/customize/connectors](https://claude.ai/customize/connectors). Điểm bảo mật quan trọng: **token uỷ quyền của connector không bao giờ đi vào sandbox — lời gọi connector được thực hiện phía server**.

### Tự viết MCP server

Có hai đường đã kiểm chứng:
- Plugin chính thức **`mcp-server-dev`**: chạy `/mcp-server-dev:build-mcp-server` để Claude dựng khung server cho bạn.
- Skill **`mcp-builder`** trong repo [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/mcp-builder).

**Ví dụ dự án crypto — MCP server riêng cho dữ liệu sàn:**

```text
/mcp-builder

Tôi cần một MCP server Python tên "binance-data" phơi ra 3 tool:
1. get_klines(symbol, interval, start_ms, end_ms) -> trả nến OHLCV,
   tự xử lý phân trang (Binance giới hạn 1000 nến/lần) và
   tôn trọng rate limit 1200 request/phút.
2. get_funding_rate(symbol, start_ms, end_ms) -> funding rate hợp đồng vĩnh cửu.
3. list_symbols(quote_asset) -> danh sách cặp giao dịch đang hoạt động.

API key đọc từ biến môi trường BINANCE_KEY / BINANCE_SECRET,
tuyệt đối không log ra. Chỉ dùng endpoint public read-only —
server này KHÔNG được có bất kỳ tool nào đặt lệnh giao dịch.
Kèm test với response mock.
```

Ràng buộc cuối cùng đó là thói quen tốt cần tập ngay: giữ tool đọc và tool ghi ở hai server khác nhau. Một agent không thể đặt lệnh nhầm nếu nó vốn không có tool đặt lệnh.

Ngoài server tự viết, hai connector hữu ích cho bạn: một **MCP PostgreSQL/DuckDB** để Claude query trực tiếp bảng predictions thay vì bạn export CSV, và **GitHub connector** cho luồng PR.

---

## 10. SUBAGENTS / AGENT TOOL

> **RULE: Uỷ thác khi công việc sinh ra nhiều output rác nhưng kết quả gói gọn trong một bản tóm tắt — đừng uỷ thác việc cần bạn góp ý qua lại liên tục.**

**Subagent** là một trợ lý chuyên biệt chạy trong **context window riêng biệt, cô lập**. Nó làm việc độc lập rồi chỉ trả về một bản tóm tắt cho cuộc hội thoại chính ([tài liệu subagents](https://code.claude.com/docs/en/sub-agents)).

Bốn lợi ích tài liệu nêu: giữ context chính sạch, ép ràng buộc tool, tái dùng cấu hình, và kiểm soát chi phí (định tuyến việc nhẹ sang model rẻ như Haiku).

**Context của subagent gồm:** system prompt của chính nó, thông điệp uỷ thác, các file `CLAUDE.md`, ảnh chụp git status, skill được preload.
**KHÔNG gồm:** lịch sử hội thoại của bạn, các file bạn đã đọc, skill bạn đã gọi.

### Tạo subagent

Đặt tại `.claude/agents/` (theo dự án) hoặc `~/.claude/agents/` (cá nhân):

```markdown
---
name: leakage-hunter
description: Săn lỗi rò rỉ dữ liệu tương lai (lookahead bias) trong code
  feature engineering cho chuỗi thời gian tài chính. Dùng proactively sau
  khi thêm hoặc sửa bất kỳ feature nào.
tools: Read, Grep, Glob
model: sonnet
---

Bạn là chuyên gia kiểm tra rò rỉ dữ liệu trong mô hình chuỗi thời gian tài chính.

Với mỗi feature trong code, trả lời chính xác một câu hỏi:
"Tại thời điểm t, feature này có dùng bất kỳ thông tin nào từ index >= t không?"

Đặc biệt soi:
- rolling/ewm/expanding không kèm shift(1)
- fillna(method='bfill') — điền ngược là rò rỉ
- scaler fit trên toàn bộ dữ liệu thay vì chỉ tập train
- resample rồi merge mà không kiểm tra biên nhãn thời gian
- target được tính rồi vô tình lọt vào danh sách feature

Trả về: bảng gồm tên feature | file:dòng | mức rủi ro | lý do một câu.
Không sửa code. Chỉ báo cáo.
```

Trường tuỳ chọn: `tools` (allowlist), `disallowedTools` (denylist), `model` (`sonnet`/`opus`/`haiku`/`inherit`), `permissionMode`, `memory`, `skills`, `isolation: worktree`.

Ba subagent có sẵn: **Explore** (tìm kiếm codebase, read-only), **Plan** (nghiên cứu cho plan mode, read-only), **General-purpose** (đa bước, đủ tool).

**Gọi subagent:**

```text
Dùng leakage-hunter kiểm tra toàn bộ src/features.py
```

Hoặc `@"leakage-hunter"` để chắc chắn nó chạy.

**Khi nào uỷ thác có lợi (ví dụ crypto):**

| Việc | Nên uỷ thác? |
|---|---|
| Quét 40 file tìm rò rỉ dữ liệu | Có — output nhiều, kết quả là một bảng |
| Chạy 200 test rồi tóm tắt lỗi | Có — log rất dài |
| Nghiên cứu song song 3 thư viện TA khác nhau | Có — 3 subagent chạy đồng thời |
| Cùng bạn tinh chỉnh siêu tham số qua nhiều vòng | Không — cần trao đổi liên tục |
| Sửa một dòng trong `config.py` | Không — thêm độ trễ vô ích |

---

## 11. PLAN MODE

> **RULE: Bật plan mode cho mọi thay đổi bạn không thể tự sửa lại trong 5 phút — đọc kế hoạch còn rẻ hơn đọc diff.**

Plan mode bảo Claude **nghiên cứu và đề xuất thay đổi mà không thực hiện**. Claude đọc file, chạy lệnh để khám phá, viết ra kế hoạch, nhưng không sửa source. Edit bị chặn cho tới khi bạn duyệt kế hoạch ([permission modes](https://code.claude.com/docs/en/permission-modes)).

Vào plan mode:
- Bấm **`Shift+Tab`** để xoay vòng chế độ, tới khi thanh trạng thái hiện `⏸ plan mode on`
- Hoặc gõ `/plan` để áp cho một prompt
- Hoặc khởi động bằng `claude --permission-mode plan`

Bấm `Shift+Tab` lần nữa để thoát mà không duyệt.

Các chế độ quyền hiện có: `default` (Manual — hỏi trước hầu hết hành động), `acceptEdits`, `plan`, `auto` (một model phân loại tự duyệt hành động, là chế độ khởi đầu mặc định trên gói Pro/Max/Team), `dontAsk`, `bypassPermissions`.

**Ví dụ dự án crypto:**

```text
[Bấm Shift+Tab cho tới khi thấy ⏸ plan mode on]

Tôi muốn thêm dự đoán đa khung thời gian: hiện tại chỉ có 1h,
tôi muốn có cả 4h và 1d, dùng chung pipeline feature.
Đọc src/ và tests/ rồi lập kế hoạch. Nêu rõ:
- Những file nào cần sửa và sửa gì
- Có cần đổi schema dữ liệu không
- Test nào sẽ hỏng
- Chỗ nào có rủi ro rò rỉ dữ liệu khi trộn khung thời gian
Đừng sửa gì cả cho tới khi tôi duyệt.
```

Đọc kế hoạch. Nếu Claude định gộp khung 4h bằng cách resample *tương lai* — bạn bắt được lỗi đó ngay trong 30 giây, thay vì sau 3 giờ debug một mô hình có Sharpe 4.2 giả tạo.

---

## 12. SLASH COMMANDS & LỆNH TUỲ CHỈNH

> **RULE: Custom command giờ CHÍNH LÀ skill — nếu bạn muốn có `/lệnh-của-tôi`, hãy viết một skill.**

Tài liệu nói rõ: "**Custom commands đã được hợp nhất vào skills.**" Một file ở `.claude/commands/deploy.md` và một skill ở `.claude/skills/deploy/SKILL.md` đều tạo ra `/deploy` và hoạt động như nhau. File `.claude/commands/` cũ vẫn chạy, nhưng skill có thêm: thư mục chứa file phụ, frontmatter điều khiển ai được gọi, và khả năng Claude tự nạp khi thấy liên quan.

**Các lệnh có sẵn đáng nhớ** ([tham chiếu commands](https://code.claude.com/docs/en/commands)):

| Lệnh | Công dụng |
|---|---|
| `/init` | Sinh `CLAUDE.md` khởi đầu bằng cách phân tích codebase |
| `/context` | Xem context đang dùng bao nhiêu, gợi ý tối ưu |
| `/compact` | Tóm tắt hội thoại để giải phóng context (nhận cả chỉ dẫn trọng tâm) |
| `/clear` | Bắt đầu hội thoại mới, giữ project memory |
| `/plan` | Vào plan mode |
| `/memory` | Sửa CLAUDE.md, bật/tắt auto memory, xem memory |
| `/skills`, `/hooks`, `/mcp`, `/plugin`, `/agents` | Quản lý từng loại phần mở rộng |
| `/permissions` | Quản lý luật allow/ask/deny |
| `/review` (hay `/code-review`) | Review diff/PR tìm bug (có chế độ `--fix`) |
| `/security-review` | Soi diff tìm lỗ hổng bảo mật |
| `/rewind` | Quay code + hội thoại về checkpoint |
| `/usage` (alias `/cost`) | Xem token/chi phí |
| `/doctor` | Kiểm tra cấu hình, chẩn đoán sự cố |
| `/schedule` | Tạo routine chạy định kỳ |
| `/subtask` | Giao việc phụ cho subagent |
| `/diff` | Xem diff tương tác |

Bạn **nối được tối đa 6 skill**: `/skill-a /skill-b làm XYZ`.

**Ví dụ dự án crypto — command riêng.** Tạo `.claude/skills/daily-check/SKILL.md`:

```markdown
---
name: daily-check
description: Kiểm tra sức khoẻ hằng ngày của pipeline dự đoán crypto.
disable-model-invocation: true
---

Chạy theo đúng thứ tự và báo cáo gọn:
1. `python -m src.data_check` — có gap nến mới không?
2. `pytest -q tests/test_no_leakage.py` — test chống rò rỉ còn xanh không?
3. `python -m src.eval --last-7d` — MAE 7 ngày qua so với MAE lúc train
   lệch bao nhiêu %?
4. Nếu MAE tệ hơn 25% so với lúc train: in cảnh báo IN HOA rằng
   mô hình có dấu hiệu drift và nên retrain.
5. Kết luận trong 3 dòng. Không dài dòng.
```

Từ giờ mỗi sáng bạn chỉ gõ `/daily-check`. `disable-model-invocation: true` đảm bảo Claude không tự ý chạy nó giữa việc khác.

---

## 13. HOOKS (CLAUDE CODE)

> **RULE: Dùng hook cho những gì phải xảy ra CHẮC CHẮN 100% — CLAUDE.md là lời khuyên, hook là luật.**

Tài liệu nói thẳng điều này: CLAUDE.md và memory là *context*, không phải cấu hình được cưỡng chế. "Để chặn một hành động bất kể Claude quyết định thế nào, hãy dùng PreToolUse hook."

**Hook** là lệnh shell do bạn định nghĩa, Claude Code chạy tại các mốc trong vòng đời ([tài liệu hooks](https://code.claude.com/docs/en/hooks-guide)).

**Các sự kiện chính:**

| Sự kiện | Khi nào |
|---|---|
| `SessionStart` | Phiên bắt đầu hoặc tiếp tục |
| `UserPromptSubmit` | Bạn gửi prompt, trước khi Claude xử lý |
| `PreToolUse` | Trước khi một tool chạy — **chặn được** |
| `PostToolUse` | Sau khi tool chạy thành công |
| `PostToolUseFailure` | Sau khi tool thất bại |
| `Notification` | Claude cần bạn chú ý |
| `SubagentStop` | Subagent xong việc |
| `PreCompact` | Trước khi nén context |
| `SessionEnd` | Phiên kết thúc |

Cấu hình trong `settings.json` (`~/.claude/settings.json` cho cá nhân, `.claude/settings.json` cho dự án). Gõ `/hooks` để mở trình duyệt hook.

**Cơ chế chặn:** script nhận JSON qua stdin, ghi ra stdout/stderr và thoát với mã cụ thể. **Exit 0** = không phản đối. **Exit 2** = Claude Code **chặn** hành động, thông điệp trên stderr được đưa lại cho Claude làm phản hồi.

**Ví dụ dự án crypto — hai hook đáng giá:**

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | grep -E '\\.py$' && ruff format . && ruff check --fix ."
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/block_live_trading.sh"
          }
        ]
      }
    ]
  }
}
```

Với `~/.claude/hooks/block_live_trading.sh`:

```bash
#!/usr/bin/env bash
cmd=$(jq -r '.tool_input.command // ""')
if echo "$cmd" | grep -qE 'api/v3/order|POST.*binance|--live-trade'; then
  echo "CHẶN: lệnh này có thể đặt lệnh giao dịch thật. Dự án này chỉ nghiên cứu, không giao dịch tự động." >&2
  exit 2
fi
exit 0
```

Đây là loại bảo vệ mà bạn *thật sự* muốn có trong một dự án crypto. Nó không phụ thuộc vào việc Claude có nhớ đọc CLAUDE.md hay không.

---

## 14. SCHEDULED TASKS / ROUTINES

> **RULE: Routine chạy trên cloud kể cả khi máy bạn tắt; scheduled task trên desktop chạy trên máy bạn và cần máy bật — chọn theo việc đó có cần file local hay không.**

Có bốn cách chạy Claude theo lịch, khác nhau rõ rệt:

| Cách | Chạy ở đâu | Hợp với |
|---|---|---|
| **Routines** | Cloud (hạ tầng Anthropic) | Việc phải chạy khi máy tắt; kích hoạt được cả bằng API và sự kiện GitHub |
| **Desktop scheduled tasks** | Máy bạn, qua desktop app | Việc cần file local, tool local, thay đổi chưa commit |
| **GitHub Actions** | CI của bạn | Việc gắn với sự kiện repo |
| **`/loop`** | Ngay trong phiên CLI đang mở | Polling nhanh khi phiên còn mở |

**Routines** đang ở giai đoạn *research preview* (hành vi và giới hạn có thể đổi). Chi tiết đã kiểm chứng ([tài liệu routines](https://code.claude.com/docs/en/routines)):

- Có trên Pro, Max, Team, Enterprise **có bật Claude Code on the web**
- Tạo tại [claude.ai/code/routines](https://claude.ai/code/routines), trong desktop app, hoặc gõ `/schedule` trong CLI
- Ba loại trigger: **Scheduled** (định kỳ hoặc một lần), **API** (POST tới endpoint riêng kèm bearer token), **GitHub** (sự kiện pull request hoặc release)
- **Khoảng cách tối thiểu là 1 giờ** — biểu thức cron dày hơn bị từ chối
- Chạy **hoàn toàn tự động: không có bộ chọn chế độ quyền, không có prompt xin phép**
- Có **hạn mức số lần chạy mỗi ngày** cho mỗi tài khoản; run một lần (one-off) không tính vào hạn mức này
- Cảnh báo quan trọng: **trạng thái xanh chỉ nghĩa là phiên khởi động và thoát không lỗi hạ tầng — KHÔNG có nghĩa là việc trong prompt đã thành công.** Phải mở transcript ra đọc.

**Khác với nhắc nhở trong phiên:** một reminder gửi trễ quay lại *chính cuộc hội thoại này* (phiên tiếp tục, nhớ mọi thứ). Một routine **bắt đầu phiên hoàn toàn mới, không có ký ức gì** — nên prompt của routine phải tự chứa đầy đủ.

**Ví dụ dự án crypto — routine retrain hằng đêm:**

```text
/schedule mỗi ngày lúc 2 giờ sáng, retrain mô hình dự đoán crypto
```

Rồi viết prompt tự chứa như sau:

```text
Trong repo nam/crypto-predictor:

1. Chạy `python -m src.fetch --symbol BTCUSDT --interval 1h --update`
   để lấy nến mới nhất từ Binance.
2. Chạy `python -m src.train --walk-forward` để retrain LightGBM.
3. So MAE mô hình mới với MAE ghi trong models/current_metrics.json.
4. NẾU mô hình mới tốt hơn ít nhất 2%:
   - Lưu vào models/candidate.pkl
   - Mở PR lên nhánh main, tiêu đề "retrain: MAE cải thiện X%",
     mô tả kèm bảng so sánh metric của cả hai mô hình
5. NẾU KHÔNG tốt hơn: không mở PR. Ghi một dòng vào logs/retrain.log
   nêu ngày và MAE, rồi kết thúc.
6. NẾU bước nào lỗi: dừng lại, tóm tắt lỗi rõ ràng, không mở PR.

Thành công nghĩa là: hoặc có một PR mở với bảng metric, hoặc có một dòng
log giải thích vì sao không retrain. Không có kết quả nào khác được chấp nhận.
```

Chú ý cách prompt định nghĩa rõ "thành công là gì". Routine không hỏi lại được, nên mọi nhánh quyết định phải nằm sẵn trong prompt.

---

## 15. TASK LISTS & THEO DÕI TIẾN ĐỘ

> **RULE: Với việc trên 3 bước, hãy yêu cầu Claude viết ra checklist TRƯỚC — bạn sẽ thấy ngay nó hiểu sai ở bước nào, khi việc sửa còn rẻ.**

Claude Code có bộ tool quản lý danh sách việc: `TaskCreate`, `TaskGet`, `TaskList`, `TaskUpdate`. Theo [tham chiếu tool](https://code.claude.com/docs/en/tools-reference), các tool này **không bật mặc định trên các model mới nhất** (Opus 4.8+, Sonnet 5+, Fable 5+); bật bằng biến môi trường `CLAUDE_CODE_ENABLE_TODO_TOOLS=1`. Tool `TodoWrite` cũ cũng tắt mặc định.

Nhưng đừng lệ thuộc cơ chế nội bộ. Cách theo dõi tiến độ đáng tin nhất là **yêu cầu checklist ngay trong prompt** — nó hoạt động trên mọi bề mặt, mọi model, và bạn đọc được.

Tài liệu best practices cho skill cũng khuyên đúng cách này: cung cấp checklist mà Claude copy lại và tự đánh dấu.

**Ví dụ dự án crypto:**

```text
Tôi muốn đưa dashboard FastAPI lên production. Trước khi viết bất kỳ dòng code nào,
hãy đưa tôi một checklist các bước, dạng:

Tiến độ triển khai:
- [ ] Bước 1: ...
- [ ] Bước 2: ...

Sau khi tôi duyệt checklist, làm từng bước một. Sau MỖI bước, in lại
toàn bộ checklist với ô đã tick, kèm một dòng nói bạn vừa làm gì.
Nếu bước nào thất bại, DỪNG LẠI, đừng làm tiếp bước sau.
```

Câu cuối quan trọng. Không có nó, một agent gặp lỗi ở bước 3 vẫn hồn nhiên chạy tiếp bước 7 và bạn nhận về một mớ hỗn độn.

---

## 16. WEB SEARCH & FETCH

> **RULE: Search trả về TIÊU ĐỀ VÀ URL, fetch mới đọc được nội dung — và cả hai đều nhìn thấy internet công khai, không nhìn thấy dữ liệu real-time của bạn.**

Hai tool riêng biệt, hay bị nhầm:

**WebSearch** tìm kiếm web, trả về khối kết quả gồm tiêu đề và URL. Giới hạn đã kiểm chứng ([tham chiếu tool](https://code.claude.com/docs/en/tools-reference)):
- **Chỉ hoạt động ở Mỹ (US-only)** — đây là hạn chế thật, đáng lưu ý với bạn ở Việt Nam
- Tối đa 8 lần tinh chỉnh nội bộ mỗi lần gọi
- Hỗ trợ `allowed_domains` / `blocked_domains`
- **Không tự đọc nội dung trang** — phải dùng WebFetch

**WebFetch** tải một URL, chuyển HTML sang Markdown, rồi trả lời câu hỏi của bạn về nội dung đó:
- **Cache 15 phút mỗi URL** — fetch lại ngay sau đó sẽ ra bản cũ
- Tự nâng HTTP lên HTTPS
- **Redirect khác host không tự đi theo**: nó trả URL mới về cho bạn, bạn phải gọi lần hai (tôi gặp đúng điều này khi soạn cuốn sổ tay này — `docs.claude.com` chuyển hướng sang `code.claude.com`)
- Trang lớn bị cắt bớt
- Thất bại với URL cần đăng nhập

**Điều quan trọng nhất phải hiểu:** đây **không phải** nguồn dữ liệu giá real-time. Với dự án crypto, đừng bao giờ dùng web search để lấy giá. Dùng MCP server Binance của bạn, hoặc gọi API trực tiếp qua code.

**Ví dụ dự án crypto — dùng đúng cách:**

```text
Tìm giúp tôi tài liệu chính thức của Binance về endpoint /api/v3/klines:
giới hạn số nến mỗi lần gọi là bao nhiêu, weight của request là bao nhiêu,
và rate limit theo IP hiện tại thế nào. Đọc trang tài liệu thật rồi
trích dẫn con số cụ thể, đừng đoán.
```

Dùng sai cách: *"Giá BTC hiện tại bao nhiêu?"* → kết quả có thể cũ vài giờ hoặc vài ngày, tuỳ trang được index. Với dữ liệu giá, luôn đi qua API.

---

## 17. CLAUDE IN CHROME

> **RULE: Claude in Chrome dùng chính phiên đăng nhập của bạn — nghĩa là nó vào được mọi nơi bạn đang đăng nhập, nên hãy cấp quyền theo từng site, đừng cấp toàn cục.**

Extension Claude in Chrome cho phép Claude thao tác trên trình duyệt: click, gõ, đọc console, đọc network request, chụp màn hình, tải file lên. Claude mở tab mới và **dùng chung trạng thái đăng nhập của trình duyệt bạn** ([Claude Code với Chrome](https://code.claude.com/docs/en/chrome)). Khi gặp trang đăng nhập hoặc CAPTCHA, nó dừng lại và nhờ bạn xử lý tay.

### Mô hình quyền — phần bạn phải đọc kỹ

Ba chế độ ([hướng dẫn quyền](https://support.claude.com/en/articles/12902446-claude-in-chrome-permissions-guide)):

1. **Manually Approve** — Claude dừng xin phép trước mỗi hành động, kèm kế hoạch chi tiết
2. **Automatically Approve** — Claude làm liên tục, có kiểm tra an toàn chạy nền, tự chặn hành động nguy hiểm. **Tốn quota nhiều hơn** vì có bước kiểm tra thêm
3. **Skip All Approvals** — không gián đoạn, **không có kiểm tra an toàn tự động**

Với mỗi site, bạn chọn: cho phép lần này / luôn cho phép trên site này / từ chối. Xem lại và thu hồi trong cài đặt extension, mục **"Your approved sites"**.

**Luôn cần xin phép rõ ràng:** tải file xuống, nhập thông tin nhạy cảm, cấp uỷ quyền.

**Bị chặn hoàn toàn ở MỌI chế độ** — đây là điểm cực kỳ quan trọng với dân crypto:
- Giao dịch tài chính hoặc mua hàng
- Tạo tài khoản
- Xoá vĩnh viễn
- Xử lý dữ liệu thẻ tín dụng/giấy tờ tuỳ thân
- **Tư vấn đầu tư hoặc giao dịch (trading)**
- Sửa file hệ thống

Nói cách khác: **Claude in Chrome sẽ không đặt lệnh trên sàn giúp bạn.** Đó là thiết kế có chủ đích, và là thiết kế đúng.

Dùng từ Claude Code:

```bash
claude --chrome
# rồi trong phiên:
/chrome    # kiểm tra kết nối, quản lý quyền, chọn trình duyệt
```

Trong **plan mode**, các lời gọi chỉ-đọc (`read_page`, `get_page_text`, `find`, đọc console/network, chụp màn hình) chạy không cần hỏi; các lời gọi thay đổi trạng thái (click, gõ, điều hướng) thì hỏi.

Giới hạn upload: tối đa **10 MB tổng mỗi lần**.

**Ví dụ dự án crypto — dùng hợp lệ:**

```text
Mở dashboard FastAPI của tôi ở localhost:8000, chuyển bộ lọc timeframe
sang "4h", đợi biểu đồ vẽ xong, rồi đọc console xem có lỗi JavaScript nào không.
Chụp màn hình lưu vào ./screenshots/dashboard_4h.png.
```

Đây là ca dùng lý tưởng: kiểm thử giao diện của chính bạn, không đụng tới tiền thật.

---

## 18. GIT/GITHUB VỚI CLAUDE

> **RULE: Để Claude viết commit message và mô tả PR (nó đọc diff kỹ hơn bạn lúc 11 giờ đêm), nhưng ĐỌC LẠI diff trước khi merge — luôn luôn.**

Claude Code làm việc trực tiếp với git: stage thay đổi, viết commit message, tạo nhánh, mở pull request ([common workflows](https://code.claude.com/docs/en/common-workflows)).

**Các prompt cơ bản:**

```text
commit thay đổi của tôi với message mô tả rõ ràng
```

```text
tóm tắt những gì tôi đã sửa trong module feature engineering
```

```text
tạo pr
```

```text
bổ sung vào mô tả PR phần giải thích vì sao thay đổi này ảnh hưởng
tới kết quả backtest
```

Claude dùng `gh` CLI cho các thao tác GitHub. Sau khi Claude tạo PR bằng `gh pr create`, bạn tìm lại phiên đó bằng `claude --from-pr 1234`.

**Code review:** gõ `/review` (hoặc `/code-review`) để review diff hoặc PR tìm bug, hỗ trợ chế độ `--fix`. Gõ `/security-review` để soi lỗ hổng bảo mật.

**Tự động hoá:** [GitHub Actions](https://code.claude.com/docs/en/github-actions) cho review PR và phân loại issue trong CI, hoặc GitHub trigger của routine (`pull_request.opened`, `release.published`) với bộ lọc theo tác giả, tiêu đề, nhãn, nhánh đích, trạng thái draft/merged.

**Ví dụ dự án crypto — quy trình review chặt:**

```text
Tôi vừa thêm 6 feature mới vào src/features.py. Trước khi tôi commit:

1. Chạy /security-review trên diff — đặc biệt tìm xem có API key nào
   bị hard-code hoặc lọt vào log không.
2. Dùng subagent leakage-hunter kiểm tra 6 feature mới.
3. Chạy pytest -q và báo kết quả.
4. CHỈ KHI cả ba bước trên sạch: commit với message theo dạng
   "feat(features): thêm <danh sách feature>" và mở PR.
   Trong mô tả PR, ghi rõ 6 feature này thay đổi số chiều đầu vào
   của mô hình từ bao nhiêu thành bao nhiêu.
5. Nếu bất kỳ bước nào thất bại: dừng, báo cáo, KHÔNG commit.
```

Một cảnh báo thật lòng: Claude viết commit message rất tốt và điều đó tạo ảo giác rằng thay đổi cũng tốt. Chúng là hai chuyện khác nhau. Với code động tới tiền, hãy đọc diff.

---

## 19. CLAUDE.md

> **RULE: Viết vào CLAUDE.md những gì bạn phải gõ lại lần thứ hai — và giữ nó dưới 200 dòng, vì file dài làm giảm mức độ tuân thủ.**

`CLAUDE.md` là file markdown Claude Code đọc ở đầu **mỗi phiên**. Tài liệu nêu tiêu chí rất rõ về thời điểm nên thêm vào ([tài liệu memory](https://code.claude.com/docs/en/memory)):

- Claude mắc cùng một lỗi lần thứ hai
- Code review bắt được điều lẽ ra Claude phải biết về codebase này
- Bạn gõ lại đúng câu chỉnh sửa mà bạn đã gõ phiên trước
- Một người mới vào team sẽ cần đúng bối cảnh đó

**Vị trí file, theo thứ tự nạp từ rộng tới hẹp:**

| Phạm vi | Vị trí |
|---|---|
| Managed policy (tổ chức) | macOS: `/Library/Application Support/ClaudeCode/CLAUDE.md` |
| User (cá nhân, mọi dự án) | `~/.claude/CLAUDE.md` |
| Project (chia sẻ qua git) | `./CLAUDE.md` hoặc `./.claude/CLAUDE.md` |
| Local (riêng bạn, gitignore) | `./CLAUDE.local.md` |

**Hướng dẫn viết đã kiểm chứng:**

- **Kích thước:** mục tiêu **dưới 200 dòng**. File trên 4 MiB bị bỏ qua hoàn toàn.
- **Cụ thể:** "Dùng thụt lề 2 space" tốt hơn "Format code cho đẹp".
- **Nhất quán:** hai luật mâu thuẫn thì Claude chọn bừa một cái.
- **Import:** dùng `@đường/dẫn` để nhập file khác (tối đa 4 tầng). Nhưng import **không giảm context** vì file được nạp lúc khởi động.
- **Rules theo đường dẫn:** đặt file trong `.claude/rules/` với frontmatter `paths:` để luật chỉ nạp khi Claude đụng vào file khớp mẫu. Đây là cách đúng khi hướng dẫn phình to.
- `/init` sinh CLAUDE.md khởi đầu bằng cách phân tích codebase.
- `/context` kiểm tra file nào đã thực sự nạp vào phiên.

**Cái gì KHÔNG thuộc về CLAUDE.md:** quy trình nhiều bước (→ skill), luật chỉ áp cho một phần codebase (→ `.claude/rules/` có `paths`), điều bắt buộc phải xảy ra (→ hook).

**Ví dụ dự án crypto — `CLAUDE.md` thật:**

```markdown
# crypto-predictor

Dự đoán log-return nến kế tiếp của BTCUSDT/ETHUSDT. Nghiên cứu, KHÔNG giao dịch tự động.

## Lệnh
- Cài: `uv sync`
- Test: `pytest -q`
- Format: `ruff format . && ruff check --fix .`
- Train: `python -m src.train --walk-forward`
- Dashboard: `uvicorn src.api:app --reload`

## Bố cục
- `src/fetch.py` — client Binance, có xử lý rate limit
- `src/features.py` — feature engineering (ĐỌC `.claude/rules/features.md` trước khi sửa)
- `src/train.py` — vòng lặp huấn luyện LightGBM
- `src/api.py` — dashboard FastAPI
- `data/*.parquet` — dữ liệu nến thô, KHÔNG commit lên git

## Quy ước
- Python 3.11, type hint mọi hàm public
- pandas, không polars (phần còn lại của repo dùng pandas)
- Test dữ liệu dùng fixture trong `tests/fixtures/`, không gọi mạng thật

## Luật bất di bất dịch
- Chuỗi thời gian: LUÔN walk-forward, KHÔNG BAO GIỜ random split.
- Mọi feature phải `.shift(1)` trước khi vào tập train.
- Scaler chỉ `fit` trên tập train của fold hiện tại.
- Không hard-code API key. Đọc từ `BINANCE_KEY` / `BINANCE_SECRET`.
- Không viết code gọi endpoint đặt lệnh của Binance. Repo này chỉ đọc.
- Khi báo cáo metric, LUÔN kèm baseline "dự đoán = 0".
```

---

## 20. CHI PHÍ & GIỚI HẠN

> **RULE: Context window là tài nguyên bạn tiêu, không phải thứ vô hạn — hãy `/clear` giữa các nhiệm vụ khác nhau thay vì để một phiên phình mãi.**

### Context window

Tài liệu [context window](https://code.claude.com/docs/en/context-window) mô tả những gì nạp vào *trước khi* bạn gõ chữ đầu tiên: system prompt, auto memory (`MEMORY.md`), thông tin môi trường, tên tool MCP, danh sách skill, các file `CLAUDE.md`. Với người mới, đây là phát hiện gây sốc: **phần lớn context của bạn đã bị chiếm trước khi bạn nói gì**.

Về kích thước: mô phỏng trong tài liệu dùng mốc 200.000 token làm ví dụ. Tài liệu cũng nêu rằng **Fable 5, Sonnet 5, Opus 4.6 trở lên, và Sonnet 4.6 hỗ trợ context window 1 triệu token**; Sonnet 5 chạy ở mức 1M mà không cần chọn biến thể `[1m]`. Mức context cụ thể cho từng gói và cho phiên Cowork — **cần kiểm tra lại** tại trang model-config, vì con số này thay đổi theo model bạn chọn.

**Nén (compaction):** khi context gần đầy, Claude Code tự nén, thay hội thoại bằng bản tóm tắt có cấu trúc. System prompt, CLAUDE.md, memory và MCP tool được nạp lại tự động. **Ngoại lệ: danh sách skill không được nạp lại — chỉ những skill bạn đã thực sự dùng mới được giữ.**

Ba lệnh cần thuộc:
- `/context` — xem context đang dùng cho gì, có gợi ý tối ưu
- `/compact focus vào bug rò rỉ dữ liệu` — nén nhưng giữ đúng phần bạn cần
- `/autocompact 500k` — đặt ngưỡng tự nén

### Giới hạn sử dụng

Theo [best practices về giới hạn](https://support.claude.com/en/articles/9797557-usage-limit-best-practices), các yếu tố ảnh hưởng: độ dài tin nhắn và câu trả lời, kích thước file đính kèm, độ dài hội thoại hiện tại, việc dùng tool (research, web search), model bạn chọn, và việc tạo artifact. Gói trả phí có giới hạn theo **phiên 5 giờ**; xem tại **Settings > Usage**.

Điểm quan trọng về tiết kiệm: **nội dung trong project được cache và không tính vào giới hạn khi tái sử dụng.** Đây là lý do rất thực tế để dùng Projects thay vì dán lại tài liệu.

Riêng **Routines** có thêm **hạn mức số lần chạy mỗi ngày** ngoài giới hạn subscription thông thường. Chế độ **auto mode** của Claude in Chrome tốn quota nhiều hơn vì có bước kiểm tra an toàn.

Con số giá cụ thể theo gói — **cần kiểm tra lại** tại claude.com/pricing, tôi không xác minh được trong lúc soạn tài liệu này.

### Bảy cách làm việc tiết kiệm (áp dụng cho dự án crypto)

1. **`/clear` giữa các nhiệm vụ.** Xong việc feature engineering, `/clear` rồi mới chuyển sang dashboard. Đừng kéo lê context của việc cũ.
2. **Uỷ thác việc sinh nhiều output cho subagent.** Quét 40 file tìm rò rỉ dữ liệu sẽ nhét cả 40 file vào context chính nếu bạn không uỷ thác.
3. **Đừng bật Chrome mặc định.** Tài liệu nói rõ: bật Chrome mặc định trong CLI làm tăng dùng context vì tool trình duyệt luôn được nạp.
4. **Gỡ MCP server không dùng.** Mỗi server tốn context.
5. **Giữ CLAUDE.md dưới 200 dòng.** Nó nạp vào *mỗi* phiên.
6. **Đặt tài liệu dài trong Project knowledge** thay vì dán lại — được cache.
7. **Dồn yêu cầu liên quan vào một tin nhắn** thay vì hỏi rời rạc từng câu.

---

## 21. BẢNG TRA CỨU NHANH

> **RULE: Trước khi tự viết một quy trình phức tạp, hãy tra bảng này — hầu hết việc bạn định làm thủ công đều đã có một feature làm sẵn.**

| Tôi muốn làm X | Dùng feature Y | Câu lệnh mẫu |
|---|---|---|
| Claude nhớ quy ước dự án qua mọi phiên | `CLAUDE.md` | `/init` rồi sửa file |
| Claude nhớ *sở thích của tôi* qua mọi phiên | Auto memory / Project instructions | `Ghi nhớ: tôi không muốn dùng deep learning cho bài toán này` |
| Đóng gói quy trình tôi lặp lại hoài | Skill | `/skill-creator` |
| Có phím tắt `/lệnh-của-tôi` | Skill với `disable-model-invocation: true` | Tạo `.claude/skills/daily-check/SKILL.md` |
| Bắt buộc format code sau mỗi lần sửa | Hook `PostToolUse` | Thêm vào `.claude/settings.json` |
| Chặn tuyệt đối lệnh nguy hiểm | Hook `PreToolUse` thoát mã 2 | Script kiểm tra rồi `exit 2` |
| Xem Claude định làm gì trước khi nó sửa | Plan mode | `Shift+Tab` tới `⏸ plan mode on` |
| Nghiên cứu mà không làm bẩn context | Subagent | `Dùng subagent điều tra cách pipeline xử lý gap dữ liệu` |
| Nối Claude với database / sàn | MCP server | `claude mcp add --transport stdio binance -- python server.py` |
| Retrain mô hình mỗi đêm khi máy tắt | Routine (cloud) | `/schedule mỗi ngày 2h sáng retrain mô hình` |
| Chạy việc cần file local theo lịch | Desktop scheduled task | Desktop app → Routines → New → **Local** |
| Đọc file trên máy Mac từ Cowork | Connected folder + stage | `Liệt kê ~/crypto/data rồi stage file parquet lên` |
| Lưu kết quả về máy Mac | Commit files | `Ghi report này về ~/crypto/reports/` |
| Dashboard xem được, chia sẻ được | Artifact (publish) | `Tạo trang HTML tự chứa rồi publish thành artifact` |
| Kiểm thử dashboard trên trình duyệt | Claude in Chrome | `claude --chrome` rồi `Mở localhost:8000 và đọc console` |
| Review code trước khi merge | `/review`, `/security-review` | `/review` |
| Commit + PR | Git tích hợp sẵn | `commit thay đổi và tạo pr` |
| Xem tôi đang tốn context vào đâu | `/context` | `/context` |
| Giải phóng context giữ phần quan trọng | `/compact` có trọng tâm | `/compact focus vào bug rò rỉ dữ liệu` |
| Xem tôi đã dùng bao nhiêu quota | `/usage` hoặc Settings > Usage | `/usage` |
| Cài trọn bộ tính năng người khác làm | Plugin marketplace | `claude plugin marketplace add anthropics/claude-plugins-community` |
| Sửa cấu hình Claude Code bị hỏng | `/doctor` | `/doctor` |
| Quay code về trước khi Claude phá | `/rewind` | `/rewind` |

---

## 22. 10 SAI LẦM PHỔ BIẾN CỦA NGƯỜI MỚI

> **RULE: Gần như mọi sai lầm của người mới đều là một dạng của cùng một lỗi — nhầm giữa *Claude nghe lời khuyên* và *Claude bị ép buộc*. Điều gì quan trọng thật thì phải nằm trong hook, test, hoặc script, không nằm trong prompt.**

**1. Dùng chat để làm việc nhiều bước, và dùng agent để hỏi một câu.**
Chat hợp với suy nghĩ, Cowork/Claude Code hợp với thực thi. Hỏi "RSI tính thế nào?" trong một phiên agent đầy đủ tool là lãng phí; còn bảo chat "tải 2 năm dữ liệu và train mô hình" thì nó không có tay chân để làm.
*Cách tránh:* nhìn động từ trong yêu cầu của bạn. "Giải thích/so sánh/gợi ý" → chat. "Tải/chạy/sửa/tạo file" → agent.

**2. Quên rằng sandbox không phải máy của bạn.**
Bạn bảo Cowork tạo báo cáo, nó tạo xong, bạn đóng phiên, và file biến mất. Sandbox bị huỷ khi phiên kết thúc.
*Cách tránh:* mọi task tạo ra kết quả, hãy kết bằng câu: "rồi ghi file kết quả về `~/crypto/…` trên máy tôi."

**3. Nhồi mọi thứ vào CLAUDE.md.**
File 800 dòng trông có vẻ kỹ lưỡng, nhưng tài liệu nói thẳng: file dài hơn làm **giảm** mức tuân thủ, và nó nạp lại mỗi phiên.
*Cách tránh:* dưới 200 dòng. Quy trình → skill. Luật theo thư mục → `.claude/rules/` có `paths:`.

**4. Tin CLAUDE.md như một cơ chế cưỡng chế.**
Tài liệu ghi rõ: đó là *context*, không phải cấu hình được ép buộc. Viết "không bao giờ commit file dữ liệu" vào CLAUDE.md **không** ngăn được điều đó.
*Cách tránh:* điều gì phải đúng 100% thì viết thành hook `PreToolUse` thoát mã 2.

**5. Viết `description` của skill quá mơ hồ.**
`description: Giúp với dữ liệu` — Claude sẽ không bao giờ biết khi nào nên gọi nó, vì `description` là *thứ duy nhất* nó thấy ở tầng 1.
*Cách tránh:* viết ngôi thứ ba, nêu cả cái gì lẫn khi nào, nhồi từ khoá kích hoạt: "Chạy backtest walk-forward... Dùng khi người dùng nhắc tới backtest, đánh giá mô hình, out-of-sample..."

**6. Chạy routine rồi tin vào chấm xanh.**
Tài liệu cảnh báo trực tiếp: trạng thái xanh chỉ nghĩa là phiên khởi động và thoát không lỗi hạ tầng — **không** nghĩa là việc đã thành công.
*Cách tránh:* mở transcript đọc trong vài lần chạy đầu. Và viết prompt routine sao cho nó tự báo cáo rõ "thành công là gì".

**7. Viết prompt routine dựa vào bối cảnh cuộc trò chuyện.**
"Retrain mô hình như hôm qua" hoạt động trong phiên hiện tại. Trong routine, mỗi lần chạy là **một phiên hoàn toàn mới, không ký ức**.
*Cách tránh:* đọc lại prompt routine và tự hỏi: một người lạ chưa từng thấy dự án này có làm được không?

**8. Để một phiên phình mãi qua nhiều nhiệm vụ không liên quan.**
Bạn debug rò rỉ dữ liệu (đọc 20 file), rồi chuyển sang sửa CSS dashboard trong cùng phiên. Cả 20 file đó vẫn nằm trong context, tốn tiền và làm loãng sự chú ý.
*Cách tránh:* `/clear` giữa các nhiệm vụ. Dùng `/context` để thấy tình trạng thật.

**9. Coi kết quả mô hình do agent báo là kết quả đã được kiểm chứng.**
Đây là sai lầm nguy hiểm nhất trong danh sách này, và nó thuộc về lĩnh vực của bạn. Một agent hào hứng báo "Sharpe 4.2!" gần như luôn là dấu hiệu của rò rỉ dữ liệu, không phải alpha.
*Cách tránh:* đưa hoài nghi vào cấu hình, đừng để trong đầu. Viết vào CLAUDE.md: "Nếu Sharpe > 3, nghi ngờ rò rỉ dữ liệu và kiểm tra shift(1) trước khi báo cáo." Viết subagent `leakage-hunter`. Luôn yêu cầu baseline.

**10. Cài mọi plugin và MCP server nhìn thấy.**
Mỗi MCP server tốn context. Mỗi plugin có thể mang theo hook và server chạy được lệnh trên máy bạn.
*Cách tránh:* cài từng cái một, chỉ khi bạn có nhu cầu cụ thể. Chỉ cài từ nguồn tin cậy. Chạy `/context` sau khi cài để thấy cái giá.

---

## LỜI KẾT: BA THỨ NÊN LÀM TRONG TUẦN NÀY

Đừng cố làm hết. Theo thứ tự này:

**Hôm nay.** Viết `CLAUDE.md` cho repo crypto của bạn. Chạy `/init` rồi sửa lại theo mẫu ở mục 19. Chỉ riêng việc này đã loại bỏ phần lớn các lần Claude làm sai ý bạn.

**Tuần này.** Viết một skill duy nhất cho quy trình bạn lặp lại nhiều nhất — nhiều khả năng là backtest. Dùng `/skill-creator`. Rồi thêm một hook `PreToolUse` chặn mọi lệnh đụng tới endpoint đặt lệnh của Binance.

**Tháng này.** Dựng một routine retrain hằng đêm mở PR khi mô hình cải thiện. Đó là lúc bạn thực sự cảm nhận được sự khác biệt: bạn ngủ, và sáng ra có một PR kèm bảng metric chờ bạn đọc.

Và hãy nhớ nguyên tắc bao trùm cả cuốn sổ tay này: **các công cụ ở đây giúp bạn đi nhanh hơn, không giúp bạn đúng hơn.** Trong một dự án dự đoán giá crypto, đi nhanh về hướng sai là cách tốn tiền nhất. Hãy để Claude viết code, chạy backtest, dựng dashboard — nhưng hoài nghi thì giữ cho riêng mình.

---

### Ghi chú về nguồn và những gì chưa kiểm chứng

Tài liệu này được đối chiếu tháng 8/2026 với: [code.claude.com/docs](https://code.claude.com/docs/en/overview) (Claude Code: overview, memory, skills, hooks, sub-agents, permission-modes, mcp, plugins, routines, commands, chrome, context-window, tools-reference, common-workflows), [platform.claude.com/docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) (Agent Skills overview và best practices, prompt engineering), và [support.claude.com](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork) (Cowork getting started, kiến trúc, projects, web/desktop/mobile, tasks, Projects, Artifacts, usage limits, Claude in Chrome permissions), cùng [claude.com/docs/office-agents/excel](https://claude.com/docs/office-agents/excel).

**Những điểm tôi KHÔNG kiểm chứng được và bạn nên tự tra lại:**
- Giá và hạn mức cụ thể theo từng gói (Pro/Max/Team) — xem claude.com/pricing
- Kích thước context window chính xác cho phiên Cowork
- Con số giới hạn stage/commit file trong Cowork (tôi lấy từ mô tả tool trong phiên này, không từ tài liệu công khai)
- Chi tiết luồng bình luận (comment) trên artifact ở phía claude.ai
- Hạn mức số lần chạy routine mỗi ngày — xem tại claude.ai/code/routines

Routines đang ở **research preview**, nên hành vi, giới hạn và API có thể thay đổi. Khi nghi ngờ, cách nhanh nhất là hỏi thẳng Claude Code: nó có quyền truy cập tài liệu mới nhất và trả lời được các câu như *"giới hạn của routine là gì?"*
