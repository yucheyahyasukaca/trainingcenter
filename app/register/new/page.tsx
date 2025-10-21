'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { signUp } from '@/lib/auth'

export default function NewRegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Call the actual signUp function
      await signUp(email, password, name)
      
      setSuccess(true)
      
      // Redirect to login page after successful registration
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Gagal membuat akun. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-red-50">
      {/* Simple public header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto p-4">
          <a href="/" className="inline-flex items-center space-x-3 text-gray-700 hover:text-gray-900">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 text-white font-semibold">g</span>
            <span className="text-sm sm:text-base font-medium">Homepage GARUDA-21 Training Center</span>
          </a>
        </div>
      </div>

      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6">
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start mx-auto">
          {/* Illustration */}
          <div className="rounded-3xl overflow-hidden shadow-xl ring-1 ring-black/5 relative aspect-[16/11] md:aspect-auto md:h-[520px]">
            <Image
              src="/registration-banner.png"
              alt="GARUDA-21 Registration Banner"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>

          {/* Form */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Buat Akun Garuda Academy</h1>
            <p className="text-gray-600 mt-2">Silakan isi formulir di bawah ini untuk membuat akun Garuda Academy.</p>
            <div className="h-px bg-gray-200 my-6" />

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nama lengkap <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Silakan masukkan nama lengkap Anda"
                  required
                  className="mt-2 w-full input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@garuda-21.com"
                  required
                  className="mt-2 w-full input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  minLength={8}
                  required
                  className="mt-2 w-full input"
                />
                <p className="text-gray-500 text-sm mt-2">Gunakan setidaknya 8 karakter, termasuk kombinasi huruf dan angka.</p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">❌ {error}</p>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">✅ Akun berhasil dibuat! Mengalihkan ke halaman login...</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading || success}
                className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Membuat akun...' : success ? 'Berhasil!' : 'Buat akun baru'}
              </button>
            </form>

            <p className="text-sm text-gray-600 mt-6">
              Sudah punya akun Garuda Academy?{' '}
              <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">Masuk dengan akun Garuda Academy</Link>
            </p>

            <div className="h-px bg-gray-200 my-6" />
            <p className="text-gray-500 text-sm">
              Dengan mendaftar, Anda setuju dengan Syarat & Ketentuan Garuda Academy. Situs ini dilindungi oleh reCAPTCHA dan Kebijakan Privasi serta Syarat Layanan Google berlaku.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


