import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const activities = []

        // 1. Fetch recent enrollments (limit 5)
        const { data: enrollments, error: enrollmentsError } = await supabase
            .from('enrollments')
            .select(`
        id,
        created_at,
        participant:participants(email),
        program:programs(title)
      `)
            .order('created_at', { ascending: false })
            .limit(5)

        if (!enrollmentsError && enrollments) {
            enrollments.forEach(enrollment => {
                activities.push({
                    id: `enroll-${enrollment.id}`,
                    action: 'New Enrollment',
                    user: enrollment.participant?.email || 'Unknown User',
                    time: enrollment.created_at,
                    status: 'success',
                    original_date: new Date(enrollment.created_at)
                })
            })
        }

        // 2. Fetch recent programs (limit 3)
        const { data: programs, error: programsError } = await supabase
            .from('programs')
            .select('id, title, created_at')
            .order('created_at', { ascending: false })
            .limit(3)

        if (!programsError && programs) {
            programs.forEach(program => {
                activities.push({
                    id: `prog-${program.id}`,
                    action: 'New Program Created',
                    user: 'System', // Or fetch creator if available
                    time: program.created_at,
                    status: 'success',
                    original_date: new Date(program.created_at)
                })
            })
        }

        // Sort combined activities by date desc
        activities.sort((a, b) => b.original_date.getTime() - a.original_date.getTime())

        // Take top 5
        const recentActivities = activities.slice(0, 5).map(activity => {
            // Calculate relative time (e.g., "2 minutes ago")
            const now = new Date()
            const diffInSeconds = Math.floor((now.getTime() - activity.original_date.getTime()) / 1000)

            let timeString = ''
            if (diffInSeconds < 60) timeString = 'Just now'
            else if (diffInSeconds < 3600) timeString = `${Math.floor(diffInSeconds / 60)} minutes ago`
            else if (diffInSeconds < 86400) timeString = `${Math.floor(diffInSeconds / 3600)} hours ago`
            else timeString = `${Math.floor(diffInSeconds / 86400)} days ago`

            return {
                ...activity,
                time: timeString
            }
        })

        return NextResponse.json(recentActivities)

    } catch (error) {
        console.error('System activities error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch activities' },
            { status: 500 }
        )
    }
}
