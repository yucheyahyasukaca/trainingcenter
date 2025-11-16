import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createServerClient } from '@/lib/supabase-server'

// POST /api/tickets/[id]/messages - Add message to ticket
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const { message, sender_email, sender_name, is_internal = false } = body
    const ticketId = params.id

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Check if user is admin
    let isUserAdmin = false
    let senderId = null

    if (user) {
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      isUserAdmin = profile?.role === 'admin'
      senderId = isUserAdmin ? user.id : null
    }

    // Get ticket to verify access
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single()

    if (ticketError) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Verify access
    if (!isUserAdmin) {
      // User must match ticket email or user_id
      const userEmail = user?.email || sender_email
      if (ticket.email !== userEmail && ticket.user_id !== user?.id) {
        return NextResponse.json(
          { error: 'Unauthorized. You can only add messages to your own tickets.' },
          { status: 403 }
        )
      }
    }

    // Create message
    const { data: ticketMessage, error: messageError } = await supabaseAdmin
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        message,
        sender_type: isUserAdmin ? 'admin' : 'user',
        sender_id: senderId,
        sender_email: sender_email || user?.email || ticket.email,
        sender_name: sender_name || user?.user_metadata?.full_name || ticket.full_name,
        is_internal: isUserAdmin ? is_internal : false // Only admins can create internal messages
      })
      .select()
      .single()

    if (messageError) throw messageError

    return NextResponse.json({
      success: true,
      data: ticketMessage
    })
  } catch (error: any) {
    console.error('Error in POST /api/tickets/[id]/messages:', error)
    return NextResponse.json(
      { error: 'Failed to add message', details: error?.message },
      { status: 500 }
    )
  }
}

