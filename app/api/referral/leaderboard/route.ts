import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// GET /api/referral/leaderboard - Get referral leaderboard for admin
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
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
    
    if (trainerError || !trainers || trainers.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: [],
        message: 'No trainers found' 
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
        // Get referral tracking data for this trainer
        console.log(`Fetching tracking for trainer: ${trainer.full_name} (${trainer.id})`)
        const { data: trackingData, error: trackingError } = await supabase
          .from('referral_tracking')
          .select(`
            id,
            status,
            commission_earned,
            discount_applied,
            created_at
          `)
          .eq('trainer_id', (trainer as any).id)

        console.log(`Tracking data for ${trainer.full_name}:`, trackingData)

        if (trackingError) {
          console.error(`Error fetching tracking for trainer ${(trainer as any).id}:`, trackingError)
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
            total_referral_codes: 0,
            active_referral_codes: 0,
            conversion_rate: 0,
            last_referral_date: null
          }
        }

        // Filter by period
        const filteredTrackingData = trackingData?.filter(stat => {
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

        // Calculate stats
        const totalReferrals = filteredTrackingData.length
        const confirmedReferrals = filteredTrackingData.filter((s: any) => s.status === 'confirmed').length
        const pendingReferrals = filteredTrackingData.filter((s: any) => s.status === 'pending').length
        const cancelledReferrals = filteredTrackingData.filter((s: any) => s.status === 'cancelled').length
        const totalCommissionEarned = filteredTrackingData.reduce((sum: number, s: any) => sum + (s.commission_earned || 0), 0)
        const confirmedCommission = filteredTrackingData
          .filter((s: any) => s.status === 'confirmed')
          .reduce((sum: number, s: any) => sum + (s.commission_earned || 0), 0)
        const totalDiscountGiven = filteredTrackingData.reduce((sum: number, s: any) => sum + (s.discount_applied || 0), 0)

        // Get referral codes count
        const { data: referralCodes, error: codesError } = await supabase
          .from('referral_codes')
          .select('id, is_active')
          .eq('trainer_id', (trainer as any).id)

        const totalReferralCodes = referralCodes?.length || 0
        const activeReferralCodes = referralCodes?.filter((c: any) => c.is_active).length || 0
        
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
        const lastReferralDate = filteredTrackingData.length > 0        
          ? (filteredTrackingData.sort((a: any, b: any) => new Date((b as any).created_at).getTime() - new Date((a as any).created_at).getTime())[0] as any).created_at                      
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
