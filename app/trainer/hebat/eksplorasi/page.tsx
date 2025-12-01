'use client'

import { useState, useRef } from 'react'
import { ArrowLeft, Upload, FileText, Lightbulb, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { submitExploration } from './actions'
import { useToast } from '@/hooks/useToast'
import { useRouter } from 'next/navigation'
import imageCompression from 'browser-image-compression'

export default function EksplorasiPage() {
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
            // Jika file > 1MB, lakukan kompresi
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
                toast.error('File wajib', 'Mohon unggah bukti dokumentasi')
                setIsSubmitting(false)
                return
            }
            formData.set('documentation', file)

            const result = await submitExploration(formData)

            if (result?.error) {
                toast.error('Gagal', result.error)
            } else {
                toast.success('Berhasil', 'Submission berhasil dikirim!')
                // Redirect handled by server action, but we can also do it here if needed
            }
        } catch (error) {
            toast.error('Error', 'Terjadi kesalahan. Silakan coba lagi.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-indigo-50 p-6 md:p-12 font-sans">
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
                                EKSPLORASI
                            </h1>
                            <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg shadow-indigo-200">
                                Laporan Kegiatan
                            </span>
                        </div>
                        <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
                            Ceritakan aksi nyata Anda: Solusi Gems spesifik apa yang Anda ciptakan untuk memecahkan masalah
                            di bidang pendidikan, atau cerita pelatihan AI yang Anda lakukan kepada rekan guru. Tunjukkan hasil dan dampaknya!
                        </p>
                    </div>
                </div>

                <form action={handleSubmit} ref={formRef} className="space-y-6">
                    {/* Card 1: Fokus Kegiatan */}
                    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">
                                Fokus Kegiatan Anda <span className="text-red-500">*</span>
                            </h2>
                        </div>

                        <p className="text-slate-500 mb-4 text-sm">Pilih satu fokus utama dari cerita praktik yang akan Anda bagikan.</p>

                        <div className="space-y-4">
                            <label className="relative flex items-start p-4 rounded-xl border-2 border-slate-200 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group">
                                <input type="radio" name="focus" value="A" className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" required />
                                <div className="ml-4">
                                    <span className="block text-slate-900 font-semibold group-hover:text-indigo-700">A. Aksi Nyata AI di Kelas</span>
                                    <span className="block text-slate-500 text-sm mt-1">Fokus pada praktik penggunaan Gems dalam pembelajaran</span>
                                </div>
                            </label>

                            <label className="relative flex items-start p-4 rounded-xl border-2 border-slate-200 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group">
                                <input type="radio" name="focus" value="B" className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500" required />
                                <div className="ml-4">
                                    <span className="block text-slate-900 font-semibold group-hover:text-indigo-700">B. Aksi Nyata AI untuk Guru</span>
                                    <span className="block text-slate-500 text-sm mt-1">Fokus pada sesi pengimbasan/pelatihan kepada guru lain</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Card 2: Cerita Hasil */}
                    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                <Lightbulb className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">
                                Cerita Hasil dan Dampak Nyata <span className="text-red-500">*</span>
                            </h2>
                        </div>

                        <p className="text-slate-500 mb-4 text-sm">
                            Bagikan kisah Anda secara ringkas. Jelaskan output (hasil akhir) dari praktik/pengajaran Anda dan dampak positif apa yang dirasakan (oleh Anda, siswa, atau rekan guru).
                        </p>

                        <div className="relative">
                            <textarea
                                name="story"
                                className="w-full min-h-[150px] p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-y text-slate-700 placeholder:text-slate-400"
                                placeholder="Ceritakan pengalaman Anda secara detail..."
                                minLength={50}
                                maxLength={1000}
                                required
                            ></textarea>
                            <div className="absolute bottom-3 right-3 text-xs text-slate-400">
                                Minimal 50 karakter, maksimal 1000 karakter
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Solusi AI */}
                    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <FileText className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">
                                Solusi AI yang Diimplementasikan <span className="text-red-500">*</span>
                            </h2>
                        </div>

                        <p className="text-slate-500 mb-4 text-sm">
                            Apa inovasi/solusi AI yang Anda buat atau ajarkan? Sebutkan dengan jelas.
                        </p>

                        <input
                            type="text"
                            name="solution"
                            className="w-full p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-slate-700 placeholder:text-slate-400"
                            placeholder='Contoh: "Membuat Gems di Gemini AI untuk merancang Modul Ajar Kurikulum Merdeka," atau "Sesi pelatihan..."'
                            maxLength={200}
                            required
                        />
                        <div className="text-right mt-2 text-xs text-slate-400">
                            Maksimal 200 karakter
                        </div>
                    </div>

                    {/* Card 4: Upload Bukti */}
                    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <Upload className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">
                                Unggah Bukti Dokumentasi (Wajib) <span className="text-red-500">*</span>
                            </h2>
                        </div>

                        <p className="text-slate-500 mb-4 text-sm">
                            Sertakan bukti visual kegiatan Anda. Contoh: Screenshot hasil kerja dari Gems, foto saat praktik di kelas, atau foto saat Anda melakukan pengimbasan/pelatihan.
                        </p>

                        <div
                            className={`relative border-2 border-dashed rounded-2xl p-8 transition-all text-center cursor-pointer ${dragActive
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
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
                                        className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                                    >
                                        Pilih File
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-center pt-6">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-indigo-600 text-white px-12 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-xl shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
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
        </div>
    )
}
