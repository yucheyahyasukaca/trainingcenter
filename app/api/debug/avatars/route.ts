import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Get all trainers
        const { data: trainers } = await supabase
            .from('trainers')
            .select('id, name, user_id, avatar_url')

        if (!trainers) return NextResponse.json({ message: 'No trainers found' })

        const results = []

        for (const t of trainers) {
            let profileAvatar = null
            if (t.user_id) {
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('avatar_url')
                    .eq('id', t.user_id)
                    .single()
                profileAvatar = profile?.avatar_url
            }

            results.push({
                name: t.name,
                trainer_id: t.id,
                trainer_avatar: t.avatar_url,
                profile_avatar: profileAvatar,
                mismatch: t.avatar_url !== profileAvatar,
                needs_sync: !t.avatar_url && !!profileAvatar
            })
        }

        return NextResponse.json({
            count: results.length,
            mismatches: results.filter(r => r.mismatch),
            needs_sync_count: results.filter(r => r.needs_sync).length,
            samples: results.slice(0, 50)
        })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
