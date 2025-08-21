import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = createAdminClient()
    const communityId = id
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const role = searchParams.get('role')
    
    const offset = (page - 1) * limit

    console.log('👥 Community Members API: Fetching members', { communityId, page, limit, role })

    // Build query
    let query = supabase
      .from('community_members')
      .select(`
        id,
        member_address,
        joined_at,
        role,
        contribution_score,
        last_active_at,
        member_profile:profiles!community_members_member_address_fkey (
          id,
          handle,
          display_name,
          avatar_url,
          bio
        )
      `)
      .eq('community_id', communityId)

    if (role) {
      query = query.eq('role', role)
    }

    // Sort by role importance, then by contribution score, then by join date
    query = query.order('role', { ascending: true }) // admin, moderator, member
      .order('contribution_score', { ascending: false })
      .order('joined_at', { ascending: true })

    // Apply pagination
    const { data: members, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('❌ Community Members API: Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch members' },
        { status: 500 }
      )
    }

    // Get total count
    let totalCount = count
    if (!totalCount) {
      const { count: totalCountQuery } = await supabase
        .from('community_members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId)
      
      totalCount = totalCountQuery || 0
    }

    const totalPages = Math.ceil(totalCount / limit)
    const hasMore = page < totalPages

    console.log('✅ Community Members API: Fetched members successfully', { 
      count: members?.length || 0, 
      totalCount 
    })

    return NextResponse.json({
      success: true,
      members,
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
    console.error('❌ Community Members API: Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = createAdminClient()
    const communityId = id
    const body = await request.json()
    
    const { member_address, transaction_hash } = body

    if (!member_address) {
      return NextResponse.json(
        { success: false, error: 'Member address required' },
        { status: 400 }
      )
    }

    console.log('👥 Community Join API: Adding member', { communityId, member_address })

    // Check if community exists and is active
    const { data: community } = await supabase
      .from('communities')
      .select('id, active, member_count')
      .eq('id', communityId)
      .eq('active', true)
      .single()

    if (!community) {
      return NextResponse.json(
        { success: false, error: 'Community not found or inactive' },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const { data: existingMembership } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', communityId)
      .eq('member_address', member_address.toLowerCase())
      .single()

    if (existingMembership) {
      return NextResponse.json(
        { success: false, error: 'User is already a member of this community' },
        { status: 409 }
      )
    }

    // Add the member
    const { data: membership, error: memberError } = await supabase
      .from('community_members')
      .insert({
        community_id: communityId,
        member_address: member_address.toLowerCase(),
        role: 'member',
        contribution_score: 0
      })
      .select()
      .single()

    if (memberError) {
      console.error('❌ Community Join API: Failed to add member:', memberError)
      return NextResponse.json(
        { success: false, error: 'Failed to join community' },
        { status: 500 }
      )
    }

    // The member count update is handled by the database trigger

    console.log('✅ Community Join API: Member added successfully', { 
      membershipId: membership.id,
      communityId,
      memberAddress: member_address 
    })

    return NextResponse.json({
      success: true,
      membership,
      message: 'Successfully joined community'
    })

  } catch (error) {
    console.error('❌ Community Join API: Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to join community' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = createAdminClient()
    const communityId = id
    const { searchParams } = new URL(request.url)
    const memberAddress = searchParams.get('member_address')

    if (!memberAddress) {
      return NextResponse.json(
        { success: false, error: 'Member address required' },
        { status: 400 }
      )
    }

    console.log('👥 Community Leave API: Removing member', { communityId, memberAddress })

    // Check if user is a member
    const { data: membership } = await supabase
      .from('community_members')
      .select('id, role')
      .eq('community_id', communityId)
      .eq('member_address', memberAddress.toLowerCase())
      .single()

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'User is not a member of this community' },
        { status: 404 }
      )
    }

    // Prevent admin from leaving their own community
    if (membership.role === 'admin') {
      return NextResponse.json(
        { success: false, error: 'Community admin cannot leave the community' },
        { status: 403 }
      )
    }

    // Remove the membership
    const { error: deleteError } = await supabase
      .from('community_members')
      .delete()
      .eq('id', membership.id)

    if (deleteError) {
      console.error('❌ Community Leave API: Failed to remove member:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to leave community' },
        { status: 500 }
      )
    }

    // The member count update is handled by the database trigger

    console.log('✅ Community Leave API: Member removed successfully', { 
      membershipId: membership.id,
      communityId,
      memberAddress 
    })

    return NextResponse.json({
      success: true,
      message: 'Successfully left community'
    })

  } catch (error) {
    console.error('❌ Community Leave API: Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to leave community' },
      { status: 500 }
    )
  }
}