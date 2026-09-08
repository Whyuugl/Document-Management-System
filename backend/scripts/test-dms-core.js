require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const assert = require('assert');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'arsip_kependudukan',
  password: process.env.DB_PASSWORD || 'admin',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function main() {
  const tables = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = current_schema()
      AND table_name IN ('documents', 'document_versions', 'document_categories', 'document_folders', 'document_shares', 'activity_logs')
  `);
  assert.strictEqual(tables.rowCount, 6, 'Missing core DMS tables');

  const status = await pool.query(`
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'documents'
      AND constraint_name = 'documents_status_check'
      AND constraint_type = 'CHECK'
  `);
  assert.strictEqual(status.rowCount, 1, 'Missing document status constraint');

  const visibility = await pool.query(`
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'documents'
      AND constraint_name = 'documents_visibility_check'
      AND constraint_type = 'CHECK'
  `);
  assert.strictEqual(visibility.rowCount, 1, 'Missing document visibility constraint');

  const approval = await pool.query(`
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'documents'
      AND constraint_name = 'documents_approval_status_check'
      AND constraint_type = 'CHECK'
  `);
  assert.strictEqual(approval.rowCount, 1, 'Missing document approval status constraint');

  const retentionChecks = await pool.query(`
    SELECT constraint_name
    FROM information_schema.table_constraints
    WHERE constraint_type = 'CHECK'
      AND constraint_name IN ('document_categories_retention_years_check', 'documents_retention_years_check')
  `);
  assert.strictEqual(retentionChecks.rowCount, 2, 'Missing retention year constraints');

  const currentVersion = await pool.query(`
    SELECT COUNT(*)::int AS broken
    FROM documents d
    WHERE d.file_path IS NOT NULL
      AND d.current_version_id IS NULL
  `);
  assert.strictEqual(currentVersion.rows[0].broken, 0, 'Documents with files need current versions');

  const currentVersionOwner = await pool.query(`
    SELECT COUNT(*)::int AS broken
    FROM documents d
    JOIN document_versions v ON v.id = d.current_version_id
    WHERE v.document_id <> d.id
  `);
  assert.strictEqual(currentVersionOwner.rows[0].broken, 0, 'Current version must belong to the same document');

  const versionUniqueness = await pool.query(`
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'document_versions'
      AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%document_id%version_number%'
  `);
  assert.strictEqual(versionUniqueness.rowCount, 1, 'Missing unique document version number constraint');

  const folderDelete = await pool.query(`
    SELECT delete_rule
    FROM information_schema.referential_constraints
    WHERE constraint_name = 'documents_folder_id_fkey'
  `);
  assert.strictEqual(folderDelete.rows[0].delete_rule, 'RESTRICT', 'Folder delete must be restricted');

  const indexes = await pool.query(`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = current_schema()
      AND indexname IN (
        'idx_documents_category_id',
        'idx_documents_folder_id',
        'idx_documents_status',
        'idx_documents_visibility',
        'idx_documents_approval_status',
        'idx_documents_reviewer_id',
        'idx_documents_created_at',
        'idx_documents_search',
        'idx_document_shares_document_id',
        'idx_document_shares_user_id',
        'idx_document_versions_document_id',
        'idx_activity_logs_entity',
        'idx_activity_logs_created_by',
        'idx_activity_logs_created_at',
        'idx_document_folders_parent_id'
      )
  `);
  assert.strictEqual(indexes.rowCount, 15, 'Missing useful DMS indexes');

  console.log('DMS core checks passed.');
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
