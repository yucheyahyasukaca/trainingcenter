'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ClassWithTrainers, ClassInsert, ClassTrainerInsert, Trainer } from '@/types'
import { Plus, Edit, Trash2, Users, Calendar, Clock, MapPin, UserCheck, X, FileText, Search, ChevronLeft, ChevronRight, Settings } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import { MultiSelectTrainer } from '@/components/ui/MultiSelectTrainer'
import { useToast } from '@/hooks/useToast'
import { ClassResourcesManagement } from './ClassResourcesManagement'
import Link from 'next/link'

interface ClassManagementProps {
  programId: string
  programTitle: string
  currentUserId?: string // For auto-assigning trainer when creating from trainer dashboard
  isTrainerMode?: boolean // To hide trainer selection for trainers
}

export function ClassManagement({ programId, programTitle, currentUserId, isTrainerMode = false }: ClassManagementProps) {
  const addToast = useToast()
  const [classes, setClasses] = useState<ClassWithTrainers[]>([])
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassWithTrainers | null>(null)
  const [newClass, setNewClass] = useState<ClassInsert>({
    program_id: programId,
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    start_time: null,
    end_time: null,
    max_participants: undefined,
    location: null,
    room: null,
    status: 'scheduled'
  })
  const [participantLimitType, setParticipantLimitType] = useState<'unlimited' | 'limited'>('unlimited')
  const [participantLimit, setParticipantLimit] = useState(100)
  const [selectedTrainers, setSelectedTrainers] = useState<string[]>([])
  const [primaryTrainer, setPrimaryTrainer] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6
  const [showResourcesModal, setShowResourcesModal] = useState(false)
  const [selectedClassForResources, setSelectedClassForResources] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    fetchClasses()
    fetchTrainers()
  }, [programId])

  async function fetchClasses() {
    try {
      console.log('🔍 Fetching classes for program:', programId)

      // First, let's check if classes table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('classes')
        .select('id')
        .limit(1)

      if (tableError) {
        console.error('❌ Classes table error:', tableError)
        throw tableError
      }

      console.log('✅ Classes table accessible')

      // Fetch classes with a simpler query first
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('program_id', programId)
        .order('start_date', { ascending: true })

      if (error) {
        console.error('❌ Classes fetch error:', error)
        throw error
      }

      console.log('🔍 Classes fetched for program', programId, ':', data?.length || 0, 'classes')

      // Fetch class trainers separately
      const classIds = (data || []).map((cls: any) => cls.id)
      console.log('🔍 ClassManagement: Class IDs to fetch trainers for:', classIds)
      let trainersMap = new Map()

      if (classIds.length > 0) {
        const { data: classTrainersData, error: trainersError } = await supabase
          .from('class_trainers')
          .select('id, class_id, trainer_id, is_primary')
          .in('class_id', classIds)

        console.log('🔍 ClassManagement: Raw class_trainers data:', classTrainersData)
        console.log('🔍 ClassManagement: Class trainers error:', trainersError)

        if (!trainersError && classTrainersData) {
          // Group by class_id
          classTrainersData.forEach((ct: any) => {
            if (!trainersMap.has(ct.class_id)) {
              trainersMap.set(ct.class_id, [])
            }
            trainersMap.get(ct.class_id).push(ct)
          })

          console.log('🔍 ClassManagement: Trainers map:', Array.from(trainersMap.entries()))

          // Fetch trainer details - try both user_profiles and trainers tables
          const trainerIds = [...new Set(classTrainersData.map((ct: any) => ct.trainer_id).filter(Boolean))]
          console.log('🔍 ClassManagement: Trainer IDs to fetch:', trainerIds)

          if (trainerIds.length > 0) {
            // Try user_profiles first (most common case)
            const { data: trainerDetailsFromUserProfiles, error: userProfilesError } = await supabase
              .from('user_profiles')
              .select('id, full_name, email')
              .in('id', trainerIds)

            console.log('🔍 ClassManagement: Trainer details from user_profiles:', trainerDetailsFromUserProfiles)
            console.log('🔍 ClassManagement: User profiles error:', userProfilesError)

            // Try trainers table as fallback
            const { data: trainerDetailsFromTrainers, error: trainersTableError } = await supabase
              .from('trainers')
              .select('id, name, email, user_id')
              .in('id', trainerIds)

            console.log('🔍 ClassManagement: Trainer details from trainers table:', trainerDetailsFromTrainers)
            console.log('🔍 ClassManagement: Trainers table error:', trainersTableError)

            // Build trainer map from both sources
            const trainerDetailsMap = new Map()

            // Add from user_profiles
            if (trainerDetailsFromUserProfiles) {
              trainerDetailsFromUserProfiles.forEach((t: any) => {
                trainerDetailsMap.set(t.id, { id: t.id, name: t.full_name, email: t.email })
              })
            }

            // Add from trainers table (if not already in map)
            if (trainerDetailsFromTrainers) {
              trainerDetailsFromTrainers.forEach((t: any) => {
                if (!trainerDetailsMap.has(t.id)) {
                  trainerDetailsMap.set(t.id, { id: t.id, name: t.name, email: t.email })
                }
              })
            }

            console.log('🔍 ClassManagement: Final trainer map:', Array.from(trainerDetailsMap.entries()))

            // Attach trainer details
            trainersMap.forEach((trainers, classId) => {
              trainers.forEach((ct: any) => {
                ct.trainer = trainerDetailsMap.get(ct.trainer_id) || null
                console.log(`🔍 ClassManagement: Attaching trainer to class ${classId}:`, {
                  trainer_id: ct.trainer_id,
                  trainer: ct.trainer
                })
              })
            })
          } else {
            console.warn('⚠️ ClassManagement: No trainer IDs found in class_trainers data')
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

            console.log('Jumlah peserta per kelas:', Array.from(classParticipantCounts.entries()))
          }
        } catch (countError) {
          console.error('Error fetching participant counts:', countError)
          // Continue with 0 counts if there's an error
        }
      }

      // Combine classes with trainers and participant counts
      const classesWithTrainers = (data || []).map((cls: any) => ({
        ...cls,
        trainers: trainersMap.get(cls.id) || [],
        current_participants: classParticipantCounts.get(cls.id) || 0
      }))

      console.log('📋 Classes data with trainers:', classesWithTrainers.map((c: any) => ({
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
      setClasses(classesWithTrainers)
    } catch (error) {
      console.error('❌ Error fetching classes:', error)
      setClasses([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchTrainers() {
    try {
      const { data, error } = await supabase
        .from('trainers')
        .select('*')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setTrainers(data || [])
    } catch (error) {
      console.error('Error fetching trainers:', error)
    }
  }

  async function handleAddClass(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare class data with correct max_participants
      const classData = {
        ...newClass,
        max_participants: participantLimitType === 'unlimited' ? undefined : participantLimit,
        start_time: null,
        end_time: null,
        location: null,
        room: null
      }

      console.log('🔄 Adding new class:', classData)

      // Insert class
      const { data: insertedClass, error: classError } = await (supabase as any)
        .from('classes')
        .insert([classData])
        .select()

      if (classError) {
        console.error('❌ Class insert error:', classError)
        throw classError
      }

      console.log('✅ Class inserted successfully:', insertedClass)

      const classId = insertedClass[0].id

      // Insert class trainers
      if (isTrainerMode && currentUserId) {
        // Auto-assign current trainer as primary when in trainer mode
        console.log('🔄 Auto-assigning current trainer to class:', currentUserId)

        // Check if trainer already exists for this class
        const { data: existingTrainer } = await supabase
          .from('class_trainers')
          .select('id')
          .eq('class_id', classId)
          .eq('trainer_id', currentUserId)
          .maybeSingle()

        if (!existingTrainer) {
          // Directly use user_id as trainer_id in class_trainers
          const { error: trainersError } = await (supabase as any)
            .from('class_trainers')
            .insert([{
              class_id: classId,
              trainer_id: currentUserId, // Use user_id directly
              role: 'instructor',
              is_primary: true
            }])

          if (trainersError) {
            console.error('❌ Class trainers insert error:', trainersError)
            // Don't throw - class is already created, just log the error
            console.warn('⚠️ Failed to assign trainer, but class was created')
          } else {
            console.log('✅ Current trainer auto-assigned successfully')
          }
        } else {
          console.log('✅ Trainer already assigned to this class')
        }
      } else if (selectedTrainers.length > 0) {
        // Admin mode: use selected trainers
        console.log('🔄 Adding trainers to class:', selectedTrainers)

        // Check existing trainers first
        const { data: existingTrainers } = await supabase
          .from('class_trainers')
          .select('trainer_id')
          .eq('class_id', classId)

        const existingTrainerIds = new Set((existingTrainers || []).map((et: any) => et.trainer_id))

        // Filter out trainers that already exist
        const newTrainers = selectedTrainers.filter(trainerId => !existingTrainerIds.has(trainerId))

        if (newTrainers.length > 0) {
          const classTrainers: ClassTrainerInsert[] = newTrainers.map(trainerId => ({
            class_id: classId,
            trainer_id: trainerId,
            role: trainerId === primaryTrainer ? 'instructor' : 'assistant',
            is_primary: trainerId === primaryTrainer
          }))

          console.log('🔄 Class trainers data (new only):', classTrainers)

          const { error: trainersError } = await (supabase as any)
            .from('class_trainers')
            .insert(classTrainers)

          if (trainersError) {
            console.error('❌ Class trainers insert error:', trainersError)
            // Don't throw - class is already created
            console.warn('⚠️ Failed to assign some trainers, but class was created')
          } else {
            console.log('✅ Class trainers inserted successfully')
          }
        } else {
          console.log('ℹ️ All selected trainers already assigned to this class')
        }
      }

      // Reset form
      setNewClass({
        program_id: programId,
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        start_time: null,
        end_time: null,
        max_participants: undefined,
        location: null,
        room: null,
        status: 'scheduled'
      })
      setParticipantLimitType('unlimited')
      setParticipantLimit(100)
      setSelectedTrainers([])
      setPrimaryTrainer('')
      setShowAddModal(false)

      console.log('🔄 Refreshing classes list...')
      addToast.success('Program Pelatihan berhasil ditambahkan', 'Berhasil')
      fetchClasses()

    } catch (error: any) {
      console.error('❌ Error adding class:', error)

      // Show detailed error message
      let errorMessage = 'Gagal menambahkan kelas'
      if (error?.message) {
        errorMessage += `: ${error.message}`
      } else if (error?.code) {
        errorMessage += ` (Error code: ${error.code})`
      }

      addToast.error(errorMessage, 'Error')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateClass(e: React.FormEvent) {
    e.preventDefault()
    if (!editingClass) return

    setLoading(true)

    try {
      console.log('🔄 Updating class:', editingClass)
      console.log('🔄 Selected trainers:', selectedTrainers)
      console.log('🔄 Primary trainer:', primaryTrainer)

      // Validate required fields
      if (!editingClass.name.trim()) {
        throw new Error('Nama kelas harus diisi')
      }
      if (!editingClass.start_date || !editingClass.end_date) {
        throw new Error('Tanggal mulai dan selesai harus diisi')
      }
      if (editingClass.max_participants !== undefined && editingClass.max_participants !== null && editingClass.max_participants < 1) {
        throw new Error('Maksimal peserta harus lebih dari 0')
      }

      // Prepare update data
      const updateData = {
        name: editingClass.name.trim(),
        description: editingClass.description?.trim() || null,
        start_date: editingClass.start_date,
        end_date: editingClass.end_date,
        start_time: null,
        end_time: null,
        max_participants: editingClass.max_participants,
        location: null,
        room: null,
        status: editingClass.status === 'active' ? 'scheduled' : editingClass.status
      }

      console.log('🔄 Update data prepared:', updateData)

      // Update class
      const { data: updateResult, error: classError } = await (supabase as any)
        .from('classes')
        .update(updateData)
        .eq('id', editingClass.id)
        .select()

      if (classError) {
        console.error('❌ Class update error:', classError)
        throw classError
      }

      console.log('✅ Class updated successfully:', updateResult)

      // Update trainers
      console.log('🔄 Updating trainers for class:', editingClass.id)

      // Get current trainers
      const { data: currentTrainers, error: fetchCurrentError } = await supabase
        .from('class_trainers')
        .select('trainer_id')
        .eq('class_id', editingClass.id)

      if (fetchCurrentError) {
        console.error('❌ Error fetching current trainers:', fetchCurrentError)
        // Continue anyway
      }

      const currentTrainerIds = new Set((currentTrainers || []).map((ct: any) => ct.trainer_id))
      const newTrainerIds = new Set(selectedTrainers)

      // Find trainers to delete (in current but not in new)
      const trainersToDelete = Array.from(currentTrainerIds).filter(id => !newTrainerIds.has(id))

      // Find trainers to add (in new but not in current)
      const trainersToAdd = selectedTrainers.filter(id => !currentTrainerIds.has(id))

      // Find trainers to update (in both, might need to update is_primary)
      const trainersToUpdate = selectedTrainers.filter(id => currentTrainerIds.has(id))

      // Delete trainers that are no longer selected
      if (trainersToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('class_trainers')
          .delete()
          .eq('class_id', editingClass.id)
          .in('trainer_id', trainersToDelete)

        if (deleteError) {
          console.error('❌ Delete trainers error:', deleteError)
          // Don't throw, continue with other operations
        } else {
          console.log('✅ Removed trainers:', trainersToDelete)
        }
      }

      // Insert new trainers
      if (trainersToAdd.length > 0) {
        // Validate primary trainer is in selected trainers
        if (primaryTrainer && !selectedTrainers.includes(primaryTrainer)) {
          console.warn('⚠️ Primary trainer not in selected trainers, clearing primary')
          setPrimaryTrainer('')
        }

        const classTrainers: ClassTrainerInsert[] = trainersToAdd.map(trainerId => ({
          class_id: editingClass.id,
          trainer_id: trainerId,
          role: trainerId === primaryTrainer ? 'instructor' : 'assistant',
          is_primary: trainerId === primaryTrainer
        }))

        console.log('🔄 Inserting new trainers:', classTrainers)

        // Insert trainers one by one to handle duplicates gracefully
        const insertedTrainers = []
        const failedTrainers = []

        for (const trainer of classTrainers) {
          try {
            const { data: trainerData, error: trainerError } = await (supabase as any)
              .from('class_trainers')
              .insert([trainer])
              .select()
              .single()

            if (trainerError) {
              // Check if it's a duplicate error
              if (trainerError.code === '23505' || trainerError.message?.includes('duplicate') || trainerError.message?.includes('unique') || trainerError.code === 'PGRST116') {
                console.warn(`⚠️ Trainer ${trainer.trainer_id} already exists for this class, skipping`)
                failedTrainers.push(trainer.trainer_id)
              } else {
                console.error(`❌ Error inserting trainer ${trainer.trainer_id}:`, trainerError)
                failedTrainers.push(trainer.trainer_id)
              }
            } else {
              insertedTrainers.push(trainerData)
            }
          } catch (err: any) {
            console.error(`❌ Exception inserting trainer ${trainer.trainer_id}:`, err)
            failedTrainers.push(trainer.trainer_id)
          }
        }

        if (insertedTrainers.length > 0) {
          console.log('✅ Trainers inserted successfully:', insertedTrainers.length)
        }
        if (failedTrainers.length > 0) {
          console.warn('⚠️ Some trainers failed to insert (may already exist):', failedTrainers.length)
        }

        // Only throw if ALL trainers failed and it's not a duplicate issue
        if (insertedTrainers.length === 0 && failedTrainers.length === classTrainers.length) {
          throw new Error('Gagal menambahkan trainer. Pastikan trainer belum terdaftar untuk kelas ini.')
        }
      }

      // Update primary trainer status for existing trainers
      if (primaryTrainer && trainersToUpdate.length > 0) {
        // First, set all trainers to not primary
        const { error: unsetPrimaryError } = await supabase
          .from('class_trainers')
          .update({ is_primary: false })
          .eq('class_id', editingClass.id)

        if (unsetPrimaryError) {
          console.error('❌ Error unsetting primary trainers:', unsetPrimaryError)
        }

        // Then set the primary trainer
        const { error: setPrimaryError } = await supabase
          .from('class_trainers')
          .update({ is_primary: true, role: 'instructor' })
          .eq('class_id', editingClass.id)
          .eq('trainer_id', primaryTrainer)

        if (setPrimaryError) {
          console.error('❌ Error setting primary trainer:', setPrimaryError)
        } else {
          console.log('✅ Primary trainer updated')
        }
      }

      setEditingClass(null)
      setShowEditModal(false)
      setSelectedTrainers([])
      setPrimaryTrainer('')
      addToast.success('Program Pelatihan berhasil diupdate', 'Berhasil')
      fetchClasses()
    } catch (error: any) {
      console.error('❌ Error updating class:', error)

      // Show detailed error message
      let errorMessage = 'Gagal mengupdate kelas'
      if (error?.message) {
        errorMessage += `: ${error.message}`
      } else if (error?.code) {
        errorMessage += ` (Error code: ${error.code})`
      }

      // Check for specific error types
      if (error?.code === '23505' || error?.message?.includes('duplicate') || error?.message?.includes('unique')) {
        errorMessage = 'Trainer sudah terdaftar untuk kelas ini. Silakan pilih trainer lain atau refresh halaman.'
      } else if (error?.code === '409' || error?.status === 409) {
        errorMessage = 'Konflik data. Trainer mungkin sudah terdaftar. Silakan refresh halaman dan coba lagi.'
      }

      addToast.error(errorMessage, 'Error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteClass(id: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus kelas ini?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchClasses()
    } catch (error) {
      console.error('Error deleting class:', error)
      alert('Gagal menghapus kelas')
    } finally {
      setLoading(false)
    }
  }

  function openEditModal(classItem: ClassWithTrainers) {
    setEditingClass(classItem)
    setSelectedTrainers(classItem.trainers?.map(ct => ct.trainer_id) || [])
    setPrimaryTrainer(classItem.trainers?.find(ct => ct.is_primary)?.trainer_id || '')
    setShowEditModal(true)
  }

  function getStatusBadge(status: string) {
    const badges: Record<string, string> = {
      scheduled: 'px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full',
      ongoing: 'px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full',
      completed: 'px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full',
      cancelled: 'px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full',
      // Legacy status support
      active: 'px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full',
      inactive: 'px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full',
      full: 'px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full',
    }
    return badges[status] || 'px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full'
  }

  function getStatusText(status: string) {
    const texts: Record<string, string> = {
      scheduled: 'Dijadwalkan',
      ongoing: 'Berlangsung',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
      // Legacy status support
      active: 'Aktif',
      inactive: 'Tidak Aktif',
      full: 'Penuh',
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

  if (loading && classes.length === 0) {
    return <div className="text-center py-8">Memuat program pelatihan...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Program Pelatihan</h2>
          <p className="text-gray-600 mt-1">Kelola program pelatihan untuk program: {programTitle}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Tambah Kelas
        </button>
      </div>

      {/* Search and Info */}
      {classes.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-600">
            Total: {filteredClasses.length} dari {classes.length} kelas
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari program pelatihan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm w-full sm:w-64"
            />
          </div>
        </div>
      )}

      {classes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Belum ada program pelatihan untuk program ini</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Tambah Program Pelatihan Pertama
          </button>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Tidak ada program pelatihan yang ditemukan</p>
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
                    <button
                      onClick={() => openEditModal(classItem)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Program Pelatihan"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClass(classItem.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus Program Pelatihan"
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

                  {/* Content Management Buttons */}
                  <div className="mt-4 space-y-2">
                    <Link
                      href={`/programs/${programId}/classes/${classItem.id}/content`}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Kelola Materi
                    </Link>
                    <button
                      onClick={() => {
                        setSelectedClassForResources({ id: classItem.id, name: classItem.name })
                        setShowResourcesModal(true)
                      }}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Kelola Resources
                    </button>
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
                          className={`px-3 py-1 rounded-lg text-sm transition-colors ${currentPage === page
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

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Tambah Kelas Baru</h3>
            <form onSubmit={handleAddClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kelas</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maksimal Peserta</label>
                <div className="space-y-3">
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="participantLimitType"
                        value="unlimited"
                        checked={participantLimitType === 'unlimited'}
                        onChange={(e) => {
                          setParticipantLimitType(e.target.value as 'unlimited')
                          setNewClass({ ...newClass, max_participants: undefined })
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Tidak Terbatas</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="participantLimitType"
                        value="limited"
                        checked={participantLimitType === 'limited'}
                        onChange={(e) => {
                          setParticipantLimitType(e.target.value as 'limited')
                          setNewClass({ ...newClass, max_participants: participantLimit })
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Kuota</span>
                    </label>
                  </div>

                  {participantLimitType === 'limited' && (
                    <div>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        value={participantLimit}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1
                          setParticipantLimit(value)
                          setNewClass({ ...newClass, max_participants: value })
                        }}
                        min="1"
                        placeholder="Masukkan jumlah maksimal peserta"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {participantLimit === null || participantLimit === undefined
                          ? 'Tidak terbatas peserta yang bisa bergabung'
                          : `Hanya ${participantLimit} peserta yang bisa bergabung`
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  rows={3}
                  value={newClass.description || ''}
                  onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    value={newClass.start_date}
                    onChange={(e) => setNewClass({ ...newClass, start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    value={newClass.end_date}
                    onChange={(e) => setNewClass({ ...newClass, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              {!isTrainerMode && (
                <MultiSelectTrainer
                  trainers={trainers}
                  selectedTrainers={selectedTrainers}
                  onSelectionChange={setSelectedTrainers}
                  primaryTrainer={primaryTrainer}
                  onPrimaryChange={setPrimaryTrainer}
                  label="Trainer"
                />
              )}
              {isTrainerMode && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Info:</strong> Anda akan otomatis ditetapkan sebagai trainer utama untuk kelas ini.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditModal && editingClass && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Edit Kelas</h3>
            <form onSubmit={handleUpdateClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kelas</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maksimal Peserta</label>
                <div className="space-y-3">
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="editParticipantLimitType"
                        value="unlimited"
                        checked={editingClass.max_participants === undefined || editingClass.max_participants === null}
                        onChange={() => setEditingClass({ ...editingClass, max_participants: undefined as any })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Tidak Terbatas</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="editParticipantLimitType"
                        value="limited"
                        checked={editingClass.max_participants !== undefined && editingClass.max_participants !== null}
                        onChange={() => setEditingClass({ ...editingClass, max_participants: editingClass.max_participants || 100 })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Kuota</span>
                    </label>
                  </div>

                  {editingClass.max_participants !== undefined && editingClass.max_participants !== null && (
                    <div>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        value={editingClass.max_participants}
                        onChange={(e) => setEditingClass({ ...editingClass, max_participants: parseInt(e.target.value) || 1 })}
                        min="1"
                        placeholder="Masukkan jumlah maksimal peserta"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {editingClass.max_participants === null || editingClass.max_participants === undefined
                          ? 'Tidak terbatas peserta yang bisa bergabung'
                          : `Hanya ${editingClass.max_participants} peserta yang bisa bergabung`
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  rows={3}
                  value={editingClass.description || ''}
                  onChange={(e) => setEditingClass({ ...editingClass, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    value={editingClass.start_date}
                    onChange={(e) => setEditingClass({ ...editingClass, start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    value={editingClass.end_date}
                    onChange={(e) => setEditingClass({ ...editingClass, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  value={editingClass.status}
                  onChange={(e) => setEditingClass({ ...editingClass, status: e.target.value as any })}
                >
                  <option value="scheduled">Dijadwalkan</option>
                  <option value="ongoing">Berlangsung</option>
                  <option value="completed">Selesai</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>
              </div>

              {!isTrainerMode && (
                <MultiSelectTrainer
                  trainers={trainers}
                  selectedTrainers={selectedTrainers}
                  onSelectionChange={setSelectedTrainers}
                  primaryTrainer={primaryTrainer}
                  onPrimaryChange={setPrimaryTrainer}
                  label="Trainer"
                />
              )}
              {isTrainerMode && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Info:</strong> Anda akan otomatis ditetapkan sebagai trainer utama untuk kelas ini.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingClass(null)
                    setShowEditModal(false)
                    setSelectedTrainers([])
                    setPrimaryTrainer('')
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resources Management Modal */}
      {showResourcesModal && selectedClassForResources && (
        <ClassResourcesManagement
          classId={selectedClassForResources.id}
          className={selectedClassForResources.name}
          onClose={() => {
            setShowResourcesModal(false)
            setSelectedClassForResources(null)
          }}
        />
      )}
    </div>
  )
}
