import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// POST /api/webinar-certificates/search - Search webinar participants (with or without certificates)
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const { webinar_id, participant_name } = body

    if (!webinar_id) {
      return NextResponse.json({ error: 'Webinar ID is required' }, { status: 400 })
    }

    if (!participant_name || participant_name.trim().length === 0) {
      return NextResponse.json({ error: 'Participant name is required' }, { status: 400 })
    }

    const searchName = participant_name.trim().toLowerCase()

    // 1. Search registered participants (from webinar_registrations)
    const { data: registrations, error: regError } = await supabaseAdmin
      .from('webinar_registrations')
      .select(`
        user_id,
        registered_at,
        webinars:webinar_id (
          id,
          title,
          slug,
          start_time,
          end_time
        )
      `)
      .eq('webinar_id', webinar_id)

    if (regError) {
      console.error('Error searching registrations:', regError)
    }

    // Get user profiles for registered participants
    const registeredUserIds = (registrations || []).map((r: any) => r.user_id).filter(Boolean)
    const registeredProfilesMap = new Map<string, any>()
    if (registeredUserIds.length > 0) {
      const { data: userProfiles } = await supabaseAdmin
        .from('user_profiles')
        .select('id, full_name, email')
        .in('id', registeredUserIds)

      if (userProfiles) {
        for (const profile of userProfiles) {
          registeredProfilesMap.set(profile.id, profile)
        }
      }
    }

    // 2. Search uploaded participants (from webinar_participants)
    const { data: uploadedParticipants, error: partError } = await supabaseAdmin
      .from('webinar_participants')
      .select(`
        id,
        full_name,
        unit_kerja,
        email,
        created_at
      `)
      .eq('webinar_id', webinar_id)

    if (partError) {
      console.error('Error searching participants:', partError)
    }

    // 3. Get existing certificates to check which participants already have certificates
    const { data: existingCertificates } = await supabaseAdmin
      .from('webinar_certificates')
      .select('user_id, participant_id, certificate_number, issued_at')
      .eq('webinar_id', webinar_id)

    const certificatesByUserId = new Map<string, any>()
    const certificatesByParticipantId = new Map<string, any>()
    if (existingCertificates) {
      for (const cert of existingCertificates) {
        if (cert.user_id) {
          certificatesByUserId.set(cert.user_id, cert)
        }
        if (cert.participant_id) {
          certificatesByParticipantId.set(cert.participant_id, cert)
        }
      }
    }

    // 4. Combine and filter results
    const results: any[] = []

    // Add registered participants
    for (const reg of registrations || []) {
      const profile = registeredProfilesMap.get(reg.user_id)
      if (profile && profile.full_name?.toLowerCase().includes(searchName)) {
        const existingCert = certificatesByUserId.get(reg.user_id)
        results.push({
          id: existingCert?.id || `user-${reg.user_id}`,
          certificate_number: existingCert?.certificate_number || null,
          issued_at: existingCert?.issued_at || null,
          webinar_id: webinar_id,
          user_id: reg.user_id,
          participant_id: null,
          webinars: reg.webinars,
          user_profiles: profile,
          webinar_participants: null,
          has_certificate: !!existingCert
        })
      }
    }

    // Add uploaded participants
    for (const participant of uploadedParticipants || []) {
      if (participant.full_name?.toLowerCase().includes(searchName)) {
        const existingCert = certificatesByParticipantId.get(participant.id)
        results.push({
          id: existingCert?.id || `participant-${participant.id}`,
          certificate_number: existingCert?.certificate_number || null,
          issued_at: existingCert?.issued_at || null,
          webinar_id: webinar_id,
          user_id: null,
          participant_id: participant.id,
          webinars: registrations?.[0]?.webinars || null, // Get webinar info from first registration
          user_profiles: null,
          webinar_participants: participant,
          has_certificate: !!existingCert
        })
      }
    }

    // Get webinar info if not already included
    if (results.length > 0 && !results[0].webinars) {
      const { data: webinarData } = await supabaseAdmin
        .from('webinars')
        .select('id, title, slug, start_time, end_time')
        .eq('id', webinar_id)
        .single()

      if (webinarData) {
        results.forEach(r => {
          r.webinars = webinarData
        })
      }
    }

    return NextResponse.json({
      data: results,
      count: results.length
    })
  } catch (error: any) {
    console.error('Error in POST /api/webinar-certificates/search:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message 
    }, { status: 500 })
  }
}

