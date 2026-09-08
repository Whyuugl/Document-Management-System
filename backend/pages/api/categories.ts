import { NextApiResponse } from 'next';
import pool from '../../lib/database';
import { requireAuth, AuthenticatedRequest } from '../../lib/middleware';

const slugify = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const normalizeRetentionYears = (value: unknown) => {
  const years = Number(value);
  return Number.isInteger(years) && years > 0 ? years : null;
};

async function handler(req: AuthenticatedRequest, res: NextApiResponse): Promise<void> {
  if (req.method === 'GET') {
    const result = await pool.query(`
      SELECT
        c.id,
        c.slug,
        c.name,
        c.description,
        c.retention_years,
        c.updated_at,
        COUNT(d.id)::int AS document_count
      FROM document_categories c
      LEFT JOIN documents d ON d.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name
    `);

    res.status(200).json({ success: true, data: result.rows });
    return;
  }

  if (req.method === 'POST') {
    const { name, description, retention_years } = req.body;
    const retentionYears = normalizeRetentionYears(retention_years) || 3;
    if (!name?.trim()) {
      res.status(400).json({ success: false, error: 'Name wajib diisi' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO document_categories (slug, name, description, retention_years)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [slugify(name), name.trim(), description || null, retentionYears]
    );

    await pool.query(
      `INSERT INTO activity_logs (action, entity_type, entity_id, message, created_by)
       VALUES ('CATEGORY_CREATED', 'category', $1, $2, $3)`,
      [result.rows[0].id, `Created category ${result.rows[0].name}`, req.user?.id || null]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
    return;
  }

  if (req.method === 'PUT') {
    const id = Number(req.query.id);
    const { name, description, retention_years } = req.body;
    const retentionYears = normalizeRetentionYears(retention_years);
    if (!Number.isInteger(id) || !name?.trim() || !retentionYears) {
      res.status(400).json({ success: false, error: 'Data category tidak valid' });
      return;
    }

    const result = await pool.query(
      `UPDATE document_categories
       SET name = $1, description = $2, retention_years = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [name.trim(), description || null, retentionYears, id]
    );
    if (!result.rowCount) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    await pool.query(
      `INSERT INTO activity_logs (action, entity_type, entity_id, message, created_by)
       VALUES ('CATEGORY_UPDATED', 'category', $1, $2, $3)`,
      [result.rows[0].id, `Updated category ${result.rows[0].name}`, req.user?.id || null]
    );

    res.status(200).json({ success: true, data: result.rows[0] });
    return;
  }

  if (req.method === 'DELETE') {
    const id = Number(req.query.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ success: false, error: 'Invalid category id' });
      return;
    }

    const used = await pool.query('SELECT COUNT(*)::int AS count FROM documents WHERE category_id = $1', [id]);
    if (used.rows[0].count > 0) {
      res.status(400).json({ success: false, error: 'Category masih dipakai document' });
      return;
    }

    const deleted = await pool.query('DELETE FROM document_categories WHERE id = $1 RETURNING id, name', [id]);
    if (deleted.rows[0]) {
      await pool.query(
        `INSERT INTO activity_logs (action, entity_type, entity_id, message, created_by)
         VALUES ('CATEGORY_DELETED', 'category', $1, $2, $3)`,
        [deleted.rows[0].id, `Deleted category ${deleted.rows[0].name}`, req.user?.id || null]
      );
    }
    res.status(200).json({ success: true });
    return;
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default requireAuth(handler);
