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

  const levelInfo = getTrainerLevelInfo(profile?.trainer_level || 'user')
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Saya</h1>
          <p className="text-gray-600 mt-1">
            Selamat datang, {profile?.full_name}! Kelola pembelajaran Anda
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            levelInfo.color === 'purple' ? 'bg-purple-500' :
            levelInfo.color === 'blue' ? 'bg-blue-500' :
            levelInfo.color === 'green' ? 'bg-green-500' : 'bg-gray-500'
          }`}></div>
          <span className="text-sm text-gray-600">{levelInfo.title}</span>
        </div>
      </div>

      {/* User Level Badge */}
      <div className={`bg-gradient-to-r ${
        levelInfo.color === 'purple' ? 'from-purple-50 to-purple-100' :
        levelInfo.color === 'blue' ? 'from-blue-50 to-blue-100' :
        levelInfo.color === 'green' ? 'from-green-50 to-green-100' : 'from-gray-50 to-gray-100'
      } rounded-xl p-6 border ${
        levelInfo.color === 'purple' ? 'border-purple-200' :
        levelInfo.color === 'blue' ? 'border-blue-200' :
        levelInfo.color === 'green' ? 'border-green-200' : 'border-gray-200'
      }`}>
        <div className="flex items-center space-x-4">
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
            levelInfo.color === 'purple' ? 'bg-purple-600' :
            levelInfo.color === 'blue' ? 'bg-blue-600' :
            levelInfo.color === 'green' ? 'bg-green-600' : 'bg-gray-600'
          }`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h3 className="text-xl font-bold text-gray-900">{levelInfo.title}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                levelInfo.color === 'purple' ? 'bg-purple-200 text-purple-800' :
                levelInfo.color === 'blue' ? 'bg-blue-200 text-blue-800' :
                levelInfo.color === 'green' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'
              }`}>
                {levelInfo.badge}
              </span>
            </div>
            <p className="text-gray-600 mt-1">{levelInfo.description}</p>
            {profile?.trainer_specializations && profile.trainer_specializations.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Spesialisasi:</p>
                <div className="flex flex-wrap gap-2">
                  {profile.trainer_specializations.map((spec, index) => (
                    <span key={index} className="px-2 py-1 bg-white rounded-md text-sm text-gray-700">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {userStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <a
                key={index}
                href={action.href}
                className="flex flex-col p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    action.color === 'blue' ? 'bg-blue-100 group-hover:bg-blue-200' :
                    action.color === 'green' ? 'bg-green-100 group-hover:bg-green-200' :
                    action.color === 'orange' ? 'bg-orange-100 group-hover:bg-orange-200' :
                    action.color === 'purple' ? 'bg-purple-100 group-hover:bg-purple-200' : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      action.color === 'blue' ? 'text-blue-600' :
                      action.color === 'green' ? 'text-green-600' :
                      action.color === 'orange' ? 'text-orange-600' :
                      action.color === 'purple' ? 'text-purple-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-primary-700">
                    {action.title}
                  </h4>
                </div>
                <p className="text-sm text-gray-600">{action.description}</p>
              </a>
            )
          })}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AvailablePrograms />
        <MyEnrollments />
      </div>

      {/* Trainer Profile & Certificates */}
      {(profile?.trainer_level && profile.trainer_level !== 'user') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrainerProfile />
          <MyCertificates />
        </div>
      )}
    </div>
  )
}
