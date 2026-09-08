import { NextApiResponse } from 'next';
import formidable from 'formidable';
import pool from '../../lib/database';
import { requireAuth, AuthenticatedRequest } from '../../lib/middleware';
import { getRemainingRetentionDays, getRetentionStatus } from '../../lib/retention';
import { allowedMimeTypes, maxUploadSize, saveUploadedFile } from '../../lib/storage';
import { requireDocumentAccess } from '../../lib/access';

export const config = {
  api: {
    bodyParser: false
  }
};

const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
const lifecycleStatuses = new Set(['DRAFT', 'ACTIVE', 'ARCHIVED']);
const visibilityStatuses = new Set(['PRIVATE', 'INTERNAL', 'SHARED']);

async function handler(req: AuthenticatedRequest, res: NextApiResponse): Promise<void> {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  if (req.method === 'POST') {
    const client = await pool.connect();
    try {
      const form = formidable({
        keepExtensions: true,
        maxFileSize: maxUploadSize,
        filter: ({ mimetype }) => !!mimetype && allowedMimeTypes.has(mimetype)
      });
      const [fields, files] = await form.parse(req);

      const categorySlug = first(fields.category);
      const title = first(fields.title);
      const documentNumber = first(fields.document_number);
      const folderId = Number(first(fields.folder_id)) || null;
      const ownerName = first(fields.owner_name);
      const referenceNumber = first(fields.reference_number);
      const documentDate = first(fields.document_date) || new Date().toISOString().slice(0, 10);
      const description = first(fields.description) || null;
      const status = first(fields.status) || 'ACTIVE';
      const visibility = first(fields.visibility) || 'INTERNAL';

      if (!categorySlug || !title || !documentNumber || !files.file) {
        return res.status(400).json({ success: false, error: 'Category, title, document number, and file wajib diisi' });
      }
      if (!lifecycleStatuses.has(status)) {
        return res.status(400).json({ success: false, error: 'Status document tidak valid' });
      }
      if (!visibilityStatuses.has(visibility)) {
        return res.status(400).json({ success: false, error: 'Visibility document tidak valid' });
      }

      const category = await client.query('SELECT id, retention_years FROM document_categories WHERE slug = $1', [categorySlug]);
      if (!category.rowCount) {
        return res.status(400).json({ success: false, error: 'Category tidak ditemukan' });
      }

      const uploaded = await saveUploadedFile(Array.isArray(files.file) ? files.file[0] : files.file);
      const retentionYears = category.rows[0].retention_years;

      await client.query('BEGIN');
      const documentResult = await client.query(
        `INSERT INTO documents (
          title, document_number, category_id, folder_id, owner_name, reference_number,
          document_date, description, file_path, mime_type, file_size, original_file_name,
          status, visibility, retention_years, retention_due_at, created_by
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          $13, $14, $15, ($7::date + ($15 || ' years')::interval)::date, $16
        )
        RETURNING id, title, document_number`,
        [
          title.trim(),
          documentNumber.trim(),
          category.rows[0].id,
          folderId,
          ownerName || title,
          referenceNumber || documentNumber,
          documentDate,
          description,
          uploaded.filePath,
          uploaded.mimeType,
          uploaded.fileSize,
          uploaded.originalFileName,
          status,
          visibility,
          retentionYears,
          req.user.id
        ]
      );

      const versionResult = await client.query(
        `INSERT INTO document_versions (document_id, version_number, file_path, original_file_name, mime_type, file_size, notes, uploaded_by)
         VALUES ($1, 1, $2, $3, $4, $5, 'Initial version', $6)
         RETURNING id`,
        [documentResult.rows[0].id, uploaded.filePath, uploaded.originalFileName, uploaded.mimeType, uploaded.fileSize, req.user.id]
      );

      await client.query('UPDATE documents SET current_version_id = $1 WHERE id = $2', [versionResult.rows[0].id, documentResult.rows[0].id]);
      await client.query(
        `INSERT INTO activity_logs (action, entity_type, entity_id, message, created_by)
         VALUES ('DOCUMENT_CREATED', 'document', $1, $2, $3)`,
        [documentResult.rows[0].id, `Uploaded ${title.trim()}`, req.user.id]
      );
      await client.query('COMMIT');

      return res.status(201).json({ success: true, message: 'Document uploaded', data: documentResult.rows[0] });
    } catch (error: any) {
      await client.query('ROLLBACK').catch(() => undefined);
      if (error.code === '23505') {
        return res.status(400).json({ success: false, error: 'Document number sudah ada' });
      }
      return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    } finally {
      client.release();
    }
  }

  if (req.method === 'GET') {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(10, Number(req.query.limit) || 10));
      const offset = (page - 1) * limit;
      const { category, folder, search, status, retention, date_from, date_to, scope, approval, owner, reference, file_type, visibility } = req.query;

      const params: any[] = [];
      const conditions = [];

      conditions.push(`(d.created_by = $${params.length + 1} OR d.visibility = 'INTERNAL' OR (d.visibility = 'SHARED' AND shared_current.id IS NOT NULL) OR d.reviewer_id = $${params.length + 1})`);
      params.push(req.user.id);

      if (scope === 'shared-with-me') {
        conditions.push(`shared_current.id IS NOT NULL AND d.created_by <> $${params.length + 1}`);
        params.push(req.user.id);
      }

      if (scope === 'mine') {
        conditions.push(`d.created_by = $${params.length + 1}`);
        params.push(req.user.id);
      }

      if (scope === 'pending-review') {
        conditions.push(`d.reviewer_id = $${params.length + 1} AND d.approval_status = 'PENDING'`);
        params.push(req.user.id);
      }

      if (category) {
        conditions.push(`c.slug = $${params.length + 1}`);
        params.push(category);
      }

      if (folder) {
        conditions.push(`d.folder_id = $${params.length + 1}`);
        params.push(Number(folder));
      }

      if (status && status !== 'ALL') {
        conditions.push(`d.status = $${params.length + 1}`);
        params.push(status);
      }

      if (approval && approval !== 'ALL') {
        conditions.push(`d.approval_status = $${params.length + 1}`);
        params.push(approval);
      }

      if (date_from) {
        conditions.push(`d.document_date >= $${params.length + 1}`);
        params.push(date_from);
      }

      if (date_to) {
        conditions.push(`d.document_date <= $${params.length + 1}`);
        params.push(date_to);
      }

      if (visibility && visibility !== 'ALL') {
        conditions.push(`d.visibility = $${params.length + 1}`);
        params.push(visibility);
      }

      if (owner) {
        conditions.push(`d.owner_name ILIKE $${params.length + 1}`);
        params.push(`%${owner}%`);
      }

      if (reference) {
        conditions.push(`(d.document_number ILIKE $${params.length + 1} OR d.reference_number ILIKE $${params.length + 1})`);
        params.push(`%${reference}%`);
      }

      if (file_type) {
        conditions.push(`(d.mime_type ILIKE $${params.length + 1} OR v.original_file_name ILIKE $${params.length + 1})`);
        params.push(`%${file_type}%`);
      }

      const searchText = String(search || '').trim();
      const searchParam = searchText ? params.length + 1 : 0;
      if (searchText) {
        conditions.push(`(
          to_tsvector('simple', coalesce(d.title, '') || ' ' || coalesce(d.document_number, '') || ' ' || coalesce(d.reference_number, '') || ' ' || coalesce(d.owner_name, '') || ' ' || coalesce(d.description, '') || ' ' || coalesce(d.original_file_name, ''))
          @@ websearch_to_tsquery('simple', $${searchParam})
          OR d.title ILIKE $${searchParam + 1}
          OR d.document_number ILIKE $${searchParam + 1}
          OR d.reference_number ILIKE $${searchParam + 1}
          OR d.owner_name ILIKE $${searchParam + 1}
          OR v.original_file_name ILIKE $${searchParam + 1}
        )`);
        params.push(searchText, `%${searchText}%`);
      }

      if (retention === 'EXPIRED') conditions.push('d.retention_due_at <= CURRENT_DATE');
      if (retention === 'EXPIRING_SOON') conditions.push("d.retention_due_at > CURRENT_DATE AND d.retention_due_at <= CURRENT_DATE + INTERVAL '90 days'");
      if (retention === 'ACTIVE') conditions.push("d.retention_due_at > CURRENT_DATE + INTERVAL '90 days'");

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const base = `
        FROM documents d
        JOIN document_categories c ON c.id = d.category_id
        LEFT JOIN document_folders f ON f.id = d.folder_id
        LEFT JOIN users u ON u.id = d.created_by
        LEFT JOIN users reviewer ON reviewer.id = d.reviewer_id
        LEFT JOIN document_versions v ON v.id = d.current_version_id
        LEFT JOIN document_shares shared_current ON shared_current.document_id = d.id AND shared_current.user_id = $1
        ${where}
      `;

      const result = await pool.query(
        `SELECT
          d.id,
          d.title,
          d.document_number,
          d.reference_number,
          d.owner_name,
          d.document_date,
          d.description,
          d.status,
          d.visibility,
          d.approval_status,
          d.reviewer_id,
          d.review_comment,
          d.submitted_at,
          d.reviewed_at,
          d.created_at,
          d.updated_at,
          d.retention_due_at,
          c.slug AS category_slug,
          c.name AS category_name,
          f.id AS folder_id,
          f.name AS folder_name,
          u.username AS created_by_username,
          reviewer.username AS reviewer_username,
          d.created_by = $${params.length + 3} AS can_manage,
          d.reviewer_id = $${params.length + 3} AND d.approval_status = 'PENDING' AS can_review,
          CASE WHEN shared_current.id IS NOT NULL THEN true ELSE false END AS shared_with_me,
          v.version_number AS current_version,
          v.original_file_name,
          v.mime_type,
          v.file_size,
          (SELECT COUNT(*)::int FROM document_versions all_versions WHERE all_versions.document_id = d.id) AS version_count
        ${base}
        ORDER BY ${searchText ? `ts_rank_cd(to_tsvector('simple', coalesce(d.title, '') || ' ' || coalesce(d.document_number, '') || ' ' || coalesce(d.reference_number, '') || ' ' || coalesce(d.owner_name, '') || ' ' || coalesce(d.description, '') || ' ' || coalesce(d.original_file_name, '')), websearch_to_tsquery('simple', $${searchParam})) DESC,` : ''} d.updated_at DESC, d.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset, req.user.id]
      );

      const data = result.rows.map((row) => {
        const retentionStatus = getRetentionStatus(row.retention_due_at);
        return {
          ...row,
          retention_status: retentionStatus,
          remaining_retention_days: getRemainingRetentionDays(row.retention_due_at),
          download_url: `/api/documents/${row.id}/download`,
          preview_url: `/api/documents/${row.id}/preview`
        };
      });
      const countResult = await pool.query(`SELECT COUNT(*) ${base}`, params);
      const total = Number(countResult.rows[0].count);

      return res.status(200).json({
        success: true,
        data,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const documentId = Number(req.query.id);
      const action = String(req.query.action || '');
      const requestedVisibility = String(req.query.visibility || '');
      const status = { archive: 'ARCHIVED', restore: 'ACTIVE' }[action];
      if (!Number.isInteger(documentId)) {
        return res.status(400).json({ success: false, error: 'Invalid document action' });
      }
      const access = await requireDocumentAccess(documentId, req.user.id, true);
      if (!access.ok) {
        return res.status(access.status || 403).json({ success: false, error: access.error });
      }

      if (action === 'visibility') {
        if (!visibilityStatuses.has(requestedVisibility)) {
          return res.status(400).json({ success: false, error: 'Visibility document tidak valid' });
        }
        const result = await pool.query(
          `UPDATE documents
           SET visibility = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2
           RETURNING id, title, visibility`,
          [requestedVisibility, documentId]
        );
        await pool.query(
          `INSERT INTO activity_logs (action, entity_type, entity_id, message, created_by)
           VALUES ('DOCUMENT_VISIBILITY_UPDATED', 'document', $1, $2, $3)`,
          [result.rows[0].id, `Changed visibility for ${result.rows[0].title}`, req.user.id]
        );
        return res.status(200).json({ success: true, data: result.rows[0] });
      }

      if (!status) {
        return res.status(400).json({ success: false, error: 'Invalid document action' });
      }

      const result = await pool.query(
        `UPDATE documents
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, title, status`,
        [status, documentId]
      );
      if (!result.rowCount) {
        return res.status(404).json({ success: false, error: 'Document not found' });
      }

      const activity = status === 'ARCHIVED' ? 'DOCUMENT_ARCHIVED' : 'DOCUMENT_RESTORED';
      await pool.query(
        `INSERT INTO activity_logs (action, entity_type, entity_id, message, created_by)
         VALUES ($1, 'document', $2, $3, $4)`,
        [activity, result.rows[0].id, `${status === 'ARCHIVED' ? 'Archived' : 'Restored'} ${result.rows[0].title}`, req.user.id]
      );

      return res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const documentNumber = String(req.query.document_number || '');
      if (!documentNumber) {
        return res.status(400).json({ success: false, error: 'Document number wajib diisi' });
      }

      const result = await pool.query('DELETE FROM documents WHERE document_number = $1 RETURNING id, title', [documentNumber]);
      if (result.rowCount && result.rows[0]) {
        await pool.query(
          `INSERT INTO activity_logs (action, entity_type, entity_id, message, created_by)
           VALUES ('DOCUMENT_DELETED', 'document', $1, $2, $3)`,
          [result.rows[0].id, `Deleted permanently ${result.rows[0].title}`, req.user.id]
        );
      }

      return res.status(200).json({ success: true, deleted: result.rowCount });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default requireAuth(handler);
