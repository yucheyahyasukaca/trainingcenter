'use client'

import { useState, useEffect } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import { useNotification } from '@/components/ui/Notification'

interface ReferralCodeFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editingCode?: any
}

export default function ReferralCodeForm({ isOpen, onClose, onSuccess, editingCode }: ReferralCodeFormProps) {
  const { addNotification } = useNotification()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    max_uses: '',
    discount_percentage: 0,
    discount_amount: 0,
    commission_percentage: 0,
    commission_amount: 0,
    valid_until: ''
  })

  useEffect(() => {
    if (editingCode) {
      setFormData({
        description: editingCode.description || '',
        max_uses: editingCode.max_uses?.toString() || '',
        discount_percentage: editingCode.discount_percentage || 0,
        discount_amount: editingCode.discount_amount || 0,
        commission_percentage: editingCode.commission_percentage || 0,
        commission_amount: editingCode.commission_amount || 0,
        valid_until: editingCode.valid_until ? editingCode.valid_until.split('T')[0] : ''
      })
    } else {
      setFormData({
        description: '',
        max_uses: '',
        discount_percentage: 0,
        discount_amount: 0,
        commission_percentage: 0,
        commission_amount: 0,
        valid_until: ''
      })
    }
  }, [editingCode, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const submitData = {
        ...formData,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null
      }

      const url = editingCode ? '/api/referral/codes' : '/api/referral/codes'
      const method = editingCode ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingCode ? { id: editingCode.id, ...submitData } : submitData)
      })

      const result = await response.json()

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Berhasil',
          message: editingCode ? 'Kode referral berhasil diperbarui' : 'Kode referral berhasil dibuat'
        })
        onSuccess()
        onClose()
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: result.error || 'Gagal menyimpan kode referral'
        })
      }
    } catch (error) {
      console.error('Error saving referral code:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Gagal menyimpan kode referral'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">
            {editingCode ? 'Edit Kode Referral' : 'Buat Kode Referral Baru'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi (Opsional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Deskripsi kode referral..."
            />
          </div>

          {/* Max Uses */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maksimal Penggunaan (Opsional)
            </label>
            <input
              type="number"
              name="max_uses"
              value={formData.max_uses}
              onChange={handleInputChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Kosongkan untuk unlimited"
            />
            <p className="text-xs text-gray-500 mt-1">Kosongkan untuk penggunaan unlimited</p>
          </div>

          {/* Valid Until */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Berlaku Hingga (Opsional)
            </label>
            <input
              type="date"
              name="valid_until"
              value={formData.valid_until}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">Kosongkan untuk tidak ada batas waktu</p>
          </div>

          {/* Discount Section */}
          <div className="border-t border-gray-200 pt-4 md:pt-6">
            <h3 className="text-base md:text-lg font-medium text-gray-900 mb-3 md:mb-4">Pengaturan Diskon</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diskon Persentase (%)
                </label>
                <input
                  type="number"
                  name="discount_percentage"
                  value={formData.discount_percentage}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diskon Jumlah (Rp)
                </label>
                <input
                  type="number"
                  name="discount_amount"
                  value={formData.discount_amount}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Pilih salah satu: persentase atau jumlah tetap. Jika keduanya diisi, akan menggunakan yang lebih besar.
            </p>
          </div>

          {/* Commission Section */}
          <div className="border-t border-gray-200 pt-4 md:pt-6">
            <h3 className="text-base md:text-lg font-medium text-gray-900 mb-3 md:mb-4">Pengaturan Komisi</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Komisi Persentase (%)
                </label>
                <input
                  type="number"
                  name="commission_percentage"
                  value={formData.commission_percentage}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Komisi Jumlah (Rp)
                </label>
                <input
                  type="number"
                  name="commission_amount"
                  value={formData.commission_amount}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Pilih salah satu: persentase atau jumlah tetap. Jika keduanya diisi, akan menggunakan yang lebih besar.
            </p>
          </div>

          {/* Preview */}
          <div className="border-t border-gray-200 pt-4 md:pt-6">
            <h3 className="text-base md:text-lg font-medium text-gray-900 mb-3 md:mb-4">Preview</h3>
            <div className="bg-gray-50 rounded-lg p-3 md:p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Diskon:</span>
                <span className="text-sm font-medium">
                  {formData.discount_percentage > 0 
                    ? `${formData.discount_percentage}%` 
                    : formData.discount_amount > 0 
                      ? `Rp ${formData.discount_amount.toLocaleString('id-ID')}`
                      : 'Tidak ada diskon'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Komisi:</span>
                <span className="text-sm font-medium">
                  {formData.commission_percentage > 0 
                    ? `${formData.commission_percentage}%` 
                    : formData.commission_amount > 0 
                      ? `Rp ${formData.commission_amount.toLocaleString('id-ID')}`
                      : 'Tidak ada komisi'
                  }
                </span>
              </div>
              {formData.max_uses && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Maksimal Penggunaan:</span>
                  <span className="text-sm font-medium">{formData.max_uses} kali</span>
                </div>
              )}
              {formData.valid_until && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Berlaku Hingga:</span>
                  <span className="text-sm font-medium">
                    {new Date(formData.valid_until).toLocaleDateString('id-ID')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 md:pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {editingCode ? 'Perbarui' : 'Buat'} Kode Referral
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
