'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewParticipantPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    address: '',
    date_of_birth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    status: 'active' as 'active' | 'inactive',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await (supabase as any)
        .from('participants')
        .insert([formData])

      if (error) throw error

      alert('Peserta berhasil ditambahkan!')
      router.push('/participants')
    } catch (error: any) {
      console.error('Error creating participant:', error)
      alert('Gagal menambahkan peserta: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/participants" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Peserta</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Tambah Peserta Baru</h1>
        <p className="text-gray-600 mt-1">Isi formulir di bawah untuk menambahkan peserta baru</p>
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
                placeholder="Andi Wijaya"
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
                placeholder="andi@example.com"
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
              <label className="label">Jenis Kelamin *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="input"
              >
                <option value="male">Laki-laki</option>
                <option value="female">Perempuan</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="label">Tanggal Lahir</label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="input"
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

            <div>
              <label className="label">Perusahaan</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="input"
                placeholder="PT ABC Indonesia"
              />
            </div>

            <div>
              <label className="label">Posisi/Jabatan</label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="input"
                placeholder="Manager"
              />
            </div>
          </div>

          <div>
            <label className="label">Alamat</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="input"
              placeholder="Jl. Contoh No. 123, Jakarta"
            />
          </div>

          <div className="flex items-center space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Peserta'}
            </button>
            <Link href="/participants" className="btn-secondary">
              Batal
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}

