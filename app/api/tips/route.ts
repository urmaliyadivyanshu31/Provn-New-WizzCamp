import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for demo (use database in production)
const tips = new Map<string, Array<{
  id: string
  creatorAddress: string
  amount: number
  message?: string
  timestamp: string
  senderAddress?: string
}>>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { creatorAddress, amount, message, timestamp } = body
    const senderAddress = request.headers.get('x-wallet-address')

    if (!creatorAddress || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Creator address and valid amount required' },
        { status: 400 }
      )
    }

    console.log('💰 Tips API: Recording tip', { creatorAddress, amount, senderAddress })

    const tipId = `tip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const newTip = {
      id: tipId,
      creatorAddress,
      amount,
      message: message || '',
      timestamp: timestamp || new Date().toISOString(),
      senderAddress: senderAddress || undefined
    }

    // Store tip
    if (!tips.has(creatorAddress)) {
      tips.set(creatorAddress, [])
    }
    tips.get(creatorAddress)!.push(newTip)

    console.log('💰 Tips API: Tip recorded successfully', { tipId })

    // In production, save to database
    // await db.tips.create({
    //   data: {
    //     id: tipId,
    //     creatorAddress,
    //     senderAddress,
    //     amount,
    //     message,
    //     timestamp: new Date(timestamp),
    //     transactionHash: '', // Would be populated after blockchain confirmation
    //     status: 'pending'
    //   }
    // })

    return NextResponse.json({
      success: true,
      tipId,
      message: 'Tip recorded successfully'
    })

  } catch (error) {
    console.error('❌ Tips API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record tip' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const creatorAddress = searchParams.get('creator')
    const senderAddress = searchParams.get('sender')

    if (creatorAddress) {
      // Get tips for a specific creator
      const creatorTips = tips.get(creatorAddress) || []
      const totalTips = creatorTips.reduce((sum, tip) => sum + tip.amount, 0)
      
      return NextResponse.json({
        success: true,
        tips: creatorTips,
        totalAmount: totalTips,
        count: creatorTips.length
      })
    }

    if (senderAddress) {
      // Get tips sent by a specific user
      const userTips = []
      for (const [creator, creatorTips] of tips.entries()) {
        const userCreatorTips = creatorTips.filter(tip => tip.senderAddress === senderAddress)
        userTips.push(...userCreatorTips)
      }
      
      const totalSent = userTips.reduce((sum, tip) => sum + tip.amount, 0)
      
      return NextResponse.json({
        success: true,
        tips: userTips,
        totalAmount: totalSent,
        count: userTips.length
      })
    }

    // Get all tips
    const allTips = []
    for (const [creator, creatorTips] of tips.entries()) {
      allTips.push(...creatorTips)
    }

    return NextResponse.json({
      success: true,
      tips: allTips.slice(-50), // Return last 50 tips
      count: allTips.length
    })

  } catch (error) {
    console.error('❌ Tips API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tips' },
      { status: 500 }
    )
  }
}