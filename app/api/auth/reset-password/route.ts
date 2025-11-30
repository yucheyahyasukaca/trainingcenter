import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAppBaseUrl } from '@/lib/url-utils'

export const dynamic = 'force-dynamic'

// Generate secure random password
function generateSecurePassword(): string {
  // Generate a random password: Garuda-21 + random 6 digits
  const randomNum = Math.floor(100000 + Math.random() * 900000)
  return `Garuda-21${randomNum}`
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
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Password Baru Anda</h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">GARUDA-21 Training Center</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                Halo <strong>${participantName}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                Permintaan reset password Anda telah diproses. Berikut adalah password baru untuk akun Anda:
              </p>
            </td>
          </tr>

          <!-- Password Info Box -->
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
                  ⚠️ Harap simpan password ini dengan aman! Setelah login, disarankan untuk mengubah password di halaman Settings untuk keamanan yang lebih baik.
                </p>
              </div>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 30px 30px 30px; text-align: center;">
              <a href="${loginUrl}" 
                 style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 10px 0;">
                Login ke Dashboard
              </a>
            </td>
          </tr>

          <!-- Security Note -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.6;">
                  <strong>🔒 Keamanan:</strong> Jika Anda tidak meminta reset password ini, segera hubungi tim support kami. Jangan bagikan password ini kepada siapapun.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">
                Jika Anda memiliki pertanyaan, jangan ragu untuk menghubungi tim support kami.
              </p>
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

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email wajib diisi' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Supabase configuration missing:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey
      })
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    // Use service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Find user by email (using admin API bypasses RLS)
    console.log('🔍 Searching for user with email:', email)
    const normalizedEmail = email.toLowerCase().trim()
    console.log('🔍 Email normalized:', normalizedEmail)

    let user = null
    let listUsersError = null

    // Method 1: Search in auth.users via admin API
    try {
      const { data: allUsers, error: error } = await supabase.auth.admin.listUsers()
      listUsersError = error

      if (error) {
        console.error('❌ Error listing users:', error)
      } else if (allUsers?.users) {
        // Search with exact match (case insensitive, trimmed)
        user = allUsers.users.find(u => {
          const userEmail = u.email?.toLowerCase().trim()
          return userEmail === normalizedEmail
        })

        // Log sample emails for debugging if not found
        if (!user && allUsers.users.length > 0) {
          const sampleEmails = allUsers.users.slice(0, 10).map(u => u.email).filter(Boolean)
          console.log('📋 Sample user emails (first 10):', sampleEmails)
          console.log('🔍 Checking if email exists with different case...')
        }
      }
    } catch (err: any) {
      console.error('❌ Exception listing users:', err)
      listUsersError = err
    }

    // Method 2: If not found in auth.users, try to find via user_profiles (fallback)
    if (!user) {
      console.log('🔍 User not found in auth.users, trying user_profiles...')
      try {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('id, email')
          .ilike('email', normalizedEmail)
          .maybeSingle()

        if (profile && !profileError) {
          console.log('✅ Found user via user_profiles:', profile.id)
          // Try to get user from auth using the ID
          const { data: userData, error: getUserError } = await supabase.auth.admin.getUserById(profile.id)
          if (userData?.user && !getUserError) {
            user = userData.user
            console.log('✅ Retrieved user from auth using profile ID')
          } else {
            console.warn('⚠️ Found profile but could not get auth user:', getUserError)
            // Use profile ID as fallback
            user = { id: profile.id, email: profile.email } as any
          }
        } else if (profileError) {
          console.error('❌ Error searching user_profiles:', profileError)
        }
      } catch (profileErr: any) {
        console.error('❌ Exception searching user_profiles:', profileErr)
      }
    }

    if (listUsersError && !user) {
      return NextResponse.json(
        { error: 'Gagal mencari user. Silakan coba lagi nanti.' },
        { status: 500 }
      )
    }

    console.log('👤 User search result:', {
      found: !!user,
      userId: user?.id,
      userEmail: user?.email,
      searchMethod: user ? (user.id ? 'auth.users' : 'user_profiles') : 'none'
    })

    if (!user) {
      // Don't reveal if email exists or not for security
      console.log('⚠️ User not found for email:', normalizedEmail)
      console.log('⚠️ Returning success message (security best practice)')
      return NextResponse.json({
        success: true,
        message: 'Jika email terdaftar, password baru telah dikirim ke email Anda.'
      })
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      confirmed: (user as any).email_confirmed_at ? 'Yes' : 'No'
    })

    // Generate new secure password
    const newPassword = generateSecurePassword()
    console.log('🔑 Generated new password for user:', user.id)

    // Update user password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('❌ Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Gagal mereset password. Silakan coba lagi nanti.' },
        { status: 500 }
      )
    }

    console.log('✅ Password updated successfully for user:', user.id)

    // Get user profile for name (service role should bypass RLS)
    console.log('📝 Fetching user profile for user:', user.id)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('⚠️ Error fetching user profile (non-critical):', profileError)
      console.error('Profile error details:', {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint
      })
      // Continue anyway, we can use email as name
    } else {
      console.log('✅ User profile fetched:', {
        hasProfile: !!profile,
        name: profile?.full_name
      })
    }

    const participantName = profile?.full_name || user.email || 'Pengguna'

    // Send email with new password
    let emailSent = false
    let emailError: any = null

    try {
      const baseUrl = getAppBaseUrl()
      const loginUrl = `${baseUrl}/login`

      const emailHtml = generatePasswordResetEmail({
        participantName,
        email: user.email!,
        newPassword,
        loginUrl
      })

      // Send email and wait for response
      console.log('📧 Attempting to send password reset email to:', user.email)
      console.log('📧 Base URL:', baseUrl)

      const emailResponse = await fetch(`${baseUrl}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: user.email!,
          subject: 'Password Baru Anda | GARUDA-21 Training Center',
          html: emailHtml,
          useQueue: false // Send immediately, don't queue
        })
      })

      const emailData = await emailResponse.json().catch(() => ({ error: 'Failed to parse response' }))

      if (!emailResponse.ok) {
        emailError = emailData
        console.error('❌ Error sending password reset email:', emailData)
        console.error('Response status:', emailResponse.status)
        // Log error but don't fail the request
      } else {
        emailSent = true
        console.log('✅ Password reset email sent successfully:', emailData)
      }
    } catch (emailErr: any) {
      emailError = emailErr
      console.error('❌ Error preparing/sending password reset email:', emailErr)
      console.error('Error details:', {
        message: emailErr.message,
        stack: emailErr.stack
      })
    }

    // Log final status
    if (emailSent) {
      console.log('✅ Password reset completed successfully. Email sent to:', user.email)
    } else {
      console.warn('⚠️ Password reset completed but email may not have been sent:', {
        email: user.email,
        error: emailError
      })
    }

    // Always return success (don't reveal if email exists)
    return NextResponse.json({
      success: true,
      message: 'Jika email terdaftar, password baru telah dikirim ke email Anda. Silakan cek inbox dan folder spam.'
    })
  } catch (err: any) {
    console.error('Error in password reset:', err)
    return NextResponse.json(
      { error: err.message || 'Gagal mereset password' },
      { status: 500 }
    )
  }
}

