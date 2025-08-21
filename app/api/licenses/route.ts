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
    const { searchParams } = new URL(request.url)
    const tokenId = searchParams.get('tokenId')
    const purchaser = searchParams.get('purchaser')

    if (tokenId) {
      // Get licenses for a specific token
      const tokenLicenses = licenses.get(tokenId) || []
      
      return NextResponse.json({
        success: true,
        licenses: tokenLicenses,
        count: tokenLicenses.length
      })
    }

    if (purchaser) {
      // Get licenses purchased by a specific user
      const userLicenses = []
      for (const [token, tokenLicenses] of licenses.entries()) {
        const userTokenLicenses = tokenLicenses.filter(license => license.purchaser === purchaser)
        userLicenses.push(...userTokenLicenses)
      }
      
      return NextResponse.json({
        success: true,
        licenses: userLicenses,
        count: userLicenses.length
      })
    }

    // Get all licenses
    const allLicenses = []
    for (const [token, tokenLicenses] of licenses.entries()) {
      allLicenses.push(...tokenLicenses)
    }

    return NextResponse.json({
      success: true,
      licenses: allLicenses.slice(-50), // Return last 50 licenses
      count: allLicenses.length
    })

  } catch (error) {
    console.error('❌ Licenses API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch licenses' },
      { status: 500 }
    )
  }
}