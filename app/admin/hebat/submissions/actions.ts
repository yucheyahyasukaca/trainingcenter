'use server'

import { createServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

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

    revalidatePath('/admin/hebat/submissions')
    revalidatePath('/trainer/dashboard')
    return { success: true }
}
