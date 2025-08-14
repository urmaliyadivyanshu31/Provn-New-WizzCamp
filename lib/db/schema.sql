-- Database schema for Provn platform

-- Users table for profile management
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    handle VARCHAR(50) UNIQUE,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    total_earnings DECIMAL(18,8) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Minted content table
CREATE TABLE IF NOT EXISTS minted_content (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    ipnft_id VARCHAR(66) UNIQUE NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_type VARCHAR(50),
    file_size BIGINT,
    ipfs_hash VARCHAR(59) NOT NULL,
    ipfs_url TEXT NOT NULL,
    metadata JSONB,
    license_terms JSONB,
    is_original BOOLEAN DEFAULT TRUE,
    parent_id INTEGER REFERENCES minted_content(id),
    mint_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'minted' -- minted, processing, failed
);

-- Social interactions
CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    content_id INTEGER REFERENCES minted_content(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, content_id)
);

CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    content_id INTEGER REFERENCES minted_content(id),
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tips (
    id SERIAL PRIMARY KEY,
    from_user_id INTEGER REFERENCES users(id),
    to_user_id INTEGER REFERENCES users(id),
    content_id INTEGER REFERENCES minted_content(id),
    amount DECIMAL(18,8) NOT NULL,
    currency VARCHAR(10) DEFAULT 'CAMP',
    transaction_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- View tracking
CREATE TABLE IF NOT EXISTS views (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id), -- nullable for anonymous views
    content_id INTEGER REFERENCES minted_content(id),
    view_duration INTEGER, -- in milliseconds
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Licensing purchases
CREATE TABLE IF NOT EXISTS license_purchases (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER REFERENCES users(id),
    seller_id INTEGER REFERENCES users(id),
    content_id INTEGER REFERENCES minted_content(id),
    license_type VARCHAR(50),
    price DECIMAL(18,8) NOT NULL,
    currency VARCHAR(10) DEFAULT 'CAMP',
    transaction_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_handle ON users(handle);
CREATE INDEX IF NOT EXISTS idx_minted_content_user_id ON minted_content(user_id);
CREATE INDEX IF NOT EXISTS idx_minted_content_ipnft_id ON minted_content(ipnft_id);
CREATE INDEX IF NOT EXISTS idx_minted_content_mint_date ON minted_content(mint_date DESC);
CREATE INDEX IF NOT EXISTS idx_likes_content_id ON likes(content_id);
CREATE INDEX IF NOT EXISTS idx_comments_content_id ON comments(content_id);
CREATE INDEX IF NOT EXISTS idx_views_content_id ON views(content_id);
CREATE INDEX IF NOT EXISTS idx_tips_content_id ON tips(content_id);