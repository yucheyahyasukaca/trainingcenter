import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { generateQRCodeDataUrl } from '@/lib/certificate-generator'

// GET /api/webinar-certificates/verify/[certificateNumber] - Verify webinar certificate by QR code
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ certificateNumber: string }> }
) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { certificateNumber: rawCertNumber } = await params

    if (!rawCertNumber) {
      return NextResponse.json({ error: 'Certificate number is required' }, { status: 400 })
    }

    // Decode certificate number (in case it was URL encoded) and trim whitespace
    const certificateNumber = decodeURIComponent(rawCertNumber).trim()
    console.log('Verify endpoint: Verifying certificate:', certificateNumber)
    console.log('Verify endpoint: Raw certificate number:', rawCertNumber)
    console.log('Verify endpoint: Certificate number length:', certificateNumber.length)

    // First, let's check if any certificates exist with similar numbers (for debugging)
    const { data: allCerts, error: allCertsError } = await supabaseAdmin
      .from('webinar_certificates')
      .select('certificate_number')
      .limit(5)
    
    if (!allCertsError && allCerts) {
      console.log('Verify endpoint: Sample certificate numbers in DB:', allCerts.map(c => c.certificate_number))
    }

    // Get webinar certificate details (fetch separately to avoid PostgREST relationship issues)
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
        webinar_participants:participant_id (
          id,
          full_name,
          unit_kerja,
          email
        )
      `)
      .eq('certificate_number', certificateNumber)
      .single()

    if (certificateError) {
      console.error('Verify endpoint: Database error:', {
        message: certificateError.message,
        code: certificateError.code,
        details: certificateError.details,
        hint: certificateError.hint
      })
      
      // Check if it's a "not found" error or something else
      if (certificateError.code === 'PGRST116') {
        // No rows returned - try to find similar certificate numbers for debugging
        console.log('Verify endpoint: Certificate not found, searching for similar numbers...')
        const { data: similarCerts } = await supabaseAdmin
          .from('webinar_certificates')
          .select('certificate_number')
          .ilike('certificate_number', `%${certificateNumber.substring(0, 10)}%`)
          .limit(5)
        
        if (similarCerts && similarCerts.length > 0) {
          console.log('Verify endpoint: Found similar certificate numbers:', similarCerts.map(c => c.certificate_number))
        } else {
          console.log('Verify endpoint: No similar certificate numbers found')
        }
      } else {
        console.error('Verify endpoint: Unexpected database error')
      }
      
      return NextResponse.json({ 
        error: 'Certificate not found',
        details: certificateError.message 
      }, { status: 404 })
    }

    if (!certificateData) {
      console.error('Verify endpoint: Certificate data is null/undefined')
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    console.log('Verify endpoint: Certificate found:', {
      id: certificateData.id,
      certificate_number: certificateData.certificate_number,
      webinar_id: certificateData.webinar_id,
      user_id: certificateData.user_id,
      participant_id: certificateData.participant_id
    })

    // Fetch user profile separately if user_id exists (to avoid PostgREST relationship issues)
    let userProfile: any = null
    if (certificateData.user_id) {
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, full_name, email')
        .eq('id', certificateData.user_id)
        .maybeSingle()
      
      if (!profileError && profileData) {
        userProfile = profileData
        console.log('Verify endpoint: User profile found:', userProfile)
      } else {
        console.warn('Verify endpoint: User profile not found for user_id:', certificateData.user_id)
      }
    }

    // Map participant data if from webinar_participants
    const mappedData = {
      ...certificateData,
      user_profiles: userProfile || (certificateData.webinar_participants ? {
        id: certificateData.webinar_participants.id,
        full_name: certificateData.webinar_participants.full_name,
        email: certificateData.webinar_participants.email
      } : null)
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

