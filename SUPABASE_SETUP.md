# Supabase Database Setup for Provn Platform

## 🚨 Profile Creation Not Working? Follow This Guide

If users are getting profile creation errors on the live site, follow these troubleshooting steps:

## Step 1: Check Database Health

Visit your database health endpoint:
```
https://provn-new-wizz-camp.vercel.app/api/database-health
```

This will show you:
- ✅ Environment variables status
- ✅ Supabase connection status  
- ✅ Profiles table accessibility
- ✅ Insert permissions test

## Step 2: Verify Environment Variables

### Check Vercel Environment Variables
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Open your Provn project
3. Go to Settings → Environment Variables
4. Verify these 3 variables exist and are correct:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yrygvctcytkkyvckxffx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANT**: Make sure the URL ends with `.co` NOT `.com`!

### Get Correct Values from Supabase
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open your Provn project
3. Go to Settings → API
4. Copy the values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

## Step 3: Fix Database Setup

### Access Supabase SQL Editor
1. Go to Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy and paste ALL contents of `/sql/setup-profiles-table.sql`
4. Run the query

### Verify Table Creation
After running the SQL, you should see:
- ✅ `profiles` table created
- ✅ RLS policies set up
- ✅ Indexes created
- ✅ Verification queries show success

## Step 4: Test After Setup

### Check Health Again
Visit: `https://provn-new-wizz-camp.vercel.app/api/database-health`

You should now see:
```json
{
  "success": true,
  "healthy": true,
  "message": "Database is healthy and ready for profile creation"
}
```

### Test Profile Creation
1. Go to your live site
2. Connect wallet with a new address
3. Try creating a profile
4. Check browser console for any error logs
5. Verify profile appears in Supabase table

## 🔧 Advanced Troubleshooting

### If Database Health Shows Issues

**"Failed to create Supabase client"**
- ❌ Environment variables are wrong or missing
- ✅ Fix: Update Vercel environment variables

**"Table exists but insert failed"**  
- ❌ Row Level Security blocking service role
- ✅ Fix: Run the updated SQL with service role policy

**"Network/Connection Error"**
- ❌ Supabase URL is wrong (.com instead of .co)
- ✅ Fix: Update URL to end with .co

### Check Vercel Logs
1. Go to Vercel Dashboard → Your Project
2. Click on Deployments
3. Click on latest deployment  
4. View Function Logs
5. Look for profile creation API errors

### Check Supabase Logs
1. Go to Supabase Dashboard → Logs
2. Filter by API calls
3. Look for failed INSERT operations
4. Check for authentication errors

### Manual Database Fixes

If automated setup doesn't work, run these in Supabase SQL Editor:

```sql
-- Check if table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'profiles';

-- Check policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

-- Manual table creation (only if needed)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and add permissive policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON profiles FOR ALL 
USING (auth.role() = 'service_role') 
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Anyone can create profile" ON profiles FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public read access" ON profiles FOR SELECT 
USING (true);
```

## 📋 Expected Results

After successful setup:
- ✅ Database health returns "healthy: true"
- ✅ Profile creation works on live site
- ✅ No more "profile not created" toast errors  
- ✅ Console logs show successful API responses
- ✅ New profiles appear in Supabase dashboard

## 🆘 Still Having Issues?

1. **Check the live database health first**: https://provn-new-wizz-camp.vercel.app/api/database-health
2. **Look at browser console** when creating profile  
3. **Check Vercel function logs** for server-side errors
4. **Verify environment variables** match exactly from Supabase
5. **Ensure URL ends with .co** not .com
