'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import ReferralDashboard from '@/components/referral/ReferralDashboard'

export default function TrainerReferralPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!profile) {
        router.push('/login')
        return
      }
      
      if ((profile as any).role !== 'trainer') {
        router.push('/dashboard')
        return
      }
    }
  }, [profile, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!profile || (profile as any).role !== 'trainer') {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-4 md:py-6 lg:py-8">
      <ReferralDashboard />
    </div>
  )
}
