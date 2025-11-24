import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { replaceTemplateVariables, type TemplateUserData } from '@/lib/email-template-utils'
import { cleanEmailHTML } from '@/lib/html-utils'

export const runtime = 'nodejs'

// Helper to fetch users based on criteria
async function fetchRecipients(supabase: any, target: string, specificEmails?: string[]) {
    if (target === 'specific' && specificEmails && specificEmails.length > 0) {
        // For specific emails, we need to fetch user data from database
        const { data, error } = await supabase
            .from('user_profiles')
            .select('id, email, full_name, role, created_at, referral_code')
            .in('email', specificEmails)

        if (error) {
            console.error('Error fetching specific users:', error)
            return specificEmails.map(email => ({ email }))
        }
        return data || []
    }

    let query = supabase
        .from('user_profiles')
        .select('id, email, full_name, role, created_at, referral_code')

    if (target === 'trainers') {
        query = query.eq('role', 'trainer')
    } else if (target === 'admins') {
        query = query.eq('role', 'admin')
    } else if (target === 'all') {
        // No filter
    } else {
        return []
    }

    const { data, error } = await query
    if (error) throw error
    return data
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { templateId, target, specificEmails, senderId } = body

        if (!templateId || !target) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
        const supabase = createClient(supabaseUrl, serviceKey)

        // 1. Get Template
        const { data: template, error: templateError } = await supabase
            .from('email_templates')
            .select('*')
            .eq('id', templateId)
            .single()

        if (templateError || !template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 })
        }

        // 2. Get Recipients
        const recipients = await fetchRecipients(supabase, target, specificEmails)

        if (!recipients || recipients.length === 0) {
            return NextResponse.json({ error: 'No recipients found' }, { status: 400 })
        }

        // 3. Send Emails (using the existing email API logic, but calling it directly or via fetch)
        // Since we are on the server, we can't easily call our own API route via fetch with localhost if not configured.
        // Better to import the send logic if possible, or just use fetch with the absolute URL if we know it.
        // Or just re-implement the queue pushing logic here.
        // Let's use the queue logic directly since we have access to the DB/Queue variables if we were in the same file.
        // But `emailQueue` is in another file's memory. We should call the API endpoint.

        const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const emailApiUrl = `${appUrl}/api/email/send`

        let successCount = 0
        let failCount = 0

        // We'll push to the queue in batches or one by one.
        // Since the /api/email/send endpoint handles queuing, we can just fire and forget or await.
        // For a large broadcast, we might want to just push to the queue.

        const emailPromises = recipients.map(async (recipient: any) => {
            if (!recipient.email) return

            try {
                // Prepare user data for template variable replacement
                const userData: TemplateUserData = {
                    nama: recipient.full_name || recipient.email.split('@')[0],
                    email: recipient.email,
                    program: '', // Will be filled if user has enrolled programs
                    kode_referral: recipient.referral_code || '',
                    tanggal_daftar: recipient.created_at
                        ? new Date(recipient.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })
                        : '',
                    role: recipient.role || 'participant',
                }

                // Replace variables in both subject and content
                const personalizedSubject = replaceTemplateVariables(template.subject, userData)
                let personalizedContent = replaceTemplateVariables(template.content, userData)

                // Add header image if configured (at the top of email)
                if (template.header_image_url) {
                    const headerImageHTML = `
<div style="margin: 0 0 30px 0; text-align: center;">
    <img src="${template.header_image_url}" alt="Header" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" />
</div>
                    `.trim()
                    personalizedContent = headerImageHTML + personalizedContent
                }

                // Add CTA button if configured
                if (template.cta_button_text && template.cta_button_url) {
                    const buttonColor = template.cta_button_color || '#3B82F6'
                    const buttonText = replaceTemplateVariables(template.cta_button_text, userData)
                    const buttonUrl = replaceTemplateVariables(template.cta_button_url, userData)
                    
                    // Generate email-friendly CTA button HTML
                    const ctaButtonHTML = `
<div style="margin: 30px 0; text-align: center;">
    <a href="${buttonUrl}" style="display: inline-block; padding: 14px 28px; background-color: ${buttonColor}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; font-family: Arial, sans-serif; line-height: 1.5;">
        ${buttonText}
    </a>
</div>
                    `.trim()
                    
                    personalizedContent = personalizedContent + ctaButtonHTML
                }

                // Clean up HTML to remove excessive spacing
                personalizedContent = cleanEmailHTML(personalizedContent)

                await fetch(emailApiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: recipient.email,
                        subject: personalizedSubject,
                        html: personalizedContent,
                        useQueue: true
                    })
                })
                successCount++
            } catch (err) {
                console.error(`Failed to queue email for ${recipient.email}`, err)
                failCount++
            }
        })

        // Wait for all requests to be initiated (not necessarily sent if queued)
        await Promise.all(emailPromises)

        // 4. Log the broadcast
        const { data: logData, error: logError } = await supabase.from('email_logs').insert({
            template_id: templateId,
            recipient_count: successCount,
            status: 'queued',
            sent_by: senderId, // Optional if we have it
            details: { target, failCount }
        }).select().single()

        if (logError) {
            console.error('Error logging broadcast:', logError)
        }

        // 5. Update status to "sent" after a delay (assuming emails are processed)
        // In production, you might want to use a webhook or polling mechanism
        if (logData && successCount > 0) {
            // Wait a bit for queue to process (adjust based on queue size)
            const delay = Math.min(successCount * 100, 10000) // Max 10 seconds
            
            setTimeout(async () => {
                try {
                    await supabase
                        .from('email_logs')
                        .update({ status: 'sent' })
                        .eq('id', logData.id)
                    console.log('✅ Updated email log status to "sent":', logData.id)
                } catch (err) {
                    console.error('Error updating email log status:', err)
                }
            }, delay)
        }

        return NextResponse.json({
            success: true,
            queued: successCount,
            failed: failCount,
            logId: logData?.id
        })

    } catch (error: any) {
        console.error('Broadcast error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
