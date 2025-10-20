'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ProgramWithClasses } from '@/types'
import { ClassManagement } from '@/components/programs/ClassManagement'
import { Plus, Search, Edit, Trash2, GraduationCap, Calendar, Users, BookOpen, X, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDate, formatCurrency } from '@/lib/utils'
import { useAuth } from '@/components/AuthProvider'

export default function ProgramsPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [programs, setPrograms] = useState<ProgramWithClasses[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProgram, setSelectedProgram] = useState<ProgramWithClasses | null>(null)
  const [userEnrollments, setUserEnrollments] = useState<any[]>([])
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [enrollmentsLoading, setEnrollmentsLoading] = useState<boolean>(true)
  const [enrollmentMap, setEnrollmentMap] = useState<Record<string, string>>({})
  
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
        .select('program_id, status')
        .eq('participant_id', (participant as any).id)

      if (error) {
        console.error('Error fetching user enrollments:', error)
        setEnrollmentsLoading(false)
        return
      }

      const list = data || []
      setUserEnrollments(list)
      try { localStorage.setItem('tc_user_enrollments', JSON.stringify(list)) } catch {}
      // Build in-memory map so UI renders from a single source of truth
      const map: Record<string, string> = {}
      list.forEach((e: any) => {
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

  async function deleteProgram(id: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus program ini?')) return

    try {
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchPrograms()
    } catch (error) {
      console.error('Error deleting program:', error)
      alert('Gagal menghapus program')
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
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isAdminOrManager ? 'Manajemen Program' : 'Daftar Program'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isAdminOrManager ? 'Kelola program dan kegiatan training' : 'Lihat dan daftar program training yang tersedia'}
          </p>
        </div>
        {isAdminOrManager && (
          <Link href="/programs/new" className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <Plus className="w-5 h-5 mr-2" />
            <span>Tambah Program</span>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari program..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Belum ada program tersedia</p>
            <Link href="/programs/new" className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors mt-4">
              Tambah Program Pertama
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrograms.map((program) => (
              <div key={program.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <span className={getStatusBadge(program.status)}>
                    {program.status}
                  </span>
                  <div className="flex items-center space-x-2">
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
                          onClick={() => deleteProgram(program.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Program"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      (() => {
                        const enrollmentStatus = enrollmentMap[String(program.id).trim().toLowerCase()] || getUserEnrollmentStatus(program.id)
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
                              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                            >
                              Daftar
                            </Link>
                          )
                        }
                      })()
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">{program.title}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{program.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    <span>{program.category}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{formatDate(program.start_date)} - {formatDate(program.end_date)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span>Max {program.max_participants} peserta</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Harga</span>
                    <span className="text-lg font-bold text-primary-600">
                      {formatCurrency(program.price)}
                    </span>
                  </div>
                  
                  {program.classes && program.classes.length > 0 ? (
                    <div className="mb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Kelas Tersedia</span>
                        <span className="text-sm font-medium text-gray-900">
                          {program.classes.length} kelas
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Total kuota: {program.classes.reduce((sum, cls) => sum + cls.max_participants, 0)} peserta
                      </div>
                    </div>
                  ) : (
                    <div className="mb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Kelas Tersedia</span>
                        <span className="text-sm font-medium text-gray-500">
                          Belum ada kelas
                        </span>
                      </div>
                    </div>
                  )}

                  {program.trainer && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">Trainer: {program.trainer.name}</span>
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

