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
  console.log('🔍 Testing database connection...\n');
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connected successfully!\n');
    client.release();

    // Test arsip table structure
    console.log('📋 Checking arsip table structure...');
    const tableCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'arsip'
      ORDER BY ordinal_position;
    `);

    if (tableCheck.rows.length === 0) {
      console.error('❌ Table "arsip" does not exist!');
      console.log('💡 Run: npm run setup-db');
      await pool.end();
      process.exit(1);
    }

    console.log('\n✅ Table "arsip" exists with columns:');
    tableCheck.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Test insert (dry run - check if columns match)
    console.log('\n🧪 Testing INSERT query structure...');
    const testColumns = [
      'jenis_arsip', 'no_kk', 'nik', 'nama_lengkap', 'tempat_lahir',
      'tanggal_lahir', 'jenis_kelamin', 'alamat', 'file_path', 'created_by'
    ];
    
    const existingColumns = tableCheck.rows.map(row => row.column_name);
    const missingColumns = testColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.error(`❌ Missing columns: ${missingColumns.join(', ')}`);
      console.log('💡 Run: npm run migrate');
      await pool.end();
      process.exit(1);
    }

    console.log('✅ All required columns exist!');

    // Test count
    const countResult = await pool.query('SELECT COUNT(*) as count FROM arsip');
    console.log(`\n📊 Current records in arsip table: ${countResult.rows[0].count}`);

    console.log('\n✅ Database is ready for testing!');
    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
    await pool.end();
    process.exit(1);
  }
}

testDatabase();

