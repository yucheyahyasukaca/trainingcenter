'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useToast } from '@/hooks/useToast'
import { 
  CheckCircle, 
  XCircle, 
  FileText,
  Calendar,
  User,
  Building,
  Award,
  Download,
  Share,
  Copy,
  QrCode
} from 'lucide-react'

interface CertificateData {
  id: string
  certificate_number: string
  recipient_type: 'participant' | 'trainer'
  recipient_name: string
  recipient_company?: string
  recipient_position?: string
  program_title: string
  program_start_date: string
  program_end_date: string
  completion_date: string
  trainer_name?: string
  trainer_level?: string
  certificate_pdf_url: string
  certificate_qr_code_url: string
  status: 'issued' | 'revoked' | 'expired'
  issued_at: string
  expires_at?: string
  verification_result: 'valid' | 'invalid' | 'expired' | 'revoked'
  verified_at: string
  template: {
    id: string
    template_name: string
    signatory_name: string
    signatory_position: string
    signatory_signature_url?: string
  }
  programs: {
    id: string
    title: string
    description: string
    category: string
  }
  classes?: {
    id: string
    name: string
    location?: string
  }
}

export default function CertificateVerificationPage() {
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
    try {
      setLoading(true)
      const response = await fetch(`/api/certificate/verify/${certificateNumber}`)
      const result = await response.json()

      if (response.ok) {
        setCertificate(result.data)
      } else {
        setError(result.error || 'Certificate not found')
      }
    } catch (error) {
      console.error('Error fetching certificate:', error)
      setError('Failed to load certificate')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!certificate?.certificate_pdf_url) return

    try {
      const response = await fetch(certificate.certificate_pdf_url)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `certificate-${certificate.certificate_number}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        toast.error('Failed to download certificate')
      }
    } catch (error) {
      console.error('Error downloading certificate:', error)
      toast.error('Error downloading certificate')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificate: ${certificate?.program_title}`,
          text: `Certificate verification for ${certificate?.recipient_name}`,
          url: window.location.href
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Certificate link copied to clipboard')
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Certificate link copied to clipboard')
    } catch (error) {
      console.error('Error copying link:', error)
      toast.error('Failed to copy link')
    }
  }

  const getVerificationStatus = () => {
    if (!certificate) return null

    switch (certificate.verification_result) {
      case 'valid':
        return {
          icon: <CheckCircle className="w-8 h-8 text-green-500" />,
          title: 'Certificate Valid',
          description: 'This certificate is authentic and valid',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        }
      case 'revoked':
        return {
          icon: <XCircle className="w-8 h-8 text-red-500" />,
          title: 'Certificate Revoked',
          description: 'This certificate has been revoked',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
      case 'expired':
        return {
          icon: <XCircle className="w-8 h-8 text-yellow-500" />,
          title: 'Certificate Expired',
          description: 'This certificate has expired',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        }
      default:
        return {
          icon: <XCircle className="w-8 h-8 text-gray-500" />,
          title: 'Certificate Invalid',
          description: 'This certificate is not valid',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying certificate...</p>
        </div>
      </div>
    )
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Certificate Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The certificate you are looking for does not exist.'}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const verificationStatus = getVerificationStatus()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Certificate Verification</h1>
          <p className="text-gray-600">Verify the authenticity of this certificate</p>
        </div>

        {/* Verification Status */}
        <div className={`rounded-lg border-2 ${verificationStatus?.borderColor} ${verificationStatus?.bgColor} p-6 mb-8`}>
          <div className="flex items-center justify-center mb-4">
            {verificationStatus?.icon}
          </div>
          <h2 className={`text-2xl font-bold text-center ${verificationStatus?.color} mb-2`}>
            {verificationStatus?.title}
          </h2>
          <p className={`text-center ${verificationStatus?.color}`}>
            {verificationStatus?.description}
          </p>
        </div>

        {/* Certificate Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="w-6 h-6 text-blue-500 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Certificate Details</h3>
                  <p className="text-sm text-gray-600">Certificate #{certificate.certificate_number}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy Link
                </button>
                <button
                  onClick={handleShare}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Share className="w-4 h-4 mr-1" />
                  Share
                </button>
                {certificate.certificate_pdf_url && (
                  <button
                    onClick={handleDownloadPDF}
                    className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download PDF
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recipient Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Recipient Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="text-sm text-gray-900">{certificate.recipient_name}</p>
                  </div>
                  {certificate.recipient_company && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Company</label>
                      <p className="text-sm text-gray-900">{certificate.recipient_company}</p>
                    </div>
                  )}
                  {certificate.recipient_position && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Position</label>
                      <p className="text-sm text-gray-900">{certificate.recipient_position}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <div className="flex items-center">
                      {certificate.recipient_type === 'participant' ? (
                        <User className="w-4 h-4 mr-1" />
                      ) : (
                        <Award className="w-4 h-4 mr-1" />
                      )}
                      <span className="text-sm text-gray-900 capitalize">{certificate.recipient_type}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Program Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Program Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Program Title</label>
                    <p className="text-sm text-gray-900">{certificate.program_title}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <p className="text-sm text-gray-900">{certificate.programs.category}</p>
                  </div>
                  {certificate.classes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Class</label>
                      <p className="text-sm text-gray-900">{certificate.classes.name}</p>
                      {certificate.classes.location && (
                        <p className="text-xs text-gray-500">{certificate.classes.location}</p>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Program Duration</label>
                    <p className="text-sm text-gray-900">
                      {new Date(certificate.program_start_date).toLocaleDateString()} - {new Date(certificate.program_end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Completion Information */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Completion Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Completion Date</label>
                  <p className="text-sm text-gray-900">{new Date(certificate.completion_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Issued Date</label>
                  <p className="text-sm text-gray-900">{new Date(certificate.issued_at).toLocaleDateString()}</p>
                </div>
                {certificate.expires_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expires Date</label>
                    <p className="text-sm text-gray-900">{new Date(certificate.expires_at).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Signatory Information */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Signatory Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Signatory Name</label>
                  <p className="text-sm text-gray-900">{certificate.template.signatory_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Position</label>
                  <p className="text-sm text-gray-900">{certificate.template.signatory_position}</p>
                </div>
              </div>
              {certificate.template.signatory_signature_url && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Signature</label>
                  <img
                    src={certificate.template.signatory_signature_url}
                    alt={`Signature of ${certificate.template.signatory_name}`}
                    className="h-20 object-contain"
                  />
                </div>
              )}
            </div>

            {/* Verification Information */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <QrCode className="w-5 h-5 mr-2" />
                Verification Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Verified At</label>
                  <p className="text-sm text-gray-900">{new Date(certificate.verified_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Certificate Number</label>
                  <p className="text-sm text-gray-900 font-mono">{certificate.certificate_number}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code */}
        {certificate.certificate_qr_code_url && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Code Verification</h3>
            <div className="flex justify-center">
              <img
                src={certificate.certificate_qr_code_url}
                alt="Certificate QR Code"
                className="w-32 h-32"
              />
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Scan this QR code to verify this certificate
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
