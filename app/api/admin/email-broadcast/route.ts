import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { replaceTemplateVariables, type TemplateUserData } from '@/lib/email-template-utils'
import { cleanEmailHTML } from '@/lib/html-utils'
import { getAppBaseUrl } from '@/lib/url-utils'

// Helper function to generate email signature HTML
function generateSignatureHTML(template: any): string {
    const parts: string[] = []

    // Signature container with tighter spacing and center alignment
    parts.push('<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">')

    // Logo (if provided) - preserve transparency, centered
    if (template.signature_logo_url) {
        parts.push(`
            <div style="margin-bottom: 8px; text-align: center;">
                <img src="${template.signature_logo_url}" alt="Logo" style="max-width: 200px; max-height: 80px; height: auto; display: block; margin: 0 auto;" />
            </div>
        `)
    }

    // Name and Title with tighter spacing, centered
    if (template.signature_name) {
        parts.push(`<div style="margin-bottom: 2px; line-height: 1.3; text-align: center;"><strong style="font-size: 15px; color: #111827; font-family: Arial, sans-serif;">${template.signature_name}</strong></div>`)
    }
    if (template.signature_title) {
        parts.push(`<div style="margin-bottom: 6px; line-height: 1.3; color: #6b7280; font-size: 13px; font-family: Arial, sans-serif; text-align: center;">${template.signature_title}</div>`)
    }

    // Contact Information with tighter spacing, centered
    const contactInfo: string[] = []
    if (template.signature_email) {
        contactInfo.push(`<a href="mailto:${template.signature_email}" style="color: #3b82f6; text-decoration: none; font-size: 13px; font-family: Arial, sans-serif;">${template.signature_email}</a>`)
    }
    if (template.signature_phone) {
        contactInfo.push(`<span style="color: #374151; font-size: 13px; font-family: Arial, sans-serif;">${template.signature_phone}</span>`)
    }
    if (template.signature_website) {
        contactInfo.push(`<a href="${template.signature_website}" style="color: #3b82f6; text-decoration: none; font-size: 13px; font-family: Arial, sans-serif;">${template.signature_website}</a>`)
    }

    if (contactInfo.length > 0) {
        parts.push(`<div style="margin-bottom: 4px; line-height: 1.4; text-align: center;">${contactInfo.join(' | ')}</div>`)
    }

    // Address with tighter spacing, centered
    if (template.signature_address) {
        parts.push(`<div style="color: #6b7280; font-size: 12px; font-family: Arial, sans-serif; line-height: 1.4; margin-top: 4px; text-align: center;">${template.signature_address}</div>`)
    }

    parts.push('</div>')

    return parts.join('\n')
}

export const runtime = 'nodejs'

// Helper to fetch users based on criteria
async function fetchRecipients(supabase: any, target: string, specificEmails?: string[]) {
    if (target === 'specific' && specificEmails && specificEmails.length > 0) {
        // For specific emails, we need to fetch user data from database
        console.log(`🔍 Fetching specific users for emails:`, specificEmails)
        const { data, error } = await supabase
            .from('user_profiles')
            .select('id, email, full_name, role, created_at')
            .in('email', specificEmails)

        // Get all auth users to fill in missing data
        let authUsersList: any[] = []
        try {
            const { data: authUsers } = await supabase.auth.admin.listUsers()
            authUsersList = authUsers?.users || []
            console.log(`✅ Fetched ${authUsersList.length} users from auth.users`)
        } catch (authErr) {
            console.error('❌ Error fetching auth users:', authErr)
        }

        if (error || !data || data.length === 0) {
            console.error('❌ Error fetching specific users or no data:', error)
            // Get from auth.users if user_profiles fails or returns empty
            console.log('⚠️ Trying to get users from auth.users...')
            return specificEmails.map(email => {
                const authUser = authUsersList.find((u: any) => u.email === email)
                const fullName = authUser?.user_metadata?.full_name ||
                    authUser?.raw_user_meta_data?.full_name ||
                    ''
                console.log(`📋 Auth user untuk ${email}:`, {
                    id: authUser?.id,
                    user_metadata: authUser?.user_metadata,
                    raw_user_meta_data: authUser?.raw_user_meta_data,
                    full_name: fullName
                })
                return {
                    email,
                    id: authUser?.id || null,
                    full_name: fullName,
                    role: 'participant',
                    created_at: authUser?.created_at || null
                }
            })
        }

        console.log(`✅ Fetched ${data.length} users from user_profiles`)
        console.log(`📋 Sample user data:`, data[0] ? {
            email: data[0].email,
            id: data[0].id,
            full_name: data[0].full_name,
            has_id: !!data[0].id
        } : 'No data')

        // Ensure all users have id and full_name - fill from auth.users if missing
        const enrichedData = await Promise.all((data || []).map(async (user: any) => {
            // If user doesn't have id, try to get from auth.users
            if (!user.id) {
                console.warn(`⚠️ User ${user.email} tidak memiliki id, mencoba ambil dari auth.users...`)
                const authUser = authUsersList.find((u: any) => u.email === user.email)
                if (authUser) {
                    user.id = authUser.id
                    console.log(`✅ Updated user ${user.email} dengan id: ${authUser.id}`)
                } else {
                    console.warn(`⚠️ User ${user.email} tidak ditemukan di auth.users juga`)
                }
            }

            // If user doesn't have full_name or it's empty, try to get from auth.users
            if (!user.full_name || user.full_name.trim() === '') {
                console.warn(`⚠️ User ${user.email} tidak memiliki full_name, mencoba ambil dari auth.users...`)
                const authUser = authUsersList.find((u: any) => u.email === user.email)
                if (authUser) {
                    user.full_name = authUser.user_metadata?.full_name ||
                        authUser.raw_user_meta_data?.full_name ||
                        ''
                    console.log(`✅ Updated user ${user.email} full_name: "${user.full_name}"`)
                }
            }

            return user
        }))

        // Also check for emails that weren't found in user_profiles
        const foundEmails = new Set(data.map((u: any) => u.email))
        const missingEmails = specificEmails.filter(email => !foundEmails.has(email))

        if (missingEmails.length > 0) {
            console.log(`⚠️ ${missingEmails.length} emails tidak ditemukan di user_profiles, mencoba dari auth.users:`, missingEmails)
            missingEmails.forEach(email => {
                const authUser = authUsersList.find((u: any) => u.email === email)
                if (authUser) {
                    const fullName = authUser.user_metadata?.full_name ||
                        authUser.raw_user_meta_data?.full_name ||
                        ''
                    console.log(`📋 Adding missing user ${email}:`, {
                        id: authUser.id,
                        full_name: fullName,
                        user_metadata: authUser.user_metadata,
                        raw_user_meta_data: authUser.raw_user_meta_data
                    })
                    enrichedData.push({
                        email,
                        id: authUser.id,
                        full_name: fullName,
                        role: 'participant',
                        created_at: authUser.created_at || null
                    })
                }
            })
        }

        console.log(`📤 Returning ${enrichedData.length} enriched recipients`)
        enrichedData.forEach((r: any) => {
            console.log(`  - ${r.email}: id=${r.id || 'MISSING'}, full_name="${r.full_name || 'MISSING'}"`)
        })
        return enrichedData
    }

    let query = supabase
        .from('user_profiles')
        .select('id, email, full_name, role, created_at')

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

    // Enrich with auth.users data if full_name is empty or null
    const enrichedData = await Promise.all((data || []).map(async (user: any) => {
        if (!user.full_name || user.full_name.trim() === '') {
            try {
                // Try to get from auth.users metadata
                const { data: authUser } = await supabase.auth.admin.getUserById(user.id)
                if (authUser?.user?.user_metadata?.full_name) {
                    user.full_name = authUser.user.user_metadata.full_name
                } else if (authUser?.user?.raw_user_meta_data?.full_name) {
                    user.full_name = authUser.user.raw_user_meta_data.full_name
                }
            } catch (err) {
                console.warn(`Could not fetch auth data for user ${user.id}:`, err)
            }
        }
        return user
    }))

    return enrichedData
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { templateId, target, specificEmails, senderId, excelRecipients } = body

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
        console.log('📋 Fetching recipients...', { target, specificEmails, excelRecipients: excelRecipients?.length || 0 })

        let recipients: any[] = []

        // If using Excel, use Excel recipients directly
        if (target === 'excel' && excelRecipients && excelRecipients.length > 0) {
            console.log(`📋 Using ${excelRecipients.length} recipients from Excel file`)
            recipients = excelRecipients.map((r: any) => ({
                email: r.email,
                full_name: r.name || '', // Use name from Excel
                id: null, // Excel recipients don't have user ID
                role: 'participant',
                created_at: null,
            }))
        } else {
            recipients = await fetchRecipients(supabase, target, specificEmails)
        }

        console.log(`✅ Fetched ${recipients?.length || 0} recipients`)

        if (!recipients || recipients.length === 0) {
            return NextResponse.json({ error: 'No recipients found' }, { status: 400 })
        }

        // Log first recipient untuk debugging
        if (recipients.length > 0) {
            console.log('📋 First recipient sample:', {
                email: recipients[0].email,
                full_name: recipients[0].full_name,
                id: recipients[0].id
            })
        }

        // 3. Send Emails (using the existing email API logic, but calling it directly or via fetch)
        // Since we are on the server, we can't easily call our own API route via fetch with localhost if not configured.
        // Better to import the send logic if possible, or just use fetch with the absolute URL if we know it.
        // Or just re-implement the queue pushing logic here.
        // Let's use the queue logic directly since we have access to the DB/Queue variables if we were in the same file.
        // But `emailQueue` is in another file's memory. We should call the API endpoint.

        const appUrl = getAppBaseUrl()
        const emailApiUrl = `${appUrl}/api/email/send`

        let successCount = 0
        let failCount = 0

        // We'll push to the queue in batches or one by one.
        // Since the /api/email/send endpoint handles queuing, we can just fire and forget or await.
        // For a large broadcast, we might want to just push to the queue.

        // 3. Log the broadcast FIRST (before tracking recipients)
        const { data: logData, error: logError } = await supabase.from('email_logs').insert({
            template_id: templateId,
            recipient_count: 0, // Will be updated by trigger
            status: 'queued',
            sent_by: senderId, // Optional if we have it
            details: { target, failCount: 0 }
        }).select().single()

        if (logError) {
            console.error('Error logging broadcast:', logError)
            return NextResponse.json({ error: 'Failed to create email log' }, { status: 500 })
        }

        // 4. Create email_recipients records for tracking
        const recipientRecords = recipients.map((recipient: any) => ({
            email_log_id: logData.id,
            recipient_email: recipient.email,
            recipient_name: recipient.full_name || '',
            status: 'queued'
        }))

        const { error: recipientsError } = await supabase
            .from('email_recipients')
            .insert(recipientRecords)

        if (recipientsError) {
            console.error('Error creating recipient records:', recipientsError)
        } else {
            console.log(`✅ Created ${recipientRecords.length} recipient tracking records`)
        }

        console.log(`📧 Starting to process ${recipients.length} recipients for email broadcast`)

        // 5. Process emails with tracking
        const emailPromises = recipients.map(async (recipient: any) => {
            if (!recipient.email) {
                console.warn('⚠️ Skipping recipient without email')
                return
            }

            try {
                console.log(`\n🔄 Processing recipient: ${recipient.email}`)

                // CRITICAL: Use name from Excel if available (for new users), otherwise fetch from database
                let nama = ''

                // If recipient has full_name already (from Excel), use it directly
                if (recipient.full_name && recipient.full_name.trim() !== '') {
                    nama = recipient.full_name.trim()
                    console.log(`✅ Menggunakan nama dari Excel untuk ${recipient.email}: "${nama}"`)
                } else if (recipient.id) {
                    // Only fetch from database if recipient has ID (existing user)
                    try {
                        // Direct query to get fresh full_name from database
                        const { data: freshUser, error: freshError } = await supabase
                            .from('user_profiles')
                            .select('full_name')
                            .eq('id', recipient.id)
                            .single()

                        if (!freshError && freshUser?.full_name) {
                            nama = freshUser.full_name.trim()
                            console.log(`✅ Fresh full_name dari database untuk ${recipient.email}: "${nama}"`)
                        } else {
                            console.warn(`⚠️ Tidak bisa ambil fresh full_name untuk ${recipient.email}, menggunakan dari recipient:`, freshError)
                            nama = recipient.full_name?.trim() || ''
                        }
                    } catch (err) {
                        console.error(`❌ Error fetching fresh full_name untuk ${recipient.email}:`, err)
                        nama = recipient.full_name?.trim() || ''
                    }
                } else {
                    console.warn(`⚠️ Recipient ${recipient.email} tidak memiliki id, menggunakan full_name dari recipient object`)
                    nama = recipient.full_name?.trim() || ''
                }

                // If still no nama and we have email, try to get from auth.users by email
                if ((!nama || nama === '') && recipient.email) {
                    console.log(`⚠️ full_name masih kosong untuk ${recipient.email}, mencoba ambil dari auth.users berdasarkan email...`)
                    try {
                        const { data: authUsers } = await supabase.auth.admin.listUsers()
                        const authUser = authUsers?.users?.find((u: any) => u.email === recipient.email)
                        if (authUser) {
                            console.log(`🔍 Auth user ditemukan untuk ${recipient.email}:`, {
                                id: authUser.id,
                                user_metadata: authUser.user_metadata,
                                raw_user_meta_data: authUser.raw_user_meta_data
                            })
                            nama = authUser.user_metadata?.full_name ||
                                authUser.raw_user_meta_data?.full_name ||
                                ''
                            if (nama) {
                                nama = nama.trim()
                                console.log(`✅ Mengambil nama dari auth.users untuk ${recipient.email}: "${nama}"`)
                            } else {
                                console.warn(`⚠️ full_name masih kosong di auth.users untuk ${recipient.email}`)
                            }
                        } else {
                            console.warn(`⚠️ User ${recipient.email} tidak ditemukan di auth.users`)
                        }
                    } catch (err) {
                        console.error(`❌ Error fetching from auth.users untuk ${recipient.email}:`, err)
                    }
                }

                console.log(`🔍 Processing recipient ${recipient.email}:`, {
                    id: recipient.id,
                    full_name_from_recipient: recipient.full_name,
                    full_name_final: nama,
                    full_name_length: nama.length
                })

                // Only use fallback if full_name is truly empty
                if (!nama || nama === '') {
                    console.log(`⚠️ full_name kosong untuk ${recipient.email}, mencoba ambil dari auth.users...`)

                    if (recipient.id) {
                        try {
                            const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(recipient.id)

                            if (authError) {
                                console.error(`❌ Error fetching auth user ${recipient.id}:`, authError)
                            } else {
                                if (authUser?.user?.user_metadata?.full_name) {
                                    nama = authUser.user.user_metadata.full_name.trim()
                                    console.log(`✅ Menggunakan nama dari user_metadata: "${nama}"`)
                                } else if (authUser?.user?.raw_user_meta_data?.full_name) {
                                    nama = authUser.user.raw_user_meta_data.full_name.trim()
                                    console.log(`✅ Menggunakan nama dari raw_user_meta_data: "${nama}"`)
                                }
                            }
                        } catch (err) {
                            console.error(`❌ Exception saat fetch auth user ${recipient.id}:`, err)
                        }
                    }

                    // Only use email fallback if still empty (last resort)
                    if (!nama || nama === '') {
                        const emailUsername = recipient.email.split('@')[0]
                        nama = emailUsername
                            .split(/[._-]/)
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                            .join(' ')
                        console.log(`⚠️ Menggunakan fallback dari email: "${nama}"`)
                    }
                } else {
                    // full_name exists - use it directly, no fallback
                    console.log(`✅ Menggunakan full_name: "${nama}" (length: ${nama.length})`)
                }

                // Get user's enrolled programs
                let program = ''
                if (recipient.id) {
                    try {
                        // First, get participant_id from participants table
                        const { data: participant } = await supabase
                            .from('participants')
                            .select('id')
                            .eq('user_id', recipient.id)
                            .maybeSingle()

                        if (participant) {
                            // Get enrollments with program titles
                            const { data: enrollments } = await supabase
                                .from('enrollments')
                                .select(`
                                    program_id,
                                    programs:programs(
                                        title
                                    )
                                `)
                                .eq('participant_id', participant.id)
                                .order('created_at', { ascending: false })
                                .limit(5) // Get latest 5 programs

                            if (enrollments && enrollments.length > 0) {
                                // Get unique program titles
                                const programTitles = enrollments
                                    .map((e: any) => e.programs?.title)
                                    .filter((title: string) => title)
                                    .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index) // Remove duplicates

                                if (programTitles.length > 0) {
                                    program = programTitles.length === 1
                                        ? programTitles[0]
                                        : programTitles.join(', ')
                                    console.log(`✅ Program untuk ${recipient.email}: "${program}"`)
                                }
                            }
                        }
                    } catch (programError) {
                        console.warn(`⚠️ Error fetching programs for ${recipient.email}:`, programError)
                    }
                }

                const userData: TemplateUserData = {
                    nama: nama,
                    email: recipient.email,
                    program: program || 'Program Training', // Fallback jika tidak ada program
                    kode_referral: '',
                    tanggal_daftar: recipient.created_at
                        ? new Date(recipient.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })
                        : '',
                    role: recipient.role || 'participant',
                }

                console.log(`📧 Final data untuk ${recipient.email}: nama="${nama}", program="${program}"`)
                console.log(`📧 UserData object:`, JSON.stringify(userData, null, 2))
                console.log(`📧 Template content sebelum replace:`, template.content.substring(0, 200))

                // Replace variables in both subject and content
                const personalizedSubject = replaceTemplateVariables(template.subject, userData)
                let personalizedContent = replaceTemplateVariables(template.content, userData)

                console.log(`📧 Personalized subject: "${personalizedSubject}"`)
                console.log(`📧 Personalized content setelah replace:`, personalizedContent.substring(0, 300))

                // Verify that {{nama}} was replaced
                if (personalizedContent.includes('{{nama}}')) {
                    console.error(`❌ ERROR: {{nama}} masih ada di content setelah replace!`)
                } else {
                    console.log(`✅ {{nama}} berhasil di-replace`)
                }

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

                // Add email signature if enabled
                if (template.signature_enabled) {
                    const signatureHTML = generateSignatureHTML(template)
                    personalizedContent = personalizedContent + signatureHTML
                }

                // Clean up HTML to remove excessive spacing
                personalizedContent = cleanEmailHTML(personalizedContent)

                // Wrap content in centered container for better email display
                const emailWrapper = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="padding: 40px 30px;">
                            ${personalizedContent}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
                `.trim()

                // Find the recipient record ID for tracking
                const { data: recipientRecord } = await supabase
                    .from('email_recipients')
                    .select('id')
                    .eq('email_log_id', logData.id)
                    .eq('recipient_email', recipient.email)
                    .single()

                await fetch(emailApiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: recipient.email,
                        subject: personalizedSubject,
                        html: emailWrapper,
                        useQueue: true,
                        recipientId: recipientRecord?.id // Pass recipient ID for tracking
                    })
                })
                successCount++
            } catch (err) {
                console.error(`Failed to queue email for ${recipient.email}`, err)
                failCount++

                // Update recipient status to failed
                if (logData) {
                    await supabase
                        .from('email_recipients')
                        .update({
                            status: 'failed',
                            error_message: err instanceof Error ? err.message : 'Unknown error'
                        })
                        .eq('email_log_id', logData.id)
                        .eq('recipient_email', recipient.email)
                }
            }
        })

        // 6. Wait for all requests to be initiated
        await Promise.all(emailPromises)

        // Check if email count exceeds daily limit
        const emailCount = recipients.length
        const useAmazonSES = process.env.EMAIL_PROVIDER === 'ses' || process.env.AWS_SES_SMTP_HOST
        const isProduction = process.env.AWS_SES_PRODUCTION === 'true'

        let warning = null
        if (useAmazonSES) {
            if (isProduction) {
                // Production mode: No daily limit warning, only info for very large batches
                if (emailCount > 10000) {
                    warning = `ℹ️ Info: Anda akan mengirim ${emailCount} email. Amazon SES production mode aktif - tidak ada daily limit. Email akan diproses dengan rate limit ${process.env.AWS_SES_RATE_LIMIT || '14'} email/detik.`
                }
            } else {
                // Sandbox mode: Show warnings for limits
                const sesDailyLimit = 200
                const sesSafeLimit = 190

                if (emailCount > sesSafeLimit) {
                    warning = `⚠️ Peringatan: Anda akan mengirim ${emailCount} email, melebihi batas sandbox Amazon SES (${sesSafeLimit}/hari). Mode sandbox aktif - request production access untuk limit lebih tinggi.`
                    console.warn(warning)
                } else if (emailCount > sesDailyLimit * 0.8) {
                    warning = `ℹ️ Info: Anda akan mengirim ${emailCount} email. Mode sandbox - limit 200 email/hari. Request production access untuk limit lebih tinggi.`
                }
            }
        } else {
            // Gmail limits
            const GMAIL_DAILY_LIMIT = 500
            const SAFE_DAILY_LIMIT = 450

            if (emailCount > SAFE_DAILY_LIMIT) {
                warning = `⚠️ Peringatan: Anda akan mengirim ${emailCount} email, melebihi batas aman Gmail (${SAFE_DAILY_LIMIT}/hari). Email akan diproses dalam beberapa hari atau beberapa email mungkin gagal terkirim. Disarankan menggunakan Amazon SES atau email service provider untuk volume besar.`
                console.warn(warning)
            } else if (emailCount > 300) {
                warning = `ℹ️ Info: Anda akan mengirim ${emailCount} email. Pastikan daily limit Gmail belum tercapai (${SAFE_DAILY_LIMIT}/hari).`
            }
        }

        return NextResponse.json({
            success: true,
            queued: successCount,
            warning: warning,
            failed: failCount,
            logId: logData?.id
        })

    } catch (error: any) {
        console.error('Broadcast error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
