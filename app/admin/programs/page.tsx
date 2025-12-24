'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ProgramWithClasses } from '@/types'
import { Search, Plus, Edit, Trash2, GraduationCap, Eye, BookOpen, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/hooks/useToast'
import { useRouter } from 'next/navigation'

import { ConfirmationModal } from '@/components/ui/ConfirmationModal'

export default function AdminProgramsPage() {
  const { profile } = useAuth()
  const addToast = useToast()
  const router = useRouter()
  const [programs, setPrograms] = useState<ProgramWithClasses[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [modalState, setModalState] = useState<{
    isOpen: boolean
    type: 'delete' | 'approve' | null
    programId: string | null
    programTitle: string | null
    loading: boolean
  }>({
    isOpen: false,
    type: null,
    programId: null,
    programTitle: null,
    loading: false
  })

  useEffect(() => {
    // Check if user is admin or manager
    if (profile && profile.role !== 'admin' && profile.role !== 'manager') {
      router.push('/programs')
      return
    }

    if (profile?.role === 'admin' || profile?.role === 'manager') {
      fetchPrograms()
    }
  }, [profile, router])

  async function fetchPrograms() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          classes:classes(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPrograms(data || [])
    } catch (error) {
      console.error('Error fetching programs:', error)
      addToast.error('Gagal memuat data program', 'Error')
    } finally {
      setLoading(false)
    }
  }

  const openApproveModal = (id: string, title: string) => {
    setModalState({
      isOpen: true,
      type: 'approve',
      programId: id,
      programTitle: title,
      loading: false
    })
  }

  const openDeleteModal = (id: string, title: string) => {
    setModalState({
      isOpen: true,
      type: 'delete',
      programId: id,
      programTitle: title,
      loading: false
    })
  }

  const handleModalConfirm = async () => {
    if (!modalState.programId || !modalState.type) return

    setModalState(prev => ({ ...prev, loading: true }))

    try {
      if (modalState.type === 'approve') {
        const { error } = await (supabase as any)
          .from('programs')
          .update({ status: 'published' })
          .eq('id', modalState.programId)

        if (error) throw error
        addToast.success('Program berhasil disetujui dan diterbitkan', 'Berhasil')
      } else if (modalState.type === 'delete') {
        const { error } = await supabase
          .from('programs')
          .delete()
          .eq('id', modalState.programId)

        if (error) throw error
        addToast.success('Program berhasil dihapus', 'Berhasil')
      }

      fetchPrograms()
      setModalState({ isOpen: false, type: null, programId: null, programTitle: null, loading: false })
    } catch (error: any) {
      console.error(`Error ${modalState.type}ing program:`, error)
      addToast.error(`Gagal ${modalState.type === 'approve' ? 'menyetujui' : 'menghapus'} program: ` + error.message, 'Error')
      setModalState(prev => ({ ...prev, loading: false }))
    }
  }

  const filteredPrograms = programs.filter((program) => {
    const matchesSearch = program.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || program.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      draft: 'px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full',
      published: 'px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full',
      archived: 'px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full',
    }
    return badges[status] || 'px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full'
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      draft: 'Draft',
      published: 'Diterbitkan',
      archived: 'Diarsipkan',
    }
    return texts[status] || status
  }

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manajemen Program</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Kelola semua program training</p>
        </div>
        <Link
          href="/programs/new"
          className="inline-flex items-center justify-center px-4 py-2.5 bg-primary-600 text-white text-sm sm:text-base font-medium rounded-lg hover:bg-primary-700 transition-colors flex-shrink-0 whitespace-nowrap shadow-sm"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          <span>Tambah Program</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari program..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${statusFilter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-600'
                }`}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${statusFilter === 'draft'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-600'
                }`}
            >
              Draft
            </button>
            <button
              onClick={() => setStatusFilter('published')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${statusFilter === 'published'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-600'
                }`}
            >
              Published
            </button>
            <button
              onClick={() => setStatusFilter('archived')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${statusFilter === 'archived'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-600'
                }`}
            >
              Archived
            </button>
          </div>
        </div>
      </div>

      {/* Programs List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 animate-pulse rounded"></div>
            ))}
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Belum ada program</p>
            <Link
              href="/programs/new"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Program Pertama
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Program</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Kategori</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Harga</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Program Pelatihan</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Dibuat</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrograms.map((program) => (
                    <tr key={program.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 mb-1">{program.title}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{program.description}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                          {program.category}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-medium text-gray-900">
                          {program.is_free ? 'Gratis' : formatCurrency(program.price)}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-600">
                          {program.classes?.length || 0} program pelatihan
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <span className={getStatusBadge(program.status)}>
                          {getStatusText(program.status)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {formatDate(program.created_at)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {program.status === 'draft' && (
                            <button
                              onClick={() => openApproveModal(program.id, program.title)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Setujui Program"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <Link
                            href={`/admin/programs/${program.id}/classes`}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Lihat Program Pelatihan"
                          >
                            <BookOpen className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/programs/${program.id}/edit`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Program"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/programs/${program.id}`}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => openDeleteModal(program.id, program.title)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Program"
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

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredPrograms.map((program) => (
                <div key={program.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 mb-1 truncate">{program.title}</h3>
                      {program.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{program.description}</p>
                      )}
                    </div>
                    <span className={getStatusBadge(program.status)}>
                      {getStatusText(program.status)}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Kategori:</span>
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                        {program.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Harga:</span>
                      <span className="font-medium text-gray-900">
                        {program.is_free ? 'Gratis' : formatCurrency(program.price)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Program Pelatihan:</span>
                      <span className="text-gray-900">
                        {program.classes?.length || 0} program pelatihan
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Dibuat:</span>
                      <span className="text-gray-900">
                        {formatDate(program.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                    {program.status === 'draft' && (
                      <button
                        onClick={() => openApproveModal(program.id, program.title)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Setujui Program"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <Link
                      href={`/admin/programs/${program.id}/classes`}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Lihat Kelas"
                    >
                      <BookOpen className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/programs/${program.id}/edit`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Program"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/programs/${program.id}`}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => openDeleteModal(program.id, program.title)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus Program"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleModalConfirm}
        title={modalState.type === 'approve' ? 'Setujui Program' : 'Hapus Program'}
        message={
          modalState.type === 'approve'
            ? `Apakah Anda yakin ingin menyetujui program "${modalState.programTitle}"? Program akan menjadi Published dan dapat diakses oleh publik.`
            : `Apakah Anda yakin ingin menghapus program "${modalState.programTitle}"? Tindakan ini tidak dapat dibatalkan.`
        }
        isLoading={modalState.loading}
        confirmText={modalState.type === 'approve' ? 'Ya, Setujui' : 'Ya, Hapus'}
        cancelText="Batal"
        variant={modalState.type === 'approve' ? 'info' : 'danger'}
      />
    </div>
  )
}

