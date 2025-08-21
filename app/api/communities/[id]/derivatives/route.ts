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
    const featured = searchParams.get('featured') === 'true'
    const creatorAddress = searchParams.get('creator')
    
    const offset = (page - 1) * limit

    console.log('🎨 Community Derivatives API: Fetching derivatives', { 
      communityId, page, limit, featured, creatorAddress 
    })

    // Build query
    let query = supabase
      .from('community_derivatives')
      .select(`
        id,
        derivative_token_id,
        creator_address,
        added_at,
        featured,
        likes_count,
        views_count,
        title,
        description,
        thumbnail_url,
        video_url,
        creator_profile:profiles!community_derivatives_creator_address_fkey (
          id,
          handle,
          display_name,
          avatar_url
        )
      `)
      .eq('community_id', communityId)

    if (featured) {
      query = query.eq('featured', true)
    }

    if (creatorAddress) {
      query = query.eq('creator_address', creatorAddress.toLowerCase())
    }

    // Sort by featured first, then by likes, then by date
    query = query
      .order('featured', { ascending: false })
      .order('likes_count', { ascending: false })
      .order('added_at', { ascending: false })

    // Apply pagination
    const { data: derivatives, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('❌ Community Derivatives API: Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch derivatives' },
        { status: 500 }
      )
    }

    // Get total count
    let totalCount = count
    if (!totalCount) {
      const { count: totalCountQuery } = await supabase
        .from('community_derivatives')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId)
      
      totalCount = totalCountQuery || 0
    }

    const totalPages = Math.ceil(totalCount / limit)
    const hasMore = page < totalPages

    console.log('✅ Community Derivatives API: Fetched derivatives successfully', { 
      count: derivatives?.length || 0, 
      totalCount 
    })

    return NextResponse.json({
      success: true,
      derivatives,
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
    console.error('❌ Community Derivatives API: Unexpected error:', error)
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
    
    const {
      derivative_token_id,
      creator_address,
      title,
      description,
      thumbnail_url,
      video_url,
      transaction_hash
    } = body

    if (!derivative_token_id || !creator_address) {
      return NextResponse.json(
        { success: false, error: 'Derivative token ID and creator address required' },
        { status: 400 }
      )
    }

    console.log('🎨 Community Add Derivative API: Adding derivative', { 
      communityId, derivative_token_id, creator_address 
    })

    // Check if community exists and is active
    const { data: community } = await supabase
      .from('communities')
      .select('id, active, creator_token_id')
      .eq('id', communityId)
      .eq('active', true)
      .single()

    if (!community) {
      return NextResponse.json(
        { success: false, error: 'Community not found or inactive' },
        { status: 404 }
      )
    }

    // Check if user is a member of this community
    const { data: membership } = await supabase
      .from('community_members')
      .select('id, role')
      .eq('community_id', communityId)
      .eq('member_address', creator_address.toLowerCase())
      .single()

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'User must be a community member to add derivatives' },
        { status: 403 }
      )
    }

    // Check if this derivative is already in the community
    const { data: existingDerivative } = await supabase
      .from('community_derivatives')
      .select('id')
      .eq('community_id', communityId)
      .eq('derivative_token_id', derivative_token_id)
      .single()

    if (existingDerivative) {
      return NextResponse.json(
        { success: false, error: 'This derivative is already in the community' },
        { status: 409 }
      )
    }

    // Check if user has an active license for the original content
    // This should be verified via the blockchain, but for now we'll trust the frontend verification

    // Add the derivative
    const { data: derivative, error: derivativeError } = await supabase
      .from('community_derivatives')
      .insert({
        community_id: communityId,
        derivative_token_id: parseInt(derivative_token_id),
        creator_address: creator_address.toLowerCase(),
        title: title?.trim(),
        description: description?.trim(),
        thumbnail_url,
        video_url,
        featured: false,
        likes_count: 0,
        views_count: 0
      })
      .select()
      .single()

    if (derivativeError) {
      console.error('❌ Community Add Derivative API: Failed to add derivative:', derivativeError)
      return NextResponse.json(
        { success: false, error: 'Failed to add derivative to community' },
        { status: 500 }
      )
    }

    // Update member contribution score
    await supabase
      .from('community_members')
      .update({ 
        contribution_score: supabase.raw('contribution_score + 10'),
        last_active_at: new Date().toISOString()
      })
      .eq('id', membership.id)

    // The derivative count update and tier check are handled by database triggers

    console.log('✅ Community Add Derivative API: Derivative added successfully', { 
      derivativeId: derivative.id,
      communityId,
      derivativeTokenId: derivative_token_id 
    })

    return NextResponse.json({
      success: true,
      derivative,
      message: 'Derivative added to community successfully'
    })

  } catch (error) {
    console.error('❌ Community Add Derivative API: Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add derivative to community' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = createAdminClient()
    const communityId = id
    const body = await request.json()
    
    const {
      derivative_id,
      featured,
      admin_address
    } = body

    if (!derivative_id || !admin_address) {
      return NextResponse.json(
        { success: false, error: 'Derivative ID and admin address required' },
        { status: 400 }
      )
    }

    console.log('🎨 Community Update Derivative API: Updating derivative', { 
      communityId, derivative_id, featured 
    })

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
        { success: false, error: 'Unauthorized: Only community admins can feature derivatives' },
        { status: 403 }
      )
    }

    // If featuring this derivative, unffeature others first
    if (featured) {
      await supabase
        .from('community_derivatives')
        .update({ featured: false })
        .eq('community_id', communityId)
        .neq('id', derivative_id)
    }

    // Update the derivative
    const { data: derivative, error } = await supabase
      .from('community_derivatives')
      .update({ featured })
      .eq('id', derivative_id)
      .eq('community_id', communityId)
      .select()
      .single()

    if (error) {
      console.error('❌ Community Update Derivative API: Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update derivative' },
        { status: 500 }
      )
    }

    // Update community's featured derivative ID
    if (featured) {
      await supabase
        .from('communities')
        .update({ featured_derivative_id: parseInt(derivative.derivative_token_id) })
        .eq('id', communityId)
    }

    console.log('✅ Community Update Derivative API: Derivative updated successfully', { 
      derivativeId: derivative.id,
      featured 
    })

    return NextResponse.json({
      success: true,
      derivative,
      message: `Derivative ${featured ? 'featured' : 'unfeatured'} successfully`
    })

  } catch (error) {
    console.error('❌ Community Update Derivative API: Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}