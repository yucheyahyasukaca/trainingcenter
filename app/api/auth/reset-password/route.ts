import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { getAppBaseUrl, getEmailBaseUrl } from '@/lib/url-utils'
import { internalHeaders, isInternalRequest } from '@/lib/api-auth'
import { rateLimit, clientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const GENERIC_OK = 'Jika email terdaftar, password baru telah dikirim ke email Anda. Silakan cek inbox dan folder spam.'

// Password acak kuat (CSPRNG), mudah diketik: 12 karakter tanpa karakter yang membingungkan.
function generateSecurePassword(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 12; i++) out += alphabet[crypto.randomInt(alphabet.length)]
  return `Garuda-${out}`
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
    const body = await request.json().catch(() => ({}))
    const rawEmail = typeof body?.email === 'string' ? body.email : ''

    if (!rawEmail) {
      return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 })
    }
    const normalizedEmail = rawEmail.toLowerCase().trim()
    if (normalizedEmail.length > 254 || !EMAIL_RE.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 })
    }

    // Pembatasan laju: per IP (kecuali panggilan internal) dan per email.
    const internal = isInternalRequest(request)
    if (!internal && !rateLimit(`reset-ip:${clientIp(request)}`, 15, 3_600_000)) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan. Coba lagi nanti.' }, { status: 429 })
    }
    // Per email: tetap kembalikan respons yang sama agar tidak membocorkan status akun.
    if (!rateLimit(`reset-email:${normalizedEmail}`, 1, 10 * 60_000)) {
      return NextResponse.json({ success: true, message: GENERIC_OK })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing')
      return NextResponse.json({ error: 'Layanan sedang bermasalah' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Cari akun lewat user_profiles (terindeks) -- TIDAK lagi memuat seluruh daftar user.
    let { data: profile } = await supabase
      .from('user_profiles')
      .select('id, email, full_name')
      .eq('email', normalizedEmail)
      .maybeSingle()
    if (!profile) {
      const escaped = normalizedEmail.replace(/[\\%_]/g, (c) => `\\${c}`)
      const res = await supabase
        .from('user_profiles')
        .select('id, email, full_name')
        .ilike('email', escaped)
        .limit(1)
        .maybeSingle()
      profile = res.data
    }

    if (!profile) {
      return NextResponse.json({ success: true, message: GENERIC_OK })
    }

    const newPassword = generateSecurePassword()
    const { error: updateError } = await supabase.auth.admin.updateUserById(profile.id, { password: newPassword })
    if (updateError) {
      console.error('Error updating password:', updateError.message)
      return NextResponse.json({ error: 'Gagal mereset password. Silakan coba lagi nanti.' }, { status: 500 })
    }

    try {
      const baseUrl = getAppBaseUrl()
      const emailHtml = generatePasswordResetEmail({
        participantName: profile.full_name || profile.email || 'Pengguna',
        email: profile.email,
        newPassword,
        loginUrl: `${getEmailBaseUrl()}/login`,
      })
      const emailResponse = await fetch(`${baseUrl}/api/email/send`, {
        method: 'POST',
        headers: { ...internalHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: profile.email,
          subject: 'Password Baru Anda | GARUDA-21 Training Center',
          html: emailHtml,
          useQueue: false,
        }),
      })
      if (!emailResponse.ok) {
        console.error('Password reset email failed, status:', emailResponse.status)
      }
    } catch (emailErr: any) {
      console.error('Error sending password reset email:', emailErr?.message)
    }

    return NextResponse.json({ success: true, message: GENERIC_OK })
  } catch (err: any) {
    console.error('Error in password reset:', err?.message)
    return NextResponse.json({ error: 'Gagal mereset password' }, { status: 500 })
  }
}
