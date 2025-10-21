'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, Pin, Lock, Eye, ThumbsUp, MoreVertical, Trash2, Edit2 } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/components/AuthProvider'
import { useToastNotification, ToastNotificationContainer } from '@/components/ui/ToastNotification'

interface ThreadData {
  id: string
  category_id: string
  author_id: string
  title: string
  content: string
  is_pinned: boolean
  is_locked: boolean
  view_count: number
  reply_count: number
  created_at: string
}

interface Reply {
  id: string
  thread_id: string
  author_id: string
  content: string
  parent_reply_id: string | null
  is_solution: boolean
  created_at: string
}

export default function ThreadDetailPage({ 
  params 
}: { 
  params: { id: string; classId: string; threadId: string } 
}) {
  const router = useRouter()
  const { profile } = useAuth()
  const { toasts, success, error, warning, info, forum, removeToast } = useToastNotification()
  
  const [classData, setClassData] = useState<any>(null)
  const [program, setProgram] = useState<any>(null)
  const [thread, setThread] = useState<ThreadData | null>(null)
  const [category, setCategory] = useState<any>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  
  // Reply form state
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  
  useEffect(() => {
    fetchData()
  }, [params.threadId])

  async function fetchData() {
    try {
      setLoading(true)
      
      // Fetch thread
      const { data: threadData, error: threadError } = await supabase
        .from('forum_threads')
        .select('*')
        .eq('id', params.threadId)
        .single()

      if (threadError) {
        console.error('Thread not found:', threadError)
        if (threadError.code === 'PGRST116') {
          // Thread not found
          setThread(null)
          return
        }
        throw threadError
      }
      
      if (!threadData) {
        console.error('Thread data is null')
        setThread(null)
        return
      }
      
      setThread(threadData)

      // View count increment - skip for now to avoid RPC errors
      // TODO: Implement view count increment after RPC function is created

      // Fetch category
      const { data: categoryData, error: categoryError } = await supabase
        .from('forum_categories')
        .select('*')
        .eq('id', threadData.category_id)
        .single()

      if (categoryError) throw categoryError
      setCategory(categoryData)

      // Fetch class data
      const { data: classDataResult, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('id', params.classId)
        .single()

      if (classError) throw classError
      setClassData(classDataResult)

      // Fetch program
      const { data: programData, error: programError } = await supabase
        .from('programs')
        .select('*')
        .eq('id', params.id)
        .single()

      if (programError) throw programError
      setProgram(programData)

      // Fetch replies
      const { data: repliesData, error: repliesError } = await supabase
        .from('forum_replies')
        .select('*')
        .eq('thread_id', params.threadId)
        .order('created_at', { ascending: true })

      if (repliesError) throw repliesError
      setReplies(repliesData || [])

      // Fetch user profiles
      const allUserIds = [
        threadData.author_id,
        ...(repliesData?.map(r => r.author_id) || [])
      ]
      const uniqueUserIds = Array.from(new Set(allUserIds))

      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, role')
        .in('id', uniqueUserIds)

      if (!profilesError && profilesData) {
        const profilesMap = profilesData.reduce((acc: any, p: any) => {
          acc[p.id] = p
          return acc
        }, {})
        setUserProfiles(profilesMap)
      }
    } catch (err) {
      console.error('Error fetching thread data:', err)
      error('Error', 'Gagal memuat data thread')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitReply() {
    if (!replyContent.trim()) {
      alert('Konten reply tidak boleh kosong')
      return
    }

    if (!profile?.id) {
      alert('Anda harus login untuk membalas thread')
      return
    }

    try {
      setSubmitting(true)

      const { error: replyError } = await supabase
        .from('forum_replies')
        .insert({
          thread_id: params.threadId,
          author_id: profile.id,
          content: replyContent.trim(),
          parent_reply_id: replyingTo
        })

      if (replyError) throw replyError

      // Reset form
      setReplyContent('')
      setReplyingTo(null)

      // Refresh data
      await fetchData()

      forum('Reply Berhasil Ditambahkan!', 'Balasan Anda telah dipublikasikan', 3000)
    } catch (err) {
      console.error('Error submitting reply:', err)
      error('Error', 'Gagal menambahkan reply: ' + (err as any).message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteThread() {
    if (!confirm('Apakah Anda yakin ingin menghapus thread ini?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('forum_threads')
        .delete()
        .eq('id', params.threadId)

      if (error) throw error

      success('Thread Berhasil Dihapus', 'Thread telah dihapus dari forum', 2000)
      setTimeout(() => {
        router.push(`/programs/${params.id}/classes/${params.classId}/forum`)
      }, 1000)
    } catch (err) {
      console.error('Error deleting thread:', err)
      error('Error', 'Gagal menghapus thread: ' + (err as any).message)
    }
  }

  async function handleDeleteReply(replyId: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus reply ini?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('forum_replies')
        .delete()
        .eq('id', replyId)

      if (error) throw error

      success('Reply Berhasil Dihapus', 'Balasan telah dihapus dari thread', 2000)
      await fetchData()
    } catch (err) {
      console.error('Error deleting reply:', err)
      error('Error', 'Gagal menghapus reply: ' + (err as any).message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat thread...</p>
        </div>
      </div>
    )
  }

  if (!thread || !classData || !program) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <ToastNotificationContainer toasts={toasts} onRemove={removeToast} />
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Thread Tidak Ditemukan</h1>
          <p className="text-gray-600 mb-6">
            Thread yang Anda cari tidak ditemukan atau mungkin telah dihapus.
          </p>
          <div className="space-y-3">
            <Link 
              href={`/programs/${params.id}/classes/${params.classId}/forum`} 
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Forum
            </Link>
            <Link 
              href={`/programs/${params.id}/classes/${params.classId}`} 
              className="block text-sm text-gray-500 hover:text-gray-700"
            >
              Kembali ke Kelas
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const threadAuthor = userProfiles[thread.author_id]
  const isThreadAuthor = profile?.id === thread.author_id
  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'
  const canModerate = isThreadAuthor || isAdmin

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <ToastNotificationContainer toasts={toasts} onRemove={removeToast} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href={`/programs/${params.id}/classes/${params.classId}/forum`}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Forum
          </Link>
        </div>

        {/* Thread */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="p-6 border-b border-gray-200">
            {/* Thread Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {thread.is_pinned && (
                    <Pin className="h-5 w-5 text-indigo-600" />
                  )}
                  {thread.is_locked && (
                    <Lock className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">
                    {category?.name || 'Umum'}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {thread.title}
                </h1>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-2">
                        <span className="text-xs font-medium text-indigo-600">
                          {(threadAuthor?.full_name || threadAuthor?.email || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span>
                        oleh <strong>{threadAuthor?.full_name || threadAuthor?.email || 'Unknown'}</strong>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="bg-gray-50 px-2 py-1 rounded text-xs">
                      {formatDate(thread.created_at)}
                    </span>
                    <span className="inline-flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      {thread.view_count} views
                    </span>
                  </div>
                </div>
              </div>
              
              {canModerate && (
                <div className="relative">
                  <button
                    onClick={handleDeleteThread}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                    title="Hapus Thread"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Thread Content */}
            <div className="prose max-w-none text-gray-700">
              <p className="whitespace-pre-wrap">{thread.content}</p>
            </div>
          </div>

          {/* Replies Section */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Balasan ({replies.length})
            </h2>

            {/* Replies List */}
            <div className="space-y-4 mb-6">
              {replies.map(reply => {
                const replyAuthor = userProfiles[reply.author_id]
                const isReplyAuthor = profile?.id === reply.author_id
                const canModerateReply = isReplyAuthor || isAdmin

                return (
                  <div key={reply.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-indigo-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-indigo-600">
                            {(replyAuthor?.full_name || replyAuthor?.email || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <strong className="text-sm text-gray-900">
                              {replyAuthor?.full_name || replyAuthor?.email || 'Unknown'}
                            </strong>
                            {replyAuthor?.role === 'trainer' && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                                Trainer
                              </span>
                            )}
                            {replyAuthor?.role === 'admin' && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                                Admin
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {formatDate(reply.created_at)}
                          </span>
                        </div>
                      </div>
                      
                      {canModerateReply && (
                        <button
                          onClick={() => handleDeleteReply(reply.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Hapus Reply"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{reply.content}</p>
                  </div>
                )
              })}

              {replies.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  Belum ada balasan. Jadilah yang pertama membalas!
                </p>
              )}
            </div>

            {/* Reply Form */}
            {!thread.is_locked && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Tambah Balasan
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-indigo-600">
                        {(profile?.full_name || profile?.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {profile?.full_name || profile?.email || 'Anda'}
                      </p>
                    </div>
                  </div>
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Tulis balasan Anda..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4 resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSubmitReply}
                      disabled={submitting || !replyContent.trim()}
                      className="inline-flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {submitting ? 'Mengirim...' : 'Kirim Balasan'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {thread.is_locked && (
              <div className="border-t border-gray-200 pt-6">
                <div className="bg-gray-100 rounded-lg p-4 text-center">
                  <Lock className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Thread ini telah dikunci. Tidak dapat menambahkan balasan baru.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

