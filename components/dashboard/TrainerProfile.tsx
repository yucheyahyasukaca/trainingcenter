'use client'

import { useAuth } from '@/components/AuthProvider'
import { 
  Star, 
  Award, 
  BookOpen, 
  Users,
  Calendar,
  TrendingUp,
  Edit
} from 'lucide-react'

export function TrainerProfile() {
  const { profile } = useAuth()

  const getLevelInfo = (level: string) => {
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
          icon: Award,
          badge: 'Senior'
        }
      case 'junior':
        return {
          title: 'Junior Trainer',
          description: 'Dapat memberikan pelatihan Junior',
          color: 'yellow',
          icon: Award,
          badge: 'Junior'
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

  const levelInfo = getLevelInfo((profile as any)?.trainer_level || 'user')
  const Icon = levelInfo.icon

  const trainerStats = [
    {
      title: 'Program Aktif',
      value: '3',
      icon: BookOpen,
      color: 'blue'
    },
    {
      title: 'Total Peserta',
      value: '45',
      icon: Users,
      color: 'green'
    },
    {
      title: 'Rating Rata-rata',
      value: '4.8',
      icon: Star,
      color: 'yellow'
    },
    {
      title: 'Pengalaman',
      value: `${(profile as any)?.trainer_experience_years || 0} tahun`,
      icon: Calendar,
      color: 'purple'
    }
  ]

  const recentPrograms = [
    {
      id: 1,
      title: 'Leadership Excellence Program',
      participants: 15,
      rating: 4.9,
      status: 'active'
    },
    {
      id: 2,
      title: 'Digital Marketing Mastery',
      participants: 22,
      rating: 4.7,
      status: 'completed'
    },
    {
      id: 3,
      title: 'Project Management Fundamentals',
      participants: 18,
      rating: 4.8,
      status: 'active'
    }
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Profil Trainer</h3>
        <button className="flex items-center space-x-2 px-3 py-2 text-primary-600 hover:text-primary-700 transition-colors">
          <Edit className="w-4 h-4" />
          <span className="text-sm font-medium">Edit Profil</span>
        </button>
      </div>

      {/* Trainer Level Badge */}
      <div className={`bg-gradient-to-r ${
        levelInfo.color === 'purple' ? 'from-purple-50 to-purple-100' :
        levelInfo.color === 'blue' ? 'from-blue-50 to-blue-100' :
        levelInfo.color === 'green' ? 'from-green-50 to-green-100' : 'from-gray-50 to-gray-100'
      } rounded-xl p-4 mb-6 border ${
        levelInfo.color === 'purple' ? 'border-purple-200' :
        levelInfo.color === 'blue' ? 'border-blue-200' :
        levelInfo.color === 'green' ? 'border-green-200' : 'border-gray-200'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            levelInfo.color === 'purple' ? 'bg-purple-600' :
            levelInfo.color === 'blue' ? 'bg-blue-600' :
            levelInfo.color === 'green' ? 'bg-green-600' : 'bg-gray-600'
          }`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-lg font-bold text-gray-900">{levelInfo.title}</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                levelInfo.color === 'purple' ? 'bg-purple-200 text-purple-800' :
                levelInfo.color === 'blue' ? 'bg-blue-200 text-blue-800' :
                levelInfo.color === 'green' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'
              }`}>
                {levelInfo.badge}
              </span>
            </div>
            <p className="text-sm text-gray-600">{levelInfo.description}</p>
          </div>
        </div>
      </div>

      {/* Trainer Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {trainerStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                stat.color === 'blue' ? 'bg-blue-100' :
                stat.color === 'green' ? 'bg-green-100' :
                stat.color === 'yellow' ? 'bg-yellow-100' :
                stat.color === 'purple' ? 'bg-purple-100' : 'bg-gray-100'
              }`}>
                <Icon className={`w-5 h-5 ${
                  stat.color === 'blue' ? 'text-blue-600' :
                  stat.color === 'green' ? 'text-green-600' :
                  stat.color === 'yellow' ? 'text-yellow-600' :
                  stat.color === 'purple' ? 'text-purple-600' : 'text-gray-600'
                }`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-600">{stat.title}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Specializations */}
      {(profile as any)?.trainer_specializations && (profile as any).trainer_specializations.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Spesialisasi</h4>
          <div className="flex flex-wrap gap-2">
            {(profile as any).trainer_specializations.map((spec: any, index: number) => (
              <span key={index} className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                {spec}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Programs */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Program Terbaru</h4>
        <div className="space-y-2">
          {recentPrograms.map((program) => (
            <div key={program.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">{program.title}</p>
                <p className="text-xs text-gray-600">{program.participants} peserta</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">{program.rating}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  program.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {program.status === 'active' ? 'Aktif' : 'Selesai'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
