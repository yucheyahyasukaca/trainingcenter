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
let currentProvider: string | null = null // Track current provider

// Reset transporter (useful when switching providers)
function resetTransporter() {
  if (transporter) {
    transporter.close()
    transporter = null
  }
  currentProvider = null
}

// Initialize Email Transporter (Amazon SES or Gmail SMTP)
function getTransporter() {
  // Check if using Amazon SES or Gmail SMTP
  const useAmazonSES = process.env.EMAIL_PROVIDER === 'ses' || process.env.AWS_SES_SMTP_HOST
  const provider = useAmazonSES ? 'ses' : 'gmail'
  
  // Reset transporter if provider changed
  if (transporter && currentProvider !== provider) {
    console.log(`🔄 Provider changed from ${currentProvider} to ${provider}, resetting transporter...`)
    resetTransporter()
  }
  
  // Return cached transporter if exists and provider matches
  if (transporter && currentProvider === provider) {
    return transporter
  }

  console.log(`📧 Initializing email transporter for provider: ${provider.toUpperCase()}`)

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

    console.log(`✅ Amazon SES Configuration:`)
    console.log(`   Host: ${smtpConfig.host}`)
    console.log(`   Port: ${smtpConfig.port}`)
    console.log(`   User: ${smtpConfig.auth.user.substring(0, 10)}...`)
    console.log(`   From: ${process.env.AWS_SES_FROM_EMAIL || 'not set'}`)

    transporter = nodemailer.createTransport(smtpConfig)
    currentProvider = 'ses'
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

    console.log(`✅ Gmail SMTP Configuration:`)
    console.log(`   Host: ${smtpConfig.host}`)
    console.log(`   Port: ${smtpConfig.port}`)
    console.log(`   User: ${smtpConfig.auth.user}`)

    transporter = nodemailer.createTransport(smtpConfig)
    currentProvider = 'gmail'
    return transporter
  }
}

// Verify SMTP connection
async function verifyTransporter() {
  try {
    const trans = getTransporter()
    const provider = currentProvider || (process.env.EMAIL_PROVIDER === 'ses' || process.env.AWS_SES_SMTP_HOST ? 'ses' : 'gmail')
    console.log(`🔍 Verifying ${provider.toUpperCase()} SMTP connection...`)
    await trans.verify()
    console.log(`✅ ${provider.toUpperCase()} SMTP connection verified successfully`)
    return true
  } catch (error) {
    const provider = currentProvider || (process.env.EMAIL_PROVIDER === 'ses' || process.env.AWS_SES_SMTP_HOST ? 'ses' : 'gmail')
    console.error(`❌ ${provider.toUpperCase()} SMTP verification failed:`, error)
    return false
  }
}

// Send single email
async function sendEmail(to: string, subject: string, html: string, recipientId?: string): Promise<{ success: boolean; messageId?: string }> {
  try {
    const trans = getTransporter()
    const provider = currentProvider || (process.env.EMAIL_PROVIDER === 'ses' || process.env.AWS_SES_SMTP_HOST ? 'ses' : 'gmail')
    
    // Determine sender email and name based on provider
    const useAmazonSES = provider === 'ses'
    const senderEmail = useAmazonSES 
      ? (process.env.AWS_SES_FROM_EMAIL || process.env.AWS_SES_SMTP_USER || '')
      : (process.env.GMAIL_SMTP_USER || '')
    const senderName = process.env.EMAIL_SENDER_NAME || process.env.GMAIL_SENDER_NAME || 'GARUDA-21 Training Center'

    console.log(`📧 Sending email via ${provider.toUpperCase()}:`)
    console.log(`   From: ${senderName} <${senderEmail}>`)
    console.log(`   To: ${to}`)
    console.log(`   Subject: ${subject.substring(0, 50)}...`)

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
    console.log(`✅ Email sent successfully via ${provider.toUpperCase()}:`, info.messageId)
    
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
    // Production: No strict daily limit (can send millions with proper setup)
    const isProduction = process.env.AWS_SES_PRODUCTION === 'true'
    
    if (isProduction) {
      // Production mode: No strict limits, only rate limiting
      return {
        dailyLimit: Infinity, // No daily limit for production
        hourlyLimit: Infinity, // No hourly limit
        safeDailyLimit: Infinity, // No daily limit restriction
        rateLimit: parseInt(process.env.AWS_SES_RATE_LIMIT || '14'), // emails per second (default 14)
        batchSize: parseInt(process.env.AWS_SES_BATCH_SIZE || '100'), // Larger batch for production
        delayBetweenEmails: parseInt(process.env.AWS_SES_DELAY_EMAILS || '50'), // Minimal delay (50ms)
        delayBetweenBatches: parseInt(process.env.AWS_SES_DELAY_BATCHES || '1000'), // Minimal delay (1s)
        hasDailyLimit: false, // Flag to disable daily limit checks
      }
    } else {
      // Sandbox mode: Strict limits
      return {
        dailyLimit: 200, // Sandbox limit
        hourlyLimit: 200,
        safeDailyLimit: 190, // Safe limit for sandbox
        rateLimit: 1, // emails per second
        batchSize: 10,
        delayBetweenEmails: 1000, // ms
        delayBetweenBatches: 10000, // ms
        hasDailyLimit: true, // Flag to enable daily limit checks
      }
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
      hasDailyLimit: true, // Flag to enable daily limit checks
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
    const provider = process.env.EMAIL_PROVIDER === 'ses' || process.env.AWS_SES_SMTP_HOST ? 'Amazon SES' : 'Gmail'
    const isSESProduction = (process.env.EMAIL_PROVIDER === 'ses' || process.env.AWS_SES_SMTP_HOST) && process.env.AWS_SES_PRODUCTION === 'true'
    
    // Check daily limit only if provider has daily limit restriction
    if (limits.hasDailyLimit && dailyEmailCount >= limits.safeDailyLimit) {
      console.warn(`⚠️ Daily email limit reached (${dailyEmailCount}/${limits.safeDailyLimit}). Queue processing paused.`)
      console.warn(`💡 Current provider: ${provider}. Consider requesting production access for higher limits.`)
      isProcessingQueue = false
      return
    }
    
    while (emailQueue.length > 0) {
      // Check daily limit only if provider has daily limit restriction
      if (limits.hasDailyLimit) {
        resetDailyCounterIfNeeded()
        if (dailyEmailCount >= limits.safeDailyLimit) {
          console.warn(`⚠️ Daily limit reached. Remaining ${emailQueue.length} emails will be processed tomorrow.`)
          break
        }
      }
      
      // For SES production, no daily limit restriction, send all available
      const batchSize = limits.hasDailyLimit 
        ? Math.min(limits.batchSize, limits.safeDailyLimit - dailyEmailCount)
        : limits.batchSize
      const batch = emailQueue.splice(0, batchSize)
      
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
          // Re-queue jika masih ada slot dan belum melebihi limit (only if has daily limit)
          if (!limits.hasDailyLimit || (emailQueue.length < 1000 && dailyEmailCount < limits.safeDailyLimit)) {
            emailQueue.push(item)
          }
        }
      }
      
      // Delay antara batch
      const canContinue = !limits.hasDailyLimit || dailyEmailCount < limits.safeDailyLimit
      if (emailQueue.length > 0 && canContinue) {
        const countMessage = limits.hasDailyLimit 
          ? `Daily count: ${dailyEmailCount}/${limits.safeDailyLimit}`
          : `Daily count: ${dailyEmailCount} (unlimited)`
        console.log(`📧 [${provider}] Sent ${batch.length} emails. Queue remaining: ${emailQueue.length}. ${countMessage}`)
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

// Get queue status and current provider
export async function GET() {
  const useAmazonSES = process.env.EMAIL_PROVIDER === 'ses' || process.env.AWS_SES_SMTP_HOST
  const provider = useAmazonSES ? 'ses' : 'gmail'
  
  // Check if credentials are configured
  const sesConfigured = !!(process.env.AWS_SES_SMTP_USER && process.env.AWS_SES_SMTP_PASS)
  const gmailConfigured = !!(process.env.GMAIL_SMTP_USER && process.env.GMAIL_SMTP_PASS)
  
  return NextResponse.json({
    queueLength: emailQueue.length,
    isProcessing: isProcessingQueue,
    currentProvider: currentProvider || provider,
    configuredProvider: provider,
    emailProvider: process.env.EMAIL_PROVIDER || 'gmail',
    sesConfigured,
    gmailConfigured,
    sesHost: process.env.AWS_SES_SMTP_HOST || (process.env.AWS_SES_REGION ? `email-smtp.${process.env.AWS_SES_REGION}.amazonaws.com` : 'not set'),
    sesFromEmail: process.env.AWS_SES_FROM_EMAIL || 'not set',
    gmailUser: process.env.GMAIL_SMTP_USER || 'not set',
  })
}

