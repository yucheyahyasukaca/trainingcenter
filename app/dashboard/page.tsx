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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please login to access the dashboard.</p>
        </div>
      </div>
    )
  }

  // Render dashboard based on user role
  switch (profile.role) {
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

