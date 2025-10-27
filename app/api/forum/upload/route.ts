import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  console.log('Upload API called')
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    const path = (form.get('path') as string) || ''
    
    console.log('File received:', file?.name, 'Path:', path)
    
    if (!file) {
      console.error('Missing file')
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }

    // Normalize filename - remove special characters and spaces
    const normalizedFileName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\s+/g, '_')
      .toLowerCase()
    
    // Generate path if not provided
    const finalPath = path || `images/${Date.now()}_${normalizedFileName}`

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
    
    console.log('Supabase URL:', supabaseUrl || 'Missing')
    console.log('Service Key:', serviceKey ? `${serviceKey.substring(0, 10)}...` : 'Missing')
    
    if (!supabaseUrl) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_URL')
      return NextResponse.json({ error: 'Missing NEXT_PUBLIC_SUPABASE_URL' }, { status: 500 })
    }
    if (!serviceKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
    }

    // For custom domains, use direct Supabase project URL for storage
    const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL || supabaseUrl
    
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    console.log('Supabase client created')

    // Determine bucket based on path
    const bucketId = path.includes('assignments') ? 'assignments' : 'forum-attachments'
    
    console.log('Using bucket:', bucketId)
    
    // Skip bucket creation, just try to upload
    // Bucket should be created manually via SQL

    const arrayBuffer = await file.arrayBuffer()
    console.log('Uploading to path:', finalPath, 'Size:', arrayBuffer.byteLength)
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketId)
      .upload(finalPath, arrayBuffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true, // Allow overwriting
      })
      
    console.log('Upload result:', { uploadData, uploadError })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ 
        error: uploadError.message || 'Upload error', 
        details: uploadError 
      }, { status: 500 })
    }

    console.log('Getting public URL for:', finalPath)
    
    const { data: publicUrlData } = supabase.storage
      .from(bucketId)
      .getPublicUrl(finalPath)

    console.log('Public URL data:', publicUrlData)

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


