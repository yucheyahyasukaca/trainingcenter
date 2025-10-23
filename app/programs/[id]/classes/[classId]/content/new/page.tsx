'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  BookOpen, 
  Save, 
  X, 
  Video, 
  FileText, 
  HelpCircle, 
  File, 
  Upload,
  Plus,
  Sparkles,
  Clock,
  Star,
  CheckCircle,
  AlertCircle,
  Zap,
  Target,
  Layers,
  PenTool,
  Eye,
  Edit
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/hooks/useToast'
import { RichTextEditor } from '@/components/ui/RichTextEditor'

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
  const addToast = useToast()
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

  // Function to calculate progress based on form completion
  const calculateProgress = () => {
    const steps = {
      basicInfo: false,
      contentType: false,
      contentData: false,
      settings: false
    }

    // Check Informasi Dasar (Basic Information)
    steps.basicInfo = !!(newContent.title?.trim())

    // Check Tipe Konten (Content Type)
    steps.contentType = !!(newContent.content_type)

    // Check Konten Materi (Content Data) - based on content type
    if (newContent.content_type === 'text') {
      steps.contentData = !!(newContent.content_data?.body?.trim())
    } else if (newContent.content_type === 'video') {
      steps.contentData = !!(newContent.content_data?.video_url?.trim())
    } else if (newContent.content_type === 'document') {
      steps.contentData = !!(newContent.content_data?.document_url?.trim())
    } else if (newContent.content_type === 'quiz') {
      steps.contentData = !!(newContent.content_data?.question?.trim())
    } else if (newContent.content_type === 'assignment') {
      steps.contentData = !!(newContent.content_data?.instructions?.trim())
    }

    // Check Pengaturan (Settings) - validate required settings
    steps.settings = !!(newContent.estimated_duration && newContent.status)
    
    // Additional validation for sub-materials
    if (selectedParentId !== null && !selectedParentId) {
      steps.settings = false // Sub-material must have parent selected
    }

    return steps
  }

  const progress = calculateProgress()

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
        // Use profile.id directly since class_trainers.trainer_id references user_profiles.id
        const trainerId = profile.id

        // Check if program trainer matches
        if ((programInfo as any).trainer_id === trainerId) {
          access = true
        } else {
          // Check if assigned to this class
          const { data: classTrainer } = await supabase
            .from('class_trainers')
            .select('id')
            .eq('class_id', params.classId)
            .eq('trainer_id', trainerId)
            .single()

          if (classTrainer) {
            access = true
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
      addToast.error('Judul materi harus diisi')
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

      const { data, error: insertError } = await (supabase as any)
        .from('learning_contents')
        .insert([contentData])
        .select()
        .single()

      if (insertError) throw insertError

      addToast.success('Materi berhasil ditambahkan')
      router.push(`/programs/${params.id}/classes/${params.classId}/content`)
    } catch (error) {
      console.error('Error saving content:', error)
      addToast.error('Gagal menyimpan materi')
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Breadcrumb */}
        <div className="mb-6 sm:mb-8">
          {/* Mobile Breadcrumb - Simplified */}
          <nav className="flex items-center gap-1 text-xs sm:hidden">
            <Link 
              href="/programs" 
              className="text-slate-500 hover:text-blue-600 transition-colors duration-200"
            >
              Programs
            </Link>
            <span className="text-slate-400">/</span>
            <Link 
              href={`/programs/${params.id}`} 
              className="text-slate-500 hover:text-blue-600 transition-colors duration-200 truncate max-w-[100px]"
              title={programData?.title || 'Program'}
            >
              {programData?.title || 'Program'}
            </Link>
            <span className="text-slate-400">/</span>
            <span className="text-slate-700 font-medium">Tambah Materi</span>
          </nav>

          {/* Desktop Breadcrumb - Full */}
          <nav className="hidden sm:flex items-center gap-2 text-sm">
            {((profile as any)?.role === 'trainer' ? [
              { name: 'Dashboard', href: '/dashboard' },
              { name: 'Kelas Saya', href: '/trainer/classes' },
              { name: 'Materi', href: `/programs/${params.id}/classes/${params.classId}/content` },
              { name: 'Tambah Materi', href: '#' }
            ] : [
              { name: 'Dashboard', href: '/dashboard' },
              { name: 'Programs', href: '/programs' },
              { name: programData?.title || 'Program', href: `/programs/${params.id}` },
              { name: 'Classes', href: `/programs/${params.id}/classes` },
              { name: 'Materi', href: `/programs/${params.id}/classes/${params.classId}/content` },
              { name: 'Tambah Materi', href: '#' }
            ]).map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                {index > 0 && (
                  <span className="text-slate-400">/</span>
                )}
                {index === ((profile as any)?.role === 'trainer' ? 3 : 5) ? (
                  <span className="text-slate-700 font-medium">
                    {item.name}
                  </span>
                ) : (
                  <Link 
                    href={item.href} 
                    className="text-slate-500 hover:text-blue-600 transition-colors duration-200 truncate max-w-[150px] lg:max-w-none"
                    title={item.name}
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Modern Header */}
        <div className="mb-6">
          <Link
            href={`/programs/${params.id}/classes/${params.classId}/content`}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 group transition-all duration-200"
          >
            <div className="p-1 rounded-lg bg-slate-100 group-hover:bg-slate-200 transition-colors duration-200">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="font-medium text-sm sm:text-base">Kembali ke Materi Pembelajaran</span>
          </Link>
          
          <div className="relative overflow-hidden bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-slate-200">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 opacity-5"></div>
            <div className="relative p-4 sm:p-6 lg:p-8">
              <div className="flex items-start gap-4 sm:gap-6">
                <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg">
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2 sm:mb-3 leading-tight">
                    Buat Materi Pembelajaran Baru
                  </h1>
                  <p className="text-slate-600 text-sm sm:text-base lg:text-lg mb-1 sm:mb-2">
                    Kelas: <span className="font-semibold text-slate-800">{classData?.name || 'Class'}</span>
                  </p>
                  <p className="text-slate-500 text-sm sm:text-base">
                    Program: <span className="font-medium">{programData?.title}</span>
                  </p>
                </div>
                <div className="hidden lg:block">
                  <div className="w-24 h-24 xl:w-32 xl:h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-50"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Material Type Selection */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 lg:p-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">Jenis Materi</h2>
                <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">Wajib</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <label className={`group relative p-4 sm:p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  selectedParentId === null 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}>
                  <input
                    type="radio"
                    name="materialType"
                    value="main"
                    checked={selectedParentId === null}
                    onChange={() => setSelectedParentId(null)}
                    className="sr-only"
                  />
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      selectedParentId === null 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-slate-300 group-hover:border-slate-400'
                    }`}>
                      {selectedParentId === null && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 sm:mb-2">
                        <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        <span className="font-semibold text-slate-800 text-sm sm:text-base">Materi Utama</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600">Materi pembelajaran utama yang berdiri sendiri</p>
                    </div>
                  </div>
                </label>
                
                <label className={`group relative p-4 sm:p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  selectedParentId !== null 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}>
                  <input
                    type="radio"
                    name="materialType"
                    value="sub"
                    checked={selectedParentId !== null}
                    onChange={() => setSelectedParentId('')}
                    className="sr-only"
                  />
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      selectedParentId !== null 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-slate-300 group-hover:border-slate-400'
                    }`}>
                      {selectedParentId !== null && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 sm:mb-2">
                        <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                        <span className="font-semibold text-slate-800 text-sm sm:text-base">Sub Materi</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600">Materi yang merupakan bagian dari materi utama</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Basic Information */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 lg:p-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                  <PenTool className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">Informasi Dasar</h2>
              </div>
              
              <div className="space-y-4 sm:space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                    Judul Materi <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newContent.title || ''}
                      onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base sm:text-lg font-medium"
                      placeholder="Contoh: Pengenalan Python untuk Pemula"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center">
                      <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                    Deskripsi
                  </label>
                  <textarea
                    value={newContent.description || ''}
                    onChange={(e) => setNewContent({ ...newContent, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none text-sm sm:text-base"
                    placeholder="Jelaskan secara singkat apa yang akan dipelajari dalam materi ini..."
                  />
                </div>
              </div>
            </div>

            {/* Parent Material Selection (only for sub-materials) */}
            {selectedParentId !== null && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
                    <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800">Materi Induk</h2>
                </div>
                
                <div className="relative">
                  <select
                    value={selectedParentId || ''}
                    onChange={(e) => setSelectedParentId(e.target.value || null)}
                    className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-white"
                  >
                    <option value="">Pilih Materi Induk</option>
                    {contents.map((mainContent) => (
                      <option key={mainContent.id} value={mainContent.id}>
                        {mainContent.title}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Content Type */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 lg:p-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">Tipe Konten</h2>
                <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">Wajib</span>
              </div>
              
              <div className="relative">
                <select
                  value={newContent.content_type || 'text'}
                  onChange={(e) => setNewContent({ ...newContent, content_type: e.target.value as any })}
                  className="w-full px-3 sm:px-4 py-3 sm:py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-white text-sm sm:text-base"
                >
                  <option value="text">📝 Teks / Artikel</option>
                  <option value="video">🎥 Video</option>
                  <option value="quiz">❓ Quiz / Kuis</option>
                  <option value="document">📄 Dokumen (PDF, PPT, dll)</option>
                  <option value="assignment">📋 Tugas / Assignment</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Content Data based on type */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 lg:p-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">Konten Materi</h2>
              </div>
              
              {newContent.content_type === 'text' && (
                <div>
                  <RichTextEditor
                    value={newContent.content_data?.body || ''}
                    onChange={(value) => setNewContent({
                      ...newContent,
                      content_data: { ...newContent.content_data, body: value }
                    })}
                    placeholder="Tuliskan konten materi di sini... Gunakan toolbar untuk formatting, insert gambar, dan lainnya"
                    height={400}
                  />
                </div>
              )}
              
              {newContent.content_type === 'video' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      URL Video
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={newContent.content_data?.video_url || ''}
                        onChange={(e) => setNewContent({
                          ...newContent,
                          content_data: { ...newContent.content_data, video_url: e.target.value }
                        })}
                        className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="https://youtube.com/watch?v=... atau https://vimeo.com/..."
                      />
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                        <Video className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Transkrip Video (Opsional)
                    </label>
                    <textarea
                      value={newContent.content_data?.transcript || ''}
                      onChange={(e) => setNewContent({
                        ...newContent,
                        content_data: { ...newContent.content_data, transcript: e.target.value }
                      })}
                      rows={6}
                      className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                      placeholder="Salin transkrip video di sini untuk aksesibilitas..."
                    />
                  </div>
                </div>
              )}
              
              {newContent.content_type === 'document' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      URL Dokumen
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={newContent.content_data?.document_url || ''}
                        onChange={(e) => setNewContent({
                          ...newContent,
                          content_data: { ...newContent.content_data, document_url: e.target.value }
                        })}
                        className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="https://drive.google.com/file/d/... atau https://dropbox.com/..."
                      />
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                        <File className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Nama Dokumen
                    </label>
                    <input
                      type="text"
                      value={newContent.content_data?.document_name || ''}
                      onChange={(e) => setNewContent({
                        ...newContent,
                        content_data: { ...newContent.content_data, document_name: e.target.value }
                      })}
                      className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Contoh: Panduan Python untuk Pemula.pdf"
                    />
                  </div>
                </div>
              )}
              
              {newContent.content_type === 'quiz' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Pertanyaan Quiz
                    </label>
                    <textarea
                      value={newContent.content_data?.question || ''}
                      onChange={(e) => setNewContent({
                        ...newContent,
                        content_data: { ...newContent.content_data, question: e.target.value }
                      })}
                      rows={4}
                      className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                      placeholder="Tuliskan pertanyaan quiz di sini..."
                    />
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Tips Quiz</p>
                        <p className="text-sm text-amber-700 mt-1">
                          Untuk quiz yang lebih kompleks dengan multiple choice, true/false, atau essay, 
                          gunakan fitur quiz terpisah yang tersedia di sistem.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {newContent.content_type === 'assignment' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Instruksi Tugas
                    </label>
                    <textarea
                      value={newContent.content_data?.instructions || ''}
                      onChange={(e) => setNewContent({
                        ...newContent,
                        content_data: { ...newContent.content_data, instructions: e.target.value }
                      })}
                      rows={8}
                      className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                      placeholder="Jelaskan secara detail apa yang harus dilakukan peserta dalam tugas ini..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Deadline Tugas
                    </label>
                    <input
                      type="date"
                      value={newContent.content_data?.due_date || ''}
                      onChange={(e) => setNewContent({
                        ...newContent,
                        content_data: { ...newContent.content_data, due_date: e.target.value }
                      })}
                      className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Additional Settings */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 lg:p-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">Pengaturan Tambahan</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                    Durasi Estimasi (menit)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={newContent.estimated_duration || 10}
                      onChange={(e) => setNewContent({ ...newContent, estimated_duration: parseInt(e.target.value) || 10 })}
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      min="1"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 sm:mb-3">
                    Status
                  </label>
                  <div className="relative">
                    <select
                      value={newContent.status || 'draft'}
                      onChange={(e) => setNewContent({ ...newContent, status: e.target.value as any })}
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-white"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
                <label className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 border-2 border-slate-200 rounded-xl hover:border-slate-300 transition-all duration-200 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={newContent.is_free || false}
                    onChange={(e) => setNewContent({ ...newContent, is_free: e.target.checked })}
                    className="mt-1 w-4 h-4 sm:w-5 sm:h-5 text-blue-600 border-2 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                      <span className="font-semibold text-slate-800 text-sm sm:text-base">Materi Gratis</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600">Materi ini dapat diakses tanpa pembayaran</p>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 border-2 border-slate-200 rounded-xl hover:border-slate-300 transition-all duration-200 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={newContent.is_required || false}
                    onChange={(e) => setNewContent({ ...newContent, is_required: e.target.checked })}
                    className="mt-1 w-4 h-4 sm:w-5 sm:h-5 text-blue-600 border-2 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                      <span className="font-semibold text-slate-800 text-sm sm:text-base">Materi Wajib</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600">Peserta harus menyelesaikan materi ini</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Modern Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 sm:top-8 space-y-4 sm:space-y-6">
              {/* Progress Card */}
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-3 sm:mb-4">Progress</h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className={`${progress.basicInfo ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>
                      Informasi Dasar
                    </span>
                    {progress.basicInfo ? (
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                    ) : (
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-slate-300 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className={`${progress.contentType ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>
                      Tipe Konten
                    </span>
                    {progress.contentType ? (
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                    ) : (
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-slate-300 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className={`${progress.contentData ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>
                      Konten Materi
                    </span>
                    {progress.contentData ? (
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                    ) : (
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-slate-300 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className={`${progress.settings ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>
                      Pengaturan
                    </span>
                    {progress.settings ? (
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                    ) : (
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-slate-300 rounded-full"></div>
                    )}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Progress</span>
                    <span>{Object.values(progress).filter(Boolean).length}/4</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(Object.values(progress).filter(Boolean).length / 4) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl border border-blue-200 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-3 sm:mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  Tips
                </h3>
                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-slate-600">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mt-1.5 sm:mt-2"></div>
                    <p>Gunakan judul yang jelas dan deskriptif</p>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mt-1.5 sm:mt-2"></div>
                    <p>Tambahkan deskripsi yang menarik</p>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mt-1.5 sm:mt-2"></div>
                    <p>Estimasi durasi yang realistis</p>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mt-1.5 sm:mt-2"></div>
                    <p>Pilih status yang sesuai</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6">
                <div className="space-y-2 sm:space-y-3">
                  <button
                    onClick={handleSave}
                    disabled={saving || !newContent.title?.trim()}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl text-sm sm:text-base"
                  >
                    <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                    {saving ? 'Menyimpan...' : 'Simpan Materi'}
                  </button>
                  
                  <Link
                    href={`/programs/${params.id}/classes/${params.classId}/content`}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-slate-600 hover:text-slate-900 border-2 border-slate-200 rounded-xl hover:border-slate-300 transition-all duration-200 font-semibold text-sm sm:text-base"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    Batal
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
