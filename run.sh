#!/bin/bash
# Script khởi chạy ứng dụng BigQuery Release Notes Tracker

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

if [ ! -d "venv" ]; then
    echo "⚙️ Đang khởi tạo môi trường ảo Python venv..."
    python3 -m venv venv
    ./venv/bin/pip install --upgrade pip
    ./venv/bin/pip install -r requirements.txt
fi

echo "🚀 Khởi động ứng dụng Flask tại http://localhost:5000..."
./venv/bin/python app.py
