'use client'

import Link from 'next/link'
import { ArrowLeft, CheckCircle, Users, Calendar, CreditCard, FileText } from 'lucide-react'

export default function EnrollmentHelpPage() {
  const steps = [
    {
      icon: Users,
      title: 'Pilih Program Training',
      description: 'Buka halaman "Program" dari menu navigasi dan jelajahi berbagai program training yang tersedia.',
      details: [
        'Lihat deskripsi lengkap program',
        'Periksa durasi dan jadwal training',
        'Cek harga dan benefit yang didapat',
        'Baca testimonial dari peserta sebelumnya'
      ]
    },
    {
      icon: Calendar,
      title: 'Pilih Kelas yang Tersedia',
      description: 'Setelah memilih program, pilih kelas dengan jadwal yang sesuai dengan ketersediaan Anda.',
      details: [
        'Klik tombol "Lihat Detail" pada program pilihan',
        'Scroll ke bagian "Kelas Tersedia"',
        'Periksa tanggal mulai dan berakhir',
        'Pastikan kapasitas kelas masih tersedia',
        'Klik tombol "Daftar Sekarang" pada kelas pilihan'
      ]
    },
    {
      icon: FileText,
      title: 'Isi Form Pendaftaran',
      description: 'Lengkapi formulir pendaftaran dengan data yang akurat dan lengkap.',
      details: [
        'Pastikan nama lengkap sesuai identitas',
        'Email yang digunakan adalah email aktif',
        'Nomor telepon dapat dihubungi',
        'Alamat lengkap untuk pengiriman sertifikat fisik (jika ada)'
      ]
    },
    {
      icon: CreditCard,
      title: 'Lakukan Pembayaran',
      description: 'Pilih metode pembayaran dan selesaikan proses pembayaran untuk mengkonfirmasi pendaftaran.',
      details: [
        'Pilih metode pembayaran: Transfer Bank, Virtual Account, atau E-Wallet',
        'Upload bukti pembayaran jika menggunakan transfer manual',
        'Simpan nomor invoice untuk referensi',
        'Tunggu konfirmasi pembayaran (maksimal 1x24 jam)'
      ]
    },
    {
      icon: CheckCircle,
      title: 'Akses Materi Training',
      description: 'Setelah pembayaran dikonfirmasi, Anda dapat langsung mengakses materi training.',
      details: [
        'Cek email untuk notifikasi konfirmasi',
        'Login ke dashboard Anda',
        'Buka menu "Kelas Terdaftar"',
        'Klik program yang sudah didaftarkan',
        'Mulai belajar dengan mengakses modul-modul yang tersedia'
      ]
    }
  ]

  const faqs = [
    {
      q: 'Apakah saya bisa membatalkan pendaftaran?',
      a: 'Anda dapat membatalkan pendaftaran maksimal 3 hari sebelum kelas dimulai dengan pengembalian dana 50%. Hubungi tim support kami untuk proses pembatalan.'
    },
    {
      q: 'Bagaimana jika saya melewatkan kelas?',
      a: 'Semua materi training dapat diakses secara online kapan saja. Anda dapat menonton rekaman kelas dan mengerjakan assignment sesuai deadline yang ditentukan.'
    },
    {
      q: 'Apakah ada prasyarat untuk mengikuti training?',
      a: 'Setiap program memiliki prasyarat yang berbeda. Informasi lengkap tentang prasyarat dapat dilihat di halaman detail program sebelum mendaftar.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <Link 
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Dashboard
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Title Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 sm:p-8 mb-8 text-white">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Cara Mendaftar Program Training
            </h1>
          </div>
          <p className="text-primary-100 leading-relaxed">
            Panduan lengkap untuk mendaftar dan memulai perjalanan belajar Anda di Garuda Academy. 
            Ikuti langkah-langkah berikut dengan mudah.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-6 mb-12">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5 sm:p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        {step.description}
                      </p>
                      <ul className="space-y-2">
                        {step.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            ❓ Pertanyaan Umum
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-primary-900 mb-2">
            Masih Ada Pertanyaan?
          </h3>
          <p className="text-sm text-primary-800 mb-4">
            Tim support kami siap membantu Anda
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="https://wa.me/628112666456"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              WhatsApp Support
            </Link>
            <Link
              href="mailto:telemarketing@garuda-21.com"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-white hover:bg-gray-50 text-primary-700 font-medium rounded-lg transition-colors border border-primary-300"
            >
              Email Kami
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

