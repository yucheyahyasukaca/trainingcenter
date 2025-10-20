'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, FileText, Pencil, CheckCircle, Search, Settings, List, X, ChevronDown, ChevronUp, Menu, MoreVertical, ArrowLeft, ArrowRight, Check } from 'lucide-react'

export default function LearnPage({ params }: { params: { programId: string; moduleId: string } }) {
  const router = useRouter()
  const [moduleTitle, setModuleTitle] = useState<string>('')
  const [progress, setProgress] = useState<number>(23)
  const [activeTab, setActiveTab] = useState<'modules' | 'notes'>('modules')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [modules, setModules] = useState<any[]>([])
  const [currentModuleIndex, setCurrentModuleIndex] = useState<number>(0)
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    'persiapan': true,
    'microsoft-fabric': true
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
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
    // Fetch modules and current module data
    if (params.programId && params.moduleId) {
      ;(async () => {
        try {
          // Fetch all modules for this program
          const { data: modulesData } = await supabase
            .from('classes')
            .select('id, name')
            .eq('program_id', params.programId)
            .order('start_date')
          
          if (modulesData) {
            setModules(modulesData)
            const currentIndex = modulesData.findIndex((m: any) => m.id === params.moduleId)
            setCurrentModuleIndex(currentIndex >= 0 ? currentIndex : 0)
          }

          // Fetch current module details
          const { data: currentModule } = await supabase
            .from('classes')
            .select('name')
            .eq('id', params.moduleId)
            .maybeSingle()
          
          if ((currentModule as any)?.name) setModuleTitle((currentModule as any).name)
        } catch {}
      })()
    }
  }, [params.programId, params.moduleId])

  const navigateToModule = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentModuleIndex > 0) {
      const prevModule = modules[currentModuleIndex - 1]
      router.push(`/learn/${params.programId}/${prevModule.id}`)
    } else if (direction === 'next' && currentModuleIndex < modules.length - 1) {
      const nextModule = modules[currentModuleIndex + 1]
      router.push(`/learn/${params.programId}/${nextModule.id}`)
    }
  }

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }))
  }

  const updateReadingSettings = (key: string, value: string) => {
    setReadingSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Sample data for drawer content
  const drawerContent = {
    persiapan: {
      title: 'Persiapan Belajar',
      items: [
        { title: 'Persetujuan Hak Cipta (Gratis)', completed: true },
        { title: 'Pengenalan Kelas (Gratis)', completed: true },
        { title: 'Rekomendasi Pengetahuan Awal (Gratis)', completed: true },
        { title: 'Prasyarat Tools (Gratis)', completed: false },
        { title: 'Mekanisme Belajar (Gratis)', completed: false },
        { title: 'Forum Diskusi (Gratis)', completed: false },
        { title: 'Glosarium (Gratis)', completed: false },
        { title: 'Daftar Referensi (Gratis)', completed: false }
      ]
    },
    microsoftFabric: {
      title: 'Mengupas Tuntas Analitik End-to-End dengan Microsoft Fabric',
      progress: '5/6',
      items: [
        { title: 'Pengantar Mengupas Tuntas Analitik End-t...', completed: true }
      ]
    }
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
      {/* Focused minimal header */}
      <div className="sticky top-0 z-30 backdrop-blur border-b" style={{
        backgroundColor: `${currentTheme.headerBg}f2`,
        borderColor: currentTheme.borderColor,
        transition: 'all 0.3s ease'
      }}>
        {/* Desktop Header */}
        <div className="hidden md:block">
          <div className="w-full px-3 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <Link href={`/programs`} className="inline-flex items-center text-sm whitespace-nowrap transition-colors" style={{ color: currentTheme.text, opacity: 0.7 }}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Kembali
              </Link>
              <span className="font-semibold truncate text-lg" style={{ color: currentTheme.text }}>{moduleTitle || 'Belajar Modul'}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center relative">
                <Search className="w-4 h-4 absolute left-3" style={{ color: currentTheme.text, opacity: 0.5 }} />
                <input 
                  className="pl-10 pr-4 py-2 text-sm rounded-lg border focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none w-64 transition-colors" 
                  placeholder="Cari modul/konten"
                  style={{
                    backgroundColor: currentTheme.contentBg,
                    borderColor: currentTheme.borderColor,
                    color: currentTheme.text
                  }}
                />
              </div>
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
          <Link href={`/programs`} className="p-2 rounded-lg transition-colors" style={{
            backgroundColor: readingSettings.theme === 'light' ? 'transparent' : currentTheme.contentBg
          }}>
            <ArrowLeft className="w-5 h-5" style={{ color: currentTheme.text }} />
          </Link>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg transition-colors" aria-label="Cari" style={{
              backgroundColor: readingSettings.theme === 'light' ? 'transparent' : currentTheme.contentBg
            }}>
              <Search className="w-5 h-5" style={{ color: currentTheme.text }} />
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
            <button className="p-2 rounded-lg transition-colors" aria-label="Menu Tambahan" style={{
              backgroundColor: readingSettings.theme === 'light' ? 'transparent' : currentTheme.contentBg
            }}>
              <MoreVertical className="w-5 h-5" style={{ color: currentTheme.text }} />
            </button>
          </div>
        </div>
      </div>

      {/* Content layout */}
      <div className="max-w-6xl mx-auto w-full px-4 py-6 pb-20">
        <div className="reading-content" style={{
          backgroundColor: currentTheme.contentBg,
          color: currentTheme.text,
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
          <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center" style={{
            color: currentTheme.text
          }}>Aturan</h1>
          
          <div className="max-w-4xl mx-auto space-y-6 text-lg leading-relaxed text-left">
            <p>Kuis ini bertujuan untuk menguji pengetahuan Anda tentang materi Mengupas Tuntas Analitik End-to-End dengan Microsoft Fabric.</p>
            
            <p>Terdapat 4 pertanyaan yang harus dikerjakan dalam kuis ini. Beberapa ketentuannya sebagai berikut:</p>
            
            <div className="max-w-md">
              <ul className="list-disc space-y-2 pl-6">
                <li>Syarat nilai kelulusan : 75%</li>
                <li>Durasi ujian : 5 menit</li>
              </ul>
            </div>
            
            <p>Apabila tidak memenuhi syarat kelulusan, Anda dapat mengulang pengerjaan kuis.</p>
            
            <p className="font-semibold">Selamat Mengerjakan!</p>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-lg font-medium">
              Mulai
            </button>
          </div>
        </div>
      </div>


      {/* Adaptive Reading Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSettingsOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full sm:w-[400px] bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Adaptive Reading</h2>
              <button 
                onClick={() => setSettingsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 space-y-6">
              {/* Tema */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Tema</h3>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => updateReadingSettings('theme', 'light')}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      readingSettings.theme === 'light' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {readingSettings.theme === 'light' && (
                      <Check className="absolute top-2 left-2 w-4 h-4 text-green-600" />
                    )}
                    <div className="text-center">
                      <div className="w-full h-8 bg-white border border-gray-200 rounded mb-2 flex items-center justify-center">
                        <span className="text-gray-800 text-sm font-medium">Belajar dengan Garuda Academy</span>
                      </div>
                      <span className="text-xs text-gray-600">Terang</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => updateReadingSettings('theme', 'warm')}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      readingSettings.theme === 'warm' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {readingSettings.theme === 'warm' && (
                      <Check className="absolute top-2 left-2 w-4 h-4 text-green-600" />
                    )}
                    <div className="text-center">
                      <div className="w-full h-8 border border-gray-200 rounded mb-2 flex items-center justify-center" style={{
                        backgroundColor: '#FFF8E7'
                      }}>
                        <span className="text-sm font-medium" style={{ color: '#4A3520' }}>Belajar dengan Garuda Academy</span>
                      </div>
                      <span className="text-xs text-gray-600">Hangat (Nyaman untuk Mata)</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => updateReadingSettings('theme', 'dark')}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      readingSettings.theme === 'dark' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {readingSettings.theme === 'dark' && (
                      <Check className="absolute top-2 left-2 w-4 h-4 text-green-600" />
                    )}
                    <div className="text-center">
                      <div className="w-full h-8 bg-gray-800 border border-gray-200 rounded mb-2 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">Belajar dengan Garuda Academy</span>
                      </div>
                      <span className="text-xs text-gray-600">Gelap</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Jenis Font */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Jenis Font</h3>
                <div className="grid grid-cols-1 gap-2">
                  {['default', 'serif', 'dyslexic'].map((font) => (
                    <button
                      key={font}
                      onClick={() => updateReadingSettings('fontType', font)}
                      className={`relative p-3 rounded-lg border-2 transition-all ${
                        readingSettings.fontType === font 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {readingSettings.fontType === font && (
                        <Check className="absolute top-2 left-2 w-4 h-4 text-green-600" />
                      )}
                      <div className="text-left">
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {font === 'dyslexic' ? 'Open Dyslexic' : font === 'default' ? 'Default' : 'Serif'}
                        </span>
                      </div>
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
                      onClick={() => updateReadingSettings('fontSize', size.key)}
                      className={`relative p-3 rounded-lg border-2 transition-all ${
                        readingSettings.fontSize === size.key 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {readingSettings.fontSize === size.key && (
                        <Check className="absolute top-2 left-2 w-4 h-4 text-green-600" />
                      )}
                      <div className="text-center">
                        <span className="text-sm font-medium text-gray-900">{size.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Lebar Bacaan */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Lebar Bacaan</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => updateReadingSettings('readingWidth', 'medium')}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      readingSettings.readingWidth === 'medium' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {readingSettings.readingWidth === 'medium' && (
                      <Check className="absolute top-2 left-2 w-4 h-4 text-green-600" />
                    )}
                    <div className="text-center">
                      <div className="w-full h-6 bg-gray-200 rounded mb-2"></div>
                      <span className="text-xs text-gray-600">Medium-width</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => updateReadingSettings('readingWidth', 'full')}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      readingSettings.readingWidth === 'full' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {readingSettings.readingWidth === 'full' && (
                      <Check className="absolute top-2 left-2 w-4 h-4 text-green-600" />
                    )}
                    <div className="text-center">
                      <div className="w-full h-6 bg-gray-200 rounded mb-2 flex items-center justify-center">
                        <div className="w-4 h-1 bg-gray-400 rounded"></div>
                      </div>
                      <span className="text-xs text-gray-600">Full-width</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-out drawer for modules/notes - positioned between header and footer */}
      {drawerOpen && (
        <div className="fixed inset-x-0 top-[60px] bottom-[60px] z-40">
          <div className="absolute inset-0 bg-black/40 transition-opacity duration-300" onClick={() => setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full sm:w-[420px] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out">
            {/* Header with close button */}
            <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveTab('modules')} 
                  className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab==='modules' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'}`}
                >
                  <FileText className="w-4 h-4" /> Daftar Modul
                </button>
                <button 
                  onClick={() => setActiveTab('notes')} 
                  className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab==='notes' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'}`}
                >
                  <Pencil className="w-4 h-4" /> Catatan Belajar
                </button>
              </div>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-lg hover:bg-white/50 transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
              {activeTab === 'modules' ? (
                <div className="p-4 space-y-6">
                  {/* Progress Section */}
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-gray-800">Kemajuan</div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-sm font-medium text-gray-700 tabular-nums">{progress}%</span>
                    </div>
                  </div>
                  
                  {/* Sections */}
                  <div className="space-y-4">
                    {/* Persiapan Belajar Section */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <button 
                        onClick={() => toggleSection('persiapan')}
                        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between"
                      >
                        <span className="font-medium text-gray-800 text-left">Persiapan Belajar</span>
                        {expandedSections.persiapan ? (
                          <ChevronUp className="w-5 h-5 text-gray-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                      {expandedSections.persiapan && (
                        <div className="px-4 py-3 space-y-1 bg-white">
                          {drawerContent.persiapan.items.map((item, index) => (
                            <div key={index} className="flex items-center gap-3 py-1">
                              <CheckCircle className={`w-5 h-5 ${item.completed ? 'text-green-500' : 'text-gray-300'}`} />
                              <span className={`text-sm ${item.completed ? 'text-gray-800' : 'text-gray-600'}`}>
                                {item.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Microsoft Fabric Section */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <button 
                        onClick={() => toggleSection('microsoft-fabric')}
                        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-800 text-left text-sm leading-tight">
                            Mengupas Tuntas Analitik End-to-End dengan Microsoft Fabric
                          </span>
                          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-medium">
                            {drawerContent.microsoftFabric.progress}
                          </span>
                        </div>
                        {expandedSections['microsoft-fabric'] ? (
                          <ChevronUp className="w-5 h-5 text-gray-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                      {expandedSections['microsoft-fabric'] && (
                        <div className="px-4 py-3 space-y-1 bg-white">
                          {drawerContent.microsoftFabric.items.map((item, index) => (
                            <div key={index} className="flex items-center gap-3 py-1">
                              <CheckCircle className={`w-5 h-5 ${item.completed ? 'text-green-500' : 'text-gray-300'}`} />
                              <span className={`text-sm ${item.completed ? 'text-gray-800' : 'text-gray-600'}`}>
                                {item.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <div className="text-center py-8">
                    <Pencil className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">Tulis catatan Anda di sini saat belajar</p>
                    <button className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200">
                      Mulai Menulis
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom navigation persistent (header/footer style khusus belajar) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur border-t" style={{
        backgroundColor: `${currentTheme.headerBg}f2`,
        borderColor: currentTheme.borderColor,
        transition: 'all 0.3s ease'
      }}>
        {/* Desktop Footer */}
        <div className="hidden md:block">
          <div className="w-full px-3 py-4 grid grid-cols-3 gap-4">
            <button 
              onClick={() => navigateToModule('prev')}
              disabled={currentModuleIndex === 0}
              className={`text-left rounded-lg p-3 transition-colors ${currentModuleIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              style={{
                backgroundColor: currentModuleIndex === 0 ? 'transparent' : (readingSettings.theme === 'light' ? 'transparent' : currentTheme.contentBg)
              }}
            >
              <div className="text-xs mb-1 font-medium" style={{ color: currentTheme.text, opacity: 0.7 }}>Materi Sebelumnya</div>
              <div className="text-sm truncate" style={{ color: currentTheme.text }}>
                {currentModuleIndex > 0 ? modules[currentModuleIndex - 1]?.name || 'Materi Sebelumnya' : 'Tidak ada materi sebelumnya'}
              </div>
            </button>
            <div className="text-center flex flex-col justify-center">
              <div className="text-xs mb-1 font-medium" style={{ color: currentTheme.text, opacity: 0.7 }}>Materi Saat Ini</div>
              <div className="text-sm font-semibold truncate" style={{ color: currentTheme.text }}>{moduleTitle || 'Kuis Mengupas Tuntas Analitik End-to-End de...'}</div>
            </div>
            <button 
              onClick={() => navigateToModule('next')}
              disabled={currentModuleIndex === modules.length - 1}
              className={`text-right rounded-lg p-3 transition-colors ${currentModuleIndex === modules.length - 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              style={{
                backgroundColor: currentModuleIndex === modules.length - 1 ? 'transparent' : (readingSettings.theme === 'light' ? 'transparent' : currentTheme.contentBg)
              }}
            >
              <div className="text-xs mb-1 font-medium" style={{ color: currentTheme.text, opacity: 0.7 }}>Materi Selanjutnya</div>
              <div className="text-sm truncate" style={{ color: currentTheme.text }}>
                {currentModuleIndex < modules.length - 1 ? modules[currentModuleIndex + 1]?.name || 'Materi Selanjutnya' : 'Tidak ada materi selanjutnya'}
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Footer */}
        <div className="md:hidden w-full px-4 py-3">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigateToModule('prev')}
              disabled={currentModuleIndex === 0}
              className={`p-2 rounded-lg transition-colors ${currentModuleIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              style={{
                backgroundColor: currentModuleIndex === 0 ? 'transparent' : (readingSettings.theme === 'light' ? 'transparent' : currentTheme.contentBg)
              }}
            >
              <ArrowLeft className="w-5 h-5" style={{ color: currentTheme.text }} />
            </button>
            <div className="text-center flex-1 px-4">
              <div className="text-sm font-medium truncate" style={{ color: currentTheme.text }}>{moduleTitle || 'Kuis Mengupas Tuntas Analitik En...'}</div>
            </div>
            <button 
              onClick={() => navigateToModule('next')}
              disabled={currentModuleIndex === modules.length - 1}
              className={`p-2 rounded-lg transition-colors ${currentModuleIndex === modules.length - 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              style={{
                backgroundColor: currentModuleIndex === modules.length - 1 ? 'transparent' : (readingSettings.theme === 'light' ? 'transparent' : currentTheme.contentBg)
              }}
            >
              <ArrowRight className="w-5 h-5" style={{ color: currentTheme.text }} />
            </button>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
