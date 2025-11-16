import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { generateCertificateQRCode } from './qrcode-generator'

interface CertificateData {
  certificate_number: string
  recipient_name: string
  recipient_company?: string
  recipient_position?: string
  program_title: string
  program_start_date?: string
  program_end_date?: string
  completion_date: string
  trainer_name?: string
  trainer_level?: string
  template: {
    template_name: string
    template_pdf_url: string
    template_fields: Record<string, FieldConfig>
    qr_code_size?: number
    qr_code_position_x?: number
    qr_code_position_y?: number
    signatory_name: string
    signatory_position: string
    signatory_signature_url?: string
  }
}

interface FieldConfig {
  value: string
  position: { x: number; y: number }
  font: {
    family: string
    size: number
    weight: string
    color: string
  }
  width: number
  align: 'left' | 'center' | 'right'
}

/**
 * Format date to Indonesian locale
 */
function formatDate(dateString?: string): string {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  } catch {
    return dateString
  }
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 0, b: 0 }
}

/**
 * Get actual data value based on field name
 */
function getFieldValue(fieldName: string, data: CertificateData): string {
  // Map field names to actual certificate data
  const fieldMap: Record<string, string> = {
    // Participant/Recipient fields
    'participant_name': data.recipient_name,
    'participant_company': data.recipient_company || '',
    'participant_position': data.recipient_position || '',
    'recipient_name': data.recipient_name,
    'recipient_company': data.recipient_company || '',
    'recipient_position': data.recipient_position || '',
    
    // Program fields
    'program_title': data.program_title,
    'program_date': `${formatDate(data.program_start_date)} - ${formatDate(data.program_end_date)}`,
    'program_start_date': formatDate(data.program_start_date),
    'program_end_date': formatDate(data.program_end_date),
    
    // Completion
    'completion_date': formatDate(data.completion_date),
    
    // Trainer fields
    'trainer_name': data.trainer_name || '',
    'trainer_level': data.trainer_level || '',
    
    // Certificate info
    'certificate_number': data.certificate_number,
    
    // Signatory
    'signatory_name': data.template.signatory_name,
    'signatory_position': data.template.signatory_position,
    
    // Additional common fields
    'unit_kerja': data.recipient_company || ''
  }

  return fieldMap[fieldName] || ''
}

/**
 * Replace placeholder values with actual certificate data
 */
function replacePlaceholders(text: string, data: CertificateData): string {
  const replacements: Record<string, string> = {
    // Participant/Recipient placeholders
    '{{participant_name}}': data.recipient_name,
    '{{participant_company}}': data.recipient_company || '',
    '{{participant_position}}': data.recipient_position || '',
    '{{recipient_name}}': data.recipient_name,
    '{{recipient_company}}': data.recipient_company || '',
    '{{recipient_position}}': data.recipient_position || '',
    
    // Program placeholders
    '{{program_title}}': data.program_title,
    '{{program_start_date}}': formatDate(data.program_start_date),
    '{{program_end_date}}': formatDate(data.program_end_date),
    '{{program_date}}': `${formatDate(data.program_start_date)} - ${formatDate(data.program_end_date)}`,
    
    // Completion
    '{{completion_date}}': formatDate(data.completion_date),
    
    // Trainer
    '{{trainer_name}}': data.trainer_name || '',
    '{{trainer_level}}': data.trainer_level || '',
    
    // Certificate
    '{{certificate_number}}': data.certificate_number,
    
    // Signatory
    '{{signatory_name}}': data.template.signatory_name,
    '{{signatory_position}}': data.template.signatory_position,
    
    // Additional
    '{{unit_kerja}}': data.recipient_company || ''
  }

  let result = text
  Object.entries(replacements).forEach(([placeholder, value]) => {
    result = result.replace(new RegExp(placeholder, 'g'), value)
  })
  
  return result
}

/**
 * Render certificate PDF with dynamic data
 */
export async function renderCertificatePDF(certificateData: CertificateData): Promise<Uint8Array> {
  try {
    console.log('=== Starting PDF Rendering ===')
    console.log('Certificate Number:', certificateData.certificate_number)
    console.log('Recipient Name:', certificateData.recipient_name)
    console.log('Template Fields:', certificateData.template.template_fields)
    
    // Load the template PDF
    const templateResponse = await fetch(certificateData.template.template_pdf_url)
    if (!templateResponse.ok) {
      throw new Error(`Failed to fetch template PDF: ${templateResponse.statusText}`)
    }
    
    const templateArrayBuffer = await templateResponse.arrayBuffer()
    const pdfDoc = await PDFDocument.load(templateArrayBuffer)

    // Get the first page
    const pages = pdfDoc.getPages()
    const firstPage = pages[0]
    const { width, height } = firstPage.getSize()
    console.log('PDF Page Size:', { width, height })

    // Embed font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Add dynamic fields from template configuration
    const fields = certificateData.template.template_fields || {}
    console.log('Number of fields to render:', Object.keys(fields).length)
    
    if (Object.keys(fields).length === 0) {
      console.warn('⚠️ No template fields found! Certificate will render without dynamic data.')
      // Fallback: render recipient name at center if no fields configured
      const fallbackText = certificateData.recipient_name
      const fallbackSize = 24
      const textWidth = fontBold.widthOfTextAtSize(fallbackText, fallbackSize)
      firstPage.drawText(fallbackText, {
        x: (width - textWidth) / 2,
        y: height / 2,
        size: fallbackSize,
        font: fontBold,
        color: rgb(0, 0, 0),
      })
      console.log('✅ Rendered fallback name at center')
    }
    
    for (const [fieldName, fieldConfig] of Object.entries(fields)) {
      // Get text - try multiple sources:
      // 1. If value has placeholder, replace it
      // 2. If value is field name, get actual data
      // 3. Use value as-is
      let text = ''
      
      if (fieldConfig.value && fieldConfig.value.includes('{{')) {
        // Value contains placeholder like {{participant_name}}
        text = replacePlaceholders(fieldConfig.value, certificateData)
      } else if (fieldConfig.value) {
        // Value is direct text
        text = fieldConfig.value
      } else {
        // No value, try to get from field name directly
        text = getFieldValue(fieldName, certificateData)
      }
      
      // If still empty, try to get value based on field name
      if (!text) {
        text = getFieldValue(fieldName, certificateData)
      }
      
      console.log(`Field "${fieldName}":`, {
        configValue: fieldConfig.value,
        finalText: text,
        position: fieldConfig.position,
        font: fieldConfig.font
      })
      
      if (!text) {
        console.warn(`⚠️ Field "${fieldName}" has no text, skipping`)
        continue
      }

      const color = hexToRgb(fieldConfig.font.color)
      const fontSize = fieldConfig.font.size
      const useFont = fieldConfig.font.weight === 'bold' ? fontBold : font

      // Convert position from top-left to bottom-left (PDF coordinate system)
      const x = fieldConfig.position.x
      const y = height - fieldConfig.position.y - fontSize

      // Handle text alignment
      let textX = x
      if (fieldConfig.align === 'center') {
        const textWidth = useFont.widthOfTextAtSize(text, fontSize)
        textX = x + (fieldConfig.width - textWidth) / 2
      } else if (fieldConfig.align === 'right') {
        const textWidth = useFont.widthOfTextAtSize(text, fontSize)
        textX = x + fieldConfig.width - textWidth
      }

      console.log(`Drawing "${text}" at (${textX}, ${y})`)
      
      firstPage.drawText(text, {
        x: textX,
        y: y,
        size: fontSize,
        font: useFont,
        color: rgb(color.r, color.g, color.b),
      })
    }
    
    console.log('✅ All fields rendered')

    // Generate and add QR code
    console.log('Generating QR code...')
    const qrCodeDataUrl = await generateCertificateQRCode(certificateData.certificate_number)
    const qrCodeBase64 = qrCodeDataUrl.split(',')[1]
    const qrCodeImage = await pdfDoc.embedPng(qrCodeBase64)

    // QR Code positioning
    const qrSize = certificateData.template.qr_code_size || 100
    const qrConfigX = certificateData.template.qr_code_position_x || 50
    const qrConfigY = certificateData.template.qr_code_position_y || 50
    
    // Convert from top-left origin to bottom-left origin
    // The config position represents the TOP-LEFT corner of the QR code
    // PDF coordinate system: origin at bottom-left
    // Formula: PDF_Y = PageHeight - ConfigY - QRSize
    let qrX = qrConfigX
    let qrY = height - qrConfigY - qrSize

    console.log('QR Code positioning calculation:', {
      pageSize: { width, height },
      configPosition: { x: qrConfigX, y: qrConfigY },
      qrSize: qrSize,
      calculatedPdfY: `${height} - ${qrConfigY} - ${qrSize} = ${qrY}`,
      finalPosition: { x: qrX, y: qrY }
    })

    // Render QR code
    firstPage.drawImage(qrCodeImage, {
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize,
    })
    
    console.log('✅ QR code rendered')
    console.log('   Position in PDF: x=' + qrX + ', y=' + qrY)
    console.log('   QR Code bounds:', {
      left: qrX,
      right: qrX + qrSize,
      bottom: qrY,
      top: qrY + qrSize
    })

    // Add signature if available
    if (certificateData.template.signatory_signature_url) {
      try {
        const signatureResponse = await fetch(certificateData.template.signatory_signature_url)
        const signatureArrayBuffer = await signatureResponse.arrayBuffer()
        const signatureImage = await pdfDoc.embedPng(signatureArrayBuffer)
        
        // Position signature (you may want to make this configurable)
        const signatureWidth = 150
        const signatureHeight = 75
        const signatureX = (firstPage.getWidth() - signatureWidth) / 2
        const signatureY = 150

        firstPage.drawImage(signatureImage, {
          x: signatureX,
          y: signatureY,
          width: signatureWidth,
          height: signatureHeight,
        })
      } catch (error) {
        console.error('Error embedding signature:', error)
      }
    }

    // Save the PDF
    console.log('Saving PDF...')
    const pdfBytes = await pdfDoc.save()
    console.log('✅ PDF rendered successfully, size:', pdfBytes.length, 'bytes')
    console.log('=== PDF Rendering Complete ===')
    return pdfBytes
  } catch (error) {
    console.error('❌ Error rendering certificate PDF:', error)
    throw new Error('Failed to render certificate PDF')
  }
}

/**
 * Generate a blob URL for the rendered PDF
 */
export async function generateCertificatePDFBlob(certificateData: CertificateData): Promise<string> {
  const pdfBytes = await renderCertificatePDF(certificateData)
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  return URL.createObjectURL(blob)
}

