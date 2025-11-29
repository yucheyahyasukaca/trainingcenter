'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Upload, Download, Users, UserPlus, X, CheckCircle, AlertCircle, Mail, Phone, Briefcase, Search, Edit, Trash2, Plus } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import Link from 'next/link'

interface RegisteredParticipant {
  id: string
  email: string
  full_name: string
  type: 'registered'
}

interface UploadedParticipant {
  id: string
  full_name: string
  unit_kerja: string | null
  email: string | null
  phone: string | null
  type: 'uploaded'
}

type Participant = RegisteredParticipant | UploadedParticipant

export default function WebinarParticipantsPage() {
  const params = useParams<{ id: string }>()
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    unit_kerja: '',
    email: '',
    phone: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const [uploadResult, setUploadResult] = useState<{
    success: boolean
    message: string
    details?: any
  } | null>(null)

  useEffect(() => {
    loadParticipants()
  }, [params.id])

  const loadParticipants = async () => {
    try {
      setLoading(true)

      // Load registered participants (with user account)
      const { data: regs } = await supabase
        .from('webinar_registrations')
        .select('user_id')
        .eq('webinar_id', params.id)

      const registeredParticipants: RegisteredParticipant[] = []
      const userIds = (regs || []).map((r: any) => r.user_id)

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, email, full_name')
          .in('id', userIds)

        registeredParticipants.push(
          ...(profiles || []).map((p: any) => ({
            id: p.id,
            email: p.email,
            full_name: p.full_name,
            type: 'registered' as const
          }))
        )
      }

      // Load uploaded participants (without user account)
      const { data: uploaded } = await supabase
        .from('webinar_participants')
        .select('id, full_name, unit_kerja, email, phone')
        .eq('webinar_id', params.id)
        .order('created_at', { ascending: false })

      const uploadedParticipants: UploadedParticipant[] = (uploaded || []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name,
        unit_kerja: p.unit_kerja,
        email: p.email,
        phone: p.phone,
        type: 'uploaded' as const
      }))

      setRows([...registeredParticipants, ...uploadedParticipants])
    } catch (error) {
      console.error('Error loading participants:', error)
      toast.error('Error', 'Gagal memuat daftar peserta')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      toast.error('Error', 'File harus berformat Excel (.xlsx atau .xls)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Error', 'Ukuran file maksimal 5MB')
      return
    }

    await handleUpload(file)
  }

  const handleUpload = async (file: File) => {
    try {
      setUploading(true)
      setUploadResult(null)

      // Get session token as fallback if cookies don't work
      const { data: { session } } = await supabase.auth.getSession()

      const formData = new FormData()
      formData.append('file', file)

      // Add session token as form field (fallback authentication)
      if (session?.access_token) {
        formData.append('session_token', session.access_token)
      }

      // Note: FormData cannot set custom headers, so we rely on cookies
      // Make sure cookies are sent with credentials: 'include'
      const response = await fetch(`/api/admin/webinars/${params.id}/upload-participants`, {
        method: 'POST',
        body: formData,
        credentials: 'include' // Ensure cookies are sent
      })

      const result = await response.json()

      if (response.ok) {
        setUploadResult({
          success: true,
          message: `Berhasil mengupload ${result.inserted} peserta. ${result.skipped > 0 ? `${result.skipped} peserta duplikat dilewati.` : ''}`,
          details: result
        })
        toast.success('Berhasil', `Berhasil mengupload ${result.inserted} peserta`)
        // Reload participants
        await loadParticipants()
      } else {
        setUploadResult({
          success: false,
          message: result.error || 'Gagal mengupload file',
          details: result.details
        })
        toast.error('Error', result.error || 'Gagal mengupload file')
      }
    } catch (error: any) {
      console.error('Error uploading file:', error)
      setUploadResult({
        success: false,
        message: error.message || 'Terjadi kesalahan saat mengupload file'
      })
      toast.error('Error', 'Terjadi kesalahan saat mengupload file')
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.full_name) {
      toast.error('Error', 'Nama lengkap harus diisi')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/admin/webinars/${params.id}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Berhasil', 'Peserta berhasil ditambahkan')
        setIsAddModalOpen(false)
        setFormData({ full_name: '', unit_kerja: '', email: '', phone: '' })
        loadParticipants()
      } else {
        toast.error('Error', result.error || 'Gagal menambahkan peserta')
      }
    } catch (error) {
      console.error('Error adding participant:', error)
      toast.error('Error', 'Terjadi kesalahan saat menambahkan peserta')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditParticipant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedParticipant || !formData.full_name) return

    try {
      setSubmitting(true)
      const response = await fetch(`/api/admin/webinars/${params.id}/participants/${selectedParticipant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Berhasil', 'Data peserta berhasil diperbarui')
        setIsEditModalOpen(false)
        setSelectedParticipant(null)
        setFormData({ full_name: '', unit_kerja: '', email: '', phone: '' })
        loadParticipants()
      } else {
        toast.error('Error', result.error || 'Gagal memperbarui data peserta')
      }
    } catch (error) {
      console.error('Error updating participant:', error)
      toast.error('Error', 'Terjadi kesalahan saat memperbarui data peserta')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteParticipant = async (participant: Participant) => {
    if (!confirm('Apakah Anda yakin ingin menghapus peserta ini?')) return

    try {
      const response = await fetch(`/api/admin/webinars/${params.id}/participants/${participant.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Berhasil', 'Peserta berhasil dihapus')
        loadParticipants()
      } else {
        const result = await response.json()
        toast.error('Error', result.error || 'Gagal menghapus peserta')
      }
    } catch (error) {
      console.error('Error deleting participant:', error)
      toast.error('Error', 'Terjadi kesalahan saat menghapus peserta')
    }
  }

  const openEditModal = (participant: Participant) => {
    setSelectedParticipant(participant)
    setFormData({
      full_name: participant.full_name,
      unit_kerja: participant.type === 'uploaded' ? participant.unit_kerja || '' : '',
      email: participant.email || '',
      phone: participant.type === 'uploaded' ? participant.phone || '' : ''
    })
    setIsEditModalOpen(true)
  }

  const filteredRows = rows.filter(row =>
    (row.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (row.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (row.type === 'uploaded' && (row.unit_kerja || '').toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const downloadTemplate = () => {
    // Create Excel template
    const templateData = [
      { Nama: 'Contoh Nama 1', 'Unit Kerja': 'Contoh Unit Kerja 1', Email: 'email1@example.com', Phone: '081234567890' },
      { Nama: 'Contoh Nama 2', 'Unit Kerja': 'Contoh Unit Kerja 2', Email: 'email2@example.com', Phone: '081234567891' }
    ]

    // Use xlsx library to create file
    import('xlsx').then((XLSX) => {
      const ws = XLSX.utils.json_to_sheet(templateData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Peserta')

      // Set column widths
      ws['!cols'] = [
        { wch: 30 }, // Nama
        { wch: 30 }, // Unit Kerja
        { wch: 30 }, // Email
        { wch: 15 }  // Phone
      ]

      XLSX.writeFile(wb, 'template-peserta-webinar.xlsx')
    })
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Peserta Webinar</h1>
          <Link
            href="/admin/webinars"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Kembali ke Daftar Webinar
          </Link>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary-600" />
              Upload Peserta dari Excel
            </h2>
            <p className="text-sm text-gray-600">
              Upload file Excel berisi data peserta (Nama dan Unit Kerja). Peserta yang diupload dapat mengunduh sertifikat tanpa perlu login.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Excel (.xlsx atau .xls)
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
                id="excel-upload"
              />
              <label
                htmlFor="excel-upload"
                className={`flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors cursor-pointer font-medium ${uploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Mengupload...' : 'Pilih File Excel'}
              </label>
              <button
                onClick={downloadTemplate}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <Download className="w-4 h-4" />
                Download Template
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Format: Kolom pertama = Nama, Kolom kedua = Unit Kerja (opsional), Kolom ketiga = Email (opsional), Kolom keempat = Phone (opsional)
            </p>
          </div>
        </div>

        {/* Upload Result */}
        {uploadResult && (
          <div className={`mt-4 p-4 rounded-lg border ${uploadResult.success
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
            }`}>
            <div className="flex items-start gap-3">
              {uploadResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${uploadResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                  {uploadResult.message}
                </p>
                {uploadResult.details?.errors && (
                  <ul className="mt-2 text-xs text-red-700 list-disc list-inside">
                    {uploadResult.details.errors.slice(0, 5).map((err: string, idx: number) => (
                      <li key={idx}>{err}</li>
                    ))}
                    {uploadResult.details.errors.length > 5 && (
                      <li>... dan {uploadResult.details.errors.length - 5} error lainnya</li>
                    )}
                  </ul>
                )}
              </div>
              <button
                onClick={() => setUploadResult(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Participants List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              Daftar Peserta ({filteredRows.length})
            </h2>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari peserta..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 w-full sm:w-64"
                />
              </div>

              <button
                onClick={() => {
                  setFormData({ full_name: '', unit_kerja: '', email: '', phone: '' })
                  setIsAddModalOpen(true)
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Tambah Peserta
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Memuat peserta...</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchQuery ? 'Tidak ada peserta yang cocok dengan pencarian.' : 'Belum ada peserta.'}
            </p>
            {!searchQuery && (
              <p className="text-sm text-gray-500 mt-2">Upload file Excel atau tambah manual untuk menambahkan peserta.</p>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Kerja
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${row.type === 'registered'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                          }`}>
                          {row.type === 'registered' ? 'Terdaftar' : 'Diupload'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.full_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 max-w-[200px] truncate" title={row.type === 'uploaded' ? (row.unit_kerja || '-') : '-'}>
                        {row.type === 'uploaded' ? (row.unit_kerja || '-') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 max-w-[200px] truncate" title={row.email || '-'}>
                        {row.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {row.type === 'uploaded' ? (row.phone || '-') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white z-10 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                        {row.type === 'uploaded' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(row)}
                              className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteParticipant(row)}
                              className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {filteredRows.map((row) => (
                <div key={row.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{row.full_name}</h3>
                      <span className={`inline-flex mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${row.type === 'registered'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                        }`}>
                        {row.type === 'registered' ? 'Terdaftar' : 'Diupload'}
                      </span>
                    </div>
                    {row.type === 'uploaded' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(row)}
                          className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteParticipant(row)}
                          className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    {row.type === 'uploaded' && row.unit_kerja && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <span>{row.unit_kerja}</span>
                      </div>
                    )}

                    {row.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="break-all">{row.email}</span>
                      </div>
                    )}
                    {row.type === 'uploaded' && row.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{row.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tambah Peserta Manual</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddParticipant} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Nama peserta"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Kerja</label>
                <input
                  type="text"
                  value={formData.unit_kerja}
                  onChange={(e) => setFormData({ ...formData, unit_kerja: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Unit kerja / Instansi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Email peserta"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. HP</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Nomor HP / WhatsApp"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Data Peserta</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditParticipant} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Kerja</label>
                <input
                  type="text"
                  value={formData.unit_kerja}
                  onChange={(e) => setFormData({ ...formData, unit_kerja: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. HP</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
