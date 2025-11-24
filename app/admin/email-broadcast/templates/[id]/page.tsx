'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { RichTextEditor, type RichTextEditorRef } from '@/components/ui/RichTextEditor'
import { TemplateVariableHelper } from '@/components/email/TemplateVariableHelper'

export default function EditTemplatePage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const isNew = params.id === 'new'
    const editorRef = useRef<RichTextEditorRef>(null)

    const [loading, setLoading] = useState(!isNew)
    const [saving, setSaving] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        type: 'marketing',
        content: ''
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
                content: data.content
            })
        } catch (error) {
            console.error(error)
            toast.error('Gagal memuat template')
        } finally {
            setLoading(false)
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
        return <div className="p-6 text-center">Memuat...</div>
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/admin/email-broadcast/templates" className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isNew ? 'Buat Template Baru' : 'Edit Template'}
                    </h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Template</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Contoh: Newsletter Bulanan"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Subjek yang akan muncul di email penerima"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Konten Email</label>

                    <div className="mb-4">
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
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-200">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        <span>{saving ? 'Menyimpan...' : 'Simpan Template'}</span>
                    </button>
                </div>
            </form>
        </div>
    )
}
