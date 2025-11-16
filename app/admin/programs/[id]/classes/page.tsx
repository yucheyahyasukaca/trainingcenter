'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Edit, Trash2, Users, Calendar, Clock, MapPin, UserCheck, BookOpen, FileText, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatTime } from '@/lib/utils'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/hooks/useToast'
import { ClassManagement } from '@/components/programs/ClassManagement'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'

interface ClassWithTrainers {
  id: string
  name: string
  description: string | null
  start_date: string
  end_date: string
  start_time: string | null
  end_time: string | null
  max_participants: number | null
  current_participants: number
  location: string | null
  room: string | null
  status: string
  program_id: string
  trainers?: Array<{
    id: string
    trainer_id: string
    is_primary: boolean
    trainer?: {
      id: string
      name: string
      email: string
    }
  }>
}

export default function AdminProgramClassesPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { profile } = useAuth()
  const addToast = useToast()
  const [program, setProgram] = useState<any>(null)
  const [classes, setClasses] = useState<ClassWithTrainers[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    classId: string | null
    className: string
    isLoading: boolean
  }>({
    isOpen: false,
    classId: null,
    className: '',
    isLoading: false
  })

  useEffect(() => {
    // Check if user is admin or manager
    if (profile && profile.role !== 'admin' && profile.role !== 'manager') {
      router.push('/programs')
      return
    }

    if (profile?.role === 'admin' || profile?.role === 'manager') {
      fetchData()
    }
  }, [params.id, profile, router])

  async function fetchData() {
    try {
      setLoading(true)

      // Fetch program
      const { data: programData, error: programError } = await supabase
        .from('programs')
        .select('*')
        .eq('id', params.id)
        .single()

      if (programError) {
        console.error('Program fetch error:', programError)
        throw new Error(`Gagal memuat program: ${programError.message}`)
      }
      setProgram(programData)

      // Fetch all classes for this program (simpler query first)
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .eq('program_id', params.id)
        .order('created_at', { ascending: false })

      if (classesError) {
        console.error('Classes fetch error:', classesError)
        throw new Error(`Gagal memuat kelas: ${classesError.message}`)
      }

      // Fetch class trainers separately for each class
      const classIds = (classesData || []).map((cls: any) => cls.id)
      console.log('🔍 Class IDs to fetch trainers for:', classIds)
      
      let classTrainersMap = new Map()
      if (classIds.length > 0) {
        const { data: trainersData, error: trainersError } = await supabase
          .from('class_trainers')
          .select('id, class_id, trainer_id, is_primary')
          .in('class_id', classIds)

        console.log('🔍 Raw class_trainers data:', trainersData)
        console.log('🔍 Class trainers error:', trainersError)

        if (trainersError) {
          console.error('Class trainers fetch error:', trainersError)
          // Continue even if trainers fetch fails
        } else {
          // Group trainers by class_id
          trainersData?.forEach((ct: any) => {
            if (!classTrainersMap.has(ct.class_id)) {
              classTrainersMap.set(ct.class_id, [])
            }
            classTrainersMap.get(ct.class_id).push(ct)
          })

          console.log('🔍 Class trainers map:', Array.from(classTrainersMap.entries()))

          // Fetch trainer details - try both user_profiles and trainers tables
          const trainerIds = [...new Set(trainersData?.map((ct: any) => ct.trainer_id).filter(Boolean) || [])]
          console.log('🔍 Trainer IDs to fetch:', trainerIds)
          
          if (trainerIds.length > 0) {
            // Try user_profiles first (most common case)
            const { data: trainerDetailsFromUserProfiles, error: userProfilesError } = await supabase
              .from('user_profiles')
              .select('id, full_name, email')
              .in('id', trainerIds)

            console.log('🔍 Trainer details from user_profiles:', trainerDetailsFromUserProfiles)
            console.log('🔍 User profiles error:', userProfilesError)

            // Try trainers table as fallback
            const { data: trainerDetailsFromTrainers, error: trainersTableError } = await supabase
              .from('trainers')
              .select('id, name, email, user_id')
              .in('id', trainerIds)

            console.log('🔍 Trainer details from trainers table:', trainerDetailsFromTrainers)
            console.log('🔍 Trainers table error:', trainersTableError)

            // Build trainer map from both sources
            const trainerMap = new Map()
            
            // Add from user_profiles
            if (trainerDetailsFromUserProfiles) {
              trainerDetailsFromUserProfiles.forEach((t: any) => {
                trainerMap.set(t.id, { id: t.id, name: t.full_name, email: t.email })
              })
            }
            
            // Add from trainers table (if not already in map)
            if (trainerDetailsFromTrainers) {
              trainerDetailsFromTrainers.forEach((t: any) => {
                if (!trainerMap.has(t.id)) {
                  trainerMap.set(t.id, { id: t.id, name: t.name, email: t.email })
                }
              })
            }

            console.log('🔍 Final trainer map:', Array.from(trainerMap.entries()))
            
            // Attach trainer details to class trainers
            classTrainersMap.forEach((trainers, classId) => {
              trainers.forEach((ct: any) => {
                ct.trainer = trainerMap.get(ct.trainer_id) || null
                console.log(`🔍 Attaching trainer to class ${classId}:`, {
                  trainer_id: ct.trainer_id,
                  trainer: ct.trainer
                })
              })
            })
          } else {
            console.warn('⚠️ No trainer IDs found in class_trainers data')
          }
        }
      }

      // Fetch participant counts for each class from enrollments
      const classParticipantCounts = new Map()
      if (classIds.length > 0) {
        try {
          // Fetch all enrollments for these classes in one query
          const { data: enrollmentsData, error: enrollmentsError } = await supabase
            .from('enrollments')
            .select('class_id')
            .in('class_id', classIds)
            .in('status', ['pending', 'approved', 'completed'])

          if (enrollmentsError) {
            console.error('Error fetching enrollments:', enrollmentsError)
          } else if (enrollmentsData) {
            // Count participants per class
            enrollmentsData.forEach((enrollment: any) => {
              if (enrollment.class_id) {
                const currentCount = classParticipantCounts.get(enrollment.class_id) || 0
                classParticipantCounts.set(enrollment.class_id, currentCount + 1)
              }
            })
            
            console.log('Participant counts:', Array.from(classParticipantCounts.entries()))
            console.log('Total enrollments found:', enrollmentsData.length)
          }
        } catch (countError) {
          console.error('Error fetching participant counts:', countError)
          // Continue with 0 counts if there's an error
        }
      }

      // Transform data
      const transformedClasses = (classesData || []).map((cls: any) => ({
        ...cls,
        trainers: classTrainersMap.get(cls.id) || [],
        current_participants: classParticipantCounts.get(cls.id) || 0
      }))

      console.log('📋 Transformed classes with trainers:', transformedClasses.map((c: any) => ({
        id: c.id,
        name: c.name,
        trainersCount: c.trainers?.length || 0,
        trainers: c.trainers?.map((t: any) => ({
          id: t.id,
          trainer_id: t.trainer_id,
          trainer_name: t.trainer?.name,
          trainer_email: t.trainer?.email
        }))
      })))

      setClasses(transformedClasses)
    } catch (error: any) {
      console.error('Error fetching data:', error)
      addToast.error(error.message || 'Gagal memuat data kelas', 'Error')
    } finally {
      setLoading(false)
    }
  }

  function openDeleteModal(classId: string, className: string) {
    setDeleteModal({
      isOpen: true,
      classId,
      className,
      isLoading: false
    })
  }

  function closeDeleteModal() {
    setDeleteModal({
      isOpen: false,
      classId: null,
      className: '',
      isLoading: false
    })
  }

  async function confirmDeleteClass() {
    if (!deleteModal.classId) return

    setDeleteModal(prev => ({ ...prev, isLoading: true }))

    try {
      // Delete class trainers first
      const { error: trainersError } = await supabase
        .from('class_trainers')
        .delete()
        .eq('class_id', deleteModal.classId)

      if (trainersError) {
        console.error('Error deleting class trainers:', trainersError)
      }

      // Delete class
      const { error: classError } = await supabase
        .from('classes')
        .delete()
        .eq('id', deleteModal.classId)

      if (classError) throw classError

      addToast.success('Kelas berhasil dihapus', 'Berhasil')
      closeDeleteModal()
      fetchData()
    } catch (error: any) {
      console.error('Error deleting class:', error)
      addToast.error('Gagal menghapus kelas: ' + error.message, 'Error')
      setDeleteModal(prev => ({ ...prev, isLoading: false }))
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      scheduled: 'px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full',
      ongoing: 'px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full',
      completed: 'px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full',
      cancelled: 'px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full',
    }
    return badges[status] || 'px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full'
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      scheduled: 'Dijadwalkan',
      ongoing: 'Berlangsung',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
    }
    return texts[status] || status
  }

  // Filter classes based on search query
  const filteredClasses = classes.filter((classItem) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      classItem.name.toLowerCase().includes(searchLower) ||
      classItem.description?.toLowerCase().includes(searchLower) ||
      classItem.location?.toLowerCase().includes(searchLower) ||
      classItem.trainers?.some((t) => t.trainer?.name?.toLowerCase().includes(searchLower))
    )
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentClasses = filteredClasses.slice(startIndex, endIndex)

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  // Show loading or redirect for non-admin
  if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link 
          href="/admin/programs" 
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Program</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manajemen Kelas</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {program?.title || 'Program'}
            </p>
          </div>
        </div>
      </div>

      {/* Class Management Component */}
      {program && (
        <div id="class-management-section" className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <ClassManagement
            programId={params.id}
            programTitle={program.title}
            currentUserId={profile.id}
            isTrainerMode={false}
          />
        </div>
      )}

      {/* All Classes List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Semua Kelas Program</h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Total: {filteredClasses.length} dari {classes.length} kelas
            </div>
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm w-64"
              />
            </div>
          </div>
        </div>

        {classes.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Belum ada kelas untuk program ini</p>
            <p className="text-sm text-gray-500 mb-4">
              Trainer dapat membuat kelas melalui halaman Trainer Classes, atau Anda dapat menambah kelas menggunakan form di atas.
            </p>
            <button
              onClick={() => {
                document.getElementById('class-management-section')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Kelas
            </button>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Tidak ada kelas yang ditemukan</p>
            <p className="text-sm text-gray-500">
              Coba ubah kata kunci pencarian Anda
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentClasses.map((classItem) => (
              <div key={classItem.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <span className={getStatusBadge(classItem.status)}>
                    {getStatusText(classItem.status)}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/programs/${params.id}/classes/${classItem.id}/content`}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Kelola Materi"
                    >
                      <FileText className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`#class-${classItem.id}`}
                      onClick={(e) => {
                        e.preventDefault()
                        // Scroll to ClassManagement section
                        document.getElementById('class-management-section')?.scrollIntoView({ behavior: 'smooth' })
                        // Note: User can click edit button in ClassManagement component
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Kelas (gunakan tombol edit di bagian Manajemen Kelas di atas)"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => openDeleteModal(classItem.id, classItem.name)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus Kelas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">{classItem.name}</h3>
                {classItem.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{classItem.description}</p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{formatDate(classItem.start_date)} - {formatDate(classItem.end_date)}</span>
                  </div>
                  {classItem.start_time && classItem.end_time && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{formatTime(classItem.start_time)} - {formatTime(classItem.end_time)}</span>
                    </div>
                  )}
                  {classItem.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{classItem.location}{classItem.room && ` - ${classItem.room}`}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Peserta</span>
                    <span className="text-sm font-medium text-gray-900">
                      {classItem.current_participants} / {classItem.max_participants || 'Tidak Terbatas'}
                    </span>
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <UserCheck className="w-4 h-4 mr-2" />
                      <span>Pelatih:</span>
                    </div>
                    {classItem.trainers && classItem.trainers.length > 0 ? (
                      <div className="space-y-1">
                        {classItem.trainers.map((ct) => (
                          <div key={ct.id} className="flex items-center justify-between">
                            <span className="text-xs text-gray-700">
                              {ct.trainer?.name || ct.trainer_id || 'Pelatih tidak ditemukan'}
                            </span>
                            {ct.is_primary && (
                              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                                Utama
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 italic">
                        Belum ada pelatih yang ditugaskan
                      </div>
                    )}
                  </div>
                </div>
              </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredClasses.length)} dari {filteredClasses.length} kelas
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                              currentPage === page
                                ? 'bg-primary-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="px-2">...</span>
                      }
                      return null
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteClass}
        title="Hapus Kelas"
        message={`Apakah Anda yakin ingin menghapus kelas "${deleteModal.className}"? Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait kelas ini.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteModal.isLoading}
      />
    </div>
  )
}

