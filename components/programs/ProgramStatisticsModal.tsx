'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Users, TrendingUp, MapPin, GraduationCap, BarChart3 } from 'lucide-react'
// formatNumber utility
const formatNumberUtil = (num: number) => {
  return new Intl.NumberFormat('id-ID').format(num)
}

interface ProgramStatisticsModalProps {
  isOpen: boolean
  onClose: () => void
  programId: string
}

interface EnrollmentStats {
  total: number
  byJenjang: Record<string, number>
  byProvinsi: Record<string, number>
  byKabupaten: Record<string, number>
  enrolled: number
  pending: number
  approved: number
}

export function ProgramStatisticsModal({ isOpen, onClose, programId }: ProgramStatisticsModalProps) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<EnrollmentStats>({
    total: 0,
    byJenjang: {},
    byProvinsi: {},
    byKabupaten: {},
    enrolled: 0,
    pending: 0,
    approved: 0
  })
  const [selectedFilter, setSelectedFilter] = useState<'jenjang' | 'provinsi' | 'kabupaten'>('jenjang')
  const [selectedValue, setSelectedValue] = useState<string>('all')

  useEffect(() => {
    if (isOpen && programId) {
      fetchStatistics()
    }
  }, [isOpen, programId])

  async function fetchStatistics() {
    try {
      setLoading(true)

      // Fetch enrollments first
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('id, status, participant_id, class_id')
        .eq('program_id', programId)

      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError)
        throw enrollmentsError
      }

      console.log('Enrollments fetched:', enrollments?.length || 0)

      if (!enrollments || enrollments.length === 0) {
        setStats({
          total: 0,
          byJenjang: {},
          byProvinsi: {},
          byKabupaten: {},
          enrolled: 0,
          pending: 0,
          approved: 0
        })
        setLoading(false)
        return
      }

      // Get unique participant IDs
      const participantIds = Array.from(new Set(enrollments.map((e: any) => e.participant_id).filter(Boolean)))

      if (participantIds.length === 0) {
        setStats({
          total: enrollments.length,
          byJenjang: {},
          byProvinsi: {},
          byKabupaten: {},
          enrolled: 0,
          pending: 0,
          approved: 0
        })
        setLoading(false)
        return
      }

      // Helper to chunk array
      const chunkArray = (arr: any[], size: number) => {
        return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
          arr.slice(i * size, i * size + size)
        )
      }

      // Fetch participants (jenjang/provinsi/kabupaten are in user_profiles, not participants)
      // Batching to avoid URI too large error
      let participants: any[] = []
      const participantIdChunks = chunkArray(participantIds, 50)

      for (const chunk of participantIdChunks) {
        const { data: chunkData, error: chunkError } = await supabase
          .from('participants')
          .select('id, user_id')
          .in('id', chunk)

        if (chunkError) {
          console.error('Error fetching participants chunk:', chunkError)
        } else if (chunkData) {
          participants = [...participants, ...chunkData]
        }
      }

      // Get unique user IDs from participants
      const userIds = Array.from(new Set(
        (participants || [])
          .map((p: any) => p?.user_id)
          .filter(Boolean)
      ))

      // Fetch user_profiles if we have user IDs
      let userProfiles: any[] = []
      if (userIds.length > 0) {
        const userIdChunks = chunkArray(userIds, 50)

        for (const chunk of userIdChunks) {
          const { data: chunkData, error: chunkError } = await supabase
            .from('user_profiles')
            .select('id, jenjang, provinsi, kabupaten')
            .in('id', chunk)

          if (chunkError) {
            console.error('Error fetching user_profiles chunk:', chunkError)
          } else if (chunkData) {
            userProfiles = [...userProfiles, ...chunkData]
          }
        }
      }

      // Create maps for easy lookup
      const participantsMap = new Map((participants || []).map((p: any) => [p.id, p]))
      const profilesMap = new Map(userProfiles.map((p: any) => [p.id, p]))

      // Process statistics
      const processedStats: EnrollmentStats = {
        total: enrollments.length,
        byJenjang: {},
        byProvinsi: {},
        byKabupaten: {},
        enrolled: 0,
        pending: 0,
        approved: 0
      }

      enrollments.forEach((enrollment: any) => {
        // Count by status
        if (enrollment.status === 'approved' || enrollment.status === 'enrolled') {
          processedStats.approved++
        } else if (enrollment.status === 'pending') {
          processedStats.pending++
        }

        // Get participant data from map
        const participant = enrollment.participant_id
          ? participantsMap.get(enrollment.participant_id)
          : null

        if (participant) {
          // Initialize jenjang/provinsi/kabupaten as null
          // These fields are typically in user_profiles, not participants
          let jenjang: string | null = null
          let provinsi: string | null = null
          let kabupaten: string | null = null

          // Get jenjang/provinsi/kabupaten from user_profiles if participant has user_id
          if (participant.user_id) {
            const profile = profilesMap.get(participant.user_id)
            if (profile) {
              jenjang = profile.jenjang || null
              provinsi = profile.provinsi || null
              kabupaten = profile.kabupaten || null
            }
          }

          // Count by jenjang, provinsi, kabupaten
          if (jenjang) {
            processedStats.byJenjang[jenjang] =
              (processedStats.byJenjang[jenjang] || 0) + 1
          }
          if (provinsi) {
            processedStats.byProvinsi[provinsi] =
              (processedStats.byProvinsi[provinsi] || 0) + 1
          }
          if (kabupaten) {
            processedStats.byKabupaten[kabupaten] =
              (processedStats.byKabupaten[kabupaten] || 0) + 1
          }
        }
      })

      console.log('Processed stats:', processedStats)

      setStats(processedStats)
    } catch (error) {
      console.error('Error fetching statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get filter options based on selected filter type
  const getFilterOptions = () => {
    switch (selectedFilter) {
      case 'jenjang':
        return ['all', 'TK', 'SD', 'SMP', 'SMA', 'Universitas']
      case 'provinsi':
        return ['all', ...Object.keys(stats.byProvinsi).sort()]
      case 'kabupaten':
        return ['all', ...Object.keys(stats.byKabupaten).sort()]
      default:
        return []
    }
  }

  // Get chart data based on filter
  const getChartData = () => {
    switch (selectedFilter) {
      case 'jenjang':
        return Object.entries(stats.byJenjang)
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value)
      case 'provinsi':
        return Object.entries(stats.byProvinsi)
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10) // Top 10
      case 'kabupaten':
        return Object.entries(stats.byKabupaten)
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10) // Top 10
      default:
        return []
    }
  }

  const chartData = getChartData()
  const maxValue = chartData.length > 0 ? Math.max(...chartData.map(d => d.value)) : 0

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-[calc(100vw-1rem)] sm:max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4 sm:p-6 flex items-center justify-between flex-shrink-0">
          <div className="flex-1 min-w-0 pr-2">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate">Statistik Pendaftaran</h2>
            <p className="text-primary-100 text-xs sm:text-sm mt-1">Program Pelatihan</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
            aria-label="Tutup"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-180px)] sm:max-h-[calc(90vh-200px)] p-3 sm:p-4 md:p-6 flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12 sm:py-16 md:py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">Memuat statistik...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Statistics Boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-blue-600" />
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Total Pendaftar</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{formatNumberUtil(stats.total)}</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-green-200">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-green-600" />
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Diterima</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{formatNumberUtil(stats.approved)}</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-yellow-200">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-yellow-600" />
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Menunggu</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{formatNumberUtil(stats.pending)}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-purple-200">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-purple-600" />
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Tingkat Konversi</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                    {stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>

              {/* Filter Section */}
              <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Filter Data</h3>

                {/* Main Filter Buttons */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <button
                    onClick={() => {
                      setSelectedFilter('jenjang')
                      setSelectedValue('all')
                    }}
                    className={`px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${selectedFilter === 'jenjang'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-600'
                      }`}
                  >
                    Jenjang
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFilter('provinsi')
                      setSelectedValue('all')
                    }}
                    className={`px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${selectedFilter === 'provinsi'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-600'
                      }`}
                  >
                    Provinsi
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFilter('kabupaten')
                      setSelectedValue('all')
                    }}
                    className={`px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${selectedFilter === 'kabupaten'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-600'
                      }`}
                  >
                    Kabupaten
                  </button>
                </div>

                {/* Sub-filter */}
                {getFilterOptions().length > 1 && (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {getFilterOptions().map((option) => (
                      <button
                        key={option}
                        onClick={() => setSelectedValue(option)}
                        className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${selectedValue === option
                          ? 'bg-primary-100 text-primary-700 border-2 border-primary-600'
                          : 'bg-white text-gray-600 border border-gray-300 hover:border-primary-400'
                          }`}
                      >
                        {option === 'all' ? 'Semua' : option}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Chart Section */}
              <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4 md:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 md:mb-6">
                  Grafik Berdasarkan {selectedFilter === 'jenjang' ? 'Jenjang' : selectedFilter === 'provinsi' ? 'Provinsi' : 'Kabupaten'}
                </h3>

                {chartData.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 text-gray-500">
                    <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300" />
                    <p className="text-sm sm:text-base">Tidak ada data untuk ditampilkan</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {chartData
                      .filter(item => selectedValue === 'all' || item.label === selectedValue)
                      .map((item, idx) => (
                        <div key={idx} className="space-y-1.5">
                          {/* Label di atas bar untuk mobile */}
                          <div className="flex items-center justify-between">
                            <p className="text-xs sm:text-sm font-medium text-gray-700 truncate pr-2">{item.label}</p>
                            <span className="text-xs sm:text-sm font-semibold text-primary-700 flex-shrink-0">{formatNumberUtil(item.value)}</span>
                          </div>
                          {/* Bar chart */}
                          <div className="w-full">
                            <div className="relative h-6 sm:h-8 md:h-10 bg-gray-100 rounded-lg overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg transition-all duration-500"
                                style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`, minWidth: '2%' }}
                              >
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm sm:text-base"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

