'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Calendar, Clock, Users, ArrowRight, Video, ExternalLink, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/components/AuthProvider'
import { formatDate, formatTime } from '@/lib/utils'

interface Webinar {
  id: string
  slug: string
  title: string
  description: string | null
  hero_image_url: string | null
  start_time: string
  end_time: string
  platform: string | null
  meeting_url: string | null
  is_published: boolean
  registered_at: string
  attended: boolean | null
}

export default function MyWebinarsPage() {
  const { profile, user } = useAuth()
  const [webinars, setWebinars] = useState<Webinar[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all') // all, upcoming, past

  useEffect(() => {
    if (user) {
      fetchWebinars()
    } else {
      setLoading(false)
    }
  }, [user])

  async function fetchWebinars() {
    if (!user?.id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('webinar_registrations')
        .select(`
          webinar_id,
          registered_at,
          attended,
          webinars:webinars(
            id,
            slug,
            title,
            description,
            hero_image_url,
            start_time,
            end_time,
            platform,
            meeting_url,
            is_published
          )
        `)
        .eq('user_id', user.id)
        .order('registered_at', { ascending: false })

      if (error) {
        console.error('Error fetching webinars:', error)
        throw error
      }

      const mapped: Webinar[] = (data || [])
        .filter((r: any) => r.webinars) // Filter out null webinars
        .map((r: any) => ({
          id: r.webinars.id,
          slug: r.webinars.slug,
          title: r.webinars.title,
          description: r.webinars.description,
          hero_image_url: r.webinars.hero_image_url,
          start_time: r.webinars.start_time,
          end_time: r.webinars.end_time,
          platform: r.webinars.platform,
          meeting_url: r.webinars.meeting_url,
          is_published: r.webinars.is_published,
          registered_at: r.registered_at,
          attended: r.attended
        }))

      setWebinars(mapped)
    } catch (error) {
      console.error('Error fetching webinars:', error)
      setWebinars([])
    } finally {
      setLoading(false)
    }
  }

  const getWebinarStatus = (webinar: Webinar) => {
    const now = new Date()
    const startTime = new Date(webinar.start_time)
    const endTime = new Date(webinar.end_time)

    if (now < startTime) {
      return 'upcoming'
    } else if (now >= startTime && now <= endTime) {
      return 'ongoing'
    } else {
      return 'past'
    }
  }

  const filteredWebinars = webinars.filter((webinar) => {
    const matchesSearch = webinar.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (webinar.description && webinar.description.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const status = getWebinarStatus(webinar)
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'upcoming' && status === 'upcoming') ||
      (filterStatus === 'past' && status === 'past')
    
    return matchesSearch && matchesStatus
  })

  const getPlatformName = (platform: string | null) => {
    if (!platform) return 'Online'
    const platforms: Record<string, string> = {
      'microsoft-teams': 'Microsoft Teams',
      'google-meet': 'Google Meet',
      'zoom': 'Zoom'
    }
    return platforms[platform] || platform
  }

  const getActionButton = (webinar: Webinar) => {
    const status = getWebinarStatus(webinar)
    const now = new Date()
    const startTime = new Date(webinar.start_time)

    if (status === 'upcoming') {
      return (
        <Link
          href={`/webinars/${webinar.slug}`}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-600 to-red-600 text-white rounded-lg hover:from-primary-700 hover:to-red-700 transition-all font-medium"
        >
          Lihat Detail
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      )
    }

    if (status === 'ongoing' && webinar.meeting_url) {
      return (
        <a
          href={webinar.meeting_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Video className="w-4 h-4 mr-2" />
          Bergabung Sekarang
        </a>
      )
    }

    if (status === 'past') {
      return (
        <Link
          href={`/webinars/${webinar.slug}`}
          className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Lihat Rekaman
        </Link>
      )
    }

    return (
      <Link
        href={`/webinars/${webinar.slug}`}
        className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
      >
        Lihat Detail
        <ArrowRight className="w-4 h-4 ml-2" />
      </Link>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-1 h-8 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></div>
          <h1 className="text-3xl font-bold text-gray-900">Webinar Saya</h1>
        </div>
        <p className="text-gray-600 ml-4">
          Daftar webinar yang telah Anda daftarkan dan ikuti
        </p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari webinar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterStatus === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterStatus('upcoming')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterStatus === 'upcoming'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Akan Datang
          </button>
          <button
            onClick={() => setFilterStatus('past')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterStatus === 'past'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Selesai
          </button>
        </div>
      </div>

      {/* Webinars Grid */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredWebinars.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada webinar yang ditemukan</h3>
            <p className="text-gray-600">
              {searchQuery ? 'Coba ubah kata kunci pencarian Anda' : 'Anda belum terdaftar di webinar manapun'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWebinars.map((webinar) => {
              const status = getWebinarStatus(webinar)
              const startDate = new Date(webinar.start_time)
              const endDate = new Date(webinar.end_time)

              return (
                <div 
                  key={webinar.id} 
                  className="group bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  {/* Webinar Image */}
                  <div className="relative h-48 overflow-hidden">
                    {webinar.hero_image_url ? (
                      <Image
                        src={webinar.hero_image_url}
                        alt={webinar.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                        priority={false}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary-600 to-red-600 flex items-center justify-center">
                        <Video className="w-16 h-16 text-white opacity-50" />
                      </div>
                    )}
                    {/* Gradient Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3 z-20">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                        status === 'ongoing' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {status === 'upcoming' ? 'Akan Datang' :
                         status === 'ongoing' ? 'Berlangsung' :
                         'Selesai'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                      {webinar.title}
                    </h3>

                    {/* Description */}
                    {webinar.description && (
                      <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                        {webinar.description}
                      </p>
                    )}

                    {/* Details */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 text-primary-600" />
                        <span>{formatDate(webinar.start_time)}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2 text-primary-600" />
                        <span>
                          {formatTime(webinar.start_time)} - {formatTime(webinar.end_time)}
                        </span>
                      </div>
                      {webinar.platform && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Video className="w-4 h-4 mr-2 text-primary-600" />
                          <span>{getPlatformName(webinar.platform)}</span>
                        </div>
                      )}
                      {webinar.attended && (
                        <div className="flex items-center text-sm text-green-600">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          <span>Sudah Hadir</span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-center pt-3 border-t border-gray-200">
                      {getActionButton(webinar)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
