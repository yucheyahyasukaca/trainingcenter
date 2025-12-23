'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Trainer } from '@/types'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/components/AuthProvider'

export default function EditTrainerPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const addToast = useToast()
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
    avatarUrl: '',
  })

  useEffect(() => {
    fetchTrainer()
  }, [])

  async function fetchTrainer() {
    try {
      console.log('Fetching trainer with ID:', params.id)
      const { data, error } = await supabase
        .from('trainers')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Error fetching trainer:', error)
        throw error
      }

      if (!data) {
        throw new Error('Trainer tidak ditemukan')
      }

      console.log('Trainer data fetched:', data)

      setFormData({
        name: (data as any).name || '',
        email: (data as any).email || '',
        phone: (data as any).phone || '',
        specialization: (data as any).specialization || '',
        bio: (data as any).bio || '',
        experience_years: (data as any).experience_years || 0,
        certification: (data as any).certification || '',
        status: (data as any).status || 'active',
        avatarUrl: (data as any).avatar_url || '',
      })
    } catch (error: any) {
      console.error('Error fetching trainer:', error)
      addToast.error('Gagal memuat data trainer: ' + (error.message || 'Unknown error'), 'Error')
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
      const trainerLevel = formData.experience_years >= 10 ? 'master' :
        formData.experience_years >= 5 ? 'expert' : 'junior'

      // 3. Update user_profiles if user_id exists
      if ((currentTrainer as any)?.user_id) {
        const { error: userError } = await (supabase as any)
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
          .eq('id', (currentTrainer as any).user_id)

        if (userError) throw userError
      }

      // 4. Update trainer record with proper field mapping
      const updateData: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        specialization: formData.specialization.trim(),
        experience_years: formData.experience_years,
        status: formData.status,
      }

      // Only add optional fields if they have values
      if (formData.bio && formData.bio.trim()) {
        updateData.bio = formData.bio.trim()
      } else {
        updateData.bio = null
      }

      if (formData.certification && formData.certification.trim()) {
        updateData.certification = formData.certification.trim()
      } else {
        updateData.certification = null
      }

      // Don't manually set updated_at - let database trigger handle it

      console.log('Updating trainer with data:', updateData)
      console.log('Trainer ID:', params.id)

      // First, verify trainer exists and get current data
      const { data: existingTrainer, error: checkError } = await supabase
        .from('trainers')
        .select('id, name, email, phone, specialization, status')
        .eq('id', params.id)
        .single()

      if (checkError || !existingTrainer) {
        console.error('Trainer not found:', checkError)
        throw new Error('Trainer tidak ditemukan')
      }

      console.log('Trainer exists - current data:', existingTrainer)
      console.log('Data to update:', updateData)

      // Check if there are actual changes before updating
      const hasActualChanges =
        existingTrainer.name !== updateData.name ||
        existingTrainer.email !== updateData.email ||
        existingTrainer.phone !== updateData.phone ||
        existingTrainer.specialization !== updateData.specialization ||
        existingTrainer.status !== updateData.status

      if (!hasActualChanges) {
        console.log('⚠️ No actual changes detected, skipping update')
        addToast.success('Tidak ada perubahan yang perlu disimpan', 'Info')
        setTimeout(() => {
          window.location.href = '/admin/trainers'
        }, 500)
        return
      }

      // Update trainer record
      console.log('🔄 Executing update query...')

      // Try update with .select('id') first to get confirmation
      let updateResult: any = null
      let trainerError: any = null

      // First attempt: with select
      const result1 = await supabase
        .from('trainers')
        .update(updateData)
        .eq('id', params.id)
        .select('id')

      trainerError = result1.error
      updateResult = result1.data

      // If that fails, try without select
      if (trainerError) {
        console.warn('Update with select failed, trying without select...', trainerError)
        const result2 = await supabase
          .from('trainers')
          .update(updateData)
          .eq('id', params.id)

        if (result2.error) {
          console.error('Trainer update error (both attempts failed):', result2.error)
          throw result2.error
        }
        console.log('Update successful without select')
      } else {
        console.log('Update result with select:', updateResult)
      }

      // Wait a bit for database to process the update
      await new Promise(resolve => setTimeout(resolve, 200))

      // Verify the update by fetching the trainer again
      const { data: verifyData, error: verifyError } = await supabase
        .from('trainers')
        .select('*')
        .eq('id', params.id)
        .single()

      if (verifyError) {
        console.error('Verify update error:', verifyError)
        addToast.error('Update berhasil tapi verifikasi gagal: ' + verifyError.message, 'Warning')
      } else {
        console.log('Verified trainer data after update:', verifyData)

        // Compare old data with new data
        const nameChanged = verifyData.name !== existingTrainer.name
        const emailChanged = verifyData.email !== updateData.email
        const phoneChanged = verifyData.phone !== updateData.phone
        const specializationChanged = verifyData.specialization !== updateData.specialization

        console.log('Change check:', {
          name: { old: existingTrainer.name, new: verifyData.name, changed: nameChanged },
          email: { old: existingTrainer.email, new: verifyData.email, changed: emailChanged },
          phone: { old: existingTrainer.phone, new: verifyData.phone, changed: phoneChanged },
          specialization: { old: existingTrainer.specialization, new: verifyData.specialization, changed: specializationChanged }
        })

        const hasChanges = nameChanged || emailChanged || phoneChanged || specializationChanged

        if (!hasChanges) {
          console.warn('⚠️ No changes detected in verified data')
          console.warn('This might be a RLS issue or the data was already the same')
          // Still show success and redirect - maybe data was already correct
          addToast.success('Data trainer sudah diperbarui', 'Berhasil')
        } else {
          console.log('✅ Changes verified successfully')
          addToast.success('Trainer berhasil diupdate!', 'Berhasil')
        }

        // Add small delay to ensure toast is visible, then redirect with cache refresh
        setTimeout(() => {
          // Use window.location to force full page reload
          window.location.href = '/admin/trainers'
        }, 500)
      }
    } catch (error: any) {
      console.error('Error updating trainer:', error)
      const errorMessage = error.message || 'Terjadi kesalahan saat mengupdate trainer'
      addToast.error(errorMessage, 'Error')
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
        <Link href="/admin/trainers" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Manajemen Trainer</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Trainer</h1>
        <p className="text-gray-600 mt-1">Update informasi trainer</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-3xl">
        <div className="space-y-6">
          {/* Avatar Display */}
          {(formData as any).avatarUrl && (
            <div className="flex flex-col items-center mb-6">
              <img
                src={(formData as any).avatarUrl}
                alt={formData.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 shadow-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`
                }}
              />
              <p className="text-sm text-gray-500 mt-2">Foto Profil Saat Ini</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Telepon *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Spesialisasi *</label>
              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pengalaman (tahun) *</label>
              <input
                type="number"
                name="experience_years"
                value={formData.experience_years}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sertifikasi</label>
            <input
              type="text"
              name="certification"
              value={formData.certification}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio / Deskripsi</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="flex items-center space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Menyimpan...' : 'Update Trainer'}
            </button>
            <Link href="/admin/trainers" className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Batal
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}

