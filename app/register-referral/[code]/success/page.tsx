'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, CheckCircle, Copy, Gift, Share2 } from 'lucide-react'
import Link from 'next/link'
import { useNotification } from '@/components/ui/Notification'

interface Program {
  id: string
  title: string
  description: string
  category: string
  price: number
}

export default function RegisterReferralSuccessPage({ params }: { params: { code: string } }) {
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()
  const { addNotification } = useNotification()
  
  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)
  
  const referralCode = params.code

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push('/login')
      return
    }
    
    fetchProgramData()
  }, [profile, authLoading, referralCode])

  const fetchProgramData = async () => {
    try {
      setLoading(true)

      // Get referral code details with program info
      const { data, error } = await supabase
        .from('referral_codes')
        .select(`
          *,
          programs (
            id,
            title,
            description,
            price,
            category
          )
        `)
        .eq('code', referralCode)
        .single()

      if (error) {
        console.error('Error fetching referral code:', error)
        return
      }

      if (data && (data as any).programs) {
        setProgram((data as any).programs)
      }

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateReferralLink = () => {
    if (!profile) return ''
    const baseUrl = window.location.origin
    return `${baseUrl}/register-referral/${profile.id.slice(-8)}${referralCode.slice(-8)}`
  }

  const copyReferralLink = async () => {
    const link = generateReferralLink()
    try {
      await navigator.clipboard.writeText(link)
      addNotification({
        type: 'success',
        title: 'Berhasil',
        message: 'Link referral berhasil disalin!'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Gagal menyalin link'
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/programs" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Program
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Pendaftaran Berhasil</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Progress Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Pendaftaran</h3>
              
              <div className="space-y-4">
                {/* Step 1 - Completed */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Isi Formulir Registrasi</p>
                    <p className="text-sm text-gray-600">Formulirmu sudah lengkap.</p>
                  </div>
                </div>

                {/* Step 2 - Current */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Akses Kelas</p>
                    <p className="text-sm text-gray-600">
                      Kamu sudah terdaftar dan mendapatkan 2 kelas pertama. Bagikan link referral ke 1 teman untuk membuka kelas-kelas berikutnya.
                    </p>
                  </div>
                </div>
              </div>

              {/* Program Info */}
              {program && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">{program.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{program.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-600 font-semibold">Langkah 1</span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Isi Formulir Registrasi</h2>
              </div>

              {/* Success Message */}
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Pendaftaran berhasil dilakukan. Detail lebih lanjut telah dikirim ke email kamu ({profile?.email}).
                </p>
              </div>

              {/* Success Card */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-green-900 mb-3">
                  Selamat, kamu telah berhasil terdaftar sebagai peserta program pelatihan eksklusif dari GARUDA-21 Training Center!
                </h3>
                
                <p className="text-green-800 mb-4">
                  Perjalananmu akan dimulai dengan mengakses kurikulum level awal. Kelas-kelas ini wajib diselesaikan secara berurutan sebagai pondasi utama sebelum melangkah ke materi yang lebih dalam.
                </p>

                <div className="bg-white rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Berikut adalah kelas-kelas yang perlu kamu selesaikan:
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-700">Belajar Penerapan Data Science dengan Microsoft Fabric</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-700">Membangun Aplikasi Gen AI dengan Microsoft Azure</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-xs text-gray-600">🔒</span>
                      </div>
                      <span className="text-sm text-gray-500">Memulai Pemrograman dengan Python</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-xs text-gray-600">🔒</span>
                      </div>
                      <span className="text-sm text-gray-500">Belajar Machine Learning untuk Pemula</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-xs text-gray-600">🔒</span>
                      </div>
                      <span className="text-sm text-gray-500">Belajar Fundamental Pemrosesan Data</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Untuk mengakses kelas, silakan menuju halaman </strong>
                    <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 underline">dashboard</Link>
                    <strong>.</strong>
                  </p>
                </div>

                <div className="mt-4">
                  <p className="text-green-800 text-sm">
                    Akses ke 3 kelas terakhir hanya akan terbuka setelah kamu berhasil mengajak minimal 1 teman atau rekan untuk bergabung dalam program ini melalui tautan referral-mu.
                  </p>
                </div>
              </div>

              {/* Referral Link Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Link Referral</h3>
                
                <p className="text-gray-700 mb-4">
                  Jadilah bagian penting dari program ini dengan mengajak lebih banyak teman atau kerabat! Semakin banyak yang bergabung melalui referral-mu, semakin besar peluangmu memenangkan hadiah menarik seperti laptop, gadget, dan voucher eksklusif.
                </p>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={generateReferralLink()}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                    />
                  </div>
                  <button
                    onClick={copyReferralLink}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                    Salin Link
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between mt-6">
                <Link
                  href="/programs"
                  className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Kembali ke Program
                </Link>
                <Link
                  href="/dashboard"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Ke Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
