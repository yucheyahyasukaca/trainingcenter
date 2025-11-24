import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
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

        if (error) throw error

        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Error fetching email logs:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
