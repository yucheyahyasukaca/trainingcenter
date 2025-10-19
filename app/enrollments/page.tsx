'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Edit, Trash2, Calendar } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatCurrency } from '@/lib/utils'

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchEnrollments()
  }, [])

  async function fetchEnrollments() {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          program:programs(title, price),
          participant:participants(name, email, phone)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEnrollments(data || [])
    } catch (error) {
      console.error('Error fetching enrollments:', error)
    } finally {
      setLoading(false)
    }
  }

  async function deleteEnrollment(id: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus pendaftaran ini?')) return

    try {
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchEnrollments()
    } catch (error) {
      console.error('Error deleting enrollment:', error)
      alert('Gagal menghapus pendaftaran')
    }
  }

  const filteredEnrollments = enrollments.filter((enrollment) =>
    enrollment.participant?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    enrollment.program?.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Pendaftaran</h1>
          <p className="text-gray-600 mt-1">Kelola pendaftaran peserta ke program training</p>
        </div>
        <Link href="/enrollments/new" className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Tambah Pendaftaran</span>
        </Link>
      </div>

      <div className="card">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari pendaftaran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 input"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 animate-pulse rounded"></div>
            ))}
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Belum ada pendaftaran</p>
            <Link href="/enrollments/new" className="btn-primary mt-4 inline-block">
              Tambah Pendaftaran Pertama
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Program</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Peserta</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tanggal</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Pembayaran</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {enrollment.program?.title || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(enrollment.program?.price || 0)}
                        </p>
                      </div>
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
                      <div>
                        <span className={getPaymentBadge(enrollment.payment_status)}>
                          {enrollment.payment_status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatCurrency(enrollment.amount_paid)}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/enrollments/${enrollment.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => deleteEnrollment(enrollment.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

