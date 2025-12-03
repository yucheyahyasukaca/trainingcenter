'use client'

import { useState, useEffect } from 'react'
import { getSubmissions, updateSubmissionStatus } from './actions'
import { CheckCircle, XCircle, Clock, FileText, ExternalLink, Search } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import Image from 'next/image'

export default function HebatSubmissionsPage() {
    const [submissions, setSubmissions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending')
    const [search, setSearch] = useState('')
    const toast = useToast()

    useEffect(() => {
        loadSubmissions()
    }, [])

    const loadSubmissions = async () => {
        setLoading(true)
        const data = await getSubmissions()
        setSubmissions(data)
        setLoading(false)
    }

    const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
        if (!confirm(`Apakah Anda yakin ingin mengubah status menjadi ${status}?`)) return

        const result = await updateSubmissionStatus(id, status)
        if (result.error) {
            toast.error('Gagal', result.error)
        } else {
            toast.success('Berhasil', `Status berhasil diubah menjadi ${status}`)
            loadSubmissions()
        }
    }

    const filteredSubmissions = submissions.filter(sub => {
        const matchesFilter = sub.status === filter
        const matchesSearch = sub.trainers?.user_profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            sub.story?.toLowerCase().includes(search.toLowerCase()) ||
            sub.solution?.toLowerCase().includes(search.toLowerCase())
        return matchesFilter && matchesSearch
    })

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Manajemen Submisi HEBAT</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Cari trainer atau konten..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
                {(['pending', 'approved', 'rejected'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === tab
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                            <tr>
                                <th className="px-6 py-4">Trainer</th>
                                <th className="px-6 py-4">Kategori</th>
                                <th className="px-6 py-4">Konten</th>
                                <th className="px-6 py-4">Bukti</th>
                                <th className="px-6 py-4">Tanggal</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Memuat data...
                                    </td>
                                </tr>
                            ) : filteredSubmissions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Tidak ada data submisi {filter}.
                                    </td>
                                </tr>
                            ) : (
                                filteredSubmissions.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">
                                                {sub.trainers?.user_profiles?.full_name || 'Unknown'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {sub.trainers?.user_profiles?.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${sub.category === 'E' ? 'bg-purple-100 text-purple-700' : 'bg-pink-100 text-pink-700'
                                                }`}>
                                                {sub.category === 'E' ? 'Eksplorasi' : 'Aktualisasi'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <div className="font-medium text-gray-900 mb-1 line-clamp-1">{sub.solution}</div>
                                            <div className="text-xs text-gray-500 line-clamp-2" title={sub.story}>
                                                {sub.story}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {sub.documentation_url ? (
                                                <a
                                                    href={sub.documentation_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
                                                >
                                                    <ExternalLink className="w-4 h-4 mr-1" />
                                                    Lihat
                                                </a>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {new Date(sub.created_at).toLocaleDateString('id-ID', {
                                                day: 'numeric', month: 'short', year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {sub.status === 'pending' && (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleStatusUpdate(sub.id, 'approved')}
                                                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                                        title="Setujui"
                                                    >
                                                        <CheckCircle className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(sub.id, 'rejected')}
                                                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                                        title="Tolak"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            )}
                                            {sub.status !== 'pending' && (
                                                <span className={`text-xs font-bold px-2 py-1 rounded ${sub.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {sub.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
