import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

// POST - Record a new tip
export async function POST(request: NextRequest) {
  try {
    const { creatorAddress, amount, message, timestamp, transactionHash, blockNumber, gasUsed } = await request.json()

    if (!creatorAddress || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid tip data' },
        { status: 400 }
      )
    }

    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)

    // Record the tip in the database
    const { data: tip, error } = await supabase
      .from('video_tips')
      .insert([{
        recipient_wallet: creatorAddress.toLowerCase(),
        amount: amount,
        message: message || null,
        transaction_hash: transactionHash || null,
        block_number: blockNumber || null,
        gas_used: gasUsed || null,
        tipped_at: timestamp || new Date().toISOString()
      }])

    if (error) {
      console.error('Error recording tip:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to record tip' },
        { status: 500 }
      )
    }

    // Update the creator's total tips count in profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', creatorAddress.toLowerCase())

    if (updateError) {
      console.error('Error updating creator profile:', updateError)
    }

    // Also update the platform_videos table to increment tips_count for all videos by this creator
    // This will help with analytics and stats
    // Note: We'll need to implement this via a database trigger or separate API call
    // For now, we'll just log that we need to update the video stats
    console.log(`💰 Tip recorded: ${amount} CAMP to ${creatorAddress}. Video stats update needed.`)

    return NextResponse.json({
      success: true,
      tip: {
        id: 'tip_' + Date.now(),
        amount,
        message,
        transactionHash,
        timestamp
      }
    })

  } catch (error) {
    console.error('Failed to record tip:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get tip history for a creator
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const creatorAddress = searchParams.get('creator')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!creatorAddress) {
      return NextResponse.json(
        { success: false, error: 'Creator address required' },
        { status: 400 }
      )
    }

    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)

    const { data: tips, error } = await supabase
      .from('video_tips')
      .select('*')
      .eq('recipient_wallet', creatorAddress.toLowerCase())
      .order('tipped_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching tips:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tips' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      tips: tips || [],
      hasMore: tips && tips.length === limit
    })

  } catch (error) {
    console.error('Failed to fetch tips:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}