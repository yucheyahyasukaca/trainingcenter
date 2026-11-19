import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { validateAuth, isAdminRole, maskEmailsDeep } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

// GET /api/referral/leaderboard - Get referral leaderboard for admin
export async function GET(request: NextRequest) {
  try {
    let viewer
    try { viewer = await validateAuth(request) } catch { return NextResponse.json({ error: 'Silakan login terlebih dahulu' }, { status: 401 }) }
    const isAdmin = isAdminRole(viewer.profile.role)
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const period = searchParams.get('period') || 'all'
    const search = searchParams.get('search') || ''
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50') || 50, 1), 200)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0') || 0, 0)

    // Use the optimized database function
    const { data: leaderboardData, error } = await supabase
      .rpc('get_referral_leaderboard', {
        p_period: period,
        p_search: search,
        p_limit: limit,
        p_offset: offset
      })

    if (error) {
      console.error('Error fetching leaderboard:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: isAdmin ? (leaderboardData || []) : maskEmailsDeep(leaderboardData || []),
      period: period
    })

  } catch (error) {
    console.error('Error in GET /api/referral/leaderboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
