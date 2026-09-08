-- Document Management System schema

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_categories (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    retention_years INTEGER NOT NULL DEFAULT 3 CHECK (retention_years > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_folders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_id INTEGER REFERENCES document_folders(id) ON DELETE RESTRICT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(160) NOT NULL,
    document_number VARCHAR(80) UNIQUE NOT NULL,
    category_id INTEGER NOT NULL REFERENCES document_categories(id),
    folder_id INTEGER REFERENCES document_folders(id) ON DELETE RESTRICT,
    owner_name VARCHAR(120),
    reference_number VARCHAR(80),
    document_date DATE,
    description TEXT,
    file_path VARCHAR(255),
    mime_type VARCHAR(120),
    file_size INTEGER,
    original_file_name VARCHAR(255),
    visibility VARCHAR(20) NOT NULL DEFAULT 'INTERNAL' CHECK (visibility IN ('PRIVATE', 'INTERNAL', 'SHARED')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
    approval_status VARCHAR(20) NOT NULL DEFAULT 'NOT_SUBMITTED' CHECK (approval_status IN ('NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED')),
    reviewer_id INTEGER REFERENCES users(id),
    review_comment TEXT,
    submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    retention_years INTEGER NOT NULL DEFAULT 3 CHECK (retention_years > 0),
    retention_due_at DATE NOT NULL,
    current_version_id INTEGER,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_shares (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (document_id, user_id)
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

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'documents' AND constraint_name = 'documents_current_version_fk'
    ) THEN
        ALTER TABLE documents
            ADD CONSTRAINT documents_current_version_fk
            FOREIGN KEY (id, current_version_id) REFERENCES document_versions(document_id, id);
    END IF;
END $$;

INSERT INTO users (username, password_hash)
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (username) DO NOTHING;

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
