'use client'

import { useState, useEffect } from 'react'
import { ModuleForm } from '@/components/admin/hebat/ModuleForm'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function EditModulePage({ params }: { params: { id: string } }) {
    const [moduleData, setModuleData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const fetchModule = async () => {
            try {
                const { data, error } = await supabase
                    .from('hebat_modules')
                    .select('*')
                    .eq('id', params.id)
                    .single()

                if (error) throw error
                setModuleData(data)
            } catch (error) {
                console.error('Error fetching module:', error)
                router.push('/admin/hebat/modules')
            } finally {
                setLoading(false)
            }
        }

        fetchModule()
    }, [params.id, router])

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Edit Modul</h1>
                <p className="text-gray-600">Perbarui konten modul pembelajaran</p>
            </div>

            <ModuleForm moduleId={params.id} initialData={moduleData} />
        </div>
    )
}
