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

// Process queue dengan batch processing
async function processQueue() {
  if (isProcessingQueue || emailQueue.length === 0) return
  
  isProcessingQueue = true
  
  try {
    // Batch size untuk menghindari rate limit Gmail (max 100 emails per session)
    const BATCH_SIZE = 50
    const DELAY_BETWEEN_BATCHES = 5000 // 5 seconds delay antara batch
    
    while (emailQueue.length > 0) {
      const batch = emailQueue.splice(0, BATCH_SIZE)
      
      // Send emails in parallel (dengan concurrency limit)
      const CONCURRENCY_LIMIT = 10
      for (let i = 0; i < batch.length; i += CONCURRENCY_LIMIT) {
        const chunk = batch.slice(i, i + CONCURRENCY_LIMIT)
        
        await Promise.allSettled(
          chunk.map(item => 
            sendEmail(item.to, item.subject, item.html).catch(err => {
              console.error(`Failed to send email to ${item.to}:`, err)
              // Re-queue jika lain kali masih bisa dicoba
              if (emailQueue.length < 1000) { // Prevent infinite queue growth
                emailQueue.push(item)
              }
            })
          )
        )
        
        // Small delay untuk menghindari rate limit
        if (i + CONCURRENCY_LIMIT < batch.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      
      // Delay antara batch
      if (emailQueue.length > 0) {
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

