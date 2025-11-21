const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'arsip_kependudukan',
  password: process.env.DB_PASSWORD || 'admin',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Running database migration...');
    
    // Read and execute migration
    const migrationPath = path.join(__dirname, '../lib/migration.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Executing migration...');
    await client.query(migration);
    console.log('✅ Migration executed successfully');
    
    console.log('🎉 Migration completed!');
    
  } catch (error) {
    console.error('❌ Error executing migration:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });

