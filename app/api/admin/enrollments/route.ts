import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const supabase = createAdminClient()

        // Get pagination params
        const searchParams = request.nextUrl.searchParams
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const offset = (page - 1) * limit

        // Fetch enrollments with programs and count
        const { data: enrollmentsData, count, error: enrollmentsError } = await supabase
            .from('enrollments')
            .select(`
                *,
                program:programs(title, price)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (enrollmentsError) {
            console.error('Error fetching enrollments:', enrollmentsError)
            return NextResponse.json({ error: enrollmentsError.message }, { status: 500 })
        }

        if (!enrollmentsData || enrollmentsData.length === 0) {
            return NextResponse.json({
                data: [],
                meta: {
                    page,
                    limit,
                    total: count || 0,
                    totalPages: Math.ceil((count || 0) / limit)
                }
            })
        }

        // Get unique participant IDs
        const participantIds = [...new Set((enrollmentsData as any[]).map(e => e.participant_id).filter(Boolean))]

        if (participantIds.length === 0) {
            return NextResponse.json({ data: enrollmentsData })
        }

        // Helper to batch queries
        const batchSize = 20
        const fetchBatched = async (table: string, ids: string[], select: string) => {
            const batches = []
            for (let i = 0; i < ids.length; i += batchSize) {
                batches.push(ids.slice(i, i + batchSize))
            }

            const results: any[] = []
            for (const batch of batches) {
                const { data, error } = await supabase
                    .from(table)
                    .select(select)
                    .in('id', batch)

                if (error) {
                    console.error(`Error fetching batch from ${table}:`, error)
                    throw error
                }
                if (data) results.push(...data)
            }
            return results
        }

        let participantsData: any[] = []
        try {
            participantsData = await fetchBatched('participants', participantIds, 'id, name, email, phone')
        } catch (e: any) {
            console.error('Error fetching participants:', e)
        }

        let profilesData: any[] = []
        try {
            profilesData = await fetchBatched('user_profiles', participantIds, 'id, full_name, email')
        } catch (e: any) {
            console.error('Error fetching user_profiles:', e)
        }

        // Create maps for easy lookup
        const participantsMap = new Map(
            (participantsData || []).map((p: any) => [String(p.id).trim(), p])
        )

        const profilesMap = new Map(
            (profilesData || []).map((p: any) => [String(p.id).trim(), { ...p, name: p.full_name }]) // Normalize name field
        )

        // Map participants to enrollments
        const enrollmentsWithParticipants = (enrollmentsData as any[]).map(enrollment => {
            const pid = String(enrollment.participant_id).trim()
            // Try participants table first, then user_profiles
            const participant = participantsMap.get(pid) ||
                profilesMap.get(pid) ||
                null

            return {
                ...enrollment,
                participant
            }
        })

        return NextResponse.json({
            data: enrollmentsWithParticipants,
            meta: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        })
    } catch (error: any) {
        console.error('Error in GET /api/admin/enrollments:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
