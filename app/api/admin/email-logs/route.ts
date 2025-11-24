import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
        
        // Debug logging for production
        console.log('🔍 Fetching email logs...')
        console.log('📍 Environment:', process.env.NODE_ENV)
        console.log('🌐 Supabase URL:', supabaseUrl ? 'Set' : 'Missing')
        console.log('🔑 Service Key:', serviceKey ? 'Set' : 'Missing')
        
        if (!supabaseUrl || !serviceKey) {
            console.error('❌ Missing Supabase configuration')
            return NextResponse.json({ 
                error: 'Supabase configuration missing',
                details: {
                    url: !!supabaseUrl,
                    key: !!serviceKey
                }
            }, { status: 500 })
        }
        
        const supabase = createClient(supabaseUrl, serviceKey)

        // Fetch email logs with template info
        const { data, error } = await supabase
            .from('email_logs')
            .select(`
        *,
        email_templates (
          name,
          subject
        )
      `)
            .order('sent_at', { ascending: false })
            .limit(10)

        if (error) {
            console.error('❌ Supabase query error:', error)
            throw error
        }

        console.log('✅ Fetched', data?.length || 0, 'email logs')
        console.log('📋 Log IDs:', data?.map(log => log.id) || [])

        // Prevent caching to ensure fresh data
        return NextResponse.json(data || [], {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        })
    } catch (error: any) {
        console.error('❌ Error fetching email logs:', error)
        return NextResponse.json({ 
            error: error.message,
            details: error.details || null
        }, { status: 500 })
    }
}
