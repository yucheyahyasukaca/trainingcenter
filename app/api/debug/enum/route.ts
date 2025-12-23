import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // 1. Get Distinct trainer_level
        const { data: levels, error } = await supabase
            .from('user_profiles')
            .select('trainer_level')

        // Manual distinct in JS since .select('distinct') isn't standard in supabase-js query builder exactly like this easily without .csv() or similar?
        // actually, we can iterate.

        const uniqueLevels = new Set(levels?.map((l: any) => l.trainer_level))

        // 2. Try to insert 'test' to get error message with valid values? (Risky)
        // No.

        return NextResponse.json({
            distinct_levels: Array.from(uniqueLevels),
            count: levels?.length
        })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
