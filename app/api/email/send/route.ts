import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, addToQueue, verifyTransporter, getQueueStatus } from '@/lib/mail'

// API Route Handler
export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, useQueue = true, recipientId } = await request.json()

    // Validate input
    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      )
    }

    // Verify SMTP connection
    const isVerified = await verifyTransporter()
    if (!isVerified) {
      const provider = process.env.EMAIL_PROVIDER === 'ses' || process.env.AWS_SES_SMTP_HOST ? 'Amazon SES' : 'Gmail SMTP'
      return NextResponse.json(
        { error: `SMTP connection failed. Please check ${provider} configuration.` },
        { status: 500 }
      )
    }

    // If useQueue is true, add to queue for batch processing
    if (useQueue) {
      const queueLength = addToQueue({ to, subject, html, recipientId })

      return NextResponse.json({
        success: true,
        message: 'Email added to queue',
        queueLength,
      })
    }

    // Send immediately
    const result = await sendEmail(to, subject, html, recipientId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId
      })
    } else {
      return NextResponse.json({
        success: true,
        message: 'Email queued for later delivery (immediate send failed)',
      })
    }
  } catch (error: any) {
    console.error('Error in send email API:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}

// Get queue status and current provider
export async function GET() {
  const status = getQueueStatus()

  // Check if credentials are configured
  const sesConfigured = !!(process.env.AWS_SES_SMTP_USER && process.env.AWS_SES_SMTP_PASS)
  const gmailConfigured = !!(process.env.GMAIL_SMTP_USER && process.env.GMAIL_SMTP_PASS)

  return NextResponse.json({
    queueLength: status.queueLength,
    isProcessing: status.isProcessing,
    currentProvider: status.provider,
    emailProvider: process.env.EMAIL_PROVIDER || 'gmail',
    sesConfigured,
    gmailConfigured,
    sesHost: process.env.AWS_SES_SMTP_HOST || (process.env.AWS_SES_REGION ? `email-smtp.${process.env.AWS_SES_REGION}.amazonaws.com` : 'not set'),
    sesFromEmail: process.env.AWS_SES_FROM_EMAIL || 'not set',
    gmailUser: process.env.GMAIL_SMTP_USER || 'not set',
    dailyEmailCount: status.dailyEmailCount
  })
}
