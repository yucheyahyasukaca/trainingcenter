'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Reply, ThumbsUp, CheckCircle, Pin, Lock, Send } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/components/AuthProvider'

export default function ThreadDetailPage({ params }: { params: { id: string, threadId: string } }) {
  const router = useRouter()
  const { profile } = useAuth()
  const [thread, setThread] = useState<any>(null)
  const [replies, setReplies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newReply, setNewReply] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [params.threadId])

  async function fetchData() {
    try {
      // Fetch thread
      const { data: threadData, error: threadError } = await supabase
        .from('forum_threads')
        .select(`
          *,
          author:user_profiles(full_name, avatar_url),
          category:forum_categories(name)
        `)
        .eq('id', params.threadId)
        .single()

      if (threadError) throw threadError

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

      // Fetch replies
      const { data: repliesData, error: repliesError } = await supabase
        .from('forum_replies')
        .select(`
          *,
          author:user_profiles(full_name, avatar_url),
          parent_reply:forum_replies(
            id,
            author:user_profiles(full_name)
          )
        `)
        .eq('thread_id', params.threadId)
        .order('created_at', { ascending: true })

      if (repliesError) throw repliesError

      // Increment view count
      await supabase.rpc('increment_thread_view', { thread_id: params.threadId })

      setThread(threadData)
      setReplies(repliesData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      router.push(`/programs/${params.id}/forum`)
    } finally {
      setLoading(false)
    }
  }

  async function submitReply() {
    if (!newReply.trim()) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('forum_replies')
        .insert([{
          thread_id: params.threadId,
          author_id: profile?.id,
          content: newReply,
          parent_reply_id: replyingTo || null
        }])

      if (error) throw error

      setNewReply('')
      setReplyingTo(null)
      fetchData()
    } catch (error) {
      console.error('Error submitting reply:', error)
      alert('Gagal mengirim balasan')
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleReaction(replyId: string, type: string) {
    try {
      const { error } = await supabase
        .from('forum_reactions')
        .upsert([{
          user_id: profile?.id,
          reply_id: replyId,
          reaction_type: type
        }])

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error toggling reaction:', error)
    }
  }

  const groupedReplies = replies.reduce((acc, reply) => {
    if (reply.parent_reply_id) {
      if (!acc[reply.parent_reply_id]) {
        acc[reply.parent_reply_id] = []
      }
      acc[reply.parent_reply_id].push(reply)
    } else {
      if (!acc['root']) {
        acc['root'] = []
      }
      acc['root'].push(reply)
    }
    return acc
  }, {} as Record<string, any[]>)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!thread) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thread Tidak Ditemukan</h1>
          <p className="text-gray-600 mb-6">Thread yang Anda cari tidak tersedia.</p>
          <Link href={`/programs/${params.id}/forum`} className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Forum
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/programs/${params.id}/forum`} className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Kembali ke Forum</span>
          <span className="sm:hidden">Kembali</span>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{thread.title}</h1>
        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
          <span>Kategori: {thread.category?.name}</span>
          <span>•</span>
          <span>Oleh {thread.author?.full_name}</span>
          <span>•</span>
          <span>{formatDate(thread.created_at)}</span>
          <span>•</span>
          <span>{thread.view_count} dilihat</span>
        </div>
      </div>

      {/* Thread Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            {thread.is_pinned && (
              <Pin className="w-4 h-4 text-yellow-500" />
            )}
            {thread.is_locked && (
              <Lock className="w-4 h-4 text-red-500" />
            )}
          </div>
        </div>
        
        <div className="prose max-w-none">
          <div className="whitespace-pre-wrap text-gray-900">{thread.content}</div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => toggleReaction(thread.id, 'like')}
              className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Suka</span>
            </button>
          </div>
          <div className="text-sm text-gray-500">
            {thread.reply_count} balasan
          </div>
        </div>
      </div>

      {/* Replies */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Balasan ({thread.reply_count})</h2>
        
        {groupedReplies['root']?.map((reply) => (
          <div key={reply.id} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-700">
                    {reply.author?.full_name?.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{reply.author?.full_name}</div>
                  <div className="text-sm text-gray-500">{formatDate(reply.created_at)}</div>
                </div>
              </div>
              {reply.is_solution && (
                <div className="flex items-center space-x-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Solusi</span>
                </div>
              )}
            </div>
            
            <div className="prose max-w-none mb-4">
              <div className="whitespace-pre-wrap text-gray-900">{reply.content}</div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => toggleReaction(reply.id, 'like')}
                  className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Suka</span>
                </button>
                <button
                  onClick={() => setReplyingTo(replyingTo === reply.id ? null : reply.id)}
                  className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <Reply className="w-4 h-4" />
                  <span>Balas</span>
                </button>
              </div>
            </div>

            {/* Nested Replies */}
            {groupedReplies[reply.id] && (
              <div className="mt-4 ml-8 space-y-4">
                {groupedReplies[reply.id].map((nestedReply) => (
                  <div key={nestedReply.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {nestedReply.author?.full_name?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{nestedReply.author?.full_name}</div>
                          <div className="text-xs text-gray-500">{formatDate(nestedReply.created_at)}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap text-gray-900 text-sm">{nestedReply.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Form */}
            {replyingTo === reply.id && (
              <div className="mt-4 ml-8">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <textarea
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                      placeholder="Tulis balasan Anda..."
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="px-3 py-1 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        onClick={submitReply}
                        disabled={submitting || !newReply.trim()}
                        className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Mengirim...' : 'Kirim'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {(!groupedReplies['root'] || groupedReplies['root'].length === 0) && (
          <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Belum ada balasan untuk thread ini</p>
          </div>
        )}
      </div>

      {/* New Reply Form */}
      {!replyingTo && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tulis Balasan</h3>
          <div className="space-y-4">
            <textarea
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="Tulis balasan Anda..."
            />
            <div className="flex justify-end">
              <button
                onClick={submitReply}
                disabled={submitting || !newReply.trim()}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 mr-2" />
                {submitting ? 'Mengirim...' : 'Kirim Balasan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
