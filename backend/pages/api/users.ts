import { NextApiResponse } from 'next';
import pool from '../../lib/database';
import { requireAuth, AuthenticatedRequest } from '../../lib/middleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const result = await pool.query(
    `SELECT id, username
     FROM users
     WHERE id <> $1
     ORDER BY username`,
    [req.user?.id || 0]
  );

  res.status(200).json({ success: true, data: result.rows });
}

export default requireAuth(handler);
