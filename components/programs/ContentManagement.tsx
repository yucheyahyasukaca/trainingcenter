'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Plus, Edit, Trash2, Video, FileText, HelpCircle, File, 
  ChevronUp, ChevronDown, Eye, Upload, PlayCircle, EyeOff
} from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'

interface LearningContent {
  id: string
  created_at: string
  updated_at: string
  class_id: string
  created_by: string | null
  title: string
  description: string | null
  content_type: 'video' | 'text' | 'quiz' | 'document' | 'assignment'
  content_data: any
  order_index: number
  is_free: boolean
  status: 'draft' | 'published' | 'archived'
  is_required: boolean
  estimated_duration: number | null
  parent_id?: string | null
  material_type: 'main' | 'sub'
  level: number
  is_expanded: boolean
  sub_materials?: LearningContent[]
}

interface ContentManagementProps {
  classId: string
  className: string
  programId: string
}

export function ContentManagement({ classId, className, programId }: ContentManagementProps) {
  const { profile } = useAuth()
  const [contents, setContents] = useState<LearningContent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContents()
  }, [classId])

  async function fetchContents() {
    try {
      // Use the hierarchical function to get structured data
      const { data, error } = await supabase
        .rpc('get_content_hierarchy', { class_uuid: classId } as any)

      if (error) throw error
      
      // Organize data into hierarchical structure
      const hierarchicalData = organizeHierarchicalData(data || [])
      setContents(hierarchicalData)
    } catch (error) {
      console.error('Error fetching contents:', error)
    } finally {
      setLoading(false)
    }
  }

  function organizeHierarchicalData(data: LearningContent[]): LearningContent[] {
    const mainMaterials: LearningContent[] = []
    const subMaterialsMap = new Map<string, LearningContent[]>()
    
    // Separate main materials and sub materials
    data.forEach(item => {
      if (item.material_type === 'main') {
        mainMaterials.push({ ...item, sub_materials: [] })
      } else if (item.parent_id) {
        if (!subMaterialsMap.has(item.parent_id)) {
          subMaterialsMap.set(item.parent_id, [])
        }
        subMaterialsMap.get(item.parent_id)!.push(item)
      }
    })
    
    // Attach sub materials to their parents
    mainMaterials.forEach(main => {
      const subMaterials = subMaterialsMap.get(main.id) || []
      main.sub_materials = subMaterials.sort((a, b) => a.order_index - b.order_index)
    })
    
    return mainMaterials.sort((a, b) => a.order_index - b.order_index)
  }




  async function handleDeleteContent(id: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus materi ini?')) return

    try {
      const { error } = await supabase
        .from('learning_contents')
        .delete()
        .eq('id', id)

      if (error) throw error
      setContents(contents.filter(c => c.id !== id))
    } catch (error) {
      console.error('Error deleting content:', error)
      alert('Gagal menghapus materi')
    }
  }

  async function handleReorder(id: string, direction: 'up' | 'down') {
    const index = contents.findIndex(c => c.id === id)
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === contents.length - 1)
    ) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    const newContents = [...contents]
    const temp = newContents[index]
    newContents[index] = newContents[newIndex]
    newContents[newIndex] = temp

    // Update order_index in database
    try {
      await Promise.all([
        (supabase as any)
          .from('learning_contents')
          .update({ order_index: newIndex })
          .eq('id', id),
        (supabase as any)
          .from('learning_contents')
          .update({ order_index: index })
          .eq('id', newContents[index].id)
      ])

      setContents(newContents.map((c, i) => ({ ...c, order_index: i })))
    } catch (error) {
      console.error('Error reordering:', error)
    }
  }



  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5 text-red-500" />
      case 'text': return <FileText className="w-5 h-5 text-blue-500" />
      case 'quiz': return <HelpCircle className="w-5 h-5 text-green-500" />
      case 'document': return <File className="w-5 h-5 text-purple-500" />
      case 'assignment': return <Upload className="w-5 h-5 text-orange-500" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700',
      published: 'bg-green-100 text-green-700',
      archived: 'bg-red-100 text-red-700'
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${styles[status as keyof typeof styles]}`}>
        {status === 'draft' ? 'Draft' : status === 'published' ? 'Published' : 'Archived'}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Materi Pembelajaran</h2>
          <p className="text-sm text-gray-600 mt-1">Kelola video, teks, quiz, dan dokumen untuk kelas {className}</p>
        </div>
        <Link
          href={`/programs/${programId}/classes/${classId}/content/new`}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Tambah Materi</span>
          <span className="sm:hidden">Tambah</span>
        </Link>
      </div>

      {/* Content List */}
      {contents.length === 0 ? (
        <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg px-4">
          <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-sm sm:text-base">Belum ada materi pembelajaran</p>
          <Link
            href={`/programs/${programId}/classes/${classId}/content/new`}
            className="mt-4 text-primary-600 hover:text-primary-700 font-medium text-sm sm:text-base"
          >
            Tambah materi pertama
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {contents.map((content, index) => (
            <div key={content.id} className="space-y-2">
              {/* Main Material */}
              <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-1 flex-shrink-0">
                      {getContentIcon(content.content_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">{content.title}</h3>
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          {getStatusBadge(content.status)}
                          {content.is_free && (
                            <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">
                              Gratis
                            </span>
                          )}
                          {content.is_required && (
                            <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-700">
                              Wajib
                            </span>
                          )}
                        </div>
                      </div>
                      {content.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{content.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="capitalize">{content.content_type}</span>
                        {content.estimated_duration && (
                          <span>{content.estimated_duration} menit</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Main Material Actions */}
                  <div className="flex items-center justify-end gap-1 sm:gap-2 flex-wrap">
                    <button
                      onClick={() => handleReorder(content.id, 'up')}
                      disabled={index === 0}
                      className={`p-2 rounded hover:bg-gray-100 ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                      title="Pindah ke atas"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReorder(content.id, 'down')}
                      disabled={index === contents.length - 1}
                      className={`p-2 rounded hover:bg-gray-100 ${index === contents.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                      title="Pindah ke bawah"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <Link
                      href={`/programs/${programId}/classes/${classId}/content/new?parent=${content.id}`}
                      className="p-2 rounded hover:bg-gray-100 text-green-600"
                      title="Tambah Sub Materi"
                    >
                      <Plus className="w-4 h-4" />
                    </Link>
                    <a
                      href={`/learn/${programId}/${classId}?content=${content.id}`}
                      target="_blank"
                      className="p-2 rounded hover:bg-gray-100"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                    {content.content_type === 'quiz' && (
                      <a
                        href={`/programs/${programId}/classes/${classId}/content/${content.id}/quiz`}
                        className="p-2 rounded hover:bg-gray-100 text-green-600"
                        title="Kelola Quiz"
                      >
                        <HelpCircle className="w-4 h-4" />
                      </a>
                    )}
                    <Link
                      href={`/programs/${programId}/classes/${classId}/content/${content.id}/edit`}
                      className="p-2 rounded hover:bg-gray-100 text-blue-600"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDeleteContent(content.id)}
                      className="p-2 rounded hover:bg-gray-100 text-red-600"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Sub Materials */}
              {content.sub_materials && content.sub_materials.length > 0 && (
                <div className="ml-3 sm:ml-6 space-y-2">
                  {content.sub_materials.map((subMaterial, subIndex) => (
                    <div
                      key={subMaterial.id}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className="mt-1 flex-shrink-0">
                            {getContentIcon(subMaterial.content_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                              <h4 className="font-medium text-gray-800 text-sm sm:text-base truncate">{subMaterial.title}</h4>
                              <div className="flex flex-wrap gap-1">
                                {getStatusBadge(subMaterial.status)}
                                {subMaterial.is_free && (
                                  <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">
                                    Gratis
                                  </span>
                                )}
                                {subMaterial.is_required && (
                                  <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-700">
                                    Wajib
                                  </span>
                                )}
                              </div>
                            </div>
                            {subMaterial.description && (
                              <p className="text-xs sm:text-sm text-gray-600 mb-1 line-clamp-2">{subMaterial.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="capitalize">{subMaterial.content_type}</span>
                              {subMaterial.estimated_duration && (
                                <span>{subMaterial.estimated_duration} menit</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Sub Material Actions */}
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          <button
                            onClick={() => handleReorder(subMaterial.id, 'up')}
                            disabled={subIndex === 0}
                            className={`p-1 rounded hover:bg-gray-200 ${subIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                            title="Pindah ke atas"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleReorder(subMaterial.id, 'down')}
                            disabled={subIndex === content.sub_materials!.length - 1}
                            className={`p-1 rounded hover:bg-gray-200 ${subIndex === content.sub_materials!.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                            title="Pindah ke bawah"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <a
                            href={`/learn/${programId}/${classId}?content=${subMaterial.id}`}
                            target="_blank"
                            className="p-1 rounded hover:bg-gray-200"
                            title="Preview"
                          >
                            <Eye className="w-3 h-3" />
                          </a>
                          {subMaterial.content_type === 'quiz' && (
                            <a
                              href={`/programs/${programId}/classes/${classId}/content/${subMaterial.id}/quiz`}
                              className="p-1 rounded hover:bg-gray-200 text-green-600"
                              title="Kelola Quiz"
                            >
                              <HelpCircle className="w-3 h-3" />
                            </a>
                          )}
                          <Link
                            href={`/programs/${programId}/classes/${classId}/content/${subMaterial.id}/edit`}
                            className="p-1 rounded hover:bg-gray-200 text-blue-600"
                            title="Edit"
                          >
                            <Edit className="w-3 h-3" />
                          </Link>
                          <button
                            onClick={() => handleDeleteContent(subMaterial.id)}
                            className="p-1 rounded hover:bg-gray-200 text-red-600"
                            title="Hapus"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}



    </div>
  )
}




