import { NextRequest, NextResponse } from 'next/server'

// GET /api/referral/mock - Mock referral code creation for testing
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Mock referral code creation...')
    
    // Mock user data
    const mockUser = {
      id: 'd0954ef1-30c7-4360-be95-7207988c4b5a',
      email: 'yucheyahya@gmail.com',
      role: 'user'
    }

    // Mock referral code data
    const mockReferralCode = {
      id: 'mock-code-id-123',
      code: 'YUC001',
      description: 'Test referral code',
      max_uses: 10,
      current_uses: 0,
      is_active: true,
      valid_until: null,
      created_at: new Date().toISOString(),
      trainer_id: mockUser.id,
      stats: {
        total_referrals: 0,
        confirmed_referrals: 0,
        total_commission: 0,
        total_discount: 0
      }
    }

    return NextResponse.json({ 
      success: true,
      data: mockReferralCode,
      message: 'Mock referral code created successfully'
    })

  } catch (error: any) {
    console.error('❌ Mock error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// POST /api/referral/mock - Mock referral code creation
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Mock referral code creation...')
    
    const body = await request.json()
    const { description, max_uses, valid_until } = body

    // Mock referral code data
    const mockReferralCode = {
      id: `mock-code-${Date.now()}`,
      code: `MOCK${Date.now().toString().slice(-3)}`,
      description: description || 'Mock referral code',
      max_uses: max_uses || null,
      current_uses: 0,
      is_active: true,
      valid_until: valid_until || null,
      created_at: new Date().toISOString(),
      trainer_id: 'd0954ef1-30c7-4360-be95-7207988c4b5a'
    }

    return NextResponse.json({ 
      success: true,
      data: mockReferralCode,
      message: 'Mock referral code created successfully'
    })

  } catch (error: any) {
    console.error('❌ Mock error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
