'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Trainer } from '@/types'

export default function EditTrainerPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
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

  useEffect(() => {
    fetchTrainer()
  }, [])

  async function fetchTrainer() {
    try {
      const { data, error } = await supabase
        .from('trainers')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      setFormData({
        name: (data as any).name,
        email: (data as any).email,
        phone: (data as any).phone,
        specialization: (data as any).specialization,
        bio: (data as any).bio || '',
        experience_years: (data as any).experience_years,
        certification: (data as any).certification || '',
        status: (data as any).status,
      })
    } catch (error) {
      console.error('Error fetching trainer:', error)
      alert('Gagal memuat data trainer')
    } finally {
      setFetching(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Get current trainer data to get user_id
      const { data: currentTrainer, error: fetchError } = await supabase
        .from('trainers')
        .select('user_id')
        .eq('id', params.id)
        .single()

      if (fetchError) throw fetchError

      // 2. Determine trainer level based on experience
      const trainerLevel = formData.experience_years >= 10 ? 'master_trainer' :
                          formData.experience_years >= 5 ? 'trainer_l2' : 'trainer_l1'

      // 3. Update user_profiles if user_id exists
      if (currentTrainer?.user_id) {
        const { error: userError } = await supabase
          .from('user_profiles')
          .update({
            email: formData.email,
            full_name: formData.name,
            trainer_level: trainerLevel,
            trainer_status: formData.status === 'active' ? 'active' : 'inactive',
            trainer_specializations: [formData.specialization],
            trainer_experience_years: formData.experience_years,
            trainer_certifications: formData.certification,
            is_active: formData.status === 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', currentTrainer.user_id)

        if (userError) throw userError
      }

      // 4. Update trainer record
      const { error: trainerError } = await supabase
        .from('trainers')
        .update(formData)
        .eq('id', params.id)

      if (trainerError) throw trainerError

      alert('Trainer berhasil diupdate!')
      router.push('/trainers')
    } catch (error: any) {
      console.error('Error updating trainer:', error)
      alert('Gagal mengupdate trainer: ' + error.message)
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

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data trainer...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/trainers" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Trainer</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Trainer</h1>
        <p className="text-gray-600 mt-1">Update informasi trainer</p>
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
            />
          </div>

          <div className="flex items-center space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Update Trainer'}
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

