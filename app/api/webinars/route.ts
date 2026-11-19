import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// Daftar webinar publik sama untuk semua orang: simpan 60 detik di memori agar
// tidak membebani database setiap kali halaman dibuka.
const CACHE_MS = 60_000
let cache: { at: number; body: any } | null = null
const CACHE_HEADERS = { 'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=300' }

export async function GET() {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return NextResponse.json(cache.body, { headers: CACHE_HEADERS })
  }
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('webinars')
      .select(`
        id, slug, title, description, hero_image_url, start_time, end_time, is_published
      `)
      .eq('is_published', true)
      .order('start_time', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const body = { webinars: data || [] }
    cache = { at: Date.now(), body }
    return NextResponse.json(body, { headers: CACHE_HEADERS })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch webinars' }, { status: 500 })
  }
}


