'use client'

import Link from 'next/link'
import { ArrowLeft, Gift, Users, DollarSign, CheckCircle, Trophy } from 'lucide-react'

export default function ReferralHelpPage() {
  const steps = [
    {
      icon: Users,
      title: 'Dapatkan Kode Referral Anda',
      description: 'Setiap user memiliki kode referral unik yang dapat dibagikan.',
      details: [
        'Login ke dashboard Anda',
        'Buka menu "Referral Saya"',
        'Salin kode referral unik Anda',
        'Kode referral berupa kombinasi huruf dan angka',
        'Anda juga bisa salin link referral langsung'
      ]
    },
    {
      icon: Gift,
      title: 'Bagikan Kode Referral',
      description: 'Share kode referral Anda kepada teman, keluarga, atau followers.',
      details: [
        'Bagikan via WhatsApp, email, atau media sosial',
        'Ceritakan pengalaman positif Anda mengikuti training',
        'Jelaskan benefit yang akan didapat',
        'Berikan info tentang diskon atau bonus yang mereka dapatkan',
        'Tracking jumlah orang yang sudah menggunakan kode Anda'
      ]
    },
    {
      icon: CheckCircle,
      title: 'Teman Mendaftar dengan Kode Anda',
      description: 'Ketika teman Anda mendaftar menggunakan kode referral, mereka mendapat benefit.',
      details: [
        'Teman input kode referral saat pendaftaran',
        'Mereka otomatis mendapat diskon sesuai program referral',
        'Diskon langsung teraplikasi ke total pembayaran',
        'Sistem akan record pendaftaran dengan kode Anda',
        'Proses pendaftaran sama seperti biasa'
      ]
    },
    {
      icon: DollarSign,
      title: 'Dapatkan Reward/Komisi',
      description: 'Anda mendapatkan reward setelah teman berhasil menyelesaikan pembayaran.',
      details: [
        'Reward berupa komisi atau poin',
        'Besaran reward tergantung policy program',
        'Reward masuk ke akun Anda otomatis',
        'Cek saldo reward di dashboard',
        'Komisi dapat dicairkan sesuai ketentuan'
      ]
    },
    {
      icon: Trophy,
      title: 'Tukar Poin atau Tarik Komisi',
      description: 'Gunakan poin atau cairkan komisi yang sudah terkumpul.',
      details: [
        'Poin dapat ditukar dengan diskon pendaftaran program berikutnya',
        'Komisi dapat ditarik ke rekening bank',
        'Minimum penarikan sesuai ketentuan (biasanya 100rb)',
        'Proses penarikan 3-7 hari kerja',
        'Lihat riwayat transaksi reward Anda'
      ]
    }
  ]

  const benefits = [
    {
      title: 'Untuk Referrer (Anda)',
      items: [
        'Komisi 5-15% dari setiap pendaftaran',
        'Bonus tambahan untuk referral dalam jumlah banyak',
        'Poin reward yang bisa ditukar',
        'Kesempatan upgrade ke akun premium',
        'Penghasilan pasif dari sharing'
      ],
      color: 'primary'
    },
    {
      title: 'Untuk Referee (Teman Anda)',
      items: [
        'Diskon 10-20% untuk pendaftaran pertama',
        'Bonus poin welcome',
        'Akses ke program eksklusif',
        'Prioritas customer support',
        'Gratis modul tambahan (untuk program tertentu)'
      ],
      color: 'green'
    }
  ]

  const tips = [
    'Share pengalaman nyata dan jujur tentang program',
    'Target orang yang memang membutuhkan skill tersebut',
    'Gunakan social proof (testimoni, hasil belajar Anda)',
    'Berikan informasi yang lengkap tentang program',
    'Follow up dengan calon peserta yang tertarik',
    'Jangan spam! Bagikan dengan cara yang natural',
    'Gabung komunitas untuk networking lebih luas'
  ]

  const faqs = [
    {
      q: 'Apakah ada batasan jumlah referral?',
      a: 'Tidak ada batasan! Anda dapat mereferensikan sebanyak mungkin orang. Semakin banyak yang mendaftar melalui kode Anda, semakin besar reward yang didapat.'
    },
    {
      q: 'Bagaimana cara melihat status referral saya?',
      a: 'Buka menu "Referral Saya" di dashboard. Anda dapat melihat jumlah orang yang menggunakan kode, status pembayaran mereka, dan total komisi yang sudah didapat.'
    },
    {
      q: 'Kapan saya bisa menarik komisi?',
      a: 'Komisi dapat ditarik setelah teman yang Anda referensikan menyelesaikan pembayaran dan melewati periode cooling off (biasanya 7 hari). Minimum penarikan adalah Rp 100.000.'
    },
    {
      q: 'Apakah kode referral bisa digunakan berkali-kali?',
      a: 'Ya, kode referral Anda permanen dan dapat digunakan berkali-kali oleh orang yang berbeda. Namun, satu orang hanya bisa menggunakan satu kode referral.'
    },
    {
      q: 'Bagaimana jika teman saya lupa menggunakan kode referral?',
      a: 'Hubungi customer support kami maksimal 24 jam setelah pendaftaran dengan menyertakan bukti. Kami akan bantu apply kode referral secara manual.'
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
              <Gift className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Sistem Referral dan Point
            </h1>
          </div>
          <p className="text-primary-100 leading-relaxed">
            Dapatkan komisi dan reward dengan merekomendasikan Garuda Academy kepada teman-teman Anda!
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

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                <Gift className={`w-5 h-5 mr-2 ${benefit.color === 'primary' ? 'text-primary-600' : 'text-green-600'}`} />
                {benefit.title}
              </h3>
              <ul className="space-y-2">
                {benefit.items.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      benefit.color === 'primary' ? 'text-primary-500' : 'text-green-500'
                    }`} />
                    <span className="text-sm text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6 mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
            Tips Sukses Program Referral
          </h2>
          <ul className="space-y-2">
            {tips.map((tip, index) => (
              <li key={index} className="flex items-start space-x-3">
                <span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {index + 1}
                </span>
                <span className="text-sm text-gray-700 pt-0.5">{tip}</span>
              </li>
            ))}
          </ul>
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
            Siap Mulai Program Referral?
          </h3>
          <p className="text-sm text-primary-800 mb-4">
            Dapatkan kode referral Anda sekarang dan mulai earning!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/my-referral"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              Lihat Kode Referral Saya
            </Link>
            <Link
              href="https://wa.me/628112666456"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-white hover:bg-gray-50 text-primary-700 font-medium rounded-lg transition-colors border border-primary-300"
            >
              Tanya Lebih Lanjut
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

