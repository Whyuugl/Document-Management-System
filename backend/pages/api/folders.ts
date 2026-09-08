import { NextApiResponse } from 'next';
import pool from '../../lib/database';
import { requireAuth, AuthenticatedRequest } from '../../lib/middleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse): Promise<void> {
  if (req.method === 'GET') {
    const result = await pool.query(`
      SELECT
        f.id,
        f.name,
        f.description,
        f.parent_id,
        f.updated_at,
        parent.name AS parent_name,
        COUNT(d.id)::int AS document_count
      FROM document_folders f
      LEFT JOIN document_folders parent ON parent.id = f.parent_id
      LEFT JOIN documents d ON d.folder_id = f.id
      GROUP BY f.id, parent.name
      ORDER BY f.parent_id NULLS FIRST, f.name
    `);

    res.status(200).json({ success: true, data: result.rows });
    return;
  }

  if (req.method === 'POST') {
    const { name, description, parent_id } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ success: false, error: 'Name wajib diisi' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO document_folders (name, description, parent_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name.trim(), description || null, parent_id || null]
    );

    await pool.query(
      `INSERT INTO activity_logs (action, entity_type, entity_id, message, created_by)
       VALUES ('FOLDER_CREATED', 'folder', $1, $2, $3)`,
      [result.rows[0].id, `Created folder ${result.rows[0].name}`, req.user?.id || null]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
    return;
  }

  if (req.method === 'PUT') {
    const id = Number(req.query.id);
    const { name, description, parent_id } = req.body;
    if (!Number.isInteger(id) || !name?.trim() || Number(parent_id) === id) {
      res.status(400).json({ success: false, error: 'Data folder tidak valid' });
      return;
    }

    if (parent_id) {
      const descendant = await pool.query(
        `WITH RECURSIVE descendants AS (
          SELECT id FROM document_folders WHERE parent_id = $1
          UNION ALL
          SELECT f.id FROM document_folders f
          JOIN descendants d ON f.parent_id = d.id
        )
        SELECT 1 FROM descendants WHERE id = $2`,
        [id, parent_id]
      );
      if (descendant.rowCount) {
        res.status(400).json({ success: false, error: 'Parent folder tidak boleh child folder sendiri' });
        return;
      }
    }

    const result = await pool.query(
      `UPDATE document_folders
       SET name = $1, description = $2, parent_id = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [name.trim(), description || null, parent_id || null, id]
    );
    if (!result.rowCount) {
      res.status(404).json({ success: false, error: 'Folder not found' });
      return;
    }

    await pool.query(
      `INSERT INTO activity_logs (action, entity_type, entity_id, message, created_by)
       VALUES ('FOLDER_UPDATED', 'folder', $1, $2, $3)`,
      [result.rows[0].id, `Updated folder ${result.rows[0].name}`, req.user?.id || null]
    );

    res.status(200).json({ success: true, data: result.rows[0] });
    return;
  }

  if (req.method === 'DELETE') {
    const id = Number(req.query.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ success: false, error: 'Invalid folder id' });
      return;
    }

    const child = await pool.query('SELECT COUNT(*)::int AS count FROM document_folders WHERE parent_id = $1', [id]);
    if (child.rows[0].count > 0) {
      res.status(400).json({ success: false, error: 'Folder masih punya child folder' });
      return;
    }

    const docs = await pool.query('SELECT COUNT(*)::int AS count FROM documents WHERE folder_id = $1', [id]);
    if (docs.rows[0].count > 0) {
      res.status(400).json({ success: false, error: 'Folder masih berisi document' });
      return;
    }

    const deleted = await pool.query('DELETE FROM document_folders WHERE id = $1 RETURNING id, name', [id]);
    if (deleted.rows[0]) {
      await pool.query(
        `INSERT INTO activity_logs (action, entity_type, entity_id, message, created_by)
         VALUES ('FOLDER_DELETED', 'folder', $1, $2, $3)`,
        [deleted.rows[0].id, `Deleted folder ${deleted.rows[0].name}`, req.user?.id || null]
      );
    }
    res.status(200).json({ success: true });
    return;
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

export default requireAuth(handler);
