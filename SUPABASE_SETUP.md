# Supabase Database Setup for Provn Platform

## Quick Setup Instructions

If users are getting profile creation errors, the Supabase database needs to be set up. Follow these steps:

### 1. Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open your Provn project
3. Navigate to SQL Editor

### 2. Run Database Setup
1. In SQL Editor, create a new query
2. Copy and paste the contents of `/sql/setup-profiles-table.sql`
3. Run the query to create the profiles table

### 3. Verify Setup
- Visit: `https://your-app.vercel.app/api/database-health`
- Should return: `"Database is healthy and ready"`

## Alternative: Manual Table Creation

If the SQL file doesn't work, create the table manually:

```sql
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

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create profile" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access for profiles" ON profiles
  FOR SELECT USING (true);
```

## Environment Variables Required

Make sure these are set in Vercel/deployment:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Troubleshooting

### Profile Creation Still Fails
1. Check database health: `/api/database-health`
2. Check browser console for detailed error logs
3. Verify environment variables in Vercel dashboard
4. Check Supabase logs in dashboard

### Common Error Codes
- `42P01`: Table doesn't exist → Run setup SQL
- `23505`: Duplicate handle/wallet → User already has profile
- `401`: Authentication error → Check service role key

## Testing Profile Creation

After setup, test with:
1. Connect wallet to app
2. Try creating profile with unique handle
3. Check Supabase table for new entry
4. Verify profile appears in navigation