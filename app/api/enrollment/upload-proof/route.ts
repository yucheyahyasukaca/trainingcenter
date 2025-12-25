import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
    console.log('Payment Proof Upload API called')
    try {
        const form = await req.formData()
        const file = form.get('file') as File | null
        const path = (form.get('path') as string) || ''

        console.log('File received:', file?.name, 'Path:', path)

        if (!file) {
            console.error('Missing file')
            return NextResponse.json({ error: 'Missing file' }, { status: 400 })
        }

        // Validate file type (image or pdf)
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
        }

        // Generate secure filename
        const normalizeFileName = (name: string) => {
            return name.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\s+/g, '_').toLowerCase()
        }

        const secureFileName = normalizeFileName(file.name)
        // If path is provided (e.g. userId/filename), use it, otherwise generate one
        const finalPath = path ? path : `${Date.now()}_${secureFileName}`

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

        if (!supabaseUrl || !serviceKey) {
            console.error('Missing Supabase configuration')
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }

        const supabase = createClient(supabaseUrl, serviceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        const bucketId = 'payment-proofs'
        const arrayBuffer = await file.arrayBuffer()

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketId)
            .upload(finalPath, arrayBuffer, {
                contentType: file.type,
                upsert: true,
            })

        if (uploadError) {
            console.error('Upload error:', uploadError)
            return NextResponse.json({
                error: uploadError.message || 'Upload error',
                details: uploadError
            }, { status: 500 })
        }

        // Get public URL
        // Construct manually to avoid another round trip or potential issue if getPublicUrl is restricted
        // But getPublicUrl is usually local string manipulation.
        // Let's use the standard way first.

        // For custom domain, we might need to be careful. 
        // The previous code manually constructed: `https://supabase.garuda-21.com/storage/v1/object/public/payment-proofs/${filePath}`
        // Let's rely on standard method but log it.

        const { data: publicUrlData } = supabase.storage
            .from(bucketId)
            .getPublicUrl(finalPath)

        return NextResponse.json({
            url: publicUrlData.publicUrl,
            path: finalPath
        }, { status: 200 })
    } catch (err: any) {
        console.error('Upload API error:', err)
        return NextResponse.json({
            error: err?.message || 'Upload failed',
            stack: err?.stack
        }, { status: 500 })
    }
}
