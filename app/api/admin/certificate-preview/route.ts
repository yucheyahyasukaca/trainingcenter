import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { generateCertificatePDF } from '@/lib/certificate-generator'
import QRCode from 'qrcode'

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const { templateId } = body

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    // Get template data
    const { data: template, error: templateError } = await supabaseAdmin
      .from('certificate_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Debug: Log template configuration
    console.log('Template QR Code Configuration:', {
      qr_code_size: template.qr_code_size,
      qr_code_position_x: template.qr_code_position_x,
      qr_code_position_y: template.qr_code_position_y
    })

    // Generate mock certificate data
    const certificateNumber = `PREVIEW-${Date.now()}`
    const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/certificate/verify/${certificateNumber}`
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    // Mock certificate data for preview
    const mockCertificateData = {
      certificate_number: certificateNumber,
      recipient_name: 'Nama Lengkap Peserta', // Mock name
      recipient_company: 'PT Contoh Perusahaan',
      recipient_position: 'Staff',
      program_title: template.template_name,
      program_start_date: '01 Januari 2025',
      program_end_date: '15 Januari 2025',
      completion_date: new Date().toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }),
      trainer_name: 'Trainer Mock',
      trainer_level: 'Senior Trainer',
      signatory_name: template.signatory_name,
      signatory_position: template.signatory_position,
      signatory_signature_url: template.signatory_signature_url
    }

    // Debug: Log template fields
    console.log('Template configuration:', {
      template_fields: template.template_fields,
      hasFields: !!template.template_fields,
      fieldNames: template.template_fields ? Object.keys(template.template_fields) : []
    })

    // Generate certificate PDF
    const { pdfBuffer } = await generateCertificatePDF(
      {
        id: template.id,
        template_pdf_url: template.template_pdf_url,
        template_fields: template.template_fields || {},
        participant_name_field: template.participant_name_field || 'participant_name',
        participant_company_field: template.participant_company_field || 'participant_company',
        participant_position_field: template.participant_position_field || 'participant_position',
        program_title_field: template.program_title_field || 'program_title',
        program_date_field: template.program_date_field || 'program_date',
        completion_date_field: template.completion_date_field || 'completion_date',
        trainer_name_field: template.trainer_name_field || 'trainer_name',
        trainer_level_field: template.trainer_level_field || 'trainer_level',
        qr_code_size: template.qr_code_size,
        qr_code_position_x: template.qr_code_position_x,
        qr_code_position_y: template.qr_code_position_y
      },
      mockCertificateData,
      qrCodeDataUrl
    )

    // Convert PDF buffer to base64 for display
    const base64Pdf = Buffer.from(pdfBuffer).toString('base64')
    const dataUrl = `data:application/pdf;base64,${base64Pdf}`

    return NextResponse.json({
      previewUrl: dataUrl,
      certificateData: mockCertificateData
    })
  } catch (error) {
    console.error('Error generating certificate preview:', error)
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 })
  }
}

