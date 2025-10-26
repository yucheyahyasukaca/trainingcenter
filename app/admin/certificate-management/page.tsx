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
  XCircle,
  Target,
  Percent,
  ArrowLeft
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

export default function CertificateManagementPage() {
  const { profile } = useAuth()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<'templates' | 'requirements'>('templates')
  
  // Templates state
  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  
  // Requirements state
  const [requirements, setRequirements] = useState<CertificateRequirement[]>([])
  
  // Common state
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchTemplates()
      fetchRequirements()
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
    }
  }

  const fetchRequirements = async () => {
    try {
      const response = await fetch('/api/admin/certificate-requirements')
      const result = await response.json()
      
      if (response.ok) {
        setRequirements(result.data || [])
      } else {
        toast.error('Error fetching requirements')
      }
    } catch (error) {
      console.error('Error fetching requirements:', error)
      toast.error('Error fetching requirements')
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

  // Delete handlers
  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus template ini?')) return

    try {
      const response = await fetch(`/api/admin/certificate-templates?id=${templateId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Template sertifikat berhasil dihapus')
        fetchTemplates()
      } else {
        const result = await response.json()
        toast.error(result.error || 'Gagal menghapus template')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Error menghapus template')
    }
  }

  const handleDeleteRequirement = async (requirementId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus syarat ini?')) return

    try {
      const response = await fetch(`/api/admin/certificate-requirements?id=${requirementId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Syarat sertifikat berhasil dihapus')
        fetchRequirements()
      } else {
        const result = await response.json()
        toast.error(result.error || 'Gagal menghapus syarat')
      }
    } catch (error) {
      console.error('Error deleting requirement:', error)
      toast.error('Error menghapus syarat')
    }
  }

  // Helper functions
  const getRequirementTypeIcon = (type: string) => {
    switch (type) {
      case 'completion_percentage':
        return <Percent className="w-4 h-4" />
      case 'min_participants':
        return <Users className="w-4 h-4" />
      case 'min_pass_rate':
        return <Target className="w-4 h-4" />
      case 'all_activities':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Settings className="w-4 h-4" />
    }
  }

  const getRequirementTypeLabel = (type: string) => {
    switch (type) {
      case 'completion_percentage':
        return 'Completion Percentage'
      case 'min_participants':
        return 'Minimum Participants'
      case 'min_pass_rate':
        return 'Minimum Pass Rate'
      case 'all_activities':
        return 'All Activities'
      default:
        return type
    }
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
              <h1 className="text-3xl font-bold text-gray-900">Atur Sertifikat</h1>
              <p className="mt-2 text-gray-600">Kelola template dan syarat sertifikat untuk program</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('templates')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'templates'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Template Sertifikat
              </button>
              <button
                onClick={() => setActiveTab('requirements')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'requirements'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Syarat Sertifikat
              </button>
            </nav>
          </div>
        </div>

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Template Sertifikat</h2>
              <Link
                href="/admin/certificate-management/template/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Buat Template
              </Link>
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
                      <span>Penandatangan: {template.signatory_name}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Settings className="w-4 h-4 mr-2" />
                      <span>Jabatan: {template.signatory_position}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Dibuat: {new Date(template.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => window.open(template.template_pdf_url, '_blank')}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Lihat
                    </button>
                    <Link
                      href={`/admin/certificate-management/template/${template.id}/edit`}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {templates.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada template</h3>
                <p className="text-gray-600 mb-4">Mulai dengan membuat template sertifikat pertama Anda.</p>
                <Link
                  href="/admin/certificate-management/template/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Template
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Requirements Tab */}
        {activeTab === 'requirements' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Syarat Sertifikat</h2>
              <Link
                href="/admin/certificate-management/requirement/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Buat Syarat
              </Link>
            </div>

            {/* Requirements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requirements.map((requirement) => (
                <div key={requirement.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      {getRequirementTypeIcon(requirement.requirement_type)}
                      <div className="ml-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getRequirementTypeLabel(requirement.requirement_type)}
                        </h3>
                        <p className="text-sm text-gray-600">{requirement.programs?.title || 'Program'}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {requirement.is_active ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Target className="w-4 h-4 mr-2" />
                      <span>Nilai: {requirement.requirement_value}%</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Dibuat: {new Date(requirement.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {requirement.requirement_description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {requirement.requirement_description}
                    </p>
                  )}

                  <div className="flex space-x-2">
                    <Link
                      href={`/admin/certificate-management/requirement/${requirement.id}/edit`}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteRequirement(requirement.id)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {requirements.length === 0 && (
              <div className="text-center py-12">
                <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada syarat</h3>
                <p className="text-gray-600 mb-4">Mulai dengan membuat syarat sertifikat pertama Anda.</p>
                <Link
                  href="/admin/certificate-management/requirement/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Syarat
                </Link>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
