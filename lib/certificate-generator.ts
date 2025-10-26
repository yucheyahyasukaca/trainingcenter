import { createClient } from '@supabase/supabase-js'
import QRCode from 'qrcode'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fs from 'fs'
import path from 'path'

// Initialize Supabase client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
}

/**
 * Generate QR code for certificate verification
 */
export async function generateQRCode(certificateNumber: string): Promise<{ qrCodeDataUrl: string; qrCodeUrl: string }> {
  try {
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
      for (const [fieldName, fieldConfig] of Object.entries(template.template_fields)) {
        const textValue = textData[fieldName] || ''
        if (fieldConfig && typeof fieldConfig === 'object' && fieldConfig.x && fieldConfig.y) {
          const fontSize = fieldConfig.fontSize || 12
          const fontToUse = fieldConfig.bold ? boldFont : font
          const color = fieldConfig.color ? 
            rgb(fieldConfig.color.r || 0, fieldConfig.color.g || 0, fieldConfig.color.b || 0) : 
            rgb(0, 0, 0)

          firstPage.drawText(textValue, {
            x: fieldConfig.x,
            y: height - fieldConfig.y,
            size: fontSize,
            font: fontToUse,
            color: color
          })
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
      
      // Add QR code to bottom right corner
      const qrCodeSize = 100
      firstPage.drawImage(qrCodeImage, {
        x: width - qrCodeSize - 20,
        y: 20,
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
