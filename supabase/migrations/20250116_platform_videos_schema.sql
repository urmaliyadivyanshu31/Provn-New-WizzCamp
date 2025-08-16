-- Platform Videos Schema for Provn
-- This schema bridges on-chain IP-NFTs with off-chain platform functionality

-- Enhanced profiles table (if not already exists)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
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
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform videos table - the core table for our video platform
CREATE TABLE IF NOT EXISTS platform_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Creator information
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  creator_wallet TEXT NOT NULL,
  
  -- On-chain data
  token_id TEXT UNIQUE NOT NULL, -- IP-NFT token ID
  transaction_hash TEXT UNIQUE NOT NULL, -- Minting transaction hash
  contract_address TEXT NOT NULL, -- Origin Protocol contract
  block_number BIGINT,
  mint_timestamp TIMESTAMP WITH TIME ZONE,
  
  -- IPFS metadata
  metadata_uri TEXT, -- IPFS URI from tokenURI
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[], -- Array of tags
  
  -- Video content
  video_url TEXT NOT NULL, -- IPFS or CDN URL
  thumbnail_url TEXT,
  duration INTEGER, -- in seconds
  file_size BIGINT, -- in bytes
  video_quality TEXT, -- 720p, 1080p, etc.
  aspect_ratio TEXT DEFAULT '9:16', -- TikTok style default
  
  -- Platform-specific metadata
  category TEXT, -- dance, music, art, cooking, etc.
  language TEXT DEFAULT 'en',
  age_rating TEXT DEFAULT 'all' CHECK (age_rating IN ('all', '13+', '18+')),
  
  -- Content status
  upload_status TEXT DEFAULT 'processing' CHECK (upload_status IN ('processing', 'ready', 'failed', 'removed')),
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'under_review')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
  
  -- Licensing info (from Origin Protocol)
  price_per_period DECIMAL(20,8),
  license_duration INTEGER, -- in seconds
  royalty_percentage INTEGER,
  payment_token_address TEXT,
  commercial_rights BOOLEAN DEFAULT true,
  derivative_rights BOOLEAN DEFAULT false,
  
  -- Off-chain engagement metrics
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
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Search and discovery
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || array_to_string(tags, ' '))
  ) STORED
);

-- Video views tracking for analytics
CREATE TABLE IF NOT EXISTS video_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES platform_videos(id) ON DELETE CASCADE,
  viewer_wallet TEXT, -- nullable for anonymous views
  viewer_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  watch_duration INTEGER, -- seconds watched
  watch_percentage INTEGER, -- percentage of video watched
  device_type TEXT, -- mobile, desktop, tablet
  country TEXT,
  city TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video likes
CREATE TABLE IF NOT EXISTS video_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES platform_videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  liked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(video_id, user_id)
);

-- Video tips (wCAMP token tips)
CREATE TABLE IF NOT EXISTS video_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES platform_videos(id) ON DELETE CASCADE,
  tipper_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(20,8) NOT NULL,
  token_address TEXT NOT NULL,
  transaction_hash TEXT UNIQUE,
  message TEXT,
  tipped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video shares tracking
CREATE TABLE IF NOT EXISTS video_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES platform_videos(id) ON DELETE CASCADE,
  sharer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  platform TEXT NOT NULL, -- twitter, instagram, tiktok, direct_link
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- License purchases tracking
CREATE TABLE IF NOT EXISTS license_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES platform_videos(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  periods INTEGER NOT NULL,
  price_per_period DECIMAL(20,8) NOT NULL,
  total_cost DECIMAL(20,8) NOT NULL,
  payment_token_address TEXT NOT NULL,
  transaction_hash TEXT UNIQUE,
  license_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  license_end TIMESTAMP WITH TIME ZONE NOT NULL,
  license_status TEXT DEFAULT 'active' CHECK (license_status IN ('active', 'expired', 'revoked')),
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform creator applications
CREATE TABLE IF NOT EXISTS creator_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  application_type TEXT DEFAULT 'creator' CHECK (application_type IN ('creator', 'verified_artist')),
  portfolio_urls TEXT[],
  social_links JSONB,
  statement TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  review_notes TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Content categories for organization
CREATE TABLE IF NOT EXISTS video_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO video_categories (name, slug, description, icon, color, sort_order) VALUES
('Dance', 'dance', 'Choreography, tutorials, and dance content', '💃', '#FF6B6B', 1),
('Music', 'music', 'Music production, covers, and audio content', '🎵', '#4ECDC4', 2),
('Art', 'art', 'Digital art, tutorials, and creative processes', '🎨', '#45B7D1', 3),
('Cooking', 'cooking', 'Recipes, cooking tutorials, and food content', '👨‍🍳', '#FFA07A', 4),
('Education', 'education', 'Educational content and tutorials', '📚', '#98D8C8', 5),
('Technology', 'technology', 'Tech tutorials, coding, and innovation', '💻', '#6C5CE7', 6),
('Sports', 'sports', 'Sports content, tutorials, and fitness', '⚽', '#00B894', 7),
('Comedy', 'comedy', 'Funny videos and entertainment', '😂', '#FDCB6E', 8),
('Lifestyle', 'lifestyle', 'Daily life, vlogs, and lifestyle content', '✨', '#E17055', 9),
('Gaming', 'gaming', 'Gaming content and tutorials', '🎮', '#A29BFE', 10)
ON CONFLICT (slug) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_platform_videos_creator ON platform_videos(creator_id);
CREATE INDEX IF NOT EXISTS idx_platform_videos_token_id ON platform_videos(token_id);
CREATE INDEX IF NOT EXISTS idx_platform_videos_status ON platform_videos(upload_status, moderation_status, visibility);
CREATE INDEX IF NOT EXISTS idx_platform_videos_published ON platform_videos(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_platform_videos_views ON platform_videos(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_platform_videos_likes ON platform_videos(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_platform_videos_category ON platform_videos(category);
CREATE INDEX IF NOT EXISTS idx_platform_videos_tags ON platform_videos USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_platform_videos_search ON platform_videos USING gin(search_vector);

CREATE INDEX IF NOT EXISTS idx_video_views_video ON video_views(video_id);
CREATE INDEX IF NOT EXISTS idx_video_views_viewer ON video_views(viewer_profile_id);
CREATE INDEX IF NOT EXISTS idx_video_views_timestamp ON video_views(viewed_at);

CREATE INDEX IF NOT EXISTS idx_video_likes_video ON video_likes(video_id);
CREATE INDEX IF NOT EXISTS idx_video_likes_user ON video_likes(user_id);

-- Row Level Security (RLS) policies
ALTER TABLE platform_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_purchases ENABLE ROW LEVEL SECURITY;

-- Public read access for published videos
CREATE POLICY "Public read access for published videos" ON platform_videos
  FOR SELECT USING (
    visibility = 'public' AND 
    moderation_status = 'approved' AND 
    upload_status = 'ready'
  );

-- Creators can manage their own videos
CREATE POLICY "Creators can manage own videos" ON platform_videos
  FOR ALL USING (auth.jwt() ->> 'wallet_address' = creator_wallet);

-- Public can view video stats
CREATE POLICY "Public read access for video views" ON video_views
  FOR SELECT USING (true);

-- Users can like videos
CREATE POLICY "Users can like videos" ON video_likes
  FOR ALL USING (auth.jwt() ->> 'sub' IS NOT NULL);

-- Functions to update counters
CREATE OR REPLACE FUNCTION update_video_metrics()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'video_views' THEN
      UPDATE platform_videos SET views_count = views_count + 1 WHERE id = NEW.video_id;
    ELSIF TG_TABLE_NAME = 'video_likes' THEN
      UPDATE platform_videos SET likes_count = likes_count + 1 WHERE id = NEW.video_id;
    ELSIF TG_TABLE_NAME = 'video_shares' THEN
      UPDATE platform_videos SET shares_count = shares_count + 1 WHERE id = NEW.video_id;
    ELSIF TG_TABLE_NAME = 'video_tips' THEN
      UPDATE platform_videos SET 
        tips_count = tips_count + 1,
        tips_total_amount = tips_total_amount + NEW.amount
      WHERE id = NEW.video_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'video_likes' THEN
      UPDATE platform_videos SET likes_count = likes_count - 1 WHERE id = OLD.video_id;
    ELSIF TG_TABLE_NAME = 'video_tips' THEN
      UPDATE platform_videos SET 
        tips_count = tips_count - 1,
        tips_total_amount = tips_total_amount - OLD.amount
      WHERE id = OLD.video_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_video_views_count
  AFTER INSERT ON video_views
  FOR EACH ROW EXECUTE FUNCTION update_video_metrics();

CREATE TRIGGER update_video_likes_count
  AFTER INSERT OR DELETE ON video_likes
  FOR EACH ROW EXECUTE FUNCTION update_video_metrics();

CREATE TRIGGER update_video_shares_count
  AFTER INSERT ON video_shares
  FOR EACH ROW EXECUTE FUNCTION update_video_metrics();

CREATE TRIGGER update_video_tips_count
  AFTER INSERT OR DELETE ON video_tips
  FOR EACH ROW EXECUTE FUNCTION update_video_metrics();

-- Function to get video feed with proper filtering
CREATE OR REPLACE FUNCTION get_platform_video_feed(
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0,
  p_category TEXT DEFAULT NULL,
  p_creator_wallet TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  video_data JSONB,
  creator_data JSONB,
  metrics JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_jsonb(pv.*) as video_data,
    to_jsonb(p.*) as creator_data,
    jsonb_build_object(
      'views', pv.views_count,
      'likes', pv.likes_count,
      'shares', pv.shares_count,
      'tips', pv.tips_count,
      'total_tips_amount', pv.tips_total_amount
    ) as metrics
  FROM platform_videos pv
  JOIN profiles p ON pv.creator_id = p.id
  WHERE 
    pv.visibility = 'public' 
    AND pv.moderation_status = 'approved' 
    AND pv.upload_status = 'ready'
    AND pv.published_at IS NOT NULL
    AND (p_category IS NULL OR pv.category = p_category)
    AND (p_creator_wallet IS NULL OR pv.creator_wallet = p_creator_wallet)
    AND (p_tags IS NULL OR pv.tags && p_tags)
  ORDER BY pv.published_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;