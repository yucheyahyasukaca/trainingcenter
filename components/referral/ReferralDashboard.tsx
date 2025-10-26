'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { 
  Gift, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  Copy,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3
} from 'lucide-react'
import { useNotification } from '@/components/ui/Notification'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import ReferralCodeForm from './ReferralCodeForm'

interface ReferralStats {
  overall_stats: {
    total_referrals: number
    confirmed_referrals: number
    pending_referrals: number
    cancelled_referrals: number
    total_commission_earned: number
    confirmed_commission: number
    total_discount_given: number
    total_referral_codes: number
    active_referral_codes: number
  }
  period_stats: {
    total_referrals: number
    confirmed_referrals: number
    pending_referrals: number
    cancelled_referrals: number
    total_commission: number
    confirmed_commission: number
    total_discount: number
  }
  recent_referrals: Array<{
    id: string
    participant_name: string
    participant_email: string
    program_title: string
    program_price: number
    status: string
    commission_earned: number
    discount_applied: number
    created_at: string
  }>
  program_stats: Array<{
    program_id: string
    program_title: string
    total_referrals: number
    confirmed_referrals: number
    total_commission: number
    total_discount: number
  }>
  monthly_trend: Array<{
    month: string
    referrals: number
    confirmed: number
    commission: number
  }>
  period: string
}

interface ReferralCode {
  id: string
  code: string
  description?: string
  is_active: boolean
  max_uses?: number
  current_uses: number
  discount_percentage: number
  discount_amount: number
  commission_percentage: number
  commission_amount: number
  valid_from: string
  valid_until?: string
  created_at: string
  stats: {
    total_uses: number
    confirmed: number
    pending: number
    cancelled: number
    total_commission: number
    total_discount: number
  }
}

export default function ReferralDashboard() {
  const { profile } = useAuth()
  const { addNotification } = useNotification()
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCode, setEditingCode] = useState<ReferralCode | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })

  useEffect(() => {
    if (profile?.id) {
      fetchStats()
      fetchReferralCodes()
    }
  }, [selectedPeriod, profile?.id])

  const fetchStats = async () => {
    try {
      if (!profile?.id) {
        setStats(null)
        return
      }

      // Get trainer referral statistics using the view
      const { data: stats, error: statsError } = await supabase
        .from('trainer_referral_stats')
        .select('*')
        .eq('trainer_id', profile.id)
        .single()

      if (statsError) {
        console.error('Error fetching trainer stats:', statsError)
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Gagal memuat statistik referral'
        })
        return
      }

      // Get detailed referral tracking (simplified query to avoid foreign key issues)
      const { data: detailedStats, error: detailedError } = await supabase
        .from('referral_tracking')
        .select(`
          id,
          status,
          commission_earned,
          discount_applied,
          created_at,
          participant_id,
          program_id,
          enrollment_id,
          program:programs(
            id,
            title,
            price
          )
        `)
        .eq('trainer_id', profile.id)
        .order('created_at', { ascending: false })

      if (detailedError) {
        console.error('Error fetching detailed stats:', detailedError)
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Gagal memuat statistik detail'
        })
        return
      }

      // Filter by period
      const now = new Date()
      const filteredStats = detailedStats?.filter(stat => {
        if (selectedPeriod === 'all') return true
        
        const statDate = new Date((stat as any).created_at)
        
        switch (selectedPeriod) {
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            return statDate >= weekAgo
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            return statDate >= monthAgo
          case 'year':
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
            return statDate >= yearAgo
          default:
            return true
        }
      }) || []

      // Calculate period stats
      const periodStats = {
        total_referrals: filteredStats.length,
        confirmed_referrals: filteredStats.filter(s => (s as any).status === 'confirmed').length,
        pending_referrals: filteredStats.filter(s => (s as any).status === 'pending').length,
        cancelled_referrals: filteredStats.filter(s => (s as any).status === 'cancelled').length,
        total_commission: filteredStats.reduce((sum, s) => sum + ((s as any).commission_earned || 0), 0),
        confirmed_commission: filteredStats
          .filter(s => (s as any).status === 'confirmed')
          .reduce((sum, s) => sum + ((s as any).commission_earned || 0), 0),
        total_discount: filteredStats.reduce((sum, s) => sum + ((s as any).discount_applied || 0), 0)
      }

      // Get participant details for recent referrals
      const participantIds = [...new Set(filteredStats.map((s: any) => s.participant_id))]
      const { data: participantsData } = await supabase
        .from('participants')
        .select('id, name, email')
        .in('id', participantIds)

      const participantsMap = new Map(participantsData?.map(p => [p.id, p]) || [])

      // Get recent referrals with participant info
      const recentReferrals = filteredStats.slice(0, 10).map((stat: any) => {
        const participant = participantsMap.get(stat.participant_id)
        return {
          id: stat.id,
          participant_name: participant?.name || 'N/A',
          participant_email: participant?.email || 'N/A',
          program_title: stat.program?.title,
          program_price: stat.program?.price,
          status: stat.status,
          commission_earned: stat.commission_earned,
          discount_applied: stat.discount_applied,
          created_at: stat.created_at
        }
      })

      setStats({
        overall_stats: stats || {
          total_referrals: 0,
          confirmed_referrals: 0,
          pending_referrals: 0,
          cancelled_referrals: 0,
          total_commission_earned: 0,
          confirmed_commission: 0,
          total_discount_given: 0,
          total_referral_codes: 0,
          active_referral_codes: 0
        },
        period_stats: periodStats,
        recent_referrals: recentReferrals,
        program_stats: [],
        monthly_trend: [],
        period: selectedPeriod
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Gagal memuat statistik referral'
      })
    }
  }

  const fetchReferralCodes = async () => {
    try {
      if (!profile?.id) {
        setReferralCodes([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('referral_codes')
        .select(`
          *,
          referral_stats:referral_tracking(
            id,
            status,
            commission_earned,
            discount_applied,
            created_at
          )
        `)
        .eq('trainer_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching referral codes:', error)
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Gagal memuat kode referral'
        })
        return
      }

      setReferralCodes(data || [])
    } catch (error) {
      console.error('Error fetching referral codes:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Gagal memuat kode referral'
      })
    } finally {
      setLoading(false)
    }
  }

  const copyReferralCode = (code: string) => {
    const baseUrl = window.location.origin
    const referralUrl = `${baseUrl}/referral/${code}`
    
    navigator.clipboard.writeText(referralUrl).then(() => {
      addNotification({
        type: 'success',
        title: 'Berhasil',
        message: 'Link referral berhasil disalin ke clipboard'
      })
    }).catch(() => {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Gagal menyalin link referral'
      })
    })
  }

  const toggleCodeStatus = async (codeId: string, isActive: boolean) => {
    if (!profile?.id) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Autentikasi diperlukan untuk mengubah status kode referral.'
      })
      return
    }

    try {
      const { error } = await (supabase as any)
        .from('referral_codes')
        .update({ is_active: !isActive })
        .eq('id', codeId)
        .eq('trainer_id', profile.id) // Ensure only trainer can update their own code

      if (error) {
        console.error('Error toggling code status:', error)
        addNotification({
          type: 'error',
          title: 'Error',
          message: error.message || 'Gagal mengubah status kode referral'
        })
      } else {
        addNotification({
          type: 'success',
          title: 'Berhasil',
          message: `Kode referral ${!isActive ? 'diaktifkan' : 'dinonaktifkan'}`
        })
        fetchReferralCodes()
      }
    } catch (error) {
      console.error('Error toggling code status:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Gagal mengubah status kode referral'
      })
    }
  }

  const deleteCode = async (codeId: string) => {
    if (!profile?.id) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Autentikasi diperlukan untuk menghapus kode referral.'
      })
      return
    }

    // Show confirmation dialog
    setConfirmDialog({
      isOpen: true,
      title: 'Konfirmasi Penghapusan',
      message: 'Apakah Anda yakin ingin menghapus kode referral ini? Tindakan ini tidak dapat dibatalkan.',
      onConfirm: async () => {
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })
        
        console.log('Attempting to delete referral code:', { codeId, trainerId: profile.id })

        try {
          // First, let's check if the code exists and belongs to this trainer
          const { data: existingCode, error: checkError } = await supabase
            .from('referral_codes')
            .select('id, trainer_id')
            .eq('id', codeId)
            .eq('trainer_id', profile.id)
            .single()

          if (checkError || !existingCode) {
            console.error('Code not found or access denied:', checkError)
            addNotification({
              type: 'error',
              title: 'Error',
              message: 'Kode referral tidak ditemukan atau Anda tidak memiliki akses untuk menghapusnya'
            })
            return
          }

          // Now delete the code
          const { data, error } = await supabase
            .from('referral_codes')
            .delete()
            .eq('id', codeId)
            .eq('trainer_id', profile.id)
            .select()

          console.log('Delete result:', { data, error })

          if (error) {
            console.error('Error deleting referral code:', error)
            addNotification({
              type: 'error',
              title: 'Error',
              message: `Gagal menghapus kode referral: ${error.message}`
            })
          } else if (data && data.length > 0) {
            console.log('Successfully deleted referral code:', data)
            addNotification({
              type: 'success',
              title: 'Berhasil',
              message: 'Kode referral berhasil dihapus'
            })
            // Force refresh the list
            setTimeout(() => {
              fetchReferralCodes()
            }, 100)
          } else {
            console.log('No rows deleted')
            addNotification({
              type: 'error',
              title: 'Error',
              message: 'Kode referral tidak dapat dihapus'
            })
          }
        } catch (error) {
          console.error('Error deleting code:', error)
          addNotification({
            type: 'error',
            title: 'Error',
            message: 'Gagal menghapus kode referral'
          })
        }
      }
    })
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Dikonfirmasi'
      case 'pending':
        return 'Menunggu'
      case 'cancelled':
        return 'Dibatalkan'
      default:
        return 'Tidak Diketahui'
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
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard Referral</h1>
          <p className="text-sm md:text-base text-gray-600">Kelola kode referral dan lihat statistik komisi Anda</p>
        </div>
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          >
            <option value="all">Semua Waktu</option>
            <option value="week">Minggu Ini</option>
            <option value="month">Bulan Ini</option>
            <option value="year">Tahun Ini</option>
          </select>
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Buat Kode Referral
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
              </div>
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Referral</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.period_stats.total_referrals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
              </div>
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Dikonfirmasi</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.period_stats.confirmed_referrals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-yellow-600" />
              </div>
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Komisi</p>
                <p className="text-sm md:text-2xl font-bold text-gray-900 truncate">{formatCurrency(stats.period_stats.confirmed_commission)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Gift className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
              </div>
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Diskon Diberikan</p>
                <p className="text-sm md:text-2xl font-bold text-gray-900 truncate">{formatCurrency(stats.period_stats.total_discount)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Referral Codes */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Kode Referral Saya</h2>
        </div>
        <div className="p-3 sm:p-4 md:p-6">
          {referralCodes.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada kode referral</h3>
              <p className="mt-1 text-sm text-gray-500">Buat kode referral pertama Anda untuk mulai mendapatkan komisi</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Kode Referral
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {referralCodes.map((code) => (
                <div key={code.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col space-y-3">
                    {/* Header dengan kode dan status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">{code.code}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          code.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {code.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      {/* Action buttons untuk mobile */}
                      <div className="flex items-center space-x-1 md:hidden">
                        <button
                          onClick={() => copyReferralCode(code.code)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Salin link referral"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingCode(code)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Edit kode referral"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleCodeStatus(code.id, code.is_active)}
                          className={`p-2 transition-colors ${
                            code.is_active 
                              ? 'text-red-400 hover:text-red-600' 
                              : 'text-green-400 hover:text-green-600'
                          }`}
                          title={code.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {code.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </button>
                        {code.current_uses === 0 && (
                          <button
                            onClick={() => deleteCode(code.id)}
                            className="p-2 text-red-400 hover:text-red-600 transition-colors"
                            title="Hapus kode referral"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Description */}
                    {code.description && (
                      <p className="text-sm text-gray-600">{code.description}</p>
                    )}
                    
                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 text-sm">
                      <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                        <span className="text-gray-600 block text-xs">Penggunaan</span>
                        <span className="font-medium">{code.current_uses}{code.max_uses ? `/${code.max_uses}` : ''}</span>
                      </div>
                      <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                        <span className="text-gray-600 block text-xs">Diskon</span>
                        <span className="font-medium text-blue-600">
                          Ditentukan Admin
                        </span>
                      </div>
                      <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                        <span className="text-gray-600 block text-xs">Komisi</span>
                        <span className="font-medium text-blue-600">
                          Ditentukan Admin
                        </span>
                      </div>
                      <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                        <span className="text-gray-600 block text-xs">Total Komisi</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(
                            (code as any).referral_stats?.reduce((sum: number, stat: any) => 
                              sum + (stat.commission_earned || 0), 0
                            ) || 0
                          )}
                        </span>
                      </div>
                    </div>
                    
                    {/* Desktop action buttons */}
                    <div className="hidden md:flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => copyReferralCode(code.code)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Salin link referral"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingCode(code)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit kode referral"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleCodeStatus(code.id, code.is_active)}
                        className={`p-2 transition-colors ${
                          code.is_active 
                            ? 'text-red-400 hover:text-red-600' 
                            : 'text-green-400 hover:text-green-600'
                        }`}
                        title={code.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {code.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </button>
                      {code.current_uses === 0 && (
                        <button
                          onClick={() => deleteCode(code.id)}
                          className="p-2 text-red-400 hover:text-red-600 transition-colors"
                          title="Hapus kode referral"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Referrals */}
      {stats && stats.recent_referrals.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Referral Terbaru</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Peserta
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Program
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Komisi
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recent_referrals.map((referral) => (
                  <tr key={referral.id}>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 truncate max-w-[120px] md:max-w-none">{referral.participant_name}</div>
                        <div className="text-xs md:text-sm text-gray-500 truncate max-w-[120px] md:max-w-none">{referral.participant_email}</div>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 truncate max-w-[100px] md:max-w-none">{referral.program_title}</div>
                      <div className="text-xs md:text-sm text-gray-500">{formatCurrency(referral.program_price)}</div>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(referral.status)}
                        <span className="ml-2 text-xs md:text-sm text-gray-900">{getStatusText(referral.status)}</span>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(referral.commission_earned)}</div>
                      <div className="text-xs text-gray-500">Diskon: {formatCurrency(referral.discount_applied)}</div>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                      {formatDate(referral.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Program Stats */}
      {stats && stats.program_stats.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Statistik per Program</h2>
          </div>
          <div className="p-3 sm:p-4 md:p-6">
            <div className="space-y-2 sm:space-y-3 md:space-y-4">
              {stats.program_stats.map((program) => (
                <div key={program.program_id} className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm md:text-base truncate">{program.program_title}</h3>
                    <p className="text-xs md:text-sm text-gray-600">
                      {program.confirmed_referrals} dari {program.total_referrals} referral dikonfirmasi
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(program.total_commission)}</div>
                    <div className="text-xs md:text-sm text-gray-500">Total komisi</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Referral Code Form Modal */}
      <ReferralCodeForm
        isOpen={showCreateForm || !!editingCode}
        onClose={() => {
          setShowCreateForm(false)
          setEditingCode(null)
        }}
        onSuccess={() => {
          fetchReferralCodes()
          fetchStats()
        }}
        editingCode={editingCode}
      />
      
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
      />
    </div>
  )
}
