'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, Gift, DollarSign, Users, Calendar, AlertCircle } from 'lucide-react'
import { useNotification } from '@/components/ui/Notification'

interface ReferralCodeInputProps {
  programId: string
  programPrice: number
  onCodeApplied?: (discount: number, discountText: string) => void
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

export default function ReferralCodeInput({ 
  programId, 
  programPrice, 
  onCodeApplied 
}: ReferralCodeInputProps) {
  const { addNotification } = useNotification()
  const [referralCode, setReferralCode] = useState('')
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([])
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [appliedCode, setAppliedCode] = useState<ReferralCode | null>(null)
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

  const validateCode = async (code: string) => {
    if (!code.trim()) return

    try {
      setValidating(true)
      const response = await fetch('/api/referral/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referral_code: code,
          program_id: programId
        })
      })

      const result = await response.json()

      if (result.success) {
        const discount = calculateDiscount(result.data)
        const discountText = formatDiscountText(result.data)
        
        setAppliedCode(result.data)
        onCodeApplied?.(discount, discountText)
        
        addNotification({
          type: 'success',
          title: 'Kode Valid',
          message: `Kode referral berhasil diterapkan! Anda mendapat diskon ${discountText}`
        })
      } else {
        addNotification({
          type: 'error',
          title: 'Kode Tidak Valid',
          message: result.error || 'Kode referral tidak valid atau sudah tidak berlaku'
        })
        setAppliedCode(null)
        onCodeApplied?.(0, '')
      }
    } catch (error) {
      console.error('Error validating code:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Gagal memvalidasi kode referral'
      })
      setAppliedCode(null)
      onCodeApplied?.(0, '')
    } finally {
      setValidating(false)
    }
  }

  const calculateDiscount = (code: ReferralCode) => {
    if (code.discount_percentage > 0) {
      return (programPrice * code.discount_percentage) / 100
    } else {
      return code.discount_amount
    }
  }

  const formatDiscountText = (code: ReferralCode) => {
    if (code.discount_percentage > 0) {
      return `${code.discount_percentage}% (${formatCurrency((programPrice * code.discount_percentage) / 100)})`
    } else {
      return formatCurrency(code.discount_amount)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleCodeChange = (value: string) => {
    setReferralCode(value.toUpperCase())
    if (value.length >= 3) {
      // Auto-validate when user types enough characters
      const timeoutId = setTimeout(() => {
        validateCode(value.toUpperCase())
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center mb-3">
        <Gift className="h-5 w-5 text-primary-600 mr-2" />
        <h4 className="text-md font-semibold text-gray-900">Kode Referral</h4>
        {appliedCode && (
          <div className="ml-2 flex items-center text-green-600">
            <Check className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">Terapkan</span>
          </div>
        )}
      </div>

      {/* Input Kode Referral */}
      <div className="mb-4">
        <input
          type="text"
          value={referralCode}
          onChange={(e) => handleCodeChange(e.target.value)}
          placeholder="Masukkan kode referral (opsional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        {validating && (
          <div className="flex items-center mt-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
            Memvalidasi kode...
          </div>
        )}
      </div>

      {/* Info Kode yang Diterapkan */}
      {appliedCode && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center text-green-800">
                <Check className="h-4 w-4 mr-2" />
                <span className="font-medium">Kode {appliedCode.code} diterapkan</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Diskon: {formatDiscountText(appliedCode)}
              </p>
            </div>
            <button
              onClick={() => {
                setAppliedCode(null)
                setReferralCode('')
                onCodeApplied?.(0, '')
              }}
              className="text-green-600 hover:text-green-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Daftar Kode Referral Tersedia */}
      {referralCodes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-medium text-gray-700">
              Kode Tersedia ({referralCodes.length})
            </h5>
            {referralCodes.length > 2 && (
              <button
                onClick={() => setShowAllCodes(!showAllCodes)}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                {showAllCodes ? 'Tutup' : 'Lihat Semua'}
              </button>
            )}
          </div>

          <div className="space-y-2">
            {(showAllCodes ? referralCodes : referralCodes.slice(0, 2)).map((code) => (
              <div key={code.id} className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-mono text-sm font-bold text-primary-600">
                        {code.code}
                      </span>
                      <button
                        onClick={() => copyToClipboard(code.code)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Salin kode"
                      >
                        {copied ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-xs text-gray-600">
                      <div className="flex items-center text-green-600">
                        <DollarSign className="h-3 w-3 mr-1" />
                        <span>{formatDiscountText(code)}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        <span>{code.trainer_name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {referralCodes.length === 0 && (
        <div className="text-center py-4">
          <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">
            Belum ada kode referral tersedia
          </p>
        </div>
      )}
    </div>
  )
}
