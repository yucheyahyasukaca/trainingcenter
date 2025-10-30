'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { PublicNav } from '@/components/layout/PublicNav'
import { supabase } from '@/lib/supabase'

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

  const isEnded = useMemo(() => webinar ? new Date(webinar.end_time) < new Date() : false, [webinar])

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
            .select('pdf_url')
            .eq('webinar_id', json.webinar.id)
            .eq('user_id', user.id)
            .maybeSingle()
          setCertificateUrl(cert?.pdf_url || null)
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
    <div className="min-h-screen bg-gray-50">
      <PublicNav activeLink="webinars" />
      <div className="pt-24">
        {loading ? (
          <div className="text-center py-20 text-gray-600">Memuat webinar...</div>
        ) : !webinar ? (
          <div className="text-center py-20 text-gray-600">Webinar tidak ditemukan.</div>
        ) : (
          <>
            {/* Hero Section */}
            <section className="max-w-6xl mx-auto px-4">
              <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
                <div className="relative h-64 md:h-96 w-full bg-gray-100">
                  {webinar.hero_image_url ? (
                    <Image src={webinar.hero_image_url} alt={webinar.title} fill className="object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400">Banner webinar (placeholder)</div>
                  )}
                </div>
                <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{webinar.title}</h1>
                    <p className="text-gray-600 mt-3 whitespace-pre-line">{webinar.description}</p>
                    <div className="mt-6 text-sm text-gray-700">
                      <div className="font-medium">Jadwal</div>
                      <div>{new Date(webinar.start_time).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })} — {new Date(webinar.end_time).toLocaleTimeString('id-ID', { timeStyle: 'short' })}</div>
                    </div>
                  </div>
                  <div className="lg:col-span-1">
                    <div className="bg-gray-50 border rounded-2xl p-5">
                      {registered ? (
                        <button disabled className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold opacity-90">
                          Terdaftar
                        </button>
                      ) : (
                        <button onClick={handleRegister} disabled={registering} className="w-full py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-60">
                          {registering ? 'Mendaftar...' : 'Daftar Webinar'}
                        </button>
                      )}
                      <a
                        href={webinar.meeting_url || '#'}
                        target={webinar.meeting_url ? '_blank' : undefined}
                        className={`w-full mt-3 inline-flex justify-center py-3 rounded-xl border font-semibold ${webinar.meeting_url ? 'hover:bg-gray-100' : 'opacity-70 cursor-not-allowed'}`}
                        onClick={(e)=>{ if (!webinar.meeting_url) e.preventDefault() }}
                      >
                        {webinar.meeting_url ? 'Akses Webinar' : 'Link meeting belum tersedia'}
                      </a>
                      {recordings.length > 0 && recordings[0].is_public && (
                        <a href="#recording" className="w-full mt-3 inline-flex justify-center py-3 rounded-xl border font-semibold hover:bg-gray-100">
                          Akses Rekaman Webinar
                        </a>
                      )}
                      {isEnded && (
                        certificateUrl ? (
                          <a href={certificateUrl} target="_blank" className="w-full mt-3 inline-flex justify-center py-3 rounded-xl border font-semibold hover:bg-gray-100">
                            Unduh Sertifikat
                          </a>
                        ) : (
                          <button onClick={handleGetCertificate} className="w-full mt-3 py-3 rounded-xl border font-semibold hover:bg-gray-100">
                            Sertifikat belum tersedia
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Speakers */}
            <section className="max-w-6xl mx-auto px-4 mt-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Pembicara</h2>
              {speakers.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1,2,3].map((i)=> (
                    <div key={i} className="relative overflow-hidden rounded-2xl border bg-white">
                      {/* Decorative gradient */}
                      <div className="absolute -top-10 -right-10 w-36 h-36 bg-gradient-to-br from-primary-200 to-red-200 rounded-full opacity-60 blur-2xl" />
                      <div className="p-5 relative">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
                          <div className="flex-1">
                            <div className="h-4 w-2/3 bg-gray-200 rounded mb-2 animate-pulse" />
                            <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
                          </div>
                        </div>
                        <div className="mt-4 h-3 w-full bg-gray-100 rounded animate-pulse" />
                        <div className="mt-2 h-3 w-5/6 bg-gray-100 rounded animate-pulse" />
                        <div className="mt-6 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full border bg-gray-50 text-gray-600">Segera diumumkan</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {speakers.map(s => (
                    <div key={s.id} className="bg-white border rounded-2xl p-5 flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                        {s.avatar_url ? (
                          <Image src={s.avatar_url} alt={s.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Foto</div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{s.name}</div>
                        {s.title && <div className="text-sm text-gray-600">{s.title}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recording placeholder */}
            {recordings.length > 0 && recordings[0].is_public && (
              <section id="recording" className="max-w-6xl mx-auto px-4 mt-10 mb-16">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Rekaman Webinar</h2>
                <div className="bg-white border rounded-2xl p-6">
                  <RecordingEmbed url={recordings[0].recording_url} />
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}


