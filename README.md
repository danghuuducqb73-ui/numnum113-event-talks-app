# 📊 BigQuery Release Notes Tracker & Twitter Publisher

Ứng dụng web được xây dựng bằng **Python Flask** cùng **HTML, CSS và JavaScript thuần (Vanilla)**, chuyên dùng để theo dõi các ghi chú phát hành (release notes) của Google Cloud BigQuery từ nguồn Atom XML chính thức và hỗ trợ chọn lọc để đăng bài lên Twitter (X).

---

## ✨ Tính năng chính

1. **Lấy dữ liệu tự động từ nguồn chính thức:**
   - Đọc trực tiếp từ feed Atom XML: `https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`.
   - Tự động chuẩn hóa liên kết, mã HTML và phân loại thành các danh mục chi tiết (*Feature*, *Change*, *Announcement*, *Fixed*, *Security*, *Deprecated*).

2. **Nút Làm mới với hiệu ứng xoay (Spinner):**
   - Nút **"Làm mới dữ liệu"** tích hợp hiệu ứng xoay (spinner).
   - Khi bấm, ứng dụng sẽ thực hiện gọi API nền để cập nhật các bản phát hành mới nhất từ Google mà không cần tải lại toàn bộ trang web.

3. **Chọn bản cập nhật & Đăng lên Twitter (X):**
   - Cho phép người dùng bấm **"Chọn bản này"** hoặc bấm nút **"Đăng Twitter"** trực tiếp trên từng mục cập nhật.
   - Khi chọn một bản cập nhật, thanh thông báo ghim (*sticky action bar*) sẽ xuất hiện cho phép đăng nhanh.
   - Hộp thoại soạn thảo Tweet hỗ trợ:
     - Tự động tạo bản nháp tweet kèm biểu tượng cảm xúc, tóm tắt nội dung, liên kết tài liệu chính thức và các hashtag (#BigQuery, #GoogleCloud).
     - Cho phép chỉnh sửa trực tiếp nội dung tweet.
     - Bộ đếm ký tự thời gian thực (giới hạn 280 ký tự của Twitter).
     - Nút thêm/bớt hashtag nhanh chóng.
     - Nút **"Mở Twitter / X để đăng ngay"** (Sử dụng Twitter Web Intent - hoạt động ngay lập tức mà không cần tài khoản Twitter Developer hay cấu hình API Key phức tạp).
     - Nút **"Sao chép nội dung"** để dán vào bất kỳ ứng dụng nào.
     - Tùy chọn nâng cao: Hỗ trợ gửi trực tiếp qua Twitter API v2 nếu người dùng có sẵn Bearer Token.

4. **Tìm kiếm & Lọc thông minh:**
   - Ô tìm kiếm từ khóa thời gian thực (hỗ trợ tìm kiếm theo Gemini, Iceberg, SQL, SDK,...).
   - Bộ lọc theo từng danh mục: *Tất cả*, *Feature*, *Change*, *Announcement*, *Fixed*, *Security*, *Deprecated*.

---

## 📁 Cấu trúc dự án

```
bigquery-release-notes/
├── app.py                 # Máy chủ Flask & API endpoints
├── release_parser.py      # Bộ phân tích dữ liệu XML Atom & chuyển đổi sang dữ liệu có cấu trúc
├── static/
│   ├── css/
│   │   └── style.css      # CSS thuần (Giao diện hiện đại, responsive, hiệu ứng spinner)
│   └── js/
│       └── app.js        # JavaScript thuần (AJAX, hiệu ứng làm mới, lọc, modal Twitter)
├── templates/
│   └── index.html         # Giao diện HTML5 thuần
├── requirements.txt       # Danh sách thư viện Python (Flask, requests, beautifulsoup4)
├── run.sh                 # Script chạy ứng dụng 1 chạm
└── README.md              # Hướng dẫn sử dụng
```

---

## 🚀 Hướng dẫn khởi chạy

### Cách 1: Khởi chạy nhanh bằng script `run.sh`

Mở terminal và chạy lệnh:
```bash
cd /home/ben/projects/bigquery-release-notes
./run.sh
```

### Cách 2: Khởi chạy thủ công bằng môi trường ảo (venv)

```bash
cd /home/ben/projects/bigquery-release-notes

# Tạo và kích hoạt virtual environment (nếu chưa có)
python3 -m venv venv
source venv/bin/activate

# Cài đặt thư viện
pip install -r requirements.txt

# Khởi chạy ứng dụng
python app.py
```

Sau khi máy chủ khởi động, hãy mở trình duyệt web và truy cập vào:
👉 **[http://localhost:5000](http://localhost:5000)**
