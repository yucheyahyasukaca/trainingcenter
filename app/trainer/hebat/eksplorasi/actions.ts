'use server'

import { createServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { sendEmail } from '@/lib/mail'
import { generateHebatSubmissionAdminEmail } from '@/lib/email-templates'

const schema = z.object({
    focus: z.enum(['A', 'B']),
    story: z.string().min(50, 'Cerita minimal 50 karakter').max(1000, 'Cerita maksimal 1000 karakter'),
    solution: z.string().max(200, 'Solusi maksimal 200 karakter'),
})

export async function submitExploration(formData: FormData) {
    const supabase = createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { error: 'Unauthorized' }
    }

    const focus = formData.get('focus') as string
    const story = formData.get('story') as string
    const solution = formData.get('solution') as string
    const file = formData.get('documentation') as File

    // Validation
    const validation = schema.safeParse({ focus, story, solution })
    if (!validation.success) {
        return { error: validation.error.issues[0].message }
    }

    if (!file || file.size === 0) {
        return { error: 'Bukti dokumentasi wajib diunggah' }
    }

    // Get trainer ID and Profile
    const { data: trainer, error: trainerError } = await supabase
        .from('trainers')
        .select(`
            id,
            user_profiles (
                full_name,
                email
            )
        `)
        .eq('user_id', user.id)
        .single()

    if (trainerError || !trainer) {
        console.error('Trainer not found:', trainerError)
        return { error: 'Profil trainer tidak ditemukan. Pastikan Anda terdaftar sebagai trainer.' }
    }

    // File upload
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabase.storage
        .from('hebat-submissions')
        .upload(fileName, file)

    if (uploadError) {
        console.error('Upload error:', uploadError)
        return { error: 'Gagal mengunggah file. Silakan coba lagi.' }
    }

    const { data: { publicUrl } } = supabase.storage
        .from('hebat-submissions')
        .getPublicUrl(fileName)

    // Database insert
    const { error: dbError } = await supabase
        .from('hebat_submissions')
        .insert({
            trainer_id: trainer.id,
            focus,
            story,
            solution,
            documentation_url: publicUrl,
            status: 'pending'
        } as any)

    if (dbError) {
        console.error('Database error:', dbError)
        return { error: 'Gagal menyimpan data. Silakan coba lagi.' }
    }

    // Send Email to Admins
    try {
        const adminEmailContent = generateHebatSubmissionAdminEmail({
            trainerName: trainer.user_profiles?.full_name || 'Unknown',
            trainerEmail: trainer.user_profiles?.email || 'No Email',
            submissionCategory: 'E',
            submissionSolution: solution,
            submissionStory: story,
            submissionDate: new Date().toLocaleDateString('id-ID'),
            adminDashboardUrl: `https://academy.garuda-21.com/admin/hebat/submissions`
        })

        const recipients = ['telemarketing@garuda-21.com', 'yucheyahya@gmail.com']

        // Send email to each recipient
        await Promise.all(recipients.map(recipient =>
            sendEmail(recipient, `[Eksplorasi] Submission Baru dari ${trainer.user_profiles?.full_name}`, adminEmailContent)
        ))

    } catch (emailError) {
        console.error('Failed to send admin notification email:', emailError)
        // Don't fail the request if email fails, just log it
    }

    revalidatePath('/trainer/dashboard')
    redirect('/trainer/dashboard?success=true')
}

export async function getExplorations() {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data: trainer } = await supabase
        .from('trainers')
        .select('id')
        .eq('user_id', user.id)
        .single()

    if (!trainer) return []

    const { data } = await supabase
        .from('hebat_submissions')
        .select('*')
        .eq('trainer_id', trainer.id)
        .eq('category', 'E')
        .order('created_at', { ascending: false })

    return data || []
}
