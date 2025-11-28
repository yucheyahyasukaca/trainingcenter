'use client'

import { Users, UserCog, GraduationCap, Calendar, DollarSign, Shield, Video } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'

interface Stats {
  totalPrograms: number
  totalParticipants: number
  totalTrainers: number
  totalEnrollments: number
  totalRevenue: number
  totalWebinars: number
}

export function DashboardStats() {
  const [stats, setStats] = useState<Stats>({
    totalPrograms: 0,
    totalParticipants: 0,
    totalTrainers: 0,
    totalEnrollments: 0,
    totalRevenue: 0,
    totalWebinars: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        console.log('🔄 Fetching dashboard stats...')
        
        const [programs, participants, trainers, enrollments, revenue, webinars] = await Promise.all([
          supabase.from('programs').select('id', { count: 'exact', head: true }),
          supabase.from('participants').select('id', { count: 'exact', head: true }),
          supabase.from('trainers').select('id', { count: 'exact', head: true }),
          supabase.from('enrollments').select('id', { count: 'exact', head: true }),
          supabase.from('enrollments').select('amount_paid').eq('payment_status', 'paid'),
          supabase.from('webinars').select('id', { count: 'exact', head: true }).eq('is_published', true),
        ])

        // Calculate total revenue
        const totalRevenue = (revenue.data as any)?.reduce((sum: number, enrollment: any) => sum + (enrollment.amount_paid || 0), 0) || 0

        console.log('📊 Stats fetched:', {
          programs: programs.count,
          participants: participants.count,
          trainers: trainers.count,
          enrollments: enrollments.count,
          revenue: totalRevenue,
          webinars: webinars.count
        })

        setStats({
          totalPrograms: programs.count || 0,
          totalParticipants: participants.count || 0,
          totalTrainers: trainers.count || 0,
          totalEnrollments: enrollments.count || 0,
          totalRevenue,
          totalWebinars: webinars.count || 0,
        })
      } catch (error) {
        console.error('❌ Error fetching stats:', error)
        // Set default values on error
        setStats({
          totalPrograms: 0,
          totalParticipants: 0,
          totalTrainers: 0,
          totalEnrollments: 0,
          totalRevenue: 0,
          totalWebinars: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statItems = [
    {
      label: 'Total Users',
      value: stats.totalParticipants,
      icon: Users,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      trend: '+12%',
    },
    {
      label: 'Active Programs',
      value: stats.totalPrograms,
      icon: GraduationCap,
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
      textColor: 'text-green-700',
      trend: '+3',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      trend: '+18%',
    },
    {
      label: 'Webinars',
      value: stats.totalWebinars,
      icon: Video,
      color: 'bg-teal-500',
      lightColor: 'bg-teal-50',
      textColor: 'text-teal-700',
      trend: stats.totalWebinars > 0 ? `${stats.totalWebinars} Published` : 'No webinars',
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 ml-3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((item) => {
        const Icon = item.icon
        return (
          <div key={item.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow overflow-hidden">
            <div className="flex items-start justify-between h-full">
              <div className="flex-1 min-w-0 pr-3">
                <p className="text-sm font-medium text-gray-600 truncate">{item.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2 truncate">{item.value}</p>
                {item.trend && (
                  <p className="text-sm text-green-600 font-medium mt-1">{item.trend}</p>
                )}
                {item.status && (
                  <p className={`text-sm font-medium mt-1 ${
                    item.status === 'Stable' ? 'text-green-600' : 
                    item.status === 'Warning' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {item.status}
                  </p>
                )}
              </div>
              <div className={`${item.lightColor} p-3 rounded-lg flex-shrink-0 w-12 h-12 flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${item.textColor}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

