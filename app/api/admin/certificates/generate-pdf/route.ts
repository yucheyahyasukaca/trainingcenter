import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { generateCompleteCertificate, generateQRCode, generateCertificatePDF } from '@/lib/certificate-generator'

// POST /api/admin/certificates/generate-pdf - Generate certificate with PDF
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const { 
      template_id, 
      certificate_data,
      enrollment_id,
      program_id,
      trainer_id,
      class_id,
      recipient_type 
    } = body

    // Validate required fields
    if (!template_id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    let finalCertificateData

    if (recipient_type === 'participant' && enrollment_id) {
      // Get enrollment and participant data
      const { data: enrollmentData, error: enrollmentError } = await supabaseAdmin
        .from('enrollments')
        .select(`
          *,
          participants:participant_id (
            id,
            name,
            company,
            position,
            user_id
          ),
          programs:program_id (
            id,
            title,
            start_date,
            end_date
          ),
          classes:class_id (
            id,
            name
          )
        `)
        .eq('id', enrollment_id)
        .single()

      if (enrollmentError || !enrollmentData) {
        return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
      }

      finalCertificateData = {
        certificate_number: certificate_data.certificate_number,
        recipient_name: enrollmentData.participants.name,
        recipient_company: enrollmentData.participants.company,
        recipient_position: enrollmentData.participants.position,
        program_title: enrollmentData.programs.title,
        program_start_date: enrollmentData.programs.start_date,
        program_end_date: enrollmentData.programs.end_date,
        completion_date: certificate_data.completion_date || new Date().toISOString().split('T')[0],
        signatory_name: certificate_data.signatory_name,
        signatory_position: certificate_data.signatory_position,
        signatory_signature_url: certificate_data.signatory_signature_url
      }
    } else if (recipient_type === 'trainer' && program_id && trainer_id) {
      // Get trainer and program data
      const { data: trainerData, error: trainerError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, full_name, trainer_level')
        .eq('id', trainer_id)
        .single()

      const { data: programData, error: programError } = await supabaseAdmin
        .from('programs')
        .select('id, title, start_date, end_date')
        .eq('id', program_id)
        .single()

      if (trainerError || !trainerData || programError || !programData) {
        return NextResponse.json({ error: 'Trainer or program not found' }, { status: 404 })
      }

      finalCertificateData = {
        certificate_number: certificate_data.certificate_number,
        recipient_name: trainerData.full_name,
        recipient_company: '',
        recipient_position: '',
        program_title: programData.title,
        program_start_date: programData.start_date,
        program_end_date: programData.end_date,
        completion_date: certificate_data.completion_date || new Date().toISOString().split('T')[0],
        trainer_name: trainerData.full_name,
        trainer_level: trainerData.trainer_level,
        signatory_name: certificate_data.signatory_name,
        signatory_position: certificate_data.signatory_position,
        signatory_signature_url: certificate_data.signatory_signature_url
      }
    } else {
      return NextResponse.json({ error: 'Invalid recipient type or missing data' }, { status: 400 })
    }

    // Generate certificate
    const { pdfUrl, qrCodeUrl } = await generateCompleteCertificate(template_id, finalCertificateData)

    // Update certificate record with generated URLs
    const { data: certificateData, error: certificateError } = await supabaseAdmin
      .from('certificates')
      .update({
        certificate_pdf_url: pdfUrl,
        certificate_qr_code_url: qrCodeUrl,
        updated_at: new Date().toISOString()
      })
      .eq('certificate_number', finalCertificateData.certificate_number)
      .select()
      .single()

    if (certificateError) {
      console.error('Error updating certificate:', certificateError)
      return NextResponse.json({ error: 'Failed to update certificate' }, { status: 500 })
    }

    return NextResponse.json({ 
      data: certificateData,
      pdf_url: pdfUrl,
      qr_code_url: qrCodeUrl
    })
  } catch (error) {
    console.error('Error in POST /api/admin/certificates/generate-pdf:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 })
  }
}