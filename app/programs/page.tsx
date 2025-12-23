'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ProgramWithClasses } from '@/types'
import { Search, GraduationCap, Users, BookOpen, Clock, ArrowRight, Star, Award, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/components/AuthProvider'
import { PublicNav } from '@/components/layout/PublicNav'

export default function ProgramsPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [programs, setPrograms] = useState<ProgramWithClasses[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [userEnrollments, setUserEnrollments] = useState<any[]>([])
  const [enrollmentsLoading, setEnrollmentsLoading] = useState<boolean>(true)
  const [enrollmentMap, setEnrollmentMap] = useState<Record<string, string>>({})
  const [filterCategory, setFilterCategory] = useState<string>('all')

  useEffect(() => {
    // Check for referral parameter and redirect if needed
    const referralCode = searchParams.get('referral')
    if (referralCode) {
      if (profile) {
        // User is logged in, redirect to referral registration page
        router.push(`/register-referral/${referralCode}`)
        return
      } else {
        // User not logged in, redirect to register page with referral
        router.push(`/register?referral=${referralCode}`)
        return
      }
    }

    fetchPrograms()
    if (profile?.role === 'user') {
      fetchUserEnrollments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, searchParams])

  async function fetchPrograms() {
    try {
      console.log('🔄 Fetching programs...')
      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          classes:classes(*)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching programs:', error)
        throw error
      }

      console.log('✅ Programs fetched:', data?.length || 0)
      setPrograms(data || [])
    } catch (error) {
      console.error('❌ Error fetching programs:', error)
      setPrograms([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchUserEnrollments() {
    if (!profile?.id) return

    try {
      setEnrollmentsLoading(true)
      const { data: participant } = await supabase
        .from('participants')
        .select('id')
        .eq('user_id', profile.id)
        .maybeSingle()

      if (!participant) {
        setUserEnrollments([])
        setEnrollmentMap({})
        setEnrollmentsLoading(false)
        return
      }

      const { data } = await supabase
        .from('enrollments')
        .select('program_id, status, created_at, notes')
        .eq('participant_id', (participant as any).id)

      setUserEnrollments(data || [])

      const map: Record<string, string> = {}
        ; (data || []).forEach((e: any) => {
          map[String(e?.program_id || '')] = e.status
        })
      setEnrollmentMap(map)
    } catch (error) {
      console.error('Error fetching user enrollments:', error)
    } finally {
      setEnrollmentsLoading(false)
    }
  }

  const getUserEnrollmentStatus = (programId: string) => {
    const enrollment = userEnrollments.find(e => e.program_id === programId)
    return enrollment ? enrollment.status : null
  }

  const categories = Array.from(new Set(programs.map(p => p.category)))

  const filteredPrograms = programs.filter((program) => {
    const matchesSearch = program.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = filterCategory === 'all' || program.category === filterCategory

    return matchesSearch && matchesCategory
  })

  const getEnrollmentButton = (program: any) => {
    if (!profile) {
      return (
        <Link
          href={`/programs/${program.id}`}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-600 to-red-600 text-white rounded-lg hover:from-primary-700 hover:to-red-700 transition-all font-medium"
        >
          Daftar Sekarang
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      )
    }

    const enrollmentStatus = enrollmentMap[String(program.id)] || getUserEnrollmentStatus(program.id)

    if (enrollmentStatus === 'approved') {
      return (
        <Link
          href={`/programs/${program.id}/classes`}
          className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium hover:bg-green-200 transition-colors cursor-pointer"
        >
          <Award className="w-4 h-4 mr-2" />
          Akses Program Pelatihan
        </Link>
      )
    }

    if (enrollmentStatus === 'completed') {
      return (
        <Link
          href={`/programs/${program.id}/classes`}
          className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium hover:bg-blue-200 transition-colors cursor-pointer"
        >
          <GraduationCap className="w-4 h-4 mr-2" />
          Selesai - Lihat Materi
        </Link>
      )
    }

    if (enrollmentStatus === 'pending') {
      return (
        <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-medium">
          <Clock className="w-4 h-4 mr-2" />
          Menunggu Konfirmasi
        </div>
      )
    }

    return (
      <Link
        href={`/programs/${program.id}`}
        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-600 to-red-600 text-white rounded-lg hover:from-primary-700 hover:to-red-700 transition-all font-medium"
      >
        Daftar Sekarang
        <ArrowRight className="w-4 h-4 ml-2" />
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Public Navigation */}
      <PublicNav activeLink="programs" />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-red-50 pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-100 rounded-full mb-4">
              <TrendingUp className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-semibold text-primary-700">Program Pelatihan</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Tingkatkan Keterampilan Anda
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Temukan program pelatihan eksklusif yang dirancang untuk mengembangkan karir dan expertise Anda di bidang AI & Teknologi
            </p>
          </div>

          {/* Search and Filter */}
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari program training..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${filterCategory === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-600'
                  }`}
              >
                Semua Kategori
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setFilterCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${filterCategory === category
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-600'
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Programs Grid */}
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
          ) : filteredPrograms.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada program yang ditemukan</h3>
              <p className="text-gray-600">
                {searchQuery ? 'Coba ubah kata kunci pencarian Anda' : 'Program training akan segera hadir'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrograms.map((program) => (
                <div
                  key={program.id}
                  className="group bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  {/* Program Image */}
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src="/herogemini.png"
                      alt={program.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                      priority={false}
                      style={{ objectPosition: 'center top' }}
                    />
                    {/* Gradient Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                  </div>

                  <div className="p-4">
                    {/* Category Badge */}
                    <div className="mb-2">
                      <span className="inline-block px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                        {program.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors">
                      {program.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                      {program.description}
                    </p>

                    {/* Details */}
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2 text-primary-600" />
                        <span>Max {program.max_participants || '∞'} peserta</span>
                      </div>
                      {program.classes && program.classes.length > 0 && (
                        <div className="flex items-center text-sm text-gray-600">
                          <BookOpen className="w-4 h-4 mr-2 text-primary-600" />
                          <span>{program.classes.length} program pelatihan tersedia</span>
                        </div>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                      <div>
                        <p className="text-xs text-gray-600">Harga</p>
                        <p className="text-xl font-bold text-primary-600">
                          {formatCurrency(program.price)}
                        </p>
                      </div>
                      <div className="flex items-center text-yellow-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="ml-1 text-sm font-semibold text-gray-900">4.8</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-center">
                      {getEnrollmentButton(program)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      {!loading && (
        <section className="bg-gradient-to-r from-primary-600 to-red-600 py-12 mt-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Tidak Menemukan Program yang Tepat?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Hubungi kami untuk mendapatkan penawaran program pelatihan khusus sesuai kebutuhan Anda
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

