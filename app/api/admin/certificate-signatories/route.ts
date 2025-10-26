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

    // Get signatories for the template
    const { data: signatories, error } = await supabaseAdmin
      .from('certificate_signatories')
      .select('*')
      .eq('template_id', templateId)
      .order('sign_order', { ascending: true })

    if (error) {
      console.error('Error fetching signatories:', error)
      return NextResponse.json({ error: 'Failed to fetch signatories' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: signatories || []
    })
  } catch (error) {
    console.error('Error in GET /api/admin/certificate-signatories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new signatory
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const { template_id, signatory_name, signatory_position, signatory_signature_url, sign_order } = body

    if (!template_id || !signatory_name || !signatory_position) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get current max order for the template
    let order = sign_order || 1
    if (!sign_order) {
      const { data: existingSignatories } = await supabaseAdmin
        .from('certificate_signatories')
        .select('sign_order')
        .eq('template_id', template_id)
        .order('sign_order', { ascending: false })
        .limit(1)

      if (existingSignatories && existingSignatories.length > 0) {
        order = existingSignatories[0].sign_order + 1
      }
    }

    // Insert new signatory
    const { data, error } = await supabaseAdmin
      .from('certificate_signatories')
      .insert({
        template_id,
        signatory_name,
        signatory_position,
        signatory_signature_url: signatory_signature_url || null,
        sign_order: order
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating signatory:', error)
      return NextResponse.json({ error: 'Failed to create signatory' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data
    }, { status: 201 })
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

    return NextResponse.json({
      success: true,
      data
    })
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

    return NextResponse.json({
      success: true,
      message: 'Signatory deleted successfully'
    })
  } catch (error) {
    console.error('Error in DELETE /api/admin/certificate-signatories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
