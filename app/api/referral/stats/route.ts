import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/referral/stats - Get referral statistics for trainer
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // For now, let's get the first trainer for testing
    // In production, you would get the user from the session
    const { data: trainers, error: trainerError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('role', 'trainer')
      .limit(1)
    
    if (trainerError || !trainers || trainers.length === 0) {
      return NextResponse.json({ error: 'No trainers found' }, { status: 404 })
    }
    
    const user = { id: trainers[0].id }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'trainer') {
      return NextResponse.json({ error: 'Access denied. Trainer role required.' }, { status: 403 })
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
      .eq('trainer_id', user.id)
      .single()

    if (statsError) {
      console.error('Error fetching trainer stats:', statsError)
      return NextResponse.json({ error: 'Failed to fetch referral statistics' }, { status: 500 })
    }

    // Get detailed referral tracking with date filter
    const { data: detailedStats, error: detailedError } = await supabase
      .from('referral_tracking')
      .select(`
        id,
        status,
        commission_earned,
        discount_applied,
        created_at,
        program:programs(
          id,
          title,
          price
        ),
        participant:participants(
          id,
          name,
          email
        )
      `)
      .eq('trainer_id', user.id)
      .order('created_at', { ascending: false })

    if (detailedError) {
      console.error('Error fetching detailed stats:', detailedError)
      return NextResponse.json({ error: 'Failed to fetch detailed statistics' }, { status: 500 })
    }

    // Filter detailed stats by period
    const filteredDetailedStats = detailedStats?.filter(stat => {
      if (period === 'all') return true
      
      const statDate = new Date(stat.created_at)
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
      confirmed_referrals: filteredDetailedStats.filter(s => s.status === 'confirmed').length,
      pending_referrals: filteredDetailedStats.filter(s => s.status === 'pending').length,
      cancelled_referrals: filteredDetailedStats.filter(s => s.status === 'cancelled').length,
      total_commission: filteredDetailedStats.reduce((sum, s) => sum + (s.commission_earned || 0), 0),
      confirmed_commission: filteredDetailedStats
        .filter(s => s.status === 'confirmed')
        .reduce((sum, s) => sum + (s.commission_earned || 0), 0),
      total_discount: filteredDetailedStats.reduce((sum, s) => sum + (s.discount_applied || 0), 0)
    }

    // Get recent referrals (last 10)
    const recentReferrals = filteredDetailedStats.slice(0, 10).map(stat => ({
      id: stat.id,
      participant_name: stat.participant?.name,
      participant_email: stat.participant?.email,
      program_title: stat.program?.title,
      program_price: stat.program?.price,
      status: stat.status,
      commission_earned: stat.commission_earned,
      discount_applied: stat.discount_applied,
      created_at: stat.created_at
    }))

    // Get program-wise statistics
    const programStats = filteredDetailedStats.reduce((acc, stat) => {
      const programId = stat.program?.id
      const programTitle = stat.program?.title
      
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
      if (stat.status === 'confirmed') {
        acc[programId].confirmed_referrals++
      }
      acc[programId].total_commission += stat.commission_earned || 0
      acc[programId].total_discount += stat.discount_applied || 0
      
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
        const statDate = new Date(stat.created_at)
        return statDate >= monthStart && statDate <= monthEnd
      })
      
      return {
        month: date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
        referrals: monthStats.length,
        confirmed: monthStats.filter(s => s.status === 'confirmed').length,
        commission: monthStats
          .filter(s => s.status === 'confirmed')
          .reduce((sum, s) => sum + (s.commission_earned || 0), 0)
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
