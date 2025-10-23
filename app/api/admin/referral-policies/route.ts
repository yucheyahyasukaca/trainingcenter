import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/admin/referral-policies - Get all referral policies
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Get all referral policies with program info
    const { data: policies, error: policiesError } = await supabase
      .from('referral_policies')
      .select(`
        id,
        program_id,
        participant_discount_percentage,
        participant_discount_amount,
        participant_discount_type,
        referrer_commission_percentage,
        referrer_commission_amount,
        referrer_commission_type,
        max_uses_per_code,
        max_total_uses,
        valid_from,
        valid_until,
        is_active,
        created_by,
        created_at,
        updated_at,
        programs!inner(title, price),
        user_profiles!referral_policies_created_by_fkey(full_name)
      `)
      .order('created_at', { ascending: false })

    if (policiesError) {
      console.error('Error fetching referral policies:', policiesError)
      return NextResponse.json({ error: 'Failed to fetch referral policies' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: policies || []
    })

  } catch (error) {
    console.error('Error in GET /api/admin/referral-policies:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/referral-policies - Create new referral policy
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // For now, let's get the first admin for testing
    // In production, you would get the user from the session
    const { data: admins, error: adminError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)

    if (adminError || !admins || admins.length === 0) {
      console.error('No admin found:', adminError)
      return NextResponse.json({ error: 'No admin found' }, { status: 404 })
    }

    const adminId = admins[0].id
    console.log('Using admin ID:', adminId)

    const body = await request.json()
    console.log('Request body:', body)
    
    const {
      program_id,
      participant_discount_percentage = 0,
      participant_discount_amount = 0,
      participant_discount_type = 'percentage',
      referrer_commission_percentage = 0,
      referrer_commission_amount = 0,
      referrer_commission_type = 'percentage',
      max_uses_per_code = null,
      max_total_uses = null,
      valid_until = null,
      is_active = true
    } = body

    // Validate program_id
    if (!program_id) {
      return NextResponse.json({ error: 'Program ID is required' }, { status: 400 })
    }

    // Check if program exists
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('id')
      .eq('id', program_id)
      .single()

    if (programError || !program) {
      console.error('Program not found:', programError)
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Create policy directly
    const { data: policyData, error: policyError } = await supabase
      .from('referral_policies')
      .insert({
        program_id,
        created_by: adminId,
        participant_discount_percentage,
        participant_discount_amount,
        participant_discount_type,
        referrer_commission_percentage,
        referrer_commission_amount,
        referrer_commission_type,
        max_uses_per_code,
        max_total_uses,
        valid_until: valid_until || null,
        is_active
      })
      .select()
      .single()

    if (policyError) {
      console.error('Error creating referral policy:', policyError)
      return NextResponse.json({ error: 'Failed to create referral policy', details: policyError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: { id: policyData.id },
      message: 'Referral policy created successfully'
    })

  } catch (error) {
    console.error('Error in POST /api/admin/referral-policies:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
