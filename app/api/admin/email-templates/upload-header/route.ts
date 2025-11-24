import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
    try {
        console.log('📤 Upload header API called')
        
        const formData = await req.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            console.error('❌ No file provided')
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        console.log('📁 File received:', file.name, 'Type:', file.type, 'Size:', file.size)

        // Validate file type (only images)
        if (!file.type.startsWith('image/')) {
            console.error('❌ Invalid file type:', file.type)
            return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
        }

        // Validate file size (max 3MB - after compression it should be much smaller)
        // Frontend will compress images before upload, so this is a safety check
        const maxSize = 3 * 1024 * 1024 // 3MB
        if (file.size > maxSize) {
            console.error('❌ File too large:', file.size, 'bytes (max:', maxSize, 'bytes)')
            return NextResponse.json({ 
                error: 'Ukuran file terlalu besar', 
                message: `File maksimal 3MB. Ukuran file Anda: ${(file.size / 1024 / 1024).toFixed(2)}MB. Silakan kompres gambar terlebih dahulu.`,
                maxSize: maxSize,
                fileSize: file.size
            }, { status: 400 })
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
        
        console.log('📦 Supabase URL:', supabaseUrl || 'Missing')
        console.log('🔑 Service Key:', serviceKey ? `${serviceKey.substring(0, 10)}...` : 'Missing')
        
        if (!supabaseUrl) {
            console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL')
            return NextResponse.json({ error: 'Missing NEXT_PUBLIC_SUPABASE_URL' }, { status: 500 })
        }
        
        if (!serviceKey) {
            console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY')
            return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
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

        // Upload to Supabase storage using direct HTTP request (like assignment/upload)
        const bucketId = 'email-headers'
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
            
            if (uploadResponse.status === 403) {
                return NextResponse.json({
                    error: 'Unauthorized - Invalid authentication',
                    message: 'Service role key mungkin tidak valid atau tidak memiliki akses ke bucket',
                    details: errorData,
                    troubleshooting: [
                        '1. Pastikan SUPABASE_SERVICE_ROLE_KEY adalah service role key (bukan anon key)',
                        '2. Pastikan service role key valid dan tidak expired',
                        '3. Cek RLS policies untuk bucket "email-headers"',
                        '4. Pastikan bucket sudah dibuat dengan benar'
                    ]
                }, { status: 403 })
            }
            
            if (uploadResponse.status === 404) {
                return NextResponse.json({
                    error: 'Bucket tidak ditemukan',
                    message: 'Bucket "email-headers" belum dibuat atau tidak dapat diakses',
                    migration: 'supabase/migrations/20240105_create_email_headers_storage.sql'
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
        console.log('✅ Public URL generated:', publicUrl)

        return NextResponse.json({
            url: publicUrl,
            path: filePath
        })
    } catch (error: any) {
        console.error('❌ Upload API error:', error)
        console.error('❌ Error stack:', error.stack)
        
        // Always return JSON, never HTML
        return NextResponse.json({
            error: error.message || 'Upload failed',
            type: error.name || 'UnknownError',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { 
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        })
    }
}

