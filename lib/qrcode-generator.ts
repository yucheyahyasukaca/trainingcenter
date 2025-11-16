import QRCode from 'qrcode'

/**
 * Generate QR code for certificate verification
 * @param certificateNumber - The unique certificate number
 * @returns Data URL of the QR code image
 */
export async function generateCertificateQRCode(certificateNumber: string): Promise<string> {
  try {
    // Use window.location.origin if available (client-side), otherwise use env var
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    const verificationUrl = `${baseUrl}/certificate/verify/${certificateNumber}`
    
    console.log('Generating QR code for URL:', verificationUrl)
    
    // Generate QR code with high error correction
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    
    return qrCodeDataUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Generate QR code as buffer (for server-side use)
 * @param certificateNumber - The unique certificate number
 * @returns Buffer containing the QR code image
 */
export async function generateCertificateQRCodeBuffer(certificateNumber: string): Promise<Buffer> {
  try {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/certificate/verify/${certificateNumber}`
    
    const qrCodeBuffer = await QRCode.toBuffer(verificationUrl, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    
    return qrCodeBuffer
  } catch (error) {
    console.error('Error generating QR code buffer:', error)
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Generate QR code as base64 string (for embedding in PDFs)
 * @param certificateNumber - The unique certificate number
 * @returns Base64 string of the QR code image
 */
export async function generateCertificateQRCodeBase64(certificateNumber: string): Promise<string> {
  try {
    const dataUrl = await generateCertificateQRCode(certificateNumber)
    // Remove the data:image/png;base64, prefix
    return dataUrl.replace(/^data:image\/png;base64,/, '')
  } catch (error) {
    console.error('Error generating QR code base64:', error)
    throw new Error('Failed to generate QR code')
  }
}

