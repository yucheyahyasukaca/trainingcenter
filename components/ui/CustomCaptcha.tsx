'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react'

interface CustomCaptchaProps {
    onVerify: (isValid: boolean) => void
}

export default function CustomCaptcha({ onVerify }: CustomCaptchaProps) {
    const [num1, setNum1] = useState(0)
    const [num2, setNum2] = useState(0)
    const [userAnswer, setUserAnswer] = useState('')
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

    const generateChallenge = () => {
        const n1 = Math.floor(Math.random() * 10) + 1
        const n2 = Math.floor(Math.random() * 10) + 1
        setNum1(n1)
        setNum2(n2)
        setUserAnswer('')
        setIsCorrect(null)
        onVerify(false)
    }

    useEffect(() => {
        generateChallenge()
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        // Allow only numbers
        if (val && !/^\d+$/.test(val)) return

        setUserAnswer(val)

        if (val === '') {
            setIsCorrect(null)
            onVerify(false)
            return
        }

        const sum = num1 + num2
        const parsedVal = parseInt(val, 10)

        if (parsedVal === sum) {
            setIsCorrect(true)
            onVerify(true)
        } else {
            setIsCorrect(false)
            onVerify(false)
        }
    }

    return (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex flex-col space-y-3">
                <label className="text-sm font-medium text-gray-700">
                    Verifikasi Keamanan <span className="text-red-500">*</span>
                </label>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white px-4 py-2 rounded-md border border-gray-300 shadow-sm min-w-[100px] justify-center font-mono text-lg font-bold text-gray-700 select-none">
                        {num1} + {num2} = ?
                    </div>

                    <button
                        type="button"
                        onClick={generateChallenge}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-full transition-colors"
                        title="Refresh Captcha"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        value={userAnswer}
                        onChange={handleChange}
                        placeholder="Hasil penjumlahan"
                        className={`w-full pl-4 pr-10 py-2 border rounded-md focus:ring-2 focus:outline-none transition-all ${isCorrect === true
                                ? 'border-green-500 focus:ring-green-200 bg-green-50'
                                : isCorrect === false && userAnswer !== ''
                                    ? 'border-red-500 focus:ring-red-200 bg-red-50'
                                    : 'border-gray-300 focus:ring-primary-200 focus:border-primary-500'
                            }`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        {isCorrect === true && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                        {isCorrect === false && userAnswer !== '' && (
                            <XCircle className="w-5 h-5 text-red-600" />
                        )}
                    </div>
                </div>

                {isCorrect === false && userAnswer !== '' && (
                    <p className="text-xs text-red-600">Jawaban salah, silakan coba lagi.</p>
                )}
            </div>
        </div>
    )
}
