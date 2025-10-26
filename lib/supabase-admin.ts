import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

/**
 * Get Supabase admin client with service role key
 * This uses lazy initialization to avoid build errors when env vars are not available
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing required Supabase environment variables')
  }

  return createClient<Database>(supabaseUrl, supabaseKey)
}

