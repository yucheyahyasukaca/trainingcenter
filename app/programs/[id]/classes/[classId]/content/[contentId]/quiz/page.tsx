'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { QuizManagement } from '@/components/programs/QuizManagement'

export default function QuizManagementPage({ 
  params 
}: { 
  params: { id: string; classId: string; contentId: string } 
}) {
  const router = useRouter()
  const { profile } = useAuth()
  const [content, setContent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    checkAccessAndFetchData()
  }, [params, profile])

  async function checkAccessAndFetchData() {
    if (!profile) {
      router.push('/login')
      return
    }

    try {
      // Fetch content data
      const { data: contentData, error: contentError } = await supabase
        .from('learning_contents')
        .select('*, classes!inner(*)')
        .eq('id', params.contentId)
        .single()

      if (contentError) throw contentError
      setContent(contentData)

      // Check access: Admin or trainer
      let access = false

      if (profile.role === 'admin') {
        access = true
      } else if (profile.role === 'trainer') {
        // Get trainer data
        const { data: trainerData } = await supabase
          .from('trainers')
          .select('id')
          .eq('user_id', profile.id)
          .single()

        if (trainerData) {
          // Check if program trainer matches or if assigned to class
          const { data: programData } = await supabase
            .from('programs')
            .select('trainer_id')
            .eq('id', params.id)
            .single()

          if (programData?.trainer_id === trainerData.id) {
            access = true
          } else {
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
          <nav className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600">
            <Link href="/dashboard" className="hover:text-primary-600 whitespace-nowrap">Dashboard</Link>
            <span className="text-gray-400">/</span>
            <Link href="/programs" className="hover:text-primary-600 whitespace-nowrap">Programs</Link>
            <span className="text-gray-400">/</span>
            <Link href={`/programs/${params.id}`} className="hover:text-primary-600 whitespace-nowrap">Program</Link>
            <span className="text-gray-400">/</span>
            <Link href={`/programs/${params.id}/classes/${params.classId}/content`} className="hover:text-primary-600 whitespace-nowrap">
              Content
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium whitespace-nowrap">Quiz Management</span>
          </nav>
        </div>

        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/programs/${params.id}/classes/${params.classId}/content`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Content Management
          </Link>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <HelpCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Quiz Management
                </h1>
                <p className="text-gray-600">
                  {content?.title || 'Loading...'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Management Component */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <QuizManagement
            contentId={params.contentId}
            contentTitle={content?.title || ''}
          />
        </div>
      </div>
    </div>
  )
}

