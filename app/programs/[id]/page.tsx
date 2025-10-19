'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Trainer } from '@/types'

export default function EditProgramPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    duration_days: 1,
    max_participants: 20,
    price: 0,
    status: 'draft' as 'draft' | 'published' | 'archived',
    start_date: '',
    end_date: '',
    trainer_id: '',
  })

  useEffect(() => {
    fetchTrainers()
    fetchProgram()
  }, [])

  async function fetchTrainers() {
    try {
      const { data, error } = await supabase
        .from('trainers')
        .select('*')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setTrainers(data || [])
    } catch (error) {
      console.error('Error fetching trainers:', error)
    }
  }

  async function fetchProgram() {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      setFormData({
        title: (data as any).title,
        description: (data as any).description,
        category: (data as any).category,
        duration_days: (data as any).duration_days,
        max_participants: (data as any).max_participants,
        price: (data as any).price,
        status: (data as any).status,
        start_date: (data as any).start_date,
        end_date: (data as any).end_date,
        trainer_id: (data as any).trainer_id || '',
      })
    } catch (error) {
      console.error('Error fetching program:', error)
      alert('Gagal memuat data program')
    } finally {
      setFetching(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const dataToUpdate = {
        ...formData,
        trainer_id: formData.trainer_id || null,
      }

      const { error } = await (supabase as any)
        .from('programs')
        .update(dataToUpdate)
        .eq('id', params.id)

      if (error) throw error

      alert('Program berhasil diupdate!')
      router.push('/programs')
    } catch (error: any) {
      console.error('Error updating program:', error)
      alert('Gagal mengupdate program: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: ['duration_days', 'max_participants', 'price'].includes(name) 
        ? parseFloat(value) || 0 
        : value,
    }))
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data program...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/programs" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Program</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Program</h1>
        <p className="text-gray-600 mt-1">Update informasi program</p>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-3xl">
        <div className="space-y-6">
          <div>
            <label className="label">Judul Program *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="input"
            />
          </div>

          <div>
            <label className="label">Deskripsi *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="input"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Kategori *</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="input"
              />
            </div>

            <div>
              <label className="label">Durasi (hari) *</label>
              <input
                type="number"
                name="duration_days"
                value={formData.duration_days}
                onChange={handleChange}
                required
                min="1"
                className="input"
              />
            </div>

            <div>
              <label className="label">Max Peserta *</label>
              <input
                type="number"
                name="max_participants"
                value={formData.max_participants}
                onChange={handleChange}
                required
                min="1"
                className="input"
              />
            </div>

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
              />
            </div>

            <div>
              <label className="label">Tanggal Mulai *</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
                className="input"
              />
            </div>

            <div>
              <label className="label">Tanggal Selesai *</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                required
                className="input"
              />
            </div>

            <div>
              <label className="label">Trainer</label>
              <select
                name="trainer_id"
                value={formData.trainer_id}
                onChange={handleChange}
                className="input"
              >
                <option value="">Pilih Trainer (Opsional)</option>
                {trainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name} - {trainer.specialization}
                  </option>
                ))}
              </select>
            </div>

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
          </div>

          <div className="flex items-center space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Update Program'}
            </button>
            <Link href="/programs" className="btn-secondary">
              Batal
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}

