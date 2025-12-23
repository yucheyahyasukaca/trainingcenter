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
    const { enrollment_id, program_id, class_id } = body

    if (!enrollment_id && (!program_id || !class_id)) {
      return NextResponse.json({ error: 'Either enrollment_id OR (program_id AND class_id) are required' }, { status: 400 })
    }

    // Verify participant exists for user
    const { data: participant } = await supabase
      .from('participants')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    let finalEnrollmentId = enrollment_id
    let enrollment = null

    // If enrollment_id is provided, verify it
    if (enrollment_id) {
      const { data: existingEnrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('*, programs:program_id(*), classes:class_id(*)')
        .eq('id', enrollment_id)
        .eq('participant_id', participant.id)
        .single() // use single() to enforce strict match

      if (enrollmentError || !existingEnrollment) {
        // If specific enrollment_id was requested but not found/valid, fail safely or try fallback?
        // Let's treat it as not found for now, but we could fallback to search by program_id if provided.
        // For robustness, let's just error if explicit ID was bad.
        return NextResponse.json({ error: 'Enrollment not found or access denied' }, { status: 404 })
      }
      enrollment = existingEnrollment
    } else {
      // Find or create enrollment using program_id and class_id
      // Use supabaseAdmin to bypass RLS for finding/creating enrollments
      // 1. Try to find existing enrollment
      const { data: existingEnrollments } = await supabaseAdmin
        .from('enrollments')
        .select('*, programs:program_id(*), classes:class_id(*)')
        .eq('participant_id', participant.id)
        .eq('program_id', program_id)
      // We do NOT filter by class_id here because the unique constraint is on (participant_id, program_id)
      // If we filter by class_id and don't find it, we try to insert, which fails if an enrollment exists for a DIFFERENT class_id (or null)

      // Use the first one if multiple exist
      let matchedEnrollment = existingEnrollments && existingEnrollments.length > 0 ? existingEnrollments[0] : null

      if (matchedEnrollment) {
        // Update status if needed
        if (matchedEnrollment.status !== 'completed' && matchedEnrollment.status !== 'approved') {
          const { error: updateError } = await supabaseAdmin
            .from('enrollments')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', matchedEnrollment.id)

          if (!updateError) {
            matchedEnrollment.status = 'completed'
          }
        }
        enrollment = matchedEnrollment
        finalEnrollmentId = matchedEnrollment.id
      } else {
        // Create new enrollment
        console.log('Creating new enrollment for user:', user.id, 'program:', program_id)
        const { data: newEnrollment, error: createError } = await supabaseAdmin
          .from('enrollments')
          .insert({
            participant_id: participant.id,
            program_id: program_id,
            class_id: class_id,
            status: 'completed',
            enrollment_date: new Date().toISOString()
          })
          .select('*, programs:program_id(*), classes:class_id(*)')
          .single()

        if (createError || !newEnrollment) {
          console.error('Error auto-creating enrollment:', createError)
          return NextResponse.json({
            error: 'Failed to create enrollment record',
            details: createError?.message
          }, { status: 500 })
        }

        enrollment = newEnrollment
        finalEnrollmentId = newEnrollment.id
      }
    }

    if (!enrollment || !finalEnrollmentId) {
      return NextResponse.json({ error: 'Could not resolve enrollment' }, { status: 500 })
    }

    // Check if certificate already exists
    // Note: recipient_id in certificates table stores participant_id (not user_id)
    const { data: existingCertificate } = await supabaseAdmin
      .from('certificates')
      .select('id, certificate_number, certificate_pdf_url')
      .eq('program_id', (enrollment as any).program_id)
      .eq('class_id', (enrollment as any).class_id)
      .eq('recipient_type', 'participant')
      .eq('recipient_id', (enrollment as any).participant_id)
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
      { p_enrollment_id: finalEnrollmentId }
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

