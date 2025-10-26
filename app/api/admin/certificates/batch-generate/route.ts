import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { generateCompleteCertificate } from '@/lib/certificate-generator'

// POST /api/admin/certificates/batch-generate - Batch generate certificates
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const { template_id, certificates_data } = body

    if (!template_id || !certificates_data || !Array.isArray(certificates_data)) {
      return NextResponse.json({ error: 'Template ID and certificates data array are required' }, { status: 400 })
    }

    const results = []

    for (const certificateData of certificates_data) {
      try {
        const { pdfUrl, qrCodeUrl } = await generateCompleteCertificate(template_id, certificateData)

        // Update certificate record
        const { data: updatedCertificate, error: updateError } = await supabaseAdmin
          .from('certificates')
          .update({
            certificate_pdf_url: pdfUrl,
            certificate_qr_code_url: qrCodeUrl,
            updated_at: new Date().toISOString()
          })
          .eq('certificate_number', certificateData.certificate_number)
          .select()
          .single()

        if (updateError) {
          throw new Error(`Failed to update certificate: ${updateError.message}`)
        }

        results.push({
          certificate_number: certificateData.certificate_number,
          success: true,
          pdf_url: pdfUrl,
          qr_code_url: qrCodeUrl,
          certificate_data: updatedCertificate
        })
      } catch (error) {
        results.push({
          certificate_number: certificateData.certificate_number,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({ 
      data: results,
      summary: {
        total: certificates_data.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    })
  } catch (error) {
    console.error('Error in POST /api/admin/certificates/batch-generate:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 })
  }
}
