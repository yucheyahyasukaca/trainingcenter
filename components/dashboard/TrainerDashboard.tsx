'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import {
  BookOpen,
  Users,
  Calendar,
  Clock,
  Star,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  Eye,
  FileText,
  TrendingUp,
  Award,
  UserCheck,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatTime } from '@/lib/utils'
import { TrainerHebatDashboard } from './TrainerHebatDashboard'
import { HebatLeaderboard } from './HebatLeaderboard'

export function TrainerDashboard() {
  const { profile } = useAuth()
  const [trainerStats, setTrainerStats] = useState({
    totalClasses: 0,
    activeClasses: 0,
    completedClasses: 0,
    totalParticipants: 0,
    averageRating: 0
  })
  const [assignedClasses, setAssignedClasses] = useState<any[]>([])
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([])
  const [recentClasses, setRecentClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [trainerLevel, setTrainerLevel] = useState('user')

  const getTrainerLevelInfo = (level: string) => {
    switch (level) {
      case 'master':
        return {
          title: 'Master Trainer',
          description: 'Dapat memberikan pelatihan di semua level',
          color: 'purple',
          icon: Star,
          badge: 'Master',
          hierarchy: 4
        }
      case 'expert':
        return {
          title: 'Expert Trainer',
          description: 'Dapat memberikan pelatihan Junior, Senior & Expert',
          color: 'blue',
          icon: Award,
          badge: 'Expert',
          hierarchy: 3
        }
      case 'senior':
        return {
          title: 'Senior Trainer',
          description: 'Dapat memberikan pelatihan Junior & Senior',
          color: 'green',
          icon: UserCheck,
          badge: 'Senior',
          hierarchy: 2
        }
      case 'junior':
        return {
          title: 'Junior Trainer',
          description: 'Dapat memberikan pelatihan Junior',
          color: 'yellow',
          icon: UserCheck,
          badge: 'Junior',
          hierarchy: 1
        }
      default:
        return {
          title: 'Regular User',
          description: 'Dapat mengikuti program pelatihan',
          color: 'gray',
          icon: BookOpen,
          badge: 'User',
          hierarchy: 0
        }
    }
  }

  const levelInfo = getTrainerLevelInfo(trainerLevel)
  const Icon = levelInfo.icon

  // Fetch trainer data
  useEffect(() => {
    const fetchTrainerData = async () => {
      if (!profile?.id) return

      try {
        setLoading(true)
        console.log('🔍 Fetching trainer data for user:', profile.id)

        // Get user profile with trainer level
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('trainer_level')
          .eq('id', profile.id)
          .single()

        if ((userProfile as any)?.trainer_level) {
          setTrainerLevel((userProfile as any).trainer_level)
        }

        // Use profile.id directly since class_trainers.trainer_id references user_profiles.id
        const trainerId = profile.id

        // Try direct query from class_trainers with join
        const { data: classesData, error: classesError } = await supabase
          .from('class_trainers')
          .select(`
            class_id,
            classes!inner(
              *,
              programs(
                id,
                title,
                description,
                category,
                min_trainer_level
              )
            )
          `)
          .eq('trainer_id', trainerId)

        if (classesError) {
          console.error('❌ Error fetching classes:', classesError)

          // Fallback: try to get classes directly
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('classes')
            .select(`
              *,
              programs(
                id,
                title,
                description,
                category,
                min_trainer_level
              )
            `)
            .eq('trainer_id', trainerId)

          if (fallbackError) {
            console.error('❌ Fallback query also failed:', fallbackError)
          } else {
            // Use fallback data
            const fallbackClasses = fallbackData?.map((item: any) => ({
              ...item,
              trainers: []
            })) || []
            const allClasses = fallbackClasses
            setAssignedClasses(allClasses)

            // Calculate stats with fallback data
            const now = new Date()

            const activeClasses = allClasses.filter((c: any) => {
              const startDate = new Date(c.start_date)
              const endDate = new Date(c.end_date)
              const isActive = startDate <= now && endDate >= now
              return isActive
            })

            const completedClasses = allClasses.filter((c: any) => {
              const endDate = new Date(c.end_date)
              return endDate < now || c.status === 'completed'
            })

            const upcomingClasses = allClasses.filter((c: any) => {
              const startDate = new Date(c.start_date)
              return startDate > now
            })

            const totalParticipants = allClasses.reduce((sum: any, c: any) => sum + (c.current_participants || 0), 0)

            setTrainerStats({
              totalClasses: allClasses.length,
              activeClasses: activeClasses.length,
              completedClasses: completedClasses.length,
              totalParticipants,
              averageRating: 4.8
            })

            setUpcomingClasses(activeClasses.slice(0, 2)) // Kelas aktif: dalam rentang tanggal pelaksanaan (max 2)
            setRecentClasses(allClasses.slice(0, 2)) // Kelas terbaru: semua kelas yang dibuat trainer (max 2)
            return
          }
        }

        // Transform data to match expected format
        const transformedClasses = classesData?.map((item: any) => ({
          ...item.classes,
          trainers: [] // We'll add this later if needed
        })) || []

        const allClasses = transformedClasses

        // Remove duplicates
        const uniqueClasses = allClasses.filter((classItem, index, self) =>
          index === self.findIndex(c => c.id === classItem.id)
        )

        setAssignedClasses(uniqueClasses)

        // Calculate stats
        const now = new Date()

        const activeClasses = uniqueClasses.filter(c => {
          const startDate = new Date(c.start_date)
          const endDate = new Date(c.end_date)
          const isActive = startDate <= now && endDate >= now
          return isActive
        })

        const completedClasses = uniqueClasses.filter(c => {
          const endDate = new Date(c.end_date)
          return endDate < now || c.status === 'completed'
        })

        const upcomingClasses = uniqueClasses.filter(c => {
          const startDate = new Date(c.start_date)
          return startDate > now
        })

        const totalParticipants = uniqueClasses.reduce((sum, c) => sum + (c.current_participants || 0), 0)

        setTrainerStats({
          totalClasses: uniqueClasses.length,
          activeClasses: activeClasses.length,
          completedClasses: completedClasses.length,
          totalParticipants,
          averageRating: 4.8
        })

        setUpcomingClasses(activeClasses.slice(0, 2)) // Kelas aktif: dalam rentang tanggal pelaksanaan (max 2)
        setRecentClasses(uniqueClasses.slice(0, 2)) // Kelas terbaru: semua kelas yang dibuat trainer (max 2)

      } catch (error) {
        console.error('Error fetching trainer data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrainerData()
  }, [profile?.id])

  const statsData = [
    {
      title: 'Total Kelas',
      value: trainerStats.totalClasses.toString(),
      icon: BookOpen,
      color: 'blue',
      description: 'Kelas yang ditugaskan',
      href: '/trainer/classes'
    },
    {
      title: 'Kelas Aktif',
      value: trainerStats.activeClasses.toString(),
      icon: Clock,
      color: 'green',
      description: 'Sedang berlangsung',
      href: '/trainer/classes'
    },
    {
      title: 'Kelas Selesai',
      value: trainerStats.completedClasses.toString(),
      icon: CheckCircle,
      color: 'purple',
      description: 'Sudah selesai',
      href: '/trainer/classes'
    },
    {
      title: 'Total Peserta',
      value: trainerStats.totalParticipants.toString(),
      icon: Users,
      color: 'orange',
      description: 'Peserta yang dilatih',
      href: '/trainer/classes'
    }
  ]

  function getStatusBadge(status: string) {
    const badges: Record<string, string> = {
      scheduled: 'px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full',
      ongoing: 'px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full',
      completed: 'px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full',
      cancelled: 'px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full',
    }
    return badges[status] || 'px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full'
  }

  function getStatusText(status: string) {
    const statusMap: Record<string, string> = {
      scheduled: 'Dijadwalkan',
      ongoing: 'Berlangsung',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
    }
    return statusMap[status] || status
  }

  return (
    <div className="space-y-8">
      {/* Header with modern gradient */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Dashboard Trainer</h1>
              <p className="text-blue-100 text-base sm:text-lg">
                Selamat datang kembali, <span className="font-semibold">{profile?.full_name}</span>! 👋
              </p>
              <p className="text-blue-200 text-sm mt-1">
                Kelola kelas dan materi pelatihan Anda
              </p>
            </div>
            <div className="flex items-center justify-center sm:justify-end">
              <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-lg">
                <div className={`w-4 h-4 rounded-full ${levelInfo.color === 'purple' ? 'bg-purple-400' :
                    levelInfo.color === 'blue' ? 'bg-blue-400' :
                      levelInfo.color === 'green' ? 'bg-green-400' : 'bg-gray-400'
                  }`}></div>
                <span className="text-white font-medium text-sm sm:text-base">
                  {levelInfo.badge}
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full"></div>
      </div>

      {/* HEBAT Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3">
          <TrainerHebatDashboard />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Trainer Stats - Modern Cards */}
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-12">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
                    <div className="animate-pulse">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gray-300 rounded-2xl"></div>
                        <div className="text-right">
                          <div className="h-8 bg-gray-300 rounded w-12 mb-2"></div>
                          <div className="h-4 bg-gray-300 rounded w-20"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          <div className="h-3 bg-gray-300 rounded w-8"></div>
                        </div>
                        <div className="h-3 bg-gray-300 rounded w-12"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                statsData.map((stat, index) => {
                  const Icon = stat.icon
                  return (
                    <Link key={index} href={stat.href} className="block">
                      <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50"></div>
                        <div className="relative z-10 p-4 sm:p-6">
                          <div className="flex items-center justify-between mb-3">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${stat.color === 'blue' ? 'bg-blue-500' :
                                stat.color === 'green' ? 'bg-green-500' :
                                  stat.color === 'orange' ? 'bg-orange-500' :
                                    stat.color === 'purple' ? 'bg-purple-500' : 'bg-gray-500'
                              }`}>
                              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <div className="text-right">
                              <p className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">{stat.value}</p>
                              <p className="text-xs text-gray-600">{stat.title}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              <div className={`w-2 h-2 rounded-full ${stat.color === 'blue' ? 'bg-blue-500' :
                                  stat.color === 'green' ? 'bg-green-500' :
                                    stat.color === 'orange' ? 'bg-orange-500' :
                                      stat.color === 'purple' ? 'bg-purple-500' : 'bg-gray-500'
                                }`}></div>
                              <span className="text-xs text-gray-500">Aktif</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300" />
                          </div>
                        </div>
                        {/* Hover effect overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </div>

          {/* Active Classes */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
              <h2 className="text-2xl font-bold text-gray-900">Kelas Aktif</h2>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : upcomingClasses.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Tidak ada kelas yang sedang berlangsung</p>
                <Link href="/trainer/classes/new" className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  <Plus className="w-5 h-5 mr-2" />
                  Buat Kelas Baru
                </Link>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {upcomingClasses.map((classItem) => (
                    <div key={classItem.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <span className={getStatusBadge(classItem.status)}>
                          {getStatusText(classItem.status)}
                        </span>
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/programs/${classItem.program_id}/classes/${classItem.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/programs/${classItem.program_id}/classes/${classItem.id}/content`}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Kelola Materi"
                          >
                            <FileText className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 mb-2">{classItem.name}</h3>
                      {classItem.programs && (
                        <p className="text-sm text-gray-600 mb-4">{classItem.programs.title}</p>
                      )}

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>{formatDate(classItem.start_date)} - {formatDate(classItem.end_date)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-4 h-4 mr-2" />
                          <span>{classItem.current_participants || 0} / {classItem.max_participants || 'Unlimited'} peserta</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <Link
                          href={`/programs/${classItem.program_id}/classes/${classItem.id}`}
                          className="w-full inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Lihat Detail Kelas
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* View More Button */}
                <div className="mt-6 text-center">
                  <Link
                    href="/trainer/classes"
                    className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Lihat Semua Kelas
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Recent Classes */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
              <h2 className="text-2xl font-bold text-gray-900">Kelas Terbaru</h2>
            </div>

            {loading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="animate-pulse space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between py-3">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      </div>
                      <div className="h-6 bg-gray-300 rounded w-16"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : recentClasses.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Belum ada kelas yang dibuat</p>
              </div>
            ) : (
              <div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="space-y-4">
                    {recentClasses.map((classItem) => (
                      <div key={classItem.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{classItem.name}</h4>
                          {classItem.programs && (
                            <p className="text-xs text-gray-600">{classItem.programs.title}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(classItem.start_date)} - {formatDate(classItem.end_date)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={getStatusBadge(classItem.status)}>
                            {getStatusText(classItem.status)}
                          </span>
                          <Link
                            href={`/programs/${classItem.program_id}/classes/${classItem.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* View More Button */}
                <div className="mt-4 text-center">
                  <Link
                    href="/trainer/classes"
                    className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Lihat Semua Kelas
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Leaderboard */}
        <div className="space-y-8">
          <HebatLeaderboard />
        </div>
      </div>
    </div>
  )
}
