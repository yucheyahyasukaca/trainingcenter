'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, MessageCircle, Pin, Lock, Eye, Reply, ThumbsUp, CheckCircle, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/components/AuthProvider'

export default function ProgramForumPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { profile } = useAuth()
  const [program, setProgram] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [threads, setThreads] = useState<any[]>([])
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showNewThread, setShowNewThread] = useState(false)
  const [newThreadTitle, setNewThreadTitle] = useState('')
  const [newThreadContent, setNewThreadContent] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [openAttachment, setOpenAttachment] = useState<string | null>(null)
  const [categoriesOpen, setCategoriesOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [params.id])

  async function fetchData() {
    try {
      console.log('Fetching forum data for program:', params.id)
      console.log('Current user profile:', profile)

      // Fetch program
      const { data: programData, error: programError } = await supabase
        .from('programs')
        .select('*')
        .eq('id', params.id)
        .single()

      if (programError) {
        console.error('Error fetching program:', programError)
        throw programError
      }

      console.log('Program data:', programData)

      // Allow access to all authenticated users for now
      console.log('Allowing access to forum for all authenticated users')

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('forum_categories')
        .select('*')
        .eq('program_id', params.id)
        .order('name')

      if (categoriesError) throw categoriesError

      // Fetch threads (simplified query)
      const { data: threadsData, error: threadsError } = await supabase
        .from('forum_threads')
        .select('*')
        .in('category_id', categoriesData?.map(c => c.id) || [])
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

      if (threadsError) throw threadsError

      // Fetch user profiles for all thread authors
      const authorIds = [...new Set(threadsData?.map(thread => thread.author_id) || [])]
      let userProfilesData: Record<string, any> = {}
      
      if (authorIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, full_name, email')
          .in('id', authorIds)

        if (!profilesError && profilesData) {
          userProfilesData = profilesData.reduce((acc, profile) => {
            acc[profile.id] = profile
            return acc
          }, {} as Record<string, any>)
        }
      }

      setProgram(programData)
      setCategories(categoriesData || [])
      setThreads(threadsData || [])
      setUserProfiles(userProfilesData)
    } catch (error) {
      console.error('Error fetching data:', error)
      // Don't redirect on error, just show the error
      alert(`Error loading forum: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  // Compress image in browser before upload to save storage and bandwidth
  async function compressImage(inputFile: File, opts?: { maxWidth?: number; maxHeight?: number; quality?: number; mimeType?: string }) {
    const maxWidth = opts?.maxWidth ?? 1600
    const maxHeight = opts?.maxHeight ?? 1200
    const quality = opts?.quality ?? 0.8
    const mimeType = opts?.mimeType ?? 'image/jpeg'

    const imageBitmap = await createImageBitmap(inputFile)
    let targetWidth = imageBitmap.width
    let targetHeight = imageBitmap.height

    // keep aspect ratio
    const widthRatio = maxWidth / targetWidth
    const heightRatio = maxHeight / targetHeight
    const ratio = Math.min(1, widthRatio, heightRatio)
    targetWidth = Math.round(targetWidth * ratio)
    targetHeight = Math.round(targetHeight * ratio)

    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight)
    const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b as Blob), mimeType, quality))
    return blob
  }

  async function createThread() {
    if (!newThreadTitle.trim() || !newThreadContent.trim()) return

    const categoryId = selectedCategory === 'all' ? categories[0]?.id : selectedCategory

    console.log('Creating thread:', {
      category_id: categoryId,
      author_id: profile?.id,
      title: newThreadTitle,
      content: newThreadContent
    })

    setSubmitting(true)
    try {
      let finalContent = newThreadContent

      // Upload image attachment if any, then append URL to content
      if (attachment) {
        const compressedBlob = await compressImage(attachment, { maxWidth: 1600, maxHeight: 1200, quality: 0.8, mimeType: 'image/jpeg' })
        const filePath = `${profile?.id}/${Date.now()}.jpg`
        const body = new FormData()
        body.append('file', new File([compressedBlob], 'attachment.jpg', { type: 'image/jpeg' }))
        body.append('path', filePath)
        const res = await fetch('/api/forum/upload', { method: 'POST', body })
        const json = await res.json()
        if (res.ok && json?.url) {
          finalContent = `${newThreadContent}\n\n![lampiran](${json.url})`
        } else {
          console.warn('Attachment upload failed:', json?.error)
        }
      }

      const { data, error } = await supabase
        .from('forum_threads')
        .insert([{
          category_id: categoryId,
          author_id: profile?.id,
          title: newThreadTitle,
          content: finalContent
        }])
        .select()

      console.log('Thread insert result:', { data, error })

      if (error) {
        console.error('Detailed error:', error)
        throw error
      }

      console.log('Thread created successfully')
      setNewThreadTitle('')
      setNewThreadContent('')
      setShowNewThread(false)
      setAttachment(null)
      setAttachmentPreview(null)
      fetchData()
    } catch (error) {
      console.error('Error creating thread:', error)
      alert(`Gagal membuat thread: ${error.message || 'Unknown error'}`)
    } finally {
      setSubmitting(false)
    }
  }

  async function incrementViewCount(threadId: string) {
    try {
      await supabase.rpc('increment_thread_view', { thread_id: threadId })
    } catch (error) {
      console.error('Error incrementing view count:', error)
    }
  }

  // Extract markdown images from content and render a cleaner preview
  function renderPreviewContent(text: string) {
    const imageRegex = /!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/g
    const images: string[] = []
    let match
    while ((match = imageRegex.exec(text)) !== null) {
      images.push(match[1])
    }
    const cleaned = text.replace(imageRegex, '').trim()
    return (
      <>
        {cleaned && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{cleaned}</p>
        )}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.slice(0, 3).map((url, idx) => (
              <button key={idx} onClick={(e) => { e.stopPropagation(); setOpenAttachment(url) }}>
                <img src={url} alt={`Lampiran ${idx + 1}`} className="w-20 h-14 object-cover rounded-md border border-gray-200" />
              </button>
            ))}
            {images.length > 3 && (
              <div className="w-20 h-14 rounded-md border border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-600">
                +{images.length - 3}
              </div>
            )}
          </div>
        )}
      </>
    )
  }

  const filteredThreads = selectedCategory === 'all' 
    ? threads 
    : threads.filter(thread => thread.category_id === selectedCategory)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/programs" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Kembali ke Daftar Program</span>
          <span className="sm:hidden">Kembali</span>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Forum Diskusi</h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          {program?.title} - Diskusi dan tanya jawab dengan peserta lain
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 p-6 shadow-sm lg:sticky lg:top-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Kategori</h2>
              <button
                className="lg:hidden inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-primary-50 hover:border-primary-200 text-gray-700 transition-colors"
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                aria-expanded={categoriesOpen}
                aria-controls="forum-category-list"
              >
                <span>{categoriesOpen ? 'Tutup' : 'Lihat semua'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
            <div id="forum-category-list" className={`space-y-2 lg:space-y-2 overflow-hidden lg:overflow-visible transition-[max-height] duration-300 ${categoriesOpen ? 'max-h-96' : 'max-h-0 lg:max-h-none'} lg:max-h-none lg:block`}>
              <button
                onClick={() => { setSelectedCategory('all'); if (window.innerWidth < 1024) setCategoriesOpen(false) }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === 'all' 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Semua Kategori
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => { setSelectedCategory(category.id); if (window.innerWidth < 1024) setCategoriesOpen(false) }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category.id 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Threads List */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedCategory === 'all' ? 'Semua Thread' : categories.find(c => c.id === selectedCategory)?.name}
              </h2>
              <button
                onClick={() => setShowNewThread(true)}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Thread Baru
              </button>
            </div>

            {/* New Thread Form */}
            {showNewThread && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Buat Thread Baru</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Judul</label>
                    <input
                      type="text"
                      value={newThreadTitle}
                      onChange={(e) => setNewThreadTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      placeholder="Masukkan judul thread..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Konten</label>
                    <textarea
                      value={newThreadContent}
                      onChange={(e) => setNewThreadContent(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      placeholder="Tulis pesan Anda..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lampiran Gambar (opsional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setAttachment(file)
                        setAttachmentPreview(file ? URL.createObjectURL(file) : null)
                      }}
                      className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                    {attachmentPreview && (
                      <div className="mt-3">
                        <img src={attachmentPreview} alt="Preview lampiran" className="rounded-lg border border-gray-200 max-h-48" />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowNewThread(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      onClick={createThread}
                      disabled={submitting || !newThreadTitle.trim() || !newThreadContent.trim()}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Membuat...' : 'Buat Thread'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Threads List */}
            {filteredThreads.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Belum ada thread di kategori ini</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredThreads.map((thread) => (
                  <div
                    key={thread.id}
                    className="p-5 bg-white/70 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
                    onClick={() => {
                      incrementViewCount(thread.id)
                      router.push(`/programs/${params.id}/forum/${thread.id}`)
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          {thread.is_pinned && (
                            <Pin className="w-4 h-4 text-yellow-500" />
                          )}
                          {thread.is_locked && (
                            <Lock className="w-4 h-4 text-red-500" />
                          )}
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {thread.title}
                          </h3>
                        </div>
                        <div className="mb-3">
                          {renderPreviewContent(thread.content || '')}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-600">
                          <span className="inline-flex items-center gap-2">
                            <span className="inline-flex h-6 items-center rounded-full bg-gray-100 px-3 font-medium text-gray-700">
                              {userProfiles[thread.author_id]?.full_name || 'User Garuda Academy'}
                            </span>
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span>{formatDate(thread.created_at)}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="inline-flex items-center">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            {thread.reply_count || 0} balasan
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span className="inline-flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            {thread.view_count || 0} dilihat
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 text-right">
                        <div className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                          {categories.find(c => c.id === thread.category_id)?.name || 'Kategori'}
                        </div>
                        {thread.last_reply_at && (
                          <div className="mt-2 text-xs text-gray-500">
                            Terakhir: {formatDate(thread.last_reply_at)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Attachment Drawer */}
      {openAttachment && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpenAttachment(null)} />
          <div className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white shadow-xl p-4 sm:p-6 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Lampiran Gambar</h3>
              <button onClick={() => setOpenAttachment(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <img src={openAttachment} alt="Lampiran" className="w-full h-auto rounded-lg border border-gray-200" />
          </div>
        </div>
      )}
    </div>
  )
}
