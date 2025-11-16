'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { CheckCircle, ChevronDown, ChevronUp, Search } from 'lucide-react'
import { useNotification } from '@/components/ui/Notification'

// Indonesia provinces data (sama dengan trainer profile)
const provinces = [
  'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau', 'Jambi',
  'Sumatera Selatan', 'Bangka Belitung', 'Bengkulu', 'Lampung', 'DKI Jakarta',
  'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur', 'Banten',
  'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'Kalimantan Barat',
  'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara',
  'Sulawesi Utara', 'Sulawesi Tengah', 'Sulawesi Selatan', 'Sulawesi Tenggara',
  'Gorontalo', 'Sulawesi Barat', 'Maluku', 'Maluku Utara', 'Papua Barat', 'Papua'
]

// Indonesia kabupaten/kota data (sama dengan trainer profile)
const kabupatenKota = {
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

export default function EditUserProfilePage() {
  const router = useRouter()
  const { profile } = useAuth()
  const { addNotification } = useNotification()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form data lengkap seperti jalur referral
  const [formData, setFormData] = useState({
    background: '',
    full_name: '',
    email: '',
    gender: '',
    date_of_birth: '',
    whatsapp: '',
    provinsi: '',
    kabupaten: '',
    alamat_lengkap: '',
    instansi: '',
    jabatan: '',
    jenjang: '',
    career_info: '',
    education: '',
    education_status: '',
    employment_status: '',
    it_background: '',
    disability: '',
    program_source: [] as string[],
    emergency_contact: '',
    emergency_phone: '',
    consent_privacy: false,
    consent_contact: false,
    consent_terms: false
  })

  const [accordionStates, setAccordionStates] = useState({
    personal: true,
    location: false,
    career: false,
    other: false
  })

  // Dropdown states
  const [provinceSearch, setProvinceSearch] = useState('')
  const [kabupatenSearch, setKabupatenSearch] = useState('')
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false)
  const [showKabupatenDropdown, setShowKabupatenDropdown] = useState(false)
  const provinceRef = useRef<HTMLDivElement>(null)
  const kabupatenRef = useRef<HTMLDivElement>(null)

  // Program source options
  const programSourceOptions = [
    'Media Sosial (Instagram, Facebook, TikTok, dll)',
    'Website/Google Search',
    'Rekomendasi Teman/Keluarga',
    'Email Marketing',
    'Event/Seminar',
    'Lainnya'
  ]

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const { data: authUser } = await supabase.auth.getUser()
        const userId = authUser?.user?.id
        if (!userId) {
          router.push('/register')
          return
        }
        const [{ data: userProfile }, { data: participant }] = await Promise.all([
          supabase
            .from('user_profiles')
            .select('full_name, email, phone, gender, address, provinsi, kabupaten')
            .eq('id', userId)
            .maybeSingle(),
          supabase
            .from('participants')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle()
        ])

        const prov = (userProfile as any)?.provinsi || (participant as any)?.provinsi || ''
        const kab = (userProfile as any)?.kabupaten || (participant as any)?.kabupaten || ''

        setFormData(prev => ({
          ...prev,
          full_name: (userProfile as any)?.full_name || '',
          email: (userProfile as any)?.email || '',
          gender: (userProfile as any)?.gender || (participant as any)?.gender || '',
          date_of_birth: (participant as any)?.date_of_birth || '',
          whatsapp: (participant as any)?.phone || (userProfile as any)?.phone || '',
          provinsi: prov,
          kabupaten: kab,
          alamat_lengkap: (userProfile as any)?.address || (participant as any)?.address || '',
          instansi: (participant as any)?.company || '',
          jabatan: (participant as any)?.position || '',
          jenjang: (userProfile as any)?.jenjang || '',
          emergency_contact: (participant as any)?.emergency_contact_name || '',
          emergency_phone: (participant as any)?.emergency_contact_phone || '',
          background: (participant as any)?.background || '',
          career_info: (participant as any)?.career_info || '',
          education: (participant as any)?.education || '',
          education_status: (participant as any)?.education_status || '',
          employment_status: (participant as any)?.employment_status || '',
          it_background: (participant as any)?.it_background || '',
          disability: (participant as any)?.disability || '',
          program_source: (participant as any)?.program_source ? JSON.parse((participant as any).program_source) : [],
          consent_privacy: true,
          consent_contact: true,
          consent_terms: true
        }))
        setProvinceSearch(prov)
        setKabupatenSearch(kab)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (provinceRef.current && !provinceRef.current.contains(event.target as Node)) {
        if (showProvinceDropdown) {
          setShowProvinceDropdown(false)
        }
      }
      if (kabupatenRef.current && !kabupatenRef.current.contains(event.target as Node)) {
        if (showKabupatenDropdown) {
          setShowKabupatenDropdown(false)
        }
      }
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProvinceDropdown, showKabupatenDropdown])

  const filteredProvinces = provinceSearch.trim()
    ? provinces.filter(province =>
        province.toLowerCase().includes(provinceSearch.toLowerCase())
      )
    : provinces

  const getKabupatenOptions = () => {
    if (!formData.provinsi) return []
    return kabupatenKota[formData.provinsi as keyof typeof kabupatenKota] || []
  }

  const filteredKabupaten = getKabupatenOptions().filter(kabupaten =>
    kabupaten.toLowerCase().includes(kabupatenSearch.toLowerCase())
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (name === 'program_source') {
      const checkbox = e.target as HTMLInputElement
      setFormData(prev => ({
        ...prev,
        program_source: checkbox.checked 
          ? [...prev.program_source, value]
          : prev.program_source.filter(item => item !== value)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }))
    }
  }

  const handleProvinceSelect = (province: string) => {
    setFormData(prev => ({
      ...prev,
      provinsi: province,
      kabupaten: ''
    }))
    setProvinceSearch(province)
    setKabupatenSearch('')
    setShowProvinceDropdown(false)
  }

  const handleKabupatenSelect = (kabupaten: string) => {
    setFormData(prev => ({
      ...prev,
      kabupaten: kabupaten
    }))
    setKabupatenSearch(kabupaten)
    setShowKabupatenDropdown(false)
  }

  const toggleAccordion = (section: keyof typeof accordionStates) => {
    setAccordionStates(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: authUser } = await supabase.auth.getUser()
    const userId = authUser?.user?.id
    if (!userId) return

    // Validasi sama seperti jalur referral
    if (!formData.full_name || !formData.email || !formData.gender || !formData.date_of_birth || !formData.whatsapp || !formData.provinsi) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Mohon lengkapi semua field yang wajib diisi pada Informasi Personal'
      })
      return
    }
    if (!formData.education || !formData.education_status || !formData.employment_status) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Mohon lengkapi semua field yang wajib diisi pada Informasi Karier dan Pendidikan'
      })
      return
    }
    if (!formData.it_background || !formData.disability || formData.program_source.length === 0) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Mohon lengkapi semua field yang wajib diisi pada Informasi Lainnya'
      })
      return
    }
    if (!formData.consent_privacy || !formData.consent_contact || !formData.consent_terms) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Mohon centang semua pernyataan persetujuan'
      })
      return
    }

    try {
      setSaving(true)
      // Alamat komposit
      const addressComposite = `${formData.provinsi}, ${formData.kabupaten}`.trim()
      
      // Upsert user_profiles
      await (supabase as any)
        .from('user_profiles')
        .upsert({
          id: userId,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.whatsapp,
          gender: formData.gender,
          address: formData.alamat_lengkap || addressComposite,
          provinsi: formData.provinsi,
          kabupaten: formData.kabupaten,
          jenjang: formData.jenjang
        })

      // Upsert participants
      const { data: existingParticipant } = await supabase
        .from('participants')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      const participantPayload = {
        user_id: userId,
        name: formData.full_name,
        email: formData.email,
        phone: formData.whatsapp,
        address: formData.alamat_lengkap || addressComposite,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        company: formData.instansi,
        position: formData.jabatan,
        emergency_contact_name: formData.emergency_contact,
        emergency_contact_phone: formData.emergency_phone,
        background: formData.background,
        career_info: formData.career_info,
        education: formData.education,
        education_status: formData.education_status,
        employment_status: formData.employment_status,
        it_background: formData.it_background,
        disability: formData.disability,
        program_source: JSON.stringify(formData.program_source),
        provinsi: formData.provinsi,
        kabupaten: formData.kabupaten,
        status: 'active' as const
      }

      if (existingParticipant?.id) {
        await (supabase as any)
          .from('participants')
          .update(participantPayload)
          .eq('id', existingParticipant.id)
      } else {
        await (supabase as any).from('participants').insert(participantPayload)
      }

      addNotification({
        type: 'success',
        title: 'Berhasil',
        message: 'Profil berhasil disimpan'
      })

      // Kembali ke tujuan jika ada
      try {
        const params = new URLSearchParams(window.location.search)
        const returnUrl = params.get('return')
        if (returnUrl) {
          router.push(returnUrl)
          return
        }
      } catch {}
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error saving profile:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Gagal menyimpan profil'
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat profil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-primary-600 font-semibold">Profil Saya</span>
            <CheckCircle className="h-5 w-5 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Lengkapi Data Peserta</h1>
          <p className="text-gray-600 mt-1">
            Lengkapi data untuk mendapatkan statistik pelatihan yang akurat.
          </p>
          <p className="text-red-600 text-sm mt-1">* Wajib diisi.</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informasi Personal */}
            <div className="border border-gray-200 rounded-lg">
              <button
                type="button"
                onClick={() => toggleAccordion('personal')}
                className="w-full px-6 py-4 text-left flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-t-lg transition-colors"
              >
                <h3 className="font-semibold text-gray-900">Informasi Personal</h3>
                {accordionStates.personal ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              {accordionStates.personal && (
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama lengkap *
                    </label>
                    <p className="text-sm text-gray-500 mb-2">
                      Nama ini akan digunakan untuk sertifikat kelulusan. Pastikan penulisannya sudah benar.
                    </p>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email aktif *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      readOnly
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      placeholder="Masukkan email aktif"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jenis kelamin *
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="gender"
                          value="male"
                          checked={formData.gender === 'male'}
                          onChange={handleInputChange}
                          className="mr-2"
                        />
                        Laki-laki
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="gender"
                          value="female"
                          checked={formData.gender === 'female'}
                          onChange={handleInputChange}
                          className="mr-2"
                        />
                        Perempuan
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Lahir *
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      No WhatsApp *
                    </label>
                    <input
                      type="tel"
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Latar belakangmu *
                    </label>
                    <select
                      name="background"
                      value={formData.background}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Pilih latar belakang</option>
                      <option value="student">Mahasiswa</option>
                      <option value="fresh_graduate">Fresh Graduate</option>
                      <option value="professional">Profesional</option>
                      <option value="entrepreneur">Entrepreneur</option>
                      <option value="other">Lainnya</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Lokasi */}
            <div className="border border-gray-200 rounded-lg">
              <button
                type="button"
                onClick={() => toggleAccordion('location')}
                className="w-full px-6 py-4 text-left flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <h3 className="font-semibold text-gray-900">Lokasi</h3>
                {accordionStates.location ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              {accordionStates.location && (
                <div className="p-6 space-y-4">
                  {/* Provinsi */}
                  <div ref={provinceRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Provinsi *
                    </label>
                    <div className="relative">
                      <div className="relative">
                        <input
                          type="text"
                          value={provinceSearch}
                          onChange={(e) => setProvinceSearch(e.target.value)}
                          onFocus={() => setShowProvinceDropdown(true)}
                          placeholder="Cari provinsi..."
                          required
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      </div>
                      {showProvinceDropdown && filteredProvinces.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredProvinces.map((province) => (
                            <div
                              key={province}
                              onClick={() => handleProvinceSelect(province)}
                              className="px-4 py-2 hover:bg-primary-50 cursor-pointer transition-colors"
                            >
                              {province}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Kabupaten */}
                  <div ref={kabupatenRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kabupaten/Kota *
                    </label>
                    <div className="relative">
                      <div className="relative">
                        <input
                          type="text"
                          value={kabupatenSearch}
                          onChange={(e) => setKabupatenSearch(e.target.value)}
                          onFocus={() => setShowKabupatenDropdown(true)}
                          placeholder="Cari kabupaten/kota..."
                          required
                          disabled={!formData.provinsi}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      </div>
                      {showKabupatenDropdown && filteredKabupaten.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredKabupaten.map((kabupaten) => (
                            <div
                              key={kabupaten}
                              onClick={() => handleKabupatenSelect(kabupaten)}
                              className="px-4 py-2 hover:bg-primary-50 cursor-pointer transition-colors"
                            >
                              {kabupaten}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alamat Lengkap (Opsional)
                    </label>
                    <textarea
                      name="alamat_lengkap"
                      value={formData.alamat_lengkap}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Masukkan alamat lengkap (Jalan, RT/RW, Kelurahan, Kecamatan)"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Informasi Karier dan Pendidikan */}
            <div className="border border-gray-200 rounded-lg">
              <button
                type="button"
                onClick={() => toggleAccordion('career')}
                className="w-full px-6 py-4 text-left flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <h3 className="font-semibold text-gray-900">Informasi Karier dan Pendidikan</h3>
                {accordionStates.career ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              {accordionStates.career && (
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pendidikan Terakhir *
                    </label>
                    <select
                      name="education"
                      value={formData.education}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Pilih Pendidikan Terakhir</option>
                      <option value="SD">SD (Sekolah Dasar)</option>
                      <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                      <option value="SMA">SMA (Sekolah Menengah Atas)</option>
                      <option value="SMK">SMK (Sekolah Menengah Kejuruan)</option>
                      <option value="D1">D1 (Diploma 1)</option>
                      <option value="D2">D2 (Diploma 2)</option>
                      <option value="D3">D3 (Diploma 3)</option>
                      <option value="D4">D4 (Diploma 4)</option>
                      <option value="S1">S1 (Sarjana)</option>
                      <option value="S2">S2 (Magister)</option>
                      <option value="S3">S3 (Doktor)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status Pendidikan *
                    </label>
                    <select
                      name="education_status"
                      value={formData.education_status}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Pilih Status Pendidikan</option>
                      <option value="sedang">Sedang Menempuh Pendidikan</option>
                      <option value="tidak">Tidak Menempuh Pendidikan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status Pekerjaan *
                    </label>
                    <select
                      name="employment_status"
                      value={formData.employment_status}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Pilih Status Pekerjaan</option>
                      <option value="bekerja">Sedang Bekerja</option>
                      <option value="tidak_bekerja">Tidak Bekerja</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instansi/Perusahaan
                    </label>
                    <input
                      type="text"
                      name="instansi"
                      value={formData.instansi}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Nama instansi/perusahaan"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jabatan/Posisi
                    </label>
                    <input
                      type="text"
                      name="jabatan"
                      value={formData.jabatan}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Jabatan atau posisi Anda"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jenjang
                    </label>
                    <select
                      name="jenjang"
                      value={formData.jenjang}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Pilih Jenjang</option>
                      <option value="TK">TK</option>
                      <option value="SD">SD</option>
                      <option value="SMP">SMP</option>
                      <option value="SMA">SMA</option>
                      <option value="Universitas">Universitas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Informasi Karier (Opsional)
                    </label>
                    <textarea
                      name="career_info"
                      value={formData.career_info}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Ceritakan tentang karier dan pengalaman kerja Anda"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Informasi Lainnya */}
            <div className="border border-gray-200 rounded-lg">
              <button
                type="button"
                onClick={() => toggleAccordion('other')}
                className="w-full px-6 py-4 text-left flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-b-lg transition-colors"
              >
                <h3 className="font-semibold text-gray-900">Informasi Lainnya</h3>
                {accordionStates.other ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              {accordionStates.other && (
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apakah kamu memiliki pemahaman dasar/latar belakang di bidang IT? *
                    </label>
                    <select
                      name="it_background"
                      value={formData.it_background}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Pilih Jawaban</option>
                      <option value="ya">Ya</option>
                      <option value="tidak">Tidak</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apakah kamu penyandang disabilitas? *
                    </label>
                    <select
                      name="disability"
                      value={formData.disability}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Pilih Jawaban</option>
                      <option value="ya">Ya</option>
                      <option value="tidak">Tidak</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dari mana kamu mengetahui program ini? * (bisa lebih dari 1)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {programSourceOptions.map((option, index) => (
                        <label key={index} className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
                          <input
                            type="checkbox"
                            name="program_source"
                            value={option}
                            checked={formData.program_source.includes(option)}
                            onChange={handleInputChange}
                            className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kontak Darurat
                    </label>
                    <input
                      type="text"
                      name="emergency_contact"
                      value={formData.emergency_contact}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-2"
                      placeholder="Nama kontak darurat"
                    />
                    <input
                      type="tel"
                      name="emergency_phone"
                      value={formData.emergency_phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Nomor telepon kontak darurat"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Persetujuan */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Pernyataan Persetujuan Kebijakan Privacy *
              </h3>

              <div className="space-y-3">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="consent_privacy"
                    checked={formData.consent_privacy}
                    onChange={handleInputChange}
                    className="mt-1"
                    required
                  />
                  <span className="text-sm text-gray-700">
                    Dengan menyimpan profil ini, saya setuju penggunaan data sesuai Privacy Policy.
                  </span>
                </label>

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="consent_contact"
                    checked={formData.consent_contact}
                    onChange={handleInputChange}
                    className="mt-1"
                    required
                  />
                  <span className="text-sm text-gray-700">
                    Saya bersedia dihubungi terkait kebutuhan program.
                  </span>
                </label>

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="consent_terms"
                    checked={formData.consent_terms}
                    onChange={handleInputChange}
                    className="mt-1"
                    required
                  />
                  <span className="text-sm text-gray-700">
                    Saya menyetujui Terms of Use dan memastikan informasi yang saya sampaikan benar.
                  </span>
                </label>
              </div>
            </div>

            {/* Save */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Menyimpan...' : 'Simpan Profil'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
