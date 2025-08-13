"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProvnButton } from "@/components/provn/button"
import { ProvnCard, ProvnCardContent } from "@/components/provn/card"
import { ProvnBadge } from "@/components/provn/badge"
import { Navigation } from "@/components/provn/navigation"

interface ProfileData {
  address: string
  handle?: string
  avatar?: string
  bio?: string
  joinedDate: string
  isVerified: boolean
  totalEarnings: number
  totalViews: number
  totalVideos: number
  totalTips: number
  totalLicenses: number
  followers: number
  following: number
}

interface VideoData {
  id: string
  title: string
  thumbnail: string
  views: number
  tips: number
  licenses: number
  createdAt: string
  isDerivative: boolean
  parentId?: string
}


export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"videos" | "derivatives" | "analytics">("videos")
  const [isFollowing, setIsFollowing] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [videos, setVideos] = useState<VideoData[]>([])
  const [isOwnProfile, setIsOwnProfile] = useState(false)

  const handle = params.handle as string

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // First try to fetch by handle, then by address if handle fails
        let profileResponse
        try {
          profileResponse = await fetch(`/api/users/${handle}/profile`)
        } catch (error) {
          // If handle doesn't work, try as address
          profileResponse = await fetch(`/api/users/${handle}/profile`)
        }

        if (!profileResponse.ok) {
          setProfile(null)
          return
        }

        const profileData = await profileResponse.json()
        
        // Convert API response to ProfileData interface
        const transformedProfile: ProfileData = {
          address: profileData.address,
          handle: profileData.handle,
          avatar: profileData.avatar,
          bio: profileData.bio,
          joinedDate: profileData.joinedDate,
          isVerified: profileData.isVerified,
          totalEarnings: profileData.stats.totalEarnings,
          totalViews: profileData.stats.totalViews,
          totalVideos: profileData.stats.totalVideos,
          totalTips: profileData.stats.totalTips,
          totalLicenses: profileData.stats.totalLicenses,
          followers: profileData.stats.followers,
          following: profileData.stats.following,
        }

        setProfile(transformedProfile)

        // Fetch user's videos
        const videosResponse = await fetch(`/api/videos?creator=${handle}&includeDerivatives=true&limit=50`)
        if (videosResponse.ok) {
          const videosData = await videosResponse.json()
          
          // Transform video data to match our VideoData interface
          const transformedVideos: VideoData[] = videosData.videos.map((video: any) => ({
            id: video.id,
            title: video.title,
            thumbnail: video.thumbnailUrl,
            views: video.stats.views,
            tips: video.stats.tips,
            licenses: video.licensing.available ? 1 : 0, // Simplified for now
            createdAt: video.createdAt,
            isDerivative: !video.ipnft.isOriginal,
            parentId: video.ipnft.parentId,
          }))

          setVideos(transformedVideos)
        }

        // Check if this is the current user's profile
        // In real app, would get this from wallet connection context
        const currentUserAddress = "0x1234567890abcdef1234567890abcdef12345678" // Mock current user
        setIsOwnProfile(profileData.address.toLowerCase() === currentUserAddress.toLowerCase())
      } catch (error) {
        console.error("Failed to fetch profile data:", error)
        setProfile(null)
      }
    }

    fetchProfileData()
  }, [handle])

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
    // In real app, would make API call to follow/unfollow
  }

  const originalVideos = videos.filter((v) => !v.isDerivative)
  const derivativeVideos = videos.filter((v) => v.isDerivative)

  if (!profile) {
    return (
      <div className="min-h-screen bg-provn-bg">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="font-headline text-2xl font-bold text-provn-text mb-4">Profile Not Found</h1>
            <p className="text-provn-muted mb-6">The profile you're looking for doesn't exist.</p>
            <ProvnButton onClick={() => router.push("/")}>Go Home</ProvnButton>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-provn-bg">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Profile Header */}
          <ProvnCard>
            <ProvnCardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-provn-surface-2 rounded-full overflow-hidden">
                    <img
                      src={profile.avatar || "/placeholder.svg?height=96&width=96&query=profile avatar"}
                      alt={profile.handle || "Profile"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h1 className="font-headline text-2xl font-bold text-provn-text">
                          {profile.handle ? `@${profile.handle}` : formatAddress(profile.address)}
                        </h1>
                        {profile.isVerified && (
                          <ProvnBadge variant="verified" className="text-sm">
                            Verified
                          </ProvnBadge>
                        )}
                      </div>
                      <p className="text-provn-muted text-sm mb-2">{formatAddress(profile.address)}</p>
                      {profile.bio && <p className="text-provn-text leading-relaxed mb-4">{profile.bio}</p>}
                      <p className="text-provn-muted text-sm">
                        Joined{" "}
                        {new Date(profile.joinedDate).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      {isOwnProfile ? (
                        <ProvnButton variant="secondary" onClick={() => router.push("/dashboard")}>
                          Edit Profile
                        </ProvnButton>
                      ) : (
                        <>
                          <ProvnButton variant="secondary" onClick={handleFollow}>
                            {isFollowing ? "Following" : "Follow"}
                          </ProvnButton>
                          <ProvnButton>Send Tip</ProvnButton>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6 pt-6 border-t border-provn-border">
                <div className="text-center">
                  <div className="text-xl font-headline font-bold text-provn-text">{profile.totalVideos}</div>
                  <div className="text-provn-muted text-sm">Videos</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-headline font-bold text-provn-text">
                    {profile.totalViews.toLocaleString()}
                  </div>
                  <div className="text-provn-muted text-sm">Views</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-headline font-bold text-provn-text">
                    {profile.totalEarnings.toFixed(1)}
                  </div>
                  <div className="text-provn-muted text-sm">wCAMP</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-headline font-bold text-provn-text">{profile.totalLicenses}</div>
                  <div className="text-provn-muted text-sm">Licenses</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-headline font-bold text-provn-text">
                    {profile.followers.toLocaleString()}
                  </div>
                  <div className="text-provn-muted text-sm">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-headline font-bold text-provn-text">{profile.following}</div>
                  <div className="text-provn-muted text-sm">Following</div>
                </div>
              </div>
            </ProvnCardContent>
          </ProvnCard>

          {/* Tabs */}
          <div className="border-b border-provn-border">
            <nav className="flex gap-8">
              {[
                { id: "videos", label: `Original Videos (${originalVideos.length})` },
                { id: "derivatives", label: `Derivatives (${derivativeVideos.length})` },
                { id: "analytics", label: "Analytics" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 px-1 border-b-2 font-headline font-medium transition-colors ${
                    activeTab === tab.id
                      ? "border-provn-accent text-provn-accent"
                      : "border-transparent text-provn-muted hover:text-provn-text"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="py-6">
            {activeTab === "videos" && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {originalVideos.map((video) => (
                  <ProvnCard
                    key={video.id}
                    className="cursor-pointer hover:ring-2 hover:ring-provn-accent transition-all"
                    onClick={() => router.push(`/video/${video.id}`)}
                  >
                    <div className="aspect-[9/16] bg-provn-surface-2 relative overflow-hidden">
                      <img
                        src={video.thumbnail || "/placeholder.svg"}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2">
                        <ProvnBadge className="text-xs bg-black/50 text-white">
                          {video.views.toLocaleString()} views
                        </ProvnBadge>
                      </div>
                      <div className="absolute top-2 right-2">
                        <ProvnBadge variant="verified" className="text-xs">
                          Original
                        </ProvnBadge>
                      </div>
                    </div>
                    <ProvnCardContent className="p-4">
                      <h3 className="font-medium text-provn-text mb-2 truncate">{video.title}</h3>
                      <div className="flex justify-between text-sm text-provn-muted">
                        <span>{video.tips} tips</span>
                        <span>{video.licenses} licenses</span>
                      </div>
                      <p className="text-xs text-provn-muted mt-1">{new Date(video.createdAt).toLocaleDateString()}</p>
                    </ProvnCardContent>
                  </ProvnCard>
                ))}
              </div>
            )}

            {activeTab === "derivatives" && (
              <div className="space-y-6">
                {derivativeVideos.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {derivativeVideos.map((video) => (
                      <ProvnCard
                        key={video.id}
                        className="cursor-pointer hover:ring-2 hover:ring-provn-accent transition-all"
                        onClick={() => router.push(`/video/${video.id}`)}
                      >
                        <div className="aspect-[9/16] bg-provn-surface-2 relative overflow-hidden">
                          <img
                            src={video.thumbnail || "/placeholder.svg"}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-2 left-2">
                            <ProvnBadge className="text-xs bg-black/50 text-white">
                              {video.views.toLocaleString()} views
                            </ProvnBadge>
                          </div>
                          <div className="absolute top-2 right-2">
                            <ProvnBadge className="text-xs bg-purple-600 text-white">Derivative</ProvnBadge>
                          </div>
                        </div>
                        <ProvnCardContent className="p-4">
                          <h3 className="font-medium text-provn-text mb-2 truncate">{video.title}</h3>
                          <div className="flex justify-between text-sm text-provn-muted mb-1">
                            <span>{video.tips} tips</span>
                            <span>{video.licenses} licenses</span>
                          </div>
                          {video.parentId && (
                            <p className="text-xs text-provn-muted">
                              Derived from{" "}
                              <a href={`/video/${video.parentId}`} className="text-provn-accent hover:underline">
                                Video #{video.parentId}
                              </a>
                            </p>
                          )}
                          <p className="text-xs text-provn-muted mt-1">
                            {new Date(video.createdAt).toLocaleDateString()}
                          </p>
                        </ProvnCardContent>
                      </ProvnCard>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-provn-surface-2 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🎭</span>
                    </div>
                    <h3 className="font-headline text-lg font-semibold text-provn-text mb-2">No Derivatives Yet</h3>
                    <p className="text-provn-muted">This creator hasn't created any derivative works.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="space-y-8">
                {/* Performance Overview */}
                <div className="grid md:grid-cols-2 gap-6">
                  <ProvnCard>
                    <ProvnCardContent className="p-6">
                      <h3 className="font-headline text-lg font-semibold text-provn-text mb-4">Content Performance</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-provn-muted">Average Views per Video</span>
                          <span className="text-provn-text font-medium">
                            {Math.round(profile.totalViews / profile.totalVideos).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-provn-muted">Tips per Video</span>
                          <span className="text-provn-text font-medium">
                            {Math.round(profile.totalTips / profile.totalVideos)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-provn-muted">License Conversion Rate</span>
                          <span className="text-provn-text font-medium">
                            {((profile.totalLicenses / profile.totalViews) * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-provn-muted">Earnings per Video</span>
                          <span className="text-provn-text font-medium">
                            {(profile.totalEarnings / profile.totalVideos).toFixed(1)} wCAMP
                          </span>
                        </div>
                      </div>
                    </ProvnCardContent>
                  </ProvnCard>

                  <ProvnCard>
                    <ProvnCardContent className="p-6">
                      <h3 className="font-headline text-lg font-semibold text-provn-text mb-4">Revenue Breakdown</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-provn-muted">Tips Revenue</span>
                          <span className="text-provn-success font-medium">
                            {(profile.totalTips * 2.5).toFixed(1)} wCAMP
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-provn-muted">License Revenue (70%)</span>
                          <span className="text-provn-accent font-medium">
                            {(profile.totalLicenses * 7).toFixed(1)} wCAMP
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-provn-muted">Derivative Royalties (30%)</span>
                          <span className="text-purple-400 font-medium">
                            {(profile.totalEarnings - profile.totalTips * 2.5 - profile.totalLicenses * 7).toFixed(1)}{" "}
                            wCAMP
                          </span>
                        </div>
                        <div className="border-t border-provn-border pt-2">
                          <div className="flex justify-between font-semibold">
                            <span className="text-provn-text">Total Earnings</span>
                            <span className="text-provn-text">{profile.totalEarnings.toFixed(1)} wCAMP</span>
                          </div>
                        </div>
                      </div>
                    </ProvnCardContent>
                  </ProvnCard>
                </div>

                {/* Top Performing Content */}
                <ProvnCard>
                  <ProvnCardContent className="p-6">
                    <h3 className="font-headline text-lg font-semibold text-provn-text mb-4">Top Performing Videos</h3>
                    <div className="space-y-3">
                      {videos
                        .sort((a, b) => b.views - a.views)
                        .slice(0, 5)
                        .map((video, index) => (
                          <div
                            key={video.id}
                            className="flex items-center justify-between p-3 bg-provn-surface-2 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-provn-accent rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <div className="text-provn-text font-medium">{video.title}</div>
                                <div className="text-provn-muted text-sm">
                                  {video.isDerivative ? "Derivative" : "Original"} •{" "}
                                  {new Date(video.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-provn-text font-medium">{video.views.toLocaleString()} views</div>
                              <div className="text-provn-muted text-sm">
                                {video.tips} tips • {video.licenses} licenses
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </ProvnCardContent>
                </ProvnCard>

                {/* Growth Metrics */}
                <div className="grid md:grid-cols-3 gap-6">
                  <ProvnCard>
                    <ProvnCardContent className="p-6 text-center">
                      <div className="text-2xl font-headline font-bold text-green-400 mb-1">+12.5%</div>
                      <div className="text-provn-muted text-sm">Views Growth (30d)</div>
                    </ProvnCardContent>
                  </ProvnCard>
                  <ProvnCard>
                    <ProvnCardContent className="p-6 text-center">
                      <div className="text-2xl font-headline font-bold text-provn-accent mb-1">+8.3%</div>
                      <div className="text-provn-muted text-sm">Earnings Growth (30d)</div>
                    </ProvnCardContent>
                  </ProvnCard>
                  <ProvnCard>
                    <ProvnCardContent className="p-6 text-center">
                      <div className="text-2xl font-headline font-bold text-blue-400 mb-1">+15.7%</div>
                      <div className="text-provn-muted text-sm">Follower Growth (30d)</div>
                    </ProvnCardContent>
                  </ProvnCard>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
