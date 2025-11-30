'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

/**
 * Client-side OAuth callback handler
 * This handles PKCE flow when server-side handler fails
 * because it has access to localStorage where code verifier is stored
 */
export default function AuthCallbackClientPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Ref untuk melacak apakah efek sudah berjalan
  const effectRan = useRef(false)

  useEffect(() => {
    // Cek apakah efek sudah berjalan. Jika ya, hentikan (return).
    if (effectRan.current === true) return

    async function handleCallback() {
      try {
        // Set flag menjadi true agar tidak jalan lagi
        effectRan.current = true

        const code = searchParams.get('code')
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        console.log('🔄 Processing OAuth callback (client-side)...')

        // Handle OAuth errors
        if (errorParam) {
          console.error('❌ OAuth error:', errorParam, errorDescription)
          setError(errorDescription || errorParam)
          setTimeout(() => router.push('/login'), 3000)
          return
        }

        if (!code) {
          console.error('❌ No OAuth code provided')
          setError('No authorization code provided')
          setTimeout(() => router.push('/login'), 3000)
          return
        }

        console.log('🔄 Exchanging code for session:', code)
        console.log('📦 LocalStorage keys:', Object.keys(localStorage))

        // Exchange code for session using client-side Supabase
        // This has access to localStorage where PKCE code verifier is stored
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          console.error('❌ Error exchanging code for session:', exchangeError)
          setError(exchangeError.message)
          setTimeout(() => router.push('/login'), 3000)
          return
        }

        if (!data.session) {
          console.error('❌ No session returned')
          setError('No session returned')
          setTimeout(() => router.push('/login'), 3000)
          return
        }

        console.log('✅ OAuth callback successful for user:', data.user?.email)

        // Wait a bit for session to be set
        await new Promise(resolve => setTimeout(resolve, 500))

        // Check if user profile exists, if not wait a bit for trigger to create it
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
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
              .eq('id', data.user.id)
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
        // Gunakan replace agar user tidak bisa back ke halaman callback ini
        console.log('🚀 Redirecting to:', redirectUrl)
        window.location.replace(redirectUrl)
      } catch (err: any) {
        console.error('❌ Error in callback handler:', err)
        setError(err.message || 'Terjadi kesalahan saat memproses login')
        setTimeout(() => router.push('/login'), 3000)
      } finally {
        setLoading(false)
      }
    }

    handleCallback()

    // Cleanup function (opsional, untuk safety)
    return () => {
      effectRan.current = true
    }
  }, [router, searchParams])

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

