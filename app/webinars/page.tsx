'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { PublicNav } from '@/components/layout/PublicNav'
import { Search, Calendar, TrendingUp, Award } from 'lucide-react'
import { cleanEmailHTML } from '@/lib/html-utils'

interface Webinar {
  id: string
  slug: string
  title: string
  description?: string
  hero_image_url?: string
  start_time: string
  end_time: string
}

export default function WebinarsListPage() {
  const [webinars, setWebinars] = useState<Webinar[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchWebinars() {
      try {
        const res = await fetch('/api/webinars', { cache: 'no-store' })
        const json = await res.json()
        setWebinars(json.webinars || [])
      } finally {
        setLoading(false)
      }
    }
    fetchWebinars()
  }, [])

  const filtered = webinars.filter(w =>
    w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-white">
      <PublicNav activeLink="webinars" />

      {/* Hero Section (match programs) */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-red-50 pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-100 rounded-full mb-4">
              <Calendar className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-semibold text-primary-700">Webinar</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Ikuti Webinar Eksklusif
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Topik terkini bersama pembicara ahli. Gratis dan bersertifikat.
            </p>
          </div>

          {/* Search & Certificate Button */}
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
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
              <Link
                href="/webinar-certificates"
                className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-red-600 text-white rounded-lg hover:from-primary-700 hover:to-red-700 transition-all shadow-lg hover:shadow-xl font-semibold whitespace-nowrap"
              >
                <Award className="w-5 h-5" />
                <span>Sertifikat Webinar</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Webinars Grid (match card style) */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada webinar ditemukan</h3>
              <p className="text-gray-600">Coba ubah kata kunci atau kembali lagi nanti</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((w) => (
                <Link 
                  key={w.id} 
                  href={`/webinars/${w.slug}`} 
                  className="group bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    {w.hero_image_url ? (
                      <Image src={w.hero_image_url} alt={w.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">Banner webinar</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                  </div>
                  <div className="p-4">
                    <div className="mb-2">
                      <span className="inline-block px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">Webinar</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors">{w.title}</h3>
                    {w.description && (() => {
                      // Strip HTML tags for preview and decode entities
                      let text = cleanEmailHTML(w.description)
                      // Remove all HTML tags but keep text content
                      text = text.replace(/<[^>]+>/g, ' ')
                      // Decode HTML entities
                      text = text.replace(/&nbsp;/g, ' ')
                      text = text.replace(/&amp;/g, '&')
                      text = text.replace(/&lt;/g, '<')
                      text = text.replace(/&gt;/g, '>')
                      text = text.replace(/&quot;/g, '"')
                      // Clean up multiple spaces
                      text = text.replace(/\s+/g, ' ').trim()
                      // Limit length
                      const preview = text.length > 150 ? text.substring(0, 150) + '...' : text
                      return (
                        <p className="text-gray-600 text-xs mb-3 line-clamp-2">{preview}</p>
                      )
                    })()}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        {new Date(w.start_time).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}


