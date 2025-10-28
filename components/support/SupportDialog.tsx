'use client'

import { X, ChevronRight, Clock, HelpCircle, MessageCircle, Mail, Phone } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'

interface SupportDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function SupportDialog({ isOpen, onClose }: SupportDialogProps) {
  const { profile } = useAuth()

  // Get current hour to determine greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Selamat Pagi'
    if (hour < 15) return 'Selamat Siang'
    if (hour < 18) return 'Selamat Sore'
    return 'Selamat Malam'
  }

  // Get user role label
  const getRoleLabel = () => {
    const role = profile?.role
    if (role === 'admin') return 'Admin'
    if (role === 'manager') return 'Manager'
    if (role === 'trainer') return 'Trainer'
    return 'Peserta'
  }

  // Check if support is available (9 AM - 6 PM)
  const isSupportAvailable = () => {
    const hour = new Date().getHours()
    return hour >= 9 && hour < 18
  }

  const supportArticles = [
    { 
      title: 'Cara Mendaftar Program Training', 
      href: '/help/enrollment',
      description: 'Panduan lengkap pendaftaran program training'
    },
    { 
      title: 'Panduan Mengerjakan Assignment', 
      href: '/help/assignment',
      description: 'Tips dan cara mengerjakan tugas dengan baik'
    },
    { 
      title: 'Cara Mengunduh Sertifikat', 
      href: '/help/certificate',
      description: 'Langkah-langkah download sertifikat Anda'
    },
    { 
      title: 'Sistem Referral dan Point', 
      href: '/help/referral',
      description: 'Cara kerja program referral dan reward'
    },
    { 
      title: 'FAQ Umum Platform', 
      href: '/help/faq',
      description: 'Pertanyaan yang sering diajukan'
    },
  ]

  const contactMethods = [
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      description: '0811-2666-456 / 0811-299-991',
      action: 'Chat WhatsApp',
      href: 'https://wa.me/628112666456',
      available: true
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'telemarketing@garuda-21.com',
      action: 'Kirim Email',
      href: 'mailto:telemarketing@garuda-21.com',
      available: true
    },
    {
      icon: Phone,
      title: 'Telepon',
      description: '021 50200409',
      action: 'Hubungi Kami',
      href: 'tel:02150200409',
      available: isSupportAvailable()
    },
  ]

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop - semi transparent */}
      <div 
        className="fixed inset-0 bg-black/20 z-[99998] transition-opacity"
        onClick={onClose}
      />

      {/* Dialog - Bottom Left Position */}
      <div className="fixed inset-x-0 bottom-20 sm:bottom-20 sm:left-4 lg:left-[280px] sm:inset-x-auto z-[99999] w-full sm:w-[400px] max-h-[calc(100vh-100px)] sm:max-h-[calc(100vh-120px)]">
        <div 
          className="bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-full border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-3 sm:p-4 relative">
            <button
              onClick={onClose}
              className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="flex items-center space-x-2 mb-2 sm:mb-2.5">
              <span className="text-2xl sm:text-3xl">👋</span>
              <h2 className="text-white font-bold text-base sm:text-lg">
                {getGreeting()} {getRoleLabel()}!
              </h2>
            </div>
            <p className="text-primary-100 text-sm sm:text-base leading-relaxed pr-8">
              Ada yang bisa kami bantu untuk perjalanan belajarmu?
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Status Availability */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm sm:text-base font-semibold text-gray-900">
                      {isSupportAvailable() 
                        ? 'Kami sedang tersedia saat ini' 
                        : 'Kami sedang tidak tersedia'}
                    </p>
                    <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0 ${
                      isSupportAvailable() ? 'bg-green-500 animate-pulse' : 'bg-orange-500'
                    }`}></div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {isSupportAvailable() 
                      ? 'Tim support siap membantu Anda' 
                      : 'Kembali online besok pukul 09:00'}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Methods */}
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 flex items-center">
                <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary-600 flex-shrink-0" />
                Hubungi Kami
              </h3>
              <div className="space-y-1.5 sm:space-y-2">
                {contactMethods.map((method, index) => {
                  const Icon = method.icon
                  return (
                    <Link
                      key={index}
                      href={method.href}
                      onClick={onClose}
                      className={`flex items-center justify-between p-2 sm:p-3 border rounded-lg transition-all group ${
                        method.available 
                          ? 'border-primary-200 hover:border-primary-300 hover:bg-primary-50 hover:shadow-sm' 
                          : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0 flex-1">
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          method.available ? 'bg-primary-100' : 'bg-gray-200'
                        }`}>
                          <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                            method.available ? 'text-primary-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">{method.title}</p>
                          <p className="text-xs sm:text-sm text-gray-600 break-all">{method.description}</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ml-1 ${
                        method.available 
                          ? 'text-primary-400 group-hover:text-primary-600 group-hover:translate-x-0.5' 
                          : 'text-gray-300'
                      } transition-all`} />
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Popular Articles */}
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">📚 Artikel Populer</h3>
              <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
                {supportArticles.map((article, index) => (
                  <Link
                    key={index}
                    href={article.href}
                    onClick={onClose}
                    className="flex items-center justify-between p-3 sm:p-3.5 hover:bg-gray-50 transition-colors group"
                  >
                    <span className="text-xs sm:text-sm text-gray-700 group-hover:text-primary-700 font-medium pr-2 break-words">
                      {article.title}
                    </span>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 rounded-lg p-3 sm:p-4">
              <p className="text-sm sm:text-base text-primary-900 font-semibold mb-2">💡 Tips Cepat</p>
              <p className="text-xs sm:text-sm text-primary-800 leading-relaxed">
                Coba cari jawaban di artikel populer terlebih dahulu. Kebanyakan pertanyaan sudah terjawab di sana!
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

