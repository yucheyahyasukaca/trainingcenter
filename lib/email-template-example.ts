import { replaceTemplateVariables, type TemplateUserData } from '@/lib/email-template-utils'

/**
 * Example: How to use template variables when sending emails
 * 
 * This function demonstrates how to replace template variables with actual user data
 * before sending an email.
 */
export async function sendEmailWithTemplate(
    templateContent: string,
    templateSubject: string,
    recipients: Array<{ email: string; name: string;[key: string]: any }>
) {
    const results = []

    for (const recipient of recipients) {
        // Prepare user data for template replacement
        const userData: TemplateUserData = {
            nama: recipient.name || recipient.email,
            email: recipient.email,
            program: recipient.program_name || '',
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
        const personalizedSubject = replaceTemplateVariables(templateSubject, userData)
        const personalizedContent = replaceTemplateVariables(templateContent, userData)

        // Send email (this is a placeholder - implement with your email service)
        try {
            await sendEmail({
                to: recipient.email,
                subject: personalizedSubject,
                html: personalizedContent,
            })

            results.push({ email: recipient.email, success: true })
        } catch (error) {
            results.push({ email: recipient.email, success: false, error })
        }
    }

    return results
}

// Placeholder for actual email sending function
async function sendEmail(params: { to: string; subject: string; html: string }) {
    // Implement with nodemailer or your email service
    console.log('Sending email:', params)
}
