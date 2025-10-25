'use client'

import { useAuth } from '@/components/AuthProvider'
import { TrainerDashboard } from '@/components/dashboard/TrainerDashboard'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function TrainerDashboardPage() {
  const { profile, loading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if loading is complete and user is not authenticated or not a trainer
    if (!loading) {
      if (!user) {
        // User is not authenticated, redirect to login
        router.push('/login')
        return
      }
      
      if (!profile || (profile as any).role !== 'trainer') {
        // User is authenticated but not a trainer, redirect to dashboard
        router.push('/dashboard')
        return
      }
    }
  }, [profile, loading, user, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat dashboard trainer...</p>
        </div>
      </div>
    )
  }

  // Show access denied only if user is authenticated but not a trainer
  if (user && (!profile || (profile as any).role !== 'trainer')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Hmm... 🤔</h1>
          <p className="text-gray-600 mb-6 text-lg">Halaman ini khusus untuk Trainer saja nih!</p>
          <p className="text-gray-500 text-sm mb-8">Tapi jangan khawatir, kamu tetap bisa mengakses dashboard sesuai dengan role kamu! 😊</p>
          <a 
            href="/dashboard" 
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-medium rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Kembali ke Dashboard
          </a>
        </div>
      </div>
    )
  }

  // If no user, show loading (will redirect to login)
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  return <TrainerDashboard />
}
