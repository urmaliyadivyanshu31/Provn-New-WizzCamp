type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG'

const LOG_LEVELS: Record<LogLevel, number> = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
}

class Logger {
  private logLevel: LogLevel
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    this.logLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || 
                   (this.isDevelopment ? 'INFO' : 'ERROR')
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.logLevel]
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] ${level}:`
    return data ? `${prefix} ${message} ${JSON.stringify(data)}` : `${prefix} ${message}`
  }

  error(message: string, data?: any) {
    if (this.shouldLog('ERROR')) {
      console.error(this.formatMessage('ERROR', message, data))
    }
  }

  warn(message: string, data?: any) {
    if (this.shouldLog('WARN')) {
      console.warn(this.formatMessage('WARN', message, data))
    }
  }

  info(message: string, data?: any) {
    if (this.shouldLog('INFO')) {
      console.info(this.formatMessage('INFO', message, data))
    }
  }

  debug(message: string, data?: any) {
    if (this.shouldLog('DEBUG')) {
      console.log(this.formatMessage('DEBUG', message, data))
    }
  }

  // Legacy emoji-based debug methods for gradual migration
  debugProfile(message: string, data?: any) {
    if (this.shouldLog('DEBUG')) {
      console.log(`🔍 ${message}`, data)
    }
  }

  debugApi(message: string, data?: any) {
    if (this.shouldLog('DEBUG')) {
      console.log(`🔧 ${message}`, data)
    }
  }

  debugVideo(message: string, data?: any) {
    if (this.shouldLog('DEBUG')) {
      console.log(`🎥 ${message}`, data)
    }
  }

  success(message: string, data?: any) {
    if (this.shouldLog('INFO')) {
      console.log(`✅ ${message}`, data)
    }
  }

  // Performance tracking methods
  time(label: string): void {
    if (this.shouldLog('DEBUG') && typeof window !== 'undefined') {
      performance.mark(`${label}-start`)
    }
  }

  timeEnd(label: string): void {
    if (this.shouldLog('DEBUG') && typeof window !== 'undefined') {
      try {
        performance.mark(`${label}-end`)
        performance.measure(label, `${label}-start`, `${label}-end`)
        const measure = performance.getEntriesByName(label)[0]
        this.debug(`⏱️ ${label}: ${measure.duration.toFixed(2)}ms`)
        
        // Clean up marks to prevent memory leaks
        performance.clearMarks(`${label}-start`)
        performance.clearMarks(`${label}-end`)
        performance.clearMeasures(label)
      } catch (e) {
        // Silently fail if performance API isn't available
      }
    }
  }

  // Group methods for organized logging
  group(label: string): void {
    if (this.shouldLog('DEBUG')) {
      console.group(label)
    }
  }

  groupEnd(): void {
    if (this.shouldLog('DEBUG')) {
      console.groupEnd()
    }
  }
}

export const logger = new Logger()

// Performance tracking utilities
export const perf = {
  start: (label: string) => logger.time(label),
  end: (label: string) => logger.timeEnd(label)
}