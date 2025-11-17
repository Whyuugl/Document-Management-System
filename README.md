# Arsip Kependudukan Application

Aplikasi arsip kependudukan dengan struktur frontend dan backend terpisah.

## Struktur Project

```
arsip-app/
├── frontend/          # React + Vite frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── backend/           # Express.js backend
│   ├── server.js
│   ├── package.json
│   └── env.example
├── package.json       # Root package.json (monorepo)
└── README.md
```

## Setup dan Instalasi

### 1. Install semua dependencies
```bash
npm run install:all
```

### 2. Install frontend dependencies
```bash
npm run install:frontend
```

### 3. Install backend dependencies
```bash
npm run install:backend
```

### 4. Setup Database PostgreSQL
```bash
# Pastikan PostgreSQL sudah terinstall dan running
# Copy environment variables
cp backend/env.example backend/.env

# Edit backend/.env sesuai konfigurasi database Anda
# Kemudian setup database
cd backend
npm run setup-db
```

## Menjalankan Aplikasi

### Development Mode

#### Frontend (React + Vite)
```bash
npm run dev
# atau
cd frontend && npm run dev
```

#### Backend (Express.js)
```bash
cd backend && npm run dev
```

### Production Build

#### Frontend
```bash
npm run build
# atau
cd frontend && npm run build
```

#### Backend
```bash
cd backend && npm start
```

## Teknologi yang Digunakan

### Frontend
- React 19
- Vite
- Tailwind CSS
- Font Awesome

### Backend
- Next.js 14
- TypeScript
- PostgreSQL (Database)
- JWT (Authentication)
- bcryptjs (Password Hashing)
- Tesseract.js (OCR)
- Formidable (File Upload)
- Sharp (Image Processing)

## API Endpoints

### General
- `GET /` - Server info
- `GET /api/health` - Health check

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/register` - User registration

### OCR Endpoints
- `POST /api/ocr/extract-text` - Extract text from uploaded image
- `POST /api/ocr/parse-ktp` - Parse KTP/KK data and extract structured information
- `POST /api/ocr/upload` - Upload image file

### OCR Usage Example
```javascript
// Upload image and extract text
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const response = await fetch('http://localhost:5000/api/ocr/extract-text', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
console.log(result.extractedText);
```

## Environment Variables

Copy `backend/env.example` ke `backend/.env` dan sesuaikan konfigurasinya.

### Database Configuration
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=arsip_kependudukan
DB_USER=postgres
DB_PASSWORD=your_password
```

### JWT Configuration
```env
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
```

## Default Login Credentials

Setelah setup database, Anda bisa login dengan:
- **Username**: `admin`
- **Password**: `admin123`

## Fitur OCR

Aplikasi ini dilengkapi dengan fitur OCR (Optical Character Recognition) yang dapat:

- **Extract Text dari Gambar/PDF**: Upload gambar atau PDF dokumen dan ekstrak teks secara otomatis
- **Multi-language Support**: Mendukung bahasa Indonesia dan Inggris
- **File Upload**: Upload berbagai format file (JPG, PNG, GIF, PDF, dll)
- **PDF Processing**: Konversi PDF ke gambar untuk OCR processing
- **Real-time Processing**: Proses OCR secara real-time dengan feedback visual

### Cara Menggunakan OCR:

#### 1. OCR Umum (Arsip Kependudukan):
1. Buka halaman "Arsip Kependudukan"
2. Klik tombol "Scan Dokumen"
3. Upload gambar atau PDF dokumen yang ingin diekstrak teksnya
4. Klik "Extract Text" untuk memproses
5. Teks yang diekstrak akan muncul di bawah
6. Gunakan tombol "Copy to Clipboard" untuk menyalin hasil

#### 2. OCR KTP/KK Auto-fill (Tambah Arsip):
1. Buka halaman "Tambah Arsip"
2. Klik tombol "Scan KTP/KK" di bagian atas form
3. Upload gambar atau PDF KTP/KK yang jelas
4. Klik "Scan KTP/KK" untuk memproses
5. Data yang diekstrak akan ditampilkan untuk konfirmasi
6. Klik "Gunakan Data Ini" untuk mengisi form otomatis
7. Form akan terisi dengan data dari KTP/KK

### API OCR Endpoints:

- `POST /api/ocr/extract-text` - Ekstrak teks dari gambar atau PDF (Tesseract.js)
- `POST /api/ocr/parse-ktp` - Parse KTP/KK dan ekstrak data terstruktur dari gambar/PDF
- `POST /api/ocr/upload` - Upload file gambar atau PDF

### Teknologi OCR:

- **Tesseract.js**: Engine OCR yang powerful
- **Formidable**: File upload handling
- **Sharp**: Image processing
- **PDF2Pic**: Konversi PDF ke gambar untuk OCR
- **Next.js API Routes**: Backend API yang scalable
- **Smart Text Parsing**: Algoritma parsing khusus untuk KTP/KK Indonesia

### Fitur Khusus KTP/KK:

- **Auto-fill Form**: Otomatis mengisi form berdasarkan data KTP/KK
- **Data Extraction**: Mengekstrak NIK, nama, jenis kelamin, tempat/tanggal lahir, alamat
- **PDF Support**: Mendukung scan KTP/KK dalam format PDF
- **Multi-page PDF**: Memproses semua halaman PDF untuk ekstraksi data
- **Validation**: Validasi format data KTP/KK Indonesia
- **Modal Interface**: Interface yang user-friendly untuk scan dan konfirmasi data
