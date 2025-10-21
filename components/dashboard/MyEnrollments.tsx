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
        .single()

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Kelas Terdaftar</h3>
        <Link 
          href="/my-enrollments" 
          className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
        >
          Lihat Semua
          <ExternalLink className="w-3 h-3 ml-1" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : enrollments.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">Belum ada kelas terdaftar</p>
          <Link 
            href="/programs" 
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            Lihat Program Tersedia
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {enrollments.map((enrollment) => {
            const statusInfo = getStatusInfo(enrollment.status)
            const StatusIcon = statusInfo.icon

            return (
              <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{enrollment.program?.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{enrollment.program?.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                    <StatusIcon className="w-3 h-3 inline mr-1" />
                    {statusInfo.label}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Mulai: {formatDate(enrollment.program?.start_date)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Selesai: {formatDate(enrollment.program?.end_date)}</span>
                    </div>
                  </div>
                  {enrollment.program?.category && (
                    <div className="flex items-center space-x-1 text-blue-600">
                      <BookOpen className="w-4 h-4" />
                      <span className="text-sm font-medium">{enrollment.program.category}</span>
                    </div>
                  )}
                </div>

                {enrollment.status === 'approved' && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{Math.min(100, Math.max(0, enrollment.progress || 0))}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
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
  )
}
