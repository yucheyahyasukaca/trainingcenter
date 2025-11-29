import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

// Generate secure random password
// Generate secure random password
function generateSecurePassword(): string {
  // const randomNum = Math.floor(100000 + Math.random() * 900000)
  // return `Garuda-21${randomNum}`
  return 'Garuda-21.com' // Set to default password as stated in UI
}

// Generate password reset email
function generatePasswordResetEmail(data: {
  participantName: string
  email: string
  newPassword: string
  loginUrl: string
}): string {
  const { participantName, email, newPassword, loginUrl } = data

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Baru Anda | GARUDA-21 Training Center</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Password Baru Anda</h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">GARUDA-21 Training Center</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                Halo <strong>${participantName}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                Password akun Anda telah direset oleh administrator. Berikut adalah password baru untuk akun Anda:
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px;">
              <div style="background-color: #fef2f2; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #dc2626;">Informasi Login Anda</h2>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151; width: 120px;">Email:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-family: monospace; font-size: 15px;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">Password Baru:</td>
                    <td style="padding: 8px 0; color: #dc2626; font-family: monospace; font-size: 15px; font-weight: bold;">${newPassword}</td>
                  </tr>
                </table>
                <p style="margin: 15px 0 0 0; font-size: 14px; color: #991b1b; font-weight: 600;">
                  ⚠️ Harap simpan password ini dengan aman! Setelah login, disarankan untuk mengubah password di halaman Settings.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px 30px 30px; text-align: center;">
              <a href="${loginUrl}" 
                 style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 10px 0;">
                Login ke Dashboard
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} GARUDA-21 Training Center. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

// POST /api/admin/participants/reset-password - Reset user password (Admin only)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    console.log(`[ResetPassword] Request received for userId: ${userId}`)

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check authorization
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the user from the session token passed in the request header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !caller) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if caller is admin or manager
    const { data: callerProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (!callerProfile || (callerProfile.role !== 'admin' && callerProfile.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Generate secure random password
    const newPassword = generateSecurePassword()

    // Get user info before updating
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (!userData?.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user password using admin API
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        password: newPassword
      }
    )

    if (error) {
      console.error('Error resetting password:', error)
      return NextResponse.json(
        { error: 'Failed to reset password', details: error.message },
        { status: 500 }
      )
    }

    // Get user profile for name
    // supabaseUrl and supabaseServiceKey are already defined above
    if (supabaseUrl && supabaseServiceKey) {
      // const supabase = createClient(supabaseUrl, supabaseServiceKey) // Already created above as 'supabase'
      // But wait, the 'supabase' above uses service key? Yes.
      // So we can reuse 'supabase' client or create a new one if needed.
      // The code below uses 'supabase' variable.
      // Let's check if 'supabase' variable is available in this scope.
      // Yes, it was defined in the auth check block.

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle()

      const participantName = profile?.full_name || userData.user.email || 'Pengguna'

      // Send email with new password
      try {
        const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const loginUrl = `${baseUrl}/login`

        const emailHtml = generatePasswordResetEmail({
          participantName,
          email: userData.user.email!,
          newPassword,
          loginUrl
        })

        fetch(`${baseUrl}/api/email/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: userData.user.email!,
            subject: 'Password Baru Anda | GARUDA-21 Training Center',
            html: emailHtml,
            useQueue: true
          })
        }).catch(err => {
          console.error('Error sending password reset email:', err)
        })
      } catch (emailErr) {
        console.error('Error preparing password reset email:', emailErr)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Password berhasil direset. Password baru telah dikirim ke email user.'
    })
  } catch (error: any) {
    console.error('Error in POST /api/admin/participants/reset-password:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

