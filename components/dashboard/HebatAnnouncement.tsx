'use client'

import { useState, useEffect } from 'react'
import { X, Trophy, Sparkles, ArrowRight, Rocket } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function HebatAnnouncement() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Check if already dismissed in this session
        const dismissed = sessionStorage.getItem('hebat_announcement_dismissed')
        if (!dismissed) {
            // Small delay for better UX
            const timer = setTimeout(() => setIsVisible(true), 1000)
            return () => clearTimeout(timer)
        }
    }, [])

    const handleDismiss = () => {
        setIsVisible(false)
        sessionStorage.setItem('hebat_announcement_dismissed', 'true')
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleDismiss}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="pointer-events-auto max-w-sm w-full md:max-w-md relative overflow-hidden bg-white rounded-2xl shadow-2xl border border-white/20">
                            {/* Background Decoration */}
                            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-20 blur-xl"></div>
                            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-gradient-to-tr from-blue-400 to-purple-500 rounded-full opacity-20 blur-xl"></div>

                            {/* Content */}
                            <div className="relative p-6">
                                <button
                                    onClick={handleDismiss}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl flex items-center justify-center shadow-inner">
                                            <Trophy className="w-7 h-7 text-yellow-600" />
                                        </div>
                                    </div>
                                    <div className="flex-1 pr-6">
                                        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">
                                            Program HEBAT Menanti!
                                        </h3>
                                        <p className="text-xs font-medium text-indigo-600 mb-2">
                                            (Himpun • Eksplorasi • Berbagi • Aktualisasi • Tuntas)
                                        </p>
                                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                                            Segera selesaikan materi belajar dan jadilah Trainer untuk bergabung.
                                        </p>

                                        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-3 border border-indigo-100 mb-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Grand Prize</span>
                                            </div>
                                            <p className="text-sm font-semibold text-indigo-900">
                                                Tiket Belajar AI di Google APAC Singapura 🇸🇬
                                            </p>
                                            <p className="text-xs text-indigo-600 mt-0.5">
                                                Untuk Top 3 Trainers Terbaik
                                            </p>
                                        </div>

                                        <button
                                            onClick={handleDismiss}
                                            className="w-full group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-blue-200 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                                        >
                                            <Rocket className="w-4 h-4" />
                                            Siap Berkompetisi!
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
