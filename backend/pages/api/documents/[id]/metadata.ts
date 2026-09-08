import { NextApiResponse } from 'next';
import pool from '../../../../lib/database';
import { requireAuth, AuthenticatedRequest } from '../../../../lib/middleware';
import { requireDocumentAccess } from '../../../../lib/access';

async function handler(req: AuthenticatedRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const documentId = Number(req.query.id);
  const { title, owner_name, reference_number, document_date, description, category_id, folder_id } = req.body;
  if (!Number.isInteger(documentId) || !title?.trim()) {
    res.status(400).json({ success: false, error: 'Invalid document metadata' });
    return;
  }
  const access = await requireDocumentAccess(documentId, req.user?.id || 0, true);
  if (!access.ok) {
    res.status(access.status || 403).json({ success: false, error: access.error });
    return;
  }

  const result = await pool.query(
    `UPDATE documents
     SET title = $1,
         owner_name = $2,
         reference_number = $3,
         document_date = $4,
         description = $5,
         category_id = COALESCE($6, category_id),
         folder_id = $7,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $8
     RETURNING id, title`,
    [title.trim(), owner_name || null, reference_number || null, document_date || null, description || null, category_id || null, folder_id || null, documentId]
  );

  if (!result.rowCount) {
    res.status(404).json({ success: false, error: 'Document not found' });
    return;
  }

  await pool.query(
    `INSERT INTO activity_logs (action, entity_type, entity_id, message, created_by)
     VALUES ('DOCUMENT_METADATA_UPDATED', 'document', $1, $2, $3)`,
    [result.rows[0].id, `Updated metadata for ${result.rows[0].title}`, req.user?.id || null]
  );

  res.status(200).json({ success: true, data: result.rows[0] });
}

export default requireAuth(handler);
