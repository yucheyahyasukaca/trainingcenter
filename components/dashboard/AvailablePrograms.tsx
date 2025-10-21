'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { 
  GraduationCap, 
  Clock, 
  Users, 
  Star,
  Calendar,
  BookOpen,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatCurrency } from '@/lib/utils'

export function AvailablePrograms() {
  const { profile } = useAuth()
  const [programs, setPrograms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userEnrollments, setUserEnrollments] = useState<any[]>([])
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [enrollmentsLoading, setEnrollmentsLoading] = useState<boolean>(true)
  const [enrollmentMap, setEnrollmentMap] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchPrograms()
    if (profile?.role === 'user') {
      // hydrate from cache first to avoid flicker to "Daftar"
      try {
        const cachedMap = sessionStorage.getItem('tc_enrollment_map')
        if (cachedMap) {
          setEnrollmentMap(JSON.parse(cachedMap))
        }
        const cached = localStorage.getItem('tc_user_enrollments')
        if (cached) {
          setUserEnrollments(JSON.parse(cached))
          setEnrollmentsLoading(true) // still revalidate
        }
      } catch {}
      fetchUserEnrollments()
    }
  }, [profile])

  // Fallback: fetch enrollments using auth user directly (in case profile not ready yet)
  useEffect(() => {
    (async () => {
      if (profile?.role) return // primary effect will handle
      try {
        const { data: authData } = await supabase.auth.getUser()
        const userId = authData?.user?.id
        if (!userId) return
        setEnrollmentsLoading(true)
        const { data: participant } = await supabase
          .from('participants')
          .select('id')
          .eq('user_id', userId)
          .single()
        if (!(participant as any)?.id) {
          setEnrollmentsLoading(false)
          return
        }
        const { data } = await supabase
          .from('enrollments')
          .select('program_id, status')
          .eq('participant_id', (participant as any).id)
        const list = data || []
        const map: Record<string, string> = {}
        list.forEach((e: any) => { if (e?.program_id) map[e.program_id] = e.status })
        setEnrollmentMap(map)
        setUserEnrollments(list)
        setEnrollmentsLoading(false)
      } catch {
        setEnrollmentsLoading(false)
      }
    })()
  }, [])

  // Realtime: listen for enrollment changes for this user
  useEffect(() => {
    if (!participantId) return
    const channel = (supabase as any)
      .channel('enrollments-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'enrollments', filter: `participant_id=eq.${participantId}` },
        () => {
          fetchUserEnrollments()
        }
      )
      .subscribe()
    return () => {
      try { (supabase as any).removeChannel(channel) } catch {}
    }
  }, [participantId])

  async function fetchPrograms() {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          classes:classes(*)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(3) // Show only 3 recent programs in dashboard

      if (error) {
        console.error('Error fetching programs:', error)
        setPrograms([])
      } else {
        setPrograms(data || [])
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
      setPrograms([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchUserEnrollments() {
    try {
      if (!profile?.id) {
        console.log('No profile ID available for enrollment check')
        setUserEnrollments([])
        setEnrollmentsLoading(false)
        return
      }

      setEnrollmentsLoading(true)
      console.log('Fetching enrollments for user:', profile.id)

      // First, get the participant record for this user
      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .select('id, created_at')
        .eq('user_id', profile.id)
        .single()

      if (participantError || !participant) {
        console.log('No participant record found for user:', participantError?.message)
        setUserEnrollments([])
        setEnrollmentsLoading(false)
        return
      }

      console.log('Found participant:', participant)

      if ((participant as any)?.id && (participant as any)?.id !== participantId) {
        setParticipantId((participant as any).id)
      }

      // Then fetch enrollments for this participant
      const { data, error } = await supabase
        .from('enrollments')
        .select('program_id, status, created_at, notes')
        .eq('participant_id', (participant as any).id)

      if (error) {
        console.error('Error fetching user enrollments:', error)
        setEnrollmentsLoading(false)
        return
      }

      const list = data || []
      console.log('Raw enrollments from database:', list)
      
      // Filter out sample/test enrollments that might have been created by setup scripts
      const validEnrollments = list.filter((enrollment: any) => {
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
        
        // For new users (participant created recently), be more aggressive about filtering
        const participantTime = new Date(participant.created_at)
        const participantTimeDiff = now.getTime() - participantTime.getTime()
        const participantMinutesDiff = participantTimeDiff / (1000 * 60)
        
        // If participant was created in the last 10 minutes, filter out all enrollments
        // as they are likely sample data
        if (participantMinutesDiff < 10) {
          console.log('Filtering out all enrollments for new participant (likely sample data):', enrollment)
          return false
        }
        
        return true
      })

      console.log('Valid enrollments after filtering:', validEnrollments)
      
      // Additional check: if this is a new user and they have enrollments, 
      // but all enrollments are very recent (within 1 hour), they might be sample data
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000))
      const participantTime = new Date(participant.created_at)
      
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
      if (participantTime > oneHourAgo) {
        console.log('New participant detected - filtering out all enrollments as likely sample data')
        finalEnrollments = []
      } else if (hasRecentEnrollments && !hasOldEnrollments) {
        console.log('Filtering out all recent enrollments for participant with no old enrollments (likely all sample data)')
        finalEnrollments = []
      }
      
      setUserEnrollments(finalEnrollments)
      try { localStorage.setItem('tc_user_enrollments', JSON.stringify(finalEnrollments)) } catch {}
      
      // Build in-memory map so UI renders from a single source of truth
      const map: Record<string, string> = {}
      finalEnrollments.forEach((e: any) => {
        const key = String(e?.program_id || '').trim().toLowerCase()
        if (key) map[key] = e.status
      })
      setEnrollmentMap(map)
      try { sessionStorage.setItem('tc_enrollment_map', JSON.stringify(map)) } catch {}
      setEnrollmentsLoading(false)
    } catch (error) {
      console.error('Error fetching user enrollments:', error)
      setEnrollmentsLoading(false)
    }
  }

  const getUserEnrollmentStatus = (programId: string) => {
    const enrollment = userEnrollments.find(e => e.program_id === programId)
    return enrollment ? enrollment.status : null
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner':
        return 'bg-green-100 text-green-800'
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'Advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Leadership':
        return 'bg-purple-100 text-purple-800'
      case 'Marketing':
        return 'bg-blue-100 text-blue-800'
      case 'Technology':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Program Tersedia</h3>
        <Link 
          href="/programs" 
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
      ) : programs.length === 0 ? (
        <div className="text-center py-8">
          <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">Belum ada program tersedia</p>
          <Link 
            href="/programs" 
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            Lihat Program
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {programs.map((program) => (
            <div key={program.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold text-gray-900">{program.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(program.category)}`}>
                      {program.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{program.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(program.start_date)} - {formatDate(program.end_date)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>Max {program.max_participants} peserta</span>
                    </div>
                    {program.classes && program.classes.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{program.classes.length} kelas</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary-600">{formatCurrency(program.price)}</p>
                  <p className="text-sm text-gray-600">Mulai: {formatDate(program.start_date)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {(() => {
                    const enrollmentStatus = enrollmentMap[String(program.id).trim().toLowerCase()] || getUserEnrollmentStatus(program.id)
                    
                    // Extra protection: if user has no enrollments at all, always show "Daftar Sekarang"
                    if (userEnrollments.length === 0) {
                      return (
                        <Link
                          href={`/programs/${program.id}/enroll`}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                        >
                          Daftar Sekarang
                        </Link>
                      )
                    }
                    
                    if (enrollmentStatus === 'pending') {
                      return (
                        <div className="px-4 py-2 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-lg text-center">
                          Menunggu Persetujuan
                        </div>
                      )
                    } else if (enrollmentStatus === 'approved') {
                      return (
                        <div className="px-4 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-lg text-center">
                          Sudah Terdaftar
                        </div>
                      )
                    } else if (enrollmentStatus === 'rejected') {
                      return (
                        <div className="px-4 py-2 bg-red-100 text-red-800 text-sm font-medium rounded-lg text-center">
                          Daftar Ulang
                        </div>
                      )
                    } else if (enrollmentsLoading) {
                      return (
                        <div className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg text-center">
                          Memuat...
                        </div>
                      )
                    } else {
                      return (
                        <Link
                          href={`/programs/${program.id}/enroll`}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                        >
                          Daftar Sekarang
                        </Link>
                      )
                    }
                  })()}
                  <Link
                    href={`/programs/${program.id}`}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Detail
                  </Link>
                </div>
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(program.start_date)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
