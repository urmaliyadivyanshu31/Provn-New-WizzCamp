import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!address) {
      return NextResponse.json({ error: "Address parameter is required" }, { status: 400 })
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: "Invalid address format" }, { status: 400 })
    }

    // Check if profile exists
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('wallet_address', address.toLowerCase())
      .single()

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }
      console.error('Error checking profile:', profileError)
      return NextResponse.json({ error: 'Failed to check profile' }, { status: 500 })
    }

    // For now, return empty videos array since we're not linking videos to profiles yet
    // This will be updated when the video system is integrated
    const videos: any[] = []

    return NextResponse.json({
      videos,
      count: videos.length,
      profile: {
        id: profile.id,
        address: address.toLowerCase()
      }
    })
  } catch (error) {
    console.error("Videos fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 })
  }
}