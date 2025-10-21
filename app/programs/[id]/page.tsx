'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

export default function ProgramRedirectPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { profile } = useAuth()

  useEffect(() => {
    // Redirect based on user role
    if (profile?.role === 'admin' || profile?.role === 'manager') {
      // Admin/Manager go to edit page
      router.push(`/programs/${params.id}/edit`)
    } else {
      // Regular users go to their enrollments
      router.push('/my-enrollments')
    }
  }, [profile, params.id, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Mengarahkan...</p>
      </div>
    </div>
  )
}