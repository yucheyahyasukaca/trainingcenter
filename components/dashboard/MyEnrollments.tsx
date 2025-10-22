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
        if (participant && participant.created_at) {
          const participantTime = new Date(participant.created_at)
          if (participantTime > oneHourAgo) {
            console.log('New participant detected - filtering out all enrollments as likely sample data')
            finalEnrollments = []
          } else if (hasRecentEnrollments && !hasOldEnrollments) {
            console.log('Filtering out all recent enrollments for participant with no old enrollments (likely all sample data)')
            finalEnrollments = []
          }
        }
        
        console.log('Final enrollments after aggressive filtering:', finalEnrollments)
        setEnrollments(finalEnrollments)
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Kelas Terdaftar</h3>
              <p className="text-sm text-gray-600">Program yang sedang Anda ikuti</p>
            </div>
          </div>
          <Link 
            href="/my-enrollments" 
            className="group flex items-center space-x-2 px-4 py-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-green-600 hover:text-green-700 font-medium text-sm"
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
              <div key={enrollment.id} className="group bg-gradient-to-r from-white to-gray-50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-green-200">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-bold text-gray-900 text-lg group-hover:text-green-600 transition-colors">{enrollment.program?.title}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3 inline mr-1" />
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-gray-600 line-clamp-2 leading-relaxed">{enrollment.program?.description}</p>
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

                {enrollment.status === 'approved' && (
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
                    {enrollment.status === 'approved' && (
                      <Link
                        href={`/programs/${enrollment.program?.id}`}
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
