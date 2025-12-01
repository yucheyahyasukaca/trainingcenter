'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    BookOpen,
    Clock,
    Award,
    Image as ImageIcon,
    ChevronUp,
    ChevronDown
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

export default function HebatModulesPage() {
    const [modules, setModules] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const addToast = useToast()

    useEffect(() => {
        fetchModules()
    }, [])

    const fetchModules = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('hebat_modules')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setModules(data || [])
        } catch (error) {
            console.error('Error fetching modules:', error)
            addToast.error('Gagal memuat modul')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus modul ini?')) return

        try {
            const { error } = await supabase
                .from('hebat_modules')
                .delete()
                .eq('id', id)

            if (error) throw error

            addToast.success('Modul berhasil dihapus')
            fetchModules()
        } catch (error) {
            console.error('Error deleting module:', error)
            addToast.error('Gagal menghapus modul')
        }
    }

    const handleReorder = async (moduleId: string, parentId: string, direction: 'up' | 'down') => {
        const siblings = getSubModules(parentId)
        const currentIndex = siblings.findIndex(m => m.id === moduleId)
        if (currentIndex === -1) return

        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
        if (targetIndex < 0 || targetIndex >= siblings.length) return

        const currentModule = siblings[currentIndex]
        const targetModule = siblings[targetIndex]

        // Swap order_index
        const currentOrder = currentModule.order_index || 0
        const targetOrder = targetModule.order_index || 0

        // If orders are same (e.g. both 0), we need to give them distinct values
        // But for now, let's just swap whatever values they have, 
        // OR if they are equal, we might need to re-index everything.
        // Simple approach: Swap values. If equal, assign index based on position.

        let newCurrentOrder = targetOrder
        let newTargetOrder = currentOrder

        // If values are equal (e.g. both 0), force distinct values based on new position
        if (currentOrder === targetOrder) {
            newCurrentOrder = targetIndex
            newTargetOrder = currentIndex
        }

        try {
            // Update both modules
            const updates = [
                supabase.from('hebat_modules').update({ order_index: newCurrentOrder } as any).eq('id', currentModule.id),
                supabase.from('hebat_modules').update({ order_index: newTargetOrder } as any).eq('id', targetModule.id)
            ]

            await Promise.all(updates)

            // Optimistic update or refresh
            fetchModules()
            addToast.success('Urutan berhasil diperbarui')
        } catch (error) {
            console.error('Error reordering:', error)
            addToast.error('Gagal mengubah urutan')
        }
    }

    // Group modules by parent
    const parentModules = modules.filter(m => m.material_type === 'main')
    const subModules = modules.filter(m => m.material_type === 'sub')

    const getSubModules = (parentId: string) => {
        return subModules
            .filter(m => m.parent_id === parentId)
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    }

    const filteredParentModules = parentModules.filter(module =>
        module.title.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Modul HIMPUN</h1>
                    <p className="text-gray-600">Kelola materi pembelajaran untuk fitur HIMPUN</p>
                </div>
                <Link
                    href="/admin/hebat/modules/new"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Buat Modul Baru
                </Link>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari modul..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200">
                    <Filter className="w-5 h-5" />
                </button>
            </div>

            {/* Module Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                            <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            ) : filteredParentModules.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Belum ada modul</h3>
                    <p className="text-gray-500 mb-4">Mulai dengan membuat modul pembelajaran baru</p>
                    <Link
                        href="/admin/hebat/modules/new"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Buat Modul Baru
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredParentModules.map((module) => (
                        <div key={module.id} className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
                            {/* Image */}
                            <div className="relative h-48 bg-gray-100">
                                {module.image_url ? (
                                    <img
                                        src={module.image_url}
                                        alt={module.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <ImageIcon className="w-12 h-12" />
                                    </div>
                                )}
                                <div className="absolute top-4 right-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${module.is_published
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {module.is_published ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 flex-1 flex flex-col">
                                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                    {module.title}
                                </h3>
                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                    {module.description || 'Tidak ada deskripsi'}
                                </p>

                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{module.duration_minutes} mnt</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Award className="w-4 h-4" />
                                        <span>
                                            {module.points + getSubModules(module.id).reduce((sum, sub) => sum + (sub.points || 0), 0)} Poin
                                        </span>
                                    </div>
                                </div>

                                {/* Sub Modules List */}
                                <div className="mb-6 flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-semibold text-gray-700">Sub Materi</h4>
                                        <Link
                                            href={`/admin/hebat/modules/new?parent_id=${module.id}`}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center"
                                        >
                                            <Plus className="w-3 h-3 mr-1" />
                                            Tambah
                                        </Link>
                                    </div>
                                    <div className="space-y-2">
                                        {getSubModules(module.id).length > 0 ? (
                                            getSubModules(module.id).map((sub, index, array) => (
                                                <div key={sub.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group/sub hover:bg-blue-50 transition-colors">
                                                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                                                        <div className="flex flex-col gap-0.5 mr-1">
                                                            <button
                                                                onClick={() => handleReorder(sub.id, module.id, 'up')}
                                                                disabled={index === 0}
                                                                className="text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                                            >
                                                                <ChevronUp className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleReorder(sub.id, module.id, 'down')}
                                                                disabled={index === array.length - 1}
                                                                className="text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                                            >
                                                                <ChevronDown className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 group-hover/sub:bg-blue-500 flex-shrink-0"></div>
                                                        <span className="text-sm text-gray-600 group-hover/sub:text-blue-700 truncate">
                                                            {sub.title}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                                        <Link
                                                            href={`/admin/hebat/modules/${sub.id}`}
                                                            className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                                            title="Edit Sub Materi"
                                                        >
                                                            <Edit className="w-3 h-3" />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(sub.id)}
                                                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                                                            title="Hapus Sub Materi"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-gray-400 italic py-2 text-center border border-dashed border-gray-200 rounded-lg">
                                                Belum ada sub materi
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                                    <span className="text-xs text-gray-400">
                                        {formatDate(module.created_at)}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/admin/hebat/modules/${module.id}`}
                                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(module.id)}
                                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
    )
}
