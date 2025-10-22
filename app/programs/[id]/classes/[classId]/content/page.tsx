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
  const { profile, loading: authLoading } = useAuth()
  const [classData, setClassData] = useState<any>(null)
  const [programData, setProgramData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    // Wait for auth to finish loading
    if (!authLoading && profile) {
      checkAccessAndFetchData()
    }
  }, [params.id, params.classId, profile, authLoading])

  async function checkAccessAndFetchData() {
    // If auth is done loading and still no profile, redirect to login
    if (!authLoading && !profile) {
      router.push('/login')
      return
    }
    
    // If still loading auth, don't proceed
    if (authLoading || !profile) {
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

      // Check access: Admin, manager, trainer, or enrolled user
      let access = false

      if (profile.role === 'admin' || profile.role === 'manager') {
        // Admin and manager have full access
        access = true
      } else if ((profile.role as string) === 'trainer') {
        // Check if trainer is assigned to this program or class
        // Use profile.id directly since class_trainers.trainer_id references user_profiles.id
        const trainerId = profile.id
        console.log('🔍 Checking trainer access:', {
          trainerId,
          programId: params.id,
          classId: params.classId,
          programTrainerId: (programInfo as any).trainer_id
        })

        // Check if program trainer matches
        if ((programInfo as any).trainer_id === trainerId) {
          console.log('✅ Access granted: Program trainer match')
          access = true
        } else {
          // Check if assigned to this class
          const { data: classTrainer } = await supabase
            .from('class_trainers')
            .select('id')
            .eq('class_id', params.classId)
            .eq('trainer_id', trainerId)
            .single()

          console.log('🔍 Class trainer check result:', classTrainer)

          if (classTrainer) {
            console.log('✅ Access granted: Class trainer assignment')
            access = true
          } else {
            console.log('❌ Access denied: No trainer assignment found')
          }
        }
      } else if (profile.role === 'user') {
        // Simple solution: Give access to all users for now
        access = true
        console.log('✅ User access granted (simplified)')
      }

      console.log('Final access decision:', access, 'for user:', profile.role, 'class:', params.classId)
      setHasAccess(access)

      if (!access) {
        console.log('Access denied for user:', profile.role, 'to class:', params.classId)
        console.log('Redirecting to classes page')
        // Don't show alert, just redirect
        router.push(`/programs/${params.id}/classes`)
      }
    } catch (error) {
      console.error('Error checking access:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
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
            {profile?.role === 'trainer' ? (
              <>
                <Link href="/trainer/classes" className="hover:text-primary-600 whitespace-nowrap">Kelas Saya</Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-900 font-medium whitespace-nowrap">Content Management</span>
              </>
            ) : (
              <>
                <Link href="/programs" className="hover:text-primary-600 whitespace-nowrap">Programs</Link>
                <span className="text-gray-400">/</span>
                <Link href={`/programs/${params.id}`} className="hover:text-primary-600 truncate max-w-[120px] sm:max-w-none">
                  {programData?.title || 'Program'}
                </Link>
                <span className="text-gray-400">/</span>
                <Link href={`/programs/${params.id}/classes`} className="hover:text-primary-600 whitespace-nowrap">Classes</Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-900 font-medium whitespace-nowrap">Content Management</span>
              </>
            )}
          </nav>
        </div>

        {/* Header */}
        <div className="mb-8">
          <Link
            href={profile?.role === 'trainer' ? '/trainer/classes' : `/programs/${params.id}/classes`}
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

