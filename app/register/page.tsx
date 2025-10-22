'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { signIn } from '@/lib/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signIn(email, password)
      // optionally redirect, but keep modal behavior for now
      setIsLoginOpen(false)
      // Redirect to dashboard after a short delay for session propagation
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 300)
    } catch (err: any) {
      setError(err.message || 'Login gagal')
    } finally {
      setLoading(false)
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
                  <a href="#" className="text-primary-600 hover:text-primary-700">Lupa Password?</a>
                </div>

                {error && (
                  <div className="text-sm text-red-600">{error}</div>
                )}

                <button type="submit" disabled={loading} className="w-full btn-primary py-3">
                  {loading ? 'Memproses...' : 'Masuk'}
                </button>

                <div className="flex items-center gap-4 my-2">
                  <span className="flex-1 h-px bg-gray-200" />
                  <span className="text-sm text-gray-500">atau</span>
                  <span className="flex-1 h-px bg-gray-200" />
                </div>

                <button type="button" className="w-full border border-gray-300 rounded-lg py-3 font-medium hover:bg-gray-50">
                  Masuk dengan Google
                </button>

                <p className="text-center text-sm text-gray-600 mt-2">
                  Belum punya akun? Ayo <Link href="/register/new" className="text-primary-600 hover:text-primary-700 font-medium">daftar</Link>
                </p>

                <div className="pt-4 text-xs text-gray-500">
                  Dengan melakukan login, Anda setuju dengan syarat & ketentuan Garuda Academy. This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
