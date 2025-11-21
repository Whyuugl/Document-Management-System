# Backend API - Arsip Kependudukan

Backend API untuk aplikasi Arsip Kependudukan dengan sistem autentikasi.

## Setup Database

1. Pastikan PostgreSQL sudah terinstall dan berjalan
2. Buat database dengan nama `arsip_kependudukan`
3. Jalankan script setup database:
   ```bash
   npm run setup-db
   ```

## Setup Environment Variables

Buat file `.env` di root folder backend dengan konfigurasi berikut:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=arsip_kependudukan
DB_USER=postgres
DB_PASSWORD=admin

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
```

## Install Dependencies

```bash
npm install
```

## Create Dummy Users

Setelah database setup, buat 3 akun dummy untuk testing:

```bash
# Buat 3 akun dummy sekaligus (admin, user1, user2)
npm run create-dummy-users

# Atau buat user satu per satu:
npm run create-admin          # admin/admin123
npm run create-user-custom user1 user123
npm run create-user-custom user2 user456
```

**📋 Akun dummy yang akan dibuat:**
- **admin** / admin123 (untuk admin)
- **user1** / user123 (untuk testing)
- **user2** / user456 (untuk testing)

**⚠️ PENTING: Ganti password default setelah login pertama!**

## Run Development Server

```bash
npm run dev
```

Server akan berjalan di `http://localhost:5000`

## API Endpoints

### Authentication

#### POST `/api/auth/login`
Login user
```json
{
  "username": "username",
  "password": "password"
}
```

#### POST `/api/auth/logout`
Logout user

#### GET `/api/auth/me`
Dapatkan informasi user yang sedang login (memerlukan autentikasi)

### Response Format

#### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

## Database Schema

### Users Table
```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Security Features

- Password di-hash menggunakan bcrypt dengan salt rounds 10
- JWT token untuk autentikasi
- HTTP-only cookies untuk menyimpan token
- Middleware untuk proteksi route yang memerlukan autentikasi

## Development Notes

- Sistem login menggunakan username dan password
- **Tidak ada fitur register untuk user biasa** - hanya admin yang bisa membuat user baru
- Token JWT disimpan dalam HTTP-only cookie
- Middleware `requireAuth` tersedia untuk proteksi route
- Semua password di-hash sebelum disimpan ke database
- Untuk menambah user baru, gunakan script `npm run create-admin` atau `npm run create-user-custom username password`
