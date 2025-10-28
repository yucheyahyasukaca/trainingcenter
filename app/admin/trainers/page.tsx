'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Plus, Edit, Trash2, UserCog, Eye, Award } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/hooks/useToast'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'

interface Trainer {
  id: string
  name: string
  email: string
  specialization: string
  experience_years: number
  bio: string | null
  avatar_url: string | null
  status: string
  created_at: string
  user_id: string | null
}

export default function AdminTrainersPage() {
  const { profile } = useAuth()
  const addToast = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    // Check if user is admin or manager
    if (profile && profile.role !== 'admin' && profile.role !== 'manager') {
      router.push('/trainers')
      return
    }

    if (profile?.role === 'admin' || profile?.role === 'manager') {
      fetchTrainers()
    }
  }, [profile, router])

  // Refresh data when pathname changes (after redirect from edit)
  useEffect(() => {
    if (pathname === '/admin/trainers' && (profile?.role === 'admin' || profile?.role === 'manager')) {
      console.log('🔄 Pathname changed, refreshing trainers...')
      fetchTrainers()
    }
  }, [pathname, profile])

  // Also refresh on mount/focus to ensure fresh data
  useEffect(() => {
    const handleFocus = () => {
      if (pathname === '/admin/trainers' && (profile?.role === 'admin' || profile?.role === 'manager')) {
        console.log('🔄 Window focused, refreshing trainers...')
        fetchTrainers()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [pathname, profile])

  async function fetchTrainers() {
    try {
      setLoading(true)
      console.log('🔄 Fetching trainers...')
      const { data, error } = await supabase
        .from('trainers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching trainers:', error)
        throw error
      }
      
      console.log('✅ Trainers fetched:', data?.length || 0, 'trainers')
      setTrainers(data || [])
    } catch (error) {
      console.error('Error fetching trainers:', error)
      addToast.error('Gagal memuat data trainer', 'Error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(trainerId: string, trainerName: string) {
    if (!confirm(`Apakah Anda yakin ingin menghapus trainer "${trainerName}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('trainers')
        .delete()
        .eq('id', trainerId)

      if (error) throw error

      addToast.success('Trainer berhasil dihapus', 'Berhasil')
      fetchTrainers()
    } catch (error: any) {
      console.error('Error deleting trainer:', error)
      addToast.error('Gagal menghapus trainer: ' + error.message, 'Error')
    }
  }

  const filteredTrainers = trainers.filter((trainer) => {
    const matchesSearch = trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || trainer.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      active: 'px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full',
      inactive: 'px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full',
      pending: 'px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full',
      suspended: 'px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full',
    }
    return badges[status] || 'px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full'
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      active: 'Aktif',
      inactive: 'Tidak Aktif',
      pending: 'Menunggu',
      suspended: 'Ditangguhkan',
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manajemen Trainer</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Kelola semua trainer di platform</p>
        </div>
        <Link 
          href="/trainers/new" 
          className="inline-flex items-center justify-center px-4 py-2.5 bg-primary-600 text-white text-sm sm:text-base font-medium rounded-lg hover:bg-primary-700 transition-colors flex-shrink-0 whitespace-nowrap shadow-sm"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          <span>Tambah Trainer</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari trainer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-600'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                statusFilter === 'active'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-600'
              }`}
            >
              Aktif
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                statusFilter === 'pending'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-600'
              }`}
            >
              Menunggu
            </button>
            <button
              onClick={() => setStatusFilter('suspended')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                statusFilter === 'suspended'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-600'
              }`}
            >
              Ditangguhkan
            </button>
          </div>
        </div>
      </div>

      {/* Trainers List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 animate-pulse rounded"></div>
            ))}
          </div>
        ) : filteredTrainers.length === 0 ? (
          <div className="text-center py-12">
            <UserCog className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Belum ada trainer</p>
            <Link 
              href="/trainers/new" 
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Trainer Pertama
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Trainer</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Keahlian</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Pengalaman</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrainers.map((trainer) => (
                  <tr key={trainer.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        {trainer.avatar_url ? (
                          <img
                            src={trainer.avatar_url}
                            alt={trainer.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <UserCog className="w-5 h-5 text-primary-600" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{trainer.name}</p>
                          {trainer.bio && (
                            <p className="text-xs text-gray-500 line-clamp-1">{trainer.bio}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-gray-600">{trainer.email || '-'}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                        {trainer.specialization || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-gray-600">
                        {trainer.experience_years || 0} tahun
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <span className={getStatusBadge(trainer.status)}>
                        {getStatusText(trainer.status)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/trainer-profile/view/${trainer.id}`}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Lihat Profil"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/trainers/${trainer.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Trainer"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(trainer.id, trainer.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Trainer"
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
    </div>
  )
}

