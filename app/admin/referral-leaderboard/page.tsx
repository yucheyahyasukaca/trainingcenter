'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import ReferralLeaderboard from '@/components/referral/ReferralLeaderboard'

export default function AdminReferralLeaderboardPage() {
  const { profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!profile) {
        router.push('/login')
        return
      }
      
      if (profile.role !== 'admin') {
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

  if (!profile || profile.role !== 'admin') {
    return null
  }

  return <ReferralLeaderboard />
}
