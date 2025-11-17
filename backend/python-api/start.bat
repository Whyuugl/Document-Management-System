@echo off
REM Script untuk menjalankan Python OCR API Server di Windows

echo 🚀 Starting Python OCR API Server...

REM Cek apakah virtual environment ada
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Aktifkan virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies jika belum
if not exist "venv\.installed" (
    echo 📥 Installing dependencies...
    pip install -r requirements.txt
    echo. > venv\.installed
)

REM Jalankan server
echo ✅ Starting server on http://localhost:8000
python main.py

pause

