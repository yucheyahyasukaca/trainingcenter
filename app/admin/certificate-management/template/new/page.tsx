'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/hooks/useToast'
import { ArrowLeft, Upload } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Program {
  id: string
  title: string
  category: string
  status: string
}

export default function CreateTemplatePage() {
  const { profile } = useAuth()
  const toast = useToast()
  const router = useRouter()
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    program_id: '',
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

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchPrograms()
    }
  }, [profile])

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs')
      const result = await response.json()
      
      if (response.ok) {
        setPrograms(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!templateFile) {
      toast.error('Silakan upload file template PDF')
      return
    }

    setSubmitting(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('program_id', formData.program_id)
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
      formDataToSend.append('template_pdf_file', templateFile)
      formDataToSend.append('user_id', profile?.id || '')
      
      if (signatureFile) {
        formDataToSend.append('signatory_signature_file', signatureFile)
      }

      const response = await fetch('/api/admin/certificate-templates', {
        method: 'POST',
        body: formDataToSend
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Template sertifikat berhasil dibuat')
        router.push('/admin/certificate-management')
      } else {
        toast.error(result.error || 'Gagal membuat template')
      }
    } catch (error) {
      console.error('Error creating template:', error)
      toast.error('Error membuat template')
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
          <h1 className="text-3xl font-bold text-gray-900">Buat Template Sertifikat</h1>
          <p className="mt-2 text-gray-600">Buat template sertifikat baru untuk program</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program *
                </label>
                <select
                  value={formData.program_id}
                  onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Pilih Program</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.title} ({program.category})
                    </option>
                  ))}
                </select>
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
                File Template PDF *
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="template-file" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload file PDF</span>
                      <input
                        id="template-file"
                        name="template-file"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                        className="sr-only"
                        required
                      />
                    </label>
                    <p className="pl-1">atau drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF hingga 10MB</p>
                </div>
              </div>
              {templateFile && (
                <p className="mt-2 text-sm text-green-600">File dipilih: {templateFile.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gambar Tanda Tangan (Opsional)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="signature-file" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload gambar tanda tangan</span>
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
                <p className="mt-2 text-sm text-green-600">File dipilih: {signatureFile.name}</p>
              )}
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
                {submitting ? 'Membuat...' : 'Buat Template'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
