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
  const [hasReferralUsed, setHasReferralUsed] = useState(false)
  const [userReferralCode, setUserReferralCode] = useState<string | null>(null)
  
  const referralCode = params.code

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
    if (!authLoading && !profile) {
      router.push('/login')
      return
    }
    
    fetchProgramData()
    checkReferralUsage()
    getOrCreateUserReferralCode()
  }, [profile, authLoading, referralCode])

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
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-semibold">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-1">Akses Kelas & Bagikan Referral</p>
                    <p className="text-sm text-gray-600 mb-2">
                      Kamu sudah terdaftar dan mendapatkan akses ke 2 kelas pertama. 
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium text-gray-700">✓ Cek email untuk detail lengkap</p>
                      <p className="text-xs font-medium text-gray-700">✓ Akses dashboard untuk mulai belajar</p>
                      <p className="text-xs font-medium text-blue-600">→ Bagikan link referral untuk membuka 3 kelas berikutnya</p>
                    </div>
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
                  <span className="text-sm text-gray-500">Selesai</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Isi Formulir Registrasi</h2>
                <p className="text-gray-600 mt-2">Formulir registrasi Anda telah berhasil disubmit dan diverifikasi.</p>
              </div>

              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-600 font-semibold">Langkah 2</span>
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">2</span>
                  </div>
                  <span className="text-sm text-blue-600 font-medium">Sedang Berlangsung</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Akses Kelas & Bagikan Referral</h2>
                <p className="text-gray-600 mb-3">
                  Sekarang adalah waktunya untuk mulai belajar dan membagikan program ini ke teman-teman Anda.
                </p>
              </div>

              {/* Success Message */}
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-blue-900 font-semibold mb-1">Email Konfirmasi Telah Dikirim</h4>
                      <p className="text-blue-800 text-sm mb-2">
                        Kami telah mengirimkan email konfirmasi lengkap ke <strong>{profile?.email}</strong>. 
                        Silakan cek inbox email Anda (juga folder spam/junk) untuk melihat detail pendaftaran dan informasi penting lainnya.
                      </p>
                      <p className="text-blue-700 text-xs">
                        📧 Email berisi: Detail program, materi yang dapat diakses, link referral, dan panduan selanjutnya.
                      </p>
                    </div>
                  </div>
                </div>
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
                        ✅ Selamat! Akses ke 3 materi terakhir telah terbuka!
                      </p>
                      <p className="text-green-700 text-sm">
                        Kamu berhasil mengajak minimal 1 teman atau rekan untuk bergabung melalui tautan referral-mu. Kamu sekarang dapat mengakses semua materi pelatihan.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800 text-sm font-semibold mb-2">
                        ⚠️ Materi Terakhir Masih Terkunci
                      </p>
                      <p className="text-yellow-700 text-sm mb-2">
                        Untuk membuka akses ke 3 materi terakhir, kamu <strong>harus membagikan kode referral</strong> ke rekan yang lain. Materi terakhir hanya akan terbuka setelah kode referral kamu <strong>berhasil digunakan oleh minimal 1 teman atau rekan</strong> yang bergabung dalam program ini.
                      </p>
                      <p className="text-yellow-700 text-sm font-medium mt-2">
                        📋 Cara membuka materi terakhir:
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
