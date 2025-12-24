'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { ClassWithTrainers, Program } from '@/types'
import {
  BookOpen,
  Users,
  Calendar,
  Clock,
  Eye,
  FileText,
  MessageSquare,
  Plus,
  Search,
  Filter,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X
} from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatTime } from '@/lib/utils'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'

import { useToast } from '@/hooks/useToast'
import { RichTextEditor } from '@/components/ui/RichTextEditor'

interface Webinar {
  id: string
  title: string
  slug: string
  description: string
  start_time: string
  end_time: string
  status?: string // draft, waiting_approval, published, rejected
  is_published: boolean
  hero_image_url?: string
  platform?: string
  meeting_url?: string
}

interface WebinarForm {
  title: string
  slug: string
  description: string
  start_time: string
  end_time: string
  hero_image_file?: File | null
  platform?: string
  meeting_url?: string
  location?: string
}


export default function TrainerClassesPage() {
  const { profile, user, loading: authLoading } = useAuth()
  const [classes, setClasses] = useState<ClassWithTrainers[]>([])
  const [webinars, setWebinars] = useState<Webinar[]>([]) // Webinars state
  const [filteredWebinars, setFilteredWebinars] = useState<Webinar[]>([]) // Filtered webinars
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeTab, setActiveTab] = useState<'classes' | 'webinars'>('classes') // Tab state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(6) // Adjusted to 6 for better grid view

  // Webinar Form State
  const [showWebinarForm, setShowWebinarForm] = useState(false)
  const [editingWebinarId, setEditingWebinarId] = useState<string | null>(null)
  const [webinarForm, setWebinarForm] = useState<WebinarForm>({
    title: '', slug: '', description: '', start_time: '', end_time: '', platform: 'microsoft-teams', meeting_url: '', location: ''
  })
  const [submittingWebinar, setSubmittingWebinar] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [speakers, setSpeakers] = useState<Array<{ name: string; title: string; avatar?: File | null; avatar_url?: string }>>([
    { name: '', title: '', avatar: null, avatar_url: undefined }
  ])

  const toast = useToast()
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    classId: null as string | null,
    loading: false
  })

  useEffect(() => {
    const fetchTrainerData = async () => {
      if (!profile?.id || !user) return

      try {
        setLoading(true)
        const trainerId = profile.id
        console.log('🔍 Looking for data for trainer ID:', trainerId)

        // 1. Fetch Classes
        const { data: classesData, error: classesError } = await supabase
          .from('class_trainers')
          .select(`
            class_id,
            classes!inner(
              *,
              program:programs(
                id,
                title,
                description,
                category,
                min_trainer_level,
                status
              )
            )
          `)
          .eq('trainer_id', trainerId)

        if (classesError) throw classesError

        // Transform classes
        const transformedClasses = classesData?.map((item: any) => ({
          ...item.classes,
          trainers: []
        })) || []
        transformedClasses.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
        setClasses(transformedClasses)

        // 2. Fetch Webinars
        const { data: webinarsData, error: webinarsError } = await supabase
          .from('webinars')
          .select('*')
          .eq('created_by', trainerId)
          .order('created_at', { ascending: false })

        if (webinarsError) throw webinarsError
        setWebinars(webinarsData || [])

      } catch (error) {
        console.error('Error fetching trainer data:', error)
        toast.error('Gagal', 'Gagal memuat data')
      } finally {
        setLoading(false)
      }
    }

    fetchTrainerData()
    fetchTrainerData()
  }, [profile?.id, user])

  // Reset filter when tab changes
  useEffect(() => {
    setSearchQuery('')
    setStatusFilter('all')
    setCurrentPage(1)
  }, [activeTab])

  // Filter Webinars
  useEffect(() => {
    let result = webinars
    if (searchQuery) {
      const lower = searchQuery.toLowerCase()
      result = result.filter(w => w.title.toLowerCase().includes(lower) || w.slug.toLowerCase().includes(lower))
    }
    if (statusFilter !== 'all') {
      // Map status filter values if necessary or match exact
      result = result.filter(w => w.status === statusFilter)
    }
    setFilteredWebinars(result)
  }, [webinars, searchQuery, statusFilter])

  async function deleteClass(classId: string) {
    setDeleteModal({ isOpen: true, classId, loading: false })
  }

  async function handleDeleteConfirm() {
    if (!deleteModal.classId) return
    try {
      setDeleteModal(prev => ({ ...prev, loading: true }))
      // Handle webinar delete vs class delete if needed. 
      // For now assume classId is for classes. We can add type to modal or separate logic.
      // But let's check if it exists in webinars first or just use a flag?
      // Since ids are UUIDs, collision is rare, but clean separation is better.
      // Assuming this is strictly for classes based on original code usage.

      const { error } = await supabase.from('classes').delete().eq('id', deleteModal.classId)
      if (error) throw error
      toast.success('Berhasil', 'Program Pelatihan berhasil dihapus')
      setClasses(prev => prev.filter(c => c.id !== deleteModal.classId))
      setDeleteModal({ isOpen: false, classId: null, loading: false })
    } catch (error) {
      console.error('Error deleting class:', error)
      toast.error('Gagal', 'Gagal menghapus program pelatihan')
      setDeleteModal(prev => ({ ...prev, loading: false }))
    }
  }

  // Webinar Helpers
  async function compressImage(file: File): Promise<Blob> {
    const imageBitmap = await createImageBitmap(file)
    const scale = Math.min(1600 / imageBitmap.width, 900 / imageBitmap.height, 1)
    const canvas = document.createElement('canvas')
    canvas.width = imageBitmap.width * scale
    canvas.height = imageBitmap.height * scale
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height)
    return await new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/webp', 0.8))
  }

  async function checkSlug(slug: string) {
    if (!slug) { setSlugAvailable(null); return }
    const { data } = await supabase.from('webinars').select('id').eq('slug', slug).maybeSingle()
    if (!data) { setSlugAvailable(true); return }
    if (editingWebinarId && (data as any).id === editingWebinarId) { setSlugAvailable(true); return }
    setSlugAvailable(false)
  }

  async function handleWebinarSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmittingWebinar(true)
    try {
      let heroUrl = undefined
      if (webinarForm.hero_image_file) {
        const blob = await compressImage(webinarForm.hero_image_file)
        const path = `hero/${Date.now()}_${webinarForm.hero_image_file.name}.webp`
        const { error: upErr } = await supabase.storage.from('webinar-assets').upload(path, blob)
        if (upErr) throw upErr
        const { data: pub } = supabase.storage.from('webinar-assets').getPublicUrl(path)
        heroUrl = pub.publicUrl
      }

      const payload = {
        title: webinarForm.title,
        slug: webinarForm.slug,
        description: webinarForm.description,
        start_time: new Date(webinarForm.start_time).toISOString(),
        end_time: new Date(webinarForm.end_time).toISOString(),
        platform: webinarForm.platform,
        meeting_url: webinarForm.meeting_url,
        // status: 'waiting_approval', 
        // is_published: false,
        created_by: profile?.id,
        ...(heroUrl ? { hero_image_url: heroUrl } : {})
      }

      if (editingWebinarId) {
        // Update
        const { error } = await supabase.from('webinars').update({
          ...payload,
          status: 'waiting_approval',
          is_published: false
        } as any).eq('id', editingWebinarId)
        if (error) throw error
        toast.success('Berhasil', 'Webinar berhasil diupdate & menunggu persetujuan')
      } else {
        // Insert
        const { error } = await supabase.from('webinars').insert({
          ...payload,
          status: 'waiting_approval',
          is_published: false
        } as any)
        if (error) throw error
        toast.success('Berhasil', 'Webinar berhasil dibuat & menunggu persetujuan')
      }

      // Handle Speakers
      let finalWebinarId = editingWebinarId || (await supabase.from('webinars').select('id').eq('slug', webinarForm.slug).single() as any).data?.id
      if (finalWebinarId) {
        if (editingWebinarId) {
          await supabase.from('webinar_speakers').delete().eq('webinar_id', finalWebinarId)
        }
        for (let i = 0; i < speakers.length; i++) {
          const sp = speakers[i]
          if (!sp.name && !sp.title && !sp.avatar) continue
          let avatarUrl = sp.avatar_url
          if (sp.avatar) {
            const blob = await compressImage(sp.avatar)
            const path = `speakers/${finalWebinarId}/${Date.now()}_${sp.avatar.name}.webp`
            await supabase.storage.from('webinar-assets').upload(path, blob, { upsert: true })
            const { data: pub } = supabase.storage.from('webinar-assets').getPublicUrl(path)
            avatarUrl = pub.publicUrl
          }
          await supabase.from('webinar_speakers').insert({
            webinar_id: finalWebinarId,
            name: sp.name,
            title: sp.title,
            avatar_url: avatarUrl,
            sort_order: i
          } as any)
        }
      }

      // Refresh
      const { data } = await supabase.from('webinars').select('*').eq('created_by', profile?.id || '').order('created_at', { ascending: false })
      setWebinars(data || [])
      setShowWebinarForm(false)
      setEditingWebinarId(null)
      setWebinarForm({ title: '', slug: '', description: '', start_time: '', end_time: '', platform: 'microsoft-teams', meeting_url: '' })
      setSpeakers([{ name: '', title: '', avatar: null }])
    } catch (err: any) {
      toast.error('Gagal', err.message || 'Terjadi kesalahan')
    } finally {
      setSubmittingWebinar(false)
    }
  }

  async function openEditWebinar(w: Webinar) {
    setEditingWebinarId(w.id)
    setWebinarForm({
      title: w.title,
      slug: w.slug,
      description: w.description || '',
      start_time: w.start_time ? new Date(w.start_time).toISOString().slice(0, 16) : '',
      end_time: w.end_time ? new Date(w.end_time).toISOString().slice(0, 16) : '',
      platform: w.platform || 'microsoft-teams',
      meeting_url: w.meeting_url || '',
      hero_image_file: null
    })

    // Load speakers
    const { data: sps } = await supabase.from('webinar_speakers').select('name, title, avatar_url').eq('webinar_id', w.id).order('sort_order')
    if (sps && sps.length > 0) {
      setSpeakers(sps.map((s: any) => ({ name: s.name, title: s.title, avatar: null, avatar_url: s.avatar_url })))
    } else {
      setSpeakers([{ name: '', title: '', avatar: null }])
    }

    setShowWebinarForm(true)
  }

  function getStatusBadge(status: string) {
    const badges: Record<string, string> = {
      scheduled: 'px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full',
      ongoing: 'px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full',
      completed: 'px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full',
      cancelled: 'px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full',
      // Webinar statuses
      draft: 'px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full',
      waiting_approval: 'px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full',
      published: 'px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full',
      rejected: 'px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full',
    }
    return badges[status] || 'px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full'
  }

  function getStatusText(status: string) {
    const statusMap: Record<string, string> = {
      scheduled: 'Dijadwalkan',
      ongoing: 'Berlangsung',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
      // Webinar
      draft: 'Draft',
      waiting_approval: 'Menunggu Admin',
      published: 'Terbit',
      rejected: 'Ditolak',
    }
    return statusMap[status] || status
  }

  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = classItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classItem.program?.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || classItem.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentClasses = filteredClasses.slice(startIndex, endIndex)

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'scheduled', label: 'Dijadwalkan' },
    { value: 'ongoing', label: 'Berlangsung' },
    { value: 'completed', label: 'Selesai' },
    { value: 'cancelled', label: 'Dibatalkan' }
  ]

  const webinarStatusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'waiting_approval', label: 'Menunggu Admin' },
    { value: 'published', label: 'Terbit' },
    { value: 'rejected', label: 'Ditolak' },
  ]

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Halo Trainer! 🏫</h1>
          <p className="text-gray-600 mb-6 text-lg">Silakan login untuk mengakses manajemen kelas!</p>
          <p className="text-gray-500 text-sm mb-8">Mari buat pembelajaran yang menyenangkan! 🎉</p>
          <a
            href="/login"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-medium rounded-xl hover:from-red-700 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Login Sekarang
          </a>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6 sm:space-y-8 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-6 rounded-xl shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <Link
                href="/trainer/dashboard"
                className="flex-shrink-0 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Program Pelatihan Saya</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">Kelola program pelatihan dan webinar Anda</p>
              </div>
            </div>
            {activeTab === 'classes' ? (
              <Link
                href="/trainer/classes/new"
                className="flex-shrink-0 inline-flex items-center justify-center px-4 py-2.5 bg-primary-600 text-white text-sm sm:text-base font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm whitespace-nowrap"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Buat Program Pelatihan Baru
              </Link>
            ) : (
              <button
                onClick={() => {
                  setEditingWebinarId(null)
                  setWebinarForm({ title: '', slug: '', description: '', start_time: '', end_time: '', platform: 'microsoft-teams', meeting_url: '' })
                  setSpeakers([{ name: '', title: '', avatar: null }])
                  setShowWebinarForm(true)
                }}
                className="flex-shrink-0 inline-flex items-center justify-center px-4 py-2.5 bg-primary-600 text-white text-sm sm:text-base font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm whitespace-nowrap"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Buat Webinar
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex space-x-6 mt-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('classes')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'classes'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Program Pelatihan
            </button>
            <button
              onClick={() => setActiveTab('webinars')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'webinars'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Webinar
            </button>
          </div>
        </div>

        {activeTab === 'classes' ? (
          <div>
            {/* Search and Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
              {/* ... existing search filter ... */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari program pelatihan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Results count */}
              <div className="mt-4 text-sm text-gray-600">
                Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredClasses.length)} dari {filteredClasses.length} program pelatihan
              </div>
            </div>

            {/* Classes Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* ... skeleton ... */}
                <div className="py-12 text-center text-gray-500">Memuat...</div>
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="text-center py-8 sm:py-12 bg-white rounded-xl border border-gray-200 px-4">
                <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4 text-sm sm:text-base">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Tidak ada program pelatihan yang sesuai dengan filter'
                    : 'Belum ada program pelatihan yang ditugaskan kepada Anda'
                  }
                </p>
                <Link
                  href="/trainer/classes/new"
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Buat Program Pelatihan Pertama
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {currentClasses.map((classItem) => (
                    <div key={classItem.id} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow bg-gradient-to-r from-white to-gray-50/50">
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <span className={getStatusBadge(
                          classItem.program?.status === 'draft' ? 'waiting_approval' : classItem.status
                        )}>
                          {getStatusText(
                            classItem.program?.status === 'draft' ? 'waiting_approval' : classItem.status
                          )}
                        </span>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Link
                            href={`/programs/${classItem.program_id}/classes/${classItem.id}`}
                            className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Link>
                          <Link
                            href={`/programs/${classItem.program_id}/classes/${classItem.id}/content`}
                            className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Kelola Materi"
                          >
                            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Link>
                          <Link
                            href={`/programs/${classItem.program_id}/classes/${classItem.id}/forum`}
                            className="p-1.5 sm:p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Forum Diskusi"
                          >
                            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Link>
                        </div>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 line-clamp-2">{classItem.name}</h3>
                      {classItem.program && (
                        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2">{classItem.program.title}</p>
                      )}

                      <div className="space-y-2 mb-3 sm:mb-4">
                        <div className="flex items-center text-xs sm:text-sm text-gray-600">
                          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{formatDate(classItem.start_date)} - {formatDate(classItem.end_date)}</span>
                        </div>
                        <div className="flex items-center text-xs sm:text-sm text-gray-600">
                          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{classItem.current_participants || 0} / {classItem.max_participants || 'Unlimited'} peserta</span>
                        </div>
                      </div>

                      <div className="pt-3 sm:pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-6 gap-2">
                          <Link
                            href={`/programs/${classItem.program_id}/classes/${classItem.id}`}
                            className="col-span-2 inline-flex items-center justify-center px-3 py-2 bg-primary-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                            Detail
                          </Link>
                          <Link
                            href={`/programs/${classItem.program_id}/classes/${classItem.id}/content`}
                            className="col-span-3 inline-flex items-center justify-center px-3 py-2 bg-green-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                            Materi
                          </Link>
                          <button
                            onClick={() => deleteClass(classItem.id)}
                            className="col-span-1 inline-flex items-center justify-center px-2 py-2 bg-red-100 text-red-600 text-xs sm:text-sm font-medium rounded-lg hover:bg-red-200 transition-colors border border-red-200"
                            title="Hapus Program Pelatihan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                    {/* existing pagination */}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Webinar Form Modal/View */}
            {showWebinarForm && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold mb-4">{editingWebinarId ? 'Edit Webinar' : 'Buat Webinar Baru'}</h2>
                <form onSubmit={handleWebinarSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Judul</label>
                      <input className="w-full border rounded p-2" value={webinarForm.title} onChange={e => setWebinarForm(f => ({ ...f, title: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Slug</label>
                      <input
                        className="w-full border rounded p-2"
                        value={webinarForm.slug}
                        onChange={e => { setWebinarForm(f => ({ ...f, slug: e.target.value })); setSlugAvailable(null) }}
                        onBlur={e => checkSlug(e.target.value)}
                        required
                      />
                      {slugAvailable === false && <p className="text-xs text-red-500">Slug sudah dipakai</p>}
                      {slugAvailable === true && <p className="text-xs text-green-500">Slug tersedia</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
                      <RichTextEditor value={webinarForm.description} onChange={v => setWebinarForm(f => ({ ...f, description: v }))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mulai</label>
                      <input type="datetime-local" className="w-full border rounded p-2" value={webinarForm.start_time} onChange={e => setWebinarForm(f => ({ ...f, start_time: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Selesai</label>
                      <input type="datetime-local" className="w-full border rounded p-2" value={webinarForm.end_time} onChange={e => setWebinarForm(f => ({ ...f, end_time: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Platform</label>
                      <select className="w-full border rounded p-2" value={webinarForm.platform} onChange={e => setWebinarForm(f => ({ ...f, platform: e.target.value }))}>
                        <option value="microsoft-teams">Microsoft Teams</option>
                        <option value="google-meet">Google Meet</option>
                        <option value="zoom">Zoom</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Link Meeting</label>
                      <input className="w-full border rounded p-2" value={webinarForm.meeting_url} onChange={e => setWebinarForm(f => ({ ...f, meeting_url: e.target.value }))} placeholder="https://..." />
                    </div>
                    {/* Banner Image */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Banner (opsional)</label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-colors cursor-pointer relative group">
                        <div className="space-y-1 text-center">
                          {webinarForm.hero_image_file ? (
                            <div className="relative">
                              <img
                                src={URL.createObjectURL(webinarForm.hero_image_file)}
                                alt="Banner preview"
                                className="mx-auto h-48 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setWebinarForm(f => ({ ...f, hero_image_file: null }))
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : editingWebinarId && webinars.find(w => w.id === editingWebinarId)?.hero_image_url ? (
                            <div className="relative">
                              <img
                                src={webinars.find(w => w.id === editingWebinarId)?.hero_image_url}
                                alt="Current banner"
                                className="mx-auto h-48 object-cover rounded-lg"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg">
                                <p className="text-white font-medium opacity-0 group-hover:opacity-100">Klik untuk ganti</p>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="mx-auto h-12 w-12 text-gray-400">
                                <FileText className="h-12 w-12" />
                              </div>
                              <div className="flex text-sm text-gray-600 justify-center">
                                <span className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                                  <span>Upload gambar</span>
                                </span>
                                <p className="pl-1">atau drag and drop</p>
                              </div>
                              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                            </>
                          )}
                          <input
                            id="banner-upload"
                            name="banner-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={e => setWebinarForm(f => ({ ...f, hero_image_file: e.target.files?.[0] }))}
                          />
                          <label htmlFor="banner-upload" className="absolute inset-0 cursor-pointer"></label>
                        </div>
                      </div>
                    </div>

                    {/* Speakers Section */}
                    <div className="md:col-span-2 space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <label className="block text-sm font-semibold text-gray-800">Pembicara</label>
                        <button
                          type="button"
                          onClick={() => setSpeakers(curr => [...curr, { name: '', title: '', avatar: null }])}
                          className="inline-flex items-center text-sm px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg transition-colors font-medium border border-primary-100"
                        >
                          <Plus className="w-4 h-4 mr-1.5" />
                          Tambah Pembicara
                        </button>
                      </div>
                      <div className="grid gap-4">
                        {speakers.map((sp, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all sm:items-start group">
                            {/* Avatar Upload */}
                            <div className="flex-shrink-0">
                              <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-sm group-hover:border-primary-100 transition-colors">
                                {sp.avatar ? (
                                  <img src={URL.createObjectURL(sp.avatar)} alt="Avatar preview" className="w-full h-full object-cover" />
                                ) : sp.avatar_url ? (
                                  <img src={sp.avatar_url} alt="Current avatar" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Users className="w-8 h-8" />
                                  </div>
                                )}
                                <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-40 transition-all cursor-pointer">
                                  <div className="bg-white/90 p-1.5 rounded-full opacity-0 hover:opacity-100 transform scale-75 hover:scale-100 transition-all shadow-sm">
                                    <Plus className="w-4 h-4 text-gray-700" />
                                  </div>
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={e => {
                                      const f = e.target.files?.[0]
                                      if (f) setSpeakers(curr => curr.map((s, i) => i === idx ? { ...s, avatar: f } : s))
                                    }}
                                  />
                                </label>
                              </div>
                              <p className="text-xs text-center text-gray-500 mt-2">Foto</p>
                            </div>

                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Nama Pembicara</label>
                                <input
                                  placeholder="Contoh: Dr. Budi Santoso"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-shadow"
                                  value={sp.name}
                                  onChange={e => {
                                    const v = e.target.value
                                    setSpeakers(curr => curr.map((s, i) => i === idx ? { ...s, name: v } : s))
                                  }}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Jabatan / Title</label>
                                <input
                                  placeholder="Contoh: Senior Developer"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-shadow"
                                  value={sp.title}
                                  onChange={e => {
                                    const v = e.target.value
                                    setSpeakers(curr => curr.map((s, i) => i === idx ? { ...s, title: v } : s))
                                  }}
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSpeakers(curr => curr.filter((_, i) => i !== idx))}
                              className="self-center sm:self-start p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Pembicara"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowWebinarForm(false)} className="px-4 py-2 border rounded">Batal</button>
                    <button type="submit" disabled={submittingWebinar} className="px-4 py-2 bg-primary-600 text-white rounded">
                      {submittingWebinar ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                </form>
              </div>
            )}


            {!showWebinarForm && (
              <>
                {/* Search and Filter for Webinars */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Cari webinar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      >
                        {webinarStatusOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Results count */}
                  <div className="mt-4 text-sm text-gray-600">
                    Menampilkan {filteredWebinars.length > 0 ? 1 : 0}-{filteredWebinars.length} dari {filteredWebinars.length} webinar
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredWebinars.map(w => (
                    <div key={w.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-3">
                        <span className={getStatusBadge(w.status || 'draft')}>
                          {getStatusText(w.status || 'draft')}
                        </span>
                        <button onClick={() => openEditWebinar(w)} className="text-blue-600 hover:text-blue-800">Edit</button>
                      </div>
                      <h3 className="font-bold text-lg mb-2">{w.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{formatDate(w.start_time)}</p>
                      <div className="text-sm text-gray-500 line-clamp-2" dangerouslySetInnerHTML={{ __html: w.description || '' }} />
                    </div>
                  ))}

                  {filteredWebinars.length === 0 && (
                    <div className="col-span-full text-center py-8 sm:py-12 bg-white rounded-xl border border-gray-200 px-4">
                      <div className="bg-white rounded-xl p-4">
                        <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
                          <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-600 mb-4 text-sm sm:text-base">
                          {searchQuery || statusFilter !== 'all'
                            ? 'Tidak ada webinar yang sesuai dengan filter'
                            : 'Belum ada webinar'
                          }
                        </p>
                        <button
                          onClick={() => {
                            setEditingWebinarId(null)
                            setWebinarForm({ title: '', slug: '', description: '', start_time: '', end_time: '', platform: 'microsoft-teams', meeting_url: '' })
                            setSpeakers([{ name: '', title: '', avatar: null }])
                            setShowWebinarForm(true)
                          }}
                          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base font-medium"
                        >
                          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          Buat Webinar Pertama
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, classId: null, loading: false })}
        onConfirm={handleDeleteConfirm}
        title="Hapus Kelas"
        message="Apakah Anda yakin ingin menghapus kelas ini? Data yang dihapus tidak dapat dikembalikan."
        isLoading={deleteModal.loading}
        variant="danger"
        confirmText="Ya, Hapus"
      />
    </>
  )
}
