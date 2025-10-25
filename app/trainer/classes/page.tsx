'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { ClassWithTrainers, Program } from '@/types'
import { 
  BookOpen, 
  Users, 
  Calendar, 
  Clock,
  Eye,
  FileText,
  MessageSquare,
  Plus,
  Search,
  Filter,
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatTime } from '@/lib/utils'

export default function TrainerClassesPage() {
  const { profile, user, loading: authLoading } = useAuth()
  const [classes, setClasses] = useState<ClassWithTrainers[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(3)

  useEffect(() => {
    const fetchTrainerClasses = async () => {
      if (!profile?.id || !user) return

      try {
        setLoading(true)
        
        // Use profile.id directly since class_trainers.trainer_id references user_profiles.id
        const trainerId = profile.id
        console.log('🔍 Looking for classes for trainer ID:', trainerId)

        // Try direct query from class_trainers with join
        const { data: classesData, error: classesError } = await supabase
          .from('class_trainers')
          .select(`
            class_id,
            classes!inner(
              *,
              programs(
                id,
                title,
                description,
                category,
                min_trainer_level
              )
            )
          `)
          .eq('trainer_id', trainerId)

        if (classesError) {
          console.error('Error fetching classes:', classesError)
          console.error('Error details:', {
            message: classesError.message,
            details: classesError.details,
            hint: classesError.hint,
            code: classesError.code
          })
          return
        }

        console.log('🔍 Fetched classes data:', classesData)

        // Transform data to match expected format
        const transformedClasses = classesData?.map((item: any) => ({
          ...item.classes,
          trainers: [] // We'll add this later if needed
        })) || []

        // Sort by start_date descending
        transformedClasses.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())

        console.log('🔍 Transformed classes:', transformedClasses)
        setClasses(transformedClasses)
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
                         classItem.program?.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || classItem.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentClasses = filteredClasses.slice(startIndex, endIndex)

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

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
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Halo Trainer! 🏫</h1>
          <p className="text-gray-600 mb-6 text-lg">Silakan login untuk mengakses manajemen kelas!</p>
          <p className="text-gray-500 text-sm mb-8">Mari buat pembelajaran yang menyenangkan! 🎉</p>
          <a 
            href="/login" 
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-medium rounded-xl hover:from-red-700 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Login Sekarang
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
              <h1 className="text-3xl font-bold text-gray-900">Kelas Saya</h1>
              <p className="text-gray-600 mt-1">Kelola kelas yang ditugaskan kepada Anda</p>
            </div>
          </div>
          <Link
            href="/trainer/classes/new"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Buat Kelas Baru
          </Link>
        </div>
      </div>

      <div>
        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600">
            Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredClasses.length)} dari {filteredClasses.length} kelas
          </div>
        </div>

        {/* Classes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
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
          <div className="text-center py-8 sm:py-12 bg-white rounded-xl border border-gray-200 px-4">
            <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              {searchQuery || statusFilter !== 'all' 
                ? 'Tidak ada kelas yang sesuai dengan filter' 
                : 'Belum ada kelas yang ditugaskan kepada Anda'
              }
            </p>
            <Link
              href="/trainer/classes/new"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Buat Kelas Pertama
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {currentClasses.map((classItem) => (
              <div key={classItem.id} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <span className={getStatusBadge(classItem.status)}>
                    {getStatusText(classItem.status)}
                  </span>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <Link
                      href={`/programs/${classItem.program_id}/classes/${classItem.id}`}
                      className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Link>
                    <Link
                      href={`/programs/${classItem.program_id}/classes/${classItem.id}/content`}
                      className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Kelola Materi"
                    >
                      <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Link>
                    <Link
                      href={`/programs/${classItem.program_id}/classes/${classItem.id}/forum`}
                      className="p-1.5 sm:p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Forum Diskusi"
                    >
                      <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Link>
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 line-clamp-2">{classItem.name}</h3>
                {classItem.program && (
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2">{classItem.program.title}</p>
                )}

                <div className="space-y-2 mb-3 sm:mb-4">
                  <div className="flex items-center text-xs sm:text-sm text-gray-600">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{formatDate(classItem.start_date)} - {formatDate(classItem.end_date)}</span>
                  </div>
                  <div className="flex items-center text-xs sm:text-sm text-gray-600">
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{classItem.current_participants || 0} / {classItem.max_participants || 'Unlimited'} peserta</span>
                  </div>
                </div>

                <div className="pt-3 sm:pt-4 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Link
                      href={`/programs/${classItem.program_id}/classes/${classItem.id}`}
                      className="flex-1 inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-primary-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      Detail
                    </Link>
                    <Link
                      href={`/programs/${classItem.program_id}/classes/${classItem.id}/content`}
                      className="flex-1 inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-green-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      Materi
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center text-sm text-gray-600">
                  <span>
                    Halaman {currentPage} dari {totalPages}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Sebelumnya
                  </button>
                  
                  <div className="flex items-center space-x-1">
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
                          className={`px-3 py-2 text-sm font-medium rounded-lg ${
                            currentPage === pageNum
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
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Selanjutnya
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
