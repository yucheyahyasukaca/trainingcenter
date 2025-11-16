'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/hooks/useToast'
import { useRouter } from 'next/navigation'
import { 
  Download, 
  Eye, 
  FileText,
  Calendar,
  Award,
  Users,
  CheckCircle,
  XCircle,
  Share,
  User
} from 'lucide-react'
import { CertificatePreviewModal } from '@/components/CertificatePreviewModal'

interface Certificate {
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
  template: {
    id: string
    template_name: string
    signatory_name: string
    signatory_position: string
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
  }
}

export default function MyCertificatesPage() {
  const { profile } = useAuth()
  const toast = useToast()
  const router = useRouter()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCertificate, setSelectedCertificate] = useState<string | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  useEffect(() => {
    if (profile?.id) {
      fetchCertificates()
    }
  }, [profile])

  const fetchCertificates = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/certificate/user/${profile?.id}`)
      const result = await response.json()
      
      if (response.ok) {
        setCertificates(result.data || [])
      } else {
        toast.error('Gagal memuat sertifikat')
      }
    } catch (error) {
      console.error('Error fetching certificates:', error)
      toast.error('Gagal memuat sertifikat')
    } finally {
      setLoading(false)
    }
  }

  const handleViewCertificate = (certificateNumber: string) => {
    setSelectedCertificate(certificateNumber)
    setShowPreviewModal(true)
  }

  const handleCloseModal = () => {
    setShowPreviewModal(false)
    setSelectedCertificate(null)
  }

  const handleShareCertificate = async (certificateNumber: string) => {
    const verificationUrl = `${window.location.origin}/certificate/verify/${certificateNumber}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Sertifikat Saya',
          text: 'Lihat sertifikat saya!',
          url: verificationUrl
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      try {
        await navigator.clipboard.writeText(verificationUrl)
        toast.success('Link sertifikat berhasil disalin')
      } catch (error) {
        console.error('Error copying link:', error)
        toast.error('Gagal menyalin link')
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'issued':
        return 'bg-green-100 text-green-800'
      case 'revoked':
        return 'bg-red-100 text-red-800'
      case 'expired':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'issued':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'revoked':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'expired':
        return <XCircle className="w-4 h-4 text-yellow-500" />
      default:
        return <XCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const handleBrowsePrograms = () => {
    // Check user role and navigate accordingly
    if (profile?.role === 'trainer') {
      router.push('/trainer/classes')
    } else {
      router.push('/dashboard/programs')
    }
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Mohon Masuk</h1>
          <p className="text-gray-600">Anda harus masuk untuk melihat sertifikat Anda.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sertifikat Saya</h1>
          <p className="mt-2 text-gray-600">Lihat dan kelola semua sertifikat Anda</p>
        </div>

        {/* Certificates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((certificate) => (
            <div key={certificate.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center flex-1">
                  <FileText className="w-8 h-8 text-red-500 mr-3" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{certificate.program_title}</h3>
                    <p className="text-sm text-gray-600">{certificate.template.template_name}</p>
                  </div>
                </div>
                <div className="flex items-center ml-2">
                  {getStatusIcon(certificate.status)}
                </div>
              </div>

              {/* Badge for recipient type */}
              <div className="mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  certificate.recipient_type === 'participant' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-red-200 text-red-900'
                }`}>
                  {certificate.recipient_type === 'participant' ? (
                    <>
                      <Users className="w-3 h-3 mr-1" />
                      Peserta
                    </>
                  ) : (
                    <>
                      <Award className="w-3 h-3 mr-1" />
                      Trainer
                    </>
                  )}
                </span>
                <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(certificate.status)}`}>
                  {certificate.status === 'issued' ? 'Diterbitkan' : certificate.status === 'revoked' ? 'Dicabut' : 'Kedaluwarsa'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium mr-2">Nomor Sertifikat:</span>
                  <span className="font-mono text-xs">{certificate.certificate_number}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Selesai: {new Date(certificate.completion_date).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Diterbitkan: {new Date(certificate.issued_at).toLocaleDateString('id-ID')}</span>
                </div>
                {certificate.classes && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span>Kelas: {certificate.classes.name}</span>
                  </div>
                )}
                {certificate.trainer_level && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Award className="w-4 h-4 mr-2" />
                    <span>Level: {certificate.trainer_level}</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewCertificate(certificate.certificate_number)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-red-600 text-white shadow-sm text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Lihat
                </button>
                <button
                  onClick={() => handleShareCertificate(certificate.certificate_number)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Share className="w-4 h-4 mr-1" />
                  Bagikan
                </button>
              </div>
            </div>
          ))}
        </div>

        {certificates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Belum Ada Sertifikat
            </h3>
            <p className="text-gray-600 mb-4">
              Anda belum menerima sertifikat apapun.
            </p>
            <button
              onClick={handleBrowsePrograms}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Jelajahi Program
            </button>
          </div>
        )}
      </div>

      {/* Certificate Preview Modal */}
      {selectedCertificate && (
        <CertificatePreviewModal
          certificateNumber={selectedCertificate}
          isOpen={showPreviewModal}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
