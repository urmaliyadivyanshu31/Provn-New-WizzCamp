import { createClient } from '@/utils/supabase/client'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Client-side Supabase client (for reading data)
export const supabase = createClient()

// Server-side Supabase admin client (for writing data)
// This will be used in API routes where we need admin privileges
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  console.log('🔍 Supabase Admin Client Config:', {
    hasUrl: !!supabaseUrl,
    urlSuffix: supabaseUrl?.slice(-10),
    hasServiceKey: !!serviceRoleKey,
    serviceKeyPrefix: serviceRoleKey?.slice(0, 20) + '...',
    environment: process.env.NODE_ENV
  })
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase environment variables:', {
      NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: !!serviceRoleKey
    })
    throw new Error('Missing required Supabase environment variables')
  }
  
  return createSupabaseClient(
    supabaseUrl,
    serviceRoleKey,
    { 
      auth: { 
        persistSession: false,
        autoRefreshToken: false
      },
      db: {
        schema: 'public'
      }
    }
  )
}

// Database types for profiles
export interface Profile {
  id: string
  wallet_address: string
  handle: string
  display_name?: string
  bio?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface CreateProfileData {
  handle: string
  display_name?: string
  bio?: string
  avatar_url?: string
}
