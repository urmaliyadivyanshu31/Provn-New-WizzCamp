// Enhanced Queue System for Provn Platform
// Handles video processing, IPFS uploads, and blockchain transactions

import Bull from 'bull'
import IORedis from 'ioredis'
import { ipfsService } from './ipfs'
import { blockchainService } from './blockchain'
import { db } from './database'
import { videoProcessingService } from './processing'

export interface VideoProcessingJob {
  id: string
  videoId: string
  filePath: string
  metadata: {
    title: string
    description: string
    tags: string[]
    creator: string
    allowRemixing: boolean
  }
  options: {
    mintNFT: boolean
    generateThumbnail: boolean
    createHLS: boolean
  }
}

export interface IPFSPinningJob {
  id: string
  videoId: string
  videoHash: string
  metadataHash: string
  thumbnailHash?: string
  segments?: string[]
}

export interface BlockchainMintJob {
  id: string
  videoId: string
  metadataHash: string
  creator: string
  royaltyPercentage: number
  licensePrice: string
}

export interface NotificationJob {
  id: string
  userId: string
  type: 'upload_complete' | 'mint_success' | 'tip_received' | 'license_purchased'
  data: any
}

class QueueService {
  private redis: IORedis
  private videoQueue: Bull.Queue<VideoProcessingJob>
  private ipfsQueue: Bull.Queue<IPFSPinningJob>
  private blockchainQueue: Bull.Queue<BlockchainMintJob>
  private notificationQueue: Bull.Queue<NotificationJob>
  private isConnected: boolean = false

  constructor() {
    this.initializeRedis()
    this.initializeQueues()
    this.setupEventHandlers()
  }

  private initializeRedis(): void {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    }

    try {
      this.redis = new IORedis(redisConfig)
      
      this.redis.on('connect', () => {
        console.log('✅ Redis connected for queue management')
        this.isConnected = true
      })

      this.redis.on('error', (error) => {
        console.error('❌ Redis connection error:', error)
        this.isConnected = false
      })
    } catch (error) {
      console.error('❌ Failed to initialize Redis:', error)
      this.isConnected = false
    }
  }

  private initializeQueues(): void {
    const queueConfig = {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined
      },
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    }

    try {
      this.videoQueue = new Bull<VideoProcessingJob>('video-processing', queueConfig)
      this.ipfsQueue = new Bull<IPFSPinningJob>('ipfs-pinning', queueConfig)
      this.blockchainQueue = new Bull<BlockchainMintJob>('blockchain-mint', queueConfig)
      this.notificationQueue = new Bull<NotificationJob>('notifications', queueConfig)

      console.log('✅ All queues initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize queues:', error)
    }
  }

  private setupEventHandlers(): void {
    // Video Processing Queue Events
    this.videoQueue.on('completed', (job) => {
      console.log(`✅ Video processing completed: ${job.id}`)
    })

    this.videoQueue.on('failed', (job, error) => {
      console.error(`❌ Video processing failed: ${job.id}`, error)
    })

    // IPFS Pinning Queue Events
    this.ipfsQueue.on('completed', (job) => {
      console.log(`✅ IPFS pinning completed: ${job.id}`)
    })

    this.ipfsQueue.on('failed', (job, error) => {
      console.error(`❌ IPFS pinning failed: ${job.id}`, error)
    })

    // Blockchain Queue Events
    this.blockchainQueue.on('completed', (job) => {
      console.log(`✅ Blockchain mint completed: ${job.id}`)
    })

    this.blockchainQueue.on('failed', (job, error) => {
      console.error(`❌ Blockchain mint failed: ${job.id}`, error)
    })
  }

  // Add video processing job
  async addVideoProcessingJob(
    jobData: VideoProcessingJob,
    priority: number = 0
  ): Promise<Bull.Job<VideoProcessingJob>> {
    try {
      const job = await this.videoQueue.add('process-video', jobData, {
        priority,
        delay: 0,
        attempts: 3,
        removeOnComplete: 10,
        removeOnFail: 5
      })

      console.log(`📝 Video processing job added: ${job.id}`)
      return job
    } catch (error) {
      console.error('❌ Failed to add video processing job:', error)
      throw new Error(`Queue job creation failed: ${error}`)
    }
  }

  // Add IPFS pinning job
  async addIPFSPinningJob(
    jobData: IPFSPinningJob,
    priority: number = 0
  ): Promise<Bull.Job<IPFSPinningJob>> {
    try {
      const job = await this.ipfsQueue.add('pin-to-ipfs', jobData, {
        priority,
        delay: 0,
        attempts: 5, // More retries for IPFS
        removeOnComplete: 10,
        removeOnFail: 5
      })

      console.log(`📝 IPFS pinning job added: ${job.id}`)
      return job
    } catch (error) {
      console.error('❌ Failed to add IPFS pinning job:', error)
      throw new Error(`IPFS queue job creation failed: ${error}`)
    }
  }

  // Add blockchain minting job
  async addBlockchainMintJob(
    jobData: BlockchainMintJob,
    priority: number = 0
  ): Promise<Bull.Job<BlockchainMintJob>> {
    try {
      const job = await this.blockchainQueue.add('mint-ipnft', jobData, {
        priority,
        delay: 0,
        attempts: 3,
        removeOnComplete: 10,
        removeOnFail: 5
      })

      console.log(`📝 Blockchain mint job added: ${job.id}`)
      return job
    } catch (error) {
      console.error('❌ Failed to add blockchain mint job:', error)
      throw new Error(`Blockchain queue job creation failed: ${error}`)
    }
  }

  // Add notification job
  async addNotificationJob(
    jobData: NotificationJob,
    delay: number = 0
  ): Promise<Bull.Job<NotificationJob>> {
    try {
      const job = await this.notificationQueue.add('send-notification', jobData, {
        delay,
        attempts: 2,
        removeOnComplete: 50,
        removeOnFail: 10
      })

      console.log(`📝 Notification job added: ${job.id}`)
      return job
    } catch (error) {
      console.error('❌ Failed to add notification job:', error)
      throw new Error(`Notification queue job creation failed: ${error}`)
    }
  }

  // Process video processing jobs
  async processVideoJobs(): Promise<void> {
    this.videoQueue.process('process-video', 2, async (job) => {
      const { id, videoId, filePath, metadata, options } = job.data

      try {
        // Update job progress
        await job.progress(10)
        
        // Validate and transcode video
        await videoProcessingService.updateJobStatus(id, 'processing', 'transcoding', 20)
        const processedVideo = await videoProcessingService.processVideo(filePath, {
          generateThumbnail: options.generateThumbnail,
          createHLS: options.createHLS
        })
        
        await job.progress(50)

        // Upload to IPFS if processing successful
        if (processedVideo) {
          await this.addIPFSPinningJob({
            id: `ipfs-${id}`,
            videoId,
            videoHash: processedVideo.hlsPath || processedVideo.outputPath,
            metadataHash: '', // Will be set after metadata upload
            thumbnailHash: processedVideo.thumbnailPath
          })
        }

        await job.progress(80)
        
        // Update database
        await db.query(
          'UPDATE videos SET processing_status = $1, processed_at = NOW() WHERE id = $2',
          ['processed', videoId]
        )

        await job.progress(100)
        return { success: true, processedVideo }

      } catch (error) {
        console.error(`❌ Video processing job ${id} failed:`, error)
        await videoProcessingService.updateJobStatus(id, 'failed', 'error', 0)
        throw error
      }
    })
  }

  // Process IPFS pinning jobs
  async processIPFSJobs(): Promise<void> {
    this.ipfsQueue.process('pin-to-ipfs', 3, async (job) => {
      const { id, videoId, videoHash, thumbnailHash } = job.data

      try {
        await job.progress(20)

        // Pin video files to IPFS
        const videoPinResult = await ipfsService.pinContent(videoHash, `video-${videoId}`)
        
        await job.progress(50)

        // Pin thumbnail if exists
        let thumbnailPinResult = true
        if (thumbnailHash) {
          thumbnailPinResult = await ipfsService.pinContent(thumbnailHash, `thumbnail-${videoId}`)
        }

        await job.progress(80)

        if (videoPinResult && thumbnailPinResult) {
          // Update database with IPFS hashes
          await db.query(
            'UPDATE videos SET ipfs_hash = $1, thumbnail_ipfs_hash = $2 WHERE id = $3',
            [videoHash, thumbnailHash, videoId]
          )

          await job.progress(100)
          return { success: true, videoHash, thumbnailHash }
        } else {
          throw new Error('IPFS pinning failed')
        }

      } catch (error) {
        console.error(`❌ IPFS pinning job ${id} failed:`, error)
        throw error
      }
    })
  }

  // Process blockchain minting jobs
  async processBlockchainJobs(): Promise<void> {
    this.blockchainQueue.process('mint-ipnft', 1, async (job) => { // Sequential processing
      const { id, videoId, metadataHash, creator, royaltyPercentage, licensePrice } = job.data

      try {
        await job.progress(20)

        // Mint IpNFT on blockchain
        const mintResult = await blockchainService.mintIpNFT({
          metadataHash,
          creator,
          royaltyPercentage
        })

        await job.progress(70)

        if (mintResult.success) {
          // Update database with blockchain data
          await db.query(`
            UPDATE videos 
            SET token_id = $1, contract_address = $2, transaction_hash = $3, 
                block_number = $4, minted_at = NOW() 
            WHERE id = $5
          `, [
            mintResult.tokenId,
            mintResult.contractAddress,
            mintResult.transactionHash,
            mintResult.blockNumber,
            videoId
          ])

          // Add notification job
          await this.addNotificationJob({
            id: `notification-${id}`,
            userId: creator,
            type: 'mint_success',
            data: {
              videoId,
              tokenId: mintResult.tokenId,
              transactionHash: mintResult.transactionHash
            }
          })

          await job.progress(100)
          return { success: true, mintResult }
        } else {
          throw new Error('Blockchain minting failed')
        }

      } catch (error) {
        console.error(`❌ Blockchain mint job ${id} failed:`, error)
        throw error
      }
    })
  }

  // Process notification jobs
  async processNotificationJobs(): Promise<void> {
    this.notificationQueue.process('send-notification', 5, async (job) => {
      const { id, userId, type, data } = job.data

      try {
        // Mock notification system - replace with actual implementation
        console.log(`📧 Sending ${type} notification to ${userId}:`, data)
        
        // Here you would integrate with:
        // - Push notification service
        // - Email service
        // - In-app notification system
        
        return { success: true, notificationId: id }

      } catch (error) {
        console.error(`❌ Notification job ${id} failed:`, error)
        throw error
      }
    })
  }

  // Get job status
  async getJobStatus(queueName: string, jobId: string): Promise<any> {
    try {
      let queue: Bull.Queue
      
      switch (queueName) {
        case 'video':
          queue = this.videoQueue
          break
        case 'ipfs':
          queue = this.ipfsQueue
          break
        case 'blockchain':
          queue = this.blockchainQueue
          break
        case 'notification':
          queue = this.notificationQueue
          break
        default:
          throw new Error(`Unknown queue: ${queueName}`)
      }

      const job = await queue.getJob(jobId)
      if (!job) {
        return { error: 'Job not found' }
      }

      return {
        id: job.id,
        status: await job.getState(),
        progress: job.progress(),
        data: job.data,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason
      }
    } catch (error) {
      console.error(`❌ Failed to get job status:`, error)
      return { error: error.message }
    }
  }

  // Get queue stats
  async getQueueStats(): Promise<any> {
    try {
      const stats = {
        video: await this.videoQueue.getJobCounts(),
        ipfs: await this.ipfsQueue.getJobCounts(),
        blockchain: await this.blockchainQueue.getJobCounts(),
        notification: await this.notificationQueue.getJobCounts()
      }

      return {
        connected: this.isConnected,
        queues: stats
      }
    } catch (error) {
      console.error(`❌ Failed to get queue stats:`, error)
      return { error: error.message }
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; queues: any; redis: boolean }> {
    try {
      const stats = await this.getQueueStats()
      
      return {
        status: this.isConnected ? 'healthy' : 'degraded',
        queues: stats.queues || {},
        redis: this.isConnected
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        queues: {},
        redis: false
      }
    }
  }

  // Cleanup and close connections
  async close(): Promise<void> {
    try {
      await this.videoQueue.close()
      await this.ipfsQueue.close()
      await this.blockchainQueue.close()
      await this.notificationQueue.close()
      await this.redis.disconnect()
      
      console.log('📤 Queue service closed successfully')
    } catch (error) {
      console.error('❌ Error closing queue service:', error)
    }
  }
}

// Export singleton instance
export const queueService = new QueueService()

// Initialize job processors
export const initializeQueueProcessors = async (): Promise<void> => {
  try {
    await queueService.processVideoJobs()
    await queueService.processIPFSJobs()
    await queueService.processBlockchainJobs()
    await queueService.processNotificationJobs()
    
    console.log('✅ All queue processors initialized')
  } catch (error) {
    console.error('❌ Failed to initialize queue processors:', error)
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('📤 Shutting down queue service...')
  await queueService.close()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('📤 Shutting down queue service...')
  await queueService.close()
  process.exit(0)
})