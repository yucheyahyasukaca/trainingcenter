'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/hooks/useToast'
import { 
  Plus, 
  Upload, 
  Edit, 
  Trash2, 
  Download, 
  Eye, 
  FileText,
  Settings,
  Users,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react'
import Link from 'next/link'

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

export default function CertificateTemplatesPage() {
  const { profile } = useAuth()
  const toast = useToast()
  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null)
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
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchTemplates()
      fetchPrograms()
    }
  }, [profile])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/certificate-templates')
      const result = await response.json()
      
      if (response.ok) {
        setTemplates(result.data || [])
      } else {
        toast.error('Error fetching templates')
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Error fetching templates')
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

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!templateFile) {
      toast.error('Please upload a template PDF file')
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
        toast.success('Certificate template created successfully')
        setShowCreateModal(false)
        resetForm()
        fetchTemplates()
      } else {
        toast.error(result.error || 'Failed to create template')
      }
    } catch (error) {
      console.error('Error creating template:', error)
      toast.error('Error creating template')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTemplate) return

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

      const response = await fetch(`/api/admin/certificate-templates?id=${editingTemplate.id}`, {
        method: 'PUT',
        body: formDataToSend
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Certificate template updated successfully')
        setShowEditModal(false)
        setEditingTemplate(null)
        resetForm()
        fetchTemplates()
      } else {
        toast.error(result.error || 'Failed to update template')
      }
    } catch (error) {
      console.error('Error updating template:', error)
      toast.error('Error updating template')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const response = await fetch(`/api/admin/certificate-templates?id=${templateId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Certificate template deleted successfully')
        fetchTemplates()
      } else {
        const result = await response.json()
        toast.error(result.error || 'Failed to delete template')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Error deleting template')
    }
  }

  const resetForm = () => {
    setFormData({
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
    setTemplateFile(null)
    setSignatureFile(null)
  }

  const openEditModal = (template: CertificateTemplate) => {
    setEditingTemplate(template)
    setFormData({
      program_id: template.programs.id,
      template_name: template.template_name,
      template_description: template.template_description,
      signatory_name: template.signatory_name,
      signatory_position: template.signatory_position,
      participant_name_field: 'participant_name',
      participant_company_field: 'participant_company',
      participant_position_field: 'participant_position',
      program_title_field: 'program_title',
      program_date_field: 'program_date',
      completion_date_field: 'completion_date',
      trainer_name_field: 'trainer_name',
      trainer_level_field: 'trainer_level'
    })
    setShowEditModal(true)
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Certificate Templates</h1>
              <p className="mt-2 text-gray-600">Manage certificate templates for programs</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </button>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <FileText className="w-8 h-8 text-blue-500 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{template.template_name}</h3>
                    <p className="text-sm text-gray-600">{template.programs.title}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  {template.is_active ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {template.template_description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  <span>Signatory: {template.signatory_name}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Settings className="w-4 h-4 mr-2" />
                  <span>Position: {template.signatory_position}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Created: {new Date(template.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => window.open(template.template_pdf_url, '_blank')}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </button>
                <button
                  onClick={() => openEditModal(template)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {templates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first certificate template.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </button>
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create Certificate Template</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateTemplate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Program *
                    </label>
                    <select
                      value={formData.program_id}
                      onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Program</option>
                      {programs.map((program) => (
                        <option key={program.id} value={program.id}>
                          {program.title} ({program.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name *
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.template_description}
                    onChange={(e) => setFormData({ ...formData, template_description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Signatory Name *
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Signatory Position *
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template PDF File *
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Signature Image (Optional)
                  </label>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    onChange={(e) => setSignatureFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create Template'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {showEditModal && editingTemplate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Certificate Template</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleEditTemplate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Program
                    </label>
                    <select
                      value={formData.program_id}
                      onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled
                    >
                      <option value="">Select Program</option>
                      {programs.map((program) => (
                        <option key={program.id} value={program.id}>
                          {program.title} ({program.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name *
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.template_description}
                    onChange={(e) => setFormData({ ...formData, template_description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Signatory Name *
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Signatory Position *
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template PDF File (Leave empty to keep current)
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Signature Image (Leave empty to keep current)
                  </label>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    onChange={(e) => setSignatureFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {submitting ? 'Updating...' : 'Update Template'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
