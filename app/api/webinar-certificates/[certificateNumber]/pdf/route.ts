import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { CertificateData, renderCertificateBuffer } from '@/lib/certificate-generator'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ certificateNumber: string }> }
) {
  try {
    const { certificateNumber } = await params

    if (!certificateNumber) {
      return NextResponse.json({ error: 'Certificate number is required' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: certificate, error } = await supabaseAdmin
      .from('webinar_certificates')
      .select(`
        certificate_number,
        issued_at,
        user_profiles:user_id (
          full_name,
          email
        ),
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

    if (error || !certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    const webinar = certificate.webinars
    if (!webinar?.certificate_template_id) {
      return NextResponse.json({ error: 'Webinar template not configured' }, { status: 400 })
    }

    const recipientName =
      certificate.user_profiles?.full_name ||
      certificate.webinar_participants?.full_name ||
      'Peserta'

    const recipientCompany = certificate.webinar_participants?.unit_kerja || ''

    const completionDate = new Date(
      webinar.end_time || certificate.issued_at || new Date().toISOString()
    )
      .toISOString()
      .slice(0, 10)

    const { data: templateMeta, error: templateError } = await supabaseAdmin
      .from('certificate_templates')
      .select('signatory_name, signatory_position, signatory_signature_url')
      .eq('id', webinar.certificate_template_id)
      .single()

    if (templateError || !templateMeta) {
      return NextResponse.json({ error: 'Template data not found' }, { status: 404 })
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
      signatory_name: templateMeta.signatory_name,
      signatory_position: templateMeta.signatory_position,
      signatory_signature_url: templateMeta.signatory_signature_url
    }

    const { pdfBuffer } = await renderCertificateBuffer(
      webinar.certificate_template_id,
      certificateData,
      true
    )

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="webinar-${certificateNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })
  } catch (error) {
    console.error('Error generating webinar certificate PDF on the fly:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

