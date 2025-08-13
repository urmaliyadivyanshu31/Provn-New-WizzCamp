import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const creator = searchParams.get("creator")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")
    const includeDerivatives = searchParams.get("includeDerivatives") === "true"

    // Mock videos data - in real app would fetch from database
    const mockVideos = [
      {
        id: "1",
        title: "Creative Dance Routine",
        description: "Original choreography inspired by street dance culture. Protected on-chain for IP rights. This routine combines elements from various dance styles including breakdancing, popping, and locking.",
        creator: {
          address: "0x1234567890abcdef1234567890abcdef12345678",
          handle: "dancemaster",
          avatar: "/dance-creator-avatar.png",
          verified: true,
          followers: 12500,
          joinedDate: "2024-01-15",
        },
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        thumbnailUrl: "/short-form-video.png?height=200&width=112&query=dance routine",
        tags: ["dance", "original", "street", "choreography", "breakdancing"],
        stats: { views: 12500, likes: 890, tips: 45 },
        ipnft: {
          id: "ipnft_001",
          verified: true,
          isOriginal: true,
          mintDate: "2024-02-01",
          blockscoutUrl: "https://explorer.basecamp.network/token/0x123.../instance/1",
        },
        licensing: { available: true, price: 10, currency: "wCAMP" },
        isPromoted: true,
        createdAt: "2024-01-15T00:00:00Z",
        status: "minted",
      },
      {
        id: "2",
        title: "Digital Art Process",
        description: "Time-lapse of creating digital artwork. Each frame is an NFT. Watch as I build this piece layer by layer using digital painting techniques.",
        creator: {
          address: "0x9876543210abcdef9876543210abcdef98765432",
          handle: "artcreator",
          avatar: "/digital-artist-avatar.png",
          verified: true,
          followers: 8200,
          joinedDate: "2023-11-20",
        },
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        thumbnailUrl: "/short-form-video.png?height=200&width=112&query=art tutorial",
        tags: ["art", "digital", "process", "timelapse", "nft"],
        stats: { views: 8200, likes: 654, tips: 23 },
        ipnft: {
          id: "ipnft_002",
          verified: true,
          isOriginal: true,
          mintDate: "2024-01-20",
          blockscoutUrl: "https://explorer.basecamp.network/token/0x456.../instance/2",
        },
        licensing: { available: true, price: 10, currency: "wCAMP" },
        createdAt: "2024-01-12T00:00:00Z",
        status: "minted",
      },
      {
        id: "3",
        title: "Music Production Behind the Scenes",
        description: "Creating beats in my home studio. Original composition protected on BaseCAMP. This is a derivative work based on the dance routine above.",
        creator: {
          address: "0x5555777755557777555577775555777755557777",
          handle: "beatmaker",
          avatar: "/music-producer-avatar.png",
          verified: false,
          followers: 15600,
          joinedDate: "2024-03-10",
        },
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        thumbnailUrl: "/short-form-video.png?height=200&width=112&query=music production",
        tags: ["music", "production", "beats", "derivative", "studio"],
        stats: { views: 15600, likes: 1200, tips: 67 },
        ipnft: {
          id: "ipnft_003",
          verified: true,
          isOriginal: false,
          parentId: "ipnft_001",
          mintDate: "2024-03-15",
          blockscoutUrl: "https://explorer.basecamp.network/token/0x789.../instance/3",
        },
        licensing: { available: true, price: 10, currency: "wCAMP" },
        createdAt: "2024-01-10T00:00:00Z",
        status: "minted",
      },
      {
        id: "4",
        title: "Cooking Experiment",
        description: "Experimental fusion cooking combining molecular gastronomy with traditional techniques. Each step is documented for educational purposes.",
        creator: {
          address: "0x1234567890abcdef1234567890abcdef12345678",
          handle: "dancemaster",
          avatar: "/dance-creator-avatar.png",
          verified: true,
          followers: 12500,
          joinedDate: "2024-01-15",
        },
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
        thumbnailUrl: "/short-form-video.png?height=200&width=112&query=cooking video",
        tags: ["cooking", "experimental", "fusion", "education"],
        stats: { views: 2100, likes: 342, tips: 42 },
        ipnft: {
          id: "ipnft_004",
          verified: true,
          isOriginal: true,
          mintDate: "2024-01-10",
          blockscoutUrl: "https://explorer.basecamp.network/token/0x321.../instance/4",
        },
        licensing: { available: true, price: 10, currency: "wCAMP" },
        createdAt: "2024-01-10T00:00:00Z",
        status: "minted",
      },
      {
        id: "5",
        title: "Music Production Tips",
        description: "Latest track in progress - sharing my production process and techniques for creating electronic music.",
        creator: {
          address: "0x1234567890abcdef1234567890abcdef12345678",
          handle: "dancemaster",
          avatar: "/dance-creator-avatar.png",
          verified: true,
          followers: 12500,
          joinedDate: "2024-01-15",
        },
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        thumbnailUrl: "/short-form-video.png?height=200&width=112&query=music production",
        tags: ["music", "production", "electronic", "tutorial"],
        stats: { views: 0, likes: 0, tips: 0 },
        ipnft: {
          id: "ipnft_005",
          verified: false,
          isOriginal: true,
          mintDate: "2024-01-16",
          blockscoutUrl: "https://explorer.basecamp.network/token/0x654.../instance/5",
        },
        licensing: { available: false, price: 0, currency: "wCAMP" },
        createdAt: "2024-01-16T00:00:00Z",
        status: "processing",
      },
    ]

    let filteredVideos = mockVideos

    // Filter by creator if specified
    if (creator) {
      filteredVideos = filteredVideos.filter(
        video => video.creator.address.toLowerCase() === creator.toLowerCase() || 
        video.creator.handle.toLowerCase() === creator.toLowerCase()
      )
    }

    // Filter derivatives if not requested
    if (!includeDerivatives) {
      filteredVideos = filteredVideos.filter(video => video.ipnft.isOriginal)
    }

    // Apply pagination
    const paginatedVideos = filteredVideos.slice(offset, offset + limit)

    return NextResponse.json({
      videos: paginatedVideos,
      total: filteredVideos.length,
      hasMore: offset + limit < filteredVideos.length,
      pagination: {
        offset,
        limit,
        total: filteredVideos.length,
      },
    })
  } catch (error) {
    console.error("Get videos error:", error)
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 })
  }
}