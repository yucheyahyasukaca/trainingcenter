import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Test endpoint untuk debug reset password
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({
        error: 'Email parameter required',
        usage: '/api/auth/reset-password/test?email=test@example.com'
      }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Supabase configuration missing',
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check email service configuration
    const emailConfig = {
      hasGmailUser: !!process.env.GMAIL_SMTP_USER,
      hasGmailPass: !!process.env.GMAIL_SMTP_PASS,
      hasSESUser: !!process.env.AWS_SES_SMTP_USER,
      hasSESPass: !!process.env.AWS_SES_SMTP_PASS,
      emailProvider: process.env.EMAIL_PROVIDER || 'gmail'
    }

    // Find user by email
    const { data: allUsers } = await supabase.auth.admin.listUsers()
    const user = allUsers?.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    return NextResponse.json({
      success: true,
      email,
      userFound: !!user,
      userId: user?.id || null,
      emailConfig,
      message: user 
        ? 'User found. You can test reset password with POST request.'
        : 'User not found. Email may not be registered.'
    })
  } catch (err: any) {
    console.error('Error in test endpoint:', err)
    return NextResponse.json({
      error: err.message || 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 })
  }
}

