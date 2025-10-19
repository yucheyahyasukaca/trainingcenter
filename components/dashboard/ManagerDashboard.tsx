'use client'

import { useAuth } from '@/components/AuthProvider'
import { DashboardStats } from './DashboardStats'
import { RecentEnrollments } from './RecentEnrollments'
import { ProgramsChart } from './ProgramsChart'
import { EnrollmentStatusChart } from './EnrollmentStatusChart'
import { PaymentOverview } from './PaymentOverview'
import { TrainerManagement } from './TrainerManagement'
import { 
  DollarSign, 
  GraduationCap, 
  Users, 
  UserCheck,
  CreditCard,
  UserPlus,
  UserMinus,
  BarChart3
} from 'lucide-react'

export function ManagerDashboard() {
  const { profile } = useAuth()

  const managerStats = [
    {
      title: 'Total Revenue',
      value: 'Rp 1.8B',
      change: '+15%',
      changeType: 'positive' as const,
      icon: DollarSign,
      color: 'green'
    },
    {
      title: 'Active Programs',
      value: '12',
      change: '+2',
      changeType: 'positive' as const,
      icon: GraduationCap,
      color: 'blue'
    },
    {
      title: 'Pending Payments',
      value: '8',
      change: '-3',
      changeType: 'positive' as const,
      icon: CreditCard,
      color: 'orange'
    },
    {
      title: 'Active Trainers',
      value: '25',
      change: '+2',
      changeType: 'positive' as const,
      icon: UserCheck,
      color: 'purple'
    }
  ]

  const quickActions = [
    { title: 'Manage Payments', icon: CreditCard, href: '/payments', color: 'green' },
    { title: 'Program Management', icon: GraduationCap, href: '/programs', color: 'blue' },
    { title: 'Enrollment Management', icon: Users, href: '/enrollments', color: 'purple' },
    { title: 'Trainer Management', icon: UserPlus, href: '/trainers', color: 'orange' },
    { title: 'User Management', icon: UserMinus, href: '/users', color: 'red' },
    { title: 'Reports', icon: BarChart3, href: '/reports', color: 'gray' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Selamat datang, {profile?.full_name}! Kelola operasional GARUDA-21
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Management Mode</span>
        </div>
      </div>

      {/* Manager Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {managerStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className={`text-sm mt-1 ${
                    stat.changeType === 'positive' ? 'text-green-600' : 
                    stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {stat.change}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  stat.color === 'blue' ? 'bg-blue-100' :
                  stat.color === 'green' ? 'bg-green-100' :
                  stat.color === 'orange' ? 'bg-orange-100' :
                  stat.color === 'purple' ? 'bg-purple-100' : 'bg-gray-100'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'green' ? 'text-green-600' :
                    stat.color === 'orange' ? 'text-orange-600' :
                    stat.color === 'purple' ? 'text-purple-600' : 'text-gray-600'
                  }`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Management Tools</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <a
                key={index}
                href={action.href}
                className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                  action.color === 'blue' ? 'bg-blue-100 group-hover:bg-blue-200' :
                  action.color === 'green' ? 'bg-green-100 group-hover:bg-green-200' :
                  action.color === 'orange' ? 'bg-orange-100 group-hover:bg-orange-200' :
                  action.color === 'purple' ? 'bg-purple-100 group-hover:bg-purple-200' :
                  action.color === 'red' ? 'bg-red-100 group-hover:bg-red-200' :
                  'bg-gray-100 group-hover:bg-gray-200'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    action.color === 'blue' ? 'text-blue-600' :
                    action.color === 'green' ? 'text-green-600' :
                    action.color === 'orange' ? 'text-orange-600' :
                    action.color === 'purple' ? 'text-purple-600' :
                    action.color === 'red' ? 'text-red-600' : 'text-gray-600'
                  }`} />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-primary-700 text-center">
                  {action.title}
                </span>
              </a>
            )
          })}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgramsChart />
        <PaymentOverview />
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrainerManagement />
        <RecentEnrollments />
      </div>
    </div>
  )
}
