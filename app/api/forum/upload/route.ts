import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateFile, generateSecureFileName } from '@/lib/file-validation'

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

    // ✅ Validate file
    // Default to 'image' category for forum uploads unless path indicates otherwise
    const category = path.includes('assignments') ? 'document' : 'image'

    // For assignments, we might want to allow images too, but let's stick to strict validation first
    // If it's an assignment, we might need a more flexible validation or multiple categories
    // For now, let's assume assignments are documents (PDF) and forum posts are images
    // If we need to support both for assignments, we can adjust the library or logic here

    // Let's use a safer approach: check extension to guess category, then validate against that category
    // This prevents "image.pdf" being validated as image and failing

    let validationCategory: 'image' | 'document' = 'image'
    if (file.type.startsWith('application/pdf')) {
      validationCategory = 'document'
    }

    const validation = validateFile(file, validationCategory)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // ✅ Generate secure filename
    const secureFileName = generateSecureFileName(file.name)

    // Generate path if not provided
    // Use secure filename instead of original filename
    const finalPath = path ? `${path}/${secureFileName}` : `images/${Date.now()}_${secureFileName}`

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

    // Determine bucket based on path
    const bucketId = path.includes('assignments') ? 'assignments' : 'forum-attachments'

    const arrayBuffer = await file.arrayBuffer()

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketId)
      .upload(finalPath, arrayBuffer, {
        contentType: file.type, // ✅ Trust validated type
        upsert: false, // ✅ Prevent overwrite
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({
        error: uploadError.message || 'Upload error',
        details: uploadError
      }, { status: 500 })
    }

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


