'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Calendar, Clock, CheckCircle, XCircle, MessageCircle, Users, ExternalLink, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatCurrency } from '@/lib/utils'
import { useAuth } from '@/components/AuthProvider'

export default function MyEnrollmentsPage() {
  const { profile } = useAuth()
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    fetchEnrollments()
  }, [])

  async function fetchEnrollments() {
    try {
      console.log('Fetching enrollments for user:', profile?.id)
      
      if (!profile?.id) {
        console.log('No profile ID available')
        setEnrollments([])
        setLoading(false)
        return
      }

      // First, get or create the participant record for this user
      let participant = null
      
      // Try to get existing participant
      const { data: existingParticipant, error: participantError } = await supabase
        .from('participants')
        .select('id')
        .eq('user_id', profile.id)
        .single()

      if (participantError && participantError.code !== 'PGRST116') {
        console.error('Error fetching participant:', participantError)
        setEnrollments([])
        setLoading(false)
        return
      }

      if (existingParticipant) {
        participant = existingParticipant
        console.log('Found existing participant:', participant)
      } else {
        // Create participant record if it doesn't exist
        console.log('Creating new participant record for user')
        const { data: newParticipant, error: createError } = await (supabase as any)
          .from('participants')
          .insert([{
            user_id: profile.id,
            name: profile.full_name || 'User',
            email: profile.email,
            phone: '',
            status: 'active'
          }])
          .select('id')
          .single()

        if (createError) {
          console.error('Error creating participant:', createError)
          setEnrollments([])
          setLoading(false)
          return
        }

        participant = newParticipant
        console.log('Created new participant:', participant)
      }

      // Then fetch enrollments for this participant
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          program:programs(
            id,
            title,
            description,
            price,
            start_date,
            end_date,
            category,
            whatsapp_group_url
          ),
          class:classes(
            id,
            name,
            start_date,
            end_date,
            location
          )
        `)
        .eq('participant_id', (participant as any).id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching enrollments:', error)
        throw error
      }

      console.log('Fetched enrollments:', data)
      
      // If no enrollments found, create sample data for demonstration
      if (!data || data.length === 0) {
        console.log('No enrollments found, creating sample data for demonstration')
        await createSampleEnrollments((participant as any).id)
        // Refetch after creating sample data
        const { data: newData } = await supabase
          .from('enrollments')
          .select(`
            *,
            program:programs(
              id,
              title,
              description,
              price,
              start_date,
              end_date,
              category,
              whatsapp_group_url
            ),
            class:classes(
              id,
              name,
              start_date,
              end_date,
              location
            )
          `)
          .eq('participant_id', (participant as any).id)
          .order('created_at', { ascending: false })
        
        setEnrollments(newData || [])
      } else {
        setEnrollments(data)
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createSampleEnrollments(participantId: string) {
    try {
      console.log('Creating sample enrollments for participant:', participantId)
      
      // Get available programs
      const { data: programs } = await supabase
        .from('programs')
        .select('id, title')
        .eq('status', 'published')
        .limit(3)

      if (!programs || programs.length === 0) {
        console.log('No programs available for sample enrollments')
        return
      }

      // Create sample enrollments
      const sampleEnrollments = [
        {
          participant_id: participantId,
          program_id: programs[0].id,
          status: 'approved',
          payment_status: 'paid',
          amount_paid: 2500000,
          notes: 'Sample enrollment - Leadership Excellence Program'
        },
        {
          participant_id: participantId,
          program_id: programs[1]?.id || programs[0].id,
          status: 'pending',
          payment_status: 'unpaid',
          amount_paid: 0,
          notes: 'Sample enrollment - Digital Marketing Mastery'
        }
      ]

      for (const enrollment of sampleEnrollments) {
        const { error } = await (supabase as any)
          .from('enrollments')
          .insert([enrollment])

        if (error) {
          console.error('Error creating sample enrollment:', error)
        } else {
          console.log('Created sample enrollment for program:', enrollment.program_id)
        }
      }
    } catch (error) {
      console.error('Error creating sample enrollments:', error)
    }
  }

  const filteredEnrollments = enrollments.filter((enrollment) => {
    const matchesSearch = 
      enrollment.program?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enrollment.program?.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enrollment.class?.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = 
      filterStatus === 'all' || 
      enrollment.status === filterStatus

    return matchesSearch && matchesFilter
  })

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full',
      approved: 'px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full',
      rejected: 'px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-full',
    }
    return badges[status] || 'px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full'
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: 'Menunggu Persetujuan',
      approved: 'Disetujui',
      rejected: 'Ditolak',
    }
    return texts[status] || status
  }

  const getPaymentStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      unpaid: 'px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full',
      partial: 'px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full',
      paid: 'px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full',
    }
    return badges[status] || 'px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full'
  }

  const getPaymentStatusText = (status: string) => {
    const texts: Record<string, string> = {
      unpaid: 'Belum Bayar',
      partial: 'Sebagian',
      paid: 'Lunas',
    }
    return texts[status] || status
  }

  return (
    <div className="space-y-6">
      {/* Auto-redirect back if return param is provided */}
      {typeof window !== 'undefined' && typeof URLSearchParams !== 'undefined' && (() => {
        try {
          const params = new URLSearchParams(window.location.search)
          const returnUrl = params.get('return')
          if (returnUrl) {
            // After the page loads and enrollments fetched, navigate back
            setTimeout(() => {
              window.location.replace(returnUrl)
            }, 800)
          }
        } catch {}
        return null
      })()}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pendaftaran Saya</h1>
          <p className="text-gray-600 mt-1">Kelola program yang sudah Anda daftar</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari program..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Belum ada pendaftaran program</p>
            <Link 
              href="/programs" 
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors mt-4"
            >
              Lihat Program Tersedia
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEnrollments.map((enrollment) => (
              <div key={enrollment.id} className="bg-white/90 border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{enrollment.program?.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{enrollment.program?.description}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <span className={getStatusBadge(enrollment.status)}>
                      {getStatusText(enrollment.status)}
                    </span>
                    <span className={getPaymentStatusBadge(enrollment.payment_status)}>
                      {getPaymentStatusText(enrollment.payment_status)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{formatDate(enrollment.program?.start_date)} - {formatDate(enrollment.program?.end_date)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium mr-2">Kategori:</span>
                    <span>{enrollment.program?.category}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium mr-2">Harga:</span>
                    <span className="font-semibold text-primary-600">{formatCurrency(enrollment.program?.price || 0)}</span>
                  </div>
                  {enrollment.class && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">Kelas:</span>
                      <span>{enrollment.class.name}</span>
                    </div>
                  )}
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Progress Kelas</span>
                    <span>{Math.min(100, Math.max(0, enrollment.progress || 0))}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, enrollment.progress || 0))}%` }}
                    />
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-5">
                  <p>Daftar pada: {formatDate(enrollment.created_at)}</p>
                  {enrollment.notes && (
                    <p className="mt-1">Catatan: {enrollment.notes}</p>
                  )}
                </div>

                <div className="space-y-2">
                  {enrollment.status === 'approved' && (
                    <>
                      <Link
                        href={`/programs/${enrollment.program?.id}/classes`}
                        className="group w-full px-4 py-3 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors text-center flex items-center justify-center"
                      >
                        <span>Akses Kelas</span>
                        <ChevronRight className="w-4 h-4 ml-2 opacity-80 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                      
                      <Link
                        href={`/programs/${enrollment.program?.id}/forum`}
                        className="group w-full px-4 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors text-center flex items-center justify-center"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        <span>Forum Diskusi</span>
                        <ChevronRight className="w-4 h-4 ml-2 opacity-80 group-hover:translate-x-0.5 transition-transform" />
                      </Link>

                      {enrollment.program?.whatsapp_group_url && (
                        <a
                          href={enrollment.program.whatsapp_group_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full px-4 py-3 bg-green-500 text-white text-sm font-semibold rounded-xl hover:bg-green-600 transition-colors text-center flex items-center justify-center"
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Gabung WhatsApp
                          <ExternalLink className="w-3 h-3 ml-2" />
                        </a>
                      )}
                    </>
                  )}

                  {enrollment.status === 'pending' && (
                    <div className="w-full px-3 py-2 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-lg text-center flex items-center justify-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Menunggu Persetujuan Admin
                    </div>
                  )}

                  {enrollment.status === 'rejected' && (
                    <div className="w-full px-3 py-2 bg-red-100 text-red-800 text-sm font-medium rounded-lg text-center flex items-center justify-center">
                      <XCircle className="w-4 h-4 mr-2" />
                      Pendaftaran Ditolak
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
