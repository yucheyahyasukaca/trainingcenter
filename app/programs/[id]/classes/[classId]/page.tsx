'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, Users, Calendar, Clock, FileText, MessageCircle, Eye, Edit } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { formatDate, formatTime } from '@/lib/utils'

export default function ClassDetailPage({
  params
}: {
  params: { id: string; classId: string }
}) {
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()
  const [classData, setClassData] = useState<any>(null)
  const [programData, setProgramData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && profile) {
      fetchClassData()
    }
  }, [params.id, params.classId, profile, authLoading])

  async function fetchClassData() {
    try {
      setLoading(true)

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

      // Fetch participant count from enrollments
      const { count: participantCount, error: countError } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', params.classId)
        .eq('status', 'approved')

      if (!countError && participantCount !== null) {
        classInfo.current_participants = participantCount
      }

      setClassData(classInfo)
      setProgramData(programInfo)
    } catch (error) {
      console.error('Error fetching class data:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!classData || !programData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-700">Program Pelatihan tidak ditemukan</p>
          <Link
            href={(profile as any)?.role === 'trainer' ? '/trainer/classes' : `/programs/${params.id}`}
            className="text-primary-600 hover:underline mt-4 inline-block"
          >
            Kembali
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
            <span className="text-gray-400">/</span>
            {(profile as any)?.role === 'trainer' ? (
              <>
                <Link href="/trainer/classes" className="hover:text-primary-600">Program Pelatihan Saya</Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-900 font-medium">{classData.name}</span>
              </>
            ) : (
              <>
                <Link href="/programs" className="hover:text-primary-600">Programs</Link>
                <span className="text-gray-400">/</span>
                <Link href={`/programs/${params.id}`} className="hover:text-primary-600">{programData.title}</Link>
                <span className="text-gray-400">/</span>
                <Link href={`/programs/${params.id}/classes`} className="hover:text-primary-600">Classes</Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-900 font-medium">{classData.name}</span>
              </>
            )}
          </nav>
        </div>

        {/* Header */}
        <div className="mb-8">
          <Link
            href={(profile as any)?.role === 'trainer' ? '/trainer/classes' : `/programs/${params.id}/classes`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {(profile as any)?.role === 'trainer' ? 'Kembali ke Program Pelatihan Saya' : 'Kembali ke Program Pelatihan'}
          </Link>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {classData.name}
                </h1>
                <p className="text-gray-600 mb-2">
                  Program: {programData.title}
                </p>
                {classData.description && (
                  <p className="text-gray-500">{classData.description}</p>
                )}
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${classData.status === 'ongoing'
                    ? 'bg-green-100 text-green-800'
                    : classData.status === 'scheduled'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                  {classData.status === 'ongoing' ? 'Berlangsung' :
                    classData.status === 'scheduled' ? 'Dijadwalkan' : 'Selesai'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Class Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Program Pelatihan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-5 h-5 mr-3" />
                  <div>
                    <p className="text-sm font-medium">Tanggal Mulai</p>
                    <p className="text-sm">{formatDate(classData.start_date)}</p>
                  </div>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-5 h-5 mr-3" />
                  <div>
                    <p className="text-sm font-medium">Tanggal Selesai</p>
                    <p className="text-sm">{formatDate(classData.end_date)}</p>
                  </div>
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="w-5 h-5 mr-3" />
                  <div>
                    <p className="text-sm font-medium">Peserta</p>
                    <p className="text-sm">{classData.current_participants || 0} / {classData.max_participants || 'Unlimited'}</p>
                  </div>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="w-5 h-5 mr-3" />
                  <div>
                    <p className="text-sm font-medium">Waktu</p>
                    <p className="text-sm">
                      {classData.start_time && classData.end_time
                        ? `${formatTime(classData.start_time)} - ${formatTime(classData.end_time)}`
                        : classData.start_time
                          ? `${formatTime(classData.start_time)}`
                          : 'TBA'}
                    </p>
                  </div>
                </div>
                {classData.location && (
                  <div className="flex items-center text-gray-600 md:col-span-2">
                    <div className="w-5 h-5 mr-3"></div>
                    <div>
                      <p className="text-sm font-medium">Lokasi</p>
                      <p className="text-sm">{classData.location}</p>
                    </div>
                  </div>
                )}
                {classData.room && (
                  <div className="flex items-center text-gray-600 md:col-span-2">
                    <div className="w-5 h-5 mr-3"></div>
                    <div>
                      <p className="text-sm font-medium">Ruangan</p>
                      <p className="text-sm">{classData.room}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Aksi</h3>
              <div className="space-y-3">
                <Link
                  href={`/programs/${params.id}/classes/${params.classId}/content`}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Kelola Materi
                </Link>
                <Link
                  href={`/programs/${params.id}/classes/${params.classId}/forum`}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Forum Diskusi
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
