'use server'

import { createServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

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

    revalidatePath('/trainer/dashboard')
    redirect('/trainer/dashboard?success=true')
}
