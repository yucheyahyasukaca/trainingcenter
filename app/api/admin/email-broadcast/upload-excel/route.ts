import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export const runtime = 'nodejs'

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
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
        ]
        
        const fileName = file.name.toLowerCase()
        const isExcelFile = fileName.endsWith('.xlsx') || 
                           fileName.endsWith('.xls') || 
                           fileName.endsWith('.xlsm') ||
                           allowedTypes.includes(file.type)

        if (!isExcelFile) {
            return NextResponse.json(
                { error: 'File harus berupa Excel (.xlsx, .xls, atau .xlsm)' },
                { status: 400 }
            )
        }

        // Read file as buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Parse Excel file
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]

        // Convert to JSON
        const data = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, // Use first row as header
            defval: '' // Default value for empty cells
        })

        if (data.length < 2) {
            return NextResponse.json(
                { error: 'File Excel harus memiliki minimal 2 baris (header + data)' },
                { status: 400 }
            )
        }

        // Get header row (first row)
        const headers = (data[0] as any[]).map((h: any) => 
            String(h).toLowerCase().trim()
        )

        // Find email and name columns
        const emailIndex = headers.findIndex(h => 
            h.includes('email') || h.includes('e-mail') || h.includes('mail')
        )
        const nameIndex = headers.findIndex(h => 
            h.includes('nama') || h.includes('name') || h.includes('full_name') || h.includes('full name')
        )

        if (emailIndex === -1) {
            return NextResponse.json(
                { error: 'Kolom "Email" tidak ditemukan. Pastikan file memiliki kolom Email.' },
                { status: 400 }
            )
        }

        // Parse data rows
        const recipients: Array<{ email: string; name?: string }> = []
        const errors: string[] = []

        for (let i = 1; i < data.length; i++) {
            const row = data[i] as any[]
            const email = String(row[emailIndex] || '').trim()
            const name = nameIndex !== -1 ? String(row[nameIndex] || '').trim() : ''

            // Skip empty rows
            if (!email) continue

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(email)) {
                errors.push(`Baris ${i + 1}: Email tidak valid - "${email}"`)
                continue
            }

            recipients.push({
                email,
                name: name || undefined
            })
        }

        if (recipients.length === 0) {
            return NextResponse.json(
                { error: 'Tidak ada email valid yang ditemukan di file Excel' },
                { status: 400 }
            )
        }

        return NextResponse.json({
            recipients,
            total: recipients.length,
            errors: errors.length > 0 ? errors : undefined,
            warnings: errors.length > 0 ? `${errors.length} email tidak valid dan akan dilewati` : undefined
        })
    } catch (error: any) {
        console.error('Error parsing Excel file:', error)
        return NextResponse.json(
            {
                error: 'Gagal membaca file Excel',
                message: error.message || 'File Excel mungkin rusak atau format tidak didukung'
            },
            { status: 500 }
        )
    }
}

