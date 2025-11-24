'use client'

import { useState } from 'react'
import { MousePointerClick, ChevronDown, ChevronUp, Info } from 'lucide-react'

interface CTAButtonHelperProps {
    onInsertCTA: (html: string) => void
}

export function CTAButtonHelper({ onInsertCTA }: CTAButtonHelperProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [buttonText, setButtonText] = useState('Klik Di Sini')
    const [buttonUrl, setButtonUrl] = useState('https://example.com')
    const [buttonColor, setButtonColor] = useState('#3B82F6') // blue-500

    const handleInsert = () => {
        // Generate email-friendly button HTML
        // Use inline styles for email compatibility + class for editor preview
        const buttonHTML = `<p class="email-cta-container" style="margin: 20px 0; text-align: center;"><a href="${buttonUrl}" class="email-cta-button" style="display: inline-block; padding: 12px 24px; background-color: ${buttonColor}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; font-family: Arial, sans-serif; --button-color: ${buttonColor};">${buttonText}</a></p>`

        console.log('🔘 CTA Button HTML:', buttonHTML)
        console.log('🔘 Calling onInsertCTA...')
        onInsertCTA(buttonHTML)
        console.log('🔘 onInsertCTA called')
    }

    const presetButtons = [
        { text: 'Daftar Sekarang', url: 'https://example.com/register', color: '#10B981' },
        { text: 'Lihat Detail', url: 'https://example.com/details', color: '#3B82F6' },
        { text: 'Download', url: 'https://example.com/download', color: '#8B5CF6' },
        { text: 'Hubungi Kami', url: 'https://example.com/contact', color: '#F59E0B' },
    ]

    return (
        <div className="bg-green-50 border border-green-200 rounded-lg overflow-hidden">
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-green-100 transition-colors"
            >
                <div className="flex items-center space-x-2">
                    <MousePointerClick className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                        Tambah Tombol CTA (Call to Action)
                    </span>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-green-600" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-green-600" />
                )}
            </button>

            {isExpanded && (
                <div className="px-4 py-3 border-t border-green-200 bg-white space-y-4">
                    <div className="flex items-start space-x-2 text-xs text-gray-600">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <p>
                            Tambahkan tombol CTA yang menarik untuk meningkatkan engagement. 
                            Tombol akan otomatis ter-format dengan styling yang email-friendly.
                        </p>
                    </div>

                    {/* Custom Button Form */}
                    <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Teks Tombol
                            </label>
                            <input
                                type="text"
                                value={buttonText}
                                onChange={(e) => setButtonText(e.target.value)}
                                placeholder="Contoh: Daftar Sekarang"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                URL Tujuan
                            </label>
                            <input
                                type="url"
                                value={buttonUrl}
                                onChange={(e) => setButtonUrl(e.target.value)}
                                placeholder="https://example.com"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Warna Tombol
                            </label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="color"
                                    value={buttonColor}
                                    onChange={(e) => setButtonColor(e.target.value)}
                                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={buttonColor}
                                    onChange={(e) => setButtonColor(e.target.value)}
                                    placeholder="#3B82F6"
                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleInsert}
                            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                            Sisipkan Tombol CTA
                        </button>
                    </div>

                    {/* Preset Buttons */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                            Atau Pilih Template Cepat:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {presetButtons.map((preset, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => {
                                        setButtonText(preset.text)
                                        setButtonUrl(preset.url)
                                        setButtonColor(preset.color)
                                        handleInsert()
                                    }}
                                    className="text-left px-3 py-2 bg-white hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-lg transition-colors group"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-gray-900">
                                            {preset.text}
                                        </span>
                                        <div
                                            className="w-4 h-4 rounded"
                                            style={{ backgroundColor: preset.color }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 truncate">
                                        {preset.url}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-800">
                            <strong>Tips:</strong> Pastikan URL sudah lengkap dengan https://. 
                            Tombol akan otomatis ter-format dengan styling yang kompatibel dengan berbagai email client.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

