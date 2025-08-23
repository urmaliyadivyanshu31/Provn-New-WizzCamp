import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    
    const {
      license_id,
      additional_periods,
      new_expires_at,
      price_paid,
      transaction_hash,
      block_number
    } = body

    if (!license_id || !additional_periods || !new_expires_at || !price_paid) {
      return NextResponse.json(
        { success: false, error: 'Missing required renewal parameters' },
        { status: 400 }
      )
    }

    console.log('🔄 License Renewal API: Processing renewal', { 
      license_id, 
      additional_periods,
      new_expires_at
    })

    // First, get the existing license
    const { data: existingLicense, error: fetchError } = await supabase
      .from('license_transactions')
      .select('*')
      .eq('id', license_id)
      .single()

    if (fetchError || !existingLicense) {
      console.error('❌ License not found:', fetchError)
      return NextResponse.json(
        { success: false, error: 'License not found' },
        { status: 404 }
      )
    }

    // Update the license expiration date
    const { data: updatedLicense, error: updateError } = await supabase
      .from('license_transactions')
      .update({
        expires_at: new_expires_at,
        periods: existingLicense.periods + additional_periods,
        updated_at: new Date().toISOString()
      })
      .eq('id', license_id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ License renewal failed:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to renew license' },
        { status: 500 }
      )
    }

    // Record the renewal transaction separately for audit trail
    const { error: renewalRecordError } = await supabase
      .from('license_renewals')
      .insert({
        original_license_id: license_id,
        additional_periods,
        price_paid: parseFloat(price_paid),
        transaction_hash,
        block_number,
        renewed_at: new Date().toISOString()
      })

    if (renewalRecordError) {
      console.warn('⚠️ Failed to record renewal audit trail:', renewalRecordError)
      // Don't fail the entire operation for audit trail issues
    }

    // Update creator stats for the additional revenue
    try {
      const { data: video } = await supabase
        .from('platform_videos')
        .select('creator_address')
        .eq('token_id', existingLicense.token_id)
        .single()

      if (video?.creator_address) {
        const creatorRevenue = parseFloat(price_paid) * 0.975
        
        await supabase.rpc('update_creator_stats_from_license', {
          creator_addr: video.creator_address,
          revenue_amount: creatorRevenue
        })
      }
    } catch (statsError) {
      console.warn('⚠️ Failed to update creator stats for renewal:', statsError)
    }

    console.log('✅ License renewal successful', { 
      licenseId: license_id,
      newExpiryDate: new_expires_at
    })

    return NextResponse.json({
      success: true,
      license: updatedLicense,
      message: 'License renewed successfully'
    })

  } catch (error) {
    console.error('❌ License Renewal API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process license renewal' },
      { status: 500 }
    )
  }
}