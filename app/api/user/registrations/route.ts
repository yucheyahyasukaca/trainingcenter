import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const webinarId = searchParams.get('webinarId')
    if (!webinarId) return NextResponse.json({ error: 'webinarId required' }, { status: 400 })

    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ registered: false })

    const { data } = await supabase
      .from('webinar_registrations')
      .select('id')
      .eq('webinar_id', webinarId)
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({ registered: !!data })
  } catch {
    return NextResponse.json({ registered: false })
  }
}


