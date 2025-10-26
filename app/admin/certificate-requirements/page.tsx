'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/hooks/useToast'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Settings,
  CheckCircle,
  XCircle,
  Target,
  Users,
  Percent,
  Calendar
} from 'lucide-react'

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

export default function CertificateRequirementsPage() {
  const { profile } = useAuth()
  const toast = useToast()
  const [requirements, setRequirements] = useState<CertificateRequirement[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingRequirement, setEditingRequirement] = useState<CertificateRequirement | null>(null)
  const [formData, setFormData] = useState({
    program_id: '',
    requirement_type: 'completion_percentage' as const,
    requirement_value: 80,
    requirement_description: '',
    is_active: true
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchRequirements()
      fetchPrograms()
    }
  }, [profile])

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

  const handleCreateRequirement = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const response = await fetch('/api/admin/certificate-requirements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Certificate requirement created successfully')
        setShowCreateModal(false)
        resetForm()
        fetchRequirements()
      } else {
        toast.error(result.error || 'Failed to create requirement')
      }
    } catch (error) {
      console.error('Error creating requirement:', error)
      toast.error('Error creating requirement')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditRequirement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRequirement) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/certificate-requirements?id=${editingRequirement.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Certificate requirement updated successfully')
        setShowEditModal(false)
        setEditingRequirement(null)
        resetForm()
        fetchRequirements()
      } else {
        toast.error(result.error || 'Failed to update requirement')
      }
    } catch (error) {
      console.error('Error updating requirement:', error)
      toast.error('Error updating requirement')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteRequirement = async (requirementId: string) => {
    if (!confirm('Are you sure you want to delete this requirement?')) return

    try {
      const response = await fetch(`/api/admin/certificate-requirements?id=${requirementId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Certificate requirement deleted successfully')
        fetchRequirements()
      } else {
        const result = await response.json()
        toast.error(result.error || 'Failed to delete requirement')
      }
    } catch (error) {
      console.error('Error deleting requirement:', error)
      toast.error('Error deleting requirement')
    }
  }

  const resetForm = () => {
    setFormData({
      program_id: '',
      requirement_type: 'completion_percentage',
      requirement_value: 80,
      requirement_description: '',
      is_active: true
    })
  }

  const openEditModal = (requirement: CertificateRequirement) => {
    setEditingRequirement(requirement)
    setFormData({
      program_id: requirement.program_id,
      requirement_type: requirement.requirement_type,
      requirement_value: requirement.requirement_value,
      requirement_description: requirement.requirement_description,
      is_active: requirement.is_active
    })
    setShowEditModal(true)
  }

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
              <h1 className="text-3xl font-bold text-gray-900">Certificate Requirements</h1>
              <p className="mt-2 text-gray-600">Manage certificate requirements for programs</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Requirement
              </button>
            </div>
          </div>
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
                    <p className="text-sm text-gray-600">{requirement.programs.title}</p>
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
                  <span>Value: {requirement.requirement_value}%</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Created: {new Date(requirement.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {requirement.requirement_description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {requirement.requirement_description}
                </p>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(requirement)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteRequirement(requirement.id)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {requirements.length === 0 && (
          <div className="text-center py-12">
            <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No requirements found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first certificate requirement.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Requirement
            </button>
          </div>
        )}
      </div>

      {/* Create Requirement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create Certificate Requirement</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateRequirement} className="space-y-4">
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
                    Requirement Type *
                  </label>
                  <select
                    value={formData.requirement_type}
                    onChange={(e) => setFormData({ ...formData, requirement_type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="completion_percentage">Completion Percentage</option>
                    <option value="min_participants">Minimum Participants</option>
                    <option value="min_pass_rate">Minimum Pass Rate</option>
                    <option value="all_activities">All Activities</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requirement Value (0-100) *
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.requirement_description}
                    onChange={(e) => setFormData({ ...formData, requirement_description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe what this requirement means..."
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
                    Active
                  </label>
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
                    {submitting ? 'Creating...' : 'Create Requirement'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Requirement Modal */}
      {showEditModal && editingRequirement && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Certificate Requirement</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleEditRequirement} className="space-y-4">
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
                    Requirement Type *
                  </label>
                  <select
                    value={formData.requirement_type}
                    onChange={(e) => setFormData({ ...formData, requirement_type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="completion_percentage">Completion Percentage</option>
                    <option value="min_participants">Minimum Participants</option>
                    <option value="min_pass_rate">Minimum Pass Rate</option>
                    <option value="all_activities">All Activities</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requirement Value (0-100) *
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.requirement_description}
                    onChange={(e) => setFormData({ ...formData, requirement_description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe what this requirement means..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active_edit"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active_edit" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
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
                    {submitting ? 'Updating...' : 'Update Requirement'}
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
