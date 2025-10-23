import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/referral/user-codes - Get user's referral codes
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // For now, let's get the first user for testing
    // In production, you would get the user from the session
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('role', 'user')
      .limit(1)

    if (userError || !users || users.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: [],
        message: 'No users found' 
      })
    }

    const user = { id: users[0].id }

    // Get user's referral codes
    const { data: codes, error: codesError } = await supabase
      .from('referral_codes')
      .select(`
        id,
        code,
        description,
        max_uses,
        current_uses,
        discount_percentage,
        discount_amount,
        commission_percentage,
        commission_amount,
        is_active,
        valid_until,
        created_at
      `)
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })

    if (codesError) {
      console.error('Error fetching user codes:', codesError)
      return NextResponse.json({ error: 'Failed to fetch referral codes' }, { status: 500 })
    }

    // Get stats for each code
    const codesWithStats = await Promise.all(
      (codes || []).map(async (code) => {
        const { data: trackingData, error: trackingError } = await supabase
          .from('referral_tracking')
          .select('id, status, commission_earned, discount_applied')
          .eq('referral_code_id', code.id)

        if (trackingError) {
          console.error(`Error fetching tracking for code ${code.id}:`, trackingError)
        }

        const totalReferrals = trackingData?.length || 0
        const confirmedReferrals = trackingData?.filter(t => t.status === 'confirmed').length || 0
        const totalCommission = trackingData?.reduce((sum, t) => sum + (t.commission_earned || 0), 0) || 0
        const totalDiscount = trackingData?.reduce((sum, t) => sum + (t.discount_applied || 0), 0) || 0

        return {
          ...code,
          stats: {
            total_referrals: totalReferrals,
            confirmed_referrals: confirmedReferrals,
            total_commission: totalCommission,
            total_discount: totalDiscount
          }
        }
      })
    )

    return NextResponse.json({ 
      success: true,
      data: codesWithStats
    })

  } catch (error) {
    console.error('Error in GET /api/referral/user-codes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/referral/user-codes - Create new user referral code
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // For now, let's get the first user for testing
    // In production, you would get the user from the session
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .eq('role', 'user')
      .limit(1)

    if (userError || !users || users.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 })
    }

    const user = { id: users[0].id }
    const profile = { role: 'user', full_name: users[0].full_name }

    const body = await request.json()
    const {
      description,
      max_uses,
      discount_percentage = 0,
      discount_amount = 0,
      commission_percentage = 0,
      commission_amount = 0,
      valid_until
    } = body

    // Generate referral code using the existing function
    const { data: codeData, error: codeError } = await supabase
      .rpc('create_user_referral_code', {
        p_referrer_id: user.id,
        p_referrer_name: profile.full_name,
        p_description: description,
        p_max_uses: max_uses,
        p_discount_percentage: discount_percentage,
        p_discount_amount: discount_amount,
        p_commission_percentage: commission_percentage,
        p_commission_amount: commission_amount,
        p_valid_until: valid_until
      })

    if (codeError) {
      console.error('Error creating user referral code:', codeError)
      return NextResponse.json({ error: 'Failed to create referral code' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: codeData,
      message: 'Referral code created successfully'
    })

  } catch (error) {
    console.error('Error in POST /api/referral/user-codes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
