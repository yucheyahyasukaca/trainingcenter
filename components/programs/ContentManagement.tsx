'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Plus, Edit, Trash2, Video, FileText, HelpCircle, File, 
  X, Save, ChevronUp, ChevronDown, Eye, Upload, PlayCircle 
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
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingContent, setEditingContent] = useState<LearningContent | null>(null)

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


  async function handleUpdateContent() {
    if (!editingContent) return

    try {
      const { error } = await (supabase as any)
        .from('learning_contents')
        .update({
          title: editingContent.title,
          description: editingContent.description,
          content_type: editingContent.content_type,
          content_data: editingContent.content_data,
          is_free: editingContent.is_free,
          status: editingContent.status,
          is_required: editingContent.is_required,
          estimated_duration: editingContent.estimated_duration,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingContent.id)

      if (error) throw error

      setContents(contents.map(c => 
        c.id === editingContent.id ? editingContent : c
      ))
      setShowEditModal(false)
      setEditingContent(null)
    } catch (error) {
      console.error('Error updating content:', error)
      alert('Gagal mengupdate materi')
    }
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


  function openEditModal(content: LearningContent) {
    setEditingContent(content)
    setShowEditModal(true)
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
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="p-2 rounded hover:bg-gray-100 text-green-600"
                      title="Tambah Sub Materi"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <a
                      href={`/learn/${programId}/${classId}?content=${content.id}`}
                      target="_blank"
                      className="p-2 rounded hover:bg-gray-100"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => openEditModal(content)}
                      className="p-2 rounded hover:bg-gray-100 text-blue-600"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
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
                          <button
                            onClick={() => openEditModal(subMaterial)}
                            className="p-1 rounded hover:bg-gray-200 text-blue-600"
                            title="Edit"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
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


      {/* Edit Content Modal */}
      {showEditModal && editingContent && (
        <ContentFormModal
          content={editingContent}
          onSave={handleUpdateContent}
          onClose={() => {
            setShowEditModal(false)
            setEditingContent(null)
          }}
          title="Edit Materi"
          onChange={(content) => setEditingContent(content as LearningContent)}
          selectedParentId={editingContent.parent_id || null}
          setSelectedParentId={(id) => setEditingContent({ ...editingContent, parent_id: id })}
          contents={contents}
        />
      )}
    </div>
  )
}

// Content Form Modal Component
interface ContentFormModalProps {
  content: Partial<LearningContent>
  onSave: () => void
  onClose: () => void
  title: string
  onChange: (content: Partial<LearningContent>) => void
  selectedParentId: string | null
  setSelectedParentId: (id: string | null) => void
  contents: LearningContent[]
}

function ContentFormModal({ content, onSave, onClose, title, onChange, selectedParentId, setSelectedParentId, contents }: ContentFormModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Material Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis Materi <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="materialType"
                  value="main"
                  checked={selectedParentId === null}
                  onChange={() => setSelectedParentId(null)}
                  className="mr-2"
                />
                <span className="text-sm">Materi Utama</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="materialType"
                  value="sub"
                  checked={selectedParentId !== null}
                  onChange={() => setSelectedParentId('')}
                  className="mr-2"
                />
                <span className="text-sm">Sub Materi</span>
              </label>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Judul Materi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={content.title || ''}
              onChange={(e) => onChange({ ...content, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Contoh: Pengenalan Python"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi
            </label>
            <textarea
              value={content.description || ''}
              onChange={(e) => onChange({ ...content, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Deskripsi singkat tentang materi ini..."
            />
          </div>

          {/* Parent Material Selection (only for sub-materials) */}
          {selectedParentId !== null && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Materi Induk
              </label>
              <select
                value={selectedParentId || ''}
                onChange={(e) => setSelectedParentId(e.target.value || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Pilih Materi Induk</option>
                {contents.map((mainContent) => (
                  <option key={mainContent.id} value={mainContent.id}>
                    {mainContent.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Content Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipe Konten <span className="text-red-500">*</span>
            </label>
            <select
              value={content.content_type || 'text'}
              onChange={(e) => onChange({ ...content, content_type: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="text">📝 Teks / Artikel</option>
              <option value="video">🎥 Video</option>
              <option value="quiz">❓ Quiz / Kuis</option>
              <option value="document">📄 Dokumen (PDF, PPT, dll)</option>
              <option value="assignment">📋 Tugas / Assignment</option>
            </select>
          </div>

          {/* Content Data based on type */}
          <ContentDataForm 
            contentType={content.content_type || 'text'}
            contentData={content.content_data || {}}
            onChange={(data) => onChange({ ...content, content_data: data })}
          />

          {/* Estimated Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimasi Durasi (menit)
            </label>
            <input
              type="number"
              value={content.estimated_duration || 10}
              onChange={(e) => onChange({ ...content, estimated_duration: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              min="1"
            />
          </div>

          {/* Settings Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={content.status || 'draft'}
                onChange={(e) => onChange({ ...content, status: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Is Required */}
            <div className="flex items-center justify-center sm:justify-start">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={content.is_required || false}
                  onChange={(e) => onChange({ ...content, is_required: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">Materi Wajib</span>
              </label>
            </div>

            {/* Is Free */}
            <div className="flex items-center justify-center sm:justify-start sm:col-span-2 lg:col-span-1">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={content.is_free || false}
                  onChange={(e) => onChange({ ...content, is_free: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">Akses Gratis</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium"
          >
            Batal
          </button>
          <button
            onClick={onSave}
            disabled={!content.title}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            <Save className="w-4 h-4" />
            Simpan
          </button>
        </div>
      </div>
    </div>
  )
}

// Content Data Form based on content type
interface ContentDataFormProps {
  contentType: string
  contentData: any
  onChange: (data: any) => void
}

function ContentDataForm({ contentType, contentData, onChange }: ContentDataFormProps) {
  switch (contentType) {
    case 'video':
      return (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL Video <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={contentData?.video_url || ''}
              onChange={(e) => onChange({ ...contentData, video_url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="https://youtube.com/watch?v=..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Support: YouTube, Vimeo, atau URL direct video
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thumbnail URL (optional)
            </label>
            <input
              type="url"
              value={contentData?.thumbnail || ''}
              onChange={(e) => onChange({ ...contentData, thumbnail: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Durasi Video (detik)
            </label>
            <input
              type="number"
              value={contentData?.duration || 0}
              onChange={(e) => onChange({ ...contentData, duration: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              min="0"
            />
          </div>
        </div>
      )

    case 'text':
      return (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Konten Teks <span className="text-red-500">*</span>
            </label>
            <textarea
              value={contentData?.body || ''}
              onChange={(e) => onChange({ ...contentData, body: e.target.value })}
              rows={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              placeholder="Tulis konten pembelajaran di sini... (Markdown supported)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Gunakan Markdown untuk formatting (bold, italic, list, dll)
            </p>
          </div>
        </div>
      )

    case 'document':
      return (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL Dokumen <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={contentData?.file_url || ''}
              onChange={(e) => onChange({ ...contentData, file_url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipe File
            </label>
            <select
              value={contentData?.file_type || 'pdf'}
              onChange={(e) => onChange({ ...contentData, file_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="pdf">PDF</option>
              <option value="pptx">PowerPoint</option>
              <option value="docx">Word Document</option>
              <option value="xlsx">Excel</option>
              <option value="other">Lainnya</option>
            </select>
          </div>
        </div>
      )

    case 'quiz':
      return (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            ℹ️ Quiz/Kuis akan dikonfigurasi setelah materi disimpan.
            Anda bisa menambahkan pertanyaan dan opsi jawaban di halaman edit.
          </p>
        </div>
      )

    case 'assignment':
      return (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instruksi Tugas <span className="text-red-500">*</span>
            </label>
            <textarea
              value={contentData?.instructions || ''}
              onChange={(e) => onChange({ ...contentData, instructions: e.target.value })}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Jelaskan apa yang harus dikerjakan siswa..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deadline (optional)
            </label>
            <input
              type="datetime-local"
              value={contentData?.deadline || ''}
              onChange={(e) => onChange({ ...contentData, deadline: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maksimal Skor
            </label>
            <input
              type="number"
              value={contentData?.max_score || 100}
              onChange={(e) => onChange({ ...contentData, max_score: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              min="1"
            />
          </div>
        </div>
      )

    default:
      return null
  }
}

