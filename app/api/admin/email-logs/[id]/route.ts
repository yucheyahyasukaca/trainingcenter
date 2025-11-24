import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
        const supabase = createClient(supabaseUrl, serviceKey)

        const { data, error } = await supabase
            .from('email_logs')
            .select(`
        *,
        email_templates (
          name,
          subject,
          content
        )
      `)
            .eq('id', params.id)
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Error fetching email log:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
        const supabase = createClient(supabaseUrl, serviceKey)

        const { error } = await supabase
            .from('email_logs')
            .delete()
            .eq('id', params.id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error deleting email log:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
