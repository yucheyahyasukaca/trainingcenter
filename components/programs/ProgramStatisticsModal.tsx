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

      // Fetch enrollments with participant details
      // Query akan mengambil semua enrollment yang memiliki program_id yang sama
      // Baik yang langsung enroll ke program maupun yang enroll ke kelas di dalam program
      // Karena setiap enrollment (baik ke program atau kelas) tetap memiliki program_id
      const { data: enrollments, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          status,
          participant_id,
          class_id,
          participants:participant_id (
            id,
            user_id,
            user_profiles:user_id (
              id,
              full_name,
              jenjang,
              provinsi,
              kabupaten
            )
          )
        `)
        .eq('program_id', programId)

      if (error) throw error

      // Process statistics
      const processedStats: EnrollmentStats = {
        total: enrollments?.length || 0,
        byJenjang: {},
        byProvinsi: {},
        byKabupaten: {},
        enrolled: 0,
        pending: 0,
        approved: 0
      }

      enrollments?.forEach((enrollment: any) => {
        // Count by status
        if (enrollment.status === 'approved' || enrollment.status === 'enrolled') {
          processedStats.approved++
        } else if (enrollment.status === 'pending') {
          processedStats.pending++
        }

        // Count by jenjang, provinsi, kabupaten
        const participant = enrollment.participants
        if (participant) {
          // Check if jenjang/provinsi/kabupaten is directly on participant or on user_profiles
          let jenjang = participant.jenjang
          let provinsi = participant.provinsi
          let kabupaten = participant.kabupaten

          if (participant?.user_profiles) {
            const profile = Array.isArray(participant.user_profiles) 
              ? participant.user_profiles[0] 
              : participant.user_profiles

            jenjang = profile?.jenjang || jenjang
            provinsi = profile?.provinsi || provinsi
            kabupaten = profile?.kabupaten || kabupaten
          }

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
      className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Statistik Pendaftaran</h2>
            <p className="text-primary-100 text-sm mt-1">Program Pelatihan</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Memuat statistik...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Statistics Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Total Pendaftar</p>
                  <p className="text-3xl font-bold text-gray-900">{formatNumberUtil(stats.total)}</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Diterima</p>
                  <p className="text-3xl font-bold text-gray-900">{formatNumberUtil(stats.approved)}</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <BarChart3 className="w-8 h-8 text-yellow-600" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Menunggu</p>
                  <p className="text-3xl font-bold text-gray-900">{formatNumberUtil(stats.pending)}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <GraduationCap className="w-8 h-8 text-purple-600" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Tingkat Konversi</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>

              {/* Filter Section */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Filter Data</h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        setSelectedFilter('jenjang')
                        setSelectedValue('all')
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedFilter === 'jenjang'
                          ? 'bg-primary-600 text-white'
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
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedFilter === 'provinsi'
                          ? 'bg-primary-600 text-white'
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
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedFilter === 'kabupaten'
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-600'
                      }`}
                    >
                      Kabupaten
                    </button>
                  </div>
                </div>

                {/* Sub-filter */}
                {getFilterOptions().length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    {getFilterOptions().map((option) => (
                      <button
                        key={option}
                        onClick={() => setSelectedValue(option)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          selectedValue === option
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
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Grafik Berdasarkan {selectedFilter === 'jenjang' ? 'Jenjang' : selectedFilter === 'provinsi' ? 'Provinsi' : 'Kabupaten'}
                </h3>

                {chartData.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Tidak ada data untuk ditampilkan</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chartData
                      .filter(item => selectedValue === 'all' || item.label === selectedValue)
                      .map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-32 sm:w-40">
                            <p className="text-sm font-medium text-gray-700 truncate">{item.label}</p>
                          </div>
                          <div className="flex-1">
                            <div className="relative h-10 bg-gray-100 rounded-lg overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg transition-all duration-500 flex items-center justify-end pr-3"
                                style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
                              >
                                <span className="text-white text-sm font-semibold">{formatNumberUtil(item.value)}</span>
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
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

