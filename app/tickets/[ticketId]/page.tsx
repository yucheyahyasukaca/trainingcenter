'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import { PublicNav } from '@/components/layout/PublicNav'
import { useToast } from '@/hooks/useToast'
import { 
  Ticket, 
  MessageSquare, 
  Send, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Mail,
  Phone,
  Clock,
  User,
  ArrowLeft,
  Copy,
  Check
} from 'lucide-react'
import Link from 'next/link'

interface TicketMessage {
  id: string
  created_at: string
  message: string
  sender_type: 'user' | 'admin'
  sender_name?: string
  sender_email?: string
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
  last_message_at?: string
  last_message_from?: 'user' | 'admin'
  ticket_messages?: TicketMessage[]
}

export default function TicketDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const ticketId = params.ticketId as string
  const email = searchParams.get('email')
  const addToast = useToast()
  
  const [ticket, setTicket] = useState<TicketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [isReplying, setIsReplying] = useState(false)
  const [copiedTicketId, setCopiedTicketId] = useState(false)

  useEffect(() => {
    if (ticketId) {
      fetchTicket()
    }
  }, [ticketId, email])

  async function fetchTicket() {
    try {
      setLoading(true)
      setError(null)
      
      let url = `/api/tickets?ticket_id=${ticketId}`
      if (email) {
        url += `&email=${encodeURIComponent(email)}`
      }

      const response = await fetch(url)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch ticket')
      }

      setTicket(result.data)
    } catch (error: any) {
      console.error('Error fetching ticket:', error)
      const errorMsg = error.message || 'Gagal memuat tiket'
      setError(errorMsg)
      addToast.error(
        'Gagal Memuat Tiket',
        errorMsg,
        { duration: 5000 }
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleReply() {
    if (!ticket || !replyMessage.trim()) return

    // Verify email if not logged in
    if (!email) {
      addToast.warning(
        'Email Diperlukan',
        'Email diperlukan untuk menambahkan pesan. Silakan akses melalui link yang dikirim.',
        { duration: 5000 }
      )
      return
    }

    setIsReplying(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: replyMessage,
          sender_email: email,
          sender_name: ticket.full_name,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send reply')
      }

      setReplyMessage('')
      // Refresh ticket
      await fetchTicket()
      addToast.success(
        'Pesan Terkirim',
        'Pesan Anda berhasil dikirim. Admin akan membalas segera.',
        { duration: 4000 }
      )
    } catch (error: any) {
      console.error('Error sending reply:', error)
      addToast.error(
        'Gagal Mengirim Pesan',
        error.message || 'Terjadi kesalahan saat mengirim pesan',
        { duration: 5000 }
      )
    } finally {
      setIsReplying(false)
    }
  }

  const copyTicketId = () => {
    if (ticket?.ticket_id) {
      navigator.clipboard.writeText(ticket.ticket_id)
      setCopiedTicketId(true)
      addToast.success(
        'Ticket ID Disalin',
        `Ticket ID ${ticket.ticket_id} berhasil disalin ke clipboard`,
        { duration: 2000 }
      )
      setTimeout(() => setCopiedTicketId(false), 2000)
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-primary-50/30 to-white">
        <PublicNav activeLink="contact" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-primary-50/30 to-white">
        <PublicNav activeLink="contact" />
        <div className="max-w-4xl mx-auto px-4 py-20">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-900 mb-2">Tiket Tidak Ditemukan</h2>
            <p className="text-red-700 mb-6">{error || 'Tiket tidak ditemukan atau Anda tidak memiliki akses'}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Kontak
              </Link>
              <Link
                href="/contact/tickets"
                className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Ticket className="w-4 h-4 mr-2" />
                Cari Tiket Saya
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const statusBadge = getStatusBadge(ticket.status)

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-primary-50/30 to-white">
      <PublicNav activeLink="contact" />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/contact"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Kontak
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Detail Tiket</h1>
              <div className="flex items-center space-x-2">
                <code className="text-lg font-bold text-primary-600">{ticket.ticket_id}</code>
                <button
                  onClick={copyTicketId}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Salin Ticket ID"
                >
                  {copiedTicketId ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusBadge.class}`}>
                  {statusBadge.text}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{ticket.subject}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Nama</p>
                <p className="font-semibold text-gray-900">{ticket.full_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-semibold text-gray-900">{ticket.email}</p>
              </div>
            </div>
            {ticket.phone && (
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Telepon</p>
                  <p className="font-semibold text-gray-900">{ticket.phone}</p>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Dibuat</p>
                <p className="font-semibold text-gray-900">
                  {new Date(ticket.created_at).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Percakapan</h2>
          
          <div className="space-y-4">
            {ticket.ticket_messages && ticket.ticket_messages.length > 0 ? (
              ticket.ticket_messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-lg ${
                    msg.sender_type === 'admin'
                      ? 'bg-primary-50 border border-primary-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {msg.sender_type === 'admin' ? (
                        <span className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1 text-primary-600" />
                          Admin
                        </span>
                      ) : (
                        msg.sender_name || ticket.full_name
                      )}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.created_at).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">Belum ada pesan</p>
            )}
          </div>
        </div>

        {/* Reply Form */}
        {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tambah Pesan</h2>
            
            <div className="space-y-4">
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Tulis pesan lanjutan Anda di sini..."
                rows={6}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                disabled={!email}
              />
              
              {!email && (
                <p className="text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  Email diperlukan untuk menambahkan pesan. Silakan akses melalui link yang dikirim atau cari tiket dengan email Anda.
                </p>
              )}
              
              <button
                onClick={handleReply}
                disabled={isReplying || !replyMessage.trim() || !email}
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReplying ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Kirim Pesan
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {ticket.status === 'closed' || ticket.status === 'resolved' ? (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mt-6">
            <p className="text-sm text-blue-800 text-center">
              {ticket.status === 'closed' 
                ? 'Tiket ini telah ditutup. Jika Anda memiliki pertanyaan lebih lanjut, silakan buat tiket baru.'
                : 'Tiket ini telah diselesaikan. Jika Anda memiliki pertanyaan lebih lanjut, silakan buat tiket baru.'}
            </p>
            <div className="mt-4 text-center">
              <Link
                href="/contact"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Ticket className="w-4 h-4 mr-2" />
                Buat Tiket Baru
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

