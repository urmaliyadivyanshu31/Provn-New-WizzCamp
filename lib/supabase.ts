import { createClient } from '@/utils/supabase/client'

// Client-side Supabase client (for reading data)
export const supabase = createClient()

// Server-side Supabase admin client (for writing data)
// This will be used in API routes where we need admin privileges
export const createAdminClient = () => {
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { 
      auth: { persistSession: false }
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
