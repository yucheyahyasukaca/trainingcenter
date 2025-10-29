'use client'

import { useState, useEffect } from 'react'
import { 
  Trophy, 
  Medal, 
  Award, 
  TrendingUp, 
  Users, 
  DollarSign,
  Calendar,
  BarChart3,
  Crown,
  Star
} from 'lucide-react'
import { useNotification } from '@/components/ui/Notification'

interface TrainerReferralStats {
  trainer_id: string
  trainer_name: string
  trainer_email: string
  total_referrals: number
  confirmed_referrals: number
  pending_referrals: number
  cancelled_referrals: number
  total_commission_earned: number
  confirmed_commission: number
  total_discount_given: number
  total_referral_codes: number
  active_referral_codes: number
  conversion_rate: number
  last_referral_date: string
}

interface ReferralLeaderboardProps {
  period?: 'all' | 'week' | 'month' | 'year'
}

export default function ReferralLeaderboard({ period = 'all' }: ReferralLeaderboardProps) {
  const { addNotification } = useNotification()
  const [leaderboard, setLeaderboard] = useState<TrainerReferralStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState(period)

  useEffect(() => {
    fetchLeaderboard()
  }, [selectedPeriod])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/referral/leaderboard?period=${selectedPeriod}`)
      const result = await response.json()
      
      if (result.success) {
        setLeaderboard(result.data)
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: result.error || 'Gagal memuat leaderboard referral'
        })
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Gagal memuat leaderboard referral'
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-6 w-6 text-yellow-500" />
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 2:
        return <Award className="h-6 w-6 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-gray-600">#{index + 1}</span>
    }
  }

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200'
      case 1:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
      case 2:
        return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200'
      default:
        return 'bg-white border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Leaderboard Referral</h1>
          <p className="text-sm md:text-base text-gray-600">Ranking trainer berdasarkan performa referral</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          >
            <option value="all">Semua Waktu</option>
            <option value="week">Minggu Ini</option>
            <option value="month">Bulan Ini</option>
            <option value="year">Tahun Ini</option>
          </select>
        </div>
      </div>

      {/* Top 3 Cards */}
      {leaderboard.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {leaderboard.slice(0, 3).map((trainer, index) => (
            <div key={trainer.trainer_id} className={`rounded-lg border-2 p-4 sm:p-6 ${getRankColor(index)}`}>
              <div className="flex items-start justify-between mb-4 gap-4">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getRankIcon(index)}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 text-sm md:text-base truncate">
                      {trainer.trainer_name}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 truncate">
                      {trainer.trainer_email}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg md:text-2xl font-bold text-gray-900">
                    {trainer.confirmed_referrals}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600 whitespace-nowrap">Referral</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs md:text-sm">
                <div className="bg-white/50 p-2 rounded-lg">
                  <div className="text-gray-600">Komisi</div>
                  <div className="font-semibold text-green-600">
                    {formatCurrency(trainer.confirmed_commission)}
                  </div>
                </div>
                <div className="bg-white/50 p-2 rounded-lg">
                  <div className="text-gray-600">Konversi</div>
                  <div className="font-semibold text-blue-600">
                    {trainer.conversion_rate.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Daftar Lengkap</h2>
        </div>
        
        {leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada data referral</h3>
            <p className="mt-1 text-sm text-gray-500">Data akan muncul setelah ada trainer yang membuat referral</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trainer
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referral
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Komisi
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Konversi
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kode Aktif
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Terakhir
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaderboard.map((trainer, index) => (
                  <tr key={trainer.trainer_id} className={index < 3 ? 'bg-gray-50' : ''}>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getRankIcon(index)}
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 truncate max-w-[150px] md:max-w-none">
                          {trainer.trainer_name}
                        </div>
                        <div className="text-xs md:text-sm text-gray-500 truncate max-w-[150px] md:max-w-none">
                          {trainer.trainer_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{trainer.confirmed_referrals}</div>
                        <div className="text-xs text-gray-500">
                          dari {trainer.total_referrals} total
                        </div>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium text-green-600">
                          {formatCurrency(trainer.confirmed_commission)}
                        </div>
                        <div className="text-xs text-gray-500">
                          dari {formatCurrency(trainer.total_commission_earned)}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {trainer.conversion_rate.toFixed(1)}%
                        </div>
                        <TrendingUp className="h-4 w-4 ml-1 text-green-500" />
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{trainer.active_referral_codes}</div>
                        <div className="text-xs text-gray-500">
                          dari {trainer.total_referral_codes} total
                        </div>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                      {trainer.last_referral_date ? formatDate(trainer.last_referral_date) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {leaderboard.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
              </div>
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Trainer</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{leaderboard.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Trophy className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
              </div>
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Referral</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">
                  {leaderboard.reduce((sum, t) => sum + t.confirmed_referrals, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-yellow-600" />
              </div>
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Komisi</p>
                <p className="text-sm md:text-2xl font-bold text-gray-900 truncate">
                  {formatCurrency(leaderboard.reduce((sum, t) => sum + t.confirmed_commission, 0))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
              </div>
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Rata-rata Konversi</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">
                  {(leaderboard.reduce((sum, t) => sum + t.conversion_rate, 0) / leaderboard.length).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
