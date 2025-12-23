import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // 1. Get first trainer structure
        const { data: trainer } = await supabase
            .from('trainers')
            .select('*')
            .limit(1)
            .single()

        // 2. Get first user profile structure
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .limit(1)
            .single()

        return NextResponse.json({
            trainer_columns: trainer ? Object.keys(trainer) : [],
            profile_columns: profile ? Object.keys(profile) : [],
            sample_trainer: trainer,
            sample_profile: profile
        })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
