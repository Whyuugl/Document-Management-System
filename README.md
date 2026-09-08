# DMS Office - Document Management System

DMS Office adalah aplikasi pengelolaan dokumen kantor berbasis web. Sistem ini dipakai untuk menyimpan dokumen, mengatur folder dan kategori arsip, mengontrol masa retensi, berbagi akses, menjalankan approval, menampilkan notifikasi, dan mencari dokumen dengan filter metadata.

Project ini berbentuk monorepo sederhana:

- `frontend`: React + Vite + Tailwind CSS
- `backend`: Next.js API routes + PostgreSQL
- `node_modules`: satu instalasi dependency di root workspace

## Fitur Utama

- Login berbasis JWT cookie.
- Dashboard ringkasan dokumen, kategori, dokumen bulan ini, dan status retensi.
- Manajemen dokumen: upload, list, preview, download, archive, restore.
- Metadata dokumen: nomor dokumen, nomor referensi, pemilik, tanggal dokumen, deskripsi, kategori, folder.
- Kategori arsip kantor dengan aturan masa retensi.
- Folder arsip bertingkat.
- Versioning dokumen dengan versi aktif.
- Activity log untuk aksi penting.
- Access sharing sederhana: `PRIVATE`, `INTERNAL`, `SHARED`.
- Share dokumen ke user tertentu dan revoke access.
- Approval workflow: submit review, pending review, approve, reject, reviewer, komentar.
- Notifications: retensi hampir jatuh tempo, retensi lewat, approval pending, dokumen dibagikan.
- Advanced search: PostgreSQL full-text search, ranking hasil, dan filter metadata.
- Light/dark theme di frontend.
- Seed demo data untuk melihat sistem dalam keadaan terisi.

## Struktur Folder

```text
E-Arsip/
  backend/
    lib/
      access.ts
      auth.ts
      database.ts
      migration.sql
      retention.ts
      schema.sql
      storage.ts
    pages/api/
      auth/
      dashboard/
      documents/
      activity.ts
      categories.ts
      documents.ts
      folders.ts
      health.ts
      notifications.ts
      users.ts
    scripts/
      create-user.js
      seed-demo-data.js
      run-migration.js
      test-dms-core.js
      test-db-connection.js
    uploads/
  frontend/
    src/
      components/
      config/
      pages/
      App.jsx
      App.css
      main.jsx
  package.json
  package-lock.json
```

## Prasyarat

- Node.js `>=18`
- PostgreSQL aktif
- Database sudah dibuat, default project memakai `arsip_kependudukan`

## Environment Backend

Buat file `backend/.env` dari `backend/env.example`.

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=arsip_kependudukan
DB_USER=postgres
DB_PASSWORD=admin

JWT_SECRET=change-this-secret
JWT_EXPIRES_IN=7d
```

## Instalasi

Jalankan dari root project:

```bash
npm install
npm run migrate
npm run create-admin
```

Default login:

```text
username: admin
password: admin123
```

Untuk isi data demo kantor:

```bash
npm run seed-demo --workspace=backend
```

Perintah seed demo akan membersihkan data dokumen/kategori/folder/share/activity lama lalu mengisi data contoh baru.

## Menjalankan Project

Buka dua terminal dari root project:

```bash
npm run dev:backend
npm run dev:frontend
```

URL default:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

Kalau backend gagal dengan `EADDRINUSE`, berarti port `5000` sedang dipakai. Matikan proses yang memakai port itu atau ubah port backend.

## Script Penting

```bash
npm run dev:frontend
npm run dev:backend
npm run build
npm run lint
npm run typecheck
npm run migrate
npm run create-admin
npm run seed-demo --workspace=backend
npm run test-core --workspace=backend
```

## Database

Tabel inti:

- `users`
- `document_categories`
- `document_folders`
- `documents`
- `document_versions`
- `document_shares`
- `activity_logs`

Kolom penting `documents`:

- `title`
- `document_number`
- `reference_number`
- `owner_name`
- `document_date`
- `description`
- `category_id`
- `folder_id`
- `file_path`
- `mime_type`
- `file_size`
- `original_file_name`
- `visibility`
- `status`
- `approval_status`
- `reviewer_id`
- `review_comment`
- `retention_years`
- `retention_due_at`
- `current_version_id`

Index penting:

- `idx_documents_search`: GIN full-text search
- `idx_documents_category_id`
- `idx_documents_folder_id`
- `idx_documents_status`
- `idx_documents_visibility`
- `idx_documents_approval_status`
- `idx_documents_reviewer_id`
- `idx_documents_retention_due_at`
- `idx_documents_created_at`

## API Ringkas

Authentication:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Documents:

- `GET /api/documents`
- `POST /api/documents`
- `PATCH /api/documents?id=:id&action=archive`
- `PATCH /api/documents?id=:id&action=restore`
- `PATCH /api/documents?id=:id&action=visibility&visibility=PRIVATE|INTERNAL|SHARED`
- `DELETE /api/documents?document_number=:number`
- `GET /api/documents/:id/preview`
- `GET /api/documents/:id/download`
- `GET /api/documents/:id/versions`
- `POST /api/documents/:id/versions`
- `PUT /api/documents/:id/metadata`

Sharing:

- `GET /api/documents/:id/shares`
- `POST /api/documents/:id/shares`
- `DELETE /api/documents/:id/shares?user_id=:id`

Approval:

- `POST /api/documents/:id/approval`
- `PATCH /api/documents/:id/approval`

Master data:

- `GET/POST/PUT/DELETE /api/categories`
- `GET/POST/PUT/DELETE /api/folders`
- `GET /api/users`
- `GET /api/activity`
- `GET /api/notifications`
- `GET /api/dashboard/stats`

## Parameter Search Dokumen

Endpoint:

```text
GET /api/documents
```

Parameter yang tersedia:

- `search`: full-text search dokumen
- `category`: slug kategori
- `folder`: id folder
- `status`: `ALL`, `DRAFT`, `ACTIVE`, `ARCHIVED`
- `scope`: `mine`, `shared-with-me`, `pending-review`
- `approval`: `NOT_SUBMITTED`, `PENDING`, `APPROVED`, `REJECTED`
- `visibility`: `PRIVATE`, `INTERNAL`, `SHARED`
- `retention`: `ACTIVE`, `EXPIRING_SOON`, `EXPIRED`
- `owner`: nama pemilik dokumen
- `reference`: nomor dokumen atau nomor referensi
- `file_type`: tipe file atau ekstensi file
- `date_from`: batas tanggal dokumen awal
- `date_to`: batas tanggal dokumen akhir
- `page`: nomor halaman
- `limit`: jumlah data per halaman

Contoh:

```text
/api/documents?search=contract&category=contracts&approval=PENDING&file_type=pdf
```

## Alur Retensi

Setiap kategori punya `retention_years`. Saat dokumen dibuat, sistem menghitung:

```text
retention_due_at = document_date + retention_years
```

Status retensi dihitung dinamis:

- `ACTIVE`: masih lebih dari 90 hari
- `EXPIRING_SOON`: jatuh tempo dalam 90 hari
- `EXPIRED`: sudah lewat tanggal retensi

Notifikasi retensi muncul untuk dokumen yang sudah expired atau akan jatuh tempo.

## Alur Akses Dokumen

- `PRIVATE`: hanya pemilik, reviewer terkait, dan user yang diberi share.
- `INTERNAL`: user login bisa melihat dokumen.
- `SHARED`: dokumen dibuka untuk user yang diberi share spesifik.

Pemilik dokumen bisa mengubah visibility, menambahkan share user, dan revoke akses.

## Alur Approval

1. Pemilik dokumen memilih reviewer.
2. Dokumen disubmit ke status `PENDING`.
3. Reviewer menerima notifikasi pending approval.
4. Reviewer bisa `approve` atau `reject`.
5. Komentar/reason disimpan di `review_comment`.
6. Semua aksi penting masuk ke `activity_logs`.

## Phase Yang Sudah Selesai

- Phase 1: refactor pondasi dari arsip kependudukan ke DMS Office.
- Phase 2: struktur backend/frontend dan tabel inti DMS.
- Phase 3: kategori dan folder arsip kantor.
- Phase 4: lifecycle dokumen dan retention.
- Phase 5: document versioning.
- Phase 6: seed demo data kantor.
- Phase 7: access dan sharing sederhana.
- Phase 8: approval workflow.
- Phase 9: notifications dan retention reminder.
- Phase 10: advanced search dengan PostgreSQL full-text search.

## Belum Dikerjakan

- Phase 11: AI optional, seperti summary dokumen, auto-category suggestion, dan metadata extraction.
- Saved filters belum dibuat karena belum wajib untuk alur utama.

## Troubleshooting

Port backend dipakai:

```text
Error: listen EADDRINUSE :::5000
```

Solusi cepat:

- tutup terminal backend lama, atau
- matikan proses yang memakai port `5000`, atau
- jalankan backend di port lain.

Login gagal:

- pastikan backend hidup di `http://localhost:5000`
- pastikan database benar di `backend/.env`
- jalankan `npm run migrate`
- buat ulang admin dengan `npm run create-admin`

Data kosong:

```bash
npm run seed-demo --workspace=backend
```

Search lambat atau tidak akurat:

```bash
npm run migrate
npm run test-core --workspace=backend
```

## Catatan Development

- Dependency cukup diinstall dari root project karena npm workspaces sudah aktif.
- Tidak perlu `node_modules` terpisah di setiap folder.
- Backend memakai API routes Next.js sebagai server API, bukan halaman Next.js.
- Frontend memakai Vite sebagai aplikasi React utama.
