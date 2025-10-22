'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { ClassWithTrainers, Program, Trainer } from '@/types'
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
  MessageSquare,
  TrendingUp,
  Award,
  UserCheck
} from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatTime } from '@/lib/utils'

export function TrainerDashboard() {
  const { profile } = useAuth()
  const [trainerStats, setTrainerStats] = useState({
    totalClasses: 0,
    activeClasses: 0,
    completedClasses: 0,
    totalParticipants: 0,
    averageRating: 0
  })
  const [assignedClasses, setAssignedClasses] = useState<ClassWithTrainers[]>([])
  const [upcomingClasses, setUpcomingClasses] = useState<ClassWithTrainers[]>([])
  const [recentClasses, setRecentClasses] = useState<ClassWithTrainers[]>([])
  const [loading, setLoading] = useState(true)

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

  const levelInfo = getTrainerLevelInfo((profile as any)?.trainer_level || 'user')
  const Icon = levelInfo.icon

  // Check if trainer can create class for program
  const canCreateClassForProgram = (programMinLevel: string) => {
    const trainerLevel = (profile as any)?.trainer_level || 'user'
    const trainerInfo = getTrainerLevelInfo(trainerLevel)
    const requiredInfo = getTrainerLevelInfo(programMinLevel)
    
    return trainerInfo.hierarchy >= requiredInfo.hierarchy
  }

  // Fetch trainer data
  useEffect(() => {
    const fetchTrainerData = async () => {
      if (!profile?.id) return

      try {
        setLoading(true)
        
        // Get trainer ID from trainers table
        const { data: trainerData } = await supabase
          .from('trainers')
          .select('id')
          .eq('user_id', profile.id)
          .single()

        if (!trainerData) {
          setLoading(false)
          return
        }

        // Fetch assigned classes
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select(`
            *,
            programs(
              id,
              title,
              description,
              category,
              min_trainer_level
            ),
            trainers:class_trainers(
              *,
              trainer:trainers(*)
            )
          `)
          .eq('trainers.trainer_id', trainerData.id)
          .order('start_date', { ascending: true })

        if (classesError) {
          console.error('Error fetching classes:', classesError)
          return
        }

        const classes = classesData || []
        setAssignedClasses(classes)

        // Calculate stats
        const now = new Date()
        const activeClasses = classes.filter(c => {
          const startDate = new Date(c.start_date)
          const endDate = new Date(c.end_date)
          return startDate <= now && endDate >= now && c.status === 'ongoing'
        })

        const completedClasses = classes.filter(c => c.status === 'completed')
        const upcomingClasses = classes.filter(c => {
          const startDate = new Date(c.start_date)
          return startDate > now && c.status === 'scheduled'
        })

        // Calculate total participants (simplified - would need enrollment data)
        const totalParticipants = classes.reduce((sum, c) => sum + (c.current_participants || 0), 0)

        setTrainerStats({
          totalClasses: classes.length,
          activeClasses: activeClasses.length,
          completedClasses: completedClasses.length,
          totalParticipants,
          averageRating: 4.8 // Mock data - would need rating system
        })

        setUpcomingClasses(upcomingClasses.slice(0, 3))
        setRecentClasses(completedClasses.slice(0, 3))

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
      description: 'Kelas yang ditugaskan'
    },
    {
      title: 'Kelas Aktif',
      value: trainerStats.activeClasses.toString(),
      icon: Clock,
      color: 'green',
      description: 'Sedang berlangsung'
    },
    {
      title: 'Kelas Selesai',
      value: trainerStats.completedClasses.toString(),
      icon: CheckCircle,
      color: 'purple',
      description: 'Sudah selesai'
    },
    {
      title: 'Total Peserta',
      value: trainerStats.totalParticipants.toString(),
      icon: Users,
      color: 'orange',
      description: 'Peserta yang dilatih'
    }
  ]

  const quickActions = [
    { 
      title: 'Kelas Saya', 
      icon: BookOpen, 
      href: '/trainer/classes', 
      color: 'blue',
      description: 'Lihat semua kelas yang ditugaskan'
    },
    { 
      title: 'Buat Kelas Baru', 
      icon: Plus, 
      href: '/trainer/classes/new', 
      color: 'green',
      description: 'Buat kelas baru'
    },
    { 
      title: 'Materi Pelatihan', 
      icon: FileText, 
      href: '/trainer/materials', 
      color: 'purple',
      description: 'Kelola materi pelatihan'
    },
    { 
      title: 'Forum Diskusi', 
      icon: MessageSquare, 
      href: '/trainer/forum', 
      color: 'orange',
      description: 'Diskusi dengan peserta'
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
                <div className={`w-4 h-4 rounded-full ${
                  levelInfo.color === 'purple' ? 'bg-purple-400' :
                  levelInfo.color === 'blue' ? 'bg-blue-400' :
                  levelInfo.color === 'green' ? 'bg-green-400' : 'bg-gray-400'
                }`}></div>
                <span className="text-white font-medium text-sm sm:text-base">
                  {levelInfo.badge === 'Master' ? 'Master Trainer' :
                   levelInfo.badge === 'L2' ? 'Trainer L2' :
                   levelInfo.badge === 'L1' ? 'Trainer L1' : 'User'}
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full"></div>
      </div>

      {/* Trainer Stats - Modern Cards */}
      <div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-6">
              <div className="animate-pulse">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-5 space-y-4 sm:space-y-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-300 rounded-2xl"></div>
                  <div className="text-left sm:text-right">
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
            <div key={index} className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50"></div>
              <div className="relative z-10 p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-5 space-y-4 sm:space-y-0">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 ${
                    stat.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                    stat.color === 'green' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                    stat.color === 'orange' ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                    stat.color === 'purple' ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-gradient-to-br from-gray-500 to-gray-600'
                  }`}>
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">{stat.value}</p>
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mt-1">{stat.title}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      stat.color === 'blue' ? 'bg-blue-500' :
                      stat.color === 'green' ? 'bg-green-500' :
                      stat.color === 'orange' ? 'bg-orange-500' :
                      stat.color === 'purple' ? 'bg-purple-500' : 'bg-gray-500'
                    }`}></div>
                    <span className="text-xs text-gray-500 font-medium">Aktif</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {stat.description}
                  </div>
                </div>
              </div>
              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          )
        })
        )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <Link
                  key={index}
                  href={action.href}
                  className="group flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 ${
                    action.color === 'blue' ? 'bg-blue-100 group-hover:bg-blue-200' :
                    action.color === 'green' ? 'bg-green-100 group-hover:bg-green-200' :
                    action.color === 'purple' ? 'bg-purple-100 group-hover:bg-purple-200' :
                    action.color === 'orange' ? 'bg-orange-100 group-hover:bg-orange-200' :
                    'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      action.color === 'blue' ? 'text-blue-600' :
                      action.color === 'green' ? 'text-green-600' :
                      action.color === 'purple' ? 'text-purple-600' :
                      action.color === 'orange' ? 'text-orange-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-primary-700 text-center">
                    {action.title}
                  </span>
                  <span className="text-xs text-gray-500 text-center mt-1">
                    {action.description}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Upcoming Classes */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
          <h2 className="text-2xl font-bold text-gray-900">Kelas Mendatang</h2>
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
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Tidak ada kelas mendatang</p>
            <Link href="/trainer/classes/new" className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              <Plus className="w-5 h-5 mr-2" />
              Buat Kelas Baru
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Belum ada kelas yang selesai</p>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  )
}
