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
      <div className="fixed bottom-20 left-4 lg:left-[280px] z-[99999] w-[400px] max-h-[calc(100vh-120px)]">
        <div 
          className="bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-full border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4 relative">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">👋</span>
              <h2 className="text-white font-bold text-base">
                {getGreeting()} {getRoleLabel()}!
              </h2>
            </div>
            <p className="text-primary-100 text-xs leading-relaxed">
              Ada yang bisa kami bantu untuk perjalanan belajarmu?
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Status Availability */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-3.5">
              <div className="flex items-start space-x-3">
                <Clock className="w-4 h-4 text-gray-600 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-0.5">
                    <p className="text-sm font-semibold text-gray-900">
                      {isSupportAvailable() 
                        ? 'Kami sedang tersedia saat ini' 
                        : 'Kami sedang tidak tersedia'}
                    </p>
                    <div className={`w-2 h-2 rounded-full ${
                      isSupportAvailable() ? 'bg-green-500 animate-pulse' : 'bg-orange-500'
                    }`}></div>
                  </div>
                  <p className="text-xs text-gray-600">
                    {isSupportAvailable() 
                      ? 'Tim support siap membantu Anda' 
                      : 'Kembali online besok pukul 09:00'}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Methods */}
            <div>
              <h3 className="text-xs font-semibold text-gray-900 mb-2.5 flex items-center">
                <HelpCircle className="w-3.5 h-3.5 mr-1.5 text-primary-600" />
                Hubungi Kami
              </h3>
              <div className="space-y-2">
                {contactMethods.map((method, index) => {
                  const Icon = method.icon
                  return (
                    <Link
                      key={index}
                      href={method.href}
                      onClick={onClose}
                      className={`flex items-center justify-between p-3 border rounded-lg transition-all group ${
                        method.available 
                          ? 'border-primary-200 hover:border-primary-300 hover:bg-primary-50 hover:shadow-sm' 
                          : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          method.available ? 'bg-primary-100' : 'bg-gray-200'
                        }`}>
                          <Icon className={`w-4 h-4 ${
                            method.available ? 'text-primary-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{method.title}</p>
                          <p className="text-xs text-gray-600 truncate">{method.description}</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 flex-shrink-0 ${
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
              <h3 className="text-xs font-semibold text-gray-900 mb-2.5">📚 Artikel Populer</h3>
              <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
                {supportArticles.map((article, index) => (
                  <Link
                    key={index}
                    href={article.href}
                    onClick={onClose}
                    className="flex items-center justify-between p-2.5 hover:bg-gray-50 transition-colors group"
                  >
                    <span className="text-xs text-gray-700 group-hover:text-primary-700 font-medium">
                      {article.title}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 rounded-lg p-3">
              <p className="text-xs text-primary-900 font-medium mb-2">💡 Tips Cepat</p>
              <p className="text-xs text-primary-800 leading-relaxed">
                Coba cari jawaban di artikel populer terlebih dahulu. Kebanyakan pertanyaan sudah terjawab di sana!
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

