const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🗄️ Setting up database schema...');

    // Read the schema file
    const schemaPath = path.join(__dirname, '../lib/db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute the schema
    await pool.query(schema);

    console.log('✅ Database schema created successfully!');

    // Test the connection
    const result = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`📊 Users table ready (current count: ${result.rows[0].count})`);

  } catch (error) {
    console.error('❌ Failed to setup database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();