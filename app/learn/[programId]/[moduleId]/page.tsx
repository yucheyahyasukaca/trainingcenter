'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, FileText, Pencil, CheckCircle, Search, Settings, List, X, ChevronDown, ChevronUp, Menu, MoreVertical, ArrowLeft, ArrowRight } from 'lucide-react'

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
            const currentIndex = modulesData.findIndex(m => m.id === params.moduleId)
            setCurrentModuleIndex(currentIndex >= 0 ? currentIndex : 0)
          }

          // Fetch current module details
          const { data: currentModule } = await supabase
            .from('classes')
            .select('name')
            .eq('id', params.moduleId)
            .maybeSingle()
          
          if (currentModule?.name) setModuleTitle(currentModule.name)
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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Focused minimal header */}
      <div className="sticky top-0 z-30 bg-white/95 border-b border-gray-200 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        {/* Desktop Header */}
        <div className="hidden md:block w-full px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={`/programs/${params.programId}/classes`} className="inline-flex items-center text-gray-600 hover:text-gray-900 text-sm whitespace-nowrap">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Kembali
            </Link>
            <span className="font-semibold text-gray-900 truncate">{moduleTitle || 'Belajar Modul'}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3" />
              <input className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="Cari modul/konten" />
            </div>
            <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50" aria-label="Pengaturan">
              <Settings className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden w-full px-4 py-3 flex items-center justify-between">
          <Link href={`/programs/${params.programId}/classes`} className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-gray-50 transition-colors" aria-label="Cari">
              <Search className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              onClick={() => setDrawerOpen(true)} 
              className="p-2 rounded-lg hover:bg-gray-50 transition-colors" 
              aria-label="Menu"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-50 transition-colors" aria-label="Menu Tambahan">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Content layout */}
      <div className="max-w-6xl mx-auto w-full px-4 py-6 pb-20">
        <div className="bg-white">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 text-center">Aturan</h1>
          
          <div className="max-w-4xl mx-auto space-y-6 text-lg text-gray-700 leading-relaxed text-left">
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

      {/* Floating toggle button for drawer - hidden on mobile */}
      <button onClick={() => setDrawerOpen(true)} className="hidden md:flex fixed right-3 top-[140px] lg:right-6 z-40 inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-900 text-white shadow-lg hover:bg-gray-800">
        <List className="w-5 h-5" />
      </button>

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
                        <div className="px-4 py-3 space-y-2 bg-white">
                          {drawerContent.persiapan.items.map((item, index) => (
                            <div key={index} className="flex items-center gap-3 py-2">
                              <CheckCircle className={`w-5 h-5 ${item.completed ? 'text-green-500' : 'text-gray-300'}`} />
                              <span className={`text-sm ${item.completed ? 'text-gray-800 line-through' : 'text-gray-600'}`}>
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
                        <div className="px-4 py-3 space-y-2 bg-white">
                          {drawerContent.microsoftFabric.items.map((item, index) => (
                            <div key={index} className="flex items-center gap-3 py-2">
                              <CheckCircle className={`w-5 h-5 ${item.completed ? 'text-green-500' : 'text-gray-300'}`} />
                              <span className={`text-sm ${item.completed ? 'text-gray-800 line-through' : 'text-gray-600'}`}>
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
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 border-t border-gray-200">
        {/* Desktop Footer */}
        <div className="hidden md:block w-full px-4 py-3 grid grid-cols-3 gap-4">
          <button 
            onClick={() => navigateToModule('prev')}
            disabled={currentModuleIndex === 0}
            className={`text-left hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors ${currentModuleIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="text-xs text-gray-500 mb-1">Materi Sebelumnya</div>
            <div className="text-sm text-gray-700 truncate">
              {currentModuleIndex > 0 ? modules[currentModuleIndex - 1]?.name || 'Materi Sebelumnya' : 'Tidak ada materi sebelumnya'}
            </div>
          </button>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Materi Saat Ini</div>
            <div className="text-sm text-gray-900 font-medium truncate">{moduleTitle || 'Kuis Mengupas Tuntas Analitik End-to-End de...'}</div>
          </div>
          <button 
            onClick={() => navigateToModule('next')}
            disabled={currentModuleIndex === modules.length - 1}
            className={`text-right hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors ${currentModuleIndex === modules.length - 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="text-xs text-gray-500 mb-1">Materi Selanjutnya</div>
            <div className="text-sm text-gray-700 truncate">
              {currentModuleIndex < modules.length - 1 ? modules[currentModuleIndex + 1]?.name || 'Materi Selanjutnya' : 'Tidak ada materi selanjutnya'}
            </div>
          </button>
        </div>

        {/* Mobile Footer */}
        <div className="md:hidden w-full px-4 py-3">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigateToModule('prev')}
              disabled={currentModuleIndex === 0}
              className={`p-2 rounded-lg transition-colors ${currentModuleIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="text-center flex-1 px-4">
              <div className="text-sm text-gray-900 font-medium truncate">{moduleTitle || 'Kuis Mengupas Tuntas Analitik En...'}</div>
            </div>
            <button 
              onClick={() => navigateToModule('next')}
              disabled={currentModuleIndex === modules.length - 1}
              className={`p-2 rounded-lg transition-colors ${currentModuleIndex === modules.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}
            >
              <ArrowRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
