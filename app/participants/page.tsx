'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Participant } from '@/types'
import { Plus, Search, Edit, Trash2, Users } from 'lucide-react'
import Link from 'next/link'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { useToast } from '@/hooks/useToast'

export default function ParticipantsPage() {
  const addToast = useToast()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    participantId: string | null
    participantName: string
    isLoading: boolean
  }>({
    isOpen: false,
    participantId: null,
    participantName: '',
    isLoading: false
  })

  useEffect(() => {
    fetchParticipants()
  }, [])

  async function fetchParticipants() {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setParticipants(data || [])
    } catch (error) {
      console.error('Error fetching participants:', error)
    } finally {
      setLoading(false)
    }
  }

  function openDeleteModal(id: string, name: string) {
    setDeleteModal({
      isOpen: true,
      participantId: id,
      participantName: name,
      isLoading: false
    })
  }

  function closeDeleteModal() {
    setDeleteModal({
      isOpen: false,
      participantId: null,
      participantName: '',
      isLoading: false
    })
  }

  async function confirmDeleteParticipant() {
    if (!deleteModal.participantId) return

    setDeleteModal(prev => ({ ...prev, isLoading: true }))

    try {
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', deleteModal.participantId)

      if (error) throw error
      
      fetchParticipants()
      closeDeleteModal()
    } catch (err) {
      console.error('Error deleting participant:', err)
      addToast.error('Gagal menghapus peserta', 'Error')
      setDeleteModal(prev => ({ ...prev, isLoading: false }))
    }
  }

  const filteredParticipants = participants.filter((participant) =>
    participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    participant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (participant.company && participant.company.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Peserta</h1>
          <p className="text-gray-600 mt-1">Kelola data peserta training</p>
        </div>
        <Link href="/participants/new" className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Tambah Peserta</span>
        </Link>
      </div>

      <div className="card">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari peserta..."
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
        ) : filteredParticipants.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Belum ada peserta terdaftar</p>
            <Link href="/participants/new" className="btn-primary mt-4 inline-block">
              Tambah Peserta Pertama
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Nama</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Kontak</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Perusahaan</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Posisi</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredParticipants.map((participant) => (
                  <tr key={participant.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">{participant.name}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-900">{participant.email}</p>
                      <p className="text-xs text-gray-500">{participant.phone}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">{participant.company || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{participant.position || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`badge ${participant.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {participant.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/participants/${participant.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => openDeleteModal(participant.id, participant.name)}
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
        onConfirm={confirmDeleteParticipant}
        title="Hapus Peserta"
        message={`Apakah Anda yakin ingin menghapus peserta "${deleteModal.participantName}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteModal.isLoading}
      />
    </div>
  )
}

