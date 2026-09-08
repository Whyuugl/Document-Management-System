-- Idempotent Document Management System migration

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'id' AND column_default IS NULL
    ) THEN
        CREATE SEQUENCE IF NOT EXISTS users_id_seq OWNED BY users.id;
        PERFORM setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 0) + 1, false);
        ALTER TABLE users ALTER COLUMN id SET DEFAULT nextval('users_id_seq');
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'created_at' AND column_default IS NULL
    ) THEN
        ALTER TABLE users ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
        UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS document_categories (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    retention_years INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_folders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_id INTEGER REFERENCES document_folders(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(160) NOT NULL,
    document_number VARCHAR(80) UNIQUE NOT NULL,
    category_id INTEGER NOT NULL REFERENCES document_categories(id),
    folder_id INTEGER REFERENCES document_folders(id) ON DELETE SET NULL,
    owner_name VARCHAR(120),
    reference_number VARCHAR(80),
    document_date DATE,
    description TEXT,
    file_path VARCHAR(255),
    mime_type VARCHAR(120),
    file_size INTEGER,
    original_file_name VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    retention_years INTEGER NOT NULL DEFAULT 3,
    retention_due_at DATE NOT NULL,
    current_version_id INTEGER,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_versions (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255),
    mime_type VARCHAR(120),
    file_size INTEGER,
    notes TEXT,
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (document_id, version_number)
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    message TEXT NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE documents ADD COLUMN IF NOT EXISTS original_file_name VARCHAR(255);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) NOT NULL DEFAULT 'INTERNAL';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) NOT NULL DEFAULT 'NOT_SUBMITTED';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS reviewer_id INTEGER REFERENCES users(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS review_comment TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS current_version_id INTEGER;
ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS original_file_name VARCHAR(255);
UPDATE document_categories SET retention_years = 3 WHERE retention_years IS NULL OR retention_years <= 0;
UPDATE documents SET retention_years = 3 WHERE retention_years IS NULL OR retention_years <= 0;
ALTER TABLE document_categories DROP CONSTRAINT IF EXISTS document_categories_retention_years_check;
ALTER TABLE document_categories ADD CONSTRAINT document_categories_retention_years_check CHECK (retention_years > 0);
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_retention_years_check;
ALTER TABLE documents ADD CONSTRAINT documents_retention_years_check CHECK (retention_years > 0);
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;
ALTER TABLE documents ADD CONSTRAINT documents_status_check CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED'));
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_visibility_check;
ALTER TABLE documents ADD CONSTRAINT documents_visibility_check CHECK (visibility IN ('PRIVATE', 'INTERNAL', 'SHARED'));
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_approval_status_check;
ALTER TABLE documents ADD CONSTRAINT documents_approval_status_check CHECK (approval_status IN ('NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED'));

CREATE TABLE IF NOT EXISTS document_shares (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (document_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_document_categories_slug ON document_categories(slug);
CREATE INDEX IF NOT EXISTS idx_document_folders_parent_id ON document_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_documents_category_id ON documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_number ON documents(document_number);
CREATE INDEX IF NOT EXISTS idx_documents_retention_due_at ON documents(retention_due_at);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_visibility ON documents(visibility);
CREATE INDEX IF NOT EXISTS idx_documents_approval_status ON documents(approval_status);
CREATE INDEX IF NOT EXISTS idx_documents_reviewer_id ON documents(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_search ON documents USING GIN (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(document_number, '') || ' ' || coalesce(reference_number, '') || ' ' || coalesce(owner_name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(original_file_name, '')));
CREATE INDEX IF NOT EXISTS idx_document_shares_document_id ON document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_user_id ON document_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_document_versions_document_id_id ON document_versions(document_id, id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_by ON activity_logs(created_by);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

ALTER TABLE document_folders DROP CONSTRAINT IF EXISTS document_folders_parent_id_fkey;
ALTER TABLE document_folders
    ADD CONSTRAINT document_folders_parent_id_fkey
    FOREIGN KEY (parent_id) REFERENCES document_folders(id) ON DELETE RESTRICT;

ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_folder_id_fkey;
ALTER TABLE documents
    ADD CONSTRAINT documents_folder_id_fkey
    FOREIGN KEY (folder_id) REFERENCES document_folders(id) ON DELETE RESTRICT;

INSERT INTO document_categories (slug, name, description, retention_years)
VALUES
    ('incoming-mail', 'Incoming Mail', 'Letters and documents received by the office', 3),
    ('outgoing-mail', 'Outgoing Mail', 'Letters and documents issued by the office', 3),
    ('finance', 'Finance', 'Invoices, receipts, budgets, and financial records', 5),
    ('hr', 'Human Resources', 'Employee and staffing documents', 5),
    ('contracts', 'Contracts', 'Agreements, MoUs, and procurement documents', 5),
    ('assets', 'Assets', 'Asset ownership, inventory, and maintenance documents', 5),
    ('legal', 'Legal', 'Regulation, compliance, and legal documents', 10),
    ('records', 'General Records', 'General administrative records', 3)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    retention_years = EXCLUDED.retention_years;

INSERT INTO document_folders (name, description)
SELECT 'General Archive', 'Default folder for uncategorized documents'
WHERE NOT EXISTS (SELECT 1 FROM document_folders WHERE parent_id IS NULL AND name = 'General Archive');

DO $$
BEGIN
    IF to_regclass('public.arsip') IS NOT NULL THEN
        INSERT INTO documents (
            title,
            document_number,
            category_id,
            folder_id,
            owner_name,
            reference_number,
            document_date,
            description,
            file_path,
            retention_years,
            retention_due_at,
            created_by,
            created_at,
            updated_at
        )
        SELECT
            a.nama_lengkap,
            CONCAT('LEGACY-', a.id),
            c.id,
            f.id,
            a.nama_lengkap,
            a.no_kk,
            a.tanggal_lahir,
            CONCAT(a.tempat_lahir, ' / ', a.jenis_kelamin, ' / ', a.alamat),
            a.file_path,
            c.retention_years,
            (a.created_at + (c.retention_years || ' years')::interval)::date,
            a.created_by,
            a.created_at,
            a.updated_at
        FROM arsip a
        JOIN document_categories c ON c.slug = 'records'
        LEFT JOIN document_folders f ON f.parent_id IS NULL AND f.name = 'General Archive'
        ON CONFLICT (document_number) DO NOTHING;

        DROP TABLE arsip;
    END IF;
END $$;

INSERT INTO document_versions (document_id, version_number, file_path, mime_type, file_size, notes, uploaded_by, uploaded_at)
SELECT id, 1, file_path, mime_type, file_size, 'Initial version', created_by, created_at
FROM documents
WHERE file_path IS NOT NULL
ON CONFLICT (document_id, version_number) DO NOTHING;

UPDATE document_versions
SET original_file_name = COALESCE(original_file_name, regexp_replace(file_path, '^.*/', ''))
WHERE original_file_name IS NULL;

UPDATE documents d
SET current_version_id = latest.id
FROM (
    SELECT DISTINCT ON (document_id) id, document_id
    FROM document_versions
    ORDER BY document_id, version_number DESC
) latest
WHERE latest.document_id = d.id
  AND d.current_version_id IS NULL;

UPDATE documents d
SET current_version_id = NULL
WHERE current_version_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM document_versions v
      WHERE v.id = d.current_version_id
        AND v.document_id = d.id
  );

ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_current_version_fk;
ALTER TABLE documents
    ADD CONSTRAINT documents_current_version_fk
    FOREIGN KEY (id, current_version_id) REFERENCES document_versions(document_id, id);

UPDATE documents d
SET category_id = records.id
FROM document_categories old_category, document_categories records
WHERE d.category_id = old_category.id
  AND records.slug = 'records'
  AND old_category.slug IN ('kelahiran', 'pernikahan', 'perceraian', 'kematian');

DELETE FROM document_categories c
WHERE c.slug IN ('kelahiran', 'pernikahan', 'perceraian', 'kematian')
  AND NOT EXISTS (SELECT 1 FROM documents d WHERE d.category_id = c.id);
