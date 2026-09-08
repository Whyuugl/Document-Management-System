import pool from './database';

export async function getDocumentAccess(documentId: number, userId: number) {
  const result = await pool.query(
    `SELECT
      d.id,
      d.created_by,
      d.visibility,
      CASE
        WHEN d.created_by = $2 THEN true
        WHEN d.visibility = 'INTERNAL' THEN true
        WHEN d.visibility = 'SHARED' AND s.id IS NOT NULL THEN true
        WHEN d.reviewer_id = $2 THEN true
        ELSE false
      END AS can_read,
      d.created_by = $2 AS can_manage
     FROM documents d
     LEFT JOIN document_shares s ON s.document_id = d.id AND s.user_id = $2
     WHERE d.id = $1`,
    [documentId, userId]
  );

  return result.rows[0] || null;
}

export async function requireDocumentAccess(documentId: number, userId: number, manage = false) {
  const access = await getDocumentAccess(documentId, userId);
  if (!access) return { ok: false, status: 404, error: 'Document not found' };
  if (manage ? !access.can_manage : !access.can_read) {
    return { ok: false, status: 403, error: 'Access denied' };
  }
  return { ok: true, access };
}
