// Mock database service for frontend development
// This allows the app to run without actual database setup

interface DatabaseConfig {
  host: string
  port: number
  database: string
  user: string
  password: string
  ssl?: boolean
}

interface QueryResult<T = any> {
  rows: T[]
  rowCount: number
  command: string
  oid: number
  fields: any[]
}

class MockDatabaseService {
  private isConnected: boolean = true

  constructor() {
    console.log('🔧 Using mock database service for frontend development')
    this.isConnected = true
  }

  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    console.log('🔧 Mock database query:', { text, params })
    
    // Return mock data based on query type
    if (text.includes('SELECT')) {
      return {
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      }
    }
    
    return {
      rows: [],
      rowCount: 0,
      command: 'INSERT',
      oid: 0,
      fields: []
    }
  }

  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    console.log('🔧 Mock database transaction')
    const mockClient = {
      query: async (text: string, params?: any[]) => {
        console.log('🔧 Mock transaction query:', { text, params })
        return { rows: [], rowCount: 0 }
      }
    }
    
    try {
      await callback(mockClient)
      return {} as T
    } catch (error) {
      throw error
    }
  }

  async connect() {
    console.log('🔧 Mock database connect')
    return {
      query: async (text: string, params?: any[]) => {
        console.log('🔧 Mock client query:', { text, params })
        return { rows: [], rowCount: 0 }
      },
      release: () => console.log('🔧 Mock client released')
    }
  }

  async end() {
    console.log('🔧 Mock database end')
  }
}

// Export mock database service
export const db = new MockDatabaseService()

// Export types for compatibility
export type { QueryResult, DatabaseConfig }
export { MockDatabaseService as DatabaseService }