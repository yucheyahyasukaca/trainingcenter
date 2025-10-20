'use client'

import { Users, UserCog, GraduationCap, Calendar, DollarSign, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'

interface Stats {
  totalPrograms: number
  totalParticipants: number
  totalTrainers: number
  totalEnrollments: number
  totalRevenue: number
  systemHealth: number
}

export function DashboardStats() {
  const [stats, setStats] = useState<Stats>({
    totalPrograms: 0,
    totalParticipants: 0,
    totalTrainers: 0,
    totalEnrollments: 0,
    totalRevenue: 0,
    systemHealth: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        console.log('🔄 Fetching dashboard stats...')
        
        const [programs, participants, trainers, enrollments, revenue] = await Promise.all([
          supabase.from('programs').select('id', { count: 'exact', head: true }),
          supabase.from('participants').select('id', { count: 'exact', head: true }),
          supabase.from('trainers').select('id', { count: 'exact', head: true }),
          supabase.from('enrollments').select('id', { count: 'exact', head: true }),
          supabase.from('enrollments').select('amount_paid').eq('payment_status', 'paid'),
        ])

        // Calculate total revenue
        const totalRevenue = revenue.data?.reduce((sum, enrollment) => sum + (enrollment.amount_paid || 0), 0) || 0

        // Calculate system health based on active programs and recent enrollments
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        
        const [activePrograms, recentEnrollments] = await Promise.all([
          supabase.from('programs').select('id', { count: 'exact', head: true }).eq('status', 'published'),
          supabase.from('enrollments').select('id', { count: 'exact', head: true }).gte('enrollment_date', thirtyDaysAgo.toISOString()),
        ])

        const activeProgramsCount = activePrograms.count || 0
        const recentEnrollmentsCount = recentEnrollments.count || 0
        
        // System health: 100% if active programs > 0 and recent enrollments > 0, otherwise based on activity
        let systemHealth = 0
        if (activeProgramsCount > 0 && recentEnrollmentsCount > 0) {
          systemHealth = 99.9
        } else if (activeProgramsCount > 0) {
          systemHealth = 85.0
        } else if (recentEnrollmentsCount > 0) {
          systemHealth = 70.0
        } else {
          systemHealth = 50.0
        }

        console.log('📊 Stats fetched:', {
          programs: programs.count,
          participants: participants.count,
          trainers: trainers.count,
          enrollments: enrollments.count,
          revenue: totalRevenue,
          systemHealth
        })

        setStats({
          totalPrograms: programs.count || 0,
          totalParticipants: participants.count || 0,
          totalTrainers: trainers.count || 0,
          totalEnrollments: enrollments.count || 0,
          totalRevenue,
          systemHealth,
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
          systemHealth: 0,
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
      label: 'System Health',
      value: `${stats.systemHealth}%`,
      icon: Shield,
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
      textColor: 'text-green-700',
      status: stats.systemHealth >= 90 ? 'Stable' : stats.systemHealth >= 70 ? 'Warning' : 'Critical',
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-20 bg-gray-200 rounded"></div>
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
          <div key={item.label} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{item.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{item.value}</p>
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
              <div className={`${item.lightColor} p-3 rounded-lg`}>
                <Icon className={`w-8 h-8 ${item.textColor}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

