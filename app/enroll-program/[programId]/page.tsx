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
        ...programData,
        trainer: programData.user_profiles
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
      const { data: participantData, error: participantError } = await supabase
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

      const participantId = participantData?.id || (await supabase
        .from('participants')
        .select('id')
        .eq('user_id', profile.id)
        .single()).data?.id

      if (!participantId) {
        throw new Error('Failed to get participant ID')
      }

      // Create enrollment
      const enrollmentData = {
        program_id: program.id,
        participant_id: participantId,
        status: 'pending',
        payment_status: 'unpaid',
        amount_paid: 0,
        notes: referralCode ? `Referral Code: ${referralCode}` : ''
      }

      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .insert(enrollmentData)
        .select()
        .single()

      if (enrollmentError) {
        throw enrollmentError
      }

      // Create referral tracking if referral code exists
      if (referralCode && referralData) {
        const { error: trackingError } = await supabase
          .from('referral_tracking')
          .insert({
            referral_code_id: referralData.id,
            trainer_id: referralData.trainer_id,
            participant_id: participantId,
            enrollment_id: enrollment.id,
            program_id: program.id,
            discount_applied: program.price - calculateFinalPrice(),
            commission_earned: 0, // Will be calculated later
            status: 'pending'
          })

        if (trackingError) {
          console.error('Error creating referral tracking:', trackingError)
        }
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
