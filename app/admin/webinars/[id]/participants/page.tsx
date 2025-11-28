'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Upload, Download, FileSpreadsheet, Users, UserPlus, X, CheckCircle, AlertCircle } from 'lucide-react'
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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
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
            <div className="flex items-center gap-3">
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
                className={`flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors cursor-pointer font-medium ${
                  uploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Mengupload...' : 'Pilih File Excel'}
              </label>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
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
          <div className={`mt-4 p-4 rounded-lg border ${
            uploadResult.success 
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
                <p className={`text-sm font-medium ${
                  uploadResult.success ? 'text-green-800' : 'text-red-800'
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              Daftar Peserta ({rows.length})
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                {rows.filter(r => r.type === 'registered').length} Terdaftar
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                {rows.filter(r => r.type === 'uploaded').length} Diupload
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Memuat peserta...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Belum ada peserta.</p>
            <p className="text-sm text-gray-500 mt-2">Upload file Excel untuk menambahkan peserta.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        row.type === 'registered'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {row.type === 'registered' ? 'Terdaftar' : 'Diupload'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {row.type === 'uploaded' ? (row.unit_kerja || '-') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {'email' in row ? row.email : row.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {row.type === 'uploaded' ? (row.phone || '-') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
