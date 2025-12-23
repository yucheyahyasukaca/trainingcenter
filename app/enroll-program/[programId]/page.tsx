'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, CheckCircle, Gift, User, Calendar, DollarSign } from 'lucide-react'
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

interface ReferralData {
  id: string
  code: string
  description: string
  trainer_id: string
  program_id: string
  discount_percentage: number
  discount_amount: number
}

export default function EnrollProgramPage({ params }: { params: { programId: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { profile, loading: authLoading } = useAuth()
  const { addNotification } = useNotification()

  const [program, setProgram] = useState<Program | null>(null)
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)

  const programId = params.programId
  const referralCode = searchParams.get('referral')

  useEffect(() => {
    if (!authLoading) {
      if (!profile) {
        router.push('/register')
        return
      }
      fetchProgramData()
    }
  }, [profile, authLoading, programId])

  const fetchProgramData = async () => {
    try {
      setLoading(true)

      // Check profile completeness before fetching program
      try {
        const { data: authUser } = await supabase.auth.getUser()
        const userId = authUser?.user?.id
        if (userId) {
          // Read user profile
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('full_name, email, phone, gender, address, provinsi')
            .eq('id', userId)
            .maybeSingle()

          // Read participant if exists
          const { data: participant } = await supabase
            .from('participants')
            .select('id, phone, address, gender, date_of_birth, education, education_status, employment_status, it_background, disability, program_source, provinsi')
            .eq('user_id', userId)
            .maybeSingle()

          const nameOk = !!(userProfile as any)?.full_name
          const emailOk = !!(userProfile as any)?.email
          const phoneOk = !!((userProfile as any)?.phone || (participant as any)?.phone)
          const genderOk = !!((userProfile as any)?.gender || (participant as any)?.gender)
          const addressOk = !!((userProfile as any)?.address || (participant as any)?.address)
          const provinsiOk = !!((userProfile as any)?.provinsi || (participant as any)?.provinsi)
          const dateOfBirthOk = !!(participant as any)?.date_of_birth
          const educationOk = !!(participant as any)?.education
          const educationStatusOk = !!(participant as any)?.education_status
          const employmentStatusOk = !!(participant as any)?.employment_status
          const itBackgroundOk = !!(participant as any)?.it_background
          const disabilityOk = !!(participant as any)?.disability
          const programSourceOk = !!(participant as any)?.program_source

          const isComplete = nameOk && emailOk && phoneOk && genderOk && addressOk && provinsiOk &&
            dateOfBirthOk && educationOk && educationStatusOk && employmentStatusOk &&
            itBackgroundOk && disabilityOk && programSourceOk

          if (!isComplete) {
            // Show notification about incomplete profile
            addNotification({
              type: 'warning',
              title: 'Data Profil Belum Lengkap',
              message: `Untuk mendaftar program, Anda harus melengkapi data profil terlebih dahulu. Silakan lengkapi data di halaman edit profil.`,
              duration: 5000
            })

            console.log('➡️ Redirecting to edit profile page to complete data first')

            setTimeout(() => {
              router.push(`/profile/edit?return=${encodeURIComponent(`/enroll-program/${programId}${referralCode ? `?referral=${referralCode}` : ''}`)}`)
            }, 1500)
            return
          }
        }
      } catch (e) {
        // If profile check fails, redirect to edit profile page to be safe
        console.error('Error checking profile completeness:', e)
        addNotification({
          type: 'warning',
          title: 'Lengkapi Data Profil',
          message: 'Untuk mendaftar program, silakan lengkapi data profil Anda terlebih dahulu.',
          duration: 5000
        })

        setTimeout(() => {
          router.push(`/profile/edit?return=${encodeURIComponent(`/enroll-program/${programId}${referralCode ? `?referral=${referralCode}` : ''}`)}`)
        }, 1500)
        return
      }

      // Fetch program data
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

      // Fetch referral data if referral code exists
      if (referralCode) {
        const { data: referralData, error: referralError } = await supabase
          .from('referral_codes')
          .select('*')
          .eq('code', referralCode)
          .eq('program_id', programId)
          .eq('is_active', true)
          .single()

        if (!referralError && referralData) {
          setReferralData(referralData)
        }
      }

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

  const calculateFinalPrice = () => {
    if (!program) return 0
    if (!referralData) return program.price

    let finalPrice = program.price

    // Apply discount
    if (referralData.discount_percentage > 0) {
      finalPrice = finalPrice * (1 - referralData.discount_percentage / 100)
    }
    if (referralData.discount_amount > 0) {
      finalPrice = finalPrice - referralData.discount_amount
    }

    return Math.max(0, finalPrice)
  }

  const handleEnroll = async () => {
    if (!program || !profile) return

    try {
      setEnrolling(true)

      // Create participant record first
      const { data: participantData, error: participantError } = await (supabase as any)
        .from('participants')
        .insert({
          user_id: profile.id,
          name: profile.full_name,
          email: profile.email,
          phone: '', // You might want to add phone field to user profile
          address: ''
        })
        .select()
        .single()

      if (participantError) {
        // Check if participant already exists
        const { data: existingParticipant } = await supabase
          .from('participants')
          .select('*')
          .eq('user_id', profile.id)
          .single()

        if (!existingParticipant) {
          throw participantError
        }
      }

      const participantId = (participantData as any)?.id || ((await supabase
        .from('participants')
        .select('id')
        .eq('user_id', profile.id)
        .single()).data as any)?.id

      if (!participantId) {
        throw new Error('Failed to get participant ID')
      }

      // Check if user already enrolled in this program
      const { data: existingEnrollment, error: enrollmentCheckError } = await supabase
        .from('enrollments')
        .select('id, status')
        .eq('participant_id', participantId)
        .eq('program_id', program.id)
        .maybeSingle()

      if (enrollmentCheckError) {
        throw enrollmentCheckError
      }

      if (existingEnrollment) {
        const statusText = (existingEnrollment as any).status === 'pending' ? 'menunggu persetujuan' :
          (existingEnrollment as any).status === 'approved' ? 'sudah disetujui' :
            'ditolak'

        addNotification({
          type: 'warning',
          title: 'Sudah Terdaftar',
          message: `Anda sudah terdaftar di program ini dengan status ${statusText}. Silakan cek halaman "Kelas Terdaftar".`,
          duration: 8000
        })

        // Redirect to my enrollments
        router.push('/my-enrollments')
        return
      }

      // Create enrollment
      const enrollmentData = {
        program_id: program.id,
        participant_id: participantId,
        status: 'pending',
        payment_status: 'unpaid',
        amount_paid: 0,
        referral_code_id: referralData?.id || null, // Save referral_code_id to enrollment
        referral_discount: referralData ? program.price - calculateFinalPrice() : 0,
        final_price: calculateFinalPrice(),
        notes: referralCode ? `Referral Code: ${referralCode}` : ''
      }

      const { data: enrollment, error: enrollmentError } = await (supabase as any)
        .from('enrollments')
        .insert(enrollmentData)
        .select()
        .single()

      if (enrollmentError) {
        throw enrollmentError
      }

      // Referral tracking is now handled automatically by database trigger 'trigger_auto_create_referral_tracking'
      // based on the referral_code_id present in the enrollment record.
      if (referralCode && referralData) {
        console.log('Referral tracking should be created automatically by trigger')
      }

      addNotification({
        type: 'success',
        title: 'Berhasil',
        message: 'Pendaftaran berhasil! Silakan tunggu konfirmasi dari admin.'
      })

      router.push('/my-enrollments')

    } catch (error: any) {
      console.error('Error enrolling:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Gagal mendaftar program'
      })
    } finally {
      setEnrolling(false)
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

  if (!program) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Program Tidak Ditemukan</h2>
          <Link href="/programs" className="text-blue-600 hover:text-blue-700">
            Kembali ke Daftar Program
          </Link>
        </div>
      </div>
    )
  }

  const finalPrice = calculateFinalPrice()
  const discount = program.price - finalPrice

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Program Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{program.title}</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Trainer</p>
                    <p className="font-medium text-gray-900">{program.trainer.full_name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Jadwal</p>
                    <p className="font-medium text-gray-900">
                      {new Date(program.start_date).toLocaleDateString('id-ID')} - {new Date(program.end_date).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Harga Normal</p>
                    <p className="font-medium text-gray-900">
                      Rp {program.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Deskripsi Program</p>
                  <p className="text-gray-900">{program.description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Enrollment Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Pendaftaran</h3>

              {/* Referral Info */}
              {referralData && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Kode Referral Aktif</span>
                  </div>
                  <p className="text-xs text-green-700 font-mono">{referralData.code}</p>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Harga Normal</span>
                  <span className="text-gray-900">Rp {program.price.toLocaleString('id-ID')}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Diskon</span>
                    <span>- Rp {discount.toLocaleString('id-ID')}</span>
                  </div>
                )}

                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total Pembayaran</span>
                    <span className="text-lg">Rp {finalPrice.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              {/* Enroll Button */}
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {enrolling ? 'Mendaftar...' : 'Daftar Sekarang'}
              </button>

              <p className="text-xs text-gray-500 mt-3 text-center">
                Setelah mendaftar, Anda akan menunggu konfirmasi dari admin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
