import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token_id, license_synced, transaction_hash } = body

    if (!token_id) {
      return NextResponse.json(
        { success: false, error: 'token_id is required' },
        { status: 400 }
      )
    }

    // Update the platform_videos table with sync status
    const { data, error } = await supabase
      .from('platform_videos')
      .update({
        license_synced: license_synced ?? true,
        license_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('token_id', token_id)
      .select()

    if (error) {
      console.error('❌ Failed to update license sync status:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      )
    }

    console.log('✅ License sync status updated for token_id:', token_id)

    return NextResponse.json({
      success: true,
      video: data[0],
      transaction_hash
    })
  } catch (error) {
    console.error('❌ Error in sync-license-status API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
