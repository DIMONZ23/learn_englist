# 🇬🇧 AI English Master - Ứng Dụng Học & Luyện Tập Tiếng Anh Thông Minh

Ứng dụng học tiếng Anh full-stack: frontend **Vue 3 + Vite**, REST API **Node.js/Express** và cơ sở dữ liệu **PostgreSQL**. Toàn bộ tiến độ, từ vựng, lần làm bài và lịch sử hỏi gia sư được lưu bền vững ở server.

## 🚀 Chạy toàn bộ hệ thống

Yêu cầu: Node.js 20+, pnpm và PostgreSQL 15+; hoặc Docker Desktop để chạy PostgreSQL nhanh.

```bash
# 1. Cài thư viện
pnpm install

# 2. Tạo file cấu hình
copy .env.example .env

# 3A. Chạy toàn bộ bằng Docker (app + PostgreSQL)
docker compose up --build -d

# Hoặc 3B. Chạy app local với PostgreSQL local
pnpm db:setup
pnpm dev
```

Nếu dùng PostgreSQL cài trực tiếp trên Windows thay vì Docker, chạy một lần trong PowerShell và nhập mật khẩu admin khi được hỏi:

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h localhost -U postgres -d postgres -f '.\db\bootstrap-admin.sql'
pnpm db:setup
pnpm dev
```

Với Docker, mở `http://localhost:4173`. Khi chạy `pnpm dev`, frontend Vite ở `http://localhost:5173` và tự proxy API sang backend cổng `4173`. Thanh trạng thái dưới sidebar sẽ hiển thị **PostgreSQL đã đồng bộ** khi kết nối thành công.

PostgreSQL trong Docker được map ra cổng `5433` để không xung đột với PostgreSQL cài trực tiếp trên Windows tại cổng `5432`.

> Frontend cần được chạy qua Vite hoặc Docker; không mở trực tiếp `index.html` bằng giao thức `file://`.

---

## 🌟 Tính Năng Nổi Bật

### 1. 📊 Tab 1: Tổng Quan & Tiến Độ (Dashboard)
- **Theo dõi tiến độ:** Thống kê chuỗi ngày học liên tục (Streak 🔥), số từ vựng đã ghi nhớ, số bài kiểm tra đã làm và tỷ lệ chính xác.
- **AI Daily Review:** Trợ lý AI tự động phân tích lỗ hổng kiến thức và đề xuất nội dung trọng tâm cần ôn tập theo phương pháp Lặp lại ngắt quãng (Spaced Repetition).
- **Hành động nhanh (Quick Actions):** Ôn tập 5 phút hàng ngày chỉ với một cú nhấp chuột.

### 2. 📖 Tab 2: Sổ Tay Từ Vựng Thông Minh (Vocabulary Hub)
- **Flashcard 3D:** Lật thẻ tương tác kèm phát âm Audio (sử dụng Web Speech API), phiên âm quốc tế IPA, ví dụ thực tế.
- **AI Từ Điển Cambridge:** Nhập từ mới để AI tự động trích xuất định nghĩa chuẩn phong cách Cambridge Learner's Dictionary, cụm từ đi kèm (Collocations), và họ từ (Word family).
- **Lưu trữ từ vựng:** Phân loại theo trạng thái (Đã nhớ / Cần ôn / Từ mới) và tự động đồng bộ vào PostgreSQL.

### 3. 🧩 Tab 3: Ngữ Pháp & Cấu Trúc Toàn Diện (Grammar Master)
- **Hệ thống chuyên đề:**
  - 12 Thì tiếng Anh thông dụng (Tenses).
  - Từ loại (Danh từ, Động từ, Tính từ, Trạng từ, Giới từ,...).
  - Trật tự từ trong câu và cấu tạo các loại câu (Đơn, Ghép, Phức).
  - Mệnh đề quan hệ, mệnh đề trạng ngữ, mệnh đề danh từ.
- **Phương pháp trực quan:** Sơ đồ công thức bằng màu sắc, chỉ ra các lỗi sai kinh điển (Common Mistakes).
- **AI Mnemonics:** Mẹo và câu thần chú ghi nhớ nhanh công thức.
- **Mini Quiz:** Bài tập thực hành 3-5 câu trắc nghiệm nhanh ngay sau mỗi lý thuyết.

### 4. 📝 Tab 4: Luyện Tập & Gia Sư AI (Practice & AI Tutor)
- **Đa dạng bài tập:** Luyện tập chuyên sâu theo từng chủ đề hoặc làm đề thi tổng hợp hỗn hợp.
- **Chấm điểm & Phân tích chuyên sâu:** 
  - Đánh dấu Đúng/Sai ngay lập tức.
  - AI giải thích chi tiết lý do vì sao đáp án đó đúng, phân tích bẫy ngữ pháp của các lựa chọn còn lại.
- **Hỏi đáp tương tác (AI Tutor Chat):** Nút *"Hỏi lại AI về câu này"* mở khung hội thoại để học viên đặt câu hỏi chuyên sâu nếu chưa hiểu rõ.

---

## 🖥️ Giao Diện & Bố Cục (Layout)

- **Sidebar Menu bên phải (Right Navigation Bar):** Thiết kế thanh điều hướng cố định bên phải với hiệu ứng mượt mà, tối ưu không gian hiển thị bài học chính bên trái.
- **Responsive Web Design:** Tối ưu mượt mà cho mọi kích thước màn hình (Desktop, Tablet, Mobile).
- **Giao diện hiện đại:** Tông màu Indigo / Slate Blue hiện đại, sạch sẽ và hạn chế mỏi mắt khi học lâu.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend:** Vue 3 Composition API, Single File Components, Vite và Modern CSS3.
- **Backend:** Node.js, Express 5, REST API, validation và transaction.
- **Cơ sở dữ liệu:** PostgreSQL với index, foreign key, JSONB và migration SQL.
- **Lưu trữ trình duyệt:** `localStorage` chỉ giữ theme và trạng thái UI; PostgreSQL là nguồn dữ liệu chính.
- **Audio & Giọng đọc:** Web Speech Synthesis API (hoạt động không cần thư viện ngoài).
- **Build:** Vite tạo bundle production; Express phục vụ thư mục `dist`.
- **AI Engine:** Tích hợp mô phỏng AI (Mock AI Engine) có thể chuyển đổi dễ dàng sang API của Google Gemini hoặc OpenAI.

---

## 📁 Cấu Trúc Thư Mục Dự Án

```text
learn_englist/
├── index.html                 # Vite entry HTML
├── vite.config.js             # Vite + proxy API khi phát triển
├── src/
│   ├── App.vue                # App shell và điều hướng SPA
│   ├── main.js, store.js      # Vue bootstrap + reactive store
│   ├── api.js, data.js        # REST client + dữ liệu fallback/seed
│   ├── styles.css             # Design system responsive
│   └── components/            # Dashboard, Vocabulary, Grammar, Practice
├── server/
│   ├── index.js               # Express server + static frontend
│   ├── routes.js              # Toàn bộ REST API
│   ├── db.js                  # PostgreSQL pool + transaction
│   └── validation.js          # Kiểm tra dữ liệu đầu vào
├── db/schema.sql              # Schema và indexes
├── scripts/migrate.js         # Tạo/cập nhật schema
├── scripts/seed.js            # Nạp dữ liệu mẫu từ src/data.js
├── Dockerfile                 # Multi-stage build Vue + Node runtime
├── docker-compose.yml         # App + PostgreSQL
├── .env.example               # Biến môi trường mẫu
└── package.json
```

---

## 🔌 REST API chính

- `GET /api/health`, `GET /api/bootstrap`
- `GET/POST /api/vocabulary`
- `PATCH/DELETE /api/vocabulary/:id`
- `GET /api/grammar`, `GET /api/practice`
- `POST /api/practice/attempts`
- `POST /api/dictionary`, `POST /api/tutor`

Backend mặc định dùng một UUID demo. Khi thêm đăng nhập thật, gateway xác thực chỉ cần truyền user ID đã xác minh qua `x-user-id`; không tin tưởng header này trực tiếp trên Internet nếu chưa có authentication middleware.

---

## 📌 Kế Hoạch Nâng Cấp Trong Tương Lai

- [ ] Bổ sung bài tập luyện nghe và nhận diện giọng nói (Speech-to-Text).
- [ ] Bổ sung bảng xếp hạng học tập (Leaderboard).
- [ ] Đồng bộ hóa dữ liệu đám mây qua Firebase hoặc Supabase.
