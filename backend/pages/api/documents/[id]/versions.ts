import { NextApiResponse } from 'next';
import formidable from 'formidable';
import pool from '../../../../lib/database';
import { requireAuth, AuthenticatedRequest } from '../../../../lib/middleware';
import { allowedMimeTypes, maxUploadSize, saveUploadedFile } from '../../../../lib/storage';
import { requireDocumentAccess } from '../../../../lib/access';

export const config = {
  api: {
    bodyParser: false
  }
};

async function handler(req: AuthenticatedRequest, res: NextApiResponse): Promise<void> {
  const documentId = Number(req.query.id);
  if (!Number.isInteger(documentId)) {
    res.status(400).json({ success: false, error: 'Invalid document id' });
    return;
  }

  if (req.method === 'GET') {
    const access = await requireDocumentAccess(documentId, req.user?.id || 0);
    if (!access.ok) {
      res.status(access.status || 403).json({ success: false, error: access.error });
      return;
    }

    const result = await pool.query(
      `SELECT v.id, v.version_number, v.original_file_name, v.mime_type, v.file_size, v.notes, v.uploaded_at, u.username AS uploaded_by_username,
        (d.current_version_id = v.id) AS is_current
       FROM document_versions v
       JOIN documents d ON d.id = v.document_id
       LEFT JOIN users u ON u.id = v.uploaded_by
       WHERE v.document_id = $1
       ORDER BY v.version_number DESC`,
      [documentId]
    );

    res.status(200).json({ success: true, data: result.rows });
    return;
  }

  if (req.method === 'POST') {
    const access = await requireDocumentAccess(documentId, req.user?.id || 0, true);
    if (!access.ok) {
      res.status(access.status || 403).json({ success: false, error: access.error });
      return;
    }

    const form = formidable({
      keepExtensions: true,
      maxFileSize: maxUploadSize,
      filter: ({ mimetype }) => !!mimetype && allowedMimeTypes.has(mimetype)
    });
    const [fields, files] = await form.parse(req);
    if (!files.file) {
      res.status(400).json({ success: false, error: 'File wajib diisi' });
      return;
    }

    const uploaded = await saveUploadedFile(Array.isArray(files.file) ? files.file[0] : files.file);
    const notes = Array.isArray(fields.notes) ? fields.notes[0] : fields.notes;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const documentResult = await client.query('SELECT id, title FROM documents WHERE id = $1 FOR UPDATE', [documentId]);
      if (!documentResult.rowCount) {
        await client.query('ROLLBACK');
        res.status(404).json({ success: false, error: 'Document not found' });
        return;
      }

      const result = await client.query(
        `WITH next_version AS (
          SELECT COALESCE(MAX(version_number), 0) + 1 AS version_number
          FROM document_versions
          WHERE document_id = $1
        )
        INSERT INTO document_versions (document_id, version_number, file_path, original_file_name, mime_type, file_size, notes, uploaded_by)
        SELECT $1, version_number, $2, $3, $4, $5, $6, $7
        FROM next_version
        RETURNING id, version_number`,
        [documentId, uploaded.filePath, uploaded.originalFileName, uploaded.mimeType, uploaded.fileSize, notes || 'Updated version', req.user?.id || null]
      );

      await client.query(
        `UPDATE documents
         SET file_path = $1, original_file_name = $2, mime_type = $3, file_size = $4, current_version_id = $5, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6`,
        [uploaded.filePath, uploaded.originalFileName, uploaded.mimeType, uploaded.fileSize, result.rows[0].id, documentId]
      );

      await client.query(
        `INSERT INTO activity_logs (action, entity_type, entity_id, message, created_by)
         VALUES ('DOCUMENT_VERSION_CREATED', 'document', $1, $2, $3)`,
        [documentId, `Uploaded version ${result.rows[0].version_number} for ${documentResult.rows[0].title}`, req.user?.id || null]
      );
      await client.query('COMMIT');

      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
    return;
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default requireAuth(handler);
