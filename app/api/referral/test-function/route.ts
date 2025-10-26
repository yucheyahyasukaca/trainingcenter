import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// GET /api/referral/test-function - Test the create_trainer_referral_code function
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing create_trainer_referral_code function...')
    
    const supabase = createServerClient()
    console.log('✅ Supabase client created')
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        details: authError?.message 
      }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role, full_name')
      .eq('id', user.id)
      .single()
    
    console.log('👤 Profile result:', { profile, error: profileError?.message })

    if (profileError) {
      return NextResponse.json({ 
        error: 'Profile not found', 
        details: profileError.message 
      }, { status: 404 })
    }

    // Test the function with minimal data
    console.log('🧪 Testing create_trainer_referral_code function...')
    const { data: codeData, error: codeError } = await (supabase as any)
      .rpc('create_trainer_referral_code', {
        p_trainer_id: (profile as any).id,
        p_description: 'Test referral code',
        p_max_uses: 10,
        p_discount_percentage: 0,
        p_discount_amount: 0,
        p_commission_percentage: 0,
        p_commission_amount: 0,
        p_valid_until: null
      })

    console.log('📋 Function result:', { codeData, error: codeError?.message })

    if (codeError) {
      return NextResponse.json({ 
        error: 'Function failed', 
        details: codeError.message,
        code: codeError.code
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email
        },
        profile: {
          id: (profile as any).id,
          role: (profile as any).role,
          full_name: (profile as any).full_name
        },
        function_result: codeData
      }
    })

  } catch (error: any) {
    console.error('❌ Test error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
