'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth'
import { Mail, Lock, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

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
        console.log('🔄 Redirecting to dashboard...')
        router.push('/dashboard')
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

