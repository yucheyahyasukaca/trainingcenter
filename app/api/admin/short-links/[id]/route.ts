import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const { id } = params

    // Check if updating short_code would conflict
    if (body.short_code) {
      const { data: existing, error: existingError } = await supabaseAdmin
        .from('short_links')
        .select('id')
        .eq('short_code', body.short_code)
        .neq('id', id)
        .maybeSingle()

      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError
      }

      if (existing) {
        return NextResponse.json(
          { error: 'Short code already exists' },
          { status: 400 }
        )
      }
    }

    // Update short link
    const { data, error } = await supabaseAdmin
      .from('short_links')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating short link:', error)
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error updating short link:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update short link',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { id } = params

    // Delete short link
    const { error } = await supabaseAdmin
      .from('short_links')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting short link:', error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting short link:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete short link',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
