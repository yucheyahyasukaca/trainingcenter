import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// GET /api/referral/user-codes - Get user's referral codes
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Get authenticated user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    // Get user profile
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

    if ((profile as any).role !== 'user') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. User role required.' 
      }, { status: 403 })
    }

    const userData = { id: (profile as any).id }

    // Get user's referral codes
    const { data: codes, error: codesError } = await supabase
      .from('referral_codes')
      .select(`
        id,
        code,
        description,
        max_uses,
        current_uses,
        is_active,
        valid_until,
        created_at
      `)
      .eq('trainer_id', userData.id)
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
          .eq('referral_code_id', (code as any).id)

        if (trackingError) {
          console.error(`Error fetching tracking for code ${(code as any).id}:`, trackingError)
        }

        const totalReferrals = trackingData?.length || 0
        const confirmedReferrals = trackingData?.filter((t: any) => t.status === 'confirmed').length || 0
        const totalCommission = trackingData?.reduce((sum: number, t: any) => sum + (t.commission_earned || 0), 0) || 0
        const totalDiscount = trackingData?.reduce((sum: number, t: any) => sum + (t.discount_applied || 0), 0) || 0

        return {
          ...(code as any),
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
      .select('id, role, full_name')
      .eq('id', (user as any).id)
      .single()

    console.log('User profile query result:', { profile, error: profileError?.message })

    if (profileError || !profile) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ 
        error: 'User profile not found',
        details: profileError?.message 
      }, { status: 404 })
    }

    if ((profile as any).role !== 'user') {
      return NextResponse.json({ 
        error: 'Access denied. User role required.' 
      }, { status: 403 })
    }

    // Check if user has full_name
    if (!(profile as any).full_name) {
      console.error('User does not have full_name:', profile)
      return NextResponse.json({ 
        error: 'User profile incomplete. Full name is required.' 
      }, { status: 400 })
    }

    const userData = { id: (profile as any).id }

    const body = await request.json()
    const {
      description,
      max_uses,
      valid_until
    } = body

    // Generate referral code manually
    const generateReferralCode = (trainerName: string): string => {
      const baseCode = trainerName.replace(/\s+/g, '').toUpperCase().substring(0, 3)
      const timestamp = Date.now().toString().slice(-3)
      return `${baseCode}${timestamp}`
    }

    const referralCode = generateReferralCode((profile as any).full_name)
    
    console.log('Creating referral code manually:', {
      trainer_id: userData.id,
      code: referralCode,
      description,
      max_uses: max_uses,
      valid_until: valid_until
    })

    // Insert referral code directly
    const { data: codeData, error: codeError } = await (supabase as any)
      .from('referral_codes')
      .insert({
        trainer_id: userData.id,
        code: referralCode,
        description: description,
        max_uses: max_uses,
        discount_percentage: 0,
        discount_amount: 0,
        commission_percentage: 0,
        commission_amount: 0,
        valid_until: valid_until,
        is_active: true
      })
      .select()
      .single()

    if (codeError) {
      console.error('Error creating user referral code:', codeError)
      return NextResponse.json({ 
        error: 'Failed to create referral code', 
        details: codeError.message,
        code: codeError.code 
      }, { status: 500 })
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
