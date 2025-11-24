import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export const runtime = 'nodejs'

export async function GET() {
    try {
        // Create sample data
        const sampleData = [
            ['Nama', 'Email'],
            ['John Doe', 'john.doe@example.com'],
            ['Jane Smith', 'jane.smith@example.com'],
            ['Ahmad Fauzi', 'ahmad.fauzi@example.com'],
        ]

        // Create workbook
        const workbook = XLSX.utils.book_new()
        const worksheet = XLSX.utils.aoa_to_sheet(sampleData)

        // Set column widths
        worksheet['!cols'] = [
            { wch: 30 }, // Nama column
            { wch: 40 }, // Email column
        ]

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Penerima Email')

        // Generate Excel file buffer
        const excelBuffer = XLSX.write(workbook, { 
            type: 'buffer', 
            bookType: 'xlsx' 
        })

        // Return as download
        return new NextResponse(excelBuffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="template-penerima-email.xlsx"',
            },
        })
    } catch (error: any) {
        console.error('Error generating Excel template:', error)
        return NextResponse.json(
            { error: 'Gagal membuat template Excel' },
            { status: 500 }
        )
    }
}

