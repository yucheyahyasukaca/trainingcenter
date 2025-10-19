'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, MapPin, Users, Video, FileText, Download } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatTime } from '@/lib/utils'
import { useAuth } from '@/components/AuthProvider'
import { ClassWithTrainers } from '@/types'

export default function ProgramClassesPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { profile } = useAuth()
  const [program, setProgram] = useState<any>(null)
  const [classes, setClasses] = useState<ClassWithTrainers[]>([])
  const [enrollment, setEnrollment] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [params.id])

  async function fetchData() {
    try {
      // Fetch program
      const { data: programData, error: programError } = await supabase
        .from('programs')
        .select('*')
        .eq('id', params.id)
        .single()

      if (programError) throw programError

      // Fetch classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          *,
          trainers:class_trainers(
            *,
            trainer:trainers(*)
          )
        `)
        .eq('program_id', params.id)
        .order('start_date')

      if (classesError) throw classesError

      // Fetch user enrollment
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select(`
          *,
          class:classes(*)
        `)
        .eq('program_id', params.id)
        .eq('participant_id', profile?.id)
        .eq('status', 'approved')
        .single()

      if (enrollmentError && enrollmentError.code !== 'PGRST116') {
        throw enrollmentError
      }

      setProgram(programData)
      setClasses(classesData || [])
      setEnrollment(enrollmentData)
    } catch (error) {
      console.error('Error fetching data:', error)
      router.push('/enrollments')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!program || !enrollment) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h1>
          <p className="text-gray-600 mb-6">Anda belum terdaftar atau belum disetujui untuk program ini.</p>
          <Link href="/enrollments" className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Daftar Program
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/enrollments" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Kembali ke Daftar Program</span>
          <span className="sm:hidden">Kembali</span>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Kelas Program</h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          {program.title} - Kelas: {enrollment.class?.name || 'Tidak ada kelas'}
        </p>
      </div>

      {/* Program Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Program</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Tanggal Mulai</p>
              <p className="font-medium">{formatDate(program.start_date)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Tanggal Selesai</p>
              <p className="font-medium">{formatDate(program.end_date)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Status Pendaftaran</p>
              <p className="font-medium text-green-600">Disetujui</p>
            </div>
          </div>
        </div>
      </div>

      {/* Classes List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Daftar Kelas</h2>
        
        {classes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Belum ada kelas yang tersedia</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <div key={classItem.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{classItem.name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    classItem.status === 'active' ? 'bg-green-100 text-green-800' :
                    classItem.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {classItem.status === 'active' ? 'Aktif' :
                     classItem.status === 'upcoming' ? 'Akan Datang' : 'Selesai'}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{classItem.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{formatDate(classItem.start_date)} - {formatDate(classItem.end_date)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{formatTime(classItem.start_time)} - {formatTime(classItem.end_time)}</span>
                  </div>
                  {classItem.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{classItem.location}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{classItem.current_participants}/{classItem.max_participants} peserta</span>
                  </div>
                </div>

                {/* Trainers */}
                {classItem.trainers && classItem.trainers.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Trainer:</p>
                    <div className="space-y-1">
                      {classItem.trainers.map((ct, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                          <span>{ct.trainer?.name}</span>
                          {ct.role && (
                            <span className="ml-2 text-xs text-gray-500">({ct.role})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <button className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors">
                      <Video className="w-4 h-4 mr-2" />
                      Join Kelas
                    </button>
                    <button className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                      <FileText className="w-4 h-4 mr-2" />
                      Materi
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resources */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Materi dan Sumber Daya</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">Modul Pelatihan</p>
              <p className="text-sm text-gray-600">Download materi</p>
            </div>
            <Download className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <Video className="w-8 h-8 text-red-600" />
            <div>
              <p className="font-medium text-gray-900">Rekaman Kelas</p>
              <p className="text-sm text-gray-600">Tonton ulang</p>
            </div>
            <Download className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <FileText className="w-8 h-8 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">Sertifikat</p>
              <p className="text-sm text-gray-600">Download sertifikat</p>
            </div>
            <Download className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </div>
      </div>
    </div>
  )
}
