import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Buffer } from 'buffer'

export async function POST(req: NextRequest) {
    console.log('Payment Proof Upload API called [Raw Fetch]')
    try {
        const form = await req.formData()
        const file = form.get('file') as File | null
        const path = (form.get('path') as string) || ''

        if (!file) {
            console.error('Missing file')
            return NextResponse.json({ error: 'Missing file' }, { status: 400 })
        }

        // STANDALONE VALIDATION
        const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'File size too large (max 10MB)' }, { status: 400 })
        }

        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf']
        const isImage = file.type.startsWith('image/')
        const isPdf = file.type === 'application/pdf'

        if (!isImage && !isPdf) {
            console.error('Invalid file type:', file.type)
            return NextResponse.json({ error: 'Invalid file type. Only images and PDFs are allowed.' }, { status: 400 })
        }

        // Normalize filename
        const normalizeFileName = (name: string) => {
            // Remove non-ascii and special chars
            return name.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\s+/g, '_').toLowerCase()
        }

        const secureFileName = normalizeFileName(file.name)

        // Generate Final Path
        let finalPath = path
        if (!finalPath) {
            const randomString = Math.random().toString(36).substring(2, 15)
            finalPath = `${Date.now()}_${randomString}_${secureFileName}`
        } else {
            if (finalPath.startsWith('/')) finalPath = finalPath.substring(1)
        }

        console.log('Target Path:', finalPath)

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

        if (!supabaseUrl || !serviceKey) {
            console.error('Missing Supabase configuration')
            return NextResponse.json({ error: 'Server configuration error: Missing Service Key' }, { status: 500 })
        }

        // SAFE BUFFER HANDLING
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const bucketId = 'payment-proofs'

        // METHOD: RAW FETCH
        // bypasses supabase-js client which seems to have issues with the environment URL

        // Construct the URL manually. 
        // Ensure supabaseUrl doesn't have trailing slash
        const baseUrl = supabaseUrl.replace(/\/$/, '')
        const uploadUrl = `${baseUrl}/storage/v1/object/${bucketId}/${finalPath}`

        console.log('Attempting raw upload to:', uploadUrl)

        const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceKey}`,
                'apikey': serviceKey,
                'Content-Type': file.type || 'application/octet-stream',
                'x-upsert': 'true'
            },
            body: buffer
        })

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text()
            console.error('Raw Upload Failed:', uploadResponse.status, errorText)
            let errorJson
            try {
                errorJson = JSON.parse(errorText)
            } catch {
                errorJson = { message: errorText }
            }

            return NextResponse.json({
                error: errorJson.message || 'Upload failed',
                details: errorJson
            }, { status: uploadResponse.status })
        }

        console.log('Raw upload success. Status:', uploadResponse.status)
        const uploadResult = await uploadResponse.json()
        console.log('Upload Result:', uploadResult)

        // Construct Public URL
        const publicUrl = `${baseUrl}/storage/v1/object/public/${bucketId}/${finalPath}`

        return NextResponse.json({
            url: publicUrl,
            path: finalPath
        }, { status: 200 })

    } catch (err: any) {
        console.error('API INTERNAL ERROR:', err)
        return NextResponse.json({
            error: err?.message || 'Internal Server Error',
            stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined
        }, { status: 500 })
    }
}
