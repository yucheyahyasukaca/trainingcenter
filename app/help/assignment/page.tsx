'use client'

import Link from 'next/link'
import { ArrowLeft, FileText, Upload, CheckCircle, Clock, AlertCircle } from 'lucide-react'

export default function AssignmentHelpPage() {
  const steps = [
    {
      icon: FileText,
      title: 'Akses Assignment',
      description: 'Buka modul pembelajaran dan temukan assignment yang harus dikerjakan.',
      details: [
        'Login ke dashboard Anda',
        'Buka menu "Kelas Terdaftar"',
        'Pilih program yang sedang diikuti',
        'Navigasi ke modul yang memiliki assignment',
        'Klik tab "Assignment" untuk melihat tugas'
      ]
    },
    {
      icon: Clock,
      title: 'Perhatikan Deadline',
      description: 'Pastikan Anda mengetahui batas waktu pengumpulan assignment.',
      details: [
        'Lihat tanggal deadline di bagian atas assignment',
        'Tandai deadline di kalender Anda',
        'Kerjakan assignment jauh sebelum deadline',
        'Assignment yang terlambat mungkin tidak dinilai atau mendapat pengurangan nilai'
      ]
    },
    {
      icon: FileText,
      title: 'Kerjakan Assignment',
      description: 'Baca instruksi dengan teliti dan kerjakan assignment sesuai ketentuan.',
      details: [
        'Baca semua instruksi dan requirements dengan seksama',
        'Perhatikan format file yang diminta (PDF, Word, ZIP, dll)',
        'Pastikan pekerjaan Anda original dan bukan plagiarisme',
        'Ikuti guideline dan kriteria penilaian yang diberikan',
        'Cek kembali pekerjaan sebelum upload'
      ]
    },
    {
      icon: Upload,
      title: 'Upload Assignment',
      description: 'Submit pekerjaan Anda melalui form upload yang tersedia.',
      details: [
        'Klik tombol "Upload Assignment"',
        'Pilih file dari komputer Anda',
        'Pastikan ukuran file tidak melebihi batas maksimal (10MB)',
        'File gambar akan otomatis dikompres',
        'Tambahkan catatan jika diperlukan',
        'Klik "Submit" untuk mengirim'
      ]
    },
    {
      icon: CheckCircle,
      title: 'Tunggu Review & Nilai',
      description: 'Trainer akan mereview assignment Anda dan memberikan feedback.',
      details: [
        'Anda akan menerima notifikasi email saat assignment direview',
        'Proses review biasanya memakan waktu 3-7 hari kerja',
        'Cek status assignment di dashboard',
        'Lihat feedback dan nilai yang diberikan trainer',
        'Perbaiki dan submit ulang jika diminta revision'
      ]
    }
  ]

  const tips = [
    {
      icon: CheckCircle,
      title: 'Tips Mengerjakan Assignment',
      items: [
        'Mulai mengerjakan assignment sesegera mungkin',
        'Jangan menunda hingga mendekati deadline',
        'Tanyakan ke trainer jika ada yang kurang jelas',
        'Diskusikan dengan sesama peserta di forum',
        'Lakukan riset tambahan untuk memperdalam pemahaman'
      ]
    },
    {
      icon: AlertCircle,
      title: 'Hal yang Harus Dihindari',
      items: [
        'Menyalin pekerjaan orang lain (plagiarisme)',
        'Upload file yang corrupt atau tidak bisa dibuka',
        'Mengabaikan instruksi dan requirements',
        'Submit assignment setelah deadline tanpa pemberitahuan',
        'Upload file dengan format yang salah'
      ]
    }
  ]

  const faqs = [
    {
      q: 'Apakah saya bisa submit assignment lebih dari sekali?',
      a: 'Ya, Anda dapat submit ulang assignment sebelum deadline. Submission terakhir yang akan dinilai oleh trainer.'
    },
    {
      q: 'Bagaimana jika saya melewatkan deadline?',
      a: 'Hubungi trainer Anda segera untuk menjelaskan situasi. Tergantung kebijakan, Anda mungkin masih bisa submit dengan penalty atau tidak dinilai.'
    },
    {
      q: 'Berapa ukuran file maksimal yang bisa diupload?',
      a: 'Ukuran maksimal adalah 10MB per file. Untuk file gambar, sistem akan otomatis mengompres untuk menghemat ruang penyimpanan.'
    },
    {
      q: 'Format file apa saja yang didukung?',
      a: 'Kami mendukung berbagai format: PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, ZIP, JPG/PNG untuk gambar, dan file code (JS, PY, HTML, CSS, dll).'
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
              <FileText className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Panduan Mengerjakan Assignment
            </h1>
          </div>
          <p className="text-primary-100 leading-relaxed">
            Pelajari cara mengerjakan dan submit assignment dengan benar agar mendapat nilai maksimal.
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

        {/* Tips & Warnings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {tips.map((tip, index) => {
            const Icon = tip.icon
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center space-x-2 mb-4">
                  <Icon className={`w-5 h-5 ${index === 0 ? 'text-green-600' : 'text-orange-600'}`} />
                  <h3 className="font-bold text-gray-900">{tip.title}</h3>
                </div>
                <ul className="space-y-2">
                  {tip.items.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                        index === 0 ? 'bg-green-500' : 'bg-orange-500'
                      }`} />
                      <span className="text-sm text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
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
            Butuh Bantuan Lebih Lanjut?
          </h3>
          <p className="text-sm text-primary-800 mb-4">
            Hubungi trainer atau tim support kami
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

