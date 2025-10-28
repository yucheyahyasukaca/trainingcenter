'use client'

import Link from 'next/link'
import { ArrowLeft, HelpCircle, Search, ChevronDown } from 'lucide-react'
import { useState } from 'react'

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const categories = [
    {
      title: '📚 Tentang Platform',
      faqs: [
        {
          q: 'Apa itu Garuda Academy?',
          a: 'Garuda Academy adalah platform pembelajaran online yang menyediakan berbagai program training profesional dalam bidang teknologi, bisnis, dan pengembangan diri. Kami menawarkan kursus berkualitas dengan instruktur berpengalaman dan sertifikat yang diakui industri.'
        },
        {
          q: 'Apakah saya perlu pengalaman sebelumnya?',
          a: 'Tidak semua program memerlukan pengalaman sebelumnya. Setiap program memiliki level dan prasyarat yang berbeda (Beginner, Intermediate, Advanced). Informasi lengkap tentang prasyarat dapat dilihat di halaman detail program.'
        },
        {
          q: 'Apakah materi bisa diakses selamanya?',
          a: 'Ya, setelah Anda mendaftar suatu program, Anda memiliki akses selamanya ke semua materi, video, dan resource yang tersedia di program tersebut.'
        }
      ]
    },
    {
      title: '💳 Pembayaran & Harga',
      faqs: [
        {
          q: 'Metode pembayaran apa saja yang tersedia?',
          a: 'Kami menerima berbagai metode pembayaran: Transfer Bank (BCA, Mandiri, BNI, BRI), Virtual Account, E-Wallet (OVO, GoPay, Dana), dan Credit/Debit Card.'
        },
        {
          q: 'Apakah ada cicilan?',
          a: 'Ya, untuk program tertentu kami menyediakan opsi cicilan 3x atau 6x tanpa bunga. Informasi cicilan dapat dilihat di halaman detail program atau hubungi tim kami.'
        },
        {
          q: 'Bagaimana cara mendapatkan invoice?',
          a: 'Invoice akan otomatis dikirim ke email Anda setelah pembayaran berhasil. Anda juga dapat mengunduh invoice dari menu "Riwayat Pembayaran" di dashboard.'
        },
        {
          q: 'Apakah bisa refund jika tidak cocok?',
          a: 'Kami menyediakan kebijakan refund 7 hari untuk program tertentu. Syarat dan ketentuan refund dapat dilihat di Terms of Service kami atau hubungi customer support.'
        }
      ]
    },
    {
      title: '📖 Pembelajaran',
      faqs: [
        {
          q: 'Berapa lama durasi setiap program?',
          a: 'Durasi program bervariasi tergantung jenisnya, mulai dari 2 minggu hingga 6 bulan. Anda dapat belajar dengan pace Anda sendiri karena materi dapat diakses kapan saja.'
        },
        {
          q: 'Apakah ada live session dengan instruktur?',
          a: 'Ya, kebanyakan program kami menyediakan live session mingguan atau bi-weekly dengan instruktur untuk Q&A dan diskusi. Jadwal live session akan diinformasikan setelah pendaftaran.'
        },
        {
          q: 'Bagaimana jika saya ketinggalan live session?',
          a: 'Semua live session akan direkam dan dapat diakses kembali kapan saja di dashboard Anda. Anda juga dapat bertanya di forum diskusi jika ada yang kurang jelas.'
        },
        {
          q: 'Apakah ada tugas atau assignment?',
          a: 'Ya, setiap modul biasanya memiliki assignment untuk menguji pemahaman Anda. Assignment ini wajib diselesaikan untuk mendapatkan sertifikat.'
        }
      ]
    },
    {
      title: '🎓 Sertifikat',
      faqs: [
        {
          q: 'Apakah sertifikat diakui industri?',
          a: 'Ya, sertifikat kami diakui oleh berbagai perusahaan partner kami. Sertifikat dilengkapi dengan nomor verifikasi unik yang dapat divalidasi oleh employer.'
        },
        {
          q: 'Apa syarat mendapatkan sertifikat?',
          a: 'Untuk mendapatkan sertifikat, Anda harus: menyelesaikan semua modul (100%), mengerjakan semua assignment dengan nilai minimum 70%, dan menyelesaikan project akhir (jika ada).'
        },
        {
          q: 'Apakah ada sertifikat fisik?',
          a: 'Secara default kami menyediakan sertifikat digital dalam format PDF. Sertifikat fisik dapat direquest dengan biaya tambahan untuk cetak dan pengiriman.'
        }
      ]
    },
    {
      title: '👥 Akun & Profil',
      faqs: [
        {
          q: 'Bagaimana cara mengganti password?',
          a: 'Buka menu "Pengaturan" > "Keamanan" > "Ubah Password". Masukkan password lama dan password baru Anda. Pastikan password baru minimal 8 karakter.'
        },
        {
          q: 'Bisakah saya menggunakan satu akun di banyak device?',
          a: 'Ya, Anda dapat login dan mengakses materi dari berbagai device (laptop, tablet, smartphone). Namun, untuk keamanan, kami batasi maksimal 3 device aktif bersamaan.'
        },
        {
          q: 'Bagaimana cara update informasi profil?',
          a: 'Buka menu "Profil" di dashboard dan klik tombol "Edit Profil". Anda dapat mengubah nama, email, nomor telepon, foto profil, dan informasi lainnya.'
        }
      ]
    },
    {
      title: '💬 Support & Bantuan',
      faqs: [
        {
          q: 'Bagaimana cara menghubungi support?',
          a: 'Anda dapat menghubungi kami melalui: WhatsApp (0811-2666-456 / 0811-299-991), Email (telemarketing@garuda-21.com), atau Telepon (021 50200409) pada jam kerja.'
        },
        {
          q: 'Berapa lama response time support?',
          a: 'Kami berusaha merespon semua pertanyaan dalam 1x24 jam pada hari kerja. Untuk pertanyaan urgent, silakan hubungi via WhatsApp untuk respon lebih cepat.'
        },
        {
          q: 'Apakah ada komunitas untuk sesama peserta?',
          a: 'Ya, setiap program memiliki forum diskusi internal. Kami juga memiliki grup WhatsApp dan Telegram untuk networking dan sharing pengalaman antar peserta.'
        }
      ]
    }
  ]

  const filteredCategories = categories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq => 
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0)

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
              <HelpCircle className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              FAQ Umum Platform
            </h1>
          </div>
          <p className="text-primary-100 leading-relaxed mb-4">
            Temukan jawaban untuk pertanyaan yang sering diajukan tentang Garuda Academy.
          </p>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari pertanyaan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category, catIndex) => (
              <div key={catIndex}>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {category.title}
                </h2>
                <div className="space-y-3">
                  {category.faqs.map((faq, faqIndex) => {
                    const globalIndex = catIndex * 100 + faqIndex
                    const isExpanded = expandedIndex === globalIndex
                    
                    return (
                      <div
                        key={faqIndex}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                      >
                        <button
                          onClick={() => setExpandedIndex(isExpanded ? null : globalIndex)}
                          className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                        >
                          <span className="font-semibold text-gray-900 pr-4">
                            {faq.q}
                          </span>
                          <ChevronDown
                            className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
                              isExpanded ? 'transform rotate-180' : ''
                            }`}
                          />
                        </button>
                        {isExpanded && (
                          <div className="px-5 pb-4 pt-2 border-t border-gray-100">
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {faq.a}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tidak ada hasil ditemukan
              </h3>
              <p className="text-gray-600 mb-4">
                Coba kata kunci lain atau hubungi tim support kami
              </p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-6 text-center mt-12">
          <h3 className="text-lg font-bold text-primary-900 mb-2">
            Tidak Menemukan Jawaban Anda?
          </h3>
          <p className="text-sm text-primary-800 mb-4">
            Tim support kami siap membantu menjawab pertanyaan Anda
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

