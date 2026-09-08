require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'arsip_kependudukan',
  password: process.env.DB_PASSWORD || 'admin',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function testDatabase() {
  try {
    const client = await pool.connect();
    client.release();

    const tableCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'documents'
      ORDER BY ordinal_position;
    `);

    if (tableCheck.rows.length === 0) {
      console.error('Table "documents" does not exist. Run: npm run migrate');
      process.exitCode = 1;
      return;
    }

    const requiredColumns = ['title', 'document_number', 'category_id', 'retention_due_at'];
    const existingColumns = tableCheck.rows.map((row) => row.column_name);
    const missingColumns = requiredColumns.filter((column) => !existingColumns.includes(column));

    if (missingColumns.length) {
      console.error(`Missing columns: ${missingColumns.join(', ')}`);
      process.exitCode = 1;
      return;
    }

    const countResult = await pool.query('SELECT COUNT(*) as count FROM documents');
    console.log(`Database ready. Documents: ${countResult.rows[0].count}`);
  } catch (error) {
    console.error('Database check failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

testDatabase();
