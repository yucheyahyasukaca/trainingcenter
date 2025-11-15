import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { generateCompleteCertificate } from '@/lib/certificate-generator'

export const dynamic = 'force-dynamic'

interface Params {
  params: { slug: string }
}

export async function POST(_req: Request, { params }: Params) {
  try {
    const supabase = createServerClient()

    // Optional: require admin to run batch
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch webinar
    const { data: webinar, error: wErr } = await supabase
      .from('webinars')
      .select('id, title, start_time, end_time, certificate_template_id')
      .eq('slug', params.slug)
      .single()
    if (wErr || !webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    // Only allow after end time
    const now = new Date()
    if (new Date(webinar.end_time) > now) {
      return NextResponse.json({ error: 'Webinar belum selesai' }, { status: 400 })
    }

    if (!webinar.certificate_template_id) {
      return NextResponse.json({ error: 'Template sertifikat belum diatur' }, { status: 400 })
    }

    // Get registrations without certificate
    const { data: regs, error: rErr } = await supabase
      .from('webinar_registrations')
      .select('user_id')
      .eq('webinar_id', webinar.id)
    if (rErr) {
      return NextResponse.json({ error: rErr.message }, { status: 500 })
    }

    if (!regs || regs.length === 0) {
      return NextResponse.json({ issued: 0 })
    }

    // Load which already have certificates
    const { data: existing } = await supabase
      .from('webinar_certificates')
      .select('user_id')
      .eq('webinar_id', webinar.id)

    const existingSet = new Set((existing || []).map(e => e.user_id))
    const toIssue = regs.filter(r => !existingSet.has(r.user_id))

    // Fetch user profiles for names
    const userIds = toIssue.map(r => r.user_id)
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .in('id', userIds)

    const profileById = new Map((profiles || []).map(p => [p.id, p]))

    let issued = 0
    for (const reg of toIssue) {
      const profile = profileById.get(reg.user_id)
      const recipientName = profile?.full_name || 'Peserta'

      // Create a simple certificate number via RPC if available else fallback
      let certificateNumber = `WB-${new Date().toISOString().slice(0,10)}-${Math.random().toString(36).slice(2,8).toUpperCase()}`
      try {
        // Use existing function if present
        const { data: certNumData } = await supabase.rpc('generate_certificate_number')
        if (certNumData) certificateNumber = certNumData as string
      } catch {}

      try {
        const { pdfUrl, qrCodeUrl } = await generateCompleteCertificate(
          webinar.certificate_template_id,
          {
            certificate_number: certificateNumber,
            recipient_name: recipientName,
            program_title: webinar.title,
            completion_date: new Date(webinar.end_time).toISOString().slice(0,10),
            signatory_name: 'Panitia Webinar',
            signatory_position: 'Penyelenggara'
          }
        )

        await supabase
          .from('webinar_certificates')
          .insert({
            webinar_id: webinar.id,
            user_id: reg.user_id,
            certificate_number: certificateNumber,
            pdf_url: pdfUrl,
            qr_code_url: qrCodeUrl
          })

        issued += 1
      } catch (e) {
        // Continue next user
        // Optionally log
        console.error('Issue certificate failed', e)
      }
    }

    return NextResponse.json({ issued })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to issue certificates' }, { status: 500 })
  }
}


