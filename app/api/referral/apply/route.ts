import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// POST /api/referral/apply - Apply referral code during enrollment
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { referral_code, program_id } = body

    if (!referral_code || !program_id) {
      return NextResponse.json({ 
        error: 'Referral code and program ID are required' 
      }, { status: 400 })
    }

    // Get participant ID for current user
    const { data: participant, error: participantLookupError } = await supabase
      .from('participants')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (participantLookupError || !participant) {
      return NextResponse.json({ 
        error: 'Participant profile not found. Please complete your profile first.' 
      }, { status: 404 })
    }

    // Apply referral code using database function
    const { data: result, error: applyError } = await (supabase as any)
      .rpc('apply_referral_code', {
        p_referral_code: referral_code,
        p_program_id: program_id,
        p_participant_id: (participant as any).id
      })

    if (applyError) {
      console.error('Error applying referral code:', applyError)
      return NextResponse.json({ 
        error: 'Failed to apply referral code' 
      }, { status: 500 })
    }

    if (!result || result.length === 0) {
      return NextResponse.json({ 
        error: 'No result returned from referral code application' 
      }, { status: 500 })
    }

    const applyResult = result[0]

    if (!applyResult.success) {
      return NextResponse.json({ 
        error: applyResult.message,
        success: false 
      }, { status: 400 })
    }

    // Get program details to calculate final price
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('price, title')
      .eq('id', program_id)
      .single()

    if (programError || !program) {
      return NextResponse.json({ 
        error: 'Program not found' 
      }, { status: 404 })
    }

    const originalPrice = (program as any).price
    const discountAmount = applyResult.discount_amount
    const finalPrice = Math.max(0, originalPrice - discountAmount)

    return NextResponse.json({ 
      success: true,
      data: {
        referral_code_id: applyResult.referral_code_id,
        original_price: originalPrice,
        discount_amount: discountAmount,
        final_price: finalPrice,
        commission_amount: applyResult.commission_amount,
        program_title: (program as any).title
      },
      message: applyResult.message
    })

  } catch (error) {
    console.error('Error in POST /api/referral/apply:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/referral/apply?code=REF123&program_id=uuid - Validate referral code
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const referral_code = searchParams.get('code')
    const program_id = searchParams.get('program_id')

    if (!referral_code || !program_id) {
      return NextResponse.json({ 
        error: 'Referral code and program ID are required' 
      }, { status: 400 })
    }

    // Get referral code details
    const { data: refCode, error: refCodeError } = await supabase
      .from('referral_codes')
      .select(`
        *,
        trainer:user_profiles(
          id,
          full_name,
          email
        )
      `)
      .eq('code', referral_code)
      .eq('is_active', true)
      .single()

    if (refCodeError || !refCode) {
      return NextResponse.json({ 
        error: 'Referral code not found or inactive',
        valid: false 
      }, { status: 404 })
    }

    // Check if code is still valid
    const now = new Date()
    const validFrom = new Date((refCode as any).valid_from)
    const validUntil = (refCode as any).valid_until ? new Date((refCode as any).valid_until) : null

    if (now < validFrom) {
      return NextResponse.json({ 
        error: 'Referral code is not yet valid',
        valid: false 
      }, { status: 400 })
    }

    if (validUntil && now > validUntil) {
      return NextResponse.json({ 
        error: 'Referral code has expired',
        valid: false 
      }, { status: 400 })
    }

    // Check usage limits
    if ((refCode as any).max_uses && (refCode as any).current_uses >= (refCode as any).max_uses) {
      return NextResponse.json({ 
        error: 'Referral code has reached maximum usage limit',
        valid: false 
      }, { status: 400 })
    }

    // Get program details
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('price, title')
      .eq('id', program_id)
      .single()

    if (programError || !program) {
      return NextResponse.json({ 
        error: 'Program not found' 
      }, { status: 404 })
    }

    // Calculate discount
    let discountAmount = 0
    if ((refCode as any).discount_percentage > 0) {
      discountAmount = ((program as any).price * (refCode as any).discount_percentage / 100)
    } else if ((refCode as any).discount_amount > 0) {
      discountAmount = (refCode as any).discount_amount
    }

    const finalPrice = Math.max(0, (program as any).price - discountAmount)

    return NextResponse.json({ 
      success: true,
      valid: true,
      data: {
        referral_code: (refCode as any).code,
        trainer_name: (refCode as any).trainer.full_name,
        trainer_email: (refCode as any).trainer.email,
        description: (refCode as any).description,
        original_price: (program as any).price,
        discount_amount: discountAmount,
        final_price: finalPrice,
        discount_type: (refCode as any).discount_percentage > 0 ? 'percentage' : 'amount',
        discount_value: (refCode as any).discount_percentage > 0 ? (refCode as any).discount_percentage : (refCode as any).discount_amount,
        remaining_uses: (refCode as any).max_uses ? (refCode as any).max_uses - (refCode as any).current_uses : null,
        valid_until: (refCode as any).valid_until,
        program_title: (program as any).title
      }
    })

  } catch (error) {
    console.error('Error in GET /api/referral/apply:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
