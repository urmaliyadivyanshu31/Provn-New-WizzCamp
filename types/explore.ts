import { RemixingConfiguration } from './remixing'

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
    transactionHash?: string // Blockchain transaction hash for the IP-NFT minting
  }
  licensing: {
    price: number // in wCAMP
    duration: number
    royalty: number
    paymentToken: string
  }
  remixing: RemixingConfiguration
  metrics: {
    views: number
    likes: number
    tips: number
    shares: number
    remixes?: number
  }
  isLiked?: boolean
  hasAccess?: boolean
  canRemix?: boolean
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