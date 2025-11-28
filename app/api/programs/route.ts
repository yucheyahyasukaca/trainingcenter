import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// GET /api/programs - Get all programs
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Determine requester role (optional - no session is OK for public routes)
    let isPrivileged = false
    try {
      const { data: authData, error: authError } = await (supabase as any).auth.getUser()
      
      // Only check role if we have a valid session
      if (!authError && authData?.user?.id) {
        const userId = authData.user.id
        const { data: profile } = await (supabase as any)
          .from('user_profiles')
          .select('role')
          .eq('id', userId)
          .single()
        isPrivileged = profile?.role === 'admin' || profile?.role === 'manager'
      }
      // If no session, that's fine - user will only see published programs
    } catch (err) {
      // Silently handle auth errors - public route, no session is OK
      // User will only see published programs
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
