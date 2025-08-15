// Streaming endpoint for Provn platform - serves HLS content via CDN
import { NextRequest, NextResponse } from 'next/server'
import { cdnService, streamingUtils } from '@/lib/cdn'
import { ipfsService } from '@/lib/ipfs'
import { db } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await params
    const { searchParams } = new URL(request.url)
    const quality = searchParams.get('quality') || 'auto'
    const fileName = searchParams.get('file') || 'playlist.m3u8'

    // Validate IPFS hash
    if (!hash || !ipfsService.isValidIPFSHash(hash)) {
      return NextResponse.json(
        { error: 'Invalid IPFS hash' },
        { status: 400 }
      )
    }

    // Check if content exists in database
    const videoResult = await db.query(
      'SELECT * FROM videos WHERE ipfs_hash = $1',
      [hash]
    )

    if (videoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    const video = videoResult.rows[0]

    // Check if video processing is complete
    if (video.processing_status !== 'completed') {
      return NextResponse.json(
        { error: 'Content not ready for streaming', status: video.processing_status },
        { status: 400 }
      )
    }

    // Handle different file types
    if (fileName === 'playlist.m3u8') {
      // Generate HLS playlist
      return await generateHLSPlaylist(hash, quality, video)
    }

    if (fileName.endsWith('.m3u8')) {
      // Quality-specific playlist
      return await generateQualityPlaylist(hash, quality, fileName, video)
    }

    if (fileName.endsWith('.ts') || fileName.endsWith('.mp4')) {
      // Video segment or full file
      return await serveVideoSegment(hash, fileName, request)
    }

    // Default: serve raw IPFS content
    return await serveIPFSContent(hash, fileName, request)

  } catch (error) {
    console.error('❌ Streaming request failed:', error)
    
    return NextResponse.json(
      {
        error: 'Streaming failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Generate master HLS playlist
async function generateHLSPlaylist(
  hash: string,
  quality: string,
  video: any
): Promise<NextResponse> {
  try {
    const stream = await cdnService.getVideoStream(video.id, hash)
    
    if (!stream) {
      return NextResponse.json(
        { error: 'Stream generation failed' },
        { status: 500 }
      )
    }

    // Generate master playlist content
    const playlist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=1000000,RESOLUTION=640x360,CODECS="avc1.64001e,mp4a.40.2"
360p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1500000,RESOLUTION=854x480,CODECS="avc1.64001f,mp4a.40.2"
480p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720,CODECS="avc1.640020,mp4a.40.2"
720p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"
1080p/playlist.m3u8
`

    return new NextResponse(playlist, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Length',
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Source': 'provn-cdn'
      }
    })

  } catch (error) {
    console.error('❌ HLS playlist generation failed:', error)
    throw error
  }
}

// Generate quality-specific playlist
async function generateQualityPlaylist(
  hash: string,
  quality: string,
  fileName: string,
  video: any
): Promise<NextResponse> {
  try {
    // Extract quality from filename (e.g., "360p/playlist.m3u8")
    const qualityMatch = fileName.match(/(\d+p)\//)
    const requestedQuality = qualityMatch ? qualityMatch[1] : quality

    // Generate segment list for this quality
    const segmentDuration = 10 // 10 seconds per segment
    const totalDuration = video.duration || 30
    const numSegments = Math.ceil(totalDuration / segmentDuration)

    let playlist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:${segmentDuration}
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD
`

    // Add segments
    for (let i = 0; i < numSegments; i++) {
      const segmentDuration = i === numSegments - 1 ? 
        totalDuration - (i * segmentDuration) : 
        segmentDuration

      playlist += `#EXTINF:${segmentDuration.toFixed(3)},\n`
      playlist += `segment_${i.toString().padStart(3, '0')}.ts\n`
    }

    playlist += '#EXT-X-ENDLIST\n'

    return new NextResponse(playlist, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Cache-Control': 'public, max-age=3600',
        'X-Quality': requestedQuality,
        'X-Segments': numSegments.toString()
      }
    })

  } catch (error) {
    console.error('❌ Quality playlist generation failed:', error)
    throw error
  }
}

// Serve video segment
async function serveVideoSegment(
  hash: string,
  fileName: string,
  request: NextRequest
): Promise<NextResponse> {
  try {
    // In a real implementation, this would:
    // 1. Check if the segment is cached locally
    // 2. If not, fetch from IPFS and transcode on-the-fly
    // 3. Cache the result for future requests
    
    // For now, redirect to IPFS gateway
    const ipfsUrl = cdnService.getOptimizedIPFSUrl(hash, fileName)
    
    // Get range header for partial content support
    const range = request.headers.get('range')
    
    if (range) {
      // Handle range requests for video seeking
      return NextResponse.redirect(ipfsUrl, 206)
    }

    return NextResponse.redirect(ipfsUrl)

  } catch (error) {
    console.error('❌ Video segment serving failed:', error)
    throw error
  }
}

// Serve raw IPFS content
async function serveIPFSContent(
  hash: string,
  fileName: string,
  request: NextRequest
): Promise<NextResponse> {
  try {
    const cdnResponse = await cdnService.getIPFSContent(hash, fileName)
    
    if (!cdnResponse.success) {
      return NextResponse.json(
        { error: cdnResponse.error },
        { status: 404 }
      )
    }

    // Redirect to optimized IPFS URL
    const ipfsUrl = cdnService.getOptimizedIPFSUrl(hash, fileName)
    
    return NextResponse.redirect(ipfsUrl, {
      headers: {
        'X-Cache-Status': cdnResponse.cached ? 'HIT' : 'MISS',
        'X-IPFS-Hash': hash,
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    console.error('❌ IPFS content serving failed:', error)
    throw error
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Length',
      'Access-Control-Max-Age': '86400'
    }
  })
}