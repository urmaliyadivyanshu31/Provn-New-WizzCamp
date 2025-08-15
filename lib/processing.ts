// Enhanced video processing utilities for Provn platform
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { db } from './database'
import { ipfsService, IPFSDirectoryStructure } from './ipfs'

// Set FFmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic)
}

export interface VideoFile {
  filepath: string
  originalName: string
  mimetype: string
  size: number
}

export interface ProcessingJob {
  id: string
  processingId: string
  userAddress: string
  jobType: 'upload' | 'derivative'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  currentStep: string
  progress: number
  steps: string[]
  metadata: any
  result?: ProcessingResult
  errorMessage?: string
}

export interface ProcessingResult {
  videoHash: string
  thumbnailHash: string
  duration: number
  resolution: string
  format: string
  fileSize: number
  perceptualHash: string
  hlsSegments: number
}

export interface VideoMetadata {
  title: string
  description: string
  tags: string[]
  allowRemixing: boolean
  creator: string
  parentTokenId?: string
}

export interface ThumbnailOptions {
  timestamp?: string // e.g., '00:00:05' for 5 seconds
  width?: number
  height?: number
  quality?: number
}

class VideoProcessingService {
  private tempDir: string
  private processedDir: string
  private maxFileSize: number
  private allowedFormats: string[]

  constructor() {
    this.tempDir = process.env.TEMP_UPLOAD_DIR || './uploads/temp'
    this.processedDir = process.env.PROCESSED_VIDEO_DIR || './uploads/processed'
    this.maxFileSize = parseInt(process.env.MAX_VIDEO_SIZE_MB || '100') * 1024 * 1024
    this.allowedFormats = (process.env.ALLOWED_VIDEO_FORMATS || 'mp4,mov,avi,mkv,webm').split(',')
    
    this.ensureDirectories()
  }

  private ensureDirectories(): void {
    [this.tempDir, this.processedDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
        console.log(`✅ Created directory: ${dir}`)
      }
    })
  }

  // Health check for video processing service
  async healthCheck(): Promise<{ status: string; ffmpeg: boolean; directories: boolean }> {
    try {
      // Check FFmpeg availability
      const ffmpegAvailable = await new Promise<boolean>((resolve) => {
        ffmpeg.getAvailableFormats((err) => {
          resolve(!err)
        })
      })

      // Check directories
      const directoriesExist = fs.existsSync(this.tempDir) && fs.existsSync(this.processedDir)

      return {
        status: ffmpegAvailable && directoriesExist ? 'healthy' : 'degraded',
        ffmpeg: ffmpegAvailable,
        directories: directoriesExist
      }
    } catch (error) {
      console.error('Video processing health check failed:', error)
      return {
        status: 'unhealthy',
        ffmpeg: false,
        directories: false
      }
    }
  }

  // Create a new processing job
  async createProcessingJob(
    userAddress: string,
    jobType: 'upload' | 'derivative',
    metadata: VideoMetadata
  ): Promise<ProcessingJob> {
    const processingId = this.generateProcessingId()
    const steps = jobType === 'upload' 
      ? ['validate', 'transcode', 'thumbnail', 'hash', 'upload_ipfs', 'mint_nft']
      : ['validate', 'analyze_parent', 'transcode', 'thumbnail', 'hash', 'upload_ipfs', 'mint_derivative']

    const job: ProcessingJob = {
      id: crypto.randomUUID(),
      processingId,
      userAddress,
      jobType,
      status: 'pending',
      currentStep: 'validate',
      progress: 0,
      steps,
      metadata
    }

    // Store in database
    await db.query(`
      INSERT INTO processing_jobs 
      (id, processing_id, user_address, job_type, status, current_step, progress, steps, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      job.id,
      job.processingId,
      job.userAddress,
      job.jobType,
      job.status,
      job.currentStep,
      job.progress,
      JSON.stringify(job.steps),
      JSON.stringify(job.metadata)
    ])

    console.log(`✅ Created processing job: ${processingId}`)
    return job
  }

  // Process uploaded video file
  async processVideo(
    videoFile: VideoFile,
    processingJob: ProcessingJob
  ): Promise<ProcessingResult> {
    try {
      await this.updateJobStatus(processingJob.processingId, 'processing', 'validate', 10)

      // Step 1: Validate video file
      await this.validateVideoFile(videoFile)
      await this.updateJobStatus(processingJob.processingId, 'processing', 'transcode', 20)

      // Step 2: Transcode to HLS format
      const hlsData = await this.transcodeToHLS(videoFile, processingJob.processingId)
      await this.updateJobStatus(processingJob.processingId, 'processing', 'thumbnail', 40)

      // Step 3: Generate thumbnail
      const thumbnailPath = await this.generateThumbnail(videoFile, processingJob.processingId)
      await this.updateJobStatus(processingJob.processingId, 'processing', 'hash', 60)

      // Step 4: Generate perceptual hash for duplicate detection
      const perceptualHash = await this.generatePerceptualHash(videoFile)
      await this.updateJobStatus(processingJob.processingId, 'processing', 'upload_ipfs', 80)

      // Step 5: Upload to IPFS
      const ipfsResult = await this.uploadToIPFS(hlsData, thumbnailPath, processingJob.metadata)
      await this.updateJobStatus(processingJob.processingId, 'processing', 'mint_nft', 90)

      // Step 6: Get video metadata
      const videoInfo = await this.getVideoInfo(videoFile)

      const result: ProcessingResult = {
        videoHash: ipfsResult.videoHash,
        thumbnailHash: ipfsResult.thumbnailHash,
        duration: videoInfo.duration,
        resolution: videoInfo.resolution,
        format: videoInfo.format,
        fileSize: videoFile.size,
        perceptualHash,
        hlsSegments: hlsData.segmentCount
      }

      await this.updateJobStatus(processingJob.processingId, 'completed', 'completed', 100, result)
      await this.cleanupTempFiles(processingJob.processingId)

      console.log(`✅ Video processing completed: ${processingJob.processingId}`)
      return result
    } catch (error) {
      console.error(`❌ Video processing failed: ${processingJob.processingId}`, error)
      await this.updateJobStatus(
        processingJob.processingId, 
        'failed', 
        'error', 
        0, 
        undefined, 
        error instanceof Error ? error.message : 'Unknown error'
      )
      throw error
    }
  }

  // Validate video file
  private async validateVideoFile(videoFile: VideoFile): Promise<void> {
    // Check file size
    if (videoFile.size > this.maxFileSize) {
      throw new Error(`File size exceeds limit of ${this.maxFileSize / (1024 * 1024)}MB`)
    }

    // Check file format
    const extension = path.extname(videoFile.originalName).toLowerCase().substring(1)
    if (!this.allowedFormats.includes(extension)) {
      throw new Error(`Unsupported format: ${extension}. Allowed: ${this.allowedFormats.join(', ')}`)
    }

    // Check if file exists and is readable
    if (!fs.existsSync(videoFile.filepath)) {
      throw new Error('Video file not found')
    }

    // Basic video validation using ffprobe
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoFile.filepath, (err, metadata) => {
        if (err) {
          reject(new Error(`Invalid video file: ${err.message}`))
        } else if (!metadata.streams.some(stream => stream.codec_type === 'video')) {
          reject(new Error('No video stream found in file'))
        } else {
          resolve()
        }
      })
    })
  }

  // Transcode video to HLS format
  private async transcodeToHLS(
    videoFile: VideoFile, 
    processingId: string
  ): Promise<{ playlistPath: string; segmentPaths: string[]; segmentCount: number }> {
    const outputDir = path.join(this.processedDir, processingId)
    fs.mkdirSync(outputDir, { recursive: true })

    const playlistPath = path.join(outputDir, 'video.m3u8')

    return new Promise((resolve, reject) => {
      const command = ffmpeg(videoFile.filepath)
        .output(playlistPath)
        .outputOptions([
          '-f hls',
          '-hls_time 10',
          '-hls_list_size 0',
          '-hls_segment_filename', path.join(outputDir, 'segment_%03d.ts'),
          '-c:v libx264',
          '-c:a aac',
          '-preset fast',
          '-crf 23',
          '-maxrate 1500k',
          '-bufsize 3000k',
          '-vf scale=-2:720' // Scale to 720p while maintaining aspect ratio
        ])

      command.on('end', () => {
        // Get list of generated segments
        const segmentFiles = fs.readdirSync(outputDir)
          .filter(file => file.endsWith('.ts'))
          .map(file => path.join(outputDir, file))

        resolve({
          playlistPath,
          segmentPaths: segmentFiles,
          segmentCount: segmentFiles.length
        })
      })

      command.on('error', (err) => {
        reject(new Error(`HLS transcoding failed: ${err.message}`))
      })

      command.run()
    })
  }

  // Generate video thumbnail
  private async generateThumbnail(
    videoFile: VideoFile,
    processingId: string,
    options: ThumbnailOptions = {}
  ): Promise<string> {
    const outputDir = path.join(this.processedDir, processingId)
    const thumbnailPath = path.join(outputDir, 'thumbnail.jpg')

    return new Promise((resolve, reject) => {
      ffmpeg(videoFile.filepath)
        .screenshots({
          timestamps: [options.timestamp || '00:00:05'],
          filename: 'thumbnail.jpg',
          folder: outputDir,
          size: `${options.width || 1280}x${options.height || 720}`
        })
        .on('end', async () => {
          try {
            // Optimize thumbnail with Sharp
            await sharp(thumbnailPath)
              .jpeg({ quality: options.quality || 85 })
              .toFile(thumbnailPath.replace('.jpg', '_optimized.jpg'))

            // Replace original with optimized version
            fs.renameSync(
              thumbnailPath.replace('.jpg', '_optimized.jpg'),
              thumbnailPath
            )

            resolve(thumbnailPath)
          } catch (error) {
            reject(new Error(`Thumbnail optimization failed: ${error}`))
          }
        })
        .on('error', (err) => {
          reject(new Error(`Thumbnail generation failed: ${err.message}`))
        })
    })
  }

  // Generate perceptual hash for duplicate detection
  private async generatePerceptualHash(videoFile: VideoFile): Promise<string> {
    // Generate a frame from the video for hashing
    const tempImagePath = path.join(this.tempDir, `frame_${Date.now()}.jpg`)

    return new Promise((resolve, reject) => {
      ffmpeg(videoFile.filepath)
        .screenshots({
          timestamps: ['00:00:03'],
          filename: path.basename(tempImagePath),
          folder: path.dirname(tempImagePath),
          size: '256x256'
        })
        .on('end', async () => {
          try {
            // Use Sharp to generate a simple hash
            const imageBuffer = await sharp(tempImagePath)
              .grayscale()
              .resize(8, 8, { fit: 'fill' })
              .raw()
              .toBuffer()

            // Create hash from pixel data
            const hash = crypto.createHash('md5').update(imageBuffer).digest('hex')
            
            // Cleanup temp file
            fs.unlinkSync(tempImagePath)
            
            resolve(hash)
          } catch (error) {
            reject(new Error(`Perceptual hash generation failed: ${error}`))
          }
        })
        .on('error', (err) => {
          reject(new Error(`Frame extraction failed: ${err.message}`))
        })
    })
  }

  // Upload processed content to IPFS
  private async uploadToIPFS(
    hlsData: { playlistPath: string; segmentPaths: string[] },
    thumbnailPath: string,
    metadata: VideoMetadata
  ): Promise<{ videoHash: string; thumbnailHash: string }> {
    // Create directory structure for IPFS
    const directoryStructure: IPFSDirectoryStructure = {
      'video.m3u8': fs.readFileSync(hlsData.playlistPath),
      'metadata.json': Buffer.from(JSON.stringify(metadata)),
      segments: {},
      thumbnail: fs.readFileSync(thumbnailPath)
    }

    // Add all segments
    hlsData.segmentPaths.forEach(segmentPath => {
      const segmentName = path.basename(segmentPath)
      directoryStructure.segments[segmentName] = fs.readFileSync(segmentPath)
    })

    // Upload to IPFS
    const uploadResult = await ipfsService.uploadDirectory(directoryStructure, {
      name: `video-${metadata.title}`,
      keyValues: {
        'content-type': 'video',
        'creator': metadata.creator,
        'title': metadata.title
      }
    })

    // Upload thumbnail separately for easier access
    const thumbnailResult = await ipfsService.uploadFile(thumbnailPath, {
      name: 'thumbnail.jpg',
      keyValues: {
        'content-type': 'image',
        'related-video': uploadResult.ipfsHash
      }
    })

    return {
      videoHash: uploadResult.ipfsHash,
      thumbnailHash: thumbnailResult.ipfsHash
    }
  }

  // Get video metadata using ffprobe
  private async getVideoInfo(videoFile: VideoFile): Promise<{
    duration: number
    resolution: string
    format: string
    bitrate: number
  }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoFile.filepath, (err, metadata) => {
        if (err) {
          reject(new Error(`Failed to get video info: ${err.message}`))
          return
        }

        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video')
        if (!videoStream) {
          reject(new Error('No video stream found'))
          return
        }

        resolve({
          duration: metadata.format.duration || 0,
          resolution: `${videoStream.width}x${videoStream.height}`,
          format: metadata.format.format_name || 'unknown',
          bitrate: metadata.format.bit_rate ? parseInt(metadata.format.bit_rate) : 0
        })
      })
    })
  }

  // Update job status in database
  async updateJobStatus(
    processingId: string,
    status: ProcessingJob['status'],
    currentStep: string,
    progress: number,
    result?: ProcessingResult,
    errorMessage?: string
  ): Promise<void> {
    try {
      await db.query(`
        UPDATE processing_jobs 
        SET status = $1, current_step = $2, progress = $3, result = $4, error_message = $5, updated_at = NOW()
        WHERE processing_id = $6
      `, [
        status,
        currentStep,
        progress,
        result ? JSON.stringify(result) : null,
        errorMessage,
        processingId
      ])
    } catch (error) {
      console.error('Failed to update job status:', error)
    }
  }

  // Get processing job status
  async getJobStatus(processingId: string): Promise<ProcessingJob | null> {
    try {
      const result = await db.query(`
        SELECT * FROM processing_jobs WHERE processing_id = $1
      `, [processingId])

      if (result.rows.length === 0) {
        return null
      }

      const row = result.rows[0]
      return {
        id: row.id,
        processingId: row.processing_id,
        userAddress: row.user_address,
        jobType: row.job_type,
        status: row.status,
        currentStep: row.current_step,
        progress: row.progress,
        steps: JSON.parse(row.steps),
        metadata: JSON.parse(row.metadata),
        result: row.result ? JSON.parse(row.result) : undefined,
        errorMessage: row.error_message
      }
    } catch (error) {
      console.error('Failed to get job status:', error)
      return null
    }
  }

  // Clean up temporary files
  private async cleanupTempFiles(processingId: string): Promise<void> {
    try {
      const outputDir = path.join(this.processedDir, processingId)
      if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true })
        console.log(`🧹 Cleaned up temp files for: ${processingId}`)
      }
    } catch (error) {
      console.error('Failed to cleanup temp files:', error)
    }
  }

  // Generate unique processing ID
  private generateProcessingId(): string {
    return `proc_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
  }

  // Validate if video is duplicate based on perceptual hash
  async checkForDuplicate(perceptualHash: string): Promise<{ isDuplicate: boolean; existingTokenId?: string }> {
    try {
      const result = await db.query(`
        SELECT token_id FROM videos WHERE perceptual_hash = $1 LIMIT 1
      `, [perceptualHash])

      return {
        isDuplicate: result.rows.length > 0,
        existingTokenId: result.rows[0]?.token_id
      }
    } catch (error) {
      console.error('Failed to check for duplicates:', error)
      return { isDuplicate: false }
    }
  }

  // Get supported video formats
  getSupportedFormats(): string[] {
    return this.allowedFormats
  }

  // Get max file size
  getMaxFileSize(): number {
    return this.maxFileSize
  }
}

// Export singleton instance
export const videoProcessingService = new VideoProcessingService()

// Export utility functions
export const processingUtils = {
  // Convert bytes to human readable format
  formatFileSize: (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  },

  // Format duration in seconds to human readable
  formatDuration: (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  },

  // Validate video file extension
  isValidVideoFile: (filename: string): boolean => {
    const extension = path.extname(filename).toLowerCase().substring(1)
    const allowedFormats = (process.env.ALLOWED_VIDEO_FORMATS || 'mp4,mov,avi,mkv,webm').split(',')
    return allowedFormats.includes(extension)
  },

  // Generate safe filename
  generateSafeFilename: (originalName: string): string => {
    const timestamp = Date.now()
    const ext = path.extname(originalName)
    const name = path.basename(originalName, ext)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50)
    
    return `${name}_${timestamp}${ext}`
  }
}
