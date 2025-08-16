#!/usr/bin/env node

// Script to check what tables exist in Supabase
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function checkTables() {
  console.log('🔍 Checking what tables exist in your Supabase database...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  })
  
  try {
    // Try to query information_schema to see all tables
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public')
      .order('table_name')
    
    if (error) {
      console.log('❌ Error querying information_schema:', error.message)
      
      // Try a different approach - try to query the profiles table directly
      console.log('🔍 Trying to query profiles table directly...')
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true })
      
      if (profileError) {
        console.log('❌ Profiles table error:', profileError.message)
        console.log('💡 This means the table was not created successfully')
      } else {
        console.log('✅ Profiles table exists and is queryable!')
      }
      
      return
    }
    
    console.log('📊 Tables found in your database:')
    if (data && data.length > 0) {
      data.forEach(table => {
        console.log(`   - ${table.table_name}`)
      })
    } else {
      console.log('   No tables found')
    }
    
    // Check specifically for profiles table
    const profilesTable = data?.find(t => t.table_name === 'profiles')
    if (profilesTable) {
      console.log('✅ Profiles table found!')
    } else {
      console.log('❌ Profiles table NOT found')
      console.log('💡 The SQL may not have completed successfully')
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error.message)
  }
}

checkTables()
