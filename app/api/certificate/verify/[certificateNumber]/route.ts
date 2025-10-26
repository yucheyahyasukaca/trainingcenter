import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// GET /api/certificate/verify/[certificateNumber] - Verify certificate by QR code
export async function GET(request: NextRequest, { params }: { params: Promise<{ certificateNumber: string }> }) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { certificateNumber } = await params

    if (!certificateNumber) {
      return NextResponse.json({ error: 'Certificate number is required' }, { status: 400 })
    }

    // Get certificate details
    const { data: certificateData, error: certificateError } = await supabaseAdmin
      .from('certificates')
      .select(`
        *,
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
          category,
          start_date,
          end_date
        ),
        classes:class_id (
          id,
          name,
          start_date,
          end_date,
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

    // Log verification attempt
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await supabaseAdmin
      .from('certificate_verifications')
      .insert({
        certificate_id: certificateData.id,
        verified_by_ip: clientIP,
        verified_by_user_agent: userAgent,
        verification_result: verificationResult
      })

    // Return certificate data with verification result
    return NextResponse.json({
      data: {
        ...certificateData,
        verification_result: verificationResult,
        verified_at: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error in GET /api/certificate/verify:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
