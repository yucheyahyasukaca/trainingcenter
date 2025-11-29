import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// GET /api/test-admin - Test admin client connection
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing admin client...')
    const supabase = getSupabaseAdmin()
    
    console.log('📊 Trying to fetch user profiles...')
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role')
      .limit(5)
    
    console.log('✅ Query result:', { 
      success: !profilesError, 
      count: profiles?.length || 0,
      error: profilesError 
    })

    if (profilesError) {
      console.error('❌ Profile query error:', profilesError)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to fetch profiles',
        details: profilesError
      }, { status: 500 })
    }

    console.log('📊 Trying to fetch referral codes...')
    const { data: codes, error: codesError } = await supabase
      .from('referral_codes')
      .select('id, code, trainer_id')
      .limit(5)
    
    console.log('✅ Codes result:', { 
      success: !codesError, 
      count: codes?.length || 0,
      error: codesError 
    })

    return NextResponse.json({ 
      success: true,
      data: {
        profiles: profiles || [],
        profileCount: profiles?.length || 0,
        codes: codes || [],
        codeCount: codes?.length || 0
      }
    })

  } catch (error: any) {
    console.error('💥 Error in test-admin:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

