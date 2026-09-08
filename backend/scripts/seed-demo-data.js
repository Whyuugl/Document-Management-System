require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'arsip_kependudukan',
  password: process.env.DB_PASSWORD || 'admin',
  port: parseInt(process.env.DB_PORT || '5432'),
});

const categories = [
  ['incoming-mail', 'Incoming Mail', 'Letters and documents received by the office', 3],
  ['outgoing-mail', 'Outgoing Mail', 'Letters and documents issued by the office', 3],
  ['finance', 'Finance', 'Invoices, receipts, budgets, and financial records', 5],
  ['hr', 'Human Resources', 'Employee and staffing documents', 5],
  ['contracts', 'Contracts', 'Agreements and procurement contracts', 7],
  ['assets', 'Assets', 'Asset ownership, inventory, and maintenance records', 5],
  ['legal', 'Legal', 'Regulation, compliance, and legal documents', 10],
  ['operations', 'Operations', 'SOP, meeting minutes, and daily office records', 3],
];

const folders = [
  ['Executive Office', null, 'Leadership correspondence and strategic documents'],
  ['Finance Department', null, 'Budgeting, invoice, and payment documents'],
  ['Human Resources', null, 'Employee administration records'],
  ['Legal & Compliance', null, 'Legal records and compliance evidence'],
  ['Procurement', null, 'Vendor and purchasing documents'],
  ['Facilities', null, 'Office asset and facility documents'],
  ['Incoming 2026', 'Executive Office', 'Incoming letters for 2026'],
  ['Outgoing 2026', 'Executive Office', 'Outgoing letters for 2026'],
];

const docs = [
  ['Quarterly Budget Review Q1', 'FIN-2026-001', 'finance', 'Finance Department', 'Finance Team', 'BR-Q1-2026', '2026-01-12', 'ACTIVE', 'INTERNAL'],
  ['Vendor Payment Receipt - Office Supplies', 'FIN-2026-002', 'finance', 'Finance Department', 'Procurement Unit', 'PAY-OS-204', '2026-02-03', 'ACTIVE', 'PRIVATE'],
  ['Annual Procurement Plan', 'PRC-2026-001', 'operations', 'Procurement', 'Procurement Unit', 'RUP-2026', '2026-01-20', 'ACTIVE', 'SHARED'],
  ['Service Contract - Building Maintenance', 'CTR-2026-001', 'contracts', 'Procurement', 'Facilities Unit', 'CTR-BM-26', '2026-03-11', 'ACTIVE', 'SHARED'],
  ['Employment Agreement - Staff Administration', 'HR-2026-001', 'hr', 'Human Resources', 'HR Department', 'EMP-ADM-77', '2026-02-18', 'ACTIVE', 'PRIVATE'],
  ['Employee Training Attendance List', 'HR-2026-002', 'hr', 'Human Resources', 'Training Unit', 'TRN-2026-04', '2026-04-08', 'DRAFT', 'INTERNAL'],
  ['Incoming Letter - Regional Coordination', 'IN-2026-001', 'incoming-mail', 'Incoming 2026', 'Executive Office', 'REG-COOR-16', '2026-05-02', 'ACTIVE', 'INTERNAL'],
  ['Incoming Letter - Audit Request', 'IN-2026-002', 'incoming-mail', 'Incoming 2026', 'Internal Audit', 'AUD-REQ-09', '2026-05-15', 'ACTIVE', 'SHARED'],
  ['Outgoing Letter - Partner Invitation', 'OUT-2026-001', 'outgoing-mail', 'Outgoing 2026', 'Executive Office', 'INV-PTN-44', '2026-06-01', 'ACTIVE', 'INTERNAL'],
  ['Outgoing Letter - Budget Confirmation', 'OUT-2026-002', 'outgoing-mail', 'Outgoing 2026', 'Finance Team', 'CONF-BDG-88', '2026-06-18', 'ARCHIVED', 'PRIVATE'],
  ['Asset Handover Report - Laptops', 'AST-2026-001', 'assets', 'Facilities', 'IT Support', 'AST-LTP-31', '2026-07-04', 'ACTIVE', 'INTERNAL'],
  ['Vehicle Maintenance Record', 'AST-2026-002', 'assets', 'Facilities', 'Facilities Unit', 'VEH-MTN-12', '2026-07-16', 'ACTIVE', 'INTERNAL'],
  ['Compliance Review Memo', 'LEG-2026-001', 'legal', 'Legal & Compliance', 'Legal Officer', 'CRM-2026', '2026-08-05', 'ACTIVE', 'SHARED'],
  ['Policy Draft - Document Retention', 'LEG-2026-002', 'legal', 'Legal & Compliance', 'Compliance Team', 'POL-RET-02', '2026-08-25', 'DRAFT', 'PRIVATE'],
  ['Meeting Minutes - Management Weekly', 'OPS-2026-001', 'operations', 'Executive Office', 'Management Office', 'MM-2026-33', '2026-09-01', 'ACTIVE', 'INTERNAL'],
  ['Standard Operating Procedure - Front Desk', 'OPS-2026-002', 'operations', 'Executive Office', 'Operations Team', 'SOP-FD-2026', '2023-09-05', 'ACTIVE', 'INTERNAL'],
  ['Archived Invoice Batch 2021', 'FIN-2021-014', 'finance', 'Finance Department', 'Finance Team', 'INV-BATCH-21', '2021-08-10', 'ARCHIVED', 'SHARED'],
  ['Expired General Memo 2022', 'OPS-2022-003', 'operations', 'Executive Office', 'Operations Team', 'MEMO-OLD-22', '2022-04-12', 'ACTIVE', 'INTERNAL'],
];

const pdf = (title) => `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 160]/Contents 4 0 R>>endobj
4 0 obj<</Length 70>>stream
BT /F1 14 Tf 30 95 Td (${title.replace(/[()]/g, '')}) Tj ET
endstream endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000056 00000 n 
0000000111 00000 n 
0000000198 00000 n 
trailer<</Root 1 0 R/Size 5>>
startxref
318
%%EOF`;

async function main() {
  const client = await pool.connect();
  try {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'documents');
    fs.mkdirSync(uploadDir, { recursive: true });

    await client.query('BEGIN');
    await client.query('UPDATE documents SET current_version_id = NULL');
    await client.query('DELETE FROM activity_logs');
    await client.query('DELETE FROM documents');
    await client.query('DELETE FROM document_folders');
    await client.query('DELETE FROM document_categories');

    const categoryIds = new Map();
    for (const item of categories) {
      const result = await client.query(
        `INSERT INTO document_categories (slug, name, description, retention_years)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        item
      );
      categoryIds.set(item[0], result.rows[0].id);
    }

    const folderIds = new Map();
    for (const [name, parentName, description] of folders) {
      const result = await client.query(
        `INSERT INTO document_folders (name, parent_id, description)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [name, parentName ? folderIds.get(parentName) : null, description]
      );
      folderIds.set(name, result.rows[0].id);
    }

    const userResult = await client.query("SELECT id FROM users WHERE username = 'admin' LIMIT 1");
    const userId = userResult.rows[0]?.id || null;
    const demoPassword = await bcrypt.hash('demo123', 10);
    const demoUsers = {};
    for (const username of ['user1', 'user2', 'auditor']) {
      const result = await client.query(
        `INSERT INTO users (username, password_hash)
         VALUES ($1, $2)
         ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
         RETURNING id`,
        [username, demoPassword]
      );
      demoUsers[username] = result.rows[0].id;
    }

    for (const [index, item] of docs.entries()) {
      const [title, number, categorySlug, folderName, owner, reference, date, status, visibility] = item;
      const fileName = `demo-${number.toLowerCase()}.pdf`;
      fs.writeFileSync(path.join(uploadDir, fileName), pdf(title));

      const docResult = await client.query(
        `INSERT INTO documents (
          title, document_number, category_id, folder_id, owner_name, reference_number,
          document_date, description, file_path, mime_type, file_size, original_file_name,
          status, visibility, retention_years, retention_due_at, created_by, created_at, updated_at
        )
        SELECT $1, $2, c.id, $3, $4, $5, $6, $7, $8, 'application/pdf', $9, $10,
          $11, $12, c.retention_years, ($6::date + (c.retention_years || ' years')::interval)::date, $13,
          $14::timestamp, $14::timestamp
        FROM document_categories c
        WHERE c.slug = $15
        RETURNING id`,
        [
          title,
          number,
          folderIds.get(folderName),
          owner,
          reference,
          date,
          `Demo document for ${owner}.`,
          `/uploads/documents/${fileName}`,
          fs.statSync(path.join(uploadDir, fileName)).size,
          fileName,
          status,
          visibility,
          userId,
          `${date} 09:00:00`,
          categorySlug,
        ]
      );

      const versionResult = await client.query(
        `INSERT INTO document_versions (document_id, version_number, file_path, original_file_name, mime_type, file_size, notes, uploaded_by, uploaded_at)
         VALUES ($1, 1, $2, $3, 'application/pdf', $4, 'Initial demo version', $5, $6::timestamp)
         RETURNING id`,
        [docResult.rows[0].id, `/uploads/documents/${fileName}`, fileName, fs.statSync(path.join(uploadDir, fileName)).size, userId, `${date} 09:15:00`]
      );

      await client.query('UPDATE documents SET current_version_id = $1 WHERE id = $2', [versionResult.rows[0].id, docResult.rows[0].id]);

      if (index % 5 === 0) {
        const versionFileName = `demo-${number.toLowerCase()}-v2.pdf`;
        fs.writeFileSync(path.join(uploadDir, versionFileName), pdf(`${title} v2`));
        const nextVersion = await client.query(
          `INSERT INTO document_versions (document_id, version_number, file_path, original_file_name, mime_type, file_size, notes, uploaded_by, uploaded_at)
           VALUES ($1, 2, $2, $3, 'application/pdf', $4, 'Revised demo version', $5, ($6::timestamp + INTERVAL '1 day'))
           RETURNING id`,
          [docResult.rows[0].id, `/uploads/documents/${versionFileName}`, versionFileName, fs.statSync(path.join(uploadDir, versionFileName)).size, userId, `${date} 09:15:00`]
        );
        await client.query(
          `UPDATE documents SET current_version_id = $1, file_path = $2, original_file_name = $3, file_size = $4 WHERE id = $5`,
          [nextVersion.rows[0].id, `/uploads/documents/${versionFileName}`, versionFileName, fs.statSync(path.join(uploadDir, versionFileName)).size, docResult.rows[0].id]
        );
      }

      await client.query(
        `INSERT INTO activity_logs (action, entity_type, entity_id, message, created_by, created_at)
         VALUES ('DOCUMENT_CREATED', 'document', $1, $2, $3, $4::timestamp)`,
        [docResult.rows[0].id, `Uploaded ${title}`, userId, `${date} 10:00:00`]
      );

      if (visibility === 'SHARED') {
        await client.query(
          `INSERT INTO document_shares (document_id, user_id, shared_by)
           VALUES ($1, $2, $3), ($1, $4, $3)
           ON CONFLICT (document_id, user_id) DO NOTHING`,
          [docResult.rows[0].id, demoUsers.user1, userId, demoUsers.auditor]
        );
      }
    }

    await client.query(
      `UPDATE documents
       SET approval_status = 'PENDING', reviewer_id = $1, review_comment = 'Please review procurement completeness.', submitted_at = CURRENT_TIMESTAMP
       WHERE document_number IN ('PRC-2026-001', 'LEG-2026-001')`,
      [demoUsers.user1]
    );
    await client.query(
      `UPDATE documents
       SET approval_status = 'APPROVED', reviewer_id = $1, review_comment = 'Approved for filing.', submitted_at = CURRENT_TIMESTAMP - INTERVAL '2 days', reviewed_at = CURRENT_TIMESTAMP - INTERVAL '1 day'
       WHERE document_number IN ('FIN-2026-001', 'CTR-2026-001')`,
      [demoUsers.auditor]
    );
    await client.query(
      `UPDATE documents
       SET approval_status = 'REJECTED', reviewer_id = $1, review_comment = 'Missing supporting attachment.', submitted_at = CURRENT_TIMESTAMP - INTERVAL '2 days', reviewed_at = CURRENT_TIMESTAMP - INTERVAL '1 day'
       WHERE document_number = 'HR-2026-002'`,
      [demoUsers.auditor]
    );
    await client.query(
      `INSERT INTO activity_logs (action, entity_type, entity_id, message, created_by)
       SELECT 'DOCUMENT_SUBMITTED_FOR_REVIEW', 'document', id, 'Submitted ' || title || ' for review', $1
       FROM documents
       WHERE approval_status = 'PENDING'`,
      [userId]
    );
    await client.query(
      `INSERT INTO activity_logs (action, entity_type, entity_id, message, created_by)
       SELECT 'DOCUMENT_APPROVED', 'document', id, 'Approved ' || title, reviewer_id
       FROM documents
       WHERE approval_status = 'APPROVED'`
    );
    await client.query(
      `INSERT INTO activity_logs (action, entity_type, entity_id, message, created_by)
       SELECT 'DOCUMENT_REJECTED', 'document', id, 'Rejected ' || title, reviewer_id
       FROM documents
       WHERE approval_status = 'REJECTED'`
    );

    await client.query(
      `INSERT INTO activity_logs (action, entity_type, entity_id, message, created_by)
       SELECT 'CATEGORY_CREATED', 'category', id, 'Seeded category ' || name, $1 FROM document_categories`,
      [userId]
    );
    await client.query(
      `INSERT INTO activity_logs (action, entity_type, entity_id, message, created_by)
       SELECT 'FOLDER_CREATED', 'folder', id, 'Seeded folder ' || name, $1 FROM document_folders`,
      [userId]
    );

    await client.query('COMMIT');
    console.log(`Seeded ${categories.length} categories, ${folders.length} folders, and ${docs.length} documents.`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
