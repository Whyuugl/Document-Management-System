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

  if (req.method === 'POST') {
    const access = await requireDocumentAccess(documentId, req.user.id, true);
    if (!access.ok) {
      res.status(access.status || 403).json({ success: false, error: access.error });
      return;
    }

    const reviewerId = Number(req.body.reviewer_id);
    const comment = String(req.body.comment || '').trim() || null;
    if (!Number.isInteger(reviewerId) || reviewerId === req.user.id) {
      res.status(400).json({ success: false, error: 'Reviewer tidak valid' });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const reviewer = await client.query('SELECT username FROM users WHERE id = $1', [reviewerId]);
      if (!reviewer.rowCount) {
        await client.query('ROLLBACK');
        res.status(404).json({ success: false, error: 'Reviewer not found' });
        return;
      }

      const result = await client.query(
        `UPDATE documents
         SET approval_status = 'PENDING',
             reviewer_id = $1,
             review_comment = $2,
             submitted_at = CURRENT_TIMESTAMP,
             reviewed_at = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING id, title, approval_status, reviewer_id, review_comment, submitted_at, reviewed_at`,
        [reviewerId, comment, documentId]
      );

      await client.query(
        `INSERT INTO activity_logs (action, entity_type, entity_id, message, created_by)
         VALUES ('DOCUMENT_SUBMITTED_FOR_REVIEW', 'document', $1, $2, $3)`,
        [documentId, `Submitted ${result.rows[0].title} to ${reviewer.rows[0].username}`, req.user.id]
      );
      await client.query('COMMIT');
      res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      await client.query('ROLLBACK').catch(() => undefined);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    } finally {
      client.release();
    }
    return;
  }

  if (req.method === 'PATCH') {
    const decision = String(req.body.decision || '');
    const comment = String(req.body.comment || '').trim() || null;
    const nextStatus = { approve: 'APPROVED', reject: 'REJECTED' }[decision];
    if (!nextStatus) {
      res.status(400).json({ success: false, error: 'Approval decision tidak valid' });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const current = await client.query(
        `SELECT id, title, approval_status, reviewer_id
         FROM documents
         WHERE id = $1
         FOR UPDATE`,
        [documentId]
      );
      const document = current.rows[0];
      if (!document) {
        await client.query('ROLLBACK');
        res.status(404).json({ success: false, error: 'Document not found' });
        return;
      }
      if (document.reviewer_id !== req.user.id || document.approval_status !== 'PENDING') {
        await client.query('ROLLBACK');
        res.status(403).json({ success: false, error: 'Document tidak menunggu review dari user ini' });
        return;
      }

      const result = await client.query(
        `UPDATE documents
         SET approval_status = $1,
             review_comment = $2,
             reviewed_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING id, title, approval_status, reviewer_id, review_comment, submitted_at, reviewed_at`,
        [nextStatus, comment, documentId]
      );

      await client.query(
        `INSERT INTO activity_logs (action, entity_type, entity_id, message, created_by)
         VALUES ($1, 'document', $2, $3, $4)`,
        [
          decision === 'approve' ? 'DOCUMENT_APPROVED' : 'DOCUMENT_REJECTED',
          documentId,
          `${decision === 'approve' ? 'Approved' : 'Rejected'} ${document.title}`,
          req.user.id
        ]
      );
      await client.query('COMMIT');
      res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      await client.query('ROLLBACK').catch(() => undefined);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    } finally {
      client.release();
    }
    return;
  }

  res.setHeader('Allow', ['POST', 'PATCH']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default requireAuth(handler);
