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

        // Use simple validation consistent with forum upload
        // We expect images or PDFs.
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf']
        if (!validTypes.includes(file.type)) {
            console.error('Invalid file type:', file.type)
            return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
        }

        // Normalize filename
        const normalizeFileName = (name: string) => {
            return name.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\s+/g, '_').toLowerCase()
        }

        const secureFileName = normalizeFileName(file.name)
        // If path is provided (e.g. userId/filename), use it, otherwise generate one
        // Ensure path doesn't have leading slash
        const cleanPath = path.startsWith('/') ? path.substring(1) : path
        const finalPath = cleanPath ? cleanPath : `${Date.now()}_${secureFileName}`

        console.log('Final path:', finalPath)

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

        if (!supabaseUrl || !serviceKey) {
            console.error('Missing Supabase configuration')
            // Return JSON even for 500
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
        const buffer = Buffer.from(arrayBuffer) // Convert to Buffer for nodejs runtime

        console.log('Uploading to bucket:', bucketId)

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketId)
            .upload(finalPath, buffer, {
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

        console.log('Upload successful:', uploadData)

        const { data: publicUrlData } = supabase.storage
            .from(bucketId)
            .getPublicUrl(finalPath)

        return NextResponse.json({
            url: publicUrlData.publicUrl,
            path: finalPath
        }, { status: 200 })

    } catch (err: any) {
        console.error('Upload API Fatal Error:', err)
        return NextResponse.json({
            error: err?.message || 'Upload failed',
            stack: err?.stack
        }, { status: 500 })
    }
}
