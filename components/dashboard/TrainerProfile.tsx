'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { 
  Star, 
  Award, 
  BookOpen, 
  Users,
  Calendar,
  Edit,
  X,
  Info
} from 'lucide-react'
import Link from 'next/link'

export function TrainerProfile() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [trainerStats, setTrainerStats] = useState({
    activePrograms: 0,
    totalParticipants: 0,
    averageRating: 0,
    experienceYears: 0
  })
  const [recentPrograms, setRecentPrograms] = useState<any[]>([])
  const [selectedStat, setSelectedStat] = useState<string | null>(null)

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

  useEffect(() => {
    const fetchTrainerData = async () => {
      if (!profile?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const trainerId = profile.id
        console.log('🔍 TrainerProfile: Fetching data for trainer ID:', trainerId)

        // Try multiple approaches to find trainer's programs
        // Approach 1: Fetch classes assigned to this trainer via class_trainers
        let classes: any[] = []
        
        const { data: classesData, error: classesError } = await supabase
          .from('class_trainers')
          .select(`
            class_id,
            classes!inner(
              id,
              program_id,
              status,
              current_participants,
              start_date,
              end_date,
              programs(
                id,
                title,
                status
              )
            )
          `)
          .eq('trainer_id', trainerId)

        if (classesError) {
          console.error('❌ Error fetching classes from class_trainers:', classesError)
        } else {
          console.log('✅ Classes from class_trainers:', classesData?.length || 0)
          const mappedClasses = (classesData || []).map((item: any) => item.classes).filter(Boolean)
          classes = [...classes, ...mappedClasses]
        }

        // Approach 2: Also check if programs.trainer_id references user_profiles.id
        const { data: programsData, error: programsError } = await supabase
          .from('programs')
          .select(`
            id,
            title,
            status,
            classes(
              id,
              status,
              current_participants,
              start_date,
              end_date
            )
          `)
          .eq('trainer_id', trainerId)
          .eq('status', 'published')

        if (programsError) {
          console.log('⚠️ Note: programs.trainer_id may not reference user_profiles.id:', programsError.message)
        } else {
          console.log('✅ Programs found via programs.trainer_id:', programsData?.length || 0)
          // Add classes from these programs
          programsData?.forEach((program: any) => {
            if (program.classes && Array.isArray(program.classes)) {
              program.classes.forEach((cls: any) => {
                classes.push({
                  ...cls,
                  program_id: program.id,
                  programs: {
                    id: program.id,
                    title: program.title,
                    status: program.status
                  }
                })
              })
            }
          })
        }

        console.log('📊 Total classes found:', classes.length)
        
        // Remove duplicates
        const uniqueClasses = classes.filter((classItem: any, index: number, self: any[]) => 
          index === self.findIndex((c: any) => c.id === classItem.id)
        )

        console.log('📊 Unique classes after deduplication:', uniqueClasses.length)

        // Calculate active programs (programs with active/ongoing classes)
        const now = new Date()
        const activeProgramsSet = new Set<string>()
        let totalParticipants = 0

        uniqueClasses.forEach((classItem: any) => {
          if (!classItem.start_date || !classItem.end_date) {
            console.warn('⚠️ Class missing dates:', classItem.id)
            return
          }

          const startDate = new Date(classItem.start_date)
          const endDate = new Date(classItem.end_date)
          const isActive = startDate <= now && endDate >= now
          
          if (isActive && classItem.programs && classItem.programs.status === 'published') {
            activeProgramsSet.add(classItem.program_id)
          }
          
          totalParticipants += classItem.current_participants || 0
        })

        console.log('📊 Active programs:', activeProgramsSet.size)
        console.log('📊 Total participants:', totalParticipants)

        // Get recent programs with stats
        const programMap = new Map()
        uniqueClasses.forEach((classItem: any) => {
          if (!classItem.programs && !classItem.program_id) return
          
          const programId = classItem.program_id
          if (!programId) return

          if (!programMap.has(programId)) {
            programMap.set(programId, {
              id: programId,
              title: classItem.programs?.title || 'Unknown Program',
              participants: 0,
              status: classItem.status || 'scheduled',
              programStatus: classItem.programs?.status || 'published',
              lastClassDate: classItem.end_date ? new Date(classItem.end_date) : new Date(0)
            })
          }
          
          const program = programMap.get(programId)
          program.participants += classItem.current_participants || 0
          
          if (classItem.end_date) {
            const classEndDate = new Date(classItem.end_date)
            if (classEndDate > program.lastClassDate) {
              program.lastClassDate = classEndDate
            }
          }
          
          // Determine overall status
          if (classItem.start_date && classItem.end_date) {
            const classStartDate = new Date(classItem.start_date)
            const classEndDate = new Date(classItem.end_date)
            const isActive = classStartDate <= now && classEndDate >= now
            if (isActive) {
              program.status = 'active'
            } else if (classEndDate < now) {
              if (program.status !== 'active') {
                program.status = 'completed'
              }
            }
          }
        })

        const recentProgramsList = Array.from(programMap.values())
          .filter((p: any) => p.programStatus === 'published')
          .sort((a: any, b: any) => b.lastClassDate.getTime() - a.lastClassDate.getTime())
          .slice(0, 3)
          .map((p: any) => ({
            id: p.id,
            title: p.title,
            participants: p.participants,
            rating: 0, // Rating feature not implemented yet
            status: p.status === 'active' ? 'active' : 'completed'
          }))

        console.log('📊 Recent programs:', recentProgramsList.length)

        setTrainerStats({
          activePrograms: activeProgramsSet.size,
          totalParticipants,
          averageRating: 0, // Rating feature not implemented yet
          experienceYears: (profile as any)?.trainer_experience_years || 0
        })

        setRecentPrograms(recentProgramsList)
      } catch (error) {
        console.error('❌ Error fetching trainer data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrainerData()
  }, [profile?.id])

  const statsArray = [
    {
      id: 'activePrograms',
      title: 'Program Aktif',
      value: trainerStats.activePrograms.toString(),
      icon: BookOpen,
      color: 'blue',
      description: 'Program Aktif mencerminkan program yang sedang Anda ikuti dan telah berhasil lulus. Setiap program yang diselesaikan menandakan dedikasi dan komitmen Anda dalam mengembangkan kompetensi sebagai trainer profesional di Garuda Academy.',
      subtitle: 'Program diikuti yang berhasil lulus'
    },
    {
      id: 'totalParticipants',
      title: 'Total Peserta',
      value: trainerStats.totalParticipants.toString(),
      icon: Users,
      color: 'green',
      description: 'Total Peserta menunjukkan jumlah peserta yang telah mempercayai Anda sebagai pembimbing dalam perjalanan belajar mereka. Setiap angka ini mewakili kehidupan yang telah Anda sentuh dan dampak positif yang telah Anda berikan kepada para peserta melalui kelas-kelas pelatihan Anda.',
      subtitle: 'Peserta yang mendaftar di kelas Anda'
    },
    {
      id: 'averageRating',
      title: 'Rating Rata-rata',
      value: trainerStats.averageRating > 0 ? trainerStats.averageRating.toFixed(1) : '-',
      icon: Star,
      color: 'yellow',
      description: 'Rating Rata-rata merupakan refleksi kualitas pengajaran dan dedikasi Anda yang dirasakan langsung oleh para peserta. Setiap bintang yang diberikan adalah bukti nyata dari dampak positif dan kepuasan peserta terhadap metode pengajaran dan pendekatan mentoring yang Anda terapkan.',
      subtitle: 'Rating yang diberikan oleh peserta'
    },
    {
      id: 'experience',
      title: 'Pengalaman',
      value: `${trainerStats.experienceYears} tahun`,
      icon: Calendar,
      color: 'purple',
      description: 'Pengalaman menunjukkan perjalanan panjang Anda sebagai trainer profesional di Garuda Academy. Setiap tahun yang tercatat mencerminkan dedikasi, pembelajaran berkelanjutan, dan kontribusi Anda dalam membentuk masa depan pendidikan berkualitas. Teruslah berinovasi dan menginspirasi!',
      subtitle: 'Waktu bergabung sebagai trainer di Garuda Academy'
    }
  ]

  const getStatInfo = (statId: string) => {
    return statsArray.find(stat => stat.id === statId)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Profil Saya</h3>
        <Link 
          href="/trainer-profile/edit"
          className="flex items-center space-x-2 px-3 py-2 text-primary-600 hover:text-primary-700 transition-colors"
        >
          <Edit className="w-4 h-4" />
          <span className="text-sm font-medium">Edit Profil</span>
        </Link>
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
      {loading ? (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-gray-200"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {statsArray.map((stat, index) => {
            const StatIcon = stat.icon
            return (
              <button
                key={index}
                onClick={() => setSelectedStat(stat.id)}
                className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer group text-left w-full relative"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
                  stat.color === 'blue' ? 'bg-blue-100 group-hover:bg-blue-200' :
                  stat.color === 'green' ? 'bg-green-100 group-hover:bg-green-200' :
                  stat.color === 'yellow' ? 'bg-yellow-100 group-hover:bg-yellow-200' :
                  stat.color === 'purple' ? 'bg-purple-100 group-hover:bg-purple-200' : 'bg-gray-100'
                }`}>
                  <StatIcon className={`w-5 h-5 ${
                    stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'green' ? 'text-green-600' :
                    stat.color === 'yellow' ? 'text-yellow-600' :
                    stat.color === 'purple' ? 'text-purple-600' : 'text-gray-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-600">{stat.title}</p>
                </div>
                <Info className={`w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity ${
                  stat.color === 'blue' ? 'text-blue-600' :
                  stat.color === 'green' ? 'text-green-600' :
                  stat.color === 'yellow' ? 'text-yellow-600' :
                  stat.color === 'purple' ? 'text-purple-600' : 'text-gray-600'
                }`} />
              </button>
            )
          })}
        </div>
      )}

      {/* Stat Info Modal */}
      {selectedStat && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedStat(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const stat = getStatInfo(selectedStat)
              if (!stat) return null
              const StatIcon = stat.icon
              
              return (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      stat.color === 'blue' ? 'bg-blue-100' :
                      stat.color === 'green' ? 'bg-green-100' :
                      stat.color === 'yellow' ? 'bg-yellow-100' :
                      stat.color === 'purple' ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      <StatIcon className={`w-6 h-6 ${
                        stat.color === 'blue' ? 'text-blue-600' :
                        stat.color === 'green' ? 'text-green-600' :
                        stat.color === 'yellow' ? 'text-yellow-600' :
                        stat.color === 'purple' ? 'text-purple-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <button
                      onClick={() => setSelectedStat(null)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{stat.title}</h3>
                  <p className="text-sm text-gray-600 mb-1 font-medium">{stat.subtitle}</p>
                  <div className={`w-12 h-1 rounded-full mb-4 ${
                    stat.color === 'blue' ? 'bg-blue-600' :
                    stat.color === 'green' ? 'bg-green-600' :
                    stat.color === 'yellow' ? 'bg-yellow-600' :
                    stat.color === 'purple' ? 'bg-purple-600' : 'bg-gray-600'
                  }`}></div>
                  
                  <p className="text-gray-700 leading-relaxed text-sm mb-4">
                    {stat.description}
                  </p>
                  
                  <div className={`mt-6 p-4 rounded-xl ${
                    stat.color === 'blue' ? 'bg-blue-50 border border-blue-200' :
                    stat.color === 'green' ? 'bg-green-50 border border-green-200' :
                    stat.color === 'yellow' ? 'bg-yellow-50 border border-yellow-200' :
                    stat.color === 'purple' ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <p className={`text-sm font-semibold ${
                      stat.color === 'blue' ? 'text-blue-900' :
                      stat.color === 'green' ? 'text-green-900' :
                      stat.color === 'yellow' ? 'text-yellow-900' :
                      stat.color === 'purple' ? 'text-purple-900' : 'text-gray-900'
                    }`}>
                      💡 Nilai Saat Ini: <span className="text-2xl">{stat.value}</span>
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setSelectedStat(null)}
                    className={`mt-4 w-full py-3 px-4 rounded-xl font-medium transition-all ${
                      stat.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                      stat.color === 'green' ? 'bg-green-600 hover:bg-green-700 text-white' :
                      stat.color === 'yellow' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                      stat.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-gray-600 hover:bg-gray-700 text-white'
                    }`}
                  >
                    Mengerti
                  </button>
                </>
              )
            })()}
          </div>
        </div>
      )}

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
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 animate-pulse">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : recentPrograms.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            Belum ada program yang di-assign
          </div>
        ) : (
          <div className="space-y-2">
            {recentPrograms.map((program) => (
              <Link 
                key={program.id} 
                href={`/programs/${program.id}`}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{program.title}</p>
                  <p className="text-xs text-gray-600">{program.participants} peserta</p>
                </div>
                <div className="flex items-center space-x-3">
                  {program.rating > 0 && (
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-gray-600">{program.rating}</span>
                    </div>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    program.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {program.status === 'active' ? 'Aktif' : 'Selesai'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
