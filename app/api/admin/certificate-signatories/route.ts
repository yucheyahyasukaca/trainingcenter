import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// GET - Get all signatories for a template
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('template_id')

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    // Try to get signatories from table
    let signatories: any[] = []
    let tableError: any = null

    try {
      const { data, error } = await supabaseAdmin
        .from('certificate_signatories')
        .select('*')
        .eq('template_id', templateId)
        .order('sign_order', { ascending: true })

      if (error) {
        tableError = error
      } else {
        signatories = data || []
      }
    } catch (e: any) {
      tableError = e
    }

    // Fallback: if table missing or empty, try reading from template.template_fields.signatories
    if (tableError || signatories.length === 0) {
      const { data: templateData, error: tplError } = await supabaseAdmin
        .from('certificate_templates')
        .select('id, template_fields')
        .eq('id', templateId)
        .single()

      if (!tplError && templateData?.template_fields?.signatories && Array.isArray(templateData.template_fields.signatories)) {
        signatories = (templateData.template_fields.signatories as any[]).map((s: any, idx: number) => ({
          id: `${templateId}-${idx + 1}`,
          signatory_name: s.name || s.signatory_name || '',
          signatory_position: s.position || s.signatory_position || '',
          signatory_signature_url: s.signature_url || s.signatory_signature_url || null,
          sign_order: s.sign_order || idx + 1,
          is_active: true
        }))
      }
    }

    return NextResponse.json({
      success: true,
      data: signatories
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/certificate-signatories:', error)
    const errorMessage = error?.message || 'Internal server error'
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 })
  }
}

// POST - Create new signatory (supports multipart form-data with optional signature file)
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const contentType = request.headers.get('content-type') || ''
    let template_id: string | null = null
    let signatory_name: string | null = null
    let signatory_position: string | null = null
    let sign_order: number | null = null
    let signatureUrl: string | null = null

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      template_id = (form.get('template_id') as string) || null
      signatory_name = (form.get('signatory_name') as string) || null
      signatory_position = (form.get('signatory_position') as string) || null
      const orderStr = form.get('sign_order') as string | null
      sign_order = orderStr ? parseInt(orderStr, 10) : null

      const signatureFile = form.get('signature_file') as File | null
      if (signatureFile && signatureFile.size > 0) {
        const fileName = `signature-${Date.now()}-${Math.random().toString(36).slice(2)}.png`
        const buffer = await signatureFile.arrayBuffer()
        const { error: upErr } = await supabaseAdmin.storage
          .from('signatures')
          .upload(fileName, buffer, {
            contentType: signatureFile.type || 'image/png',
            upsert: false
          })
        if (upErr) {
          console.error('Signature upload error:', upErr)
          return NextResponse.json({ error: 'Gagal mengunggah tanda tangan' }, { status: 500 })
        }
        const { data: urlData } = supabaseAdmin.storage
          .from('signatures')
          .getPublicUrl(fileName)
        signatureUrl = urlData.publicUrl
      }
    } else {
      const body = await request.json()
      template_id = body.template_id || null
      signatory_name = body.signatory_name || null
      signatory_position = body.signatory_position || null
      sign_order = body.sign_order || null
      signatureUrl = body.signatory_signature_url || null
    }

    if (!template_id || !signatory_name || !signatory_position) {
      return NextResponse.json({ error: 'Field wajib: template_id, signatory_name, signatory_position' }, { status: 400 })
    }

    // Get current max order for the template jika sign_order tidak diberikan
    let order = sign_order || 1
    if (!sign_order) {
      const { data: existing } = await supabaseAdmin
        .from('certificate_signatories')
        .select('sign_order')
        .eq('template_id', template_id)
        .order('sign_order', { ascending: false })
        .limit(1)

      if (existing && existing.length > 0) {
        order = (existing[0] as any).sign_order + 1
      }
    }

    // Insert new signatory
    const { data, error } = await supabaseAdmin
      .from('certificate_signatories')
      .insert({
        template_id,
        signatory_name,
        signatory_position,
        signatory_signature_url: signatureUrl,
        sign_order: order
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating signatory:', error)
      return NextResponse.json({ error: 'Failed to create signatory' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/certificate-signatories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update signatory
export async function PUT(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Signatory ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { signatory_name, signatory_position, signatory_signature_url, sign_order } = body

    // Update signatory
    const { data, error } = await supabaseAdmin
      .from('certificate_signatories')
      .update({
        signatory_name,
        signatory_position,
        signatory_signature_url,
        sign_order,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating signatory:', error)
      return NextResponse.json({ error: 'Failed to update signatory' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in PUT /api/admin/certificate-signatories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete signatory
export async function DELETE(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Signatory ID is required' }, { status: 400 })
    }

    // Soft delete (set is_active to false)
    const { error } = await supabaseAdmin
      .from('certificate_signatories')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error deleting signatory:', error)
      return NextResponse.json({ error: 'Failed to delete signatory' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Signatory deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/admin/certificate-signatories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
