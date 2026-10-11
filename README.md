# 📊 BigQuery Release Notes Tracker & Twitter Publisher

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/Flask-3.1-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask">
  <img src="https://img.shields.io/badge/HTML5-Pure-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-Pure-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Twitter/X-Integrated-000000?style=for-the-badge&logo=x&logoColor=white" alt="Twitter">
</p>

Ứng dụng web hiện đại, gọn nhẹ được xây dựng bằng **Python Flask** cùng **HTML, CSS và JavaScript thuần (Vanilla)**, chuyên dùng để theo dõi tự động các ghi chú phát hành (release notes) của Google Cloud BigQuery từ nguồn Atom XML chính thức và hỗ trợ chọn lọc để đăng tải trực tiếp lên mạng xã hội Twitter / X.

---

## 📑 Mục lục
- [✨ Tính năng chính](#-tính-năng-chính)
- [🏗️ Kiến trúc dự án](#️-kiến-trúc-dự-án)
- [📁 Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [🚀 Hướng dẫn cài đặt & Khởi chạy](#-hướng-dẫn-cài-đặt--khởi-chạy)
- [📡 Tài liệu API Endpoints](#-tài-liệu-api-endpoints)
- [⚙️ Biến môi trường (Environment Variables)](#️-biến-môi-trường-environment-variables)
- [🔗 Kho lưu trữ GitHub](#-kho-lưu-trữ-github)

---

## ✨ Tính năng chính

1. **Lấy dữ liệu tự động từ Google Cloud XML Feed:**
   - Kết nối trực tiếp nguồn chính thức: `https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`.
   - Chuẩn hóa mã HTML, xử lý đường dẫn tương đối và tự động phân loại thành các danh mục:
     - 🟢 **Feature** (Tính năng mới)
     - 🔵 **Change** (Thay đổi / Cải tiến)
     - 🟣 **Announcement** (Thông báo quan trọng)
     - 🟢 **Fixed** (Sửa lỗi)
     - 🔴 **Security** (Bảo mật)
     - 🟠 **Deprecated** (Ngừng hỗ trợ)

2. **Nút Làm mới với hiệu ứng xoay (Interactive Spinner):**
   - Nút **"Làm mới dữ liệu"** tích hợp hiệu ứng xoay tròn mượt mà (`@keyframes spin`).
   - Gửi yêu cầu AJAX ngầm để làm mới dữ liệu và cập nhật DOM tức thì mà không cần tải lại trang.

3. **Chọn bản cập nhật & Đăng bài lên Twitter (X):**
   - **Thanh tác vụ ghim (Sticky Bar):** Tự động xuất hiện ở đầu trang khi người dùng chọn bất kỳ bản cập nhật nào.
   - **Hộp thoại soạn thảo Tweet chuyên nghiệp:**
     - Tự động sinh nội dung tweet kèm emoji, tóm tắt, liên kết tài liệu Google và hashtag (`#BigQuery`, `#GoogleCloud`).
     - Bộ đếm ký tự thời gian thực (giới hạn 280 ký tự của Twitter).
     - Nút thêm/bớt hashtag nhanh chóng.
     - **Twitter Web Intent:** Bấm **"Mở Twitter / X để đăng ngay"** sẽ mở trực tiếp màn hình soạn thảo của Twitter với nội dung được điền sẵn (không cần tài khoản Developer hay API Key).
     - **Twitter API v2:** Hỗ trợ đăng tự động qua server nếu có sẵn Bearer Token.
     - Nút sao chép nội dung vào bộ nhớ tạm (clipboard).

4. **Bộ lọc & Tìm kiếm thời gian thực:**
   - Tìm kiếm theo từ khóa văn bản (ví dụ: *Gemini*, *Iceberg*, *SQL*, *SDK*, v.v.).
   - Lọc nhanh theo từng danh mục chỉ với một cú nhấp chuột.

---

## 🏗️ Kiến trúc dự án

```
+-------------------------------------------------------------+
|                 Phía Trình duyệt (Client)                   |
|  - index.html (Semantic UI, Modal, Sticky Bar)              |
|  - style.css  (Google Cloud theme, Responsive, Spinner)     |
|  - app.js     (State, AJAX Fetch, Event Handling, Filters)  |
+------------------------------+------------------------------+
                               | AJAX / Fetch (JSON)
                               v
+-------------------------------------------------------------+
|                 Phía Máy chủ (Flask Server)                 |
|  - app.py            (Routes, SSR, API Endpoints)           |
|  - release_parser.py (Atom XML Parser, Cache, Tweet Draft)  |
+------------------------------+------------------------------+
                               | HTTP GET
                               v
+-------------------------------------------------------------+
|           Google Cloud BigQuery Atom XML Feed               |
+-------------------------------------------------------------+
```

---

## 📁 Cấu trúc thư mục

```
bigquery-release-notes/
├── app.py                 # Máy chủ Flask & điều phối API
├── release_parser.py      # Phân tích cú pháp XML Atom & xử lý dữ liệu
├── static/
│   ├── css/
│   │   └── style.css      # CSS thuần (giao diện, animation spinner, huy hiệu)
│   └── js/
│       └── app.js        # JavaScript thuần (AJAX, DOM, bộ lọc, modal Twitter)
├── templates/
│   └── index.html         # Giao diện HTML5 chuẩn ngữ nghĩa
├── requirements.txt       # Danh sách thư viện Python
├── run.sh                 # Script khởi động 1 chạm
├── .gitignore             # Danh sách loại trừ Git
└── README.md              # Tài liệu hướng dẫn dự án
```

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy

### Yêu cầu hệ thống
* Python 3.10 trở lên.
* Trình duyệt web hiện đại (Chrome, Firefox, Safari, Edge).

### Cách 1: Khởi chạy nhanh bằng script `run.sh`
```bash
cd /home/ben/projects/bigquery-release-notes
chmod +x run.sh
./run.sh
```

### Cách 2: Khởi chạy thủ công bằng môi trường ảo (venv)
```bash
cd /home/ben/projects/bigquery-release-notes

# 1. Tạo môi trường ảo
python3 -m venv venv

# 2. Kích hoạt môi trường ảo
source venv/bin/activate

# 3. Cài đặt các thư viện cần thiết
pip install -r requirements.txt

# 4. Khởi chạy máy chủ
python app.py
```

Sau khi máy chủ khởi động thành công, mở trình duyệt và truy cập:
👉 **[http://localhost:5000](http://localhost:5000)**

---

## 📡 Tài liệu API Endpoints

| Phương thức | Đường dẫn | Tham số truy vấn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Không | Kết xuất giao diện HTML chính (Server-Side Rendering) |
| `GET` | `/api/feed` | `?refresh=true` (tùy chọn) | Trả về danh sách release notes dạng JSON (nếu có `refresh=true` sẽ bỏ qua cache để kéo dữ liệu mới) |
| `POST` | `/api/tweet` | Body: `{ text, bearer_token }` | Đăng bài trực tiếp qua Twitter API v2 (nếu có cấu hình khóa) |
| `GET` | `/health` | Không | Kiểm tra trạng thái hoạt động của máy chủ |

---

## ⚙️ Biến môi trường (Environment Variables)

Bạn có thể tạo tệp `.env` hoặc truyền biến môi trường khi khởi chạy:

| Biến | Mặc định | Mô tả |
| :--- | :--- | :--- |
| `PORT` | `5000` | Cổng dịch vụ lắng nghe |
| `SECRET_KEY` | Mặc định tích hợp | Khóa phiên bảo mật của Flask |
| `TWITTER_BEARER_TOKEN` | *(Trống)* | Bearer Token của Twitter Developer (tùy chọn) |
| `TWITTER_API_KEY` | *(Trống)* | API Key của Twitter App (tùy chọn) |
| `TWITTER_API_SECRET` | *(Trống)* | API Secret của Twitter App (tùy chọn) |

---

## 🔗 Kho lưu trữ GitHub

Dự án được lưu trữ chính thức tại:
* **Repository**: [https://github.com/danghuuducqb73-ui/numnum113-event-talks-app](https://github.com/danghuuducqb73-ui/numnum113-event-talks-app)
* **Nhánh mặc định**: `main`
