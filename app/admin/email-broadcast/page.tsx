'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Mail, Plus, History, FileText, Send, Clock, Users, CheckCircle, X, Trash2, Eye } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface EmailRecipient {
    id: string
    recipient_email: string
    recipient_name: string
    status: string
    message_id?: string
    error_message?: string
    sent_at?: string
    delivered_at?: string
}

interface EmailLog {
    id: string
    template_id: string
    recipient_count: number
    status: string
    sent_at: string
    details: any
    status_summary?: {
        pending: number
        queued: number
        sent: number
        delivered: number
        failed: number
        bounced: number
    }
    email_templates?: {
        name: string
        subject: string
        content?: string
    }
    email_recipients?: EmailRecipient[]
}

export default function EmailBroadcastDashboard() {
    const [logs, setLogs] = useState<EmailLog[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [loadingDetail, setLoadingDetail] = useState(false)

    useEffect(() => {
        fetchLogs()
    }, [])

    const fetchLogs = async () => {
        try {
            console.log('🔄 Fetching email logs...')
            console.log('🌐 API URL:', '/api/admin/email-logs')
            console.log('📍 Environment:', typeof window !== 'undefined' ? window.location.origin : 'SSR')
            
            const res = await fetch('/api/admin/email-logs', {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            })
            
            console.log('📡 Response status:', res.status, res.statusText)
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
                console.error('❌ API Error:', errorData)
                throw new Error(errorData.error || `Failed to fetch logs: ${res.status}`)
            }
            
            const data = await res.json()
            console.log('✅ API Response:', data)
            console.log('📊 Data type:', Array.isArray(data) ? 'Array' : typeof data)
            console.log('📊 Data length:', Array.isArray(data) ? data.length : 'N/A')
            
            if (!Array.isArray(data)) {
                console.warn('⚠️ Response is not an array:', data)
                setLogs([])
                return
            }
            
            console.log('✅ Fetched', data.length, 'email logs')
            console.log('📋 Log IDs:', data.map((log: EmailLog) => log.id))
            setLogs(data)
            console.log('🔄 State updated with', data.length, 'logs')
        } catch (error: any) {
            console.error('❌ Error fetching logs:', error)
            console.error('❌ Error details:', {
                message: error.message,
                stack: error.stack
            })
            toast.error(error.message || 'Gagal memuat riwayat email')
            setLogs([]) // Set empty array on error
        } finally {
            setLoading(false)
        }
    }

    const fetchLogDetail = async (id: string) => {
        setLoadingDetail(true)
        try {
            const res = await fetch(`/api/admin/email-logs/${id}`)
            if (!res.ok) throw new Error('Failed to fetch log detail')
            const data = await res.json()
            setSelectedLog(data)
            setShowModal(true)
        } catch (error) {
            console.error('Error fetching log detail:', error)
            toast.error('Gagal memuat detail email')
        } finally {
            setLoadingDetail(false)
        }
    }

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()

        if (!confirm('Apakah Anda yakin ingin menghapus riwayat ini?')) return

        // Optimistic update: remove from UI immediately
        const previousLogs = [...logs]
        console.log('📋 Current logs before delete:', logs.length)
        setLogs(prevLogs => {
            const filtered = prevLogs.filter(log => log.id !== id)
            console.log('📋 Logs after filter:', filtered.length, '(removed:', prevLogs.length - filtered.length, ')')
            return filtered
        })

        try {
            console.log('🗑️ Attempting to delete email log:', id)
            const res = await fetch(`/api/admin/email-logs/${id}`, {
                method: 'DELETE'
            })
            
            const data = await res.json()
            
            if (!res.ok) {
                console.error('❌ Delete failed:', data)
                // Revert optimistic update on error
                setLogs(previousLogs)
                throw new Error(data.error || 'Failed to delete')
            }

            console.log('✅ Delete successful:', data)
            toast.success('Riwayat berhasil dihapus')
            
            // Refresh logs to ensure consistency
            await fetchLogs()
            
            if (showModal && selectedLog?.id === id) {
                setShowModal(false)
                setSelectedLog(null)
            }
        } catch (error: any) {
            console.error('❌ Error deleting log:', error)
            // Revert optimistic update on error
            setLogs(previousLogs)
            toast.error(error.message || 'Gagal menghapus riwayat')
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Email Broadcast</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <Link href="/admin/email-broadcast/templates/new" className="block">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-primary-500 transition-colors cursor-pointer h-full">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                            <Plus className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Buat Template Baru</h3>
                        <p className="text-gray-500 mt-2">Buat desain email baru untuk newsletter atau notifikasi.</p>
                    </div>
                </Link>

                <Link href="/admin/email-broadcast/send" className="block">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-primary-500 transition-colors cursor-pointer h-full">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                            <Send className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Kirim Broadcast</h3>
                        <p className="text-gray-500 mt-2">Kirim email masal ke peserta atau trainer menggunakan template.</p>
                    </div>
                </Link>

                <Link href="/admin/email-broadcast/templates" className="block">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-primary-500 transition-colors cursor-pointer h-full">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                            <FileText className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Kelola Template</h3>
                        <p className="text-gray-500 mt-2">Lihat dan edit template email yang sudah ada.</p>
                    </div>
                </Link>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-6">
                    <History className="w-5 h-5 text-gray-500" />
                    <h2 className="text-lg font-semibold text-gray-900">Riwayat Broadcast Terakhir</h2>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-500">
                        <p>Memuat riwayat...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p>Belum ada riwayat pengiriman email.</p>
                        <p className="text-sm mt-2">Mulai dengan membuat template dan mengirim broadcast.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {logs.map((log) => (
                            <div
                                key={log.id}
                                onClick={() => fetchLogDetail(log.id)}
                                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                            >
                                {/* Mobile & Desktop Layout */}
                                <div className="flex flex-col md:flex-row md:items-center gap-3">
                                    {/* Template Info */}
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Mail className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">
                                                {log.email_templates?.name || 'Template Dihapus'}
                                            </p>
                                            <p className="text-sm text-gray-500 truncate">
                                                {log.email_templates?.subject || '-'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stats - Horizontal on mobile, side by side on desktop */}
                                    <div className="flex items-center gap-4 md:gap-6 flex-wrap md:flex-shrink-0">
                                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                                            <Users className="w-4 h-4 flex-shrink-0" />
                                            <span className="whitespace-nowrap">{log.recipient_count} penerima</span>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            {log.status === 'queued' || log.status === 'sent' ? (
                                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            ) : (
                                                <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                                            )}
                                            <span className="text-sm text-gray-500 whitespace-nowrap">
                                                {formatDate(log.sent_at)}
                                            </span>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    fetchLogDetail(log.id)
                                                }}
                                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Lihat Detail"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(log.id, e)}
                                                className="p-1.5 text-red-600 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showModal && selectedLog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Mail className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {selectedLog.email_templates?.name || 'Template Dihapus'}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {formatDate(selectedLog.sent_at)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-500">Penerima</p>
                                    <p className="text-2xl font-semibold text-gray-900">{selectedLog.recipient_count}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-500">Status</p>
                                    <p className={`text-lg font-medium capitalize ${
                                        selectedLog.status === 'sent' ? 'text-green-600' :
                                        selectedLog.status === 'failed' ? 'text-red-600' :
                                        selectedLog.status === 'queued' ? 'text-yellow-600' :
                                        'text-gray-600'
                                    }`}>
                                        {selectedLog.status}
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg col-span-2">
                                    <p className="text-sm text-gray-500">Target</p>
                                    <p className="text-lg font-medium text-gray-900 capitalize">
                                        {selectedLog.details?.target === 'all' ? 'Semua User' :
                                            selectedLog.details?.target === 'trainers' ? 'Trainer' :
                                                selectedLog.details?.target === 'admins' ? 'Admin' : 'Spesifik'}
                                    </p>
                                </div>
                            </div>

                            {/* Status Summary */}
                            {selectedLog.status_summary && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Status Breakdown</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {selectedLog.status_summary.sent > 0 && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Terkirim</span>
                                                <span className="text-sm font-semibold text-green-600">{selectedLog.status_summary.sent}</span>
                                            </div>
                                        )}
                                        {selectedLog.status_summary.queued > 0 && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Dalam Antrian</span>
                                                <span className="text-sm font-semibold text-yellow-600">{selectedLog.status_summary.queued}</span>
                                            </div>
                                        )}
                                        {selectedLog.status_summary.pending > 0 && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Menunggu</span>
                                                <span className="text-sm font-semibold text-gray-600">{selectedLog.status_summary.pending}</span>
                                            </div>
                                        )}
                                        {selectedLog.status_summary.failed > 0 && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Gagal</span>
                                                <span className="text-sm font-semibold text-red-600">{selectedLog.status_summary.failed}</span>
                                            </div>
                                        )}
                                        {selectedLog.status_summary.delivered > 0 && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Terkirim ke Inbox</span>
                                                <span className="text-sm font-semibold text-green-700">{selectedLog.status_summary.delivered}</span>
                                            </div>
                                        )}
                                        {selectedLog.status_summary.bounced > 0 && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Bounced</span>
                                                <span className="text-sm font-semibold text-orange-600">{selectedLog.status_summary.bounced}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Recipients List */}
                            {selectedLog.email_recipients && selectedLog.email_recipients.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Detail Penerima</h4>
                                    <div className="bg-gray-50 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-100 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Email</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Status</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Waktu</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {selectedLog.email_recipients.map((recipient) => (
                                                    <tr key={recipient.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2">
                                                            <div className="font-medium text-gray-900">{recipient.recipient_email}</div>
                                                            {recipient.recipient_name && (
                                                                <div className="text-xs text-gray-500">{recipient.recipient_name}</div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                                recipient.status === 'sent' ? 'bg-green-100 text-green-800' :
                                                                recipient.status === 'delivered' ? 'bg-blue-100 text-blue-800' :
                                                                recipient.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                                recipient.status === 'queued' ? 'bg-yellow-100 text-yellow-800' :
                                                                recipient.status === 'bounced' ? 'bg-orange-100 text-orange-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {recipient.status}
                                                            </span>
                                                            {recipient.error_message && (
                                                                <div className="text-xs text-red-600 mt-1">{recipient.error_message}</div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2 text-xs text-gray-500">
                                                            {recipient.sent_at ? formatDate(recipient.sent_at) : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        💡 Status "sent" berarti email dikirim ke SMTP server, belum tentu sampai ke inbox. Lihat <a href="/EMAIL_TRACKING_GUIDE.md" className="text-blue-600 underline" target="_blank">panduan tracking</a> untuk detail lebih lanjut.
                                    </p>
                                </div>
                            )}

                            {/* Email Preview */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <p className="text-gray-900">{selectedLog.email_templates?.subject || '-'}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Konten Email</label>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                                        <div
                                            className="prose prose-sm max-w-none"
                                            dangerouslySetInnerHTML={{ __html: selectedLog.email_templates?.content || '<p class="text-gray-500">Konten tidak tersedia</p>' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleDelete(selectedLog.id, e)
                                }}
                                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center space-x-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Hapus Riwayat</span>
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
