-- Supabase migration for analytics tables
-- Run this in your Supabase SQL editor

-- Create videos table for storing video performance data
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_address TEXT NOT NULL,
  title TEXT NOT NULL,
  video_type TEXT NOT NULL CHECK (video_type IN ('original', 'derivative')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  views_count INTEGER DEFAULT 0,
  tips_count INTEGER DEFAULT 0,
  licenses_count INTEGER DEFAULT 0,
  tips_revenue DECIMAL(10,2) DEFAULT 0.0,
  license_revenue DECIMAL(10,2) DEFAULT 0.0,
  derivative_royalties DECIMAL(10,2) DEFAULT 0.0,
  total_earnings DECIMAL(10,2) DEFAULT 0.0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_owner ON videos (owner_address);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos (created_at);
CREATE INDEX IF NOT EXISTS idx_videos_type ON videos (video_type);

-- Create tips table for storing tip transactions
CREATE TABLE IF NOT EXISTS tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  tipper_address TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for tips
CREATE INDEX IF NOT EXISTS idx_tips_video ON tips (video_id);
CREATE INDEX IF NOT EXISTS idx_tips_tipper ON tips (tipper_address);

-- Create licenses table for storing license transactions
CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  licensee_address TEXT NOT NULL,
  license_type TEXT NOT NULL CHECK (license_type IN ('commercial', 'personal', 'derivative')),
  revenue_share DECIMAL(5,2) NOT NULL DEFAULT 70.0,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for licenses
CREATE INDEX IF NOT EXISTS idx_licenses_video ON licenses (video_id);
CREATE INDEX IF NOT EXISTS idx_licenses_licensee ON licenses (licensee_address);

-- Add RLS policies (optional - can be enabled later)
-- ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
-- CREATE POLICY "Videos are viewable by everyone" ON videos FOR SELECT USING (true);
-- CREATE POLICY "Tips are viewable by everyone" ON tips FOR SELECT USING (true);
-- CREATE POLICY "Licenses are viewable by everyone" ON licenses FOR SELECT USING (true);

-- Create policy for users to insert their own videos
-- CREATE POLICY "Users can insert own videos" ON videos FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = owner_address);

-- Create policy for users to update their own videos
-- CREATE POLICY "Users can update own videos" ON videos FOR UPDATE USING (auth.jwt() ->> 'sub' = owner_address);
