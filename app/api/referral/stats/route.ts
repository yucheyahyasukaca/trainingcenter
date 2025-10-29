import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// GET /api/referral/stats - Get referral statistics for trainer
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ 
        success: false,
        error: 'Authentication failed',
        details: authError.message
      }, { status: 401 })
    }
    
    if (!user) {
      console.error('No user found in session')
      return NextResponse.json({ 
        success: false,
        error: 'Auth session missing! Please login again.',
        details: 'No authenticated user found in the current session'
      }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('id', (user as any).id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ 
        success: false,
        error: 'User profile not found' 
      }, { status: 404 })
    }

    if ((profile as any).role !== 'trainer') {
      return NextResponse.json({ 
        success: false,
        error: 'Access denied. Trainer role required.' 
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all' // all, month, week, year

    // Build date filter based on period
    let dateFilter = ''
    const now = new Date()
    
    switch (period) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        dateFilter = `rt.created_at >= '${weekAgo.toISOString()}'`
        break
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        dateFilter = `rt.created_at >= '${monthAgo.toISOString()}'`
        break
      case 'year':
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        dateFilter = `rt.created_at >= '${yearAgo.toISOString()}'`
        break
      default:
        dateFilter = 'true'
    }

    // Get trainer referral statistics using the view
    const { data: stats, error: statsError } = await supabase
      .from('trainer_referral_stats')
      .select('*')
      .eq('trainer_id', (profile as any).id)
      .single()

    if (statsError) {
      console.error('Error fetching trainer stats:', statsError)
      return NextResponse.json({ error: 'Failed to fetch referral statistics' }, { status: 500 })
    }

    // Get detailed referral tracking with date filter
    const { data: referralTrackingData, error: referralTrackingError } = await supabase
      .from('referral_tracking')
      .select(`
        id,
        status,
        commission_earned,
        discount_applied,
        created_at,
        participant_id,
        program:programs(
          id,
          title,
          price
        )
      `)
      .eq('trainer_id', (profile as any).id)
      .order('created_at', { ascending: false })

    if (referralTrackingError) {
      console.error('Error fetching detailed stats:', referralTrackingError)
      return NextResponse.json({ error: 'Failed to fetch detailed statistics' }, { status: 500 })
    }

    // Get unique participant IDs
    const participantIds = [...new Set((referralTrackingData || []).map((rt: any) => rt.participant_id).filter(Boolean))]
    
    let participantsMap = new Map()
    if (participantIds.length > 0) {
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select('id, name, email')
        .in('id', participantIds)

      if (participantsError) {
        console.error('Error fetching participants:', participantsError)
      } else {
        participantsMap = new Map((participantsData || []).map(p => [p.id, p]))
      }
    }

    // Map participants to referral tracking
    const detailedStats = (referralTrackingData || []).map((rt: any) => ({
      ...rt,
      participant: participantsMap.get(rt.participant_id) || null
    }))

    // Filter detailed stats by period
    const filteredDetailedStats = detailedStats?.filter(stat => {
      if (period === 'all') return true
      
      const statDate = new Date((stat as any).created_at)
      const now = new Date()
      
      switch (period) {
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return statDate >= weekAgo
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          return statDate >= monthAgo
        case 'year':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          return statDate >= yearAgo
        default:
          return true
      }
    }) || []

    // Calculate period-specific stats
    const periodStats = {
      total_referrals: filteredDetailedStats.length,
      confirmed_referrals: filteredDetailedStats.filter((s: any) => s.status === 'confirmed').length,
      pending_referrals: filteredDetailedStats.filter((s: any) => s.status === 'pending').length,
      cancelled_referrals: filteredDetailedStats.filter((s: any) => s.status === 'cancelled').length,
      total_commission: filteredDetailedStats.reduce((sum: number, s: any) => sum + (s.commission_earned || 0), 0),
      confirmed_commission: filteredDetailedStats
        .filter((s: any) => s.status === 'confirmed')
        .reduce((sum: number, s: any) => sum + (s.commission_earned || 0), 0),
      total_discount: filteredDetailedStats.reduce((sum: number, s: any) => sum + (s.discount_applied || 0), 0)
    }

    // Get recent referrals (last 10)
    const recentReferrals = filteredDetailedStats.slice(0, 10).map(stat => ({
      id: (stat as any).id,
      participant_name: (stat as any).participant?.name,
      participant_email: (stat as any).participant?.email,
      program_title: (stat as any).program?.title,
      program_price: (stat as any).program?.price,
      status: (stat as any).status,
      commission_earned: (stat as any).commission_earned,
      discount_applied: (stat as any).discount_applied,
      created_at: (stat as any).created_at
    }))

    // Get program-wise statistics
    const programStats = filteredDetailedStats.reduce((acc, stat) => {
      const programId = (stat as any).program?.id
      const programTitle = (stat as any).program?.title
      
      if (!acc[programId]) {
        acc[programId] = {
          program_id: programId,
          program_title: programTitle,
          total_referrals: 0,
          confirmed_referrals: 0,
          total_commission: 0,
          total_discount: 0
        }
      }
      
      acc[programId].total_referrals++
      if ((stat as any).status === 'confirmed') {
        acc[programId].confirmed_referrals++
      }
      acc[programId].total_commission += (stat as any).commission_earned || 0
      acc[programId].total_discount += (stat as any).discount_applied || 0
      
      return acc
    }, {} as Record<string, any>)

    const programStatsArray = Object.values(programStats)

    // Get monthly commission trend (last 12 months)
    const monthlyTrend = Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      const monthStats = filteredDetailedStats.filter(stat => {
        const statDate = new Date((stat as any).created_at)
        return statDate >= monthStart && statDate <= monthEnd
      })
      
      return {
        month: date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
        referrals: monthStats.length,
        confirmed: monthStats.filter((s: any) => s.status === 'confirmed').length,
        commission: monthStats
          .filter((s: any) => s.status === 'confirmed')
          .reduce((sum: number, s: any) => sum + (s.commission_earned || 0), 0)
      }
    }).reverse()

    return NextResponse.json({ 
      success: true,
      data: {
        overall_stats: stats || {
          total_referrals: 0,
          confirmed_referrals: 0,
          pending_referrals: 0,
          cancelled_referrals: 0,
          total_commission_earned: 0,
          confirmed_commission: 0,
          total_discount_given: 0,
          total_referral_codes: 0,
          active_referral_codes: 0
        },
        period_stats: periodStats,
        recent_referrals: recentReferrals,
        program_stats: programStatsArray,
        monthly_trend: monthlyTrend,
        period: period
      }
    })

  } catch (error) {
    console.error('Error in GET /api/referral/stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
