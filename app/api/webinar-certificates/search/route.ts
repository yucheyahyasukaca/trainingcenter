import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// POST /api/webinar-certificates/search - Search webinar certificates by webinar and participant name
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

    // Search for webinar certificates
    const { data: certificates, error } = await supabaseAdmin
      .from('webinar_certificates')
      .select(`
        id,
        certificate_number,
        issued_at,
        webinar_id,
        user_id,
        participant_id,
        webinars:webinar_id (
          id,
          title,
          slug,
          start_time,
          end_time
        ),
        webinar_participants:participant_id (
          id,
          full_name,
          unit_kerja,
          email
        )
      `)
      .eq('webinar_id', webinar_id)

    if (error) {
      console.error('Error searching certificates:', error)
      return NextResponse.json({ error: 'Failed to search certificates' }, { status: 500 })
    }

    // Map user profiles for certificates that have user_id
    const userIds = Array.from(new Set((certificates || [])
      .map((cert: any) => cert.user_id)
      .filter(Boolean)))

    const userProfilesMap = new Map<string, any>()
    if (userIds.length > 0) {
      const { data: userProfiles, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, full_name, email')
        .in('id', userIds)

      if (profileError) {
        console.error('Error fetching user profiles:', profileError)
      } else {
        for (const profile of userProfiles || []) {
          userProfilesMap.set(profile.id, profile)
        }
      }
    }

    // Filter results to ensure name matches (case-insensitive)
    const searchName = participant_name.trim().toLowerCase()
    const filteredCertificates = (certificates || []).filter((cert: any) => {
      const profile = cert.user_id ? userProfilesMap.get(cert.user_id) : null
      const userName = profile?.full_name || ''
      const participantName = cert.webinar_participants?.full_name || ''
      const fullName = userName || participantName
      return fullName.toLowerCase().includes(searchName)
    })

    // Map results to include participant data
    const mappedCertificates = filteredCertificates.map((cert: any) => ({
      ...cert,
      user_profiles: cert.user_id
        ? userProfilesMap.get(cert.user_id) || null
        : cert.webinar_participants
          ? {
              id: cert.webinar_participants.id,
              full_name: cert.webinar_participants.full_name,
              email: cert.webinar_participants.email
            }
          : null
    }))

    return NextResponse.json({
      data: mappedCertificates,
      count: mappedCertificates.length
    })
  } catch (error: any) {
    console.error('Error in POST /api/webinar-certificates/search:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message 
    }, { status: 500 })
  }
}

