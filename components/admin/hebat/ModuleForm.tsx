'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'
import {
    Save,
    ArrowLeft,
    BookOpen,
    Clock,
    Award,
    Image as ImageIcon,
    CheckCircle,
    AlertCircle,
    Video,
    FileText,
    HelpCircle,
    File as FileIcon,
    Zap,
    Target,
    Layers,
    PenTool,
    Sparkles,
    Upload,
    X
} from 'lucide-react'
import Link from 'next/link'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { compressImage } from '@/lib/image-compression'

interface ModuleFormProps {
    moduleId?: string
    initialData?: any
    parentId?: string | null
}

export function ModuleForm({ moduleId, initialData, parentId }: ModuleFormProps) {
    const router = useRouter()
    const addToast = useToast()
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'HIMPUN',
        points: 10,
        duration_minutes: 15,
        image_url: '',
        content_type: 'text',
        content_data: {} as any,
        is_published: false,
        material_type: parentId ? 'sub' : 'main',
        parent_id: parentId || null as string | null,
        order_index: 0
    })
    // Fetch existing modules for parent selection
    const [existingModules, setExistingModules] = useState<any[]>([])

    useEffect(() => {
        const fetchModules = async () => {
            console.log('Fetching existing modules...')

            // Debug: Check user profile access
            const user = (await supabase.auth.getUser()).data.user
            if (user?.id) {
                const { data: profileData, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('id, role')
                    .eq('id', user.id)
                    .single()
                console.log('Debug Profile:', profileData, profileError)
            }

            let query = supabase
                .from('hebat_modules')
                .select('id, title')
                .eq('material_type', 'main')

            if (moduleId) {
                query = query.neq('id', moduleId)
            }

            const { data, error } = await query

            if (error) {
                console.error('Error fetching modules:', error)
            } else {
                console.log('Modules fetched:', data)
                setExistingModules(data || [])
            }
        }
        fetchModules()
    }, [moduleId])

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                description: initialData.description || '',
                category: initialData.category || 'HIMPUN',
                points: initialData.points || 10,
                duration_minutes: initialData.duration_minutes || 15,
                image_url: initialData.image_url || '',
                content_type: initialData.content_type || 'text',
                content_data: initialData.content_data || {},
                is_published: initialData.is_published || false,
                material_type: initialData.material_type || 'main',
                parent_id: initialData.parent_id || null,
                order_index: initialData.order_index || 0
            })
        } else if (parentId) {
            setFormData(prev => ({
                ...prev,
                material_type: 'sub',
                parent_id: parentId
            }))
        }
    }, [initialData, parentId])

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            addToast.error('Format file tidak valid. Silakan upload file gambar.')
            return
        }

        try {
            setUploading(true)
            addToast.info('Mengompres dan mengupload gambar...')

            // Compress image
            const compressedBlob = await compressImage(file, {
                maxWidth: 1200,
                maxHeight: 1200,
                quality: 0.8
            })

            const compressedFile = new File([compressedBlob], file.name, {
                type: 'image/jpeg'
            })

            // Upload to Supabase
            const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`
            const filePath = `covers/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('hebat-covers')
                .upload(filePath, compressedFile)

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('hebat-covers')
                .getPublicUrl(filePath)

            setFormData(prev => ({ ...prev, image_url: publicUrl }))
            addToast.success('Gambar berhasil diupload')
        } catch (error) {
            console.error('Error uploading image:', error)
            addToast.error('Gagal mengupload gambar')
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.title.trim()) {
            addToast.error('Judul modul wajib diisi')
            return
        }

        try {
            setLoading(true)

            const dataToSave = {
                ...formData,
                updated_at: new Date().toISOString()
            }

            let error

            if (moduleId) {
                // Update existing
                const { error: updateError } = await supabase
                    .from('hebat_modules')
                    .update(dataToSave)
                    .eq('id', moduleId)
                error = updateError
            } else {
                // Create new
                const { error: insertError } = await supabase
                    .from('hebat_modules')
                    .insert([dataToSave])
                error = insertError
            }

            if (error) throw error

            addToast.success(moduleId ? 'Modul berhasil diperbarui' : 'Modul berhasil dibuat')
            router.push('/admin/hebat/modules')
            router.refresh()
        } catch (error) {
            console.error('Error saving module:', error)
            addToast.error('Gagal menyimpan modul')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header Actions */}
            <div className="flex items-center justify-between mb-6">
                <Link
                    href="/admin/hebat/modules"
                    className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Kembali
                </Link>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, is_published: !formData.is_published })}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${formData.is_published
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                    >
                        {formData.is_published ? 'Published' : 'Draft'}
                    </button>
                    <button
                        type="submit"
                        disabled={loading || uploading}
                        className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg shadow-blue-200"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? 'Menyimpan...' : 'Simpan Modul'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Material Type Selection */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                                <Layers className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800">Jenis Materi</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label className={`group relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${formData.material_type === 'main'
                                ? 'border-blue-500 bg-blue-50 shadow-md'
                                : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                                }`}>
                                <input
                                    type="radio"
                                    name="materialType"
                                    value="main"
                                    checked={formData.material_type === 'main'}
                                    onChange={() => setFormData({ ...formData, material_type: 'main', parent_id: null })}
                                    className="sr-only"
                                />
                                <div className="flex items-start gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${formData.material_type === 'main'
                                        ? 'border-blue-500 bg-blue-500'
                                        : 'border-slate-300 group-hover:border-slate-400'
                                        }`}>
                                        {formData.material_type === 'main' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Target className="w-4 h-4 text-blue-600" />
                                            <span className="font-semibold text-slate-800">Materi Utama</span>
                                        </div>
                                        <p className="text-xs text-slate-600">Materi pembelajaran utama yang berdiri sendiri</p>
                                    </div>
                                </div>
                            </label>

                            <label className={`group relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${formData.material_type === 'sub'
                                ? 'border-blue-500 bg-blue-50 shadow-md'
                                : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                                }`}>
                                <input
                                    type="radio"
                                    name="materialType"
                                    value="sub"
                                    checked={formData.material_type === 'sub'}
                                    onChange={() => setFormData({ ...formData, material_type: 'sub' })}
                                    className="sr-only"
                                />
                                <div className="flex items-start gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${formData.material_type === 'sub'
                                        ? 'border-blue-500 bg-blue-500'
                                        : 'border-slate-300 group-hover:border-slate-400'
                                        }`}>
                                        {formData.material_type === 'sub' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Layers className="w-4 h-4 text-purple-600" />
                                            <span className="font-semibold text-slate-800">Sub Materi</span>
                                        </div>
                                        <p className="text-xs text-slate-600">Materi yang merupakan bagian dari materi utama</p>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                                <PenTool className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800">Informasi Dasar</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Judul Modul <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                                        placeholder="Contoh: Pengenalan AI untuk Pendidikan"
                                    />
                                    <BookOpen className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Deskripsi Singkat
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                    placeholder="Deskripsi singkat tentang modul ini..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Parent Material Selection */}
                    {formData.material_type === 'sub' && (
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
                                    <Layers className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800">Materi Induk</h2>
                            </div>

                            <div className="relative">
                                <select
                                    value={formData.parent_id || ''}
                                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value || null })}
                                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                                >
                                    <option value="">Pilih Materi Induk</option>
                                    {existingModules.map((m) => (
                                        <option key={m.id} value={m.id}>{m.title}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content Type */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800">Tipe Konten</h2>
                        </div>

                        <div className="relative">
                            <select
                                value={formData.content_type}
                                onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                            >
                                <option value="text">📝 Teks / Artikel</option>
                                <option value="video">🎥 Video</option>
                                <option value="quiz">❓ Quiz / Kuis</option>
                                <option value="document">📄 Dokumen (PDF, PPT, dll)</option>
                                <option value="assignment">📋 Tugas / Assignment</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Content Data */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800">Konten Materi</h2>
                        </div>

                        {formData.content_type === 'text' && (
                            <RichTextEditor
                                value={formData.content_data?.body || ''}
                                onChange={(value) => setFormData({
                                    ...formData,
                                    content_data: { ...formData.content_data, body: value }
                                })}
                                placeholder="Tuliskan konten materi di sini..."
                                height={400}
                            />
                        )}

                        {formData.content_type === 'video' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">URL Video</label>
                                    <div className="relative">
                                        <input
                                            type="url"
                                            value={formData.content_data?.video_url || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                content_data: { ...formData.content_data, video_url: e.target.value }
                                            })}
                                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="https://youtube.com/watch?v=..."
                                        />
                                        <Video className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Transkrip (Opsional)</label>
                                    <textarea
                                        value={formData.content_data?.transcript || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            content_data: { ...formData.content_data, transcript: e.target.value }
                                        })}
                                        rows={4}
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                        placeholder="Transkrip video..."
                                    />
                                </div>
                            </div>
                        )}

                        {formData.content_type === 'document' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">URL Dokumen</label>
                                    <div className="relative">
                                        <input
                                            type="url"
                                            value={formData.content_data?.document_url || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                content_data: { ...formData.content_data, document_url: e.target.value }
                                            })}
                                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="https://drive.google.com/..."
                                        />
                                        <FileIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {formData.content_type === 'quiz' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Pertanyaan Quiz</label>
                                    <textarea
                                        value={formData.content_data?.question || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            content_data: { ...formData.content_data, question: e.target.value }
                                        })}
                                        rows={4}
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                        placeholder="Tuliskan pertanyaan quiz..."
                                    />
                                </div>
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                    <p className="text-sm text-amber-800">
                                        Untuk quiz kompleks (pilihan ganda, dll), gunakan fitur quiz terpisah.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Settings */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                                <Clock className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800">Pengaturan</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Poin HEBAT</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={formData.points}
                                        onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Durasi (Menit)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={formData.duration_minutes}
                                        onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Urutan</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={formData.order_index}
                                        onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Cover Image</label>
                                <div className="space-y-3">
                                    {formData.image_url ? (
                                        <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 group">
                                            <img
                                                src={formData.image_url}
                                                alt="Cover"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, image_url: '' })}
                                                    className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                disabled={uploading}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                            />
                                            {uploading ? (
                                                <div className="flex flex-col items-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                                                    <span className="text-sm text-gray-500">Mengupload...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                    <p className="text-sm text-gray-600 font-medium">
                                                        Klik untuk upload gambar
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        JPG, PNG (Max. 5MB)
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    )
}
