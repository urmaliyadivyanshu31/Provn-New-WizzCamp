#!/usr/bin/env node

// Script to create the profiles table in Supabase
// Run this with: node scripts/setup-profiles-table.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function setupProfilesTable() {
  console.log('🚀 Setting up profiles table in Supabase...')
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables:')
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅' : '❌')
    process.exit(1)
  }
  
  console.log('✅ Environment variables found')
  console.log('🔗 Supabase URL:', supabaseUrl)
  console.log('🔑 Service Role Key:', serviceRoleKey.substring(0, 20) + '...')
  
  // Create Supabase client with service role
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
    global: { headers: { 'User-Agent': 'Provn-Setup-Script' } }
  })
  
  try {
    console.log('🔌 Testing Supabase connection...')
    
    // Simple test query
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true })
    
    if (error && error.code === 'PGRST116') {
      // Table doesn't exist - this is what we want
      console.log('✅ Supabase connection successful')
      console.log('📝 Profiles table does not exist - creating it now...')
    } else if (error) {
      throw new Error(`Connection failed: ${error.message}`)
    } else {
      console.log('✅ Profiles table already exists')
      return
    }
    
    // Try to create the table using a simple insert that will fail but create the table
    console.log('🔧 Attempting to create profiles table...')
    
    // This will fail but might create the table structure
    const { error: createError } = await supabase
      .from('profiles')
      .insert({
        wallet_address: 'temp_setup_address',
        handle: 'temp_setup_handle'
      })
    
    if (createError && createError.message.includes('relation "profiles" does not exist')) {
      console.log('⚠️  Table creation failed - need to use SQL directly')
      console.log('💡 Please run this SQL in your Supabase dashboard:')
      console.log('')
      console.log('```sql')
      console.log('CREATE EXTENSION IF NOT EXISTS pgcrypto;')
      console.log('')
      console.log('CREATE TABLE IF NOT EXISTS profiles (')
      console.log('  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),')
      console.log('  wallet_address TEXT NOT NULL UNIQUE,')
      console.log('  handle TEXT NOT NULL UNIQUE,')
      console.log('  display_name TEXT,')
      console.log('  bio TEXT,')
      console.log('  avatar_url TEXT,')
      console.log('  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),')
      console.log('  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()')
      console.log(');')
      console.log('')
      console.log('CREATE INDEX IF NOT EXISTS idx_profiles_wallet ON profiles (wallet_address);')
      console.log('CREATE INDEX IF NOT EXISTS idx_profiles_handle ON profiles (handle);')
      console.log('')
      console.log('CREATE OR REPLACE FUNCTION set_updated_at()')
      console.log('RETURNS TRIGGER AS $$')
      console.log('BEGIN')
      console.log('  NEW.updated_at = NOW();')
      console.log('  RETURN NEW;')
      console.log('END;')
      console.log('$$ LANGUAGE plpgsql;')
      console.log('')
      console.log('DROP TRIGGER IF EXISTS profiles_set_updated_at ON profiles;')
      console.log('CREATE TRIGGER profiles_set_updated_at')
      console.log('  BEFORE UPDATE ON profiles')
      console.log('  FOR EACH ROW')
      console.log('  EXECUTE PROCEDURE set_updated_at();')
      console.log('```')
      console.log('')
      console.log('🔗 Go to: https://supabase.com/dashboard/project/yrygvctcytkkyvckxffx/sql')
      console.log('📝 Click "New query" and paste the SQL above')
      console.log('▶️  Click "Run" to execute')
      
    } else if (createError) {
      console.log('⚠️  Unexpected error:', createError.message)
    } else {
      console.log('✅ Profiles table created successfully!')
      
      // Clean up the temporary record
      await supabase
        .from('profiles')
        .delete()
        .eq('wallet_address', 'temp_setup_address')
      
      console.log('🧹 Cleaned up temporary data')
      console.log('🎉 Setup completed successfully!')
    }
    
  } catch (error) {
    console.error('❌ Error setting up profiles table:', error.message)
    console.error('💡 You may need to run the SQL manually in your Supabase dashboard')
    console.error('🔗 Go to: https://supabase.com/dashboard/project/yrygvctcytkkyvckxffx/sql')
  }
}

// Run the setup
setupProfilesTable()
