'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ClassWithTrainers, ClassInsert, ClassTrainerInsert, Trainer } from '@/types'
import { Plus, Edit, Trash2, Users, Calendar, Clock, MapPin, UserCheck, X, FileText } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import { MultiSelectTrainer } from '@/components/ui/MultiSelectTrainer'

interface ClassManagementProps {
  programId: string
  programTitle: string
  currentUserId?: string // For auto-assigning trainer when creating from trainer dashboard
  isTrainerMode?: boolean // To hide trainer selection for trainers
}

export function ClassManagement({ programId, programTitle, currentUserId, isTrainerMode = false }: ClassManagementProps) {
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

      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          trainers:class_trainers(
            *,
            trainer:trainers(*)
          )
        `)
        .eq('program_id', programId)
        .order('start_date', { ascending: true })

      if (error) {
        console.error('❌ Classes fetch error:', error)
        throw error
      }
      
      console.log('🔍 Classes fetched for program', programId, ':', data?.length || 0, 'classes')
      console.log('📋 Classes data:', data)
      setClasses(data || [])
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
        
        // First get trainer ID from trainers table
        const { data: trainerData } = await supabase
          .from('trainers')
          .select('id')
          .eq('user_id', currentUserId)
          .single()

        if (!trainerData) {
          throw new Error('Trainer data not found')
        }
        
        const { error: trainersError } = await (supabase as any)
          .from('class_trainers')
          .insert([{
            class_id: classId,
            trainer_id: (trainerData as any).id,
            role: 'instructor',
            is_primary: true
          }])

        if (trainersError) {
          console.error('❌ Class trainers insert error:', trainersError)
          throw trainersError
        }

        console.log('✅ Current trainer auto-assigned successfully')
      } else if (selectedTrainers.length > 0) {
        // Admin mode: use selected trainers
        console.log('🔄 Adding trainers to class:', selectedTrainers)
        
        const classTrainers: ClassTrainerInsert[] = selectedTrainers.map(trainerId => ({
          class_id: classId,
          trainer_id: trainerId,
          role: trainerId === primaryTrainer ? 'instructor' : 'assistant',
          is_primary: trainerId === primaryTrainer
        }))

        console.log('🔄 Class trainers data:', classTrainers)

        const { error: trainersError } = await (supabase as any)
          .from('class_trainers')
          .insert(classTrainers)

        if (trainersError) {
          console.error('❌ Class trainers insert error:', trainersError)
          throw trainersError
        }

        console.log('✅ Class trainers inserted successfully')
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
      fetchClasses()
      
    } catch (error) {
      console.error('❌ Error adding class:', error)
      
      // Show detailed error message
      let errorMessage = 'Gagal menambahkan kelas'
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`
      }
      
      alert(errorMessage)
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
      
      // First, delete existing trainers
      const { error: deleteError } = await supabase
        .from('class_trainers')
        .delete()
        .eq('class_id', editingClass.id)

      if (deleteError) {
        console.error('❌ Delete trainers error:', deleteError)
        throw deleteError
      }

      console.log('✅ Existing trainers deleted')

      // Then insert new trainers
      if (selectedTrainers.length > 0) {
        // Validate primary trainer is in selected trainers
        if (primaryTrainer && !selectedTrainers.includes(primaryTrainer)) {
          console.warn('⚠️ Primary trainer not in selected trainers, clearing primary')
          setPrimaryTrainer('')
        }
        
        const classTrainers: ClassTrainerInsert[] = selectedTrainers.map(trainerId => ({
          class_id: editingClass.id,
          trainer_id: trainerId,
          role: 'assistant',
          is_primary: trainerId === primaryTrainer
        }))

        console.log('🔄 Inserting new trainers:', classTrainers)

        const { data: trainersData, error: trainersError } = await (supabase as any)
          .from('class_trainers')
          .insert(classTrainers)
          .select()

        if (trainersError) {
          console.error('❌ Insert trainers error:', trainersError)
          throw trainersError
        }

        console.log('✅ Trainers inserted successfully:', trainersData)
      }

      setEditingClass(null)
      setShowEditModal(false)
      setSelectedTrainers([])
      setPrimaryTrainer('')
      fetchClasses()
    } catch (error) {
      console.error('❌ Error updating class:', error)
      
      // Show detailed error message
      let errorMessage = 'Gagal mengupdate kelas'
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`
      }
      
      alert(errorMessage)
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

  if (loading && classes.length === 0) {
    return <div className="text-center py-8">Memuat kelas...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Kelas</h2>
          <p className="text-gray-600 mt-1">Kelola kelas untuk program: {programTitle}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Tambah Kelas
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Belum ada kelas untuk program ini</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Tambah Kelas Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem) => (
            <div key={classItem.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <span className={getStatusBadge(classItem.status)}>
                  {classItem.status}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(classItem)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Kelas"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClass(classItem.id)}
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
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Peserta</span>
                  <span className="text-sm font-medium text-gray-900">
                    {classItem.current_participants} / {classItem.max_participants || 'Unlimited'}
                  </span>
                </div>
                
                {classItem.trainers && classItem.trainers.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <UserCheck className="w-4 h-4 mr-2" />
                      <span>Trainer:</span>
                    </div>
                    <div className="space-y-1">
                      {classItem.trainers.map((ct) => (
                        <div key={ct.id} className="flex items-center justify-between">
                          <span className="text-xs text-gray-700">
                            {ct.trainer?.name}
                          </span>
                          {ct.is_primary && (
                            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                              Utama
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Content Management Button */}
                <div className="mt-4">
                  <a
                    href={`/programs/${programId}/classes/${classItem.id}/content`}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Kelola Materi
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
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
                      <span className="text-sm text-gray-700">Unlimited</span>
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
                          ? 'Unlimited peserta yang bisa bergabung' 
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
                      <span className="text-sm text-gray-700">Unlimited</span>
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
                          ? 'Unlimited peserta yang bisa bergabung' 
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
    </div>
  )
}
