import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// PUT /api/referral/user-codes/[id] - Update user referral code
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()

    // For now, let's get the first user for testing
    // In production, you would get the user from the session
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('role', 'user')
      .limit(1)

    if (userError || !users || users.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 })
    }

    const user = { id: users[0].id }

    const body = await request.json()
    const {
      description,
      max_uses,
      discount_percentage = 0,
      discount_amount = 0,
      commission_percentage = 0,
      commission_amount = 0,
      valid_until,
      is_active = true
    } = body

    // Update the referral code
    const { data, error } = await supabase
      .from('referral_codes')
      .update({
        description,
        max_uses,
        discount_percentage,
        discount_amount,
        commission_percentage,
        commission_amount,
        valid_until,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('referrer_id', user.id)
      .select()

    if (error) {
      console.error('Error updating user referral code:', error)
      return NextResponse.json({ error: 'Failed to update referral code' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Referral code not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      data: data[0],
      message: 'Referral code updated successfully'
    })

  } catch (error) {
    console.error('Error in PUT /api/referral/user-codes/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/referral/user-codes/[id] - Delete user referral code
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()

    // For now, let's get the first user for testing
    // In production, you would get the user from the session
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('role', 'user')
      .limit(1)

    if (userError || !users || users.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 })
    }

    const user = { id: users[0].id }

    // Delete the referral code
    const { error } = await supabase
      .from('referral_codes')
      .delete()
      .eq('id', params.id)
      .eq('referrer_id', user.id)

    if (error) {
      console.error('Error deleting user referral code:', error)
      return NextResponse.json({ error: 'Failed to delete referral code' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Referral code deleted successfully'
    })

  } catch (error) {
    console.error('Error in DELETE /api/referral/user-codes/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
