'use client'

import { useAuth } from '@/components/AuthProvider'
import { MyEnrollments } from './MyEnrollments'
import { AvailablePrograms } from './AvailablePrograms'
import { TrainerProfile } from './TrainerProfile'
import { MyCertificates } from './MyCertificates'
import { 
  GraduationCap, 
  UserCheck, 
  Award, 
  BookOpen,
  Star,
  Clock,
  CheckCircle
} from 'lucide-react'

export function UserDashboard() {
  const { profile } = useAuth()

  const getTrainerLevelInfo = (level: string) => {
    switch (level) {
      case 'master_trainer':
        return {
          title: 'Master Trainer',
          description: 'Dapat memberikan pelatihan di semua level',
          color: 'purple',
          icon: Star,
          badge: 'Master'
        }
      case 'trainer_l2':
        return {
          title: 'Trainer Level 2',
          description: 'Dapat memberikan pelatihan Level 1 & 2',
          color: 'blue',
          icon: Award,
          badge: 'L2'
        }
      case 'trainer_l1':
        return {
          title: 'Trainer Level 1',
          description: 'Dapat memberikan pelatihan Level 1',
          color: 'green',
          icon: UserCheck,
          badge: 'L1'
        }
      default:
        return {
          title: 'Regular User',
          description: 'Dapat mengikuti program pelatihan',
          color: 'gray',
          icon: BookOpen,
          badge: 'User'
        }
    }
  }

  const levelInfo = getTrainerLevelInfo((profile as any)?.trainer_level || 'user')
  const Icon = levelInfo.icon

  const userStats = [
    {
      title: 'Program Diikuti',
      value: '3',
      icon: GraduationCap,
      color: 'blue'
    },
    {
      title: 'Sertifikat',
      value: '2',
      icon: Award,
      color: 'green'
    },
    {
      title: 'Program Dijadwalkan',
      value: '1',
      icon: Clock,
      color: 'orange'
    },
    {
      title: 'Program Selesai',
      value: '2',
      icon: CheckCircle,
      color: 'purple'
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
                <div className={`w-4 h-4 rounded-full ${
                  levelInfo.color === 'purple' ? 'bg-purple-400' :
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


      {/* User Stats - Modern Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {userStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50"></div>
              <div className="relative z-10 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 space-y-3 sm:space-y-0">
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
                    {stat.title === 'Program Diikuti' ? 'Total' : 
                     stat.title === 'Sertifikat' ? 'Earned' :
                     stat.title === 'Program Dijadwalkan' ? 'Upcoming' : 'Completed'}
                  </div>
                </div>
              </div>
              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          )
        })}
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
              <h2 className="text-2xl font-bold text-gray-900">Profil Trainer</h2>
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
