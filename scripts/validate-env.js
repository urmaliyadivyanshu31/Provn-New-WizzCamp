#!/usr/bin/env node

// Environment variable validation script
// Run this before building to ensure all required variables are set

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

console.log('🔍 Validating environment variables...');

const missingVars = [];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    missingVars.push(envVar);
    console.log(`❌ Missing: ${envVar}`);
  } else {
    console.log(`✅ Found: ${envVar}`);
  }
}

if (missingVars.length > 0) {
  console.log('\n🚨 Build cannot proceed. Missing environment variables:');
  missingVars.forEach(varName => console.log(`   - ${varName}`));
  console.log('\nPlease set these variables in your environment or .env.local file');
  process.exit(1);
} else {
  console.log('\n🎉 All environment variables are set! Build can proceed.');
}
