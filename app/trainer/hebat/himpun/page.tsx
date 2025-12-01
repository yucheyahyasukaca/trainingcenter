'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'
import {
    BookOpen,
    Clock,
    Award,
    CheckCircle,
    PlayCircle,
    ArrowRight,
    Video,
    FileText,
    HelpCircle,
    File,
    ChevronDown,
    ChevronUp,
    Sparkles,
    Eye,
    Upload
} from 'lucide-react'
import { useToast } from '@/hooks/useToast'

interface Module {
    id: string
    title: string
    description: string
    points: number
    duration_minutes: number
    image_url: string
    content_type: 'video' | 'text' | 'quiz' | 'document' | 'assignment'
    content_data: any
    material_type: 'main' | 'sub'
    parent_id: string | null
    order_index: number
    sub_modules?: Module[]
}

interface ModuleProgress {
    module_id: string
    status: 'started' | 'completed'
    completed_at: string | null
}

export default function HimpunModulesPage() {
    const { profile } = useAuth()
    const addToast = useToast()
    const [modules, setModules] = useState<Module[]>([])
    const [progress, setProgress] = useState<Record<string, ModuleProgress>>({})
    const [loading, setLoading] = useState(true)
    const [totalPoints, setTotalPoints] = useState(0)
    const [trainerId, setTrainerId] = useState<string | null>(null)

    useEffect(() => {
        if (profile) {
            fetchTrainerId()
        }
    }, [profile])

    useEffect(() => {
        if (trainerId) {
            fetchModules()
        }
    }, [trainerId])

    const fetchTrainerId = async () => {
        try {
            const { data, error } = await supabase
                .from('trainers')
                .select('id')
                .eq('user_id', profile?.id)
                .limit(1)
                .maybeSingle()

            if (error) throw error
            if (data) {
                setTrainerId(data.id)
            } else {
                console.error('Trainer not found for user:', profile?.id)
                addToast.error('Profil trainer tidak ditemukan')
                setLoading(false) // Stop loading if no trainer found
            }
        } catch (error) {
            console.error('Error fetching trainer ID:', error)
            setLoading(false) // Stop loading on error
        }
    }

    const fetchModules = async () => {
        if (!trainerId) return

        try {
            setLoading(true)

            // 1. Fetch all published modules
            const { data: modulesData, error: modulesError } = await supabase
                .from('hebat_modules')
                .select('*')
                .eq('is_published', true)
                .order('order_index', { ascending: true })

            if (modulesError) throw modulesError

            // 2. Fetch progress
            const { data: progressData, error: progressError } = await supabase
                .from('trainer_module_progress')
                .select('module_id, status')
                .eq('trainer_id', trainerId)

            if (progressError) throw progressError

            // 3. Fetch total points
            const { data: pointsData, error: pointsError } = await supabase
                .from('trainer_hebat_points')
                .select('h_points')
                .eq('trainer_id', trainerId)
                .single()

            if (pointsData) {
                setTotalPoints(pointsData.h_points || 0)
            }

            // Process data
            const progressMap: Record<string, ModuleProgress> = {}
            let points = 0 // Calculated from completed modules (fallback)

            progressData?.forEach((p: any) => {
                progressMap[p.module_id] = p
                if (p.status === 'completed') {
                    // Find module to get points
                    const module = (modulesData as Module[])?.find(m => m.id === p.module_id)
                    if (module) points += (module.points || 0)
                }
            })

            // Use stored points if available, otherwise use calculated
            if (!pointsData) {
                setTotalPoints(points)
            }

            setProgress(progressMap)

            // Group modules (Main > Sub)
            const mainModules = (modulesData as Module[])?.filter(m => m.material_type === 'main') || []
            const subModulesMap = new Map<string, Module[]>()

                ; (modulesData as Module[])?.filter(m => m.material_type === 'sub').forEach(sub => {
                    const parentId = sub.parent_id
                    if (parentId) {
                        const existing = subModulesMap.get(parentId) || []
                        existing.push(sub)
                        subModulesMap.set(parentId, existing)
                    }
                })

            mainModules.forEach(main => {
                const subModules = subModulesMap.get(main.id) || []
                main.sub_modules = subModules.sort((a, b) => a.order_index - b.order_index)

                // Aggregate points
                const subPoints = main.sub_modules.reduce((sum, sub) => sum + (sub.points || 0), 0)
                main.points = (main.points || 0) + subPoints
            })

            setModules(mainModules.sort((a, b) => a.order_index - b.order_index))

        } catch (error) {
            console.error('Error fetching modules:', error)
            addToast.error('Gagal memuat modul')
        } finally {
            setLoading(false)
        }
    }

    // Calculate overall progress
    const totalModules = modules.length
    const completedModules = modules.filter(m => progress[m.id]?.status === 'completed').length
    const progressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0

    // Calculate total points earned
    const maxPoints = modules.reduce((sum, m) => sum + (m.points || 0), 0)
    const pointsPercentage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <Link href="/trainer/dashboard" className="inline-flex items-center text-slate-500 hover:text-blue-600 mb-4 transition-colors">
                        <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                        Kembali ke Portal
                    </Link>
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
                            <BookOpen className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">HIMPUN</h1>
                            <p className="text-slate-600 mt-1 text-lg">
                                Selesaikan program pembelajaran untuk raih Sertifikasi gratis
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <div className="lg:w-80 flex-shrink-0 space-y-6">
                        {/* Progress Widget */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-6">Progress Pembelajaran</h3>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="font-medium text-slate-700">Modul Pembelajaran</span>
                                        <span className="text-slate-500">{progressPercentage}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                            style={{ width: `${progressPercentage}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">{completedModules} dari {totalModules} modul selesai</p>
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="font-medium text-slate-700">Poin Pembelajaran</span>
                                        <span className="text-slate-500">{pointsPercentage}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-orange-500 rounded-full transition-all duration-500"
                                            style={{ width: `${pointsPercentage}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">{totalPoints} dari {maxPoints} poin diraih</p>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    {totalModules - completedModules} modul tersisa
                                </div>
                            </div>
                        </div>

                        {/* Target Widget */}
                        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-5 h-5 text-blue-600" />
                                <h3 className="font-bold text-slate-900">Target Anda</h3>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Selesaikan semua modul untuk unlock kesempatan mendapatkan Sertifikasi secara gratis!
                            </p>
                        </div>
                    </div>

                    {/* Main Grid */}
                    <div className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {modules.map((module) => (
                                <div key={module.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col h-full">
                                    {/* Card Image */}
                                    <div className="aspect-video bg-slate-100 relative overflow-hidden">
                                        {module.image_url ? (
                                            <img
                                                src={module.image_url}
                                                alt={module.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                                                <BookOpen className="w-12 h-12 text-slate-300" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 right-4 flex gap-2">
                                            <div className="bg-black/50 backdrop-blur-md text-white text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {module.duration_minutes}m
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-6 flex flex-col flex-1">
                                        <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                            {module.title}
                                        </h3>

                                        <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                                            <span className="flex items-center gap-1 text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded-lg">
                                                <Award className="w-4 h-4" />
                                                {module.points} Poin
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {module.duration_minutes} JP
                                            </span>
                                        </div>

                                        <p className="text-slate-600 text-sm mb-6 line-clamp-3 flex-1">
                                            {module.description}
                                        </p>

                                        {/* Action Area */}
                                        <div className="mt-auto pt-6 border-t border-slate-100">
                                            {progress[module.id]?.status === 'completed' ? (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-xl">
                                                        <CheckCircle className="w-5 h-5" />
                                                        <span className="font-medium text-sm">Modul Selesai</span>
                                                    </div>
                                                    <Link
                                                        href={`/trainer/hebat/himpun/${module.id}`}
                                                        className="block w-full py-3 px-4 bg-white border-2 border-slate-200 text-slate-700 font-medium rounded-xl hover:border-blue-600 hover:text-blue-600 transition-all text-center"
                                                    >
                                                        Lihat Materi
                                                    </Link>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {/* Sub-module preview (optional, simplified) */}
                                                    <div className="space-y-2 mb-4">
                                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                                                            <span>Akses pembelajaran mandiri</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                                                            <span>Selesaikan quiz & tugas</span>
                                                        </div>
                                                    </div>

                                                    <Link
                                                        href={`/trainer/hebat/himpun/${module.id}`}
                                                        className="block w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all text-center"
                                                    >
                                                        Mulai Pembelajaran
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
