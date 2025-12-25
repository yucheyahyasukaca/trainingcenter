import nodemailer from 'nodemailer'

// Queue Interfaces
interface EmailQueueItem {
    to: string
    subject: string
    html: string
    recipientId?: string
    priority?: number
}

// Global State
let emailQueue: EmailQueueItem[] = []
let isProcessingQueue = false
let transporter: nodemailer.Transporter | null = null
let currentProvider: string | null = null
let dailyEmailCount = 0
let lastResetDate = new Date().toDateString()

// Reset transporter (useful when switching providers)
export function resetTransporter() {
    if (transporter) {
        transporter.close()
        transporter = null
    }
    currentProvider = null
}

// Initialize Email Transporter (Amazon SES or Gmail SMTP)
export function getTransporter() {
    const useAmazonSES = process.env.EMAIL_PROVIDER === 'ses' || !!process.env.AWS_SES_SMTP_HOST
    const provider = useAmazonSES ? 'ses' : 'gmail'

    if (transporter && currentProvider !== provider) {
        console.log(`🔄 Provider changed from ${currentProvider} to ${provider}, resetting transporter...`)
        resetTransporter()
    }

    if (transporter && currentProvider === provider) {
        return transporter
    }

    console.log(`📧 Initializing email transporter for provider: ${provider.toUpperCase()}`)

    if (useAmazonSES) {
        // Amazon SES SMTP Configuration
        const smtpConfig = {
            host: process.env.AWS_SES_SMTP_HOST || (process.env.AWS_SES_REGION
                ? `email-smtp.${process.env.AWS_SES_REGION}.amazonaws.com`
                : 'email-smtp.us-east-1.amazonaws.com'),
            port: parseInt(process.env.AWS_SES_SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.AWS_SES_SMTP_USER || '',
                pass: process.env.AWS_SES_SMTP_PASS || '',
            },
            tls: {
                ciphers: 'SSLv3',
                rejectUnauthorized: false,
            },
        }

        if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
            // Fallback or warning - though throwing might be better to alert config issues
            console.warn('Amazon SES SMTP credentials not fully configured.')
        }

        transporter = nodemailer.createTransport(smtpConfig)
        currentProvider = 'ses'
        return transporter
    } else {
        // Gmail SMTP Configuration (fallback)
        const smtpConfig = {
            host: process.env.GMAIL_SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.GMAIL_SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.GMAIL_SMTP_USER || '',
                pass: process.env.GMAIL_SMTP_PASS || '',
            },
        }

        if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
            console.warn('Gmail SMTP credentials not fully configured.')
        }

        transporter = nodemailer.createTransport(smtpConfig)
        currentProvider = 'gmail'
        return transporter
    }
}

// Verify SMTP connection
export async function verifyTransporter() {
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

// Check daily limits
function resetDailyCounterIfNeeded() {
    const today = new Date().toDateString()
    if (today !== lastResetDate) {
        dailyEmailCount = 0
        lastResetDate = today
        console.log('📅 Daily email counter reset')
    }
}

function getEmailLimits() {
    const useAmazonSES = process.env.EMAIL_PROVIDER === 'ses' || !!process.env.AWS_SES_SMTP_HOST

    if (useAmazonSES) {
        const isProduction = process.env.AWS_SES_PRODUCTION === 'true'
        if (isProduction) {
            return {
                dailyLimit: Infinity,
                safeDailyLimit: Infinity,
                rateLimit: parseInt(process.env.AWS_SES_RATE_LIMIT || '14'),
                batchSize: parseInt(process.env.AWS_SES_BATCH_SIZE || '100'),
                delayBetweenEmails: parseInt(process.env.AWS_SES_DELAY_EMAILS || '50'),
                delayBetweenBatches: parseInt(process.env.AWS_SES_DELAY_BATCHES || '1000'),
                hasDailyLimit: false,
            }
        } else {
            return {
                dailyLimit: 200,
                safeDailyLimit: 190,
                rateLimit: 1,
                batchSize: 10,
                delayBetweenEmails: 1000,
                delayBetweenBatches: 10000,
                hasDailyLimit: true,
            }
        }
    } else {
        return {
            dailyLimit: 500,
            safeDailyLimit: 450,
            rateLimit: 1,
            batchSize: 20,
            delayBetweenEmails: 2000,
            delayBetweenBatches: 60000,
            hasDailyLimit: true,
        }
    }
}

// Send single email
export async function sendEmail(to: string, subject: string, html: string, recipientId?: string): Promise<{ success: boolean; messageId?: string }> {
    try {
        const trans = getTransporter()
        const provider = currentProvider || (process.env.EMAIL_PROVIDER === 'ses' || process.env.AWS_SES_SMTP_HOST ? 'ses' : 'gmail')

        const useAmazonSES = provider === 'ses'
        const senderEmail = useAmazonSES
            ? (process.env.AWS_SES_FROM_EMAIL || process.env.AWS_SES_SMTP_USER || '')
            : (process.env.GMAIL_SMTP_USER || '')
        const senderName = process.env.EMAIL_SENDER_NAME || process.env.GMAIL_SENDER_NAME || 'GARUDA-21 Training Center'

        // Simple validation
        if (!to || !senderEmail) {
            console.error('❌ Missing "to" or "from" address')
            return { success: false }
        }

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

        // Update Supabase if needed
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
            }
        }

        return { success: true, messageId: info.messageId }

    } catch (error: any) {
        console.error('Error sending email:', error)

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
            } catch (uErr) {
                console.error('Error updating status to failed', uErr)
            }
        }

        // Rate limit handling
        const rateLimitCodes = ['EENVELOPE', 'ETIMEDOUT', 'ECONNRESET']
        const rateLimitResponseCodes = [550, 552, 421, 450, 451]

        if (rateLimitCodes.includes(error.code) || rateLimitResponseCodes.includes(error.responseCode)) {
            console.log('Rate limit detected, adding to queue')
            // push back to queue if called from processQueue loop (handled there mostly), 
            // but if called directly we might want to queue it.
            // For simplicity in this direct call, we just return failure.
            return { success: false }
        }

        return { success: false }
    }
}

// Queue Processing
export async function processQueue() {
    if (isProcessingQueue || emailQueue.length === 0) return

    isProcessingQueue = true

    try {
        resetDailyCounterIfNeeded()
        const limits = getEmailLimits()
        const provider = currentProvider || 'Gmail'

        if (limits.hasDailyLimit && dailyEmailCount >= limits.safeDailyLimit) {
            console.warn(`⚠️ Daily email limit reached (${dailyEmailCount}/${limits.safeDailyLimit}). Queue processing paused.`)
            isProcessingQueue = false
            return
        }

        while (emailQueue.length > 0) {
            if (limits.hasDailyLimit) {
                resetDailyCounterIfNeeded()
                if (dailyEmailCount >= limits.safeDailyLimit) {
                    break
                }
            }

            const batchSize = limits.hasDailyLimit
                ? Math.min(limits.batchSize, limits.safeDailyLimit - dailyEmailCount)
                : limits.batchSize
            const batch = emailQueue.splice(0, batchSize)

            for (const item of batch) {
                try {
                    const result = await sendEmail(item.to, item.subject, item.html, item.recipientId)
                    if (result.success) {
                        dailyEmailCount++
                    }

                    if (batch.indexOf(item) < batch.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, limits.delayBetweenEmails))
                    }
                } catch (err) {
                    console.error(`Failed to send email in queue to ${item.to}`, err)
                    // Re-queue strategies could go here
                }
            }

            const canContinue = !limits.hasDailyLimit || dailyEmailCount < limits.safeDailyLimit
            if (emailQueue.length > 0 && canContinue) {
                await new Promise(resolve => setTimeout(resolve, limits.delayBetweenBatches))
            }
        }
    } catch (error) {
        console.error('Error processing email queue:', error)
    } finally {
        isProcessingQueue = false
    }
}

export function addToQueue(item: EmailQueueItem) {
    emailQueue.push(item)
    if (!isProcessingQueue) {
        processQueue()
    }
    return emailQueue.length
}

export function getQueueStatus() {
    return {
        queueLength: emailQueue.length,
        isProcessing: isProcessingQueue,
        dailyEmailCount,
        provider: currentProvider
    }
}
