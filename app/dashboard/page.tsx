'use client'

import { useAuth } from '@/components/AuthProvider'
import { AdminDashboard } from '@/components/dashboard/AdminDashboard'
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard'
import { UserDashboard } from '@/components/dashboard/UserDashboard'
import { TrainerDashboard } from '@/components/dashboard/TrainerDashboard'

export default function DashboardPage() {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Selamat Datang! 👋</h1>
          <p className="text-gray-600 mb-6 text-lg">Untuk mengakses dashboard, silakan login terlebih dahulu ya!</p>
          <p className="text-gray-500 text-sm mb-8">Jangan khawatir, prosesnya cepat dan mudah kok! 😊</p>
          <a 
            href="/login" 
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-medium rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Login Sekarang
          </a>
        </div>
      </div>
    )
  }

  // Render dashboard based on user role
  switch ((profile as any).role) {
    case 'admin':
      return <AdminDashboard />
    case 'manager':
      return <ManagerDashboard />
    case 'trainer':
      return <TrainerDashboard />
    case 'user':
    default:
      return <UserDashboard />
  }
}

