'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ReferralPolicyManager from '@/components/admin/ReferralPolicyManager'

export default function AdminReferralPoliciesPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // For now, allow access to admin pages
    // In production, implement proper auth check
    setIsAdmin(true)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return <ReferralPolicyManager />
}
