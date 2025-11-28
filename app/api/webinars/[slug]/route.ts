import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

interface Params {
  params: { slug: string }
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const supabase = createServerClient()
    const { data: webinar, error } = await supabase
      .from('webinars')
      .select(`id, slug, title, description, hero_image_url, start_time, end_time, is_published, meeting_url, platform, location`)
      .eq('slug', params.slug)
      .single()

    if (error || !webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    const { data: speakers } = await supabase
      .from('webinar_speakers')
      .select('id, name, title, avatar_url, bio, sort_order')
      .eq('webinar_id', webinar.id)
      .order('sort_order', { ascending: true })

    const { data: recordings } = await supabase
      .from('webinar_recordings')
      .select('id, recording_url, is_public')
      .eq('webinar_id', webinar.id)
      .order('created_at', { ascending: false })

    // Get participant count (registered + uploaded)
    const [registeredCount, uploadedCount] = await Promise.all([
      supabase
        .from('webinar_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('webinar_id', webinar.id),
      supabase
        .from('webinar_participants')
        .select('*', { count: 'exact', head: true })
        .eq('webinar_id', webinar.id)
    ])
    const participantCount = (registeredCount.count || 0) + (uploadedCount.count || 0)

    return NextResponse.json({ 
      webinar, 
      speakers: speakers || [], 
      recordings: recordings || [],
      participantCount 
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch webinar' }, { status: 500 })
  }
}


