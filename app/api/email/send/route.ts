import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Discord Queue untuk mengirim email dalam batch (scalable untuk ribuan email)
interface EmailQueueItem {
  to: string
  subject: string
  html: string
  recipientId?: string
  priority?: number
}

let emailQueue: EmailQueueItem[] = []
let isProcessingQueue = false
let transporter: nodemailer.Transporter | null = null

// Initialize Email Transporter (Amazon SES or Gmail SMTP)
function getTransporter() {
  if (transporter) return transporter

  // Check if using Amazon SES or Gmail SMTP
  const useAmazonSES = process.env.EMAIL_PROVIDER === 'ses' || process.env.AWS_SES_SMTP_HOST

  if (useAmazonSES) {
    // Amazon SES SMTP Configuration
    const smtpConfig = {
      host: process.env.AWS_SES_SMTP_HOST || process.env.AWS_SES_REGION 
        ? `email-smtp.${process.env.AWS_SES_REGION}.amazonaws.com` 
        : 'email-smtp.us-east-1.amazonaws.com',
      port: parseInt(process.env.AWS_SES_SMTP_PORT || '587'),
      secure: false, // Use STARTTLS for port 587, true for port 465
      auth: {
        user: process.env.AWS_SES_SMTP_USER || '',
        pass: process.env.AWS_SES_SMTP_PASS || '',
      },
      // Amazon SES requires TLS
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false, // SES uses self-signed certificates
      },
    }

    // Validate configuration
    if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
      throw new Error('Amazon SES SMTP credentials not configured. Please set AWS_SES_SMTP_USER and AWS_SES_SMTP_PASS environment variables.')
    }

    transporter = nodemailer.createTransport(smtpConfig)
    return transporter
  } else {
    // Gmail SMTP Configuration (fallback)
    const smtpConfig = {
      host: process.env.GMAIL_SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.GMAIL_SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.GMAIL_SMTP_USER || '',
        pass: process.env.GMAIL_SMTP_PASS || '', // App Password from Gmail
      },
    }

    // Validate configuration
    if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
      throw new Error('SMTP credentials not configured. Please set GMAIL_SMTP_USER and GMAIL_SMTP_PASS (for Gmail) or AWS_SES_SMTP_USER and AWS_SES_SMTP_PASS (for Amazon SES) environment variables.')
    }

    transporter = nodemailer.createTransport(smtpConfig)
    return transporter
  }
}

// Verify SMTP connection
async function verifyTransporter() {
  try {
    const trans = getTransporter()
    await trans.verify()
    return true
  } catch (error) {
    console.error('SMTP verification failed:', error)
    return false
  }
}

// Send single email
async function sendEmail(to: string, subject: string, html: string, recipientId?: string): Promise<{ success: boolean; messageId?: string }> {
  try {
    const trans = getTransporter()
    
    // Determine sender email and name based on provider
    const useAmazonSES = process.env.EMAIL_PROVIDER === 'ses' || process.env.AWS_SES_SMTP_HOST
    const senderEmail = useAmazonSES 
      ? (process.env.AWS_SES_FROM_EMAIL || process.env.AWS_SES_SMTP_USER || '')
      : (process.env.GMAIL_SMTP_USER || '')
    const senderName = process.env.EMAIL_SENDER_NAME || process.env.GMAIL_SENDER_NAME || 'GARUDA-21 Training Center'

    const mailOptions = {
      from: {
        name: senderName,
        address: senderEmail,
      },
      to,
      subject,
      html,
    }

    const info = await trans.sendMail(mailOptions)
    console.log('Email sent successfully:', info.messageId)
    
    // Update recipient status if recipientId is provided
    if (recipientId) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
        if (supabaseUrl && serviceKey) {
          const { createClient } = await import('@supabase/supabase-js')
          const supabase = createClient(supabaseUrl, serviceKey)
          
          await supabase
            .from('email_recipients')
            .update({ 
              status: 'sent',
              message_id: info.messageId,
              sent_at: new Date().toISOString()
            })
            .eq('id', recipientId)
        }
      } catch (updateError) {
        console.error('Error updating recipient status:', updateError)
        // Don't fail the email send if tracking update fails
      }
    }
    
    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    console.error('Error sending email:', error)
    
    // Update recipient status to failed if recipientId is provided
    if (recipientId) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
        if (supabaseUrl && serviceKey) {
          const { createClient } = await import('@supabase/supabase-js')
          const supabase = createClient(supabaseUrl, serviceKey)
          
          await supabase
            .from('email_recipients')
            .update({ 
              status: 'failed',
              error_message: error.message || 'Unknown error'
            })
            .eq('id', recipientId)
        }
      } catch (updateError) {
        console.error('Error updating recipient status to failed:', updateError)
      }
    }
    
    // Handle rate limit errors (both Gmail and Amazon SES)
    const rateLimitCodes = ['EENVELOPE', 'ETIMEDOUT', 'ECONNRESET']
    const rateLimitResponseCodes = [550, 552, 421, 450, 451]
    
    if (rateLimitCodes.includes(error.code) || rateLimitResponseCodes.includes(error.responseCode)) {
      console.log('Rate limit detected, adding to queue')
      emailQueue.push({ to, subject, html, recipientId })
      return { success: false }
    }
    
    // Handle Amazon SES specific errors
    if (error.responseCode === 403) {
      console.error('Amazon SES: Access denied. Check SMTP credentials and IAM permissions.')
    } else if (error.responseCode === 454) {
      console.error('Amazon SES: Temporary failure. Email will be retried.')
      emailQueue.push({ to, subject, html, recipientId })
      return { success: false }
    }
    
    throw error
  }
}

// Daily email counter (reset setiap hari)
let dailyEmailCount = 0
let lastResetDate = new Date().toDateString()

// Reset daily counter jika sudah hari baru
function resetDailyCounterIfNeeded() {
  const today = new Date().toDateString()
  if (today !== lastResetDate) {
    dailyEmailCount = 0
    lastResetDate = today
    console.log('📅 Daily email counter reset')
  }
}

// Email provider limits
function getEmailLimits() {
  const useAmazonSES = process.env.EMAIL_PROVIDER === 'ses' || process.env.AWS_SES_SMTP_HOST
  
  if (useAmazonSES) {
    // Amazon SES limits (can be increased by requesting production access)
    // Sandbox: 200 emails/day, 1 email/second
    // Production: Can send up to 50,000 emails/day (or more with request)
    const isProduction = process.env.AWS_SES_PRODUCTION === 'true'
    return {
      dailyLimit: isProduction 
        ? parseInt(process.env.AWS_SES_DAILY_LIMIT || '50000')
        : 200, // Sandbox limit
      hourlyLimit: isProduction 
        ? parseInt(process.env.AWS_SES_HOURLY_LIMIT || '2000')
        : 200, // Sandbox limit
      safeDailyLimit: isProduction
        ? parseInt(process.env.AWS_SES_DAILY_LIMIT || '50000') * 0.95 // 95% of max
        : 190, // Safe limit for sandbox
      rateLimit: isProduction ? 14 : 1, // emails per second
      batchSize: isProduction ? 50 : 10,
      delayBetweenEmails: isProduction ? 100 : 1000, // ms
      delayBetweenBatches: isProduction ? 5000 : 10000, // ms
    }
  } else {
    // Gmail limits
    return {
      dailyLimit: 500, // Gmail free account limit
      hourlyLimit: 100, // Gmail rate limit per hour
      safeDailyLimit: 450, // Safe limit (90% of max) untuk menghindari ban
      rateLimit: 1,
      batchSize: 20,
      delayBetweenEmails: 2000, // ms
      delayBetweenBatches: 60000, // ms
    }
  }
}

// Process queue dengan batch processing dan rate limiting
async function processQueue() {
  if (isProcessingQueue || emailQueue.length === 0) return
  
  isProcessingQueue = true
  
  try {
    resetDailyCounterIfNeeded()
    const limits = getEmailLimits()
    
    // Check daily limit
    if (dailyEmailCount >= limits.safeDailyLimit) {
      console.warn(`⚠️ Daily email limit reached (${dailyEmailCount}/${limits.safeDailyLimit}). Queue processing paused.`)
      const provider = process.env.EMAIL_PROVIDER === 'ses' || process.env.AWS_SES_SMTP_HOST ? 'Amazon SES' : 'Gmail'
      console.warn(`💡 Current provider: ${provider}. Consider requesting production access for higher limits.`)
      isProcessingQueue = false
      return
    }
    
    while (emailQueue.length > 0) {
      // Check daily limit again before each batch
      resetDailyCounterIfNeeded()
      if (dailyEmailCount >= limits.safeDailyLimit) {
        console.warn(`⚠️ Daily limit reached. Remaining ${emailQueue.length} emails will be processed tomorrow.`)
        break
      }
      
      const batch = emailQueue.splice(0, Math.min(limits.batchSize, limits.safeDailyLimit - dailyEmailCount))
      
      // Send emails sequentially dengan delay untuk menghindari rate limit
      for (const item of batch) {
        try {
          const result = await sendEmail(item.to, item.subject, item.html, item.recipientId)
          if (result.success) {
            dailyEmailCount++
          }
          
          // Delay antara email untuk menghindari rate limit
          if (batch.indexOf(item) < batch.length - 1) {
            await new Promise(resolve => setTimeout(resolve, limits.delayBetweenEmails))
          }
        } catch (err) {
          console.error(`Failed to send email to ${item.to}:`, err)
          // Re-queue jika masih ada slot dan belum melebihi limit
          if (emailQueue.length < 1000 && dailyEmailCount < limits.safeDailyLimit) {
            emailQueue.push(item)
          }
        }
      }
      
      // Delay antara batch
      if (emailQueue.length > 0 && dailyEmailCount < limits.safeDailyLimit) {
        const provider = process.env.EMAIL_PROVIDER === 'ses' || process.env.AWS_SES_SMTP_HOST ? 'Amazon SES' : 'Gmail'
        console.log(`📧 [${provider}] Sent ${batch.length} emails. Queue remaining: ${emailQueue.length}. Daily count: ${dailyEmailCount}/${limits.safeDailyLimit}`)
        await new Promise(resolve => setTimeout(resolve, limits.delayBetweenBatches))
      }
    }
  } catch (error) {
    console.error('Error processing email queue:', error)
  } finally {
    isProcessingQueue = false
  }
}

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
      emailQueue.push({ to, subject, html, recipientId })
      // Start processing if not already processing
      if (!isProcessingQueue) {
        processQueue()
      }
      
      return NextResponse.json({
        success: true,
        message: 'Email added to queue',
        queueLength: emailQueue.length,
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
        message: 'Email queued for later delivery',
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

// Get queue status
export async function GET() {
  return NextResponse.json({
    queueLength: emailQueue.length,
    isProcessing: isProcessingQueue,
  })
}

