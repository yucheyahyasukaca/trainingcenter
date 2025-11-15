import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
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

    return NextResponse.json({ webinars: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch webinars' }, { status: 500 })
  }
}


