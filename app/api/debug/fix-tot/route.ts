import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createClient(supabaseUrl, supabaseKey)

        const { data, error } = await supabase.rpc('get_tot_missed_trainers')

        if (error) {
            return NextResponse.json({ error: error.message, code: error.code, details: error }, { status: 200 })
        }

        return NextResponse.json({
            found_candidates: data.length,
            candidates: data
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 200 })
    }
}
