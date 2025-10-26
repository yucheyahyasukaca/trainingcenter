import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// PUT /api/admin/referral-policies/[id] - Update referral policy
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient()
    const { id: policyId } = await params

    const body = await request.json()
    const {
      program_id,
      participant_discount_percentage,
      participant_discount_amount,
      participant_discount_type,
      referrer_commission_percentage,
      referrer_commission_amount,
      referrer_commission_type,
      max_uses_per_code,
      max_total_uses,
      valid_until,
      is_active
    } = body

    // Update the policy
    const updateData: any = {
      program_id,
      participant_discount_percentage,
      participant_discount_amount,
      participant_discount_type,
      referrer_commission_percentage,
      referrer_commission_amount,
      referrer_commission_type,
      max_uses_per_code,
      max_total_uses,
      valid_until,
      is_active,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await (supabase as any)
      .from('referral_policies')
      .update(updateData)
      .eq('id', policyId)
      .select()

    if (error) {
      console.error('Error updating referral policy:', error)
      return NextResponse.json({ error: 'Failed to update referral policy' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: data[0],
      message: 'Referral policy updated successfully'
    })

  } catch (error) {
    console.error('Error in PUT /api/admin/referral-policies/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/referral-policies/[id] - Delete referral policy
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient()
    const { id: policyId } = await params

    // Delete the policy
    const { error } = await (supabase as any)
      .from('referral_policies')
      .delete()
      .eq('id', policyId)

    if (error) {
      console.error('Error deleting referral policy:', error)
      return NextResponse.json({ error: 'Failed to delete referral policy' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Referral policy deleted successfully'
    })

  } catch (error) {
    console.error('Error in DELETE /api/admin/referral-policies/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
