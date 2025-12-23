'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
    Trophy,
    Medal,
    Crown,
    User,
    ArrowUp,
    Star,
    Sparkles,
    TrendingUp,
    ChevronLeft
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LeaderboardPage() {
    const [leaders, setLeaders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [period, setPeriod] = useState<'week' | 'month' | 'all_time'>('week')
    const router = useRouter()

    const periodConfig = {
        week: {
            label: 'Minggu Ini',
            sublabel: 'Berakhir dalam 2 hari',
            title: 'Top Trainer Heroes',
            desc: 'Kumpulkan poin HEBAT minggu ini dan jadilah inspirasi bagi trainer lainnya!'
        },
        month: {
            label: 'Bulan Ini',
            sublabel: 'Periode Bulan Ini',
            title: 'Monthly Champions',
            desc: 'Para trainer terbaik bulan ini yang konsisten berbagi!'
        },
        all_time: {
            label: 'Sepanjang Masa',
            sublabel: 'Hall of Fame',
            title: 'Legendary Trainers',
            desc: 'Trainer legendaris dengan kontribusi terbesar sepanjang masa!'
        }
    }

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setLoading(true)

                // Get current user
                const { data: { user } } = await supabase.auth.getUser()

                // Helper to fetch data
                const getData = async (p: 'week' | 'month' | 'all_time') => {
                    const { data, error } = await supabase
                        .rpc('get_leaderboard', {
                            period_type: p,
                            limit_count: 20
                        })
                    if (error) throw error
                    return data || []
                }

                // Waterfall fallback logic
                // 1. Try Week
                let data = await getData('week')
                let activePeriod: 'week' | 'month' | 'all_time' = 'week'

                // 2. If empty, try Month
                if (data.length === 0) {
                    console.log('Weekly empty, trying monthly...')
                    data = await getData('month')
                    activePeriod = 'month'
                }

                // 3. If empty, try All Time
                if (data.length === 0) {
                    console.log('Monthly empty, trying all-time...')
                    data = await getData('all_time')
                    activePeriod = 'all_time'
                }

                setLeaders(data)
                setPeriod(activePeriod)

                // Find current user stats if they are in the list
                if (user && data.length > 0) {
                    const userRank = data.find((l: any) => l.trainer_id === user.id)
                    setCurrentUser(userRank)
                }
            } catch (error) {
                console.error('Error fetching leaderboard:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchLeaderboard()
    }, [])

    const topThree = leaders.slice(0, 3)
    const restLeaders = leaders.slice(3)
    const config = periodConfig[period]

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header / Hero Section */}
            <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600 text-white relative overflow-hidden">
                {/* Abstract Shapes */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-400/20 rounded-full blur-3xl -ml-10 -mb-10"></div>

                <div className="max-w-3xl mx-auto px-4 pt-8 pb-32 relative z-10">
                    <div className="flex items-center space-x-3 mb-6">
                        <Link href="/dashboard" className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm">
                            <ChevronLeft className="w-5 h-5 text-white" />
                        </Link>
                        <span className="text-indigo-100 font-medium tracking-wide text-sm uppercase">Weekly Challenge</span>
                    </div>

                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center space-x-2 bg-indigo-500/30 backdrop-blur-md px-4 py-1.5 rounded-full border border-indigo-400/30 mb-4">
                            <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                            <span className="text-sm font-medium text-indigo-50">{config.label} • {config.sublabel}</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-white mb-2 drop-shadow-sm">
                            {config.title}
                        </h1>
                        <p className="text-indigo-100/90 text-lg max-w-lg mx-auto leading-relaxed">
                            {config.desc}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 -mt-24 relative z-20 pb-24">
                {/* Top 3 Podium */}
                {loading ? (
                    <div className="flex items-end justify-center mb-16 h-64 space-x-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className={`bg-white/50 animate-pulse rounded-t-2xl w-full max-w-[140px] ${i === 2 ? 'h-full' : 'h-48'}`}></div>
                        ))}
                    </div>
                ) : leaders.length > 0 ? (
                    <div className="flex items-end justify-center space-x-4 mb-16 px-2 sm:space-x-8">
                        {/* 2nd Place */}
                        <div className="flex-1 max-w-[140px] flex flex-col items-center justify-end">
                            {topThree[1] ? (
                                <>
                                    <div className="relative mb-3">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-slate-300 shadow-xl overflow-hidden relative z-10 bg-white">
                                            <img src={topThree[1].avatar_url || `https://ui-avatars.com/api/?name=${topThree[1].name}&background=random`} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-slate-500 text-white text-xs font-bold px-2 py-0.5 rounded-full z-20 shadow-md border-2 border-white">
                                            #2
                                        </div>
                                    </div>
                                    <div className="bg-white/95 backdrop-blur-sm rounded-t-2xl p-4 w-full text-center shadow-lg border-t-4 border-slate-300 min-h-[160px] flex flex-col justify-start pt-6 transform transition-transform hover:-translate-y-1">
                                        <p className="font-bold text-gray-900 line-clamp-2 text-sm leading-tight mb-1">{topThree[1].name}</p>
                                        <p className="text-xs text-indigo-600 font-semibold mb-2">{topThree[1].total_points} Poin</p>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-[160px] bg-white/20 rounded-t-2xl border-t-4 border-white/30 flex items-center justify-center">
                                    <span className="text-white/50 text-xs">Kosong</span>
                                </div>
                            )}
                        </div>

                        {/* 1st Place */}
                        <div className="flex-1 max-w-[160px] flex flex-col items-center z-20 -mb-4">
                            {topThree[0] ? (
                                <>
                                    <div className="relative mb-4">
                                        <Crown className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-10 h-10 text-yellow-300 drop-shadow-lg animate-bounce" />
                                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.4)] overflow-hidden relative z-10 bg-white ring-4 ring-yellow-400/30">
                                            <img src={topThree[0].avatar_url || `https://ui-avatars.com/api/?name=${topThree[0].name}&background=random`} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold px-4 py-1 rounded-full z-20 shadow-lg border-2 border-white">
                                            #1
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-b from-white to-yellow-50 backdrop-blur-sm rounded-t-3xl p-4 w-full text-center shadow-xl border-t-8 border-yellow-400 min-h-[220px] flex flex-col justify-start pt-10 transform scale-105 transition-transform hover:scale-110">
                                        <p className="font-black text-gray-900 text-lg line-clamp-2 leading-tight mb-1">{topThree[0].name}</p>
                                        <div className="inline-block bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold mb-3 shadow-sm border border-yellow-200">
                                            {topThree[0].total_points} Poin
                                        </div>
                                        <span className="text-xs text-yellow-600/60 uppercase tracking-widest font-extrabold">Champion</span>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-[220px] bg-white/20 rounded-t-3xl border-t-8 border-white/30 flex items-center justify-center">
                                    <span className="text-white/50 text-xs">Kosong</span>
                                </div>
                            )}
                        </div>

                        {/* 3rd Place */}
                        <div className="flex-1 max-w-[140px] flex flex-col items-center justify-end">
                            {topThree[2] ? (
                                <>
                                    <div className="relative mb-3">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-amber-600 shadow-xl overflow-hidden relative z-10 bg-white">
                                            <img src={topThree[2].avatar_url || `https://ui-avatars.com/api/?name=${topThree[2].name}&background=random`} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-amber-700 text-white text-xs font-bold px-2 py-0.5 rounded-full z-20 shadow-md border-2 border-white">
                                            #3
                                        </div>
                                    </div>
                                    <div className="bg-white/95 backdrop-blur-sm rounded-t-2xl p-4 w-full text-center shadow-lg border-t-4 border-amber-600 min-h-[140px] flex flex-col justify-start pt-6 transform transition-transform hover:-translate-y-1">
                                        <p className="font-bold text-gray-900 line-clamp-2 text-sm leading-tight mb-1">{topThree[2].name}</p>
                                        <p className="text-xs text-indigo-600 font-semibold mb-2">{topThree[2].total_points} Poin</p>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-[140px] bg-white/20 rounded-t-2xl border-t-4 border-white/30 flex items-center justify-center">
                                    <span className="text-white/50 text-xs">Kosong</span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-2xl shadow-sm mb-8">
                        <p className="text-gray-500">Belum ada data untuk periode {config.label.toLowerCase()}. Jadilah yang pertama!</p>
                    </div>
                )}

                {/* Rest of the List */}
                <div className="space-y-3">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-16 bg-white rounded-xl animate-pulse"></div>
                        ))
                    ) : restLeaders.length > 0 ? (
                        restLeaders.map((leader, index) => (
                            <div key={leader.trainer_id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
                                <div className="flex-shrink-0 w-8 text-center">
                                    <span className="text-gray-500 font-bold">#{index + 4}</span>
                                </div>
                                <div className="flex-shrink-0">
                                    <img
                                        src={leader.avatar_url || `https://ui-avatars.com/api/?name=${leader.name}`}
                                        alt=""
                                        className="w-10 h-10 rounded-full bg-gray-100 object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 truncate">{leader.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{leader.specialization || 'Trainer'}</p>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                    <div className="flex items-center space-x-1 bg-indigo-50 px-2 py-1 rounded-lg">
                                        <Star className="w-3 h-3 text-indigo-500 fill-indigo-500" />
                                        <span className="font-bold text-indigo-700 text-sm">{leader.total_points}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : null}
                </div>
            </div>

            {/* Sticky Current User Stats */}
            {currentUser && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-50">
                    <div className="max-w-3xl mx-auto flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                #{currentUser.rank}
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase">Peringkat Anda</p>
                                <p className="font-bold text-gray-900">Selamat! Masuk Top {currentUser.rank <= 10 ? '10' : '50'}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="text-right">
                                <span className="block text-2xl font-black text-indigo-600">{currentUser.total_points}</span>
                                <span className="text-xs text-gray-500">Total Poin</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
