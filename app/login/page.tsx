'use client'

import Script from 'next/script'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, signInWithGoogle, signInWithIdToken } from '@/lib/auth'
import { Mail, Lock, AlertCircle, X, KeyRound } from 'lucide-react'
import { toast } from 'react-hot-toast'
import CustomCaptcha from '@/components/ui/CustomCaptcha'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false)

  useEffect(() => {
    // Check for referral code in URL
    const referral = searchParams.get('referral')
    // Webinar next redirect support
    const next = searchParams.get('next')
    if (next) {
      sessionStorage.setItem('nextAfterAuth', next)
    }
    if (referral) {
      setReferralCode(referral)
      // Store in sessionStorage to persist
      sessionStorage.setItem('referralCode', referral)
    } else {
      // Also check sessionStorage
      const storedReferral = sessionStorage.getItem('referralCode')
      if (storedReferral) {
        setReferralCode(storedReferral)
      }
    }
    // If already logged in, go directly to next target
    (async () => {
      try {
        const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession()
        const storedNext = sessionStorage.getItem('nextAfterAuth')
        if (session && storedNext) {
          router.push(storedNext)
          router.refresh()
        }
      } catch { }
    })()
  }, [searchParams])

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!resetEmail) {
      toast.error('Email wajib diisi')
      return
    }

    setResetLoading(true)
    try {
      console.log('🔄 Requesting password reset for:', resetEmail)
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail })
      })

      const data = await response.json()
      console.log('📥 Password reset response:', { status: response.status, data })

      if (response.ok) {
        if (data.success) {
          toast.success(data.message || 'Password baru telah dikirim ke email Anda. Silakan cek inbox dan folder spam.')
          setShowResetPasswordModal(false)
          setResetEmail('')
        } else {
          toast.error(data.error || 'Gagal mereset password')
        }
      } else {
        toast.error(data.error || 'Gagal mereset password')
        console.error('Password reset failed:', data)
      }
    } catch (err: any) {
      console.error('❌ Error resetting password:', err)
      toast.error('Terjadi kesalahan saat mereset password. Silakan coba lagi atau hubungi support.')
    } finally {
      setResetLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!isCaptchaVerified) {
      setError('Mohon selesaikan verifikasi keamanan terlebih dahulu.')
      setLoading(false)
      return
    }

    // Debug logging
    console.log('🔍 Login attempt started')
    console.log('📧 Email:', formData.email)
    console.log('🔑 Password:', formData.password)
    console.log('🌐 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('🔑 Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    try {
      console.log('🚀 Calling signIn function...')
      const result = await signIn(formData.email, formData.password)
      console.log('✅ Login successful!', result)

      // Wait for session to be properly set in localStorage
      const supabase = (await import('@/lib/supabase')).supabase
      let sessionSet = false
      let attempts = 0
      const maxAttempts = 10

      while (attempts < maxAttempts && !sessionSet) {
        const { data } = await supabase.auth.getSession()
        if (data?.session) {
          console.log('✅ Session confirmed in localStorage')
          sessionSet = true
          break
        }
        attempts++
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      if (!sessionSet) {
        console.warn('⚠️ Session not set after login, but proceeding with redirect...')
      }

      // Determine redirect destination
      const next = sessionStorage.getItem('nextAfterAuth')
      let redirectUrl = '/dashboard'

      if (next) {
        sessionStorage.removeItem('nextAfterAuth')
        redirectUrl = next
        console.log('🎯 Redirecting to (nextAfterAuth):', redirectUrl)
      } else {
        const redirectTo = searchParams.get('redirect')
        if (redirectTo) {
          redirectUrl = redirectTo
          console.log('🎯 Redirecting to (redirect param):', redirectUrl)
        } else if (referralCode) {
          redirectUrl = `/register-referral/${referralCode}`
          console.log('🎯 Redirecting to referral:', redirectUrl)
        } else {
          console.log('🎯 Redirecting to dashboard')
        }
      }

      // Use window.location for reliable redirect
      window.location.href = redirectUrl
    } catch (err: any) {
      console.error('❌ Login error:', err)
      setError(err.message || 'Login gagal. Periksa email dan password Anda.')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  // Google Identity Services Handler
  async function handleGoogleCallback(response: any) {
    console.log('📥 Received Google credential response')

    try {
      setLoading(true)
      const { credential } = response

      if (!credential) {
        throw new Error('No credential received from Google')
      }

      console.log('🔐 Authenticating with Supabase using ID Token...')
      const data = await signInWithIdToken(credential)

      if (data?.session) {
        console.log('✅ Google login successful, session created')

        // Handle post-login redirection
        const next = sessionStorage.getItem('nextAfterAuth')
        let redirectUrl = '/dashboard'

        if (next) {
          sessionStorage.removeItem('nextAfterAuth')
          redirectUrl = next
        } else {
          const redirectTo = searchParams.get('redirect')
          if (redirectTo) {
            redirectUrl = redirectTo
          } else if (referralCode) {
            redirectUrl = `/register-referral/${referralCode}`
          }
        }

        window.location.href = redirectUrl
      }
    } catch (err: any) {
      console.error('❌ Google login error:', err)
      setError(err.message || 'Gagal login dengan Google')
      toast.error('Gagal login dengan Google')
      setLoading(false)
    }
  }

  // Initialize Google Button
  useEffect(() => {
    const initializeGoogle = () => {
      if ((window as any).google) {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
        if (!clientId) {
          console.error('❌ NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing')
          return
        }

        console.log('🔧 Initializing Google Identity Services...')
          ; (window as any).google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCallback,
            auto_select: false,
            cancel_on_tap_outside: true,
          })

        const buttonDiv = document.getElementById('googleButton')
        if (buttonDiv) {
          ; (window as any).google.accounts.id.renderButton(buttonDiv, {
            theme: 'outline',
            size: 'large',
            width: '100%', // Responsive width
            text: 'sign_in_with',
            shape: 'rectangular',
            logo_alignment: 'left'
          })
          console.log('✅ Google button rendered')
        }
      }
    }

    // Check if script is already loaded
    if ((window as any).google) {
      initializeGoogle()
    } else {
      // Wait for script to load
      const interval = setInterval(() => {
        if ((window as any).google) {
          initializeGoogle()
          clearInterval(interval)
        }
      }, 100)
      return () => clearInterval(interval)
    }
  }, [])

  // Legacy handler (kept but unused if button is replaced)
  async function handleGoogleLogin() {
    // ... existing implementation ...
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 sm:w-36 sm:h-36 mb-6">
            <Image
              src="/logo-06.png"
              alt="Garuda Academy Logo"
              width={144}
              height={144}
              className="object-contain w-full h-full"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Login</h1>
          <p className="text-gray-600">Silakan login untuk melanjutkan</p>

          {/* Referral Code Info */}
          {referralCode && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-600">🎁</span>
                <span className="font-semibold text-green-800">Kode referral aktif!</span>
              </div>
              <p className="text-sm text-green-700">
                Kode: <span className="font-mono font-bold">{referralCode}</span>
              </p>
              <p className="text-xs text-green-600 mt-1">
                Setelah login, Anda akan diarahkan ke pendaftaran program dengan diskon khusus.
              </p>
            </div>
          )}
        </div>

        {/* Login Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Login Gagal</p>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input pl-10"
                  placeholder="admin@garuda21.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="input pl-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <CustomCaptcha onVerify={setIsCaptchaVerified} />

            <button
              type="submit"
              disabled={loading || !isCaptchaVerified}
              className="w-full btn-primary disabled:opacity-50 py-3"
            >
              {loading ? 'Memproses...' : 'Login'}
            </button>

            <div className="flex items-center gap-4 my-4">
              <span className="flex-1 h-px bg-gray-200" />
              <span className="text-sm text-gray-500">atau</span>
              <span className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Google Login Button Container */}
            <div className="w-full">
              <div id="googleButton" className="w-full flex justify-center">
                {/* Fallback button if Google Sign-In fails to load */}
                <button
                  type="button"
                  onClick={() => toast.error('Google Login belum siap atau belum dikonfigurasi. Harap refresh halaman.')}
                  className="w-full border border-gray-300 rounded-lg py-3 font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Masuk dengan Google
                </button>
              </div>
              {/* Fallback/Loading state if JS hasn't loaded */}
              <noscript>
                <div className="text-center text-sm text-red-500 p-2">
                  Browser Anda tidak mendukung JavaScript, Google Login tidak dapat digunakan.
                </div>
              </noscript>
            </div>
          </form>

        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-gray-600">
            <button
              type="button"
              onClick={() => setShowResetPasswordModal(true)}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Lupa Password?
            </button>
          </p>
          <p className="text-sm text-gray-600">
            Belum punya akun?{' '}
            <a href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Daftar di sini
            </a>
          </p>

          <div className="pt-3 border-t border-gray-200">
            <a
              href="/"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Kembali ke Beranda
            </a>
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <KeyRound className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Reset Password
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowResetPasswordModal(false)
                  setResetEmail('')
                }}
                className="rounded-md p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={resetLoading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Masukkan email Anda"
                    autoComplete="email"
                    disabled={resetLoading}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Password baru akan dikirim ke email Anda.
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-2 space-y-reverse sm:space-y-0 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetPasswordModal(false)
                    setResetEmail('')
                  }}
                  disabled={resetLoading}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {resetLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    'Kirim Password Baru'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => console.log('✅ Google Identity Services script loaded')}
      />
    </div>
  )
}

