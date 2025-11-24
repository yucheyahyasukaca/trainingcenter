'use client'

import { useState } from 'react'
import { Code2, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { TEMPLATE_VARIABLES, type TemplateVariableKey } from '@/lib/email-template-utils'

interface TemplateVariableHelperProps {
    onInsertVariable: (variable: string) => void
}

export function TemplateVariableHelper({ onInsertVariable }: TemplateVariableHelperProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    const handleInsert = (key: string) => {
        onInsertVariable(`{{${key}}}`)
    }

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-100 transition-colors"
            >
                <div className="flex items-center space-x-2">
                    <Code2 className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                        Variable Template Tersedia
                    </span>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-blue-600" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-blue-600" />
                )}
            </button>

            {isExpanded && (
                <div className="px-4 py-3 border-t border-blue-200 bg-white">
                    <div className="flex items-start space-x-2 mb-3 text-xs text-gray-600">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <p>
                            Klik pada variable di bawah untuk menyisipkannya ke dalam template.
                            Variable akan otomatis diganti dengan data user saat email dikirim.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries(TEMPLATE_VARIABLES).map(([key, description]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => handleInsert(key)}
                                className="text-left px-3 py-2 bg-gray-50 hover:bg-blue-100 border border-gray-200 hover:border-blue-300 rounded-lg transition-colors group"
                            >
                                <div className="flex items-center justify-between">
                                    <code className="text-xs font-mono text-blue-600 group-hover:text-blue-700">
                                        {`{{${key}}}`}
                                    </code>
                                    <span className="text-xs text-gray-400 group-hover:text-blue-500">
                                        klik untuk insert
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">{description}</p>
                            </button>
                        ))}
                    </div>

                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-800">
                            <strong>Contoh penggunaan:</strong><br />
                            <code className="text-xs bg-white px-1 py-0.5 rounded">
                                Halo {`{{nama}}`}, terima kasih telah mendaftar di program {`{{program}}`}!
                            </code>
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
