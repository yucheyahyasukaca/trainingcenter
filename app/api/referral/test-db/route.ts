import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/referral/test-db - Test database connection and tables
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing database connection...')
    
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

    // Test user_profiles table
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

    // Test referral_codes table exists
    const { data: codes, error: codesError } = await supabase
      .from('referral_codes')
      .select('id, code, trainer_id')
      .limit(1)
    
    console.log('📋 Referral codes table test:', { 
      count: codes?.length, 
      error: codesError?.message 
    })

    // Test inserting a simple record
    const testCode = `TEST${Date.now().toString().slice(-3)}`
    const { data: insertData, error: insertError } = await (supabase as any)      
      .from('referral_codes')
      .insert({
        trainer_id: (profile as any).id,
        code: testCode,
        description: 'Test code',
        is_active: true
      })
      .select()
      .single()

    console.log('📝 Insert test result:', { insertData, error: insertError?.message })

    // Clean up test record
    if (insertData) {
      await supabase
        .from('referral_codes')
        .delete()
        .eq('id', insertData.id)
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
        table_tests: {
          referral_codes_read: !codesError,
          referral_codes_write: !insertError,
          errors: {
            read: codesError?.message,
            write: insertError?.message
          }
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
