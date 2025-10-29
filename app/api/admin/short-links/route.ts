import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    // Fetch all short links
    const { data, error } = await supabaseAdmin
      .from('short_links')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching short links:', error)
      return NextResponse.json(
        { 
          error: 'Failed to fetch short links',
          details: error.message
        },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Error fetching short links:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch short links',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const { short_code, destination_url, description, expires_at, created_by } = body

    if (!short_code || !destination_url) {
      return NextResponse.json(
        { error: 'Short code and destination URL are required' },
        { status: 400 }
      )
    }

    // Check if short_code already exists
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('short_links')
      .select('id')
      .eq('short_code', short_code)
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

    // Insert new short link
    const { data, error } = await supabaseAdmin
      .from('short_links')
      .insert({
        short_code,
        destination_url,
        description: description || null,
        expires_at: expires_at || null,
        created_by: created_by || null,
        is_active: true,
        click_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating short link:', error)
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error creating short link:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create short link',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
