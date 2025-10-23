'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Loader2, Gift, Percent, DollarSign } from 'lucide-react'

interface ReferralCodeInputProps {
  programId: string
  onReferralApplied: (data: any) => void
  onReferralRemoved: () => void
  initialCode?: string
}

interface ReferralData {
  referral_code: string
  trainer_name: string
  trainer_email: string
  description?: string
  original_price: number
  discount_amount: number
  final_price: number
  discount_type: 'percentage' | 'amount'
  discount_value: number
  remaining_uses?: number
  valid_until?: string
  program_title: string
}

export default function ReferralCodeInput({ 
  programId, 
  onReferralApplied, 
  onReferralRemoved,
  initialCode = ''
}: ReferralCodeInputProps) {
  const [code, setCode] = useState(initialCode)
  const [isValidating, setIsValidating] = useState(false)
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [error, setError] = useState('')
  const [showInput, setShowInput] = useState(false)

  useEffect(() => {
    if (initialCode) {
      validateReferralCode(initialCode)
    }
  }, [initialCode, programId])

  const validateReferralCode = async (referralCode: string) => {
    if (!referralCode.trim()) {
      setError('')
      setReferralData(null)
      return
    }

    setIsValidating(true)
    setError('')

    try {
      const response = await fetch(`/api/referral/apply?code=${encodeURIComponent(referralCode)}&program_id=${programId}`)
      const result = await response.json()

      if (result.success && result.valid) {
        setReferralData(result.data)
        onReferralApplied(result.data)
        setError('')
      } else {
        setError(result.error || 'Kode referral tidak valid')
        setReferralData(null)
        onReferralRemoved()
      }
    } catch (error) {
      console.error('Error validating referral code:', error)
      setError('Gagal memvalidasi kode referral')
      setReferralData(null)
      onReferralRemoved()
    } finally {
      setIsValidating(false)
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCode = e.target.value.toUpperCase()
    setCode(newCode)
    
    // Debounce validation
    const timeoutId = setTimeout(() => {
      validateReferralCode(newCode)
    }, 500)

    return () => clearTimeout(timeoutId)
  }

  const handleRemoveReferral = () => {
    setCode('')
    setReferralData(null)
    setError('')
    onReferralRemoved()
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
      month: 'long',
      day: 'numeric'
    })
  }

  if (referralData) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-green-800">
                Kode Referral Berhasil Diterapkan!
              </h4>
              <div className="mt-2 space-y-1 text-sm text-green-700">
                <p><strong>Kode:</strong> {referralData.referral_code}</p>
                <p><strong>Trainer:</strong> {referralData.trainer_name}</p>
                {referralData.description && (
                  <p><strong>Deskripsi:</strong> {referralData.description}</p>
                )}
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Gift className="h-4 w-4" />
                    <span>
                      Diskon: {referralData.discount_type === 'percentage' 
                        ? `${referralData.discount_value}%` 
                        : formatCurrency(referralData.discount_value)
                      }
                    </span>
                  </div>
                  {referralData.remaining_uses && (
                    <div className="text-xs text-green-600">
                      Sisa penggunaan: {referralData.remaining_uses}
                    </div>
                  )}
                </div>
                {referralData.valid_until && (
                  <div className="text-xs text-green-600">
                    Berlaku hingga: {formatDate(referralData.valid_until)}
                  </div>
                )}
              </div>
              <div className="mt-3 p-3 bg-white rounded border border-green-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Harga Asli:</span>
                  <span className="line-through">{formatCurrency(referralData.original_price)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-green-600 font-medium">
                  <span>Harga Setelah Diskon:</span>
                  <span>{formatCurrency(referralData.final_price)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-green-600">
                  <span>Anda Hemat:</span>
                  <span>{formatCurrency(referralData.discount_amount)}</span>
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemoveReferral}
            className="text-green-600 hover:text-green-800 transition-colors"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {!showInput && !referralData && (
        <button
          type="button"
          onClick={() => setShowInput(true)}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors text-sm"
        >
          <Gift className="h-4 w-4" />
          <span>Punya kode referral? Klik di sini</span>
        </button>
      )}

      {showInput && !referralData && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kode Referral (Opsional)
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                placeholder="Masukkan kode referral"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isValidating}
              />
              {isValidating && (
                <div className="flex items-center px-3">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                </div>
              )}
              {!isValidating && code && (
                <button
                  type="button"
                  onClick={() => {
                    setCode('')
                    setShowInput(false)
                    setError('')
                  }}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>
            {error && (
              <div className="flex items-center space-x-1 mt-1 text-sm text-red-600">
                <XCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500">
            <p>• Kode referral memberikan diskon khusus untuk program ini</p>
            <p>• Kode referral akan mempengaruhi harga yang harus dibayar</p>
          </div>
        </div>
      )}
    </div>
  )
}
