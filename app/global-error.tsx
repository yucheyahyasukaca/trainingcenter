'use client'

import { useEffect } from 'react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log exception to error reporting service
        console.error('Global Error:', error)
    }, [error])

    return (
        <html>
            <body>
                <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Terjadi Kesalahan Sistem
                        </h2>
                        <p className="text-gray-600 mb-8 max-w-md mx-auto">
                            Maaf, terjadi kesalahan yang tidak terduga. Sistem kami telah mencatat masalah ini.
                            Silakan coba muat ulang halaman atau reset sesi Anda.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => reset()}
                                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                Coba Lagi
                            </button>
                            <button
                                onClick={() => {
                                    // Hard reset
                                    localStorage.clear()
                                    sessionStorage.clear()
                                    document.cookie.split(";").forEach((c) => {
                                        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                                    });
                                    window.location.href = '/'
                                }}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Reset & Kembali ke Awal
                            </button>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    )
}
