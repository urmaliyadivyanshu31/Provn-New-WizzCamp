-- Create platform_videos table for syncing minted IP-NFTs with platform
-- This table stores videos that have been minted on-chain and synced to the platform

CREATE TABLE IF NOT EXISTS platform_videos (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Creator information (links to profiles table)
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  creator_wallet TEXT NOT NULL,
  
  -- Blockchain information
  token_id TEXT UNIQUE NOT NULL, -- The NFT token ID from blockchain
  transaction_hash TEXT NOT NULL,
  contract_address TEXT NOT NULL DEFAULT '0x5a3f832b47b948dA27aE788E96A0CD7BB0dCd1c1',
  block_number BIGINT,
  mint_timestamp TIMESTAMPTZ,
  metadata_uri TEXT,
  
  -- Video content information
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER, -- in seconds
  file_size BIGINT, -- in bytes
  video_quality TEXT DEFAULT 'HD',
  aspect_ratio TEXT DEFAULT '16:9',
  
  -- Content classification
  category TEXT,
  language TEXT DEFAULT 'en',
  age_rating TEXT DEFAULT 'G',
  
  -- Platform status
  upload_status TEXT DEFAULT 'ready' CHECK (upload_status IN ('processing', 'ready', 'failed', 'removed')),
  moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'under_review')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
  
  -- Licensing and monetization (from Origin Protocol)
  price_per_period DECIMAL(20,8), -- Price in wCAMP tokens
  license_duration INTEGER, -- Duration in seconds
  royalty_percentage INTEGER DEFAULT 0 CHECK (royalty_percentage >= 0 AND royalty_percentage <= 100),
  payment_token_address TEXT,
  commercial_rights BOOLEAN DEFAULT true,
  derivative_rights BOOLEAN DEFAULT false,
  
  -- Analytics and engagement
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  tips_count INTEGER DEFAULT 0,
  tips_total_amount DECIMAL(20,8) DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  licenses_sold INTEGER DEFAULT 0,
  total_revenue DECIMAL(20,8) DEFAULT 0,
  
  -- Timestamps
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_creator_wallet CHECK (creator_wallet ~* '^0x[a-f0-9]{40}$'),
  CONSTRAINT valid_token_id CHECK (LENGTH(token_id) > 0),
  CONSTRAINT valid_video_url CHECK (video_url ~* '^https?://.*'),
  CONSTRAINT valid_title CHECK (LENGTH(title) > 0 AND LENGTH(title) <= 200)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_platform_videos_creator_wallet ON platform_videos(creator_wallet);
CREATE INDEX IF NOT EXISTS idx_platform_videos_creator_id ON platform_videos(creator_id);
CREATE INDEX IF NOT EXISTS idx_platform_videos_token_id ON platform_videos(token_id);
CREATE INDEX IF NOT EXISTS idx_platform_videos_upload_status ON platform_videos(upload_status);
CREATE INDEX IF NOT EXISTS idx_platform_videos_moderation_status ON platform_videos(moderation_status);
CREATE INDEX IF NOT EXISTS idx_platform_videos_visibility ON platform_videos(visibility);
CREATE INDEX IF NOT EXISTS idx_platform_videos_published_at ON platform_videos(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_videos_views_count ON platform_videos(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_platform_videos_likes_count ON platform_videos(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_platform_videos_tags ON platform_videos USING GIN(tags);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_platform_videos_creator_status ON platform_videos(creator_wallet, upload_status, moderation_status);
CREATE INDEX IF NOT EXISTS idx_platform_videos_public_videos ON platform_videos(visibility, moderation_status, published_at DESC) 
  WHERE upload_status = 'ready';

-- Enable Row Level Security
ALTER TABLE platform_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for platform_videos table

-- Policy 1: Service role has full access (for API operations)
CREATE POLICY "Service role full access on platform_videos" ON platform_videos
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Authenticated users can read public videos
CREATE POLICY "Public read access for approved videos" ON platform_videos
FOR SELECT 
TO authenticated, anon
USING (
  upload_status = 'ready' 
  AND moderation_status = 'approved' 
  AND visibility = 'public'
);

-- Policy 3: Users can read their own videos (all statuses)
CREATE POLICY "Users can read own videos" ON platform_videos
FOR SELECT 
TO authenticated
USING (
  creator_wallet = LOWER(auth.jwt() ->> 'wallet_address')
  OR creator_id = auth.uid()
);

-- Policy 4: Users can insert their own videos
CREATE POLICY "Users can insert own videos" ON platform_videos
FOR INSERT 
TO authenticated
WITH CHECK (
  creator_wallet = LOWER(auth.jwt() ->> 'wallet_address')
  OR creator_id = auth.uid()
);

-- Policy 5: Users can update their own videos
CREATE POLICY "Users can update own videos" ON platform_videos
FOR UPDATE 
TO authenticated
USING (
  creator_wallet = LOWER(auth.jwt() ->> 'wallet_address')
  OR creator_id = auth.uid()
)
WITH CHECK (
  creator_wallet = LOWER(auth.jwt() ->> 'wallet_address')
  OR creator_id = auth.uid()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_platform_videos_updated_at 
  BEFORE UPDATE ON platform_videos 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create view for video analytics
CREATE OR REPLACE VIEW platform_video_analytics AS
SELECT 
  pv.*,
  p.handle as creator_handle,
  p.display_name as creator_display_name,
  p.avatar_url as creator_avatar_url,
  CASE 
    WHEN pv.published_at > NOW() - INTERVAL '24 hours' THEN 'new'
    WHEN pv.views_count > 1000 THEN 'popular'
    WHEN pv.likes_count > 100 THEN 'trending'
    ELSE 'normal'
  END as video_status,
  -- Engagement rate calculation
  CASE 
    WHEN pv.views_count > 0 THEN 
      ROUND((pv.likes_count::decimal + pv.shares_count::decimal + pv.comments_count::decimal) / pv.views_count::decimal * 100, 2)
    ELSE 0
  END as engagement_rate
FROM platform_videos pv
LEFT JOIN profiles p ON pv.creator_id = p.id
WHERE pv.upload_status = 'ready' 
  AND pv.moderation_status = 'approved';

-- Grant access to the view
GRANT SELECT ON platform_video_analytics TO authenticated, anon, service_role;

-- Create function to get videos by creator
CREATE OR REPLACE FUNCTION get_videos_by_creator(
  creator_wallet_param TEXT,
  include_private_param BOOLEAN DEFAULT false,
  limit_param INTEGER DEFAULT 20,
  offset_param INTEGER DEFAULT 0
)
RETURNS TABLE (
  video_id UUID,
  token_id TEXT,
  title TEXT,
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  views_count INTEGER,
  likes_count INTEGER,
  published_at TIMESTAMPTZ,
  creator_handle TEXT,
  creator_display_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pv.id as video_id,
    pv.token_id,
    pv.title,
    pv.description,
    pv.video_url,
    pv.thumbnail_url,
    pv.views_count,
    pv.likes_count,
    pv.published_at,
    p.handle as creator_handle,
    p.display_name as creator_display_name
  FROM platform_videos pv
  LEFT JOIN profiles p ON pv.creator_id = p.id
  WHERE pv.creator_wallet = LOWER(creator_wallet_param)
    AND pv.upload_status = 'ready'
    AND (
      include_private_param = true 
      OR (pv.visibility = 'public' AND pv.moderation_status = 'approved')
    )
  ORDER BY pv.published_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_videos_by_creator TO authenticated, anon, service_role;

-- Insert a test verification query comment
-- This will help verify the table was created successfully
COMMENT ON TABLE platform_videos IS 'Platform videos table for syncing blockchain IP-NFTs. Created: 2025-01-16';

-- Final verification: Test if table exists and is accessible
DO $$
BEGIN
  -- Try to select from the table to verify it exists
  PERFORM 1 FROM platform_videos LIMIT 1;
  RAISE NOTICE 'SUCCESS: platform_videos table created and accessible';
EXCEPTION
  WHEN undefined_table THEN
    RAISE EXCEPTION 'FAILED: platform_videos table was not created properly';
  WHEN OTHERS THEN
    RAISE NOTICE 'WARNING: Table exists but may have permission issues';
END;
$$;