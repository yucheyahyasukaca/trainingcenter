'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackSuccessPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleCallback() {
      try {
        console.log('🔄 Processing OAuth callback...')

        // Wait a bit for session to be set
        await new Promise(resolve => setTimeout(resolve, 500))

        // Check if session exists
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('❌ Session error:', sessionError)
          setError(sessionError.message)
          setTimeout(() => router.push('/login'), 3000)
          return
        }

        if (!session) {
          console.error('❌ No session found')
          setError('Session tidak ditemukan')
          setTimeout(() => router.push('/login'), 3000)
          return
        }

        console.log('✅ Session confirmed for user:', session.user?.email)

        // Check if user profile exists, if not wait a bit for trigger to create it
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          console.warn('⚠️ Profile check error (might be creating):', profileError)
        }

        // If profile doesn't exist, wait a bit more for trigger
        if (!profile) {
          console.log('⏳ Waiting for user profile to be created...')
          let attempts = 0
          const maxAttempts = 10

          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500))
            const { data: retryProfile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (retryProfile) {
              console.log('✅ User profile created')
              break
            }
            attempts++
          }
        }

        // Determine redirect destination
        let redirectUrl = '/dashboard'

        // Check for stored redirects in sessionStorage
        if (typeof window !== 'undefined') {
          const nextAfterAuth = sessionStorage.getItem('nextAfterAuth')
          const redirectAfterAuth = sessionStorage.getItem('redirectAfterAuth')
          const referralCode = sessionStorage.getItem('referralCode')

          if (nextAfterAuth) {
            redirectUrl = nextAfterAuth
            sessionStorage.removeItem('nextAfterAuth')
            console.log('🎯 Redirecting to (nextAfterAuth):', redirectUrl)
          } else if (redirectAfterAuth) {
            redirectUrl = redirectAfterAuth
            sessionStorage.removeItem('redirectAfterAuth')
            console.log('🎯 Redirecting to (redirectAfterAuth):', redirectUrl)
          } else if (referralCode) {
            redirectUrl = `/register-referral/${referralCode}`
            sessionStorage.removeItem('referralCode')
            console.log('🎯 Redirecting to referral:', redirectUrl)
          }
        }

        // Redirect to destination
        console.log('🚀 Redirecting to:', redirectUrl)
        window.location.href = redirectUrl
      } catch (err: any) {
        console.error('❌ Error in callback handler:', err)
        setError(err.message || 'Terjadi kesalahan saat memproses login')
        setTimeout(() => router.push('/login'), 3000)
      } finally {
        setLoading(false)
      }
    }

    handleCallback()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full card text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Gagal</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Mengarahkan ke halaman login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full card text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Memproses Login...</h2>
        <p className="text-gray-600">Mohon tunggu sebentar</p>
      </div>
    </div>
  )
}

