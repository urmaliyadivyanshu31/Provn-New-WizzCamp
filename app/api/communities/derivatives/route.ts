import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    
    const { 
      title,
      description,
      parent_token_id,
      community_id,
      creator_address,
      is_private,
      tags,
      video_url,
      thumbnail_url,
      transaction_hash
    } = body

    if (!title || !parent_token_id || !community_id || !creator_address || !video_url) {
      return NextResponse.json(
        { success: false, error: 'Title, parent token ID, community ID, creator address, and video URL are required' },
        { status: 400 }
      )
    }

    console.log('📝 Community Derivatives API: Creating derivative', { 
      title, 
      parent_token_id, 
      community_id, 
      creator_address 
    })

    // Verify community membership
    const { data: membership, error: membershipError } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', community_id)
      .eq('member_address', creator_address.toLowerCase())
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { success: false, error: 'User must be a community member to submit derivatives' },
        { status: 403 }
      )
    }

    // Generate a mock token ID for the derivative
    const token_id = Math.floor(Math.random() * 1000000) + 100000

    // Create the derivative record
    const derivativeData = {
      token_id,
      title: title.trim(),
      description: description?.trim() || null,
      parent_token_id: parseInt(parent_token_id),
      community_id,
      creator_address: creator_address.toLowerCase(),
      video_url,
      thumbnail_url: thumbnail_url || null,
      is_private: is_private || false,
      tags: tags || [],
      transaction_hash: transaction_hash || `demo_derivative_${Date.now()}`,
      views: 0,
      likes: 0,
      duration: '0:00' // Mock duration
    }

    const { data: derivative, error } = await supabase
      .from('community_derivatives')
      .insert([derivativeData])
      .select(`
        id,
        token_id,
        title,
        description,
        video_url,
        thumbnail_url,
        is_private,
        tags,
        views,
        likes,
        duration,
        created_at,
        creator_profile:profiles!community_derivatives_creator_address_fkey (
          id,
          handle,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('❌ Community Derivatives API: Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create derivative' },
        { status: 500 }
      )
    }

    // Update community derivative count
    await supabase.rpc('increment_community_derivative_count', { 
      community_id: community_id 
    })

    // Update member contribution score
    await supabase
      .from('community_members')
      .update({ 
        contribution_score: supabase.raw('contribution_score + 10'),
        updated_at: new Date().toISOString()
      })
      .eq('community_id', community_id)
      .eq('member_address', creator_address.toLowerCase())

    console.log('✅ Community Derivatives API: Derivative created successfully', { 
      derivativeId: derivative.id,
      tokenId: derivative.token_id
    })

    return NextResponse.json({
      success: true,
      derivative,
      message: 'Derivative submitted successfully'
    })

  } catch (error) {
    console.error('❌ Community Derivatives API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create derivative' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    
    const community_id = searchParams.get('community_id')
    const creator_address = searchParams.get('creator')
    const is_private = searchParams.get('private')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('community_derivatives')
      .select(`
        id,
        token_id,
        title,
        description,
        video_url,
        thumbnail_url,
        is_private,
        tags,
        views,
        likes,
        duration,
        created_at,
        creator_profile:profiles!community_derivatives_creator_address_fkey (
          id,
          handle,
          display_name,
          avatar_url
        ),
        community:communities!community_derivatives_community_id_fkey (
          id,
          name,
          tier
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (community_id) {
      query = query.eq('community_id', community_id)
    }

    if (creator_address) {
      query = query.eq('creator_address', creator_address.toLowerCase())
    }

    if (is_private !== null) {
      query = query.eq('is_private', is_private === 'true')
    }

    const { data: derivatives, error } = await query

    if (error) {
      console.error('❌ Community Derivatives API: Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch derivatives' },
        { status: 500 }
      )
    }

    console.log('✅ Community Derivatives API: Fetched derivatives', { 
      count: derivatives?.length || 0,
      community_id,
      creator_address
    })

    return NextResponse.json({
      success: true,
      derivatives: derivatives || []
    })

  } catch (error) {
    console.error('❌ Community Derivatives API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch derivatives' },
      { status: 500 }
    )
  }
}