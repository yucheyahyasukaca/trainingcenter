'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Copy, ExternalLink, Search } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/hooks/useToast'

interface ShortLink {
  id: string
  short_code: string
  destination_url: string
  description: string | null
  click_count: number
  is_active: boolean
  expires_at: string | null
  created_at: string
}

export default function UrlShortenerPage() {
  const { profile } = useAuth()
  const toast = useToast()
  const [shortLinks, setShortLinks] = useState<ShortLink[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingLink, setEditingLink] = useState<ShortLink | null>(null)
  const [formData, setFormData] = useState({
    short_code: '',
    destination_url: '',
    description: '',
    expires_at: '',
  })

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchShortLinks()
    }
  }, [profile])

  const fetchShortLinks = async () => {
    try {
      const response = await fetch('/api/admin/short-links')
      if (response.ok) {
        const data = await response.json()
        setShortLinks(data)
      }
    } catch (error) {
      console.error('Failed to fetch short links:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingLink 
        ? `/api/admin/short-links/${editingLink.id}`
        : '/api/admin/short-links'
      
      const method = editingLink ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          expires_at: formData.expires_at || null,
          created_by: profile?.id || null,
        }),
      })

      if (response.ok) {
        await fetchShortLinks()
        setShowModal(false)
        resetForm()
        toast.success(
          'Berhasil',
          editingLink ? 'Short link berhasil diperbarui' : 'Short link berhasil dibuat'
        )
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error('Error', errorData.error || 'Failed to save short link')
      }
    } catch (error) {
      console.error('Failed to save short link:', error)
      toast.error('Error', 'Failed to save short link')
    }
  }

  const handleEdit = (link: ShortLink) => {
    setEditingLink(link)
    setFormData({
      short_code: link.short_code,
      destination_url: link.destination_url,
      description: link.description || '',
      expires_at: link.expires_at ? new Date(link.expires_at).toISOString().slice(0, 16) : '',
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this short link?')) return

    try {
      const response = await fetch(`/api/admin/short-links/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchShortLinks()
        toast.success('Berhasil', 'Short link berhasil dihapus')
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error('Error', errorData.error || 'Failed to delete short link')
      }
    } catch (error) {
      console.error('Failed to delete short link:', error)
      toast.error('Error', 'Failed to delete short link')
    }
  }

  const handleCopy = async (code: string) => {
    try {
      const url = `${window.location.origin}/${code}`
      await navigator.clipboard.writeText(url)
      toast.success('Berhasil', 'URL berhasil disalin ke clipboard')
      console.log('✅ URL copied:', url)
    } catch (error) {
      console.error('❌ Failed to copy URL:', error)
      toast.error('Error', 'Gagal menyalin URL ke clipboard')
    }
  }

  const resetForm = () => {
    setFormData({
      short_code: '',
      destination_url: '',
      description: '',
      expires_at: '',
    })
    setEditingLink(null)
  }

  const toggleActive = async (link: ShortLink) => {
    try {
      const response = await fetch(`/api/admin/short-links/${link.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...link,
          is_active: !link.is_active,
        }),
      })

      if (response.ok) {
        await fetchShortLinks()
        toast.success(
          'Berhasil',
          `Short link berhasil ${!link.is_active ? 'diaktifkan' : 'dinonaktifkan'}`
        )
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error('Error', errorData.error || 'Failed to update short link')
      }
    } catch (error) {
      console.error('Failed to update short link:', error)
      toast.error('Error', 'Failed to update short link')
    }
  }

  const filteredLinks = shortLinks.filter(link =>
    link.short_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.destination_url.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (profile?.role !== 'admin') {
    return <div className="p-6 text-red-600">Access denied. Admin only.</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">URL Shortener</h1>
        <p className="text-gray-600">Manage short URLs for easy sharing and redirection</p>
      </div>

      {/* Search and Add Button */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by code or destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Short Link</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destination
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clicks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredLinks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No short links found
                  </td>
                </tr>
              ) : (
                filteredLinks.map((link) => (
                  <tr key={link.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-primary-600 bg-primary-50 px-2 py-1 rounded">
                          /{link.short_code}
                        </code>
                        <button
                          onClick={() => handleCopy(link.short_code)}
                          className="text-gray-400 hover:text-primary-600 transition-colors"
                          title="Copy URL"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={link.destination_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:underline flex items-center gap-1 max-w-md truncate"
                      >
                        {link.destination_url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {link.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {link.click_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleActive(link)}
                        className={`px-2 py-1 text-xs rounded-full ${
                          link.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {link.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {link.expires_at
                        ? new Date(link.expires_at).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(link)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(link.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingLink ? 'Edit Short Link' : 'Create New Short Link'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Short Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.short_code}
                    onChange={(e) => setFormData({ ...formData, short_code: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="gemini2025"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL will be: {window.location.origin}/{formData.short_code || '...'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.destination_url}
                    onChange={(e) => setFormData({ ...formData, destination_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://example.com/programs/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Gemini 2025 Program"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expires At (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editingLink ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

