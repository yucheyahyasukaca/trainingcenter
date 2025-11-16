'use client'

import { useEffect, useState } from 'react'
import { X, Download, Loader2, Eye, QrCode as QrCodeIcon } from 'lucide-react'
import { generateCertificatePDFBlob } from '@/lib/certificate-pdf-renderer'
import { generateCertificateQRCode } from '@/lib/qrcode-generator'

interface CertificatePreviewModalProps {
  certificateNumber: string
  isOpen: boolean
  onClose: () => void
}

export function CertificatePreviewModal({ certificateNumber, isOpen, onClose }: CertificatePreviewModalProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [certificateData, setCertificateData] = useState<any>(null)
  const [showQRCode, setShowQRCode] = useState(false)

  useEffect(() => {
    if (isOpen && certificateNumber) {
      loadCertificate()
    }

    // Cleanup
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [isOpen, certificateNumber])

  const loadCertificate = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('=== Loading Certificate ===')
      console.log('Certificate Number:', certificateNumber)

      // Fetch certificate data with template
      const apiUrl = `/api/certificate/render/${certificateNumber}`
      console.log('Fetching from:', apiUrl)
      
      const response = await fetch(apiUrl)
      const result = await response.json()

      console.log('API Response Status:', response.status)
      console.log('API Response Data:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load certificate')
      }

      const data = result.data
      console.log('Certificate Data:', {
        certificate_number: data.certificate_number,
        recipient_name: data.recipient_name,
        template_name: data.template?.template_name,
        has_template_fields: !!data.template?.template_fields,
        template_fields_count: Object.keys(data.template?.template_fields || {}).length
      })
      
      setCertificateData(data)

      // Generate QR code
      console.log('Generating QR code...')
      const qrCode = await generateCertificateQRCode(certificateNumber)
      setQrCodeUrl(qrCode)
      console.log('QR code generated successfully')

      // Render PDF
      console.log('Rendering PDF...')
      const pdfBlobUrl = await generateCertificatePDFBlob(data)
      setPdfUrl(pdfBlobUrl)
      console.log('PDF rendered successfully')
      console.log('=== Certificate Loaded Successfully ===')
    } catch (err: any) {
      console.error('❌ Error loading certificate:', err)
      console.error('Error stack:', err.stack)
      setError(err.message || 'Failed to load certificate')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!pdfUrl) return

    const a = document.createElement('a')
    a.href = pdfUrl
    a.download = `sertifikat-${certificateNumber}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-2 sm:p-4">
        <div 
          className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 gap-3 sm:gap-0">
            <div className="flex items-center space-x-3 flex-1">
              <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Preview Sertifikat</h2>
                <p className="text-xs sm:text-sm text-gray-600">Nomor: {certificateNumber}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              {!loading && pdfUrl && (
                <>
                  <button
                    onClick={() => setShowQRCode(!showQRCode)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <QrCodeIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">QR Code</span>
                    <span className="sm:hidden">QR</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Unduh PDF</span>
                    <span className="sm:hidden">Unduh</span>
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden p-3 sm:p-6">
            {loading && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Memuat sertifikat...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Gagal Memuat Sertifikat</h3>
                  <p className="text-gray-600">{error}</p>
                  <button
                    onClick={loadCertificate}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Coba Lagi
                  </button>
                </div>
              </div>
            )}

            {!loading && !error && pdfUrl && (
              <div className="h-full flex flex-col gap-3 sm:gap-4">
                {/* QR Code Panel - Show on top for mobile when visible */}
                {showQRCode && qrCodeUrl && (
                  <div className="bg-gray-50 rounded-lg p-4 sm:p-6 flex flex-col items-center justify-center border border-gray-200">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">QR Code Verifikasi</h3>
                    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
                      <img
                        src={qrCodeUrl}
                        alt="QR Code"
                        className="w-32 h-32 sm:w-48 sm:h-48"
                      />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 text-center mt-3 sm:mt-4">
                      Scan QR code ini untuk memverifikasi keaslian sertifikat
                    </p>
                    <a
                      href={`${window.location.origin}/certificate/verify/${certificateNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 sm:mt-4 text-xs sm:text-sm text-blue-600 hover:text-blue-700 underline"
                    >
                      Buka halaman verifikasi
                    </a>
                  </div>
                )}

                {/* PDF Viewer */}
                <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden">
                  <iframe
                    src={pdfUrl}
                    className="w-full h-full min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]"
                    title="Certificate Preview"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Certificate Info Footer */}
          {!loading && !error && certificateData && (
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <p className="text-gray-600">Penerima</p>
                  <p className="font-semibold text-gray-900">{certificateData.recipient_name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Program</p>
                  <p className="font-semibold text-gray-900">{certificateData.program_title}</p>
                </div>
                <div>
                  <p className="text-gray-600">Tanggal Selesai</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(certificateData.completion_date).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    certificateData.verification_result === 'valid'
                      ? 'bg-green-100 text-green-800'
                      : certificateData.verification_result === 'expired'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {certificateData.verification_result === 'valid' ? 'Valid' : 
                     certificateData.verification_result === 'expired' ? 'Kedaluwarsa' : 
                     'Dicabut'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

