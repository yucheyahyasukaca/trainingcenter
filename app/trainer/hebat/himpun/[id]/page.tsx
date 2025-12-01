'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    Clock,
    Award,
    CheckCircle,
    PlayCircle,
    Video,
    FileText,
    HelpCircle,
    File,
    Upload,
    Download,
    ExternalLink,
    ChevronRight,
    ChevronLeft,
    Menu,
    X
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
    created_at: string
}

export default function ModuleDetailPage({ params }: { params: { id: string } }) {
    const { profile } = useAuth()
    const router = useRouter()
    const addToast = useToast()

    const [currentModule, setCurrentModule] = useState<Module | null>(null)
    const [relatedModules, setRelatedModules] = useState<Module[]>([])
    const [loading, setLoading] = useState(true)
    const [completing, setCompleting] = useState(false)
    const [progressMap, setProgressMap] = useState<Record<string, 'not_started' | 'started' | 'completed'>>({})
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const [trainerId, setTrainerId] = useState<string | null>(null)

    useEffect(() => {
        if (profile) {
            fetchTrainerId()
        }
    }, [profile])

    useEffect(() => {
        if (trainerId) {
            fetchData()
        }
    }, [trainerId, params.id])

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
            }
        } catch (error) {
            console.error('Error fetching trainer ID:', error)
            addToast.error('Gagal memuat data trainer')
        }
    }

    const fetchData = async () => {
        if (!trainerId) return

        try {
            setLoading(true)
            // 1. Fetch current module to get details and potential parent_id
            const { data: moduleData, error: moduleError } = await supabase
                .from('hebat_modules')
                .select('*')
                .eq('id', params.id)
                .single()

            if (moduleError) throw moduleError
            setCurrentModule(moduleData)

            // 2. Determine Root ID
            const rootId = moduleData.parent_id || moduleData.id

            // 3. Fetch all related modules (Root + Subs)
            console.log('🔍 Debug: Fetching related modules for Root ID:', rootId)
            const { data: allModules, error: allError } = await supabase
                .from('hebat_modules')
                .select('*')
                .or(`id.eq.${rootId},parent_id.eq.${rootId}`)
                .order('order_index', { ascending: true })
                .order('created_at', { ascending: true })

            if (allError) {
                console.error('❌ Error fetching related modules:', allError)
                throw allError
            }

            console.log('✅ Debug: Raw modules fetched:', allModules?.length, allModules)

            // Check publication status
            const unpublished = (allModules as Module[])?.filter(m => !m.is_published)
            if (unpublished && unpublished.length > 0) {
                console.warn('⚠️ Warning: Some modules are not published and might be hidden by RLS if you are not admin:', unpublished)
            }

            // Sort: Main module first, then subs
            const sortedModules = ((allModules as Module[]) || []).sort((a, b) => {
                if (a.material_type === 'main') return -1
                if (b.material_type === 'main') return 1
                return (a.order_index - b.order_index) || (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            })
            setRelatedModules(sortedModules)

            // 4. Fetch progress for all related modules
            const moduleIds = sortedModules.map(m => m.id)
            const { data: progressData } = await supabase
                .from('trainer_module_progress')
                .select('module_id, status')
                .eq('trainer_id', trainerId)
                .in('module_id', moduleIds)

            const newProgressMap: Record<string, any> = {}
            progressData?.forEach((p: any) => {
                newProgressMap[p.module_id] = p.status
            })
            setProgressMap(newProgressMap)

            // 5. Start current module if not started
            if (!newProgressMap[params.id]) {
                await startModule(params.id)
            }

        } catch (error) {
            console.error('Error fetching data:', error)
            addToast.error('Gagal memuat modul')
        } finally {
            setLoading(false)
        }
    }

    const startModule = async (moduleId: string) => {
        if (!trainerId) return
        try {
            await supabase
                .from('trainer_module_progress')
                .insert([{
                    trainer_id: trainerId,
                    module_id: moduleId,
                    status: 'started',
                    started_at: new Date().toISOString()
                }] as any)
            setProgressMap(prev => ({ ...prev, [moduleId]: 'started' }))
        } catch (error) {
            console.error('Error starting module:', error)
        }
    }

    const handleComplete = async () => {
        if (!trainerId || !currentModule) return

        try {
            setCompleting(true)

            // Update progress
            const { error: progressError } = await supabase
                .from('trainer_module_progress')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString()
                } as any)
                .eq('trainer_id', trainerId)
                .eq('module_id', params.id)

            if (progressError) throw progressError

            // Award points by logging activity
            // This triggers the database function to update total points
            const { error: activityError } = await supabase
                .from('trainer_hebat_activities')
                .insert([{
                    trainer_id: trainerId,
                    category: 'H', // HIMPUN
                    activity_type: 'module_completion',
                    description: `Menyelesaikan modul: ${currentModule.title}`,
                    points: currentModule.points,
                    metadata: { module_id: params.id }
                }] as any)

            if (activityError) {
                console.error('Error awarding points:', activityError)
                // Don't throw here, as progress is already saved. Just warn.
                addToast.warning('Modul selesai, namun gagal mencatat poin. Hubungi admin.')
            } else {
                addToast.success(`Selamat! Anda mendapatkan ${currentModule.points} Poin HEBAT`)
            }

            setProgressMap(prev => ({ ...prev, [params.id]: 'completed' }))

            // Auto-navigate to next module if available
            const currentIndex = relatedModules.findIndex(m => m.id === params.id)
            if (currentIndex < relatedModules.length - 1) {
                const nextModule = relatedModules[currentIndex + 1]
                setTimeout(() => {
                    router.push(`/trainer/hebat/himpun/${nextModule.id}`)
                }, 1500)
            } else {
                // Back to list
                setTimeout(() => {
                    router.push('/trainer/hebat/himpun')
                }, 1500)
            }

        } catch (error) {
            console.error('Error completing module:', error)
            addToast.error('Gagal menyelesaikan modul')
        } finally {
            setCompleting(false)
        }
    }

    const renderContent = () => {
        if (!currentModule) return null

        switch (currentModule.content_type) {
            case 'video':
                return (
                    <div className="space-y-6">
                        <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
                            {currentModule.content_data?.video_url ? (
                                <iframe
                                    src={currentModule.content_data.video_url.replace('watch?v=', 'embed/')}
                                    className="w-full h-full"
                                    allowFullScreen
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-white">
                                    <p>Video URL tidak valid</p>
                                </div>
                            )}
                        </div>
                        {currentModule.content_data?.transcript && (
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <h3 className="font-bold text-slate-900 mb-3">Transkrip Video</h3>
                                <p className="text-slate-700 whitespace-pre-wrap">{currentModule.content_data.transcript}</p>
                            </div>
                        )}
                    </div>
                )

            case 'document':
                return (
                    <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 text-center">
                        <File className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Dokumen Materi</h3>
                        <p className="text-slate-600 mb-6">
                            Silakan unduh atau baca dokumen materi berikut ini.
                        </p>
                        {currentModule.content_data?.document_url && (
                            <a
                                href={currentModule.content_data.document_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Download className="w-5 h-5 mr-2" />
                                Buka Dokumen
                            </a>
                        )}
                    </div>
                )

            case 'quiz':
                return (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <HelpCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Pertanyaan Quiz</h3>
                                <p className="text-slate-700 text-lg mb-6">{currentModule.content_data?.question}</p>
                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                    <p className="text-sm text-yellow-800">
                                        Silakan jawab pertanyaan ini dalam hati atau catat jawaban Anda sebagai bagian dari refleksi pembelajaran.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )

            case 'assignment':
                return (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <Upload className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Tugas</h3>
                                <div className="prose prose-slate max-w-none mb-6">
                                    <p className="whitespace-pre-wrap">{currentModule.content_data?.instructions}</p>
                                </div>
                                {currentModule.content_data?.due_date && (
                                    <p className="text-sm text-slate-500 mb-4">
                                        Batas Waktu: {new Date(currentModule.content_data.due_date).toLocaleDateString('id-ID')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )

            default: // text
                return (
                    <div
                        className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-a:text-blue-600"
                        dangerouslySetInnerHTML={{ __html: currentModule.content_data?.body || '' }}
                    />
                )
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!currentModule) return null

    const currentIndex = relatedModules.findIndex(m => m.id === params.id)
    const prevModule = currentIndex > 0 ? relatedModules[currentIndex - 1] : null
    const nextModule = currentIndex < relatedModules.length - 1 ? relatedModules[currentIndex + 1] : null
    const isCompleted = progressMap[params.id] === 'completed'

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Mobile Sidebar Toggle */}
            <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-20">
                <span className="font-bold text-slate-800 truncate max-w-[200px]">{currentModule.title}</span>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                    {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Sidebar Navigation */}
            <div className={`
                fixed inset-y-0 left-0 z-30 w-80 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen md:sticky md:top-0 overflow-y-auto
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6">
                    <Link
                        href="/trainer/hebat/himpun"
                        className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors mb-8"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali ke Daftar
                    </Link>

                    <h3 className="font-bold text-slate-900 mb-4 px-2">Daftar Materi</h3>
                    <div className="space-y-2">
                        {relatedModules.map((module, index) => {
                            const isActive = module.id === params.id
                            const status = progressMap[module.id]

                            return (
                                <Link
                                    key={module.id}
                                    href={`/trainer/hebat/himpun/${module.id}`}
                                    className={`
                                        flex items-start gap-3 p-3 rounded-xl transition-all
                                        ${isActive
                                            ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                                            : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                                        }
                                    `}
                                >
                                    <div className={`
                                        mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                                        ${status === 'completed'
                                            ? 'bg-green-100 text-green-600'
                                            : isActive
                                                ? 'bg-blue-100 text-blue-600'
                                                : 'bg-slate-100 text-slate-400'
                                        }
                                    `}>
                                        {status === 'completed' ? (
                                            <CheckCircle className="w-3.5 h-3.5" />
                                        ) : (
                                            <span className="text-xs font-medium">{index + 1}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>
                                            {module.title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-slate-500 flex items-center">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {module.duration_minutes}m
                                            </span>
                                            {module.material_type === 'main' && (
                                                <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                                                    Utama
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Module Info */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-slate-900 mb-4">{currentModule.title}</h1>
                        <div className="flex items-center gap-6 text-sm text-slate-500 mb-6">
                            <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {currentModule.duration_minutes} menit
                            </span>
                            <span className="flex items-center gap-2">
                                <Award className="w-4 h-4" />
                                {currentModule.points} Poin
                            </span>
                            <span className="flex items-center gap-2 capitalize">
                                {currentModule.content_type === 'video' && <Video className="w-4 h-4" />}
                                {currentModule.content_type === 'text' && <FileText className="w-4 h-4" />}
                                {currentModule.content_type === 'quiz' && <HelpCircle className="w-4 h-4" />}
                                {currentModule.content_type === 'document' && <File className="w-4 h-4" />}
                                {currentModule.content_type === 'assignment' && <Upload className="w-4 h-4" />}
                                {currentModule.content_type}
                            </span>
                        </div>
                        <p className="text-slate-600 text-lg leading-relaxed">{currentModule.description}</p>
                    </div>

                    {/* Content Area */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 mb-8">
                        {renderContent()}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                        {prevModule ? (
                            <Link
                                href={`/trainer/hebat/himpun/${prevModule.id}`}
                                className="inline-flex items-center px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5 mr-2" />
                                <div className="text-left">
                                    <div className="text-xs text-slate-500">Sebelumnya</div>
                                    <div className="font-medium truncate max-w-[150px]">{prevModule.title}</div>
                                </div>
                            </Link>
                        ) : (
                            <div></div> // Spacer
                        )}

                        {isCompleted ? (
                            nextModule ? (
                                <Link
                                    href={`/trainer/hebat/himpun/${nextModule.id}`}
                                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                                >
                                    <div className="text-right">
                                        <div className="text-xs text-blue-100">Selanjutnya</div>
                                        <div className="font-medium truncate max-w-[150px]">{nextModule.title}</div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 ml-2" />
                                </Link>
                            ) : (
                                <Link
                                    href="/trainer/hebat/himpun"
                                    className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                                >
                                    Selesai
                                    <CheckCircle className="w-5 h-5 ml-2" />
                                </Link>
                            )
                        ) : (
                            <button
                                onClick={handleComplete}
                                disabled={completing}
                                className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:transform-none"
                            >
                                {completing ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                ) : (
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                )}
                                Selesaikan Modul
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Overlay for mobile sidebar */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    )
}
