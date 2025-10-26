'use client'

import Link from 'next/link'
import Image from 'next/image'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Send,
  MessageCircle,
  Mail as MailIcon,
  Phone as PhoneIcon,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Zap,
  Heart
} from 'lucide-react'
import { PublicNav } from '@/components/layout/PublicNav'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-primary-50/30 to-white">
      {/* Navigation */}
      <PublicNav activeLink="contact" />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-transparent to-red-50"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            {/* Animated badge */}
            <div className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-primary-100 to-red-100 rounded-full mb-8 shadow-sm hover:shadow-md transition-all group">
              <Sparkles className="w-4 h-4 text-primary-600 animate-pulse" />
              <span className="text-sm font-semibold text-primary-700">
                Hubungi Kami
              </span>
            </div>

            {/* Main heading with gradient text */}
            <h1 className="text-5xl lg:text-7xl font-extrabold mb-8 leading-tight">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Mari Berbincang
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary-600 via-red-600 to-primary-600 bg-clip-text text-transparent animate-gradient">
                Bersama Tim Kami
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light">
              Kami siap membantu Anda menemukan program pelatihan yang tepat untuk mengembangkan 
              keterampilan dan menggapai tujuan karir Anda.
            </p>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
              <Link
                href="https://wa.me/08112666456"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Chat WhatsApp
              </Link>
              <Link
                href="mailto:telemarketing@garuda-21.com"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-600 to-red-600 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-red-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <MailIcon className="w-5 h-5 mr-2" />
                Kirim Email
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white relative">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-grid-gray-100 [mask-image:linear-gradient(0deg,white,transparent)] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-primary-100 rounded-full mb-3">
              <Zap className="w-3 h-3 text-primary-600" />
              <span className="text-xs font-semibold text-primary-700">Cara Menghubungi Kami</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-3">
              Pilih Cara Yang Paling Nyaman Untuk Anda
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Kami tersedia melalui berbagai saluran komunikasi untuk memberikan pengalaman terbaik
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {/* Email Card */}
            <div className="group relative bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-primary-300 transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2">
              {/* Gradient background on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Icon with animation */}
              <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-blue-600 rounded-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Mail className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2 relative">Email</h3>
              <p className="text-sm text-gray-600 mb-4 relative leading-relaxed">
                Kirim email kepada kami untuk pertanyaan umum atau layanan pelanggan
              </p>
              <a 
                href="mailto:telemarketing@garuda-21.com"
                className="text-primary-600 font-semibold hover:text-primary-700 transition-colors break-all relative group/link inline-flex items-center"
              >
                telemarketing@garuda-21.com
                <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover/link:opacity-100 transition-all group-hover/link:translate-x-1" />
              </a>
            </div>

            {/* Phone Card */}
            <div className="group relative bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-red-300 transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2">
              {/* Gradient background on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Icon with animation */}
              <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Phone className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2 relative">Telepon</h3>
              <p className="text-sm text-gray-600 mb-4 relative leading-relaxed">
                Hubungi kami untuk konsultasi langsung
              </p>
              <p className="text-red-600 font-semibold text-lg relative">
                021 50020409
              </p>
            </div>

            {/* WhatsApp Card */}
            <div className="group relative bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-green-300 transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2">
              {/* Gradient background on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Icon with animation */}
              <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2 relative">WhatsApp</h3>
              <p className="text-sm text-gray-600 mb-4 relative leading-relaxed">
                Chat dengan kami untuk respons cepat dan konsultasi langsung
              </p>
              <div className="space-y-2 relative">
                <a 
                  href="https://wa.me/08112666456"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-green-600 font-semibold hover:text-green-700 transition-colors group/link"
                >
                  08112666456
                  <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover/link:opacity-100 transition-all group-hover/link:translate-x-1" />
                </a>
                <a 
                  href="https://wa.me/0811299991"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-green-600 font-semibold hover:text-green-700 transition-colors group/link"
                >
                  0811299991
                  <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover/link:opacity-100 transition-all group-hover/link:translate-x-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-primary-50/30 to-red-50 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 right-10 w-64 h-64 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-100 to-red-100 rounded-full mb-4 shadow-sm">
              <Send className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-semibold text-primary-700">Kirim Pesan</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Ada Pertanyaan?
              <br />
              <span className="bg-gradient-to-r from-primary-600 to-red-600 bg-clip-text text-transparent">
                Sampaikan Kepada Kami
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Isi formulir di bawah ini dan tim kami akan menghubungi Anda dalam waktu 24 jam.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl border border-gray-100 relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-600 via-red-600 to-primary-600"></div>
            
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <label htmlFor="name" className="block text-sm font-bold text-gray-900 mb-2">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-gray-50 focus:bg-white"
                    placeholder="Masukkan nama Anda"
                  />
                </div>
                <div className="group">
                  <label htmlFor="email" className="block text-sm font-bold text-gray-900 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-gray-50 focus:bg-white"
                    placeholder="nama@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <label htmlFor="phone" className="block text-sm font-bold text-gray-900 mb-2">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-gray-50 focus:bg-white"
                    placeholder="081234567890"
                  />
                </div>
                <div className="group">
                  <label htmlFor="subject" className="block text-sm font-bold text-gray-900 mb-2">
                    Subjek
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-gray-50 focus:bg-white"
                    placeholder="Tentang apa pertanyaan Anda?"
                  />
                </div>
              </div>

              <div className="group">
                <label htmlFor="message" className="block text-sm font-bold text-gray-900 mb-2">
                  Pesan
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none bg-gray-50 focus:bg-white"
                  placeholder="Tuliskan pesan Anda di sini..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary-600 to-red-600 text-white rounded-xl font-bold text-lg hover:from-primary-700 hover:to-red-700 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-[1.02]"
              >
                <Send className="w-5 h-5 mr-2" />
                Kirim Pesan
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Office Hours Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-primary-50/20 to-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="bg-gradient-to-br from-primary-50 via-white to-red-50 rounded-3xl p-10 md:p-14 border-2 border-primary-100 shadow-2xl">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-blue-600 rounded-3xl mb-6 shadow-lg animate-pulse">
                <Clock className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
                Jam Operasional
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Tim customer service kami siap membantu Anda pada waktu berikut:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="bg-white rounded-2xl p-6 border-2 border-primary-100 hover:border-primary-300 transition-all shadow-lg hover:shadow-xl">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Hari Kerja
                  </h3>
                </div>
                <p className="text-base text-gray-600">
                  Senin - Jumat: <span className="font-bold text-primary-600 text-lg">09:00 - 17:00 WIB</span>
                </p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border-2 border-primary-100 hover:border-primary-300 transition-all shadow-lg hover:shadow-xl">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center mr-4">
                    <MailIcon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Respon Email
                  </h3>
                </div>
                <p className="text-base text-gray-600">
                  Dalam: <span className="font-bold text-red-600 text-lg">24 jam</span> (hari kerja)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center space-x-2 px-6 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-100">
                <CheckCircle className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-bold text-gray-900">Tim Response Cepat</span>
              </div>
              <div className="flex items-center space-x-2 px-6 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-100">
                <CheckCircle className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-bold text-gray-900">Support Multibahasa</span>
              </div>
              <div className="flex items-center space-x-2 px-6 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-100">
                <CheckCircle className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-bold text-gray-900">Konsultasi Gratis</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-600 via-red-600 to-primary-700 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl mb-8 animate-bounce">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-4xl lg:text-7xl font-extrabold text-white mb-8 leading-tight">
            Siap Memulai Perjalanan
            <br />
            <span className="bg-gradient-to-r from-white via-primary-100 to-white bg-clip-text text-transparent">
              Belajar Anda?
            </span>
          </h2>
          
          <p className="text-xl lg:text-2xl text-primary-50 mb-12 leading-relaxed max-w-2xl mx-auto font-light">
            Jangan ragu untuk menghubungi kami. Tim Garuda Academy siap membantu Anda menemukan 
            program pelatihan yang paling sesuai dengan kebutuhan dan tujuan karir Anda.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <Link
              href="https://wa.me/08112666456"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-10 py-5 bg-white text-primary-600 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 hover:scale-105"
            >
              <MessageCircle className="w-6 h-6 mr-2" />
              Chat WhatsApp
              <ArrowRight className="w-6 h-6 ml-2" />
            </Link>
            <Link
              href="mailto:telemarketing@garuda-21.com"
              className="inline-flex items-center justify-center px-10 py-5 bg-primary-800/80 backdrop-blur-sm text-white rounded-2xl font-bold text-lg border-2 border-white/30 hover:bg-primary-900/90 hover:border-white/50 transition-all shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 hover:scale-105"
            >
              <MailIcon className="w-6 h-6 mr-2" />
              Kirim Email
              <ArrowRight className="w-6 h-6 ml-2" />
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-base text-primary-50">
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full">
              <CheckCircle className="w-6 h-6" />
              <span className="font-semibold">Konsultasi Gratis</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full">
              <CheckCircle className="w-6 h-6" />
              <span className="font-semibold">Respons Cepat</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full">
              <CheckCircle className="w-6 h-6" />
              <span className="font-semibold">Tim Berpengalaman</span>
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
                <MessageCircle className="w-7 h-7 text-white" />
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
        
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
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
        
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s linear infinite;
        }
      `}</style>
    </div>
  )
}

