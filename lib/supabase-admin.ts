import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

/**
 * Get Supabase admin client with service role key
 * This uses lazy initialization to avoid build errors when env vars are not available
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set')
    throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set')
    console.error('Please add SUPABASE_SERVICE_ROLE_KEY to your environment variables')
    throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY')
  }

  // Check if running in production
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    console.log('✓ Using Supabase admin client in production')
    console.log('✓ Supabase URL:', supabaseUrl)
    console.log('✓ Service role key:', supabaseKey.substring(0, 20) + '...')
  }

  return createClient<Database>(supabaseUrl, supabaseKey)
}

