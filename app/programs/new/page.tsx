'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/useToast'
import CategorySelector from '@/components/programs/CategorySelector'

export default function NewProgramPage() {
  const router = useRouter()
  const addToast = useToast()
  const [loading, setLoading] = useState(false)
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate registration dates for limited type
      if (formData.registration_type === 'limited') {
        if (!formData.registration_start_date || !formData.registration_end_date) {
          addToast.error('Tanggal pendaftaran harus diisi untuk pendaftaran berbatas waktu', 'Error')
          setLoading(false)
          return
        }

        const regStart = new Date(formData.registration_start_date)
        const regEnd = new Date(formData.registration_end_date)
        
        if (regEnd < regStart) {
          addToast.error('Tanggal selesai pendaftaran harus setelah tanggal mulai pendaftaran', 'Error')
          setLoading(false)
          return
        }
      }

      const dataToInsert = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: formData.price_type === 'gratis' ? 0 : formData.price,
        is_free: formData.price_type === 'gratis',
        status: formData.status,
        registration_type: formData.registration_type,
        registration_start_date: formData.registration_type === 'limited' ? formData.registration_start_date : null,
        registration_end_date: formData.registration_type === 'limited' ? formData.registration_end_date : null,
        program_type: formData.program_type,
        auto_approved: formData.price_type === 'gratis',
        min_trainer_level: formData.min_trainer_level,
      }

      const { error: insertError } = await (supabase as any)
        .from('programs')
        .insert([dataToInsert])

      if (insertError) throw insertError

      addToast.success('Program berhasil ditambahkan!', 'Berhasil')
      router.push('/admin/programs')
    } catch (err: any) {
      console.error('Error creating program:', err)
      addToast.error('Gagal menambahkan program: ' + err.message, 'Error')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value,
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/programs" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Manajemen Program</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Tambah Program Baru</h1>
        <p className="text-gray-600 mt-1">Isi formulir di bawah untuk menambahkan program baru</p>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-3xl">
        <div className="space-y-6">
          {/* Judul Program */}
          <div>
            <label className="label">Judul Program *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="input"
              placeholder="Leadership Excellence Program"
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="label">Deskripsi *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="input"
              placeholder="Deskripsi detail program training..."
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="label">Kategori *</label>
            <CategorySelector
              value={formData.category}
              onChange={(category) => setFormData({ ...formData, category })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipe Harga */}
            <div>
              <label className="label">Tipe Harga *</label>
              <select
                name="price_type"
                value={formData.price_type}
                onChange={(e) => {
                  const newPriceType = e.target.value as 'gratis' | 'berbayar'
                  setFormData({
                    ...formData,
                    price_type: newPriceType,
                    price: newPriceType === 'gratis' ? 0 : formData.price
                  })
                }}
                className="input"
              >
                <option value="gratis">Gratis (Otomatis Aktif)</option>
                <option value="berbayar">Berbayar</option>
              </select>
            </div>

            {/* Harga (hanya jika berbayar) */}
            {formData.price_type === 'berbayar' && (
              <div>
                <label className="label">Harga (IDR) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  className="input"
                  placeholder="5000000"
                />
              </div>
            )}

            {/* Tipe Program */}
            <div>
              <label className="label">Tipe Program *</label>
              <select
                name="program_type"
                value={formData.program_type}
                onChange={handleChange}
                className="input"
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
            <label className="label">Periode Pendaftaran *</label>
            <select
              name="registration_type"
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
              className="input"
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
                  <label className="label">Tanggal Mulai Pendaftaran *</label>
                  <input
                    type="date"
                    name="registration_start_date"
                    value={formData.registration_start_date}
                    onChange={handleChange}
                    required
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Tanggal Selesai Pendaftaran *</label>
                  <input
                    type="date"
                    name="registration_end_date"
                    value={formData.registration_end_date}
                    onChange={handleChange}
                    required
                    className="input"
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
            <label className="label">Status *</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="input"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Minimum Trainer Level */}
          <div>
            <label className="label">Level Trainer Minimum *</label>
            <select
              name="min_trainer_level"
              value={formData.min_trainer_level}
              onChange={handleChange}
              className="input"
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

          <div className="flex items-center space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Program'}
            </button>
            <Link href="/admin/programs" className="btn-secondary">
              Batal
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
