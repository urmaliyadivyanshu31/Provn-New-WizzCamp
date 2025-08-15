-- Supabase migration for follows table
-- Run this in your Supabase SQL editor

-- Create follows table for storing follow relationships
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_address TEXT NOT NULL,
  following_address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_address, following_address)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows (follower_address);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows (following_address);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows (created_at);

-- Add RLS policies (optional - can be enabled later)
-- ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
-- CREATE POLICY "Follows are viewable by everyone" ON follows
--   FOR SELECT USING (true);

-- Create policy for users to insert their own follows
-- CREATE POLICY "Users can insert own follows" ON follows
--   FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = follower_address);

-- Create policy for users to delete their own follows
-- CREATE POLICY "Users can delete own follows" ON follows
--   FOR DELETE USING (auth.jwt() ->> 'sub' = follower_address);
