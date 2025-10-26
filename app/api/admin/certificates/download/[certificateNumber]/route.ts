import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// GET /api/admin/certificates/download/[certificateNumber] - Download certificate PDF
export async function GET(request: NextRequest, { params }: { params: Promise<{ certificateNumber: string }> }) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { certificateNumber } = await params

    if (!certificateNumber) {
      return NextResponse.json({ error: 'Certificate number is required' }, { status: 400 })
    }

    // Get certificate data
    const { data: certificateData, error: certificateError } = await supabaseAdmin
      .from('certificates')
      .select('certificate_pdf_url, certificate_number')
      .eq('certificate_number', certificateNumber)
      .single()

    if (certificateError || !certificateData) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    // If PDF doesn't exist, generate it
    if (!certificateData.certificate_pdf_url) {
      return NextResponse.json({ error: 'Certificate PDF not generated yet' }, { status: 404 })
    }

    // Fetch PDF from storage
    const response = await fetch(certificateData.certificate_pdf_url)
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch certificate PDF' }, { status: 500 })
    }

    const pdfBuffer = await response.arrayBuffer()

    // Return PDF as download
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certificateNumber}.pdf"`,
        'Content-Length': pdfBuffer.byteLength.toString()
      }
    })
  } catch (error) {
    console.error('Error in GET /api/admin/certificates/download:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
