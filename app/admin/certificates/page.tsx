'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/hooks/useToast'
import { 
  Plus, 
  Download, 
  Eye, 
  FileText,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Award,
  UserCheck
} from 'lucide-react'
import Link from 'next/link'

interface Certificate {
  id: string
  certificate_number: string
  recipient_type: 'participant' | 'trainer'
  recipient_name: string
  recipient_company?: string
  recipient_position?: string
  program_title: string
  program_start_date: string
  program_end_date: string
  completion_date: string
  trainer_name?: string
  trainer_level?: string
  certificate_pdf_url: string
  certificate_qr_code_url: string
  status: 'issued' | 'revoked' | 'expired'
  issued_at: string
  expires_at?: string
  template: {
    id: string
    template_name: string
    signatory_name: string
    signatory_position: string
  }
  programs: {
    id: string
    title: string
    category: string
  }
  classes?: {
    id: string
    name: string
  }
  issued_by_user: {
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

interface Class {
  id: string
  name: string
  program_id: string
}

export default function CertificatesPage() {
  const { profile } = useAuth()
  const toast = useToast()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [recipientTypeFilter, setRecipientTypeFilter] = useState('')
  const [programFilter, setProgramFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [generating, setGenerating] = useState<string | null>(null)

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchCertificates()
      fetchPrograms()
      fetchClasses()
    }
  }, [profile, currentPage, statusFilter, recipientTypeFilter, programFilter, classFilter])

  const fetchCertificates = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      })

      if (statusFilter) params.append('status', statusFilter)
      if (recipientTypeFilter) params.append('recipient_type', recipientTypeFilter)
      if (programFilter) params.append('program_id', programFilter)
      if (classFilter) params.append('class_id', classFilter)

      const response = await fetch(`/api/admin/certificates?${params}`)
      const result = await response.json()
      
      if (response.ok) {
        setCertificates(result.data || [])
        setTotalPages(result.pagination?.totalPages || 1)
      } else {
        toast.error('Error fetching certificates')
      }
    } catch (error) {
      console.error('Error fetching certificates:', error)
      toast.error('Error fetching certificates')
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

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes')
      const result = await response.json()
      
      if (response.ok) {
        setClasses(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }

  const handleGeneratePDF = async (certificateId: string, certificateNumber: string) => {
    setGenerating(certificateId)
    try {
      const response = await fetch('/api/admin/certificates/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          certificate_id: certificateId,
          certificate_number: certificateNumber
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Certificate PDF generated successfully')
        fetchCertificates()
      } else {
        toast.error(result.error || 'Failed to generate PDF')
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Error generating PDF')
    } finally {
      setGenerating(null)
    }
  }

  const handleDownloadPDF = async (certificateNumber: string) => {
    try {
      const response = await fetch(`/api/admin/certificates/download/${certificateNumber}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `certificate-${certificateNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const result = await response.json()
        toast.error(result.error || 'Failed to download PDF')
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Error downloading PDF')
    }
  }

  const filteredCertificates = certificates.filter(certificate => {
    const matchesSearch = certificate.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         certificate.certificate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         certificate.program_title.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'issued':
        return 'bg-green-100 text-green-800'
      case 'revoked':
        return 'bg-red-100 text-red-800'
      case 'expired':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRecipientTypeIcon = (type: string) => {
    return type === 'participant' ? <Users className="w-4 h-4" /> : <Award className="w-4 h-4" />
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
              <h1 className="text-3xl font-bold text-gray-900">Certificates</h1>
              <p className="mt-2 text-gray-600">Manage issued certificates</p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={fetchCertificates}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              <Link
                href="/admin/certificate-templates"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Manage Templates
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search certificates..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="issued">Issued</option>
                <option value="revoked">Revoked</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Type</label>
              <select
                value={recipientTypeFilter}
                onChange={(e) => setRecipientTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="participant">Participant</option>
                <option value="trainer">Trainer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
              <select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Programs</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Classes</option>
                {classes
                  .filter(cls => !programFilter || cls.program_id === programFilter)
                  .map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Certificates Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Certificate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Program
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issued Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCertificates.map((certificate) => (
                  <tr key={certificate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="w-8 h-8 text-blue-500 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {certificate.certificate_number}
                          </div>
                          <div className="text-sm text-gray-500">
                            {certificate.template.template_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getRecipientTypeIcon(certificate.recipient_type)}
                        <div className="ml-2">
                          <div className="text-sm font-medium text-gray-900">
                            {certificate.recipient_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {certificate.recipient_type === 'participant' ? 
                              `${certificate.recipient_company || 'N/A'} - ${certificate.recipient_position || 'N/A'}` :
                              certificate.trainer_level || 'Trainer'
                            }
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {certificate.program_title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {certificate.classes?.name || 'No Class'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(certificate.status)}`}>
                        {certificate.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(certificate.issued_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.open(`/certificate/verify/${certificate.certificate_number}`, '_blank')}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Certificate"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {certificate.certificate_pdf_url ? (
                          <button
                            onClick={() => handleDownloadPDF(certificate.certificate_number)}
                            className="text-green-600 hover:text-green-900"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleGeneratePDF(certificate.id, certificate.certificate_number)}
                            disabled={generating === certificate.id}
                            className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                            title="Generate PDF"
                          >
                            {generating === certificate.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCertificates.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates found</h3>
              <p className="text-gray-600">No certificates match your current filters.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
