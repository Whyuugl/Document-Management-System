# OCRmyPDF Python API Server

Server Python FastAPI untuk menjalankan OCRmyPDF sebagai REST API service.

## 🚀 Cara Install

### 1. Install Dependencies

```bash
cd backend/python-api
pip install -r requirements.txt
```

### 2. Pastikan OCRmyPDF sudah terinstall

```bash
ocrmypdf --version
```

Jika belum, install dengan:
```bash
pip install ocrmypdf
```

## 🏃 Cara Menjalankan

### Development Mode

```bash
cd backend/python-api
python main.py
```

Server akan berjalan di `http://localhost:8000`

### Atau dengan uvicorn langsung

```bash
cd backend/python-api
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 📚 API Endpoints

### 1. Health Check
```
GET /health
```

### 2. OCR PDF (Return PDF file)
```
POST /ocr
```

**Parameters:**
- `file`: File PDF (multipart/form-data)
- `language`: Bahasa OCR (default: "eng+ind")
- `deskew`: Perbaiki halaman miring (default: true)
- `rotate_pages`: Auto-rotate halaman (default: true)

**Response:** File PDF yang sudah di-OCR

### 3. OCR Extract Text
```
POST /ocr-extract
```

**Parameters:**
- `file`: File PDF (multipart/form-data)
- `language`: Bahasa OCR (default: "eng+ind")
- `extract_text`: Extract text dari PDF (default: true)

**Response:**
```json
{
  "success": true,
  "message": "OCR completed successfully",
  "extracted_text": "Text yang diekstrak dari PDF..."
}
```

## 🧪 Testing dengan Postman/curl

### Test OCR Extract

```bash
curl -X POST "http://localhost:8000/ocr-extract" \
  -F "file=@/path/to/your/file.pdf" \
  -F "language=eng+ind"
```

### Test OCR (Return PDF)

```bash
curl -X POST "http://localhost:8000/ocr" \
  -F "file=@/path/to/your/file.pdf" \
  -F "language=eng+ind" \
  --output output.pdf
```

## 🔗 Integrasi dengan Next.js

Endpoint Next.js bisa memanggil Python API ini:

```typescript
// Di Next.js API route
const formData = new FormData();
formData.append('file', file);
formData.append('language', 'eng+ind');

const response = await fetch('http://localhost:8000/ocr-extract', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
console.log(result.extracted_text);
```

## 📝 Environment Variables

Buat file `.env` jika perlu (opsional):

```env
PYTHON_API_PORT=8000
PYTHON_API_HOST=0.0.0.0
```

## 🐛 Troubleshooting

### Port sudah digunakan
```bash
# Ganti port di main.py atau gunakan:
uvicorn main:app --port 8001
```

### OCRmyPDF not found
```bash
pip install ocrmypdf
```

### CORS Error
Cek konfigurasi CORS di `main.py` - pastikan allow_origins sesuai dengan domain frontend Anda.

