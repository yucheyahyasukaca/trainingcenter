import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// GET /api/referral/user-leaderboard - Get user referral leaderboard for admin
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get all users who have referral codes (not just role = 'user')
    // This includes all users (with any role) who have referral codes
    const { data: referralCodesData } = await supabase
      .from('referral_codes')
      .select('trainer_id')
    
    const trainerIds = [...new Set(referralCodesData?.map((r: any) => r.trainer_id) || [])]
    
    if (trainerIds.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: [],
        message: 'No users with referral codes found' 
      })
    }
    
    // Only include regular users; exclude trainers/managers from this list
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role')
      .in('id', trainerIds)
      .eq('role', 'user')
    
    if (userError || !users || users.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: [],
        message: 'No users found' 
      })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all'

    // Get detailed stats for each user
    const leaderboardData = await Promise.all(
      users.map(async (user) => {
        // Get referral tracking data for this user
        const { data: trackingData, error: trackingError } = await supabase
          .from('referral_tracking')
          .select(`
            id,
            status,
            commission_earned,
            discount_applied,
            created_at
          `)
          .eq('trainer_id', (user as any).id)

        if (trackingError) {
          console.error(`Error fetching tracking for user ${(user as any).id}:`, trackingError)
          return {
            user_id: (user as any).id,
            user_name: (user as any).full_name,
            user_email: (user as any).email,
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
          .eq('trainer_id', (user as any).id)

        const totalReferralCodes = referralCodes?.length || 0
        const activeReferralCodes = referralCodes?.filter((c: any) => c.is_active).length || 0

        // Calculate conversion rate
        const conversionRate = totalReferrals > 0 ? (confirmedReferrals / totalReferrals) * 100 : 0

        // Get last referral date
        const lastReferralDate = filteredTrackingData.length > 0        
          ? (filteredTrackingData.sort((a: any, b: any) => new Date((b as any).created_at).getTime() - new Date((a as any).created_at).getTime())[0] as any).created_at                      
          : null

        return {
          user_id: (user as any).id,
          user_name: (user as any).full_name,
          user_email: (user as any).email,
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
    console.error('Error in GET /api/referral/user-leaderboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
