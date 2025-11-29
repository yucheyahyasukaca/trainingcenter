import { getSupabaseAdmin } from './supabase-admin'
import QRCode from 'qrcode'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export interface CertificateData {
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
  signatory_name: string
  signatory_position: string
  signatory_signature_url?: string
}

export interface CertificateTemplate {
  id: string
  template_pdf_url: string
  template_fields: Record<string, any>
  participant_name_field: string
  participant_company_field: string
  participant_position_field: string
  program_title_field: string
  program_date_field: string
  completion_date_field: string
  trainer_name_field: string
  trainer_level_field: string
  qr_code_size?: number
  qr_code_position_x?: number
  qr_code_position_y?: number
}

/**
 * Generate QR code for certificate verification
 */
function getVerificationUrl(certificateNumber: string, isWebinar: boolean = false) {
  const verifyPath = isWebinar
    ? `/webinar-certificates/verify/${certificateNumber}`
    : `/certificate/verify/${certificateNumber}`
  // Always use production URL for certificates to ensure they are verifiable globally
  const baseUrl = 'https://academy.garuda-21.com'
  return `${baseUrl}${verifyPath}`
}

async function createQrCodeAssets(verificationUrl: string) {
  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
    width: 200,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  })

  const qrCodeBuffer = await QRCode.toBuffer(verificationUrl, {
    width: 200,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  })

  return { qrCodeDataUrl, qrCodeBuffer }
}

export async function generateQRCode(
  certificateNumber: string,
  isWebinar: boolean = false
): Promise<{ qrCodeDataUrl: string; qrCodeUrl: string }> {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const verificationUrl = getVerificationUrl(certificateNumber, isWebinar)
    const { qrCodeDataUrl, qrCodeBuffer } = await createQrCodeAssets(verificationUrl)

    // Upload QR code to storage
    const qrFileName = `qr-${certificateNumber}-${Date.now()}.png`
    console.log('Uploading QR code to storage:', { bucket: 'certificate-qr-codes', fileName: qrFileName })

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('certificate-qr-codes')
      .upload(qrFileName, qrCodeBuffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      console.error('QR code upload error:', uploadError)
      throw new Error(`Failed to upload QR code to storage: ${uploadError.message}. Make sure 'certificate-qr-codes' bucket exists.`)
    }

    console.log('QR code uploaded successfully:', uploadData)

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('certificate-qr-codes')
      .getPublicUrl(qrFileName)

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for QR code')
    }

    return {
      qrCodeDataUrl,
      qrCodeUrl: urlData.publicUrl
    }
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw error
  }
}

export async function generateQRCodeDataUrl(
  certificateNumber: string,
  isWebinar: boolean = false
): Promise<{ qrCodeDataUrl: string; verificationUrl: string }> {
  const verificationUrl = getVerificationUrl(certificateNumber, isWebinar)
  const { qrCodeDataUrl } = await createQrCodeAssets(verificationUrl)
  return { qrCodeDataUrl, verificationUrl }
}

/**
 * Download template PDF from storage
 */
async function downloadTemplatePDF(templateUrl: string): Promise<Uint8Array> {
  try {
    const response = await fetch(templateUrl)
    if (!response.ok) {
      throw new Error(`Failed to download template: ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    return new Uint8Array(arrayBuffer)
  } catch (error) {
    console.error('Error downloading template PDF:', error)
    throw error
  }
}

/**
 * Download signature image from storage
 */
async function downloadSignatureImage(signatureUrl: string): Promise<Uint8Array> {
  try {
    const response = await fetch(signatureUrl)
    if (!response.ok) {
      throw new Error(`Failed to download signature: ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    return new Uint8Array(arrayBuffer)
  } catch (error) {
    console.error('Error downloading signature image:', error)
    throw error
  }
}

/**
 * Wrap text to fit within a maximum width
 */
function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  if (!text || text.trim().length === 0) {
    return ['']
  }

  // Add small margin to prevent edge cases (95% of maxWidth)
  const safeMaxWidth = maxWidth * 0.95

  const words = text.split(/\s+/).filter(w => w.length > 0)
  if (words.length === 0) {
    return [text]
  }

  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const testWidth = font.widthOfTextAtSize(testLine, fontSize)

    if (testWidth > safeMaxWidth && currentLine) {
      // Current line is full, start new line
      lines.push(currentLine)
      currentLine = word

      // If single word is too long, truncate it
      const wordWidth = font.widthOfTextAtSize(word, fontSize)
      if (wordWidth > safeMaxWidth) {
        let truncatedWord = word
        while (font.widthOfTextAtSize(truncatedWord, fontSize) > safeMaxWidth && truncatedWord.length > 0) {
          truncatedWord = truncatedWord.slice(0, -1)
        }
        if (truncatedWord.length < word.length && truncatedWord.length > 3) {
          truncatedWord = truncatedWord.slice(0, -3) + '...'
        }
        currentLine = truncatedWord
      }
    } else {
      currentLine = testLine
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines.length > 0 ? lines : [text]
}

/**
 * Generate certificate PDF with filled data
 */
async function renderCertificatePdfBytes(
  template: CertificateTemplate,
  certificateData: CertificateData,
  qrCodeDataUrl: string
): Promise<Uint8Array> {
  // Download template PDF
  const templatePdfBytes = await downloadTemplatePDF(template.template_pdf_url)

  // Load PDF document
  const pdfDoc = await PDFDocument.load(templatePdfBytes)
  const pages = pdfDoc.getPages()
  const firstPage = pages[0]
  const { width, height } = firstPage.getSize()

  // Get fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Prepare text data
  const textData = {
    [template.participant_name_field]: certificateData.recipient_name,
    [template.participant_company_field]: certificateData.recipient_company || '',
    [template.participant_position_field]: certificateData.recipient_position || '',
    [template.program_title_field]: certificateData.program_title,
    [template.program_date_field]: certificateData.program_start_date ?
      `${certificateData.program_start_date} - ${certificateData.program_end_date}` : '',
    [template.completion_date_field]: certificateData.completion_date,
    [template.trainer_name_field]: certificateData.trainer_name || '',
    [template.trainer_level_field]: certificateData.trainer_level || '',
    'signatory_name': certificateData.signatory_name,
    'signatory_position': certificateData.signatory_position
  }

  if (template.template_fields) {
    for (const [fieldName, fieldConfig] of Object.entries(template.template_fields)) {
      const textValue = textData[fieldName] || ''

      if (fieldConfig && typeof fieldConfig === 'object') {
        const position = fieldConfig.position
        const fontConfig = fieldConfig.font || {}

        if (position && position.x !== undefined && position.y !== undefined) {
          const fontSize = fontConfig.size || 12
          const fontToUse = (fontConfig.weight === 'bold') ? boldFont : font
          const fontColor = fontConfig.color || '#000000'

          const hexColor = fontColor.replace('#', '')
          const r = parseInt(hexColor.substring(0, 2), 16) / 255
          const g = parseInt(hexColor.substring(2, 4), 16) / 255
          const b = parseInt(hexColor.substring(4, 6), 16) / 255

          const fontAscent = fontToUse.heightAtSize(fontSize)
          const additionalOffset = fontSize * 0.3
          const pdfY = height - position.y - fontAscent - additionalOffset

          const align = fieldConfig.align || 'left'
          // Use field width from config, or calculate reasonable default based on page width
          const fieldWidth = fieldConfig.width || Math.min(400, width - position.x - 20)
          const lineHeight = fontSize * 1.2 // Line height with spacing
          const maxLines = fieldConfig.maxLines || 3 // Maximum number of lines

          // Ensure fieldWidth doesn't exceed page boundaries
          const maxAllowedWidth = width - position.x - 10 // Leave 10px margin
          const safeFieldWidth = Math.min(fieldWidth, maxAllowedWidth)

          // Wrap text to fit within field width
          const wrappedLines = wrapText(textValue, fontToUse, fontSize, safeFieldWidth)
          const linesToRender = wrappedLines.slice(0, maxLines) // Limit to maxLines

          // Render each line
          linesToRender.forEach((line, lineIndex) => {
            const lineY = pdfY - (lineIndex * lineHeight)
            const maxX = position.x + safeFieldWidth
            const minX = position.x

            // First, ensure the line itself fits within fieldWidth
            let textToRender = line
            let textWidth = fontToUse.widthOfTextAtSize(line, fontSize)

            // If text exceeds field width, truncate it
            if (textWidth > fieldWidth) {
              let truncatedLine = line
              while (fontToUse.widthOfTextAtSize(truncatedLine, fontSize) > fieldWidth && truncatedLine.length > 0) {
                truncatedLine = truncatedLine.slice(0, -1)
              }
              if (truncatedLine.length < line.length && truncatedLine.length > 3) {
                truncatedLine = truncatedLine.slice(0, -3) + '...'
              }
              textToRender = truncatedLine
              textWidth = fontToUse.widthOfTextAtSize(textToRender, fontSize)
            }

            // Calculate X position based on alignment
            let finalX = minX
            if (align === 'center' || align === 'centre') {
              finalX = minX + (safeFieldWidth / 2) - (textWidth / 2)
            } else if (align === 'right') {
              finalX = minX + safeFieldWidth - textWidth
            }

            // Ensure X position is within boundaries
            finalX = Math.max(minX, Math.min(finalX, maxX - textWidth))

            // Final safety check: ensure text doesn't exceed boundaries
            if (finalX + textWidth > maxX) {
              // If still exceeds, adjust to fit
              finalX = maxX - textWidth
            }
            if (finalX < minX) {
              finalX = minX
            }

            firstPage.drawText(textToRender, {
              x: finalX,
              y: lineY,
              size: fontSize,
              font: fontToUse,
              color: rgb(r, g, b)
            })
          })
        }
      }
    }
  }

  // Add QR code
  try {
    const qrCodeResponse = await fetch(qrCodeDataUrl)
    const qrCodeArrayBuffer = await qrCodeResponse.arrayBuffer()
    const qrCodeBytes = new Uint8Array(qrCodeArrayBuffer)
    const qrCodeImage = await pdfDoc.embedPng(qrCodeBytes)
    const qrCodeSize = template.qr_code_size || 100
    let qrCodeX = template.qr_code_position_x ?? (width - qrCodeSize - 20)
    let qrCodeY = 20

    if (template.qr_code_position_y !== undefined && template.qr_code_position_y !== null) {
      qrCodeY = height - template.qr_code_position_y - qrCodeSize
    }

    firstPage.drawImage(qrCodeImage, {
      x: qrCodeX,
      y: qrCodeY,
      width: qrCodeSize,
      height: qrCodeSize
    })
  } catch (qrError) {
    console.warn('Failed to add QR code to PDF:', qrError)
  }

  // Add signature if available
  if (certificateData.signatory_signature_url) {
    try {
      const signatureBytes = await downloadSignatureImage(certificateData.signatory_signature_url)
      const signatureImage = await pdfDoc.embedPng(signatureBytes)
      firstPage.drawImage(signatureImage, {
        x: width - 150,
        y: height - 200,
        width: 100,
        height: 50
      })
    } catch (signatureError) {
      console.warn('Failed to add signature to PDF:', signatureError)
    }
  }

  return await pdfDoc.save()
}

export async function generateCertificatePDF(
  template: CertificateTemplate,
  certificateData: CertificateData,
  qrCodeDataUrl: string
): Promise<{ pdfBuffer: Uint8Array; pdfUrl: string }> {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const pdfBytes = await renderCertificatePdfBytes(template, certificateData, qrCodeDataUrl)

    const pdfFileName = `certificate-${certificateData.certificate_number}-${Date.now()}.pdf`
    console.log('Uploading PDF to storage:', { bucket: 'certificates', fileName: pdfFileName })

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('certificates')
      .upload(pdfFileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      console.error('PDF upload error:', uploadError)
      throw new Error(`Failed to upload certificate PDF: ${uploadError.message}. Make sure 'certificates' bucket exists.`)
    }

    console.log('PDF uploaded successfully:', uploadData)

    const { data: urlData } = supabaseAdmin.storage
      .from('certificates')
      .getPublicUrl(pdfFileName)

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for PDF')
    }

    return {
      pdfBuffer: pdfBytes,
      pdfUrl: urlData.publicUrl
    }
  } catch (error) {
    console.error('Error generating certificate PDF:', error)
    throw error
  }
}

/**
 * Complete certificate generation process
 */
export async function generateCompleteCertificate(
  templateId: string,
  certificateData: CertificateData,
  isWebinar: boolean = false
): Promise<{ certificateId: string; pdfUrl: string; qrCodeUrl: string }> {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    console.log('Starting certificate generation:', {
      templateId,
      certificateNumber: certificateData.certificate_number,
      recipientName: certificateData.recipient_name
    })

    // Get template data
    const { data: templateData, error: templateError } = await supabaseAdmin
      .from('certificate_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    const template = templateData as any

    if (templateError) {
      console.error('Template error:', templateError)
      throw new Error(`Template error: ${templateError.message}`)
    }

    if (!template) {
      console.error('Template not found for ID:', templateId)
      throw new Error(`Template not found for ID: ${templateId}`)
    }

    if (!template.is_active) {
      console.error('Template is not active:', templateId)
      throw new Error(`Template is not active: ${templateId}`)
    }

    if (!template.template_pdf_url) {
      console.error('Template PDF URL is missing:', templateId)
      throw new Error(`Template PDF URL is missing for template: ${templateId}`)
    }

    console.log('Template found:', {
      id: template.id,
      name: template.template_name,
      hasPdfUrl: !!template.template_pdf_url,
      isActive: template.is_active
    })

    // Generate QR code
    console.log('Generating QR code...', { isWebinar, certificateNumber: certificateData.certificate_number })
    const { qrCodeDataUrl, qrCodeUrl } = await generateQRCode(certificateData.certificate_number, isWebinar)
    console.log('QR code generated:', { qrCodeUrl })

    // Generate PDF
    console.log('Generating PDF...')
    const { pdfUrl } = await generateCertificatePDF(template, certificateData, qrCodeDataUrl)
    console.log('PDF generated:', { pdfUrl })

    if (!pdfUrl || !qrCodeUrl) {
      throw new Error(`Missing URLs: pdfUrl=${!!pdfUrl}, qrCodeUrl=${!!qrCodeUrl}`)
    }

    return {
      certificateId: templateId,
      pdfUrl,
      qrCodeUrl
    }
  } catch (error: any) {
    console.error('Error in complete certificate generation:', {
      error: error?.message,
      stack: error?.stack,
      templateId,
      certificateNumber: certificateData.certificate_number
    })
    throw error
  }
}

export async function renderCertificateBuffer(
  templateId: string,
  certificateData: CertificateData,
  isWebinar: boolean = false
): Promise<{ pdfBuffer: Uint8Array; qrCodeDataUrl: string }> {
  const supabaseAdmin = getSupabaseAdmin()

  const { data: template, error: templateError } = await supabaseAdmin
    .from('certificate_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (templateError || !template) {
    throw new Error(templateError?.message || 'Template not found')
  }

  if (!template.is_active || !template.template_pdf_url) {
    throw new Error('Template is not active or missing PDF URL')
  }

  const { qrCodeDataUrl } = await generateQRCodeDataUrl(
    certificateData.certificate_number,
    isWebinar
  )

  const pdfBuffer = await renderCertificatePdfBytes(template as CertificateTemplate, certificateData, qrCodeDataUrl)

  return {
    pdfBuffer,
    qrCodeDataUrl
  }
}

/**
 * Batch generate certificates for multiple recipients
 */
export async function batchGenerateCertificates(
  templateId: string,
  certificatesData: CertificateData[]
): Promise<Array<{ certificateId: string; pdfUrl: string; qrCodeUrl: string; error?: string }>> {
  const results = []

  for (const certificateData of certificatesData) {
    try {
      const result = await generateCompleteCertificate(templateId, certificateData)
      results.push(result)
    } catch (error) {
      results.push({
        certificateId: templateId,
        pdfUrl: '',
        qrCodeUrl: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return results
}
