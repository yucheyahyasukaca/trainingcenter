'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Users, User, CheckCircle, Mail } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Template {
    id: string
    name: string
    subject: string
}

export default function SendBroadcastPage() {
    const router = useRouter()
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)

    const [formData, setFormData] = useState({
        templateId: '',
        target: 'all', // all, trainers, admins, specific
        specificEmails: ''
    })

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.templateId) {
            toast.error('Pilih template terlebih dahulu')
            return
        }

        if (formData.target === 'specific' && !formData.specificEmails) {
            toast.error('Masukkan email tujuan')
            return
        }

        if (!confirm('Apakah Anda yakin ingin mengirim broadcast ini?')) return

        setSending(true)

        try {
            const specificEmailsList = formData.target === 'specific'
                ? formData.specificEmails.split(',').map(e => e.trim()).filter(e => e)
                : []

            const res = await fetch('/api/admin/email-broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    templateId: formData.templateId,
                    target: formData.target,
                    specificEmails: specificEmailsList
                })
            })

            if (!res.ok) throw new Error('Failed to send broadcast')

            const result = await res.json()

            toast.success(`Broadcast berhasil dijadwalkan! (${result.queued} email)`)
            router.push('/admin/email-broadcast')
        } catch (error) {
            console.error(error)
            toast.error('Gagal mengirim broadcast')
        } finally {
            setSending(false)
        }
    }

    if (loading) {
        return <div className="p-4 sm:p-6 text-center">Memuat...</div>
    }

    return (
        <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto px-4 sm:px-6">
            {/* Header - Mobile Friendly */}
            <div className="flex items-center space-x-2 sm:space-x-4">
                <Link href="/admin/email-broadcast" className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Kirim Broadcast</h1>
            </div>

            {/* Form - Mobile Friendly */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 space-y-6 sm:space-y-8">
                {/* Step 1: Select Template */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2 sm:space-x-3 text-base sm:text-lg font-semibold text-gray-900 border-b pb-2">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs sm:text-sm flex-shrink-0">1</div>
                        <h3>Pilih Template</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                onClick={() => setFormData({ ...formData, templateId: template.id })}
                                className={`
                  cursor-pointer p-3 sm:p-4 rounded-lg border-2 transition-all
                  ${formData.templateId === template.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-blue-200'
                                    }
                `}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{template.name}</p>
                                        <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">{template.subject}</p>
                                    </div>
                                    {formData.templateId === template.id && (
                                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {templates.length === 0 && (
                        <p className="text-sm sm:text-base text-gray-500 italic">Belum ada template. <Link href="/admin/email-broadcast/templates/new" className="text-blue-600 underline">Buat baru</Link></p>
                    )}
                </div>

                {/* Step 2: Select Audience */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2 sm:space-x-3 text-base sm:text-lg font-semibold text-gray-900 border-b pb-2">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs sm:text-sm flex-shrink-0">2</div>
                        <h3>Pilih Penerima</h3>
                    </div>

                    <div className="space-y-3">
                        <label className={`
              flex items-start sm:items-center p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors
              ${formData.target === 'all' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}
            `}>
                            <input
                                type="radio"
                                name="target"
                                value="all"
                                checked={formData.target === 'all'}
                                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                                className="w-4 h-4 text-blue-600 mt-0.5 sm:mt-0 flex-shrink-0"
                            />
                            <div className="ml-3 flex-1 min-w-0">
                                <div className="flex items-center flex-wrap gap-1 sm:gap-2">
                                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                                    <span className="font-medium text-gray-900 text-sm sm:text-base">Semua User</span>
                                </div>
                                <span className="block sm:inline ml-0 sm:ml-2 text-xs sm:text-sm text-gray-500 mt-1 sm:mt-0">(Kirim ke seluruh pengguna terdaftar)</span>
                            </div>
                        </label>

                        <label className={`
              flex items-start sm:items-center p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors
              ${formData.target === 'trainers' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}
            `}>
                            <input
                                type="radio"
                                name="target"
                                value="trainers"
                                checked={formData.target === 'trainers'}
                                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                                className="w-4 h-4 text-blue-600 mt-0.5 sm:mt-0 flex-shrink-0"
                            />
                            <div className="ml-3 flex items-center">
                                <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mr-2 flex-shrink-0" />
                                <span className="font-medium text-gray-900 text-sm sm:text-base">Hanya Trainer</span>
                            </div>
                        </label>

                        <label className={`
              flex items-start sm:items-center p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors
              ${formData.target === 'admins' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}
            `}>
                            <input
                                type="radio"
                                name="target"
                                value="admins"
                                checked={formData.target === 'admins'}
                                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                                className="w-4 h-4 text-blue-600 mt-0.5 sm:mt-0 flex-shrink-0"
                            />
                            <div className="ml-3 flex items-center">
                                <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mr-2 flex-shrink-0" />
                                <span className="font-medium text-gray-900 text-sm sm:text-base">Hanya Admin</span>
                            </div>
                        </label>

                        <label className={`
              flex items-start p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors
              ${formData.target === 'specific' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}
            `}>
                            <div className="flex items-center h-5 flex-shrink-0">
                                <input
                                    type="radio"
                                    name="target"
                                    value="specific"
                                    checked={formData.target === 'specific'}
                                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                                    className="w-4 h-4 text-blue-600"
                                />
                            </div>
                            <div className="ml-3 w-full min-w-0">
                                <div className="flex items-center mb-2">
                                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mr-2 flex-shrink-0" />
                                    <span className="font-medium text-gray-900 text-sm sm:text-base">Email Spesifik</span>
                                </div>
                                {formData.target === 'specific' && (
                                    <textarea
                                        value={formData.specificEmails}
                                        onChange={(e) => setFormData({ ...formData, specificEmails: e.target.value })}
                                        placeholder="Masukkan email, pisahkan dengan koma (contoh: user1@gmail.com, user2@yahoo.com)"
                                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        rows={3}
                                    />
                                )}
                            </div>
                        </label>
                    </div>
                </div>

                <div className="pt-4 sm:pt-6 border-t border-gray-200">
                    <button
                        type="submit"
                        disabled={sending || !formData.templateId}
                        className="w-full bg-primary-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:bg-primary-700 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="font-semibold text-base sm:text-lg">{sending ? 'Mengirim...' : 'Kirim Broadcast'}</span>
                    </button>
                </div>
            </form>
        </div>
    )
}
