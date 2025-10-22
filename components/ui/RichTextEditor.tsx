'use client'

import { useState, useRef } from 'react'
import { Upload, Image, FileText, Eye, Edit, X, Check, Bold, Italic, List, Link } from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: number
}

export function RichTextEditor({ value, onChange, placeholder, height = 300 }: RichTextEditorProps) {
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview' | 'split'>('edit')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      
      // Upload to Supabase Storage or your preferred storage service
      const { data, error } = await fetch('/api/forum/upload', {
        method: 'POST',
        body: formData,
      }).then(res => res.json())

      if (error) throw error

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
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Gagal mengupload gambar')
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
      case 'link':
        newText = `[${selectedText}](url)`
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

    // Simple markdown to HTML conversion
    const htmlContent = value
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>')
      .replace(/!\[([^\]]*)\]\(([^)]*)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-2" />')
      .replace(/\[([^\]]*)\]\(([^)]*)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:underline">$1</a>')
      .replace(/\n/g, '<br />')

    return (
      <div 
        className="prose prose-sm max-w-none p-4 bg-white rounded-lg border min-h-[200px]"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    )
  }

  const renderEditor = () => (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
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
          title="List"
        >
          <List className="w-4 h-4" />
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
      </div>
      
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-4 border-0 resize-none focus:ring-0 focus:outline-none font-mono text-sm"
        style={{ height: `${height - 60}px` }}
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Fitur Editor:</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-700">
          <div>
            <p>• <strong>Toolbar:</strong> Bold, italic, list, link</p>
            <p>• <strong>Headers:</strong> # H1, ## H2, ### H3</p>
            <p>• <strong>Lists:</strong> - untuk bullet list</p>
          </div>
          <div>
            <p>• <strong>Images:</strong> Klik tombol gambar untuk upload</p>
            <p>• <strong>Links:</strong> [text](url)</p>
            <p>• <strong>Preview:</strong> Lihat hasil render real-time</p>
          </div>
        </div>
      </div>
    </div>
  )
}

