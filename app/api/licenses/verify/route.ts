import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    
    const tokenId = searchParams.get('tokenId')
    const userAddress = searchParams.get('address')

    if (!tokenId || !userAddress) {
      return NextResponse.json(
        { success: false, error: 'Token ID and user address required' },
        { status: 400 }
      )
    }

    console.log('🔍 License Verify API: Checking license', { tokenId, userAddress })

    // Get the most recent active license for this user and token
    const { data: license, error } = await supabase
      .from('license_transactions')
      .select(`
        id,
        license_type,
        price_paid,
        periods,
        expires_at,
        created_at,
        transaction_hash
      `)
      .eq('token_id', parseInt(tokenId))
      .eq('licensee_address', userAddress.toLowerCase())
      .gte('expires_at', new Date().toISOString()) // Only active licenses
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const hasLicense = !error && license !== null
    const isExpired = !hasLicense || new Date(license.expires_at) <= new Date()

    console.log('✅ License Verify API: License check complete', { 
      tokenId, 
      userAddress, 
      hasLicense, 
      isExpired 
    })

    return NextResponse.json({
      success: true,
      hasLicense: hasLicense && !isExpired,
      isExpired,
      license: hasLicense ? {
        id: license.id,
        licenseType: license.license_type,
        expiresAt: license.expires_at,
        purchaseDate: license.created_at,
        transactionHash: license.transaction_hash,
        periods: license.periods
      } : null
    })

  } catch (error) {
    console.error('❌ License Verify API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify license' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    
    const { tokenIds, userAddress } = body

    if (!tokenIds || !Array.isArray(tokenIds) || !userAddress) {
      return NextResponse.json(
        { success: false, error: 'Token IDs array and user address required' },
        { status: 400 }
      )
    }

    console.log('🔍 License Batch Verify API: Checking multiple licenses', { 
      tokenCount: tokenIds.length, 
      userAddress 
    })

    // Get all active licenses for this user and the specified tokens
    const { data: licenses, error } = await supabase
      .from('license_transactions')
      .select(`
        token_id,
        license_type,
        expires_at,
        created_at
      `)
      .in('token_id', tokenIds.map(id => parseInt(id)))
      .eq('licensee_address', userAddress.toLowerCase())
      .gte('expires_at', new Date().toISOString()) // Only active licenses
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ License Batch Verify API: Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to verify licenses' },
        { status: 500 }
      )
    }

    // Group licenses by token ID (get the most recent for each token)
    const licenseMap = new Map()
    licenses?.forEach(license => {
      if (!licenseMap.has(license.token_id)) {
        licenseMap.set(license.token_id, license)
      }
    })

    // Create response object for each requested token
    const results = tokenIds.reduce((acc, tokenId) => {
      const license = licenseMap.get(parseInt(tokenId))
      const hasLicense = !!license
      const isExpired = !hasLicense || new Date(license.expires_at) <= new Date()
      
      acc[tokenId] = {
        hasLicense: hasLicense && !isExpired,
        isExpired,
        licenseType: license?.license_type || null,
        expiresAt: license?.expires_at || null
      }
      
      return acc
    }, {})

    console.log('✅ License Batch Verify API: Batch check complete', { 
      tokenCount: tokenIds.length,
      licensedCount: Object.values(results).filter((r: any) => r.hasLicense).length
    })

    return NextResponse.json({
      success: true,
      results
    })

  } catch (error) {
    console.error('❌ License Batch Verify API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify licenses' },
      { status: 500 }
    )
  }
}