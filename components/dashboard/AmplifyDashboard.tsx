'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import {
    Share2,
    Copy,
    MessageCircle,
    Mail,
    Users,
    GraduationCap,
    Target,
    CheckCircle,
    TrendingUp,
    Info,
    ArrowLeft,
    Lightbulb
} from 'lucide-react'
import Link from 'next/link'
import { useNotification } from '@/components/ui/Notification'
import imageCompression from 'browser-image-compression'

export default function AmplifyDashboard() {
    const { profile } = useAuth()
    const { addNotification } = useNotification()
    const [loading, setLoading] = useState(true)
    const [trainerId, setTrainerId] = useState<string | null>(null)
    const [referralCode, setReferralCode] = useState<string>('')
    const [stats, setStats] = useState({
        gtk_points: 0,
        student_points: 0,
        total_points: 0,
        registered: 0,
        completed: 0,
        total_earned_points: 0
    })
    const [activeTab, setActiveTab] = useState<'gtk' | 'student'>('gtk')
    const [studentForm, setStudentForm] = useState({
        training_date: '',
        student_count: '',
        topic: '',
        duration_hours: '',
        training_format: 'daring',
        documentation_file: null as File | null,
        notes: ''
    })
    const [studentSubmissions, setStudentSubmissions] = useState<any[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (profile?.id) {
            fetchData()
        }
    }, [profile?.id])

    const fetchData = async () => {
        try {
            setLoading(true)

            // 0. Get Trainer ID
            const { data: trainerData, error: trainerError } = await supabase
                .from('trainers')
                .select('id')
                .eq('user_id', profile?.id)
                .single()

            const currentTrainerId = trainerData?.id
            if (currentTrainerId) setTrainerId(currentTrainerId)

            // 1. Get Referral Code
            const { data: codes, error: codesError } = await supabase
                .from('referral_codes')
                .select('code')
                .eq('trainer_id', profile?.id)
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1)

            if (codes && codes.length > 0) {
                setReferralCode(codes[0].code)
            } else {
                // Generate a new code if none exists (simplified for now)
                // In a real scenario, we might want to ask the user or generate one automatically
                // For now, let's just leave it empty or show a "Generate" button if needed
                // But per requirements, we assume one exists or we just show empty
            }

            // 2. Get Points from trainer_hebat_points
            // FIX: Use currentTrainerId (Trainer UUID) instead of profile.id (User ID)
            const { data: pointsData, error: pointsError } = await supabase
                .from('trainer_hebat_points')
                .select('b_points')
                .eq('trainer_id', currentTrainerId || profile?.id)
                .single()

            // 3. Get Referral Stats from referral_tracking
            // We need to count confirmed referrals
            const { data: trackingData, error: trackingError } = await supabase
                .from('referral_tracking')
                .select('status, created_at')
                .eq('trainer_id', profile?.id)

            const registered = trackingData?.length || 0
            const completed = trackingData?.filter(t => t.status === 'confirmed').length || 0

            // Assuming b_points tracks the points from referrals
            const totalPoints = pointsData?.b_points || 0

            // Calculate points breakdown
            // Currently assuming:
            // - 2 points = GTK Referral
            // - 1 point = Student Referral (future proofing)

            let gtkPoints = 0
            let studentPoints = 0

            // We need to fetch activities to distinguish types if we want to be precise, 
            // but for now we can infer from the total b_points if we assume all are GTK.
            // However, to be more accurate let's fetch the activities summary if possible.
            // Since we only have total b_points in `trainer_hebat_points`, we will assume:
            // All current points are GTK points as per instruction.

            gtkPoints = pointsData?.b_points || 0
            studentPoints = 0 // Future: fetch from activities where type='student'

            setStats({
                gtk_points: gtkPoints,
                student_points: studentPoints,
                total_points: gtkPoints + studentPoints,
                registered,
                completed,
                total_earned_points: gtkPoints + studentPoints
            })

        } catch (error) {
            console.error('Error fetching amplify data:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchStudentSubmissions = async () => {
        if (!profile?.id) return

        // Use state trainerId if available, otherwise try to fetch or fallback (though fetch should have run)
        // For safety, we can query using user_id via join if needed, but let's rely on trainerId state or fetch it again if missing
        let tid = trainerId
        if (!tid) {
            const { data } = await supabase.from('trainers').select('id').eq('user_id', profile.id).single()
            tid = data?.id
        }
        if (!tid) return

        const { data, error } = await supabase
            .from('student_training_submissions')
            .select('*')
            .eq('trainer_id', tid)
            .order('created_at', { ascending: false })

        if (data) {
            setStudentSubmissions(data)
        }
    }

    useEffect(() => {
        if (activeTab === 'student') {
            fetchStudentSubmissions()
        }
    }, [activeTab, profile?.id, trainerId])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setStudentForm({ ...studentForm, documentation_file: e.target.files[0] })
        }
    }

    const handleStudentSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!profile?.id) return

        let tid = trainerId
        if (!tid) {
            const { data } = await supabase.from('trainers').select('id').eq('user_id', profile.id).single()
            tid = data?.id
        }

        if (!tid) {
            addNotification({
                type: 'error',
                title: 'Gagal',
                message: 'Data trainer tidak ditemukan'
            })
            return
        }

        setIsSubmitting(true)

        try {
            let documentationUrl = ''

            if (studentForm.documentation_file) {
                let file = studentForm.documentation_file

                // Compress image if it's an image file
                if (file.type.startsWith('image/')) {
                    const options = {
                        maxSizeMB: 1,
                        maxWidthOrHeight: 1920,
                        useWebWorker: true
                    }
                    try {
                        const compressedFile = await imageCompression(file, options)
                        file = new File([compressedFile], file.name, { type: file.type })
                    } catch (error) {
                        console.error('Error compressing image:', error)
                    }
                }

                const fileExt = file.name.split('.').pop()
                const fileName = `${profile.id}/${Date.now()}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('student-training-evidence')
                    .upload(fileName, file)

                if (uploadError) throw uploadError

                const { data: publicUrlData } = supabase.storage
                    .from('student-training-evidence')
                    .getPublicUrl(fileName)

                documentationUrl = publicUrlData.publicUrl
            }

            const { error: insertError } = await supabase
                .from('student_training_submissions')
                .insert({
                    trainer_id: tid,
                    training_date: studentForm.training_date,
                    student_count: parseInt(studentForm.student_count),
                    topic: studentForm.topic,
                    duration_hours: parseFloat(studentForm.duration_hours),
                    training_format: studentForm.training_format,
                    documentation_url: documentationUrl,
                    notes: studentForm.notes
                })

            if (insertError) throw insertError

            addNotification({
                type: 'success',
                title: 'Berhasil',
                message: 'Laporan pelatihan siswa berhasil disubmit'
            })

            setStudentForm({
                training_date: '',
                student_count: '',
                topic: '',
                duration_hours: '',
                training_format: 'daring',
                documentation_file: null,
                notes: ''
            })
            fetchStudentSubmissions()

        } catch (error: any) {
            console.error('Error submitting student training:', error)
            addNotification({
                type: 'error',
                title: 'Gagal',
                message: error.message || 'Terjadi kesalahan saat submit laporan'
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const copyToClipboard = () => {
        const url = `${window.location.origin}/referral/${referralCode}`
        navigator.clipboard.writeText(url)
        addNotification({
            type: 'success',
            title: 'Berhasil',
            message: 'Link referral berhasil disalin'
        })
    }

    const shareViaWhatsApp = () => {
        const url = `${window.location.origin}/referral/${referralCode}`
        const text = `Ayo bergabung dengan program Gemini untuk Pendidik! Gunakan kode referralku: ${url}`
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }

    const shareViaEmail = () => {
        const url = `${window.location.origin}/referral/${referralCode}`
        const subject = 'Undangan Program Gemini untuk Pendidik'
        const body = `Halo,\n\nSaya mengundang Anda untuk bergabung dengan program Gemini untuk Pendidik. Gunakan link berikut untuk mendaftar:\n${url}\n\nTerima kasih!`
        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
    }

    const referralLink = referralCode ? `${typeof window !== 'undefined' ? window.location.origin : ''}/referral/${referralCode}` : 'Memuat...'

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Header / Back Button */}
            <div>
                <Link href="/trainer/dashboard" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Kembali ke Portal
                </Link>

                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center space-x-3">
                        <h1 className="text-4xl font-bold text-slate-800">BERBAGI</h1>
                        <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                            <Share2 className="w-4 h-4 mr-2" />
                            Referral System
                        </span>
                    </div>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Amplifikasi dampak dari program Gemini untuk Pendidik dengan mengajak rekan GTK untuk juga belajar dan mengikuti perjalanan HEBAT!
                    </p>
                </div>
            </div>

            {/* Total Points Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-center mb-6 space-x-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-bold text-gray-900">Total Poin BERBAGI</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* GTK Points */}
                    <div className="border border-gray-100 rounded-xl p-6 text-center hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{stats.gtk_points}</div>
                        <div className="text-sm text-gray-500">Poin GTK</div>
                    </div>

                    {/* Student Points */}
                    <div className="border border-gray-100 rounded-xl p-6 text-center hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <GraduationCap className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold text-gray-900 mb-1">{stats.student_points}</div>
                        <div className="text-sm text-gray-500">Poin Siswa</div>
                    </div>

                    {/* Total Points */}
                    <div className="bg-blue-600 rounded-xl p-6 text-center text-white shadow-lg transform scale-105">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Target className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-3xl font-bold mb-1">{stats.total_points}</div>
                        <div className="text-sm text-blue-100">Total Poin</div>
                    </div>
                </div>

                <div className="mt-6 text-center text-sm text-gray-500">
                    Terus kumpulkan poin hingga Juni 2026 untuk meningkatkan peluang Pelatihan AI di Kantor Google APAC di Singapura!
                </div>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    onClick={() => setActiveTab('gtk')}
                    className={`p-4 rounded-xl border-2 flex items-center justify-center space-x-3 transition-all ${activeTab === 'gtk'
                        ? 'border-transparent bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-orange-200'
                        }`}
                >
                    <Users className="w-5 h-5" />
                    <div className="text-left">
                        <div className="font-bold">Referral GTK</div>
                        <div className="text-xs opacity-90">Ajak Rekan Pendidik</div>
                    </div>
                </button>

                <button
                    onClick={() => setActiveTab('student')}
                    className={`p-4 rounded-xl border-2 flex items-center justify-center space-x-3 transition-all ${activeTab === 'student'
                        ? 'border-transparent bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200'
                        }`}
                >
                    <GraduationCap className="w-5 h-5" />
                    <div className="text-left">
                        <div className="font-bold">Pelatihan Siswa</div>
                        <div className="text-xs opacity-90">Libatkan Peserta Didik</div>
                    </div>
                </button>
            </div>

            {/* Dynamic Content Based on Tab */}
            {activeTab === 'gtk' ? (
                <>
                    {/* How to Collect Points (GTK) */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center mb-6 space-x-2">
                            <Target className="w-5 h-5 text-orange-500" />
                            <h2 className="text-lg font-bold text-gray-900">Cara Mengumpulkan Poin dari Referral GTK</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Share2 className="w-4 h-4 text-blue-600" />
                                </div>
                                <p className="text-sm text-gray-600">
                                    Ajak rekan GTK untuk belajar modul program Gemini untuk Pendidik menggunakan link referral Anda. Anda akan mendapatkan 1 poin untuk tiap peserta yang daftar dan menyelesaikan salah satu pembelajaran melalui link referal Anda.
                                </p>
                            </div>

                            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <TrendingUp className="w-4 h-4 text-purple-600" />
                                </div>
                                <p className="text-sm text-gray-600">
                                    Poin otomatis dihitung berdasarkan jumlah peserta GTK yang yang daftar dan menyelesaikan salah satu pembelajaran melalui link referal Anda.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Referral Link & Stats */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Referral Link */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <div className="flex items-center mb-4 space-x-2">
                                <Share2 className="w-5 h-5 text-blue-500" />
                                <h2 className="text-lg font-bold text-gray-900">Link Referral</h2>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">Salin dan bagikan link referral Anda</p>

                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 break-all font-mono text-sm text-gray-600">
                                {referralLink}
                            </div>

                            <button
                                onClick={copyToClipboard}
                                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center transition-colors mb-4"
                            >
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Link
                            </button>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={shareViaWhatsApp}
                                    className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center transition-colors"
                                >
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Bagikan via WhatsApp
                                </button>
                                <button
                                    onClick={shareViaEmail}
                                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center transition-colors"
                                >
                                    <Mail className="w-4 h-4 mr-2" />
                                    Bagikan via Email
                                </button>
                            </div>
                        </div>

                        {/* Statistics */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <div className="flex items-center mb-6 space-x-2">
                                <TrendingUp className="w-5 h-5 text-green-500" />
                                <h2 className="text-lg font-bold text-gray-900">Statistik Referral</h2>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-blue-50 rounded-xl p-4 text-center">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <Users className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="text-xl font-bold text-gray-900">{stats.registered}</div>
                                    <div className="text-xs text-gray-500">Terdaftar</div>
                                </div>
                                <div className="bg-green-50 rounded-xl p-4 text-center">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div className="text-xl font-bold text-gray-900">{stats.completed}</div>
                                    <div className="text-xs text-gray-500">Selesai</div>
                                </div>
                                <div className="bg-orange-50 rounded-xl p-4 text-center">
                                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <Target className="w-4 h-4 text-orange-600" />
                                    </div>
                                    <div className="text-xl font-bold text-gray-900">{stats.total_earned_points}</div>
                                    <div className="text-xs text-gray-500">Poin</div>
                                </div>
                            </div>

                            <div className="text-center text-xs text-gray-400">
                                <div className="flex items-center justify-center space-x-1">
                                    <Info className="w-3 h-3" />
                                    <span>Terakhir update: {new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* How to Collect Points (Student) */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center mb-6 space-x-2">
                            <Target className="w-5 h-5 text-purple-500" />
                            <h2 className="text-lg font-bold text-gray-900">Cara Mengumpulkan Poin dari Pelatihan Siswa</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Users className="w-4 h-4 text-green-600" />
                                </div>
                                <p className="text-sm text-gray-600">
                                    Bagikan pengetahuan Anda kepada siswa/peserta didik melalui sesi pelatihan daring atau luring tentang AI dan teknologi.
                                </p>
                            </div>

                            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Users className="w-4 h-4 text-indigo-600" />
                                </div>
                                <p className="text-sm text-gray-600">
                                    Libatkan sebanyak mungkin siswa dalam pelatihan yang Anda selenggarakan.
                                </p>
                            </div>

                            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <TrendingUp className="w-4 h-4 text-orange-600" />
                                </div>
                                <p className="text-sm text-gray-600">
                                    Catat setiap sesi pelatihan yang Anda lakukan menggunakan form di bawah ini.
                                </p>
                            </div>

                            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <TrendingUp className="w-4 h-4 text-blue-600" />
                                </div>
                                <p className="text-sm text-gray-600">
                                    Poin otomatis dihitung berdasarkan jumlah siswa yang Anda libatkan (1 siswa = 1 poin).
                                </p>
                            </div>

                            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Info className="w-4 h-4 text-red-600" />
                                </div>
                                <p className="text-sm text-gray-600">
                                    Maksimal 150 poin per bulan untuk pelatihan siswa.
                                </p>
                            </div>

                            <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                                <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Target className="w-4 h-4 text-pink-600" />
                                </div>
                                <p className="text-sm text-gray-600">
                                    Kumpulkan sebanyak mungkin poin hingga Juni 2026 untuk meningkatkan kesempatan Pelatihan AI di Kantor Google APAC di Singapura!
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Submission Form */}
                    <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm">
                        <div className="flex items-center mb-6 space-x-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Copy className="w-4 h-4 text-blue-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Submit Dokumentasi Pelatihan Siswa</h2>
                        </div>

                        <form onSubmit={handleStudentSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tanggal Pelatihan <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={studentForm.training_date}
                                        onChange={(e) => setStudentForm({ ...studentForm, training_date: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Jumlah Siswa yang Hadir <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Users className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={studentForm.student_count}
                                            onChange={(e) => setStudentForm({ ...studentForm, student_count: e.target.value })}
                                            className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">siswa</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Topik/Materi yang Diajarkan <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={studentForm.topic}
                                        onChange={(e) => setStudentForm({ ...studentForm, topic: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Pilih topik...</option>
                                        <option value="Pengenalan AI">Pengenalan AI</option>
                                        <option value="Penggunaan Gemini">Penggunaan Gemini</option>
                                        <option value="Etika AI">Etika AI</option>
                                        <option value="Prompt Engineering">Prompt Engineering</option>
                                        <option value="Lainnya">Lainnya</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Durasi Pelatihan <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <TrendingUp className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="number"
                                            required
                                            step="0.5"
                                            min="0.5"
                                            value={studentForm.duration_hours}
                                            onChange={(e) => setStudentForm({ ...studentForm, duration_hours: e.target.value })}
                                            className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">jam</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Format Pelatihan <span className="text-red-500">*</span>
                                </label>
                                <div className="flex space-x-6">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="format"
                                            value="daring"
                                            checked={studentForm.training_format === 'daring'}
                                            onChange={(e) => setStudentForm({ ...studentForm, training_format: e.target.value })}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                        />
                                        <span className="ml-2 text-gray-700">Daring</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="format"
                                            value="luring"
                                            checked={studentForm.training_format === 'luring'}
                                            onChange={(e) => setStudentForm({ ...studentForm, training_format: e.target.value })}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                        />
                                        <span className="ml-2 text-gray-700">Luring</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="format"
                                            value="hybrid"
                                            checked={studentForm.training_format === 'hybrid'}
                                            onChange={(e) => setStudentForm({ ...studentForm, training_format: e.target.value })}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                        />
                                        <span className="ml-2 text-gray-700">Hybrid</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Unggah Bukti Dokumentasi Pelatihan <span className="text-red-500">*</span>
                                </label>
                                <p className="text-xs text-blue-500 mb-2">
                                    Sertakan foto dokumentasi kegiatan pelatihan sebagai bukti pendukung. (Maks. 1 File, 4MB)
                                </p>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
                                    <div className="space-y-1 text-center">
                                        <svg
                                            className="mx-auto h-12 w-12 text-gray-400"
                                            stroke="currentColor"
                                            fill="none"
                                            viewBox="0 0 48 48"
                                            aria-hidden="true"
                                        >
                                            <path
                                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                                strokeWidth={2}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        <div className="flex text-sm text-gray-600">
                                            <label
                                                htmlFor="file-upload"
                                                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                                            >
                                                <span>Upload a file</span>
                                                <input
                                                    id="file-upload"
                                                    name="file-upload"
                                                    type="file"
                                                    className="sr-only"
                                                    accept="image/*,application/pdf"
                                                    onChange={handleFileChange}
                                                    required={!studentForm.documentation_file}
                                                />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500">PNG, JPG, PDF up to 4MB</p>
                                        {studentForm.documentation_file && (
                                            <p className="text-sm text-green-600 font-medium mt-2">
                                                Selected: {studentForm.documentation_file.name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Catatan Tambahan (Opsional)
                                </label>
                                <textarea
                                    rows={3}
                                    value={studentForm.notes}
                                    onChange={(e) => setStudentForm({ ...studentForm, notes: e.target.value })}
                                    placeholder="Tambahkan catatan tentang pelatihan ini..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
                                <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-yellow-800">Sisa kuota bulan ini: 150 poin</h4>
                                    <p className="text-xs text-yellow-700 mt-1">
                                        Maksimal 150 poin per bulan untuk pelatihan siswa
                                    </p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Menyimpan...' : 'Simpan Pelatihan'}
                            </button>
                        </form>
                    </div>

                    {/* History Section */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm min-h-[200px] flex flex-col items-center justify-center text-center">
                        {studentSubmissions.length === 0 ? (
                            <>
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <TrendingUp className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">Belum ada riwayat pelatihan yang disubmit</h3>
                                <p className="text-gray-500 text-sm">
                                    Submit dokumentasi pelatihan pertama Anda menggunakan form di atas
                                </p>
                            </>
                        ) : (
                            <div className="w-full space-y-4">
                                <h3 className="text-lg font-bold text-gray-900 text-left mb-4">Riwayat Pelatihan</h3>
                                {studentSubmissions.map((sub, idx) => (
                                    <div key={idx} className="border border-gray-200 rounded-xl p-4 text-left hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-bold text-gray-900">{sub.topic}</div>
                                                <div className="text-sm text-gray-500 flex items-center mt-1">
                                                    <span className="mr-3">{new Date(sub.training_date).toLocaleDateString('id-ID')}</span>
                                                    <span className="mr-3">•</span>
                                                    <span className="mr-3">{sub.student_count} Siswa</span>
                                                    <span className="mr-3">•</span>
                                                    <span className="capitalize">{sub.training_format}</span>
                                                </div>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${sub.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                sub.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {sub.status === 'approved' ? 'Disetujui' :
                                                    sub.status === 'rejected' ? 'Ditolak' : 'Menunggu Review'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Tips */}
            <div className="bg-purple-50 rounded-2xl border border-purple-100 p-6 text-center">
                <div className="flex items-center justify-center mb-2 space-x-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    <h3 className="font-bold text-gray-900">Tips Tambahan</h3>
                </div>
                <p className="text-sm text-gray-600 max-w-3xl mx-auto">
                    Bagikan link referral Anda di grup WhatsApp guru, posting di media sosial, atau diskusikan di forum pendidikan untuk memaksimalkan jumlah peserta yang Anda ajak. Semakin banyak peserta yang selesai belajar, semakin besar peluang Anda untuk bersinar!
                </p>
            </div>
        </div>
    )
}
