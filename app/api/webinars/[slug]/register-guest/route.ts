import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAppBaseUrl, getEmailBaseUrl } from '@/lib/url-utils'

export const dynamic = 'force-dynamic'

interface Params {
  params: { slug: string }
}

// Generate random password
function generateDefaultPassword(): string {
  // Generate a random password: Garuda-21 + random 6 digits
  const randomNum = Math.floor(100000 + Math.random() * 900000)
  return `Garuda-21${randomNum}`
}

// Generate welcome email for new account
function generateAccountWelcomeEmail(data: {
  participantName: string
  email: string
  password: string
  webinarTitle: string
  loginUrl: string
  isExistingUser: boolean
}): string {
  const { participantName, email, password, webinarTitle, loginUrl, isExistingUser } = data

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isExistingUser ? 'Pendaftaran Webinar Berhasil' : 'Selamat Bergabung - Akun Baru Dibuat'} | GARUDA-21 Training Center</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                ${isExistingUser ? 'Pendaftaran Webinar Berhasil!' : 'Selamat Bergabung!'}
              </h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">GARUDA-21 Training Center</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                Halo <strong>${participantName}</strong>,
              </p>
              ${isExistingUser ? `
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                Terima kasih! <strong>Anda telah berhasil terdaftar untuk webinar ${webinarTitle}.</strong>
              </p>
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                Email Anda (<strong>${email}</strong>) sudah terdaftar di sistem kami. Silakan login dengan akun yang sudah ada untuk mengakses webinar dan mengunduh sertifikat setelah webinar selesai.
              </p>
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                <strong style="color: #dc2626;">Lupa Password?</strong> Jangan khawatir! Anda dapat mereset password dengan mengklik "Lupa Password" di halaman login. Password baru akan dikirim ke email Anda.
              </p>
              ` : `
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                Akun baru telah dibuat untuk Anda di Garuda Academy! Anda telah terdaftar untuk webinar <strong>${webinarTitle}</strong>.
              </p>
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                <strong style="color: #dc2626;">PENTING:</strong> Simpan informasi login berikut untuk mengakses akun Anda dan mengunduh sertifikat setelah webinar selesai:
              </p>
              `}
            </td>
          </tr>

          ${!isExistingUser ? `
          <!-- Account Info Box - Only for new users -->
          <tr>
            <td style="padding: 0 30px;">
              <div style="background-color: #fef2f2; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #dc2626;">Informasi Akun Anda</h2>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151; width: 120px;">Email:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-family: monospace; font-size: 15px;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #374151;">Password:</td>
                    <td style="padding: 8px 0; color: #dc2626; font-family: monospace; font-size: 15px; font-weight: bold;">${password}</td>
                  </tr>
                </table>
                <p style="margin: 15px 0 0 0; font-size: 14px; color: #991b1b; font-weight: 600;">
                  ⚠️ Harap simpan password ini dengan aman! Anda akan membutuhkannya untuk login dan mengunduh sertifikat.
                </p>
                <p style="margin: 10px 0 0 0; font-size: 13px; color: #92400e; background-color: #fffbeb; padding: 10px; border-radius: 4px; border-left: 3px solid #f59e0b;">
                  💡 <strong>Tips:</strong> Jika Anda lupa mencatat password, silakan cek email ini atau gunakan fitur "Lupa Password" di halaman login. Password baru akan dikirim ke email Anda.
                </p>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Webinar Info -->
          <tr>
            <td style="padding: 0 30px;">
              <div style="background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 20px; border-radius: 4px; margin-bottom: 30px;">
                <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #1e40af;">Informasi Webinar</h2>
                <p style="margin: 0; font-size: 15px; color: #1e3a8a; line-height: 1.6;">
                  <strong>${webinarTitle}</strong>
                </p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #1e3a8a;">
                  Setelah webinar selesai, Anda dapat mengunduh sertifikat melalui halaman webinar atau dashboard Anda.
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

          ${!isExistingUser ? `
          <!-- Important Note -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.6;">
                  <strong>💡 Tips:</strong> Setelah login, Anda dapat mengubah password di halaman Settings untuk keamanan yang lebih baik.
                </p>
              </div>
            </td>
          </tr>
          ` : ''}

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

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json()
    const {
      email,
      full_name,
      gender,
      date_of_birth,
      phone,
      provinsi,
      kabupaten,
      address,
      education,
      education_status,
      employment_status,
      it_background,
      disability,
      background,
      company,
      position,
      career_info,
      emergency_contact_name,
      emergency_contact_phone
    } = body

    // Validate required fields
    if (!email || !full_name || !phone) {
      return NextResponse.json(
        { error: 'Email, nama lengkap, dan nomor telepon wajib diisi' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find webinar
    const { data: webinar, error: wErr } = await supabase
      .from('webinars')
      .select('id, title, slug, start_time, end_time')
      .eq('slug', params.slug)
      .single()

    if (wErr || !webinar) {
      return NextResponse.json(
        { error: 'Webinar tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if registration is closed
    const now = new Date()
    const startTime = new Date(webinar.start_time)
    if (now > startTime) {
      return NextResponse.json(
        { error: 'Pendaftaran sudah ditutup' },
        { status: 400 }
      )
    }

    // Try to find existing user by email first
    let userId: string = ''
    let isExistingUser = false
    let defaultPassword = generateDefaultPassword()

    // Check if email already exists - try multiple methods
    let userWithEmail = null

    // Method 1: Check via user_profiles table (more reliable)
    try {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('id, email')
        .eq('email', email.toLowerCase())
        .maybeSingle()

      if (profileData?.id) {
        // Found in user_profiles, get user from auth
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(profileData.id)
          if (userData?.user) {
            userWithEmail = userData.user
          }
        } catch (err) {
          console.error('Error getting user by id:', err)
        }
      }
    } catch (err) {
      console.error('Error checking user_profiles:', err)
    }

    // Method 2: If not found, try listUsers (with pagination handling)
    if (!userWithEmail) {
      try {
        let page = 1
        let hasMore = true
        const pageSize = 1000 // Supabase default page size

        while (hasMore && !userWithEmail) {
          const { data: allUsers, error: listError } = await supabase.auth.admin.listUsers({
            page,
            perPage: pageSize
          })

          if (listError) {
            console.error('Error listing users:', listError)
            break
          }

          if (allUsers?.users) {
            userWithEmail = allUsers.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
            hasMore = allUsers.users.length === pageSize
            page++
          } else {
            hasMore = false
          }
        }
      } catch (err) {
        console.error('Error checking existing users:', err)
      }
    }

    if (userWithEmail) {
      // User already exists - use existing account (don't reset password)
      userId = userWithEmail.id
      isExistingUser = true
    } else {
      // Try to create new user account
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: {
          full_name
        }
      })

      if (authError) {
        // If email exists error, try to find user by checking user_profiles or auth
        if (authError.code === 'email_exists' || authError.message?.includes('already been registered') || authError.message?.includes('email')) {
          console.log('Email already exists, finding existing user...')

          // Method 1: Try to find via user_profiles first (most reliable)
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('id, email')
            .eq('email', email.toLowerCase())
            .maybeSingle()

          if (profileData?.id) {
            // Found in user_profiles - use this ID
            userId = profileData.id
            isExistingUser = true
            console.log('Found user via user_profiles:', userId)
          } else {
            // Method 2: Try to find via auth.users with direct query (if possible)
            // Since email_exists error means user exists in auth, try to get it
            // We'll use a workaround: try to get user by attempting to list and search
            let found = false

            // Try paginated search
            for (let page = 1; page <= 10 && !found; page++) {
              try {
                const { data: allUsersRetry, error: listError } = await supabase.auth.admin.listUsers({
                  page,
                  perPage: 1000
                })

                if (listError) {
                  console.error('Error listing users:', listError)
                  break
                }

                if (allUsersRetry?.users) {
                  const existingUserByEmail = allUsersRetry.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
                  if (existingUserByEmail) {
                    userId = existingUserByEmail.id
                    isExistingUser = true
                    found = true
                    console.log('Found user via listUsers:', userId)
                    break
                  }

                  // If we got less than 1000 users, we've reached the end
                  if (allUsersRetry.users.length < 1000) {
                    break
                  }
                } else {
                  break
                }
              } catch (listErr) {
                console.error('Error in listUsers loop:', listErr)
                break
              }
            }

            if (!found) {
              // Email exists but we can't find the user ID via listUsers
              // Try one more method: query auth.users directly via RPC or use email as identifier
              // Since we can't directly query auth.users by email via admin API,
              // we'll need to handle this case differently

              // Last resort: Try to get user by attempting to sign in or use email as fallback
              // But since we need user_id for webinar_registrations, we must find it

              // Actually, if email exists in auth but not in user_profiles or listUsers,
              // it might be a data inconsistency. Let's try one more time with a fresh listUsers call
              try {
                // Fresh call without pagination params (get first page)
                const { data: freshUsers } = await supabase.auth.admin.listUsers()
                const freshUser = freshUsers?.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

                if (freshUser) {
                  userId = freshUser.id
                  isExistingUser = true
                  found = true
                  console.log('Found user via fresh listUsers call:', userId)
                }
              } catch (freshErr) {
                console.error('Error in fresh listUsers call:', freshErr)
              }

              if (!found) {
                // Email exists but we can't find the user ID
                // This is a rare edge case - return helpful error
                console.error('Email exists but user not found in any method. Error:', authError)
                console.error('Email:', email)
                return NextResponse.json(
                  {
                    error: 'Email sudah terdaftar. Silakan login dengan akun yang sudah ada untuk mendaftar webinar.',
                    emailExists: true,
                    suggestion: 'login'
                  },
                  { status: 400 }
                )
              }
            }
          }
        } else {
          // Other auth errors
          console.error('Auth error:', authError)
          return NextResponse.json(
            { error: authError.message || 'Gagal membuat akun' },
            { status: 400 }
          )
        }
      } else if (!authData?.user) {
        return NextResponse.json(
          { error: 'Gagal membuat akun' },
          { status: 500 }
        )
      } else {
        userId = authData.user.id
      }
    }

    // Create or update user profile
    if (!isExistingUser) {
      // Create user profile for new user
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email,
          full_name,
          phone,
          gender,
          address,
          provinsi,
          kabupaten,
          role: 'user'
        })

      if (profileError) {
        console.error('Profile error:', profileError)
        // Continue even if profile creation fails
      }

      // Create participant record for new user
      const { error: participantError } = await supabase
        .from('participants')
        .insert({
          user_id: userId,
          phone,
          gender,
          date_of_birth: date_of_birth || null,
          address,
          provinsi,
          kabupaten,
          education: education || null,
          education_status: education_status || null,
          employment_status: employment_status || null,
          it_background: it_background || null,
          disability: disability || null,
          background: background || null,
          company: company || null,
          position: position || null,
          career_info: career_info || null,
          emergency_contact_name: emergency_contact_name || null,
          emergency_contact_phone: emergency_contact_phone || null
        })

      if (participantError) {
        console.error('Participant error:', participantError)
        // Continue even if participant creation fails
      }
    } else {
      // Update existing profile if needed
      const { error: profileUpdateError } = await supabase
        .from('user_profiles')
        .update({
          full_name,
          phone,
          gender,
          address,
          provinsi,
          kabupaten
        })
        .eq('id', userId)

      if (profileUpdateError) {
        console.error('Profile update error:', profileUpdateError)
      }
    }

    // Check if already registered before attempting to insert
    const { data: existingReg } = await supabase
      .from('webinar_registrations')
      .select('id')
      .eq('webinar_id', webinar.id)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingReg) {
      // User already registered - don't send email, just return info
      return NextResponse.json({
        success: true,
        isExistingUser,
        userId,
        alreadyRegistered: true,
        message: 'Anda sudah terdaftar untuk webinar ini sebelumnya.'
      })
    }

    // Register for webinar
    const { error: regErr } = await supabase
      .from('webinar_registrations')
      .insert({ webinar_id: webinar.id, user_id: userId })

    if (regErr && !regErr.message.includes('duplicate')) {
      console.error('Registration error:', regErr)
      return NextResponse.json(
        { error: regErr.message || 'Gagal mendaftar ke webinar' },
        { status: 400 }
      )
    }

    // Send email notification (only if not already registered)
    try {
      const baseUrl = getAppBaseUrl()
      const emailBaseUrl = getEmailBaseUrl()
      const loginUrl = `${emailBaseUrl}/login`

      const emailHtml = generateAccountWelcomeEmail({
        participantName: full_name,
        email,
        password: defaultPassword,
        webinarTitle: webinar.title,
        loginUrl,
        isExistingUser
      })

      // Send email asynchronously (don't wait)
      fetch(`${baseUrl}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: isExistingUser
            ? `Pendaftaran Webinar Berhasil - ${webinar.title} | GARUDA-21 Training Center`
            : `Selamat Bergabung - Akun Baru Dibuat | GARUDA-21 Training Center`,
          html: emailHtml,
          useQueue: true
        })
      }).catch(err => {
        console.error('Error sending email:', err)
        // Don't fail registration if email fails
      })
    } catch (emailErr) {
      console.error('Error preparing email:', emailErr)
      // Don't fail registration if email fails
    }

    // Return password only for new users
    return NextResponse.json({
      success: true,
      isExistingUser,
      userId,
      defaultPassword: !isExistingUser ? defaultPassword : undefined, // Only return password for new users
      message: isExistingUser
        ? 'Email Anda sudah terdaftar di sistem kami. Anda berhasil terdaftar untuk webinar ini. Silakan login dengan akun yang sudah ada.'
        : 'Akun baru telah dibuat dan Anda berhasil terdaftar untuk webinar ini. Silakan cek email untuk informasi login.'
    })
  } catch (err: any) {
    console.error('Error in guest registration:', err)
    return NextResponse.json(
      { error: err.message || 'Gagal mendaftar' },
      { status: 500 }
    )
  }
}

