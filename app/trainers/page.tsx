'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Trainer } from '@/types'
import { Plus, Search, Edit, Trash2, UserCog } from 'lucide-react'
import Link from 'next/link'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { useToastContext } from '@/components/ToastProvider'

export default function TrainersPage() {
  const { error } = useToastContext()
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    trainerId: string | null
    trainerName: string
    isLoading: boolean
  }>({
    isOpen: false,
    trainerId: null,
    trainerName: '',
    isLoading: false
  })

  useEffect(() => {
    fetchTrainers()
  }, [])

  async function fetchTrainers() {
    try {
      const { data, error } = await supabase
        .from('trainers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTrainers(data || [])
    } catch (error) {
      console.error('Error fetching trainers:', error)
    } finally {
      setLoading(false)
    }
  }

  function openDeleteModal(id: string, name: string) {
    setDeleteModal({
      isOpen: true,
      trainerId: id,
      trainerName: name,
      isLoading: false
    })
  }

  function closeDeleteModal() {
    setDeleteModal({
      isOpen: false,
      trainerId: null,
      trainerName: '',
      isLoading: false
    })
  }

  async function confirmDeleteTrainer() {
    if (!deleteModal.trainerId) return

    setDeleteModal(prev => ({ ...prev, isLoading: true }))

    try {
      const { error } = await supabase
        .from('trainers')
        .delete()
        .eq('id', deleteModal.trainerId)

      if (error) throw error
      
      fetchTrainers()
      closeDeleteModal()
    } catch (error) {
      console.error('Error deleting trainer:', error)
      error('Gagal menghapus trainer', 'Error')
      setDeleteModal(prev => ({ ...prev, isLoading: false }))
    }
  }

  const filteredTrainers = trainers.filter((trainer) =>
    trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trainer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trainer.specialization.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Trainer</h1>
          <p className="text-gray-600 mt-1">Kelola data trainer dan instruktur</p>
        </div>
        <Link href="/trainers/new" className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Tambah Trainer</span>
        </Link>
      </div>

      <div className="card">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari trainer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 input"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 animate-pulse rounded"></div>
            ))}
          </div>
        ) : filteredTrainers.length === 0 ? (
          <div className="text-center py-12">
            <UserCog className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Belum ada trainer terdaftar</p>
            <Link href="/trainers/new" className="btn-primary mt-4 inline-block">
              Tambah Trainer Pertama
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Nama</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Spesialisasi</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Kontak</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Pengalaman</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrainers.map((trainer) => (
                  <tr key={trainer.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <UserCog className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{trainer.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">{trainer.specialization}</td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-900">{trainer.email}</p>
                      <p className="text-xs text-gray-500">{trainer.phone}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">{trainer.experience_years} tahun</td>
                    <td className="py-3 px-4">
                      <span className={`badge ${trainer.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {trainer.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/trainers/${trainer.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => openDeleteModal(trainer.id, trainer.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteTrainer}
        title="Hapus Trainer"
        message={`Apakah Anda yakin ingin menghapus trainer "${deleteModal.trainerName}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteModal.isLoading}
      />
    </div>
  )
}

