'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Trash2, AlertTriangle, Check } from 'lucide-react'

export default function EnrollmentConflictsPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [enrollments, setEnrollments] = useState<any[]>([])
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const router = useRouter()

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')
        setEnrollments([])

        try {
            const res = await fetch(`/api/admin/enrollments/conflicts?email=${encodeURIComponent(email)}`)
            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Failed to fetch enrollments')

            setEnrollments(data.data || [])
            if (data.data && data.data.length === 0) {
                setError('No enrollments found for this email')
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this enrollment? This action cannot be undone.')) return

        setLoading(true)
        try {
            const res = await fetch(`/api/admin/enrollments/conflicts?id=${id}`, {
                method: 'DELETE'
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Failed to delete enrollment')

            setSuccess('Enrollment deleted successfully')
            // Refresh list
            handleSearch({ preventDefault: () => { } } as any)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Group enrollments by program to highlight duplicates
    const groupedEnrollments = enrollments.reduce((acc, curr) => {
        const key = curr.program_id
        if (!acc[key]) acc[key] = []
        acc[key].push(curr)
        return acc
    }, {} as Record<string, any[]>)

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Enrollment Conflict Resolution</h1>

            <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">User Email</label>
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter user email (e.g. suprapti05101966@gmail.com)"
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
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                </form>
            </div>

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

            {Object.keys(groupedEnrollments).length > 0 && (
                <div className="space-y-6">
                    {Object.entries(groupedEnrollments).map(([programId, items]: [string, any[]]) => {
                        const isDuplicate = items.length > 1
                        return (
                            <div key={programId} className={`bg-white rounded-lg shadow-sm overflow-hidden border ${isDuplicate ? 'border-red-300' : 'border-gray-200'}`}>
                                <div className={`p-4 ${isDuplicate ? 'bg-red-50' : 'bg-gray-50'} border-b flex justify-between items-center`}>
                                    <div>
                                        <h3 className="font-semibold text-lg">{items[0].program?.title || 'Unknown Program'}</h3>
                                        <p className="text-sm text-gray-500">Program ID: {programId}</p>
                                    </div>
                                    {isDuplicate && (
                                        <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                                            Duplicate Detected ({items.length})
                                        </span>
                                    )}
                                </div>
                                <div className="divide-y">
                                    {items.map((enrollment: any) => (
                                        <div key={enrollment.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                                <div>
                                                    <span className="text-gray-500">Enrollment ID:</span>
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
                                                    <span className="text-gray-500">Created At:</span>
                                                    <br />
                                                    {new Date(enrollment.created_at).toLocaleString()}
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Payment:</span>
                                                    <br />
                                                    {enrollment.payment_status} ({enrollment.amount_paid})
                                                </div>
                                            </div>
                                            <div>
                                                <button
                                                    onClick={() => handleDelete(enrollment.id)}
                                                    className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors"
                                                    title="Delete Enrollment"
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
