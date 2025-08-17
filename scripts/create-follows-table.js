const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createFollowsTable() {
  try {
    console.log('Creating follows table...');
    
    // Create the follows table
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS follows (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          follower_address TEXT NOT NULL,
          following_address TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(follower_address, following_address)
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_address);
        CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_address);
        CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at);

        -- Enable RLS (Row Level Security)
        ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

        -- Create policies to allow public read access and authenticated writes
        DROP POLICY IF EXISTS "Anyone can view follows" ON follows;
        CREATE POLICY "Anyone can view follows" ON follows
          FOR SELECT USING (true);

        DROP POLICY IF EXISTS "Users can follow others" ON follows;
        CREATE POLICY "Users can follow others" ON follows
          FOR INSERT WITH CHECK (true);

        DROP POLICY IF EXISTS "Users can unfollow others" ON follows;
        CREATE POLICY "Users can unfollow others" ON follows
          FOR DELETE USING (true);
      `
    });

    if (error) {
      console.error('❌ Error creating follows table:', error);
      return;
    }

    console.log('✅ Follows table created successfully!');

    // Test the table
    const { data: testData, error: testError } = await supabase
      .from('follows')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ Error testing follows table:', testError);
    } else {
      console.log('✅ Follows table is working, current rows:', testData?.length || 0);
    }

  } catch (error) {
    console.error('❌ Failed to create follows table:', error);
  }
}

createFollowsTable();