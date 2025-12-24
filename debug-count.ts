
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL')
    process.exit(1)
}

// Check for service role key for ground truth
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey!)

async function main() {
    console.log('🔍 Debugging Participant Count...')

    // 1. Find program
    const { data: programs, error: progError } = await supabase
        .from('training_programs')
        .select('id, title')
        .ilike('title', '%TOT Gemini%') // Use ilike for partial match just in case

    if (progError) {
        console.error('Error finding program:', progError)
        return
    }

    if (!programs || programs.length === 0) {
        console.log('❌ Program "TOT Gemini" not found')
        return
    }

    console.log(`✅ Found ${programs.length} programs matching "TOT Gemini"`)

    for (const program of programs) {
        console.log(`\nChecking Program: ${program.title} (${program.id})`)

        // 2. Fetch classes
        const { data: classes } = await supabase
            .from('classes')
            .select('*')
            .eq('program_id', program.id)

        if (!classes || classes.length === 0) {
            console.log('   No classes found.')
            continue
        }

        const classIds = classes.map(c => c.id)
        console.log(`   Found ${classes.length} classes:`, classIds)

        // 3. Reproduction Query (Simulate frontend logic)
        // Note: frontend does not specify limit, so it gets default (usually 1000)
        const { data: enrollmentsData, error } = await supabase
            .from('enrollments')
            .select('class_id')
            .in('class_id', classIds)
            .in('status', ['pending', 'approved', 'completed'])

        console.log(`   🔸 Frontend Query returned: ${enrollmentsData?.length} rows`)

        // Check distribution in frontend query
        const frontendCounts: Record<string, number> = {}
        enrollmentsData?.forEach((e: any) => {
            frontendCounts[e.class_id] = (frontendCounts[e.class_id] || 0) + 1
        })
        console.log('   🔸 Frontend Counts per Class:', frontendCounts)

        // 4. Ground Truth Query
        const { count, error: countError } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .in('class_id', classIds)
            .in('status', ['pending', 'approved', 'completed'])

        console.log(`   🔹 Actual Total Count in DB: ${count}`)

        // Get actual counts per class to verify distribution
        for (const cls of classes) {
            const { count: clsCount } = await supabase
                .from('enrollments')
                .select('*', { count: 'exact', head: true })
                .eq('class_id', cls.id)
                .in('status', ['pending', 'approved', 'completed'])

            console.log(`   🔹 Class ${cls.id} (${cls.name}) Actual: ${clsCount}`)
        }
    }
}

main().catch(console.error)
