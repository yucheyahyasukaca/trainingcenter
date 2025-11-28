'use client'

import { useRef, useImperativeHandle, forwardRef, useEffect, useState } from 'react'
import 'react-quill/dist/quill.snow.css'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  variant?: 'default' | 'email' // Add variant prop to distinguish email templates
  height?: number // Height in pixels for the editor
}

export interface RichTextEditorRef {
  insertText: (text: string) => void
  insertHTML: (html: string) => void
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  function RichTextEditor({ value, onChange, placeholder, variant = 'default', height = 256 }, ref) {
    const quillRef = useRef<any>(null)
    const [ReactQuill, setReactQuill] = useState<any>(null)

    // Load ReactQuill on client side only
    useEffect(() => {
      import('react-quill').then((mod) => {
        setReactQuill(() => mod.default)
      })
    }, [])

    useImperativeHandle(ref, () => ({
      insertText: (text: string) => {
        if (quillRef.current) {
          try {
            const editor = quillRef.current.getEditor()
            const selection = editor.getSelection()
            const index = selection ? selection.index : editor.getLength()
            editor.insertText(index, text)
            editor.setSelection(index + text.length)
            console.log('✓ Text inserted:', text)
          } catch (error) {
            console.error('Error inserting text:', error)
          }
        } else {
          console.error('Quill ref is null')
        }
      },
      insertHTML: (html: string) => {
        console.log('📝 insertHTML called with:', html.substring(0, 100) + '...')
        
        // Simple approach: directly append HTML to current value
        // This preserves all inline styles in the stored HTML
        // Even if Quill editor doesn't show them perfectly, they'll be in the email
        const currentValue = value || ''
        const newValue = currentValue + html
        
        // Update via onChange - this ensures HTML is stored correctly
        onChange(newValue)
        
        // After a brief delay, try to update editor display
        if (quillRef.current) {
          setTimeout(() => {
            try {
              const editor = quillRef.current.getEditor()
              // Force editor to show the new content
              const delta = editor.clipboard.convert(newValue)
              editor.setContents(delta, 'silent')
              
              // Move cursor to end
              const length = editor.getLength()
              if (length > 0) {
                editor.setSelection(length - 1, 'silent')
              }
              
              console.log('✅ HTML inserted and editor updated')
            } catch (e) {
              console.error('📝 Error updating editor display:', e)
              // HTML is still stored correctly in value, just display might be off
            }
          }, 100)
        }
        
        console.log('✅ HTML inserted successfully')
      }
    }))

    const modules = {
      toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
        ['link', 'image'],
        ['clean']
      ],
    }

    const formats = [
      'header',
      'bold', 'italic', 'underline', 'strike', 'blockquote',
      'list', 'bullet', 'indent',
      'link', 'image'
    ]

    if (!ReactQuill) {
      return <div className="bg-gray-100 mb-12 rounded flex items-center justify-center text-gray-500" style={{ height: `${height}px` }}>Loading editor...</div>
    }

    return (
      <div className={`bg-white ${variant === 'email' ? 'email-template-editor' : ''}`}>
        {/* Only add CTA button styles for email variant */}
        {variant === 'email' && (
          <style jsx global>{`
            /* CTA Button styles - ONLY for email template editor */
            .email-template-editor .ql-editor a.email-cta-button,
            .email-template-editor .ql-editor a[class*="email-cta-button"] {
              display: inline-block !important;
              padding: 12px 24px !important;
              background-color: #3B82F6 !important;
              color: #ffffff !important;
              text-decoration: none !important;
              border-radius: 6px !important;
              font-weight: 600 !important;
              font-size: 16px !important;
              font-family: Arial, sans-serif !important;
              margin: 10px 0 !important;
              text-align: center !important;
              border: none !important;
              cursor: pointer !important;
            }
            .email-template-editor .ql-editor p.email-cta-container,
            .email-template-editor .ql-editor p[class*="email-cta-container"] {
              text-align: center !important;
              margin: 20px 0 !important;
            }
            /* Also style links that have inline button styles in email editor */
            .email-template-editor .ql-editor a[style*="display: inline-block"][style*="padding"] {
              display: inline-block !important;
              padding: 12px 24px !important;
              background-color: #3B82F6 !important;
              color: #ffffff !important;
              text-decoration: none !important;
              border-radius: 6px !important;
              font-weight: 600 !important;
              font-size: 16px !important;
              margin: 10px 0 !important;
              text-align: center !important;
            }
          `}</style>
        )}
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          className="mb-12"
          style={{ height: `${height}px` }}
        />
      </div>
    )
  }
)
