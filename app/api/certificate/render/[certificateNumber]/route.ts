import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// GET /api/certificate/render/[certificateNumber] - Get certificate data with template for rendering
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ certificateNumber: string }> }
) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { certificateNumber } = await params

    console.log('=== API: Certificate Render Request ===')
    console.log('Certificate Number:', certificateNumber)

    if (!certificateNumber) {
      return NextResponse.json({ error: 'Certificate number is required' }, { status: 400 })
    }

    // Fetch certificate with template details including template_fields
    const { data: certificate, error } = await supabaseAdmin
      .from('certificates')
      .select(`
        *,
        template:template_id (
          id,
          template_name,
          template_pdf_url,
          template_fields,
          qr_code_size,
          qr_code_position_x,
          qr_code_position_y,
          signatory_name,
          signatory_position,
          signatory_signature_url
        ),
        programs:program_id (
          id,
          title,
          description,
          category
        ),
        classes:class_id (
          id,
          name,
          location
        )
      `)
      .eq('certificate_number', certificateNumber)
      .single()

    if (error) {
      console.error('❌ Supabase error fetching certificate:', error)
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    if (!certificate) {
      console.error('❌ Certificate not found in database')
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    console.log('✅ Certificate found:', {
      number: certificate.certificate_number,
      recipient: certificate.recipient_name,
      template: certificate.template?.template_name,
      has_template_fields: !!certificate.template?.template_fields,
      template_fields_type: typeof certificate.template?.template_fields,
      template_fields_keys: certificate.template?.template_fields ? Object.keys(certificate.template.template_fields) : []
    })

    // Check certificate status
    let verification_result: 'valid' | 'revoked' | 'expired' | 'invalid' = 'valid'
    
    if (certificate.status === 'revoked') {
      verification_result = 'revoked'
    } else if (certificate.status === 'expired') {
      verification_result = 'expired'
    } else if (certificate.expires_at) {
      const expiryDate = new Date(certificate.expires_at)
      if (expiryDate < new Date()) {
        verification_result = 'expired'
      }
    }

    // Return certificate data with verification result
    const responseData = {
      ...certificate,
      verification_result,
      verified_at: new Date().toISOString()
    }

    console.log('✅ Returning certificate data')
    console.log('=== API: Request Complete ===')
    
    return NextResponse.json({
      data: responseData
    })
  } catch (error) {
    console.error('❌ Error in GET /api/certificate/render:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

