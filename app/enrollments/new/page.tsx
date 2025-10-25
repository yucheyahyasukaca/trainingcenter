'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ProgramWithClasses, Participant, ClassWithTrainers } from '@/types'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useAuth } from '@/components/AuthProvider'

export default function NewEnrollmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { profile, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [programs, setPrograms] = useState<ProgramWithClasses[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedProgram, setSelectedProgram] = useState<ProgramWithClasses | null>(null)
  const [formData, setFormData] = useState({
    program_id: '',
    class_id: '',
    participant_id: '',
    status: 'pending' as 'pending' | 'approved' | 'rejected' | 'completed',
    payment_status: 'unpaid' as 'unpaid' | 'partial' | 'paid',
    amount_paid: 0,
    notes: '',
  })

  // Check if user has admin or manager role
  const isAdminOrManager = profile?.role === 'admin' || profile?.role === 'manager'

  useEffect(() => {
    // Redirect user role to programs page
    if (!authLoading && profile && !isAdminOrManager) {
      router.push('/programs')
      return
    }
    
    if (isAdminOrManager) {
      fetchPrograms()
      fetchParticipants()
    }
  }, [profile, authLoading, isAdminOrManager, router])

  useEffect(() => {
    // Check if program_id is provided in URL
    const programId = searchParams.get('program_id') || searchParams.get('program')
    const referralCode = searchParams.get('referral')
    
    if (programId && programs.length > 0) {
      const program = programs.find(p => p.id === programId)
      if (program) {
        setFormData(prev => ({ ...prev, program_id: programId }))
        setSelectedProgram(program)
      }
    }

    // Store referral code if available
    if (referralCode) {
      setFormData(prev => ({ ...prev, notes: prev.notes + `\nReferral Code: ${referralCode}` }))
    }
  }, [searchParams, programs])

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
        .order('title')

      if (error) throw error
      setPrograms(data || [])
    } catch (error) {
      console.error('Error fetching programs:', error)
    }
  }

  async function fetchParticipants() {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setParticipants(data || [])
    } catch (error) {
      console.error('Error fetching participants:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await (supabase as any)
        .from('enrollments')
        .insert([formData])

      if (error) throw error

      alert('Pendaftaran berhasil ditambahkan!')
      router.push('/enrollments')
    } catch (error: any) {
      console.error('Error creating enrollment:', error)
      alert('Gagal menambahkan pendaftaran: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount_paid' ? parseFloat(value) || 0 : value,
    }))

    // Handle program selection
    if (name === 'program_id') {
      const program = programs.find(p => p.id === value)
      setSelectedProgram(program || null)
      setFormData(prev => ({ ...prev, class_id: '' })) // Reset class selection
    }
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  // Show access denied for non-admin/manager users
  if (!isAdminOrManager) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Hai! 👋</h1>
          <p className="text-gray-600 mb-6 text-lg">Halaman ini khusus untuk Admin dan Manager saja nih!</p>
          <p className="text-gray-500 text-sm mb-8">Tapi tenang, kamu masih bisa melihat program-program menarik lainnya! 🎯</p>
          <a 
            href="/programs" 
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-medium rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Lihat Program Tersedia
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/enrollments" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Kembali ke Daftar Pendaftaran</span>
          <span className="sm:hidden">Kembali</span>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Tambah Pendaftaran Baru</h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">Daftarkan peserta ke program training</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 max-w-3xl">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <SearchableSelect
                label="Program"
                required
                value={formData.program_id}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, program_id: value }))
                  const program = programs.find(p => p.id === value)
                  setSelectedProgram(program || null)
                  setFormData(prev => ({ ...prev, class_id: '' }))
                }}
                placeholder="Pilih Program"
                searchPlaceholder="Cari program..."
                options={programs.map(program => ({
                  value: program.id,
                  label: `${program.title} - Rp ${program.price.toLocaleString('id-ID')}${program.classes && program.classes.length > 0 ? ` (${program.classes.length} kelas)` : ''}`
                }))}
              />
            </div>

            {selectedProgram && selectedProgram.classes && selectedProgram.classes.length > 0 && (
              <div>
                <SearchableSelect
                  label="Kelas"
                  required
                  value={formData.class_id}
                  onChange={(value) => setFormData(prev => ({ ...prev, class_id: value }))}
                  placeholder="Pilih Kelas"
                  searchPlaceholder="Cari kelas..."
                  options={selectedProgram.classes.map(classItem => ({
                    value: classItem.id,
                    label: `${classItem.name} - ${classItem.start_date} (${classItem.current_participants}/${classItem.max_participants === null || classItem.max_participants === undefined ? 'Unlimited' : classItem.max_participants} peserta)`
                  }))}
                />
              </div>
            )}

            <div>
              <SearchableSelect
                label="Peserta"
                required
                value={formData.participant_id}
                onChange={(value) => setFormData(prev => ({ ...prev, participant_id: value }))}
                placeholder="Pilih Peserta"
                searchPlaceholder="Cari peserta..."
                options={participants.map(participant => ({
                  value: participant.id,
                  label: `${participant.name} - ${participant.email}`
                }))}
              />
            </div>

            <div>
              <SearchableSelect
                label="Status Pendaftaran"
                required
                value={formData.status}
                onChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                placeholder="Pilih Status"
                searchPlaceholder="Cari status..."
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                  { value: 'completed', label: 'Completed' }
                ]}
              />
            </div>

            <div>
              <SearchableSelect
                label="Status Pembayaran"
                required
                value={formData.payment_status}
                onChange={(value) => setFormData(prev => ({ ...prev, payment_status: value as any }))}
                placeholder="Pilih Status Pembayaran"
                searchPlaceholder="Cari status..."
                options={[
                  { value: 'unpaid', label: 'Unpaid' },
                  { value: 'partial', label: 'Partial' },
                  { value: 'paid', label: 'Paid' }
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Dibayar (IDR)</label>
              <input
                type="number"
                name="amount_paid"
                value={formData.amount_paid}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catatan</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
              placeholder="Catatan tambahan..."
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {loading ? 'Menyimpan...' : 'Simpan Pendaftaran'}
            </button>
            <Link 
              href="/enrollments" 
              className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium text-center"
            >
              Batal
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}

