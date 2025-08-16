-- Supabase migration for profiles table
-- Run this in your Supabase SQL editor

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL UNIQUE,
  handle TEXT NOT NULL UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_wallet ON profiles (wallet_address);
CREATE INDEX IF NOT EXISTS idx_profiles_handle ON profiles (handle);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS profiles_set_updated_at ON profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE PROCEDURE set_updated_at();

-- Add RLS policies (optional - can be enabled later)
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
-- CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

-- Create policy for users to insert their own profile
-- CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = wallet_address);

-- Create policy for users to update their own profile
-- CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.jwt() ->> 'sub' = wallet_address);
