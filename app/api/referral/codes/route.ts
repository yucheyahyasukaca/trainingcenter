import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { headers } from 'next/headers'

// GET /api/referral/codes - Get referral codes for current trainer
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // For now, let's get the first trainer for testing
    // In production, you would get the user from the session
    const { data: trainers, error: trainerError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('role', 'trainer')
      .limit(1)
    
    if (trainerError || !trainers || trainers.length === 0) {
      return NextResponse.json({ error: 'No trainers found' }, { status: 404 })
    }
    
    const user = { id: trainers[0].id }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'trainer') {
      return NextResponse.json({ error: 'Access denied. Trainer role required.' }, { status: 403 })
    }

    // Get referral codes for this trainer
    const { data: referralCodes, error: codesError } = await supabase
      .from('referral_codes')
      .select(`
        *,
        referral_stats:referral_tracking(
          id,
          status,
          commission_earned,
          discount_applied,
          created_at
        )
      `)
      .eq('trainer_id', user.id)
      .order('created_at', { ascending: false })

    if (codesError) {
      console.error('Error fetching referral codes:', codesError)
      return NextResponse.json({ error: 'Failed to fetch referral codes' }, { status: 500 })
    }

    // Calculate stats for each code
    const codesWithStats = referralCodes?.map(code => {
      const stats = code.referral_stats || []
      const confirmedCount = stats.filter((s: any) => s.status === 'confirmed').length
      const pendingCount = stats.filter((s: any) => s.status === 'pending').length
      const cancelledCount = stats.filter((s: any) => s.status === 'cancelled').length
      const totalCommission = stats.reduce((sum: number, s: any) => sum + (s.commission_earned || 0), 0)
      const totalDiscount = stats.reduce((sum: number, s: any) => sum + (s.discount_applied || 0), 0)

      return {
        ...code,
        stats: {
          total_uses: stats.length,
          confirmed: confirmedCount,
          pending: pendingCount,
          cancelled: cancelledCount,
          total_commission: totalCommission,
          total_discount: totalDiscount
        }
      }
    }) || []

    return NextResponse.json({ 
      success: true, 
      data: codesWithStats 
    })

  } catch (error) {
    console.error('Error in GET /api/referral/codes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/referral/codes - Create new referral code
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // For now, let's get the first trainer for testing
    // In production, you would get the user from the session
    const { data: trainers, error: trainerError } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .eq('role', 'trainer')
      .limit(1)
    
    if (trainerError || !trainers || trainers.length === 0) {
      return NextResponse.json({ error: 'No trainers found' }, { status: 404 })
    }
    
    const user = { id: trainers[0].id }
    const profile = { role: 'trainer', full_name: trainers[0].full_name }

    const body = await request.json()
    const {
      description,
      max_uses,
      discount_percentage = 0,
      discount_amount = 0,
      commission_percentage = 0,
      commission_amount = 0,
      valid_until
    } = body

    // Validate input
    if (discount_percentage < 0 || discount_percentage > 100) {
      return NextResponse.json({ error: 'Discount percentage must be between 0 and 100' }, { status: 400 })
    }

    if (discount_amount < 0) {
      return NextResponse.json({ error: 'Discount amount cannot be negative' }, { status: 400 })
    }

    if (commission_percentage < 0 || commission_percentage > 100) {
      return NextResponse.json({ error: 'Commission percentage must be between 0 and 100' }, { status: 400 })
    }

    if (commission_amount < 0) {
      return NextResponse.json({ error: 'Commission amount cannot be negative' }, { status: 400 })
    }

    // Create referral code using the database function
    const { data: referralCodeId, error: createError } = await supabase
      .rpc('create_trainer_referral_code', {
        p_trainer_id: user.id,
        p_description: description || null,
        p_max_uses: max_uses || null,
        p_discount_percentage: discount_percentage,
        p_discount_amount: discount_amount,
        p_commission_percentage: commission_percentage,
        p_commission_amount: commission_amount,
        p_valid_until: valid_until || null
      })

    if (createError) {
      console.error('Error creating referral code:', createError)
      return NextResponse.json({ error: 'Failed to create referral code' }, { status: 500 })
    }

    // Get the created referral code
    const { data: newCode, error: fetchError } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('id', referralCodeId)
      .single()

    if (fetchError) {
      console.error('Error fetching created referral code:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch created referral code' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: newCode,
      message: 'Referral code created successfully' 
    })

  } catch (error) {
    console.error('Error in POST /api/referral/codes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/referral/codes/[id] - Update referral code
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // For now, let's get the first trainer for testing
    // In production, you would get the user from the session
    const { data: trainers, error: trainerError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('role', 'trainer')
      .limit(1)
    
    if (trainerError || !trainers || trainers.length === 0) {
      return NextResponse.json({ error: 'No trainers found' }, { status: 404 })
    }
    
    const user = { id: trainers[0].id }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Referral code ID is required' }, { status: 400 })
    }

    // Check if user owns this referral code
    const { data: existingCode, error: checkError } = await supabase
      .from('referral_codes')
      .select('trainer_id')
      .eq('id', id)
      .single()

    if (checkError || !existingCode) {
      return NextResponse.json({ error: 'Referral code not found' }, { status: 404 })
    }

    if (existingCode.trainer_id !== user.id) {
      return NextResponse.json({ error: 'Access denied. You can only update your own referral codes.' }, { status: 403 })
    }

    // Validate input
    if (updateData.discount_percentage !== undefined && (updateData.discount_percentage < 0 || updateData.discount_percentage > 100)) {
      return NextResponse.json({ error: 'Discount percentage must be between 0 and 100' }, { status: 400 })
    }

    if (updateData.discount_amount !== undefined && updateData.discount_amount < 0) {
      return NextResponse.json({ error: 'Discount amount cannot be negative' }, { status: 400 })
    }

    if (updateData.commission_percentage !== undefined && (updateData.commission_percentage < 0 || updateData.commission_percentage > 100)) {
      return NextResponse.json({ error: 'Commission percentage must be between 0 and 100' }, { status: 400 })
    }

    if (updateData.commission_amount !== undefined && updateData.commission_amount < 0) {
      return NextResponse.json({ error: 'Commission amount cannot be negative' }, { status: 400 })
    }

    // Update referral code
    const { data: updatedCode, error: updateError } = await supabase
      .from('referral_codes')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating referral code:', updateError)
      return NextResponse.json({ error: 'Failed to update referral code' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedCode,
      message: 'Referral code updated successfully' 
    })

  } catch (error) {
    console.error('Error in PUT /api/referral/codes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/referral/codes/[id] - Delete referral code
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // For now, let's get the first trainer for testing
    // In production, you would get the user from the session
    const { data: trainers, error: trainerError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('role', 'trainer')
      .limit(1)
    
    if (trainerError || !trainers || trainers.length === 0) {
      return NextResponse.json({ error: 'No trainers found' }, { status: 404 })
    }
    
    const user = { id: trainers[0].id }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Referral code ID is required' }, { status: 400 })
    }

    // Check if user owns this referral code
    const { data: existingCode, error: checkError } = await supabase
      .from('referral_codes')
      .select('trainer_id, current_uses')
      .eq('id', id)
      .single()

    if (checkError || !existingCode) {
      return NextResponse.json({ error: 'Referral code not found' }, { status: 404 })
    }

    if (existingCode.trainer_id !== user.id) {
      return NextResponse.json({ error: 'Access denied. You can only delete your own referral codes.' }, { status: 403 })
    }

    // Check if code has been used
    if (existingCode.current_uses > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete referral code that has been used. Deactivate it instead.' 
      }, { status: 400 })
    }

    // Delete referral code
    const { error: deleteError } = await supabase
      .from('referral_codes')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting referral code:', deleteError)
      return NextResponse.json({ error: 'Failed to delete referral code' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Referral code deleted successfully' 
    })

  } catch (error) {
    console.error('Error in DELETE /api/referral/codes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
