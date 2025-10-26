import { getSupabaseAdmin } from './supabase-admin'
import QRCode from 'qrcode'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fs from 'fs'
import path from 'path'

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
export async function generateQRCode(certificateNumber: string): Promise<{ qrCodeDataUrl: string; qrCodeUrl: string }> {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/certificate/verify/${certificateNumber}`
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    // Generate QR code as PNG buffer for storage
    const qrCodeBuffer = await QRCode.toBuffer(verificationUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    // Upload QR code to storage
    const qrFileName = `qr-${certificateNumber}-${Date.now()}.png`
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('certificate-qr-codes')
      .upload(qrFileName, qrCodeBuffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      throw new Error(`Failed to upload QR code: ${uploadError.message}`)
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('certificate-qr-codes')
      .getPublicUrl(qrFileName)

    return {
      qrCodeDataUrl,
      qrCodeUrl: urlData.publicUrl
    }
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw error
  }
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
 * Generate certificate PDF with filled data
 */
export async function generateCertificatePDF(
  template: CertificateTemplate,
  certificateData: CertificateData,
  qrCodeDataUrl: string
): Promise<{ pdfBuffer: Uint8Array; pdfUrl: string }> {
  try {
    const supabaseAdmin = getSupabaseAdmin()
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

    // Fill text fields based on template configuration
    if (template.template_fields) {
      console.log('===== CERTIFICATE GENERATOR DEBUG =====')
      console.log('Page size:', { width, height })
      console.log('Template fields to render:', JSON.stringify(template.template_fields, null, 2))
      console.log('Available text data:', textData)
      
      for (const [fieldName, fieldConfig] of Object.entries(template.template_fields)) {
        const textValue = textData[fieldName] || ''
        
        console.log(`\n[FIELD] ${fieldName}:`, {
          config: JSON.stringify(fieldConfig, null, 2),
          textValue,
          hasPosition: fieldConfig?.position,
          hasX: fieldConfig?.position?.x !== undefined,
          hasY: fieldConfig?.position?.y !== undefined,
          align: fieldConfig?.align,
          width: fieldConfig?.width
        })
        
        if (fieldConfig && typeof fieldConfig === 'object') {
          // Get position from fieldConfig (new structure from configure page)
          const position = fieldConfig.position
          const fontConfig = fieldConfig.font || {}
          
          if (position && position.x !== undefined && position.y !== undefined) {
            const fontSize = fontConfig.size || 12
            const fontToUse = (fontConfig.weight === 'bold') ? boldFont : font
            const fontColor = fontConfig.color || '#000000'
            
            // Convert color from hex to RGB
            const hexColor = fontColor.replace('#', '')
            const r = parseInt(hexColor.substring(0, 2), 16) / 255
            const g = parseInt(hexColor.substring(2, 4), 16) / 255
            const b = parseInt(hexColor.substring(4, 6), 16) / 255

            // Convert Y coordinate from top-left (HTML) to bottom-left (PDF)
            // PDF text is positioned from baseline, not top-left
            // PDF y=0 is at bottom, HTML y=0 is at top
            // We need to add a bit more offset to match the visual position in editor
            const fontAscent = fontToUse.heightAtSize(fontSize)
            const additionalOffset = fontSize * 0.3 // Add extra offset to lower the text
            const pdfY = height - position.y - fontAscent - additionalOffset
            
            // Handle text alignment (left, center, right)
            let finalX = position.x
            const align = fieldConfig.align || 'left'
            const fieldWidth = fieldConfig.width || 200
            
            if (align === 'center' || align === 'centre') {
              // Calculate text width and center it
              const textWidth = fontToUse.widthOfTextAtSize(textValue, fontSize)
              // Center calculation: 
              // fieldLeftEdge = position.x
              // fieldCenter = position.x + (fieldWidth / 2)
              // textLeft = fieldCenter - (textWidth / 2)
              finalX = position.x + (fieldWidth / 2) - (textWidth / 2)
              
              console.log(`[CENTER CALC] ${fieldName}:`, {
                fieldLeft: position.x,
                fieldCenter: position.x + (fieldWidth / 2),
                textWidth,
                finalX,
                calculation: `finalX = ${position.x} + (${fieldWidth} / 2) - (${textWidth} / 2) = ${finalX}`
              })
            } else if (align === 'right') {
              // Right align text
              const textWidth = fontToUse.widthOfTextAtSize(textValue, fontSize)
              finalX = position.x + fieldWidth - textWidth
            }
            
            const actualTextWidth = fontToUse.widthOfTextAtSize(textValue, fontSize)
            
            console.log(`[DRAW] ${fieldName}:`, {
              originalX: position.x,
              finalX,
              pdfY,
              originalY: position.y,
              size: fontSize,
              align,
              fieldWidth,
              textWidth: actualTextWidth,
              fieldLeftEdge: position.x,
              fieldRightEdge: position.x + fieldWidth,
              fieldCenterX: position.x + fieldWidth / 2,
              textLeftEdge: finalX,
              textRightEdge: finalX + actualTextWidth,
              text: textValue,
              pageCenterX: width / 2,
              offsetFromPageCenter: finalX - (width / 2)
            })

            firstPage.drawText(textValue, {
              x: finalX,
              y: pdfY,
              size: fontSize,
              font: fontToUse,
              color: rgb(r, g, b)
            })
          }
        }
      }
    }

    // Add QR code to the PDF
    try {
      // Convert data URL to image bytes
      const qrCodeResponse = await fetch(qrCodeDataUrl)
      const qrCodeArrayBuffer = await qrCodeResponse.arrayBuffer()
      const qrCodeBytes = new Uint8Array(qrCodeArrayBuffer)
      
      // Embed QR code image
      const qrCodeImage = await pdfDoc.embedPng(qrCodeBytes)
      
      // Get QR code size and position from template configuration
      // Note: PDF coordinates start from bottom-left (0,0 at bottom-left corner)
      // But the configure page uses top-left coordinate system (0,0 at top-left)
      // So we need to convert: pdf_y = page_height - html_y - object_height
      const qrCodeSize = template.qr_code_size || 100
      
      // Default to bottom right corner if not configured
      let qrCodeX = template.qr_code_position_x ?? (width - qrCodeSize - 20)
      let qrCodeY = 20
      
      // Convert Y coordinate from top-left (HTML) to bottom-left (PDF) system
      if (template.qr_code_position_y !== undefined && template.qr_code_position_y !== null) {
        // In configure page: y=0 means top, y=595 means bottom
        // In PDF: y=0 means bottom, y=height means top
        // Conversion: pdf_y = height - html_y - qrCodeSize
        qrCodeY = height - template.qr_code_position_y - qrCodeSize
      } else {
        // Default position at bottom right
        qrCodeY = 20
      }
      
      // Debug logging
      console.log('QR Code Positioning:', {
        pageSize: { width, height },
        configuredX: template.qr_code_position_x,
        configuredY: template.qr_code_position_y,
        configuredSize: template.qr_code_size,
        finalX: qrCodeX,
        finalY: qrCodeY,
        qrCodeSize
      })
      
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
        
        // Add signature (adjust position based on template)
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

    // Serialize PDF
    const pdfBytes = await pdfDoc.save()

    // Upload PDF to storage
    const pdfFileName = `certificate-${certificateData.certificate_number}-${Date.now()}.pdf`
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('certificates')
      .upload(pdfFileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      throw new Error(`Failed to upload certificate PDF: ${uploadError.message}`)
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('certificates')
      .getPublicUrl(pdfFileName)

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
  certificateData: CertificateData
): Promise<{ certificateId: string; pdfUrl: string; qrCodeUrl: string }> {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    // Get template data
    const { data: template, error: templateError } = await supabaseAdmin
      .from('certificate_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      throw new Error('Template not found')
    }

    // Generate QR code
    const { qrCodeDataUrl, qrCodeUrl } = await generateQRCode(certificateData.certificate_number)

    // Generate PDF
    const { pdfUrl } = await generateCertificatePDF(template, certificateData, qrCodeDataUrl)

    return {
      certificateId: templateId,
      pdfUrl,
      qrCodeUrl
    }
  } catch (error) {
    console.error('Error in complete certificate generation:', error)
    throw error
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
