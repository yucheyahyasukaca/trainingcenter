'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Upload, X, Image as ImageIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { RichTextEditor, type RichTextEditorRef } from '@/components/ui/RichTextEditor'
import { TemplateVariableHelper } from '@/components/email/TemplateVariableHelper'

export default function EditTemplatePage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const isNew = params.id === 'new'
    const editorRef = useRef<RichTextEditorRef>(null)

    const [loading, setLoading] = useState(!isNew)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        type: 'marketing',
        content: '',
        header_image_url: '',
        cta_button_text: '',
        cta_button_url: '',
        cta_button_color: '#3B82F6'
    })

    useEffect(() => {
        if (!isNew) {
            fetchTemplate()
        }
    }, [params.id])

    const fetchTemplate = async () => {
        try {
            const res = await fetch(`/api/admin/email-templates/${params.id}`)
            if (!res.ok) throw new Error('Failed to fetch template')
            const data = await res.json()
            setFormData({
                name: data.name,
                subject: data.subject,
                type: data.type,
                content: data.content,
                header_image_url: data.header_image_url || '',
                cta_button_text: data.cta_button_text || '',
                cta_button_url: data.cta_button_url || '',
                cta_button_color: data.cta_button_color || '#3B82F6'
            })
        } catch (error) {
            console.error(error)
            toast.error('Gagal memuat template')
        } finally {
            setLoading(false)
        }
    }

    // Compress image function (client-side compression)
    const compressImage = async (
        inputFile: File,
        opts?: { maxWidth?: number; maxHeight?: number; quality?: number; mimeType?: string }
    ): Promise<Blob> => {
        const maxWidth = opts?.maxWidth ?? 1920 // Email header width
        const maxHeight = opts?.maxHeight ?? 600 // Email header height
        const quality = opts?.quality ?? 0.85 // Higher quality for email headers
        const mimeType = opts?.mimeType ?? 'image/jpeg'

        const imageBitmap = await createImageBitmap(inputFile)
        let targetWidth = imageBitmap.width
        let targetHeight = imageBitmap.height

        // Keep aspect ratio
        const widthRatio = maxWidth / targetWidth
        const heightRatio = maxHeight / targetHeight
        const ratio = Math.min(1, widthRatio, heightRatio)
        targetWidth = Math.round(targetWidth * ratio)
        targetHeight = Math.round(targetHeight * ratio)

        const canvas = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = targetHeight
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight)
        
        const blob: Blob = await new Promise((resolve) => 
            canvas.toBlob((b) => resolve(b as Blob), mimeType, quality)
        )
        return blob
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('File harus berupa gambar')
            return
        }

        const originalSize = file.size
        setUploading(true)
        toast.loading('Mengompres gambar...', { id: 'upload' })

        try {
            // Compress image before upload
            let fileToUpload: File | Blob = file
            let wasCompressed = false
            let compressedSize = originalSize

            try {
                const compressed = await compressImage(file, {
                    maxWidth: 1920, // Email header optimal width
                    maxHeight: 600, // Email header optimal height
                    quality: 0.85, // Good quality for email
                    mimeType: 'image/jpeg'
                })

                compressedSize = compressed.size
                wasCompressed = compressedSize < originalSize

                if (wasCompressed) {
                    // Convert blob to File for FormData
                    fileToUpload = new File([compressed], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    })

                    const saved = ((originalSize - compressedSize) / originalSize * 100).toFixed(1)
                    console.log(`📦 Kompresi: ${(originalSize / 1024).toFixed(0)}KB → ${(compressedSize / 1024).toFixed(0)}KB (hemat ${saved}%)`)
                    toast.loading(`Gambar dikompres: ${(originalSize / 1024).toFixed(0)}KB → ${(compressedSize / 1024).toFixed(0)}KB`, { id: 'upload' })
                }
            } catch (compressionError) {
                console.warn('⚠️ Compression failed, using original:', compressionError)
                // Continue with original file if compression fails
            }

            // Validate file size after compression (max 2MB)
            const maxSize = 2 * 1024 * 1024 // 2MB
            if (compressedSize > maxSize) {
                toast.error(`Ukuran file masih terlalu besar: ${(compressedSize / 1024 / 1024).toFixed(2)}MB. Maksimal 2MB.`, { id: 'upload' })
                return
            }

            toast.loading('Mengupload gambar...', { id: 'upload' })

            const formData = new FormData()
            formData.append('file', fileToUpload)

            const res = await fetch('/api/admin/email-templates/upload-header', {
                method: 'POST',
                body: formData
            })

            // Check if response is JSON
            const contentType = res.headers.get('content-type')
            if (!contentType || !contentType.includes('application/json')) {
                const text = await res.text()
                console.error('Non-JSON response:', text.substring(0, 200))
                throw new Error('Server error: ' + (text.substring(0, 100) || 'Unknown error'))
            }

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || data.message || 'Upload gagal')
            }

            // Update formData with uploaded image URL
            setFormData(prev => ({
                ...prev,
                header_image_url: data.url
            }))

            if (wasCompressed) {
                toast.success(`Gambar berhasil diupload (${(compressedSize / 1024).toFixed(0)}KB)`, { id: 'upload' })
            } else {
                toast.success('Gambar berhasil diupload', { id: 'upload' })
            }
        } catch (error: any) {
            console.error('Upload error:', error)
            toast.error(error.message || 'Gagal mengupload gambar', { id: 'upload' })
        } finally {
            setUploading(false)
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const url = isNew
                ? '/api/admin/email-templates'
                : `/api/admin/email-templates/${params.id}`

            const method = isNew ? 'POST' : 'PUT'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!res.ok) throw new Error('Failed to save')

            toast.success(isNew ? 'Template berhasil dibuat' : 'Template berhasil diperbarui')
            router.push('/admin/email-broadcast/templates')
        } catch (error) {
            console.error(error)
            toast.error('Gagal menyimpan template')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="p-4 sm:p-6 text-center">Memuat...</div>
    }

    return (
        <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto px-4 sm:px-6">
            {/* Header - Mobile Friendly */}
            <div className="flex items-center space-x-2 sm:space-x-4">
                <Link href="/admin/email-broadcast/templates" className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {isNew ? 'Buat Template Baru' : 'Edit Template'}
                </h1>
            </div>

            {/* Form - Mobile Friendly */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Template</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Contoh: Newsletter Bulanan"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="marketing">Marketing</option>
                            <option value="notification">Notifikasi</option>
                            <option value="system">System</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subjek Email</label>
                    <input
                        type="text"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Subjek yang akan muncul di email penerima"
                    />
                </div>

                {/* Header Image Section */}
                <div className="border-b border-gray-200 pb-4 sm:pb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Gambar Header - Opsional
                    </label>
                    <p className="text-xs text-gray-500 mb-4">
                        Gambar header akan ditampilkan di atas konten email (logo atau banner kegiatan). 
                        Upload gambar atau masukkan URL gambar yang dapat diakses publik.
                    </p>
                    
                    <div className="space-y-4">
                        {/* Upload Button */}
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="header-image-upload"
                                disabled={uploading}
                            />
                            <label
                                htmlFor="header-image-upload"
                                className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors ${
                                    uploading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                {uploading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                                        Mengupload...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload Gambar
                                    </>
                                )}
                            </label>
                            <p className="text-xs text-gray-400 mt-1">
                                Format: JPG, PNG, WebP (Maks. 5MB)
                            </p>
                        </div>

                        {/* URL Input (Alternative) */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Atau Masukkan URL Gambar
                            </label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="url"
                                    value={formData.header_image_url}
                                    onChange={(e) => setFormData({ ...formData, header_image_url: e.target.value })}
                                    className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="https://example.com/logo.png"
                                />
                                {formData.header_image_url && (
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, header_image_url: '' })}
                                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Hapus gambar"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        {/* Preview */}
                        {formData.header_image_url && (
                            <div className="mt-3">
                                <label className="block text-xs font-medium text-gray-700 mb-2">Preview:</label>
                                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 relative">
                                    <img
                                        src={formData.header_image_url}
                                        alt="Header preview"
                                        className="max-w-full h-auto rounded"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none'
                                            const parent = e.currentTarget.parentElement
                                            if (parent && !parent.querySelector('.error-msg')) {
                                                const errorMsg = document.createElement('p')
                                                errorMsg.className = 'error-msg text-xs text-red-500'
                                                errorMsg.textContent = 'Gagal memuat gambar. Pastikan URL benar dan dapat diakses.'
                                                parent.appendChild(errorMsg)
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Konten Email</label>

                    <div className="mb-3 sm:mb-4">
                        <TemplateVariableHelper
                            onInsertVariable={(variable) => {
                                editorRef.current?.insertText(variable)
                            }}
                        />
                    </div>

                    <div className="prose max-w-none">
                        <RichTextEditor
                            ref={editorRef}
                            value={formData.content}
                            onChange={(content) => setFormData({ ...formData, content })}
                            placeholder="Tulis konten email di sini..."
                            variant="email"
                        />
                    </div>
                </div>

                {/* CTA Button Section - Separate from content */}
                <div className="border-t border-gray-200 pt-4 sm:pt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Tombol CTA (Call to Action) - Opsional
                    </label>
                    <p className="text-xs text-gray-500 mb-4">
                        Tombol CTA akan ditambahkan di bawah konten email dengan styling yang cantik dan email-friendly.
                    </p>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Teks Tombol</label>
                            <input
                                type="text"
                                value={formData.cta_button_text}
                                onChange={(e) => setFormData({ ...formData, cta_button_text: e.target.value })}
                                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Contoh: Daftar Sekarang"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">URL Tujuan</label>
                            <input
                                type="url"
                                value={formData.cta_button_url}
                                onChange={(e) => setFormData({ ...formData, cta_button_url: e.target.value })}
                                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                placeholder="https://example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Warna Tombol</label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="color"
                                    value={formData.cta_button_color}
                                    onChange={(e) => setFormData({ ...formData, cta_button_color: e.target.value })}
                                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={formData.cta_button_color}
                                    onChange={(e) => setFormData({ ...formData, cta_button_color: e.target.value })}
                                    placeholder="#3B82F6"
                                    className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-0 pt-4 sm:pt-6 border-t border-gray-200">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-primary-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-primary-700 flex items-center justify-center space-x-2 disabled:opacity-50 transition-colors w-full sm:w-auto"
                    >
                        <Save className="w-4 h-4" />
                        <span className="text-sm sm:text-base">{saving ? 'Menyimpan...' : 'Simpan Template'}</span>
                    </button>
                </div>
            </form>
        </div>
    )
}
