'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { PublicNav } from '@/components/layout/PublicNav'
import { supabase } from '@/lib/supabase'
import { Calendar, Clock, CheckCircle, Download, Video, MessageCircle, ChevronDown, Sparkles, Award, Users } from 'lucide-react'

interface Speaker {
  id: string
  name: string
  title?: string
  avatar_url?: string
  bio?: string
}

interface Webinar {
  id: string
  slug: string
  title: string
  description?: string
  hero_image_url?: string
  start_time: string
  end_time: string
  meeting_url?: string
  platform?: string // 'microsoft-teams' | 'google-meet' | 'zoom'
}

interface Recording { id: string; recording_url: string; is_public: boolean }

export default function WebinarLandingPage() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const { user } = useAuth()
  const [webinar, setWebinar] = useState<Webinar | null>(null)
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [participantCount, setParticipantCount] = useState<number>(0)

  const isEnded = useMemo(() => webinar ? new Date(webinar.end_time) < new Date() : false, [webinar])

  // Platform helper
  const getPlatformInfo = (platform?: string) => {
    const defaultPlatform = 'microsoft-teams'
    const p = platform || defaultPlatform
    
    switch (p.toLowerCase()) {
      case 'google-meet':
        return { name: 'Google Meet', imageUrl: '/googlemeet.png', color: 'from-blue-50 to-blue-100/50', borderColor: 'border-blue-200', textColor: 'text-blue-600' }
      case 'zoom':
        return { name: 'Zoom', imageUrl: '/zoom.png', color: 'from-indigo-50 to-indigo-100/50', borderColor: 'border-indigo-200', textColor: 'text-indigo-600' }
      case 'luring':
        return { name: 'Luring (Offline)', imageUrl: null, color: 'from-gray-50 to-gray-100/50', borderColor: 'border-gray-200', textColor: 'text-gray-600' }
      case 'microsoft-teams':
      default:
        return { name: 'Microsoft Teams', imageUrl: '/teams.png', color: 'from-purple-50 to-purple-100/50', borderColor: 'border-purple-200', textColor: 'text-purple-600' }
    }
  }

  const platformInfo = useMemo(() => getPlatformInfo(webinar?.platform), [webinar?.platform])

  const faqs = [
    {
      question: 'Platform apa yang digunakan untuk webinar?',
      answer: 'Webinar ini menggunakan Microsoft Teams, Google Meet dan Zoom sebagai platform utama. Link meeting akan tersedia setelah Anda terdaftar dan webinar dimulai.'
    },
    {
      question: 'Apakah webinar ini gratis?',
      answer: 'Ya, webinar ini sepenuhnya gratis! Kami berkomitmen untuk memberikan akses pendidikan berkualitas tanpa biaya kepada seluruh peserta.'
    },
    {
      question: 'Siapa saja narasumber yang akan hadir?',
      answer: 'Kami menghadirkan narasumber terbaik di bidangnya yang memiliki pengalaman dan expertise yang luas. Detail pembicara dapat dilihat di bagian atas halaman ini.'
    },
    {
      question: 'Bagaimana cara bergabung dengan komunitas Garuda Academy?',
      answer: 'Bergabunglah dengan WhatsApp Group Garuda Academy untuk mendapatkan update terbaru, berbagi pengalaman, dan networking dengan sesama peserta webinar dan komunitas pembelajaran. Klik link di bawah untuk bergabung!'
    },
    {
      question: 'Apakah saya akan mendapatkan sertifikat?',
      answer: 'Ya! Setelah webinar selesai dan Anda terdaftar, sertifikat akan diterbitkan secara otomatis dan dapat diunduh melalui tombol "Unduh Sertifikat" di halaman ini.'
    }
  ]

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/webinars/${params.slug}`)
        const json = await res.json()
        if (res.ok) {
          setWebinar(json.webinar)
          setSpeakers(json.speakers)
          setRecordings(json.recordings || [])
        }
        // Load certificate for current user
        if (user && json?.webinar?.id) {
          const { data: cert } = await supabase
            .from('webinar_certificates')
            .select('certificate_number')
            .eq('webinar_id', json.webinar.id)
            .eq('user_id', user.id)
            .maybeSingle()
          setCertificateUrl(
            cert?.certificate_number
              ? `/api/webinar-certificates/${cert.certificate_number}/pdf`
              : null
          )
        }
        // Check registration if logged in (client-side with RLS)
        if (user && json?.webinar?.id) {
          const { data: reg } = await supabase
            .from('webinar_registrations')
            .select('id')
            .eq('webinar_id', json.webinar.id)
            .maybeSingle()
          setRegistered(!!reg)
          // Auto-register once when back with session
          if (!reg) {
            try {
              await supabase.from('webinar_registrations').insert({ webinar_id: json.webinar.id, user_id: user.id })
              setRegistered(true)
            } catch {}
          }
        }
        // Load participant count
        if (json?.webinar?.id) {
          const { count } = await supabase
            .from('webinar_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('webinar_id', json.webinar.id)
          setParticipantCount(count || 0)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.slug, user])

  async function handleRegister() {
    if (!webinar) return
    // Selalu arahkan ke register sesuai requirement
    if (!user) {
      router.push(`/register?next=/webinars/${webinar.slug}`)
      return
    }
    try {
      setRegistering(true)
      await supabase.from('webinar_registrations').insert({ webinar_id: webinar.id, user_id: user.id })
      setRegistered(true)
      setParticipantCount(prev => prev + 1)
    } finally {
      setRegistering(false)
    }
  }

  function parseYouTubeId(url: string) {
    try {
      const u = new URL(url)
      if (u.hostname.includes('youtube.com')) return u.searchParams.get('v')
      if (u.hostname.includes('youtu.be')) return u.pathname.slice(1)
      return null
    } catch { return null }
  }

  function RecordingEmbed({ url }: { url: string }) {
    const yt = parseYouTubeId(url)
    if (yt) {
      return (
        <div className="aspect-video w-full rounded-xl overflow-hidden border">
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${yt}`}
            title="Webinar Recording"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      )
    }
    return (
      <a href={url} target="_blank" className="inline-flex items-center px-4 py-2 rounded-lg border hover:bg-gray-50">
        Buka Rekaman
      </a>
    )
  }

  async function handleGetCertificate() {
    if (!webinar) return
    if (!user) {
      router.push(`/login?next=/webinars/${webinar.slug}`)
      return
    }
    // Soft-trigger issuance (idempotent); requires admin by policy, so in production use a scheduled job
    await fetch(`/api/webinars/${webinar.slug}/issue-certificates`, { method: 'POST' })
    // Show simple toast alternative
    alert('Jika tersedia, sertifikat Anda akan terbit otomatis setelah webinar selesai.')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <PublicNav activeLink="webinars" />
      <div className="pt-20 sm:pt-24 pb-16">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-gray-600">Memuat webinar...</p>
          </div>
        ) : !webinar ? (
          <div className="text-center py-20 text-gray-600">Webinar tidak ditemukan.</div>
        ) : (
          <>
            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
              <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100">
                {/* Hero Image - tidak terpotong */}
                <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-primary-600 via-red-600 to-purple-600">
                  {webinar.hero_image_url ? (
                    <Image 
                      src={webinar.hero_image_url} 
                      alt={webinar.title} 
                      fill 
                      className="object-contain" 
                      priority 
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1280px"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-white/80">
                      <div className="text-center">
                        <Sparkles className="w-16 h-16 mx-auto mb-3 opacity-50" />
                        <p className="text-lg">Banner Webinar</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Title and Date/Time - dipindah ke bawah banner */}
                <div className="p-6 md:p-8 border-b border-gray-100">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 text-gray-900 leading-tight">{webinar.title}</h1>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm sm:text-base">
                    <div className="flex items-center gap-2 bg-primary-50 px-3 py-1.5 rounded-full text-primary-700">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(webinar.start_time).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-primary-50 px-3 py-1.5 rounded-full text-primary-700">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(webinar.start_time).toLocaleTimeString('id-ID', { timeStyle: 'short' })} — {new Date(webinar.end_time).toLocaleTimeString('id-ID', { timeStyle: 'short' })}</span>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6 md:p-8 lg:p-10">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Content */}
                    <div className="lg:col-span-2 space-y-6">
                      {webinar.description && (
                        <div className="prose prose-lg max-w-none">
                          <p className="text-gray-700 leading-relaxed whitespace-pre-line text-base sm:text-lg">{webinar.description}</p>
                        </div>
                      )}
                      
                      {/* Info Cards - Modern Design */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Akses Webinar Card - Clickable */}
                        {webinar.platform === 'luring' ? (
                          <div className={`group relative overflow-hidden bg-white/80 backdrop-blur-sm ${platformInfo.borderColor} border-2 rounded-2xl p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
                            <div className={`absolute inset-0 bg-gradient-to-br ${platformInfo.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                            <div className="relative flex items-center gap-4">
                              <div className="relative w-14 h-14 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <Calendar className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className={`text-xs ${platformInfo.textColor} font-semibold uppercase tracking-wide mb-1`}>Lokasi</div>
                                <div className="text-base font-bold text-gray-900">
                                  {webinar.meeting_url || 'Lokasi akan diinformasikan kemudian'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <a
                            href={webinar.meeting_url || '#'}
                            target={webinar.meeting_url ? '_blank' : undefined}
                            onClick={(e)=>{ if (!webinar.meeting_url) e.preventDefault() }}
                            className={`group relative overflow-hidden bg-white/80 backdrop-blur-sm ${platformInfo.borderColor} border-2 rounded-2xl p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer ${!webinar.meeting_url ? 'opacity-70 cursor-not-allowed' : ''}`}
                          >
                            <div className={`absolute inset-0 bg-gradient-to-br ${platformInfo.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                            <div className="relative flex items-center gap-4">
                              {platformInfo.imageUrl && (
                                <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                  <Image 
                                    src={platformInfo.imageUrl} 
                                    alt={platformInfo.name}
                                    width={56}
                                    height={56}
                                    className="object-contain"
                                  />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className={`text-xs ${platformInfo.textColor} font-semibold uppercase tracking-wide mb-1`}>Link Meeting</div>
                                <div className="text-base font-bold text-gray-900">{webinar.meeting_url ? platformInfo.name : 'Link meeting belum tersedia'}</div>
                              </div>
                            </div>
                          </a>
                        )}
                        {/* Free Card */}
                        <div className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-green-200 border-2 rounded-2xl p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative flex items-center gap-4">
                            <div className="relative w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <Sparkles className="w-6 h-6 text-white" />
                              <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                            <div className="flex-1">
                              <div className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">Biaya</div>
                              <div className="text-base font-bold text-gray-900">Gratis</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Certificate Card */}
                      <div className="mt-4">
                        {isEnded ? (
                          certificateUrl ? (
                            <a 
                              href={certificateUrl} 
                              target="_blank" 
                              className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-green-300 border-2 rounded-2xl p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex items-center gap-4"
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <div className="relative w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <Download className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">Sertifikat</div>
                                <div className="text-base font-bold text-gray-900">Unduh Sertifikat</div>
                                <div className="text-xs text-gray-500 mt-1">Sertifikat siap diunduh</div>
                              </div>
                            </a>
                          ) : (
                            <div className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-gray-200 border-2 rounded-2xl p-5 opacity-60 cursor-not-allowed flex items-center gap-4">
                              <div className="relative w-14 h-14 bg-gray-200 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <Award className="w-6 h-6 text-gray-400" />
                              </div>
                              <div className="flex-1">
                                <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Sertifikat</div>
                                <div className="text-base font-bold text-gray-400">Unduh Sertifikat</div>
                                <div className="text-xs text-gray-400 mt-1">Sertifikat dapat diunduh setelah diterbitkan admin</div>
                              </div>
                            </div>
                          )
                        ) : (
                          <div className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-gray-200 border-2 rounded-2xl p-5 opacity-60 cursor-not-allowed flex items-center gap-4">
                            <div className="relative w-14 h-14 bg-gray-200 rounded-2xl flex items-center justify-center flex-shrink-0">
                              <Award className="w-6 h-6 text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Sertifikat</div>
                              <div className="text-base font-bold text-gray-400">Unduh Sertifikat</div>
                              <div className="text-xs text-gray-400 mt-1">Sertifikat dapat diunduh setelah webinar selesai</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Sidebar - Action Cards */}
                    <div className="lg:col-span-1">
                      <div className="sticky top-24 space-y-4">
                        {/* Register Button */}
                        <div className="bg-gradient-to-br from-primary-600 to-red-600 rounded-2xl p-6 shadow-lg">
                          {registered ? (
                            <div className="text-center">
                              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <CheckCircle className="w-6 h-6 text-white" />
                              </div>
                              <button disabled className="w-full py-3.5 rounded-xl bg-white/20 backdrop-blur-sm text-white font-bold text-lg opacity-90">
                                Terdaftar
                              </button>
                              <p className="text-white/80 text-xs mt-2">Anda sudah terdaftar untuk webinar ini</p>
                            </div>
                          ) : (
                            <button 
                              onClick={handleRegister} 
                              disabled={registering} 
                              className="w-full py-3.5 rounded-xl bg-white text-primary-600 font-bold text-lg hover:bg-gray-50 disabled:opacity-60 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                              {registering ? 'Mendaftar...' : 'Daftar Webinar'}
                            </button>
                          )}
                        </div>

                        {/* Participant Count Card */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200 shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                              <Users className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">Total Peserta</div>
                              <div className="text-2xl font-extrabold text-gray-900 tabular-nums">{participantCount.toLocaleString('id-ID')}</div>
                              <div className="text-xs text-gray-500 mt-0.5">sudah bergabung</div>
                            </div>
                          </div>
                        </div>

                        {/* Recording Button */}
                        {recordings.length > 0 && recordings[0].is_public && (
                          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                            <a 
                              href="#recording" 
                              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
                            >
                              <Video className="w-5 h-5" />
                              Akses Rekaman Webinar
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Speakers Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Pembicara</h2>
                <p className="text-gray-600">Ahli di bidangnya yang siap berbagi pengetahuan</p>
              </div>
              {speakers.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1,2,3].map((i)=> (
                    <div key={i} className="relative overflow-hidden rounded-2xl border bg-white p-6 hover:shadow-lg transition-shadow">
                      <div className="absolute -top-10 -right-10 w-36 h-36 bg-gradient-to-br from-primary-200 to-red-200 rounded-full opacity-60 blur-2xl" />
                      <div className="relative">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
                          <div className="flex-1">
                            <div className="h-4 w-2/3 bg-gray-200 rounded mb-2 animate-pulse" />
                            <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                          <div className="h-3 w-5/6 bg-gray-100 rounded animate-pulse" />
                        </div>
                        <div className="mt-4 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full border bg-gray-50 text-gray-600">
                          Segera diumumkan
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`grid grid-cols-1 gap-6 ${
                  speakers.length === 1 
                    ? 'md:grid-cols-1 md:max-w-md md:mx-auto' 
                    : speakers.length === 2
                    ? 'md:grid-cols-2 md:max-w-2xl md:mx-auto'
                    : 'md:grid-cols-2 lg:grid-cols-3'
                }`}>
                  {speakers.map(s => (
                    <div key={s.id} className="bg-white border rounded-2xl p-6 hover:shadow-lg transition-all group">
                      <div className="flex items-start gap-4">
                        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-primary-100 to-red-100 flex-shrink-0 group-hover:ring-4 ring-primary-200 transition-all">
                          {s.avatar_url ? (
                            <Image src={s.avatar_url} alt={s.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary-600 font-bold text-xl">
                              {s.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-900 text-lg mb-1">{s.name}</div>
                          {s.title && <div className="text-sm text-primary-600 font-medium mb-2">{s.title}</div>}
                          {s.bio && <div className="text-sm text-gray-600 line-clamp-2">{s.bio}</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* FAQ Section */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
              <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-6 md:p-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Pertanyaan Umum</h2>
                  <p className="text-gray-600">Informasi penting tentang webinar ini</p>
                </div>
                <div className="space-y-3">
                  {faqs.map((faq, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setOpenFaq(openFaq === index ? null : index)}
                        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                        <ChevronDown className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${openFaq === index ? 'transform rotate-180' : ''}`} />
                      </button>
                      {openFaq === index && (
                        <div className="px-5 pb-4 pt-0">
                          <div className="pt-4 border-t border-gray-100">
                            <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                            {index === 3 && (
                              <a 
                                href="https://chat.whatsapp.com/IAf09r8oGOvAZpH9yUYRq0" 
                                target="_blank"
                                className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-all shadow-md hover:shadow-lg"
                              >
                                <MessageCircle className="w-5 h-5" />
                                Bergabung WhatsApp Group
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Recording Section */}
            {recordings.length > 0 && recordings[0].is_public && (
              <section id="recording" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
                <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-6 md:p-8">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 text-center">Rekaman Webinar</h2>
                  <RecordingEmbed url={recordings[0].recording_url} />
                </div>
              </section>
            )}

            {/* WhatsApp CTA */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 md:p-8 text-center text-white shadow-lg">
                <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-90" />
                <h3 className="text-xl md:text-2xl font-bold mb-2">Bergabung dengan Komunitas</h3>
                <p className="text-green-50 mb-4 max-w-xl mx-auto text-sm md:text-base">
                  Dapatkan update webinar terbaru dan networking dengan sesama peserta di WhatsApp Group Garuda Academy
                </p>
                <a 
                  href="https://chat.whatsapp.com/IAf09r8oGOvAZpH9yUYRq0" 
                  target="_blank"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-green-600 rounded-lg font-semibold text-base hover:bg-gray-50 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <MessageCircle className="w-5 h-5" />
                  Gabung WhatsApp Group
                </a>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
