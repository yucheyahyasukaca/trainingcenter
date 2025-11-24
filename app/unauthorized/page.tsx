'use client'

import Link from 'next/link'
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-12 h-12 text-red-600" />
          </div>
        </div>

        {/* Content */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Akses Ditolak
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Halaman ini hanya dapat diakses oleh administrator. Jika Anda merasa ini adalah kesalahan, silakan hubungi administrator sistem.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Link 
            href="/dashboard"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <Home className="w-5 h-5 mr-2" />
            Kembali ke Dashboard
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Kembali ke Halaman Sebelumnya
          </button>
        </div>

        {/* Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Butuh akses admin?</strong> Hubungi tim support atau administrator sistem Anda.
          </p>
        </div>
      </div>
    </div>
  )
}

