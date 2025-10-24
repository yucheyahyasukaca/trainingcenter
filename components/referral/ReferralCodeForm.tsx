'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { X, Save, Loader2 } from 'lucide-react'
import { useNotification } from '@/components/ui/Notification'

interface ReferralCodeFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editingCode?: any
}

export default function ReferralCodeForm({ isOpen, onClose, onSuccess, editingCode }: ReferralCodeFormProps) {
  const { profile } = useAuth()
  const { addNotification } = useNotification()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    max_uses: '',
    valid_until: ''
  })

  useEffect(() => {
    if (editingCode) {
      setFormData({
        description: editingCode.description || '',
        max_uses: editingCode.max_uses?.toString() || '',
        valid_until: editingCode.valid_until ? editingCode.valid_until.split('T')[0] : ''
      })
    } else {
      setFormData({
        description: '',
        max_uses: '',
        valid_until: ''
      })
    }
  }, [editingCode, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!profile?.id) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'User tidak terautentikasi'
        })
        return
      }

      const submitData = {
        description: formData.description,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
        discount_percentage: 0,
        discount_amount: 0,
        commission_percentage: 0,
        commission_amount: 0,
        is_active: true
      }

      if (editingCode) {
        // Update existing code
        const { error } = await (supabase as any)
          .from('referral_codes')
          .update(submitData)
          .eq('id', editingCode.id)
          .eq('trainer_id', profile.id)

        if (error) {
          console.error('Error updating referral code:', error)
          addNotification({
            type: 'error',
            title: 'Error',
            message: 'Gagal memperbarui kode referral'
          })
          return
        }

        addNotification({
          type: 'success',
          title: 'Berhasil',
          message: 'Kode referral berhasil diperbarui'
        })
      } else {
        // Create new code
        const generateReferralCode = (trainerName: string): string => {
          const baseCode = trainerName.replace(/\s+/g, '').toUpperCase().substring(0, 3)
          const timestamp = Date.now().toString().slice(-3)
          return `${baseCode}${timestamp}`
        }

        const referralCode = generateReferralCode(profile.full_name || 'USER')

        const { error } = await (supabase as any)
          .from('referral_codes')
          .insert({
            trainer_id: profile.id,
            code: referralCode,
            ...submitData
          })

        if (error) {
          console.error('Error creating referral code:', error)
          addNotification({
            type: 'error',
            title: 'Error',
            message: 'Gagal membuat kode referral'
          })
          return
        }

        addNotification({
          type: 'success',
          title: 'Berhasil',
          message: 'Kode referral berhasil dibuat'
        })
      }

      onSuccess()
      onClose()
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

          {/* Info about referral policies */}
          <div className="border-t border-gray-200 pt-4 md:pt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Informasi Komisi & Diskon
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Komisi dan diskon untuk kode referral Anda ditentukan oleh admin berdasarkan program yang dipilih. 
                      Anda hanya perlu membuat kode referral dan membagikannya untuk mendapatkan komisi sesuai dengan policy yang berlaku.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="border-t border-gray-200 pt-4 md:pt-6">
            <h3 className="text-base md:text-lg font-medium text-gray-900 mb-3 md:mb-4">Preview</h3>
            <div className="bg-gray-50 rounded-lg p-3 md:p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Komisi & Diskon:</span>
                <span className="text-sm font-medium text-blue-600">
                  Akan ditentukan oleh admin
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
