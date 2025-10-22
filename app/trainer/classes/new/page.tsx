'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Program } from '@/types'
import { 
  ArrowLeft,
  Plus,
  BookOpen,
  Calendar,
  Users,
  FileText,
  Save
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NewClassPage() {
  const { profile, user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    program_id: '',
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    max_participants: '',
    location: '',
    room: ''
  })

  // Check if trainer can create class for program
  const canCreateClassForProgram = (programMinLevel: string) => {
    const trainerLevel = (profile as any)?.trainer_level || 'user'
    const levelHierarchy = {
      'user': 0,
      'junior': 1,
      'senior': 2,
      'expert': 3,
      'master': 4
    }
    
    return (levelHierarchy[trainerLevel as keyof typeof levelHierarchy] || 0) >= 
           (levelHierarchy[programMinLevel as keyof typeof levelHierarchy] || 0)
  }

  // Filter programs that trainer can create classes for
  const availablePrograms = programs.filter(program => 
    canCreateClassForProgram(program.min_trainer_level || 'junior')
  )

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const { data, error } = await supabase
          .from('programs')
          .select('id, title, description, category, min_trainer_level')
          .eq('status', 'published')
          .order('title')

        if (error) throw error
        setPrograms(data || [])
      } catch (error) {
        console.error('Error fetching programs:', error)
      }
    }

    fetchPrograms()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.id || !user) return

    setLoading(true)
    try {
      // Use profile.id directly since class_trainers might reference user_profiles.id
      // This is a simpler approach that avoids RLS issues
      const trainerId = profile.id

      // Prepare class data
      const classData = {
        program_id: formData.program_id,
        name: formData.name,
        description: formData.description || null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        location: formData.location || null,
        room: formData.room || null,
        status: 'scheduled',
        current_participants: 0
      }

      // Insert class
      const { data: insertedClass, error: classError } = await supabase
        .from('classes')
        .insert([classData])
        .select()

      if (classError) throw classError

      // Validate data before insert
      if (!insertedClass || !insertedClass[0] || !insertedClass[0].id) {
        throw new Error('Class ID is missing')
      }
      
      if (!trainerId) {
        throw new Error('Trainer ID is missing')
      }
      
      // Assign trainer to class (trainer automatically becomes primary trainer)
      const classTrainerData = {
        class_id: insertedClass[0].id,
        trainer_id: trainerId, // Use trainer ID (either existing or newly created)
        role: 'instructor', // Use 'instructor' as it's most common
        is_primary: true
      }
      
      console.log('🔄 Inserting class trainer data:', classTrainerData)
      console.log('🔄 Data validation:', {
        class_id_valid: !!classTrainerData.class_id,
        trainer_id_valid: !!classTrainerData.trainer_id,
        role_valid: classTrainerData.role === 'instructor',
        is_primary_valid: classTrainerData.is_primary === true
      })
      
      const { error: trainerError } = await supabase
        .from('class_trainers')
        .insert([classTrainerData])

      if (trainerError) {
        console.error('❌ Class trainer insert error:', trainerError)
        console.error('❌ Error details:', {
          message: trainerError.message,
          details: trainerError.details,
          hint: trainerError.hint,
          code: trainerError.code
        })
        throw trainerError
      }

      alert('Kelas berhasil dibuat!')
      router.push('/trainer/classes')
    } catch (error) {
      console.error('Error creating class:', error)
      alert('Gagal membuat kelas: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Akses Ditolak</h1>
          <p className="text-gray-600 mb-6">Silakan login untuk mengakses halaman ini.</p>
          <a href="/login" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6 rounded-xl shadow-sm">
        <div className="flex items-center space-x-4">
          <Link 
            href="/trainer/classes" 
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Buat Kelas Baru</h1>
            <p className="text-gray-600 mt-1">Buat kelas pelatihan baru</p>
          </div>
        </div>
      </div>

      <div>
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="space-y-6">
              {/* Program Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program <span className="text-red-500">*</span>
                </label>
                <select
                  name="program_id"
                  value={formData.program_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="">Pilih Program</option>
                  {availablePrograms.map(program => (
                    <option key={program.id} value={program.id}>
                      {program.title} 
                      {program.min_trainer_level && program.min_trainer_level !== 'junior' && 
                        ` (Min: ${program.min_trainer_level === 'senior' ? 'Senior' : 
                          program.min_trainer_level === 'expert' ? 'Expert' : 'Master'})`
                      }
                    </option>
                  ))}
                </select>
                {availablePrograms.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    Tidak ada program yang tersedia untuk level trainer Anda
                  </p>
                )}
              </div>

              {/* Class Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Kelas <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="Masukkan nama kelas"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="Deskripsi kelas (opsional)"
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Mulai <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Selesai <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Max Participants */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maksimal Peserta
                </label>
                <input
                  type="number"
                  name="max_participants"
                  value={formData.max_participants}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="Kosongkan untuk unlimited"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Kosongkan untuk unlimited peserta
                </p>
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lokasi
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="Lokasi kelas"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ruangan
                  </label>
                  <input
                    type="text"
                    name="room"
                    value={formData.room}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="Nama ruangan"
                  />
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200 mt-8">
              <Link
                href="/trainer/classes"
                className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Kelas</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
