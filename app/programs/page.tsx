'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ProgramWithClasses } from '@/types'
import { ClassManagement } from '@/components/programs/ClassManagement'
import { Plus, Search, Edit, Trash2, GraduationCap, Calendar, Users, BookOpen, X, UserPlus, UserCheck, Clock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDate, formatCurrency } from '@/lib/utils'
import { useAuth } from '@/components/AuthProvider'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { useToastContext } from '@/components/ToastProvider'

export default function ProgramsPage() {
  const { profile } = useAuth()
  const { error } = useToastContext()
  const router = useRouter()
  const [programs, setPrograms] = useState<ProgramWithClasses[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProgram, setSelectedProgram] = useState<ProgramWithClasses | null>(null)
  const [userEnrollments, setUserEnrollments] = useState<any[]>([])
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [enrollmentsLoading, setEnrollmentsLoading] = useState<boolean>(true)
  const [enrollmentMap, setEnrollmentMap] = useState<Record<string, string>>({})
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    programId: string | null
    programTitle: string
    isLoading: boolean
  }>({
    isOpen: false,
    programId: null,
    programTitle: '',
    isLoading: false
  })
  
  const isAdminOrManager = profile?.role === 'admin' || profile?.role === 'manager'

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

  // Refresh enrollment status when the user returns to this tab/page
  useEffect(() => {
    const onFocus = () => {
      if (profile?.role === 'user') {
        fetchUserEnrollments()
      }
      try { router.refresh() } catch {}
    }
    const onVisibility = () => {
      if (!document.hidden && profile?.role === 'user') {
        fetchUserEnrollments()
      }
      try { router.refresh() } catch {}
    }
    // Handle browser back/forward cache and history navigation
    const onPageShow = () => {
      if (profile?.role === 'user') {
        fetchUserEnrollments()
        // re-check shortly after in case transaction just committed
        setTimeout(fetchUserEnrollments, 600)
        setTimeout(fetchUserEnrollments, 1500)
      }
      try { router.refresh() } catch {}
    }
    window.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onFocus)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [profile?.id])

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
      console.log('🔄 Fetching programs...')
      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          classes:classes(*)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching programs:', error)
        throw error
      }
      
      console.log('✅ Programs fetched:', data?.length || 0)
      console.log('📊 Programs with classes:', (data as any)?.map((p: any) => ({
        title: p.title,
        classCount: p.classes?.length || 0
      })))
      setPrograms(data || [])
    } catch (error) {
      console.error('❌ Error fetching programs:', error)
      setPrograms([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchUserEnrollments() {
    try {
      if (!profile?.id) return
      setEnrollmentsLoading(true)

      // First, get the participant record for this user
      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .select('id')
        .eq('user_id', profile.id)
        .single()

      if (participantError || !participant) {
        console.log('No participant record found for user')
        setUserEnrollments([])
        setEnrollmentsLoading(false)
        return
      }

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

  function openDeleteModal(id: string, title: string) {
    setDeleteModal({
      isOpen: true,
      programId: id,
      programTitle: title,
      isLoading: false
    })
  }

  function closeDeleteModal() {
    setDeleteModal({
      isOpen: false,
      programId: null,
      programTitle: '',
      isLoading: false
    })
  }

  async function confirmDeleteProgram() {
    if (!deleteModal.programId) return

    setDeleteModal(prev => ({ ...prev, isLoading: true }))

    try {
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', deleteModal.programId)

      if (error) throw error
      
      fetchPrograms()
      closeDeleteModal()
    } catch (error) {
      console.error('Error deleting program:', error)
      error('Gagal menghapus program', 'Error')
      setDeleteModal(prev => ({ ...prev, isLoading: false }))
    }
  }

  const getUserEnrollmentStatus = (programId: string) => {
    const enrollment = userEnrollments.find(e => e.program_id === programId)
    return enrollment ? enrollment.status : null
  }

  const filteredPrograms = programs.filter((program) =>
    program.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      draft: 'px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full',
      published: 'px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full',
      archived: 'px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full',
    }
    return badges[status] || 'px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full'
  }

  if (selectedProgram) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSelectedProgram(null)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Manajemen Kelas</h1>
                  <p className="text-gray-600 mt-1">Program: {selectedProgram.title}</p>
                </div>
              </div>
            </div>
            <ClassManagement programId={selectedProgram.id} programTitle={selectedProgram.title} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isAdminOrManager ? 'Manajemen Program' : 'Program Training'}
              </h1>
              <p className="text-gray-600 mt-2">
                {isAdminOrManager ? 'Kelola program dan kegiatan training' : 'Temukan program training yang sesuai untuk Anda'}
              </p>
            </div>
            
            {isAdminOrManager && (
              <Link 
                href="/programs/new" 
                className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                Tambah Program
              </Link>
            )}
          </div>
          
          {/* Search Bar */}
          <div className="mt-6 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari program training..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3 mb-4"></div>
                  <div className="flex items-center justify-between">
                    <div className="h-6 bg-gray-300 rounded w-20"></div>
                    <div className="h-8 bg-gray-300 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum ada program tersedia</h3>
            <p className="text-gray-600 mb-6">
              {isAdminOrManager ? 'Mulai buat program training pertama Anda' : 'Program training akan segera hadir'}
            </p>
            {isAdminOrManager && (
              <Link 
                href="/programs/new" 
                className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                Tambah Program Pertama
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrograms.map((program) => (
              <div key={program.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      program.status === 'published' ? 'bg-green-100 text-green-800' :
                      program.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {program.status === 'published' ? 'Aktif' : 
                       program.status === 'draft' ? 'Draft' : 'Arsip'}
                    </span>
                    
                    <div className="flex items-center space-x-1">
                      {isAdminOrManager ? (
                        <>
                          <button
                            onClick={() => setSelectedProgram(program)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Kelola Kelas"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/programs/${program.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Program"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => openDeleteModal(program.id, program.title)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Program"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        (() => {
                          const enrollmentStatus = enrollmentMap[String(program.id).trim().toLowerCase()] || getUserEnrollmentStatus(program.id)
                          
                          if (userEnrollments.length === 0) {
                            return (
                              <Link
                                href={`/programs/${program.id}/enroll`}
                                className="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                              >
                                Daftar
                              </Link>
                            )
                          }
                          
                          if (enrollmentStatus === 'pending') {
                            return (
                              <div className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-lg text-center">
                                Menunggu
                              </div>
                            )
                          } else if (enrollmentStatus === 'approved') {
                            return (
                              <div className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-lg text-center">
                                Terdaftar
                              </div>
                            )
                          } else if (enrollmentStatus === 'rejected') {
                            return (
                              <div className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-lg text-center">
                                Daftar Ulang
                              </div>
                            )
                          } else if (enrollmentsLoading) {
                            return (
                              <div className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg text-center">
                                Memuat...
                              </div>
                            )
                          } else {
                            return (
                              <Link
                                href={`/programs/${program.id}/enroll`}
                                className="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                              >
                                Daftar
                              </Link>
                            )
                          }
                        })()
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{program.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{program.description}</p>

                  {/* Program Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <GraduationCap className="w-4 h-4 mr-2 text-red-500" />
                      <span>{program.category}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-red-500" />
                      <span>
                        {program.registration_type === 'lifetime' || 
                         (program.start_date === program.end_date)
                          ? 'Lifetime' 
                          : `${formatDate(program.start_date)} - ${formatDate(program.end_date)}`
                        }
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2 text-red-500" />
                      <span>
                        {program.max_participants === null || program.max_participants === undefined 
                          ? 'Unlimited peserta' 
                          : `Max ${program.max_participants} peserta`
                        }
                      </span>
                    </div>
                    {program.classes && program.classes.length > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <BookOpen className="w-4 h-4 mr-2 text-red-500" />
                        <span>{program.classes.length} kelas tersedia</span>
                      </div>
                    )}
                  </div>

                  {/* Price & Action */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-600">Harga</span>
                      <span className="text-xl font-bold text-red-600">
                        {formatCurrency(program.price)}
                      </span>
                    </div>
                    
                    {!isAdminOrManager && (
                      <Link
                        href={`/programs/${program.id}/enroll`}
                        className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
                        <GraduationCap className="w-4 h-4 mr-2" />
                        Daftar Sekarang
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteProgram}
        title="Hapus Program"
        message={`Apakah Anda yakin ingin menghapus program "${deleteModal.programTitle}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteModal.isLoading}
      />
    </div>
  )
}

