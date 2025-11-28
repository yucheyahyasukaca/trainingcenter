'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Loader2, CheckCircle, Info } from 'lucide-react'
import { signIn } from '@/lib/auth'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'

interface WebinarRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  webinarSlug: string
  onSuccess: () => void
}

// Indonesia provinces data
const provinces = [
  'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau', 'Jambi',
  'Sumatera Selatan', 'Bangka Belitung', 'Bengkulu', 'Lampung', 'DKI Jakarta',
  'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur', 'Banten',
  'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'Kalimantan Barat',
  'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara',
  'Sulawesi Utara', 'Sulawesi Tengah', 'Sulawesi Selatan', 'Sulawesi Tenggara',
  'Gorontalo', 'Sulawesi Barat', 'Maluku', 'Maluku Utara', 'Papua Barat', 'Papua'
]

// Indonesia kabupaten/kota data (same as profile edit page)
const kabupatenKota: Record<string, string[]> = {
  'Aceh': [
    'Banda Aceh', 'Langsa', 'Lhokseumawe', 'Sabang', 'Subulussalam', 'Aceh Besar', 'Aceh Jaya', 'Aceh Selatan', 
    'Aceh Singkil', 'Aceh Tamiang', 'Aceh Tengah', 'Aceh Tenggara', 'Aceh Timur', 'Aceh Utara', 'Bener Meriah', 
    'Bireuen', 'Gayo Lues', 'Nagan Raya', 'Pidie', 'Pidie Jaya', 'Simeulue'
  ],
  'Sumatera Utara': [
    'Medan', 'Binjai', 'Pematangsiantar', 'Tebing Tinggi', 'Tanjungbalai', 'Sibolga', 'Padang Sidempuan', 
    'Gunungsitoli', 'Asahan', 'Batubara', 'Dairi', 'Deli Serdang', 'Humbang Hasundutan', 'Karo', 'Labuhanbatu', 
    'Labuhanbatu Selatan', 'Labuhanbatu Utara', 'Langkat', 'Mandailing Natal', 'Nias', 'Nias Barat', 'Nias Selatan', 
    'Nias Utara', 'Padang Lawas', 'Padang Lawas Utara', 'Pakpak Bharat', 'Samosir', 'Serdang Bedagai', 'Simalungun', 
    'Tapanuli Selatan', 'Tapanuli Tengah', 'Tapanuli Utara', 'Toba Samosir'
  ],
  'Sumatera Barat': [
    'Padang', 'Payakumbuh', 'Bukittinggi', 'Pariaman', 'Solok', 'Sawahlunto', 'Padang Panjang', 'Dharmasraya', 
    'Pasaman', 'Pasaman Barat', 'Pesisir Selatan', 'Sijunjung', 'Solok Selatan', 'Tanah Datar', 'Agam', 'Lima Puluh Kota', 
    'Kepulauan Mentawai', 'Padang Pariaman', 'Solok'
  ],
  'Riau': [
    'Pekanbaru', 'Dumai', 'Bengkalis', 'Rengat', 'Tembilahan', 'Indragiri Hilir', 'Indragiri Hulu', 'Kampar', 
    'Kepulauan Meranti', 'Kuantan Singingi', 'Pelalawan', 'Rokan Hilir', 'Rokan Hulu', 'Siak'
  ],
  'Kepulauan Riau': [
    'Batam', 'Tanjung Pinang', 'Bintan', 'Karimun', 'Kepulauan Anambas', 'Lingga', 'Natuna'
  ],
  'Jambi': [
    'Jambi', 'Sungai Penuh', 'Batanghari', 'Bungo', 'Kerinci', 'Merangin', 'Muaro Jambi', 'Sarolangun', 
    'Tanjung Jabung Barat', 'Tanjung Jabung Timur', 'Tebo'
  ],
  'Sumatera Selatan': [
    'Palembang', 'Prabumulih', 'Lubuklinggau', 'Pagar Alam', 'Banyuasin', 'Empat Lawang', 'Lahat', 'Muara Enim', 
    'Musi Banyuasin', 'Musi Rawas', 'Musi Rawas Utara', 'Ogan Ilir', 'Ogan Komering Ilir', 'Ogan Komering Ulu', 
    'Ogan Komering Ulu Selatan', 'Ogan Komering Ulu Timur', 'Penukal Abab Lematang Ilir'
  ],
  'Bangka Belitung': [
    'Pangkal Pinang', 'Bangka', 'Bangka Barat', 'Bangka Selatan', 'Bangka Tengah', 'Belitung', 'Belitung Timur'
  ],
  'Bengkulu': [
    'Bengkulu', 'Bengkulu Selatan', 'Bengkulu Tengah', 'Bengkulu Utara', 'Kaur', 'Kepahiang', 'Lebong', 
    'Mukomuko', 'Rejang Lebong', 'Seluma'
  ],
  'Lampung': [
    'Bandar Lampung', 'Metro', 'Lampung Barat', 'Lampung Selatan', 'Lampung Tengah', 'Lampung Timur', 
    'Lampung Utara', 'Mesuji', 'Pesawaran', 'Pringsewu', 'Tanggamus', 'Tulang Bawang', 'Tulang Bawang Barat', 
    'Way Kanan', 'Pesisir Barat'
  ],
  'DKI Jakarta': [
    'Jakarta Pusat', 'Jakarta Utara', 'Jakarta Barat', 'Jakarta Selatan', 'Jakarta Timur', 'Kepulauan Seribu'
  ],
  'Jawa Barat': [
    'Bandung', 'Bekasi', 'Bogor', 'Cirebon', 'Depok', 'Sukabumi', 'Tasikmalaya', 'Banjar', 'Cimahi', 'Cirebon', 
    'Bandung', 'Bandung Barat', 'Bekasi', 'Bogor', 'Ciamis', 'Cianjur', 'Cirebon', 'Garut', 'Indramayu', 'Karawang', 
    'Kuningan', 'Majalengka', 'Pangandaran', 'Purwakarta', 'Subang', 'Sukabumi', 'Sumedang', 'Tasikmalaya'
  ],
  'Jawa Tengah': [
    'Semarang', 'Surakarta', 'Salatiga', 'Magelang', 'Pekalongan', 'Tegal', 'Banjarnegara', 'Banyumas', 'Batang', 
    'Blora', 'Boyolali', 'Brebes', 'Cilacap', 'Demak', 'Grobogan', 'Jepara', 'Karanganyar', 'Kebumen', 'Kendal', 
    'Klaten', 'Kudus', 'Pati', 'Pemalang', 'Purbalingga', 'Purworejo', 'Rembang', 'Sragen', 'Sukoharjo', 'Temanggung', 
    'Wonogiri', 'Wonosobo'
  ],
  'DI Yogyakarta': [
    'Yogyakarta', 'Bantul', 'Gunung Kidul', 'Kulon Progo', 'Sleman'
  ],
  'Jawa Timur': [
    'Surabaya', 'Malang', 'Kediri', 'Blitar', 'Mojokerto', 'Pasuruan', 'Probolinggo', 'Batu', 'Bangkalan', 
    'Banyuwangi', 'Blitar', 'Bojonegoro', 'Bondowoso', 'Gresik', 'Jember', 'Jombang', 'Kediri', 'Lamongan', 
    'Lumajang', 'Madiun', 'Magetan', 'Nganjuk', 'Ngawi', 'Pacitan', 'Pamekasan', 'Pasuruan', 'Ponorogo', 
    'Probolinggo', 'Sampang', 'Sidoarjo', 'Situbondo', 'Sumenep', 'Trenggalek', 'Tuban', 'Tulungagung'
  ],
  'Banten': [
    'Serang', 'Tangerang', 'Cilegon', 'Tangerang Selatan', 'Lebak', 'Pandeglang', 'Serang', 'Tangerang'
  ],
  'Bali': [
    'Denpasar', 'Badung', 'Bangli', 'Buleleng', 'Gianyar', 'Jembrana', 'Karangasem', 'Klungkung', 'Tabanan'
  ],
  'Nusa Tenggara Barat': [
    'Mataram', 'Bima', 'Dompu', 'Lombok Barat', 'Lombok Tengah', 'Lombok Timur', 'Lombok Utara', 'Sumbawa', 
    'Sumbawa Barat', 'Bima'
  ],
  'Nusa Tenggara Timur': [
    'Kupang', 'Ende', 'Flores Timur', 'Kupang', 'Malaka', 'Manggarai', 'Manggarai Barat', 'Manggarai Timur', 
    'Nagekeo', 'Ngada', 'Rote Ndao', 'Sabu Raijua', 'Sikka', 'Sumba Barat', 'Sumba Barat Daya', 'Sumba Tengah', 
    'Sumba Timur', 'Timor Tengah Selatan', 'Timor Tengah Utara'
  ],
  'Kalimantan Barat': [
    'Pontianak', 'Singkawang', 'Bengkayang', 'Kapuas Hulu', 'Kayong Utara', 'Ketapang', 'Kubu Raya', 'Landak', 
    'Melawi', 'Mempawah', 'Sambas', 'Sanggau', 'Sintang'
  ],
  'Kalimantan Tengah': [
    'Palangka Raya', 'Barito Selatan', 'Barito Timur', 'Barito Utara', 'Gunung Mas', 'Kapuas', 'Katingan', 
    'Kotawaringin Barat', 'Kotawaringin Timur', 'Lamandau', 'Murung Raya', 'Pulang Pisau', 'Sukamara', 'Seruyan'
  ],
  'Kalimantan Selatan': [
    'Banjarmasin', 'Banjar Baru', 'Balangan', 'Hulu Sungai Selatan', 'Hulu Sungai Tengah', 'Hulu Sungai Utara', 
    'Kotabaru', 'Tabalong', 'Tanah Bumbu', 'Tanah Laut', 'Tapin', 'Barito Kuala'
  ],
  'Kalimantan Timur': [
    'Samarinda', 'Balikpapan', 'Bontang', 'Berau', 'Kutai Barat', 'Kutai Kartanegara', 'Kutai Timur', 'Penajam Paser Utara', 
    'Paser', 'Mahakam Ulu'
  ],
  'Kalimantan Utara': [
    'Tanjung Selor', 'Bulungan', 'Malinau', 'Nunukan', 'Tana Tidung'
  ],
  'Sulawesi Utara': [
    'Manado', 'Bitung', 'Kotamobagu', 'Tomohon', 'Bolaang Mongondow', 'Bolaang Mongondow Selatan', 'Bolaang Mongondow Timur', 
    'Bolaang Mongondow Utara', 'Kepulauan Sangihe', 'Kepulauan Siau Tagulandang Biaro', 'Kepulauan Talaud', 'Minahasa', 
    'Minahasa Selatan', 'Minahasa Tenggara', 'Minahasa Utara'
  ],
  'Sulawesi Tengah': [
    'Palu', 'Banggai', 'Banggai Kepulauan', 'Banggai Laut', 'Buol', 'Donggala', 'Morowali', 'Morowali Utara', 
    'Parigi Moutong', 'Poso', 'Sigi', 'Tojo Una-Una', 'Tolitoli'
  ],
  'Sulawesi Selatan': [
    'Makassar', 'Parepare', 'Palopo', 'Bantaeng', 'Barru', 'Bone', 'Bulukumba', 'Enrekang', 'Gowa', 'Jeneponto', 
    'Kepulauan Selayar', 'Luwu', 'Luwu Timur', 'Luwu Utara', 'Maros', 'Pangkajene dan Kepulauan', 'Pinrang', 
    'Sidenreng Rappang', 'Sinjai', 'Soppeng', 'Takalar', 'Tana Toraja', 'Toraja Utara', 'Wajo'
  ],
  'Sulawesi Tenggara': [
    'Kendari', 'Bau-Bau', 'Bombana', 'Buton', 'Buton Selatan', 'Buton Tengah', 'Buton Utara', 'Kolaka', 
    'Kolaka Timur', 'Kolaka Utara', 'Konawe', 'Konawe Kepulauan', 'Konawe Selatan', 'Konawe Utara', 'Muna', 
    'Muna Barat', 'Wakatobi'
  ],
  'Gorontalo': [
    'Gorontalo', 'Boalemo', 'Bone Bolango', 'Gorontalo', 'Gorontalo Utara', 'Pohuwato'
  ],
  'Sulawesi Barat': [
    'Mamuju', 'Majene', 'Mamasa', 'Mamuju Tengah', 'Mamuju Utara', 'Polewali Mandar'
  ],
  'Maluku': [
    'Ambon', 'Tual', 'Buru', 'Buru Selatan', 'Kepulauan Aru', 'Kepulauan Tanimbar', 'Maluku Barat Daya', 
    'Maluku Tengah', 'Maluku Tenggara', 'Seram Bagian Barat', 'Seram Bagian Timur'
  ],
  'Maluku Utara': [
    'Sofifi', 'Ternate', 'Tidore Kepulauan', 'Halmahera Barat', 'Halmahera Tengah', 'Halmahera Utara', 
    'Halmahera Selatan', 'Halmahera Timur', 'Kepulauan Sula', 'Pulau Morotai', 'Pulau Taliabu'
  ],
  'Papua Barat': [
    'Manokwari', 'Sorong', 'Fakfak', 'Kaimana', 'Manokwari', 'Maybrat', 'Pegunungan Arfak', 'Raja Ampat', 
    'Sorong', 'Sorong Selatan', 'Tambrauw', 'Teluk Bintuni', 'Teluk Wondama'
  ],
  'Papua': [
    'Jayapura', 'Merauke', 'Biak Numfor', 'Jayapura', 'Keerom', 'Kepulauan Yapen', 'Mamberamo Raya', 
    'Mamberamo Tengah', 'Mappi', 'Mimika', 'Nabire', 'Nduga', 'Paniai', 'Pegunungan Bintang', 'Puncak', 
    'Puncak Jaya', 'Sarmi', 'Supiori', 'Tolikara', 'Waropen', 'Yahukimo', 'Yalimo'
  ]
}

export default function WebinarRegistrationModal({
  isOpen,
  onClose,
  webinarSlug,
  onSuccess
}: WebinarRegistrationModalProps) {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'success' | 'info'
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  })
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    gender: '',
    date_of_birth: '',
    phone: '',
    provinsi: '',
    kabupaten: '',
    address: '',
    background: ''
  })

  const [provinceSearch, setProvinceSearch] = useState('')
  const [kabupatenSearch, setKabupatenSearch] = useState('')
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false)
  const [showKabupatenDropdown, setShowKabupatenDropdown] = useState(false)
  const provinceRef = useRef<HTMLDivElement>(null)
  const kabupatenRef = useRef<HTMLDivElement>(null)

  // Pre-fill form if user is logged in
  useEffect(() => {
    if (isOpen && user && profile) {
      const loadUserData = async () => {
        try {
          // Get participant data if exists
          const { data: participant } = await supabase
            .from('participants')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle()

          setFormData(prev => ({
            ...prev,
            email: profile.email || prev.email,
            full_name: profile.full_name || prev.full_name,
            phone: (profile as any).phone || participant?.phone || prev.phone,
            gender: (profile as any).gender || participant?.gender || prev.gender,
            date_of_birth: participant?.date_of_birth || prev.date_of_birth,
            provinsi: (profile as any).provinsi || participant?.provinsi || prev.provinsi,
            kabupaten: (profile as any).kabupaten || participant?.kabupaten || prev.kabupaten,
            address: (profile as any).address || participant?.address || prev.address,
            background: participant?.background || prev.background
          }))

          if ((profile as any).provinsi) {
            setProvinceSearch((profile as any).provinsi)
          }
          if ((profile as any).kabupaten) {
            setKabupatenSearch((profile as any).kabupaten)
          }
        } catch (err) {
          console.error('Error loading user data:', err)
        }
      }

      loadUserData()
    }
  }, [isOpen, user, profile])
  
  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (provinceRef.current && !provinceRef.current.contains(event.target as Node)) {
        setShowProvinceDropdown(false)
      }
      if (kabupatenRef.current && !kabupatenRef.current.contains(event.target as Node)) {
        setShowKabupatenDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredProvinces = provinces.filter(p =>
    p.toLowerCase().includes(provinceSearch.toLowerCase())
  )

  const filteredKabupaten = formData.provinsi && kabupatenKota[formData.provinsi]
    ? kabupatenKota[formData.provinsi].filter(k =>
        k.toLowerCase().includes(kabupatenSearch.toLowerCase())
      )
    : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`/api/webinars/${webinarSlug}/register-guest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.error || 'Gagal mendaftar'
        setError(errorMessage)
        setLoading(false)
        return
      }

      // Check if user already registered
      if (data.alreadyRegistered) {
        setSuccessModal({
          isOpen: true,
          title: 'Sudah Terdaftar',
          message: 'Anda sudah terdaftar untuk webinar ini. Silakan login untuk melihat detail pendaftaran atau cek email Anda untuk informasi lengkap tentang pendaftaran.',
          type: 'info'
        })
        setLoading(false)
        return
      }

      // If new user, try to auto-login
      if (!data.isExistingUser && data.defaultPassword) {
        try {
          // Auto-login with the default password
          await signIn(formData.email, data.defaultPassword)
          // Login successful, refresh to update auth state
          window.location.reload()
          return
        } catch (loginErr) {
          console.error('Auto-login failed:', loginErr)
          // Continue to show success message even if auto-login fails
        }
      }

      // Show success message with modal
      if (data.isExistingUser) {
        setSuccessModal({
          isOpen: true,
          title: 'Pendaftaran Webinar Berhasil!',
          message: 'Email Anda sudah terdaftar di sistem kami. Anda berhasil terdaftar untuk webinar ini. Silakan login dengan akun yang sudah ada untuk mengakses webinar dan mengunduh sertifikat. Lupa Password? Klik "Lupa Password" di halaman login. Password baru akan dikirim ke email Anda.',
          type: 'success'
        })
      } else {
        setSuccessModal({
          isOpen: true,
          title: 'Pendaftaran Berhasil!',
          message: 'Akun baru telah dibuat dan Anda berhasil terdaftar untuk webinar ini. Silakan cek email Anda untuk mendapatkan informasi login (email & password default) dan konfirmasi pendaftaran webinar. PENTING: Simpan password Anda dengan aman untuk login dan mengunduh sertifikat! Jika lupa mencatat password, cek email atau gunakan fitur "Lupa Password" di halaman login.',
          type: 'success'
        })
      }
      
      setLoading(false)
    } catch (err: any) {
      console.error('Registration error:', err)
      const errorMessage = err.message || 'Terjadi kesalahan saat mendaftar'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCloseSuccessModal = () => {
    setSuccessModal({ isOpen: false, title: '', message: '', type: 'success' })
    onSuccess()
    onClose()
    // Refresh page to update registration status
    window.location.reload()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-red-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-2xl font-bold">Daftar Webinar</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Important Notice - Compact Modern Design */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-blue-200/50 shadow-md p-4">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/15 to-purple-400/15 rounded-full blur-xl"></div>
            
            <div className="relative flex items-start gap-3">
              {/* Icon Container */}
              <div className="flex-shrink-0">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-2 shadow-sm">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1.5">
                  ⚡ Penting: Pastikan Data yang Diisi Benar
                </h3>
                <p className="text-xs text-gray-700 leading-relaxed mb-2">
                  Data akan digunakan untuk <span className="font-semibold text-blue-600">penerbitan sertifikat</span> dan <span className="font-semibold text-purple-600">pengiriman goodies</span>. Pastikan nama, email, dan alamat lengkap Anda benar!
                </p>
                
                {/* Feature Icons - Compact */}
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5 bg-white/70 backdrop-blur-sm rounded-md px-2 py-1 border border-blue-100">
                    <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-xs font-medium text-gray-700">Sertifikat</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/70 backdrop-blur-sm rounded-md px-2 py-1 border border-purple-100">
                    <svg className="w-3.5 h-3.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className="text-xs font-medium text-gray-700">Goodies</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Informasi Personal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Informasi Personal</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  No WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Kelamin
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Pilih</option>
                  <option value="male">Laki-laki</option>
                  <option value="female">Perempuan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latar Belakang
                </label>
                <select
                  value={formData.background}
                  onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Pilih</option>
                  <option value="student">Mahasiswa</option>
                  <option value="fresh_graduate">Fresh Graduate</option>
                  <option value="teacher">Guru</option>
                  <option value="lecturer">Dosen</option>
                  <option value="professional">Profesional</option>
                  <option value="entrepreneur">Entrepreneur</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lokasi */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Lokasi</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div ref={provinceRef} className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provinsi
                </label>
                <input
                  type="text"
                  value={provinceSearch}
                  onChange={(e) => {
                    setProvinceSearch(e.target.value)
                    setShowProvinceDropdown(true)
                  }}
                  onFocus={() => setShowProvinceDropdown(true)}
                  placeholder="Cari provinsi..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {showProvinceDropdown && filteredProvinces.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredProvinces.map((province) => (
                      <button
                        key={province}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, provinsi: province })
                          setProvinceSearch(province)
                          setShowProvinceDropdown(false)
                          setKabupatenSearch('')
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        {province}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div ref={kabupatenRef} className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kabupaten/Kota
                </label>
                <input
                  type="text"
                  value={kabupatenSearch}
                  onChange={(e) => {
                    setKabupatenSearch(e.target.value)
                    setShowKabupatenDropdown(true)
                  }}
                  onFocus={() => {
                    if (formData.provinsi) setShowKabupatenDropdown(true)
                  }}
                  placeholder={formData.provinsi ? "Cari kabupaten/kota..." : "Pilih provinsi terlebih dahulu"}
                  disabled={!formData.provinsi}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                />
                {showKabupatenDropdown && filteredKabupaten.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredKabupaten.map((kab) => (
                      <button
                        key={kab}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, kabupaten: kab })
                          setKabupatenSearch(kab)
                          setShowKabupatenDropdown(false)
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        {kab}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alamat Lengkap
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mendaftar...
                </>
              ) : (
                'Daftar Webinar'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Success/Info Modal */}
      {successModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start space-x-4">
              <div className={`flex-shrink-0 ${successModal.type === 'success' ? 'text-green-500' : 'text-blue-500'}`}>
                {successModal.type === 'success' ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <Info className="h-6 w-6" />
                )}
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-semibold mb-2 ${successModal.type === 'success' ? 'text-green-800' : 'text-blue-800'}`}>
                  {successModal.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  {successModal.message}
                </p>
                <div className="flex justify-end">
                  <button
                    onClick={handleCloseSuccessModal}
                    className={`px-6 py-2 text-sm font-medium rounded-md text-white ${
                      successModal.type === 'success' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors`}
                  >
                    Mengerti
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

