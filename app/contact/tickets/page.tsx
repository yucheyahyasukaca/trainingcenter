'use client'

import { useEffect, useState } from 'react'
import { PublicNav } from '@/components/layout/PublicNav'
import { 
  Ticket, 
  Search, 
  Mail, 
  ArrowRight,
  Loader2,
  AlertCircle,
  Send,
  ArrowLeft,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface TicketData {
  id: string
  ticket_id: string
  created_at: string
  updated_at: string
  subject: string
  status: 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed'
  last_message_at?: string
  last_message_from?: 'user' | 'admin'
}

export default function ViewTicketsPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ticketId, setTicketId] = useState('')
  const [searchMode, setSearchMode] = useState<'email' | 'ticketId'>('email')

  const handleSearchByEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Email harus diisi')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/tickets?email=${encodeURIComponent(email)}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch tickets')
      }

      setTickets(result.data || [])
      if (result.data && result.data.length === 0) {
        setError('Tidak ada tiket ditemukan dengan email tersebut')
      }
    } catch (error: any) {
      console.error('Error fetching tickets:', error)
      setError(error.message || 'Gagal memuat tiket')
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearchByTicketId = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticketId.trim()) {
      setError('Ticket ID harus diisi')
      return
    }

    try {
      router.push(`/tickets/${ticketId}`)
    } catch (error: any) {
      setError(error.message || 'Gagal mencari tiket')
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-primary-50/30 to-white">
      <PublicNav activeLink="contact" />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/contact"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Kontak
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cari Tiket Saya</h1>
          <p className="text-gray-600">
            Masukkan email atau Ticket ID Anda untuk melihat status tiket
          </p>
        </div>

        {/* Search Mode Toggle */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => {
                setSearchMode('email')
                setError(null)
                setTickets([])
              }}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                searchMode === 'email'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Mail className="w-4 h-4 inline-block mr-2" />
              Cari dengan Email
            </button>
            <button
              onClick={() => {
                setSearchMode('ticketId')
                setError(null)
                setTickets([])
              }}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                searchMode === 'ticketId'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Ticket className="w-4 h-4 inline-block mr-2" />
              Cari dengan Ticket ID
            </button>
          </div>

          {/* Search Form */}
          {searchMode === 'email' ? (
            <form onSubmit={handleSearchByEmail} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                  Email
                </label>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Search className="w-5 h-5 mr-2" />
                        Cari
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSearchByTicketId} className="space-y-4">
              <div>
                <label htmlFor="ticketId" className="block text-sm font-semibold text-gray-900 mb-2">
                  Ticket ID
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    id="ticketId"
                    value={ticketId}
                    onChange={(e) => setTicketId(e.target.value)}
                    placeholder="TKT-2025-0001"
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-mono"
                    required
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors flex items-center"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Lihat
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Tickets List */}
        {tickets.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tiket Anda</h2>
            
            <div className="space-y-4">
              {tickets.map((ticket) => {
                const statusBadge = getStatusBadge(ticket.status)
                
                return (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.ticket_id}?email=${encodeURIComponent(email)}`}
                    className="block p-4 border-2 border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <code className="text-sm font-bold text-primary-600">
                            {ticket.ticket_id}
                          </code>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusBadge.class}`}>
                            {statusBadge.text}
                          </span>
                          {ticket.last_message_from === 'admin' && (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              Ada Balasan
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{ticket.subject}</h3>
                        <p className="text-sm text-gray-500">
                          Dibuat: {new Date(ticket.created_at).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 ml-4" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && tickets.length === 0 && !error && email && (
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-8 text-center">
            <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Tidak ada tiket ditemukan</p>
            <Link
              href="/contact"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Send className="w-4 h-4 mr-2" />
              Buat Tiket Baru
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

