'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ClassWithTrainers, ClassInsert, ClassTrainerInsert, Trainer } from '@/types'
import { Plus, Edit, Trash2, Users, Calendar, Clock, MapPin, UserCheck, X } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'

interface ClassManagementProps {
  programId: string
  programTitle: string
}

export function ClassManagement({ programId, programTitle }: ClassManagementProps) {
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
    start_time: '',
    end_time: '',
    max_participants: 10,
    location: '',
    room: '',
    status: 'active'
  })
  const [selectedTrainers, setSelectedTrainers] = useState<string[]>([])
  const [primaryTrainer, setPrimaryTrainer] = useState('')

  useEffect(() => {
    fetchClasses()
    fetchTrainers()
  }, [programId])

  async function fetchClasses() {
    try {
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

      if (error) throw error
      console.log('🔍 Classes fetched for program', programId, ':', data?.length || 0, 'classes')
      console.log('📋 Classes data:', data)
      setClasses(data || [])
    } catch (error) {
      console.error('Error fetching classes:', error)
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
      // Insert class
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .insert([newClass])
        .select()

      if (classError) throw classError

      const classId = classData[0].id

      // Insert class trainers
      if (selectedTrainers.length > 0) {
        const classTrainers: ClassTrainerInsert[] = selectedTrainers.map(trainerId => ({
          class_id: classId,
          trainer_id: trainerId,
          role: 'instructor',
          is_primary: trainerId === primaryTrainer
        }))

        const { error: trainersError } = await supabase
          .from('class_trainers')
          .insert(classTrainers)

        if (trainersError) throw trainersError
      }

      setNewClass({
        program_id: programId,
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        max_participants: 10,
        location: '',
        room: '',
        status: 'active'
      })
      setSelectedTrainers([])
      setPrimaryTrainer('')
      setShowAddModal(false)
      fetchClasses()
    } catch (error) {
      console.error('Error adding class:', error)
      alert('Gagal menambahkan kelas')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateClass(e: React.FormEvent) {
    e.preventDefault()
    if (!editingClass) return

    setLoading(true)

    try {
      // Update class
      const { error: classError } = await supabase
        .from('classes')
        .update({
          name: editingClass.name,
          description: editingClass.description,
          start_date: editingClass.start_date,
          end_date: editingClass.end_date,
          start_time: editingClass.start_time,
          end_time: editingClass.end_time,
          max_participants: editingClass.max_participants,
          location: editingClass.location,
          room: editingClass.room,
          status: editingClass.status
        })
        .eq('id', editingClass.id)

      if (classError) throw classError

      // Update trainers
      // First, delete existing trainers
      await supabase
        .from('class_trainers')
        .delete()
        .eq('class_id', editingClass.id)

      // Then insert new trainers
      if (selectedTrainers.length > 0) {
        const classTrainers: ClassTrainerInsert[] = selectedTrainers.map(trainerId => ({
          class_id: editingClass.id,
          trainer_id: trainerId,
          role: 'instructor',
          is_primary: trainerId === primaryTrainer
        }))

        const { error: trainersError } = await supabase
          .from('class_trainers')
          .insert(classTrainers)

        if (trainersError) throw trainersError
      }

      setEditingClass(null)
      setShowEditModal(false)
      setSelectedTrainers([])
      setPrimaryTrainer('')
      fetchClasses()
    } catch (error) {
      console.error('Error updating class:', error)
      alert('Gagal mengupdate kelas')
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
      active: 'px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full',
      inactive: 'px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full',
      full: 'px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full',
      completed: 'px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full',
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
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>{formatTime(classItem.start_time)} - {formatTime(classItem.end_time)}</span>
                </div>
                {classItem.location && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{classItem.location}</span>
                  </div>
                )}
                {classItem.room && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span>Ruang {classItem.room}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Peserta</span>
                  <span className="text-sm font-medium text-gray-900">
                    {classItem.current_participants} / {classItem.max_participants}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    value={newClass.max_participants}
                    onChange={(e) => setNewClass({ ...newClass, max_participants: parseInt(e.target.value) })}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  rows={3}
                  value={newClass.description}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    value={newClass.start_time}
                    onChange={(e) => setNewClass({ ...newClass, start_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    value={newClass.end_time}
                    onChange={(e) => setNewClass({ ...newClass, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    value={newClass.location}
                    onChange={(e) => setNewClass({ ...newClass, location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ruang</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    value={newClass.room}
                    onChange={(e) => setNewClass({ ...newClass, room: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trainer</label>
                <div className="space-y-2">
                  {trainers.map((trainer) => (
                    <label key={trainer.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedTrainers.includes(trainer.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTrainers([...selectedTrainers, trainer.id])
                          } else {
                            setSelectedTrainers(selectedTrainers.filter(id => id !== trainer.id))
                            if (primaryTrainer === trainer.id) {
                              setPrimaryTrainer('')
                            }
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <input
                        type="radio"
                        name="primaryTrainer"
                        checked={primaryTrainer === trainer.id}
                        onChange={() => setPrimaryTrainer(trainer.id)}
                        disabled={!selectedTrainers.includes(trainer.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{trainer.name}</span>
                    </label>
                  ))}
                </div>
              </div>

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    value={editingClass.max_participants}
                    onChange={(e) => setEditingClass({ ...editingClass, max_participants: parseInt(e.target.value) })}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  rows={3}
                  value={editingClass.description}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    value={editingClass.start_time}
                    onChange={(e) => setEditingClass({ ...editingClass, start_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    value={editingClass.end_time}
                    onChange={(e) => setEditingClass({ ...editingClass, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    value={editingClass.location}
                    onChange={(e) => setEditingClass({ ...editingClass, location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ruang</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    value={editingClass.room}
                    onChange={(e) => setEditingClass({ ...editingClass, room: e.target.value })}
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
                  <option value="active">Aktif</option>
                  <option value="inactive">Tidak Aktif</option>
                  <option value="completed">Selesai</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trainer</label>
                <div className="space-y-2">
                  {trainers.map((trainer) => (
                    <label key={trainer.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedTrainers.includes(trainer.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTrainers([...selectedTrainers, trainer.id])
                          } else {
                            setSelectedTrainers(selectedTrainers.filter(id => id !== trainer.id))
                            if (primaryTrainer === trainer.id) {
                              setPrimaryTrainer('')
                            }
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <input
                        type="radio"
                        name="primaryTrainer"
                        checked={primaryTrainer === trainer.id}
                        onChange={() => setPrimaryTrainer(trainer.id)}
                        disabled={!selectedTrainers.includes(trainer.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{trainer.name}</span>
                    </label>
                  ))}
                </div>
              </div>

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
