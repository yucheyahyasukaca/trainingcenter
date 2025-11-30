'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Trash2, AlertTriangle, Check, RefreshCw, Users } from 'lucide-react'

export default function EnrollmentConflictsPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [enrollments, setEnrollments] = useState<any[]>([])
    const [conflicts, setConflicts] = useState<any[]>([])
    const [mode, setMode] = useState<'search' | 'scan'>('scan') // Default to scan as requested
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const router = useRouter()

    // Auto-scan on mount if in scan mode
    useEffect(() => {
        if (mode === 'scan') {
            handleScan()
        }
    }, [])

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')
        setEnrollments([])
        setConflicts([])
        setMode('search')

        try {
            const res = await fetch(`/api/admin/enrollments/conflicts?email=${encodeURIComponent(email)}`)
            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Gagal mengambil data pendaftaran')

            setEnrollments(data.data || [])
            if (data.data && data.data.length === 0) {
                setError('Tidak ditemukan pendaftaran untuk email ini')
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleScan = async () => {
        setLoading(true)
        setError('')
        setSuccess('')
        setEnrollments([])
        setConflicts([])
        setMode('scan')

        try {
            const res = await fetch(`/api/admin/enrollments/conflicts?check_all=true`)
            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Gagal memindai konflik')

            setConflicts(data.conflicts || [])
            if (data.conflicts && data.conflicts.length === 0) {
                setSuccess('Tidak ada konflik ditemukan! Semua aman.')
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus pendaftaran ini? Tindakan ini tidak dapat dibatalkan.')) return

        setLoading(true)
        try {
            const res = await fetch(`/api/admin/enrollments/conflicts?id=${id}`, {
                method: 'DELETE'
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Gagal menghapus pendaftaran')

            setSuccess('Pendaftaran berhasil dihapus')
            // Refresh based on mode
            if (mode === 'search') handleSearch()
            else handleScan()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleBulkDelete = async (ids: string[]) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus ${ids.length} pendaftaran ganda? Tindakan ini tidak dapat dibatalkan.`)) return

        setLoading(true)
        try {
            const res = await fetch(`/api/admin/enrollments/conflicts?ids=${ids.join(',')}`, {
                method: 'DELETE'
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Gagal menghapus pendaftaran')

            setSuccess('Pendaftaran ganda berhasil dihapus')
            // Refresh based on mode
            if (mode === 'search') handleSearch()
            else handleScan()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Helper to determine which enrollments to keep (e.g. oldest, or paid/approved one)
    const getDuplicatesToDelete = (items: any[]) => {
        if (items.length <= 1) return []

        // Sort by status priority (approved/paid > pending) then by date (oldest first)
        // We want to KEEP the best one.
        // Let's say we keep the one that is 'approved' or 'paid'. If multiple, keep oldest.
        // If none approved, keep oldest pending.

        const sorted = [...items].sort((a, b) => {
            // Priority 1: Status
            const scoreA = getStatusScore(a)
            const scoreB = getStatusScore(b)
            if (scoreA !== scoreB) return scoreB - scoreA // Higher score first

            // Priority 2: Date (Oldest first is usually better for "original" enrollment, 
            // BUT if they re-enrolled maybe the new one is valid? 
            // Usually we keep the one with progress or payment.
            // Let's assume oldest is original and valid if statuses are equal.
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })

        // Keep the first one (best one), delete the rest
        return sorted.slice(1).map(i => i.id)
    }

    const getStatusScore = (e: any) => {
        if (e.status === 'completed') return 5
        if (e.status === 'approved') return 4
        if (e.payment_status === 'paid') return 3
        if (e.status === 'pending') return 2
        return 1
    }

    // Group enrollments by program for search mode
    const groupedEnrollments = enrollments.reduce((acc, curr) => {
        const key = curr.program_id
        if (!acc[key]) acc[key] = []
        acc[key].push(curr)
        return acc
    }, {} as Record<string, any[]>)

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Penyelesaian Konflik Pendaftaran</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setMode('scan')}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${mode === 'scan' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        <Users size={18} /> Pindai Semua
                    </button>
                    <button
                        onClick={() => setMode('search')}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${mode === 'search' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        <Search size={18} /> Cari via Email
                    </button>
                </div>
            </div>

            {mode === 'search' && (
                <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Pengguna</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Masukkan email pengguna (cth. suprapti05101966@gmail.com)"
                                    required
                                />
                                <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex items-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Mencari...' : 'Cari'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {mode === 'scan' && (
                <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-semibold">Hasil Pemindaian</h2>
                            <p className="text-gray-500 text-sm">Ditemukan {conflicts.length} pengguna dengan pendaftaran ganda</p>
                        </div>
                        <button
                            onClick={handleScan}
                            disabled={loading}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Segarkan
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" /> {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6 flex items-center gap-2">
                    <Check className="w-5 h-5" /> {success}
                </div>
            )}

            {/* SEARCH RESULTS */}
            {mode === 'search' && Object.keys(groupedEnrollments).length > 0 && (
                <div className="space-y-6">
                    {(Object.entries(groupedEnrollments) as [string, any[]][]).map(([programId, items]) => {
                        const isDuplicate = items.length > 1
                        const duplicatesToDelete = getDuplicatesToDelete(items)

                        return (
                            <div key={programId} className={`bg-white rounded-lg shadow-sm overflow-hidden border ${isDuplicate ? 'border-red-300' : 'border-gray-200'}`}>
                                <div className={`p-4 ${isDuplicate ? 'bg-red-50' : 'bg-gray-50'} border-b flex justify-between items-center`}>
                                    <div>
                                        <h3 className="font-semibold text-lg">{items[0].program?.title || 'Program Tidak Diketahui'}</h3>
                                        <p className="text-sm text-gray-500">ID Program: {programId}</p>
                                    </div>
                                    {isDuplicate && (
                                        <div className="flex items-center gap-4">
                                            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                                                Duplikat Terdeteksi ({items.length})
                                            </span>
                                            <button
                                                onClick={() => handleBulkDelete(duplicatesToDelete)}
                                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                            >
                                                Perbaiki (Simpan Terbaik)
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="divide-y">
                                    {items.map((enrollment: any) => (
                                        <div key={enrollment.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                                <div>
                                                    <span className="text-gray-500">ID Pendaftaran:</span>
                                                    <br />
                                                    <span className="font-mono">{enrollment.id}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Status:</span>
                                                    <br />
                                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${enrollment.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                            enrollment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {enrollment.status}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Dibuat Pada:</span>
                                                    <br />
                                                    {new Date(enrollment.created_at).toLocaleString('id-ID')}
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Pembayaran:</span>
                                                    <br />
                                                    {enrollment.payment_status} ({enrollment.amount_paid})
                                                </div>
                                            </div>
                                            <div>
                                                <button
                                                    onClick={() => handleDelete(enrollment.id)}
                                                    className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors"
                                                    title="Hapus Pendaftaran"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* SCAN RESULTS */}
            {mode === 'scan' && conflicts.length > 0 && (
                <div className="space-y-6">
                    {conflicts.map((conflict: any, index: number) => {
                        const duplicatesToDelete = getDuplicatesToDelete(conflict.enrollments)

                        return (
                            <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden border border-red-300">
                                <div className="p-4 bg-red-50 border-b flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-lg">{conflict.participant?.name || 'Pengguna Tidak Diketahui'}</h3>
                                        <p className="text-sm text-gray-600">{conflict.participant?.email}</p>
                                        <p className="text-sm font-medium mt-1 text-blue-600">Program: {conflict.program?.title}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                                            {conflict.enrollments.length} Pendaftaran
                                        </span>
                                        <button
                                            onClick={() => handleBulkDelete(duplicatesToDelete)}
                                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
                                        >
                                            <Trash2 size={16} /> Perbaiki Duplikat
                                        </button>
                                    </div>
                                </div>
                                <div className="divide-y">
                                    {conflict.enrollments.map((enrollment: any) => (
                                        <div key={enrollment.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                                <div>
                                                    <span className="text-gray-500">ID Pendaftaran:</span>
                                                    <br />
                                                    <span className="font-mono">{enrollment.id}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Status:</span>
                                                    <br />
                                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${enrollment.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                            enrollment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {enrollment.status}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Dibuat Pada:</span>
                                                    <br />
                                                    {new Date(enrollment.created_at).toLocaleString('id-ID')}
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Pembayaran:</span>
                                                    <br />
                                                    {enrollment.payment_status} ({enrollment.amount_paid})
                                                </div>
                                            </div>
                                            <div>
                                                <button
                                                    onClick={() => handleDelete(enrollment.id)}
                                                    className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors"
                                                    title="Hapus Pendaftaran"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
