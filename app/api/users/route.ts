import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';

// GET - Fetch user profile by wallet address or handle
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');
    const handle = searchParams.get('handle');

    if (!walletAddress && !handle) {
      return NextResponse.json(
        { success: false, error: 'Either wallet address or handle is required' },
        { status: 400 }
      );
    }

    let userQuery = '';
    let queryParams: any[] = [];

    if (walletAddress) {
      userQuery = 'SELECT * FROM users WHERE wallet_address = $1';
      queryParams = [walletAddress];
    } else if (handle) {
      userQuery = 'SELECT * FROM users WHERE handle = $1';
      queryParams = [handle];
    }

    const result = await query(userQuery, queryParams);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    // Get user's content stats
    const contentStats = await query(`
      SELECT 
        COUNT(*) as total_content,
        COALESCE(SUM((SELECT COUNT(*) FROM likes l WHERE l.content_id = mc.id)), 0) as total_likes,
        COALESCE(SUM((SELECT COUNT(*) FROM views v WHERE v.content_id = mc.id)), 0) as total_views,
        COALESCE(SUM((SELECT COALESCE(SUM(amount), 0) FROM tips t WHERE t.content_id = mc.id)), 0) as total_tips_received
      FROM minted_content mc 
      WHERE mc.user_id = $1
    `, [user.id]);

    const stats = contentStats.rows[0];

    // Get user's recent content
    const recentContent = await query(`
      SELECT id, title, ipfs_url, mint_date, file_type
      FROM minted_content 
      WHERE user_id = $1 
      ORDER BY mint_date DESC 
      LIMIT 12
    `, [user.id]);

    const userProfile = {
      id: user.id,
      walletAddress: user.wallet_address,
      handle: user.handle,
      displayName: user.display_name,
      bio: user.bio,
      avatarUrl: user.avatar_url,
      bannerUrl: user.banner_url,
      verified: user.verified,
      followersCount: user.followers_count,
      followingCount: user.following_count,
      totalEarnings: parseFloat(user.total_earnings) || 0,
      joinedDate: user.created_at,
      stats: {
        totalContent: parseInt(stats.total_content) || 0,
        totalLikes: parseInt(stats.total_likes) || 0,
        totalViews: parseInt(stats.total_views) || 0,
        totalTipsReceived: parseFloat(stats.total_tips_received) || 0,
      },
      recentContent: recentContent.rows.map(content => ({
        id: content.id,
        title: content.title,
        thumbnailUrl: content.ipfs_url,
        mintDate: content.mint_date,
        fileType: content.file_type,
      })),
    };

    return NextResponse.json({
      success: true,
      user: userProfile,
    });

  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

// POST - Create or update user profile
export async function POST(request: NextRequest) {
  try {
    const {
      walletAddress,
      handle,
      displayName,
      bio,
      avatarUrl,
      bannerUrl,
    } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    let existingUser = await query(
      'SELECT id FROM users WHERE wallet_address = $1',
      [walletAddress]
    );

    let result;
    
    if (existingUser.rows.length === 0) {
      // Create new user
      result = await query(`
        INSERT INTO users (
          wallet_address, handle, display_name, bio, avatar_url, banner_url
        ) VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING id, wallet_address, handle, display_name, bio, avatar_url, banner_url, created_at
      `, [
        walletAddress,
        handle || `@${walletAddress.slice(0, 8)}`,
        displayName,
        bio,
        avatarUrl,
        bannerUrl
      ]);
    } else {
      // Update existing user
      result = await query(`
        UPDATE users SET 
          handle = COALESCE($2, handle),
          display_name = COALESCE($3, display_name),
          bio = COALESCE($4, bio),
          avatar_url = COALESCE($5, avatar_url),
          banner_url = COALESCE($6, banner_url),
          updated_at = CURRENT_TIMESTAMP
        WHERE wallet_address = $1
        RETURNING id, wallet_address, handle, display_name, bio, avatar_url, banner_url, created_at
      `, [walletAddress, handle, displayName, bio, avatarUrl, bannerUrl]);
    }

    return NextResponse.json({
      success: true,
      user: result.rows[0],
      message: existingUser.rows.length === 0 ? 'Profile created successfully' : 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Failed to create/update user profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create/update user profile' },
      { status: 500 }
    );
  }
}