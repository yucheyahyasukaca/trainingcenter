'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Reply, ThumbsUp, CheckCircle, Pin, Lock, Send, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/components/AuthProvider'

export default function ThreadDetailPage({ params }: { params: { id: string, threadId: string } }) {
  const router = useRouter()
  const { profile } = useAuth()
  const [thread, setThread] = useState<any>(null)
  const [replies, setReplies] = useState<any[]>([])
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({})
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [newReply, setNewReply] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [threadLikeCount, setThreadLikeCount] = useState<number>(0)
  const [likedThread, setLikedThread] = useState<boolean>(false)
  const [replyLikeCount, setReplyLikeCount] = useState<Record<string, number>>({})
  const [likedReplies, setLikedReplies] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchData()
  }, [params.threadId])

  async function fetchData() {
    try {
      console.log('Fetching thread data for thread:', params.threadId)
      console.log('Current user profile:', profile)

      setErrorMessage(null)

      console.log('[forum] fetch thread start')
      // Fetch thread (simplified query)
      const { data: threadData, error: threadError } = await supabase
        .from('forum_threads')
        .select('*')
        .eq('id', params.threadId)
        .single()

      if (threadError) {
        console.error('Error fetching thread:', threadError)
        setErrorMessage('Tidak dapat memuat thread.');
        throw threadError
      }

      console.log('[forum] thread ok:', threadData)

      // Allow access to all authenticated users for now
      console.log('Allowing access to thread for all authenticated users')

      console.log('[forum] fetch replies start')
      let repliesData: any[] = []
      try {
        const { data: rData, error: repliesError } = await supabase
          .from('forum_replies')
          .select('*')
          .eq('thread_id', params.threadId)
          .order('created_at', { ascending: true })
        if (!repliesError && Array.isArray(rData)) {
          repliesData = rData
        } else if (repliesError) {
          console.warn('Replies fetch error (ignored):', repliesError)
        }
      } catch (e) {
        console.warn('Replies fetch threw (ignored):', e)
      }
      console.log('[forum] replies ok:', repliesData?.length)

      // Fetch categories for this program
      console.log('[forum] fetch categories start')
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('forum_categories')
        .select('*')
        .eq('program_id', params.id)
        .order('name')

      if (categoriesError) {
        console.log('Error fetching categories:', categoriesError)
        setErrorMessage('Kategori forum gagal dimuat.')
      }

      // Fetch user profiles for thread author and reply authors (defensive)
      const repliesArr = Array.isArray(repliesData) ? (repliesData as any[]) : []
      const authorIds = [
        (threadData as any)?.author_id,
        ...repliesArr.map((reply: any) => reply?.author_id)
      ].filter(Boolean)
      
      let userProfilesData: Record<string, any> = {}
      
      if (authorIds.length > 0) {
        console.log('[forum] fetch user profiles for', authorIds.length)
        const { data: profilesData, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, full_name, email')
          .in('id', authorIds)

        if (!profilesError && Array.isArray(profilesData)) {
          userProfilesData = (profilesData as any[]).reduce((acc: Record<string, any>, profile: any) => {
            if (profile?.id) acc[profile.id as string] = profile
            return acc
          }, {})
        }
      }
      console.log('[forum] profiles ok:', Object.keys(userProfilesData).length)

      // Fetch likes for thread
      try {
        console.log('[forum] fetch likes start')
        const { data: threadLikes } = await (supabase as any)
          .from('forum_reactions')
          .select('user_id')
          .eq('thread_id', params.threadId)
          .eq('reaction_type', 'like')

        const replyIds = repliesArr.map((r: any) => r?.id).filter(Boolean)
        let replyLikesData: any[] = []
        if (replyIds.length > 0) {
          const { data: rLikes } = await (supabase as any)
            .from('forum_reactions')
            .select('user_id, reply_id')
            .in('reply_id', replyIds)
            .eq('reaction_type', 'like')
          replyLikesData = rLikes || []
        }

        const replyCountMap: Record<string, number> = {}
        const likedMap: Record<string, boolean> = {}
        (replyLikesData as any[]).forEach((rl: any) => {
          replyCountMap[rl.reply_id as string] = (replyCountMap[rl.reply_id as string] || 0) + 1
          if (rl.user_id === profile?.id) likedMap[rl.reply_id as string] = true
        })

        const threadLikesArr = Array.isArray(threadLikes) ? (threadLikes as any[]) : []
        setThreadLikeCount(threadLikesArr.length)
        setLikedThread(Boolean(threadLikesArr.some((l: any) => l?.user_id === profile?.id)))
        setReplyLikeCount(replyCountMap)
        setLikedReplies(likedMap)
      } catch (likesErr) {
        console.warn('[forum] likes block failed (ignored):', likesErr)
        setThreadLikeCount(0)
        setLikedThread(false)
        setReplyLikeCount({})
        setLikedReplies({})
      }

      // Increment view count (simplified)
      try {
        await (supabase as any)
          .from('forum_threads')
          .update({ view_count: (threadData as any).view_count ? (threadData as any).view_count + 1 : 1 })
          .eq('id', params.threadId)
      } catch (error) {
        console.log('Could not increment view count:', error)
      }

      setThread(threadData)
      setReplies(repliesData || [])
      setUserProfiles(userProfilesData)
      setCategories(categoriesData || [])
      console.log('[forum] state set complete')
    } catch (error) {
      console.error('Error fetching data:', error)
      // Keep inline error message visible; avoid redirect/alert
      if (!errorMessage) setErrorMessage('Terjadi kesalahan saat memuat data.')
    } finally {
      setLoading(false)
    }
  }

  async function submitReply() {
    if (!newReply.trim()) return

    console.log('Submitting reply:', {
      thread_id: params.threadId,
      author_id: profile?.id,
      content: newReply,
      parent_reply_id: replyingTo || null
    })

    setSubmitting(true)
    try {
      const { data, error } = await (supabase as any)
        .from('forum_replies')
        .insert([{
          thread_id: params.threadId,
          author_id: profile?.id,
          content: newReply,
          parent_reply_id: replyingTo || null
        }])
        .select()

      console.log('Reply insert result:', { data, error })

      if (error) {
        console.error('Detailed error:', error)
        throw error
      }

      console.log('Reply submitted successfully')
      setNewReply('')
      setReplyingTo(null)
      fetchData()
    } catch (error: any) {
      console.error('Error submitting reply:', error)
      alert(`Gagal mengirim balasan: ${error?.message || 'Unknown error'}`)
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleThreadLike() {
    if (!profile?.id) return
    try {
      if (likedThread) {
        const { error } = await (supabase as any)
          .from('forum_reactions')
          .delete()
          .eq('user_id', profile.id)
          .eq('thread_id', params.threadId)
          .eq('reaction_type', 'like')
        if (error) throw error
        setLikedThread(false)
        setThreadLikeCount((c) => Math.max(0, c - 1))
      } else {
        const { error } = await (supabase as any)
          .from('forum_reactions')
          .upsert([{ user_id: profile.id, thread_id: params.threadId, reaction_type: 'like' }])
        if (error) throw error
        setLikedThread(true)
        setThreadLikeCount((c) => c + 1)
      }
    } catch (error) {
      console.error('Error toggling thread like:', error)
    }
  }

  async function toggleReplyLike(replyId: string) {
    if (!profile?.id) return
    const isLiked = likedReplies[replyId]
    try {
      if (isLiked) {
        const { error } = await (supabase as any)
          .from('forum_reactions')
          .delete()
          .eq('user_id', profile.id)
          .eq('reply_id', replyId)
          .eq('reaction_type', 'like')
        if (error) throw error
        setLikedReplies((m) => ({ ...m, [replyId]: false }))
        setReplyLikeCount((m) => ({ ...m, [replyId]: Math.max(0, (m[replyId] || 1) - 1) }))
      } else {
        const { error } = await (supabase as any)
          .from('forum_reactions')
          .upsert([{ user_id: profile.id, reply_id: replyId, reaction_type: 'like' }])
        if (error) throw error
        setLikedReplies((m) => ({ ...m, [replyId]: true }))
        setReplyLikeCount((m) => ({ ...m, [replyId]: (m[replyId] || 0) + 1 }))
      }
    } catch (error) {
      console.error('Error toggling reply like:', error)
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
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}
      <div>
        <Link href={`/programs/${params.id}/forum`} className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Kembali ke Forum</span>
          <span className="sm:hidden">Kembali</span>
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{thread.title}</h1>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
              {categories.find(c => c.id === thread.category_id)?.name || 'Forum'}
            </span>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-600">
          <span className="inline-flex h-6 items-center rounded-full bg-gray-100 px-3 font-medium text-gray-700">
            {userProfiles[thread.author_id]?.full_name || 'User Garuda Academy'}
          </span>
          <span className="hidden sm:inline">•</span>
          <span>{formatDate(thread.created_at)}</span>
          <span className="hidden sm:inline">•</span>
          <span>{thread.view_count || 0} dilihat</span>
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
              onClick={toggleThreadLike}
              className={`flex items-center space-x-2 transition-colors ${likedThread ? 'text-primary-600' : 'text-gray-600 hover:text-primary-600'}`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Suka</span>
              <span className="text-xs font-medium">{threadLikeCount}</span>
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
        
        {groupedReplies['root']?.map((reply: any) => (
          <div key={reply.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-700">
                    {(userProfiles[reply.author_id]?.full_name || 'User Garuda Academy').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{userProfiles[reply.author_id]?.full_name || 'User Garuda Academy'}</div>
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
                  onClick={() => toggleReplyLike(reply.id)}
                  className={`flex items-center space-x-2 transition-colors ${likedReplies[reply.id] ? 'text-primary-600' : 'text-gray-600 hover:text-primary-600'}`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Suka</span>
                  <span className="text-xs font-medium">{replyLikeCount[reply.id] || 0}</span>
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
                {groupedReplies[reply.id].map((nestedReply: any) => (
                  <div key={nestedReply.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {(userProfiles[nestedReply.author_id]?.full_name || 'User Garuda Academy').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{userProfiles[nestedReply.author_id]?.full_name || 'User Garuda Academy'}</div>
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
