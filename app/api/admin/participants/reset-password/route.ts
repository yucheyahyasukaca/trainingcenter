import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// POST /api/admin/participants/reset-password - Reset user password
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    
    // Default password: Garuda-21.com
    const defaultPassword = 'Garuda-21.com'

    // Update user password using admin API
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        password: defaultPassword
      }
    )

    if (error) {
      console.error('Error resetting password:', error)
      return NextResponse.json(
        { error: 'Failed to reset password', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password berhasil direset ke default (Garuda-21.com)'
    })
  } catch (error: any) {
    console.error('Error in POST /api/admin/participants/reset-password:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

