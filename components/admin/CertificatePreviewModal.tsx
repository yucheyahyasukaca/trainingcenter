'use client'

import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'

interface CertificatePreviewModalProps {
  templateId: string
  isOpen: boolean
  onClose: () => void
}

export function CertificatePreviewModal({ templateId, isOpen, onClose }: CertificatePreviewModalProps) {
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && templateId) {
      generatePreview()
    } else {
      setPreviewUrl(null)
      setError(null)
    }
  }, [isOpen, templateId])

  const generatePreview = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/admin/certificate-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ templateId })
      })

      const result = await response.json()

      if (response.ok && result.previewUrl) {
        setPreviewUrl(result.previewUrl)
      } else {
        setError(result.error || 'Gagal membuat preview')
      }
    } catch (error) {
      console.error('Error generating preview:', error)
      setError('Terjadi kesalahan saat membuat preview')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPreview = () => {
    if (previewUrl) {
      const link = document.createElement('a')
      link.href = previewUrl
      link.download = `certificate-preview-${templateId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Preview Sertifikat</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-4">
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-600">Sedang membuat preview...</p>
              </div>
            )}

            {error && (
              <div className="py-12 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={generatePreview}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Coba Lagi
                </button>
              </div>
            )}

            {previewUrl && !loading && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Catatan:</strong> Ini adalah preview sertifikat dengan data mock. 
                      Tampilan final mungkin berbeda tergantung data peserta yang sebenarnya.
                    </p>
                    <p className="text-sm text-yellow-800 mt-2">
                      <strong>⚠️ Jika ada teks "Selected" atau overlay editor di sertifikat:</strong> 
                      Template PDF yang diupload mengandung UI editor. Silakan upload PDF template yang bersih (tanpa overlay editor).
                    </p>
                    <p className="text-sm text-yellow-800 mt-2">
                      <strong>ℹ️ Jika teks dinamis tidak muncul atau tidak center:</strong>
                      1. Buka halaman Configure Template
                      2. Klik field yang ingin di-center
                      3. Pilih "Center" pada dropdown "Text Align"
                      4. Klik "Simpan Konfigurasi"
                      5. Klik Lihat lagi untuk preview ulang
                    </p>
                  </div>

                  {/* PDF Preview */}
                  <iframe
                    src={previewUrl}
                    className="w-full h-[600px] border border-gray-300 rounded-md"
                    title="Certificate Preview"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Tutup
                  </button>
                  <button
                    onClick={handleDownloadPreview}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Preview
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

