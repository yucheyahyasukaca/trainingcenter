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
      const { error } = await (supabase as any)
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
      const { error } = await (supabase as any)
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
      console.log('Viewing payment proof:', proofUrl)
      
      // If it's already a complete public URL, use it directly
      if (proofUrl.includes('supabase.garuda-21.com/storage/v1/object/public/payment-proofs/')) {
        window.open(proofUrl, '_blank')
        return
      }
      
      // If it's a relative path or just filename, construct the full URL
      let publicUrl = proofUrl
      
      if (proofUrl.startsWith('payment-proofs/')) {
        publicUrl = `https://supabase.garuda-21.com/storage/v1/object/public/${proofUrl}`
      } else if (!proofUrl.startsWith('http')) {
        publicUrl = `https://supabase.garuda-21.com/storage/v1/object/public/payment-proofs/${proofUrl}`
      }
      
      console.log('Opening URL:', publicUrl)
      
      // Open in new tab
      window.open(publicUrl, '_blank')
      
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Oops! 😅</h1>
          <p className="text-gray-600 mb-6 text-lg">Halaman ini khusus untuk Admin dan Manager saja nih!</p>
          <p className="text-gray-500 text-sm mb-8">Tapi jangan sedih, masih banyak fitur menarik lainnya yang bisa kamu akses! ✨</p>
          <a 
            href="/dashboard" 
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-medium rounded-xl hover:from-red-700 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Kembali ke Dashboard
          </a>
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
