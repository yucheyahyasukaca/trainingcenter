import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const email = searchParams.get('email')
        const checkAll = searchParams.get('check_all') === 'true'

        const supabase = createAdminClient()

        // Mode 1: Check all users for duplicates
        if (checkAll) {
            // Let's try to get all enrollments ordered by participant and program
            const { data: enrollments, error } = await supabase
                .from('enrollments')
                .select(`
                    id,
                    program_id,
                    participant_id,
                    created_at,
                    status,
                    program:programs(title)
                `)
                .order('participant_id')

            if (error) throw error

            // Fetch participants manually to avoid FK issues
            const participantIds = [...new Set((enrollments as any[]).map(e => e.participant_id).filter(Boolean))]

            let participantsMap = new Map()
            if (participantIds.length > 0) {
                // Batch fetch participants if too many
                const { data: participants, error: partError } = await supabase
                    .from('participants')
                    .select('id, email, name')
                    .in('id', participantIds)

                if (partError) {
                    console.error('Error fetching participants:', partError)
                } else {
                    participantsMap = new Map(participants?.map(p => [p.id, p]))
                }
            }

            // Group by participant + program
            const conflicts: any[] = []
            const map = new Map<string, any[]>()

            enrollments?.forEach((e: any) => {
                const participant = participantsMap.get(e.participant_id)
                const enrollmentWithParticipant = { ...e, participant }

                const key = `${e.participant_id}-${e.program_id}`
                if (!map.has(key)) {
                    map.set(key, [])
                }
                map.get(key)?.push(enrollmentWithParticipant)
            })

            map.forEach((group) => {
                if (group.length > 1) {
                    conflicts.push({
                        participant: group[0].participant,
                        program: group[0].program,
                        enrollments: group
                    })
                }
            })

            return NextResponse.json({ conflicts })
        }

        // Mode 2: Search by email
        if (email) {
            // First find participant(s) with this email
            const { data: participants, error: partError } = await supabase
                .from('participants')
                .select('id, name, email')
                .ilike('email', email)

            if (partError) throw partError

            if (!participants || participants.length === 0) {
                // Try user_profiles as fallback
                const { data: profiles, error: profError } = await supabase
                    .from('user_profiles')
                    .select('id, full_name, email')
                    .ilike('email', email)

                if (profError) throw profError

                if (!profiles || profiles.length === 0) {
                    return NextResponse.json({ data: [] })
                }

                const ids = profiles.map((p: any) => p.id)
                const { data: enrollments, error: enrollError } = await supabase
                    .from('enrollments')
                    .select(`
                        *,
                        program:programs(title, price)
                    `)
                    .in('participant_id', ids)
                    .order('created_at', { ascending: false })

                if (enrollError) throw enrollError

                // Attach participant info manually
                const result = enrollments?.map(e => ({
                    ...e,
                    participant: profiles.find(p => p.id === e.participant_id)
                }))

                return NextResponse.json({ data: result })
            }

            const ids = participants.map((p: any) => p.id)
            const { data: enrollments, error: enrollError } = await supabase
                .from('enrollments')
                .select(`
                    *,
                    program:programs(title, price)
                `)
                .in('participant_id', ids)
                .order('created_at', { ascending: false })

            if (enrollError) throw enrollError

            // Attach participant info manually
            const result = enrollments?.map(e => ({
                ...e,
                participant: participants.find(p => p.id === e.participant_id)
            }))

            return NextResponse.json({ data: result })
        }

        return NextResponse.json({ error: 'Email is required' }, { status: 400 })

    } catch (error: any) {
        console.error('Error in GET /api/admin/enrollments/conflicts:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 })
        }

        const supabase = createAdminClient()
        const { error } = await supabase
            .from('enrollments')
            .delete()
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error in DELETE /api/admin/enrollments/conflicts:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
