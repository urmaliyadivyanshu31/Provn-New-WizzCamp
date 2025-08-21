import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()
    const communityId = params.id
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('user')

    console.log('🏘️ Community Detail API: Fetching community', { communityId, userAddress })

    // Get community details with creator profile and recent derivatives
    const { data: community, error } = await supabase
      .from('communities')
      .select(`
        *,
        creator_profile:profiles!communities_creator_address_fkey (
          id,
          handle,
          display_name,
          avatar_url,
          bio
        ),
        recent_derivatives:community_derivatives (
          id,
          derivative_token_id,
          creator_address,
          title,
          description,
          thumbnail_url,
          video_url,
          added_at,
          likes_count,
          views_count,
          featured,
          creator_profile:profiles!community_derivatives_creator_address_fkey (
            id,
            handle,
            display_name,
            avatar_url
          )
        ),
        community_members (
          id,
          member_address,
          joined_at,
          role,
          contribution_score,
          member_profile:profiles!community_members_member_address_fkey (
            id,
            handle,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('id', communityId)
      .eq('active', true)
      .single()

    if (error) {
      console.error('❌ Community Detail API: Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Community not found' },
        { status: 404 }
      )
    }

    if (!community) {
      return NextResponse.json(
        { success: false, error: 'Community not found' },
        { status: 404 }
      )
    }

    // Check if user is a member and get their role
    let userMembership = null
    if (userAddress) {
      const { data: membership } = await supabase
        .from('community_members')
        .select('role, joined_at, contribution_score')
        .eq('community_id', communityId)
        .eq('member_address', userAddress.toLowerCase())
        .single()

      userMembership = membership
    }

    // Sort derivatives by featured first, then by date
    if (community.recent_derivatives) {
      community.recent_derivatives.sort((a, b) => {
        if (a.featured && !b.featured) return -1
        if (!a.featured && b.featured) return 1
        return new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
      })
    }

    // Sort members by role (admin, moderator, member) and contribution score
    if (community.community_members) {
      community.community_members.sort((a, b) => {
        const roleOrder = { admin: 0, moderator: 1, member: 2 }
        const aRole = roleOrder[a.role as keyof typeof roleOrder] || 3
        const bRole = roleOrder[b.role as keyof typeof roleOrder] || 3
        
        if (aRole !== bRole) return aRole - bRole
        return b.contribution_score - a.contribution_score
      })
    }

    const communityWithMembership = {
      ...community,
      is_member: !!userMembership,
      user_role: userMembership?.role || 'none',
      user_joined_at: userMembership?.joined_at,
      user_contribution_score: userMembership?.contribution_score || 0
    }

    console.log('✅ Community Detail API: Fetched community successfully', { 
      communityId,
      memberCount: community.member_count,
      derivativeCount: community.derivative_count,
      isUserMember: !!userMembership
    })

    return NextResponse.json({
      success: true,
      community: communityWithMembership
    })

  } catch (error) {
    console.error('❌ Community Detail API: Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()
    const communityId = params.id
    const body = await request.json()
    
    const { name, description, featured_derivative_id, admin_address } = body

    if (!admin_address) {
      return NextResponse.json(
        { success: false, error: 'Admin address required' },
        { status: 400 }
      )
    }

    console.log('🏘️ Community Update API: Updating community', { communityId, admin_address })

    // Verify the user is an admin of this community
    const { data: membership } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('member_address', admin_address.toLowerCase())
      .eq('role', 'admin')
      .single()

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only community admins can update community details' },
        { status: 403 }
      )
    }

    // Build update object
    const updates: any = { updated_at: new Date().toISOString() }
    
    if (name !== undefined) updates.name = name.trim()
    if (description !== undefined) updates.description = description?.trim() || null
    if (featured_derivative_id !== undefined) updates.featured_derivative_id = featured_derivative_id

    // Update the community
    const { data: updatedCommunity, error } = await supabase
      .from('communities')
      .update(updates)
      .eq('id', communityId)
      .select()
      .single()

    if (error) {
      console.error('❌ Community Update API: Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update community' },
        { status: 500 }
      )
    }

    console.log('✅ Community Update API: Updated community successfully', { 
      communityId,
      updates: Object.keys(updates)
    })

    return NextResponse.json({
      success: true,
      community: updatedCommunity,
      message: 'Community updated successfully'
    })

  } catch (error) {
    console.error('❌ Community Update API: Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}