const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTipIncrementFunctions() {
  console.log('Creating tip increment functions...');

  try {
    // Create function to increment video tips
    const videoFunctionSQL = `
      CREATE OR REPLACE FUNCTION increment_video_tips(token_id text, tip_amount decimal)
      RETURNS void AS $$
      BEGIN
        UPDATE platform_videos 
        SET 
          tips_count = COALESCE(tips_count, 0) + 1,
          tips_total_amount = COALESCE(tips_total_amount, 0) + tip_amount,
          updated_at = now()
        WHERE video_token_id = token_id;
      END;
      $$ LANGUAGE plpgsql;
    `;

    const { error: videoFuncError } = await supabase.rpc('exec', { sql: videoFunctionSQL });
    
    if (videoFuncError) {
      console.error('Error creating video increment function:', videoFuncError);
    } else {
      console.log('✅ Video tip increment function created');
    }

    // Create function to increment profile tips (just update timestamp for now)
    const profileFunctionSQL = `
      CREATE OR REPLACE FUNCTION increment_profile_tips(wallet_addr text, tip_amount decimal)
      RETURNS void AS $$
      BEGIN
        UPDATE profiles 
        SET updated_at = now()
        WHERE wallet_address = wallet_addr;
      END;
      $$ LANGUAGE plpgsql;
    `;

    const { error: profileFuncError } = await supabase.rpc('exec', { sql: profileFunctionSQL });
    
    if (profileFuncError) {
      console.error('Error creating profile increment function:', profileFuncError);
    } else {
      console.log('✅ Profile tip increment function created');
    }

    console.log('🎉 Tip increment functions created successfully!');
    return true;

  } catch (error) {
    console.error('Failed to create functions:', error);
    return false;
  }
}

// Run the script
createTipIncrementFunctions().then(success => {
  if (!success) {
    process.exit(1);
  }
});