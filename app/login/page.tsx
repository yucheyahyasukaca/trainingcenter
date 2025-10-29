'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, signInWithGoogle } from '@/lib/auth'
import { Mail, Lock, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  useEffect(() => {
    // Check for referral code in URL
    const referral = searchParams.get('referral')
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
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

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
      
      // Wait a bit for auth state to update
      setTimeout(() => {
        console.log('🔄 Redirecting...')
        // Redirect based on referral code
        if (referralCode) {
          // Redirect to referral registration page
          router.push(`/register-referral/${referralCode}`)
        } else {
          router.push('/dashboard')
        }
        router.refresh()
      }, 1000)
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

  async function handleGoogleLogin() {
    toast.error('Fitur login dengan Google saat ini belum tersedia. Silakan gunakan email dan password untuk login.', {
      duration: 5000,
      icon: '⚠️',
      style: {
        background: '#FFF3CD',
        color: '#856404',
        border: '1px solid #FFE69C',
      },
    })
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

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 py-3"
            >
              {loading ? 'Memproses...' : 'Login'}
            </button>

            <div className="flex items-center gap-4 my-4">
              <span className="flex-1 h-px bg-gray-200" />
              <span className="text-sm text-gray-500">atau</span>
              <span className="flex-1 h-px bg-gray-200" />
            </div>

            <button 
              type="button" 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg py-3 font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
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
          </form>

        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center space-y-3">
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
    </div>
  )
}

