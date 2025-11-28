import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { CertificateData, renderCertificateBuffer } from '@/lib/certificate-generator'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ certificateNumber: string }> }
) {
  try {
    const { certificateNumber: rawCertNumber } = await params

    if (!rawCertNumber) {
      console.error('PDF endpoint: Certificate number is missing')
      return NextResponse.json({ error: 'Certificate number is required' }, { status: 400 })
    }

    // Decode certificate number (in case it was URL encoded)
    const certificateNumber = decodeURIComponent(rawCertNumber)
    console.log('PDF endpoint: Fetching certificate for:', certificateNumber, '(raw:', rawCertNumber, ')')

    const supabaseAdmin = getSupabaseAdmin()

    // Fetch certificate data (fetch user_profiles separately to avoid PostgREST relationship issues)
    const { data: certificate, error } = await supabaseAdmin
      .from('webinar_certificates')
      .select(`
        certificate_number,
        issued_at,
        user_id,
        participant_id,
        webinar_participants:participant_id (
          full_name,
          unit_kerja,
          email
        ),
        webinars:webinar_id (
          id,
          title,
          start_time,
          end_time,
          certificate_template_id
        )
      `)
      .eq('certificate_number', certificateNumber)
      .single()

    if (error) {
      console.error('PDF endpoint: Database error:', error)
      return NextResponse.json({ 
        error: 'Certificate not found',
        details: error.message 
      }, { status: 404 })
    }

    if (!certificate) {
      console.error('PDF endpoint: Certificate not found for number:', certificateNumber)
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    console.log('PDF endpoint: Certificate found:', certificate.certificate_number)

    // Fetch user profile separately if user_id exists
    let userProfile: any = null
    if (certificate.user_id) {
      const { data: profileData } = await supabaseAdmin
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', certificate.user_id)
        .maybeSingle()
      
      if (profileData) {
        userProfile = profileData
      }
    }

    const webinar = certificate.webinars
    if (!webinar) {
      console.error('PDF endpoint: Webinar data not found')
      return NextResponse.json({ error: 'Webinar data not found' }, { status: 404 })
    }

    if (!webinar.certificate_template_id) {
      console.error('PDF endpoint: Template not configured for webinar:', webinar.id)
      return NextResponse.json({ 
        error: 'Webinar template not configured',
        details: 'Admin perlu mengatur template sertifikat untuk webinar ini'
      }, { status: 400 })
    }

    console.log('PDF endpoint: Template ID:', webinar.certificate_template_id)

    const recipientName =
      userProfile?.full_name ||
      certificate.webinar_participants?.full_name ||
      'Peserta'

    const recipientCompany = certificate.webinar_participants?.unit_kerja || ''

    const completionDate = new Date(
      webinar.end_time || certificate.issued_at || new Date().toISOString()
    )
      .toISOString()
      .slice(0, 10)

    // Fetch signatories from certificate_signatories table or fallback to template
    let mainSignatory: any = null
    const { data: signatoriesDb } = await supabaseAdmin
      .from('certificate_signatories')
      .select('signatory_name, signatory_position, signatory_signature_url')
      .eq('template_id', webinar.certificate_template_id)
      .eq('is_active', true)
      .order('sign_order', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (signatoriesDb) {
      mainSignatory = signatoriesDb
    } else {
      // Fallback to template signatory
      const { data: templateMeta, error: templateError } = await supabaseAdmin
        .from('certificate_templates')
        .select('signatory_name, signatory_position, signatory_signature_url, template_fields')
        .eq('id', webinar.certificate_template_id)
        .single()

      if (templateError || !templateMeta) {
        return NextResponse.json({ error: 'Template data not found' }, { status: 404 })
      }

      // Try to get first signatory from template_fields if available
      if (templateMeta.template_fields?.signatories && Array.isArray(templateMeta.template_fields.signatories) && templateMeta.template_fields.signatories.length > 0) {
        const firstSignatory = templateMeta.template_fields.signatories[0]
        mainSignatory = {
          signatory_name: firstSignatory.name || firstSignatory.signatory_name || templateMeta.signatory_name,
          signatory_position: firstSignatory.position || firstSignatory.signatory_position || templateMeta.signatory_position,
          signatory_signature_url: firstSignatory.signature_url || firstSignatory.signatory_signature_url || templateMeta.signatory_signature_url
        }
      } else {
        mainSignatory = {
          signatory_name: templateMeta.signatory_name,
          signatory_position: templateMeta.signatory_position,
          signatory_signature_url: templateMeta.signatory_signature_url
        }
      }
    }

    if (!mainSignatory) {
      return NextResponse.json({ error: 'Signatory data not found' }, { status: 404 })
    }

    const certificateData: CertificateData = {
      certificate_number: certificate.certificate_number,
      recipient_name: recipientName,
      recipient_company: recipientCompany,
      recipient_position: '',
      program_title: webinar.title,
      program_start_date: webinar.start_time,
      program_end_date: webinar.end_time,
      completion_date: completionDate,
      signatory_name: mainSignatory.signatory_name,
      signatory_position: mainSignatory.signatory_position,
      signatory_signature_url: mainSignatory.signatory_signature_url
    }

    console.log('PDF endpoint: Generating PDF buffer...')
    const { pdfBuffer } = await renderCertificateBuffer(
      webinar.certificate_template_id,
      certificateData,
      true
    )

    console.log('PDF endpoint: PDF generated successfully, size:', pdfBuffer.length)

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="webinar-certificate-${certificateNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error: any) {
    console.error('PDF endpoint: Error generating webinar certificate PDF:', error)
    console.error('PDF endpoint: Error stack:', error?.stack)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message || 'Failed to generate PDF'
    }, { status: 500 })
  }
}

