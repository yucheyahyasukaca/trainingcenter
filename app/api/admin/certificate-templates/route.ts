import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/admin/certificate-templates - Get all certificate templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const programId = searchParams.get('program_id')
    const isActive = searchParams.get('is_active')

    let query = supabaseAdmin
      .from('certificate_templates')
      .select(`
        *,
        programs:program_id (
          id,
          title,
          category
        ),
        created_by_user:created_by (
          id,
          full_name,
          email
        )
      `)

    // If ID is provided, fetch single template
    if (id) {
      query = query.eq('id', id).single()
    } else {
      query = query.order('created_at', { ascending: false })
    }

    if (programId) {
      query = query.eq('program_id', programId)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching certificate templates:', error)
      return NextResponse.json({ error: 'Failed to fetch certificate templates' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in GET /api/admin/certificate-templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/certificate-templates - Create new certificate template
export async function POST(request: NextRequest) {
  try {
    // Parse FormData since we're uploading files
    const formData = await request.formData()
    
    const program_id = formData.get('program_id') as string
    const template_name = formData.get('template_name') as string
    const template_description = formData.get('template_description') as string
    const template_pdf_file = formData.get('template_pdf_file') as File
    const signatory_name = formData.get('signatory_name') as string
    const signatory_position = formData.get('signatory_position') as string
    const signatory_signature_file = formData.get('signatory_signature_file') as File | null
    const participant_name_field = formData.get('participant_name_field') as string
    const participant_company_field = formData.get('participant_company_field') as string
    const participant_position_field = formData.get('participant_position_field') as string
    const program_title_field = formData.get('program_title_field') as string
    const program_date_field = formData.get('program_date_field') as string
    const completion_date_field = formData.get('completion_date_field') as string
    const trainer_name_field = formData.get('trainer_name_field') as string
    const trainer_level_field = formData.get('trainer_level_field') as string
    const template_fields = formData.get('template_fields') as string
    const user_id = formData.get('user_id') as string

    // Validate required fields
    if (!program_id || !template_name || !template_pdf_file) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Parse template_fields if provided
    let parsedTemplateFields = {}
    if (template_fields) {
      try {
        parsedTemplateFields = JSON.parse(template_fields)
      } catch (e) {
        console.warn('Failed to parse template_fields:', e)
      }
    }

    // Upload PDF template to storage
    const pdfFileName = `template-${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`
    const pdfBuffer = await template_pdf_file.arrayBuffer()
    
    console.log('Uploading PDF to certificate-templates bucket...')
    console.log('File name:', pdfFileName)
    console.log('File size:', pdfBuffer.byteLength)
    
    const { data: pdfData, error: pdfError } = await supabaseAdmin.storage
      .from('certificate-templates')
      .upload(pdfFileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (pdfError) {
      console.error('Error uploading PDF template:', pdfError)
      console.error('Error details:', JSON.stringify(pdfError, null, 2))
      return NextResponse.json({ error: `Failed to upload PDF template: ${pdfError.message}` }, { status: 500 })
    }
    
    console.log('PDF uploaded successfully:', pdfData)

    // Get PDF URL
    const { data: pdfUrlData } = supabaseAdmin.storage
      .from('certificate-templates')
      .getPublicUrl(pdfFileName)

    let signatureUrl = null
    if (signatory_signature_file && signatory_signature_file.size > 0) {
      // Upload signature image to storage
      const signatureFileName = `signature-${Date.now()}-${Math.random().toString(36).substring(7)}.png`
      const signatureBuffer = await signatory_signature_file.arrayBuffer()
      const { data: signatureData, error: signatureError } = await supabaseAdmin.storage
        .from('signatures')
        .upload(signatureFileName, signatureBuffer, {
          contentType: 'image/png',
          upsert: false
        })

      if (signatureError) {
        console.error('Error uploading signature:', signatureError)
        return NextResponse.json({ error: 'Failed to upload signature' }, { status: 500 })
      }

      // Get signature URL
      const { data: signatureUrlData } = supabaseAdmin.storage
        .from('signatures')
        .getPublicUrl(signatureFileName)
      
      signatureUrl = signatureUrlData.publicUrl
    }

    // Create certificate template record
    const { data: templateData, error: templateError } = await supabaseAdmin
      .from('certificate_templates')
      .insert({
        program_id,
        template_name,
        template_description,
        template_pdf_url: pdfUrlData.publicUrl,
        template_fields: parsedTemplateFields,
        signatory_name,
        signatory_position,
        signatory_signature_url: signatureUrl,
        participant_name_field: participant_name_field || 'participant_name',
        participant_company_field: participant_company_field || 'participant_company',
        participant_position_field: participant_position_field || 'participant_position',
        program_title_field: program_title_field || 'program_title',
        program_date_field: program_date_field || 'program_date',
        completion_date_field: completion_date_field || 'completion_date',
        trainer_name_field: trainer_name_field || 'trainer_name',
        trainer_level_field: trainer_level_field || 'trainer_level',
        is_active: true,
        created_by: user_id
      })
      .select()
      .single()

    if (templateError) {
      console.error('Error creating certificate template:', templateError)
      return NextResponse.json({ error: 'Failed to create certificate template' }, { status: 500 })
    }

    return NextResponse.json({ data: templateData })
  } catch (error) {
    console.error('Error in POST /api/admin/certificate-templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/certificate-templates/[id] - Update certificate template
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')
    
    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Only update fields that are provided
    if (body.template_name !== undefined) updateData.template_name = body.template_name
    if (body.template_description !== undefined) updateData.template_description = body.template_description
    if (body.template_fields !== undefined) updateData.template_fields = body.template_fields
    if (body.signatory_name !== undefined) updateData.signatory_name = body.signatory_name
    if (body.signatory_position !== undefined) updateData.signatory_position = body.signatory_position
    if (body.participant_name_field !== undefined) updateData.participant_name_field = body.participant_name_field
    if (body.participant_company_field !== undefined) updateData.participant_company_field = body.participant_company_field
    if (body.participant_position_field !== undefined) updateData.participant_position_field = body.participant_position_field
    if (body.program_title_field !== undefined) updateData.program_title_field = body.program_title_field
    if (body.program_date_field !== undefined) updateData.program_date_field = body.program_date_field
    if (body.completion_date_field !== undefined) updateData.completion_date_field = body.completion_date_field
    if (body.trainer_name_field !== undefined) updateData.trainer_name_field = body.trainer_name_field
    if (body.trainer_level_field !== undefined) updateData.trainer_level_field = body.trainer_level_field
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    
    // QR Code settings
    if (body.qr_code_size !== undefined) updateData.qr_code_size = body.qr_code_size
    if (body.qr_code_position_x !== undefined) updateData.qr_code_position_x = body.qr_code_position_x
    if (body.qr_code_position_y !== undefined) updateData.qr_code_position_y = body.qr_code_position_y

    // Handle PDF template update
    if (body.template_pdf_file) {
      const pdfFileName = `template-${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`
      const { data: pdfData, error: pdfError } = await supabaseAdmin.storage
        .from('certificate-templates')
        .upload(pdfFileName, body.template_pdf_file, {
          contentType: 'application/pdf',
          upsert: false
        })

      if (pdfError) {
        console.error('Error uploading PDF template:', pdfError)
        return NextResponse.json({ error: 'Failed to upload PDF template' }, { status: 500 })
      }

      const { data: pdfUrlData } = supabaseAdmin.storage
        .from('certificate-templates')
        .getPublicUrl(pdfFileName)
      
      updateData.template_pdf_url = pdfUrlData.publicUrl
    }

    // Handle signature update
    if (body.signatory_signature_file) {
      const signatureFileName = `signature-${Date.now()}-${Math.random().toString(36).substring(7)}.png`
      const { data: signatureData, error: signatureError } = await supabaseAdmin.storage
        .from('signatures')
        .upload(signatureFileName, body.signatory_signature_file, {
          contentType: 'image/png',
          upsert: false
        })

      if (signatureError) {
        console.error('Error uploading signature:', signatureError)
        return NextResponse.json({ error: 'Failed to upload signature' }, { status: 500 })
      }

      const { data: signatureUrlData } = supabaseAdmin.storage
        .from('signatures')
        .getPublicUrl(signatureFileName)
      
      updateData.signatory_signature_url = signatureUrlData.publicUrl
    }

    // Update certificate template
    const { data: templateData, error: templateError } = await supabaseAdmin
      .from('certificate_templates')
      .update(updateData)
      .eq('id', templateId)
      .select()
      .single()

    if (templateError) {
      console.error('Error updating certificate template:', templateError)
      return NextResponse.json({ error: 'Failed to update certificate template' }, { status: 500 })
    }

    return NextResponse.json({ data: templateData })
  } catch (error) {
    console.error('Error in PUT /api/admin/certificate-templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/certificate-templates/[id] - Delete certificate template
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')
    
    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    // Get template data to delete associated files
    const { data: templateData, error: fetchError } = await supabaseAdmin
      .from('certificate_templates')
      .select('template_pdf_url, signatory_signature_url')
      .eq('id', templateId)
      .single()

    if (fetchError) {
      console.error('Error fetching template data:', fetchError)
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Delete certificate template
    const { error: deleteError } = await supabaseAdmin
      .from('certificate_templates')
      .delete()
      .eq('id', templateId)

    if (deleteError) {
      console.error('Error deleting certificate template:', deleteError)
      return NextResponse.json({ error: 'Failed to delete certificate template' }, { status: 500 })
    }

    // Delete associated files from storage
    if (templateData.template_pdf_url) {
      const pdfFileName = templateData.template_pdf_url.split('/').pop()
      if (pdfFileName) {
        await supabaseAdmin.storage
          .from('certificate-templates')
          .remove([pdfFileName])
      }
    }

    if (templateData.signatory_signature_url) {
      const signatureFileName = templateData.signatory_signature_url.split('/').pop()
      if (signatureFileName) {
        await supabaseAdmin.storage
          .from('signatures')
          .remove([signatureFileName])
      }
    }

    return NextResponse.json({ message: 'Certificate template deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/admin/certificate-templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
