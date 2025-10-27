'use client'

import { useState, useRef } from 'react'
import { Upload, Image, FileText, Eye, Edit, X, Check, Bold, Italic, List, ListOrdered, Link, Type, Minus } from 'lucide-react'
import { markdownToHtml } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: number
}

export function RichTextEditor({ value, onChange, placeholder, height = 300 }: RichTextEditorProps) {
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview' | 'split'>('edit')
  const [uploading, setUploading] = useState(false)
  const [lineHeight, setLineHeight] = useState<number>(1.5)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    try {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File terlalu besar. Maksimal 5MB.')
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File harus berupa gambar.')
      }

      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      
      // Generate unique filename with timestamp
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop()
      const fileName = `image_${timestamp}.${fileExtension}`
      const path = `images/${fileName}`
      
      formData.append('path', path)
      
      // Upload to Supabase Storage
      const response = await fetch('/api/forum/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()

      if (!data.url) {
        throw new Error('URL gambar tidak ditemukan')
      }

      // Insert image into textarea
      const textarea = textareaRef.current
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const imageTag = `\n![${file.name}](${data.url})\n`
        const newValue = value.substring(0, start) + imageTag + value.substring(end)
        onChange(newValue)
        
        // Set cursor position after the image
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(start + imageTag.length, start + imageTag.length)
        }, 0)
      }
    } catch (error: any) {
      console.error('Error uploading image:', error)
      alert(`Gagal mengupload gambar: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const insertFormatting = (format: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)

    let newText = ''
    let cursorOffset = 0
    switch (format) {
      case 'bold':
        newText = `**${selectedText}**`
        break
      case 'italic':
        newText = `*${selectedText}*`
        break
      case 'list':
        newText = selectedText.split('\n').map(line => `- ${line}`).join('\n')
        break
      case 'numbered-list':
        newText = selectedText.split('\n').map((line, index) => `${index + 1}. ${line}`).join('\n')
        break
      case 'spacing':
        newText = selectedText ? `\n\n${selectedText}\n\n` : '\n\n'
        break
      case 'link':
        newText = `[${selectedText}](url)`
        break
      case 'h1':
        newText = `# ${selectedText || 'Heading 1'}\n`
        cursorOffset = 2
        break
      case 'h2':
        newText = `## ${selectedText || 'Heading 2'}\n`
        cursorOffset = 3
        break
      case 'h3':
        newText = `### ${selectedText || 'Heading 3'}\n`
        cursorOffset = 4
        break
      default:
        newText = selectedText
    }

    const newValue = value.substring(0, start) + newText + value.substring(end)
    onChange(newValue)
    
    setTimeout(() => {
      textarea.focus()
      if (format === 'bold' || format === 'italic') {
        textarea.setSelectionRange(start + 2, start + 2 + selectedText.length)
      } else if (format === 'link') {
        textarea.setSelectionRange(start + newText.length - 4, start + newText.length - 1)
      } else if (['h1', 'h2', 'h3'].includes(format)) {
        // For headings, select the text part
        const cursorPosition = start + cursorOffset
        const headingLength = selectedText ? selectedText.length : 9 // 'Heading X' length
        textarea.setSelectionRange(cursorPosition, cursorPosition + headingLength)
      }
    }, 0)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file)
    }
  }

  const renderPreview = () => {
    if (!value.trim()) {
      return (
        <div className="flex items-center justify-center h-32 text-gray-400">
          <div className="text-center">
            <FileText className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Tidak ada konten untuk dipreview</p>
          </div>
        </div>
      )
    }

    // Use the markdown to HTML conversion utility
    const htmlContent = markdownToHtml(value)

    return (
      <div 
        className="prose prose-sm max-w-none p-4 bg-white rounded-lg border min-h-[200px]"
        style={{ lineHeight: `${lineHeight}` }}
      >
        <style jsx>{`
          div :global(h1) {
            font-size: 2em;
            font-weight: bold;
            margin-top: 0.67em;
            margin-bottom: 0.67em;
            color: #1f2937;
          }
          div :global(h2) {
            font-size: 1.5em;
            font-weight: bold;
            margin-top: 0.83em;
            margin-bottom: 0.83em;
            color: #1f2937;
          }
          div :global(h3) {
            font-size: 1.17em;
            font-weight: bold;
            margin-top: 1em;
            margin-bottom: 1em;
            color: #1f2937;
          }
          div :global(p) {
            margin-bottom: 1em;
            line-height: 1.5;
          }
          div :global(p:last-child) {
            margin-bottom: 0;
          }
        `}</style>
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </div>
    )
  }

  const renderEditor = () => (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1 items-center">
        <button
          onClick={() => insertFormatting('h1')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Heading 1"
        >
          <span className="text-sm font-bold">H1</span>
        </button>
        <button
          onClick={() => insertFormatting('h2')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Heading 2"
        >
          <span className="text-sm font-semibold">H2</span>
        </button>
        <button
          onClick={() => insertFormatting('h3')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Heading 3"
        >
          <span className="text-sm font-medium">H3</span>
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <button
          onClick={() => insertFormatting('bold')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertFormatting('italic')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertFormatting('list')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertFormatting('numbered-list')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <button
          onClick={() => insertFormatting('spacing')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Add Spacing"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertFormatting('link')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Link"
        >
          <Link className="w-4 h-4" />
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Insert Image"
        >
          <Image className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <div className="flex items-center gap-2 px-2">
          <span className="text-xs text-gray-600">Line Height:</span>
          <select
            value={lineHeight}
            onChange={(e) => setLineHeight(parseFloat(e.target.value))}
            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value={1}>1 (Rapat)</option>
            <option value={1.25}>1.25</option>
            <option value={1.5}>1.5 (Normal)</option>
            <option value={1.75}>1.75</option>
            <option value={2}>2 (Renggang)</option>
          </select>
        </div>
      </div>
      
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-4 border-0 resize-none focus:ring-0 focus:outline-none font-mono text-sm"
        style={{ height: `${height - 60}px`, lineHeight: `${lineHeight}` }}
      />
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header with Preview Toggle */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Konten Materi <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Mode:</span>
          <div className="flex bg-white rounded-lg border overflow-hidden">
            <button
              onClick={() => setPreviewMode('edit')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                previewMode === 'edit' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Edit className="w-3 h-3 inline mr-1" />
              Edit
            </button>
            <button
              onClick={() => setPreviewMode('split')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                previewMode === 'split' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Split
            </button>
            <button
              onClick={() => setPreviewMode('preview')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                previewMode === 'preview' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Eye className="w-3 h-3 inline mr-1" />
              Preview
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {previewMode === 'edit' && (
        <div>
          {renderEditor()}
          <p className="text-xs text-gray-500 mt-1">
            Gunakan toolbar untuk formatting, insert gambar, dan lainnya
          </p>
        </div>
      )}

      {previewMode === 'preview' && (
        <div>
          {renderPreview()}
          <p className="text-xs text-gray-500 mt-1">
            Preview konten yang akan ditampilkan kepada siswa
          </p>
        </div>
      )}

      {previewMode === 'split' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Edit className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Editor</span>
            </div>
            {renderEditor()}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Preview</span>
            </div>
            {renderPreview()}
          </div>
        </div>
      )}

      {/* Upload Status */}
      {uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-700">Mengupload gambar...</span>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-xs font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Fitur Editor
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-blue-800">
          <div>
            <p><strong>Toolbar:</strong> Bold, italic, list, link</p>
            <p><strong>Headers:</strong> <code className="bg-blue-100 px-1 rounded"># H1</code>, <code className="bg-blue-100 px-1 rounded">## H2</code>, <code className="bg-blue-100 px-1 rounded">### H3</code></p>
            <p><strong>Bullet Lists:</strong> <code className="bg-blue-100 px-1 rounded">- item</code> (bullets)</p>
            <p><strong>Numbered Lists:</strong> <code className="bg-blue-100 px-1 rounded">1. item</code> (numbers)</p>
          </div>
          <div>
            <p><strong>Images:</strong> Klik tombol gambar untuk upload</p>
            <p><strong>Links:</strong> <code className="bg-blue-100 px-1 rounded">[text](url)</code></p>
            <p><strong>Preview:</strong> Lihat hasil render real-time</p>
          </div>
        </div>
      </div>
    </div>
  )
}

