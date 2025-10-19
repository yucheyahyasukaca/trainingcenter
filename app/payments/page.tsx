'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, CheckCircle, XCircle, Eye, Download, Clock } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { useAuth } from '@/components/AuthProvider'
import { useNotification } from '@/components/ui/Notification'
import Link from 'next/link'

export default function PaymentsPage() {
  const { profile } = useAuth()
  const { addNotification } = useNotification()
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    fetchPayments()
  }, [])

  async function fetchPayments() {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          program:programs(title, price),
          participant:participants(name, email, phone),
          class:classes(name)
        `)
        .not('payment_proof_url', 'is', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPayments(data || [])
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  async function approvePayment(id: string) {
    try {
      const { error } = await supabase
        .from('enrollments')
        .update({ 
          status: 'approved',
          payment_status: 'paid'
        })
        .eq('id', id)

      if (error) throw error
      fetchPayments()
      addNotification({
        type: 'success',
        title: 'Pembayaran Disetujui!',
        message: 'User sekarang dapat mengakses kelas.',
        duration: 5000
      })
    } catch (error) {
      console.error('Error approving payment:', error)
      addNotification({
        type: 'error',
        title: 'Gagal Menyetujui',
        message: 'Gagal menyetujui pembayaran',
        duration: 5000
      })
    }
  }

  async function rejectPayment(id: string) {
    const reason = prompt('Alasan penolakan:')
    if (!reason) return

    try {
      const { error } = await supabase
        .from('enrollments')
        .update({ 
          status: 'rejected',
          notes: `Pembayaran ditolak: ${reason}`
        })
        .eq('id', id)

      if (error) throw error
      fetchPayments()
      addNotification({
        type: 'warning',
        title: 'Pembayaran Ditolak',
        message: `Pembayaran ditolak dengan alasan: ${reason}`,
        duration: 6000
      })
    } catch (error) {
      console.error('Error rejecting payment:', error)
      addNotification({
        type: 'error',
        title: 'Gagal Menolak',
        message: 'Gagal menolak pembayaran',
        duration: 5000
      })
    }
  }

  async function viewPaymentProof(proofUrl: string) {
    try {
      // Extract file path from URL
      const url = new URL(proofUrl)
      const pathParts = url.pathname.split('/')
      const bucketName = pathParts[2] // 'payment-proofs'
      const filePath = pathParts.slice(3).join('/') // everything after bucket name
      
      console.log('Viewing payment proof:', { bucketName, filePath })
      
      // Get signed URL for viewing
      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrl(filePath, 3600) // 1 hour expiry
      
      if (error) {
        console.error('Error creating signed URL:', error)
        addNotification({
          type: 'error',
          title: 'Gagal Membuka File',
          message: 'Tidak dapat mengakses bukti pembayaran. Pastikan file masih ada.',
          duration: 5000
        })
        return
      }
      
      // Open in new tab
      window.open(data.signedUrl, '_blank')
      
    } catch (error) {
      console.error('Error viewing payment proof:', error)
      addNotification({
        type: 'error',
        title: 'Gagal Membuka File',
        message: 'Tidak dapat mengakses bukti pembayaran. Coba lagi nanti.',
        duration: 5000
      })
    }
  }

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = 
      payment.participant?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.program?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.participant?.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = 
      filterStatus === 'all' || 
      payment.status === filterStatus

    return matchesSearch && matchesFilter
  })

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full',
      approved: 'px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full',
      rejected: 'px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full',
    }
    return badges[status] || 'px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full'
  }

  const getPaymentStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      unpaid: 'px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full',
      partial: 'px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full',
      paid: 'px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full',
    }
    return badges[status] || 'px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full'
  }

  if (profile?.role !== 'admin' && profile?.role !== 'manager') {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h1>
          <p className="text-gray-600">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Pembayaran</h1>
          <p className="text-gray-600 mt-1">Kelola pembayaran dan aktivasi kelas peserta</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari pembayaran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 animate-pulse rounded"></div>
            ))}
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Belum ada pembayaran yang perlu diproses</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Peserta</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Program</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Kelas</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Jumlah</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Tanggal</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{payment.participant?.name}</p>
                        <p className="text-sm text-gray-600">{payment.participant?.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{payment.program?.title}</p>
                        <p className="text-sm text-gray-600">{formatCurrency(payment.program?.price || 0)}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-gray-900">{payment.class?.name || '-'}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-gray-900">{formatCurrency(payment.amount_paid || 0)}</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <span className={getStatusBadge(payment.status)}>
                          {payment.status === 'approved' ? 'Disetujui' :
                           payment.status === 'pending' ? 'Menunggu' : 'Ditolak'}
                        </span>
                        <br />
                        <span className={getPaymentStatusBadge(payment.payment_status)}>
                          {payment.payment_status === 'paid' ? 'Lunas' :
                           payment.payment_status === 'partial' ? 'Sebagian' : 'Belum Bayar'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-gray-600">{formatDate(payment.created_at)}</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        {payment.payment_proof_url && (
                          <button
                            onClick={() => viewPaymentProof(payment.payment_proof_url)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Lihat Bukti Pembayaran"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {payment.status === 'pending' && (
                          <>
                            <button
                              onClick={() => approvePayment(payment.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Setujui Pembayaran"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => rejectPayment(payment.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Tolak Pembayaran"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
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
