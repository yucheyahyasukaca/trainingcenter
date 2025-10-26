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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTrainers.map((trainer) => (
                <div 
                  key={trainer.id} 
                  className="group bg-white rounded-2xl border-2 border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  {/* Profile Image - Full Section */}
                  <div className="h-96 bg-gray-100 relative overflow-hidden">
                    {trainer.avatar_url ? (
                      <img
                        src={trainer.avatar_url}
                        alt={trainer.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary-100 via-primary-200 to-red-100 flex items-center justify-center">
                        <UserCog className="w-32 h-32 text-primary-600/60" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <div className="flex items-center px-3 py-1 bg-white/95 backdrop-blur-sm rounded-full shadow-lg">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="ml-1 text-sm font-semibold text-gray-900">4.8</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Specialization Badge & Status */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                        {trainer.specialization}
                      </span>
                      {trainer.status !== 'active' && (
                        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                          {trainer.status}
                        </span>
                      )}
                    </div>

                    {/* Name and Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                      {trainer.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {trainer.experience_years || 0} Tahun pengalaman di industri
                    </p>

                    {/* Experience Info */}
                    <div className="space-y-2 mb-4">
                      {trainer.bio && (
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {trainer.bio}
                        </p>
                      )}
                    </div>

                    {/* Action Button */}
                    <Link
                      href={`/trainer-profile/view/${trainer.id}`}
                      className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-primary-600 to-red-600 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-red-700 transition-all group/btn"
                    >
                      Lihat Profil Lengkap
                      <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Why Choose Our Trainers */}
          {!loading && filteredTrainers.length > 0 && (
            <div className="mt-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Mengapa Pilih Trainer Kami?
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Trainer kami telah terbukti berpengalaman dan berkualitas tinggi
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Berpengalaman</h3>
                  <p className="text-gray-600">Trainer kami memiliki pengalaman minimal 2 tahun di industri</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8 text-center">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Terkualifikasi</h3>
                  <p className="text-gray-600">Semua trainer telah melalui proses seleksi yang ketat</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-8 text-center">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Aktual</h3>
                  <p className="text-gray-600">Mengikuti perkembangan teknologi dan praktik terbaru</p>
                </div>
              </div>
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

