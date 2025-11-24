'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Template {
    id: string
    name: string
    subject: string
    type: string
    created_at: string
}

export default function EmailTemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTemplates()
    }, [])

    const fetchTemplates = async () => {
        try {
            const res = await fetch('/api/admin/email-templates')
            if (!res.ok) throw new Error('Failed to fetch templates')
            const data = await res.json()
            setTemplates(data)
        } catch (error) {
            console.error(error)
            toast.error('Gagal memuat template')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus template ini?')) return

        try {
            const res = await fetch(`/api/admin/email-templates/${id}`, {
                method: 'DELETE',
            })
            if (!res.ok) throw new Error('Failed to delete')

            toast.success('Template berhasil dihapus')
            fetchTemplates()
        } catch (error) {
            console.error(error)
            toast.error('Gagal menghapus template')
        }
    }

    return (
        <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
            {/* Header - Mobile Friendly */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-2 sm:space-x-4">
                    <Link href="/admin/email-broadcast" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </Link>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Template Email</h1>
                </div>
                <Link
                    href="/admin/email-broadcast/templates/new"
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center justify-center space-x-2 transition-colors w-full sm:w-auto"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm sm:text-base">Buat Template</span>
                </Link>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Template</th>
                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjek</th>
                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dibuat Pada</th>
                                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 lg:px-6 py-8 text-center text-gray-500">Memuat...</td>
                                </tr>
                            ) : templates.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 lg:px-6 py-8 text-center text-gray-500">Belum ada template.</td>
                                </tr>
                            ) : (
                                templates.map((template) => (
                                    <tr key={template.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 lg:px-6 py-4 text-sm font-medium text-gray-900">{template.name}</td>
                                        <td className="px-4 lg:px-6 py-4 text-sm text-gray-500">{template.subject}</td>
                                        <td className="px-4 lg:px-6 py-4 text-sm text-gray-500">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {template.type}
                                            </span>
                                        </td>
                                        <td className="px-4 lg:px-6 py-4 text-sm text-gray-500">
                                            {new Date(template.created_at).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-3">
                                                <Link 
                                                    href={`/admin/email-broadcast/templates/${template.id}`} 
                                                    className="text-indigo-600 hover:text-indigo-900 p-1 rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <button 
                                                    onClick={() => handleDelete(template.id)} 
                                                    className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {loading ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-gray-500">
                        Memuat...
                    </div>
                ) : templates.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-gray-500">
                        Belum ada template.
                    </div>
                ) : (
                    templates.map((template) => (
                        <div key={template.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-semibold text-gray-900 truncate">{template.name}</h3>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{template.subject}</p>
                                </div>
                                <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                                    <Link 
                                        href={`/admin/email-broadcast/templates/${template.id}`} 
                                        className="text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Link>
                                    <button 
                                        onClick={() => handleDelete(template.id)} 
                                        className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                        title="Hapus"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                    {template.type}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {new Date(template.created_at).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
