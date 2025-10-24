import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// PUT /api/referral/user-codes/[id] - Update user referral code
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('id', (user as any).id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ 
        error: 'User profile not found' 
      }, { status: 404 })
    }

    if ((profile as any).role !== 'user') {
      return NextResponse.json({ 
        error: 'Access denied. User role required.' 
      }, { status: 403 })
    }

    const userData = { id: (profile as any).id }

    const body = await request.json()
    const {
      description,
      max_uses,
      valid_until,
      is_active = true
    } = body

    // Update the referral code
    const { data, error } = await (supabase as any)
      .from('referral_codes')
      .update({
        description,
        max_uses,
        valid_until,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id as string)
      .eq('trainer_id', userData.id)
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

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('id', (user as any).id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ 
        error: 'User profile not found' 
      }, { status: 404 })
    }

    if ((profile as any).role !== 'user') {
      return NextResponse.json({ 
        error: 'Access denied. User role required.' 
      }, { status: 403 })
    }

    const userData = { id: (profile as any).id }

    // Delete the referral code
    const { error } = await (supabase as any)
      .from('referral_codes')
      .delete()
      .eq('id', params.id as string)
      .eq('trainer_id', userData.id)

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
