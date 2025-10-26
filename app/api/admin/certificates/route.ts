import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// GET /api/admin/certificates - Get all certificates
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const programId = searchParams.get('program_id')
    const classId = searchParams.get('class_id')
    const recipientType = searchParams.get('recipient_type')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('certificates')
      .select(`
        *,
        template:template_id (
          id,
          template_name,
          signatory_name,
          signatory_position
        ),
        programs:program_id (
          id,
          title,
          category
        ),
        classes:class_id (
          id,
          name
        ),
        issued_by_user:issued_by (
          id,
          full_name,
          email
        )
      `)
      .order('issued_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (programId) {
      query = query.eq('program_id', programId)
    }

    if (classId) {
      query = query.eq('class_id', classId)
    }

    if (recipientType) {
      query = query.eq('recipient_type', recipientType)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching certificates:', error)
      return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 })
    }

    return NextResponse.json({ 
      data, 
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/certificates:', error)
    console.error('Error message:', error?.message)
    const errorMessage = error?.message || 'Internal server error'
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 })
  }
}

// POST /api/admin/certificates/generate - Generate certificate manually
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const { enrollment_id, program_id, trainer_id, class_id, recipient_type } = body

    // Validate required fields
    if (!recipient_type || !['participant', 'trainer'].includes(recipient_type)) {
      return NextResponse.json({ error: 'Invalid recipient type' }, { status: 400 })
    }

    let certificateId: string

    if (recipient_type === 'participant') {
      if (!enrollment_id) {
        return NextResponse.json({ error: 'Enrollment ID is required for participant certificates' }, { status: 400 })
      }

      // Generate participant certificate
      const { data, error } = await supabaseAdmin.rpc('auto_generate_participant_certificate', {
        p_enrollment_id: enrollment_id
      })

      if (error) {
        console.error('Error generating participant certificate:', error)
        return NextResponse.json({ error: 'Failed to generate participant certificate' }, { status: 500 })
      }

      certificateId = data
    } else {
      if (!program_id || !trainer_id) {
        return NextResponse.json({ error: 'Program ID and Trainer ID are required for trainer certificates' }, { status: 400 })
      }

      // Generate trainer certificate
      const { data, error } = await supabaseAdmin.rpc('auto_generate_trainer_certificate', {
        p_program_id: program_id,
        p_trainer_id: trainer_id,
        p_class_id: class_id || null
      })

      if (error) {
        console.error('Error generating trainer certificate:', error)
        return NextResponse.json({ error: 'Failed to generate trainer certificate' }, { status: 500 })
      }

      certificateId = data
    }

    // Fetch the generated certificate
    const { data: certificateData, error: fetchError } = await supabaseAdmin
      .from('certificates')
      .select(`
        *,
        template:template_id (
          id,
          template_name,
          signatory_name,
          signatory_position
        ),
        programs:program_id (
          id,
          title,
          category
        ),
        classes:class_id (
          id,
          name
        )
      `)
      .eq('id', certificateId)
      .single()

    if (fetchError) {
      console.error('Error fetching generated certificate:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch generated certificate' }, { status: 500 })
    }

    return NextResponse.json({ data: certificateData })
  } catch (error) {
    console.error('Error in POST /api/admin/certificates/generate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/certificates/[id] - Update certificate
export async function PUT(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const certificateId = searchParams.get('id')
    
    if (!certificateId) {
      return NextResponse.json({ error: 'Certificate ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const {
      status,
      expires_at,
      notes
    } = body

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (status !== undefined) {
      const validStatuses = ['issued', 'revoked', 'expired']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      updateData.status = status
    }

    if (expires_at !== undefined) {
      updateData.expires_at = expires_at
    }

    // Update certificate
    const { data: certificateData, error: certificateError } = await supabaseAdmin
      .from('certificates')
      .update(updateData)
      .eq('id', certificateId)
      .select()
      .single()

    if (certificateError) {
      console.error('Error updating certificate:', certificateError)
      return NextResponse.json({ error: 'Failed to update certificate' }, { status: 500 })
    }

    return NextResponse.json({ data: certificateData })
  } catch (error) {
    console.error('Error in PUT /api/admin/certificates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/certificates/[id] - Delete certificate
export async function DELETE(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const certificateId = searchParams.get('id')
    
    if (!certificateId) {
      return NextResponse.json({ error: 'Certificate ID is required' }, { status: 400 })
    }

    // Get certificate data to delete associated files
    const { data: certificateData, error: fetchError } = await supabaseAdmin
      .from('certificates')
      .select('certificate_pdf_url, certificate_qr_code_url')
      .eq('id', certificateId)
      .single()

    if (fetchError) {
      console.error('Error fetching certificate data:', fetchError)
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    // Delete certificate
    const { error: deleteError } = await supabaseAdmin
      .from('certificates')
      .delete()
      .eq('id', certificateId)

    if (deleteError) {
      console.error('Error deleting certificate:', deleteError)
      return NextResponse.json({ error: 'Failed to delete certificate' }, { status: 500 })
    }

    // Delete associated files from storage
    if (certificateData.certificate_pdf_url) {
      const pdfFileName = certificateData.certificate_pdf_url.split('/').pop()
      if (pdfFileName) {
        await supabaseAdmin.storage
          .from('certificates')
          .remove([pdfFileName])
      }
    }

    if (certificateData.certificate_qr_code_url) {
      const qrFileName = certificateData.certificate_qr_code_url.split('/').pop()
      if (qrFileName) {
        await supabaseAdmin.storage
          .from('certificate-qr-codes')
          .remove([qrFileName])
      }
    }

    return NextResponse.json({ message: 'Certificate deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/admin/certificates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
