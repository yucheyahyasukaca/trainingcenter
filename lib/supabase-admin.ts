import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

/**
 * Get Supabase admin client with service role key
 * This uses lazy initialization to avoid build errors when env vars are not available
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('🔧 Admin Client Config:')
  console.log('  URL:', supabaseUrl)
  console.log('  Service Key exists:', !!supabaseKey)
  console.log('  Service Key length:', supabaseKey?.length || 0)
  console.log('  Service Key preview:', supabaseKey?.substring(0, 30) + '...')

  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set')
    throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set')
    console.error('Please add SUPABASE_SERVICE_ROLE_KEY to your environment variables')
    throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

