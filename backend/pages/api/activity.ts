import { NextApiResponse } from 'next';
import pool from '../../lib/database';
import { requireAuth, AuthenticatedRequest } from '../../lib/middleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const result = await pool.query(`
    SELECT
      l.id,
      l.action,
      l.entity_type,
      l.entity_id,
      l.message,
      l.created_at,
      u.username AS created_by_username
    FROM activity_logs l
    LEFT JOIN users u ON u.id = l.created_by
    ORDER BY l.created_at DESC
    LIMIT 50
  `);

  res.status(200).json({ success: true, data: result.rows });
}

export default requireAuth(handler);
