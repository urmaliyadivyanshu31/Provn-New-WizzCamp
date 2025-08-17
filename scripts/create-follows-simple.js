const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createFollowsTable() {
  try {
    console.log('Creating follows table with simple approach...');
    
    // Try to create a test follow entry to see if we can create the table structure
    const testFollowData = {
      follower_address: '0x0000000000000000000000000000000000000001',
      following_address: '0x0000000000000000000000000000000000000002'
    };

    const { data, error } = await supabase
      .from('follows')
      .insert(testFollowData)
      .select();

    if (error) {
      console.error('❌ Error with follows table:', error);
      console.log('🔧 The follows table likely needs to be created manually in Supabase dashboard');
      console.log('📋 Table schema needed:');
      console.log(`
      CREATE TABLE follows (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        follower_address TEXT NOT NULL,
        following_address TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(follower_address, following_address)
      );
      
      CREATE INDEX idx_follows_follower ON follows(follower_address);
      CREATE INDEX idx_follows_following ON follows(following_address);
      `);
    } else {
      console.log('✅ Follows table is working! Test data inserted:', data);
      
      // Clean up test data
      await supabase
        .from('follows')
        .delete()
        .eq('follower_address', testFollowData.follower_address);
      
      console.log('✅ Test data cleaned up');
    }

  } catch (error) {
    console.error('❌ Failed to test follows table:', error);
  }
}

createFollowsTable();