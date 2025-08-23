import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

/**
 * Auto-check and unlock achievements for a user based on their current stats
 * POST /api/achievements/check
 * Body: { userAddress: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { userAddress } = await request.json()

    if (!userAddress) {
      return NextResponse.json(
        { success: false, error: 'User address is required' },
        { status: 400 }
      )
    }

    console.log('🏆 Auto-checking achievements for:', userAddress)

    // Call the PostgreSQL function to check and unlock achievements
    const { data: newAchievements, error } = await supabase
      .rpc('check_and_unlock_achievements', {
        user_wallet: userAddress.toLowerCase()
      })

    if (error) {
      console.error('❌ Error checking achievements:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to check achievements' },
        { status: 500 }
      )
    }

    console.log('✅ Achievement check complete:', {
      userAddress,
      newAchievements: newAchievements?.length || 0
    })

    return NextResponse.json({
      success: true,
      newAchievements: newAchievements || [],
      message: newAchievements?.length > 0 
        ? `${newAchievements.length} new achievement(s) unlocked!`
        : 'No new achievements unlocked'
    })

  } catch (error) {
    console.error('❌ Achievement check API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check achievements' },
      { status: 500 }
    )
  }
}
