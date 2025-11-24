'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, CheckCircle, Copy, Gift, Share2 } from 'lucide-react'
import Link from 'next/link'
import { useNotification } from '@/components/ui/Notification'
import { generateWelcomeEmail } from '@/lib/email-templates'

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
  const [hasReferralUsed, setHasReferralUsed] = useState(false)
  const [userReferralCode, setUserReferralCode] = useState<string | null>(null)

  const programId = params.programId
  const referralCode = searchParams.get('referral')

  // List of materials
  const materials = [
    'Fondasi AI Generatif dan Prompting Efektif',
    'Dari Ide Menjadi Materi Ajar di Gemini Canvas',
    'Integrasi Lanjutan, Etika dan Pemberdayaan Siswa',
    'Sertifikasi Internasional Gemini Certified Educator',
    'Diseminasi Pengimbasan Program'
  ]

  const openMaterials = hasReferralUsed ? materials : materials.slice(0, 2)
  const lockedMaterials = hasReferralUsed ? [] : materials.slice(2)

  useEffect(() => {
    if (!authLoading) {
      if (!profile) {
        router.push('/register')
        return
      }
      fetchProgramData()
      loadEnrollmentData()
      checkReferralUsage()
      getOrCreateUserReferralCode()
    }
  }, [profile, authLoading, programId])

  const getOrCreateUserReferralCode = async () => {
    if (!profile?.id) return

    try {
      // Check if user already has a referral code
      const { data: existingCodes, error: fetchError } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('trainer_id', profile.id)
        .eq('is_active', true)
        .limit(1)

      if (fetchError) {
        console.error('Error fetching user referral codes:', fetchError)
        return
      }

      if (existingCodes && existingCodes.length > 0) {
        // User already has a referral code
        setUserReferralCode((existingCodes[0] as any).code)
        return
      }

      // Create new referral code for user
      const generateReferralCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        let result = ''
        for (let i = 0; i < 8; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return result
      }

      // Generate unique referral code (retry if duplicate)
      let newReferralCode = generateReferralCode()
      let attempts = 0
      let codeExists = true

      while (codeExists && attempts < 10) {
        const { data: existingCodes, error: checkError } = await supabase
          .from('referral_codes')
          .select('id')
          .eq('code', newReferralCode)
          .limit(1)

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking referral code:', checkError)
          return
        }

        if (!existingCodes || existingCodes.length === 0) {
          codeExists = false
        } else {
          newReferralCode = generateReferralCode()
          attempts++
        }
      }

      if (codeExists) {
        console.error('Failed to generate unique referral code after 10 attempts')
        return
      }

      const { data: newCode, error: createError } = await supabase
        .from('referral_codes')
        .insert({
          code: newReferralCode,
          trainer_id: profile.id,
          description: 'Referral code untuk berbagi program',
          is_active: true,
          discount_percentage: 0,
          discount_amount: 0,
          commission_percentage: 0,
          commission_amount: 0
        } as any)
        .select('code')
        .single()

      if (createError) {
        console.error('Error creating referral code:', createError)
        return
      }

      if (newCode) {
        setUserReferralCode((newCode as any).code)
      }
    } catch (error) {
      console.error('Error getting or creating referral code:', error)
    }
  }

  const checkReferralUsage = async () => {
    if (!profile?.id) return

    try {
      // Get user's referral codes
      const { data: userReferralCodes, error: codesError } = await supabase
        .from('referral_codes')
        .select('id')
        .eq('trainer_id', profile.id)

      if (codesError || !userReferralCodes || userReferralCodes.length === 0) {
        setHasReferralUsed(false)
        return
      }

      // Check if any referral code has been used (confirmed status)
      const { data: trackingData, error: trackingError } = await supabase
        .from('referral_tracking')
        .select('id')
        .in('referral_code_id', userReferralCodes.map(code => (code as any).id))
        .eq('status', 'confirmed')

      if (trackingError) {
        console.error('Error checking referral usage:', trackingError)
        setHasReferralUsed(false)
        return
      }

      // If at least 1 referral has been confirmed, unlock the materials
      setHasReferralUsed((trackingData?.length || 0) >= 1)
    } catch (error) {
      console.error('Error checking referral usage:', error)
      setHasReferralUsed(false)
    }
  }

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
        ...(programData as any),
        trainer: (programData as any).user_profiles
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
    if (!userReferralCode) return ''
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/referral/${userReferralCode}`
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

      // Check if program is free
      const isFree = enrollmentData.final_price === 0 || program.price === 0

      // Create enrollment record
      const enrollmentRecord = {
        program_id: programId,
        participant_id: enrollmentData.participant_id,
        status: isFree ? 'approved' : 'pending',
        payment_status: isFree ? 'paid' : 'unpaid',
        amount_paid: 0,
        notes: enrollmentData.referral_code ? `Referral Code: ${enrollmentData.referral_code}` : ''
      }

      const { data: enrollment, error: enrollmentError } = await (supabase as any)
        .from('enrollments')
        .insert(enrollmentRecord)
        .select()
        .single()

      if (enrollmentError) {
        throw enrollmentError
      }

      // Check enrollment status (might be auto-approved by trigger)
      const enrollmentStatus = (enrollment as any).status
      const isEnrollmentApproved = enrollmentStatus === 'approved'

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
          // If enrollment is approved (free program or auto-approved), referral should be confirmed
          const referralTrackingStatus = isEnrollmentApproved ? 'confirmed' : 'pending'

          const { error: trackingError } = await (supabase as any)
            .from('referral_tracking')
            .insert({
              referral_code_id: (referralCodeData as any).id,
              trainer_id: (referralCodeData as any).trainer_id,
              participant_id: enrollmentData.participant_id,
              enrollment_id: enrollment.id,
              program_id: programId,
              discount_applied: program.price - enrollmentData.final_price,
              commission_earned: 0, // Will be calculated later
              status: referralTrackingStatus
            })

          if (trackingError) {
            console.error('Error creating referral tracking:', trackingError)
          } else if (isEnrollmentApproved) {
            console.log('Referral tracking created with confirmed status (free program auto-approved)')
          }
        }
      }

      // Send welcome email
      try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const referralLink = userReferralCode ? `${baseUrl}/referral/${userReferralCode}` : undefined

        // Generate email HTML
        const emailHtml = generateWelcomeEmail({
          participantName: enrollmentData.full_name,
          programTitle: program.title,
          programDescription: program.description || '',
          userReferralCode: userReferralCode || undefined,
          referralLink: referralLink,
          dashboardUrl: `${baseUrl}/dashboard`,
          openMaterials,
          lockedMaterials,
          hasReferralUsed: hasReferralUsed,
        })

        // Send email via API (async, tidak perlu menunggu)
        fetch('/api/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: enrollmentData.email,
            subject: `Selamat Bergabung - ${program.title} | GARUDA-21 Training Center`,
            html: emailHtml,
            useQueue: true, // Use queue untuk scalability
          }),
        }).catch((error) => {
          console.error('Error sending welcome email:', error)
          // Don't throw - email sending failure shouldn't block enrollment
        })
      } catch (emailError) {
        console.error('Error preparing welcome email:', emailError)
        // Don't throw - email sending failure shouldn't block enrollment
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
                        : 'Kamu sudah terdaftar. Bagikan link referral ke teman untuk membuka kelas-kelas berikutnya.'}
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
                    Berikut adalah daftar materi pelatihan yang perlu kamu selesaikan:
                  </h4>
                  <div className="space-y-2">
                    {openMaterials.map((material, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-700">{material}</span>
                      </div>
                    ))}
                    {lockedMaterials.map((material, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-xs text-gray-600">🔒</span>
                        </div>
                        <span className="text-sm text-gray-500">{material}</span>
                      </div>
                    ))}
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
                  {hasReferralUsed ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 text-sm font-semibold mb-2">
                        Selamat! Akses ke 3 materi terakhir telah terbuka!
                      </p>
                      <p className="text-green-700 text-sm">
                        Kamu berhasil mengajak minimal 1 teman atau rekan untuk bergabung melalui tautan referral-mu. Kamu sekarang dapat mengakses semua materi pelatihan.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800 text-sm font-semibold mb-2">
                        Materi Terakhir Masih Terkunci
                      </p>
                      <p className="text-yellow-700 text-sm mb-2">
                        Untuk membuka akses ke 3 materi terakhir, kamu <strong>harus membagikan kode referral</strong> ke rekan yang lain. Materi terakhir hanya akan terbuka setelah kode referral kamu <strong>berhasil digunakan oleh minimal 1 teman atau rekan</strong> yang bergabung dalam program ini.
                      </p>
                      <p className="text-yellow-700 text-sm font-medium mt-2">
                        Cara membuka materi terakhir:
                      </p>
                      <ol className="text-yellow-700 text-sm list-decimal list-inside mt-2 space-y-1">
                        <li>Salin link referral yang tersedia di bawah</li>
                        <li>Bagikan link tersebut ke teman atau rekan kamu</li>
                        <li>Tunggu teman/rekan kamu menggunakan link tersebut untuk mendaftar</li>
                        <li>Setelah mereka terdaftar, 3 materi terakhir akan otomatis terbuka</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>

              {/* Referral Link Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Link Referral</h3>

                <p className="text-gray-700 mb-4">
                  Jadilah bagian penting dari program ini dengan mengajak lebih banyak teman atau kerabat! Semakin banyak yang bergabung melalui referral-mu, semakin besar peluangmu memenangkan hadiah menarik seperti laptop, gadget, dan voucher eksklusif.
                </p>

                {userReferralCode ? (
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
                ) : (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">Sedang memuat kode referral Anda...</p>
                  </div>
                )}
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
