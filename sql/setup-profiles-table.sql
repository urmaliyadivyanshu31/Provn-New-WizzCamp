-- Setup profiles table for Provn platform
-- Run this SQL in your Supabase SQL Editor

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public read access for profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can create profile" ON profiles;
DROP POLICY IF EXISTS "Service role can bypass RLS" ON profiles;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  website TEXT,
  twitter TEXT,
  instagram TEXT,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  videos_count INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_earnings DECIMAL(20,8) DEFAULT 0,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  is_platform_creator BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address ON profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_profiles_handle ON profiles(handle);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for profiles
-- Note: Service role bypasses RLS by default, but we're being explicit

-- Allow public read access to all profiles
CREATE POLICY "Public read access for profiles" ON profiles
  FOR SELECT 
  USING (true);

-- Allow anyone to create a profile (important for registration)
CREATE POLICY "Anyone can create profile" ON profiles
  FOR INSERT 
  WITH CHECK (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE 
  USING (auth.jwt() ->> 'wallet_address' = wallet_address)
  WITH CHECK (auth.jwt() ->> 'wallet_address' = wallet_address);

-- Allow service role to do everything (bypass for API routes)
CREATE POLICY "Service role full access" ON profiles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Test data insertion (uncomment to add test profiles)
-- INSERT INTO profiles (wallet_address, handle, display_name, bio) VALUES 
-- ('0x1111111111111111111111111111111111111111', 'test_user_1', 'Test User 1', 'This is a test profile'),
-- ('0x2222222222222222222222222222222222222222', 'test_user_2', 'Test User 2', 'Another test profile')
-- ON CONFLICT (wallet_address) DO NOTHING;

-- Verify setup
SELECT 
  tablename, 
  schemaname, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles';

-- Check policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';