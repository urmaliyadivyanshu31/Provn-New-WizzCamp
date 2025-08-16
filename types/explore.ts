export interface ExploreVideo {
  tokenId: string
  title: string
  description: string
  tags: string[]
  videoUrl: string
  thumbnailUrl?: string
  creator: {
    handle: string
    displayName: string
    avatarUrl?: string
    walletAddress: string
    followers: number
    joinedDate: string
  }
  ipInfo: {
    ipnftId: string
    status: 'verified' | 'pending'
    type: 'original' | 'derivative'
    mintDate: string
    parentId?: string
    platformOrigin?: boolean // true = uploaded via Provn platform, false = external blockchain video
  }
  licensing: {
    price: number // in wCAMP
    duration: number
    royalty: number
    paymentToken: string
  }
  metrics: {
    views: number
    likes: number
    tips: number
    shares: number
  }
  isLiked?: boolean
  hasAccess?: boolean
}

export interface VideoInteraction {
  type: 'like' | 'unlike' | 'view' | 'share' | 'tip'
  videoId: string
  userId?: string
  amount?: number
}

export interface LicenseTerms {
  price: bigint
  duration: number
  royaltyBps: number
  paymentToken: string
}

export interface ShareOptions {
  platform: 'twitter' | 'instagram'
  video: ExploreVideo
  customText?: string
}