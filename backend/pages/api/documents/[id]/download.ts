import path from 'path';
import { NextApiResponse } from 'next';
import pool from '../../../../lib/database';
import { requireAuth, AuthenticatedRequest } from '../../../../lib/middleware';
import { openStoredFile, safeHeaderFileName } from '../../../../lib/storage';
import { requireDocumentAccess } from '../../../../lib/access';

async function handler(req: AuthenticatedRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const documentId = Number(req.query.id);
  if (!Number.isInteger(documentId)) {
    res.status(400).json({ success: false, error: 'Invalid document id' });
    return;
  }
  const access = await requireDocumentAccess(documentId, req.user?.id || 0);
  if (!access.ok) {
    res.status(access.status || 403).json({ success: false, error: access.error });
    return;
  }

  const result = await pool.query(
    `SELECT d.id, d.title, v.file_path, v.mime_type, v.original_file_name
     FROM documents d
     LEFT JOIN document_versions v ON v.id = d.current_version_id
     WHERE d.id = $1`,
    [documentId]
  );

  const document = result.rows[0];
  if (!document?.file_path) {
    res.status(404).json({ success: false, error: 'File not found' });
    return;
  }

  try {
    const file = await openStoredFile(document.file_path);
    const fileName = safeHeaderFileName(document.original_file_name || path.basename(file.absolutePath));

    res.setHeader('Content-Type', document.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    await pool.query(
      `INSERT INTO activity_logs (action, entity_type, entity_id, message, created_by)
       VALUES ('DOCUMENT_DOWNLOADED', 'document', $1, $2, $3)`,
      [document.id, `Downloaded ${document.title}`, req.user?.id || null]
    );
    file.stream.pipe(res);
  } catch {
    res.status(404).json({ success: false, error: 'File not found' });
  }
}

export default requireAuth(handler);
