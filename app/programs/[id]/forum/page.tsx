'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, MessageCircle, Pin, Lock, Eye, Reply, ThumbsUp, CheckCircle } from 'lucide-react'
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
  const [submitting, setSubmitting] = useState(false)

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
      const { data, error } = await supabase
        .from('forum_threads')
        .insert([{
          category_id: categoryId,
          author_id: profile?.id,
          title: newThreadTitle,
          content: newThreadContent
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
        <Link href="/my-enrollments" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Kembali ke Pendaftaran Saya</span>
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
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Kategori</h2>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCategory('all')}
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
                  onClick={() => setSelectedCategory(category.id)}
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
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {thread.content}
                        </p>
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
    </div>
  )
}
