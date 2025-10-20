'use client'

import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { DashboardStats } from './DashboardStats'
import { RecentEnrollments } from './RecentEnrollments'
import { ProgramsChart } from './ProgramsChart'
import { EnrollmentStatusChart } from './EnrollmentStatusChart'
import { UsersChart } from './UsersChart'
import { SystemOverview } from './SystemOverview'
import { ManagerManagement } from './ManagerManagement'
import { 
  BarChart3,
  LayoutDashboard,
  UserCog
} from 'lucide-react'

export function AdminDashboard() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')

  // Admin stats will be handled by DashboardStats component


  const tabs = [
    { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'managers', label: 'Manajemen Manager', icon: UserCog },
    { id: 'analytics', label: 'Analisis', icon: BarChart3 }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Selamat datang, {profile?.full_name}! Kelola seluruh sistem GARUDA-21
          </p>
        </div>
        <div className="flex items-center space-x-2">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UsersChart />
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analisis Segera Hadir</h3>
            <p className="text-gray-600">Fitur analisis lanjutan akan segera tersedia.</p>
          </div>
        </div>
      )}

    </div>
  )
}
