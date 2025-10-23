import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/referral/test - Test referral system
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing referral system...')
    
    const supabase = createServerClient()
    console.log('✅ Supabase client created')
    
    // Test auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('🔐 Auth result:', { user: user?.id, error: authError?.message })
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        details: authError?.message 
      }, { status: 401 })
    }

    // Test user profile
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

    // Test referral_codes table
    const { data: codes, error: codesError } = await supabase
      .from('referral_codes')
      .select('id, code, trainer_id')
      .limit(5)
    
    console.log('📋 Referral codes result:', { 
      count: codes?.length, 
      error: codesError?.message 
    })

    // Test trainer_referral_stats view
    const { data: stats, error: statsError } = await supabase
      .from('trainer_referral_stats')
      .select('*')
      .eq('trainer_id', user.id)
      .single()
    
    console.log('📊 Stats result:', { stats, error: statsError?.message })

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
        referral_codes: {
          count: codes?.length || 0,
          sample: codes?.slice(0, 2) || []
        },
        stats: stats || null,
        errors: {
          codes: codesError?.message,
          stats: statsError?.message
        }
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
