'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewTrainerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    bio: '',
    experience_years: 0,
    certification: '',
    status: 'active' as 'active' | 'inactive',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('trainers')
        .insert([formData])

      if (error) throw error

      alert('Trainer berhasil ditambahkan!')
      router.push('/trainers')
    } catch (error: any) {
      console.error('Error creating trainer:', error)
      alert('Gagal menambahkan trainer: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'experience_years' ? parseInt(value) || 0 : value,
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/trainers" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Trainer</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Tambah Trainer Baru</h1>
        <p className="text-gray-600 mt-1">Isi formulir di bawah untuk menambahkan trainer baru</p>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-3xl">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Nama Lengkap *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="input"
                placeholder="Dr. Budi Santoso"
              />
            </div>

            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input"
                placeholder="budi@example.com"
              />
            </div>

            <div>
              <label className="label">Nomor Telepon *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="input"
                placeholder="081234567890"
              />
            </div>

            <div>
              <label className="label">Spesialisasi *</label>
              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                required
                className="input"
                placeholder="Leadership & Management"
              />
            </div>

            <div>
              <label className="label">Pengalaman (tahun) *</label>
              <input
                type="number"
                name="experience_years"
                value={formData.experience_years}
                onChange={handleChange}
                required
                min="0"
                className="input"
                placeholder="5"
              />
            </div>

            <div>
              <label className="label">Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Sertifikasi</label>
            <input
              type="text"
              name="certification"
              value={formData.certification}
              onChange={handleChange}
              className="input"
              placeholder="Certified Professional Trainer (CPT)"
            />
          </div>

          <div>
            <label className="label">Bio / Deskripsi</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              className="input"
              placeholder="Deskripsi singkat tentang trainer..."
            />
          </div>

          <div className="flex items-center space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Trainer'}
            </button>
            <Link href="/trainers" className="btn-secondary">
              Batal
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}

