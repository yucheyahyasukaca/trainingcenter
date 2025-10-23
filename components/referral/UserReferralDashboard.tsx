'use client'

import { useState, useEffect } from 'react'
import { 
  Gift, 
  Users, 
  CheckCircle, 
  DollarSign, 
  Copy, 
  Share2, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  BarChart3,
  TrendingUp,
  Calendar,
  Clock,
  Star
} from 'lucide-react'
import { useNotification } from '@/components/ui/Notification'

interface UserReferralStats {
  total_referrals: number
  confirmed_referrals: number
  pending_referrals: number
  cancelled_referrals: number
  total_commission_earned: number
  confirmed_commission: number
  total_discount_given: number
  conversion_rate: number
  period_stats: {
    total_referrals: number
    confirmed_referrals: number
    pending_referrals: number
    cancelled_referrals: number
    total_commission_earned: number
    confirmed_commission: number
    total_discount_given: number
  }
  recent_referrals: Array<{
    id: string
    participant_name: string
    program_title: string
    status: string
    commission_earned: number
    discount_applied: number
    created_at: string
  }>
}

interface UserReferralCode {
  id: string
  code: string
  description: string
  max_uses: number | null
  current_uses: number
  discount_percentage: number
  discount_amount: number
  commission_percentage: number
  commission_amount: number
  is_active: boolean
  valid_until: string | null
  created_at: string
  stats: {
    total_referrals: number
    confirmed_referrals: number
    total_commission: number
    total_discount: number
  }
}

interface UserReferralDashboardProps {
  period?: 'all' | 'week' | 'month' | 'year'
}

export default function UserReferralDashboard({ period = 'all' }: UserReferralDashboardProps) {
  const { addNotification } = useNotification()
  const [stats, setStats] = useState<UserReferralStats | null>(null)
  const [referralCodes, setReferralCodes] = useState<UserReferralCode[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState(period)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCode, setEditingCode] = useState<UserReferralCode | null>(null)

  useEffect(() => {
    fetchStats()
    fetchReferralCodes()
  }, [selectedPeriod])

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/referral/user-stats?period=${selectedPeriod}`)
      const result = await response.json()
      
      if (result.success) {
        setStats(result.data)
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: result.error || 'Gagal memuat statistik referral'
        })
      }
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
      const response = await fetch('/api/referral/user-codes')
      const result = await response.json()
      
      if (result.success) {
        setReferralCodes(result.data)
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: result.error || 'Gagal memuat kode referral'
        })
      }
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

  const handleCreateCode = async (codeData: any) => {
    try {
      const response = await fetch('/api/referral/user-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(codeData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Berhasil',
          message: 'Kode referral berhasil dibuat'
        })
        setShowCreateForm(false)
        fetchReferralCodes()
        fetchStats()
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: result.error || 'Gagal membuat kode referral'
        })
      }
    } catch (error) {
      console.error('Error creating code:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Gagal membuat kode referral'
      })
    }
  }

  const handleUpdateCode = async (id: string, codeData: any) => {
    try {
      const response = await fetch(`/api/referral/user-codes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(codeData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Berhasil',
          message: 'Kode referral berhasil diperbarui'
        })
        setEditingCode(null)
        fetchReferralCodes()
        fetchStats()
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: result.error || 'Gagal memperbarui kode referral'
        })
      }
    } catch (error) {
      console.error('Error updating code:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Gagal memperbarui kode referral'
      })
    }
  }

  const handleDeleteCode = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kode referral ini?')) return

    try {
      const response = await fetch(`/api/referral/user-codes/${id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Berhasil',
          message: 'Kode referral berhasil dihapus'
        })
        fetchReferralCodes()
        fetchStats()
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: result.error || 'Gagal menghapus kode referral'
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    addNotification({
      type: 'success',
      title: 'Berhasil',
      message: 'Kode referral berhasil disalin'
    })
  }

  const shareReferralCode = (code: string) => {
    const shareText = `Hai! Saya ingin mengundang Anda untuk bergabung di program pelatihan GARUDA-21. Gunakan kode referral saya: ${code} untuk mendapatkan diskon khusus!`
    
    if (navigator.share) {
      navigator.share({
        title: 'Undangan Program GARUDA-21',
        text: shareText,
        url: window.location.origin
      })
    } else {
      copyToClipboard(shareText)
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
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Referral Saya</h1>
          <p className="text-sm md:text-base text-gray-600">Bagikan kode referral dan dapatkan komisi</p>
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
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
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
                <p className="text-xs md:text-sm font-medium text-gray-600">Berhasil</p>
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
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
              </div>
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Konversi</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.conversion_rate.toFixed(1)}%</p>
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
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Buat Kode Referral
              </button>
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
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          code.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {code.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => copyToClipboard(code.code)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Salin kode"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => shareReferralCode(code.code)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Bagikan"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingCode(code)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCode(code.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
                        <span className="font-medium">
                          {code.discount_percentage > 0 
                            ? `${code.discount_percentage}%` 
                            : formatCurrency(code.discount_amount)
                          }
                        </span>
                      </div>
                      <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                        <span className="text-gray-600 block text-xs">Komisi</span>
                        <span className="font-medium">
                          {code.commission_percentage > 0 
                            ? `${code.commission_percentage}%` 
                            : formatCurrency(code.commission_amount)
                          }
                        </span>
                      </div>
                      <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                        <span className="text-gray-600 block text-xs">Total Komisi</span>
                        <span className="font-medium text-green-600">{formatCurrency(code.stats.total_commission)}</span>
                      </div>
                    </div>

                    {/* Valid until */}
                    {code.valid_until && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        Berlaku hingga: {formatDate(code.valid_until)}
                      </div>
                    )}
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
                      <div className="text-sm font-medium text-gray-900 truncate max-w-[150px] md:max-w-none">
                        {referral.participant_name}
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 truncate max-w-[150px] md:max-w-none">
                        {referral.program_title}
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        referral.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800'
                          : referral.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {referral.status === 'confirmed' ? 'Dikonfirmasi' : 
                         referral.status === 'pending' ? 'Menunggu' : 'Dibatalkan'}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(referral.commission_earned)}
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

      {/* Create/Edit Form Modal */}
      {(showCreateForm || editingCode) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => {
              setShowCreateForm(false)
              setEditingCode(null)
            }}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {editingCode ? 'Edit Kode Referral' : 'Buat Kode Referral Baru'}
                    </h3>
                    
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      const formData = new FormData(e.target as HTMLFormElement)
                      const data = {
                        description: formData.get('description'),
                        max_uses: formData.get('max_uses') ? parseInt(formData.get('max_uses') as string) : null,
                        discount_percentage: parseFloat(formData.get('discount_percentage') as string) || 0,
                        discount_amount: parseFloat(formData.get('discount_amount') as string) || 0,
                        commission_percentage: parseFloat(formData.get('commission_percentage') as string) || 0,
                        commission_amount: parseFloat(formData.get('commission_amount') as string) || 0,
                        valid_until: formData.get('valid_until') || null
                      }
                      
                      if (editingCode) {
                        handleUpdateCode(editingCode.id, data)
                      } else {
                        handleCreateCode(data)
                      }
                    }}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Deskripsi
                          </label>
                          <input
                            type="text"
                            name="description"
                            defaultValue={editingCode?.description || ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Deskripsi kode referral"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Maksimal Penggunaan
                          </label>
                          <input
                            type="number"
                            name="max_uses"
                            defaultValue={editingCode?.max_uses || ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Kosongkan untuk tidak terbatas"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Diskon (%)
                            </label>
                            <input
                              type="number"
                              name="discount_percentage"
                              defaultValue={editingCode?.discount_percentage || 0}
                              min="0"
                              max="100"
                              step="0.1"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Diskon (Rp)
                            </label>
                            <input
                              type="number"
                              name="discount_amount"
                              defaultValue={editingCode?.discount_amount || 0}
                              min="0"
                              step="1000"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Komisi (%)
                            </label>
                            <input
                              type="number"
                              name="commission_percentage"
                              defaultValue={editingCode?.commission_percentage || 0}
                              min="0"
                              max="100"
                              step="0.1"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Komisi (Rp)
                            </label>
                            <input
                              type="number"
                              name="commission_amount"
                              defaultValue={editingCode?.commission_amount || 0}
                              min="0"
                              step="1000"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Berlaku Hingga
                          </label>
                          <input
                            type="date"
                            name="valid_until"
                            defaultValue={editingCode?.valid_until ? editingCode.valid_until.split('T')[0] : ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 md:pt-6 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateForm(false)
                            setEditingCode(null)
                          }}
                          className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          {editingCode ? 'Perbarui' : 'Buat'} Kode Referral
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
