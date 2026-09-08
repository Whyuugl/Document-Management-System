# Backend API - DMS Office

Backend ini adalah Next.js API server untuk DMS Office. Fungsinya menangani auth, upload file, metadata dokumen, folder, kategori, versioning, sharing, approval, notifications, retention, activity log, dan advanced search.

## Setup

Jalankan dari root project:

```bash
npm install
npm run migrate
npm run create-admin
```

Atau dari folder `backend`:

```bash
npm install
npm run migrate
npm run create-admin
```

Default login:

```text
admin / admin123
```

## Environment

File `.env` backend mengikuti `env.example`.

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=arsip_kependudukan
DB_USER=postgres
DB_PASSWORD=admin
JWT_SECRET=change-this-secret
JWT_EXPIRES_IN=7d
```

## Development

```bash
npm run dev
```

Server default:

```text
http://localhost:5000
```

## Scripts

- `npm run dev`: menjalankan Next.js API di port `5000`
- `npm run build`: build backend Next.js
- `npm run lint`: TypeScript check
- `npm run migrate`: menjalankan `lib/migration.sql`
- `npm run create-admin`: membuat user `admin`
- `npm run seed-demo`: reset dan isi data demo kantor
- `npm run test-db`: cek koneksi dan tabel dokumen
- `npm run test-core`: cek tabel, constraint, relasi, dan index inti DMS

## Endpoint

Auth:

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

Other:

- `GET/POST/PUT/DELETE /api/categories`
- `GET/POST/PUT/DELETE /api/folders`
- `GET /api/users`
- `GET /api/activity`
- `GET /api/notifications`
- `GET /api/dashboard/stats`
- `GET /api/health`

## Search Query

`GET /api/documents` mendukung:

- `search`
- `category`
- `folder`
- `status`
- `scope`
- `approval`
- `visibility`
- `retention`
- `owner`
- `reference`
- `file_type`
- `date_from`
- `date_to`
- `page`
- `limit`

Search memakai PostgreSQL full-text search dengan index `idx_documents_search`, lalu fallback ke `ILIKE` untuk pola sederhana.

## Database

Core tables:

- `users`
- `document_categories`
- `document_folders`
- `documents`
- `document_versions`
- `document_shares`
- `activity_logs`

Important constraints:

- `documents.status`: `DRAFT`, `ACTIVE`, `ARCHIVED`
- `documents.visibility`: `PRIVATE`, `INTERNAL`, `SHARED`
- `documents.approval_status`: `NOT_SUBMITTED`, `PENDING`, `APPROVED`, `REJECTED`
- `retention_years > 0`
- `document_versions` unique per `document_id` and `version_number`
- `documents.current_version_id` must belong to the same document

Important indexes:

- `idx_documents_search`
- `idx_documents_category_id`
- `idx_documents_folder_id`
- `idx_documents_status`
- `idx_documents_visibility`
- `idx_documents_approval_status`
- `idx_documents_reviewer_id`
- `idx_documents_retention_due_at`
- `idx_documents_created_at`
- `idx_document_shares_document_id`
- `idx_document_shares_user_id`
- `idx_document_versions_document_id`

## Upload Storage

Uploaded files disimpan lokal di:

```text
backend/uploads/documents
```

Validasi upload dikelola di `lib/storage.ts`.

## Notes

- Semua endpoint utama dilindungi auth cookie.
- Akses dokumen dicek lewat `lib/access.ts`.
- Retention dihitung lewat `lib/retention.ts`.
- Migration dibuat idempotent, jadi aman dijalankan ulang.
