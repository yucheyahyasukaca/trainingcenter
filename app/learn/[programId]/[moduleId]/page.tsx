'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { 
  ChevronLeft, FileText, Pencil, CheckCircle, Search, Settings, 
  Menu, ArrowLeft, ArrowRight, Check, ChevronDown, ChevronUp, X,
  Video, File, HelpCircle, Play, Download
} from 'lucide-react'

interface LearningContent {
  id: string
  title: string
  description: string | null
  content_type: 'video' | 'text' | 'quiz' | 'document' | 'assignment'
  content_data: any
  order_index: number
  is_free: boolean
  status: string
  is_required: boolean
  estimated_duration: number | null
}

interface Progress {
  id: string
  status: 'not_started' | 'in_progress' | 'completed'
  progress_percentage: number
  time_spent: number
  last_position: number
  completed_at: string | null
}

export default function LearnPage({ params }: { params: { programId: string; moduleId: string } }) {
  const router = useRouter()
  const { profile } = useAuth()
  const [moduleTitle, setModuleTitle] = useState<string>('')
  const [contents, setContents] = useState<LearningContent[]>([])
  const [currentContent, setCurrentContent] = useState<LearningContent | null>(null)
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [progress, setProgress] = useState<{[key: string]: Progress}>({})
  const [overallProgress, setOverallProgress] = useState<number>(0)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [enrollment, setEnrollment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)
  const [unlockedContents, setUnlockedContents] = useState<Set<string>>(new Set())
  
  const [readingSettings, setReadingSettings] = useState({
    theme: 'light',
    fontType: 'default',
    fontSize: 'medium',
    readingWidth: 'full'
  })

  // Theme color configurations
  const themeColors = {
    light: {
      mainBg: '#ffffff',
      contentBg: '#ffffff',
      text: '#000000',
      headerBg: '#ffffff',
      borderColor: '#e5e7eb'
    },
    warm: {
      mainBg: '#F5E6D3',
      contentBg: '#FFF8E7',
      text: '#4A3520',
      headerBg: '#E8D5B7',
      borderColor: '#D4C5A9'
    },
    dark: {
      mainBg: '#1a1a1a',
      contentBg: '#242424',
      text: '#ffffff',
      headerBg: '#0f0f0f',
      borderColor: '#333333'
    }
  }

  const currentTheme = themeColors[readingSettings.theme as keyof typeof themeColors] || themeColors.light

  useEffect(() => {
    if (profile) {
      fetchData()
    }
  }, [params.programId, params.moduleId, profile])

  async function fetchData() {
    try {
      // Fetch class/module details
      const { data: classData } = await supabase
        .from('classes')
        .select('name')
        .eq('id', params.moduleId)
        .maybeSingle()
      
      if (classData) setModuleTitle((classData as any).name)

      // Check enrollment
      const { data: enrollmentData } = await supabase
        .from('enrollments')
        .select('*')
        .eq('participant_id', profile?.id || '')
        .eq('class_id', params.moduleId)
        .eq('status', 'approved')
        .maybeSingle()
      
      setEnrollment(enrollmentData)

      // Fetch learning contents
      const { data: contentsData, error: contentsError } = await supabase
        .from('learning_contents')
        .select('*')
        .eq('class_id', params.moduleId)
        .eq('status', 'published')
        .order('order_index', { ascending: true })

      if (contentsError) throw contentsError

      if (contentsData && contentsData.length > 0) {
        setContents(contentsData)
        setCurrentContent(contentsData[0])
        setCurrentIndex(0)

        // Fetch progress for all contents
        if (profile) {
          const { data: progressData } = await supabase
            .from('learning_progress')
            .select('*')
            .eq('user_id', profile.id)
            .in('content_id', contentsData.map((c: any) => c.id))

          if (progressData) {
            const progressMap: {[key: string]: Progress} = {}
            progressData.forEach((p: any) => {
              progressMap[p.content_id] = p
            })
            setProgress(progressMap)

            // Calculate overall progress
            const completed = contentsData.filter((content: any) => {
              const contentProgress = progressData.find((p: any) => p.content_id === content.id)
              return (contentProgress as any)?.status === 'completed'
            }).length
            const total = contentsData.length
            setOverallProgress(total > 0 ? Math.round((completed / total) * 100) : 0)
          }
        }
      }
      
      // Update unlocked contents after all data is loaded
      setTimeout(() => {
        updateUnlockedContents()
      }, 100)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateProgress(contentId: string, updates: any) {
    if (!profile) return

    try {
      // Check if progress exists
      const existing = progress[contentId]
      
      if (existing) {
        // Update existing
        const { data, error } = await (supabase as any)
          .from('learning_progress')
          .update(updates)
          .eq('id', (existing as any).id)
          .select()
          .single()
        
        if (error) throw error
        if (data) {
          setProgress(prev => ({ ...prev, [contentId]: data }))
        }
      } else {
        // Create new
        const { data, error } = await supabase
          .from('learning_progress')
          .insert([{
            user_id: profile.id,
            content_id: contentId,
            enrollment_id: enrollment?.id,
            ...updates
          }] as any)
          .select()
          .single()
        
        if (error) throw error
        if (data) {
          setProgress(prev => ({ ...prev, [contentId]: data }))
        }
      }

      // Update overall progress
      updateOverallProgress()
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  async function markAsComplete(contentId: string) {
    try {
      console.log('Marking as complete:', contentId)
      
      if (!profile?.id) {
        throw new Error('User not authenticated')
      }
      
      // First check if table exists by trying to select from it
      const { error: tableError } = await supabase
        .from('learning_progress')
        .select('id')
        .limit(1)
      
      if (tableError) {
        console.error('Table learning_progress does not exist:', tableError)
        showNotification('error', 'Tabel progress belum tersedia. Silakan hubungi administrator.')
        return
      }
      
      // Update progress in database
      const { data, error } = await supabase
        .from('learning_progress')
        .upsert([{
          user_id: profile.id,
          content_id: contentId,
          enrollment_id: enrollment?.id,
          status: 'completed',
          progress_percentage: 100,
          completed_at: new Date().toISOString()
        }] as any)
        .select()
        .single()
      
      if (error) {
        console.error('Database error:', error)
        throw error
      }
      
      // Update local state immediately
      setProgress(prev => ({
        ...prev,
        [contentId]: {
          ...prev[contentId],
          status: 'completed',
          progress_percentage: 100,
          completed_at: new Date().toISOString()
        }
      }))
      
      // Also mark all sub-materials as completed if this is a main material
      const currentContent = contents.find(c => c.id === contentId)
      if (currentContent && ((currentContent as any).material_type === 'main' || !(currentContent as any).material_type)) {
        const subMaterials = contents.filter(c => (c as any).parent_id === contentId)
        
        // Mark sub-materials as completed in database
        if (subMaterials.length > 0) {
          const subMaterialIds = subMaterials.map(sub => sub.id)
          
          // Update sub-materials in database
          const { error: subError } = await supabase
            .from('learning_progress')
            .upsert(subMaterialIds.map(subId => ({
              user_id: profile.id,
              content_id: subId,
              enrollment_id: enrollment?.id,
              status: 'completed',
              progress_percentage: 100,
              completed_at: new Date().toISOString()
            })) as any)
          
          if (!subError) {
            // Update local state for sub-materials
            setProgress(prev => {
              const newProgress = { ...prev }
              subMaterials.forEach(sub => {
                newProgress[sub.id] = {
                  ...newProgress[sub.id],
                  status: 'completed',
                  progress_percentage: 100,
                  completed_at: new Date().toISOString()
                }
              })
              return newProgress
            })
          }
        }
      }
      
      // Update overall progress
      updateOverallProgress()
      
      // Update unlocked contents
      updateUnlockedContents()
      
      // Show success notification
      const content = contents.find(c => c.id === contentId)
      if (content) {
        showNotification('success', `Materi "${content.title}" berhasil ditandai selesai!`)
      }
    } catch (error: any) {
      console.error('Error marking as complete:', error)
      const errorMessage = error?.message || 'Terjadi kesalahan yang tidak diketahui'
      showNotification('error', `Gagal menandai materi sebagai selesai: ${errorMessage}`)
    }
  }

  function updateOverallProgress() {
    // Count all contents (main + sub materials)
    const totalCount = contents.length
    
    // Count completed contents
    const completedCount = contents.filter(content => {
      const contentProgress = progress[content.id]
      return contentProgress?.status === 'completed'
    }).length
    
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
    setOverallProgress(percentage)
    
    console.log('Progress calculation:', {
      totalCount,
      completedCount,
      percentage,
      progress: Object.keys(progress).length,
      contents: contents.length
    })
  }

  function showNotification(type: 'success' | 'error', message: string) {
    setNotification({ type, message })
    setTimeout(() => {
      setNotification(null)
    }, 4000)
  }

  function updateUnlockedContents() {
    const unlocked = new Set<string>()
    
    // First content is always unlocked
    if (contents.length > 0) {
      unlocked.add(contents[0].id)
    }
    
    // Check each content to see if it should be unlocked
    for (let i = 1; i < contents.length; i++) {
      const currentContent = contents[i]
      const previousContent = contents[i - 1]
      
      // Check if previous content is completed
      const previousProgress = progress[previousContent.id]
      const isPreviousCompleted = previousProgress?.status === 'completed'
      
      if (isPreviousCompleted) {
        unlocked.add(currentContent.id)
      } else {
        // If previous is not completed, stop unlocking further content
        break
      }
    }
    
    setUnlockedContents(unlocked)
  }

  function isContentUnlocked(contentId: string): boolean {
    return unlockedContents.has(contentId)
  }

  function canAccessContent(contentId: string): boolean {
    const contentIndex = contents.findIndex(c => c.id === contentId)
    if (contentIndex === -1) return false
    
    // First content is always accessible
    if (contentIndex === 0) return true
    
    // Check if previous content is completed
    const previousContent = contents[contentIndex - 1]
    const previousProgress = progress[previousContent.id]
    return previousProgress?.status === 'completed'
  }

  function navigateToContent(direction: 'prev' | 'next') {
    if (direction === 'prev' && currentIndex > 0) {
      const prevContent = contents[currentIndex - 1]
      setCurrentContent(prevContent)
      setCurrentIndex(currentIndex - 1)
    } else if (direction === 'next' && currentIndex < contents.length - 1) {
      const nextContent = contents[currentIndex + 1]
      setCurrentContent(nextContent)
      setCurrentIndex(currentIndex + 1)
    }
  }

  function selectContent(content: LearningContent, index: number) {
    setCurrentContent(content)
    setCurrentIndex(index)
    setDrawerOpen(false)
  }

  const updateReadingSettings = (key: string, value: string) => {
    setReadingSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5 text-red-500" />
      case 'text': return <FileText className="w-5 h-5 text-blue-500" />
      case 'quiz': return <HelpCircle className="w-5 h-5 text-green-500" />
      case 'document': return <File className="w-5 h-5 text-purple-500" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Simplified access check - allow all users for now
  // if (!enrollment && !contents.some(c => c.is_free)) {
  //   return (
  //     <div className="flex items-center justify-center h-screen">
  //       <div className="text-center">
  //         <p className="text-xl text-gray-700 mb-4">Anda belum terdaftar di kelas ini</p>
  //         <Link href={`/programs/${params.programId}`} className="text-primary-600 hover:underline">
  //           Kembali ke Program
  //         </Link>
  //       </div>
  //     </div>
  //   )
  // }

  if (contents.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-700 mb-4">Belum ada materi pembelajaran</p>
          <Link href={`/programs/${params.programId}`} className="text-primary-600 hover:underline">
            Kembali ke Program
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Add OpenDyslexic font */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=OpenDyslexic:wght@400;700&display=swap');
      `}</style>
      
      <div className="min-h-screen flex flex-col content-area" style={{
        backgroundColor: currentTheme.mainBg,
        color: currentTheme.text,
        transition: 'all 0.3s ease'
      }}>
      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur border-b" style={{
        backgroundColor: `${currentTheme.headerBg}f2`,
        borderColor: currentTheme.borderColor,
        transition: 'all 0.3s ease'
      }}>
        {/* Desktop Header */}
        <div className="hidden md:block">
          <div className="w-full px-3 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <Link href={`/programs/${params.programId}`} className="inline-flex items-center text-sm whitespace-nowrap transition-colors" style={{ color: currentTheme.text, opacity: 0.7 }}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Kembali
              </Link>
              <span className="font-semibold truncate text-lg" style={{ color: currentTheme.text }}>{moduleTitle || 'Belajar Modul'}</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSettingsOpen(true)}
                className="p-2 rounded-lg border transition-colors" 
                aria-label="Pengaturan"
                style={{
                  borderColor: currentTheme.borderColor,
                  backgroundColor: readingSettings.theme === 'light' ? 'transparent' : currentTheme.contentBg
                }}
              >
                <Settings className="w-5 h-5" style={{ color: currentTheme.text }} />
              </button>
              <button 
                onClick={() => setDrawerOpen(true)} 
                className="p-2 rounded-lg border transition-colors" 
                aria-label="Menu"
                style={{
                  borderColor: currentTheme.borderColor,
                  backgroundColor: readingSettings.theme === 'light' ? 'transparent' : currentTheme.contentBg
                }}
              >
                <Menu className="w-5 h-5" style={{ color: currentTheme.text }} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden w-full px-4 py-3 flex items-center justify-between">
          <Link href={`/programs/${params.programId}`} className="p-2 rounded-lg transition-colors" style={{
            backgroundColor: readingSettings.theme === 'light' ? 'transparent' : currentTheme.contentBg
          }}>
            <ArrowLeft className="w-5 h-5" style={{ color: currentTheme.text }} />
          </Link>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-lg transition-colors" 
              style={{
                backgroundColor: readingSettings.theme === 'light' ? 'transparent' : currentTheme.contentBg
              }}
            >
              <Settings className="w-5 h-5" style={{ color: currentTheme.text }} />
            </button>
            <button 
              onClick={() => setDrawerOpen(true)} 
              className="p-2 rounded-lg transition-colors" 
              aria-label="Menu"
              style={{
                backgroundColor: readingSettings.theme === 'light' ? 'transparent' : currentTheme.contentBg
              }}
            >
              <Menu className="w-5 h-5" style={{ color: currentTheme.text }} />
            </button>
          </div>
        </div>
      </div>

      {/* Content layout */}
      <div className="max-w-4xl mx-auto w-full px-4 py-6 pb-20">
        {currentContent && (
          <ContentRenderer
            content={currentContent}
            theme={currentTheme}
            readingSettings={readingSettings}
            progress={progress[currentContent.id]}
            onComplete={() => markAsComplete(currentContent.id)}
            onUpdateProgress={(updates) => updateProgress(currentContent.id, updates)}
          />
        )}
      </div>

      {/* Adaptive Reading Settings Modal */}
      <AdaptiveReadingModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={readingSettings}
        onUpdate={updateReadingSettings}
      />

      {/* Slide-out drawer for content list */}
      <ContentDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        contents={contents}
        progress={progress}
        overallProgress={overallProgress}
        currentContentId={currentContent?.id || ''}
        onSelectContent={selectContent}
        getContentIcon={getContentIcon}
        isContentUnlocked={isContentUnlocked}
        canAccessContent={canAccessContent}
      />

      {/* Bottom navigation */}
      <BottomNavigation
        currentIndex={currentIndex}
        totalContents={contents.length}
        currentContent={currentContent}
        onNavigate={navigateToContent}
        theme={currentTheme}
        readingSettings={readingSettings}
        contents={contents}
      />

      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className={`p-4 rounded-lg shadow-lg border-l-4 transform transition-all duration-300 ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-500 text-green-800' 
              : 'bg-red-50 border-red-500 text-red-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                notification.type === 'success' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {notification.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <X className="w-4 h-4 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{notification.message}</p>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  )
}

// Content Renderer Component
interface ContentRendererProps {
  content: LearningContent
  theme: any
  readingSettings: any
  progress: Progress | undefined
  onComplete: () => void
  onUpdateProgress: (updates: Partial<Progress>) => void
}

function ContentRenderer({ content, theme, readingSettings, progress, onComplete, onUpdateProgress }: ContentRendererProps) {
  const renderContent = () => {
    switch (content.content_type) {
      case 'video':
        return <VideoContent content={content} progress={progress} onUpdateProgress={onUpdateProgress} />
      case 'text':
        return <TextContent content={content} theme={theme} readingSettings={readingSettings} />
      case 'quiz':
        return <QuizContent content={content} progress={progress} onComplete={onComplete} />
      case 'document':
        return <DocumentContent content={content} />
      case 'assignment':
        return <AssignmentContent content={content} />
      default:
        return <div className="text-center py-12 text-gray-500">Tipe konten tidak dikenali</div>
    }
  }

  return (
    <div className="reading-content" style={{
      backgroundColor: theme.contentBg,
      color: theme.text,
      fontFamily: readingSettings.fontType === 'serif' ? 'Georgia, "Times New Roman", serif' : 
                 readingSettings.fontType === 'dyslexic' ? 'OpenDyslexic, Arial, sans-serif' : 
                 'Inter, system-ui, sans-serif',
      fontSize: readingSettings.fontSize === 'small' ? '14px' : 
               readingSettings.fontSize === 'large' ? '18px' : '16px',
      maxWidth: readingSettings.readingWidth === 'medium' ? '800px' : '900px',
      margin: '0 auto',
      padding: '3rem 2rem',
      borderRadius: '12px',
      transition: 'all 0.3s ease',
      textAlign: 'left',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lineHeight: '1.7'
    }}>
      {/* Content Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight" style={{ color: theme.text }}>
          {content.title}
        </h1>
        {content.description && (
          <p className="text-xl opacity-80 max-w-2xl mx-auto" style={{ color: theme.text }}>
            {content.description}
          </p>
        )}
        {progress?.status === 'completed' && (
          <div className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-green-100 text-green-700 rounded-full">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Selesai</span>
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="max-w-3xl mx-auto">
        {renderContent()}
      </div>

      {/* Complete Button */}
      {progress?.status !== 'completed' && content.content_type !== 'quiz' && (
        <div className="mt-12 flex justify-center">
          <button
            onClick={onComplete}
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl hover:from-green-700 hover:to-green-800 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
          >
            <Check className="w-7 h-7" />
            Tandai Selesai
          </button>
        </div>
      )}
    </div>
  )
}

// Video Content Component
function VideoContent({ content, progress, onUpdateProgress }: any) {
  const videoData = content.content_data || {}
  
  useEffect(() => {
    // Mark as in progress when video is viewed
    if (!progress || progress.status === 'not_started') {
      onUpdateProgress({ status: 'in_progress', progress_percentage: 0 })
    }
  }, [])

  // Extract video ID from YouTube URL
  const getYouTubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    const videoId = (match && match[2].length === 11) ? match[2] : null
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url
  }

  const embedUrl = videoData.video_url ? getYouTubeEmbedUrl(videoData.video_url) : ''

  return (
    <div className="space-y-6">
      {embedUrl ? (
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={embedUrl}
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="bg-gray-100 rounded-lg p-12 text-center">
          <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Video URL tidak valid</p>
        </div>
      )}
      
      {videoData.duration && (
        <p className="text-sm text-gray-600">Durasi: {Math.floor(videoData.duration / 60)} menit</p>
      )}
    </div>
  )
}

// Text Content Component
function TextContent({ content, theme, readingSettings }: any) {
  const textData = content.content_data || {}
  const body = textData.body || ''

  return (
    <div 
      className="prose prose-lg max-w-none"
      style={{ color: theme.text }}
      dangerouslySetInnerHTML={{ __html: body.replace(/\n/g, '<br />') }}
    />
  )
}

// Quiz Content Component
function QuizContent({ content, progress, onComplete }: any) {
  const [QuizPlayer, setQuizPlayer] = useState<any>(null)

  useEffect(() => {
    // Dynamic import to avoid SSR issues
    import('@/components/learn/QuizPlayer').then((mod) => {
      setQuizPlayer(() => mod.QuizPlayer)
    })
  }, [])

  if (!QuizPlayer) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return <QuizPlayer contentId={content.id} onComplete={onComplete} />
}

// Document Content Component
function DocumentContent({ content }: any) {
  const docData = content.content_data || {}
  
  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <File className="w-12 h-12 text-purple-600" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-purple-900">Dokumen</h3>
            <p className="text-sm text-purple-700">
              Tipe: {docData.file_type?.toUpperCase() || 'PDF'}
            </p>
          </div>
          {docData.file_url && (
            <a
              href={docData.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          )}
        </div>
      </div>
      
      {docData.file_url && docData.file_type === 'pdf' && (
        <div className="w-full h-[800px]">
          <iframe
            src={docData.file_url}
            className="w-full h-full border border-gray-200 rounded-lg"
          />
        </div>
      )}
    </div>
  )
}

// Assignment Content Component  
function AssignmentContent({ content }: any) {
  const assignmentData = content.content_data || {}
  
  return (
    <div className="space-y-6">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-orange-900 mb-4">Instruksi Tugas</h3>
        <div 
          className="text-orange-800 whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: assignmentData.instructions?.replace(/\n/g, '<br />') || '' }}
        />
        
        {assignmentData.deadline && (
          <div className="mt-4 pt-4 border-t border-orange-200">
            <p className="text-sm text-orange-700">
              <strong>Deadline:</strong> {new Date(assignmentData.deadline).toLocaleString('id-ID')}
            </p>
          </div>
        )}
        
        {assignmentData.max_score && (
          <div className="mt-2">
            <p className="text-sm text-orange-700">
              <strong>Skor Maksimal:</strong> {assignmentData.max_score}
            </p>
          </div>
        )}
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-bold text-gray-900 mb-4">Submit Tugas Anda</h4>
        <textarea
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          rows={6}
          placeholder="Tulis jawaban Anda di sini..."
        />
        <div className="mt-4 flex items-center gap-3">
          <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            Submit
          </button>
          <label className="cursor-pointer px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <input type="file" className="hidden" />
            Upload File
          </label>
        </div>
      </div>
    </div>
  )
}

// Adaptive Reading Modal Component
function AdaptiveReadingModal({ open, onClose, settings, onUpdate }: any) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out">
        {/* Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Pengaturan Baca</h2>
              <p className="text-sm text-gray-600">Sesuaikan pengalaman belajar Anda</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/50 transition-colors duration-200">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8 space-y-8">
          {/* Tema */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
              Tema Visual
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {[
                { 
                  key: 'light', 
                  label: 'Terang', 
                  description: 'Tema standar yang nyaman',
                  bgColor: '#ffffff', 
                  textColor: '#000000',
                  icon: '☀️',
                  gradient: 'from-yellow-400 to-orange-500'
                },
                { 
                  key: 'warm', 
                  label: 'Hangat', 
                  description: 'Nyaman untuk mata, mengurangi kelelahan',
                  bgColor: '#FFF8E7', 
                  textColor: '#4A3520',
                  icon: '🌅',
                  gradient: 'from-amber-400 to-yellow-500'
                },
                { 
                  key: 'dark', 
                  label: 'Gelap', 
                  description: 'Ideal untuk membaca di malam hari',
                  bgColor: '#1f1f1f', 
                  textColor: '#ffffff',
                  icon: '🌙',
                  gradient: 'from-slate-600 to-slate-800'
                }
              ].map((theme) => (
                <button
                  key={theme.key}
                  onClick={() => onUpdate('theme', theme.key)}
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-300 group ${
                    settings.theme === theme.key 
                      ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg scale-[1.02]' 
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-md hover:scale-[1.01] bg-white'
                  }`}
                >
                  {settings.theme === theme.key && (
                    <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${theme.gradient} flex items-center justify-center text-2xl`}>
                      {theme.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="text-lg font-bold text-gray-900 mb-1">{theme.label}</h4>
                      <p className="text-sm text-gray-600 mb-3">{theme.description}</p>
                      <div 
                        className="w-full h-12 border border-gray-200 rounded-xl flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: theme.bgColor, color: theme.textColor }}
                      >
                        <span className="text-sm font-medium">Contoh teks bacaan</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Jenis Font */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
              Jenis Font
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { 
                  key: 'default', 
                  label: 'Inter (Default)', 
                  description: 'Font modern dan mudah dibaca',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  icon: '🔤'
                },
                { 
                  key: 'serif', 
                  label: 'Georgia (Serif)', 
                  description: 'Font klasik untuk bacaan panjang',
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  icon: '📚'
                },
                { 
                  key: 'dyslexic', 
                  label: 'Open Dyslexic', 
                  description: 'Dirancang khusus untuk disleksia',
                  fontFamily: 'OpenDyslexic, Arial, sans-serif',
                  icon: '♿'
                }
              ].map((font) => (
                <button
                  key={font.key}
                  onClick={() => onUpdate('fontType', font.key)}
                  className={`relative p-5 rounded-2xl border-2 transition-all duration-300 group ${
                    settings.fontType === font.key 
                      ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg scale-[1.02]' 
                      : 'border-gray-200 hover:border-green-300 hover:shadow-md hover:scale-[1.01] bg-white'
                  }`}
                >
                  {settings.fontType === font.key && (
                    <div className="absolute top-3 right-3 w-7 h-7 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-xl">
                      {font.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="text-base font-bold text-gray-900 mb-1">{font.label}</h4>
                      <p className="text-sm text-gray-600 mb-2">{font.description}</p>
                      <div 
                        className="text-sm font-medium text-gray-700"
                        style={{ fontFamily: font.fontFamily }}
                      >
                        Contoh teks dengan font ini
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Ukuran Font */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
              Ukuran Font
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'small', label: 'Kecil', size: '14px', icon: 'A' },
                { key: 'medium', label: 'Sedang', size: '16px', icon: 'A' },
                { key: 'large', label: 'Besar', size: '18px', icon: 'A' }
              ].map((size) => (
                <button
                  key={size.key}
                  onClick={() => onUpdate('fontSize', size.key)}
                  className={`relative p-4 rounded-2xl border-2 transition-all duration-300 group ${
                    settings.fontSize === size.key 
                      ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-red-50 shadow-lg scale-105' 
                      : 'border-gray-200 hover:border-orange-300 hover:shadow-md hover:scale-105 bg-white'
                  }`}
                >
                  {settings.fontSize === size.key && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className="text-center">
                    <div 
                      className="text-4xl font-bold text-gray-900 mb-2"
                      style={{ fontSize: size.size }}
                    >
                      {size.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{size.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Lebar Bacaan */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
              Lebar Bacaan
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { 
                  key: 'medium', 
                  label: 'Medium', 
                  description: 'Lebar optimal untuk fokus',
                  width: '60%',
                  icon: '📖'
                },
                { 
                  key: 'full', 
                  label: 'Full-width', 
                  description: 'Menggunakan seluruh lebar layar',
                  width: '100%',
                  icon: '📄'
                }
              ].map((width) => (
                <button
                  key={width.key}
                  onClick={() => onUpdate('readingWidth', width.key)}
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-300 group ${
                    settings.readingWidth === width.key 
                      ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg scale-[1.02]' 
                      : 'border-gray-200 hover:border-indigo-300 hover:shadow-md hover:scale-[1.01] bg-white'
                  }`}
                >
                  {settings.readingWidth === width.key && (
                    <div className="absolute top-3 right-3 w-7 h-7 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-3xl mb-3">{width.icon}</div>
                    <h4 className="text-base font-bold text-gray-900 mb-1">{width.label}</h4>
                    <p className="text-xs text-gray-600 mb-3">{width.description}</p>
                    <div className="w-full bg-gray-200 rounded-lg h-3 relative">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg h-3 transition-all duration-300"
                        style={{ width: width.width }}
                      ></div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="text-center text-sm text-gray-500">
            Pengaturan akan disimpan otomatis
          </div>
        </div>
      </div>
    </div>
  )
}

// Content Drawer Component
function ContentDrawer({ open, onClose, contents, progress, overallProgress, currentContentId, onSelectContent, getContentIcon, isContentUnlocked, canAccessContent }: any) {
  if (!open) return null

  // Organize contents into main materials and sub-materials
  const mainMaterials = contents.filter((c: any) => c.material_type === 'main' || !c.material_type)
  const subMaterials = contents.filter((c: any) => c.material_type === 'sub')

  return (
    <div className="fixed inset-x-0 top-[60px] bottom-[60px] z-40">
      <div className="absolute inset-0 bg-black/40 transition-opacity duration-300" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Daftar Materi</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/50 transition-colors duration-200">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Progress Section */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-800">Kemajuan Belajar</h4>
            <span className="text-sm font-bold text-green-600">{overallProgress}%</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500" 
                style={{ width: `${overallProgress}%` }} 
              />
            </div>
            <div className="text-xs text-gray-500">
              {contents.filter((c: any) => progress[c.id]?.status === 'completed').length} / {contents.length}
            </div>
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 space-y-3">
            {mainMaterials.map((content: LearningContent, index: number) => {
              const contentProgress = progress[content.id]
              const isCompleted = contentProgress?.status === 'completed'
              const isCurrent = content.id === currentContentId
              const isUnlocked = isContentUnlocked(content.id)
              const canAccess = canAccessContent(content.id)
              const relatedSubMaterials = subMaterials.filter((sub: any) => sub.parent_id === content.id)

              return (
                <div key={content.id} className="space-y-2">
                  {/* Main Material */}
                  <button
                    onClick={() => canAccess ? onSelectContent(content, index) : null}
                    disabled={!canAccess}
                    className={`w-full text-left p-3 rounded-lg border transition-all duration-200 group ${
                      !canAccess
                        ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
                        : isCompleted
                        ? 'border-green-300 bg-green-50 hover:bg-green-100'
                        : isCurrent 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-sm bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-md ${
                        !canAccess
                          ? 'bg-gray-200 text-gray-400'
                          : isCompleted 
                          ? 'bg-green-100 text-green-600' 
                          : isCurrent 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                      }`}>
                        {!canAccess ? (
                          <X className="w-4 h-4" />
                        ) : (
                          getContentIcon(content.content_type)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-medium text-sm ${
                            !canAccess
                              ? 'text-gray-500'
                              : isCompleted 
                              ? 'text-green-900 line-through' 
                              : isCurrent 
                              ? 'text-blue-900' 
                              : 'text-gray-900 group-hover:text-blue-900'
                          }`}>
                            {content.title}
                          </h4>
                          {!canAccess && (
                            <div className="flex items-center gap-1">
                              <X className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-400">Terkunci</span>
                            </div>
                          )}
                          {isCompleted && canAccess && (
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {!canAccess ? (
                            <span className="text-gray-400">Selesaikan materi sebelumnya untuk membuka</span>
                          ) : (
                            <>
                              <span className="capitalize">{content.content_type}</span>
                              {content.estimated_duration && (
                                <>
                                  <span>•</span>
                                  <span>{content.estimated_duration}m</span>
                                </>
                              )}
                              {isCurrent && !isCompleted && (
                                <>
                                  <span>•</span>
                                  <span className="text-blue-600 font-medium">Sedang dipelajari</span>
                                </>
                              )}
                              {isCompleted && (
                                <>
                                  <span>•</span>
                                  <span className="text-green-600 font-medium">Selesai</span>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Sub Materials */}
                  {relatedSubMaterials.length > 0 && canAccess && (
                    <div className="ml-4 space-y-1">
                      {relatedSubMaterials.map((subContent: any, subIndex: number) => {
                        const subProgress = progress[subContent.id]
                        const isSubCompleted = subProgress?.status === 'completed'
                        const isSubCurrent = subContent.id === currentContentId
                        const canAccessSub = canAccessContent(subContent.id)

                        return (
                          <button
                            key={subContent.id}
                            onClick={() => canAccessSub ? onSelectContent(subContent, contents.indexOf(subContent)) : null}
                            disabled={!canAccessSub}
                            className={`w-full text-left p-2 rounded-md border transition-all duration-200 group ${
                              !canAccessSub
                                ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                                : isSubCompleted
                                ? 'border-green-200 bg-green-25 hover:bg-green-50'
                                : isSubCurrent 
                                ? 'border-indigo-300 bg-indigo-50' 
                                : 'border-gray-100 hover:border-indigo-200 hover:bg-indigo-25'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                !canAccessSub
                                  ? 'bg-gray-300'
                                  : isSubCompleted 
                                  ? 'bg-green-400' 
                                  : 'bg-indigo-400'
                              }`}></div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h5 className={`text-xs font-medium ${
                                    !canAccessSub
                                      ? 'text-gray-400'
                                      : isSubCompleted 
                                      ? 'text-green-800 line-through' 
                                      : isSubCurrent 
                                      ? 'text-indigo-900' 
                                      : 'text-gray-700 group-hover:text-indigo-900'
                                  }`}>
                                    {subContent.title}
                                  </h5>
                                  {!canAccessSub && (
                                    <X className="w-3 h-3 text-gray-400" />
                                  )}
                                  {isSubCompleted && canAccessSub && (
                                    <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                  <span className="capitalize">{subContent.content_type}</span>
                                  {subContent.estimated_duration && (
                                    <>
                                      <span>•</span>
                                      <span>{subContent.estimated_duration}m</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-center text-sm text-gray-500">
            {contents.length} materi tersedia
          </div>
        </div>
      </div>
    </div>
  )
}

// Bottom Navigation Component
function BottomNavigation({ currentIndex, totalContents, currentContent, onNavigate, theme, readingSettings, contents }: any) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur border-t" style={{
      backgroundColor: `${theme.headerBg}f2`,
      borderColor: theme.borderColor,
      transition: 'all 0.3s ease'
    }}>
      {/* Desktop Footer */}
      <div className="hidden md:block">
        <div className="w-full px-3 py-4 grid grid-cols-3 gap-4">
          <button 
            onClick={() => onNavigate('prev')}
            disabled={currentIndex === 0}
            className={`text-left rounded-lg p-3 transition-colors ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'}`}
          >
            <div className="text-xs mb-1 font-medium" style={{ color: theme.text, opacity: 0.7 }}>Materi Sebelumnya</div>
            <div className="text-sm truncate" style={{ color: theme.text }}>
              {currentIndex > 0 ? contents[currentIndex - 1]?.title || '← Prev' : 'Tidak ada'}
            </div>
          </button>
          <div className="text-center flex flex-col justify-center">
            <div className="text-xs mb-1 font-medium" style={{ color: theme.text, opacity: 0.7 }}>Materi Saat Ini</div>
            <div className="text-sm font-semibold truncate" style={{ color: theme.text }}>
              {currentContent?.title || ''}
            </div>
          </div>
          <button 
            onClick={() => onNavigate('next')}
            disabled={currentIndex === totalContents - 1}
            className={`text-right rounded-lg p-3 transition-colors ${currentIndex === totalContents - 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'}`}
          >
            <div className="text-xs mb-1 font-medium" style={{ color: theme.text, opacity: 0.7 }}>Materi Selanjutnya</div>
            <div className="text-sm truncate" style={{ color: theme.text }}>
              {currentIndex < totalContents - 1 ? contents[currentIndex + 1]?.title || 'Next →' : 'Tidak ada'}
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Footer */}
      <div className="md:hidden w-full px-4 py-3">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => onNavigate('prev')}
            disabled={currentIndex === 0}
            className={`p-2 rounded-lg transition-colors ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <ArrowLeft className="w-5 h-5" style={{ color: theme.text }} />
          </button>
          <div className="text-center flex-1 px-4">
            <div className="text-sm font-medium truncate" style={{ color: theme.text }}>
              {currentContent?.title || ''}
            </div>
          </div>
          <button 
            onClick={() => onNavigate('next')}
            disabled={currentIndex === totalContents - 1}
            className={`p-2 rounded-lg transition-colors ${currentIndex === totalContents - 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <ArrowRight className="w-5 h-5" style={{ color: theme.text }} />
          </button>
        </div>
      </div>
    </div>
  )
}
