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
    // Only check access when profile is loaded
    if (profile !== null) {
      checkAccessAndFetchData()
    }
  }, [params, profile])

  async function checkAccessAndFetchData() {
    console.log('🔍 Starting access check...')
    console.log('Profile:', profile)
    console.log('Params:', params)

    if (!profile) {
      console.log('❌ No profile, redirecting to login')
      router.push('/login')
      return
    }

    try {
      // Fetch content data
      console.log('📄 Fetching content data...')
      const { data: contentData, error: contentError } = await supabase
        .from('learning_contents')
        .select('*, classes!inner(*)')
        .eq('id', params.contentId)
        .single()

      if (contentError) {
        console.error('❌ Content error:', contentError)
        throw contentError
      }
      console.log('✅ Content data:', contentData)
      setContent(contentData)

      // Check access: Admin or assigned trainer
      let access = false
      console.log('🔐 Checking access for role:', profile.role)

      if (profile.role === 'admin') {
        console.log('✅ Admin access granted')
        access = true
      } else if (profile.role === 'trainer') {
        console.log('👨‍🏫 Checking trainer access...')
        
        // Check if assigned to class using class_trainers directly
        console.log('🔍 Checking class assignment...')
        const { data: classTrainer, error: classTrainerError } = await supabase
          .from('class_trainers')
          .select('id, trainer_id')
          .eq('class_id', params.classId)
          .single()

        console.log('Class trainer data:', classTrainer)
        console.log('Class trainer error:', classTrainerError)

        if (classTrainer) {
          console.log('✅ Class trainer data found:', classTrainer)
          
          // Check if the trainer_id matches the current user directly
          if (classTrainer.trainer_id === profile.id) {
            console.log('✅ Class trainer access granted - user matches')
            access = true
          } else {
            console.log('❌ User does not match class trainer')
          }
        } else {
          console.log('❌ No class trainer data found')
          
          // Fallback: Check if program trainer matches
          console.log('🔍 Checking program trainer...')
          const { data: programData, error: programError } = await supabase
            .from('programs')
            .select('trainer_id')
            .eq('id', params.id)
            .single()

          console.log('Program data:', programData)
          console.log('Program error:', programError)

          if (programData?.trainer_id === profile.id) {
            console.log('✅ Program trainer access granted')
            access = true
          } else {
            console.log('❌ No access found')
          }
        }
      } else {
        console.log('❌ Invalid role:', profile.role)
      }

      console.log('🎯 Final access result:', access)
      setHasAccess(access)

      if (!access) {
        console.log('❌ Access denied, showing alert')
        alert('Anda tidak memiliki akses ke halaman ini')
        router.push('/dashboard')
      } else {
        console.log('✅ Access granted!')
      }
    } catch (error) {
      console.error('💥 Error checking access:', error)
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

