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
  ExternalLink,
  UserCheck,
  X
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
          .maybeSingle()
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
        .maybeSingle()

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
        const participantTime = new Date((participant as any).created_at)
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
      const participantTime = new Date((participant as any).created_at)
      
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
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-red-50 to-red-100 px-6 py-4 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-gray-900">Program Tersedia</h3>
              <p className="text-sm text-gray-600">Temukan program yang sesuai untuk Anda</p>
            </div>
          </div>
          <Link 
            href="/programs" 
            className="group flex items-center justify-center space-x-2 px-4 py-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-red-600 hover:text-red-700 font-medium text-sm flex-shrink-0"
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
      ) : programs.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada program tersedia</h3>
          <p className="text-gray-600 mb-6">Program baru akan segera hadir. Pantau terus untuk update terbaru!</p>
          <Link 
            href="/programs" 
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
          >
            <GraduationCap className="w-4 h-4 mr-2" />
            Lihat Program
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {programs.map((program) => (
            <div key={program.id} className="group bg-gradient-to-r from-white to-gray-50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-red-200">
              {/* Header Section */}
              <div className="flex flex-col lg:flex-row lg:items-start space-y-4 lg:space-y-0 lg:space-x-4 mb-4">
                <div className="flex items-start space-x-4 flex-1">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0 mb-2">
                      <h4 className="font-bold text-gray-900 text-lg group-hover:text-red-600 transition-colors">{program.title}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold w-fit ${getCategoryColor(program.category)}`}>
                        {program.category}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2 leading-relaxed">{program.description}</p>
                  </div>
                </div>
                
                {/* Price and Action Section - Single row */}
                <div className="flex items-center space-x-4 lg:min-w-[300px]">
                  <div className="text-right">
                    <p className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">{formatCurrency(program.price)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {program.registration_type === 'lifetime' 
                        ? 'Pendaftaran Lifetime' 
                        : `Mulai ${formatDate(program.registration_start_date)}`
                      }
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {(() => {
                      const enrollmentStatus = enrollmentMap[String(program.id).trim().toLowerCase()] || getUserEnrollmentStatus(program.id)
                      
                      // Check if program has available classes
                      const hasAvailableClasses = program.classes && program.classes.length > 0
                      
                      if (!hasAvailableClasses) {
                        return (
                          <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-medium text-sm">
                            <X className="w-4 h-4" />
                            <span>Belum ada kelas yang dibuka</span>
                          </div>
                        )
                      }
                      
                      // Extra protection: if user has no enrollments at all, always show "Daftar Sekarang"
                      if (userEnrollments.length === 0) {
                        return (
                          <Link
                            href={`/programs/${program.id}/enroll`}
                            className="group flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-sm"
                          >
                            <GraduationCap className="w-4 h-4" />
                            <span>Daftar Sekarang</span>
                          </Link>
                        )
                      }
                      
                      if (enrollmentStatus === 'pending') {
                        return (
                          <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 rounded-xl font-medium border border-yellow-200 text-sm">
                            <Clock className="w-4 h-4" />
                            <span>Menunggu Persetujuan</span>
                          </div>
                        )
                      } else if (enrollmentStatus === 'approved') {
                        return (
                          <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-xl font-medium border border-green-200 text-sm">
                            <UserCheck className="w-4 h-4" />
                            <span>Sudah Terdaftar</span>
                          </div>
                        )
                      } else if (enrollmentStatus === 'rejected') {
                        return (
                          <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-100 to-pink-100 text-red-800 rounded-xl font-medium border border-red-200 text-sm">
                            <X className="w-4 h-4" />
                            <span>Daftar Ulang</span>
                          </div>
                        )
                      } else if (enrollmentsLoading) {
                        return (
                          <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-medium text-sm">
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                            <span>Memuat...</span>
                          </div>
                        )
                      } else {
                        return (
                          <Link
                            href={`/programs/${program.id}/enroll`}
                            className="group flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-sm"
                          >
                            <GraduationCap className="w-4 h-4" />
                            <span>Daftar Sekarang</span>
                          </Link>
                        )
                      }
                    })()}
                  </div>
                </div>
              </div>

              {/* Program Details */}
              <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Calendar className="w-4 h-4 text-red-500" />
                  <span className="font-medium">
                    {program.registration_type === 'lifetime' || 
                     (program.start_date === program.end_date)
                      ? 'Lifetime' 
                      : `${formatDate(program.start_date)} - ${formatDate(program.end_date)}`
                    }
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Users className="w-4 h-4 text-green-500" />
                  <span className="font-medium">
                    {program.max_participants === null || program.max_participants === undefined 
                      ? 'Unlimited peserta' 
                      : `${program.max_participants} peserta`
                    }
                  </span>
                </div>
                {program.classes && program.classes.length > 0 && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <BookOpen className="w-4 h-4 text-purple-500" />
                    <span className="font-medium">{program.classes.length} kelas</span>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
