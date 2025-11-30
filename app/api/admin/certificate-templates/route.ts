import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { withAdmin } from '@/lib/api-auth'

// GET /api/admin/certificate-templates - Get all certificate templates
export const GET = withAdmin(async (request, auth) => {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const programId = searchParams.get('program_id')
    const isActive = searchParams.get('is_active')

    console.log('GET /api/admin/certificate-templates called with params:', { id, programId, isActive })

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

    // Apply filters
    if (programId) {
      query = query.eq('program_id', programId)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    // If ID is provided, fetch single template
    if (id) {
      query = query.eq('id', id)
      const { data, error } = await query.single()

      if (error) {
        console.error('Error fetching certificate templates:', error)
        return NextResponse.json({ error: 'Failed to fetch certificate templates' }, { status: 500 })
      }

      return NextResponse.json({ data })
    }

    // Fetch multiple templates
    query = query.order('created_at', { ascending: false })
    const { data, error } = await query

    if (error) {
      console.error('Error fetching certificate templates:', error)
      return NextResponse.json({ error: 'Failed to fetch certificate templates' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Error in GET /api/admin/certificate-templates:', error)
    console.error('Error message:', error?.message)
    console.error('Error stack:', error?.stack)

    // Return more detailed error for debugging
    const errorMessage = error?.message || 'Internal server error'
    return NextResponse.json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 })
  }
})

// POST /api/admin/certificate-templates - Create new certificate template
export const POST = withAdmin(async (request, auth) => {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    // Parse FormData since we're uploading files
    const formData = await request.formData()

    const program_id = (formData.get('program_id') as string) || ''
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
    const targetType = ((formData.get('target_type') as string) || 'program').toLowerCase() as 'program' | 'webinar'
    const webinarId = (formData.get('webinar_id') as string) || ''

    // Validate required fields
    if (!template_name || !template_pdf_file) {
      return NextResponse.json({ error: 'Nama template dan file PDF wajib diisi' }, { status: 400 })
    }

    if (targetType !== 'webinar' && !program_id) {
      return NextResponse.json({ error: 'Program harus dipilih untuk template program' }, { status: 400 })
    }

    if (targetType === 'webinar' && !webinarId) {
      return NextResponse.json({ error: 'Pilih webinar yang akan menggunakan template ini' }, { status: 400 })
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
        program_id: program_id || null,
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

    // Automatically attach to selected webinar if provided
    if (targetType === 'webinar' && webinarId && templateData?.id) {
      const { error: webinarUpdateError } = await supabaseAdmin
        .from('webinars')
        .update({ certificate_template_id: templateData.id })
        .eq('id', webinarId)

      if (webinarUpdateError) {
        console.error('Failed to attach template to webinar:', webinarUpdateError)
      }
    }

    return NextResponse.json({ data: templateData })
  } catch (error) {
    console.error('Error in POST /api/admin/certificate-templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

// PUT /api/admin/certificate-templates/[id] - Update certificate template
export const PUT = withAdmin(async (request, auth) => {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    const contentType = request.headers.get('content-type') || ''
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (file uploads + fields)
      const formData = await request.formData()

      const setField = (key: string, targetKey?: string) => {
        const v = formData.get(key)
        if (v !== null && v !== undefined && v !== '') {
          updateData[targetKey || key] = v
        }
      }

      setField('template_name')
      setField('template_description')
      setField('signatory_name')
      setField('signatory_position')
      setField('participant_name_field')
      setField('participant_company_field')
      setField('participant_position_field')
      setField('program_title_field')
      setField('program_date_field')
      setField('completion_date_field')
      setField('trainer_name_field')
      setField('trainer_level_field')

      // Boolean fields
      const isActive = formData.get('is_active')
      if (isActive !== null) {
        updateData.is_active = String(isActive) === 'true' || String(isActive) === '1'
      }

      // QR settings (optional)
      setField('qr_code_size')
      setField('qr_code_position_x')
      setField('qr_code_position_y')

      // template_fields JSON
      const templateFields = formData.get('template_fields') as string | null
      if (templateFields) {
        try {
          updateData.template_fields = JSON.parse(templateFields)
        } catch (_) {
          // ignore parse error, keep original string if needed
          updateData.template_fields = templateFields
        }
      }

      // PDF file
      const pdfFile = formData.get('template_pdf_file') as File | null
      if (pdfFile && pdfFile.size > 0) {
        const pdfFileName = `template-${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`
        const pdfBuffer = await pdfFile.arrayBuffer()
        const { error: pdfError } = await supabaseAdmin.storage
          .from('certificate-templates')
          .upload(pdfFileName, pdfBuffer, {
            contentType: pdfFile.type || 'application/pdf',
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

      // Signature file
      const signatureFile = formData.get('signatory_signature_file') as File | null
      if (signatureFile && signatureFile.size > 0) {
        const signatureFileName = `signature-${Date.now()}-${Math.random().toString(36).substring(7)}.png`
        const signatureBuffer = await signatureFile.arrayBuffer()
        const { error: signatureError } = await supabaseAdmin.storage
          .from('signatures')
          .upload(signatureFileName, signatureBuffer, {
            contentType: signatureFile.type || 'image/png',
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
    } else {
      // Handle JSON body
      const body = await request.json()

      const setField = (key: string, targetKey?: string) => {
        if (body[key] !== undefined) updateData[targetKey || key] = body[key]
      }

      setField('template_name')
      setField('template_description')
      setField('signatory_name')
      setField('signatory_position')
      setField('participant_name_field')
      setField('participant_company_field')
      setField('participant_position_field')
      setField('program_title_field')
      setField('program_date_field')
      setField('completion_date_field')
      setField('trainer_name_field')
      setField('trainer_level_field')
      setField('is_active')
      setField('qr_code_size')
      setField('qr_code_position_x')
      setField('qr_code_position_y')

      if (body.template_fields !== undefined) {
        try {
          updateData.template_fields = typeof body.template_fields === 'string'
            ? JSON.parse(body.template_fields)
            : body.template_fields
        } catch (_) {
          updateData.template_fields = body.template_fields
        }
      }

      // Note: file updates via JSON are not supported; use multipart form-data
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
})

// DELETE /api/admin/certificate-templates/[id] - Delete certificate template
export const DELETE = withAdmin(async (request, auth) => {
  try {
    const supabaseAdmin = getSupabaseAdmin()
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
})
