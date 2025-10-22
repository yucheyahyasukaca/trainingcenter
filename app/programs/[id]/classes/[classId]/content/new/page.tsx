'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, Save, X, Video, FileText, HelpCircle, File } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { useToastContext } from '@/components/ToastProvider'

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

export default function NewMaterialPage({ 
  params 
}: { 
  params: { id: string; classId: string } 
}) {
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()
  const { success, error } = useToastContext()
  const [classData, setClassData] = useState<any>(null)
  const [programData, setProgramData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [saving, setSaving] = useState(false)
  const [contents, setContents] = useState<LearningContent[]>([])
  
  const [newContent, setNewContent] = useState<Partial<LearningContent>>({
    class_id: params.classId,
    title: '',
    description: '',
    content_type: 'text',
    content_data: {},
    order_index: 0,
    is_free: false,
    status: 'draft',
    is_required: true,
    estimated_duration: 10,
    material_type: 'main',
    level: 0,
    is_expanded: true
  })
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && profile) {
      checkAccessAndFetchData()
    }
  }, [params.id, params.classId, profile, authLoading])

  async function checkAccessAndFetchData() {
    if (!authLoading && !profile) {
      router.push('/login')
      return
    }
    
    if (authLoading || !profile) {
      return
    }

    try {
      // Fetch class data
      const { data: classInfo, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('id', params.classId)
        .single()

      if (classError) throw classError

      // Fetch program data
      const { data: programInfo, error: programError } = await supabase
        .from('programs')
        .select('*')
        .eq('id', params.id)
        .single()

      if (programError) throw programError

      setClassData(classInfo)
      setProgramData(programInfo)

      // Check access
      let access = false

      if (profile.role === 'admin' || profile.role === 'manager') {
        access = true
      } else if ((profile.role as string) === 'trainer') {
        const { data: trainerData } = await supabase
          .from('trainers')
          .select('id')
          .eq('user_id', profile.id)
          .single()

        if (trainerData) {
          if ((programInfo as any).trainer_id === (trainerData as any).id) {
            access = true
          } else {
            const { data: classTrainer } = await supabase
              .from('class_trainers')
              .select('id')
              .eq('class_id', params.classId)
              .eq('trainer_id', (trainerData as any).id)
              .single()

            if (classTrainer) {
              access = true
            }
          }
        }
      }

      setHasAccess(access)

      if (!access) {
        router.push(`/programs/${params.id}/classes`)
      } else {
        // Fetch existing contents for parent selection
        await fetchContents()
      }
    } catch (error) {
      console.error('Error checking access:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  async function fetchContents() {
    try {
      const { data, error } = await supabase
        .rpc('get_content_hierarchy', { class_uuid: params.classId } as any)

      if (error) throw error
      
      const hierarchicalData = organizeHierarchicalData(data || [])
      setContents(hierarchicalData)
    } catch (error) {
      console.error('Error fetching contents:', error)
    }
  }

  function organizeHierarchicalData(data: LearningContent[]): LearningContent[] {
    const mainMaterials: LearningContent[] = []
    const subMaterialsMap = new Map<string, LearningContent[]>()
    
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

    mainMaterials.forEach(main => {
      const subMaterials = subMaterialsMap.get(main.id) || []
      main.sub_materials = subMaterials
    })

    return mainMaterials
  }

  async function handleSave() {
    if (!newContent.title?.trim()) {
      error('Judul materi harus diisi')
      return
    }

    setSaving(true)
    try {
      const contentData = {
        ...newContent,
        material_type: selectedParentId === null ? 'main' : 'sub',
        parent_id: selectedParentId,
        created_by: profile?.id,
        order_index: contents.length
      }

      const { data, error: insertError } = await supabase
        .from('learning_contents')
        .insert([contentData])
        .select()
        .single()

      if (insertError) throw insertError

      success('Materi berhasil ditambahkan')
      router.push(`/programs/${params.id}/classes/${params.classId}/content`)
    } catch (error) {
      console.error('Error saving content:', error)
      error('Gagal menyimpan materi')
    } finally {
      setSaving(false)
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

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-700">Anda tidak memiliki akses ke halaman ini</p>
          <Link href="/dashboard" className="text-primary-600 hover:underline mt-4 inline-block">
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600">
            <Link href="/dashboard" className="hover:text-primary-600 whitespace-nowrap">Dashboard</Link>
            <span className="text-gray-400">/</span>
            <Link href="/programs" className="hover:text-primary-600 whitespace-nowrap">Programs</Link>
            <span className="text-gray-400">/</span>
            <Link href={`/programs/${params.id}`} className="hover:text-primary-600 truncate max-w-[120px] sm:max-w-none">
              {programData?.title || 'Program'}
            </Link>
            <span className="text-gray-400">/</span>
            <Link href={`/programs/${params.id}/classes`} className="hover:text-primary-600 whitespace-nowrap">Classes</Link>
            <span className="text-gray-400">/</span>
            <Link href={`/programs/${params.id}/classes/${params.classId}/content`} className="hover:text-primary-600 whitespace-nowrap">Materi</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium whitespace-nowrap">Tambah Materi</span>
          </nav>
        </div>

        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/programs/${params.id}/classes/${params.classId}/content`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Materi Pembelajaran
          </Link>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Tambah Materi Pembelajaran
                </h1>
                <p className="text-gray-600">
                  Kelas: {classData?.name || 'Class'} - Program: {programData?.title}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 space-y-6">
            {/* Material Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Jenis Materi <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="materialType"
                    value="main"
                    checked={selectedParentId === null}
                    onChange={() => setSelectedParentId(null)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Materi Utama</div>
                    <div className="text-sm text-gray-500">Materi pembelajaran utama yang berdiri sendiri</div>
                  </div>
                </label>
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="materialType"
                    value="sub"
                    checked={selectedParentId !== null}
                    onChange={() => setSelectedParentId('')}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Sub Materi</div>
                    <div className="text-sm text-gray-500">Materi yang merupakan bagian dari materi utama</div>
                  </div>
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
                value={newContent.title || ''}
                onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Contoh: Pengenalan Python"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi
              </label>
              <textarea
                value={newContent.description || ''}
                onChange={(e) => setNewContent({ ...newContent, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                value={newContent.content_type || 'text'}
                onChange={(e) => setNewContent({ ...newContent, content_type: e.target.value as any })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="text">📝 Teks / Artikel</option>
                <option value="video">🎥 Video</option>
                <option value="quiz">❓ Quiz / Kuis</option>
                <option value="document">📄 Dokumen (PDF, PPT, dll)</option>
                <option value="assignment">📋 Tugas / Assignment</option>
              </select>
            </div>

            {/* Content Data based on type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Konten
              </label>
              {newContent.content_type === 'text' && (
                <textarea
                  value={newContent.content_data?.text || ''}
                  onChange={(e) => setNewContent({
                    ...newContent,
                    content_data: { ...newContent.content_data, text: e.target.value }
                  })}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Tuliskan konten materi di sini..."
                />
              )}
              {newContent.content_type === 'video' && (
                <div className="space-y-3">
                  <input
                    type="url"
                    value={newContent.content_data?.video_url || ''}
                    onChange={(e) => setNewContent({
                      ...newContent,
                      content_data: { ...newContent.content_data, video_url: e.target.value }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="URL video (YouTube, Vimeo, dll)"
                  />
                  <textarea
                    value={newContent.content_data?.transcript || ''}
                    onChange={(e) => setNewContent({
                      ...newContent,
                      content_data: { ...newContent.content_data, transcript: e.target.value }
                    })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Transkrip video (opsional)"
                  />
                </div>
              )}
              {newContent.content_type === 'document' && (
                <div className="space-y-3">
                  <input
                    type="url"
                    value={newContent.content_data?.document_url || ''}
                    onChange={(e) => setNewContent({
                      ...newContent,
                      content_data: { ...newContent.content_data, document_url: e.target.value }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="URL dokumen (Google Drive, Dropbox, dll)"
                  />
                  <input
                    type="text"
                    value={newContent.content_data?.document_name || ''}
                    onChange={(e) => setNewContent({
                      ...newContent,
                      content_data: { ...newContent.content_data, document_name: e.target.value }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Nama dokumen"
                  />
                </div>
              )}
              {newContent.content_type === 'quiz' && (
                <div className="space-y-3">
                  <textarea
                    value={newContent.content_data?.question || ''}
                    onChange={(e) => setNewContent({
                      ...newContent,
                      content_data: { ...newContent.content_data, question: e.target.value }
                    })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Pertanyaan quiz"
                  />
                  <div className="text-sm text-gray-500">
                    * Untuk quiz yang lebih kompleks, gunakan fitur quiz terpisah
                  </div>
                </div>
              )}
              {newContent.content_type === 'assignment' && (
                <div className="space-y-3">
                  <textarea
                    value={newContent.content_data?.instructions || ''}
                    onChange={(e) => setNewContent({
                      ...newContent,
                      content_data: { ...newContent.content_data, instructions: e.target.value }
                    })}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Instruksi tugas"
                  />
                  <input
                    type="text"
                    value={newContent.content_data?.due_date || ''}
                    onChange={(e) => setNewContent({
                      ...newContent,
                      content_data: { ...newContent.content_data, due_date: e.target.value }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Tanggal deadline (YYYY-MM-DD)"
                  />
                </div>
              )}
            </div>

            {/* Additional Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durasi Estimasi (menit)
                </label>
                <input
                  type="number"
                  value={newContent.estimated_duration || 10}
                  onChange={(e) => setNewContent({ ...newContent, estimated_duration: parseInt(e.target.value) || 10 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={newContent.status || 'draft'}
                  onChange={(e) => setNewContent({ ...newContent, status: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newContent.is_free || false}
                  onChange={(e) => setNewContent({ ...newContent, is_free: e.target.checked })}
                  className="mr-3"
                />
                <span className="text-sm text-gray-700">Materi gratis (tidak perlu pembayaran)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newContent.is_required || false}
                  onChange={(e) => setNewContent({ ...newContent, is_required: e.target.checked })}
                  className="mr-3"
                />
                <span className="text-sm text-gray-700">Materi wajib (harus diselesaikan)</span>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
            <Link
              href={`/programs/${params.id}/classes/${params.classId}/content`}
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <X className="w-4 h-4" />
              Batal
            </Link>
            <button
              onClick={handleSave}
              disabled={saving || !newContent.title?.trim()}
              className="inline-flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Menyimpan...' : 'Simpan Materi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
