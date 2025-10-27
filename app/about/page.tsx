'use client'

import Link from 'next/link'
import Image from 'next/image'
import { 
  Users, 
  Award, 
  Target, 
  TrendingUp, 
  BookOpen, 
  GraduationCap,
  CheckCircle,
  Star,
  ArrowRight,
  Rocket,
  BarChart3
} from 'lucide-react'
import { PublicNav } from '@/components/layout/PublicNav'

export default function AboutPage() {
  const stats = [
    { icon: Users, label: 'Peserta Aktif', value: '50K+', description: 'Belajar bersama Garuda Academy' },
    { icon: BookOpen, label: 'Program Pelatihan', value: '10+', description: 'Kurikulum terpercaya' },
    { icon: GraduationCap, label: 'Alumni', value: '15K+', description: 'Berhasil meniti karir' },
    { icon: Star, label: 'Tingkat Kepuasan', value: '4.8/5', description: 'Rating tinggi' },
  ]

  const impactStats = [
    { icon: TrendingUp, label: 'Program Aktif', value: '40+', color: 'text-blue-600' },
    { icon: Users, label: 'Penerima Manfaat', value: '770K+', color: 'text-green-600' },
    { icon: Award, label: 'Lulusan', value: '190K+', color: 'text-purple-600' },
    { icon: BarChart3, label: 'Dampak Ekonomi', value: 'Rp 5.4T+', color: 'text-red-600' },
  ]

  const achievements = [
    {
      icon: BookOpen,
      title: 'Kurikulum Berstandar Global',
      description: 'Kurikulum yang dirancang oleh para ahli industri dan pemimpin teknologi untuk memenuhi kebutuhan industri, dengan lebih dari 100+ kursus dan 10 jalur pembelajaran.',
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      icon: CheckCircle,
      title: 'Belajar Mandiri hingga Intensif',
      description: 'Peserta belajar secara fleksibel dengan dukungan instruktur ahli yang memiliki sertifikasi profesional.',
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      icon: Award,
      title: 'Review Kode oleh Developer Expert',
      description: 'Lebih dari 500 profesional eksternal, termasuk instruktur dan reviewer dari sektor teknologi dan TI, berkontribusi untuk Garuda Academy dan komunitas teknologi.',
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      icon: Star,
      title: 'Alumni Diakui Industri',
      description: 'Alumni Garuda Academy diakui oleh perusahaan-perusahaan ternama. Mereka memperoleh sertifikat yang memvalidasi penguasaan pengetahuan fundamental serta keterampilan praktis yang sesuai dengan kebutuhan industri.',
      color: 'bg-orange-500',
      lightColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
  ]

  const socialMedia = [
    { platform: 'Instagram', count: '65K+', icon: '📷' },
    { platform: 'LinkedIn', count: '45K+', icon: '💼' },
    { platform: 'Twitter', count: '28K+', icon: '🐦' },
    { platform: 'YouTube', count: '52K+', icon: '▶️' },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <PublicNav activeLink="about" />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 via-white to-red-50 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-20 right-10 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-100 rounded-full mb-6">
              <Target className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-semibold text-primary-700">
                Tentang Garuda Academy
              </span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              Platform Edukasi Teknologi
              <br />
              <span className="text-primary-600">Terpercaya di Indonesia</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Garuda Academy, platform edukasi teknologi terpercaya, mengembangkan talenta digital yang diakui secara global. 
              Kami bertujuan untuk meningkatkan daya saing digital Indonesia di panggung dunia.
            </p>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="bg-white rounded-lg p-5 border border-gray-200 hover:shadow-md transition-all">
                  <Icon className="w-6 h-6 text-primary-600 mb-3" />
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-xs font-semibold text-gray-700 mb-0.5">{stat.label}</div>
                  <div className="text-xs text-gray-500">{stat.description}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Vision & Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vision */}
            <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl p-8 border border-primary-100">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-primary-100 rounded-full mb-4">
                <Target className="w-3 h-3 text-primary-600" />
                <span className="text-xs font-semibold text-primary-700">Visi Kami</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Menjadi platform edukasi teknologi terdepan dengan memberikan akses digital literacy yang lebih luas untuk semua orang.
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Kami bermimpi melihat Indonesia menjadi pusat inovasi teknologi global, dengan talenta digital yang dapat bersaing di level internasional.
              </p>
            </div>

            {/* Mission */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-8 border border-red-100">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-red-100 rounded-full mb-4">
                <Rocket className="w-3 h-3 text-red-600" />
                <span className="text-xs font-semibold text-red-700">Misi Kami</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Mempercepat transisi Indonesia menuju dunia digital melalui pendidikan teknologi yang mengubah hidup.
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Melalui program pelatihan yang komprehensif, kami mendukung masyarakat Indonesia untuk meraih potensi maksimal mereka di era digital.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes Us Different Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-red-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-primary-100 rounded-full mb-3">
              <Star className="w-3 h-3 text-primary-600" />
              <span className="text-xs font-semibold text-primary-700">Keunggulan Kami</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              Apa yang Membuat Kami Berbeda?
            </h2>
            <p className="text-base text-gray-600 max-w-3xl mx-auto">
              Empat pilar utama yang menjadi fondasi kesuksesan Garuda Academy dalam mengembangkan talenta digital Indonesia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((item, index) => {
              const Icon = item.icon
              return (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 ${item.lightColor} rounded-lg mb-4`}>
                    <Icon className={`w-6 h-6 ${item.textColor}`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-grid-gray-200 [mask-image:linear-gradient(0deg,white,transparent)]"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-primary-100 rounded-full mb-3">
              <TrendingUp className="w-3 h-3 text-primary-600" />
              <span className="text-xs font-semibold text-primary-700">Dampak & Prestasi</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              Lebih dari 190K Alumni Garuda Academy Meniti Karir sebagai Profesional Teknologi
            </h2>
            <p className="text-base text-gray-600 max-w-3xl mx-auto">
              Dari tingkat entry hingga leadership, alumni kami telah membuktikan diri di berbagai perusahaan terkemuka.
            </p>
          </div>

          {/* Impact Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {impactStats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="bg-white rounded-lg p-5 border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all text-center">
                  <Icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-xs text-gray-600">{stat.label}</div>
                </div>
              )
            })}
          </div>

          {/* Top Companies */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 mb-4 text-center">Lulusan kami dipercaya oleh</h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {[
                { name: 'Google', logo: '/google.png' },
                { name: 'Microsoft', logo: '/microsoft.png' },
                { name: 'AWS', logo: '/aws.png' },
                { name: 'Gojek', logo: '/gojek.png' },
                { name: 'Grab', logo: '/grab.png' },
                { name: 'Shopee', logo: '/shopee.png' },
                { name: 'Tokopedia', logo: '/tokopedia.png' },
                { name: 'Bank Mandiri', logo: '/mandiri.png' },
              ].map((company, index) => (
                <div
                  key={index}
                  className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 hover:border-primary-200 hover:bg-white transition-all p-2"
                >
                  <Image
                    src={company.logo}
                    alt={company.name}
                    width={50}
                    height={50}
                    className="object-contain w-full h-full opacity-70 hover:opacity-100 transition-opacity"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-primary-100 rounded-full mb-3">
              <Users className="w-3 h-3 text-primary-600" />
              <span className="text-xs font-semibold text-primary-700">Komunitas</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              Komunitas Sosial Media Kami yang Luas dan Berkembang
            </h2>
            <p className="text-base text-gray-600 max-w-3xl mx-auto">
              Dengan lebih dari 190K follower yang fokus pada konten teknologi & programming, kami aktif berinteraksi dengan publik melalui berita dan update program.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {socialMedia.map((media, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-5 text-center border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
              >
                <div className="text-2xl mb-2">{media.icon}</div>
                <div className="text-xl font-bold text-gray-900 mb-1">{media.count}</div>
                <div className="text-xs text-gray-600">{media.platform}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-600 via-red-600 to-primary-700 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Rocket className="w-16 h-16 text-white mx-auto mb-6 animate-bounce" />
          <h2 className="text-4xl lg:text-6xl font-extrabold text-white mb-6">
            Bergabunglah dengan Komunitas Garuda Academy
          </h2>
          <p className="text-xl text-primary-100 mb-10 leading-relaxed max-w-2xl mx-auto">
            Mulai perjalanan Anda untuk menguasai teknologi AI dan skill digital tingkat lanjut. 
            Jadilah bagian dari lebih dari 190K alumni yang telah sukses meniti karir.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-2xl transform hover:-translate-y-1"
            >
              Daftar Gratis Sekarang
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/programs"
              className="inline-flex items-center justify-center px-8 py-4 bg-primary-800 text-white rounded-xl font-semibold border-2 border-white/20 hover:bg-primary-900 transition-all backdrop-blur-sm"
            >
              Lihat Program
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-primary-100">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>100% Gratis</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Sertifikat Kompetensi</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Dukungan Mentor</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-red-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-white" />
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

      <style jsx>{`
        @keyframes blob {
          0%, 100% { 
            transform: translate(0px, 0px) scale(1); 
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          }
          33% { 
            transform: translate(30px, -50px) scale(1.1); 
            border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
          }
          66% { 
            transform: translate(-20px, 20px) scale(0.9); 
            border-radius: 70% 30% 50% 50% / 30% 50% 50% 70%;
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  )
}
