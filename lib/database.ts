import { Pool, PoolClient, QueryResult } from 'pg'

interface DatabaseConfig {
  host: string
  port: number
  database: string
  user: string
  password: string
  ssl?: boolean
}

class DatabaseService {
  private pool: Pool
  private isConnected: boolean = false

  constructor() {
    const config: DatabaseConfig = {
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: process.env.DATABASE_NAME || 'provn',
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || '',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }

    // Use connection string if provided, otherwise use individual config
    if (process.env.DATABASE_URL) {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      })
    } else {
      this.pool = new Pool(config)
    }

    // Configure pool settings for production
    this.pool.on('connect', () => {
      console.log('✅ Database connected successfully')
      this.isConnected = true
    })

    this.pool.on('error', (err) => {
      console.error('❌ Database connection error:', err)
      this.isConnected = false
    })

    // Test connection on startup
    this.testConnection()
  }

  private async testConnection(): Promise<void> {
    try {
      const client = await this.pool.connect()
      await client.query('SELECT NOW()')
      client.release()
      this.isConnected = true
      console.log('✅ Database connection test successful')
    } catch (error) {
      console.error('❌ Database connection test failed:', error)
      this.isConnected = false
    }
  }

  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    if (!this.isConnected) {
      await this.testConnection()
      if (!this.isConnected) {
        throw new Error('Database connection failed')
      }
    }

    try {
      const start = Date.now()
      const result = await this.pool.query<T>(text, params)
      const duration = Date.now() - start
      
      if (process.env.LOG_LEVEL === 'debug') {
        console.log('🔍 Query executed:', { text, duration: `${duration}ms`, rows: result.rowCount })
      }
      
      return result
    } catch (error) {
      console.error('❌ Database query error:', error)
      throw error
    }
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect()
    
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async getClient(): Promise<PoolClient> {
    return await this.pool.connect()
  }

  async close(): Promise<void> {
    await this.pool.end()
    this.isConnected = false
    console.log('📤 Database connection closed')
  }

  get connected(): boolean {
    return this.isConnected
  }

  // Health check for monitoring
  async healthCheck(): Promise<{ status: string; timestamp: string; latency?: number }> {
    try {
      const start = Date.now()
      await this.query('SELECT 1')
      const latency = Date.now() - start
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        latency
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      }
    }
  }
}

// Export singleton instance
export const db = new DatabaseService()

// Export types for use in other modules
export type { DatabaseConfig, QueryResult, PoolClient }

// Utility functions for common operations
export const dbUtils = {
  // Safe query with error handling
  async safeQuery<T = any>(query: string, params?: any[]): Promise<T[] | null> {
    try {
      const result = await db.query<T>(query, params)
      return result.rows
    } catch (error) {
      console.error('Database query failed:', error)
      return null
    }
  },

  // Get single row
  async findOne<T = any>(query: string, params?: any[]): Promise<T | null> {
    try {
      const result = await db.query<T>(query, params)
      return result.rows[0] || null
    } catch (error) {
      console.error('Database findOne failed:', error)
      return null
    }
  },

  // Check if record exists
  async exists(table: string, condition: string, params: any[]): Promise<boolean> {
    try {
      const result = await db.query(
        `SELECT EXISTS(SELECT 1 FROM ${table} WHERE ${condition})`,
        params
      )
      return result.rows[0]?.exists || false
    } catch (error) {
      console.error('Database exists check failed:', error)
      return false
    }
  },

  // Insert with returning
  async insert<T = any>(table: string, data: Record<string, any>): Promise<T | null> {
    try {
      const keys = Object.keys(data)
      const values = Object.values(data)
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
      const columns = keys.join(', ')

      const query = `
        INSERT INTO ${table} (${columns}) 
        VALUES (${placeholders}) 
        RETURNING *
      `
      
      const result = await db.query<T>(query, values)
      return result.rows[0] || null
    } catch (error) {
      console.error('Database insert failed:', error)
      return null
    }
  },

  // Update with returning
  async update<T = any>(
    table: string, 
    data: Record<string, any>, 
    condition: string, 
    conditionParams: any[]
  ): Promise<T | null> {
    try {
      const keys = Object.keys(data)
      const values = Object.values(data)
      const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ')
      const conditionParamsAdjusted = conditionParams.map((_, i) => `$${values.length + i + 1}`)

      const query = `
        UPDATE ${table} 
        SET ${setClause}, updated_at = NOW() 
        WHERE ${condition.replace(/\$\d+/g, () => conditionParamsAdjusted.shift()!)}
        RETURNING *
      `
      
      const result = await db.query<T>(query, [...values, ...conditionParams])
      return result.rows[0] || null
    } catch (error) {
      console.error('Database update failed:', error)
      return null
    }
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('📤 Shutting down database connection...')
  await db.close()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('📤 Shutting down database connection...')
  await db.close()
  process.exit(0)
})