#!/usr/bin/env node

// Database connection test for Provn platform
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'provn',
  user: process.env.DATABASE_USER || 'divyanshu',
  password: process.env.DATABASE_PASSWORD || ''
});

async function testDatabase() {
  console.log('🔍 Testing Provn database connection...\n');

  try {
    // Test basic connection
    console.log('1. Testing connection...');
    const connectionTest = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Connection successful:', connectionTest.rows[0].current_time);

    // Test table existence
    console.log('\n2. Checking required tables...');
    const tables = ['users', 'videos', 'tips', 'licenses', 'disputes', 'processing_jobs'];
    
    for (const table of tables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      const exists = result.rows[0].exists;
      console.log(`${exists ? '✅' : '❌'} Table '${table}': ${exists ? 'EXISTS' : 'MISSING'}`);
    }

    // Test user creation (simulate profile creation)
    console.log('\n3. Testing user creation...');
    const testAddress = '0x1234567890abcdef1234567890abcdef12345678';
    
    try {
      await pool.query(`
        INSERT INTO users (address, handle, display_name, chain_id) 
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (address) DO NOTHING
      `, [testAddress, 'testuser123', 'Test User 123', '123420001114']);
      
      const userCheck = await pool.query('SELECT * FROM users WHERE address = $1', [testAddress]);
      
      if (userCheck.rows.length > 0) {
        console.log('✅ User creation successful');
        console.log(`   Address: ${userCheck.rows[0].address}`);
        console.log(`   Handle: ${userCheck.rows[0].handle}`);
        console.log(`   Display Name: ${userCheck.rows[0].display_name}`);
      } else {
        console.log('❌ User creation failed');
      }
    } catch (error) {
      console.log('❌ User creation error:', error.message);
    }

    // Test database stats
    console.log('\n4. Database statistics...');
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
    const videoCount = await pool.query('SELECT COUNT(*) as count FROM videos');
    const tipCount = await pool.query('SELECT COUNT(*) as count FROM tips');
    
    console.log(`   Users: ${userCount.rows[0].count}`);
    console.log(`   Videos: ${videoCount.rows[0].count}`);
    console.log(`   Tips: ${tipCount.rows[0].count}`);

    console.log('\n🎉 Database test completed successfully!');
    console.log('\nNext steps:');
    console.log('1. The database is ready for profile creation');
    console.log('2. Make sure your wallet connects to the BaseCAMP testnet');
    console.log('3. Try creating a profile again in the app');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('\nPossible fixes:');
    console.error('1. Check if PostgreSQL is running: brew services start postgresql@14');
    console.error('2. Check database exists: psql -U divyanshu -l | grep provn');
    console.error('3. Check environment variables in .env file');
  } finally {
    await pool.end();
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  testDatabase();
}

module.exports = { testDatabase };