// Email Templates untuk GARUDA-21 Training Center

export interface WelcomeEmailData {
  participantName: string
  programTitle: string
  programDescription: string
  userReferralCode?: string
  referralLink?: string
  dashboardUrl: string
  openMaterials: string[]
  lockedMaterials: string[]
  hasReferralUsed: boolean
}

export function generateWelcomeEmail(data: WelcomeEmailData): string {
  const { 
    participantName, 
    programTitle, 
    programDescription,
    userReferralCode,
    referralLink,
    dashboardUrl,
    openMaterials,
    lockedMaterials,
    hasReferralUsed
  } = data

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Selamat Bergabung - GARUDA-21 Training Center</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Selamat Bergabung!</h1>
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
                Selamat! Pendaftaran Anda untuk program pelatihan <strong>${programTitle}</strong> telah berhasil dilakukan.
              </p>
            </td>
          </tr>

          <!-- Program Info -->
          <tr>
            <td style="padding: 0 30px;">
              <div style="background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 20px; border-radius: 4px; margin-bottom: 30px;">
                <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #1e40af;">Informasi Program</h2>
                <p style="margin: 0; font-size: 15px; color: #1e3a8a; line-height: 1.6;">
                  ${programDescription}
                </p>
              </div>
            </td>
          </tr>

          <!-- Materials Section -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #111827;">📚 Materi Pelatihan</h3>
              <p style="margin: 0 0 15px 0; font-size: 14px; color: #6b7280;">
                Berikut adalah daftar materi pelatihan yang perlu Anda selesaikan:
              </p>
              
              <!-- Open Materials -->
              <div style="margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; font-size: 16px; color: #059669;">✓ Materi yang Dapat Diakses:</h4>
                <ul style="margin: 0; padding-left: 20px; color: #374151;">
                  ${openMaterials.map(material => `<li style="margin-bottom: 8px; line-height: 1.5;">${material}</li>`).join('')}
                </ul>
              </div>

              <!-- Locked Materials -->
              ${lockedMaterials.length > 0 ? `
              <div style="margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; font-size: 16px; color: #d97706;">🔒 Materi Terkunci:</h4>
                <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
                  ${lockedMaterials.map(material => `<li style="margin-bottom: 8px; line-height: 1.5;">${material}</li>`).join('')}
                </ul>
              </div>
              ` : ''}
            </td>
          </tr>

          <!-- Referral Section -->
          ${!hasReferralUsed && userReferralCode ? `
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background-color: #fef3c7; border: 1px solid #fcd34d; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #92400e;">🎁 Bagikan Referral Code Anda</h3>
                <p style="margin: 0 0 15px 0; font-size: 14px; color: #78350f; line-height: 1.6;">
                  Untuk membuka akses ke 3 materi terakhir, Anda harus membagikan kode referral ke rekan yang lain. 
                  Materi terakhir hanya akan terbuka setelah kode referral Anda <strong>berhasil digunakan oleh minimal 1 teman atau rekan</strong> yang bergabung dalam program ini.
                </p>
                
                ${referralLink ? `
                <div style="background-color: #ffffff; padding: 15px; border-radius: 4px; margin: 10px 0;">
                  <p style="margin: 0 0 8px 0; font-size: 13px; color: #78350f; font-weight: bold;">Link Referral Anda:</p>
                  <p style="margin: 0; font-size: 14px; color: #2563eb; word-break: break-all;">
                    <a href="${referralLink}" style="color: #2563eb; text-decoration: none;">${referralLink}</a>
                  </p>
                  <p style="margin: 10px 0 0 0; font-size: 12px; color: #92400e;">
                    <strong>Kode Referral:</strong> ${userReferralCode}
                  </p>
                </div>
                ` : ''}
              </div>
            </td>
          </tr>
          ` : hasReferralUsed ? `
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background-color: #d1fae5; border: 1px solid #10b981; padding: 20px; border-radius: 8px;">
                <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #065f46;">✅ Akses Penuh Telah Terbuka!</h3>
                <p style="margin: 0; font-size: 14px; color: #047857; line-height: 1.6;">
                  Selamat! Anda berhasil mengajak minimal 1 teman atau rekan untuk bergabung melalui tautan referral Anda. 
                  Sekarang Anda dapat mengakses semua materi pelatihan!
                </p>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 30px 30px 30px; text-align: center;">
              <a href="${dashboardUrl}" 
                 style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 10px 0;">
                Akses Dashboard Saya
              </a>
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
  `.trim()
}

