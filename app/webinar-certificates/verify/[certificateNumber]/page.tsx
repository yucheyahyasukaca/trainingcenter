'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { PublicNav } from '@/components/layout/PublicNav'
import { 
  Award, 
  Download, 
  CheckCircle, 
  Calendar, 
  User, 
  FileText, 
  Share2,
  XCircle,
  QrCode,
  ExternalLink
} from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import Image from 'next/image'
import { cleanEmailHTML } from '@/lib/html-utils'

interface Signatory {
  id: string
  signatory_name: string
  signatory_position: string
  signatory_signature_url?: string | null
  sign_order?: number | null
}

interface CertificateData {
  id: string
  certificate_number: string
  issued_at: string
  webinars: {
    id: string
    title: string
    slug: string
    description?: string
    start_time: string
    end_time: string
    hero_image_url?: string
    certificate_template_id?: string | null
  }
  user_profiles?: {
    id: string
    full_name: string
    email: string
  } | null
  template?: {
    id: string
    template_name: string
    signatory_name: string
    signatory_position: string
    signatory_signature_url?: string | null
  } | null
  signatories?: Signatory[]
  qr_code_data_url?: string
}

export default function WebinarCertificateVerificationPage() {
  const params = useParams()
  const toast = useToast()
  const [certificate, setCertificate] = useState<CertificateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const certificateNumber = params.certificateNumber as string

  useEffect(() => {
    if (certificateNumber) {
      fetchCertificate()
    }
  }, [certificateNumber])

  const fetchCertificate = async () => {
    if (!certificateNumber) {
      setError('Certificate number is required')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      // Encode certificate number untuk URL
      const encodedCertNumber = encodeURIComponent(certificateNumber)
      const url = `/api/webinar-certificates/verify/${encodedCertNumber}`
      
      console.log('Fetching certificate from:', url)
      
      const response = await fetch(url)
      const result = await response.json()

      if (response.ok) {
        setCertificate(result.data)
      } else {
        console.error('Certificate fetch error:', response.status, result)
        setError(result.error || 'Certificate not found')
      }
    } catch (error: any) {
      console.error('Error fetching certificate:', error)
      setError(error?.message || 'Failed to load certificate')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!certificate?.certificate_number) {
      toast.error('Error', 'Nomor sertifikat tidak ditemukan')
      return
    }

    try {
      // Encode certificate number untuk URL
      const encodedCertNumber = encodeURIComponent(certificate.certificate_number)
      const url = `/api/webinar-certificates/${encodedCertNumber}/pdf`
      
      console.log('Downloading PDF from:', url)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('PDF download error:', response.status, errorData)
        toast.error('Error', errorData.error || `Gagal mengunduh sertifikat (${response.status})`)
        return
      }

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `sertifikat-webinar-${certificate.certificate_number}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(blobUrl)
      document.body.removeChild(a)
      toast.success('Berhasil', 'Sertifikat berhasil diunduh')
    } catch (error: any) {
      console.error('Error downloading certificate:', error)
      toast.error('Error', error?.message || 'Terjadi kesalahan saat mengunduh sertifikat')
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Sertifikat Webinar: ${certificate?.webinars?.title}`,
          text: `Saya telah menyelesaikan webinar: ${certificate?.webinars?.title}`,
          url: url
        })
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url)
        toast.success('Berhasil', 'Link berhasil disalin ke clipboard')
      } catch (err) {
        toast.error('Error', 'Gagal menyalin link')
      }
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PublicNav />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat sertifikat...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PublicNav />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sertifikat Tidak Ditemukan</h1>
            <p className="text-gray-600 mb-6">{error || 'Sertifikat yang Anda cari tidak tersedia.'}</p>
            <a
              href="/webinar-certificates"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Kembali ke Pencarian
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="inline-flex items-center space-x-2 px-5 py-3 bg-green-100 rounded-full mb-6 shadow-sm">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-base font-semibold text-green-700">Sertifikat Terverifikasi</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2">
            Verifikasi Sertifikat Webinar
          </h1>
          <p className="text-gray-600">
            Sertifikat ini telah diverifikasi dan valid
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Certificate Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Certificate Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Award className="w-8 h-8 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      {certificate.webinars?.title || 'Webinar'}
                    </h2>
                    <p className="text-gray-600">Sertifikat Penyelesaian</p>
                  </div>
                </div>
              </div>

              {/* Certificate Details */}
              <div className="space-y-4 border-t border-gray-200 pt-6">
                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Penerima</p>
                    <p className="font-semibold text-gray-900">{certificate.user_profiles?.full_name || 'Peserta'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Tanggal Diterbitkan</p>
                    <p className="font-semibold text-gray-900">{formatDate(certificate.issued_at)}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Nomor Sertifikat</p>
                    <p className="font-mono text-sm font-semibold text-gray-900">#{certificate.certificate_number}</p>
                  </div>
                </div>

                {certificate.webinars?.start_time && (
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Tanggal Webinar</p>
                      <p className="font-semibold text-gray-900">
                        {formatDate(certificate.webinars.start_time)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleDownloadPDF}
                  className="flex-1 inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-red-600 text-white rounded-lg hover:from-primary-700 hover:to-red-700 transition-all font-medium shadow-lg hover:shadow-xl"
                >
                  <Download className="w-5 h-5" />
                  <span>Unduh PDF</span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 inline-flex items-center justify-center space-x-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Bagikan</span>
                </button>
              </div>
            </div>

            {/* Webinar Info */}
            {certificate.webinars && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Informasi Webinar</h3>
                {certificate.webinars.hero_image_url && (
                  <div className="relative h-48 rounded-lg overflow-hidden mb-4">
                    <Image
                      src={certificate.webinars.hero_image_url}
                      alt={certificate.webinars.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  {certificate.webinars.description && (
                    <div 
                      className="text-gray-700 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: cleanEmailHTML(certificate.webinars.description) }}
                      style={{
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word'
                      }}
                    />
                  )}
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {formatDate(certificate.webinars.start_time)} - {formatDate(certificate.webinars.end_time)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Signatories */}
            {(certificate.signatories && certificate.signatories.length > 0) || certificate.template ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Penandatangan Sertifikat</h3>
                {certificate.signatories && certificate.signatories.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {certificate.signatories.map((signatory) => (
                      <div key={signatory.id} className="border rounded-xl p-4 flex flex-col gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">{signatory.signatory_name}</p>
                          <p className="text-sm text-gray-600">{signatory.signatory_position}</p>
                        </div>
                        {signatory.signatory_signature_url && (
                          <div className="bg-gray-50 border rounded-lg p-2 flex justify-center">
                            <Image
                              src={signatory.signatory_signature_url}
                              alt={`Tanda tangan ${signatory.signatory_name}`}
                              width={180}
                              height={80}
                              className="object-contain max-h-16"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border rounded-xl p-4">
                    <p className="font-semibold text-gray-900">{certificate.template?.signatory_name}</p>
                    <p className="text-sm text-gray-600">{certificate.template?.signatory_position}</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Sidebar - QR Code & Verification */}
          <div className="space-y-6">
            {/* QR Code Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="text-center mb-4">
                <QrCode className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <h3 className="font-bold text-gray-900">QR Code Verifikasi</h3>
                <p className="text-sm text-gray-600">Scan untuk verifikasi</p>
              </div>
              {certificate.qr_code_data_url && (
                <div className="flex justify-center mb-4">
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                    <Image
                      src={certificate.qr_code_data_url}
                      alt="QR Code"
                      width={200}
                      height={200}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              )}
              <p className="text-xs text-center text-gray-500">
                QR code ini dapat digunakan untuk verifikasi keaslian sertifikat
              </p>
            </div>

            {/* Verification Status */}
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-green-900 mb-1">Status Verifikasi</h3>
                  <p className="text-sm text-green-700">
                    Sertifikat ini telah diverifikasi dan dinyatakan valid oleh sistem.
                  </p>
                </div>
              </div>
            </div>

            {/* Back to Search */}
            <a
              href="/webinar-certificates"
              className="block w-full text-center px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
            >
              <ExternalLink className="w-4 h-4 inline mr-2" />
              Cari Sertifikat Lain
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

