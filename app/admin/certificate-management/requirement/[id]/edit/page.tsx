'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/hooks/useToast'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface CertificateRequirement {
  id: string
  program_id: string
  requirement_type: 'completion_percentage' | 'min_participants' | 'min_pass_rate' | 'all_activities'
  requirement_value: number
  requirement_description: string
  is_active: boolean
  created_at: string
  programs: {
    id: string
    title: string
    category: string
  }
}

interface Program {
  id: string
  title: string
  category: string
  status: string
}

export default function EditRequirementPage({ params }: { params: { id: string } }) {
  const { profile } = useAuth()
  const toast = useToast()
  const router = useRouter()
  const [requirement, setRequirement] = useState<CertificateRequirement | null>(null)
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    requirement_type: 'completion_percentage' as const,
    requirement_value: 80,
    requirement_description: '',
    is_active: true
  })

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchRequirement()
      fetchPrograms()
    }
  }, [profile, params.id])

  const fetchRequirement = async () => {
    try {
      if (!params.id) {
        toast.error('ID requirement tidak ditemukan')
        router.push('/admin/certificate-management')
        return
      }

      console.log('Fetching requirement with ID:', params.id)
      const response = await fetch(`/api/admin/certificate-requirements?id=${params.id}`)
      const result = await response.json()
      
      console.log('Requirement response:', result)
      
      if (response.ok && result.data) {
        setRequirement(result.data)
        setFormData({
          requirement_type: result.data.requirement_type,
          requirement_value: result.data.requirement_value,
          requirement_description: result.data.requirement_description,
          is_active: result.data.is_active
        })
      } else {
        toast.error('Syarat tidak ditemukan')
        router.push('/admin/certificate-management')
      }
    } catch (error) {
      console.error('Error fetching requirement:', error)
      toast.error('Error mengambil syarat')
    } finally {
      setLoading(false)
    }
  }

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs')
      const result = await response.json()
      
      if (response.ok) {
        setPrograms(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!requirement || !requirement.id) {
      toast.error('ID requirement tidak ditemukan')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/certificate-requirements?id=${requirement.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Syarat sertifikat berhasil diperbarui')
        router.push('/admin/certificate-management')
      } else {
        toast.error(result.error || 'Gagal memperbarui syarat')
      }
    } catch (error) {
      console.error('Error updating requirement:', error)
      toast.error('Error memperbarui syarat')
    } finally {
      setSubmitting(false)
    }
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h1>
          <p className="text-gray-600">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!requirement) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Syarat Tidak Ditemukan</h1>
          <p className="text-gray-600">Syarat yang Anda cari tidak ditemukan.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href="/admin/certificate-management"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Syarat Sertifikat</h1>
          <p className="mt-2 text-gray-600">Edit syarat sertifikat untuk: {requirement.programs?.title || 'Program'}</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Program
              </label>
              <select
                value={requirement.program_id}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                disabled
              >
                <option value="">Pilih Program</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.title} ({program.category})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">Program tidak dapat diubah setelah syarat dibuat</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Syarat *
              </label>
              <select
                value={formData.requirement_type}
                onChange={(e) => setFormData({ ...formData, requirement_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="completion_percentage">Persentase Penyelesaian</option>
                <option value="min_participants">Minimum Peserta</option>
                <option value="min_pass_rate">Minimum Tingkat Kelulusan</option>
                <option value="all_activities">Semua Aktivitas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nilai Syarat (0-100) *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.requirement_value}
                onChange={(e) => setFormData({ ...formData, requirement_value: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Masukkan nilai persentase atau jumlah minimum yang diperlukan
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi
              </label>
              <textarea
                value={formData.requirement_description}
                onChange={(e) => setFormData({ ...formData, requirement_description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Jelaskan apa arti syarat ini..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Aktif
              </label>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <Link
                href="/admin/certificate-management"
                className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {submitting ? 'Memperbarui...' : 'Perbarui Syarat'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
