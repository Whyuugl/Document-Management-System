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

## API Endpoints

### General
- `GET /` - Server info
- `GET /api/health` - Health check

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/register` - User registration


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

