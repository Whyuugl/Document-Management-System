import { NextApiResponse } from 'next';
import pool from '../../../../lib/database';
import { requireAuth, AuthenticatedRequest } from '../../../../lib/middleware';
import { requireDocumentAccess } from '../../../../lib/access';

async function handler(req: AuthenticatedRequest, res: NextApiResponse): Promise<void> {
  const documentId = Number(req.query.id);
  if (!Number.isInteger(documentId) || !req.user) {
    res.status(400).json({ success: false, error: 'Invalid document id' });
    return;
  }

  const access = await requireDocumentAccess(documentId, req.user.id, true);
  if (!access.ok) {
    res.status(access.status || 403).json({ success: false, error: access.error });
    return;
  }

  if (req.method === 'GET') {
    const result = await pool.query(
      `SELECT s.user_id, u.username, s.created_at
       FROM document_shares s
       JOIN users u ON u.id = s.user_id
       WHERE s.document_id = $1
       ORDER BY u.username`,
      [documentId]
    );
    res.status(200).json({ success: true, data: result.rows });
    return;
  }

  if (req.method === 'POST') {
    const userId = Number(req.body.user_id);
    if (!Number.isInteger(userId) || userId === req.user.id) {
      res.status(400).json({ success: false, error: 'User share tidak valid' });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const user = await client.query('SELECT username FROM users WHERE id = $1', [userId]);
      if (!user.rowCount) {
        await client.query('ROLLBACK');
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      await client.query(
        `INSERT INTO document_shares (document_id, user_id, shared_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (document_id, user_id) DO NOTHING`,
        [documentId, userId, req.user.id]
      );
      await client.query("UPDATE documents SET visibility = 'SHARED', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [documentId]);
      await client.query(
        `INSERT INTO activity_logs (action, entity_type, entity_id, message, created_by)
         VALUES ('DOCUMENT_SHARED', 'document', $1, $2, $3)`,
        [documentId, `Shared document with ${user.rows[0].username}`, req.user.id]
      );
      await client.query('COMMIT');
      res.status(201).json({ success: true });
    } catch (error: any) {
      await client.query('ROLLBACK').catch(() => undefined);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    } finally {
      client.release();
    }
    return;
  }

  if (req.method === 'DELETE') {
    const userId = Number(req.query.user_id);
    if (!Number.isInteger(userId)) {
      res.status(400).json({ success: false, error: 'Invalid user id' });
      return;
    }

    const result = await pool.query(
      `DELETE FROM document_shares
       WHERE document_id = $1 AND user_id = $2
       RETURNING user_id`,
      [documentId, userId]
    );

    if (result.rowCount) {
      await pool.query(
        `INSERT INTO activity_logs (action, entity_type, entity_id, message, created_by)
         VALUES ('DOCUMENT_ACCESS_REVOKED', 'document', $1, 'Revoked document access', $2)`,
        [documentId, req.user.id]
      );
    }

    res.status(200).json({ success: true });
    return;
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default requireAuth(handler);
