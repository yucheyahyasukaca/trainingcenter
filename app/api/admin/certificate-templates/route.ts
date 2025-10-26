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
      .order('created_at', { ascending: false })

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
    const body = await request.json()
    const {
      program_id,
      template_name,
      template_description,
      template_pdf_file,
      template_fields,
      signatory_name,
      signatory_position,
      signatory_signature_file,
      participant_name_field,
      participant_company_field,
      participant_position_field,
      program_title_field,
      program_date_field,
      completion_date_field,
      trainer_name_field,
      trainer_level_field
    } = body

    // Validate required fields
    if (!program_id || !template_name || !template_pdf_file) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Upload PDF template to storage
    const pdfFileName = `template-${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`
    const { data: pdfData, error: pdfError } = await supabaseAdmin.storage
      .from('certificate-templates')
      .upload(pdfFileName, template_pdf_file, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (pdfError) {
      console.error('Error uploading PDF template:', pdfError)
      return NextResponse.json({ error: 'Failed to upload PDF template' }, { status: 500 })
    }

    // Get PDF URL
    const { data: pdfUrlData } = supabaseAdmin.storage
      .from('certificate-templates')
      .getPublicUrl(pdfFileName)

    let signatureUrl = null
    if (signatory_signature_file) {
      // Upload signature image to storage
      const signatureFileName = `signature-${Date.now()}-${Math.random().toString(36).substring(7)}.png`
      const { data: signatureData, error: signatureError } = await supabaseAdmin.storage
        .from('signatures')
        .upload(signatureFileName, signatory_signature_file, {
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
        template_fields: template_fields || {},
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
        created_by: body.user_id // This should be passed from the authenticated user
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
      template_name: body.template_name,
      template_description: body.template_description,
      template_fields: body.template_fields,
      signatory_name: body.signatory_name,
      signatory_position: body.signatory_position,
      participant_name_field: body.participant_name_field,
      participant_company_field: body.participant_company_field,
      participant_position_field: body.participant_position_field,
      program_title_field: body.program_title_field,
      program_date_field: body.program_date_field,
      completion_date_field: body.completion_date_field,
      trainer_name_field: body.trainer_name_field,
      trainer_level_field: body.trainer_level_field,
      is_active: body.is_active,
      updated_at: new Date().toISOString()
    }

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
