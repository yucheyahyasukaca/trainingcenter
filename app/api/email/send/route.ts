import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Discord Queue untuk mengirim email dalam batch (scalable untuk ribuan email)
interface EmailQueueItem {
  to: string
  subject: string
  html: string
  priority?: number
}

let emailQueue: EmailQueueItem[] = []
let isProcessingQueue = false
let transporter: nodemailer.Transporter | null = null

// Initialize Gmail SMTP transporter
function getTransporter() {
  if (transporter) return transporter

  // Gmail SMTP Configuration
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
    throw new Error('Gmail SMTP credentials not configured. Please set GMAIL_SMTP_USER and GMAIL_SMTP_PASS environment variables.')
  }

  transporter = nodemailer.createTransport(smtpConfig)
  return transporter
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
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const trans = getTransporter()
    
    const mailOptions = {
      from: {
        name: process.env.GMAIL_SENDER_NAME || 'GARUDA-21 Training Center',
        address: process.env.GMAIL_SMTP_USER || '',
      },
      to,
      subject,
      html,
    }

    const info = await trans.sendMail(mailOptions)
    console.log('Email sent successfully:', info.messageId)
    return true
  } catch (error: any) {
    console.error('Error sending email:', error)
    // Jika error karena rate limit, tambahkan ke queue
    if (error.code === 'EENVELOPE' || error.responseCode === 550 || error.responseCode === 552) {
      console.log('Rate limit detected, adding to queue')
      emailQueue.push({ to, subject, html })
      return false
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

// Gmail limits
const GMAIL_DAILY_LIMIT = 500 // Gmail free account limit
const GMAIL_HOURLY_LIMIT = 100 // Gmail rate limit per hour
const SAFE_DAILY_LIMIT = 450 // Safe limit (90% of max) untuk menghindari ban

// Process queue dengan batch processing dan rate limiting yang lebih ketat
async function processQueue() {
  if (isProcessingQueue || emailQueue.length === 0) return
  
  isProcessingQueue = true
  
  try {
    resetDailyCounterIfNeeded()
    
    // Check daily limit
    if (dailyEmailCount >= SAFE_DAILY_LIMIT) {
      console.warn(`⚠️ Daily email limit reached (${dailyEmailCount}/${SAFE_DAILY_LIMIT}). Queue processing paused.`)
      console.warn('💡 Recommendation: Use Google Workspace or email service provider for higher limits')
      isProcessingQueue = false
      return
    }
    
    // Batch size lebih kecil untuk menghindari rate limit Gmail
    const BATCH_SIZE = 20 // Reduced from 50 untuk lebih aman
    const DELAY_BETWEEN_BATCHES = 60000 // 60 seconds delay antara batch (lebih konservatif)
    const DELAY_BETWEEN_EMAILS = 2000 // 2 seconds delay antara email (untuk menghindari rate limit)
    
    while (emailQueue.length > 0) {
      // Check daily limit again before each batch
      resetDailyCounterIfNeeded()
      if (dailyEmailCount >= SAFE_DAILY_LIMIT) {
        console.warn(`⚠️ Daily limit reached. Remaining ${emailQueue.length} emails will be processed tomorrow.`)
        break
      }
      
      const batch = emailQueue.splice(0, Math.min(BATCH_SIZE, SAFE_DAILY_LIMIT - dailyEmailCount))
      
      // Send emails sequentially dengan delay untuk menghindari rate limit
      for (const item of batch) {
        try {
          await sendEmail(item.to, item.subject, item.html)
          dailyEmailCount++
          
          // Delay antara email untuk menghindari rate limit
          if (batch.indexOf(item) < batch.length - 1) {
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_EMAILS))
          }
        } catch (err) {
          console.error(`Failed to send email to ${item.to}:`, err)
          // Re-queue jika masih ada slot dan belum melebihi limit
          if (emailQueue.length < 1000 && dailyEmailCount < SAFE_DAILY_LIMIT) {
            emailQueue.push(item)
          }
        }
      }
      
      // Delay antara batch (lebih lama untuk menghindari rate limit)
      if (emailQueue.length > 0 && dailyEmailCount < SAFE_DAILY_LIMIT) {
        console.log(`📧 Sent ${batch.length} emails. Queue remaining: ${emailQueue.length}. Daily count: ${dailyEmailCount}/${SAFE_DAILY_LIMIT}`)
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
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
    const { to, subject, html, useQueue = true } = await request.json()

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
      return NextResponse.json(
        { error: 'SMTP connection failed. Please check Gmail SMTP configuration.' },
        { status: 500 }
      )
    }

    // If useQueue is true, add to queue for batch processing
    if (useQueue) {
      emailQueue.push({ to, subject, html })
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
    const success = await sendEmail(to, subject, html)
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
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

