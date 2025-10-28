'use client'

import Link from 'next/link'
import { ArrowLeft, Award, CheckCircle, Download, Printer, Share2 } from 'lucide-react'

export default function CertificateHelpPage() {
  const steps = [
    {
      icon: CheckCircle,
      title: 'Selesaikan Semua Syarat',
      description: 'Pastikan Anda telah memenuhi semua persyaratan untuk mendapatkan sertifikat.',
      details: [
        'Menyelesaikan semua modul pembelajaran (100%)',
        'Mengerjakan dan lulus semua assignment',
        'Mencapai nilai minimum yang ditentukan (biasanya 70%)',
        'Menyelesaikan project akhir (jika ada)',
        'Mengisi survey evaluasi program'
      ]
    },
    {
      icon: Award,
      title: 'Sertifikat Otomatis Tersedia',
      description: 'Setelah semua syarat terpenuhi, sertifikat akan otomatis di-generate oleh sistem.',
      details: [
        'Sistem akan otomatis mengecek kelengkapan syarat',
        'Proses generate sertifikat memakan waktu 1-3 hari kerja',
        'Anda akan menerima notifikasi email',
        'Sertifikat digital tersedia dalam format PDF berkualitas tinggi',
        'Nomor sertifikat unik untuk verifikasi'
      ]
    },
    {
      icon: Download,
      title: 'Download Sertifikat',
      description: 'Akses dan download sertifikat digital Anda kapan saja.',
      details: [
        'Login ke dashboard Anda',
        'Buka menu "Sertifikat Saya"',
        'Temukan program yang sudah diselesaikan',
        'Klik tombol "Download PDF"',
        'Sertifikat akan terdownload dalam format PDF',
        'Anda dapat download berkali-kali tanpa batas'
      ]
    },
    {
      icon: Printer,
      title: 'Cetak Sertifikat',
      description: 'Cetak sertifikat Anda untuk keperluan fisik.',
      details: [
        'Buka file PDF sertifikat yang sudah didownload',
        'Gunakan printer dengan kualitas tinggi',
        'Disarankan menggunakan kertas A4 atau Letter',
        'Setting printer: Full Color, Best Quality',
        'Gunakan kertas ivory atau art paper untuk hasil terbaik'
      ]
    },
    {
      icon: Share2,
      title: 'Bagikan Pencapaian Anda',
      description: 'Tunjukkan pencapaian Anda di media sosial atau platform profesional.',
      details: [
        'Tambahkan sertifikat ke profil LinkedIn',
        'Bagikan di media sosial (Instagram, Facebook, Twitter)',
        'Gunakan credential code untuk verifikasi',
        'Cantumkan di CV atau portfolio Anda',
        'Tunjukkan kepada calon employer'
      ]
    }
  ]

  const certificateFeatures = [
    {
      title: 'Sertifikat Digital',
      items: [
        'Format PDF berkualitas tinggi',
        'Nomor sertifikat unik',
        'QR Code untuk verifikasi online',
        'Tanda tangan digital trainer & direktur',
        'Tersimpan permanen di sistem'
      ]
    },
    {
      title: 'Verifikasi Sertifikat',
      items: [
        'Scan QR Code pada sertifikat',
        'Masukkan nomor sertifikat di website',
        'Sistem akan validasi keaslian',
        'Lihat detail pemegang sertifikat',
        'Cek tanggal penerbitan dan program'
      ]
    }
  ]

  const faqs = [
    {
      q: 'Berapa lama proses penerbitan sertifikat?',
      a: 'Setelah semua syarat terpenuhi, sertifikat akan otomatis tersedia dalam 1-3 hari kerja. Anda akan menerima notifikasi email saat sertifikat sudah siap didownload.'
    },
    {
      q: 'Apakah saya bisa request sertifikat fisik?',
      a: 'Ya, Anda dapat meminta sertifikat fisik dengan menghubungi tim support. Biaya cetak dan pengiriman akan dikenakan sesuai lokasi pengiriman.'
    },
    {
      q: 'Bagaimana cara verifikasi keaslian sertifikat?',
      a: 'Setiap sertifikat dilengkapi QR Code. Scan QR Code atau kunjungi halaman verifikasi di website kami dan masukkan nomor sertifikat untuk validasi keaslian.'
    },
    {
      q: 'Apakah sertifikat memiliki masa berlaku?',
      a: 'Sertifikat digital kami tidak memiliki masa berlaku dan tersimpan permanen di sistem. Namun, untuk beberapa sertifikasi profesional, mungkin diperlukan renewal setelah periode tertentu.'
    },
    {
      q: 'Apa yang harus dilakukan jika nama di sertifikat salah?',
      a: 'Hubungi tim support kami segera dengan menyertakan bukti identitas. Kami akan memperbaiki dan menerbitkan ulang sertifikat dengan nama yang benar.'
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
              <Award className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Cara Mengunduh Sertifikat
            </h1>
          </div>
          <p className="text-primary-100 leading-relaxed">
            Panduan lengkap untuk mendapatkan, download, dan memverifikasi sertifikat digital Anda.
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

        {/* Certificate Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {certificateFeatures.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                <Award className="w-5 h-5 text-primary-600 mr-2" />
                {feature.title}
              </h3>
              <ul className="space-y-2">
                {feature.items.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
            Masalah dengan Sertifikat Anda?
          </h3>
          <p className="text-sm text-primary-800 mb-4">
            Hubungi kami untuk bantuan terkait sertifikat
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

