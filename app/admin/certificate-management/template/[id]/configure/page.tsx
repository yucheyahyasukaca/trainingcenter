'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/hooks/useToast'
import { ArrowLeft, Save, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface CertificateTemplate {
  id: string
  template_name: string
  template_pdf_url: string
  template_fields: any
  qr_code_size: number
  qr_code_position_x: number
  qr_code_position_y: number
}

interface FieldConfig {
  value: string
  position: { x: number; y: number }
  font: {
    family: string
    size: number
    weight: string
    color: string
  }
  width: number
  align: string
}

export default function ConfigureTemplatePage({ params }: { params: { id: string } }) {
  const { profile } = useAuth()
  const toast = useToast()
  const router = useRouter()
  const [template, setTemplate] = useState<CertificateTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [fields, setFields] = useState<Record<string, FieldConfig>>({})
  
  // QR Code config
  const [qrCodeSize, setQrCodeSize] = useState(150)
  const [qrCodePosition, setQrCodePosition] = useState({ x: 100, y: 100 })

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchTemplate()
    }
  }, [profile, params.id])

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/admin/certificate-templates?id=${params.id}`)
      const result = await response.json()
      
      console.log('Template data:', result.data)
      console.log('Template PDF URL:', result.data?.template_pdf_url)
      
      if (response.ok && result.data) {
        setTemplate(result.data)
        
        // Load existing fields config
        if (result.data.template_fields) {
          setFields(result.data.template_fields)
        }
        
        // Load QR code config
        if (result.data.qr_code_size) {
          setQrCodeSize(result.data.qr_code_size)
        }
        if (result.data.qr_code_position_x && result.data.qr_code_position_y) {
          setQrCodePosition({
            x: result.data.qr_code_position_x,
            y: result.data.qr_code_position_y
          })
        }
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

  const handleSave = async () => {
    if (!template) return

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/certificate-templates?id=${template.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          template_fields: fields,
          qr_code_size: qrCodeSize,
          qr_code_position_x: qrCodePosition.x,
          qr_code_position_y: qrCodePosition.y
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Konfigurasi berhasil disimpan')
      } else {
        toast.error(result.error || 'Gagal menyimpan konfigurasi')
      }
    } catch (error) {
      console.error('Error saving configuration:', error)
      toast.error('Error menyimpan konfigurasi')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (fieldName: string, config: Partial<FieldConfig>) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        ...config
      }
    }))
  }

  const addField = (fieldName: string) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: {
        value: '',
        position: { x: 100, y: 100 },
        font: {
          family: 'Arial',
          size: 12,
          weight: 'normal',
          color: '#000000'
        },
        width: 200,
        align: 'left'
      }
    }))
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

  const availableFields = [
    { name: 'participant_name', label: 'Nama Peserta' },
    { name: 'participant_company', label: 'Perusahaan Peserta' },
    { name: 'participant_position', label: 'Jabatan Peserta' },
    { name: 'program_title', label: 'Judul Program' },
    { name: 'program_date', label: 'Tanggal Program' },
    { name: 'completion_date', label: 'Tanggal Selesai' },
    { name: 'unit_kerja', label: 'Unit Kerja' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <h1 className="text-3xl font-bold text-gray-900">Konfigurasi Template Sertifikat</h1>
          <p className="mt-2 text-gray-600">{template.template_name}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Editor Canvas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Preview Template</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                    className="p-2 rounded-md border border-gray-300 hover:bg-gray-50"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                    className="p-2 rounded-md border border-gray-300 hover:bg-gray-50"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="border border-gray-300 rounded-md overflow-hidden bg-white" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
                <div className="relative bg-gray-100" style={{ width: '595px', height: '842px' }}> {/* A4 size */}
                  {template.template_pdf_url && (
                    <iframe
                      key={template.template_pdf_url}
                      src={`${template.template_pdf_url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                      className="absolute inset-0 w-full h-full"
                      style={{ pointerEvents: 'none' }}
                    />
                  )}
                  
                  {/* Preview Fields */}
                  {Object.entries(fields).map(([key, field]) => (
                    <div
                      key={key}
                      onClick={() => setSelectedField(key)}
                      className={`absolute border-2 ${selectedField === key ? 'border-blue-500' : 'border-dashed border-gray-400'} cursor-pointer bg-white bg-opacity-50 hover:bg-opacity-75 z-10`}
                      style={{
                        left: `${field.position.x}px`,
                        top: `${field.position.y}px`,
                        width: `${field.width}px`,
                        fontFamily: field.font.family,
                        fontSize: `${field.font.size}px`,
                        fontWeight: field.font.weight,
                        color: field.font.color,
                        textAlign: field.align as 'left' | 'center' | 'right'
                      }}
                    >
                      {field.value || `${key} placeholder`}
                    </div>
                  ))}

                  {/* QR Code Preview */}
                  <div
                    className="absolute border-2 border-purple-500 bg-purple-100 bg-opacity-50 cursor-pointer z-10"
                    style={{
                      left: `${qrCodePosition.x}px`,
                      top: `${qrCodePosition.y}px`,
                      width: `${qrCodeSize}px`,
                      height: `${qrCodeSize}px`
                    }}
                    onClick={() => setSelectedField('qr_code')}
                  >
                    <div className="flex items-center justify-center h-full text-xs text-purple-700">
                      QR Code
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Configuration */}
          <div className="space-y-6">
            {/* Available Fields */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Available Fields</h2>
              <div className="space-y-2">
                {availableFields
                  .filter(field => !fields[field.name])
                  .map(field => (
                    <button
                      key={field.name}
                      onClick={() => addField(field.name)}
                      className="w-full text-left px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                    >
                      + {field.label}
                    </button>
                  ))}
              </div>
            </div>

            {/* Configuration */}
            {(selectedField && fields[selectedField] && selectedField !== 'qr_code') && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Edit: {availableFields.find(f => f.name === selectedField)?.label || selectedField}
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Value</label>
                    <input
                      type="text"
                      value={fields[selectedField].value}
                      onChange={(e) => updateField(selectedField, { value: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Enter default value"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Position X</label>
                      <input
                        type="number"
                        value={fields[selectedField].position.x}
                        onChange={(e) => updateField(selectedField, {
                          position: { ...fields[selectedField].position, x: parseFloat(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Position Y</label>
                      <input
                        type="number"
                        value={fields[selectedField].position.y}
                        onChange={(e) => updateField(selectedField, {
                          position: { ...fields[selectedField].position, y: parseFloat(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
                    <input
                      type="number"
                      value={fields[selectedField].width}
                      onChange={(e) => updateField(selectedField, { width: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                    <select
                      value={fields[selectedField].font.family}
                      onChange={(e) => updateField(selectedField, {
                        font: { ...fields[selectedField].font, family: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Helvetica">Helvetica</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                      <input
                        type="number"
                        value={fields[selectedField].font.size}
                        onChange={(e) => updateField(selectedField, {
                          font: { ...fields[selectedField].font, size: parseFloat(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Font Weight</label>
                      <select
                        value={fields[selectedField].font.weight}
                        onChange={(e) => updateField(selectedField, {
                          font: { ...fields[selectedField].font, weight: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                        <option value="300">Light</option>
                        <option value="600">Semi Bold</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Font Color</label>
                    <input
                      type="color"
                      value={fields[selectedField].font.color}
                      onChange={(e) => updateField(selectedField, {
                        font: { ...fields[selectedField].font, color: e.target.value }
                      })}
                      className="w-full h-10 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Text Align</label>
                    <select
                      value={fields[selectedField].align}
                      onChange={(e) => updateField(selectedField, { align: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      const newFields = { ...fields }
                      delete newFields[selectedField]
                      setFields(newFields)
                      setSelectedField(null)
                    }}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                  >
                    Remove Field
                  </button>
                </div>
              </div>
            )}

            {/* QR Code Configuration */}
            {selectedField === 'qr_code' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4">QR Code Configuration</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Size (px)</label>
                    <input
                      type="number"
                      value={qrCodeSize}
                      onChange={(e) => setQrCodeSize(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      min="50"
                      max="300"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Position X</label>
                      <input
                        type="number"
                        value={qrCodePosition.x}
                        onChange={(e) => setQrCodePosition({ ...qrCodePosition, x: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Position Y</label>
                      <input
                        type="number"
                        value={qrCodePosition.y}
                        onChange={(e) => setQrCodePosition({ ...qrCodePosition, y: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end space-x-4">
          <Link
            href="/admin/certificate-management"
            className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
          </button>
        </div>
      </div>
    </div>
  )
}
