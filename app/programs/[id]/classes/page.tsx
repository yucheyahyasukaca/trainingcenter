'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, MapPin, Users, Video, FileText, Download, MessageCircle, ExternalLink, AlertCircle, X, Play, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatTime } from '@/lib/utils'
import { useAuth } from '@/components/AuthProvider'
import { useNotification } from '@/components/ui/Notification'
import { ClassWithTrainers } from '@/types'

export default function ProgramClassesPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { profile } = useAuth()
  const { addNotification } = useNotification()
  const [program, setProgram] = useState<any>(null)
  const [classes, setClasses] = useState<ClassWithTrainers[]>([])
  const [enrollment, setEnrollment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showSessionsModal, setShowSessionsModal] = useState(false)
  const [faceToFaceSessions, setFaceToFaceSessions] = useState<any[]>([])
  const [sessionRecordings, setSessionRecordings] = useState<any[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)

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

      // Fetch classes (simplified query to avoid foreign key issues)
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*, module_url')
        .eq('program_id', params.id)
        .order('start_date')

      console.log('Classes fetched:', classesData?.length || 0)

      if (classesError) throw classesError

      setProgram(programData)

      // Calculate progress for each class if user is enrolled
      let classesWithProgress = classesData || []
      if (profile?.id && classesWithProgress.length > 0) {
        // Get user progress for all learning contents in these classes
        const classIds = classesWithProgress.map((c: any) => c.id)

        const { data: learningContents } = await supabase
          .from('learning_contents')
          .select('id, class_id')
          .in('class_id', classIds)
          .eq('status', 'published')
          .eq('is_required', true)

        if (learningContents && learningContents.length > 0) {
          const contentIds = learningContents.map((lc: any) => lc.id)

          const { data: progressData } = await supabase
            .from('learning_progress')
            .select('content_id, status')
            .eq('user_id', profile.id)
            .in('content_id', contentIds)

          // Calculate progress for each class
          classesWithProgress = classesWithProgress.map((classItem: any) => {
            const classContents = learningContents.filter((lc: any) => lc.class_id === classItem.id)
            const totalContents = classContents.length

            if (totalContents === 0) {
              return { ...classItem, progress: 0 }
            }

            const completedContents = classContents.filter((lc: any) => {
              const progress = progressData?.find((p: any) => p.content_id === lc.id)
              return progress?.status === 'completed'
            }).length

            const progressPercent = Math.round((completedContents / totalContents) * 100)
            return { ...classItem, progress: progressPercent }
          })
        }
      }

      setClasses(classesWithProgress)

      // Check access based on user role
      if (profile?.role === 'admin' || profile?.role === 'manager') {
        // Admin and manager have full access
        setEnrollment({ id: 'admin-access', status: 'approved' })
      } else if ((profile as any)?.role === 'trainer') {
        // Try granting trainer access; if not applicable, fall back to regular user enrollment detection
        let hasTrainerAccess = false
        if (profile?.id) {
          // Some deployments use programs.trainer_id referencing user_profiles.id, others use trainers.id
          // 1) Direct match against user profile id
          if ((programData as any)?.trainer_id === profile.id) {
            hasTrainerAccess = true
          } else {
            // 2) Resolve trainers.id from current user, then check program/class assignments
            const { data: trainerData } = await supabase
              .from('trainers')
              .select('id')
              .eq('user_id', profile.id)
              .maybeSingle()

            if (trainerData) {
              if ((programData as any)?.trainer_id === (trainerData as any).id) {
                hasTrainerAccess = true
              } else {
                const { data: classTrainer } = await supabase
                  .from('class_trainers')
                  .select('id')
                  .eq('trainer_id', (trainerData as any).id)
                  .in('class_id', (classesData || []).map((c: any) => c.id))
                  .maybeSingle()

                if (classTrainer) {
                  hasTrainerAccess = true
                }
              }
            }
          }
        }

        if (hasTrainerAccess) {
          setEnrollment({ id: 'trainer-access', status: 'approved' })
        } else {
          // Fallback to regular user flow
          // Regular user - find participant first, then check enrollment
          console.log('🔍 Trainer role without assignment; falling back to participant for user:', profile?.id)
          const { data: participant, error: participantError } = await supabase
            .from('participants')
            .select('id, user_id, email, name')
            .eq('user_id', profile?.id || '')
            .maybeSingle()

          const typedParticipant = participant as any

          if (participantError || !typedParticipant) {
            setEnrollment(null)
          } else {
            const { data: enrollmentData } = await supabase
              .from('enrollments')
              .select(`
                *,
                class:classes(*)
              `)
              .eq('participant_id', typedParticipant.id)
              .eq('program_id', params.id)
              .maybeSingle()

            const typedEnrollment = enrollmentData as any
            // Allow access for both approved and completed enrollments
            if (typedEnrollment && (typedEnrollment.status === 'approved' || typedEnrollment.status === 'completed')) {
              setEnrollment(typedEnrollment)
            } else {
              setEnrollment(null)
            }
          }
        }
      } else {
        // Regular user - find participant first, then check enrollment
        console.log('🔍 Looking for participant for user:', profile?.id)

        const { data: participant, error: participantError } = await supabase
          .from('participants')
          .select('id, user_id, email, name')
          .eq('user_id', profile?.id || '')
          .maybeSingle()

        const typedParticipant = participant as any

        console.log('👤 Participant lookup result:', {
          found: !!typedParticipant,
          participantId: typedParticipant?.id,
          email: typedParticipant?.email,
          error: participantError
        })

        if (participantError || !typedParticipant) {
          console.log('❌ No participant record found for user:', profile?.id, participantError)
          setEnrollment(null)
          return
        }

        console.log('✅ Participant found:', typedParticipant.id)

        // Now check enrollment for this participant
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('enrollments')
          .select(`
              *,
              class:classes(*)
            `)
          .eq('participant_id', typedParticipant.id)
          .eq('program_id', params.id)
          .maybeSingle()

        console.log('📋 Enrollment query result:', {
          enrollmentData,
          enrollmentError,
          participantId: typedParticipant.id,
          programId: params.id
        })

        const typedEnrollment = enrollmentData as any

        // Check if enrollment exists and is approved or completed
        const normalizedStatus = (typedEnrollment?.status ?? '').toString().trim().toLowerCase()

        if (typedEnrollment && (normalizedStatus === 'approved' || normalizedStatus === 'completed')) {
          console.log('Approved or completed enrollment found')
          setEnrollment(typedEnrollment)
        } else if (typedEnrollment && normalizedStatus !== 'approved' && normalizedStatus !== 'completed') {
          // If enrollment exists but not approved/completed, check if program is free
          if ((programData as any).price === 0) {
            console.log('Free program with pending enrollment - auto-approving...')

            const { error: updateError } = await (supabase as any)
              .from('enrollments')
              .update({
                status: 'approved',
                payment_status: 'paid',
                amount_paid: 0
              })
              .eq('id', typedEnrollment.id)

            if (!updateError) {
              console.log('Enrollment auto-approved')
              setEnrollment({ ...typedEnrollment, status: 'approved', payment_status: 'paid' })
            } else {
              console.error('Error auto-approving enrollment:', updateError)
              setEnrollment(null)
            }
          } else {
            console.log('Enrollment exists but not approved')
            setEnrollment(null)
          }
        } else {
          console.log('No enrollment found for this user')
          setEnrollment(null)
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      router.push('/programs')
    } finally {
      setLoading(false)
    }
  }

  async function fetchFaceToFaceSessions(classId: string) {
    try {
      const { data: sessions, error } = await supabase
        .from('face_to_face_sessions')
        .select('*')
        .eq('class_id', classId)
        .order('session_date', { ascending: true })
        .order('session_time', { ascending: true })

      if (error) throw error
      setFaceToFaceSessions(sessions || [])

      // Fetch recordings for these sessions
      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map(s => s.id)
        const { data: recordings, error: recordingsError } = await supabase
          .from('session_recordings')
          .select('*')
          .in('session_id', sessionIds)
          .order('created_at', { ascending: false })

        if (!recordingsError) {
          setSessionRecordings(recordings || [])
        }
      }
    } catch (error) {
      console.error('Error fetching face-to-face sessions:', error)
      setFaceToFaceSessions([])
      setSessionRecordings([])
    }
  }

  function handleResourceClick(resourceType: 'module' | 'face_to_face' | 'certificate', classId?: string) {
    if (classes.length === 0) {
      const resourceNames = {
        module: 'Modul Pelatihan',
        face_to_face: 'Sesi Tatap Muka',
        certificate: 'Sertifikat'
      }

      addNotification({
        type: 'warning',
        title: 'Materi Belum Tersedia',
        message: `${resourceNames[resourceType]} belum dapat diakses karena trainer untuk kelas ini belum ditambahkan. Kami akan segera mempersiapkan materi setelah trainer ditunjuk. Untuk informasi lebih lanjut, silakan hubungi admin melalui menu bantuan.`,
        duration: 8000
      })
      return
    }

    if (resourceType === 'face_to_face') {
      // Get the class ID - use provided classId or first class
      const targetClassId = classId || (enrollment?.class?.id || (classes.length > 0 ? classes[0].id : null))
      if (targetClassId) {
        setSelectedClassId(targetClassId)
        fetchFaceToFaceSessions(targetClassId)
        setShowSessionsModal(true)
      } else {
        addNotification({
          type: 'warning',
          title: 'Kelas Tidak Ditemukan',
          message: 'Tidak dapat menemukan program pelatihan untuk menampilkan sesi tatap muka.',
          duration: 5000
        })
      }
    } else if (resourceType === 'module') {
      // Get module URL from class
      const targetClass = classId
        ? classes.find(c => c.id === classId)
        : (enrollment?.class || (classes.length > 0 ? classes[0] : null))

      const moduleUrl = (targetClass as any)?.module_url

      if (moduleUrl) {
        window.open(moduleUrl, '_blank')
      } else {
        addNotification({
          type: 'warning',
          title: 'Modul Belum Tersedia',
          message: 'URL modul pelatihan belum diatur oleh trainer. Silakan hubungi trainer atau admin untuk informasi lebih lanjut.',
          duration: 5000
        })
      }
    } else if (resourceType === 'certificate') {
      // Navigate to certificates page
      router.push('/my-certificates')
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
          <Link href="/dashboard/programs" className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
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
        <Link href="/dashboard/programs" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Kembali ke Daftar Program</span>
          <span className="sm:hidden">Kembali</span>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Program Pelatihan</h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          {program.title} - Program Pelatihan: {enrollment.class?.name || (classes.length > 0 ? classes[0].name : 'Tidak ada program pelatihan')}
        </p>
      </div>

      {/* Program Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Program</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Tanggal Mulai</p>
              <p className="font-medium">
                {enrollment.class?.start_date
                  ? formatDate(enrollment.class.start_date)
                  : classes.length > 0
                    ? formatDate(classes[0].start_date)
                    : formatDate(program.start_date)
                }
              </p>
              {(enrollment.class?.start_time || (classes.length > 0 && classes[0].start_time)) && (
                <p className="text-xs text-gray-500">
                  {formatTime(enrollment.class?.start_time || classes[0].start_time)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Tanggal Selesai</p>
              <p className="font-medium">
                {enrollment.class?.end_date
                  ? formatDate(enrollment.class.end_date)
                  : classes.length > 0
                    ? formatDate(classes[0].end_date)
                    : formatDate(program.end_date)
                }
              </p>
              {(enrollment.class?.end_time || (classes.length > 0 && classes[0].end_time)) && (
                <p className="text-xs text-gray-500">
                  {formatTime(enrollment.class?.end_time || classes[0].end_time)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Tipe Program</p>
              <p className="font-medium">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${(program as any).program_type === 'tot'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                  }`}>
                  {(program as any).program_type === 'tot' ? 'TOT' : 'Regular'}
                </span>
              </p>
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

      {/* TOT Program Information */}
      {(program as any).program_type === 'tot' && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-purple-900 mb-4">Program Training of Trainers (TOT)</h3>

              <div className="space-y-6">
                {/* Syarat Kelulusan */}
                <div>
                  <h4 className="text-base font-semibold text-purple-900 mb-3">Syarat Kelulusan:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-sm text-purple-800">Menyelesaikan seluruh materi pembelajaran</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-sm text-purple-800">
                        Melakukan diseminasi minimal kepada <strong className="font-semibold text-purple-900">50 orang</strong>
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-sm text-purple-800">
                        Mengumpulkan bukti diseminasi (foto, video, atau dokumen)
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Benefit Kelulusan */}
                <div>
                  <h4 className="text-base font-semibold text-purple-900 mb-3">Benefit Kelulusan:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-sm text-purple-800">Mendapat sertifikat kelulusan TOT</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-sm text-purple-800">
                        Status berubah dari <strong className="font-semibold text-purple-900">User Level 0</strong> menjadi <strong className="font-semibold text-purple-900">Trainer Level 0</strong>
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-sm text-purple-800">Dapat mengajar program training di platform ini</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-sm text-purple-800">Berkesempatan mengikuti event internasional dari Garuda Academy</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Learning Modules */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Materi Belajar</h2>

        {classes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Belum ada program pelatihan yang tersedia</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem) => {
              // Determine status badge based on progress and class status
              const progress = Math.min(100, Math.max(0, (classItem as any).progress || 0))
              let statusBadge = { text: 'Akan Datang', class: 'bg-gray-100 text-gray-800' }

              if (progress === 100 || classItem.status === 'completed') {
                statusBadge = { text: 'Selesai', class: 'bg-green-100 text-green-800' }
              } else if (progress > 0 && progress < 100) {
                statusBadge = { text: 'Sedang Belajar', class: 'bg-blue-100 text-blue-800' }
              } else if (classItem.status === 'ongoing') {
                statusBadge = { text: 'Aktif', class: 'bg-emerald-100 text-emerald-800' }
              } else if (classItem.status === 'scheduled') {
                statusBadge = { text: 'Akan Datang', class: 'bg-gray-100 text-gray-800' }
              }

              return (
                <div key={classItem.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{classItem.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusBadge.class}`}>{statusBadge.text}</span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{classItem.description}</p>

                  {/* Module progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Progress Modul</span>
                      <span>{Math.min(100, Math.max(0, (classItem as any).progress || 0))}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-600 rounded-full" style={{ width: `${Math.min(100, Math.max(0, (classItem as any).progress || 0))}%` }} />
                    </div>
                  </div>

                  {/* Materials list */}
                  <div className="space-y-2 mb-5">
                    <p className="text-sm font-medium text-gray-700">Materi dalam modul:</p>
                    {((classItem as any).materials_needed || classItem.materials_needed || ['Pendahuluan', 'Materi Inti', 'Kuis']).map((m: string, idx: number) => (
                      <div key={idx} className="flex items-center text-sm text-gray-600">
                        <FileText className="w-4 h-4 mr-2" />
                        <span className="truncate">{m}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center"><Calendar className="w-4 h-4 mr-2" /><span>{formatDate(classItem.start_date)} - {formatDate(classItem.end_date)}</span></div>
                    <div className="hidden sm:flex items-center"><Clock className="w-4 h-4 mr-2" /><span>{formatTime(classItem.start_time || '')} - {formatTime(classItem.end_time || '')}</span></div>
                  </div>

                  <div className="space-y-2">
                    <Link href={`/learn/${params.id}/${classItem.id}`} className="w-full inline-flex px-4 py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors items-center justify-center">
                      Lanjut Belajar
                    </Link>
                    <Link
                      href={`/programs/${params.id}/classes/${classItem.id}/forum`}
                      className="w-full inline-flex px-4 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors items-center justify-center"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Forum Diskusi
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Resources */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Materi dan Sumber Daya</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            onClick={() => handleResourceClick('module')}
            className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <FileText className="w-8 h-8 text-blue-600" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">Modul Pelatihan</p>
              <p className="text-sm text-gray-600">Download materi</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </div>
          <div
            onClick={() => handleResourceClick('face_to_face')}
            className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer border-2 border-red-200"
          >
            <Video className="w-8 h-8 text-red-600" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900">Sesi Tatap Muka</p>
                <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded">WAJIB</span>
              </div>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-600" />
                Penting dan wajib diikuti
              </p>
            </div>
            <LinkIcon className="w-4 h-4 text-gray-400" />
          </div>
          <div
            onClick={() => handleResourceClick('certificate')}
            className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <FileText className="w-8 h-8 text-green-600" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">Sertifikat</p>
              <p className="text-sm text-gray-600">Download sertifikat</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Face-to-Face Sessions Modal */}
      {showSessionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Sesi Tatap Muka</h2>
                <p className="text-sm text-gray-600 mt-1">Daftar sesi tatap muka yang wajib diikuti</p>
              </div>
              <button
                onClick={() => setShowSessionsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {faceToFaceSessions.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Belum ada sesi tatap muka yang dijadwalkan</p>
                  <p className="text-sm text-gray-500 mt-2">Trainer akan menambahkan sesi tatap muka segera</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {faceToFaceSessions.map((session) => {
                    const recordings = sessionRecordings.filter(r => r.session_id === session.id)
                    const platformIcons: Record<string, any> = {
                      zoom: '🔵',
                      google_meet: '🟢',
                      microsoft_teams: '🔷',
                      other: '📹'
                    }
                    const platformNames: Record<string, string> = {
                      zoom: 'Zoom',
                      google_meet: 'Google Meet',
                      microsoft_teams: 'Microsoft Teams',
                      other: 'Platform Lain'
                    }

                    return (
                      <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{session.title}</h3>
                              {session.is_required && (
                                <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded">WAJIB</span>
                              )}
                            </div>
                            {session.description && (
                              <p className="text-sm text-gray-600 mb-2">{session.description}</p>
                            )}
                            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(session.session_date)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatTime(session.session_time)}</span>
                                {session.duration_minutes && (
                                  <span className="ml-1">({session.duration_minutes} menit)</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <span>{platformIcons[session.meeting_platform] || '📹'}</span>
                                <span>{platformNames[session.meeting_platform] || session.meeting_platform}</span>
                              </div>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${session.status === 'completed' ? 'bg-green-100 text-green-800' :
                              session.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                                session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                            }`}>
                            {session.status === 'completed' ? 'Selesai' :
                              session.status === 'ongoing' ? 'Berlangsung' :
                                session.status === 'cancelled' ? 'Dibatalkan' :
                                  'Terjadwal'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <a
                            href={session.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            <LinkIcon className="w-4 h-4" />
                            Buka Link Meeting
                          </a>
                          {session.meeting_password && (
                            <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm">
                              <span className="text-gray-600">Password: </span>
                              <span className="font-mono font-semibold">{session.meeting_password}</span>
                            </div>
                          )}
                        </div>

                        {recordings.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                              <Play className="w-4 h-4" />
                              Rekaman Sesi ({recordings.length})
                            </h4>
                            <div className="space-y-2">
                              {recordings.map((recording) => (
                                <a
                                  key={recording.id}
                                  href={recording.recording_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                                >
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900 text-sm">{recording.title}</p>
                                    {recording.description && (
                                      <p className="text-xs text-gray-600 mt-1">{recording.description}</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                      {recording.duration_minutes && (
                                        <span>Durasi: {recording.duration_minutes} menit</span>
                                      )}
                                      {recording.file_size_mb && (
                                        <span>Ukuran: {recording.file_size_mb} MB</span>
                                      )}
                                    </div>
                                  </div>
                                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
