// Queue status and management endpoint for Provn platform
import { NextRequest, NextResponse } from 'next/server'
import { queueService } from '@/lib/queue'
import { authService } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queueName = searchParams.get('queue') // video, ipfs, blockchain, notification
    const jobId = searchParams.get('jobId')

    // Get overall queue statistics
    if (!queueName && !jobId) {
      const stats = await queueService.getQueueStats()
      
      return NextResponse.json({
        success: true,
        data: {
          timestamp: new Date().toISOString(),
          queues: stats
        }
      })
    }

    // Get specific job status
    if (queueName && jobId) {
      const jobStatus = await queueService.getJobStatus(queueName, jobId)
      
      return NextResponse.json({
        success: true,
        data: jobStatus
      })
    }

    // Get queue-specific stats
    if (queueName) {
      const stats = await queueService.getQueueStats()
      
      if (!stats.queues || !stats.queues[queueName]) {
        return NextResponse.json(
          { error: `Queue '${queueName}' not found` },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          queue: queueName,
          stats: stats.queues[queueName],
          timestamp: new Date().toISOString()
        }
      })
    }

    return NextResponse.json(
      { error: 'Invalid parameters' },
      { status: 400 }
    )

  } catch (error) {
    console.error('❌ Queue status check failed:', error)
    
    return NextResponse.json(
      {
        error: 'Queue status check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST endpoint for admin queue management (if needed)
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const authResult = await authService.verifyToken(token)
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    // For now, only allow queue status checks
    // Future: Add admin operations like pausing queues, clearing failed jobs, etc.
    
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'health_check':
        const health = await queueService.healthCheck()
        return NextResponse.json({
          success: true,
          data: health
        })

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ Queue management failed:', error)
    
    return NextResponse.json(
      {
        error: 'Queue management failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}