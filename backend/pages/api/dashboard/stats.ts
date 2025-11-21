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

    // Get current date for month calculation
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Total arsip kependudukan (hitung distinct nama, karena satu orang bisa punya beberapa akta)
    const totalResult = await pool.query('SELECT COUNT(DISTINCT nama_lengkap) as count FROM arsip');
    const totalArsip = parseInt(totalResult.rows[0].count);

    // Total by jenis_arsip
    const jenisArsipResult = await pool.query(`
      SELECT jenis_arsip, COUNT(*) as count 
      FROM arsip 
      GROUP BY jenis_arsip
    `);

    // Convert to object for easy access
    const jenisArsipCounts: { [key: string]: number } = {};
    jenisArsipResult.rows.forEach(row => {
      jenisArsipCounts[row.jenis_arsip] = parseInt(row.count);
    });

    // Arsip bulan ini (using date_trunc for better PostgreSQL compatibility)
    const thisMonthResult = await pool.query(
      `SELECT COUNT(*) as count 
       FROM arsip 
       WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`
    );
    const arsipBulanIni = parseInt(thisMonthResult.rows[0].count);

    res.status(200).json({
      success: true,
      data: {
        totalArsip,
        kelahiran: jenisArsipCounts['kelahiran'] || 0,
        pernikahan: jenisArsipCounts['pernikahan'] || 0,
        perceraian: jenisArsipCounts['perceraian'] || 0,
        kematian: jenisArsipCounts['kematian'] || 0,
        arsipBulanIni
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

