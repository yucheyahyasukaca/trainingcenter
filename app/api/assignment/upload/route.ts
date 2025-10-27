import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  console.log('Assignment upload API called')
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      console.error('No file provided')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('File received:', file.name, 'Size:', file.size)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
    
    console.log('Supabase URL:', supabaseUrl || 'Missing')
    console.log('Service Key:', supabaseKey ? 'Present' : 'Missing')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing env vars')
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    // Create client with custom fetch to fix storage URL
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        fetch: (url, options) => {
          // Use direct storage API endpoint
          if (url.toString().includes('/storage/v1/')) {
            // Get actual storage URL from environment or use wathever is configured
            return fetch(url, {
              ...options,
              headers: {
                ...options?.headers,
                'apikey': supabaseKey
              }
            })
          }
          return fetch(url, options)
        }
      }
    })

    // Normalize filename
    const normalizedFileName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\s+/g, '_')
      .toLowerCase()
    
    const fileExt = normalizedFileName.split('.').pop()
    const timestamp = Date.now()
    const filePath = `assignments/${timestamp}_${normalizedFileName}`
    
    console.log('Uploading to path:', filePath)
    
    // Upload using raw fetch to bypass custom domain issues
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)
    
    const uploadUrl = `${supabaseUrl}/storage/v1/object/payment-proofs/${filePath}`
    console.log('Upload URL:', uploadUrl)
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': file.type || 'application/octet-stream',
        'x-upsert': 'true'
      },
      body: fileBuffer
    })

    console.log('Upload response status:', uploadResponse.status)

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error('Upload failed:', errorText)
      throw new Error(`Upload failed: ${uploadResponse.status}`)
    }

    const uploadResult = await uploadResponse.json()
    console.log('Upload result:', uploadResult)

    // Get public URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/payment-proofs/${filePath}`
    
    return NextResponse.json({ 
      url: publicUrl,
      path: filePath 
    })
  } catch (err: any) {
    console.error('API error:', err)
    console.error('Stack:', err?.stack)
    return NextResponse.json({ 
      error: err?.message || 'Upload failed' 
    }, { status: 500 })
  }
}

