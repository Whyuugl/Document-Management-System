#!/bin/bash

# Script untuk menjalankan Python OCR API Server

echo "🚀 Starting Python OCR API Server..."

# Cek apakah virtual environment ada
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv venv
fi

# Aktifkan virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies jika belum
if [ ! -f "venv/.installed" ]; then
    echo "📥 Installing dependencies..."
    pip install -r requirements.txt
    touch venv/.installed
fi

# Jalankan server
echo "✅ Starting server on http://localhost:8000"
python main.py

