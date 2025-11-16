import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createServerClient } from '@/lib/supabase-server'

// GET /api/admin/tickets/[id] - Get single ticket with messages (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const supabaseAdmin = getSupabaseAdmin()
    const ticketId = params.id

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get ticket with all messages
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select(`
        *,
        ticket_messages (
          id,
          created_at,
          message,
          sender_type,
          sender_name,
          sender_email,
          sender_id,
          is_internal
        )
      `)
      .eq('id', ticketId)
      .single()

    if (ticketError) {
      if (ticketError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
      }
      throw ticketError
    }

    // Sort messages by created_at
    if (ticket.ticket_messages) {
      ticket.ticket_messages.sort((a: any, b: any) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    }

    return NextResponse.json({ data: ticket })
  } catch (error: any) {
    console.error('Error in GET /api/admin/tickets/[id]:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ticket', details: error?.message },
      { status: 500 }
    )
  }
}

// PUT /api/admin/tickets/[id] - Update ticket (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const supabaseAdmin = getSupabaseAdmin()
    const ticketId = params.id
    const body = await request.json()
    const { status, priority, assigned_to } = body

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (status !== undefined) {
      updateData.status = status
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString()
      } else if (status === 'closed') {
        updateData.closed_at = new Date().toISOString()
      }
    }

    if (priority !== undefined) {
      updateData.priority = priority
    }

    if (assigned_to !== undefined) {
      updateData.assigned_to = assigned_to
    }

    // Update ticket
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .update(updateData)
      .eq('id', ticketId)
      .select()
      .single()

    if (ticketError) {
      if (ticketError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
      }
      throw ticketError
    }

    return NextResponse.json({
      success: true,
      data: ticket
    })
  } catch (error: any) {
    console.error('Error in PUT /api/admin/tickets/[id]:', error)
    return NextResponse.json(
      { error: 'Failed to update ticket', details: error?.message },
      { status: 500 }
    )
  }
}

