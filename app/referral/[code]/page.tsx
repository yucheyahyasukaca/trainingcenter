'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { CheckCircle, XCircle, Loader2, Gift, ArrowRight } from 'lucide-react'
import { useNotification } from '@/components/ui/Notification'

interface ReferralCodeData {
  id: string
  code: string
  description: string
  trainer_id: string
  is_active: boolean
  valid_until: string | null
  max_uses: number | null
  current_uses: number
  trainer: {
    full_name: string
    email: string
  }
}

export default function ReferralPage({ params }: { params: { code: string } }) {
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()
  const { addNotification } = useNotification()
  const [referralData, setReferralData] = useState<ReferralCodeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const referralCode = params.code

  useEffect(() => {
    if (!authLoading) {
      validateReferralCode()
    }
  }, [referralCode, authLoading])

  const validateReferralCode = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Validating referral code:', referralCode)

      // Get referral code details with trainer info
      const { data, error } = await supabase
        .from('referral_codes')
        .select(`
          *,
          user_profiles!referral_codes_trainer_id_fkey (
            full_name,
            email
          )
        `)
        .eq('code', referralCode)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error fetching referral code:', error)
        throw error
      }

      if (!data) {
        setError('Kode referral tidak ditemukan')
        return
      }

      // Check if referral code is expired
      if ((data as any).valid_until && new Date((data as any).valid_until) < new Date()) {
        setError('Kode referral sudah expired')
        return
      }

      // Check if referral code has reached max uses
      if ((data as any).max_uses && (data as any).current_uses >= (data as any).max_uses) {
        setError('Kode referral sudah mencapai batas penggunaan')
        return
      }

      // Transform data to match interface
      const referralCodeData: ReferralCodeData = {
        id: (data as any).id,
        code: (data as any).code,
        description: (data as any).description,
        trainer_id: (data as any).trainer_id,
        is_active: (data as any).is_active,
        valid_until: (data as any).valid_until,
        max_uses: (data as any).max_uses,
        current_uses: (data as any).current_uses,
        trainer: {
          full_name: (data as any).user_profiles?.full_name || 'Unknown Trainer',
          email: (data as any).user_profiles?.email || 'unknown@example.com'
        }
      }

      console.log('Referral code validated:', referralCodeData)
      setReferralData(referralCodeData)

      // Store referral code in sessionStorage for later use
      sessionStorage.setItem('referralCode', referralCode)
      sessionStorage.setItem('referralData', JSON.stringify(referralCodeData))

    } catch (error: any) {
      console.error('Error validating referral code:', error)
      setError(error.message || 'Gagal memvalidasi kode referral')
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    if (!profile) {
      // User not logged in, redirect to registration/login
      router.push(`/register?referral=${referralCode}`)
    } else {
      // User already logged in, redirect to referral registration page
      router.push(`/register-referral/${referralCode}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Memvalidasi Kode Referral</h2>
          <p className="text-gray-600">Mohon tunggu sebentar...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Kode Referral Tidak Valid</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Kode Referral Valid!</h2>
          <p className="text-gray-600">Anda mendapatkan diskon khusus untuk program ini</p>
        </div>

        {referralData && (
          <div className="space-y-4 mb-6">
            {/* Trainer Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Gift className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Dari Trainer:</p>
                  <p className="font-semibold text-gray-900">{referralData.trainer.full_name}</p>
                  <p className="text-xs text-gray-500">{referralData.trainer.email}</p>
                </div>
              </div>
            </div>

            {/* Referral Code Info */}
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Kode Referral:</p>
              <p className="font-mono font-bold text-green-700 text-lg">{referralData.code}</p>
              {referralData.description && (
                <p className="text-xs text-gray-500 mt-1">{referralData.description}</p>
              )}
            </div>

            {/* Code Status Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Status:</p>
                  <p className="font-semibold text-green-600">Aktif</p>
                </div>
                <div>
                  <p className="text-gray-600">Penggunaan:</p>
                  <p className="font-semibold">
                    {referralData.current_uses}
                    {referralData.max_uses ? ` / ${referralData.max_uses}` : ' / ∞'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleContinue}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            {profile ? 'Daftar Program' : 'Daftar atau Login'}
            <ArrowRight className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Kembali ke Beranda
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            {profile 
              ? 'Anda akan diarahkan ke halaman pendaftaran program dengan kode referral ini.'
              : 'Anda akan diarahkan ke halaman registrasi. Setelah berhasil login, Anda akan diarahkan ke pendaftaran program.'
            }
          </p>
        </div>
      </div>
    </div>
  )
}