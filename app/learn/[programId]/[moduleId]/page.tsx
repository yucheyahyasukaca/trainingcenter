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
      
      if (classData) setModuleTitle(classData.name)

      // Check enrollment
      const { data: enrollmentData } = await supabase
        .from('enrollments')
        .select('*')
        .eq('participant_id', profile?.id)
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
            const completed = progressData.filter(p => p.status === 'completed').length
            const total = contentsData.filter((c: any) => c.is_required).length
            setOverallProgress(total > 0 ? Math.round((completed / total) * 100) : 0)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateProgress(contentId: string, updates: Partial<Progress>) {
    if (!profile) return

    try {
      // Check if progress exists
      const existing = progress[contentId]
      
      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('learning_progress')
          .update(updates)
          .eq('id', existing.id)
        
        if (error) throw error
      } else {
        // Create new
        const { data, error } = await supabase
          .from('learning_progress')
          .insert([{
            user_id: profile.id,
            content_id: contentId,
            enrollment_id: enrollment?.id,
            ...updates
          }])
          .select()
          .single()
        
        if (error) throw error
        if (data) {
          setProgress(prev => ({ ...prev, [contentId]: data }))
        }
      }

      // Refresh progress
      fetchData()
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  async function markAsComplete(contentId: string) {
    await updateProgress(contentId, {
      status: 'completed',
      progress_percentage: 100,
      completed_at: new Date().toISOString()
    })
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

  if (!enrollment && !contents.some(c => c.is_free)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-700 mb-4">Anda belum terdaftar di kelas ini</p>
          <Link href={`/programs/${params.programId}`} className="text-primary-600 hover:underline">
            Kembali ke Program
          </Link>
        </div>
      </div>
    )
  }

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
      <div className="max-w-6xl mx-auto w-full px-4 py-6 pb-20">
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
      />

      {/* Bottom navigation */}
      <BottomNavigation
        currentIndex={currentIndex}
        totalContents={contents.length}
        currentContent={currentContent}
        onNavigate={navigateToContent}
        theme={currentTheme}
        readingSettings={readingSettings}
      />
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
      maxWidth: readingSettings.readingWidth === 'medium' ? '800px' : '100%',
      margin: readingSettings.readingWidth === 'medium' ? '0 auto' : '0',
      padding: '2rem',
      borderRadius: '8px',
      transition: 'all 0.3s ease'
    }}>
      {/* Content Header */}
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: theme.text }}>
          {content.title}
        </h1>
        {content.description && (
          <p className="text-lg opacity-75" style={{ color: theme.text }}>
            {content.description}
          </p>
        )}
        {progress?.status === 'completed' && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Selesai</span>
          </div>
        )}
      </div>

      {/* Content Body */}
      {renderContent()}

      {/* Complete Button */}
      {progress?.status !== 'completed' && content.content_type !== 'quiz' && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={onComplete}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-lg font-medium"
          >
            <Check className="w-5 h-5" />
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
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[400px] bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Adaptive Reading</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Tema */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Tema</h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { key: 'light', label: 'Terang', bgColor: '#ffffff', textColor: '#000000' },
                { key: 'warm', label: 'Hangat (Nyaman untuk Mata)', bgColor: '#FFF8E7', textColor: '#4A3520' },
                { key: 'dark', label: 'Gelap', bgColor: '#1f1f1f', textColor: '#ffffff' }
              ].map((theme) => (
                <button
                  key={theme.key}
                  onClick={() => onUpdate('theme', theme.key)}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    settings.theme === theme.key 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {settings.theme === theme.key && (
                    <Check className="absolute top-2 left-2 w-4 h-4 text-green-600" />
                  )}
                  <div className="text-center">
                    <div 
                      className="w-full h-8 border border-gray-200 rounded mb-2 flex items-center justify-center"
                      style={{ backgroundColor: theme.bgColor, color: theme.textColor }}
                    >
                      <span className="text-sm font-medium">Belajar dengan Garuda Academy</span>
                    </div>
                    <span className="text-xs text-gray-600">{theme.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Jenis Font */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Jenis Font</h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                { key: 'default', label: 'Default' },
                { key: 'serif', label: 'Serif' },
                { key: 'dyslexic', label: 'Open Dyslexic' }
              ].map((font) => (
                <button
                  key={font.key}
                  onClick={() => onUpdate('fontType', font.key)}
                  className={`relative p-3 rounded-lg border-2 transition-all ${
                    settings.fontType === font.key 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {settings.fontType === font.key && (
                    <Check className="absolute top-2 left-2 w-4 h-4 text-green-600" />
                  )}
                  <span className="text-sm font-medium text-gray-900">{font.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ukuran Font */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Ukuran Font</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'small', label: 'Kecil' },
                { key: 'medium', label: 'Sedang' },
                { key: 'large', label: 'Besar' }
              ].map((size) => (
                <button
                  key={size.key}
                  onClick={() => onUpdate('fontSize', size.key)}
                  className={`relative p-3 rounded-lg border-2 transition-all ${
                    settings.fontSize === size.key 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {settings.fontSize === size.key && (
                    <Check className="absolute top-2 left-2 w-4 h-4 text-green-600" />
                  )}
                  <span className="text-sm font-medium text-gray-900">{size.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Lebar Bacaan */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Lebar Bacaan</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'medium', label: 'Medium-width' },
                { key: 'full', label: 'Full-width' }
              ].map((width) => (
                <button
                  key={width.key}
                  onClick={() => onUpdate('readingWidth', width.key)}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    settings.readingWidth === width.key 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {settings.readingWidth === width.key && (
                    <Check className="absolute top-2 left-2 w-4 h-4 text-green-600" />
                  )}
                  <div className="text-center">
                    <div className="w-full h-6 bg-gray-200 rounded mb-2"></div>
                    <span className="text-xs text-gray-600">{width.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Content Drawer Component
function ContentDrawer({ open, onClose, contents, progress, overallProgress, currentContentId, onSelectContent, getContentIcon }: any) {
  if (!open) return null

  return (
    <div className="fixed inset-x-0 top-[60px] bottom-[60px] z-40">
      <div className="absolute inset-0 bg-black/40 transition-opacity duration-300" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[420px] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out">
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Daftar Materi</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/50 transition-colors duration-200">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Progress */}
        <div className="p-4 border-b border-gray-200">
          <div className="text-sm font-semibold text-gray-800 mb-2">Kemajuan</div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500" 
                style={{ width: `${overallProgress}%` }} 
              />
            </div>
            <span className="text-sm font-medium text-gray-700 tabular-nums">{overallProgress}%</span>
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {contents.map((content: LearningContent, index: number) => {
            const contentProgress = progress[content.id]
            const isCompleted = contentProgress?.status === 'completed'
            const isCurrent = content.id === currentContentId

            return (
              <button
                key={content.id}
                onClick={() => onSelectContent(content, index)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  isCurrent 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getContentIcon(content.content_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium mb-1 ${isCurrent ? 'text-primary-900' : 'text-gray-900'}`}>
                      {content.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="capitalize">{content.content_type}</span>
                      {content.estimated_duration && (
                        <>
                          <span>•</span>
                          <span>{content.estimated_duration} menit</span>
                        </>
                      )}
                    </div>
                  </div>
                  {isCompleted && (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Bottom Navigation Component
function BottomNavigation({ currentIndex, totalContents, currentContent, onNavigate, theme, readingSettings }: any) {
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
              {currentIndex > 0 ? '← Prev' : 'Tidak ada'}
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
              {currentIndex < totalContents - 1 ? 'Next →' : 'Tidak ada'}
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
