import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
        const supabase = createClient(supabaseUrl, serviceKey)

        const { data, error } = await supabase
            .from('email_templates')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await req.json()
        const { 
            name, subject, content, type, 
            header_image_url, 
            cta_button_text, cta_button_url, cta_button_color,
            signature_enabled, signature_logo_url, signature_name, signature_title,
            signature_email, signature_phone, signature_website, signature_address
        } = body

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
        const supabase = createClient(supabaseUrl, serviceKey)

        // Build update object - only include CTA fields if they exist in request
        const updateData: any = {
            name,
            subject,
            content,
            type,
            updated_at: new Date().toISOString()
        }

        // Add header image if provided
        if (header_image_url !== undefined) {
            updateData.header_image_url = header_image_url || null
        }

        // Only add CTA fields if they are provided (graceful handling if columns don't exist yet)
        if (cta_button_text !== undefined || cta_button_url !== undefined || cta_button_color !== undefined) {
            updateData.cta_button_text = cta_button_text || null
            updateData.cta_button_url = cta_button_url || null
            updateData.cta_button_color = cta_button_color || null
        }

        // Add signature fields if provided
        if (signature_enabled !== undefined) {
            updateData.signature_enabled = signature_enabled || false
        }
        if (signature_logo_url !== undefined) {
            updateData.signature_logo_url = signature_logo_url || null
        }
        if (signature_name !== undefined) {
            updateData.signature_name = signature_name || null
        }
        if (signature_title !== undefined) {
            updateData.signature_title = signature_title || null
        }
        if (signature_email !== undefined) {
            updateData.signature_email = signature_email || null
        }
        if (signature_phone !== undefined) {
            updateData.signature_phone = signature_phone || null
        }
        if (signature_website !== undefined) {
            updateData.signature_website = signature_website || null
        }
        if (signature_address !== undefined) {
            updateData.signature_address = signature_address || null
        }

        const { data, error } = await supabase
            .from('email_templates')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Error updating template:', error)
            // If error is about missing columns (signature, CTA, or header), try without optional fields
            if (error.message?.includes('signature') || 
                error.message?.includes('cta_button') || 
                error.message?.includes('header_image') || 
                error.code === '42703' || 
                error.code === 'PGRST204') {
                console.log('Some columns not found, updating without optional fields...')
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('email_templates')
                    .update({
                        name,
                        subject,
                        content,
                        type,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', id)
                    .select()
                    .single()
                
                if (fallbackError) throw fallbackError
                
                // Return with warning message
                return NextResponse.json({
                    ...fallbackData,
                    warning: 'Template saved but signature/CTA/header fields were skipped. Please run the migration to enable these features.',
                    migration: 'supabase/migrations/20240106_add_signature_to_email_templates.sql'
                })
            }
            throw error
        }

        return NextResponse.json(data)
    } catch (error: any) {
        console.error('PUT error:', error)
        return NextResponse.json({ 
            error: error.message || 'Failed to update template',
            details: error.details || null
        }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
        const supabase = createClient(supabaseUrl, serviceKey)

        const { error } = await supabase
            .from('email_templates')
            .delete()
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
