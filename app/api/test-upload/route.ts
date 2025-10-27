import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    console.log('Test upload API called')
    const form = await req.formData()
    const file = form.get('file') as File | null
    
    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true,
      filename: file.name,
      size: file.size,
      type: file.type
    })
  } catch (err: any) {
    console.error('Test upload error:', err)
    return NextResponse.json({ 
      error: err?.message || 'Upload failed' 
    }, { status: 500 })
  }
}

