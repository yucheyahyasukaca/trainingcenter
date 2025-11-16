'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Copy, FileText, Video, HelpCircle, File, Sparkles, Loader2 } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/hooks/useToast'

interface TemplateContent {
  id: string
  title: string
  description: string | null
  content_type: 'video' | 'text' | 'quiz' | 'document' | 'assignment'
  is_required: boolean
  is_free: boolean
  estimated_duration: number | null
  created_by: string | null
  class_id: string
  class_name?: string
  trainer_name?: string
}

interface TemplateMaterialsProps {
  programId: string
  currentClassId: string
  onTemplateCopied?: () => void
}

export function TemplateMaterials({ programId, currentClassId, onTemplateCopied }: TemplateMaterialsProps) {
  const { profile } = useAuth()
  const addToast = useToast()
  const [templates, setTemplates] = useState<TemplateContent[]>([])
  const [loading, setLoading] = useState(true)
  const [copyingId, setCopyingId] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)

  useEffect(() => {
    if (showTemplates) {
      fetchTemplates()
    }
  }, [programId, showTemplates])

  async function fetchTemplates() {
    try {
      setLoading(true)
      
      // Fetch template contents from the same program
      const { data, error } = await supabase
        .from('learning_contents')
        .select(`
          id,
          title,
          description,
          content_type,
          is_required,
          is_free,
          estimated_duration,
          created_by,
          class_id,
          classes!inner(
            id,
            name,
            program_id
          )
        `)
        .eq('program_id', programId)
        .eq('is_template', true)
        .eq('status', 'published')
        .neq('class_id', currentClassId) // Exclude current class
        .eq('material_type', 'main') // Only main materials as templates
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get trainer names
      const trainerIds = [...new Set((data || []).map((t: any) => t.created_by).filter(Boolean))]
      const trainerMap = new Map()
      
      if (trainerIds.length > 0) {
        const { data: trainers } = await supabase
          .from('user_profiles')
          .select('id, full_name')
          .in('id', trainerIds)

        if (trainers) {
          trainers.forEach((t: any) => {
            trainerMap.set(t.id, t.full_name)
          })
        }
      }

      const templatesWithNames = (data || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        content_type: t.content_type,
        is_required: t.is_required,
        is_free: t.is_free,
        estimated_duration: t.estimated_duration,
        created_by: t.created_by,
        class_id: t.class_id,
        class_name: t.classes?.name,
        trainer_name: trainerMap.get(t.created_by) || 'Trainer'
      }))

      setTemplates(templatesWithNames)
    } catch (error) {
      console.error('Error fetching templates:', error)
      addToast.error('Gagal memuat template', 'Error')
    } finally {
      setLoading(false)
    }
  }

  async function copyTemplate(templateId: string) {
    if (!profile?.id) {
      addToast.error('Anda harus login untuk menyalin template', 'Error')
      return
    }

    setCopyingId(templateId)
    try {
      // Use the database function to copy template
      const { data, error } = await supabase.rpc('copy_template_content', {
        p_template_id: templateId,
        p_target_class_id: currentClassId,
        p_created_by: profile.id
      } as any)

      console.log('Copy template result:', { data, error })

      if (error) throw error

      addToast.success('Template berhasil disalin ke kelas ini', 'Berhasil')
      
      if (onTemplateCopied) {
        onTemplateCopied()
      }
      
      // Refresh templates list
      fetchTemplates()
    } catch (error: any) {
      console.error('Error copying template:', error)
      addToast.error(error.message || 'Gagal menyalin template', 'Error')
    } finally {
      setCopyingId(null)
    }
  }

  function getContentIcon(type: string) {
    switch (type) {
      case 'video': return <Video className="w-4 h-4 text-red-500" />
      case 'text': return <FileText className="w-4 h-4 text-blue-500" />
      case 'quiz': return <HelpCircle className="w-4 h-4 text-green-500" />
      case 'document': return <File className="w-4 h-4 text-purple-500" />
      case 'assignment': return <FileText className="w-4 h-4 text-orange-500" />
      default: return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  if (!showTemplates) {
    return (
      <button
        onClick={() => setShowTemplates(true)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        Salin dari Template
      </button>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Template Materi</h3>
        </div>
        <button
          onClick={() => setShowTemplates(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>Belum ada template tersedia untuk program ini</p>
          <p className="text-sm mt-1">Trainer utama dapat menandai materi sebagai template</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {templates.map((template) => (
            <div
              key={template.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {getContentIcon(template.content_type)}
                    <h4 className="font-medium text-gray-900 truncate">{template.title}</h4>
                  </div>
                  {template.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{template.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span>Dari: {template.class_name || 'Kelas'}</span>
                    <span>•</span>
                    <span>Oleh: {template.trainer_name}</span>
                    {template.estimated_duration && (
                      <>
                        <span>•</span>
                        <span>{template.estimated_duration} menit</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => copyTemplate(template.id)}
                  disabled={copyingId === template.id}
                  className="flex-shrink-0 inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {copyingId === template.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyalin...</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

