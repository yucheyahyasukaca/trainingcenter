import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createServerClient } from '@/lib/supabase-server'

// GET /api/tickets - Get tickets (admin) or user's tickets
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const ticketId = searchParams.get('ticket_id')
    const email = searchParams.get('email')
    const isAdmin = searchParams.get('admin') === 'true'

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (ticketId) {
      // Get single ticket by ticket_id
      let query = supabaseAdmin
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
            is_internal
          )
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { foreignTable: 'ticket_messages', ascending: true })

      // If email is provided, verify it matches ticket email
      if (email) {
        query = query.eq('email', email)
      }

      const { data, error } = await query.single()

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Ticket not found' },
            { status: 404 }
          )
        }
        throw error
      }

      // Filter out internal messages if not admin
      if (data && !isAdmin && user?.role !== 'admin') {
        if (data.ticket_messages) {
          data.ticket_messages = data.ticket_messages.filter((msg: any) => !msg.is_internal)
        }
      }

      return NextResponse.json({ data })
    }

    // Check if user is admin
    let isUserAdmin = false
    if (user) {
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      isUserAdmin = profile?.role === 'admin'
    }

    if (isUserAdmin || isAdmin) {
      // Admin: Get all tickets with pagination
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '50')
      const status = searchParams.get('status')
      const offset = (page - 1) * limit

      let query = supabaseAdmin
        .from('tickets')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error, count } = await query

      if (error) throw error

      return NextResponse.json({
        data,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      })
    } else if (email) {
      // User: Get tickets by email
      const { data, error } = await supabaseAdmin
        .from('tickets')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false })

      if (error) throw error

      return NextResponse.json({ data })
    } else if (user) {
      // User: Get tickets by user_id
      const { data, error } = await supabaseAdmin
        .from('tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      return NextResponse.json({ data })
    }

    return NextResponse.json(
      { error: 'Unauthorized. Please provide email or login.' },
      { status: 401 }
    )
  } catch (error: any) {
    console.error('Error in GET /api/tickets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tickets', details: error?.message },
      { status: 500 }
    )
  }
}

// POST /api/tickets - Create new ticket
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const { full_name, email, phone, subject, message } = body

    // Validate required fields
    if (!full_name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: full_name, email, subject, message' },
        { status: 400 }
      )
    }

    // Generate ticket ID
    let ticketId: string
    try {
      const { data: ticketIdData, error: ticketIdError } = await supabaseAdmin
        .rpc('generate_ticket_id')

      if (ticketIdError) {
        console.warn('Error generating ticket ID with RPC, using fallback:', ticketIdError)
        // Fallback: generate manually
        const year = new Date().getFullYear()
        const timestamp = Date.now().toString().slice(-6)
        ticketId = `TKT-${year}-${timestamp}`
      } else if (!ticketIdData) {
        // RPC returned null/undefined, use fallback
        const year = new Date().getFullYear()
        const timestamp = Date.now().toString().slice(-6)
        ticketId = `TKT-${year}-${timestamp}`
      } else {
        // RPC returns scalar value directly or as array
        ticketId = (Array.isArray(ticketIdData) ? ticketIdData[0] : ticketIdData) as string
        
        // Validate ticket ID format
        if (!ticketId || !ticketId.startsWith('TKT-')) {
          console.warn('Invalid ticket ID format from RPC, using fallback')
          const year = new Date().getFullYear()
          const timestamp = Date.now().toString().slice(-6)
          ticketId = `TKT-${year}-${timestamp}`
        }
      }
    } catch (rpcError: any) {
      console.warn('RPC call failed, using fallback:', rpcError)
      // Fallback: generate manually if RPC fails completely
      const year = new Date().getFullYear()
      const timestamp = Date.now().toString().slice(-6)
      ticketId = `TKT-${year}-${timestamp}`
    }

    // Create ticket
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .insert({
        ticket_id: ticketId,
        full_name,
        email,
        phone: phone || null,
        subject,
        user_id: null,
        status: 'open',
        priority: 'normal'
      })
      .select()
      .single()

    if (ticketError) {
      console.error('Error creating ticket:', ticketError)
      // If duplicate ticket_id, try with new one
      if (ticketError.code === '23505' || ticketError.message?.includes('duplicate')) {
        const year = new Date().getFullYear()
        const timestamp = Date.now().toString().slice(-10)
        ticketId = `TKT-${year}-${timestamp}`
        
        // Retry with new ticket ID
        const { data: retryTicket, error: retryError } = await supabaseAdmin
          .from('tickets')
          .insert({
            ticket_id: ticketId,
            full_name,
            email,
            phone: phone || null,
            subject,
            user_id: null,
            status: 'open',
            priority: 'normal'
          })
          .select()
          .single()
        
        if (retryError) throw retryError
        
        // Use retry ticket
        const { data: ticketMessage, error: messageError } = await supabaseAdmin
          .from('ticket_messages')
          .insert({
            ticket_id: retryTicket.id,
            message,
            sender_type: 'user',
            sender_email: email,
            sender_name: full_name,
            is_internal: false
          })
          .select()
          .single()

        if (messageError) throw messageError

        return NextResponse.json({
          success: true,
          data: {
            ...retryTicket,
            messages: [ticketMessage]
          }
        })
      }
      throw ticketError
    }

    // Create initial message
    const { data: ticketMessage, error: messageError } = await supabaseAdmin
      .from('ticket_messages')
      .insert({
        ticket_id: ticket.id,
        message,
        sender_type: 'user',
        sender_email: email,
        sender_name: full_name,
        is_internal: false
      })
      .select()
      .single()

    if (messageError) {
      console.error('Error creating ticket message:', messageError)
      throw messageError
    }

    return NextResponse.json({
      success: true,
      data: {
        ...ticket,
        messages: [ticketMessage]
      }
    })
  } catch (error: any) {
    console.error('Error in POST /api/tickets:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Gagal membuat tiket. Silakan coba lagi.'
    let errorDetails = error?.message || 'Unknown error'
    
    // Check for specific error types
    if (error?.code === 'PGRST116') {
      errorMessage = 'Tiket tidak ditemukan setelah dibuat'
      errorDetails = 'Database error: Record not found'
    } else if (error?.code === '42P01') {
      errorMessage = 'Tabel tiket belum dibuat. Silakan jalankan script SQL terlebih dahulu.'
      errorDetails = 'Table does not exist'
    } else if (error?.code === '42883') {
      errorMessage = 'Fungsi generate_ticket_id tidak ditemukan. Silakan jalankan script SQL terlebih dahulu.'
      errorDetails = 'Function does not exist'
    } else if (error?.message?.includes('duplicate key')) {
      errorMessage = 'Ticket ID sudah digunakan. Silakan coba lagi.'
      errorDetails = error.message
    } else if (error?.message?.includes('permission denied') || error?.message?.includes('policy')) {
      errorMessage = 'Akses ditolak. Periksa konfigurasi RLS (Row Level Security).'
      errorDetails = error.message
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        code: error?.code
      },
      { status: 500 }
    )
  }
}

