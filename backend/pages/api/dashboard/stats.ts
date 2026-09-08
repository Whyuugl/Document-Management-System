import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/database';
import { requireAuth, AuthenticatedRequest } from '../../../lib/middleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const totalResult = await pool.query('SELECT COUNT(*) as count FROM documents');
    const totalDocuments = parseInt(totalResult.rows[0].count);

    const categoryResult = await pool.query(`
      SELECT c.slug, c.name, COUNT(d.id) as count
      FROM document_categories c
      LEFT JOIN documents d ON d.category_id = c.id
      GROUP BY c.slug, c.name
      ORDER BY c.name
    `);

    const categories = categoryResult.rows.map((row) => ({
      slug: row.slug,
      name: row.name,
      count: parseInt(row.count)
    }));

    const thisMonthResult = await pool.query(
      `SELECT COUNT(*) as count 
       FROM documents
       WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`
    );
    const documentsThisMonth = parseInt(thisMonthResult.rows[0].count);

    const retensiResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE retention_due_at <= CURRENT_DATE) AS review,
        COUNT(*) FILTER (WHERE retention_due_at > CURRENT_DATE AND retention_due_at <= CURRENT_DATE + INTERVAL '90 days') AS segera,
        COUNT(*) FILTER (WHERE retention_due_at > CURRENT_DATE + INTERVAL '90 days') AS aktif
      FROM documents
    `);
    const retensi = retensiResult.rows[0] || {};

    res.status(200).json({
      success: true,
      data: {
        totalDocuments,
        categories,
        documentsThisMonth,
        retensiReview: parseInt(retensi.review || 0),
        retensiSegera: parseInt(retensi.segera || 0),
        retensiAktif: parseInt(retensi.aktif || 0)
      }
    });

  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

export default requireAuth(handler);

