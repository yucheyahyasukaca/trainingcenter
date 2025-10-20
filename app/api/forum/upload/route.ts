import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    const path = (form.get('path') as string) || ''
    if (!file || !path) {
      return NextResponse.json({ error: 'Missing file or path' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string
    if (!supabaseUrl) {
      return NextResponse.json({ error: 'Missing NEXT_PUBLIC_SUPABASE_URL' }, { status: 500 })
    }
    if (!serviceKey) {
      return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await (supabase as any)
      .storage
      .from('forum-attachments')
      .upload(path, Buffer.from(arrayBuffer), {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      const status = (uploadError as any)?.statusCode || 500
      return NextResponse.json({ error: uploadError.message || 'Upload error', code: status }, { status })
    }

    const { data: publicUrlData } = (supabase as any)
      .storage
      .from('forum-attachments')
      .getPublicUrl(path)

    return NextResponse.json({ url: publicUrlData?.publicUrl || null }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Upload failed', stack: err?.stack }, { status: 500 })
  }
}


