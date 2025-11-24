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
        return <div className="p-6 text-center">Memuat...</div>
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center space-x-4">
                <Link href="/admin/email-broadcast" className="p-2 hover:bg-gray-100 rounded-lg">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Kirim Broadcast</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8">
                {/* Step 1: Select Template */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-3 text-lg font-semibold text-gray-900 border-b pb-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm">1</div>
                        <h3>Pilih Template</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                onClick={() => setFormData({ ...formData, templateId: template.id })}
                                className={`
                  cursor-pointer p-4 rounded-lg border-2 transition-all
                  ${formData.templateId === template.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-blue-200'
                                    }
                `}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-gray-900">{template.name}</p>
                                        <p className="text-sm text-gray-500 mt-1">{template.subject}</p>
                                    </div>
                                    {formData.templateId === template.id && (
                                        <CheckCircle className="w-5 h-5 text-blue-500" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {templates.length === 0 && (
                        <p className="text-gray-500 italic">Belum ada template. <Link href="/admin/email-broadcast/templates/new" className="text-blue-600 underline">Buat baru</Link></p>
                    )}
                </div>

                {/* Step 2: Select Audience */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-3 text-lg font-semibold text-gray-900 border-b pb-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm">2</div>
                        <h3>Pilih Penerima</h3>
                    </div>

                    <div className="space-y-3">
                        <label className={`
              flex items-center p-4 border rounded-lg cursor-pointer transition-colors
              ${formData.target === 'all' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}
            `}>
                            <input
                                type="radio"
                                name="target"
                                value="all"
                                checked={formData.target === 'all'}
                                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                                className="w-4 h-4 text-blue-600"
                            />
                            <div className="ml-3 flex items-center">
                                <Users className="w-5 h-5 text-gray-500 mr-2" />
                                <span className="font-medium text-gray-900">Semua User</span>
                                <span className="ml-2 text-sm text-gray-500">(Kirim ke seluruh pengguna terdaftar)</span>
                            </div>
                        </label>

                        <label className={`
              flex items-center p-4 border rounded-lg cursor-pointer transition-colors
              ${formData.target === 'trainers' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}
            `}>
                            <input
                                type="radio"
                                name="target"
                                value="trainers"
                                checked={formData.target === 'trainers'}
                                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                                className="w-4 h-4 text-blue-600"
                            />
                            <div className="ml-3 flex items-center">
                                <User className="w-5 h-5 text-gray-500 mr-2" />
                                <span className="font-medium text-gray-900">Hanya Trainer</span>
                            </div>
                        </label>

                        <label className={`
              flex items-center p-4 border rounded-lg cursor-pointer transition-colors
              ${formData.target === 'admins' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}
            `}>
                            <input
                                type="radio"
                                name="target"
                                value="admins"
                                checked={formData.target === 'admins'}
                                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                                className="w-4 h-4 text-blue-600"
                            />
                            <div className="ml-3 flex items-center">
                                <User className="w-5 h-5 text-gray-500 mr-2" />
                                <span className="font-medium text-gray-900">Hanya Admin</span>
                            </div>
                        </label>

                        <label className={`
              flex items-start p-4 border rounded-lg cursor-pointer transition-colors
              ${formData.target === 'specific' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}
            `}>
                            <div className="flex items-center h-5">
                                <input
                                    type="radio"
                                    name="target"
                                    value="specific"
                                    checked={formData.target === 'specific'}
                                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                                    className="w-4 h-4 text-blue-600"
                                />
                            </div>
                            <div className="ml-3 w-full">
                                <div className="flex items-center mb-2">
                                    <Mail className="w-5 h-5 text-gray-500 mr-2" />
                                    <span className="font-medium text-gray-900">Email Spesifik</span>
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

                <div className="pt-6 border-t border-gray-200">
                    <button
                        type="submit"
                        disabled={sending || !formData.templateId}
                        className="w-full bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        <Send className="w-5 h-5" />
                        <span className="font-semibold text-lg">{sending ? 'Mengirim...' : 'Kirim Broadcast'}</span>
                    </button>
                </div>
            </form>
        </div>
    )
}
