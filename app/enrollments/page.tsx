'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Edit, Trash2, Calendar, UserPlus, GraduationCap, Users, Clock, MapPin, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatCurrency } from '@/lib/utils'
import { useAuth } from '@/components/AuthProvider'
import { ProgramWithClasses } from '@/types'

export default function EnrollmentsPage() {
  const { profile } = useAuth()
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [programs, setPrograms] = useState<ProgramWithClasses[]>([])
  const [userEnrollments, setUserEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  const isAdminOrManager = profile?.role === 'admin' || profile?.role === 'manager'

  useEffect(() => {
    if (isAdminOrManager) {
      fetchEnrollments()
    } else {
      fetchPrograms()
      fetchUserEnrollments()
    }
  }, [isAdminOrManager])

  async function fetchEnrollments() {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          program:programs(title, price),
          participant:participants(name, email, phone)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEnrollments(data || [])
    } catch (error) {
      console.error('Error fetching enrollments:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchPrograms() {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          classes:classes(
            *,
            trainers:class_trainers(
              *,
              trainer:trainers(*)
            )
          )
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPrograms(data || [])
    } catch (error) {
      console.error('Error fetching programs:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchUserEnrollments() {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          program:programs(*),
          class:classes(*)
        `)
        .eq('participant_id', profile?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUserEnrollments(data || [])
    } catch (error) {
      console.error('Error fetching user enrollments:', error)
    }
  }

  async function deleteEnrollment(id: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus pendaftaran ini?')) return

    try {
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchEnrollments()
    } catch (error) {
      console.error('Error deleting enrollment:', error)
      alert('Gagal menghapus pendaftaran')
    }
  }

  const filteredEnrollments = enrollments.filter((enrollment) =>
    enrollment.participant?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    enrollment.program?.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredPrograms = programs.filter((program) =>
    program.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getUserEnrollmentStatus = (programId: string) => {
    const enrollment = userEnrollments.find(e => e.program_id === programId)
    if (!enrollment) return null
    
    return {
      status: enrollment.status,
      paymentStatus: enrollment.payment_status,
      classId: enrollment.class_id,
      className: enrollment.class?.name
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full',
      approved: 'px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full',
      rejected: 'px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full',
      completed: 'px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full',
    }
    return badges[status] || 'px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full'
  }

  const getPaymentBadge = (status: string) => {
    const badges: Record<string, string> = {
      unpaid: 'px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full',
      partial: 'px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full',
      paid: 'px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full',
    }
    return badges[status] || 'px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full'
  }

  // Tampilan untuk User (menampilkan program yang tersedia)
  if (!isAdminOrManager) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Program Training Tersedia</h1>
            <p className="text-gray-600 mt-1">Daftar program training yang sedang dibuka</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari program training..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Belum ada program training yang tersedia</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrograms.map((program) => {
                const enrollmentStatus = getUserEnrollmentStatus(program.id)
                const isEnrolled = enrollmentStatus !== null
                const isApproved = enrollmentStatus?.status === 'approved'
                const isPending = enrollmentStatus?.status === 'pending'
                
                return (
                  <div key={program.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        {program.status}
                      </span>
                      <div className="flex items-center space-x-2">
                        {isEnrolled ? (
                          <>
                            {isApproved ? (
                              <Link
                                href={`/programs/${program.id}/classes`}
                                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                              >
                                Akses Kelas
                              </Link>
                            ) : isPending ? (
                              <span className="px-4 py-2 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-lg">
                                Menunggu
                              </span>
                            ) : (
                              <span className="px-4 py-2 bg-red-100 text-red-800 text-sm font-medium rounded-lg">
                                Ditolak
                              </span>
                            )}
                          </>
                        ) : (
                          <Link
                            href={`/programs/${program.id}/enroll`}
                            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                          >
                            Daftar
                          </Link>
                        )}
                      </div>
                    </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2">{program.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{program.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      <span>{program.category}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{formatDate(program.start_date)} - {formatDate(program.end_date)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span>Max {program.max_participants} peserta</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Harga</span>
                      <span className="text-lg font-bold text-primary-600">
                        {formatCurrency(program.price)}
                      </span>
                    </div>
                    
                    {program.classes && program.classes.length > 0 && (
                      <div className="mb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Kelas Tersedia</span>
                          <span className="text-sm font-medium text-gray-900">
                            {program.classes.length} kelas
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Total kuota: {program.classes.reduce((sum, cls) => sum + cls.max_participants, 0)} peserta
                        </div>
                      </div>
                    )}

                    {isEnrolled && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Status Pendaftaran:</span>
                          <span className={`text-xs font-medium ${
                            isApproved ? 'text-green-600' : 
                            isPending ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {enrollmentStatus?.status === 'approved' ? 'Disetujui' :
                             enrollmentStatus?.status === 'pending' ? 'Menunggu' : 'Ditolak'}
                          </span>
                        </div>
                        {enrollmentStatus?.className && (
                          <div className="mt-1 text-xs text-gray-500">
                            Kelas: {enrollmentStatus.className}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Tampilan untuk Admin/Manager (manajemen pendaftaran)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Pendaftaran</h1>
          <p className="text-gray-600 mt-1">Kelola pendaftaran peserta ke program training</p>
        </div>
        <Link href="/enrollments/new" className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <Plus className="w-5 h-5 mr-2" />
          <span>Tambah Pendaftaran</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari pendaftaran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 animate-pulse rounded"></div>
            ))}
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Belum ada pendaftaran</p>
            <Link href="/enrollments/new" className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors mt-4">
              Tambah Pendaftaran Pertama
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Program</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Peserta</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tanggal</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Pembayaran</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {enrollment.program?.title || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(enrollment.program?.price || 0)}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {enrollment.participant?.name || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {enrollment.participant?.email || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(enrollment.enrollment_date)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={getStatusBadge(enrollment.status)}>
                        {enrollment.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <span className={getPaymentBadge(enrollment.payment_status)}>
                          {enrollment.payment_status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatCurrency(enrollment.amount_paid)}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/enrollments/${enrollment.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => deleteEnrollment(enrollment.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

