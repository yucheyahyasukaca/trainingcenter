import { createServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const supabase = createServerClient()

    try {
        // 1. Total Enrollments (Month) & Growth
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()

        // Current Month Enrollments
        const { count: currentMonthCount, error: currentError } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfMonth)

        if (currentError) throw currentError

        // Last Month Enrollments
        const { count: lastMonthCount, error: lastError } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfLastMonth)
            .lte('created_at', endOfLastMonth)

        if (lastError) throw lastError

        const growth = lastMonthCount && lastMonthCount > 0
            ? Math.round(((currentMonthCount || 0) - lastMonthCount) / lastMonthCount * 100)
            : 0
        const growthLabel = growth >= 0 ? `+${growth}%` : `${growth}%`

        // 2. Active Programs & New Programs
        const { count: activeProgramsCount, error: progError } = await supabase
            .from('programs')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'published')

        if (progError) throw progError

        const { count: newProgramsCount, error: newProgError } = await supabase
            .from('programs')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfMonth)

        if (newProgError) throw newProgError

        // 3. Available Trainers
        const { count: activeTrainersCount, error: trainerError } = await supabase
            .from('trainers')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active')

        if (trainerError) throw trainerError

        return NextResponse.json({
            enrollments: {
                value: `+${currentMonthCount || 0}`,
                change: growthLabel
            },
            programs: {
                value: activeProgramsCount || 0,
                change: `Baru ${newProgramsCount || 0}`
            },
            trainers: {
                value: activeTrainersCount || 0,
                change: 'Expert' // Hardcoded for now
            }
        })

    } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
