import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// GET /api/test-rls - Test RLS policies
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing RLS policies...')
    const supabase = createServerClient()
    
    // Test 1: Get current user/session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    console.log('Session:', { hasSession: !!sessionData?.session, error: sessionError })
    
    // Test 2: Try to query user_profiles without auth
    console.log('📊 Testing user_profiles query...')
    const { data: profiles, error: profilesError, count } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .limit(1)
    
    console.log('Result:', { 
      success: !profilesError, 
      count,
      hasData: !!profiles,
      dataLength: profiles?.length || 0,
      error: profilesError 
    })

    return NextResponse.json({ 
      success: true,
      session: {
        exists: !!sessionData?.session,
        user: sessionData?.session?.user?.email || null
      },
      query: {
        success: !profilesError,
        count,
        hasData: !!profiles,
        dataLength: profiles?.length || 0,
        error: profilesError?.message || null,
        errorDetails: profilesError
      }
    })

  } catch (error: any) {
    console.error('💥 Error in test-rls:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

