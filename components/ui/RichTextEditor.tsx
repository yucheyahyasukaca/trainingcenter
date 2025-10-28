'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, Image, FileText, Eye, Edit, X, Check, Bold, Italic, List, ListOrdered, Link, Type, Minus } from 'lucide-react'
import { markdownToHtml } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: number
}

export function RichTextEditor({ value, onChange, placeholder, height = 300 }: RichTextEditorProps) {
  const [wysiwygMode, setWysiwygMode] = useState<boolean>(true)
  const [uploading, setUploading] = useState(false)
  const [lineHeight, setLineHeight] = useState<number>(1.5)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const isUpdatingContent = useRef<boolean>(false)

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File terlalu besar. Maksimal 5MB.')
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('File harus berupa gambar.')
      }

      const formData = new FormData()
      formData.append('file', file)
      
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop()
      const fileName = `image_${timestamp}.${fileExtension}`
      const path = `images/${fileName}`
      
      formData.append('path', path)
      
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

      // Insert image into WYSIWYG editor
      if (wysiwygMode && editorRef.current) {
        editorRef.current?.focus()
        const selection = window.getSelection()
        const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null
        
        if (range) {
          const img = document.createElement('img')
          img.src = data.url
          img.alt = file.name
          img.style.maxWidth = '100%'
          img.style.height = 'auto'
          img.style.display = 'block'
          img.style.margin = '10px 0'
          
          range.deleteContents()
          range.insertNode(img)
          
          // Move cursor after image
          range.setStartAfter(img)
          range.collapse(true)
          selection.removeAllRanges()
          selection.addRange(range)
        }
        
        handleContentChange()
      }
    } catch (error: any) {
      console.error('Error uploading image:', error)
      alert(`Gagal mengupload gambar: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  // Convert markdown to HTML for display
  const convertMarkdownToHTML = (markdown: string): string => {
    if (!markdown) return ''
    return markdownToHtml(markdown)
  }

  // Convert HTML back to markdown (simplified)
  const convertHTMLToMarkdown = (html: string): string => {
    if (!html) return ''
    
    let markdown = html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      .replace(/<ul[^>]*>/gi, '\n')
      .replace(/<\/ul>/gi, '\n')
      .replace(/<ol[^>]*>/gi, '\n')
      .replace(/<\/ol>/gi, '\n')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<p[^>]*><br\s*\/?><\/p>/gi, '\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
    
    return markdown.trim()
  }

  // Initialize editor content on mount
  useEffect(() => {
    if (editorRef.current && wysiwygMode) {
      const htmlContent = convertMarkdownToHTML(value)
      if (!editorRef.current.innerHTML || editorRef.current.innerHTML === '<p><br></p>') {
        editorRef.current.innerHTML = htmlContent || '<p><br></p>'
      }
    }
  }, [wysiwygMode])
  
  // Update editor content when value prop changes from outside
  useEffect(() => {
    if (!isUpdatingContent.current && editorRef.current && wysiwygMode) {
      const htmlContent = convertMarkdownToHTML(value)
      const currentHtml = editorRef.current.innerHTML
      
      // Only update if content changed (not from user input)
      if (htmlContent && currentHtml.trim() !== htmlContent.trim()) {
        const selection = window.getSelection()
        const savedRange = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null
        
        editorRef.current.innerHTML = htmlContent || '<p><br></p>'
        
        // Try to restore cursor position
        if (savedRange) {
          try {
            selection?.removeAllRanges()
            selection?.addRange(savedRange)
          } catch (e) {
            // Cursor restoration failed, ignore
          }
        }
      } else if (!htmlContent && currentHtml.trim() && currentHtml !== '<p><br></p>') {
          editorRef.current.innerHTML = '<p><br></p>'
        }
    }
  }, [value])

  // Handle content change in WYSIWYG mode
  const handleContentChange = () => {
    if (!editorRef.current || isUpdatingContent.current) return
    
    isUpdatingContent.current = true
    const htmlContent = editorRef.current.innerHTML
    
    // Convert HTML to markdown
    const markdownContent = convertHTMLToMarkdown(htmlContent)
    
    // Only update if changed
    if (markdownContent !== value) {
      onChange(markdownContent)
    }
    
    setTimeout(() => {
      isUpdatingContent.current = false
    }, 50)
  }

  // Formatting commands for WYSIWYG
  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    setTimeout(() => handleContentChange(), 100)
  }

  const handleFormat = (format: string) => {
    if (wysiwygMode && editorRef.current) {
      editorRef.current.focus()
      
      switch (format) {
        case 'bold':
          executeCommand('bold')
          break
        case 'italic':
          executeCommand('italic')
          break
        case 'h1':
          executeCommand('formatBlock', '<h1>')
          handleContentChange()
          break
        case 'h2':
          executeCommand('formatBlock', '<h2>')
          handleContentChange()
          break
        case 'h3':
          executeCommand('formatBlock', '<h3>')
          handleContentChange()
          break
        case 'list':
          executeCommand('insertUnorderedList')
          handleContentChange()
          break
        case 'numbered-list':
          executeCommand('insertOrderedList')
          handleContentChange()
          break
        case 'link':
          const url = prompt('Masukkan URL:', 'https://')
          if (url) {
            executeCommand('createLink', url)
            handleContentChange()
          }
          break
        case 'spacing':
          executeCommand('insertParagraph')
          handleContentChange()
          break
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Paste handler to clean HTML
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    
    if (editorRef.current) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        
        const textNode = document.createTextNode(text)
        range.insertNode(textNode)
        
        range.setStartAfter(textNode)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
        
        handleContentChange()
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Konten Materi <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={() => setWysiwygMode(!wysiwygMode)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
        >
          {wysiwygMode ? (
            <>
              <Edit className="w-3 h-3" />
              Mode Edit
            </>
          ) : (
            <>
              <Eye className="w-3 h-3" />
              Mode Preview
            </>
          )}
        </button>
      </div>

      <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
        {/* Toolbar */}
        <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1 items-center">
          <button
            type="button"
            onClick={() => handleFormat('h1')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Heading 1"
          >
            <span className="text-sm font-bold">H1</span>
          </button>
          <button
            type="button"
            onClick={() => handleFormat('h2')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Heading 2"
          >
            <span className="text-sm font-semibold">H2</span>
          </button>
          <button
            type="button"
            onClick={() => handleFormat('h3')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Heading 3"
          >
            <span className="text-sm font-medium">H3</span>
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          <button
            type="button"
            onClick={() => handleFormat('bold')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormat('italic')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormat('list')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormat('numbered-list')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          <button
            type="button"
            onClick={() => handleFormat('spacing')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Add Line Break"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormat('link')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Insert Link"
          >
            <Link className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Insert Image"
            disabled={uploading}
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
        
        {/* WYSIWYG Editor - Contenteditable Div */}
        <div className="relative">
          <style jsx>{`
            :global(div[contenteditable] h1) {
              font-size: 2em;
              font-weight: bold;
              margin-top: 0.67em;
              margin-bottom: 0.67em;
              color: #1f2937;
              line-height: 1.2;
            }
            :global(div[contenteditable] h2) {
              font-size: 1.5em;
              font-weight: bold;
              margin-top: 0.83em;
              margin-bottom: 0.83em;
              color: #1f2937;
              line-height: 1.3;
            }
            :global(div[contenteditable] h3) {
              font-size: 1.25em;
              font-weight: bold;
              margin-top: 1em;
              margin-bottom: 0.5em;
              color: #1f2937;
              line-height: 1.4;
            }
            :global(div[contenteditable] p) {
              margin-bottom: 1em;
            }
            :global(div[contenteditable] ul),
            :global(div[contenteditable] ol) {
              padding-left: 1.5em;
              margin-bottom: 1em;
            }
            :global(div[contenteditable] li) {
              margin-bottom: 0.5em;
            }
            :global(div[contenteditable] img) {
              max-width: 100%;
              height: auto;
              margin: 10px 0;
              display: block;
            }
            :global(div[contenteditable] a) {
              color: #3b82f6;
              text-decoration: underline;
            }
            :global(div[contenteditable] a:hover) {
              color: #2563eb;
            }
            :global(div[contenteditable] strong) {
              font-weight: bold;
            }
            :global(div[contenteditable] em) {
              font-style: italic;
            }
          `}</style>
          <div
            ref={editorRef}
            contentEditable
            onInput={handleContentChange}
            onPaste={handlePaste}
            onBlur={handleContentChange}
            className="w-full p-4 min-h-[400px] focus:outline-none overflow-y-auto text-gray-900"
            style={{ 
              height: `${height - 60}px`, 
              lineHeight: `${lineHeight}`,
            }}
            suppressContentEditableWarning={true}
            data-placeholder={placeholder || 'Tuliskan konten materi di sini...'}
          />
          
          {!value && !editorRef.current?.textContent && (
            <div 
              className="absolute top-4 left-4 pointer-events-none text-gray-400"
              style={{ lineHeight: `${lineHeight}` }}
            >
              {placeholder || 'Tuliskan konten materi di sini...'}
            </div>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-700">Mengupload gambar...</span>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Gunakan toolbar untuk formatting, insert gambar, dan lainnya. Konten langsung terlihat seperti yang akan dilihat siswa.
      </p>
    </div>
  )
}
