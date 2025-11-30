import { NextRequest, NextResponse } from 'next/server'
import { generateWelcomeEmail } from '@/lib/email-templates'
import { getAppBaseUrl } from '@/lib/url-utils'

// Test email endpoint dengan mock data
export async function POST(request: NextRequest) {
  try {
    const { to } = await request.json()

    if (!to) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    // Get base URL
    const baseUrl = getAppBaseUrl()

    // Mock data untuk test - sama dengan data real user
    const mockData = {
      participantName: 'Yuche Yahya',
      programTitle: 'Program Pelatihan AI Generatif untuk Pendidik',
      programDescription: 'Program pelatihan komprehensif yang dirancang untuk membekali pendidik dengan pengetahuan dan keterampilan dalam menggunakan teknologi AI generatif, khususnya Google Gemini, untuk meningkatkan kualitas pembelajaran dan pengajaran di era digital.',
      userReferralCode: 'ABC123XY',
      referralLink: `${baseUrl}/referral/ABC123XY`,
      dashboardUrl: `${baseUrl}/dashboard`,
      openMaterials: [
        'Fondasi AI Generatif dan Prompting Efektif',
        'Dari Ide Menjadi Materi Ajar di Gemini Canvas',
      ],
      lockedMaterials: [
        'Integrasi Lanjutan, Etika dan Pemberdayaan Siswa',
        'Sertifikasi Internasional Gemini Certified Educator',
        'Diseminasi Pengimbasan Program'
      ],
      hasReferralUsed: false,
    }

    // Generate email HTML menggunakan template yang sama
    const subject = `Selamat Bergabung - ${mockData.programTitle} | GARUDA-21 Training Center`
    const emailHtml = generateWelcomeEmail(mockData)

    // Kirim email via API email send
    const sendResponse = await fetch(`${baseUrl}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        html: emailHtml,
        useQueue: false, // Direct send untuk test
      }),
    })

    const sendResult = await sendResponse.json()

    if (!sendResponse.ok) {
      return NextResponse.json(
        {
          error: 'Failed to send email',
          details: sendResult
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      to,
      subject,
      emailPreview: {
        participantName: mockData.participantName,
        programTitle: mockData.programTitle,
        referralCode: mockData.userReferralCode,
      },
      details: sendResult,
    })
  } catch (error: any) {
    console.error('Error in test email API:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send test email' },
      { status: 500 }
    )
  }
}

// GET endpoint untuk test dengan email default
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const to = searchParams.get('to') || 'yucheyahya@gmail.com'

    // Get base URL
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host') || 'localhost:3000'
    const baseUrl = `${protocol}://${host}`

    // Mock data untuk test
    const mockData = {
      participantName: 'Yuche Yahya',
      programTitle: 'Program Pelatihan AI Generatif untuk Pendidik',
      programDescription: 'Program pelatihan komprehensif yang dirancang untuk membekali pendidik dengan pengetahuan dan keterampilan dalam menggunakan teknologi AI generatif, khususnya Google Gemini, untuk meningkatkan kualitas pembelajaran dan pengajaran di era digital.',
      userReferralCode: 'ABC123XY',
      referralLink: `${baseUrl}/referral/ABC123XY`,
      dashboardUrl: `${baseUrl}/dashboard`,
      openMaterials: [
        'Fondasi AI Generatif dan Prompting Efektif',
        'Dari Ide Menjadi Materi Ajar di Gemini Canvas',
      ],
      lockedMaterials: [
        'Integrasi Lanjutan, Etika dan Pemberdayaan Siswa',
        'Sertifikasi Internasional Gemini Certified Educator',
        'Diseminasi Pengimbasan Program'
      ],
      hasReferralUsed: false,
    }

    const subject = `Selamat Bergabung - ${mockData.programTitle} | GARUDA-21 Training Center`
    const emailHtml = generateWelcomeEmail(mockData)

    // Kirim email
    const sendResponse = await fetch(`${baseUrl}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        html: emailHtml,
        useQueue: false, // Direct send untuk test
      }),
    })

    const sendResult = await sendResponse.json()

    if (!sendResponse.ok) {
      return NextResponse.json(
        {
          error: 'Failed to send email',
          details: sendResult
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      to,
      subject,
      emailPreview: {
        participantName: mockData.participantName,
        programTitle: mockData.programTitle,
        referralCode: mockData.userReferralCode,
      },
      details: sendResult,
    })
  } catch (error: any) {
    console.error('Error in test email API:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send test email' },
      { status: 500 }
    )
  }
}
