'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BookOpen,
  Award,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export function MyEnrollments() {
  const { profile } = useAuth()
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEnrollments()
  }, [profile?.id])

  async function fetchEnrollments() {
    try {
      if (!profile?.id) {
        setEnrollments([])
        setLoading(false)
        return
      }

      // First, get the participant record for this user
      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .select('id')
        .eq('user_id', profile.id)
        .maybeSingle()

      if (participantError || !participant) {
        console.log('No participant record found for user')
        setEnrollments([])
        setLoading(false)
        return
      }

      // Then fetch enrollments for this participant
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          program:programs(
            id,
            title,
            description,
            start_date,
            end_date,
            category
          )
        `)
        .eq('participant_id', (participant as any).id)
        .order('created_at', { ascending: false })
        .limit(3) // Show only 3 recent enrollments in dashboard

      if (error) {
        console.error('Error fetching enrollments:', error)
        setEnrollments([])
      } else {
        const rawEnrollments = data || []
        console.log('Raw enrollments from database:', rawEnrollments)
        
        // Filter out sample/test enrollments that might have been created by setup scripts
        const validEnrollments = rawEnrollments.filter((enrollment: any) => {
          // Skip enrollments that are clearly sample data
          if (enrollment.notes && (
            enrollment.notes.includes('Sample enrollment') ||
            enrollment.notes.includes('sample') ||
            enrollment.notes.includes('test') ||
            enrollment.notes.includes('Sample') ||
            enrollment.notes.includes('Test')
          )) {
            console.log('Filtering out sample enrollment by notes:', enrollment)
            return false
          }
          
          // Skip enrollments that were created very recently (within last 5 minutes) 
          // and have approved status - likely sample data
          const enrollmentTime = new Date(enrollment.created_at)
          const now = new Date()
          const timeDiff = now.getTime() - enrollmentTime.getTime()
          const minutesDiff = timeDiff / (1000 * 60)
          
          if (enrollment.status === 'approved' && minutesDiff < 5) {
            console.log('Filtering out recent approved enrollment (likely sample):', enrollment)
            return false
          }
          
          return true
        })
        
        console.log('Valid enrollments after filtering:', validEnrollments)
        
        // Additional check: if this is a new user and they have enrollments, 
        // but all enrollments are very recent (within 1 hour), they might be sample data
        const now = new Date()
        const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000))
        
        const hasRecentEnrollments = validEnrollments.some((enrollment: any) => {
          const enrollmentTime = new Date(enrollment.created_at)
          return enrollmentTime > oneHourAgo
        })
        
        const hasOldEnrollments = validEnrollments.some((enrollment: any) => {
          const enrollmentTime = new Date(enrollment.created_at)
          return enrollmentTime <= oneHourAgo
        })
        
        // Determine final enrollments to use
        let finalEnrollments = validEnrollments
        
        // For new users, be very aggressive about filtering
        if (participant && (participant as any).created_at) {
          const participantTime = new Date((participant as any).created_at)
          if (participantTime > oneHourAgo) {
            console.log('New participant detected - filtering out all enrollments as likely sample data')
            finalEnrollments = []
          } else if (hasRecentEnrollments && !hasOldEnrollments) {
            console.log('Filtering out all recent enrollments for participant with no old enrollments (likely all sample data)')
            finalEnrollments = []
          }
        }
        
        console.log('Final enrollments after aggressive filtering:', finalEnrollments)

        const statusPriority: Record<string, number> = {
          approved: 3,
          pending: 2,
          rejected: 1,
          cancelled: 1,
        }

        const enrollmentMap = new Map<string, any>()
        const enrollmentsWithoutProgram: any[] = []

        finalEnrollments.forEach((enrollment: any) => {
          const programId = enrollment.program?.id

          if (!programId) {
            enrollmentsWithoutProgram.push(enrollment)
            return
          }

          const existing = enrollmentMap.get(programId)

          if (!existing) {
            enrollmentMap.set(programId, enrollment)
            return
          }

          const existingStatus = (existing.status ?? '').toString().trim().toLowerCase()
          const newStatus = (enrollment.status ?? '').toString().trim().toLowerCase()

          const existingPriority = statusPriority[existingStatus as keyof typeof statusPriority] ?? 0
          const newPriority = statusPriority[newStatus as keyof typeof statusPriority] ?? 0

          if (newPriority > existingPriority) {
            enrollmentMap.set(programId, enrollment)
            return
          }

          if (newPriority === existingPriority) {
            const existingCreatedAt = new Date(existing.created_at).getTime()
            const newCreatedAt = new Date(enrollment.created_at).getTime()

            if (newCreatedAt > existingCreatedAt) {
              enrollmentMap.set(programId, enrollment)
            }
          }
        })

        const uniqueEnrollments = [...enrollmentMap.values(), ...enrollmentsWithoutProgram]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 3)

        console.log('Unique enrollments after removing duplicates:', uniqueEnrollments)
        
        // Calculate progress for each enrollment
        const enrollmentsWithProgress = await Promise.all(
          uniqueEnrollments.map(async (enrollment: any) => {
            if (!enrollment.program?.id || !profile?.id) {
              return { ...enrollment, progress: enrollment.progress || 0 }
            }

            try {
              // Get all classes for this program
              const { data: classes } = await supabase
                .from('classes')
                .select('id')
                .eq('program_id', enrollment.program.id)

              if (!classes || classes.length === 0) {
                return { ...enrollment, progress: enrollment.progress || 0 }
              }

              const classIds = classes.map((c: any) => c.id)

              // Get all required learning contents for these classes
              const { data: learningContents } = await supabase
                .from('learning_contents')
                .select('id')
                .in('class_id', classIds)
                .eq('status', 'published')
                .eq('is_required', true)

              if (!learningContents || learningContents.length === 0) {
                return { ...enrollment, progress: enrollment.progress || 0 }
              }

              const contentIds = learningContents.map((lc: any) => lc.id)

              // Get user progress for these contents
              const { data: progressData } = await supabase
                .from('learning_progress')
                .select('content_id, status')
                .eq('user_id', profile.id)
                .in('content_id', contentIds)

              // Calculate progress percentage
              const totalContents = learningContents.length
              const completedContents = (progressData || []).filter(
                (p: any) => p.status === 'completed'
              ).length

              const progressPercent = totalContents > 0
                ? Math.round((completedContents / totalContents) * 100)
                : 0

              return { ...enrollment, progress: progressPercent }
            } catch (error) {
              console.error('Error calculating progress:', error)
              return { ...enrollment, progress: enrollment.progress || 0 }
            }
          })
        )

        setEnrollments(enrollmentsWithProgress)
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error)
      setEnrollments([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'approved':
        return { label: 'Disetujui', color: 'bg-green-100 text-green-800', icon: CheckCircle }
      case 'completed':
        return { label: 'Selesai', color: 'bg-blue-100 text-blue-800', icon: CheckCircle }
      case 'pending':
        return { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
      case 'rejected':
        return { label: 'Ditolak', color: 'bg-red-100 text-red-800', icon: AlertCircle }
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-green-50 to-teal-50 px-6 py-4 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-gray-900">Kelas Terdaftar</h3>
              <p className="text-sm text-gray-600">Program yang sedang Anda ikuti</p>
            </div>
          </div>
          <Link 
            href="/my-enrollments" 
            className="group flex items-center justify-center space-x-2 px-4 py-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-green-600 hover:text-green-700 font-medium text-sm flex-shrink-0"
          >
            <span>Lihat Semua</span>
            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
      <div className="p-6">

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6">
              <div className="animate-pulse">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-xl"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-3 bg-gray-300 rounded w-1/4 mb-3"></div>
                <div className="h-3 bg-gray-300 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : enrollments.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada kelas terdaftar</h3>
          <p className="text-gray-600 mb-6">Mulai perjalanan belajar Anda dengan mendaftar program yang menarik!</p>
          <Link 
            href="/programs" 
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl hover:from-green-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Lihat Program Tersedia
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {enrollments.map((enrollment) => {
            const statusInfo = getStatusInfo(enrollment.status)
            const StatusIcon = statusInfo.icon

            return (
              <div key={enrollment.id} className="group bg-gradient-to-r from-white to-gray-50 rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-green-200">
                <div className="flex items-start space-x-3 sm:space-x-4 mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-base sm:text-lg group-hover:text-green-600 transition-colors mb-2">{enrollment.program?.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-2">{enrollment.program?.description}</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${statusInfo.color}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-4">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">
                      {(enrollment.program as any)?.registration_type === 'lifetime' || 
                       (enrollment.program?.start_date === enrollment.program?.end_date)
                        ? 'Lifetime' 
                        : `${formatDate(enrollment.program?.start_date)} - ${formatDate(enrollment.program?.end_date)}`
                      }
                    </span>
                  </div>
                  {enrollment.program?.category && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <BookOpen className="w-4 h-4" />
                      <span className="font-medium">{enrollment.program.category}</span>
                    </div>
                  )}
                </div>

                {(enrollment.status === 'approved' || enrollment.status === 'completed') && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl border border-green-100">
                    <div className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                      <span>Progress Pembelajaran</span>
                      <span className="text-green-600">{Math.min(100, Math.max(0, enrollment.progress || 0))}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-teal-500 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${Math.min(100, Math.max(0, enrollment.progress || 0))}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {(enrollment.status === 'approved' || enrollment.status === 'completed') && (
                      <Link
                        href={`/programs/${enrollment.program?.id}/classes`}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                      >
                        Akses Kelas
                      </Link>
                    )}
                    {enrollment.status === 'pending' && (
                      <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium">
                        Menunggu Persetujuan
                      </div>
                    )}
                    {enrollment.status === 'rejected' && (
                      <div className="px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium">
                        Daftar Ulang
                      </div>
                    )}
                  </div>
                  <Link 
                    href="/my-enrollments" 
                    className="text-gray-600 hover:text-gray-800 text-sm"
                  >
                    Detail
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}
