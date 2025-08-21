import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { Community, CommunityWithDetails, CommunityTier } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const tier = searchParams.get('tier') as CommunityTier | null
    const creatorAddress = searchParams.get('creator')
    const userAddress = searchParams.get('user') // To check membership
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    const offset = (page - 1) * limit

    console.log('🏘️ Communities API: Fetching communities', { page, limit, tier, creatorAddress, userAddress, search, sortBy, sortOrder })

    // Build the query
    let query = supabase
      .from('communities')
      .select(`
        *,
        creator_profile:profiles!communities_creator_address_fkey (
          id,
          handle,
          display_name,
          avatar_url
        ),
        recent_derivatives:community_derivatives (
          id,
          derivative_token_id,
          creator_address,
          title,
          thumbnail_url,
          added_at,
          likes_count,
          featured
        )
      `)
      .eq('active', true)

    // Apply filters
    if (tier) {
      query = query.eq('tier', tier)
    }

    if (creatorAddress) {
      query = query.eq('creator_address', creatorAddress.toLowerCase())
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply sorting
    if (sortBy === 'member_count') {
      query = query.order('member_count', { ascending: sortOrder === 'asc' })
    } else if (sortBy === 'derivative_count') {
      query = query.order('derivative_count', { ascending: sortOrder === 'asc' })
    } else {
      query = query.order('created_at', { ascending: sortOrder === 'asc' })
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: communities, error, count } = await query

    if (error) {
      console.error('❌ Communities API: Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch communities' },
        { status: 500 }
      )
    }

    // If user address is provided, check membership status
    let communitiesWithMembership: CommunityWithDetails[] = communities || []

    if (userAddress && communities) {
      const communityIds = communities.map(c => c.id)
      
      const { data: memberships } = await supabase
        .from('community_members')
        .select('community_id, role')
        .eq('member_address', userAddress.toLowerCase())
        .in('community_id', communityIds)

      const membershipMap = new Map(
        memberships?.map(m => [m.community_id, m.role]) || []
      )

      communitiesWithMembership = communities.map(community => ({
        ...community,
        is_member: membershipMap.has(community.id),
        user_role: membershipMap.get(community.id) || 'none',
        recent_derivatives: community.recent_derivatives?.slice(0, 3) || [] // Limit to 3 recent
      }))
    }

    // Get total count for pagination
    let totalCount = count

    if (!totalCount) {
      const { count: totalCountQuery } = await supabase
        .from('communities')
        .select('*', { count: 'exact', head: true })
        .eq('active', true)
      
      totalCount = totalCountQuery || 0
    }

    const totalPages = Math.ceil(totalCount / limit)
    const hasMore = page < totalPages

    console.log('✅ Communities API: Fetched communities successfully', { 
      count: communities?.length || 0, 
      totalCount,
      totalPages,
      hasMore 
    })

    return NextResponse.json({
      success: true,
      communities: communitiesWithMembership,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore,
        hasPrevious: page > 1
      }
    })

  } catch (error) {
    console.error('❌ Communities API: Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    
    const {
      contract_community_id,
      creator_token_id,
      creator_address,
      name,
      description,
      transaction_hash
    } = body

    if (!contract_community_id || !creator_token_id || !creator_address || !name) {
      return NextResponse.json(
        { success: false, error: 'Missing required community data' },
        { status: 400 }
      )
    }

    console.log('🏘️ Communities API: Creating community', { 
      contract_community_id, 
      creator_token_id, 
      creator_address, 
      name 
    })

    // Check if community with this contract ID already exists
    const { data: existingCommunity } = await supabase
      .from('communities')
      .select('id')
      .eq('contract_community_id', contract_community_id)
      .single()

    if (existingCommunity) {
      return NextResponse.json(
        { success: false, error: 'Community with this contract ID already exists' },
        { status: 409 }
      )
    }

    // Create the community
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .insert({
        contract_community_id,
        creator_token_id,
        creator_address: creator_address.toLowerCase(),
        name: name.trim(),
        description: description?.trim() || null,
        tier: 'BRONZE',
        member_count: 1,
        derivative_count: 0,
        active: true
      })
      .select()
      .single()

    if (communityError) {
      console.error('❌ Communities API: Failed to create community:', communityError)
      return NextResponse.json(
        { success: false, error: 'Failed to create community' },
        { status: 500 }
      )
    }

    // Add the creator as the first member with admin role
    const { error: memberError } = await supabase
      .from('community_members')
      .insert({
        community_id: community.id,
        member_address: creator_address.toLowerCase(),
        role: 'admin',
        contribution_score: 0
      })

    if (memberError) {
      console.error('❌ Communities API: Failed to add creator as member:', memberError)
      // Don't fail the entire operation, but log the error
    }

    // Update creator stats
    await supabase.rpc('update_creator_stats_community', {
      creator_addr: creator_address.toLowerCase(),
      new_community: true
    }).catch(err => {
      console.warn('⚠️ Failed to update creator stats:', err)
    })

    console.log('✅ Communities API: Community created successfully', { 
      communityId: community.id,
      contractId: contract_community_id 
    })

    return NextResponse.json({
      success: true,
      community,
      message: 'Community created successfully'
    })

  } catch (error) {
    console.error('❌ Communities API: Create error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create community' },
      { status: 500 }
    )
  }
}