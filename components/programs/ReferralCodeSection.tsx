'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, Gift, Users, DollarSign, Calendar } from 'lucide-react'
import { useNotification } from '@/components/ui/Notification'

interface ReferralCodeSectionProps {
  programId: string
  programTitle: string
  programPrice: number
}

interface ReferralCode {
  id: string
  code: string
  description: string
  discount_percentage: number
  discount_amount: number
  valid_until: string | null
  trainer_name: string
}

export default function ReferralCodeSection({ 
  programId, 
  programTitle, 
  programPrice 
}: ReferralCodeSectionProps) {
  const { addNotification } = useNotification()
  const [referralCode, setReferralCode] = useState('')
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showAllCodes, setShowAllCodes] = useState(false)

  useEffect(() => {
    fetchReferralCodes()
  }, [programId])

  const fetchReferralCodes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/referral/program-codes?program_id=${programId}`)
      const result = await response.json()
      
      if (result.success) {
        setReferralCodes(result.data)
      }
    } catch (error) {
      console.error('Error fetching referral codes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyCode = async () => {
    if (!referralCode.trim()) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Masukkan kode referral'
      })
      return
    }

    try {
      const response = await fetch('/api/referral/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referral_code: referralCode,
          program_id: programId
        })
      })

      const result = await response.json()

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Berhasil',
          message: `Kode referral berhasil diterapkan! Anda mendapat diskon ${result.discount_text}`
        })
        setReferralCode('')
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: result.error || 'Kode referral tidak valid'
        })
      }
    } catch (error) {
      console.error('Error applying referral code:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Gagal menerapkan kode referral'
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    addNotification({
      type: 'success',
      title: 'Berhasil',
      message: 'Kode referral berhasil disalin'
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const calculateDiscount = (code: ReferralCode) => {
    if (code.discount_percentage > 0) {
      return `${code.discount_percentage}% (${formatCurrency((programPrice * code.discount_percentage) / 100)})`
    } else {
      return formatCurrency(code.discount_amount)
    }
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
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center mb-4">
        <Gift className="h-5 w-5 text-primary-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Kode Referral</h3>
      </div>

      {/* Input Kode Referral */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Masukkan Kode Referral
        </label>
        <div className="flex space-x-3">
          <input
            type="text"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            placeholder="Masukkan kode referral"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            onClick={handleApplyCode}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Terapkan
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Dapatkan diskon khusus dengan menggunakan kode referral dari trainer atau teman
        </p>
      </div>

      {/* Daftar Kode Referral Tersedia */}
      {referralCodes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">
              Kode Referral Tersedia ({referralCodes.length})
            </h4>
            {referralCodes.length > 3 && (
              <button
                onClick={() => setShowAllCodes(!showAllCodes)}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                {showAllCodes ? 'Tampilkan Sedikit' : 'Lihat Semua'}
              </button>
            )}
          </div>

          <div className="space-y-3">
            {(showAllCodes ? referralCodes : referralCodes.slice(0, 3)).map((code) => (
              <div key={code.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="font-mono text-lg font-bold text-primary-600">
                        {code.code}
                      </span>
                      <button
                        onClick={() => copyToClipboard(code.code)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Salin kode"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    
                    {code.description && (
                      <p className="text-sm text-gray-600 mb-2">{code.description}</p>
                    )}

                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center text-green-600">
                        <DollarSign className="h-4 w-4 mr-1" />
                        <span className="font-medium">Diskon: {calculateDiscount(code)}</span>
                      </div>
                      <div className="flex items-center text-gray-500">
                        <Users className="h-4 w-4 mr-1" />
                        <span>Dari: {code.trainer_name}</span>
                      </div>
                      {code.valid_until && (
                        <div className="flex items-center text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Berlaku hingga: {formatDate(code.valid_until)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {referralCodes.length === 0 && (
        <div className="text-center py-8">
          <Gift className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Kode Referral</h4>
          <p className="text-gray-500">
            Belum ada kode referral yang tersedia untuk program ini. Coba lagi nanti atau hubungi trainer.
          </p>
        </div>
      )}
    </div>
  )
}
