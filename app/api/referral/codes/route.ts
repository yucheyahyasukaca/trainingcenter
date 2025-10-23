import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// GET /api/referral/codes - Get referral codes for current trainer
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication failed',
        details: authError.message
      }, { status: 401 })
    }
    
    if (!user) {
      console.error('No user found in session')
      return NextResponse.json({ 
        success: false, 
        error: 'Auth session missing! Please login again.',
        details: 'No authenticated user found in the current session'
      }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ 
        success: false, 
        error: 'User profile not found' 
      }, { status: 404 })
    }

    if (profile.role !== 'trainer') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Trainer role required.' 
      }, { status: 403 })
    }

    const userData = { id: profile.id }

    // Get referral codes for this trainer
    const { data: referralCodes, error: codesError } = await (supabase as any)
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
      .eq('trainer_id', userData.id)
      .order('created_at', { ascending: false })

    if (codesError) {
      console.error('Error fetching referral codes:', codesError)
      return NextResponse.json({ error: 'Failed to fetch referral codes' }, { status: 500 })
    }

    // Calculate stats for each code
    const codesWithStats = referralCodes?.map((code: any) => {
      const stats = (code as any).referral_stats || []
      const confirmedCount = stats.filter((s: any) => s.status === 'confirmed').length
      const pendingCount = stats.filter((s: any) => s.status === 'pending').length
      const cancelledCount = stats.filter((s: any) => s.status === 'cancelled').length
      const totalCommission = stats.reduce((sum: number, s: any) => sum + (s.commission_earned || 0), 0)
      const totalDiscount = stats.reduce((sum: number, s: any) => sum + (s.discount_applied || 0), 0)

      return {
        ...(code as any),
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
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ 
        success: false,
        error: 'Authentication failed',
        details: authError.message
      }, { status: 401 })
    }
    
    if (!user) {
      console.error('No user found in session')
      return NextResponse.json({ 
        success: false,
        error: 'Auth session missing! Please login again.',
        details: 'No authenticated user found in the current session'
      }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role, full_name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ 
        error: 'User profile not found' 
      }, { status: 404 })
    }

    if (profile.role !== 'trainer') {
      return NextResponse.json({ 
        error: 'Access denied. Trainer role required.' 
      }, { status: 403 })
    }

    const userData = { id: profile.id }

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

    // Generate referral code manually
    const generateReferralCode = (trainerName: string): string => {
      const baseCode = trainerName.replace(/\s+/g, '').toUpperCase().substring(0, 3)
      const timestamp = Date.now().toString().slice(-3)
      return `${baseCode}${timestamp}`
    }

    const referralCode = generateReferralCode(profile.full_name)
    
    console.log('Creating referral code manually:', {
      trainer_id: userData.id,
      code: referralCode,
      description,
      max_uses: max_uses,
      valid_until: valid_until
    })

    // Insert referral code directly
    const { data: newCode, error: createError } = await supabase
      .from('referral_codes')
      .insert({
        trainer_id: userData.id,
        code: referralCode,
        description: description,
        max_uses: max_uses,
        discount_percentage: discount_percentage,
        discount_amount: discount_amount,
        commission_percentage: commission_percentage,
        commission_amount: commission_amount,
        valid_until: valid_until,
        is_active: true
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating referral code:', createError)
      return NextResponse.json({ 
        error: 'Failed to create referral code', 
        details: createError.message,
        code: createError.code 
      }, { status: 500 })
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
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ 
        success: false,
        error: 'Authentication failed',
        details: authError.message
      }, { status: 401 })
    }
    
    if (!user) {
      console.error('No user found in session')
      return NextResponse.json({ 
        success: false,
        error: 'Auth session missing! Please login again.',
        details: 'No authenticated user found in the current session'
      }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ 
        error: 'User profile not found' 
      }, { status: 404 })
    }

    if (profile.role !== 'trainer') {
      return NextResponse.json({ 
        error: 'Access denied. Trainer role required.' 
      }, { status: 403 })
    }

    const userData = { id: profile.id }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Referral code ID is required' }, { status: 400 })
    }

    // Check if user owns this referral code
    const { data: existingCode, error: checkError } = await (supabase as any)
      .from('referral_codes')
      .select('trainer_id')
      .eq('id', id)
      .single()

    if (checkError || !existingCode) {
      return NextResponse.json({ error: 'Referral code not found' }, { status: 404 })
    }

    if ((existingCode as any).trainer_id !== userData.id) {
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
    const { data: updatedCode, error: updateError } = await (supabase as any)
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
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ 
        success: false,
        error: 'Authentication failed',
        details: authError.message
      }, { status: 401 })
    }
    
    if (!user) {
      console.error('No user found in session')
      return NextResponse.json({ 
        success: false,
        error: 'Auth session missing! Please login again.',
        details: 'No authenticated user found in the current session'
      }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ 
        error: 'User profile not found' 
      }, { status: 404 })
    }

    if (profile.role !== 'trainer') {
      return NextResponse.json({ 
        error: 'Access denied. Trainer role required.' 
      }, { status: 403 })
    }

    const userData = { id: profile.id }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Referral code ID is required' }, { status: 400 })
    }

    // Check if user owns this referral code
    const { data: existingCode, error: checkError } = await (supabase as any)
      .from('referral_codes')
      .select('trainer_id, current_uses')
      .eq('id', id)
      .single()

    if (checkError || !existingCode) {
      return NextResponse.json({ error: 'Referral code not found' }, { status: 404 })
    }

    if ((existingCode as any).trainer_id !== userData.id) {
      return NextResponse.json({ error: 'Access denied. You can only delete your own referral codes.' }, { status: 403 })
    }

    // Check if code has been used
    if ((existingCode as any).current_uses > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete referral code that has been used. Deactivate it instead.' 
      }, { status: 400 })
    }

    // Delete referral code
    const { error: deleteError } = await (supabase as any)
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
