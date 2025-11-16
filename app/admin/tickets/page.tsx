'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/hooks/useToast'
import { 
  Ticket, 
  Search, 
  Filter, 
  MessageSquare, 
  User, 
  Mail, 
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Reply,
  XCircle,
  Eye,
  UserCheck
} from 'lucide-react'
import Link from 'next/link'

interface TicketMessage {
  id: string
  created_at: string
  message: string
  sender_type: 'user' | 'admin'
  sender_name?: string
  sender_email?: string
  is_internal: boolean
}

interface TicketData {
  id: string
  ticket_id: string
  created_at: string
  updated_at: string
  full_name: string
  email: string
  phone?: string
  subject: string
  status: 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  assigned_to?: string
  resolved_at?: string
  closed_at?: string
  last_message_at?: string
  last_message_from?: 'user' | 'admin'
  ticket_messages?: TicketMessage[]
}

export default function AdminTicketsPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const addToast = useToast()
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [isReplying, setIsReplying] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    if (profile?.role === 'admin') {
      fetchTickets()
    }
  }, [profile, router, refreshKey])

  async function fetchTickets() {
    try {
      setLoading(true)
      const response = await fetch('/api/tickets?admin=true')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch tickets')
      }

      setTickets(result.data || [])
    } catch (error: any) {
      console.error('Error fetching tickets:', error)
      addToast.error(
        'Gagal Memuat Tiket',
        error.message || 'Terjadi kesalahan saat memuat data tiket',
        { duration: 5000 }
      )
    } finally {
      setLoading(false)
    }
  }

  async function fetchTicketDetails(ticketId: string) {
    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch ticket details')
      }

      setSelectedTicket(result.data)
    } catch (error: any) {
      console.error('Error fetching ticket details:', error)
      addToast.error(
        'Gagal Memuat Detail',
        error.message || 'Terjadi kesalahan saat memuat detail tiket',
        { duration: 5000 }
      )
    }
  }

  async function handleReply() {
    if (!selectedTicket || !replyMessage.trim()) return

    setIsReplying(true)
    try {
      const response = await fetch(`/api/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: replyMessage,
          is_internal: false,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send reply')
      }

      setReplyMessage('')
      // Refresh ticket details
      await fetchTicketDetails(selectedTicket.id)
      // Refresh tickets list
      setRefreshKey(prev => prev + 1)
      addToast.success(
        'Balasan Terkirim',
        'Balasan Anda berhasil dikirim ke pengguna',
        { duration: 3000 }
      )
    } catch (error: any) {
      console.error('Error sending reply:', error)
      addToast.error(
        'Gagal Mengirim Balasan',
        error.message || 'Terjadi kesalahan saat mengirim balasan',
        { duration: 5000 }
      )
    } finally {
      setIsReplying(false)
    }
  }

  async function handleUpdateStatus(ticketId: string, status: string) {
    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update status')
      }

      // Refresh tickets
      setRefreshKey(prev => prev + 1)
      if (selectedTicket?.id === ticketId) {
        await fetchTicketDetails(ticketId)
      }
      addToast.success(
        'Status Diperbarui',
        'Status tiket berhasil diperbarui',
        { duration: 3000 }
      )
    } catch (error: any) {
      console.error('Error updating status:', error)
      addToast.error(
        'Gagal Memperbarui Status',
        error.message || 'Terjadi kesalahan saat memperbarui status',
        { duration: 5000 }
      )
    }
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = 
      ticket.ticket_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; text: string }> = {
      open: { class: 'bg-blue-100 text-blue-800', text: 'Terbuka' },
      in_progress: { class: 'bg-yellow-100 text-yellow-800', text: 'Dalam Proses' },
      waiting_response: { class: 'bg-orange-100 text-orange-800', text: 'Menunggu Balasan' },
      resolved: { class: 'bg-green-100 text-green-800', text: 'Selesai' },
      closed: { class: 'bg-gray-100 text-gray-800', text: 'Ditutup' },
    }
    return badges[status] || { class: 'bg-gray-100 text-gray-800', text: status }
  }

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, { class: string; text: string }> = {
      low: { class: 'bg-gray-100 text-gray-800', text: 'Rendah' },
      normal: { class: 'bg-blue-100 text-blue-800', text: 'Normal' },
      high: { class: 'bg-orange-100 text-orange-800', text: 'Tinggi' },
      urgent: { class: 'bg-red-100 text-red-800', text: 'Mendesak' },
    }
    return badges[priority] || { class: 'bg-gray-100 text-gray-800', text: priority }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Kelola Tiket</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Kelola dan balas tiket dari pengguna
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari tiket..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="open">Terbuka</option>
            <option value="in_progress">Dalam Proses</option>
            <option value="waiting_response">Menunggu Balasan</option>
            <option value="resolved">Selesai</option>
            <option value="closed">Ditutup</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option value="all">Semua Prioritas</option>
            <option value="low">Rendah</option>
            <option value="normal">Normal</option>
            <option value="high">Tinggi</option>
            <option value="urgent">Mendesak</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredTickets.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Tidak ada tiket ditemukan</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const statusBadge = getStatusBadge(ticket.status)
              const priorityBadge = getPriorityBadge(ticket.priority)
              
              return (
                <div
                  key={ticket.id}
                  className={`bg-white rounded-xl shadow-sm border-2 transition-all cursor-pointer ${
                    selectedTicket?.id === ticket.id
                      ? 'border-primary-500 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => fetchTicketDetails(ticket.id)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <code className="text-sm font-bold text-primary-600">
                            {ticket.ticket_id}
                          </code>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusBadge.class}`}>
                            {statusBadge.text}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityBadge.class}`}>
                            {priorityBadge.text}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{ticket.subject}</h3>
                        <p className="text-sm text-gray-600">{ticket.full_name}</p>
                      </div>
                      {ticket.last_message_from === 'user' && (
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Baru
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        {ticket.email}
                      </span>
                      {ticket.phone && (
                        <span className="flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {ticket.phone}
                        </span>
                      )}
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(ticket.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Ticket Details */}
        <div className="lg:col-span-1">
          {selectedTicket ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Detail Tiket</h2>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <XCircle className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4 mb-6 max-h-[600px] overflow-y-auto">
                <div>
                  <code className="text-sm font-bold text-primary-600">{selectedTicket.ticket_id}</code>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Informasi</label>
                  <div className="mt-2 space-y-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{selectedTicket.subject}</p>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p><strong>Nama:</strong> {selectedTicket.full_name}</p>
                      <p><strong>Email:</strong> {selectedTicket.email}</p>
                      {selectedTicket.phone && (
                        <p><strong>Telepon:</strong> {selectedTicket.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    >
                      <option value="open">Terbuka</option>
                      <option value="in_progress">Dalam Proses</option>
                      <option value="waiting_response">Menunggu Balasan</option>
                      <option value="resolved">Selesai</option>
                      <option value="closed">Ditutup</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
                    Percakapan
                  </label>
                  <div className="space-y-3 mt-2">
                    {selectedTicket.ticket_messages && selectedTicket.ticket_messages.length > 0 ? (
                      selectedTicket.ticket_messages
                        .filter((msg: TicketMessage) => !msg.is_internal)
                        .map((msg: TicketMessage) => (
                          <div
                            key={msg.id}
                            className={`p-3 rounded-lg ${
                              msg.sender_type === 'admin'
                                ? 'bg-primary-50 border border-primary-200'
                                : 'bg-gray-50 border border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-gray-900">
                                {msg.sender_type === 'admin' ? 'Admin' : msg.sender_name || selectedTicket.full_name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(msg.created_at).toLocaleString('id-ID')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-gray-500">Belum ada pesan</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
                    Balas Tiket
                  </label>
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Tulis balasan Anda..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                  />
                  <button
                    onClick={handleReply}
                    disabled={isReplying || !replyMessage.trim()}
                    className="mt-2 w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isReplying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengirim...</span>
                      </>
                    ) : (
                      <>
                        <Reply className="w-4 h-4" />
                        <span>Kirim Balasan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Pilih tiket untuk melihat detail</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

