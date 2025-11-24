import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' },
                { status: 400 }
            )
        }

        // Validate file size (2MB max)
        const maxSize = 2 * 1024 * 1024 // 2MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File size exceeds 2MB limit. Please compress the image before uploading.' },
                { status: 400 }
            )
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

        if (!supabaseUrl || !serviceKey) {
            console.error('Missing Supabase configuration')
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            )
        }

        // Normalize filename
        const normalizedFileName = file.name
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .replace(/\s+/g, '_')
            .toLowerCase()

        // Generate unique path
        const timestamp = Date.now()
        const randomStr = Math.random().toString(36).substring(2, 8)
        const filePath = `${timestamp}_${randomStr}_${normalizedFileName}`

        console.log('📝 Generated file path:', filePath)

        // Convert file to array buffer
        const arrayBuffer = await file.arrayBuffer()
        const fileBuffer = Buffer.from(arrayBuffer)
        console.log('📦 File converted to buffer, size:', fileBuffer.length, 'bytes')

        // Upload to Supabase storage using direct HTTP request (same pattern as header upload)
        const bucketId = 'email-signatures'
        const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketId}/${filePath}`
        
        console.log('📤 Uploading to bucket:', bucketId)
        console.log('📤 Upload URL:', uploadUrl)

        // Use direct HTTP request to ensure proper authentication headers
        const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceKey}`,
                'apikey': serviceKey,
                'Content-Type': file.type || 'application/octet-stream',
                'x-upsert': 'false'
            },
            body: fileBuffer
        })

        console.log('📤 Upload response status:', uploadResponse.status)
        console.log('📤 Upload response headers:', Object.fromEntries(uploadResponse.headers.entries()))

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text()
            console.error('❌ Upload failed:', errorText)
            
            let errorData
            try {
                errorData = JSON.parse(errorText)
            } catch {
                errorData = { message: errorText }
            }
            
            // Check for specific errors
            if (uploadResponse.status === 413) {
                return NextResponse.json({
                    error: 'File terlalu besar',
                    message: 'Nginx server menolak file karena terlalu besar. File sudah dikompres otomatis, tapi masih terlalu besar.',
                    details: {
                        fileSize: file.size,
                        maxSize: 2 * 1024 * 1024,
                        nginxError: errorText.includes('413') ? 'Request Entity Too Large' : undefined
                    },
                    troubleshooting: [
                        '1. Gunakan gambar dengan resolusi lebih kecil',
                        '2. Kompres gambar manual dengan tool seperti TinyPNG sebelum upload',
                        '3. Gunakan format JPEG dengan kualitas lebih rendah',
                        '4. Jika perlu file lebih besar, konfigurasi nginx: client_max_body_size 5m;'
                    ]
                }, { status: 413 })
            }
            
            if (uploadResponse.status === 401 || uploadResponse.status === 403) {
                return NextResponse.json({
                    error: 'Unauthorized - Invalid authentication',
                    message: 'Service role key mungkin tidak valid atau tidak memiliki akses ke bucket',
                    details: errorData,
                    troubleshooting: [
                        '1. Pastikan SUPABASE_SERVICE_ROLE_KEY adalah service role key (bukan anon key)',
                        '2. Pastikan service role key valid dan tidak expired',
                        '3. Cek RLS policies untuk bucket "email-signatures"',
                        '4. Pastikan bucket sudah dibuat dengan benar (jalankan migration)'
                    ]
                }, { status: uploadResponse.status })
            }
            
            if (uploadResponse.status === 404) {
                return NextResponse.json({
                    error: 'Bucket tidak ditemukan',
                    message: 'Bucket "email-signatures" belum dibuat atau tidak dapat diakses',
                    migration: 'supabase/migrations/20240107_create_signature_logos_storage.sql'
                }, { status: 404 })
            }

            return NextResponse.json({
                error: errorData.message || 'Upload failed',
                status: uploadResponse.status,
                details: errorData
            }, { status: uploadResponse.status })
        }

        const uploadResult = await uploadResponse.json()
        console.log('✅ Upload successful:', uploadResult)

        // Get public URL
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketId}/${filePath}`

        console.log(`✅ Signature logo uploaded successfully: ${publicUrl}`)

        console.log('✅ Public URL generated:', publicUrl)

        return NextResponse.json({
            url: publicUrl,
            path: filePath
        })
    } catch (error: any) {
        console.error('❌ Error uploading signature logo:', error)
        return NextResponse.json(
            {
                error: 'Upload failed',
                message: error.message || 'An unexpected error occurred',
            },
            { status: 500 }
        )
    }
}

