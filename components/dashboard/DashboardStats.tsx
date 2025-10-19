'use client'

import { Users, UserCog, GraduationCap, Calendar } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Stats {
  totalPrograms: number
  totalParticipants: number
  totalTrainers: number
  totalEnrollments: number
}

export function DashboardStats() {
  const [stats, setStats] = useState<Stats>({
    totalPrograms: 0,
    totalParticipants: 0,
    totalTrainers: 0,
    totalEnrollments: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        console.log('🔄 Fetching dashboard stats...')
        
        const [programs, participants, enrollments] = await Promise.all([
          supabase.from('programs').select('id', { count: 'exact', head: true }),
          supabase.from('participants').select('id', { count: 'exact', head: true }),
          supabase.from('enrollments').select('id', { count: 'exact', head: true }),
        ])

        console.log('📊 Stats fetched:', {
          programs: programs.count,
          participants: participants.count,
          enrollments: enrollments.count
        })

        setStats({
          totalPrograms: programs.count || 0,
          totalParticipants: participants.count || 0,
          totalTrainers: 0, // Remove trainers for now
          totalEnrollments: enrollments.count || 0,
        })
      } catch (error) {
        console.error('❌ Error fetching stats:', error)
        // Set default values on error
        setStats({
          totalPrograms: 0,
          totalParticipants: 0,
          totalTrainers: 0,
          totalEnrollments: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statItems = [
    {
      label: 'Total Program',
      value: stats.totalPrograms,
      icon: GraduationCap,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      label: 'Total Peserta',
      value: stats.totalParticipants,
      icon: Users,
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      label: 'Total Trainer',
      value: stats.totalTrainers,
      icon: UserCog,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
    {
      label: 'Total Pendaftaran',
      value: stats.totalEnrollments,
      icon: Calendar,
      color: 'bg-orange-500',
      lightColor: 'bg-orange-50',
      textColor: 'text-orange-700',
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

