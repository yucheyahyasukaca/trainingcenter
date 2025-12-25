'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users, Clock, CheckCircle, BookOpen, Award, Star, Play, Download, Calendar, MapPin, GraduationCap, ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuth } from '@/components/AuthProvider'
import { PublicNav } from '@/components/layout/PublicNav'
import { ProgramStatisticsModal } from '@/components/programs/ProgramStatisticsModal'
import { TrainerProgramLandingPage } from '@/components/programs/TrainerProgramLandingPage'

interface ProgramWithClasses {
  id: string
  title: string
  description: string
  category: string
  price: number
  start_date: string
  end_date: string
  max_participants: number | null
  status: string
  image_url: string | null
  classes?: any[]
  trainer?: any
}

export default function ProgramLandingPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { profile } = useAuth()
  const [program, setProgram] = useState<ProgramWithClasses | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrollmentStatus, setEnrollmentStatus] = useState<string | null>(null)
  const [featureCarouselIndex, setFeatureCarouselIndex] = useState(0)
  const [testimonialIndex, setTestimonialIndex] = useState(0)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [showStatisticsModal, setShowStatisticsModal] = useState(false)

  useEffect(() => {
    fetchProgram()
    if (profile) {
      checkEnrollment()
    }
  }, [params.id, profile])

  async function fetchProgram() {
    try {
      setLoading(true)

      const { data: programData, error: programError } = await supabase
        .from('programs')
        .select(`
          *,
          image_url,
          classes (
            id,
            name,
            start_date,
            end_date,
            start_time,
            end_time,
            max_participants,
            current_participants,
            status
          )
        `)
        .eq('id', params.id)
        .single()

      if (programError) throw programError

      const programWithTrainer: any = programData

      if ((programData as any).trainer_id) {
        const { data: trainerData } = await supabase
          .from('trainers')
          .select('*, user:user_profiles(*)')
          .eq('id', (programData as any).trainer_id)
          .single()

        if (trainerData) {
          programWithTrainer.trainer = {
            ...trainerData,
            full_name: (trainerData as any).user?.full_name || (trainerData as any).full_name,
            photo_url: (trainerData as any).user?.avatar_url || (trainerData as any).photo_url
          }
        }
      }

      setProgram(programWithTrainer)
    } catch (error) {
      console.error('Error fetching program:', error)
      router.push('/programs')
    } finally {
      setLoading(false)
    }
  }

  async function checkEnrollment() {
    if (!profile) return

    try {
      const { data } = await supabase
        .from('enrollments')
        .select('status')
        .eq('program_id', params.id)
        .eq('participant_id', (profile as any).participant_id)
        .single()

      if (data && (data as any).status) {
        setEnrollmentStatus((data as any).status)
      }
    } catch (error) {
      setEnrollmentStatus(null)
    }
  }

  const features = [
    {
      number: '1',
      text: 'Buat rencana pelajaran, tulis proposal, atau ringkas rangkaian pesan email dengan cepat menggunakan Gemini.'
    },
    {
      number: '2',
      text: 'Hemat waktu, ciptakan pengalaman pembelajaran yang menarik, dan dapatkan berbagai ide baru dengan Gemini.'
    },
    {
      number: '3',
      text: 'Transformasi cara kerja, pengajaran, dan pembelajaran di komunitas pendidikan Anda dengan Gemini.'
    }
  ]

  const learningPoints = [
    'Memahami konsep dan praktik terbaik dalam bidang terkait.',
    'Menguasai tools dan teknologi yang relevan dengan industri.',
    'Mengembangkan keterampilan praktis yang dapat langsung diterapkan.',
    'Membangun jaringan profesional dengan sesama peserta dan trainer.'
  ]

  const testimonials = [
    {
      name: 'Agung Jumari',
      role: 'Guru SMA Negeri 1 Pati, Jawa Tengah',
      quote: 'Program ini sangat berwawasan luas. Para pembicara memberikan materi dan wawasan yang sangat bermanfaat. Semoga akan ada program lanjutan yang lebih mendalam.',
      image: '/testimonial-1.jpg' // Placeholder
    }
  ]

  const faqs = [
    {
      question: 'Apa itu Gemini untuk Pendidik?',
      answer: 'Gemini untuk Pendidik adalah program pelatihan komprehensif yang dirancang untuk membekali para pendidik dengan pengetahuan dan keterampilan untuk memanfaatkan alat AI, khususnya Gemini, secara efektif dalam kehidupan sehari-hari. Program ini ditujukan untuk meningkatkan literasi AI, mempromosikan penggunaan AI yang aman dan bertanggung jawab, dan mempelajari potensi AI untuk mentransformasi dunia pendidikan.'
    },
    {
      question: 'Mengapa harus mengikuti Gemini untuk Pendidik?',
      answer: 'Gemini untuk Pendidik menjawab meningkatnya kebutuhan para pendidik untuk memahami dan memanfaatkan AI di sekolah. Dengan mengikuti program ini, para pendidik dapat memperoleh insight yang berharga tentang kemampuan, batasan, dan pertimbangan etis dalam penggunaan AI. Pengetahuan ini akan membantu mereka mengambil keputusan yang tepat terkait integrasi AI ke dalam strategi pengajaran. Para pendidik juga akan mendapatkan pengalaman langsung menggunakan alat AI secara ekstensif untuk menyelesaikan tugas sehari-hari mereka, seperti perencanaan kurikulum, strategi pengajaran dan pembelajaran, dan banyak lagi.'
    },
    {
      question: 'Apa saja topik yang dicakup dalam Gemini untuk Pendidik?',
      answer: (
        <div>
          <p className="mb-3">Gemini untuk Pendidik mencakup berbagai topik, termasuk:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Pengantar AI dan penerapannya di dunia pendidikan</li>
            <li>Memahami machine learning, LLM, AI generatif, dan chatbot</li>
            <li>Mempelajari Prinsip AI Google dan implikasinya bagi dunia pendidikan</li>
            <li>Menggunakan AI secara aman dan bertanggung jawab untuk menangani isu bias, keadilan, dan privasi data</li>
            <li>Pengantar Gemini dan fiturnya</li>
            <li>Menulis perintah yang efektif untuk Gemini</li>
            <li>Mengoptimalkan pengajaran dengan Gemini melalui berbagai kasus penggunaan</li>
            <li>Mempelajari integrasi dan fitur tambahan Gemini</li>
            <li>Referensi dan jalur pembelajaran lainnya</li>
            <li>Refleksi dan tinjauan program</li>
          </ul>
        </div>
      )
    },
    {
      question: 'Siapa yang sebaiknya mengikuti Gemini untuk Pendidik?',
      answer: 'Gemini untuk Pendidik dirancang untuk pendidik di semua tingkatan yang ingin memanfaatkan kecanggihan AI untuk mengoptimalkan praktik pengajaran dan hasil pembelajaran siswa.'
    },
    {
      question: 'Bagaimana cara berpartisipasi dalam Gemini untuk Pendidik?',
      answer: (programId: string) => (
        <div>
          Daftar di{' '}
          <a
            href="https://academy.garuda-21.com/gemini2025"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            https://academy.garuda-21.com/gemini2025
          </a>
          {' '}dan ikuti langkah selanjutnya. Jika ada kendala gunakan halaman kontak untuk mendapat panduan dari admin.
        </div>
      )
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat program...</p>
        </div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Program Tidak Ditemukan</h1>
          <Link href="/programs" className="text-primary-600 hover:underline">
            Kembali ke Daftar Program
          </Link>
        </div>
      </div>
    )
  }



  const isEnrolled = enrollmentStatus === 'approved'
  const isPending = enrollmentStatus === 'pending'

  // If it's not the specific Gemini program, use the generic landing page
  // The generic page handles both Trainer programs and other Admin programs
  if (!program.title.includes('Gemini')) {
    return (
      <TrainerProgramLandingPage
        program={program}
        isEnrolled={isEnrolled}
        isPending={isPending}
      />
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <PublicNav activeLink="programs" />
      <ProgramStatisticsModal
        isOpen={showStatisticsModal}
        onClose={() => setShowStatisticsModal(false)}
        programId={params.id}
      />

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Link
              href="/programs"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Daftar Program
            </Link>
          </div>

          {/* Program Title */}
          {program.title.includes('Gemini') && (
            <div className="mb-12">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4">
                <span className="bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent">
                  Gemini untuk Pendidik:
                </span>
                <br />
                <span className="text-gray-900">
                  Mewujudkan Guru HEBAT, Indonesia Emas
                </span>
              </h1>
            </div>
          )}

          {/* Hero Content with Image */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image on Left */}
            <div className="relative order-2 lg:order-1">
              <div className="relative rounded-2xl overflow-hidden">
                <Image
                  src={
                    program.image_url
                      ? (program.image_url.startsWith('http')
                        ? program.image_url
                        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/program-assets/${program.image_url}`)
                      : '/herogemini.png'
                  }
                  alt={program.title}
                  width={800}
                  height={600}
                  className="w-full h-[500px] object-cover"
                />

                {/* Overlay Icons - Puzzle Piece */}
                <div className="absolute top-6 right-6 w-14 h-14 rounded-xl shadow-xl overflow-hidden" style={{
                  background: 'linear-gradient(135deg, #2563eb, #ec4899)',
                  padding: '2px'
                }}>
                  <div className="w-full h-full bg-white rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 bg-gradient-to-br from-blue-600 to-pink-600 bg-clip-text text-transparent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                  </div>
                </div>

                {/* Overlay Icons - Graduation Cap */}
                <div className="absolute bottom-6 left-6 w-14 h-14 rounded-xl shadow-xl overflow-hidden" style={{
                  background: 'linear-gradient(135deg, #2563eb, #ec4899)',
                  padding: '2px'
                }}>
                  <div className="w-full h-full bg-white rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-8 h-8 bg-gradient-to-br from-blue-600 to-pink-600 bg-clip-text text-transparent" stroke="currentColor" strokeWidth={1} />
                  </div>
                </div>
              </div>
            </div>

            {/* Content on Right */}
            <div className="order-1 lg:order-2">
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                {program.title.includes('Gemini')
                  ? 'Gemini untuk Pendidik adalah program pelatihan keterampilan AI untuk para pengajar. Pelatihan ini mengajarkan cara menggunakan AI generatif dengan aman serta memberikan panduan untuk meningkatkan kreativitas dan produktivitas pengajar dengan Gemini'
                  : program.description || `${program.title} adalah program pelatihan keterampilan AI untuk para pengajar. Pelatihan ini mengajarkan cara menggunakan AI generatif dengan aman serta memberikan panduan untuk meningkatkan kreativitas dan produktivitas pengajar dengan ${program.title}.`
                }
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                {!profile ? (
                  <Link
                    href={`/register?redirect=/programs/${program.id}`}
                    className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Daftar Pelatihan
                  </Link>
                ) : isEnrolled ? (
                  <Link
                    href={`/programs/${program.id}/classes`}
                    className="inline-flex items-center justify-center px-6 py-3 bg-green-100 text-green-800 rounded-lg font-medium hover:bg-green-200 transition-colors cursor-pointer"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Akses Kelas
                  </Link>
                ) : isPending ? (
                  <div className="inline-flex items-center justify-center px-6 py-3 bg-yellow-100 text-yellow-800 rounded-lg font-medium">
                    <Clock className="w-5 h-5 mr-2" />
                    Menunggu Konfirmasi
                  </div>
                ) : (
                  <Link
                    href={`/programs/${program.id}/enroll`}
                    className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Daftar Pelatihan
                  </Link>
                )}
                <a
                  href="https://gemini.google.com/app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-pink-600 text-white rounded-lg hover:from-blue-700 hover:to-pink-700 transition-all font-medium"
                >
                  Coba Gemini
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Title with Pagination */}
          <div className="flex items-start justify-between mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight flex-1 pr-8">
              Gunakan Gemini dengan aman untuk mengoptimalkan<br />
              pengajaran dan produktivitas Anda
            </h2>

            {/* Pagination Control - Top Right */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setFeatureCarouselIndex(Math.max(0, featureCarouselIndex - 1))}
                disabled={featureCarouselIndex === 0}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600 min-w-[40px] text-center">
                {String(featureCarouselIndex + 1).padStart(2, '0')}/{String(features.length).padStart(2, '0')}
              </span>
              <button
                onClick={() => setFeatureCarouselIndex(Math.min(features.length - 1, featureCarouselIndex + 1))}
                disabled={featureCarouselIndex === features.length - 1}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Features Cards - Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-gray-50 rounded-2xl p-8 shadow-sm"
              >
                <div className="flex items-start gap-6">
                  {/* Large Gradient Number */}
                  <div className="flex-shrink-0">
                    <div
                      className="text-8xl font-bold leading-none"
                      style={{
                        background: `linear-gradient(to bottom, #3b82f6, #ec4899)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      {feature.number}
                    </div>
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 pt-2">
                    <p className="text-gray-800 leading-relaxed">
                      {feature.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Control - Bottom Center */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setFeatureCarouselIndex(Math.max(0, featureCarouselIndex - 1))}
              disabled={featureCarouselIndex === 0}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4">
              {features.map((_, idx) => (
                <span
                  key={idx}
                  className={`text-sm ${idx === featureCarouselIndex
                    ? 'text-gray-900 font-medium underline decoration-2 underline-offset-4'
                    : 'text-gray-400'
                    }`}
                >
                  {String(idx + 1).padStart(2, '0')}/{String(features.length).padStart(2, '0')}
                </span>
              ))}
            </div>
            <button
              onClick={() => setFeatureCarouselIndex(Math.min(features.length - 1, featureCarouselIndex + 1))}
              disabled={featureCarouselIndex === features.length - 1}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Learning Points Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-8">
                Hal yang akan Anda<br />
                pelajari di {program.title}
              </h2>
            </div>

            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-pink-200"></div>

              <div className="space-y-8">
                {learningPoints.map((point, idx) => (
                  <div key={idx} className="relative flex items-start gap-4">
                    <div className="relative z-10 w-12 h-12 flex-shrink-0 bg-gradient-to-br from-blue-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-lg text-gray-700 leading-relaxed pt-2">
                      {point}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-12">Kisah para peserta</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Image */}
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden">
                  <Image
                    src="/agung.png"
                    alt={testimonials[testimonialIndex].name}
                    width={600}
                    height={800}
                    className="w-full h-96 object-cover"
                  />
                </div>
              </div>

              {/* Quote */}
              <div className="flex flex-col justify-center">
                <Quote className="w-12 h-12 text-gray-300 mb-6" />
                <p className="text-2xl text-gray-700 leading-relaxed mb-8">
                  "{testimonials[testimonialIndex].quote}"
                </p>
                <div>
                  <p className="text-lg font-semibold text-gray-900 mb-1">
                    {testimonials[testimonialIndex].name}
                  </p>
                  <p className="text-gray-600">
                    {testimonials[testimonialIndex].role}
                  </p>
                </div>

                {/* Pagination */}
                <div className="flex items-center gap-4 mt-8">
                  <button
                    onClick={() => setTestimonialIndex(Math.max(0, testimonialIndex - 1))}
                    disabled={testimonialIndex === 0}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="text-sm text-gray-600">
                    {String(testimonialIndex + 1).padStart(2, '0')}/{String(testimonials.length).padStart(2, '0')}
                  </div>
                  <button
                    onClick={() => setTestimonialIndex(Math.min(testimonials.length - 1, testimonialIndex + 1))}
                    disabled={testimonialIndex === testimonials.length - 1}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Partners Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-12">Partner kami di Indonesia</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Partner Logo Card */}
            <div className="bg-gray-100 rounded-2xl p-12 shadow-sm flex items-center justify-center min-h-[200px]">
              <Image
                src="/igi.png"
                alt="Logo Ikatan Guru Indonesia"
                width={200}
                height={200}
                className="object-contain"
              />
            </div>

            {/* Partner Description */}
            <div className="flex flex-col justify-center">
              <p className="text-lg text-gray-700 leading-relaxed">
                Ikatan Guru Indonesia (IGI) merupakan organisasi profesi guru yang disahkan oleh pemerintah melalui SK Depkumham Nomor AHU-125.AH.01.06.Tahun 2009, tertanggal 26 November 2009, dan diperbarui dengan Nomor: AHU-0000332.AH.01.08 Tahun 2021.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-12">Pertanyaan umum (FAQ)</h2>

          <div className="space-y-0 border-t border-gray-200">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border-b border-gray-200">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full py-6 flex items-center justify-between text-left"
                >
                  <span className="text-lg font-medium text-gray-900 pr-8">
                    {faq.question}
                  </span>
                  <ChevronRight
                    className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${expandedFaq === idx ? 'transform rotate-90' : ''
                      }`}
                  />
                </button>
                {expandedFaq === idx && (
                  <div className="pb-6 text-gray-700 leading-relaxed">
                    {typeof faq.answer === 'string'
                      ? faq.answer
                      : typeof faq.answer === 'function'
                        ? faq.answer(program.id)
                        : faq.answer
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">
            Bergabung dengan<br />
            {program.title}
          </h2>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowStatisticsModal(true)}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Statistik Pendaftaran
            </button>
            {!profile ? (
              <Link
                href={`/register?redirect=/programs/${program.id}`}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-pink-600 text-white rounded-lg hover:from-blue-700 hover:to-pink-700 transition-all font-medium"
              >
                Daftar Sekarang
              </Link>
            ) : !isEnrolled && !isPending ? (
              <Link
                href={`/programs/${program.id}/enroll`}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-pink-600 text-white rounded-lg hover:from-blue-700 hover:to-pink-700 transition-all font-medium"
              >
                Daftar Sekarang
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  )
}
