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
        ),
        email_recipients (
          id,
          recipient_email,
          recipient_name,
          status,
          message_id,
          error_message,
          sent_at,
          delivered_at,
          created_at,
          updated_at
        )
      `)
            .eq('id', params.id)
            .single()

        if (error) throw error

        // Calculate status summary
        if (data && data.email_recipients) {
            const recipients = data.email_recipients
            const statusCounts = {
                pending: recipients.filter((r: any) => r.status === 'pending').length,
                queued: recipients.filter((r: any) => r.status === 'queued').length,
                sent: recipients.filter((r: any) => r.status === 'sent').length,
                delivered: recipients.filter((r: any) => r.status === 'delivered').length,
                failed: recipients.filter((r: any) => r.status === 'failed').length,
                bounced: recipients.filter((r: any) => r.status === 'bounced').length,
            }
            
            return NextResponse.json({
                ...data,
                status_summary: statusCounts
            })
        }

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

        // Delete recipients first (cascade should handle this, but explicit is better)
        await supabase
            .from('email_recipients')
            .delete()
            .eq('email_log_id', params.id)

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
