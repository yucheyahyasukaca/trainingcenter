import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// POST /api/certificates/generate - Generate certificate for participant
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    
    // Try to get user from cookies first
    let supabase = createServerClient()
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // If cookies don't work, try Authorization header
    if (authError || !user) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        
        // Verify token using admin client
        try {
          const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token)
          if (!tokenError && tokenUser) {
            user = tokenUser
            // Create a client with the token for subsequent queries
            const { createClient } = await import('@supabase/supabase-js')
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            
            supabase = createClient(supabaseUrl, supabaseAnonKey, {
              global: {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              },
              auth: {
                persistSession: false,
                autoRefreshToken: false
              }
            })
          }
        } catch (verifyError) {
          console.error('Error verifying token:', verifyError)
        }
      }
    }
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: authError?.message || 'Please login to continue'
      }, { status: 401 })
    }

    const body = await request.json()
    const { enrollment_id } = body

    if (!enrollment_id) {
      return NextResponse.json({ error: 'Enrollment ID is required' }, { status: 400 })
    }

    // Verify enrollment belongs to user
    const { data: participant } = await supabase
      .from('participants')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('*, programs:program_id(*), classes:class_id(*)')
      .eq('id', enrollment_id)
      .eq('participant_id', participant.id)
      .single()

    if (enrollmentError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found or access denied' }, { status: 404 })
    }

    // Check if certificate already exists
    // Note: recipient_id in certificates table stores participant_id (not user_id)
    const { data: existingCertificate } = await supabaseAdmin
      .from('certificates')
      .select('id, certificate_number, certificate_pdf_url')
      .eq('program_id', enrollment.program_id)
      .eq('class_id', enrollment.class_id)
      .eq('recipient_type', 'participant')
      .eq('recipient_id', enrollment.participant_id)
      .maybeSingle()

    if (existingCertificate) {
      return NextResponse.json({ 
        data: existingCertificate,
        message: 'Certificate already exists'
      })
    }

    // Generate certificate using RPC function
    const { data: certificateId, error: generateError } = await supabaseAdmin.rpc(
      'auto_generate_participant_certificate',
      { p_enrollment_id: enrollment_id }
    )

    if (generateError) {
      console.error('Error generating certificate:', generateError)
      return NextResponse.json({ 
        error: 'Failed to generate certificate',
        details: generateError.message 
      }, { status: 500 })
    }

    // Fetch the generated certificate
    const { data: certificateData, error: fetchError } = await supabaseAdmin
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
          category,
          program_type
        ),
        classes:class_id (
          id,
          name
        )
      `)
      .eq('id', certificateId)
      .single()

    if (fetchError) {
      console.error('Error fetching generated certificate:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch generated certificate' }, { status: 500 })
    }

    // If program is TOT, promote user to trainer
    const program = (enrollment as any).programs
    if (program?.program_type === 'tot') {
      // Update user role to trainer
      const { error: updateRoleError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          role: 'trainer',
          trainer_level: 'junior',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .eq('role', 'user') // Only update if still a regular user

      if (updateRoleError) {
        console.error('Error promoting user to trainer:', updateRoleError)
        // Don't fail the request, just log the error
      } else {
        console.log('User promoted to trainer:', user.id)
      }
    }

    return NextResponse.json({ 
      data: certificateData,
      message: 'Certificate generated successfully'
    })
  } catch (error: any) {
    console.error('Error in POST /api/certificates/generate:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message 
    }, { status: 500 })
  }
}

