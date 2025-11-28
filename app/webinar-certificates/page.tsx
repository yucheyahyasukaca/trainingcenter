'use client'

import { useState, useEffect } from 'react'
import { PublicNav } from '@/components/layout/PublicNav'
import { Search, Award, Download, Eye, CheckCircle, Calendar, User, FileText, Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import Link from 'next/link'

interface Webinar {
  id: string
  title: string
  slug: string
  start_time: string
  end_time: string
}

interface Certificate {
  id: string
  certificate_number: string | null
  issued_at: string | null
  webinar_id: string
  user_id: string | null
  participant_id: string | null
  webinars: {
    id: string
    title: string
    slug: string
    start_time: string
    end_time: string
  } | null
  user_profiles?: {
    id: string
    full_name: string
    email: string
  } | null
  webinar_participants?: {
    id: string
    full_name: string
    unit_kerja: string
    email: string
  } | null
  has_certificate: boolean
}

export default function WebinarCertificatesPage() {
  const toast = useToast()
  const [webinars, setWebinars] = useState<Webinar[]>([])
  const [selectedWebinarId, setSelectedWebinarId] = useState<string>('')
  const [participantName, setParticipantName] = useState<string>('')
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null) // Track which certificate is being generated

  useEffect(() => {
    fetchWebinars()
  }, [])

  const fetchWebinars = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/webinars')
      const result = await response.json()
      
      if (response.ok) {
        // Filter only webinars that have ended
        const now = new Date()
        const endedWebinars = (result.webinars || []).filter((w: Webinar) => 
          new Date(w.end_time) < now
        )
        setWebinars(endedWebinars)
      }
    } catch (error) {
      console.error('Error fetching webinars:', error)
      toast.error('Error', 'Gagal memuat daftar webinar')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!selectedWebinarId) {
      toast.warning('Peringatan', 'Silakan pilih webinar terlebih dahulu')
      return
    }

    if (!participantName.trim()) {
      toast.warning('Peringatan', 'Silakan masukkan nama peserta')
      return
    }

    try {
      setSearching(true)
      const response = await fetch('/api/webinar-certificates/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          webinar_id: selectedWebinarId,
          participant_name: participantName.trim()
        })
      })

      const result = await response.json()

      if (response.ok) {
        setCertificates(result.data || [])
        if (result.data.length === 0) {
          toast.info('Tidak ditemukan', 'Sertifikat tidak ditemukan untuk nama tersebut')
        }
      } else {
        toast.error('Error', result.error || 'Gagal mencari sertifikat')
      }
    } catch (error) {
      console.error('Error searching certificates:', error)
      toast.error('Error', 'Terjadi kesalahan saat mencari sertifikat')
    } finally {
      setSearching(false)
    }
  }

  const handleViewCertificate = async (cert: Certificate) => {
    // If certificate already exists, just redirect to verify page
    if (cert.has_certificate && cert.certificate_number) {
      const encodedCertNumber = encodeURIComponent(cert.certificate_number)
      window.open(`/webinar-certificates/verify/${encodedCertNumber}`, '_blank')
      return
    }

    // Generate certificate on-demand
    try {
      setGenerating(cert.id)
      const response = await fetch('/api/webinar-certificates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          webinar_id: cert.webinar_id,
          user_id: cert.user_id,
          participant_id: cert.participant_id
        })
      })

      const result = await response.json()

      if (response.ok && result.data?.certificate_number) {
        // Update local state
        const updatedCerts = certificates.map(c => 
          c.id === cert.id 
            ? { ...c, certificate_number: result.data.certificate_number, issued_at: result.data.issued_at, has_certificate: true }
            : c
        )
        setCertificates(updatedCerts)
        
        // Redirect to verify page with encoded certificate number
        const encodedCertNumber = encodeURIComponent(result.data.certificate_number)
        window.open(`/webinar-certificates/verify/${encodedCertNumber}`, '_blank')
        toast.success('Berhasil', 'Sertifikat berhasil dibuat')
      } else {
        toast.error('Error', result.error || 'Gagal membuat sertifikat')
      }
    } catch (error) {
      console.error('Error generating certificate:', error)
      toast.error('Error', 'Terjadi kesalahan saat membuat sertifikat')
    } finally {
      setGenerating(null)
    }
  }

  const handleDownloadPDF = async (certificateNumber: string) => {
    if (!certificateNumber) {
      toast.error('Error', 'Nomor sertifikat tidak ditemukan')
      return
    }

    try {
      // Encode certificate number untuk URL
      const encodedCertNumber = encodeURIComponent(certificateNumber)
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
      a.download = `sertifikat-${certificateNumber}.pdf`
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

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-white">
      <PublicNav activeLink="webinars" />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-red-50 pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-100 rounded-full mb-4">
              <Award className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-semibold text-primary-700">Sertifikat Webinar</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Akses Sertifikat Webinar
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Cari dan unduh sertifikat webinar Anda dengan mudah. Tidak perlu login.
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
            <div className="space-y-6">
              {/* Webinar Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Pilih Webinar
                </label>
                {loading ? (
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ) : (
                  <select
                    value={selectedWebinarId}
                    onChange={(e) => {
                      setSelectedWebinarId(e.target.value)
                      setCertificates([])
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  >
                    <option value="">— Pilih Webinar —</option>
                    {webinars.map((webinar) => (
                      <option key={webinar.id} value={webinar.id}>
                        {webinar.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Participant Name Search */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Nama Peserta
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Masukkan nama lengkap Anda"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch()
                      }
                    }}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={searching || !selectedWebinarId || !participantName.trim()}
                className="w-full bg-gradient-to-r from-primary-600 to-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-primary-700 hover:to-red-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {searching ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Mencari...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Cari Sertifikat</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      {certificates.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Hasil Pencarian
              </h2>
              <p className="text-gray-600">
                Ditemukan {certificates.length} sertifikat
              </p>
            </div>

            <div className="space-y-4">
              {certificates.map((cert) => {
                const participantName = cert.user_profiles?.full_name || cert.webinar_participants?.full_name || 'Peserta'
                const isGenerating = generating === cert.id
                
                return (
                  <div
                    key={cert.id}
                    className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start space-x-3 mb-3">
                          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Award className="w-6 h-6 text-primary-600" />
                          </div>
                          <div className="flex-1">
                            {/* Nama peserta - besar dan prominent */}
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                              {participantName}
                            </h3>
                            <div className="space-y-1.5">
                              {/* Judul webinar - kecil */}
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <Award className="w-3.5 h-3.5" />
                                <span>{cert.webinars?.title || 'Webinar'}</span>
                              </div>
                              {cert.has_certificate && cert.issued_at && (
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>Diterbitkan: {formatDate(cert.issued_at)}</span>
                                </div>
                              )}
                              {cert.has_certificate && cert.certificate_number && (
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                  <FileText className="w-3.5 h-3.5" />
                                  <span className="font-mono">#{cert.certificate_number}</span>
                                </div>
                              )}
                              {!cert.has_certificate && (
                                <div className="flex items-center space-x-2 text-xs text-amber-600 mt-2">
                                  <span>Sertifikat akan dibuat saat Anda klik "Lihat Sertifikat"</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        {cert.has_certificate && cert.certificate_number ? (
                          <>
                            <Link
                              href={`/webinar-certificates/verify/${cert.certificate_number}`}
                              target="_blank"
                              className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Lihat & Verifikasi</span>
                            </Link>
                            <button
                              onClick={() => handleDownloadPDF(cert.certificate_number!)}
                              className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                            >
                              <Download className="w-4 h-4" />
                              <span>Unduh PDF</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleViewCertificate(cert)}
                            disabled={isGenerating}
                            className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isGenerating ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Membuat Sertifikat...</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4" />
                                <span>Lihat Sertifikat</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Empty State */}
      {certificates.length === 0 && !searching && selectedWebinarId && participantName && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Sertifikat Tidak Ditemukan
              </h3>
              <p className="text-gray-600 mb-6">
                Tidak ada sertifikat yang ditemukan untuk nama "{participantName}" pada webinar yang dipilih.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-800">
                  <strong>Tips:</strong> Pastikan nama yang Anda masukkan sesuai dengan nama yang terdaftar saat registrasi webinar.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Info Section */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-primary-50 to-red-50 rounded-2xl p-8 border border-primary-100">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Informasi Penting
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Sertifikat hanya tersedia untuk webinar yang telah selesai</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Masukkan nama lengkap sesuai dengan yang terdaftar saat registrasi</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Setiap sertifikat memiliki QR code untuk verifikasi keaslian</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Anda dapat mengunduh sertifikat dalam format PDF</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

