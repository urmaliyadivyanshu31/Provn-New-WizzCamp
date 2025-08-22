import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    
    const {
      token_id,
      licensee_address,
      license_type,
      price_paid,
      periods,
      duration_seconds,
      expires_at,
      transaction_hash,
      block_number
    } = body

    if (!token_id || !licensee_address || !license_type || !price_paid || !periods || !duration_seconds || !expires_at) {
      return NextResponse.json(
        { success: false, error: 'All license details required' },
        { status: 400 }
      )
    }

    console.log('📄 Licenses API: Recording license purchase', { 
      token_id, 
      licensee_address, 
      license_type, 
      periods 
    })

    // Save license transaction to database
    const { data: licenseTransaction, error } = await supabase
      .from('license_transactions')
      .insert({
        token_id: parseInt(token_id),
        licensee_address: licensee_address.toLowerCase(),
        license_type,
        price_paid: parseFloat(price_paid),
        periods,
        duration_seconds,
        expires_at,
        transaction_hash,
        block_number
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Licenses API: Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to record license purchase' },
        { status: 500 }
      )
    }

    // Update creator stats (get creator address from platform_videos or profiles)
    try {
      const { data: video } = await supabase
        .from('platform_videos')
        .select('creator_address')
        .eq('token_id', parseInt(token_id))
        .single()

      if (video?.creator_address) {
        // Calculate creator revenue (total - platform fee)
        const creatorRevenue = parseFloat(price_paid) * 0.975 // 97.5% after 2.5% platform fee
        
        await supabase.rpc('update_creator_stats_from_license', {
          creator_addr: video.creator_address,
          revenue_amount: creatorRevenue
        })
      }
    } catch (statsError) {
      console.warn('⚠️ Failed to update creator stats:', statsError)
    }

    console.log('✅ Licenses API: License recorded successfully', { 
      licenseId: licenseTransaction.id,
      tokenId: token_id
    })

    return NextResponse.json({
      success: true,
      license: licenseTransaction,
      message: 'License purchase recorded successfully'
    })

  } catch (error) {
    console.error('❌ Licenses API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record license purchase' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const tokenId = searchParams.get('tokenId')
    const purchaser = searchParams.get('purchaser')
    const status = searchParams.get('status') // 'active', 'expired', 'expiring_soon'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const detailed = searchParams.get('detailed') === 'true'

    console.log('📄 Licenses API: GET request', { 
      tokenId, 
      purchaser, 
      status, 
      detailed,
      limit,
      offset
    })

    let query = supabase
      .from('license_transactions')
      .select(`
        *,
        ${detailed ? `
        platform_videos!inner(
          token_id,
          title,
          description,
          video_url,
          thumbnail_url,
          creator_address,
          profiles(handle, display_name, avatar_url)
        )
        ` : ''}
      `)
      .order('created_at', { ascending: false })

    if (tokenId) {
      query = query.eq('token_id', parseInt(tokenId))
    }

    if (purchaser) {
      query = query.eq('licensee_address', purchaser.toLowerCase())
    }

    // Add status filtering
    if (status) {
      const now = new Date().toISOString()
      const soonThreshold = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      
      switch (status) {
        case 'active':
          query = query.gt('expires_at', now)
          break
        case 'expired':
          query = query.lte('expires_at', now)
          break
        case 'expiring_soon':
          query = query.gt('expires_at', now).lte('expires_at', soonThreshold)
          break
      }
    }

    const { data: licenses, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error('❌ Licenses API: Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch licenses' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('license_transactions')
      .select('*', { count: 'exact', head: true })

    if (tokenId) {
      countQuery = countQuery.eq('token_id', parseInt(tokenId))
    }

    if (purchaser) {
      countQuery = countQuery.eq('licensee_address', purchaser.toLowerCase())
    }

    const { count: totalCount } = await countQuery

    // Process licenses to add computed fields
    const processedLicenses = licenses?.map((license: any) => {
      const now = new Date()
      const expiresAt = new Date(license.expires_at)
      const isExpired = expiresAt <= now
      const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const isExpiringSoon = !isExpired && daysUntilExpiry <= 7

      return {
        ...license,
        computed: {
          is_expired: isExpired,
          is_expiring_soon: isExpiringSoon,
          days_until_expiry: isExpired ? 0 : daysUntilExpiry,
          status: isExpired ? 'expired' : isExpiringSoon ? 'expiring_soon' : 'active'
        }
      }
    })

    console.log(`✅ Licenses API: Retrieved ${processedLicenses?.length || 0} licenses`)

    return NextResponse.json({
      success: true,
      licenses: processedLicenses || [],
      count: processedLicenses?.length || 0,
      total_count: totalCount || 0,
      pagination: {
        limit,
        offset,
        has_more: (totalCount || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('❌ Licenses API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch licenses' },
      { status: 500 }
    )
  }
}