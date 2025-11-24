'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Mail, Plus, History, FileText, Send, Clock, Users, CheckCircle, X, Trash2, Eye } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface EmailLog {
    id: string
    template_id: string
    recipient_count: number
    status: string
    sent_at: string
    details: any
    email_templates?: {
        name: string
        subject: string
        content?: string
    }
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
            const res = await fetch('/api/admin/email-logs')
            if (!res.ok) throw new Error('Failed to fetch logs')
            const data = await res.json()
            setLogs(data)
        } catch (error) {
            console.error('Error fetching logs:', error)
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

        try {
            const res = await fetch(`/api/admin/email-logs/${id}`, {
                method: 'DELETE'
            })
            if (!res.ok) throw new Error('Failed to delete')

            toast.success('Riwayat berhasil dihapus')
            fetchLogs()
            if (showModal && selectedLog?.id === id) {
                setShowModal(false)
                setSelectedLog(null)
            }
        } catch (error) {
            console.error('Error deleting log:', error)
            toast.error('Gagal menghapus riwayat')
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
                                    <p className="text-lg font-medium text-green-600 capitalize">{selectedLog.status}</p>
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
