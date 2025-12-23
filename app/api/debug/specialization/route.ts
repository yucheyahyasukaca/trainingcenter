import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // 1. Get TOT Class
        const { data: totClasses } = await supabase
            .from('classes')
            .select('id, name, program_id')
            .ilike('name', '%TOT%')

        if (!totClasses || totClasses.length === 0) return NextResponse.json({ message: 'No TOT classes' })

        const targetClass = totClasses[0]

        // 2. Get Program
        const { data: program } = await supabase
            .from('programs')
            .select('*')
            .eq('id', targetClass.program_id)
            .maybeSingle()

        // 3. Get Trainers via Enrollment link (using Class Link OR Program Link)
        // The previous restore script linked enrollment to BOTH class_id and program_id.

        // Check enrollments
        const { data: enrollments } = await supabase
            .from('enrollments')
            .select('participant_id, status')
            .eq('program_id', targetClass.program_id)
            .eq('status', 'completed')

        return NextResponse.json({
            class: targetClass,
            program: program, // This will show us the Category
            enrollment_count: enrollments?.length
        })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
