'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
    Trophy,
    Medal,
    Crown,
    User
} from 'lucide-react'
import Link from 'next/link'

export function HebatLeaderboard() {
    const [leaders, setLeaders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setLoading(true)
                // Fetch top 10 trainers by total points
                const { data, error } = await supabase
                    .from('trainer_hebat_points')
                    .select(`
            total_points,
            trainers (
              name,
              avatar_url,
              specialization
            )
          `)
                    .order('total_points', { ascending: false })
                    .limit(10)

                if (error) {
                    console.error('Error fetching leaderboard:', error)
                    return
                }

                setLeaders(data || [])
            } catch (error) {
                console.error('Error:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchLeaderboard()
    }, [])

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0:
                return <Crown className="w-6 h-6 text-yellow-500" />
            case 1:
                return <Medal className="w-6 h-6 text-gray-400" />
            case 2:
                return <Medal className="w-6 h-6 text-amber-700" />
            default:
                return <span className="text-gray-500 font-bold w-6 text-center">{index + 1}</span>
        }
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center space-x-3">
                    <div className="bg-yellow-100 p-2 rounded-lg">
                        <Trophy className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Leaderboard HEBAT</h3>
                        <p className="text-sm text-gray-600">Top Trainers Minggu Ini</p>
                    </div>
                </div>
            </div>

            <div className="divide-y divide-gray-100">
                {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="p-4 flex items-center space-x-4 animate-pulse">
                            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                            </div>
                            <div className="w-16 h-6 bg-gray-200 rounded"></div>
                        </div>
                    ))
                ) : leaders.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Belum ada data leaderboard.
                    </div>
                ) : (
                    leaders.map((leader, index) => (
                        <div key={index} className="p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors">
                            <div className="flex-shrink-0 w-8 flex justify-center">
                                {getRankIcon(index)}
                            </div>

                            <div className="flex-shrink-0">
                                {leader.trainers?.avatar_url ? (
                                    <img
                                        src={leader.trainers.avatar_url}
                                        alt={leader.trainers.name}
                                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                        <User className="w-5 h-5" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">
                                    {leader.trainers?.name || 'Unknown Trainer'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {leader.trainers?.specialization || 'Trainer'}
                                </p>
                            </div>

                            <div className="flex-shrink-0 text-right">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {leader.total_points} Poin
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
                <Link href="/trainer/leaderboard" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    Lihat Semua Peringkat
                </Link>
            </div>
        </div>
    )
}
