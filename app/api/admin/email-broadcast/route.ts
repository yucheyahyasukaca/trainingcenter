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
        await supabase.from('email_logs').insert({
            template_id: templateId,
            recipient_count: successCount,
            status: 'queued',
            sent_by: senderId, // Optional if we have it
            details: { target, failCount }
        })

        return NextResponse.json({
            success: true,
            queued: successCount,
            failed: failCount
        })

    } catch (error: any) {
        console.error('Broadcast error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
