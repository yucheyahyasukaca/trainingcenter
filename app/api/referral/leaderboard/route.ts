import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// GET /api/referral/leaderboard - Get referral leaderboard for admin
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    // Get all users who have referral codes (not just trainers with role = 'trainer')
    // This includes trainers AND regular users with referral codes
    const { data: referralCodesData } = await supabase
      .from('referral_codes')
      .select('trainer_id')
    
    console.log('Referral codes data:', referralCodesData)
    
    const trainerIds = [...new Set(referralCodesData?.map((r: any) => r.trainer_id) || [])]
    console.log('Unique trainer IDs:', trainerIds)
    
    if (trainerIds.length === 0) {
      console.log('No trainer IDs found')
      return NextResponse.json({ 
        success: true, 
        data: [],
        message: 'No users with referral codes found' 
      })
    }
    
    const { data: trainers, error: trainerError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role')
      .in('id', trainerIds)
    
    console.log('Trainers found:', trainers)
    console.log('Trainer error:', trainerError)
    
    if (trainerError) {
      console.error('Error fetching trainers:', trainerError)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to fetch trainers',
        details: trainerError.message
      }, { status: 500 })
    }
    
    if (!trainers || trainers.length === 0) {
      console.log('No trainers found for the given trainer IDs')
      return NextResponse.json({ 
        success: true, 
        data: [],
        message: 'No trainers found with referral codes' 
      })
    }

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

    // Get detailed stats for each trainer
    const leaderboardData = await Promise.all(
      trainers.map(async (trainer) => {
        // Strategy change:
        // Some deployments have empty referral_tracking due to historical data or RLS.
        // For admin view, compute usage based on enrollments tied to the trainer's referral codes.

        // Fetch this trainer's referral codes first
        const { data: trainerCodes } = await supabase
          .from('referral_codes')
          .select('id, is_active')
          .eq('trainer_id', (trainer as any).id)

        const codeIds = (trainerCodes || []).map((c: any) => c.id)
        const totalReferralCodes = trainerCodes?.length || 0
        const activeReferralCodes = trainerCodes?.filter((c: any) => c.is_active).length || 0

        // If no codes, return zeroed stats
        if (codeIds.length === 0) {
          return {
            trainer_id: (trainer as any).id,
            trainer_name: (trainer as any).full_name,
            trainer_email: (trainer as any).email,
            total_referrals: 0,
            confirmed_referrals: 0,
            pending_referrals: 0,
            cancelled_referrals: 0,
            total_commission_earned: 0,
            confirmed_commission: 0,
            total_discount_given: 0,
            total_referral_codes: totalReferralCodes,
            active_referral_codes: activeReferralCodes,
            conversion_rate: 0,
            last_referral_date: null
          }
        }

        // Pull enrollments that used any of these codes
        const { data: enrollmentsData } = await supabase
          .from('enrollments')
          .select('id, status, created_at')
          .in('referral_code_id', codeIds)

        // Filter by period
        const filteredEnrollments = (enrollmentsData || []).filter((enr: any) => {
          if (period === 'all') return true
          const enrDate = new Date(enr.created_at)
          const now = new Date()
          switch (period) {
            case 'week':
              return enrDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            case 'month':
              return enrDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            case 'year':
              return enrDate >= new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
            default:
              return true
          }
        })

        // Derive stats
        const totalReferrals = filteredEnrollments.length
        const confirmedReferrals = filteredEnrollments.filter((e: any) => e.status === 'approved').length
        const pendingReferrals = filteredEnrollments.filter((e: any) => e.status === 'pending').length
        const cancelledReferrals = filteredEnrollments.filter((e: any) => e.status === 'cancelled').length
        const totalCommissionEarned = 0 // Not derived here; left as 0 to avoid misleading sums
        const confirmedCommission = 0
        const totalDiscountGiven = 0
        
        console.log(`Trainer ${trainer.full_name} stats:`, {
          totalReferrals,
          confirmedReferrals,
          totalCommissionEarned,
          confirmedCommission,
          totalReferralCodes,
          activeReferralCodes
        })

        // Calculate conversion rate
        const conversionRate = totalReferrals > 0 ? (confirmedReferrals / totalReferrals) * 100 : 0

        // Get last referral date
        const lastReferralDate = filteredEnrollments.length > 0
          ? (filteredEnrollments.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] as any).created_at
          : null

        return {
          trainer_id: (trainer as any).id,
          trainer_name: (trainer as any).full_name,
          trainer_email: (trainer as any).email,
          total_referrals: totalReferrals,
          confirmed_referrals: confirmedReferrals,
          pending_referrals: pendingReferrals,
          cancelled_referrals: cancelledReferrals,
          total_commission_earned: totalCommissionEarned,
          confirmed_commission: confirmedCommission,
          total_discount_given: totalDiscountGiven,
          total_referral_codes: totalReferralCodes,
          active_referral_codes: activeReferralCodes,
          conversion_rate: conversionRate,
          last_referral_date: lastReferralDate
        }
      })
    )

    // Sort by confirmed referrals (descending), then by conversion rate
    const sortedLeaderboard = leaderboardData.sort((a, b) => {
      if (b.confirmed_referrals !== a.confirmed_referrals) {
        return b.confirmed_referrals - a.confirmed_referrals
      }
      return b.conversion_rate - a.conversion_rate
    })

    return NextResponse.json({ 
      success: true,
      data: sortedLeaderboard,
      period: period
    })

  } catch (error) {
    console.error('Error in GET /api/referral/leaderboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
