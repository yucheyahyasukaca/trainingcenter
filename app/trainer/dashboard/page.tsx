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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Akses Ditolak</h1>
          <p className="text-gray-600 mb-6">Anda tidak memiliki akses ke halaman ini.</p>
          <a href="/dashboard" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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
