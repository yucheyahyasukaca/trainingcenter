import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

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
    if (codeData.valid_until && new Date(codeData.valid_until) < now) {
      return NextResponse.json({ 
        success: false,
        error: 'Kode referral sudah tidak berlaku' 
      })
    }

    // Check usage limit
    if (codeData.max_uses && codeData.current_uses >= codeData.max_uses) {
      return NextResponse.json({ 
        success: false,
        error: 'Kode referral sudah mencapai batas penggunaan' 
      })
    }

    // Format response
    const formattedCode = {
      id: codeData.id,
      code: codeData.code,
      description: codeData.description,
      discount_percentage: codeData.discount_percentage,
      discount_amount: codeData.discount_amount,
      valid_until: codeData.valid_until,
      trainer_name: codeData.user_profiles?.full_name || 'Unknown'
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
