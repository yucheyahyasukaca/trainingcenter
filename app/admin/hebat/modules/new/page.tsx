'use client'

import { ModuleForm } from '@/components/admin/hebat/ModuleForm'

import { useSearchParams } from 'next/navigation'

export default function NewModulePage() {
    const searchParams = useSearchParams()
    const parentId = searchParams.get('parent_id')

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Buat Modul Baru</h1>
                <p className="text-gray-600">Tambahkan modul pembelajaran baru untuk fitur HIMPUN</p>
            </div>

            <ModuleForm parentId={parentId} />
        </div>
    )
}
