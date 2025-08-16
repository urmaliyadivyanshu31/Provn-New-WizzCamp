#!/usr/bin/env node

/**
 * Setup script for platform_videos table in Supabase
 * This script helps set up the missing table that's needed for video-profile integration
 */

const fs = require('fs')
const path = require('path')

console.log('📋 Platform Videos Table Setup Script')
console.log('=====================================')
console.log('')

// Read the SQL migration file
const migrationPath = path.join(__dirname, '../supabase/migrations/20250116_create_platform_videos_table.sql')

try {
  const sqlContent = fs.readFileSync(migrationPath, 'utf8')
  
  console.log('✅ SQL migration file found!')
  console.log('📁 File location:', migrationPath)
  console.log('📊 File size:', Math.round(sqlContent.length / 1024) + 'KB')
  console.log('')
  
  console.log('🚀 NEXT STEPS:')
  console.log('==============')
  console.log('')
  console.log('1. Go to your Supabase Dashboard:')
  console.log('   → https://supabase.com/dashboard')
  console.log('')
  console.log('2. Select your Provn project')
  console.log('')
  console.log('3. Go to SQL Editor (left sidebar)')
  console.log('')
  console.log('4. Create a new query')
  console.log('')
  console.log('5. Copy and paste the ENTIRE SQL migration file:')
  console.log('   📁 From:', migrationPath)
  console.log('')
  console.log('6. Click "Run" to execute the migration')
  console.log('')
  console.log('7. You should see "SUCCESS: platform_videos table created and accessible"')
  console.log('')
  console.log('8. Verify by checking Table Editor - you should now see:')
  console.log('   ✅ profiles table (existing)')
  console.log('   ✅ platform_videos table (new)')
  console.log('')
  console.log('🔍 AFTER SETUP:')
  console.log('===============')
  console.log('')
  console.log('Test the database health:')
  console.log('→ https://your-domain.vercel.app/api/database-health/platform-videos')
  console.log('')
  console.log('Then try minting a video - it should now appear in your profile!')
  console.log('')
  
  // Also show first few lines of SQL for verification
  const firstLines = sqlContent.split('\n').slice(0, 10).join('\n')
  console.log('📋 SQL Preview (first 10 lines):')
  console.log('================================')
  console.log(firstLines)
  console.log('... (and much more)')
  console.log('')
  
} catch (error) {
  console.error('❌ Error reading SQL migration file:', error.message)
  console.log('')
  console.log('🔧 Troubleshooting:')
  console.log('- Make sure you are running this from the project root directory')
  console.log('- Check that the migration file exists at:', migrationPath)
  process.exit(1)
}

console.log('💡 Need help? Check the console after running the SQL for any error messages.')
console.log('🎯 Goal: Get "SUCCESS" message and see both tables in Supabase Table Editor.')