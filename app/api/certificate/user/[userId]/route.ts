import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/certificate/user/[userId] - Get user's certificates
export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params
    const { searchParams } = new URL(request.url)
    const recipientType = searchParams.get('recipient_type') || 'participant'
    const status = searchParams.get('status')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    let query = supabaseAdmin
      .from('certificates')
      .select(`
        *,
        template:template_id (
          id,
          template_name,
          signatory_name,
          signatory_position
        ),
        programs:program_id (
          id,
          title,
          description,
          category
        ),
        classes:class_id (
          id,
          name
        )
      `)
      .eq('recipient_type', recipientType)
      .order('issued_at', { ascending: false })

    // Check both participant and trainer certificates
    // First check if user exists in participants table
    const { data: participantData } = await supabaseAdmin
      .from('participants')
      .select('id')
      .eq('user_id', userId)
      .single()

    // Get participant certificates
    let participantQuery = supabaseAdmin
      .from('certificates')
      .select(`
        *,
        template:template_id (
          id,
          template_name,
          signatory_name,
          signatory_position
        ),
        programs:program_id (
          id,
          title,
          description,
          category
        ),
        classes:class_id (
          id,
          name
        )
      `)
      .eq('recipient_type', 'participant')

    if (participantData?.id) {
      participantQuery = participantQuery.eq('recipient_id', participantData.id)
    } else {
      // If no participant record, return empty array for participants
      participantQuery = participantQuery.eq('recipient_id', '00000000-0000-0000-0000-000000000000')
    }

    if (status) {
      participantQuery = participantQuery.eq('status', status)
    }

    // Get trainer certificates
    let trainerQuery = supabaseAdmin
      .from('certificates')
      .select(`
        *,
        template:template_id (
          id,
          template_name,
          signatory_name,
          signatory_position
        ),
        programs:program_id (
          id,
          title,
          description,
          category
        ),
        classes:class_id (
          id,
          name
        )
      `)
      .eq('recipient_type', 'trainer')
      .eq('recipient_id', userId)

    if (status) {
      trainerQuery = trainerQuery.eq('status', status)
    }

    // Fetch both sets of certificates
    const [participantResult, trainerResult] = await Promise.all([
      participantQuery.order('issued_at', { ascending: false }),
      trainerQuery.order('issued_at', { ascending: false })
    ])

    // Combine results
    const allCertificates = [
      ...(participantResult.data || []),
      ...(trainerResult.data || [])
    ].sort((a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime())

    if (participantResult.error || trainerResult.error) {
      console.error('Error fetching certificates:', { participantResult: participantResult.error, trainerResult: trainerResult.error })
      return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 })
    }

    return NextResponse.json({ data: allCertificates })
  } catch (error) {
    console.error('Error in GET /api/certificate/user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
