import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { Database } from '@/types/database'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

interface Params {
  params: { id: string }
}

interface ParticipantRow {
  nama?: string
  'Nama'?: string
  'NAMA'?: string
  unit_kerja?: string
  'Unit Kerja'?: string
  'UNIT KERJA'?: string
  'Unit kerja'?: string
  email?: string
  'Email'?: string
  'EMAIL'?: string
  phone?: string
  'Phone'?: string
  'PHONE'?: string
  'No. HP'?: string
  'No HP'?: string
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const webinarId = params.id

    if (!webinarId) {
      return NextResponse.json({ error: 'Webinar ID is required' }, { status: 400 })
    }

    // Try multiple methods to get authenticated user
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    let user: any = null
    let supabase: any = null
    
    // Method 1: Try using createServerClient from lib (uses cookies() from next/headers)
    try {
      const { createServerClient } = await import('@/lib/supabase-server')
      supabase = createServerClient()
      const { data: { user: cookieUser }, error: cookieError } = await supabase.auth.getUser()
      if (!cookieError && cookieUser) {
        user = cookieUser
        console.log('User authenticated via cookies() method')
      }
    } catch (e) {
      console.log('Method 1 failed, trying method 2:', e)
    }
    
    // Method 2: Try reading cookies directly from request
    if (!user) {
      try {
        const response = NextResponse.next()
        supabase = createSupabaseServerClient<Database>(
          supabaseUrl,
          supabaseAnonKey,
          {
            cookies: {
              get(name: string) {
                return request.cookies.get(name)?.value
              },
              set(name: string, value: string, options: any) {
                response.cookies.set(name, value, options)
              },
              remove(name: string, options: any) {
                response.cookies.set(name, '', { ...options, maxAge: 0 })
              },
            },
          }
        )
        const { data: { user: requestUser }, error: requestError } = await supabase.auth.getUser()
        if (!requestError && requestUser) {
          user = requestUser
          console.log('User authenticated via request cookies method')
        }
      } catch (e) {
        console.log('Method 2 failed:', e)
      }
    }
    
    // Method 3: Try Authorization header (if session token is sent)
    if (!user) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        try {
          const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token)
          if (!tokenError && tokenUser) {
            user = tokenUser
            // Create client with token for subsequent queries
            const { createClient } = await import('@supabase/supabase-js')
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
            console.log('User authenticated via Authorization header')
          }
        } catch (e) {
          console.log('Method 3 failed:', e)
        }
      }
    }
    
    // Method 4: Try session token from FormData (fallback for FormData uploads)
    // Note: We need to read formData early to get session_token, but we'll reuse it for file processing
    let formData: FormData | null = null
    if (!user) {
      try {
        formData = await request.formData()
        const sessionToken = formData.get('session_token') as string | null
        
        if (sessionToken) {
          const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(sessionToken)
          if (!tokenError && tokenUser) {
            user = tokenUser
            // Create client with token for subsequent queries
            const { createClient } = await import('@supabase/supabase-js')
            supabase = createClient(supabaseUrl, supabaseAnonKey, {
              global: {
                headers: {
                  Authorization: `Bearer ${sessionToken}`
                }
              },
              auth: {
                persistSession: false,
                autoRefreshToken: false
              }
            })
            console.log('User authenticated via FormData session_token')
          }
        }
      } catch (e) {
        console.log('Method 4 failed:', e)
      }
    }
    
    if (!user || !supabase) {
      const cookieNames = request.cookies.getAll().map(c => c.name)
      const cookieHeader = request.headers.get('cookie')
      
      console.error('All auth methods failed:', {
        cookieCount: request.cookies.getAll().length,
        cookieNames,
        hasCookieHeader: !!cookieHeader,
        cookieHeaderLength: cookieHeader?.length || 0,
        hasAuthHeader: !!request.headers.get('Authorization')
      })
      
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'No user found. Please ensure you are logged in and refresh the page.'
      }, { status: 401 })
    }
    
    console.log('User authenticated:', { userId: user.id, email: user.email })

    // Verify user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Verify webinar exists
    const { data: webinar, error: webinarError } = await supabaseAdmin
      .from('webinars')
      .select('id, title')
      .eq('id', webinarId)
      .single()

    if (webinarError || !webinar) {
      return NextResponse.json({ error: 'Webinar not found' }, { status: 404 })
    }

    // Get file from form data (reuse if already read in Method 4, otherwise read now)
    if (!formData) {
      formData = await request.formData()
    }
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return NextResponse.json({ error: 'File must be Excel format (.xlsx or .xls)' }, { status: 400 })
    }

    // Read Excel file
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json<ParticipantRow>(worksheet)

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Excel file is empty or invalid' }, { status: 400 })
    }

    // Parse participants
    const participants: Array<{
      full_name: string
      unit_kerja?: string
      email?: string
      phone?: string
    }> = []

    const errors: string[] = []

    data.forEach((row, index) => {
      // Try different column name variations
      const nama = row.nama || row.Nama || row.NAMA || ''
      const unitKerja = row.unit_kerja || row['Unit Kerja'] || row['UNIT KERJA'] || row['Unit kerja'] || ''
      const email = row.email || row.Email || row.EMAIL || ''
      const phone = row.phone || row.Phone || row.PHONE || row['No. HP'] || row['No HP'] || ''

      if (!nama || nama.trim().length === 0) {
        errors.push(`Baris ${index + 2}: Nama tidak boleh kosong`)
        return
      }

      participants.push({
        full_name: nama.trim(),
        unit_kerja: unitKerja?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null
      })
    })

    if (errors.length > 0) {
      return NextResponse.json({
        error: 'Validation errors',
        details: errors
      }, { status: 400 })
    }

    if (participants.length === 0) {
      return NextResponse.json({ error: 'No valid participants found' }, { status: 400 })
    }

    // Insert participants (with conflict handling)
    // Use supabase client (with user session) instead of supabaseAdmin to respect RLS
    // RLS policy checks auth.uid() which is NULL when using service role key
    let inserted = 0
    let skipped = 0
    const insertErrors: string[] = []

    for (const participant of participants) {
      try {
        const { error: insertError } = await supabase
          .from('webinar_participants')
          .insert({
            webinar_id: webinarId,
            full_name: participant.full_name,
            unit_kerja: participant.unit_kerja,
            email: participant.email,
            phone: participant.phone,
            created_by: user.id
          })

        if (insertError) {
          // Check if it's a duplicate
          if (insertError.message.includes('duplicate') || insertError.message.includes('unique')) {
            skipped++
          } else {
            insertErrors.push(`${participant.full_name}: ${insertError.message}`)
            console.error('Insert error:', insertError)
          }
        } else {
          inserted++
        }
      } catch (err: any) {
        insertErrors.push(`${participant.full_name}: ${err.message}`)
        console.error('Insert exception:', err)
      }
    }

    return NextResponse.json({
      success: true,
      total: participants.length,
      inserted,
      skipped,
      errors: insertErrors.length > 0 ? insertErrors : undefined
    })
  } catch (error: any) {
    console.error('Error uploading participants:', error)
    return NextResponse.json({
      error: 'Failed to process Excel file',
      details: error.message
    }, { status: 500 })
  }
}

