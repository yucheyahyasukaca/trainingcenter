'use client'

import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { signIn, signInWithIdToken } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { Mail, X, KeyRound } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  useEffect(() => {
    const referral = searchParams.get('referral')
    // Webinar next redirect support
    const next = searchParams.get('next')
    if (next) {
      sessionStorage.setItem('nextAfterAuth', next)
    }
    if (referral) {
      setReferralCode(referral)
      // Validate referral code and get program info
      validateReferralCode(referral)
    }
    // If already logged in, go directly to next target
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const storedNext = sessionStorage.getItem('nextAfterAuth')
        if (session && storedNext) {
          router.push(storedNext)
          router.refresh()
        }
      } catch { }
    })()
  }, [searchParams])

  const validateReferralCode = async (referralCode: string) => {
    try {
      console.log('Validating referral code:', referralCode)

      // Get referral code details with program info
      const { data, error } = await supabase
        .from('referral_codes')
        .select(`
          *,
          user_profiles!referral_codes_trainer_id_fkey (
            full_name,
            email
          ),
          programs (
            id,
            title,
            description,
            price,
            category
          )
        `)
        .eq('code', referralCode)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error fetching referral code:', error)
        return
      }

      if (!data) {
        console.log('Referral code not found')
        return
      }

      // Check if referral code is expired
      if ((data as any).valid_until && new Date((data as any).valid_until) < new Date()) {
        console.log('Referral code expired')
        return
      }

      // Check if referral code has reached max uses
      if ((data as any).max_uses && (data as any).current_uses >= (data as any).max_uses) {
        console.log('Referral code max uses reached')
        return
      }

      // Store referral data in sessionStorage
      const referralData = {
        id: (data as any).id,
        code: (data as any).code,
        description: (data as any).description,
        trainer_id: (data as any).trainer_id,
        program_id: (data as any).program_id,
        discount_percentage: (data as any).discount_percentage,
        discount_amount: (data as any).discount_amount,
        trainer: {
          full_name: (data as any).user_profiles?.full_name || 'Unknown Trainer',
          email: (data as any).user_profiles?.email || 'unknown@example.com'
        },
        program: {
          id: (data as any).programs?.id,
          title: (data as any).programs?.title || 'Unknown Program',
          description: (data as any).programs?.description || '',
          price: (data as any).programs?.price || 0,
          category: (data as any).programs?.category || ''
        }
      }

      sessionStorage.setItem('referralCode', referralCode)
      sessionStorage.setItem('referralData', JSON.stringify(referralData))
      console.log('Referral data stored:', referralData)

    } catch (error) {
      console.error('Error validating referral code:', error)
    }
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

        // Store referral code in sessionStorage if exists
        if (referralCode) {
          sessionStorage.setItem('referralCode', referralCode)
        }

        // Store next redirect if exists
        const next = searchParams.get('next')
        if (next) {
          sessionStorage.setItem('nextAfterAuth', next)
        }

        // Store redirect param if exists
        const redirectToParam = searchParams.get('redirect')
        if (redirectToParam) {
          sessionStorage.setItem('redirectAfterAuth', redirectToParam)
        }

        // Determine redirect destination
        const storedNext = sessionStorage.getItem('nextAfterAuth')
        let redirectUrl = '/dashboard'

        if (storedNext) {
          sessionStorage.removeItem('nextAfterAuth')
          redirectUrl = storedNext
        } else if (redirectToParam) {
          redirectUrl = redirectToParam
        } else if (referralCode) {
          redirectUrl = `/register-referral/${referralCode}`
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
    // Only initialize if the login modal is open
    if (!isLoginOpen) return

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
  }, [isLoginOpen])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signIn(email, password)
      setIsLoginOpen(false)

      // Redirect based on referral code
      setTimeout(() => {
        const next = sessionStorage.getItem('nextAfterAuth')
        if (next) {
          sessionStorage.removeItem('nextAfterAuth')
          router.push(next)
          router.refresh()
          return
        }
        if (referralCode) {
          router.push(`/register-referral/${referralCode}`)
        } else {
          router.push('/dashboard')
        }
        router.refresh()
      }, 300)
    } catch (err: any) {
      toast.error('Email wajib diisi')
      return
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-red-50">
      {/* Simple public header for unauthenticated pages */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto p-4">
          <a href="/" className="inline-flex items-center space-x-3 text-gray-700 hover:text-gray-900 mx-auto">
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">G</span>
            </div>
            <span className="text-sm font-medium">Homepage GARUDA-21 Training Center</span>
          </a>
        </div>
      </div>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center mx-auto">
          {/* Visual / Illustration */}
          <div className="rounded-3xl overflow-hidden shadow-xl ring-1 ring-black/5 relative aspect-[4/3] lg:aspect-auto lg:h-[600px]">
            <Image
              src="/registration-banner.png"
              alt="GARUDA-21 Registration Banner"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>

          {/* Content */}
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Selamat Datang di Pendaftaran GARUDA-21 Training Center
              <span className="ml-2">👋</span>
            </h1>
            <p className="text-gray-600 mt-5 text-base md:text-lg">
              Proses pendaftaran GARUDA-21 Training Center terdiri dari 2 langkah utama dan semuanya dilakukan melalui platform Garuda Academy.
            </p>
            <p className="text-gray-600 mt-2 text-base">
              Untuk melanjutkan, silakan masuk menggunakan akun Garuda Academy.
            </p>

            {/* Referral Code Info */}
            {referralCode && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-600">🎁</span>
                  <span className="font-semibold text-green-800">Anda memiliki kode referral!</span>
                </div>
                <p className="text-sm text-green-700">
                  Kode referral: <span className="font-mono font-bold">{referralCode}</span>
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Setelah login, Anda akan diarahkan ke pendaftaran program dengan diskon khusus.
                </p>
                <div className="mt-2 p-2 bg-white rounded border">
                  <p className="text-xs text-gray-600">
                    <strong>Catatan:</strong> Silakan login atau buat akun baru untuk melanjutkan pendaftaran dengan kode referral ini.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3">
              <button onClick={() => setIsLoginOpen(true)} className="btn-primary py-3 text-center shadow-lg hover:shadow-xl transition-shadow">
                Masuk dengan akun Garuda Academy
              </button>
              <p className="text-sm text-gray-600">
                Belum punya akun Garuda Academy?{' '}
                <a href="/register/new" className="text-primary-600 hover:text-primary-700 font-medium">
                  Buat akun.
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsLoginOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Masuk</h3>
              <button onClick={() => setIsLoginOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="p-5">
              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="email"
                  placeholder="email@garuda-21.com"
                  className="input w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <div className="relative">
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="input w-full pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">👁️</div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="inline-flex items-center gap-2 text-gray-600">
                    <input type="checkbox" className="rounded border-gray-300" />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowResetPasswordModal(true)}
                    className="text-primary-600 hover:text-primary-700 font-medium cursor-pointer relative z-10"
                  >
                    Lupa Password?
                  </button>
                </div>

                {error && (
                  <div className="text-sm text-red-600">{error}</div>
                )}

                <button type="submit" disabled={loading} className="w-full btn-primary py-3">
                  {loading ? 'Memproses...' : 'Masuk'}
                </button>

                <div className="flex items-center gap-4 my-2">
                  Dengan melakukan login, Anda setuju dengan syarat & ketentuan Garuda Academy. This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-gray-300"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">Atau</span>
                  <div className="flex-grow border-t border-gray-300"></div>
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
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative z-10">
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
