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
  Zap,
  Award,
  Target,
  Rocket,
  BookOpen,
  Medal,
  Sparkles,
  Search,
  Menu,
  X,
  ArrowUpRight,
  ChevronDown
} from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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

    // Handle scroll effect
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-red-50">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat...</p>
        </div>
      </div>
    )
  }

  const features = [
    {
      icon: BookOpen,
      title: 'Self Learning Course',
      description: 'Akses pelatihan 100% gratis dengan kurikulum berstandar industri global. Belajar fleksibel kapan saja, di mana saja dengan mentor profesional.',
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      icon: Users,
      title: 'Offline Workshop Training',
      description: 'Ikuti sesi tatap muka bersama para ahli untuk memperdalam pemahaman dan memperluas jaringan profesional di industri.',
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      icon: Calendar,
      title: 'Online Short Training',
      description: 'Dapatkan bimbingan langsung dari instruktur berpengalaman melalui pelatihan online lengkap dengan sertifikat resmi.',
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      icon: Star,
      title: 'Hackathon & Datathon',
      description: 'Asah kemampuan problem-solving melalui kompetisi dengan hadiah total puluhan juta rupiah dan pengakuan industri.',
      color: 'bg-orange-500',
      lightColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      icon: TrendingUp,
      title: 'Innovation Expo',
      description: 'Kesempatan untuk tunjukkan karya terbaikmu di hadapan para pemimpin industri dan buka peluang kolaborasi strategis.',
      color: 'bg-pink-500',
      lightColor: 'bg-pink-50',
      textColor: 'text-pink-600',
    },
    {
      icon: Award,
      title: 'Rewards Eksklusif',
      description: 'Raih gadget dan merchandise eksklusif jika berhasil meluluskan berbagai kelas dan kompetisi yang ditawarkan.',
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
    { label: 'Peserta Aktif', value: '50K+', icon: Users, color: 'text-blue-600' },
    { label: 'Program Pelatihan', value: '10+', icon: BarChart3, color: 'text-purple-600' },
    { label: 'Tingkat Kelulusan', value: '85%', icon: TrendingUp, color: 'text-green-600' },
    { label: 'Kepuasan Peserta', value: '4.8/5', icon: Star, color: 'text-yellow-600' },
  ]

  const testimonialStats = [
    { 
      title: 'Total Pendaftaran Bulan Ini', 
      value: '+247', 
      change: '+12%',
      icon: TrendingUp, 
      color: 'bg-green-50 border-green-200',
      iconColor: 'text-green-600'
    },
    { 
      title: 'Program Aktif', 
      value: '12', 
      change: 'Baru 3',
      icon: BarChart3, 
      color: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600'
    },
    { 
      title: 'Trainer Tersedia', 
      value: '24', 
      change: 'Expert',
      icon: UserCog, 
      color: 'bg-purple-50 border-purple-200',
      iconColor: 'text-purple-600'
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200' 
          : 'bg-white/80 backdrop-blur-md border-b border-gray-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center transition-transform hover:scale-105">
                <Image
                  src="/logo-06.png"
                  alt="Garuda Academy Logo"
                  width={80}
                  height={80}
                  className="object-contain w-full h-full"
                />
              </div>
              <div className="hidden sm:block">
                <h3 className="text-lg font-bold text-gray-900">Garuda Academy</h3>
                <p className="text-xs text-gray-500">GARUDA-21 Training Center</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4 lg:space-x-6">
               {/* Search Bar */}
               <div className="flex items-center relative">
                 <Search className="absolute left-3 w-4 h-4 text-gray-400" />
                 <input
                   type="text"
                   placeholder="Cari program, trainer..."
                   className="pl-10 pr-4 py-2 w-64 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                 />
               </div>

               {/* Header Menu */}
               <nav className="flex items-center space-x-6">
                 <Link
                   href="/programs"
                   className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
                 >
                   Program
                 </Link>
                 <Link
                   href="/trainers"
                   className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
                 >
                   Trainer
                 </Link>
                 <Link
                   href="/about"
                   className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
                 >
                   Tentang
                 </Link>
                 <Link
                   href="/contact"
                   className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
                 >
                   Kontak
                 </Link>
               </nav>

               {/* Auth Buttons */}
               <div className="flex items-center space-x-3 lg:space-x-4">
                 <Link
                   href="/login"
                   className="inline-flex items-center px-4 py-2 text-gray-700 hover:text-primary-600 font-medium transition-colors border border-gray-200 hover:border-primary-600 rounded-lg"
                 >
                   Masuk
                 </Link>
                 <Link
                   href="/register"
                   className="btn-primary text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                 >
                   Daftar Sekarang
                 </Link>
               </div>
             </div>

             {/* Mobile Hamburger Button */}
             <button
               onClick={() => setIsMobileMenuOpen(true)}
               className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
               aria-label="Open menu"
             >
               <Menu className="w-6 h-6 text-gray-600" strokeWidth={2} />
             </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay - Outside nav to ensure solid background */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[9999] bg-white">
            {/* Header with Search and Close */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              {/* Search Bar */}
              <div className="flex-1 mr-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Apa yang ingin Anda pelajari?"
                    className="w-full pl-10 pr-4 py-2.5 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                aria-label="Close menu"
              >
                <X className="w-6 h-6 text-gray-600" strokeWidth={2} />
              </button>
            </div>

            {/* Action Buttons - Login & Register */}
            <div className="flex gap-3 px-4 py-4 border-b border-gray-200">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex-1 px-4 py-3 text-center font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex-1 px-4 py-3 text-center font-medium text-white bg-gradient-to-r from-primary-600 to-red-600 rounded-lg hover:from-primary-700 hover:to-red-700 transition-all shadow-sm"
              >
                Daftar
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="px-4 py-2">
              <nav className="space-y-1">
                <Link
                  href="/programs"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between w-full px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium">Program</span>
                  <ArrowUpRight className="w-5 h-5 text-gray-400" />
                </Link>
                
                <Link
                  href="/trainers"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between w-full px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium">Trainer</span>
                  <ArrowUpRight className="w-5 h-5 text-gray-400" />
                </Link>
                
                <Link
                  href="/about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between w-full px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium">Tentang</span>
                  <ArrowUpRight className="w-5 h-5 text-gray-400" />
                </Link>
                
                <Link
                  href="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between w-full px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium">Kontak</span>
                  <ArrowUpRight className="w-5 h-5 text-gray-400" />
                </Link>
              </nav>
            </div>
          </div>
        )}

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 via-white to-red-50 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-100 to-red-100 rounded-full mb-6 animate-fade-in">
                <Sparkles className="w-4 h-4 text-primary-600 animate-pulse" />
                <span className="text-sm font-semibold text-primary-700">
                  Program Pelatihan Eksklusif di Bidang AI & Teknologi
                </span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 leading-tight animate-slide-up">
                Bergerak,
                <br />
                <span className="relative inline-block">
                  <span className="text-primary-600">Hadirkan Dampak</span>
                  <svg className="absolute -bottom-2 left-0 w-full h-6 text-primary-300 opacity-50" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0,5 Q50,0 100,5" fill="none" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed max-w-2xl animate-fade-in animation-delay-200">
                Program pelatihan eksklusif yang dirancang untuk profesional, akademisi, peneliti, dan pemimpin teknologi 
                yang ingin menguasai AI dan teknologi tingkat lanjut untuk menciptakan dampak nyata di era digital.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in animation-delay-400">
                <Link
                  href="/register"
                  className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary-600 to-red-600 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-red-700 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                >
                  Mulai Gratis
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold border-2 border-gray-200 hover:border-primary-600 hover:text-primary-600 transition-all shadow-lg hover:shadow-xl"
                >
                  Sudah Punya Akun?
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-6 pt-4 animate-fade-in animation-delay-600">
                <div className="flex items-center space-x-2">
                  <Medal className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm text-gray-600 font-medium">Sertifikat Resmi</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Rocket className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-gray-600 font-medium">100% Gratis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-gray-600 font-medium">Diakui Industri</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-gray-200 transform hover:scale-105 transition-transform duration-500">
                <div className="grid grid-cols-2 gap-4">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                      <div 
                        key={index} 
                        className="bg-gradient-to-br from-gray-50 to-primary-50 rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300"
                      >
                        <Icon className={`w-8 h-8 ${stat.color} mb-3`} />
                        <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                        <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 bg-gradient-to-r from-primary-600 to-red-600 text-white px-6 py-3 rounded-xl shadow-xl animate-bounce">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 fill-white" />
                  <span className="font-bold">Top Rated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-100 rounded-full mb-4">
              <Zap className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-semibold text-primary-700">Benefit Program</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Tingkatkan Keterampilanmu
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Raih kesempatan berharga melalui berbagai program unggulan dari Garuda Academy GARUDA-21 Training Center!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="group bg-white p-8 rounded-2xl border-2 border-gray-100 hover:border-primary-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className={`inline-flex items-center justify-center w-16 h-16 ${feature.lightColor} rounded-xl mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <Icon className={`w-8 h-8 ${feature.textColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  <div className="mt-4 flex items-center text-primary-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Pelajari lebih lanjut <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
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
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-100 rounded-full mb-4">
                <Target className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-semibold text-primary-700">Kenapa Pilih Kami</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6">
                Program Pelatihan Terbaik
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Program pelatihan yang dirancang untuk membangun keterampilan nyata dan kapabilitas lanjutan 
                dalam memanfaatkan AI dan teknologi sebagai solusi masa depan
              </p>

              <div className="space-y-5 mb-10">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-4 group">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-primary-600 to-red-600 rounded-full flex items-center justify-center mt-0.5 group-hover:scale-110 transition-transform">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-lg text-gray-700 pt-1">{benefit}</p>
                  </div>
                ))}
              </div>

              <Link
                href="/register"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-600 to-red-600 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-red-700 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                Daftar Sekarang
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                <div className="space-y-6">
                  {testimonialStats.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                      <div key={index} className={`flex items-center justify-between p-6 rounded-xl border-2 transition-all hover:shadow-lg ${stat.color}`}>
                        <div>
                          <p className="text-sm text-gray-600 font-medium mb-1">{stat.title}</p>
                          <div className="flex items-end space-x-2">
                            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                            <span className="text-sm text-gray-500 mb-1">{stat.change}</span>
                          </div>
                        </div>
                        <Icon className={`w-12 h-12 ${stat.iconColor}`} />
                      </div>
                    )
                  })}
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -z-10 top-8 left-8 w-full h-full bg-primary-200 rounded-2xl opacity-20 blur-2xl"></div>
            </div>
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
            Mari Bergerak, Hadirkan Dampak!
          </h2>
          <p className="text-xl text-primary-100 mb-10 leading-relaxed max-w-2xl mx-auto">
            Tingkatkan keahlian AI dan teknologi-mu lewat program pelatihan eksklusif dari Garuda Academy. 
            Ambil kesempatanmu sekarang dan ciptakan dampak nyata!
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
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 bg-primary-800 text-white rounded-xl font-semibold border-2 border-white/20 hover:bg-primary-900 transition-all backdrop-blur-sm"
            >
              Masuk ke Akun
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
              <span>Kesempatan Kompetisi Berhadiah</span>
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
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }

        .animate-slide-up {
          animation: slide-up 1s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
