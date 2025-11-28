import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

// POST /api/webinar-certificates/generate - Generate certificate on-demand for a participant
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const { webinar_id, user_id, participant_id } = body

    if (!webinar_id) {
      return NextResponse.json({ error: 'Webinar ID is required' }, { status: 400 })
    }

    if (!user_id && !participant_id) {
      return NextResponse.json({ 
        error: 'Either user_id or participant_id is required' 
      }, { status: 400 })
    }

    // Check if webinar exists and has ended
    const { data: webinar, error: webinarError } = await supabaseAdmin
      .from('webinars')
      .select('id, title, end_time, certificate_template_id')
      .eq('id', webinar_id)
      .single()

    if (webinarError || !webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    // Check if webinar has ended
    const now = new Date()
    const endTime = new Date(webinar.end_time)
    if (endTime > now) {
      return NextResponse.json({ 
        error: 'Webinar belum selesai',
        details: `Webinar akan berakhir pada ${endTime.toLocaleString('id-ID')}`
      }, { status: 400 })
    }

    // Check if template is configured
    if (!webinar.certificate_template_id) {
      return NextResponse.json({ 
        error: 'Template sertifikat belum diatur',
        details: 'Admin perlu mengatur template sertifikat terlebih dahulu'
      }, { status: 400 })
    }

    // Check if certificate already exists
    let existingCertQuery = supabaseAdmin
      .from('webinar_certificates')
      .select('id, certificate_number, issued_at')
      .eq('webinar_id', webinar_id)

    if (user_id) {
      existingCertQuery = existingCertQuery.eq('user_id', user_id).is('participant_id', null)
    } else {
      existingCertQuery = existingCertQuery.eq('participant_id', participant_id).is('user_id', null)
    }

    const { data: existingCert } = await existingCertQuery.maybeSingle()

    if (existingCert) {
      return NextResponse.json({
        data: {
          certificate_number: existingCert.certificate_number,
          issued_at: existingCert.issued_at
        },
        message: 'Certificate already exists'
      })
    }

    // Generate certificate number with timestamp + random for uniqueness
    async function generateCertificateNumberValue(attempt: number = 0) {
      // Use timestamp + random UUID to ensure uniqueness
      const timestamp = Date.now()
      const randomPart = randomUUID().toUpperCase().replace(/-/g, '').substring(0, 12)
      const attemptSuffix = attempt > 0 ? `-${attempt}` : ''
      return `WB-${timestamp}-${randomPart}${attemptSuffix}`
    }

    // Insert certificate with retry logic
    async function insertCertificateWithRetry(maxAttempts = 10) {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const certificateNumber = await generateCertificateNumberValue(attempt)
        
        // Check if certificate number already exists before inserting
        const { data: existingCert } = await supabaseAdmin
          .from('webinar_certificates')
          .select('id')
          .eq('certificate_number', certificateNumber)
          .maybeSingle()

        if (existingCert) {
          console.warn(`Certificate number ${certificateNumber} already exists, generating new one...`)
          // Add small delay to ensure timestamp changes
          await new Promise(resolve => setTimeout(resolve, 10))
          continue
        }
        
        const certificateData: any = {
          certificate_number: certificateNumber,
          webinar_id: webinar_id,
          issued_at: new Date().toISOString()
        }

        if (user_id) {
          certificateData.user_id = user_id
          certificateData.participant_id = null
        } else {
          certificateData.user_id = null
          certificateData.participant_id = participant_id
        }

        const { error: insertError } = await supabaseAdmin
          .from('webinar_certificates')
          .insert(certificateData)

        if (!insertError) {
          return certificateNumber
        }

        if (insertError?.code === '23505') {
          console.warn(`Duplicate certificate number, retrying... (attempt ${attempt + 1})`)
          // Add delay before retry to avoid race condition
          await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)))
          continue
        }

        throw new Error(`Database insert failed: ${insertError.message}`)
      }

      throw new Error('Gagal membuat nomor sertifikat unik setelah beberapa percobaan')
    }

    const certificateNumber = await insertCertificateWithRetry()
    
    console.log('Generate endpoint: Certificate created successfully:', certificateNumber)
    
    // Verify the certificate was actually saved
    const { data: verifyCert, error: verifyError } = await supabaseAdmin
      .from('webinar_certificates')
      .select('id, certificate_number, webinar_id, user_id, participant_id')
      .eq('certificate_number', certificateNumber)
      .single()
    
    if (verifyError || !verifyCert) {
      console.error('Generate endpoint: Failed to verify certificate was saved:', verifyError)
      return NextResponse.json({ 
        error: 'Certificate created but verification failed',
        details: verifyError?.message 
      }, { status: 500 })
    }
    
    console.log('Generate endpoint: Certificate verified in database:', verifyCert)

    return NextResponse.json({
      data: {
        certificate_number: certificateNumber.trim(), // Ensure no whitespace
        issued_at: new Date().toISOString()
      },
      message: 'Certificate generated successfully'
    })
  } catch (error: any) {
    console.error('Error in POST /api/webinar-certificates/generate:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message 
    }, { status: 500 })
  }
}

