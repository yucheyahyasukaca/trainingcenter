'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/hooks/useToast'
import { ArrowLeft, Save, RotateCcw, ZoomIn, ZoomOut, Edit, Trash2, ArrowUp, ArrowDown, ArrowRight, ArrowLeft as ArrowLeftIcon, Move } from 'lucide-react'
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

  // Drag and context menu states
  const [isDragging, setIsDragging] = useState(false)
  const [dragField, setDragField] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; field: string | null } | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchTemplate()
    }
  }, [profile, params.id])

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null)
    }
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu])

  // Handle keyboard arrow keys for moving selected field
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedField || e.ctrlKey || e.altKey || e.metaKey) return

      let direction: 'up' | 'down' | 'left' | 'right' | null = null

      switch (e.key) {
        case 'ArrowUp':
          direction = 'up'
          break
        case 'ArrowDown':
          direction = 'down'
          break
        case 'ArrowLeft':
          direction = 'left'
          break
        case 'ArrowRight':
          direction = 'right'
          break
        default:
          return
      }

      if (direction) {
        e.preventDefault()
        const step = e.shiftKey ? 1 : 10 // Shift + Arrow = fine movement (1px), normal = 10px
        
        const deltaX = direction === 'left' ? -step : direction === 'right' ? step : 0
        const deltaY = direction === 'up' ? -step : direction === 'down' ? step : 0

        if (selectedField === 'qr_code') {
          setQrCodePosition(prev => {
            const currentSize = qrCodeSize
            return {
              x: Math.max(0, Math.min(842 - currentSize, prev.x + deltaX)),
              y: Math.max(0, Math.min(595 - currentSize, prev.y + deltaY))
            }
          })
        } else {
          setFields(prev => {
            const field = prev[selectedField]
            if (!field) return prev
            
            return {
              ...prev,
              [selectedField]: {
                ...prev[selectedField],
                position: {
                  x: Math.max(0, Math.min(842 - field.width, field.position.x + deltaX)),
                  y: Math.max(0, Math.min(595, field.position.y + deltaY))
                }
              }
            }
          })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedField, qrCodeSize])

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragField && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        const scaleX = rect.width / (842 * zoom)
        const scaleY = rect.height / (595 * zoom)
        
        const deltaX = (e.clientX - dragStart.x) / scaleX / zoom
        const deltaY = (e.clientY - dragStart.y) / scaleY / zoom

        if (dragField === 'qr_code') {
          setQrCodePosition(prev => ({
            x: Math.max(0, Math.min(842 - qrCodeSize, prev.x + deltaX)),
            y: Math.max(0, Math.min(595 - qrCodeSize, prev.y + deltaY))
          }))
        } else if (fields[dragField]) {
          setFields(prev => ({
            ...prev,
            [dragField]: {
              ...prev[dragField],
              position: {
                x: Math.max(0, Math.min(842 - prev[dragField].width, prev[dragField].position.x + deltaX)),
                y: Math.max(0, Math.min(595, prev[dragField].position.y + deltaY))
              }
            }
          }))
        }
        setDragStart({ x: e.clientX, y: e.clientY })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setDragField(null)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragField, dragStart, fields, zoom, qrCodeSize])

  const handleMouseDown = (e: React.MouseEvent, fieldName: string) => {
    e.stopPropagation()
    setIsDragging(true)
    setDragField(fieldName)
    setDragStart({ x: e.clientX, y: e.clientY })
    setSelectedField(fieldName)
  }

  const handleContextMenu = (e: React.MouseEvent, fieldName: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, field: fieldName })
    setSelectedField(fieldName)
  }

  const moveField = useCallback((direction: 'up' | 'down' | 'left' | 'right', step: number = 10, fieldName?: string) => {
    const currentSelectedField = fieldName || selectedField
    if (!currentSelectedField) return

    const deltaX = direction === 'left' ? -step : direction === 'right' ? step : 0
    const deltaY = direction === 'up' ? -step : direction === 'down' ? step : 0

    if (currentSelectedField === 'qr_code') {
      setQrCodePosition(prev => {
        const currentSize = qrCodeSize
        return {
          x: Math.max(0, Math.min(842 - currentSize, prev.x + deltaX)),
          y: Math.max(0, Math.min(595 - currentSize, prev.y + deltaY))
        }
      })
    } else {
      setFields(prev => {
        const field = prev[currentSelectedField]
        if (!field) return prev
        
        return {
          ...prev,
          [currentSelectedField]: {
            ...prev[currentSelectedField],
            position: {
              x: Math.max(0, Math.min(842 - field.width, field.position.x + deltaX)),
              y: Math.max(0, Math.min(595, field.position.y + deltaY))
            }
          }
        }
      })
    }
  }, [selectedField, qrCodeSize])

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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel - Editor Canvas */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
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
                <p className="text-sm text-gray-600">
                  💡 Tips: Drag untuk menggeser, klik kanan untuk menu, gunakan tombol panah keyboard (Shift+Arrow = 1px, Arrow = 10px)
                </p>
              </div>

              <div className="border border-gray-300 rounded-md overflow-auto bg-white" style={{ maxHeight: '80vh' }}>
                <div 
                  ref={canvasRef}
                  className="relative bg-gray-100" 
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: '842px', height: '595px' }}
                > {/* A4 Landscape */}
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
                      onMouseDown={(e) => handleMouseDown(e, key)}
                      onContextMenu={(e) => handleContextMenu(e, key)}
                      className={`absolute border-2 ${selectedField === key ? 'border-blue-500 shadow-lg' : 'border-dashed border-gray-400'} ${isDragging && dragField === key ? 'cursor-grabbing' : 'cursor-grab'} bg-white bg-opacity-50 hover:bg-opacity-75 z-10 transition-all`}
                      style={{
                        left: `${field.position.x}px`,
                        top: `${field.position.y}px`,
                        width: `${field.width}px`,
                        fontFamily: field.font.family,
                        fontSize: `${field.font.size}px`,
                        fontWeight: field.font.weight,
                        color: field.font.color,
                        textAlign: field.align as 'left' | 'center' | 'right',
                        boxShadow: selectedField === key ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : 'none'
                      }}
                    >
                      {field.value || `${key} placeholder`}
                      {selectedField === key && (
                        <div className="absolute -top-6 left-0 text-xs bg-blue-500 text-white px-2 py-1 rounded whitespace-nowrap">
                          Selected (Use Arrow Keys)
                        </div>
                      )}
                    </div>
                  ))}

                  {/* QR Code Preview */}
                  <div
                    onMouseDown={(e) => handleMouseDown(e, 'qr_code')}
                    onContextMenu={(e) => handleContextMenu(e, 'qr_code')}
                    className={`absolute border-2 ${selectedField === 'qr_code' ? 'border-purple-600 shadow-lg' : 'border-purple-500'} bg-purple-100 bg-opacity-50 ${isDragging && dragField === 'qr_code' ? 'cursor-grabbing' : 'cursor-grab'} z-10 transition-all`}
                    style={{
                      left: `${qrCodePosition.x}px`,
                      top: `${qrCodePosition.y}px`,
                      width: `${qrCodeSize}px`,
                      height: `${qrCodeSize}px`,
                      boxShadow: selectedField === 'qr_code' ? '0 0 0 2px rgba(147, 51, 234, 0.3)' : 'none'
                    }}
                    onClick={() => setSelectedField('qr_code')}
                  >
                    <div className="flex items-center justify-center h-full text-xs text-purple-700">
                      QR Code
                    </div>
                    {selectedField === 'qr_code' && (
                      <div className="absolute -top-6 left-0 text-xs bg-purple-500 text-white px-2 py-1 rounded whitespace-nowrap">
                        Selected (Use Arrow Keys)
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Context Menu */}
              {contextMenu && (
                <div
                  className="fixed bg-white border border-gray-300 rounded-lg shadow-lg py-2 z-50"
                  style={{
                    left: `${contextMenu.x}px`,
                    top: `${contextMenu.y}px`,
                    minWidth: '180px'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      if (contextMenu.field) {
                        setSelectedField(contextMenu.field)
                        setContextMenu(null)
                      }
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-sm"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Properties
                  </button>
                  {contextMenu.field && contextMenu.field !== 'qr_code' && fields[contextMenu.field] && (
                    <button
                      onClick={() => {
                        if (contextMenu.field) {
                          const newFields = { ...fields }
                          delete newFields[contextMenu.field]
                          setFields(newFields)
                          setSelectedField(null)
                          setContextMenu(null)
                        }
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-sm text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove Field
                    </button>
                  )}
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="px-2 py-1 text-xs text-gray-500 font-medium">Move Position</div>
                  <div className="grid grid-cols-3 gap-1 px-2">
                    <div></div>
                    <button
                      onClick={() => {
                        if (contextMenu.field) {
                          setSelectedField(contextMenu.field)
                          moveField('up', 10, contextMenu.field)
                          setContextMenu(null)
                        }
                      }}
                      className="p-2 hover:bg-gray-100 rounded flex items-center justify-center"
                      title="Move Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <div></div>
                    <button
                      onClick={() => {
                        if (contextMenu.field) {
                          setSelectedField(contextMenu.field)
                          moveField('left', 10, contextMenu.field)
                          setContextMenu(null)
                        }
                      }}
                      className="p-2 hover:bg-gray-100 rounded flex items-center justify-center"
                      title="Move Left"
                    >
                      <ArrowLeftIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (contextMenu.field) {
                          setSelectedField(contextMenu.field)
                          moveField('down', 10, contextMenu.field)
                          setContextMenu(null)
                        }
                      }}
                      className="p-2 hover:bg-gray-100 rounded flex items-center justify-center"
                      title="Move Down"
                    >
                      <Move className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (contextMenu.field) {
                          setSelectedField(contextMenu.field)
                          moveField('right', 10, contextMenu.field)
                          setContextMenu(null)
                        }
                      }}
                      className="p-2 hover:bg-gray-100 rounded flex items-center justify-center"
                      title="Move Right"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Configuration */}
          <div className="lg:col-span-4 space-y-6">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quick Move (10px)</label>
                    <div className="grid grid-cols-3 gap-1">
                      <div></div>
                      <button
                        onClick={() => moveField('up', 10, selectedField)}
                        className="p-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <div></div>
                      <button
                        onClick={() => moveField('left', 10, selectedField)}
                        className="p-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center"
                        title="Move Left"
                      >
                        <ArrowLeftIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveField('down', 10, selectedField)}
                        className="p-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center"
                        title="Move Down"
                      >
                        <Move className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveField('right', 10, selectedField)}
                        className="p-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center"
                        title="Move Right"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quick Move (10px)</label>
                    <div className="grid grid-cols-3 gap-1">
                      <div></div>
                      <button
                        onClick={() => moveField('up', 10, 'qr_code')}
                        className="p-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <div></div>
                      <button
                        onClick={() => moveField('left', 10, 'qr_code')}
                        className="p-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center"
                        title="Move Left"
                      >
                        <ArrowLeftIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveField('down', 10, 'qr_code')}
                        className="p-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center"
                        title="Move Down"
                      >
                        <Move className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveField('right', 10, 'qr_code')}
                        className="p-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center"
                        title="Move Right"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
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
