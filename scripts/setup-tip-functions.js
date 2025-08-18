const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupTipFunctions() {
  try {
    console.log('Setting up tip increment functions...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../sql/tip-functions.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error setting up tip functions:', error);
      return false;
    }
    
    console.log('✅ Tip increment functions created successfully');
    
    // Test the functions
    console.log('Testing functions...');
    
    // Test increment_video_tips function
    const { error: testError1 } = await supabase.rpc('increment_video_tips', {
      token_id: 'test_token_123',
      tip_amount: 1.5
    });
    
    if (testError1) {
      console.log('Test for increment_video_tips (expected if video doesn\'t exist):', testError1.message);
    } else {
      console.log('✅ increment_video_tips function is working');
    }
    
    // Test increment_profile_tips function
    const { error: testError2 } = await supabase.rpc('increment_profile_tips', {
      wallet_addr: '0x0000000000000000000000000000000000000000',
      tip_amount: 1.5
    });
    
    if (testError2) {
      console.log('Test for increment_profile_tips (expected if profile doesn\'t exist):', testError2.message);
    } else {
      console.log('✅ increment_profile_tips function is working');
    }
    
    return true;
    
  } catch (error) {
    console.error('Failed to setup tip functions:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  setupTipFunctions()
    .then(success => {
      if (success) {
        console.log('\n🎉 Tip functions setup completed successfully!');
        console.log('Tips will now properly update video and profile statistics.');
      } else {
        console.log('\n❌ Setup failed. Please check the errors above.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupTipFunctions };