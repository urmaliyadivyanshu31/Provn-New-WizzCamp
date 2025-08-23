import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    
    const month = searchParams.get('month') // YYYYMM format
    const year = searchParams.get('year')
    const userAddress = searchParams.get('user')
    
    // Default to current month if not specified
    const now = new Date()
    const currentMonth = parseInt(month || `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`)
    const currentYear = parseInt(year || now.getFullYear().toString())

    console.log('🏆 Monthly Top Creators API: Fetching top creators', { currentMonth, currentYear, userAddress })

    // Get the top creators for the specified month
    const { data: topCreators, error } = await supabase
      .from('monthly_top_creators')
      .select(`
        id,
        creator_address,
        rank,
        total_revenue,
        licenses_sold,
        derivatives_created,
        community_created,
        creator_profile:profiles!monthly_top_creators_creator_address_fkey (
          id,
          handle,
          display_name,
          avatar_url,
          bio
        )
      `)
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .order('rank', { ascending: true })

    if (error) {
      console.error('❌ Monthly Top Creators API: Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch top creators' },
        { status: 500 }
      )
    }

    // Check if user can create community this month
    let userCanCreateCommunity = false
    if (userAddress) {
      userCanCreateCommunity = topCreators?.some(
        creator => creator.creator_address.toLowerCase() === userAddress.toLowerCase()
      ) || false
    }

    // Calculate stats for this month
    const monthStats = {
      totalTopCreators: topCreators?.length || 0,
      totalRevenue: topCreators?.reduce((sum, creator) => sum + parseFloat(creator.total_revenue), 0) || 0,
      totalLicensesSold: topCreators?.reduce((sum, creator) => sum + creator.licenses_sold, 0) || 0,
      communitiesCreated: topCreators?.filter(creator => creator.community_created).length || 0
    }

    console.log('✅ Monthly Top Creators API: Fetched successfully', { 
      month: currentMonth,
      topCreatorsCount: topCreators?.length || 0,
      userCanCreateCommunity
    })

    return NextResponse.json({
      success: true,
      month: currentMonth,
      year: currentYear,
      topCreators: topCreators || [],
      userCanCreateCommunity,
      stats: monthStats
    })

  } catch (error) {
    console.error('❌ Monthly Top Creators API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch top creators' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    
    const { month, year, creators, adminKey } = body

    // Simple admin authentication (in production, use proper auth)
    if (adminKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!month || !year || !creators || !Array.isArray(creators) || creators.length > 2) {
      return NextResponse.json(
        { success: false, error: 'Month, year, and up to 2 creators required' },
        { status: 400 }
      )
    }

    console.log('🏆 Monthly Top Creators Update API: Setting top creators', { month, year, creatorsCount: creators.length })

    // Delete existing entries for this month
    await supabase
      .from('monthly_top_creators')
      .delete()
      .eq('month', month)
      .eq('year', year)

    // Insert new top creators
    const topCreatorsData = creators.map((creator, index) => ({
      month,
      year,
      creator_address: creator.address.toLowerCase(),
      rank: index + 1,
      total_revenue: creator.revenue || 0,
      licenses_sold: creator.licensesSold || 0,
      derivatives_created: creator.derivatives || 0,
      community_created: false
    }))

    const { data: insertedCreators, error } = await supabase
      .from('monthly_top_creators')
      .insert(topCreatorsData)
      .select()

    if (error) {
      console.error('❌ Monthly Top Creators Update API: Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to set top creators' },
        { status: 500 }
      )
    }

    console.log('✅ Monthly Top Creators Update API: Top creators set successfully', { 
      month,
      year,
      creatorsCount: insertedCreators?.length || 0
    })

    return NextResponse.json({
      success: true,
      month,
      year,
      topCreators: insertedCreators,
      message: 'Top creators set successfully'
    })

  } catch (error) {
    console.error('❌ Monthly Top Creators Update API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to set top creators' },
      { status: 500 }
    )
  }
}