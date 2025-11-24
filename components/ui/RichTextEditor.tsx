'use client'

import { useRef, useImperativeHandle, forwardRef, useEffect, useState } from 'react'
import 'react-quill/dist/quill.snow.css'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export interface RichTextEditorRef {
  insertText: (text: string) => void
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  function RichTextEditor({ value, onChange, placeholder }, ref) {
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
      return <div className="bg-gray-100 h-64 mb-12 rounded flex items-center justify-center text-gray-500">Loading editor...</div>
    }

    return (
      <div className="bg-white">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          className="h-64 mb-12"
        />
      </div>
    )
  }
)
