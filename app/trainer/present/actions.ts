'use server'

import { createServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const schema = z.object({
    socialLink: z.string().url('Mohon masukkan URL yang valid'),
})

export async function submitActualization(formData: FormData) {
    const supabase = createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { error: 'Unauthorized' }
    }

    const socialLink = formData.get('socialLink') as string
    const file = formData.get('documentation') as File

    // Validation
    const validation = schema.safeParse({ socialLink })
    if (!validation.success) {
        return { error: validation.error.issues[0].message }
    }

    if (!file || file.size === 0) {
        return { error: 'Bukti screenshot wajib diunggah' }
    }

    // Get trainer ID
    const { data: trainer, error: trainerError } = await supabase
        .from('trainers')
        .select('id')
        .eq('user_id', user.id)
        .single()

    if (trainerError || !trainer) {
        console.error('Trainer not found:', trainerError)
        return { error: 'Profil trainer tidak ditemukan. Pastikan Anda terdaftar sebagai trainer.' }
    }

    // File upload
    const fileExt = file.name.split('.').pop()
    const fileName = `aktualisasi/${user.id}/${Date.now()}.${fileExt}`
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
    // Mapping:
    // category: 'A' (Aktualisasi)
    // focus: 'A' (Dummy)
    // story: 'Aktualisasi Submission' (Dummy)
    // solution: socialLink
    // documentation_url: publicUrl (Screenshot)
    const { error: dbError } = await supabase
        .from('hebat_submissions')
        .insert({
            trainer_id: trainer.id,
            category: 'A',
            focus: 'A',
            story: 'Aktualisasi Submission',
            solution: socialLink,
            documentation_url: publicUrl,
            status: 'pending'
        } as any)

    if (dbError) {
        console.error('Database error:', dbError)
        return { error: 'Gagal menyimpan data. Silakan coba lagi.' }
    }

    revalidatePath('/trainer/dashboard')
    redirect('/trainer/dashboard?success=true')
}

export async function getActualizations() {
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
        .eq('category', 'A')
        .order('created_at', { ascending: false })

    return data || []
}
