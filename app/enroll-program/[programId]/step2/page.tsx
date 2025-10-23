'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  start_date: string
  end_date: string
  max_participants: number
  current_participants: number
  trainer_id: string
  trainer: {
    full_name: string
    email: string
  }
}

interface EnrollmentData {
  participant_id: string
  program_id: string
  referral_code: string | null
  final_price: number
  full_name: string
  email: string
  background: string
  gender: string
}

export default function EnrollProgramStep2Page({ params }: { params: { programId: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { profile, loading: authLoading } = useAuth()
  const { addNotification } = useNotification()
  
  const [program, setProgram] = useState<Program | null>(null)
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  
  const programId = params.programId
  const referralCode = searchParams.get('referral')

  useEffect(() => {
    if (!authLoading) {
      if (!profile) {
        router.push('/register')
        return
      }
      fetchProgramData()
      loadEnrollmentData()
    }
  }, [profile, authLoading, programId])

  const fetchProgramData = async () => {
    try {
      setLoading(true)

      const { data: programData, error: programError } = await supabase
        .from('programs')
        .select(`
          *,
          user_profiles!programs_trainer_id_fkey (
            full_name,
            email
          )
        `)
        .eq('id', programId)
        .single()

      if (programError) {
        console.error('Error fetching program:', programError)
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Program tidak ditemukan'
        })
        router.push('/programs')
        return
      }

      setProgram({
        ...programData,
        trainer: programData.user_profiles
      })

    } catch (error) {
      console.error('Error fetching data:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Gagal memuat data program'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadEnrollmentData = () => {
    const savedData = sessionStorage.getItem('enrollmentFormData')
    if (savedData) {
      try {
        const data = JSON.parse(savedData)
        setEnrollmentData(data)
      } catch (error) {
        console.error('Error parsing enrollment data:', error)
        router.push(`/enroll-program/${programId}/step1?referral=${referralCode || ''}`)
      }
    } else {
      router.push(`/enroll-program/${programId}/step1?referral=${referralCode || ''}`)
    }
  }

  const generateReferralLink = () => {
    if (!profile) return ''
    // Generate a simple referral link using user ID and program ID
    const baseUrl = window.location.origin
    return `${baseUrl}/referral/${profile.id.slice(-8)}${programId.slice(-8)}`
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

  const completeEnrollment = async () => {
    if (!program || !enrollmentData || !profile) return

    try {
      setProcessing(true)

      // Create enrollment record
      const enrollmentRecord = {
        program_id: programId,
        participant_id: enrollmentData.participant_id,
        status: 'pending',
        payment_status: enrollmentData.final_price > 0 ? 'unpaid' : 'paid',
        amount_paid: 0,
        notes: enrollmentData.referral_code ? `Referral Code: ${enrollmentData.referral_code}` : ''
      }

      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .insert(enrollmentRecord)
        .select()
        .single()

      if (enrollmentError) {
        throw enrollmentError
      }

      // Create referral tracking if referral code exists
      if (enrollmentData.referral_code) {
        // Get referral code data
        const { data: referralCodeData, error: referralError } = await supabase
          .from('referral_codes')
          .select('*')
          .eq('code', enrollmentData.referral_code)
          .eq('program_id', programId)
          .single()

        if (!referralError && referralCodeData) {
          const { error: trackingError } = await supabase
            .from('referral_tracking')
            .insert({
              referral_code_id: referralCodeData.id,
              trainer_id: referralCodeData.trainer_id,
              participant_id: enrollmentData.participant_id,
              enrollment_id: enrollment.id,
              program_id: programId,
              discount_applied: program.price - enrollmentData.final_price,
              commission_earned: 0, // Will be calculated later
              status: 'pending'
            })

          if (trackingError) {
            console.error('Error creating referral tracking:', trackingError)
          }
        }
      }

      // Clear session storage
      sessionStorage.removeItem('enrollmentFormData')

      addNotification({
        type: 'success',
        title: 'Berhasil',
        message: 'Pendaftaran berhasil! Detail lebih lanjut telah dikirim ke email Anda.'
      })

      // Redirect to success page or dashboard
      setTimeout(() => {
        router.push(`/enroll-program/${programId}/success`)
      }, 1000)

    } catch (error: any) {
      console.error('Error completing enrollment:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Gagal menyelesaikan pendaftaran'
      })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data program...</p>
        </div>
      </div>
    )
  }

  if (!program || !enrollmentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Tidak Ditemukan</h2>
          <Link href="/programs" className="text-blue-600 hover:text-blue-700">
            Kembali ke Daftar Program
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/programs" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Program
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Pendaftaran Program</h1>
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
                    <p className="text-sm text-gray-600">Formulirmu sudah lengkap</p>
                  </div>
                </div>

                {/* Step 2 - Current */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Konfirmasi & Link Referral</p>
                    <p className="text-sm text-gray-600">
                      {enrollmentData.referral_code 
                        ? 'Kamu sudah terdaftar dengan kode referral. Bagikan link referral ke teman untuk membuka kelas-kelas berikutnya.'
                        : 'Kamu sudah terdaftar. Bagikan link referral ke teman untuk membuka kelas-kelas berikutnya.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Program Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">{program.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{program.description}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Harga Normal:</span>
                    <span className="text-gray-900">Rp {program.price.toLocaleString('id-ID')}</span>
                  </div>
                  
                  {enrollmentData.referral_code && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Diskon Referral:</span>
                      <span>- Rp {(program.price - enrollmentData.final_price).toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-semibold pt-2 border-t border-gray-200">
                    <span>Total:</span>
                    <span className="text-lg text-blue-600">Rp {enrollmentData.final_price.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {enrollmentData.referral_code && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                    <p className="text-xs text-green-700">
                      Kode Referral: <span className="font-mono font-bold">{enrollmentData.referral_code}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-600 font-semibold">Langkah 2</span>
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Pengumuman</h2>
              </div>

              {/* Success Message */}
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Pendaftaran berhasil dilakukan. Detail lebih lanjut telah dikirim ke email kamu ({enrollmentData.email}).
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
                <button
                  onClick={completeEnrollment}
                  disabled={processing}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {processing ? 'Memproses...' : 'Selesaikan Pendaftaran'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
