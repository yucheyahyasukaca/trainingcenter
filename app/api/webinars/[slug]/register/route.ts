import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

interface Params {
  params: { slug: string }
}

export async function POST(_req: Request, { params }: Params) {
  try {
    const supabase = createServerClient()
    // Get user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find webinar
    const { data: webinar, error: wErr } = await supabase
      .from('webinars')
      .select('id, start_time, end_time')
      .eq('slug', params.slug)
      .single()
    if (wErr || !webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    // Insert registration (idempotent)
    const { error: regErr } = await supabase
      .from('webinar_registrations')
      .insert({ webinar_id: webinar.id, user_id: user.id })

    if (regErr && !regErr.message.includes('duplicate')) {
      return NextResponse.json({ error: regErr.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to register' }, { status: 500 })
  }
}


