'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { ClassWithTrainers, Program } from '@/types'
import { 
  ArrowLeft,
  FileText,
  BookOpen,
  Calendar,
  Users,
  Eye,
  Edit,
  Plus,
  Search,
  Filter
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default function TrainerMaterialsPage() {
  const { profile, user, loading: authLoading } = useAuth()
  const [classes, setClasses] = useState<ClassWithTrainers[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const fetchTrainerClasses = async () => {
      if (!profile?.id || !user) return

      try {
        setLoading(true)
        
        // Get trainer ID from trainers table
        const { data: trainerData } = await supabase
          .from('trainers')
          .select('id')
          .eq('user_id', profile.id)
          .single()

        if (!trainerData) {
          setLoading(false)
          return
        }

        // Fetch assigned classes
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select(`
            *,
            programs(
              id,
              title,
              description,
              category
            ),
            trainers:class_trainers(
              *,
              trainer:trainers(*)
            )
          `)
          .eq('trainers.trainer_id', trainerData.id)
          .order('start_date', { ascending: false })

        if (classesError) {
          console.error('Error fetching classes:', classesError)
          return
        }

        setClasses(classesData || [])
      } catch (error) {
        console.error('Error fetching trainer classes:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrainerClasses()
  }, [profile?.id, user])

  function getStatusBadge(status: string) {
    const badges: Record<string, string> = {
      scheduled: 'px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full',
      ongoing: 'px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full',
      completed: 'px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full',
      cancelled: 'px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full',
    }
    return badges[status] || 'px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full'
  }

  function getStatusText(status: string) {
    const statusMap: Record<string, string> = {
      scheduled: 'Dijadwalkan',
      ongoing: 'Berlangsung',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
    }
    return statusMap[status] || status
  }

  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = classItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         classItem.programs?.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || classItem.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'scheduled', label: 'Dijadwalkan' },
    { value: 'ongoing', label: 'Berlangsung' },
    { value: 'completed', label: 'Selesai' },
    { value: 'cancelled', label: 'Dibatalkan' }
  ]

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Akses Ditolak</h1>
          <p className="text-gray-600 mb-6">Silakan login untuk mengakses halaman ini.</p>
          <a href="/login" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/trainer/dashboard" 
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Materi Pelatihan</h1>
              <p className="text-gray-600 mt-1">Kelola materi untuk kelas yang Anda ajar</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Classes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3 mb-4"></div>
                  <div className="h-8 bg-gray-300 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              {searchQuery || statusFilter !== 'all' 
                ? 'Tidak ada kelas yang sesuai dengan filter' 
                : 'Belum ada kelas yang ditugaskan kepada Anda'
              }
            </p>
            <Link
              href="/trainer/classes/new"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Buat Kelas Baru
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map((classItem) => (
              <div key={classItem.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <span className={getStatusBadge(classItem.status)}>
                    {getStatusText(classItem.status)}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/programs/${classItem.program_id}/classes/${classItem.id}/content`}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Kelola Materi"
                    >
                      <FileText className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/programs/${classItem.program_id}/classes/${classItem.id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">{classItem.name}</h3>
                {classItem.programs && (
                  <p className="text-sm text-gray-600 mb-4">{classItem.programs.title}</p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{formatDate(classItem.start_date)} - {formatDate(classItem.end_date)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{classItem.current_participants || 0} / {classItem.max_participants || 'Unlimited'} peserta</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <Link
                    href={`/programs/${classItem.program_id}/classes/${classItem.id}/content`}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Kelola Materi
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
