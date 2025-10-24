import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    const path = (form.get('path') as string) || ''
    
    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }

    // Generate path if not provided
    const finalPath = path || `images/${Date.now()}_${file.name}`

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string
    
    if (!supabaseUrl) {
      return NextResponse.json({ error: 'Missing NEXT_PUBLIC_SUPABASE_URL' }, { status: 500 })
    }
    if (!serviceKey) {
      return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    // First, try to create the bucket if it doesn't exist
    try {
      await (supabase as any).storage.createBucket('forum-attachments', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp']
      })
    } catch (bucketError) {
      // Bucket might already exist, continue
      console.log('Bucket creation result:', bucketError)
    }

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await (supabase as any)
      .storage
      .from('forum-attachments')
      .upload(finalPath, Buffer.from(arrayBuffer), {
        contentType: file.type || 'application/octet-stream',
        upsert: true, // Allow overwriting
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      const status = (uploadError as any)?.statusCode || 500
      return NextResponse.json({ 
        error: uploadError.message || 'Upload error', 
        code: status,
        details: uploadError 
      }, { status })
    }

    const { data: publicUrlData } = (supabase as any)
      .storage
      .from('forum-attachments')
      .getPublicUrl(finalPath)

    if (!publicUrlData?.publicUrl) {
      return NextResponse.json({ error: 'Failed to get public URL' }, { status: 500 })
    }

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


