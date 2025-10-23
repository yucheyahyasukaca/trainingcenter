'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  DollarSign, 
  Percent, 
  Calendar,
  Users,
  Settings,
  AlertCircle
} from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface ReferralPolicy {
  id: string
  program_id: string
  participant_discount_percentage: number
  participant_discount_amount: number
  participant_discount_type: 'percentage' | 'amount'
  referrer_commission_percentage: number
  referrer_commission_amount: number
  referrer_commission_type: 'percentage' | 'amount'
  max_uses_per_code: number | null
  max_total_uses: number | null
  valid_from: string
  valid_until: string | null
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
  programs: {
    title: string
    price: number
  }
  user_profiles: {
    full_name: string
  }
}

interface Program {
  id: string
  title: string
  price: number
}

export default function ReferralPolicyManager() {
  const addToast = useToast()
  const [policies, setPolicies] = useState<ReferralPolicy[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<ReferralPolicy | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    type?: 'danger' | 'warning' | 'info'
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger'
  })

  const [formData, setFormData] = useState({
    program_id: '',
    participant_discount_percentage: 0,
    participant_discount_amount: 0,
    participant_discount_type: 'percentage' as 'percentage' | 'amount',
    referrer_commission_percentage: 0,
    referrer_commission_amount: 0,
    referrer_commission_type: 'percentage' as 'percentage' | 'amount',
    max_uses_per_code: null as number | null,
    max_total_uses: null as number | null,
    valid_until: '',
    is_active: true
  })

  useEffect(() => {
    fetchPolicies()
    fetchPrograms()
  }, [])

  const fetchPolicies = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/referral-policies')
      const result = await response.json()
      
      if (result.success) {
        setPolicies(result.data)
      } else {
        addToast.error('Error', result.error || 'Gagal memuat policy referral')
      }
    } catch (error) {
      console.error('Error fetching policies:', error)
      addToast.error('Error', 'Gagal memuat policy referral')
    } finally {
      setLoading(false)
    }
  }

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs')
      const result = await response.json()
      
      if (result.success) {
        setPrograms(result.data)
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!formData.program_id) {
      addToast.error('Error', 'Pilih program terlebih dahulu')
      return
    }
    
    console.log('Submitting form data:', formData)
    
    try {
      const response = await fetch('/api/admin/referral-policies', {
        method: editingPolicy ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: editingPolicy?.id
        })
      })

      const result = await response.json()

      if (result.success) {
        addToast.success('Berhasil', `Policy referral berhasil ${editingPolicy ? 'diperbarui' : 'dibuat'}`)
        setShowForm(false)
        setEditingPolicy(null)
        resetForm()
        fetchPolicies()
      } else {
        addToast.error('Error', result.error || 'Gagal menyimpan policy referral')
      }
    } catch (error) {
      console.error('Error saving policy:', error)
      addToast.error('Error', 'Gagal menyimpan policy referral')
    }
  }

  const handleEdit = (policy: ReferralPolicy) => {
    setEditingPolicy(policy)
    setFormData({
      program_id: policy.program_id,
      participant_discount_percentage: policy.participant_discount_percentage,
      participant_discount_amount: policy.participant_discount_amount,
      participant_discount_type: policy.participant_discount_type,
      referrer_commission_percentage: policy.referrer_commission_percentage,
      referrer_commission_amount: policy.referrer_commission_amount,
      referrer_commission_type: policy.referrer_commission_type,
      max_uses_per_code: policy.max_uses_per_code,
      max_total_uses: policy.max_total_uses,
      valid_until: policy.valid_until ? policy.valid_until.split('T')[0] : '',
      is_active: policy.is_active
    })
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Policy Referral',
      message: 'Apakah Anda yakin ingin menghapus policy referral ini? Tindakan ini tidak dapat dibatalkan.',
      type: 'danger',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/referral-policies/${id}`, {
            method: 'DELETE'
          })

          const result = await response.json()

          if (result.success) {
            addToast.success('Berhasil', 'Policy referral berhasil dihapus')
            fetchPolicies()
          } else {
            addToast.error('Error', result.error || 'Gagal menghapus policy referral')
          }
        } catch (error) {
          console.error('Error deleting policy:', error)
          addToast.error('Error', 'Gagal menghapus policy referral')
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        }
      }
    })
  }

  const resetForm = () => {
    setFormData({
      program_id: '',
      participant_discount_percentage: 0,
      participant_discount_amount: 0,
      participant_discount_type: 'percentage',
      referrer_commission_percentage: 0,
      referrer_commission_amount: 0,
      referrer_commission_type: 'percentage',
      max_uses_per_code: null,
      max_total_uses: null,
      valid_until: '',
      is_active: true
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const calculateDiscount = (policy: ReferralPolicy) => {
    if (policy.participant_discount_type === 'percentage') {
      return `${policy.participant_discount_percentage}% (${formatCurrency((policy.programs.price * policy.participant_discount_percentage) / 100)})`
    } else {
      return formatCurrency(policy.participant_discount_amount)
    }
  }

  const calculateCommission = (policy: ReferralPolicy) => {
    if (policy.referrer_commission_type === 'percentage') {
      return `${policy.referrer_commission_percentage}% (${formatCurrency((policy.programs.price * policy.referrer_commission_percentage) / 100)})`
    } else {
      return formatCurrency(policy.referrer_commission_amount)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Policy Referral</h1>
          <p className="text-gray-600">Kelola policy diskon dan komisi untuk setiap program</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setEditingPolicy(null)
            setShowForm(true)
          }}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Buat Policy Baru
        </button>
      </div>

      {/* Policy List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Daftar Policy</h2>
        </div>
        
        {policies.length === 0 ? (
          <div className="text-center py-8">
            <Settings className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada policy referral</h3>
            <p className="text-gray-500">Buat policy pertama untuk mengatur diskon dan komisi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Program
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diskon Peserta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Komisi Referrer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batasan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {policies.map((policy) => (
                  <tr key={policy.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{policy.programs.title}</div>
                        <div className="text-sm text-gray-500">{formatCurrency(policy.programs.price)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{calculateDiscount(policy)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{calculateCommission(policy)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {policy.max_uses_per_code ? `Max ${policy.max_uses_per_code}/kode` : 'Unlimited'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {policy.max_total_uses ? `Total: ${policy.max_total_uses}` : 'No limit'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        policy.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {policy.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(policy)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(policy.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowForm(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        {editingPolicy ? 'Edit Policy Referral' : 'Buat Policy Referral Baru'}
                      </h3>
                      
                      <div className="space-y-4">
                        {/* Program Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Program
                          </label>
                          <select
                            value={formData.program_id}
                            onChange={(e) => setFormData({...formData, program_id: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            required
                          >
                            <option value="">Pilih Program</option>
                            {programs.map(program => (
                              <option key={program.id} value={program.id}>
                                {program.title} - {formatCurrency(program.price)}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Participant Discount */}
                        <div className="border rounded-lg p-4">
                          <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                            <DollarSign className="h-4 w-4 mr-2" />
                            Diskon untuk Peserta
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipe Diskon
                              </label>
                              <select
                                value={formData.participant_discount_type}
                                onChange={(e) => setFormData({...formData, participant_discount_type: e.target.value as 'percentage' | 'amount'})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              >
                                <option value="percentage">Persentase</option>
                                <option value="amount">Nominal</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {formData.participant_discount_type === 'percentage' ? 'Persentase (%)' : 'Nominal (Rp)'}
                              </label>
                              <input
                                type="number"
                                value={formData.participant_discount_type === 'percentage' ? formData.participant_discount_percentage : formData.participant_discount_amount}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0
                                  if (formData.participant_discount_type === 'percentage') {
                                    setFormData({...formData, participant_discount_percentage: value})
                                  } else {
                                    setFormData({...formData, participant_discount_amount: value})
                                  }
                                }}
                                min="0"
                                step={formData.participant_discount_type === 'percentage' ? "0.1" : "1000"}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Referrer Commission */}
                        <div className="border rounded-lg p-4">
                          <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                            <Percent className="h-4 w-4 mr-2" />
                            Komisi untuk Referrer
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipe Komisi
                              </label>
                              <select
                                value={formData.referrer_commission_type}
                                onChange={(e) => setFormData({...formData, referrer_commission_type: e.target.value as 'percentage' | 'amount'})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              >
                                <option value="percentage">Persentase</option>
                                <option value="amount">Nominal</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {formData.referrer_commission_type === 'percentage' ? 'Persentase (%)' : 'Nominal (Rp)'}
                              </label>
                              <input
                                type="number"
                                value={formData.referrer_commission_type === 'percentage' ? formData.referrer_commission_percentage : formData.referrer_commission_amount}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0
                                  if (formData.referrer_commission_type === 'percentage') {
                                    setFormData({...formData, referrer_commission_percentage: value})
                                  } else {
                                    setFormData({...formData, referrer_commission_amount: value})
                                  }
                                }}
                                min="0"
                                step={formData.referrer_commission_type === 'percentage' ? "0.1" : "1000"}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Usage Limits */}
                        <div className="border rounded-lg p-4">
                          <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            Batasan Penggunaan
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Max Penggunaan per Kode
                              </label>
                              <input
                                type="number"
                                value={formData.max_uses_per_code || ''}
                                onChange={(e) => setFormData({...formData, max_uses_per_code: e.target.value ? parseInt(e.target.value) : null})}
                                min="1"
                                placeholder="Kosongkan untuk unlimited"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Max Total Penggunaan
                              </label>
                              <input
                                type="number"
                                value={formData.max_total_uses || ''}
                                onChange={(e) => setFormData({...formData, max_total_uses: e.target.value ? parseInt(e.target.value) : null})}
                                min="1"
                                placeholder="Kosongkan untuk unlimited"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Validity */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Berlaku Hingga
                          </label>
                          <input
                            type="date"
                            value={formData.valid_until}
                            onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>

                        {/* Active Status */}
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                            Policy aktif
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingPolicy ? 'Perbarui' : 'Buat'} Policy
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
      />
    </div>
  )
}
