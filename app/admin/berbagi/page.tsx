'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
    Trophy,
    Award,
    CheckCircle,
    XCircle,
    Clock,
    Search,
    Filter,
    Eye,
    Download,
    ChevronDown,
    ChevronUp
} from 'lucide-react'
import { useNotification } from '@/components/ui/Notification'
import Image from 'next/image'

// Interfaces
interface StudentSubmission {
    id: string
    trainer_id: string
    training_date: string
    student_count: number
    topic: string
    duration_hours: number
    training_format: string
    documentation_url: string
    notes: string
    status: 'pending' | 'approved' | 'rejected'
    admin_feedback: string
    created_at: string
    trainer: {
        full_name: string
        email: string
    }
}

export default function AdminBerbagiPage() {
    const { profile, loading: authLoading } = useAuth()
    const router = useRouter()
    const { addNotification } = useNotification()

    const [submissions, setSubmissions] = useState<StudentSubmission[]>([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
    const [searchTerm, setSearchTerm] = useState('')

    // Modal State
    const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null)
    const [feedback, setFeedback] = useState('')
    const [processingId, setProcessingId] = useState<string | null>(null)

    useEffect(() => {
        if (!authLoading) {
            if (!profile || profile.role !== 'admin') {
                router.push('/dashboard')
                return
            }
            fetchSubmissions()
        }
    }, [profile, authLoading, router])

    const fetchSubmissions = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('student_training_submissions')
                .select(`
                    *,
                    trainer:trainers(
                        user_id
                    )
                `)
                .order('created_at', { ascending: false })

            if (error) throw error

            // Need to fetch user profiles manually since we can't join easily across schemas/tables sometimes 
            // or if the relation is complex. Let's try to get user details.
            // Actually, trainers table has user_id, we need to join with user_profiles.
            // Let's do a second fetch to get profile details for these trainers.

            const submissionsWithProfiles = await Promise.all(data.map(async (sub: any) => {
                if (sub.trainer?.user_id) {
                    const { data: userData } = await supabase
                        .from('user_profiles')
                        .select('full_name, email')
                        .eq('id', sub.trainer.user_id)
                        .single()

                    return {
                        ...sub,
                        trainer: {
                            ...sub.trainer,
                            full_name: userData?.full_name || 'Unknown',
                            email: userData?.email || 'Unknown'
                        }
                    }
                }
                return sub
            }))

            setSubmissions(submissionsWithProfiles)

        } catch (error) {
            console.error('Error fetching submissions:', error)
            addNotification({
                type: 'error',
                title: 'Error',
                message: 'Gagal memuat data submission'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleApproval = async (id: string, status: 'approved' | 'rejected') => {
        if (!confirm(`Apakah Anda yakin ingin ${status === 'approved' ? 'menyetujui' : 'menolak'} laporan ini?`)) return

        setProcessingId(id)
        try {
            const { error } = await supabase
                .from('student_training_submissions')
                .update({
                    status,
                    admin_feedback: feedback,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)

            if (error) throw error

            // If approved, we might want to add points manually or via trigger.
            // Assuming trigger handles it, or we do it here.
            // For now, let's rely on the status update.

            addNotification({
                type: 'success',
                title: 'Berhasil',
                message: `Laporan berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`
            })

            setSelectedSubmission(null)
            setFeedback('')
            fetchSubmissions()

        } catch (error) {
            console.error('Error updating submission:', error)
            addNotification({
                type: 'error',
                title: 'Error',
                message: 'Gagal mengupdate status laporan'
            })
        } finally {
            setProcessingId(null)
        }
    }

    const filteredSubmissions = submissions.filter(sub => {
        const matchesStatus = filterStatus === 'all' || sub.status === filterStatus
        const matchesSearch =
            sub.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sub.trainer?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sub.trainer?.email.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesStatus && matchesSearch
    })

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Manajemen BERBAGI</h1>
                    <p className="mt-2 text-gray-600">Kelola program referral dan pelatihan siswa</p>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {/* Filters */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Cari trainer, topik..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center space-x-2 w-full md:w-auto">
                            <Filter className="text-gray-400 w-4 h-4" />
                            <select
                                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={filterStatus}
                                onChange={(e: any) => setFilterStatus(e.target.value)}
                            >
                                <option value="all">Semua Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Disetujui</option>
                                <option value="rejected">Ditolak</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trainer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topik</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peserta</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bukti</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredSubmissions.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(sub.training_date).toLocaleDateString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{sub.trainer?.full_name}</div>
                                                <div className="text-xs text-gray-500">{sub.trainer?.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {sub.topic}
                                                <div className="text-xs text-gray-500">{sub.duration_hours} Jam • {sub.training_format}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {sub.student_count} Siswa
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                                                <a href={sub.documentation_url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center">
                                                    <Eye className="w-4 h-4 mr-1" /> Lihat
                                                </a>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                        ${sub.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                        sub.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'}`}>
                                                    {sub.status === 'approved' ? 'Disetujui' :
                                                        sub.status === 'rejected' ? 'Ditolak' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => setSelectedSubmission(sub)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Detail
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedSubmission && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setSelectedSubmission(null)}></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                            Detail Laporan Pelatihan
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Trainer</p>
                                                <p className="text-sm text-gray-900">{selectedSubmission.trainer?.full_name}</p>
                                                <p className="text-xs text-gray-500">{selectedSubmission.trainer?.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Tanggal</p>
                                                <p className="text-sm text-gray-900">{new Date(selectedSubmission.training_date).toLocaleDateString('id-ID')}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Topik</p>
                                                <p className="text-sm text-gray-900">{selectedSubmission.topic}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Format</p>
                                                <p className="text-sm text-gray-900">{selectedSubmission.training_format} ({selectedSubmission.duration_hours} Jam)</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Jumlah Peserta</p>
                                                <p className="text-sm text-gray-900">{selectedSubmission.student_count}</p>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <p className="text-sm font-medium text-gray-500 mb-2">Catatan Trainer</p>
                                            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedSubmission.notes || '-'}</p>
                                        </div>

                                        <div className="mb-4">
                                            <p className="text-sm font-medium text-gray-500 mb-2">Bukti Dokumentasi</p>
                                            <div className="relative h-64 w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                                                <Image
                                                    src={selectedSubmission.documentation_url}
                                                    alt="Dokumentasi"
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                            <a
                                                href={selectedSubmission.documentation_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                                            >
                                                Buka gambar di tab baru
                                            </a>
                                        </div>

                                        {selectedSubmission.status === 'pending' && (
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Feedback Admin (Opsional)
                                                </label>
                                                <textarea
                                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                    rows={3}
                                                    value={feedback}
                                                    onChange={(e) => setFeedback(e.target.value)}
                                                    placeholder="Berikan alasan jika menolak..."
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                {selectedSubmission.status === 'pending' ? (
                                    <>
                                        <button
                                            type="button"
                                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                            onClick={() => handleApproval(selectedSubmission.id, 'approved')}
                                            disabled={!!processingId}
                                        >
                                            {processingId === selectedSubmission.id ? 'Memproses...' : 'Setujui'}
                                        </button>
                                        <button
                                            type="button"
                                            className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                            onClick={() => handleApproval(selectedSubmission.id, 'rejected')}
                                            disabled={!!processingId}
                                        >
                                            Tolak
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                        onClick={() => setSelectedSubmission(null)}
                                    >
                                        Tutup
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    )
}
