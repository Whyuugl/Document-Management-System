import { NextApiResponse } from 'next';
import pool from '../../lib/database';
import { requireAuth, AuthenticatedRequest } from '../../lib/middleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const result = await pool.query(
    `SELECT *
     FROM (
       SELECT
         ('retention-' || d.id) AS id,
         CASE WHEN d.retention_due_at <= CURRENT_DATE THEN 'RETENTION_EXPIRED' ELSE 'RETENTION_DUE_SOON' END AS type,
         d.id AS document_id,
         d.title,
         CASE
           WHEN d.retention_due_at <= CURRENT_DATE THEN 'Retention review is overdue'
           ELSE 'Retention review is due soon'
         END AS message,
         d.retention_due_at::timestamp AS event_at
       FROM documents d
       WHERE d.created_by = $1
         AND d.status <> 'ARCHIVED'
         AND d.retention_due_at <= CURRENT_DATE + INTERVAL '90 days'

       UNION ALL

       SELECT
         ('approval-' || d.id) AS id,
         'APPROVAL_PENDING' AS type,
         d.id AS document_id,
         d.title,
         'Document is waiting for your review' AS message,
         COALESCE(d.submitted_at, d.updated_at) AS event_at
       FROM documents d
       WHERE d.reviewer_id = $1
         AND d.approval_status = 'PENDING'

       UNION ALL

       SELECT
         ('share-' || s.document_id || '-' || s.user_id) AS id,
         'DOCUMENT_SHARED' AS type,
         d.id AS document_id,
         d.title,
         'Document was shared with you' AS message,
         s.created_at AS event_at
       FROM document_shares s
       JOIN documents d ON d.id = s.document_id
       WHERE s.user_id = $1
     ) notifications
     ORDER BY event_at DESC
     LIMIT 30`,
    [req.user.id]
  );

  res.status(200).json({
    success: true,
    data: result.rows,
    unread: result.rowCount
  });
}

export default requireAuth(handler);
