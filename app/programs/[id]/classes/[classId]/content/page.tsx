'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { ContentManagement } from '@/components/programs/ContentManagement'

export default function ClassContentManagementPage({ 
  params 
}: { 
  params: { id: string; classId: string } 
}) {
  const router = useRouter()
  const { profile } = useAuth()
  const [classData, setClassData] = useState<any>(null)
  const [programData, setProgramData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    checkAccessAndFetchData()
  }, [params.id, params.classId, profile])

  async function checkAccessAndFetchData() {
    if (!profile) {
      router.push('/login')
      return
    }

    try {
      // Fetch class data
      const { data: classInfo, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('id', params.classId)
        .single()

      if (classError) throw classError

      // Fetch program data
      const { data: programInfo, error: programError } = await supabase
        .from('programs')
        .select('*')
        .eq('id', params.id)
        .single()

      if (programError) throw programError

      setClassData(classInfo)
      setProgramData(programInfo)

      // Check access: Admin or trainer assigned to this class
      let access = false

      if (profile.role === 'admin') {
        access = true
      } else if (profile.role === 'trainer') {
        // Check if trainer is assigned to this program or class
        const { data: trainerData } = await supabase
          .from('trainers')
          .select('id')
          .eq('user_id', profile.id)
          .single()

        if (trainerData) {
          // Check if program trainer matches
          if (programInfo.trainer_id === trainerData.id) {
            access = true
          } else {
            // Check if assigned to this class
            const { data: classTrainer } = await supabase
              .from('class_trainers')
              .select('id')
              .eq('class_id', params.classId)
              .eq('trainer_id', trainerData.id)
              .single()

            if (classTrainer) {
              access = true
            }
          }
        }
      }

      setHasAccess(access)

      if (!access) {
        alert('Anda tidak memiliki akses ke halaman ini')
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error checking access:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-700">Anda tidak memiliki akses ke halaman ini</p>
          <Link href="/dashboard" className="text-primary-600 hover:underline mt-4 inline-block">
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/dashboard" className="hover:text-primary-600">Dashboard</Link>
            <span>/</span>
            <Link href="/programs" className="hover:text-primary-600">Programs</Link>
            <span>/</span>
            <Link href={`/programs/${params.id}`} className="hover:text-primary-600">
              {programData?.title || 'Program'}
            </Link>
            <span>/</span>
            <Link href={`/programs/${params.id}/classes`} className="hover:text-primary-600">
              Classes
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Content Management</span>
          </nav>
        </div>

        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/programs/${params.id}/classes`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Daftar Kelas
          </Link>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {classData?.name || 'Class Content'}
                </h1>
                <p className="text-gray-600">
                  Program: {programData?.title}
                </p>
                {classData?.description && (
                  <p className="text-sm text-gray-500 mt-2">{classData.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Management Component */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <ContentManagement
            classId={params.classId}
            className={classData?.name || ''}
            programId={params.id}
          />
        </div>
      </div>
    </div>
  )
}

