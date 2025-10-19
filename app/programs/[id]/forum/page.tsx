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
      // Fetch program
      const { data: programData, error: programError } = await supabase
        .from('programs')
        .select('*')
        .eq('id', params.id)
        .single()

      if (programError) throw programError

      // Check if user is enrolled
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('program_id', params.id)
        .eq('participant_id', profile?.id)
        .eq('status', 'approved')
        .single()

      if (enrollmentError && enrollmentError.code !== 'PGRST116') {
        throw enrollmentError
      }

      if (!enrollmentData && profile?.role !== 'admin' && profile?.role !== 'manager') {
        router.push('/my-enrollments')
        return
      }

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('forum_categories')
        .select('*')
        .eq('program_id', params.id)
        .order('name')

      if (categoriesError) throw categoriesError

      // Fetch threads
      const { data: threadsData, error: threadsError } = await supabase
        .from('forum_threads')
        .select(`
          *,
          author:user_profiles(full_name, avatar_url),
          category:forum_categories(name)
        `)
        .in('category_id', categoriesData?.map(c => c.id) || [])
        .order('is_pinned', { ascending: false })
        .order('last_reply_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (threadsError) throw threadsError

      setProgram(programData)
      setCategories(categoriesData || [])
      setThreads(threadsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      router.push('/my-enrollments')
    } finally {
      setLoading(false)
    }
  }

  async function createThread() {
    if (!newThreadTitle.trim() || !newThreadContent.trim()) return

    setSubmitting(true)
    try {
      const categoryId = selectedCategory === 'all' ? categories[0]?.id : selectedCategory

      const { error } = await supabase
        .from('forum_threads')
        .insert([{
          category_id: categoryId,
          author_id: profile?.id,
          title: newThreadTitle,
          content: newThreadContent
        }])

      if (error) throw error

      setNewThreadTitle('')
      setNewThreadContent('')
      setShowNewThread(false)
      fetchData()
    } catch (error) {
      console.error('Error creating thread:', error)
      alert('Gagal membuat thread')
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
          <div className="bg-white rounded-xl border border-gray-200 p-6">
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
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
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
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {thread.title}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {thread.content}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Oleh {thread.author?.full_name}</span>
                          <span>•</span>
                          <span>{formatDate(thread.created_at)}</span>
                          <span>•</span>
                          <span className="flex items-center">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            {thread.reply_count} balasan
                          </span>
                          <span>•</span>
                          <span className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            {thread.view_count} dilihat
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <div className="text-right text-sm text-gray-500">
                          <div className="font-medium text-gray-900">
                            {thread.category?.name}
                          </div>
                          {thread.last_reply_at && (
                            <div>
                              Terakhir: {formatDate(thread.last_reply_at)}
                            </div>
                          )}
                        </div>
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
