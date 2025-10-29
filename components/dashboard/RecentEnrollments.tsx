'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { EnrollmentWithDetails } from '@/types'
import { formatDate } from '@/lib/utils'

export function RecentEnrollments() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEnrollments() {
      try {
        // Fetch enrollments with programs only
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select(`
            *,
            program:programs(title)
          `)
          .order('created_at', { ascending: false })
          .limit(5)

        if (enrollmentsError) throw enrollmentsError

        if (!enrollmentsData || enrollmentsData.length === 0) {
          setEnrollments([])
          setLoading(false)
          return
        }

        // Get unique participant IDs
        const participantIds = [...new Set(enrollmentsData.map(e => e.participant_id).filter(Boolean))]
        
        if (participantIds.length === 0) {
          setEnrollments(enrollmentsData)
          setLoading(false)
          return
        }

        // Fetch participants separately
        const { data: participantsData, error: participantsError } = await supabase
          .from('participants')
          .select('id, name, email')
          .in('id', participantIds)

        if (participantsError) {
          console.error('Error fetching participants:', participantsError)
          setEnrollments(enrollmentsData)
          setLoading(false)
          return
        }

        // Map participants to enrollments
        const participantsMap = new Map(
          (participantsData || []).map(p => [p.id, p])
        )

        const enrollmentsWithParticipants = enrollmentsData.map(enrollment => ({
          ...enrollment,
          participant: participantsMap.get(enrollment.participant_id) || null
        }))

        setEnrollments(enrollmentsWithParticipants)
      } catch (error) {
        console.error('Error fetching enrollments:', error)
        setEnrollments([])
      } finally {
        setLoading(false)
      }
    }

    fetchEnrollments()
  }, [])

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'badge badge-warning',
      approved: 'badge badge-success',
      rejected: 'badge badge-danger',
      completed: 'badge badge-info',
    }
    return badges[status] || 'badge'
  }

  const getPaymentBadge = (status: string) => {
    const badges: Record<string, string> = {
      unpaid: 'badge badge-danger',
      partial: 'badge badge-warning',
      paid: 'badge badge-success',
    }
    return badges[status] || 'badge'
  }

  if (loading) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Pendaftaran Terbaru</h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Pendaftaran Terbaru</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Program</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Peserta</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tanggal</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Pembayaran</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((enrollment) => (
              <tr key={enrollment.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-sm text-gray-900">
                  {enrollment.program?.title || 'N/A'}
                </td>
                <td className="py-3 px-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {enrollment.participant?.name || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {enrollment.participant?.email || 'N/A'}
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {formatDate(enrollment.enrollment_date)}
                </td>
                <td className="py-3 px-4">
                  <span className={getStatusBadge(enrollment.status)}>
                    {enrollment.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={getPaymentBadge(enrollment.payment_status)}>
                    {enrollment.payment_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

