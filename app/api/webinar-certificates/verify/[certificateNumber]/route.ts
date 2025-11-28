import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { generateQRCodeDataUrl } from '@/lib/certificate-generator'

// GET /api/webinar-certificates/verify/[certificateNumber] - Verify webinar certificate by QR code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ certificateNumber: string }> }
) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { certificateNumber } = await params

    if (!certificateNumber) {
      return NextResponse.json({ error: 'Certificate number is required' }, { status: 400 })
    }

    // Get webinar certificate details
    const { data: certificateData, error: certificateError } = await supabaseAdmin
      .from('webinar_certificates')
      .select(`
        *,
        webinars:webinar_id (
          id,
          title,
          slug,
          description,
          start_time,
          end_time,
          hero_image_url,
          certificate_template_id
        ),
        user_profiles:user_id (
          id,
          full_name,
          email
        ),
        webinar_participants:participant_id (
          id,
          full_name,
          unit_kerja,
          email
        )
      `)
      .eq('certificate_number', certificateNumber)
      .single()

    if (certificateError || !certificateData) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    // Map participant data if from webinar_participants
    const mappedData = {
      ...certificateData,
      user_profiles: certificateData.user_profiles || {
        id: certificateData.webinar_participants?.id,
        full_name: certificateData.webinar_participants?.full_name,
        email: certificateData.webinar_participants?.email
      }
    }

    // Fetch certificate template info + signatories (if available)
    let templateInfo: any = null
    let signatories: any[] = []
    const templateId = (certificateData as any)?.webinars?.certificate_template_id

    if (templateId) {
      const { data: templateData } = await supabaseAdmin
        .from('certificate_templates')
        .select('id, template_name, template_description, template_fields, signatory_name, signatory_position, signatory_signature_url')
        .eq('id', templateId)
        .single()
      
      if (templateData) {
        templateInfo = templateData
      }

      const { data: signatoriesDb } = await supabaseAdmin
        .from('certificate_signatories')
        .select('id, signatory_name, signatory_position, signatory_signature_url, sign_order')
        .eq('template_id', templateId)
        .eq('is_active', true)
        .order('sign_order', { ascending: true })

      if (signatoriesDb && signatoriesDb.length > 0) {
        signatories = signatoriesDb
      } else if (templateData?.template_fields?.signatories && Array.isArray(templateData.template_fields.signatories)) {
        signatories = templateData.template_fields.signatories.map((s: any, idx: number) => ({
          id: `${templateId}-${idx + 1}`,
          signatory_name: s.name || s.signatory_name || '',
          signatory_position: s.position || s.signatory_position || '',
          signatory_signature_url: s.signature_url || s.signatory_signature_url || null,
          sign_order: s.sign_order || idx + 1
        }))
      }
    }

    const { qrCodeDataUrl } = await generateQRCodeDataUrl(certificateNumber, true)

    return NextResponse.json({
      data: {
        ...mappedData,
        template: templateInfo,
        signatories,
        qr_code_data_url: qrCodeDataUrl
      },
      verified: true,
      verified_at: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error in GET /api/webinar-certificates/verify:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message 
    }, { status: 500 })
  }
}

