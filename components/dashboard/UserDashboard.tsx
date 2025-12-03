'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { MyEnrollments } from './MyEnrollments'
import { AvailablePrograms } from './AvailablePrograms'
import { TrainerProfile } from './TrainerProfile'
import { MyCertificates } from './MyCertificates'
import { HebatAnnouncement } from './HebatAnnouncement'
import {
  GraduationCap,
  UserCheck,
  Award,
  BookOpen,
  Star,
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react'

export function UserDashboard() {
  const { profile } = useAuth()
  const [userStats, setUserStats] = useState({
    enrolledPrograms: 0,
    certificates: 0,
    scheduledPrograms: 0,
    completedPrograms: 0
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const [profileIncomplete, setProfileIncomplete] = useState(false)
  const [missingFields, setMissingFields] = useState<string[]>([])

  const getTrainerLevelInfo = (level: string) => {
    switch (level) {
      case 'master':
        return {
          title: 'Master Trainer',
          description: 'Dapat memberikan pelatihan di semua level',
          color: 'purple',
          icon: Star,
          badge: 'Master'
        }
      case 'expert':
        return {
          title: 'Expert Trainer',
          description: 'Dapat memberikan pelatihan Junior, Senior & Expert',
          color: 'blue',
          icon: Award,
          badge: 'Expert'
        }
      case 'senior':
        return {
          title: 'Senior Trainer',
          description: 'Dapat memberikan pelatihan Junior & Senior',
          color: 'green',
          icon: UserCheck,
          badge: 'Senior'
        }
      case 'junior':
        return {
          title: 'Junior Trainer',
          description: 'Dapat memberikan pelatihan Junior',
          color: 'yellow',
          icon: UserCheck,
          badge: 'Junior'
        }
      default:
        return {
          title: 'User',
          description: 'Dapat mengikuti program pelatihan',
          color: 'gray',
          icon: BookOpen,
          badge: 'User'
        }
    }
  }

  const levelInfo = getTrainerLevelInfo((profile as any)?.trainer_level || 'user')
  const Icon = levelInfo.icon

  // Fetch user statistics from database
  useEffect(() => {
    async function fetchUserStats() {
      if (!profile?.id) return

      try {
        setStatsLoading(true)

        // Check profile completeness: user_profiles + participants
        const [{ data: userProfile }, { data: participantInfo }] = await Promise.all([
          supabase.from('user_profiles').select('full_name, email, phone, gender, address').eq('id', profile.id).maybeSingle(),
          supabase.from('participants').select('phone, address').eq('user_id', profile.id).maybeSingle()
        ])

        const missing: string[] = []
        if (!(userProfile as any)?.full_name) missing.push('Nama Lengkap')
        if (!(userProfile as any)?.email) missing.push('Email')
        if (!((userProfile as any)?.phone || (participantInfo as any)?.phone)) missing.push('Nomor Telepon')
        if (!(userProfile as any)?.gender) missing.push('Jenis Kelamin')
        if (!((userProfile as any)?.address || (participantInfo as any)?.address)) missing.push('Alamat')
        setMissingFields(missing)
        setProfileIncomplete(missing.length > 0)

        // Get participant ID
        const { data: participant } = await supabase
          .from('participants')
          .select('id')
          .eq('user_id', profile.id)
          .maybeSingle()

        if (!participant) {
          setStatsLoading(false)
          return
        }

        // Fetch enrollments
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('status, programs(start_date)')
          .eq('participant_id', (participant as any).id)

        // Fetch certificates
        const { data: certificates } = await supabase
          .from('certificates')
          .select('id')
          .eq('participant_id', (participant as any).id)

        if (enrollments) {
          const now = new Date()
          const enrolledCount = enrollments.length
          const completedCount = enrollments.filter((e: any) => e.status === 'completed').length
          const scheduledCount = enrollments.filter((e: any) => {
            if (!(e as any).programs?.start_date) return false
            const startDate = new Date((e as any).programs.start_date)
            return startDate > now && e.status === 'approved'
          }).length

          setUserStats({
            enrolledPrograms: enrolledCount,
            certificates: certificates?.length || 0,
            scheduledPrograms: scheduledCount,
            completedPrograms: completedCount
          })
        }
      } catch (error) {
        console.error('Error fetching user stats:', error)
      } finally {
        setStatsLoading(false)
      }
    }

    fetchUserStats()

    // Recheck on window focus (misalnya setelah user selesai edit profil)
    const onFocus = () => { fetchUserStats() }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus)
      }
    }
  }, [profile?.id])

  const statsData = [
    {
      title: 'Program Diikuti',
      value: userStats.enrolledPrograms.toString(),
      icon: GraduationCap,
      color: 'blue',
      href: '/my-enrollments'
    },
    {
      title: 'Sertifikat',
      value: userStats.certificates.toString(),
      icon: Award,
      color: 'green',
      href: '/my-certificates'
    },
    {
      title: 'Program Dijadwalkan',
      value: userStats.scheduledPrograms.toString(),
      icon: Clock,
      color: 'orange',
      href: '/my-enrollments'
    },
    {
      title: 'Program Selesai',
      value: userStats.completedPrograms.toString(),
      icon: CheckCircle,
      color: 'purple',
      href: '/my-enrollments'
    }
  ]

  const quickActions = [
    {
      title: 'Daftar Program',
      icon: GraduationCap,
      href: '/programs',
      color: 'blue',
      description: 'Lihat dan daftar program pelatihan'
    },
    {
      title: 'Jadi Trainer',
      icon: UserCheck,
      href: '/become-trainer',
      color: 'green',
      description: 'Daftar sebagai trainer'
    },
    {
      title: 'Sertifikat Saya',
      icon: Award,
      href: '/certificates',
      color: 'purple',
      description: 'Lihat sertifikat yang diperoleh'
    },
    {
      title: 'Profil Trainer',
      icon: Star,
      href: '/trainer-profile',
      color: 'orange',
      description: 'Kelola profil trainer'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-red-100">
      <HebatAnnouncement />
      {/* Header with modern gradient */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-3xl p-6 sm:p-8 mb-8 shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Dashboard Saya</h1>
              <p className="text-red-100 text-base sm:text-lg">
                Selamat datang kembali, <span className="font-semibold">{profile?.full_name}</span>! 👋
              </p>
              <p className="text-red-200 text-sm mt-1">
                Kelola pembelajaran dan tingkatkan skill Anda
              </p>
            </div>
            <div className="flex items-center justify-center sm:justify-end">
              <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-lg">
                <div className={`w-4 h-4 rounded-full ${levelInfo.color === 'purple' ? 'bg-purple-400' :
                    levelInfo.color === 'blue' ? 'bg-blue-400' :
                      levelInfo.color === 'green' ? 'bg-green-400' : 'bg-gray-400'
                  }`}></div>
                <span className="text-white font-medium text-sm sm:text-base">{levelInfo.title}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full"></div>
      </div>

      {/* Persuasive profile completion banner */}
      {profileIncomplete && (
        <div className="px-4 sm:px-6 lg:px-8 mb-8">
          <div className="border border-yellow-300 bg-yellow-50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-yellow-900">Lengkapi Profil Anda</h3>
              <p className="text-sm text-yellow-800 mt-1">
                Untuk mendapatkan statistik pelatihan yang akurat dan menjaga akun tetap aktif, mohon lengkapi data Anda.
                Akun berisiko dinonaktifkan dalam 3×24 jam jika data belum lengkap.
              </p>
              {missingFields.length > 0 && (
                <p className="text-xs text-yellow-800 mt-2">
                  Data belum lengkap: {missingFields.join(', ')}
                </p>
              )}
            </div>
            <Link
              href={`/profile/edit?return=${encodeURIComponent('/dashboard')}`}
              className="inline-flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 text-sm font-semibold"
            >
              Lengkapi Sekarang
            </Link>
          </div>
        </div>
      )}


      {/* User Stats - Modern Cards */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12">
          {statsLoading ? (
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
                <Link key={index} href={stat.href} className="block">
                  <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50"></div>
                    <div className="relative z-10 p-5 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-5 space-y-4 sm:space-y-0">
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 ${stat.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
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
                          <div className={`w-2 h-2 rounded-full ${stat.color === 'blue' ? 'bg-blue-500' :
                              stat.color === 'green' ? 'bg-green-500' :
                                stat.color === 'orange' ? 'bg-orange-500' :
                                  stat.color === 'purple' ? 'bg-purple-500' : 'bg-gray-500'
                            }`}></div>
                          <span className="text-xs text-gray-500 font-medium">Aktif</span>
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

      {/* Quick Actions removed as requested */}

      {/* Kelas Terdaftar - Full Width */}
      <div className="space-y-6 mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-1 h-8 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></div>
          <h2 className="text-2xl font-bold text-gray-900">Kelas Terdaftar</h2>
        </div>
        <MyEnrollments />
      </div>

      {/* Program Tersedia - Full Width */}
      <div className="space-y-6 mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-1 h-8 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></div>
          <h2 className="text-2xl font-bold text-gray-900">Program Tersedia</h2>
        </div>
        <AvailablePrograms />
      </div>

      {/* Trainer Profile & Certificates */}
      {((profile as any)?.trainer_level && (profile as any).trainer_level !== 'user') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-1 h-8 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></div>
              <h2 className="text-2xl font-bold text-gray-900">Profil Saya</h2>
            </div>
            <TrainerProfile />
          </div>
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-1 h-8 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></div>
              <h2 className="text-2xl font-bold text-gray-900">Sertifikat Saya</h2>
            </div>
            <MyCertificates />
          </div>
        </div>
      )}
    </div>
  )
}
