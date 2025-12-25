'use server'

import { createServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { sendEmail } from '@/lib/mail'
import { generateHebatApprovedEmail } from '@/lib/email-templates'

export async function getSubmissions() {
    const supabase = createServerClient()

    const { data, error } = await supabase
        .from('hebat_submissions')
        .select(`
            *,
            trainers (
                user_profiles (
                    full_name,
                    email
                )
            )
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching submissions:', error)
        return []
    }

    return data
}

export async function updateSubmissionStatus(id: string, status: 'approved' | 'rejected', feedback?: string) {
    const supabase = createServerClient()

    // 1. Update status
    const { error } = await supabase
        .from('hebat_submissions')
        .update({
            status,
            admin_feedback: feedback,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (error) {
        return { error: 'Gagal mengupdate status' }
    }

    // 2. If Approved, Send Email Notification
    if (status === 'approved') {
        try {
            // Fetch submission details with trainer info
            const { data: submission, error: subError } = await supabase
                .from('hebat_submissions')
                .select(`
                    *,
                    trainers (
                        user_profiles (
                            full_name,
                            email
                        )
                    )
                `)
                .eq('id', id)
                .single()

            if (!subError && submission && submission.trainers?.user_profiles?.email) {
                const trainerEmail = submission.trainers.user_profiles.email
                const trainerName = submission.trainers.user_profiles.full_name || 'Partner'
                const category = submission.category || 'E'

                // Calculate points description (usually +5 for approved submissions)
                // Note: The actual points addition logic is handled by triggers usually
                const pointsEarned = 5

                const emailHtml = generateHebatApprovedEmail({
                    userName: trainerName,
                    submissionCategory: category,
                    pointsEarned: pointsEarned,
                    dashboardUrl: 'https://academy.garuda-21.com/trainer/dashboard'
                })

                await sendEmail(
                    trainerEmail,
                    'Selamat! Submission HEBAT Anda Disetujui 🎉',
                    emailHtml
                )
            }
        } catch (emailError) {
            console.error('Error sending approval email:', emailError)
            // Don't fail the operation, strictly speaking the DB update succeeded
        }
    }

    revalidatePath('/admin/hebat/submissions')
    revalidatePath('/trainer/dashboard')
    return { success: true }
}
