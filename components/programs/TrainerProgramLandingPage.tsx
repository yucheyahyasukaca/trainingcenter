'use client'

import { ArrowLeft, Clock, Calendar, CheckCircle, Users, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { formatCurrency, formatDate } from '@/lib/utils'

import { ProgramStatisticsModal } from '@/components/programs/ProgramStatisticsModal'
import { useAuth } from '@/components/AuthProvider'
import { useState } from 'react'

interface ProgramWithDetails {
    id: string
    title: string
    description: string
    category: string
    price: number
    start_date: string
    end_date: string
    max_participants: number | null
    image_url?: string
    status: string
    classes?: any[]
    trainer_id: string
    trainer?: {
        id: string
        user_id?: string
        full_name: string
        specialization: string
        bio: string
        photo_url: string
    }
}

interface TrainerProgramLandingPageProps {
    program: ProgramWithDetails
    isEnrolled: boolean
    isPending: boolean
}

export function TrainerProgramLandingPage({ program, isEnrolled, isPending }: TrainerProgramLandingPageProps) {
    const { profile } = useAuth()
    const [showStatisticsModal, setShowStatisticsModal] = useState(false)

    return (
        <div className="min-h-screen bg-gray-50">
            <ProgramStatisticsModal
                isOpen={showStatisticsModal}
                onClose={() => setShowStatisticsModal(false)}
                programId={program.id}
            />

            {/* Header/Nav Placeholder */}
            <div className="bg-white shadow-sm border-b sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link
                        href="/programs"
                        className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali ke Daftar Program
                    </Link>
                    <div className="flex items-center gap-4">
                        {/* Optional: Add share button or other actions */}
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

                    {/* Left Column: Main Content */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Hero Section */}
                        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
                            {program.image_url && (
                                <div className="mb-6 relative w-full h-64 sm:h-80 rounded-xl overflow-hidden shadow-sm">
                                    <Image
                                        src={program.image_url}
                                        alt={program.title}
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                </div>
                            )}
                            <div className="flex flex-wrap gap-3 mb-6">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                                    {program.category || 'Program Pelatihan'}
                                </span>
                                {program.status === 'published' && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700">
                                        Ditayangkan
                                    </span>
                                )}
                            </div>

                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-6">
                                {program.title}
                            </h1>

                            <div className="prose prose-blue max-w-none text-gray-600">
                                <p className="whitespace-pre-line">{program.description || 'Tidak ada deskripsi program.'}</p>
                            </div>
                        </div>

                        {/* Trainer Section */}
                        {program.trainer && (
                            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Tentang Trainer</h2>
                                <div className="flex items-start gap-6">
                                    <div className="flex-shrink-0">
                                        {program.trainer.photo_url ? (
                                            <Image
                                                src={program.trainer.photo_url}
                                                alt={program.trainer.full_name}
                                                width={80}
                                                height={80}
                                                className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xl">
                                                {(program.trainer.full_name || '?').charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{program.trainer.full_name}</h3>
                                        <p className="text-blue-600 font-medium mb-2">{program.trainer.specialization}</p>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            {program.trainer.bio || 'Trainer ini belum menambahkan bio.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Curriculum / Classes Preview (Optional - could list classes briefly) */}
                        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Jadwal Kelas</h2>
                            {program.classes && program.classes.length > 0 ? (
                                <div className="space-y-4">
                                    {program.classes.map((cls: any) => (
                                        <div key={cls.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 gap-4">
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{cls.name}</h4>
                                                <div className="flex items-center text-sm text-gray-500 mt-1 gap-4">
                                                    <span className="flex items-center">
                                                        <Calendar className="w-4 h-4 mr-1.5" />
                                                        {formatDate(cls.start_date)}
                                                    </span>
                                                    <span className="flex items-center">
                                                        <Clock className="w-4 h-4 mr-1.5" />
                                                        {cls.start_time?.slice(0, 5)} - {cls.end_time?.slice(0, 5)} WIB
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Could add 'Full' badge or similar logic */}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {(profile as any)?.role === 'trainer' && (program.trainer_id === profile?.id || program.trainer?.user_id === profile?.id) ? (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-semibold text-yellow-800">Program Belum Memiliki Kelas</h4>
                                                    <p className="text-sm text-yellow-700 mt-1 mb-3">
                                                        User tidak dapat mendaftar ke program ini sebelum Anda membuat minimal satu kelas.
                                                        Silakan akses detail kelas yang baru saja Anda buat untuk menambah kelas lainnya.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                            <Calendar className="w-12 h-12 text-gray-300 mb-2" />
                                            <p className="text-gray-500 font-medium">Belum ada jadwal kelas yang tersedia.</p>
                                            <p className="text-sm text-gray-400">Silakan cek kembali nanti.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Right Column: Sticky Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                                <div className="mb-6">
                                    <p className="text-sm text-gray-500 mb-1">Biaya Investasi</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-gray-900">
                                            {program.price === 0 ? 'Gratis' : formatCurrency(program.price)}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center text-gray-700">
                                        <Users className="w-5 h-5 mr-3 text-gray-400" />
                                        <span>{program.max_participants ? `Kuota ${program.max_participants} Peserta` : 'Kuota Tidak Terbatas'}</span>
                                    </div>
                                    <div className="flex items-center text-gray-700">
                                        <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                                        <span>
                                            {(() => {
                                                const isValidDate = (date: string) => {
                                                    return date && !date.startsWith('1970') && !date.startsWith('0001');
                                                };

                                                if (isValidDate(program.start_date) && isValidDate(program.end_date)) {
                                                    return `${formatDate(program.start_date)} - ${formatDate(program.end_date)}`;
                                                }

                                                // Fallback to classes if program dates are invalid
                                                if (program.classes && program.classes.length > 0) {
                                                    const dates = program.classes
                                                        .map((c: any) => c.start_date)
                                                        .filter(Boolean)
                                                        .sort();

                                                    if (dates.length > 0) {
                                                        const firstDate = dates[0];
                                                        const lastDate = program.classes
                                                            .map((c: any) => c.end_date)
                                                            .filter(Boolean)
                                                            .sort()
                                                            .pop();

                                                        return lastDate ? `${formatDate(firstDate)} - ${formatDate(lastDate)}` : formatDate(firstDate);
                                                    }
                                                }

                                                return 'Waktu TBA';
                                            })()}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {!profile ? (
                                        <Link
                                            href={`/register?redirect=/programs/${program.id}`}
                                            className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
                                        >
                                            Daftar Sekarang
                                        </Link>
                                    ) : isEnrolled ? (
                                        <Link
                                            href={`/programs/${program.id}/classes`}
                                            className="w-full flex items-center justify-center px-6 py-3 bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-100 transition-colors font-medium"
                                        >
                                            <CheckCircle className="w-5 h-5 mr-2" />
                                            Akses Kelas
                                        </Link>
                                    ) : isPending ? (
                                        <div className="w-full flex items-center justify-center px-6 py-3 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-xl font-medium">
                                            <Clock className="w-5 h-5 mr-2" />
                                            Menunggu Konfirmasi
                                        </div>
                                    ) : (
                                        <Link
                                            href={`/programs/${program.id}/enroll`}
                                            className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
                                        >
                                            Daftar Sekarang
                                        </Link>
                                    )}

                                    <button
                                        onClick={() => setShowStatisticsModal(true)}
                                        className="w-full flex items-center justify-center px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                                    >
                                        Lihat Statistik
                                    </button>
                                </div>
                            </div>

                            {/* Help Card */}
                            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                                <h4 className="font-semibold text-blue-900 mb-2">Butuh Bantuan?</h4>
                                <p className="text-sm text-blue-800 mb-4">
                                    Jika Anda memiliki pertanyaan tentang program ini, jangan ragu untuk menghubungi kami.
                                </p>
                                <Link href="/contact" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                                    Hubungi Support &rarr;
                                </Link>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    )
}
