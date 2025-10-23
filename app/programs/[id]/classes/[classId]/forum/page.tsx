'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, MessageCircle, Pin, Lock, Eye, Reply, Upload, X, FileText, Image as ImageIcon, Paperclip } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/components/AuthProvider'
import { useToastNotification, ToastNotificationContainer } from '@/components/ui/ToastNotification'

interface ForumCategory {
  id: string
  name: string
  description: string
  order_index: number
  is_active: boolean
}

interface ForumThread {
  id: string
  category_id: string
  author_id: string
  title: string
  content: string
  is_pinned: boolean
  is_locked: boolean
  view_count: number
  reply_count: number
  last_reply_at: string | null
  created_at: string
}

export default function ClassForumPage({ 
  params 
}: { 
  params: { id: string; classId: string } 
}) {
  const router = useRouter()
  const { profile } = useAuth()
  const { toasts, success, error, warning, info, forum, removeToast } = useToastNotification()
  
  const [classData, setClassData] = useState<any>(null)
  const [program, setProgram] = useState<any>(null)
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [threads, setThreads] = useState<ForumThread[]>([])
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  // New thread form state
  const [showNewThread, setShowNewThread] = useState(false)
  const [newThreadTitle, setNewThreadTitle] = useState('')
  const [newThreadContent, setNewThreadContent] = useState('')
  const [newThreadCategoryId, setNewThreadCategoryId] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  useEffect(() => {
    fetchData()
  }, [params.classId])

  async function fetchData() {
    try {
      setLoading(true)
      
      // Fetch class data
      const { data: classDataResult, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('id', params.classId)
        .single()

      if (classError) throw classError
      setClassData(classDataResult)

      // Fetch program data
      const { data: programData, error: programError } = await supabase
        .from('programs')
        .select('*')
        .eq('id', params.id)
        .single()

      if (programError) throw programError
      setProgram(programData)

      // Fetch forum categories for this class
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('forum_categories')
        .select('*')
        .eq('class_id', params.classId)
        .eq('is_active', true)
        .order('order_index', { ascending: true })

      if (categoriesError) throw categoriesError
      setCategories(categoriesData || [])

      // Set first category as default if exists
      if (categoriesData && categoriesData.length > 0 && !newThreadCategoryId) {
        setNewThreadCategoryId((categoriesData[0] as any).id)
      }

      // Fetch threads
      if (categoriesData && categoriesData.length > 0) {
        const categoryIds = categoriesData.map((c: any) => (c as any).id)
        
        const { data: threadsData, error: threadsError } = await supabase
          .from('forum_threads')
          .select('*')
          .in('category_id', categoryIds)
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false })

        if (threadsError) throw threadsError
        setThreads(threadsData || [])

        // Fetch user profiles for thread authors
        if (threadsData && threadsData.length > 0) {
          const authorIds = Array.from(new Set(threadsData.map((t: any) => (t as any).author_id)))
          
          const { data: profilesData, error: profilesError } = await supabase
            .from('user_profiles')
            .select('id, full_name, email, role')
            .in('id', authorIds)

          if (!profilesError && profilesData) {
            const profilesMap = profilesData.reduce((acc: any, p: any) => {
              acc[p.id] = p
              return acc
            }, {})
            setUserProfiles(profilesMap)
          }
        }
      }
    } catch (err) {
      console.error('Error fetching forum data:', err)
      error('Error', 'Gagal memuat data forum')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateThread() {
    if (!newThreadTitle.trim() || !newThreadContent.trim() || !newThreadCategoryId) {
      warning('Validasi Gagal', 'Judul dan konten thread tidak boleh kosong')
      return
    }

    if (!profile?.id) {
      error('Akses Ditolak', 'Anda harus login untuk membuat thread')
      return
    }

    try {
      setSubmitting(true)

      let attachmentUrl = null

      // Upload attachment if exists
      if (attachment) {
        try {
          // Try to upload to Supabase storage
          const fileExt = attachment.name.split('.').pop()
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
          const filePath = `forum-attachments/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('forum-attachments')
            .upload(filePath, attachment)

          if (uploadError) {
            console.warn('Storage upload failed, using base64:', uploadError)
            // Fallback: use base64 for small images
            if (attachment.type.startsWith('image/') && attachment.size < 500000) { // 500KB limit
              attachmentUrl = await new Promise((resolve) => {
                const reader = new FileReader()
                reader.onload = (e) => resolve(e.target?.result as string)
                reader.readAsDataURL(attachment)
              })
            } else {
              throw new Error('File terlalu besar untuk upload. Maksimal 500KB untuk gambar.')
            }
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('forum-attachments')
              .getPublicUrl(filePath)
            attachmentUrl = publicUrl
          }
        } catch (storageError) {
          console.warn('Storage error, using base64 fallback:', storageError)
          // Fallback: use base64 for small images
          if (attachment.type.startsWith('image/') && attachment.size < 500000) {
            attachmentUrl = await new Promise((resolve) => {
              const reader = new FileReader()
              reader.onload = (e) => resolve(e.target?.result as string)
              reader.readAsDataURL(attachment)
            })
          } else {
            throw new Error('File terlalu besar untuk upload. Maksimal 500KB untuk gambar.')
          }
        }
      }

      // Create thread
      const { data: threadData, error: threadError } = await (supabase as any)
        .from('forum_threads')
        .insert({
          category_id: newThreadCategoryId,
          author_id: profile.id,
          title: newThreadTitle.trim(),
          content: newThreadContent.trim(),
          attachment_url: attachmentUrl,
          is_pinned: false,
          is_locked: false,
          view_count: 0,
          reply_count: 0
        })
        .select()
        .single()

      if (threadError) throw threadError

      // Reset form
      setNewThreadTitle('')
      setNewThreadContent('')
      setAttachment(null)
      setAttachmentPreview(null)
      setShowNewThread(false)

      // Refresh data
      await fetchData()

      forum('Thread Berhasil Dibuat!', 'Thread baru telah dipublikasikan di forum', 3000)
    } catch (err) {
      console.error('Error creating thread:', err)
      error('Error', 'Gagal membuat thread: ' + (err as any).message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleAttachmentChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setAttachment(file)
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setAttachmentPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setAttachmentPreview(null)
      }
    }
  }

  function removeAttachment() {
    setAttachment(null)
    setAttachmentPreview(null)
  }

  const filteredThreads = selectedCategory === 'all' 
    ? threads 
    : threads.filter(t => t.category_id === selectedCategory)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat forum...</p>
        </div>
      </div>
    )
  }

  if (!classData || !program) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Kelas tidak ditemukan</p>
          <Link 
            href={(profile as any)?.role === 'trainer' ? '/trainer/classes' : `/programs/${params.id}`} 
            className="text-indigo-600 hover:text-indigo-700 mt-4 inline-block"
          >
            {(profile as any)?.role === 'trainer' ? 'Kembali ke Kelas Saya' : 'Kembali ke Program'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-red-50">
      <ToastNotificationContainer toasts={toasts} onRemove={removeToast} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={(profile as any)?.role === 'trainer' ? '/trainer/classes' : `/programs/${params.id}/classes`}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {(profile as any)?.role === 'trainer' ? 'Kembali ke Kelas Saya' : 'Kembali ke Kelas'}
          </Link>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Forum Diskusi
            </h1>
            <p className="text-gray-600 mb-1">
              {program.title} - {classData.name}
            </p>
            <p className="text-sm text-gray-500">
              Diskusikan materi dan bertanya kepada trainer & peserta lain
            </p>
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Kategori Forum</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Semua ({threads.length})
              </button>
              {categories.map(category => {
                const categoryThreadCount = threads.filter(t => t.category_id === category.id).length
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {category.name} ({categoryThreadCount})
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* No Categories Message */}
        {categories.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <p className="text-yellow-800">
              Belum ada kategori forum untuk kelas ini. Kategori forum akan dibuat secara otomatis oleh sistem.
            </p>
          </div>
        )}

        {/* New Thread Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowNewThread(!showNewThread)}
            disabled={categories.length === 0}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Plus className="h-5 w-5 mr-2" />
            Buat Thread Baru
          </button>
        </div>

        {/* New Thread Form */}
        {showNewThread && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Buat Thread Baru</h3>
            
            <div className="space-y-4">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori
                </label>
                <select
                  value={newThreadCategoryId}
                  onChange={(e) => setNewThreadCategoryId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Judul Thread
                </label>
                <input
                  type="text"
                  value={newThreadTitle}
                  onChange={(e) => setNewThreadTitle(e.target.value)}
                  placeholder="Masukkan judul (thread as any)..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Konten
                </label>
                <textarea
                  value={newThreadContent}
                  onChange={(e) => setNewThreadContent(e.target.value)}
                  placeholder="Tulis pesan Anda..."
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Attachment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lampiran (Opsional)
                </label>
                <input
                  type="file"
                  onChange={handleAttachmentChange}
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  id="attachment-upload"
                />
                <label
                  htmlFor="attachment-upload"
                  className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Upload File
                </label>
                
                {/* Attachment Preview */}
                {attachment && (
                  <div className="mt-3 flex items-start space-x-3 p-3 bg-gradient-to-r from-primary-50 to-red-50 rounded-lg border border-primary-200">
                    {attachmentPreview ? (
                      <img src={attachmentPreview} alt="Preview" className="w-20 h-20 object-cover rounded" />
                    ) : (
                      <FileText className="h-8 w-8 text-gray-400" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                      <p className="text-xs text-gray-500">{(attachment.size / 1024).toFixed(2)} KB</p>
                    </div>
                    <button
                      onClick={removeAttachment}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowNewThread(false)
                    setNewThreadTitle('')
                    setNewThreadContent('')
                    setAttachment(null)
                    setAttachmentPreview(null)
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  onClick={handleCreateThread}
                  disabled={submitting || !newThreadTitle.trim() || !newThreadContent.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Menyimpan...' : 'Posting Thread'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Threads List */}
        <div className="space-y-4">
          {filteredThreads.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {selectedCategory === 'all' 
                  ? 'Belum ada thread diskusi. Jadilah yang pertama membuat thread!' 
                  : 'Belum ada thread di kategori ini.'}
              </p>
            </div>
          ) : (
            filteredThreads.map(thread => {
              const category = categories.find(c => c.id === (thread as any).category_id)
              const author = userProfiles[(thread as any).author_id]
              
              return (
                <Link
                  key={(thread as any).id}
                  href={`/programs/${params.id}/classes/${params.classId}/forum/${(thread as any).id}`}
                  className="block bg-gradient-to-br from-white to-indigo-50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100 hover:border-indigo-200 hover:scale-[1.02] hover:from-indigo-50 hover:to-blue-50"
                >
                  <div className="p-5 border-l-4 border-l-indigo-500">
                    {/* Top Row: Category & Icons */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-xs font-bold rounded-full shadow-lg transform hover:scale-105 transition-transform">
                          {category?.name || 'Umum'}
                        </span>
                        {(thread as any).is_pinned && (
                          <Pin className="h-5 w-5 text-indigo-600 animate-pulse" />
                        )}
                        {(thread as any).is_locked && (
                          <Lock className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Thread Title */}
                    <h3 className="text-xl font-bold text-gray-900 hover:text-indigo-600 transition-colors mb-4 leading-tight" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {(thread as any).title}
                    </h3>

                    {/* Bottom Row: Author */}
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full flex items-center justify-center mr-3 shadow-lg">
                        <span className="text-sm font-bold text-white">
                          {(author?.full_name || author?.email || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {author?.full_name || author?.email || 'Unknown'}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Row: Date & Stats */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 px-3 py-1.5 rounded-full shadow-sm">
                        {formatDate((thread as any).created_at)}
                      </span>
                      
                      {/* Stats - Compact */}
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-full font-bold shadow-md">
                          <Eye className="h-4 w-4 mr-1" />
                          {(thread as any).view_count}
                        </span>
                        <span className="flex items-center bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 rounded-full font-bold shadow-md">
                          <Reply className="h-4 w-4 mr-1" />
                          {(thread as any).reply_count}
                        </span>
                        {(thread as any).attachment_url && (
                          <span className="flex items-center bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1.5 rounded-full font-bold shadow-md">
                            <Paperclip className="h-4 w-4 mr-1" />
                            File
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

