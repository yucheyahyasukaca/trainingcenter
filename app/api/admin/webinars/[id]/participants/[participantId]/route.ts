import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

interface Params {
    params: {
        id: string
        participantId: string
    }
}

// PUT /api/admin/webinars/[id]/participants/[participantId] - Update participant
export async function PUT(request: NextRequest, { params }: Params) {
    try {
        const supabaseAdmin = getSupabaseAdmin()
        const { id: webinarId, participantId } = params

        if (!webinarId || !participantId) {
            return NextResponse.json({ error: 'Webinar ID and Participant ID are required' }, { status: 400 })
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

        // Update participant
        const { data, error } = await supabaseAdmin
            .from('webinar_participants')
            .update({
                full_name,
                unit_kerja: unit_kerja || null,
                email: email || null,
                phone: phone || null
            } as any)
            .eq('id', participantId)
            .eq('webinar_id', webinarId)
            .select()
            .single()

        if (error) {
            console.error('Error updating participant:', error)
            return NextResponse.json({
                error: 'Failed to update participant',
                details: error.message
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            data
        })
    } catch (error: any) {
        console.error('Error in PUT /api/admin/webinars/[id]/participants/[participantId]:', error)
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 })
    }
}

// DELETE /api/admin/webinars/[id]/participants/[participantId] - Delete participant
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const supabaseAdmin = getSupabaseAdmin()
        const { id: webinarId, participantId } = params

        if (!webinarId || !participantId) {
            return NextResponse.json({ error: 'Webinar ID and Participant ID are required' }, { status: 400 })
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

        // Delete participant
        const { error } = await supabaseAdmin
            .from('webinar_participants')
            .delete()
            .eq('id', participantId)
            .eq('webinar_id', webinarId)

        if (error) {
            console.error('Error deleting participant:', error)
            return NextResponse.json({
                error: 'Failed to delete participant',
                details: error.message
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: 'Participant deleted successfully'
        })
    } catch (error: any) {
        console.error('Error in DELETE /api/admin/webinars/[id]/participants/[participantId]:', error)
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 })
    }
}
