-- Provn Platform Database Schema
-- This script creates the complete database structure for the Provn platform

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address VARCHAR(42) UNIQUE NOT NULL,
    handle VARCHAR(50) UNIQUE,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,
    email VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    chain_id VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Videos table
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    creator_address VARCHAR(42) NOT NULL REFERENCES users(address),
    parent_token_id VARCHAR(100) REFERENCES videos(token_id),
    ipfs_hash VARCHAR(100) NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    block_number BIGINT NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    status VARCHAR(20) DEFAULT 'processing',
    allow_remixing BOOLEAN DEFAULT TRUE,
    perceptual_hash VARCHAR(64),
    duration INTEGER, -- seconds
    file_size BIGINT, -- bytes
    resolution VARCHAR(20),
    format VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video tags (many-to-many)
CREATE TABLE video_tags (
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    PRIMARY KEY (video_id, tag)
);

-- Video stats
CREATE TABLE video_stats (
    video_id UUID PRIMARY KEY REFERENCES videos(id) ON DELETE CASCADE,
    views BIGINT DEFAULT 0,
    tips_count INTEGER DEFAULT 0,
    tips_total DECIMAL(18, 8) DEFAULT 0,
    licenses_count INTEGER DEFAULT 0,
    licenses_total DECIMAL(18, 8) DEFAULT 0,
    derivatives_count INTEGER DEFAULT 0,
    total_earnings DECIMAL(18, 8) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tips table
CREATE TABLE tips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id),
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    amount DECIMAL(18, 8) NOT NULL,
    message TEXT,
    transaction_hash VARCHAR(66) NOT NULL,
    block_number BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Licenses table
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id),
    purchaser_address VARCHAR(42) NOT NULL,
    creator_address VARCHAR(42) NOT NULL,
    price DECIMAL(18, 8) NOT NULL,
    creator_share DECIMAL(18, 8) NOT NULL,
    platform_share DECIMAL(18, 8) NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    block_number BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    rights JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disputes table
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number VARCHAR(20) UNIQUE NOT NULL,
    target_token_id VARCHAR(100) NOT NULL,
    reporter_address VARCHAR(42) NOT NULL,
    reason VARCHAR(20) NOT NULL CHECK (reason IN ('duplicate', 'infringement', 'inappropriate', 'other')),
    description TEXT NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    evidence_files JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_moderator VARCHAR(42),
    resolution TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processing jobs table
CREATE TABLE processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    processing_id VARCHAR(100) UNIQUE NOT NULL,
    user_address VARCHAR(42) NOT NULL,
    job_type VARCHAR(20) NOT NULL CHECK (job_type IN ('upload', 'derivative')),
    status VARCHAR(20) DEFAULT 'pending',
    current_step VARCHAR(20),
    progress INTEGER DEFAULT 0,
    steps JSONB NOT NULL DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    result JSONB,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User follows (social features)
CREATE TABLE user_follows (
    follower_address VARCHAR(42) NOT NULL REFERENCES users(address),
    following_address VARCHAR(42) NOT NULL REFERENCES users(address),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (follower_address, following_address),
    CHECK (follower_address != following_address)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address VARCHAR(42) NOT NULL REFERENCES users(address),
    type VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_videos_creator ON videos(creator_address);
CREATE INDEX idx_videos_parent ON videos(parent_token_id);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX idx_tips_video ON tips(video_id);
CREATE INDEX idx_tips_from ON tips(from_address);
CREATE INDEX idx_tips_created_at ON tips(created_at DESC);
CREATE INDEX idx_licenses_video ON licenses(video_id);
CREATE INDEX idx_licenses_purchaser ON licenses(purchaser_address);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_target ON disputes(target_token_id);
CREATE INDEX idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX idx_user_follows_follower ON user_follows(follower_address);
CREATE INDEX idx_user_follows_following ON user_follows(following_address);
CREATE INDEX idx_notifications_user ON notifications(user_address);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update video stats
CREATE OR REPLACE FUNCTION update_video_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'tips' THEN
        INSERT INTO video_stats (video_id, tips_count, tips_total)
        VALUES (NEW.video_id, 1, NEW.amount)
        ON CONFLICT (video_id) DO UPDATE SET
            tips_count = video_stats.tips_count + 1,
            tips_total = video_stats.tips_total + NEW.amount,
            updated_at = NOW();
    ELSIF TG_TABLE_NAME = 'licenses' THEN
        INSERT INTO video_stats (video_id, licenses_count, licenses_total)
        VALUES (NEW.video_id, 1, NEW.creator_share)
        ON CONFLICT (video_id) DO UPDATE SET
            licenses_count = video_stats.licenses_count + 1,
            licenses_total = video_stats.licenses_total + NEW.creator_share,
            updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic stats updates
CREATE TRIGGER update_stats_on_tip AFTER INSERT ON tips
    FOR EACH ROW EXECUTE FUNCTION update_video_stats();

CREATE TRIGGER update_stats_on_license AFTER INSERT ON licenses
    FOR EACH ROW EXECUTE FUNCTION update_video_stats();
