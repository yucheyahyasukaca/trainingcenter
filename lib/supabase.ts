import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:8000'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

// Debug logging
console.log('🔧 Supabase Config:')
console.log('URL:', supabaseUrl)
console.log('Anon Key exists:', !!supabaseAnonKey)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.log('Using fallback values for local development')
}

// Client for client-side usage with proper cookie handling for middleware
// Kunci (lock) sesi antar-tab. Bawaan supabase-js menunggu tanpa batas waktu: bila tab lain
// (atau proses yang macet) memegang kunci, SEMUA permintaan di tab ini ikut menggantung dan
// halaman berputar terus. Di sini menunggu maksimal 5 detik, lalu lanjut tanpa kunci.
const LOCK_WAIT_MS = 5000
const safeLock = async <R,>(name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
  if (typeof navigator === 'undefined' || !(navigator as any).locks) return fn()
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), LOCK_WAIT_MS)
  try {
    return await (navigator as any).locks.request(name, { signal: ctrl.signal }, async () => {
      clearTimeout(timer)
      return fn()
    })
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      console.warn('⚠️ Kunci sesi tidak tersedia, melanjutkan tanpa kunci:', name)
      return fn()
    }
    throw e
  } finally {
    clearTimeout(timer)
  }
}

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: { lock: safeLock },
})

// Server-side client with anon key for API routes (to work with RLS)
export const createServerClient = () => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Test connection
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('❌ Supabase connection error:', error)
  } else {
    console.log('✅ Supabase connected successfully')
  }
})

