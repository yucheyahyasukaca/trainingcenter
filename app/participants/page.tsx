'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Edit, Trash2, Users, ChevronLeft, ChevronRight, KeyRound, X, Save } from 'lucide-react'
import Link from 'next/link'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { useToast } from '@/hooks/useToast'

interface UserProfile {
  id: string
  full_name: string
  email: string
  phone: string | null
  provinsi: string | null
  kabupaten: string | null
  jenjang: string | null
  role: 'admin' | 'manager' | 'trainer' | 'user'
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export default function ParticipantsPage() {
  const addToast = useToast()
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<UserProfile>>({})
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    userId: string | null
    userName: string
    isLoading: boolean
  }>({
    isOpen: false,
    userId: null,
    userName: '',
    isLoading: false
  })
  const [resetPasswordModal, setResetPasswordModal] = useState<{
    isOpen: boolean
    userId: string | null
    userName: string
    isLoading: boolean
  }>({
    isOpen: false,
    userId: null,
    userName: '',
    isLoading: false
  })

  useEffect(() => {
    fetchProfiles()
  }, [])

  async function fetchProfiles() {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, phone, provinsi, kabupaten, jenjang, role, avatar_url, created_at, updated_at')
        .order('created_at', { ascending: false })

      if (error) throw error

      setProfiles(data || [])
    } catch (error) {
      console.error('Error fetching user profiles:', error)
      addToast.error('Gagal memuat data peserta', 'Error')
    } finally {
      setLoading(false)
    }
  }

  function openDeleteModal(id: string, name: string) {
    setDeleteModal({
      isOpen: true,
      userId: id,
      userName: name,
      isLoading: false
    })
  }

  function closeDeleteModal() {
    setDeleteModal({
      isOpen: false,
      userId: null,
      userName: '',
      isLoading: false
    })
  }

  function openResetPasswordModal(userId: string, userName: string) {
    setResetPasswordModal({
      isOpen: true,
      userId,
      userName,
      isLoading: false
    })
  }

  function closeResetPasswordModal() {
    setResetPasswordModal({
      isOpen: false,
      userId: null,
      userName: '',
      isLoading: false
    })
  }

  function startEdit(profile: UserProfile) {
    setEditingId(profile.id)
    setEditFormData({
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone || '',
      provinsi: profile.provinsi || '',
      kabupaten: profile.kabupaten || '',
      jenjang: profile.jenjang || '',
      role: profile.role,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditFormData({})
  }

  async function saveEdit() {
    if (!editingId) return

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: editFormData.full_name,
          email: editFormData.email,
          phone: editFormData.phone,
          provinsi: editFormData.provinsi,
          kabupaten: editFormData.kabupaten,
          jenjang: editFormData.jenjang,
          role: editFormData.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId)

      if (error) throw error

      addToast.success('Data peserta berhasil diupdate', 'Berhasil')
      setEditingId(null)
      setEditFormData({})
      fetchProfiles()
    } catch (error: any) {
      console.error('Error updating profile:', error)
      addToast.error('Gagal mengupdate peserta', 'Error')
    }
  }

  async function confirmDeleteProfile() {
    if (!deleteModal.userId) return

    setDeleteModal(prev => ({ ...prev, isLoading: true }))

    try {
      // Note: Deleting from user_profiles will cascade delete auth.users if foreign key is set
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', deleteModal.userId)

      if (error) throw error

      addToast.success('Peserta berhasil dihapus', 'Berhasil')
      fetchProfiles()
      closeDeleteModal()
    } catch (err) {
      console.error('Error deleting profile:', err)
      addToast.error('Gagal menghapus peserta', 'Error')
      setDeleteModal(prev => ({ ...prev, isLoading: false }))
    }
  }

  async function confirmResetPassword() {
    if (!resetPasswordModal.userId) return

    setResetPasswordModal(prev => ({ ...prev, isLoading: true }))

    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/admin/participants/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          userId: resetPasswordModal.userId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password')
      }

      addToast.success('Password berhasil direset ke default (Garuda-21.com)', 'Berhasil')
      closeResetPasswordModal()
    } catch (err: any) {
      console.error('Error resetting password:', err)
      addToast.error('Gagal reset password: ' + (err.message || 'Unknown error'), 'Error')
      setResetPasswordModal(prev => ({ ...prev, isLoading: false }))
    }
  }

  const filteredProfiles = profiles.filter((profile) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      profile.full_name?.toLowerCase().includes(searchLower) ||
      profile.email?.toLowerCase().includes(searchLower) ||
      profile.phone?.toLowerCase().includes(searchLower) ||
      (profile.provinsi && profile.provinsi.toLowerCase().includes(searchLower)) ||
      (profile.kabupaten && profile.kabupaten.toLowerCase().includes(searchLower)) ||
      (profile.jenjang && profile.jenjang.toLowerCase().includes(searchLower))
    )
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProfiles = filteredProfiles.slice(startIndex, endIndex)

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'badge-danger'
      case 'manager':
        return 'badge-warning'
      case 'trainer':
        return 'badge-info'
      default:
        return 'badge-success'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'manager':
        return 'Manager'
      case 'trainer':
        return 'Trainer'
      default:
        return 'User'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manajemen Peserta</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Kelola data peserta training</p>
        </div>
        <Link href="/participants/new" className="btn-primary flex items-center justify-center gap-2 flex-shrink-0 whitespace-nowrap">
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Tambah Peserta</span>
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
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Belum ada peserta terdaftar</p>
            <Link href="/participants/new" className="btn-primary mt-4 inline-block">
              Tambah Peserta Pertama
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Nama</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Kontak</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Lokasi</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Jenjang</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProfiles.map((profile) => (
                    <tr key={profile.id} className="border-b border-gray-100 hover:bg-gray-50">
                      {editingId === profile.id ? (
                        <>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={editFormData.full_name || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                              className="input text-sm w-full"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="email"
                              value={editFormData.email || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                              className="input text-sm w-full mb-2"
                            />
                            <input
                              type="tel"
                              value={editFormData.phone || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                              className="input text-sm w-full"
                              placeholder="Nomor telepon"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={editFormData.provinsi || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, provinsi: e.target.value })}
                              className="input text-sm w-full mb-2"
                              placeholder="Provinsi"
                            />
                            <input
                              type="text"
                              value={editFormData.kabupaten || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, kabupaten: e.target.value })}
                              className="input text-sm w-full"
                              placeholder="Kabupaten"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={editFormData.jenjang || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, jenjang: e.target.value })}
                              className="input text-sm w-full"
                            >
                              <option value="">Pilih Jenjang</option>
                              <option value="TK">TK</option>
                              <option value="SD">SD</option>
                              <option value="SMP">SMP</option>
                              <option value="SMA">SMA</option>
                              <option value="Universitas">Universitas</option>
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={editFormData.role || 'user'}
                              onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as any })}
                              className="input text-sm w-full"
                            >
                              <option value="user">User</option>
                              <option value="trainer">Trainer</option>
                              <option value="manager">Manager</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={saveEdit}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Simpan"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                title="Batal"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              {profile.avatar_url ? (
                                <img
                                  src={profile.avatar_url}
                                  alt={profile.full_name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                  <Users className="w-5 h-5 text-green-600" />
                                </div>
                              )}
                              <p className="text-sm font-medium text-gray-900">{profile.full_name}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm text-gray-900">{profile.email}</p>
                            {profile.phone && (
                              <p className="text-xs text-gray-500">{profile.phone}</p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {profile.provinsi || profile.kabupaten ? (
                              <div>
                                {profile.provinsi && (
                                  <p className="text-sm text-gray-900">{profile.provinsi}</p>
                                )}
                                {profile.kabupaten && (
                                  <p className="text-xs text-gray-500">{profile.kabupaten}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {profile.jenjang ? (
                              <span className="text-sm text-gray-900">{profile.jenjang}</span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`badge ${getRoleBadgeClass(profile.role)}`}>
                              {getRoleLabel(profile.role)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => startEdit(profile)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openResetPasswordModal(profile.id, profile.full_name)}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Reset Password"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openDeleteModal(profile.id, profile.full_name)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {currentProfiles.map((profile) => (
                <div key={profile.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  {editingId === profile.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editFormData.full_name || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                        className="input text-sm w-full"
                        placeholder="Nama Lengkap"
                      />
                      <input
                        type="email"
                        value={editFormData.email || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="input text-sm w-full"
                        placeholder="Email"
                      />
                      <input
                        type="tel"
                        value={editFormData.phone || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        className="input text-sm w-full"
                        placeholder="Nomor telepon"
                      />
                      <input
                        type="text"
                        value={editFormData.provinsi || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, provinsi: e.target.value })}
                        className="input text-sm w-full"
                        placeholder="Provinsi"
                      />
                      <input
                        type="text"
                        value={editFormData.kabupaten || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, kabupaten: e.target.value })}
                        className="input text-sm w-full"
                        placeholder="Kabupaten"
                      />
                      <select
                        value={editFormData.jenjang || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, jenjang: e.target.value })}
                        className="input text-sm w-full"
                      >
                        <option value="">Pilih Jenjang</option>
                        <option value="TK">TK</option>
                        <option value="SD">SD</option>
                        <option value="SMP">SMP</option>
                        <option value="SMA">SMA</option>
                        <option value="Universitas">Universitas</option>
                      </select>
                      <select
                        value={editFormData.role || 'user'}
                        onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as any })}
                        className="input text-sm w-full"
                      >
                        <option value="user">User</option>
                        <option value="trainer">Trainer</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                      <div className="flex items-center space-x-2 pt-2">
                        <button
                          onClick={saveEdit}
                          className="flex-1 btn-primary text-sm py-2"
                        >
                          <Save className="w-4 h-4 inline mr-2" />
                          Simpan
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 btn-secondary text-sm py-2"
                        >
                          <X className="w-4 h-4 inline mr-2" />
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3 flex-1">
                          {profile.avatar_url ? (
                            <img
                              src={profile.avatar_url}
                              alt={profile.full_name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                              <Users className="w-6 h-6 text-green-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{profile.full_name}</p>
                            <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                          </div>
                        </div>
                        <span className={`badge ${getRoleBadgeClass(profile.role)}`}>
                          {getRoleLabel(profile.role)}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm mb-3">
                        {profile.phone && (
                          <div className="flex items-center text-gray-600">
                            <span className="font-medium w-20">Telepon:</span>
                            <span>{profile.phone}</span>
                          </div>
                        )}
                        {(profile.provinsi || profile.kabupaten) && (
                          <div className="flex items-start text-gray-600">
                            <span className="font-medium w-20">Lokasi:</span>
                            <div>
                              {profile.provinsi && <span>{profile.provinsi}</span>}
                              {profile.provinsi && profile.kabupaten && <span>, </span>}
                              {profile.kabupaten && <span>{profile.kabupaten}</span>}
                            </div>
                          </div>
                        )}
                        {profile.jenjang && (
                          <div className="flex items-center text-gray-600">
                            <span className="font-medium w-20">Jenjang:</span>
                            <span>{profile.jenjang}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 pt-2 border-t border-gray-200">
                        <button
                          onClick={() => startEdit(profile)}
                          className="flex-1 btn-secondary text-sm py-2"
                        >
                          <Edit className="w-4 h-4 inline mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => openResetPasswordModal(profile.id, profile.full_name)}
                          className="flex-1 btn-secondary text-sm py-2"
                        >
                          <KeyRound className="w-4 h-4 inline mr-1" />
                          Reset PW
                        </button>
                        <button
                          onClick={() => openDeleteModal(profile.id, profile.full_name)}
                          className="flex-1 btn-secondary text-sm py-2 text-red-600"
                        >
                          <Trash2 className="w-4 h-4 inline mr-1" />
                          Hapus
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {!loading && filteredProfiles.length > 0 && totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
            <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
              Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredProfiles.length)} dari {filteredProfiles.length} peserta
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>

              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${currentPage === pageNum
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="hidden sm:inline">Selanjutnya</span>
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteProfile}
        title="Hapus Peserta"
        message={`Apakah Anda yakin ingin menghapus peserta "${deleteModal.userName}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteModal.isLoading}
      />

      {/* Reset Password Confirmation Modal */}
      <ConfirmationModal
        isOpen={resetPasswordModal.isOpen}
        onClose={closeResetPasswordModal}
        onConfirm={confirmResetPassword}
        title="Reset Password"
        message={`Apakah Anda yakin ingin mereset password untuk "${resetPasswordModal.userName}"? Password akan direset menjadi "Garuda-21.com".`}
        confirmText="Ya, Reset Password"
        cancelText="Batal"
        variant="default"
        isLoading={resetPasswordModal.isLoading}
      />
    </div>
  )
}
