import { createAdminClient } from '@/lib/supabase'
import { HomePageClient } from './client-page'

async function getPlatformStats() {
  try {
    const supabase = createAdminClient()
    
    // Fetch statistics in parallel for better performance
    const [
      creatorsResult,
      videosResult
    ] = await Promise.allSettled([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).not('wallet_address', 'is', null),
      supabase.from('platform_videos').select('*', { count: 'exact', head: true }).eq('upload_status', 'ready').eq('visibility', 'public')
    ])

    const totalCreators = creatorsResult.status === 'fulfilled' ? Math.max(creatorsResult.value.count || 0, 0) : 120
    const totalVideos = videosResult.status === 'fulfilled' ? Math.max(videosResult.value.count || 0, 0) : 2200

    return {
      totalCreators,
      totalVideos,
      lastUpdated: new Date().toISOString()
    }
  } catch (error) {
    console.error('Server-side platform stats error:', error)
    // Return fallback stats
    return {
      totalCreators: 120,
      totalVideos: 2200,
      lastUpdated: new Date().toISOString()
    }
  }
}

export default async function HomePage() {
  // Fetch platform stats server-side for instant loading
  const platformStats = await getPlatformStats()
  
  // Pass the data to the client component
  return <HomePageClient platformStats={platformStats} />
}