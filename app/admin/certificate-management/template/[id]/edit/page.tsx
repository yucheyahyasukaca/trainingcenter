'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/hooks/useToast'
import { ArrowLeft, Upload, Plus, Trash2, Settings } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface CertificateTemplate {
  id: string
  template_name: string
  template_description: string
  template_pdf_url: string
  signatory_name: string
  signatory_position: string
  signatory_signature_url?: string
  is_active: boolean
  created_at: string
  programs: {
    id: string
    title: string
    category: string
  }
  created_by_user: {
    id: string
    full_name: string
    email: string
  }
}

interface Program {
  id: string
  title: string
  category: string
  status: string
}

export default function EditTemplatePage({ params }: { params: { id: string } }) {
  const { profile } = useAuth()
  const toast = useToast()
  const router = useRouter()
  const [template, setTemplate] = useState<CertificateTemplate | null>(null)
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    template_name: '',
    template_description: '',
    signatory_name: '',
    signatory_position: '',
    participant_name_field: 'participant_name',
    participant_company_field: 'participant_company',
    participant_position_field: 'participant_position',
    program_title_field: 'program_title',
    program_date_field: 'program_date',
    completion_date_field: 'completion_date',
    trainer_name_field: 'trainer_name',
    trainer_level_field: 'trainer_level'
  })
  const [templateFile, setTemplateFile] = useState<File | null>(null)
  const [signatureFile, setSignatureFile] = useState<File | null>(null)
  const [signatories, setSignatories] = useState<any[]>([])
  const [newSignatory, setNewSignatory] = useState({ name: '', position: '', signature: null as File | null })

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchTemplate()
      fetchPrograms()
    }
  }, [profile, params.id])

  const getAuthHeader = async () => {
    const { data: { session } } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession())
    const headers: HeadersInit = {}
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }
    return headers
  }

  const fetchTemplate = async () => {
    try {
      const headers = await getAuthHeader()
      const response = await fetch(`/api/admin/certificate-templates?id=${params.id}`, {
        headers
      })
      const result = await response.json()

      if (response.ok && result.data) {
        setTemplate(result.data)
        setFormData({
          template_name: result.data.template_name,
          template_description: result.data.template_description,
          signatory_name: result.data.signatory_name,
          signatory_position: result.data.signatory_position,
          participant_name_field: 'participant_name',
          participant_company_field: 'participant_company',
          participant_position_field: 'participant_position',
          program_title_field: 'program_title',
          program_date_field: 'program_date',
          completion_date_field: 'completion_date',
          trainer_name_field: 'trainer_name',
          trainer_level_field: 'trainer_level'
        })
        fetchSignatories()
      } else {
        toast.error('Template tidak ditemukan')
        router.push('/admin/certificate-management')
      }
    } catch (error) {
      console.error('Error fetching template:', error)
      toast.error('Error mengambil template')
    } finally {
      setLoading(false)
    }
  }

  const fetchSignatories = async () => {
    try {
      const headers = await getAuthHeader()
      const response = await fetch(`/api/admin/certificate-signatories?template_id=${params.id}`, {
        headers
      })
      const result = await response.json()

      if (response.ok && result.data) {
        setSignatories(result.data)
      }
    } catch (error) {
      console.error('Error fetching signatories:', error)
    }
  }

  const fetchPrograms = async () => {
    try {
      const headers = await getAuthHeader()
      const response = await fetch('/api/programs', {
        headers
      })
      const result = await response.json()

      if (response.ok) {
        setPrograms(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
    }
  }

  const handleAddSignatory = async () => {
    if (!newSignatory.name || !newSignatory.position) {
      toast.error('Nama dan jabatan wajib diisi')
      return
    }

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('template_id', params.id)
      formDataToSend.append('signatory_name', newSignatory.name)
      formDataToSend.append('signatory_position', newSignatory.position)

      if (newSignatory.signature) {
        formDataToSend.append('signature_file', newSignatory.signature)
      }

      const headers = await getAuthHeader()
      // Note: do not set Content-Type for FormData
      const response = await fetch('/api/admin/certificate-signatories', {
        method: 'POST',
        headers,
        body: formDataToSend
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Penandatangan berhasil ditambahkan')
        setNewSignatory({ name: '', position: '', signature: null })
        fetchSignatories()
      } else {
        toast.error(result.error || 'Gagal menambahkan penandatangan')
      }
    } catch (error) {
      console.error('Error adding signatory:', error)
      toast.error('Error menambahkan penandatangan')
    }
  }

  const handleDeleteSignatory = async (id: string) => {
    if (!confirm('Yakin ingin menghapus penandatangan ini?')) return

    try {
      const headers = await getAuthHeader()
      const response = await fetch(`/api/admin/certificate-signatories?id=${id}`, {
        method: 'DELETE',
        headers
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Penandatangan berhasil dihapus')
        fetchSignatories()
      } else {
        toast.error(result.error || 'Gagal menghapus penandatangan')
      }
    } catch (error) {
      console.error('Error deleting signatory:', error)
      toast.error('Error menghapus penandatangan')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!template) return

    setSubmitting(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('template_name', formData.template_name)
      formDataToSend.append('template_description', formData.template_description)
      formDataToSend.append('signatory_name', formData.signatory_name)
      formDataToSend.append('signatory_position', formData.signatory_position)
      formDataToSend.append('participant_name_field', formData.participant_name_field)
      formDataToSend.append('participant_company_field', formData.participant_company_field)
      formDataToSend.append('participant_position_field', formData.participant_position_field)
      formDataToSend.append('program_title_field', formData.program_title_field)
      formDataToSend.append('program_date_field', formData.program_date_field)
      formDataToSend.append('completion_date_field', formData.completion_date_field)
      formDataToSend.append('trainer_name_field', formData.trainer_name_field)
      formDataToSend.append('trainer_level_field', formData.trainer_level_field)

      if (templateFile) {
        formDataToSend.append('template_pdf_file', templateFile)
      }

      if (signatureFile) {
        formDataToSend.append('signatory_signature_file', signatureFile)
      }

      const headers = await getAuthHeader()
      // Note: do not set Content-Type for FormData
      const response = await fetch(`/api/admin/certificate-templates?id=${template.id}`, {
        method: 'PUT',
        headers,
        body: formDataToSend
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Template sertifikat berhasil diperbarui')
        router.push('/admin/certificate-management')
      } else {
        toast.error(result.error || 'Gagal memperbarui template')
      }
    } catch (error) {
      console.error('Error updating template:', error)
      toast.error('Error memperbarui template')
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

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Template Tidak Ditemukan</h1>
          <p className="text-gray-600">Template yang Anda cari tidak ditemukan.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/admin/certificate-management"
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Link>
            <Link
              href={`/admin/certificate-management/template/${params.id}/configure`}
              className="inline-flex items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Settings className="w-4 h-4 mr-2" />
              Konfigurasi Template
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Template Sertifikat</h1>
          <p className="mt-2 text-gray-600">Edit template sertifikat: {template.template_name}</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program
                </label>
                <select
                  value={template.programs?.id || ''}
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
                <p className="mt-1 text-sm text-gray-500">Program tidak dapat diubah setelah template dibuat</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Template *
                </label>
                <input
                  type="text"
                  value={formData.template_name}
                  onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi
              </label>
              <textarea
                value={formData.template_description}
                onChange={(e) => setFormData({ ...formData, template_description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Deskripsikan template sertifikat ini..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Penandatangan *
                </label>
                <input
                  type="text"
                  value={formData.signatory_name}
                  onChange={(e) => setFormData({ ...formData, signatory_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jabatan Penandatangan *
                </label>
                <input
                  type="text"
                  value={formData.signatory_position}
                  onChange={(e) => setFormData({ ...formData, signatory_position: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Template PDF (Kosongkan untuk tetap menggunakan yang lama)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="template-file" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload file PDF baru</span>
                      <input
                        id="template-file"
                        name="template-file"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">atau drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF hingga 10MB</p>
                </div>
              </div>
              {templateFile && (
                <p className="mt-2 text-sm text-green-600">File baru dipilih: {templateFile.name}</p>
              )}
              {!templateFile && template.template_pdf_url && (
                <p className="mt-2 text-sm text-gray-500">File saat ini: {template.template_pdf_url.split('/').pop()}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gambar Tanda Tangan (Kosongkan untuk tetap menggunakan yang lama)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="signature-file" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload gambar tanda tangan baru</span>
                      <input
                        id="signature-file"
                        name="signature-file"
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        onChange={(e) => setSignatureFile(e.target.files?.[0] || null)}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">atau drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG hingga 5MB</p>
                </div>
              </div>
              {signatureFile && (
                <p className="mt-2 text-sm text-green-600">File baru dipilih: {signatureFile.name}</p>
              )}
              {!signatureFile && template.signatory_signature_url && (
                <p className="mt-2 text-sm text-gray-500">File saat ini: {template.signatory_signature_url?.split('/').pop()}</p>
              )}
            </div>

            {/* Section: Multiple Signatories */}
            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Penandatangan Sertifikat (Multiple)
              </label>

              {/* List existing signatories */}
              {signatories.length > 0 && (
                <div className="space-y-2 mb-4">
                  {signatories.map((sig) => (
                    <div key={sig.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div>
                        <p className="font-medium">{sig.signatory_name}</p>
                        <p className="text-sm text-gray-600">{sig.signatory_position}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSignatory(sig.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Form to add new signatory */}
              <div className="border border-gray-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Tambah Penandatangan Baru</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama
                    </label>
                    <input
                      type="text"
                      value={newSignatory.name}
                      onChange={(e) => setNewSignatory({ ...newSignatory, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nama penandatangan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jabatan
                    </label>
                    <input
                      type="text"
                      value={newSignatory.position}
                      onChange={(e) => setNewSignatory({ ...newSignatory, position: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Jabatan"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanda Tangan (Opsional)
                  </label>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    onChange={(e) => setNewSignatory({ ...newSignatory, signature: e.target.files?.[0] || null })}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddSignatory}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Penandatangan
                </button>
              </div>
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
                {submitting ? 'Memperbarui...' : 'Perbarui Template'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
