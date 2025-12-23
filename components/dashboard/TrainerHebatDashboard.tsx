'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import {
    BookOpen,
    Rocket,
    Share2,
    Mic,
    Award,
    Info,
    ChevronRight,
    Lock
} from 'lucide-react'
import Link from 'next/link'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'

export function TrainerHebatDashboard() {
    const { profile } = useAuth()
    const [points, setPoints] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [totalHimpunPoints, setTotalHimpunPoints] = useState(0)
    const [showInfoModal, setShowInfoModal] = useState(false)

    const isTrainer = (profile as any)?.role === 'trainer'

    useEffect(() => {
        const fetchPoints = async () => {
            if (!profile?.id) return

            try {
                setLoading(true)

                // 1. Get Trainer ID first
                const { data: trainerData, error: trainerError } = await supabase
                    .from('trainers')
                    .select('id')
                    .eq('user_id', profile.id)
                    .single()

                if (trainerError || !trainerData) {
                    // Start: Silent error for non-trainers or just no profile found
                    // console.error('Error fetching trainer profile:', trainerError)
                    // End: Silent error
                    setPoints({
                        h_points: 0,
                        e_points: 0,
                        b_points: 0,
                        a_points: 0,
                        t_points: 0,
                        total_points: 0
                    })
                    setLoading(false)
                    return
                }

                // 2. Fetch user points using Trainer ID
                const { data: pointsData, error: pointsError } = await supabase
                    .from('trainer_hebat_points')
                    .select('*')
                    .eq('trainer_id', (trainerData as any).id)
                    .single()

                if (pointsError && pointsError.code !== 'PGRST116') {
                    console.error('Error fetching HEBAT points:', pointsError)
                }

                if (pointsData) {
                    setPoints(pointsData)
                } else {
                    setPoints({
                        h_points: 0,
                        e_points: 0,
                        b_points: 0,
                        a_points: 0,
                        t_points: 0,
                        total_points: 0
                    })
                }

                // Fetch total available HIMPUN points
                const { data: modulesData, error: modulesError } = await supabase
                    .from('hebat_modules')
                    .select('points')
                    .eq('is_published', true)
                    .eq('category', 'HIMPUN')

                if (modulesData) {
                    const total = modulesData.reduce((sum, m: any) => sum + (m.points || 0), 0)
                    setTotalHimpunPoints(total)
                }

            } catch (error) {
                console.error('Error:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchPoints()
    }, [profile?.id])

    const handleNonTrainerClick = (e: any) => {
        e.preventDefault()
        setShowInfoModal(true)
    }

    const hebatCards = [
        {
            letter: 'H',
            title: 'Himpun',
            description: 'Himpun ilmu baru dengan menyelesaikan pelatihan dasar.',
            icon: BookOpen,
            color: 'blue',
            points: points?.h_points || 0,
            target: totalHimpunPoints || 100, // Use fetched total or fallback
            action: 'Mulai Belajar',
            href: '/trainer/hebat/himpun'
        },
        {
            letter: 'E',
            title: 'Eksplorasi',
            description: 'Eksplorasi penggunaan teknologi/AI dalam pembelajaran nyata.',
            icon: Rocket,
            color: 'purple',
            points: points?.e_points || 0,
            target: null, // No limit
            pointsLabel: '5 Poin / Submission',
            action: 'Mulai Eksplorasi',
            href: '/trainer/hebat/eksplorasi'
        },
        {
            letter: 'B',
            title: 'Berbagi',
            description: 'Berbagi kode referral/undangan kepada rekan sejawat.',
            icon: Share2,
            color: 'orange',
            points: points?.b_points || 0,
            target: 100,
            action: 'Mulai Berbagi',
            href: '/trainer/berbagi'
        },
        {
            letter: 'A',
            title: 'Aktualisasi',
            description: 'Tunjukkan karyamu dan ceritakan dampaknya kepada publik.',
            icon: Mic,
            color: 'pink',
            points: points?.a_points || 0,
            target: 100,
            action: 'Mulai Aktualisasi',
            href: '/trainer/present'
        },
        {
            letter: 'T',
            title: 'Terdepan',
            description: 'Menjadi guru terdepan dalam pelatihan-pelatihan internasional',
            icon: Award,
            color: 'gray', // Locked initially maybe?
            points: points?.t_points || 0,
            target: 100,
            action: 'Coming Soon',
            href: '#',
            locked: true
        }
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Perjalanan HEBAT Anda</h2>
                    <p className="text-gray-600">Kumpulkan poin dan jadilah Trainer HEBAT!</p>
                </div>
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-xl shadow-lg flex items-center space-x-2">
                    <Award className="w-5 h-5" />
                    <span className="font-bold text-lg">{points?.total_points || 0} Poin</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {hebatCards.map((card: any, index) => {
                    const Icon = card.icon
                    const isLocked = card.locked

                    // Effective lock state: either intrinsically locked OR user is not a trainer
                    const isEffectiveLocked = isLocked || !isTrainer

                    return (
                        <div
                            key={index}
                            className={`relative bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-xl transition-all duration-300 group ${isEffectiveLocked ? 'opacity-75 bg-gray-50' : ''}`}
                        >
                            {/* Letter Badge */}
                            <div className={`absolute -top-3 -right-3 w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform duration-300 ${card.color === 'blue' ? 'bg-blue-500' :
                                card.color === 'purple' ? 'bg-purple-500' :
                                    card.color === 'orange' ? 'bg-orange-500' :
                                        card.color === 'pink' ? 'bg-pink-500' :
                                            'bg-gray-400'
                                }`}>
                                {card.letter}
                            </div>

                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${card.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                                card.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                                    card.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                                        card.color === 'pink' ? 'bg-pink-100 text-pink-600' :
                                            'bg-gray-200 text-gray-500'
                                }`}>
                                <Icon className="w-6 h-6" />
                            </div>

                            {/* Content */}
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{card.title}</h3>
                            <p className="text-sm text-gray-600 mb-4 min-h-[60px]">{card.description}</p>

                            {/* Action Button */}
                            {isEffectiveLocked ? (
                                <button
                                    onClick={isLocked ? undefined : handleNonTrainerClick}
                                    disabled={isLocked} // Native disabled only if it's actually locked content-wise
                                    className={`w-full py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center cursor-pointer ${isLocked
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                                        }`}
                                >
                                    <Lock className="w-4 h-4 mr-2" />
                                    {card.action}
                                </button>
                            ) : (
                                <Link
                                    href={card.href}
                                    className={`w-full py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${card.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                                        card.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700 text-white' :
                                            card.color === 'orange' ? 'bg-orange-600 hover:bg-orange-700 text-white' :
                                                card.color === 'pink' ? 'bg-pink-600 hover:bg-pink-700 text-white' :
                                                    'bg-gray-600 hover:bg-gray-700 text-white'
                                        }`}
                                >
                                    {card.action}
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Link>
                            )}
                        </div>
                    )
                })}
            </div>

            <ConfirmationModal
                isOpen={showInfoModal}
                onClose={() => setShowInfoModal(false)}
                onConfirm={() => setShowInfoModal(false)}
                title="Akses Terbatas 🔒"
                message="Perjalanan HEBAT hanya untuk trainer. Kamu bisa menjadi trainer dengan cara menyelesaikan program pelatihan untuk mengikuti perjalanan hebat dan point bisa dihitung."
                confirmText="Mengerti"
                variant="info"
                cancelText="Tutup"
            />
        </div>
    )
}
