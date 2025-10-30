import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// GET /api/programs - Get all programs
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Determine requester role
    const { data: authData, error: authError } = await (supabase as any).auth.getUser()
    if (authError) {
      console.error('Error getting auth user:', authError)
    }

    let isPrivileged = false
    const userId = authData?.user?.id
    if (userId) {
      const { data: profile } = await (supabase as any)
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single()
      isPrivileged = profile?.role === 'admin' || profile?.role === 'manager'
    }

    // Admin/manager can see all programs; others only published
    const query = (supabase as any)
      .from('programs')
      .select('id, title, price, description, status')
      .order('created_at', { ascending: false })

    if (!isPrivileged) {
      query.eq('status', 'published')
    }

    const { data: programs, error } = await query

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
