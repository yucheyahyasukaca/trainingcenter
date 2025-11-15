import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// GET /api/referral/program-codes - Get referral codes for a specific program
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const { searchParams } = new URL(request.url)
    const programId = searchParams.get('program_id')

    if (!programId) {
      return NextResponse.json({ error: 'Program ID is required' }, { status: 400 })
    }

    // Get referral codes that are active and valid for this program
    const { data: codes, error: codesError } = await supabase
      .from('referral_codes')
      .select(`
        id,
        code,
        description,
        discount_percentage,
        discount_amount,
        valid_until,
        user_profiles!referral_codes_trainer_id_fkey (
          full_name
        )
      `)
      .eq('is_active', true)
      .or(`valid_until.is.null,valid_until.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })

    if (codesError) {
      console.error('Error fetching program codes:', codesError)
      return NextResponse.json({ error: 'Failed to fetch referral codes' }, { status: 500 })
    }

    // Format the response
    const formattedCodes = codes?.map((code: any) => ({
      id: (code as any).id,
      code: (code as any).code,
      description: (code as any).description,
      discount_percentage: (code as any).discount_percentage,
      discount_amount: (code as any).discount_amount,
      valid_until: (code as any).valid_until,
      trainer_name: (code as any).user_profiles?.full_name || 'Unknown'
    })) || []

    return NextResponse.json({ 
      success: true,
      data: formattedCodes
    })

  } catch (error) {
    console.error('Error in GET /api/referral/program-codes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
