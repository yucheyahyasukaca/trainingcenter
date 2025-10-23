import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/programs - Get all programs
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Get all programs
    const { data: programs, error } = await supabase
      .from('programs')
      .select('id, title, price, description, status')
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching programs:', error)
      return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: programs || []
    })

  } catch (error) {
    console.error('Error in GET /api/programs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
