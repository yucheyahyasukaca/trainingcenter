'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { 
  Users, 
  UserCog, 
  BarChart3, 
  Calendar,
  CheckCircle,
  ArrowRight,
  Star,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    async function checkAuth() {
      const user = await getCurrentUser()
      if (user) {
        // Redirect to dashboard if already logged in
        router.push('/dashboard')
      }
      setLoading(false)
    }
    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const features = [
    {
      icon: Zap,
      title: 'Self Learning Course',
      description: 'Akses pelatihan 100% gratis dengan kurikulum berstandar industri global. Belajar fleksibel kapan saja, di mana saja',
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      icon: Users,
      title: 'Offline Workshop Training',
      description: 'Ikuti sesi tatap muka bersama para ahli untuk memperdalam pemahaman dan memperluas jaringan profesional',
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      icon: Calendar,
      title: 'Online Short Training',
      description: 'Dapatkan bimbingan langsung dari instruktur berpengalaman melalui pelatihan online lengkap dengan sertifikat',
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      icon: BarChart3,
      title: 'Hackathon & Datathon',
      description: 'Asah kemampuan problem-solving melalui kompetisi dengan hadiah total puluhan juta rupiah',
      color: 'bg-orange-500',
      lightColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      icon: TrendingUp,
      title: 'Innovation Expo',
      description: 'Kesempatan untuk tunjukkan karya terbaikmu di hadapan para pemimpin industri dan buka peluang kolaborasi',
      color: 'bg-pink-500',
      lightColor: 'bg-pink-50',
      textColor: 'text-pink-600',
    },
    {
      icon: Shield,
      title: 'Rewards Eksklusif',
      description: 'Raih gadget dan merchandise eksklusif jika berhasil meluluskan berbagai kelas dan kompetisi',
      color: 'bg-indigo-500',
      lightColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
    },
  ]

  const benefits = [
    'Pelatihan gratis dengan kurikulum berstandar global',
    'Belajar mandiri dengan dukungan mentor profesional',
    'Sertifikat kompetensi yang diakui industri',
    'Kesempatan ikut hackathon dengan total hadiah jutaan rupiah',
    'Networking dengan para profesional dan pemimpin industri',
    'Akses ke innovation expo dan peluang kolaborasi',
  ]

  const stats = [
    { label: 'Peserta Aktif', value: '50K+', icon: Users },
    { label: 'Program Pelatihan', value: '10+', icon: BarChart3 },
    { label: 'Tingkat Kelulusan', value: '85%', icon: TrendingUp },
    { label: 'Kepuasan Peserta', value: '4.8/5', icon: Star },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                <Image
                  src="/logo-06.png"
                  alt="Garuda Academy Logo"
                  width={96}
                  height={96}
                  className="object-contain w-full h-full"
                />
              </div>
            </div>

            <div className="flex items-center">
              <Link
                href="/register"
                className="btn-primary text-sm"
              >
                Daftar Sekarang
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 via-white to-red-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-100 rounded-full mb-6">
                <Zap className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-700">
                  Program Pelatihan Eksklusif di Bidang AI & Teknologi
                </span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Bergerak, Hadirkan
                <span className="text-primary-600"> Dampak Nyata</span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Program pelatihan eksklusif yang dirancang untuk profesional, akademisi, peneliti, dan pemimpin teknologi 
                yang ingin menguasai AI dan teknologi tingkat lanjut untuk menciptakan dampak nyata di era digital.
              </p>

              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Mulai Gratis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold border-2 border-gray-200 hover:border-primary-600 hover:text-primary-600 transition-all"
                >
                  Login
                </Link>
              </div>

            </div>

            <div className="relative">
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                      <div key={index} className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl p-6">
                        <Icon className="w-8 h-8 text-primary-600 mb-3" />
                        <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                        <div className="text-sm text-gray-600">{stat.label}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
              <div className="absolute -bottom-8 -left-4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Benefit Program
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tingkatkan keterampilanmu dan raih kesempatan berharga melalui Garuda Academy GARUDA-21 Training Center!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="group bg-white p-8 rounded-2xl border-2 border-gray-100 hover:border-primary-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className={`inline-flex items-center justify-center w-14 h-14 ${feature.lightColor} rounded-xl mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-7 h-7 ${feature.textColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-red-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Kenapa Memilih Garuda Academy?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Program pelatihan yang dirancang untuk membangun keterampilan nyata dan kapabilitas lanjutan 
                dalam memanfaatkan AI dan teknologi sebagai solusi masa depan
              </p>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center mt-1">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-lg text-gray-700">{benefit}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <Link
                  href="/register"
                  className="inline-flex items-center px-8 py-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Coba Sekarang
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                    <div>
                      <p className="text-sm text-gray-600">Total Pendaftaran Bulan Ini</p>
                      <p className="text-2xl font-bold text-gray-900">+247</p>
                    </div>
                    <TrendingUp className="w-10 h-10 text-green-600" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                    <div>
                      <p className="text-sm text-gray-600">Program Aktif</p>
                      <p className="text-2xl font-bold text-gray-900">12</p>
                    </div>
                    <BarChart3 className="w-10 h-10 text-blue-600" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                    <div>
                      <p className="text-sm text-gray-600">Trainer Tersedia</p>
                      <p className="text-2xl font-bold text-gray-900">24</p>
                    </div>
                    <UserCog className="w-10 h-10 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-600 to-red-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Mari Bergerak, Hadirkan Dampak!
          </h2>
          <p className="text-xl text-primary-100 mb-10">
            Tingkatkan keahlian AI dan teknologi-mu lewat program pelatihan eksklusif dari Garuda Academy. 
            Ambil kesempatanmu sekarang dan ciptakan dampak nyata!
          </p>

          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-xl"
            >
              Daftar Gratis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 bg-primary-700 text-white rounded-xl font-semibold border-2 border-white/20 hover:bg-primary-800 transition-all"
            >
              Login
            </Link>
          </div>

          <p className="mt-6 text-sm text-primary-100">
            100% Gratis • Sertifikat Kompetensi • Kesempatan Kompetisi Berhadiah
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-white">Garuda Academy</h3>
              <p className="text-xs text-gray-400">GARUDA-21 Training Center</p>
            </div>
          </div>

          <p className="text-sm text-gray-400 mb-6">
            Program pelatihan eksklusif AI & teknologi untuk profesional Indonesia
          </p>

          <div className="border-t border-gray-800 pt-6">
            <p className="text-sm text-gray-500">
              © 2025 Garuda Academy GARUDA-21 Training Center. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
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
