import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/certificate/[certificateNumber] - Get certificate details (for public viewing)
export async function GET(request: NextRequest, { params }: { params: Promise<{ certificateNumber: string }> }) {
  try {
    const { certificateNumber } = await params

    if (!certificateNumber) {
      return NextResponse.json({ error: 'Certificate number is required' }, { status: 400 })
    }

    // Get certificate details
    const { data: certificateData, error: certificateError } = await supabaseAdmin
      .from('certificates')
      .select(`
        id,
        certificate_number,
        recipient_type,
        recipient_name,
        recipient_company,
        recipient_position,
        program_title,
        program_start_date,
        program_end_date,
        completion_date,
        trainer_name,
        trainer_level,
        certificate_pdf_url,
        certificate_qr_code_url,
        status,
        issued_at,
        expires_at,
        template:template_id (
          id,
          template_name,
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

    if (certificateError || !certificateData) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    // Check if certificate is valid
    let verificationResult = 'valid'
    if (certificateData.status === 'revoked') {
      verificationResult = 'revoked'
    } else if (certificateData.status === 'expired') {
      verificationResult = 'expired'
    } else if (certificateData.expires_at && new Date(certificateData.expires_at) < new Date()) {
      verificationResult = 'expired'
    }

    // Return certificate data
    return NextResponse.json({
      data: {
        ...certificateData,
        verification_result: verificationResult,
        verified_at: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error in GET /api/certificate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
