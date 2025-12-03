'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Upload, CheckCircle2, Share2, Copy, Info, FileText } from 'lucide-react'
import Link from 'next/link'
import { submitActualization } from './actions'
import { useToast } from '@/hooks/useToast'
import { useRouter } from 'next/navigation'
import imageCompression from 'browser-image-compression'

export default function PresentPage() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const formRef = useRef<HTMLFormElement>(null)
    const router = useRouter()
    const toast = useToast()

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0])
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0])
        }
    }

    const handleFile = async (file: File) => {
        if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
            toast.error('Format salah', 'Format file harus JPG, JPEG, atau PNG')
            return
        }

        try {
            if (file.size > 1 * 1024 * 1024) {
                const toastId = toast.info('Sedang mengkompresi gambar...', 'Mohon tunggu sebentar', { duration: 10000 })

                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true
                }

                try {
                    const compressedFile = await imageCompression(file, options)
                    setFile(compressedFile)
                    toast.remove(toastId)
                    toast.success('Berhasil', `Gambar dikompresi: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`)
                } catch (error) {
                    console.error('Compression error:', error)
                    toast.remove(toastId)
                    toast.error('Gagal kompresi', 'Gagal mengkompresi gambar, menggunakan file asli')
                    setFile(file)
                }
            } else {
                setFile(file)
            }
        } catch (error) {
            console.error('Error handling file:', error)
            setFile(file)
        }
    }

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true)
        try {
            if (!file) {
                toast.error('File wajib', 'Mohon unggah screenshot bukti postingan')
                setIsSubmitting(false)
                return
            }
            formData.set('documentation', file)

            const result = await submitActualization(formData)

            if (result?.error) {
                toast.error('Gagal', result.error)
            } else {
                toast.success('Berhasil', 'Submission berhasil dikirim!')
            }
        } catch (error) {
            toast.error('Error', 'Terjadi kesalahan. Silakan coba lagi.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Disalin', 'Teks berhasil disalin ke clipboard')
    }

    const [submissions, setSubmissions] = useState<any[]>([])

    useEffect(() => {
        const fetchSubmissions = async () => {
            const { getActualizations } = await import('./actions')
            const data = await getActualizations()
            setSubmissions(data)
        }
        fetchSubmissions()
    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-6 md:p-12 font-sans">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/trainer/dashboard"
                        className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors mb-6 group"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Kembali ke Portal
                    </Link>

                    <div className="text-center space-y-4">
                        <div className="flex items-center justify-center gap-3">
                            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-tight">
                                PRESENT
                            </h1>
                            <span className="bg-pink-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg shadow-pink-200 flex items-center gap-2">
                                <Share2 className="w-4 h-4" />
                                Social Media Sharing
                            </span>
                        </div>
                        <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
                            Bagikan Dampak Nyata Anda!
                            <br />
                            Ceritakan dampak nyata yang Anda lakukan setelah mengikuti pembelajaran dengan program <strong>Google Gemini untuk Pendidik</strong>.
                            Posting di media sosial dengan menyertakan foto/video untuk mendukung cerita Anda dan unggah tautan ke postingan Anda untuk mendapatkan poin.
                        </p>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Arahan Section */}
                    <div className="bg-white rounded-2xl border-2 border-blue-400 p-6 md:p-8 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 text-pink-500 font-bold text-xl">
                            <div className="w-8 h-8 rounded-full border-2 border-pink-500 flex items-center justify-center">
                                <span className="text-lg">❖</span>
                            </div>
                            Arahan:
                        </div>

                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center font-bold">1</div>
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-1">Ceritakan Kisah Anda</h3>
                                    <p className="text-slate-600 text-sm mb-2">Buat postingan yang menceritakan dampak atau hasil dari pembelajaran Anda. Anda dapat memilih salah satu fokus cerita:</p>
                                    <ul className="list-disc list-inside text-slate-600 text-sm space-y-1 ml-2">
                                        <li><span className="font-semibold">Solusi AI Agent:</span> Praktik AI Agent spesifik apa yang Anda ciptakan dan apa solusi apa yang berhasil Anda buat?</li>
                                        <li><span className="font-semibold">Pelatihan yang Berdampak:</span> Kisah sukses saat Anda melakukan pelatihan/pengimbasan AI kepada rekan guru di sekitar Anda.</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center font-bold">2</div>
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-1">Sertakan Bukti</h3>
                                    <p className="text-slate-600 text-sm">Lampirkan foto, screenshot, atau video yang sudah Anda post.</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center font-bold">3</div>
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-1">Unggah di Media Sosial</h3>
                                    <p className="text-slate-600 text-sm">Publikasikan di platform pilihan Anda (Instagram, LinkedIn, Facebook, atau lainnya).</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center font-bold">4</div>
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-1">Wajib Gunakan Hashtag dan Tag</h3>
                                    <p className="text-slate-600 text-sm">Pastikan Anda menyertakan hashtag dan tag berikut di postingan Anda:</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hashtag & Tag Section */}
                    <div className="bg-pink-50 rounded-2xl border border-pink-100 p-6 md:p-8">
                        <h3 className="text-center font-bold text-slate-800 mb-6">Wajib Gunakan Hashtag dan Tag</h3>

                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                                    <span className="font-semibold text-slate-700">Hashtag</span>
                                </div>
                                <div className="bg-white border border-pink-200 rounded-xl p-4 flex items-center justify-between group cursor-pointer hover:border-pink-400 transition-colors"
                                    onClick={() => copyToClipboard('#GoogleGemini #GeminiUntukPendidik #IGI')}>
                                    <code className="text-pink-600 font-medium">#GoogleGemini #GeminiUntukPendidik #IGI</code>
                                    <button className="text-slate-400 hover:text-pink-500 transition-colors flex items-center gap-1 text-xs">
                                        <Copy className="w-4 h-4" /> Salin
                                    </button>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                                    <span className="font-semibold text-slate-700">Tag Akun</span>
                                </div>
                                <div className="bg-white border border-pink-200 rounded-xl p-4 relative group">
                                    <div className="absolute top-4 right-4">
                                        <button
                                            onClick={() => copyToClipboard('@googleindonesia @garuda21.official')}
                                            className="text-slate-400 hover:text-pink-500 transition-colors flex items-center gap-1 text-xs"
                                        >
                                            <Copy className="w-4 h-4" /> Salin
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded text-sm font-mono">@googleindonesia</span>
                                            <span className="text-slate-500 text-sm">Google Indonesia</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded text-sm font-mono">@garuda21.official</span>
                                            <span className="text-slate-500 text-sm">Garuda-21 Official</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Submission */}
                    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <Share2 className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">
                                Form Submission
                            </h2>
                        </div>

                        <form action={handleSubmit} ref={formRef} className="space-y-6">
                            <div>
                                <label className="block text-slate-700 font-bold mb-2">
                                    Tautan (Link) Postingan Media Sosial Anda <span className="text-red-500">*</span>
                                </label>
                                <p className="text-slate-500 text-sm mb-3">
                                    Salin dan tempel (copy-paste) URL postingan media sosial yang sudah Anda buat. Pastikan postingan sudah diatur "Public" (Publik).
                                </p>
                                <input
                                    type="url"
                                    name="socialLink"
                                    required
                                    placeholder="https://instagram.com/p/..."
                                    className="w-full p-4 rounded-xl border border-slate-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all text-slate-700 placeholder:text-slate-400"
                                />
                                <div className="text-right mt-2 text-xs text-slate-400">
                                    Maksimal 500 karakter
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-700 font-bold mb-2">
                                    Unggah Screenshot Bukti Postingan Anda <span className="text-red-500">*</span>
                                </label>
                                <p className="text-slate-500 text-sm mb-3">
                                    Sertakan tangkapan layar (capture) postingan yang sudah tayang di media sosial sebagai bukti pendukung. (Maks. 1 File)
                                </p>

                                <div
                                    className={`relative border-2 border-dashed rounded-2xl p-8 transition-all text-center cursor-pointer ${dragActive
                                        ? 'border-pink-500 bg-pink-50'
                                        : 'border-slate-300 hover:border-pink-400 hover:bg-slate-50'
                                        }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        accept="image/png, image/jpeg, image/jpg"
                                        onChange={handleChange}
                                    />

                                    {file ? (
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-3">
                                                <CheckCircle2 className="w-8 h-8" />
                                            </div>
                                            <p className="text-slate-900 font-medium">{file.name}</p>
                                            <p className="text-slate-500 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setFile(null)
                                                }}
                                                className="mt-4 text-red-500 text-sm hover:underline"
                                            >
                                                Hapus & Ganti File
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <Upload className="w-12 h-12 text-slate-400 mb-4" />
                                            <p className="text-slate-700 font-medium text-lg mb-2">
                                                Klik atau drag file ke area ini
                                            </p>
                                            <p className="text-slate-500 text-sm mb-6">
                                                JPG, JPEG, PNG (Maks. 4MB)
                                            </p>
                                            <button
                                                type="button"
                                                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                                            >
                                                Pilih File
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-center pt-6">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-12 py-4 rounded-xl font-bold text-lg hover:from-purple-600 hover:to-pink-700 transition-all transform hover:scale-105 shadow-xl shadow-pink-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Mengirim...
                                        </>
                                    ) : (
                                        'Kirim Submission'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>



                    {/* History Section */}
                    <div className="max-w-4xl mx-auto mt-12">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">Riwayat Laporan Anda</h2>
                        <div className="space-y-4">
                            {submissions.length === 0 ? (
                                <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 text-slate-500">
                                    Belum ada laporan yang dikirim.
                                </div>
                            ) : (
                                submissions.map((sub) => (
                                    <div key={sub.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${sub.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                    sub.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {sub.status === 'approved' ? 'Diterima' :
                                                        sub.status === 'rejected' ? 'Ditolak' : 'Menunggu Review'}
                                                </span>
                                                <span className="text-slate-400 text-sm">
                                                    {new Date(sub.created_at).toLocaleDateString('id-ID', {
                                                        day: 'numeric', month: 'long', year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-slate-800 mb-1 line-clamp-1">{sub.solution}</h3>
                                            <p className="text-slate-600 text-sm line-clamp-2">Laporan Aktualisasi</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-xs text-slate-500">Poin Didapatkan</div>
                                                <div className="text-xl font-bold text-indigo-600">
                                                    {sub.status === 'approved' ? '+5 Poin' : '0 Poin'}
                                                </div>
                                            </div>
                                            {sub.documentation_url && (
                                                <a href={sub.documentation_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                                                    <FileText className="w-5 h-5 text-slate-600" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Tips Tambahan */}
                    <div className="bg-orange-50 rounded-2xl p-6 text-center">
                        <div className="flex items-center justify-center gap-2 font-bold text-slate-800 mb-2">
                            <span className="text-xl">💡</span> Tips Tambahan
                        </div>
                        <ul className="text-slate-600 text-sm space-y-1 inline-block text-left">
                            <li>• Postingan yang menarik biasanya mendapatkan lebih banyak interaksi</li>
                            <li>• Ceritakan dengan detail dan jelas apa dampak yang Anda rasakan</li>
                            <li>• Gunakan foto/video berkualitas tinggi untuk mendukung cerita Anda</li>
                            <li>• Ajak teman-teman untuk like dan share postingan Anda</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div >
    )
}
