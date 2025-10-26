import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/admin/certificate-requirements - Get certificate requirements
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const programId = searchParams.get('program_id')
    const isActive = searchParams.get('is_active')

    let query = supabaseAdmin
      .from('certificate_requirements')
      .select(`
        *,
        programs:program_id (
          id,
          title,
          category
        )
      `)

    // If ID is provided, fetch single requirement
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
      console.error('Error fetching certificate requirements:', error)
      return NextResponse.json({ error: 'Failed to fetch certificate requirements' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in GET /api/admin/certificate-requirements:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/certificate-requirements - Create certificate requirement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      program_id,
      requirement_type,
      requirement_value,
      requirement_description,
      is_active = true
    } = body

    // Validate required fields
    if (!program_id || !requirement_type || requirement_value === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate requirement type
    const validTypes = ['completion_percentage', 'min_participants', 'min_pass_rate', 'all_activities']
    if (!validTypes.includes(requirement_type)) {
      return NextResponse.json({ error: 'Invalid requirement type' }, { status: 400 })
    }

    // Validate requirement value
    if (requirement_value < 0 || requirement_value > 100) {
      return NextResponse.json({ error: 'Requirement value must be between 0 and 100' }, { status: 400 })
    }

    // Create certificate requirement
    const { data: requirementData, error: requirementError } = await supabaseAdmin
      .from('certificate_requirements')
      .insert({
        program_id,
        requirement_type,
        requirement_value,
        requirement_description,
        is_active
      })
      .select()
      .single()

    if (requirementError) {
      console.error('Error creating certificate requirement:', requirementError)
      return NextResponse.json({ error: 'Failed to create certificate requirement' }, { status: 500 })
    }

    return NextResponse.json({ data: requirementData })
  } catch (error) {
    console.error('Error in POST /api/admin/certificate-requirements:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/certificate-requirements/[id] - Update certificate requirement
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const requirementId = searchParams.get('id')
    
    if (!requirementId) {
      return NextResponse.json({ error: 'Requirement ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const {
      requirement_type,
      requirement_value,
      requirement_description,
      is_active
    } = body

    // Validate requirement type if provided
    if (requirement_type) {
      const validTypes = ['completion_percentage', 'min_participants', 'min_pass_rate', 'all_activities']
      if (!validTypes.includes(requirement_type)) {
        return NextResponse.json({ error: 'Invalid requirement type' }, { status: 400 })
      }
    }

    // Validate requirement value if provided
    if (requirement_value !== undefined) {
      if (requirement_value < 0 || requirement_value > 100) {
        return NextResponse.json({ error: 'Requirement value must be between 0 and 100' }, { status: 400 })
      }
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (requirement_type !== undefined) updateData.requirement_type = requirement_type
    if (requirement_value !== undefined) updateData.requirement_value = requirement_value
    if (requirement_description !== undefined) updateData.requirement_description = requirement_description
    if (is_active !== undefined) updateData.is_active = is_active

    // Update certificate requirement
    const { data: requirementData, error: requirementError } = await supabaseAdmin
      .from('certificate_requirements')
      .update(updateData)
      .eq('id', requirementId)
      .select()
      .single()

    if (requirementError) {
      console.error('Error updating certificate requirement:', requirementError)
      return NextResponse.json({ error: 'Failed to update certificate requirement' }, { status: 500 })
    }

    return NextResponse.json({ data: requirementData })
  } catch (error) {
    console.error('Error in PUT /api/admin/certificate-requirements:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/certificate-requirements/[id] - Delete certificate requirement
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const requirementId = searchParams.get('id')
    
    if (!requirementId) {
      return NextResponse.json({ error: 'Requirement ID is required' }, { status: 400 })
    }

    // Delete certificate requirement
    const { error: deleteError } = await supabaseAdmin
      .from('certificate_requirements')
      .delete()
      .eq('id', requirementId)

    if (deleteError) {
      console.error('Error deleting certificate requirement:', deleteError)
      return NextResponse.json({ error: 'Failed to delete certificate requirement' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Certificate requirement deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/admin/certificate-requirements:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
