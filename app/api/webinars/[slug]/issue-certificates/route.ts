import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ slug: string }> | { slug: string }
}

export async function POST(request: Request, { params }: Params) {
  try {
    // Resolve params (Next.js 14+ uses async params)
    const resolvedParams = await Promise.resolve(params)
    const slug = resolvedParams.slug
    
    console.log('=== Issue Certificates API Called ===')
    console.log('Slug:', slug)
    console.log('URL:', request.url)
    
    if (!slug) {
      console.error('Missing slug parameter')
      return NextResponse.json({ 
        error: 'Bad Request',
        details: 'Webinar slug is required'
      }, { status: 400 })
    }
    
    const supabaseAdmin = getSupabaseAdmin()
    
    // Get authorization header for admin check
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie')
    
    console.log('Auth check:', {
      hasAuthHeader: !!authHeader,
      hasCookie: !!cookieHeader
    })

    // Fetch webinar
    console.log('Fetching webinar with slug:', slug)
    const { data: webinar, error: wErr } = await supabaseAdmin
      .from('webinars')
      .select('id, title, start_time, end_time, certificate_template_id, slug')
      .eq('slug', slug)
      .single()
      
    if (wErr) {
      console.error('Webinar query error:', {
        error: wErr.message,
        code: wErr.code,
        details: wErr.details,
        hint: wErr.hint
      })
      return NextResponse.json({ 
        error: 'Webinar not found',
        details: wErr.message
      }, { status: 404 })
    }
    
    if (!webinar) {
      console.error('Webinar not found for slug:', slug)
      return NextResponse.json({ 
        error: 'Webinar not found',
        details: `No webinar found with slug: ${slug}`
      }, { status: 404 })
    }
    
    console.log('Webinar found:', {
      id: webinar.id,
      title: webinar.title,
      end_time: webinar.end_time,
      hasTemplate: !!webinar.certificate_template_id
    })

    // Validate template first (most common issue)
    if (!webinar.certificate_template_id) {
      console.error('Template not set for webinar:', webinar.id)
      return NextResponse.json({ 
        error: 'Template sertifikat belum diatur',
        details: 'Pilih template sertifikat terlebih dahulu di halaman pengaturan sertifikat. Klik "Simpan Template" setelah memilih template.'
      }, { status: 400 })
    }
    
    console.log('Template ID:', webinar.certificate_template_id)
    
    // Only allow after end time
    const now = new Date()
    const endTime = new Date(webinar.end_time)
    console.log('Time check:', {
      now: now.toISOString(),
      endTime: endTime.toISOString(),
      isAfterEnd: now > endTime
    })
    
    if (endTime > now) {
      console.warn('Webinar not finished yet')
      return NextResponse.json({ 
        error: 'Webinar belum selesai',
        details: `Webinar akan berakhir pada ${endTime.toLocaleString('id-ID', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        })}. Sertifikat hanya dapat diterbitkan setelah webinar selesai.`
      }, { status: 400 })
    }

    async function generateCertificateNumberValue() {
      try {
        const { data: certNumData } = await supabaseAdmin.rpc('generate_certificate_number')
        if (certNumData) return certNumData as string
      } catch {
        console.log('RPC generate_certificate_number not available, using fallback')
      }
      return `WB-${randomUUID()}`
    }

    async function insertCertificateWithRetry(payload: any) {
      const maxAttempts = 5
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const certificateNumber = await generateCertificateNumberValue()
        const finalPayload = {
          ...payload,
          certificate_number: certificateNumber
        }
        const { error: insertError } = await supabaseAdmin
          .from('webinar_certificates')
          .insert(finalPayload)

        if (!insertError) {
          return certificateNumber
        }

        if (insertError?.code === '23505') {
          const match = insertError.message.match(/Key \\(([^)]+)\\)=\\(([^)]+)\\)/)
          const existingNumber = match?.[2]
          if (existingNumber) {
            const { data: existingCertificate } = await supabaseAdmin
              .from('webinar_certificates')
              .select('id')
              .eq('certificate_number', existingNumber)
              .single()

            if (!existingCertificate) {
              console.warn('Duplicate number not found in table, resetting cache and retrying...')
              await supabaseAdmin.rpc('invalidate_schema_cache')
            }
          }

          console.warn('Duplicate certificate number, retrying...', { attempt: attempt + 1 })
          continue
        }

        throw new Error(`Database insert failed: ${insertError.message}`)
      }

      throw new Error('Gagal membuat nomor sertifikat unik setelah beberapa percobaan')
    }

    // Get registered participants (with user account) without certificate
    const { data: regs, error: rErr } = await supabaseAdmin
      .from('webinar_registrations')
      .select('user_id')
      .eq('webinar_id', webinar.id)
    if (rErr) {
      console.error('Error fetching registrations:', rErr)
      return NextResponse.json({ 
        error: 'Gagal mengambil data peserta',
        details: rErr.message 
      }, { status: 500 })
    }

    // Get uploaded participants (without user account) without certificate
    const { data: participants, error: pErr } = await supabaseAdmin
      .from('webinar_participants')
      .select('id, full_name, unit_kerja, email')
      .eq('webinar_id', webinar.id)
    if (pErr) {
      console.error('Error fetching participants:', pErr)
      return NextResponse.json({ 
        error: 'Gagal mengambil data peserta',
        details: pErr.message 
      }, { status: 500 })
    }

    // Load which already have certificates
    const { data: existing } = await supabaseAdmin
      .from('webinar_certificates')
      .select('user_id, participant_id')
      .eq('webinar_id', webinar.id)

    const existingUserIds = new Set((existing || []).filter(e => e.user_id).map(e => e.user_id))
    const existingParticipantIds = new Set((existing || []).filter(e => e.participant_id).map(e => e.participant_id))

    const toIssueUsers = (regs || []).filter(r => !existingUserIds.has(r.user_id))
    const toIssueParticipants = (participants || []).filter(p => !existingParticipantIds.has(p.id))

    if (toIssueUsers.length === 0 && toIssueParticipants.length === 0) {
      return NextResponse.json({ issued: 0 })
    }

    // Fetch user profiles for registered participants
    const userIds = toIssueUsers.map(r => r.user_id)
    let profiles: any[] = []
    if (userIds.length > 0) {
      const { data: profilesData } = await supabaseAdmin
        .from('user_profiles')
        .select('id, full_name, email')
        .in('id', userIds)
      profiles = profilesData || []
    }

    const profileById = new Map((profiles || []).map(p => [p.id, p]))

    let issued = 0
    let failed = 0
    const errors: string[] = []

    // Issue certificates for registered participants (with user account)
    for (const reg of toIssueUsers) {
      const profile = profileById.get(reg.user_id)
      const recipientName = profile?.full_name || 'Peserta'

      try {
        const certificateNumber = await insertCertificateWithRetry({
          webinar_id: webinar.id,
          user_id: reg.user_id,
          participant_id: null,
          pdf_url: null,
          qr_code_url: null,
          issued_at: new Date().toISOString()
        })

        issued += 1
      } catch (e: any) {
        failed += 1
        const errorMsg = `Gagal untuk ${recipientName}: ${e?.message || 'Unknown error'}`
        console.error('Issue certificate failed for user:', errorMsg, e)
        errors.push(errorMsg)
      }
    }

    // Issue certificates for uploaded participants (without user account)
    for (const participant of toIssueParticipants) {
      const recipientName = participant.full_name || 'Peserta'

      try {
        const certificateNumber = await insertCertificateWithRetry({
          webinar_id: webinar.id,
          user_id: null,
          participant_id: participant.id,
          pdf_url: null,
          qr_code_url: null,
          issued_at: new Date().toISOString()
        })

        issued += 1
      } catch (e: any) {
        failed += 1
        const errorMsg = `Gagal untuk ${recipientName}: ${e?.message || 'Unknown error'}`
        console.error('Issue certificate failed for participant:', errorMsg, e)
        errors.push(errorMsg)
      }
    }

    // Return result with success and error counts
    return NextResponse.json({ 
      issued,
      failed,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (err: any) {
    console.error('Error issuing certificates:', err)
    const errorMessage = err?.message || 'Failed to issue certificates'
    const errorDetails = err?.stack || undefined
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    }, { status: 500 })
  }
}


