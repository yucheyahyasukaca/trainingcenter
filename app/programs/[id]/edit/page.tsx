'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/useToast'
import CategorySelector from '@/components/programs/CategorySelector'

export default function EditProgramPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const addToast = useToast()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price_type: 'gratis' as 'gratis' | 'berbayar',
    price: 0,
    status: 'draft' as 'draft' | 'published' | 'archived',
    registration_type: 'lifetime' as 'lifetime' | 'limited',
    registration_start_date: '',
    registration_end_date: '',
    program_type: 'regular' as 'tot' | 'regular',
    min_trainer_level: 'junior' as 'junior' | 'senior' | 'expert' | 'master',
  })

  useEffect(() => {
    fetchProgram()
  }, [])

  async function fetchProgram() {
    try {
      const { data, error: fetchError } = await supabase
        .from('programs')
        .select('*')
        .eq('id', params.id)
        .single()

      if (fetchError) throw fetchError

      setFormData({
        title: data.title || '',
        description: data.description || '',
        category: data.category || '',
        price_type: data.is_free || data.price === 0 ? 'gratis' : 'berbayar',
        price: data.price || 0,
        status: data.status || 'draft',
        registration_type: data.registration_type || 'lifetime',
        min_trainer_level: data.min_trainer_level || 'junior',
        registration_start_date: data.registration_start_date ? data.registration_start_date.split('T')[0] : '',
        registration_end_date: data.registration_end_date ? data.registration_end_date.split('T')[0] : '',
        program_type: data.program_type || 'regular',
      })
    } catch (err) {
      console.error('Error fetching program:', err)
      router.push('/programs')
    } finally {
      setFetching(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate registration dates for limited type
      if (formData.registration_type === 'limited') {
        if (!formData.registration_start_date || !formData.registration_end_date) {
          error('Tanggal pendaftaran harus diisi untuk pendaftaran berbatas waktu', 'Error')
          setLoading(false)
          return
        }

        const regStart = new Date(formData.registration_start_date)
        const regEnd = new Date(formData.registration_end_date)
        
        if (regEnd < regStart) {
          error('Tanggal selesai pendaftaran harus setelah tanggal mulai pendaftaran', 'Error')
          setLoading(false)
          return
        }
      }

      const { error: updateError } = await supabase
        .from('programs')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category.trim(),
          price: formData.price_type === 'gratis' ? 0 : formData.price,
          is_free: formData.price_type === 'gratis',
          status: formData.status,
          registration_type: formData.registration_type,
          registration_start_date: formData.registration_type === 'limited' ? new Date(formData.registration_start_date).toISOString() : null,
          registration_end_date: formData.registration_type === 'limited' ? new Date(formData.registration_end_date).toISOString() : null,
          program_type: formData.program_type,
          auto_approved: formData.price_type === 'gratis',
          min_trainer_level: formData.min_trainer_level,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)

      if (updateError) throw updateError

      success('Program berhasil diupdate!', 'Berhasil')
      router.push('/programs')
    } catch (err: any) {
      console.error('Error updating program:', err)
      error('Gagal mengupdate program: ' + err.message, 'Error')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/programs" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Kembali ke Daftar Program</span>
          <span className="sm:hidden">Kembali</span>
        </Link>
        
        <h1 className="text-2xl font-bold text-gray-900">Edit Program</h1>
        <p className="text-gray-600">Update informasi program</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          {/* Judul Program */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Judul Program <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Masukkan judul program"
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Masukkan deskripsi program"
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori <span className="text-red-500">*</span>
            </label>
            <CategorySelector
              value={formData.category}
              onChange={(category) => setFormData({ ...formData, category })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipe Harga */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipe Harga <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.price_type}
                onChange={(e) => {
                  const newPriceType = e.target.value as 'gratis' | 'berbayar'
                  setFormData({
                    ...formData,
                    price_type: newPriceType,
                    price: newPriceType === 'gratis' ? 0 : formData.price
                  })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="gratis">Gratis (Otomatis Aktif)</option>
                <option value="berbayar">Berbayar</option>
              </select>
            </div>

            {/* Harga (hanya jika berbayar) */}
            {formData.price_type === 'berbayar' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Harga (IDR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            )}

            {/* Tipe Program */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipe Program <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.program_type}
                onChange={(e) => setFormData({ ...formData, program_type: e.target.value as 'tot' | 'regular' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="regular">Regular</option>
                <option value="tot">TOT (Training of Trainers)</option>
              </select>
              {formData.program_type === 'tot' && (
                <p className="text-sm text-blue-600 mt-1">
                  Peserta yang lulus akan otomatis menjadi Trainer Level 0
                </p>
              )}
            </div>
          </div>

          {/* Tipe Pendaftaran */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Periode Pendaftaran <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.registration_type}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  registration_type: e.target.value as 'lifetime' | 'limited',
                  // Clear dates if switching to lifetime
                  registration_start_date: e.target.value === 'lifetime' ? '' : formData.registration_start_date,
                  registration_end_date: e.target.value === 'lifetime' ? '' : formData.registration_end_date,
                })
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="lifetime">Lifetime (Tanpa Batas Waktu)</option>
              <option value="limited">Berbatas Waktu</option>
            </select>
          </div>

          {/* Tanggal Pendaftaran - hanya muncul jika limited */}
          {formData.registration_type === 'limited' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Batas Waktu Pendaftaran</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Mulai Pendaftaran
                  </label>
                  <input
                    type="date"
                    value={formData.registration_start_date}
                    onChange={(e) => setFormData({ ...formData, registration_start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Selesai Pendaftaran
                  </label>
                  <input
                    type="date"
                    value={formData.registration_end_date}
                    onChange={(e) => setFormData({ ...formData, registration_end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Pendaftaran hanya dapat dilakukan dalam periode ini
              </p>
            </div>
          )}

          {formData.registration_type === 'lifetime' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Pendaftaran Lifetime:</strong> Peserta dapat mendaftar kapan saja tanpa batasan waktu.
              </p>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' | 'archived' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Minimum Trainer Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Level Trainer Minimum
            </label>
            <select
              value={formData.min_trainer_level}
              onChange={(e) => setFormData({ ...formData, min_trainer_level: e.target.value as 'junior' | 'senior' | 'expert' | 'master' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="junior">Junior (Dasar)</option>
              <option value="senior">Senior (Menengah)</option>
              <option value="expert">Expert (Mahir)</option>
              <option value="master">Master (Sangat Mahir)</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Hanya trainer dengan level ini atau lebih tinggi yang dapat membuka kelas untuk program ini
            </p>
          </div>

          {/* Info untuk program gratis */}
          {formData.price_type === 'gratis' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>Program Gratis:</strong> Peserta yang mendaftar akan otomatis disetujui tanpa perlu konfirmasi admin.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-8">
          <Link
            href="/programs"
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  )
}
