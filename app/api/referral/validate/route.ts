import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// POST /api/referral/validate - Validate referral code
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const body = await request.json()
    const { referral_code, program_id } = body

    if (!referral_code || !program_id) {
      return NextResponse.json({ 
        success: false,
        error: 'Referral code and program ID are required' 
      }, { status: 400 })
    }

    // Get referral code details
    const { data: codeData, error: codeError } = await supabase
      .from('referral_codes')
      .select(`
        id,
        code,
        description,
        discount_percentage,
        discount_amount,
        valid_until,
        is_active,
        max_uses,
        current_uses,
        user_profiles!referral_codes_trainer_id_fkey (
          full_name
        )
      `)
      .eq('code', referral_code.toUpperCase())
      .eq('is_active', true)
      .single()

    if (codeError || !codeData) {
      return NextResponse.json({ 
        success: false,
        error: 'Kode referral tidak ditemukan atau tidak aktif' 
      })
    }

    // Check if code is still valid
    const now = new Date()
    if ((codeData as any).valid_until && new Date((codeData as any).valid_until) < now) {
      return NextResponse.json({ 
        success: false,
        error: 'Kode referral sudah tidak berlaku' 
      })
    }

    // Check usage limit
    if ((codeData as any).max_uses && (codeData as any).current_uses >= (codeData as any).max_uses) {
      return NextResponse.json({ 
        success: false,
        error: 'Kode referral sudah mencapai batas penggunaan' 
      })
    }

    // Format response
    const formattedCode = {
      id: (codeData as any).id,
      code: (codeData as any).code,
      description: (codeData as any).description,
      discount_percentage: (codeData as any).discount_percentage,
      discount_amount: (codeData as any).discount_amount,
      valid_until: (codeData as any).valid_until,
      trainer_name: (codeData as any).user_profiles?.full_name || 'Unknown'
    }

    return NextResponse.json({ 
      success: true,
      data: formattedCode
    })

  } catch (error) {
    console.error('Error in POST /api/referral/validate:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
