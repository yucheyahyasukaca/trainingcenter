'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Trainer } from '@/types'
import { Search, UserCog, Calendar, Award, TrendingUp, Star, Briefcase, MapPin, ArrowRight, BookOpen, Users } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { PublicNav } from '@/components/layout/PublicNav'

export default function TrainersPage() {
  const { profile } = useAuth()
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSpecialization, setFilterSpecialization] = useState<string>('all')

  useEffect(() => {
    fetchTrainers()
  }, [])

  async function fetchTrainers() {
    try {
      const { data, error } = await supabase
        .from('trainers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching trainers:', error)
        throw error
      }
      
      console.log('Trainers fetched:', data?.length || 0, data)
      setTrainers(data || [])
    } catch (error) {
      console.error('Error fetching trainers:', error)
      setTrainers([])
    } finally {
      setLoading(false)
    }
  }

  const specializations = Array.from(new Set(trainers.map(t => t.specialization)))

  const filteredTrainers = trainers.filter((trainer) => {
    const matchesSearch = trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (trainer.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesSpecialization = filterSpecialization === 'all' || trainer.specialization === filterSpecialization
    
    return matchesSearch && matchesSpecialization
  })

  return (
    <div className="min-h-screen bg-white">
      {/* Public Navigation */}
      <PublicNav activeLink="trainers" />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-red-50 pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-100 rounded-full mb-4">
              <Users className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-semibold text-primary-700">Pelajari dari Mentor Terbaik</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Temukan Trainer Profesional
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Platform Garuda Academy didesain untuk menghubungkan trainer berpengalaman dan peserta, 
              membangun koneksi yang berkesinambungan untuk mengembangkan karir dan expertise terbaik.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari trainer berdasarkan nama atau keahlian..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
            </div>

            {/* Specialization Filter */}
            {specializations.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setFilterSpecialization('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filterSpecialization === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-600'
                  }`}
                >
                  Semua Keahlian
                </button>
                {specializations.map((spec) => (
                  <button
                    key={spec}
                    onClick={() => setFilterSpecialization(spec)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      filterSpecialization === spec
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-600'
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Trainers Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                  <div className="h-24 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredTrainers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserCog className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada trainer yang ditemukan</h3>
              <p className="text-gray-600">
                {searchQuery ? 'Coba ubah kata kunci pencarian Anda' : 'Trainer akan segera hadir'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
              {filteredTrainers.map((trainer) => {
                const initials = (trainer.name || '?')
                  .replace(/[.,]/g, ' ')
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w: string) => w[0])
                  .join('')
                  .toUpperCase()
                return (
                <Link
                  key={trainer.id}
                  href={`/trainer-profile/view/${trainer.id}`}
                  className="group flex flex-col bg-white rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                >
                  {/* Banner + foto bulat */}
                  <div className="relative h-20 bg-gradient-to-br from-primary-500 via-primary-600 to-red-500">
                    <div className="absolute top-3 right-3 flex items-center px-2 py-0.5 bg-white/95 rounded-full shadow-sm">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                      <span className="ml-1 text-xs font-semibold text-gray-900">4.8</span>
                    </div>
                    <div className="absolute left-1/2 -bottom-10 -translate-x-1/2 w-20 h-20 rounded-full ring-4 ring-white bg-primary-50 overflow-hidden shadow-md flex items-center justify-center">
                      {trainer.avatar_url ? (
                        <img
                          src={trainer.avatar_url}
                          alt={trainer.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-bold text-primary-600">{initials}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col flex-1 items-center text-center px-5 pt-12 pb-5">
                    <h3 className="text-base font-bold text-gray-900 leading-snug group-hover:text-primary-600 transition-colors line-clamp-2">
                      {trainer.name}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                      <span className="inline-block px-2.5 py-0.5 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full">
                        {trainer.specialization}
                      </span>
                      {trainer.status !== 'active' && (
                        <span className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                          {trainer.status}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                      <Briefcase className="w-3.5 h-3.5" />
                      {trainer.experience_years || 0} tahun pengalaman
                    </p>
                    {trainer.bio && (
                      <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                        {trainer.bio}
                      </p>
                    )}
                    <span className="mt-4 pt-4 w-full border-t border-gray-100 inline-flex items-center justify-center text-sm font-semibold text-primary-600 group-hover:text-primary-700">
                      Lihat Profil
                      <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
                )
              })}
            </div>
          )}

        </div>
      </section>

      {/* CTA Section */}
      {!loading && (
        <section className="bg-gradient-to-r from-primary-600 to-red-600 py-12 mt-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ingin Menjadi Trainer di Garuda Academy?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Bergabunglah dengan tim trainer profesional kami dan bagikan pengetahuan Anda kepada ribuan peserta
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center px-8 py-4 bg-white text-primary-600 rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-xl"
            >
              Hubungi Kami
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-red-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-white">Garuda Academy</h3>
                <p className="text-xs text-gray-400">GARUDA-21 Training Center</p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <Link href="/programs" className="text-sm hover:text-white transition-colors">Program</Link>
              <Link href="/trainers" className="text-sm hover:text-white transition-colors">Trainer</Link>
              <Link href="/about" className="text-sm hover:text-white transition-colors">Tentang</Link>
              <Link href="/contact" className="text-sm hover:text-white transition-colors">Kontak</Link>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-sm text-gray-500">
              © 2025 Garuda Academy GARUDA-21 Training Center. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

