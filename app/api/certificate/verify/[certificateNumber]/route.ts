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

    // Get certificate details (include template_id to fetch signatories)
    const { data: certificateData, error: certificateError } = await supabaseAdmin
      .from('certificates')
      .select(`
        *,
        template_id,
        template:template_id (
          id,
          template_name,
          template_description,
          template_fields,
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

    // Fetch all active signatories for this template
    let signatories: any[] = []
    const { data: signatoriesDb } = await supabaseAdmin
      .from('certificate_signatories')
      .select('id, signatory_name, signatory_position, signatory_signature_url, sign_order')
      .eq('template_id', (certificateData as any).template_id)
      .eq('is_active', true)
      .order('sign_order', { ascending: true })

    if (signatoriesDb && signatoriesDb.length > 0) {
      signatories = signatoriesDb
    } else {
      // Fallback: try to read from template.template_fields -> signatories (array of objects)
      const tf = (certificateData as any).template?.template_fields
      if (tf && tf.signatories && Array.isArray(tf.signatories)) {
        signatories = tf.signatories.map((s: any, idx: number) => ({
          id: `${(certificateData as any).template_id}-${idx + 1}`,
          signatory_name: s.name || s.signatory_name || '',
          signatory_position: s.position || s.signatory_position || '',
          signatory_signature_url: s.signature_url || s.signatory_signature_url || null,
          sign_order: s.sign_order || idx + 1
        }))
      }
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

    // Return certificate data with verification result and signatories
    return NextResponse.json({
      data: {
        ...certificateData,
        signatories,
        verification_result: verificationResult,
        verified_at: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error in GET /api/certificate/verify:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
