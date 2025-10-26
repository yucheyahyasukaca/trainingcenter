'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useNotification } from '@/components/ui/Notification'
import { AdminNotificationProvider, useAdminNotifications } from '@/components/admin/AdminNotificationSystem'
import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications'
import { DashboardStats } from './DashboardStats'
import { RecentEnrollments } from './RecentEnrollments'
import { ProgramsChart } from './ProgramsChart'
import { EnrollmentStatusChart } from './EnrollmentStatusChart'
import { UsersChart } from './UsersChart'
import { SystemOverview } from './SystemOverview'
import { ManagerManagement } from './ManagerManagement'
import { MobileNotificationToast } from '@/components/ui/MobileNotificationToast'
import { 
  BarChart3,
  LayoutDashboard,
  UserCog,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

function AdminDashboardContent() {
  const { profile } = useAuth()
  const { addNotification } = useAdminNotifications()
  const [activeTab, setActiveTab] = useState('overview')
  
  // Enable real-time notifications
  useRealTimeNotifications()

  // Admin stats will be handled by DashboardStats component

  // Initialize welcome notification
  useEffect(() => {
    const hasInitialized = sessionStorage.getItem('admin-notifications-initialized')
    
    if (!hasInitialized && profile?.full_name) {
      addNotification({
        type: 'system',
        priority: 'medium',
        title: 'Selamat Datang di Admin Dashboard',
        message: `Halo ${profile.full_name}, sistem GARUDA-21 berjalan dengan baik!`,
        actionRequired: false
      })

      // Mark as initialized
      sessionStorage.setItem('admin-notifications-initialized', 'true')
    }
  }, [profile?.full_name, addNotification])


  const tabs = [
    { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'managers', label: 'Manajemen Manager', icon: UserCog },
    { id: 'analytics', label: 'Analisis', icon: BarChart3 }
  ]

  return (
    <div className="space-y-6">
      {/* Mobile Notification Toast */}
      <MobileNotificationToast />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Selamat datang, {profile?.full_name}! Kelola seluruh sistem GARUDA-21
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* System Status */}
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">System Online</span>
        </div>
      </div>


      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Admin Stats - Now using real data from database */}
          <DashboardStats />


          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProgramsChart />
            <EnrollmentStatusChart />
          </div>

          {/* System Overview & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SystemOverview />
            <RecentEnrollments />
          </div>

        </>
      )}

      {activeTab === 'managers' && (
        <ManagerManagement />
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UsersChart />
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analisis Segera Hadir</h3>
              <p className="text-gray-600">Fitur analisis lanjutan akan segera tersedia.</p>
            </div>
          </div>
          
        </div>
      )}

    </div>
  )
}

// Wrapper component with AdminNotificationProvider
export function AdminDashboard() {
  return (
    <AdminNotificationProvider>
      <AdminDashboardContent />
    </AdminNotificationProvider>
  )
}
