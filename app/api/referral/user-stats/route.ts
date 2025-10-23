import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// GET /api/referral/user-stats - Get referral statistics for user
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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ 
        success: false, 
        error: 'User profile not found' 
      }, { status: 404 })
    }

    if (profile.role !== 'user') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. User role required.' 
      }, { status: 403 })
    }

    const userData = { id: profile.id }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all'

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

    // Get all-time stats
    const { data: allTimeStats, error: allTimeError } = await supabase
      .from('referral_tracking')
      .select(`
        id,
        status,
        commission_earned,
        discount_applied,
        created_at
      `)
      .eq('trainer_id', userData.id)

    if (allTimeError) {
      console.error('Error fetching all-time stats:', allTimeError)
    }

    // Get period stats
    const { data: periodStats, error: periodError } = await supabase
      .from('referral_tracking')
      .select(`
        id,
        status,
        commission_earned,
        discount_applied,
        created_at
      `)
      .eq('trainer_id', userData.id)

    if (periodError) {
      console.error('Error fetching period stats:', periodError)
    }

    // Filter period stats by date
    const filteredPeriodStats = periodStats?.filter(stat => {
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

    // Calculate all-time stats
    const totalReferrals = allTimeStats?.length || 0
    const confirmedReferrals = allTimeStats?.filter((s: any) => s.status === 'confirmed').length || 0
    const pendingReferrals = allTimeStats?.filter((s: any) => s.status === 'pending').length || 0
    const cancelledReferrals = allTimeStats?.filter((s: any) => s.status === 'cancelled').length || 0
    const totalCommissionEarned = allTimeStats?.reduce((sum: number, s: any) => sum + (s.commission_earned || 0), 0) || 0
    const confirmedCommission = allTimeStats?.filter((s: any) => s.status === 'confirmed').reduce((sum: number, s: any) => sum + (s.commission_earned || 0), 0) || 0
    const totalDiscountGiven = allTimeStats?.reduce((sum: number, s: any) => sum + (s.discount_applied || 0), 0) || 0

    // Calculate period stats
    const periodTotalReferrals = filteredPeriodStats.length
    const periodConfirmedReferrals = filteredPeriodStats.filter((s: any) => s.status === 'confirmed').length
    const periodPendingReferrals = filteredPeriodStats.filter((s: any) => s.status === 'pending').length
    const periodCancelledReferrals = filteredPeriodStats.filter((s: any) => s.status === 'cancelled').length
    const periodTotalCommissionEarned = filteredPeriodStats.reduce((sum: number, s: any) => sum + (s.commission_earned || 0), 0)
    const periodConfirmedCommission = filteredPeriodStats.filter((s: any) => s.status === 'confirmed').reduce((sum: number, s: any) => sum + (s.commission_earned || 0), 0)
    const periodTotalDiscountGiven = filteredPeriodStats.reduce((sum: number, s: any) => sum + (s.discount_applied || 0), 0)

    // Calculate conversion rate
    const conversionRate = totalReferrals > 0 ? (confirmedReferrals / totalReferrals) * 100 : 0

    // Get recent referrals with participant and program info
    const { data: recentReferrals, error: recentError } = await supabase
      .from('referral_tracking')
      .select(`
        id,
        status,
        commission_earned,
        discount_applied,
        created_at,
        participants!referral_tracking_participant_id_fkey (
          user_profiles!participants_user_id_fkey (
            full_name
          )
        ),
        programs!referral_tracking_program_id_fkey (
          title
        )
      `)
      .eq('trainer_id', userData.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (recentError) {
      console.error('Error fetching recent referrals:', recentError)
    }

    const formattedRecentReferrals = recentReferrals?.map((ref: any) => ({
      id: (ref as any).id,
      participant_name: (ref as any).participants?.user_profiles?.full_name || 'Unknown',
      program_title: (ref as any).programs?.title || 'Unknown Program',
      status: (ref as any).status,
      commission_earned: (ref as any).commission_earned || 0,
      discount_applied: (ref as any).discount_applied || 0,
      created_at: (ref as any).created_at
    })) || []

    const stats = {
      total_referrals: totalReferrals,
      confirmed_referrals: confirmedReferrals,
      pending_referrals: pendingReferrals,
      cancelled_referrals: cancelledReferrals,
      total_commission_earned: totalCommissionEarned,
      confirmed_commission: confirmedCommission,
      total_discount_given: totalDiscountGiven,
      conversion_rate: conversionRate,
      period_stats: {
        total_referrals: periodTotalReferrals,
        confirmed_referrals: periodConfirmedReferrals,
        pending_referrals: periodPendingReferrals,
        cancelled_referrals: periodCancelledReferrals,
        total_commission_earned: periodTotalCommissionEarned,
        confirmed_commission: periodConfirmedCommission,
        total_discount_given: periodTotalDiscountGiven
      },
      recent_referrals: formattedRecentReferrals
    }

    return NextResponse.json({ 
      success: true,
      data: stats,
      period: period
    })

  } catch (error) {
    console.error('Error in GET /api/referral/user-stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
