'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft,
  Save
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/useToast'

export default function NewClassPage() {
  const { profile, user, loading: authLoading } = useAuth()
  const router = useRouter()
  const toast = useToast()

  const [categories, setCategories] = useState<{ id: string, name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [trainerId, setTrainerId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: 0,
    description: '',
    start_date: '',
    end_date: '',
    max_participants: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.id) return

      try {
        // 1. Fetch trainer ID
        const { data: trainerData, error: trainerError } = await supabase
          .from('trainers')
          .select('id')
          .eq('user_id', profile.id)
          .single()

        if (trainerError) {
          console.error('Error fetching trainer:', trainerError)
          // fail silently or log
        } else if (trainerData) {
          setTrainerId(trainerData.id)
        }

        // 2. Fetch all categories
        const { data: cats, error: catsError } = await supabase
          .from('program_categories')
          .select('id, name')
          .order('name')

        if (catsError) throw catsError
        setCategories(cats || [])
      } catch (error) {
        console.error('Error fetching initial data:', error)
      }
    }

    fetchData()
  }, [profile?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.id || !user) return
    if (!trainerId) {
      toast.error('Error', 'Profil trainer tidak ditemukan. Harap hubungi admin.')
      return
    }

    setLoading(true)
    try {
      // 1. Create independent Program
      const programData = {
        title: formData.name, // Program title same as class name
        description: formData.description || '',
        category: formData.category,
        price: Number(formData.price),
        status: 'draft',
        trainer_id: trainerId, // Use the actual trainer_id
        min_trainer_level: (profile as any).trainer_level || 'junior',
        program_type: 'regular',
        registration_type: 'limited',
        is_free: Number(formData.price) === 0
      }

      console.log('Creating program:', programData)

      const { data: insertedProgram, error: programError } = await supabase
        .from('programs')
        .insert([programData])
        .select()
        .single()

      if (programError) throw programError
      if (!insertedProgram) throw new Error('Failed to create program')

      // 2. Create Class linked to the new Program
      const classData = {
        program_id: insertedProgram.id,
        name: formData.name,
        description: formData.description || null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        status: 'scheduled',
        current_participants: 0
      }

      console.log('Creating class:', classData)

      const { data: insertedClass, error: classError } = await (supabase as any)
        .from('classes')
        .insert([classData])
        .select()
        .single()

      if (classError) throw classError

      // 3. Assign trainer to class
      const classTrainerData = {
        class_id: insertedClass.id,
        trainer_id: profile.id, // Use profile.id (User ID) for class_trainers
        role: 'instructor',
        is_primary: true
      }

      const { error: trainerError } = await (supabase as any)
        .from('class_trainers')
        .insert([classTrainerData])

      if (trainerError) throw trainerError

      toast.success('Berhasil', 'Program Pelatihan berhasil dibuat!')
      router.push('/trainer/classes')
    } catch (error: any) {
      console.error('Error creating class:', error)
      toast.error('Gagal', 'Gagal membuat program pelatihan: ' + error.message)
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    )
  }

  // If not authenticated
  if (!user) {
    return null
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
            <h1 className="text-3xl font-bold text-gray-900">Buat Program Pelatihan Baru</h1>
            <p className="text-gray-600 mt-1">Buat program baru dan jadwalkan kelas</p>
          </div>
        </div>
      </div>

      <div>
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="space-y-6">

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori Program <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Program / Kelas <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="Contoh: Belajar Dasar React"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Harga (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="0 untuk gratis"
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
                  placeholder="Deskripsi program pelatihan (opsional)"
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
                    <span>Simpan Program</span>
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
