'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Trainer } from '@/types'

export default function NewProgramPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const dataToInsert = {
        ...formData,
        trainer_id: formData.trainer_id || null,
      }

      const { error } = await supabase
        .from('programs')
        .insert([dataToInsert])

      if (error) throw error

      alert('Program berhasil ditambahkan!')
      router.push('/programs')
    } catch (error: any) {
      console.error('Error creating program:', error)
      alert('Gagal menambahkan program: ' + error.message)
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

  return (
    <div className="space-y-6">
      <div>
        <Link href="/programs" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Program</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Tambah Program Baru</h1>
        <p className="text-gray-600 mt-1">Isi formulir di bawah untuk menambahkan program baru</p>
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
              placeholder="Leadership Excellence Program"
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
              placeholder="Deskripsi detail program training..."
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
                placeholder="Leadership, Marketing, Technology, dll"
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
                placeholder="5000000"
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
              {loading ? 'Menyimpan...' : 'Simpan Program'}
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

