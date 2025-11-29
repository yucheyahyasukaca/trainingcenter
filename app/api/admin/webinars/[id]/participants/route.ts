import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

interface Params {
    params: { id: string }
}

// POST /api/admin/webinars/[id]/participants - Manually add a participant
export async function POST(request: NextRequest, { params }: Params) {
    try {
        const supabaseAdmin = getSupabaseAdmin()
        const webinarId = params.id

        if (!webinarId) {
            return NextResponse.json({ error: 'Webinar ID is required' }, { status: 400 })
        }

        // Verify admin access
        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile || (profile as any).role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { full_name, unit_kerja, email, phone } = body

        if (!full_name) {
            return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
        }

        // Insert participant
        const { data, error } = await supabaseAdmin
            .from('webinar_participants')
            .insert({
                webinar_id: webinarId,
                full_name,
                unit_kerja: unit_kerja || null,
                email: email || null,
                phone: phone || null,
                created_by: user.id
            } as any)
            .select()
            .single()

        if (error) {
            console.error('Error adding participant:', error)
            return NextResponse.json({
                error: 'Failed to add participant',
                details: error.message
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            data
        })
    } catch (error: any) {
        console.error('Error in POST /api/admin/webinars/[id]/participants:', error)
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 })
    }
}
