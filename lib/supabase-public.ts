import { createClient } from '@supabase/supabase-js'

// Klien Supabase untuk membaca data publik di server (ISR). Memakai kunci anon,
// jadi aturan RLS tetap berlaku sama seperti di peramban. Tanpa cookie/sesi.
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
