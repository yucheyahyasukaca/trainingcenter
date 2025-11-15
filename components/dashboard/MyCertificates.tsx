'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { 
  Award, 
  Download, 
  Eye, 
  Calendar,
  CheckCircle,
  Clock,
  Sparkles,
  Target,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'

interface Certificate {
  id: string
  certificate_number: string
  program_title: string
  completion_date: string
  issued_at: string
  status: 'issued' | 'pending' | 'revoked' | 'expired'
  certificate_pdf_url?: string
  trainer_name?: string
  programs?: {
    id: string
    title: string
    category: string
  }
  template?: {
    template_name: string
  }
}

export function MyCertificates() {
  const { profile } = useAuth()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.id) {
      fetchCertificates()
    } else {
      setLoading(false)
    }
  }, [profile?.id])

  const fetchCertificates = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/certificate/user/${profile?.id}`)
      const result = await response.json()
      
      if (response.ok) {
        setCertificates(result.data || [])
      } else {
        console.error('Error fetching certificates:', result.error)
        setCertificates([])
      }
    } catch (error) {
      console.error('Error fetching certificates:', error)
      setCertificates([])
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async (certificateNumber: string, pdfUrl?: string) => {
    if (!pdfUrl) {
      console.error('PDF URL not available')
      return
    }

    try {
      const response = await fetch(pdfUrl)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `sertifikat-${certificateNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading certificate:', error)
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'issued':
        return { 
          label: 'Terbit', 
          color: 'bg-green-100 text-green-800', 
          icon: CheckCircle 
        }
      case 'pending':
        return { 
          label: 'Pending', 
          color: 'bg-yellow-100 text-yellow-800', 
          icon: Clock 
        }
      case 'revoked':
        return { 
          label: 'Dibatalkan', 
          color: 'bg-red-100 text-red-800', 
          icon: Clock 
        }
      case 'expired':
        return { 
          label: 'Kedaluwarsa', 
          color: 'bg-gray-100 text-gray-800', 
          icon: Clock 
        }
      default:
        return { 
          label: 'Unknown', 
          color: 'bg-gray-100 text-gray-800', 
          icon: Clock 
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

  const issuedCertificates = certificates.filter(cert => cert.status === 'issued')
  const pendingCertificates = certificates.filter(cert => cert.status === 'pending')

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Sertifikat Saya</h3>
        <Link 
          href="/my-certificates"
          className="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors"
        >
          Lihat Semua
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="flex items-start space-x-3 mb-3">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Award className="w-10 h-10 text-yellow-500" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            Belum Ada Sertifikat yang Terbit
          </h4>
          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
            Saat ini Anda belum memiliki sertifikat yang telah diterbitkan. Tetapi jangan khawatir, perjalanan menuju kesuksesan dimulai dari langkah pertama!
          </p>
          
          <div className="bg-gradient-to-br from-primary-50 to-red-50 rounded-xl p-6 mb-6 border border-primary-100">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-primary-600" />
                </div>
                <div className="text-left">
                  <h5 className="font-semibold text-gray-900 mb-1">Tingkatkan Komitmen Anda</h5>
                  <p className="text-sm text-gray-600">
                    Setiap program yang Anda selesaikan adalah investasi berharga untuk masa depan yang lebih cerah. Teruslah belajar dan berkembang!
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left">
                  <h5 className="font-semibold text-gray-900 mb-1">Raih Prestasi Terbaik</h5>
                  <p className="text-sm text-gray-600">
                    Dengan dedikasi dan kerja keras, Anda akan segera meraih sertifikat pertama sebagai bukti pencapaian luar biasa Anda di Garuda Academy.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="text-left">
                  <h5 className="font-semibold text-gray-900 mb-1">Mulai Perjalanan Anda</h5>
                  <p className="text-sm text-gray-600">
                    Setiap langkah yang Anda ambil hari ini akan membawa Anda lebih dekat pada kesuksesan. Percayalah pada proses dan nikmati setiap momen pembelajaran!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/programs"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-600 to-red-600 text-white rounded-xl hover:from-primary-700 hover:to-red-700 transition-all shadow-lg hover:shadow-xl font-medium"
          >
            <Target className="w-5 h-5 mr-2" />
            Jelajahi Program Pelatihan
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {certificates.slice(0, 3).map((cert) => {
              const statusInfo = getStatusInfo(cert.status)
              const StatusIcon = statusInfo.icon
              const programTitle = cert.programs?.title || cert.program_title
              const certificateType = cert.template?.template_name || 'Sertifikat Penyelesaian'

              return (
                <div key={cert.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Award className="w-6 h-6 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1 truncate">{programTitle}</h4>
                        <p className="text-sm text-gray-600 mb-1">{certificateType}</p>
                        {cert.trainer_name && (
                          <p className="text-xs text-gray-500">Instruktur: {cert.trainer_name}</p>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 flex-shrink-0 ${statusInfo.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      <span>{statusInfo.label}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(cert.completion_date || cert.issued_at)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Award className="w-4 h-4" />
                        <span>GARUDA-21 Training Center</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {cert.status === 'issued' && cert.certificate_pdf_url ? (
                        <>
                          <button 
                            onClick={() => handleDownloadPDF(cert.certificate_number, cert.certificate_pdf_url)}
                            className="flex items-center space-x-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </button>
                          <Link
                            href={`/certificate/${cert.certificate_number}`}
                            className="flex items-center space-x-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Lihat</span>
                          </Link>
                        </>
                      ) : (
                        <button className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg cursor-not-allowed text-sm font-medium">
                          <Clock className="w-4 h-4" />
                          <span>Menunggu Sertifikat</span>
                        </button>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">ID: #{cert.certificate_number}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Certificate Stats */}
          {certificates.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{issuedCertificates.length}</p>
                  <p className="text-sm text-gray-600">Terbit</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{pendingCertificates.length}</p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{certificates.length}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
