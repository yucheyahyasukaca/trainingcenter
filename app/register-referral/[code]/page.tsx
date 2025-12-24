'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { CheckCircle, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useNotification } from '@/components/ui/Notification'
import { generateWelcomeEmail } from '@/lib/email-templates'
import { kecamatanData, getKecamatanByKabupatenKota } from '@/lib/data/kecamatan-indonesia'

interface Program {
  id: string
  title: string
  description: string
  category: string
  price: number
  start_date: string
  end_date: string
  max_participants: number
  current_participants: number
  trainer_id: string
  trainer: {
    full_name: string
    email: string
  }
}

interface ReferralData {
  id: string
  code: string
  description: string
  trainer_id: string
  discount_percentage: number
  discount_amount: number
}

export default function RegisterReferralPage({ params }: { params: { code: string } }) {
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()
  const { addNotification } = useNotification()

  const [program, setProgram] = useState<Program | null>(null)
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const referralCode = params.code

  // Form data
  const [formData, setFormData] = useState({
    // Personal Information
    background: '',
    full_name: '',
    email: '',
    gender: '',
    date_of_birth: '',
    whatsapp: '',
    province: '',
    city: '',
    district: '',

    // Career & Education
    education: '',
    education_status: '',
    employment_status: '',

    // Other Information
    it_background: '',
    disability: '',
    program_source: [] as string[],

    // Consent
    consent_privacy: false,
    consent_contact: false,
    consent_terms: false
  })

  // Accordion states
  const [accordionStates, setAccordionStates] = useState({
    personal: true,
    career: false,
    other: false
  })

  // Custom dropdown states
  const [isBackgroundDropdownOpen, setIsBackgroundDropdownOpen] = useState(false)
  const [backgroundSearchTerm, setBackgroundSearchTerm] = useState('')
  const [isEducationDropdownOpen, setIsEducationDropdownOpen] = useState(false)
  const [educationSearchTerm, setEducationSearchTerm] = useState('')

  // Location data
  const [provinces, setProvinces] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [districts, setDistricts] = useState<any[]>([])

  // Indonesia provinces data
  const indonesiaProvinces = [
    { id: 'aceh', name: 'Aceh' },
    { id: 'sumatera-utara', name: 'Sumatera Utara' },
    { id: 'sumatera-barat', name: 'Sumatera Barat' },
    { id: 'riau', name: 'Riau' },
    { id: 'kepulauan-riau', name: 'Kepulauan Riau' },
    { id: 'jambi', name: 'Jambi' },
    { id: 'sumatera-selatan', name: 'Sumatera Selatan' },
    { id: 'bangka-belitung', name: 'Kepulauan Bangka Belitung' },
    { id: 'bengkulu', name: 'Bengkulu' },
    { id: 'lampung', name: 'Lampung' },
    { id: 'dki-jakarta', name: 'DKI Jakarta' },
    { id: 'jawa-barat', name: 'Jawa Barat' },
    { id: 'jawa-tengah', name: 'Jawa Tengah' },
    { id: 'di-yogyakarta', name: 'DI Yogyakarta' },
    { id: 'jawa-timur', name: 'Jawa Timur' },
    { id: 'banten', name: 'Banten' },
    { id: 'bali', name: 'Bali' },
    { id: 'nusa-tenggara-barat', name: 'Nusa Tenggara Barat' },
    { id: 'nusa-tenggara-timur', name: 'Nusa Tenggara Timur' },
    { id: 'kalimantan-barat', name: 'Kalimantan Barat' },
    { id: 'kalimantan-tengah', name: 'Kalimantan Tengah' },
    { id: 'kalimantan-selatan', name: 'Kalimantan Selatan' },
    { id: 'kalimantan-timur', name: 'Kalimantan Timur' },
    { id: 'kalimantan-utara', name: 'Kalimantan Utara' },
    { id: 'sulawesi-utara', name: 'Sulawesi Utara' },
    { id: 'sulawesi-tengah', name: 'Sulawesi Tengah' },
    { id: 'sulawesi-selatan', name: 'Sulawesi Selatan' },
    { id: 'sulawesi-tenggara', name: 'Sulawesi Tenggara' },
    { id: 'gorontalo', name: 'Gorontalo' },
    { id: 'sulawesi-barat', name: 'Sulawesi Barat' },
    { id: 'maluku', name: 'Maluku' },
    { id: 'maluku-utara', name: 'Maluku Utara' },
    { id: 'papua-barat', name: 'Papua Barat' },
    { id: 'papua', name: 'Papua' },
    { id: 'papua-tengah', name: 'Papua Tengah' },
    { id: 'papua-pegunungan', name: 'Papua Pegunungan' },
    { id: 'papua-selatan', name: 'Papua Selatan' },
    { id: 'papua-barat-daya', name: 'Papua Barat Daya' }
  ]

  // Major cities data for each province
  const citiesData: { [key: string]: any[] } = {
    'dki-jakarta': [
      { id: 'jakarta-pusat', name: 'Jakarta Pusat' },
      { id: 'jakarta-utara', name: 'Jakarta Utara' },
      { id: 'jakarta-barat', name: 'Jakarta Barat' },
      { id: 'jakarta-selatan', name: 'Jakarta Selatan' },
      { id: 'jakarta-timur', name: 'Jakarta Timur' },
      { id: 'kepulauan-seribu', name: 'Kepulauan Seribu' }
    ],
    'jawa-barat': [
      { id: 'bandung', name: 'Bandung' },
      { id: 'bekasi', name: 'Bekasi' },
      { id: 'depok', name: 'Depok' },
      { id: 'bogor', name: 'Bogor' },
      { id: 'tangerang', name: 'Tangerang' },
      { id: 'cirebon', name: 'Cirebon' },
      { id: 'tasikmalaya', name: 'Tasikmalaya' },
      { id: 'sukabumi', name: 'Sukabumi' },
      { id: 'karawang', name: 'Karawang' },
      { id: 'purwakarta', name: 'Purwakarta' },
      { id: 'banjar', name: 'Banjar' },
      { id: 'cimahi', name: 'Cimahi' },
      { id: 'cianjur', name: 'Cianjur' },
      { id: 'garut', name: 'Garut' },
      { id: 'indramayu', name: 'Indramayu' },
      { id: 'kuningan', name: 'Kuningan' },
      { id: 'majalengka', name: 'Majalengka' },
      { id: 'pangandaran', name: 'Pangandaran' },
      { id: 'subang', name: 'Subang' },
      { id: 'sumedang', name: 'Sumedang' }
    ],
    'jawa-tengah': [
      { id: 'semarang', name: 'Semarang' },
      { id: 'surakarta', name: 'Surakarta' },
      { id: 'pekalongan', name: 'Pekalongan' },
      { id: 'salatiga', name: 'Salatiga' },
      { id: 'magelang', name: 'Magelang' },
      { id: 'tegal', name: 'Tegal' },
      { id: 'kudus', name: 'Kudus' },
      { id: 'purwokerto', name: 'Purwokerto' },
      { id: 'pati', name: 'Pati' },
      { id: 'boyolali', name: 'Boyolali' },
      { id: 'banjarnegara', name: 'Banjarnegara' },
      { id: 'batang', name: 'Batang' },
      { id: 'blora', name: 'Blora' },
      { id: 'brebes', name: 'Brebes' },
      { id: 'cilacap', name: 'Cilacap' },
      { id: 'demak', name: 'Demak' },
      { id: 'grobogan', name: 'Grobogan' },
      { id: 'jepara', name: 'Jepara' },
      { id: 'kendal', name: 'Kendal' },
      { id: 'klaten', name: 'Klaten' },
      { id: 'pemalang', name: 'Pemalang' },
      { id: 'purbalingga', name: 'Purbalingga' },
      { id: 'rembang', name: 'Rembang' },
      { id: 'sragen', name: 'Sragen' },
      { id: 'sukoharjo', name: 'Sukoharjo' },
      { id: 'temanggung', name: 'Temanggung' },
      { id: 'wonogiri', name: 'Wonogiri' },
      { id: 'wonosobo', name: 'Wonosobo' }
    ],
    'jawa-timur': [
      { id: 'surabaya', name: 'Surabaya' },
      { id: 'malang', name: 'Malang' },
      { id: 'kediri', name: 'Kediri' },
      { id: 'blitar', name: 'Blitar' },
      { id: 'probolinggo', name: 'Probolinggo' },
      { id: 'pasuruan', name: 'Pasuruan' },
      { id: 'mojokerto', name: 'Mojokerto' },
      { id: 'madiun', name: 'Madiun' },
      { id: 'batu', name: 'Batu' },
      { id: 'jember', name: 'Jember' },
      { id: 'bangkalan', name: 'Bangkalan' },
      { id: 'banyuwangi', name: 'Banyuwangi' },
      { id: 'bondowoso', name: 'Bondowoso' },
      { id: 'gresik', name: 'Gresik' },
      { id: 'jombang', name: 'Jombang' },
      { id: 'lamongan', name: 'Lamongan' },
      { id: 'lumajang', name: 'Lumajang' },
      { id: 'nganjuk', name: 'Nganjuk' },
      { id: 'ngawi', name: 'Ngawi' },
      { id: 'pacitan', name: 'Pacitan' },
      { id: 'pamekasan', name: 'Pamekasan' },
      { id: 'ponorogo', name: 'Ponorogo' },
      { id: 'sampang', name: 'Sampang' },
      { id: 'sidoarjo', name: 'Sidoarjo' },
      { id: 'situbondo', name: 'Situbondo' },
      { id: 'sumenep', name: 'Sumenep' },
      { id: 'trenggalek', name: 'Trenggalek' },
      { id: 'tuban', name: 'Tuban' },
      { id: 'tulungagung', name: 'Tulungagung' }
    ],
    'banten': [
      { id: 'serang', name: 'Serang' },
      { id: 'tangerang', name: 'Tangerang' },
      { id: 'cilegon', name: 'Cilegon' },
      { id: 'lebak', name: 'Lebak' },
      { id: 'pandeglang', name: 'Pandeglang' }
    ],
    'di-yogyakarta': [
      { id: 'yogyakarta', name: 'Yogyakarta' },
      { id: 'sleman', name: 'Sleman' },
      { id: 'bantul', name: 'Bantul' },
      { id: 'gunung-kidul', name: 'Gunung Kidul' },
      { id: 'kulon-progo', name: 'Kulon Progo' }
    ],
    'bali': [
      { id: 'denpasar', name: 'Denpasar' },
      { id: 'badung', name: 'Badung' },
      { id: 'gianyar', name: 'Gianyar' },
      { id: 'klungkung', name: 'Klungkung' },
      { id: 'bangli', name: 'Bangli' },
      { id: 'karangasem', name: 'Karangasem' },
      { id: 'buleleng', name: 'Buleleng' },
      { id: 'tabanan', name: 'Tabanan' },
      { id: 'jembrana', name: 'Jembrana' }
    ],
    'sumatera-utara': [
      { id: 'medan', name: 'Medan' },
      { id: 'binjai', name: 'Binjai' },
      { id: 'pematang-siantar', name: 'Pematang Siantar' },
      { id: 'tanjung-balai', name: 'Tanjung Balai' },
      { id: 'tebing-tinggi', name: 'Tebing Tinggi' },
      { id: 'sibolga', name: 'Sibolga' },
      { id: 'padang-sidempuan', name: 'Padang Sidempuan' },
      { id: 'gunung-sitoli', name: 'Gunung Sitoli' },
      { id: 'asahan', name: 'Asahan' },
      { id: 'batubara', name: 'Batubara' },
      { id: 'dairi', name: 'Dairi' },
      { id: 'deli-serdang', name: 'Deli Serdang' },
      { id: 'humbang-hasundutan', name: 'Humbang Hasundutan' },
      { id: 'karo', name: 'Karo' },
      { id: 'labuhan-batu', name: 'Labuhan Batu' },
      { id: 'langkat', name: 'Langkat' },
      { id: 'mandailing-natal', name: 'Mandailing Natal' },
      { id: 'nias', name: 'Nias' },
      { id: 'padang-lawas', name: 'Padang Lawas' },
      { id: 'pakpak-bharat', name: 'Pakpak Bharat' },
      { id: 'samosir', name: 'Samosir' },
      { id: 'serdang-bedagai', name: 'Serdang Bedagai' },
      { id: 'simalungun', name: 'Simalungun' },
      { id: 'tapanuli-selatan', name: 'Tapanuli Selatan' },
      { id: 'tapanuli-tengah', name: 'Tapanuli Tengah' },
      { id: 'tapanuli-utara', name: 'Tapanuli Utara' },
      { id: 'toba-samosir', name: 'Toba Samosir' }
    ],
    'sumatera-barat': [
      { id: 'padang', name: 'Padang' },
      { id: 'payakumbuh', name: 'Payakumbuh' },
      { id: 'bukittinggi', name: 'Bukittinggi' },
      { id: 'sawahlunto', name: 'Sawahlunto' },
      { id: 'solok', name: 'Solok' },
      { id: 'pariaman', name: 'Pariaman' },
      { id: 'agam', name: 'Agam' },
      { id: 'dharmasraya', name: 'Dharmasraya' },
      { id: 'kepulauan-mentawai', name: 'Kepulauan Mentawai' },
      { id: 'lima-puluh-kota', name: 'Lima Puluh Kota' },
      { id: 'padang-pariaman', name: 'Padang Pariaman' },
      { id: 'pasaman', name: 'Pasaman' },
      { id: 'pasaman-barat', name: 'Pasaman Barat' },
      { id: 'pesisir-selatan', name: 'Pesisir Selatan' },
      { id: 'sijunjung', name: 'Sijunjung' },
      { id: 'solok-selatan', name: 'Solok Selatan' },
      { id: 'tanah-datar', name: 'Tanah Datar' }
    ],
    'riau': [
      { id: 'pekanbaru', name: 'Pekanbaru' },
      { id: 'dumai', name: 'Dumai' },
      { id: 'bengkalis', name: 'Bengkalis' },
      { id: 'indragiri-hulu', name: 'Indragiri Hulu' },
      { id: 'indragiri-hilir', name: 'Indragiri Hilir' },
      { id: 'pelalawan', name: 'Pelalawan' },
      { id: 'kampar', name: 'Kampar' },
      { id: 'kepulauan-meranti', name: 'Kepulauan Meranti' },
      { id: 'kuantan-singingi', name: 'Kuantan Singingi' },
      { id: 'rokan-hilir', name: 'Rokan Hilir' },
      { id: 'rokan-hulu', name: 'Rokan Hulu' },
      { id: 'siak', name: 'Siak' }
    ],
    'sumatera-selatan': [
      { id: 'palembang', name: 'Palembang' },
      { id: 'prabumulih', name: 'Prabumulih' },
      { id: 'pagar-alam', name: 'Pagar Alam' },
      { id: 'lubuk-linggau', name: 'Lubuk Linggau' },
      { id: 'banyuasin', name: 'Banyuasin' },
      { id: 'ogan-komering-ulu', name: 'Ogan Komering Ulu' },
      { id: 'empang', name: 'Empang' },
      { id: 'lahat', name: 'Lahat' },
      { id: 'muara-enim', name: 'Muara Enim' },
      { id: 'musi-banyuasin', name: 'Musi Banyuasin' },
      { id: 'musi-rawas', name: 'Musi Rawas' },
      { id: 'ogan-ilir', name: 'Ogan Ilir' },
      { id: 'penukal-abab-lematang-ilir', name: 'Penukal Abab Lematang Ilir' }
    ],
    'lampung': [
      { id: 'bandar-lampung', name: 'Bandar Lampung' },
      { id: 'metro', name: 'Metro' },
      { id: 'lampung-selatan', name: 'Lampung Selatan' },
      { id: 'lampung-tengah', name: 'Lampung Tengah' },
      { id: 'lampung-utara', name: 'Lampung Utara' },
      { id: 'lampung-barat', name: 'Lampung Barat' },
      { id: 'lampung-timur', name: 'Lampung Timur' },
      { id: 'mesuji', name: 'Mesuji' },
      { id: 'pesawaran', name: 'Pesawaran' },
      { id: 'pringsewu', name: 'Pringsewu' },
      { id: 'tanggamus', name: 'Tanggamus' },
      { id: 'tulang-bawang', name: 'Tulang Bawang' },
      { id: 'tulang-bawang-barat', name: 'Tulang Bawang Barat' },
      { id: 'way-kanan', name: 'Way Kanan' }
    ],
    'aceh': [
      { id: 'banda-aceh', name: 'Banda Aceh' },
      { id: 'langsa', name: 'Langsa' },
      { id: 'lhokseumawe', name: 'Lhokseumawe' },
      { id: 'sabang', name: 'Sabang' },
      { id: 'subulussalam', name: 'Subulussalam' },
      { id: 'aceh-besar', name: 'Aceh Besar' },
      { id: 'aceh-barat', name: 'Aceh Barat' },
      { id: 'aceh-barat-daya', name: 'Aceh Barat Daya' },
      { id: 'aceh-selatan', name: 'Aceh Selatan' },
      { id: 'aceh-tenggara', name: 'Aceh Tenggara' },
      { id: 'aceh-tengah', name: 'Aceh Tengah' },
      { id: 'aceh-timur', name: 'Aceh Timur' },
      { id: 'aceh-utara', name: 'Aceh Utara' },
      { id: 'bener-meriah', name: 'Bener Meriah' },
      { id: 'bireuen', name: 'Bireuen' },
      { id: 'gayo-lues', name: 'Gayo Lues' },
      { id: 'nagan-raya', name: 'Nagan Raya' },
      { id: 'pidie', name: 'Pidie' },
      { id: 'pidie-jaya', name: 'Pidie Jaya' },
      { id: 'simeulue', name: 'Simeulue' }
    ],
    'jambi': [
      { id: 'jambi', name: 'Jambi' },
      { id: 'sungaipenuh', name: 'Sungaipenuh' },
      { id: 'batang-hari', name: 'Batang Hari' },
      { id: 'bungo', name: 'Bungo' },
      { id: 'kerinci', name: 'Kerinci' },
      { id: 'merangin', name: 'Merangin' },
      { id: 'muaro-jambi', name: 'Muaro Jambi' },
      { id: 'sarolangun', name: 'Sarolangun' },
      { id: 'tanjung-jabung-barat', name: 'Tanjung Jabung Barat' },
      { id: 'tanjung-jabung-timur', name: 'Tanjung Jabung Timur' },
      { id: 'tebo', name: 'Tebo' }
    ],
    'bengkulu': [
      { id: 'bengkulu', name: 'Bengkulu' },
      { id: 'bengkulu-selatan', name: 'Bengkulu Selatan' },
      { id: 'bengkulu-tengah', name: 'Bengkulu Tengah' },
      { id: 'bengkulu-utara', name: 'Bengkulu Utara' },
      { id: 'kaur', name: 'Kaur' },
      { id: 'kepahiang', name: 'Kepahiang' },
      { id: 'lebong', name: 'Lebong' },
      { id: 'muko-muko', name: 'Muko Muko' },
      { id: 'rejang-lebong', name: 'Rejang Lebong' },
      { id: 'seluma', name: 'Seluma' }
    ],
    'bangka-belitung': [
      { id: 'pangkalpinang', name: 'Pangkalpinang' },
      { id: 'bangka', name: 'Bangka' },
      { id: 'bangka-barat', name: 'Bangka Barat' },
      { id: 'bangka-selatan', name: 'Bangka Selatan' },
      { id: 'bangka-tengah', name: 'Bangka Tengah' },
      { id: 'belitung', name: 'Belitung' },
      { id: 'belitung-timur', name: 'Belitung Timur' }
    ],
    'kepulauan-riau': [
      { id: 'tanjungpinang', name: 'Tanjungpinang' },
      { id: 'batam', name: 'Batam' },
      { id: 'anambas', name: 'Anambas' },
      { id: 'bintan', name: 'Bintan' },
      { id: 'karimun', name: 'Karimun' },
      { id: 'kepulauan-lingga', name: 'Kepulauan Lingga' },
      { id: 'natuna', name: 'Natuna' }
    ],
    'nusa-tenggara-barat': [
      { id: 'mataram', name: 'Mataram' },
      { id: 'bima', name: 'Bima' },
      { id: 'dompu', name: 'Dompu' },
      { id: 'lombok-barat', name: 'Lombok Barat' },
      { id: 'lombok-tengah', name: 'Lombok Tengah' },
      { id: 'lombok-timur', name: 'Lombok Timur' },
      { id: 'lombok-utara', name: 'Lombok Utara' },
      { id: 'sumbawa', name: 'Sumbawa' },
      { id: 'sumbawa-barat', name: 'Sumbawa Barat' }
    ],
    'nusa-tenggara-timur': [
      { id: 'kupang', name: 'Kupang' },
      { id: 'alor', name: 'Alor' },
      { id: 'belu', name: 'Belu' },
      { id: 'ende', name: 'Ende' },
      { id: 'flores-timur', name: 'Flores Timur' },
      { id: 'kupang', name: 'Kupang' },
      { id: 'lembata', name: 'Lembata' },
      { id: 'manggarai', name: 'Manggarai' },
      { id: 'manggarai-barat', name: 'Manggarai Barat' },
      { id: 'manggarai-timur', name: 'Manggarai Timur' },
      { id: 'ngada', name: 'Ngada' },
      { id: 'nusa-tenggara-timur', name: 'Nusa Tenggara Timur' },
      { id: 'rote-ndao', name: 'Rote Ndao' },
      { id: 'sabu-raijua', name: 'Sabu Raijua' },
      { id: 'sikka', name: 'Sikka' },
      { id: 'sumba-barat', name: 'Sumba Barat' },
      { id: 'sumba-barat-daya', name: 'Sumba Barat Daya' },
      { id: 'sumba-tengah', name: 'Sumba Tengah' },
      { id: 'sumba-timur', name: 'Sumba Timur' },
      { id: 'timor-tengah-selatan', name: 'Timor Tengah Selatan' },
      { id: 'timor-tengah-utara', name: 'Timor Tengah Utara' }
    ],
    'kalimantan-barat': [
      { id: 'pontianak', name: 'Pontianak' },
      { id: 'singkawang', name: 'Singkawang' },
      { id: 'bengkayang', name: 'Bengkayang' },
      { id: 'kapuas-hulu', name: 'Kapuas Hulu' },
      { id: 'kayong-utara', name: 'Kayong Utara' },
      { id: 'ketapang', name: 'Ketapang' },
      { id: 'kubu-raya', name: 'Kubu Raya' },
      { id: 'landak', name: 'Landak' },
      { id: 'melawi', name: 'Melawi' },
      { id: 'mempawah', name: 'Mempawah' },
      { id: 'sambas', name: 'Sambas' },
      { id: 'sanggau', name: 'Sanggau' },
      { id: 'sekadau', name: 'Sekadau' },
      { id: 'sintang', name: 'Sintang' }
    ],
    'kalimantan-tengah': [
      { id: 'palangka-raya', name: 'Palangka Raya' },
      { id: 'barito-selatan', name: 'Barito Selatan' },
      { id: 'barito-timur', name: 'Barito Timur' },
      { id: 'barito-utara', name: 'Barito Utara' },
      { id: 'gunung-mas', name: 'Gunung Mas' },
      { id: 'kapuas', name: 'Kapuas' },
      { id: 'katingan', name: 'Katingan' },
      { id: 'kotawaringin-barat', name: 'Kotawaringin Barat' },
      { id: 'kotawaringin-timur', name: 'Kotawaringin Timur' },
      { id: 'lamandau', name: 'Lamandau' },
      { id: 'murung-raya', name: 'Murung Raya' },
      { id: 'pulang-pisau', name: 'Pulang Pisau' },
      { id: 'sukamara', name: 'Sukamara' },
      { id: 'seruyan', name: 'Seruyan' }
    ],
    'kalimantan-selatan': [
      { id: 'banjarmasin', name: 'Banjarmasin' },
      { id: 'banjarbaru', name: 'Banjarbaru' },
      { id: 'balangan', name: 'Balangan' },
      { id: 'banjar', name: 'Banjar' },
      { id: 'barito-kuala', name: 'Barito Kuala' },
      { id: 'hulu-sungai-selatan', name: 'Hulu Sungai Selatan' },
      { id: 'hulu-sungai-tengah', name: 'Hulu Sungai Tengah' },
      { id: 'hulu-sungai-utara', name: 'Hulu Sungai Utara' },
      { id: 'kotabaru', name: 'Kotabaru' },
      { id: 'tabalong', name: 'Tabalong' },
      { id: 'tanah-bumbu', name: 'Tanah Bumbu' },
      { id: 'tanah-laut', name: 'Tanah Laut' },
      { id: 'tapin', name: 'Tapin' }
    ],
    'kalimantan-timur': [
      { id: 'samarinda', name: 'Samarinda' },
      { id: 'balikpapan', name: 'Balikpapan' },
      { id: 'bontang', name: 'Bontang' },
      { id: 'berau', name: 'Berau' },
      { id: 'kutai-barat', name: 'Kutai Barat' },
      { id: 'kutai-kartanegara', name: 'Kutai Kartanegara' },
      { id: 'kutai-timur', name: 'Kutai Timur' },
      { id: 'paser', name: 'Paser' },
      { id: 'penajam-paser-utara', name: 'Penajam Paser Utara' }
    ],
    'kalimantan-utara': [
      { id: 'tarakan', name: 'Tarakan' },
      { id: 'bulungan', name: 'Bulungan' },
      { id: 'malinau', name: 'Malinau' },
      { id: 'nunukan', name: 'Nunukan' },
      { id: 'tana-tidung', name: 'Tana Tidung' }
    ],
    'sulawesi-utara': [
      { id: 'manado', name: 'Manado' },
      { id: 'bitung', name: 'Bitung' },
      { id: 'kotamobagu', name: 'Kotamobagu' },
      { id: 'tomohon', name: 'Tomohon' },
      { id: 'bolaang-mongondow', name: 'Bolaang Mongondow' },
      { id: 'bolaang-mongondow-selatan', name: 'Bolaang Mongondow Selatan' },
      { id: 'bolaang-mongondow-timur', name: 'Bolaang Mongondow Timur' },
      { id: 'bolaang-mongondow-utara', name: 'Bolaang Mongondow Utara' },
      { id: 'kepulauan-sangihe', name: 'Kepulauan Sangihe' },
      { id: 'kepulauan-siau-tagulandang-biaro', name: 'Kepulauan Siau Tagulandang Biaro' },
      { id: 'kepulauan-talaud', name: 'Kepulauan Talaud' },
      { id: 'minahasa', name: 'Minahasa' },
      { id: 'minahasa-selatan', name: 'Minahasa Selatan' },
      { id: 'minahasa-tenggara', name: 'Minahasa Tenggara' },
      { id: 'minahasa-utara', name: 'Minahasa Utara' }
    ],
    'sulawesi-tengah': [
      { id: 'palu', name: 'Palu' },
      { id: 'banggai', name: 'Banggai' },
      { id: 'banggai-kepulauan', name: 'Banggai Kepulauan' },
      { id: 'banggai-laut', name: 'Banggai Laut' },
      { id: 'buol', name: 'Buol' },
      { id: 'donggala', name: 'Donggala' },
      { id: 'morowali', name: 'Morowali' },
      { id: 'morowali-utara', name: 'Morowali Utara' },
      { id: 'parigi-moutong', name: 'Parigi Moutong' },
      { id: 'poso', name: 'Poso' },
      { id: 'sigi', name: 'Sigi' },
      { id: 'tojo-una-una', name: 'Tojo Una Una' },
      { id: 'toli-toli', name: 'Toli Toli' }
    ],
    'sulawesi-selatan': [
      { id: 'makassar', name: 'Makassar' },
      { id: 'parepare', name: 'Parepare' },
      { id: 'palopo', name: 'Palopo' },
      { id: 'bantaeng', name: 'Bantaeng' },
      { id: 'barru', name: 'Barru' },
      { id: 'bone', name: 'Bone' },
      { id: 'bulukumba', name: 'Bulukumba' },
      { id: 'enrekang', name: 'Enrekang' },
      { id: 'gowa', name: 'Gowa' },
      { id: 'jeneponto', name: 'Jeneponto' },
      { id: 'kepulauan-selayar', name: 'Kepulauan Selayar' },
      { id: 'luwu', name: 'Luwu' },
      { id: 'luwu-timur', name: 'Luwu Timur' },
      { id: 'luwu-utara', name: 'Luwu Utara' },
      { id: 'maros', name: 'Maros' },
      { id: 'pangkajene-dan-kepulauan', name: 'Pangkajene dan Kepulauan' },
      { id: 'pinrang', name: 'Pinrang' },
      { id: 'sidenreng-rappang', name: 'Sidenreng Rappang' },
      { id: 'sinjai', name: 'Sinjai' },
      { id: 'soppeng', name: 'Soppeng' },
      { id: 'takalar', name: 'Takalar' },
      { id: 'tana-toraja', name: 'Tana Toraja' },
      { id: 'toraja-utara', name: 'Toraja Utara' },
      { id: 'wajo', name: 'Wajo' }
    ],
    'sulawesi-tenggara': [
      { id: 'kendari', name: 'Kendari' },
      { id: 'baubau', name: 'Baubau' },
      { id: 'bombana', name: 'Bombana' },
      { id: 'buton', name: 'Buton' },
      { id: 'buton-selatan', name: 'Buton Selatan' },
      { id: 'buton-tengah', name: 'Buton Tengah' },
      { id: 'buton-utara', name: 'Buton Utara' },
      { id: 'kolaka', name: 'Kolaka' },
      { id: 'kolaka-timur', name: 'Kolaka Timur' },
      { id: 'kolaka-utara', name: 'Kolaka Utara' },
      { id: 'konawe', name: 'Konawe' },
      { id: 'konawe-kepulauan', name: 'Konawe Kepulauan' },
      { id: 'konawe-selatan', name: 'Konawe Selatan' },
      { id: 'konawe-utara', name: 'Konawe Utara' },
      { id: 'muna', name: 'Muna' },
      { id: 'muna-barat', name: 'Muna Barat' },
      { id: 'wakatobi', name: 'Wakatobi' }
    ],
    'gorontalo': [
      { id: 'gorontalo', name: 'Gorontalo' },
      { id: 'boalemo', name: 'Boalemo' },
      { id: 'bone-bolango', name: 'Bone Bolango' },
      { id: 'gorontalo-utara', name: 'Gorontalo Utara' },
      { id: 'gorontalo', name: 'Gorontalo' },
      { id: 'pohuwato', name: 'Pohuwato' }
    ],
    'sulawesi-barat': [
      { id: 'mamuju', name: 'Mamuju' },
      { id: 'mamuju-tengah', name: 'Mamuju Tengah' },
      { id: 'mamuju-utara', name: 'Mamuju Utara' },
      { id: 'mamuju-tenggara', name: 'Mamuju Tenggara' },
      { id: 'majene', name: 'Majene' },
      { id: 'polewali-mandar', name: 'Polewali Mandar' }
    ],
    'maluku': [
      { id: 'ambon', name: 'Ambon' },
      { id: 'tual', name: 'Tual' },
      { id: 'buru', name: 'Buru' },
      { id: 'buru-selatan', name: 'Buru Selatan' },
      { id: 'kepulauan-aru', name: 'Kepulauan Aru' },
      { id: 'kepulauan-tanimbar', name: 'Kepulauan Tanimbar' },
      { id: 'maluku-barat-daya', name: 'Maluku Barat Daya' },
      { id: 'maluku-tengah', name: 'Maluku Tengah' },
      { id: 'maluku-tenggara', name: 'Maluku Tenggara' },
      { id: 'maluku-tenggara-barat', name: 'Maluku Tenggara Barat' },
      { id: 'seram-bagian-barat', name: 'Seram Bagian Barat' },
      { id: 'seram-bagian-timur', name: 'Seram Bagian Timur' }
    ],
    'maluku-utara': [
      { id: 'sofifi', name: 'Sofifi' },
      { id: 'ternate', name: 'Ternate' },
      { id: 'tidore-kepulauan', name: 'Tidore Kepulauan' },
      { id: 'halmahera-barat', name: 'Halmahera Barat' },
      { id: 'halmahera-tengah', name: 'Halmahera Tengah' },
      { id: 'halmahera-utara', name: 'Halmahera Utara' },
      { id: 'halmahera-selatan', name: 'Halmahera Selatan' },
      { id: 'halmahera-timur', name: 'Halmahera Timur' },
      { id: 'kepulauan-sula', name: 'Kepulauan Sula' },
      { id: 'pulau-morotai', name: 'Pulau Morotai' }
    ],
    'papua-barat': [
      { id: 'manokwari', name: 'Manokwari' },
      { id: 'sorong', name: 'Sorong' },
      { id: 'fakfak', name: 'Fakfak' },
      { id: 'kaimana', name: 'Kaimana' },
      { id: 'manokwari-selatan', name: 'Manokwari Selatan' },
      { id: 'maybrat', name: 'Maybrat' },
      { id: 'pegunungan-arfak', name: 'Pegunungan Arfak' },
      { id: 'raja-ampat', name: 'Raja Ampat' },
      { id: 'sorong-selatan', name: 'Sorong Selatan' },
      { id: 'tambrauw', name: 'Tambrauw' },
      { id: 'teluk-bintuni', name: 'Teluk Bintuni' },
      { id: 'teluk-wondama', name: 'Teluk Wondama' }
    ],
    'papua': [
      { id: 'jayapura', name: 'Jayapura' },
      { id: 'merauke', name: 'Merauke' },
      { id: 'asmat', name: 'Asmat' },
      { id: 'biak-numfor', name: 'Biak Numfor' },
      { id: 'boven-digoel', name: 'Boven Digoel' },
      { id: 'deiyai', name: 'Deiyai' },
      { id: 'dogiyai', name: 'Dogiyai' },
      { id: 'intan-jaya', name: 'Intan Jaya' },
      { id: 'jayapura', name: 'Jayapura' },
      { id: 'jayawijaya', name: 'Jayawijaya' },
      { id: 'keerom', name: 'Keerom' },
      { id: 'kepulauan-yapen', name: 'Kepulauan Yapen' },
      { id: 'lanny-jaya', name: 'Lanny Jaya' },
      { id: 'mamberamo-raya', name: 'Mamberamo Raya' },
      { id: 'mamberamo-tengah', name: 'Mamberamo Tengah' },
      { id: 'mappi', name: 'Mappi' },
      { id: 'mimika', name: 'Mimika' },
      { id: 'nabire', name: 'Nabire' },
      { id: 'nduga', name: 'Nduga' },
      { id: 'paniai', name: 'Paniai' },
      { id: 'pegunungan-bintang', name: 'Pegunungan Bintang' },
      { id: 'puncak', name: 'Puncak' },
      { id: 'puncak-jaya', name: 'Puncak Jaya' },
      { id: 'sarmi', name: 'Sarmi' },
      { id: 'supiori', name: 'Supiori' },
      { id: 'tolikara', name: 'Tolikara' },
      { id: 'waropen', name: 'Waropen' },
      { id: 'yahukimo', name: 'Yahukimo' },
      { id: 'yalimo', name: 'Yalimo' }
    ],
    'papua-tengah': [
      { id: 'nabire', name: 'Nabire' },
      { id: 'deiyai', name: 'Deiyai' },
      { id: 'dogiyai', name: 'Dogiyai' },
      { id: 'intan-jaya', name: 'Intan Jaya' },
      { id: 'mimika', name: 'Mimika' },
      { id: 'puncak', name: 'Puncak' },
      { id: 'puncak-jaya', name: 'Puncak Jaya' }
    ],
    'papua-pegunungan': [
      { id: 'jayawijaya', name: 'Jayawijaya' },
      { id: 'lanny-jaya', name: 'Lanny Jaya' },
      { id: 'mamberamo-tengah', name: 'Mamberamo Tengah' },
      { id: 'nduga', name: 'Nduga' },
      { id: 'pegunungan-bintang', name: 'Pegunungan Bintang' },
      { id: 'tolikara', name: 'Tolikara' },
      { id: 'yalimo', name: 'Yalimo' }
    ],
    'papua-selatan': [
      { id: 'merauke', name: 'Merauke' },
      { id: 'asmat', name: 'Asmat' },
      { id: 'boven-digoel', name: 'Boven Digoel' },
      { id: 'mappi', name: 'Mappi' }
    ],
    'papua-barat-daya': [
      { id: 'sorong', name: 'Sorong' },
      { id: 'fakfak', name: 'Fakfak' },
      { id: 'kaimana', name: 'Kaimana' },
      { id: 'manokwari-selatan', name: 'Manokwari Selatan' },
      { id: 'maybrat', name: 'Maybrat' },
      { id: 'pegunungan-arfak', name: 'Pegunungan Arfak' },
      { id: 'raja-ampat', name: 'Raja Ampat' },
      { id: 'sorong-selatan', name: 'Sorong Selatan' },
      { id: 'tambrauw', name: 'Tambrauw' },
      { id: 'teluk-bintuni', name: 'Teluk Bintuni' },
      { id: 'teluk-wondama', name: 'Teluk Wondama' }
    ]
  }

  // Data Kecamatan untuk seluruh Indonesia (7000+ kecamatan)
  // Kecamatan diorganisir berdasarkan ID kabupaten/kota dari citiesData
  // Catatan: Data ini sangat besar, kecamatan ditambahkan untuk semua kabupaten/kota yang ada
  const districtsData: { [key: string]: any[] } = {
    'jakarta-pusat': [
      { id: 'gambir', name: 'Gambir' },
      { id: 'sawah-besar', name: 'Sawah Besar' },
      { id: 'kemayoran', name: 'Kemayoran' },
      { id: 'senen', name: 'Senen' },
      { id: 'cempaka-putih', name: 'Cempaka Putih' },
      { id: 'menteng', name: 'Menteng' },
      { id: 'tanah-abang', name: 'Tanah Abang' },
      { id: 'johar-baru', name: 'Johar Baru' }
    ],
    'jakarta-selatan': [
      { id: 'kebayoran-baru', name: 'Kebayoran Baru' },
      { id: 'kebayoran-lama', name: 'Kebayoran Lama' },
      { id: 'pancoran', name: 'Pancoran' },
      { id: 'cilandak', name: 'Cilandak' },
      { id: 'pasar-minggu', name: 'Pasar Minggu' },
      { id: 'jagakarsa', name: 'Jagakarsa' },
      { id: 'pesanggrahan', name: 'Pesanggrahan' },
      { id: 'tebet', name: 'Tebet' },
      { id: 'setiabudi', name: 'Setiabudi' },
      { id: 'mampang-prapatan', name: 'Mampang Prapatan' }
    ],
    'jakarta-utara': [
      { id: 'koja', name: 'Koja' },
      { id: 'kelapa-gading', name: 'Kelapa Gading' },
      { id: 'tanjung-priok', name: 'Tanjung Priok' },
      { id: 'pademangan', name: 'Pademangan' },
      { id: 'penjaringan', name: 'Penjaringan' },
      { id: 'cilincing', name: 'Cilincing' }
    ],
    'jakarta-barat': [
      { id: 'kebon-jeruk', name: 'Kebon Jeruk' },
      { id: 'kembangan', name: 'Kembangan' },
      { id: 'palmerah', name: 'Palmerah' },
      { id: 'grogol-petamburan', name: 'Grogol Petamburan' },
      { id: 'tambora', name: 'Tambora' },
      { id: 'kalideres', name: 'Kalideres' },
      { id: 'cengkareng', name: 'Cengkareng' }
    ],
    'jakarta-timur': [
      { id: 'matraman', name: 'Matraman' },
      { id: 'pulo-gadung', name: 'Pulo Gadung' },
      { id: 'jatinegara', name: 'Jatinegara' },
      { id: 'kramat-jati', name: 'Kramat Jati' },
      { id: 'pasar-rebo', name: 'Pasar Rebo' },
      { id: 'cipayung', name: 'Cipayung' },
      { id: 'makasar', name: 'Makasar' },
      { id: 'ciracas', name: 'Ciracas' },
      { id: 'cakung', name: 'Cakung' },
      { id: 'duren-sawit', name: 'Duren Sawit' }
    ],
    'bandung': [
      { id: 'coblong', name: 'Coblong' },
      { id: 'sukajadi', name: 'Sukajadi' },
      { id: 'cidadap', name: 'Cidadap' },
      { id: 'bandung-wetan', name: 'Bandung Wetan' },
      { id: 'bandung-kulon', name: 'Bandung Kulon' },
      { id: 'babakan-ciparay', name: 'Babakan Ciparay' },
      { id: 'bojongloa-kaler', name: 'Bojongloa Kaler' },
      { id: 'bojongloa-kidul', name: 'Bojongloa Kidul' },
      { id: 'cibeunying-kaler', name: 'Cibeunying Kaler' },
      { id: 'cibeunying-kidul', name: 'Cibeunying Kidul' },
      { id: 'cicendo', name: 'Cicendo' },
      { id: 'cimenyan', name: 'Cimenyan' },
      { id: 'cinambo', name: 'Cinambo' },
      { id: 'kiaracondong', name: 'Kiaracondong' },
      { id: 'lengkong', name: 'Lengkong' },
      { id: 'mandalajati', name: 'Mandalajati' },
      { id: 'rancamaya', name: 'Rancamaya' },
      { id: 'regol', name: 'Regol' },
      { id: 'sumur-bandung', name: 'Sumur Bandung' },
      { id: 'ujung-berung', name: 'Ujung Berung' }
    ],
    'surabaya': [
      { id: 'genteng', name: 'Genteng' },
      { id: 'bubutan', name: 'Bubutan' },
      { id: 'simokerto', name: 'Simokerto' },
      { id: 'tambaksari', name: 'Tambaksari' },
      { id: 'gubeng', name: 'Gubeng' },
      { id: 'gunung-anyar', name: 'Gunung Anyar' },
      { id: 'sukolilo', name: 'Sukolilo' },
      { id: 'mulyorejo', name: 'Mulyorejo' },
      { id: 'rungkut', name: 'Rungkut' },
      { id: 'wonokromo', name: 'Wonokromo' },
      { id: 'wonocolo', name: 'Wonocolo' },
      { id: 'wiyung', name: 'Wiyung' },
      { id: 'karang-pilang', name: 'Karang Pilang' },
      { id: 'jambangan', name: 'Jambangan' },
      { id: 'gayungan', name: 'Gayungan' },
      { id: 'darmo', name: 'Darmo' },
      { id: 'krembangan', name: 'Krembangan' },
      { id: 'semampir', name: 'Semampir' },
      { id: 'pabean-cantikan', name: 'Pabean Cantikan' },
      { id: 'bulak', name: 'Bulak' }
    ],
    'yogyakarta': [
      { id: 'gondokusuman', name: 'Gondokusuman' },
      { id: 'gedongtengen', name: 'Gedongtengen' },
      { id: 'jetis', name: 'Jetis' },
      { id: 'tegalrejo', name: 'Tegalrejo' },
      { id: 'ngampilan', name: 'Ngampilan' },
      { id: 'wirobrajan', name: 'Wirobrajan' },
      { id: 'mantrijeron', name: 'Mantrijeron' },
      { id: 'kraton', name: 'Kraton' },
      { id: 'gondomanan', name: 'Gondomanan' },
      { id: 'pakualaman', name: 'Pakualaman' }
    ],
    'denpasar': [
      { id: 'denpasar-selatan', name: 'Denpasar Selatan' },
      { id: 'denpasar-timur', name: 'Denpasar Timur' },
      { id: 'denpasar-barat', name: 'Denpasar Barat' },
      { id: 'denpasar-utara', name: 'Denpasar Utara' }
    ],
    'medan': [
      { id: 'medan-barat', name: 'Medan Barat' },
      { id: 'medan-barat-daya', name: 'Medan Barat Daya' },
      { id: 'medan-belawan', name: 'Medan Belawan' },
      { id: 'medan-delitua', name: 'Medan Delitua' },
      { id: 'medan-denai', name: 'Medan Denai' },
      { id: 'medan-helvetia', name: 'Medan Helvetia' },
      { id: 'medan-johor', name: 'Medan Johor' },
      { id: 'medan-kota', name: 'Medan Kota' },
      { id: 'medan-labuhan', name: 'Medan Labuhan' },
      { id: 'medan-maimun', name: 'Medan Maimun' },
      { id: 'medan-marelan', name: 'Medan Marelan' },
      { id: 'medan-perjuangan', name: 'Medan Perjuangan' },
      { id: 'medan-petisah', name: 'Medan Petisah' },
      { id: 'medan-polong', name: 'Medan Polong' },
      { id: 'medan-selayang', name: 'Medan Selayang' },
      { id: 'medan-sunggal', name: 'Medan Sunggal' },
      { id: 'medan-tembung', name: 'Medan Tembung' },
      { id: 'medan-timur', name: 'Medan Timur' },
      { id: 'medan-tuntungan', name: 'Medan Tuntungan' },
      { id: 'medan-utara', name: 'Medan Utara' }
    ],
    'semarang': [
      { id: 'banyumanik', name: 'Banyumanik' },
      { id: 'candisari', name: 'Candisari' },
      { id: 'gajah-mungkur', name: 'Gajah Mungkur' },
      { id: 'gayamsari', name: 'Gayamsari' },
      { id: 'genuk', name: 'Genuk' },
      { id: 'gunungpati', name: 'Gunungpati' },
      { id: 'mijen', name: 'Mijen' },
      { id: 'ngaliyan', name: 'Ngaliyan' },
      { id: 'pedurungan', name: 'Pedurungan' },
      { id: 'semarang-barat', name: 'Semarang Barat' },
      { id: 'semarang-selatan', name: 'Semarang Selatan' },
      { id: 'semarang-tengah', name: 'Semarang Tengah' },
      { id: 'semarang-timur', name: 'Semarang Timur' },
      { id: 'semarang-utara', name: 'Semarang Utara' },
      { id: 'tembalang', name: 'Tembalang' },
      { id: 'tugu', name: 'Tugu' }
    ],
    'makassar': [
      { id: 'bontoala', name: 'Bontoala' },
      { id: 'kepulauan-sangkarrang', name: 'Kepulauan Sangkarrang' },
      { id: 'mamajang', name: 'Mamajang' },
      { id: 'manggala', name: 'Manggala' },
      { id: 'mariso', name: 'Mariso' },
      { id: 'panakkukang', name: 'Panakkukang' },
      { id: 'rappocini', name: 'Rappocini' },
      { id: 'tallo', name: 'Tallo' },
      { id: 'tamalanrea', name: 'Tamalanrea' },
      { id: 'tamalate', name: 'Tamalate' },
      { id: 'ujung-pandang', name: 'Ujung Pandang' },
      { id: 'wajo', name: 'Wajo' }
    ],
    'palembang': [
      { id: 'ilir-barat-i', name: 'Ilir Barat I' },
      { id: 'ilir-barat-ii', name: 'Ilir Barat II' },
      { id: 'ilir-timur-i', name: 'Ilir Timur I' },
      { id: 'ilir-timur-ii', name: 'Ilir Timur II' },
      { id: 'ilir-timur-iii', name: 'Ilir Timur III' },
      { id: 'seberang-ului', name: 'Seberang Ulu I' },
      { id: 'seberang-ului-ii', name: 'Seberang Ulu II' },
      { id: 'sukarami', name: 'Sukarami' },
      { id: 'sako', name: 'Sako' },
      { id: 'kemuning', name: 'Kemuning' },
      { id: 'kalidoni', name: 'Kalidoni' },
      { id: 'bukit-kecil', name: 'Bukit Kecil' },
      { id: 'gandus', name: 'Gandus' },
      { id: 'kertapati', name: 'Kertapati' },
      { id: 'plaju', name: 'Plaju' },
      { id: 'alang-alang-lebar', name: 'Alang Alang Lebar' }
    ],
    'pati': [
      { id: 'pati', name: 'Pati' },
      { id: 'jaken', name: 'Jaken' },
      { id: 'jakenan', name: 'Jakenan' },
      { id: 'jatiroto', name: 'Jatiroto' },
      { id: 'juwana', name: 'Juwana' },
      { id: 'kayen', name: 'Kayen' },
      { id: 'margorejo', name: 'Margorejo' },
      { id: 'margoyoso', name: 'Margoyoso' },
      { id: 'pucakwangi', name: 'Pucakwangi' },
      { id: 'sukolilo', name: 'Sukolilo' },
      { id: 'tambakromo', name: 'Tambakromo' },
      { id: 'tayu', name: 'Tayu' },
      { id: 'trangkil', name: 'Trangkil' },
      { id: 'wedarijaksa', name: 'Wedarijaksa' },
      { id: 'winong', name: 'Winong' }
    ],
    'surakarta': [
      { id: 'banjarsari', name: 'Banjarsari' },
      { id: 'jebres', name: 'Jebres' },
      { id: 'laweyan', name: 'Laweyan' },
      { id: 'pasar-kliwon', name: 'Pasar Kliwon' },
      { id: 'serengan', name: 'Serengan' }
    ],
    'pekalongan': [
      { id: 'pekalongan-barat', name: 'Pekalongan Barat' },
      { id: 'pekalongan-selatan', name: 'Pekalongan Selatan' },
      { id: 'pekalongan-tengah', name: 'Pekalongan Tengah' },
      { id: 'pekalongan-timur', name: 'Pekalongan Timur' },
      { id: 'pekalongan-utara', name: 'Pekalongan Utara' }
    ],
    'salatiga': [
      { id: 'argomulyo', name: 'Argomulyo' },
      { id: 'tingkir', name: 'Tingkir' },
      { id: 'sidomukti', name: 'Sidomukti' },
      { id: 'sidorejo', name: 'Sidorejo' }
    ],
    'magelang': [
      { id: 'magelang-selatan', name: 'Magelang Selatan' },
      { id: 'magelang-tengah', name: 'Magelang Tengah' },
      { id: 'magelang-utara', name: 'Magelang Utara' }
    ],
    'tegal': [
      { id: 'tegal-barat', name: 'Tegal Barat' },
      { id: 'tegal-selatan', name: 'Tegal Selatan' },
      { id: 'tegal-timur', name: 'Tegal Timur' },
      { id: 'margadana', name: 'Margadana' }
    ],
    'kudus': [
      { id: 'kudus', name: 'Kudus' },
      { id: 'jati', name: 'Jati' },
      { id: 'jekulo', name: 'Jekulo' },
      { id: 'kaliwungu', name: 'Kaliwungu' },
      { id: 'kota-kudus', name: 'Kota Kudus' },
      { id: 'mejobo', name: 'Mejobo' },
      { id: 'undaan', name: 'Undaan' }
    ],
    'purwokerto': [
      { id: 'purwokerto-barat', name: 'Purwokerto Barat' },
      { id: 'purwokerto-selatan', name: 'Purwokerto Selatan' },
      { id: 'purwokerto-timur', name: 'Purwokerto Timur' },
      { id: 'purwokerto-utara', name: 'Purwokerto Utara' }
    ],
    'boyolali': [
      { id: 'boyolali', name: 'Boyolali' },
      { id: 'ampek', name: 'Ampek' },
      { id: 'andong', name: 'Andong' },
      { id: 'banyudono', name: 'Banyudono' },
      { id: 'ceper', name: 'Ceper' },
      { id: 'juwangi', name: 'Juwangi' },
      { id: 'karanggede', name: 'Karanggede' },
      { id: 'kemusu', name: 'Kemusu' },
      { id: 'klego', name: 'Klego' },
      { id: 'mojosongo', name: 'Mojosongo' },
      { id: 'musuk', name: 'Musuk' },
      { id: 'ngemplak', name: 'Ngemplak' },
      { id: 'nogosari', name: 'Nogosari' },
      { id: 'sambi', name: 'Sambi' },
      { id: 'sawit', name: 'Sawit' },
      { id: 'selo', name: 'Selo' },
      { id: 'simo', name: 'Simo' },
      { id: 'teras', name: 'Teras' },
      { id: 'wonoasri', name: 'Wonoasri' }
    ],
    // Jawa Barat
    'bekasi': [
      { id: 'bekasi-barat', name: 'Bekasi Barat' },
      { id: 'bekasi-selatan', name: 'Bekasi Selatan' },
      { id: 'bekasi-timur', name: 'Bekasi Timur' },
      { id: 'bekasi-utara', name: 'Bekasi Utara' },
      { id: 'rawalumbu', name: 'Rawalumbu' },
      { id: 'medan-satria', name: 'Medan Satria' },
      { id: 'bantargebang', name: 'Bantargebang' },
      { id: 'pondok-gede', name: 'Pondok Gede' },
      { id: 'jatisampurna', name: 'Jatisampurna' },
      { id: 'mustika-jaya', name: 'Mustika Jaya' },
      { id: 'pancoran-mas', name: 'Pancoran Mas' },
      { id: 'sawangan', name: 'Sawangan' }
    ],
    'depok': [
      { id: 'beji', name: 'Beji' },
      { id: 'bojongsari', name: 'Bojongsari' },
      { id: 'cimanggis', name: 'Cimanggis' },
      { id: 'cinere', name: 'Cinere' },
      { id: 'cipayung', name: 'Cipayung' },
      { id: 'limo', name: 'Limo' },
      { id: 'pancoran-mas', name: 'Pancoran Mas' },
      { id: 'sawangan', name: 'Sawangan' },
      { id: 'sukmajaya', name: 'Sukmajaya' },
      { id: 'tapos', name: 'Tapos' }
    ],
    'bogor': [
      { id: 'bogor-barat', name: 'Bogor Barat' },
      { id: 'bogor-selatan', name: 'Bogor Selatan' },
      { id: 'bogor-tengah', name: 'Bogor Tengah' },
      { id: 'bogor-timur', name: 'Bogor Timur' },
      { id: 'bogor-utara', name: 'Bogor Utara' },
      { id: 'tanah-sareal', name: 'Tanah Sareal' }
    ],
    'tangerang': [
      { id: 'batu-ceper', name: 'Batu Ceper' },
      { id: 'benda', name: 'Benda' },
      { id: 'ciledug', name: 'Ciledug' },
      { id: 'cipondoh', name: 'Cipondoh' },
      { id: 'jati-uwung', name: 'Jati Uwung' },
      { id: 'karang-tengah', name: 'Karang Tengah' },
      { id: 'karawaci', name: 'Karawaci' },
      { id: 'larangan', name: 'Larangan' },
      { id: 'negara', name: 'Negara' },
      { id: 'pinang', name: 'Pinang' },
      { id: 'periuk', name: 'Periuk' },
      { id: 'serpong', name: 'Serpong' },
      { id: 'serpong-utara', name: 'Serpong Utara' },
      { id: 'tangerang', name: 'Tangerang' }
    ],
    'cirebon': [
      { id: 'cirebon-barat', name: 'Cirebon Barat' },
      { id: 'cirebon-selatan', name: 'Cirebon Selatan' },
      { id: 'cirebon-tengah', name: 'Cirebon Tengah' },
      { id: 'cirebon-timur', name: 'Cirebon Timur' },
      { id: 'cirebon-utara', name: 'Cirebon Utara' },
      { id: 'harjamukti', name: 'Harjamukti' },
      { id: 'kejaksan', name: 'Kejaksan' },
      { id: 'kesambi', name: 'Kesambi' }
    ],
    'tasikmalaya': [
      { id: 'bungursari', name: 'Bungursari' },
      { id: 'cibeureum', name: 'Cibeureum' },
      { id: 'cihideung', name: 'Cihideung' },
      { id: 'cipeundeuy', name: 'Cipeundeuy' },
      { id: 'cipocok-jaya', name: 'Cipocok Jaya' },
      { id: 'citamiang', name: 'Citamiang' },
      { id: 'indihiang', name: 'Indihiang' },
      { id: 'kawalu', name: 'Kawalu' },
      { id: 'mangkubumi', name: 'Mangkubumi' },
      { id: 'purbaratu', name: 'Purbaratu' },
      { id: 'tamansari', name: 'Tamansari' },
      { id: 'tawang', name: 'Tawang' }
    ],
    'sukabumi': [
      { id: 'baros', name: 'Baros' },
      { id: 'cibeureum', name: 'Cibeureum' },
      { id: 'cikole', name: 'Cikole' },
      { id: 'citamiang', name: 'Citamiang' },
      { id: 'gunung-puyuh', name: 'Gunung Puyuh' },
      { id: 'lengkong', name: 'Lengkong' },
      { id: 'subang-jaya', name: 'Subang Jaya' },
      { id: 'warudoyong', name: 'Warudoyong' }
    ],
    'karawang': [
      { id: 'karawang-barat', name: 'Karawang Barat' },
      { id: 'karawang-timur', name: 'Karawang Timur' },
      { id: 'telukjambe-barat', name: 'Telukjambe Barat' },
      { id: 'telukjambe-timur', name: 'Telukjambe Timur' }
    ],
    'purwakarta': [
      { id: 'purwakarta', name: 'Purwakarta' },
      { id: 'babakancikao', name: 'Babakancikao' },
      { id: 'bojong', name: 'Bojong' },
      { id: 'bungursari', name: 'Bungursari' },
      { id: 'campaka', name: 'Campaka' },
      { id: 'cibatu', name: 'Cibatu' },
      { id: 'darangdan', name: 'Darangdan' },
      { id: 'jatiluhur', name: 'Jatiluhur' },
      { id: 'kiara-pedang', name: 'Kiara Pedang' },
      { id: 'maniis', name: 'Maniis' },
      { id: 'pasawahan', name: 'Pasawahan' },
      { id: 'plered', name: 'Plered' },
      { id: 'pondoksalam', name: 'Pondoksalam' },
      { id: 'sukasari', name: 'Sukasari' },
      { id: 'sukatani', name: 'Sukatani' },
      { id: 'tegalwaru', name: 'Tegalwaru' },
      { id: 'wanayasa', name: 'Wanayasa' }
    ],
    // Jawa Timur
    'malang': [
      { id: 'blimbing', name: 'Blimbing' },
      { id: 'klojen', name: 'Klojen' },
      { id: 'kedungkandang', name: 'Kedungkandang' },
      { id: 'lowokwaru', name: 'Lowokwaru' },
      { id: 'sukun', name: 'Sukun' }
    ],
    'kediri': [
      { id: 'kediri', name: 'Kediri' },
      { id: 'mojo', name: 'Mojo' },
      { id: 'pesantren', name: 'Pesantren' }
    ],
    'blitar': [
      { id: 'blitar', name: 'Blitar' },
      { id: 'kepanjen-kidul', name: 'Kepanjen Kidul' },
      { id: 'sanan-wetan', name: 'Sanan Wetan' }
    ],
    'probolinggo': [
      { id: 'probolinggo', name: 'Probolinggo' },
      { id: 'kademangan', name: 'Kademangan' },
      { id: 'kanigaran', name: 'Kanigaran' },
      { id: 'kedopok', name: 'Kedopok' },
      { id: 'mayangan', name: 'Mayangan' },
      { id: 'wonoasih', name: 'Wonoasih' }
    ],
    'pasuruan': [
      { id: 'pasuruan', name: 'Pasuruan' },
      { id: 'bugul-kidul', name: 'Bugul Kidul' },
      { id: 'gadingrejo', name: 'Gadingrejo' },
      { id: 'panggungrejo', name: 'Panggungrejo' },
      { id: 'purworejo', name: 'Purworejo' }
    ],
    'mojokerto': [
      { id: 'mojokerto', name: 'Mojokerto' },
      { id: 'magersari', name: 'Magersari' },
      { id: 'prajurit-kulon', name: 'Prajurit Kulon' }
    ],
    'madiun': [
      { id: 'madiun', name: 'Madiun' },
      { id: 'kartoharjo', name: 'Kartoharjo' },
      { id: 'manguharjo', name: 'Manguharjo' },
      { id: 'taman', name: 'Taman' }
    ],
    'batu': [
      { id: 'batu', name: 'Batu' },
      { id: 'bumiaji', name: 'Bumiaji' },
      { id: 'junrejo', name: 'Junrejo' }
    ],
    'jember': [
      { id: 'jember', name: 'Jember' },
      { id: 'kaliwates', name: 'Kaliwates' },
      { id: 'patrang', name: 'Patrang' },
      { id: 'sumbersari', name: 'Sumbersari' }
    ],
    // Sumatera Utara
    'binjai': [
      { id: 'binjai-barat', name: 'Binjai Barat' },
      { id: 'binjai-selatan', name: 'Binjai Selatan' },
      { id: 'binjai-timur', name: 'Binjai Timur' },
      { id: 'binjai-utara', name: 'Binjai Utara' },
      { id: 'binjai-kota', name: 'Binjai Kota' }
    ],
    'pematang-siantar': [
      { id: 'siantar-marihat', name: 'Siantar Marihat' },
      { id: 'siantar-martoba', name: 'Siantar Martoba' },
      { id: 'siantar-selatan', name: 'Siantar Selatan' },
      { id: 'siantar-timur', name: 'Siantar Timur' },
      { id: 'siantar-utara', name: 'Siantar Utara' },
      { id: 'siantar-barat', name: 'Siantar Barat' },
      { id: 'siantar-tengah', name: 'Siantar Tengah' },
      { id: 'siantar-hilir', name: 'Siantar Hilir' }
    ],
    'tanjung-balai': [
      { id: 'tanjung-balai-selatan', name: 'Tanjung Balai Selatan' },
      { id: 'tanjung-balai-utara', name: 'Tanjung Balai Utara' },
      { id: 'seberang-kota', name: 'Seberang Kota' },
      { id: 'teluk-nibung', name: 'Teluk Nibung' },
      { id: 'datuk-bandar', name: 'Datuk Bandar' },
      { id: 'datuk-bandar-timur', name: 'Datuk Bandar Timur' }
    ],
    'tebing-tinggi': [
      { id: 'tebing-tinggi-barat', name: 'Tebing Tinggi Barat' },
      { id: 'tebing-tinggi-kota', name: 'Tebing Tinggi Kota' },
      { id: 'tebing-tinggi-timur', name: 'Tebing Tinggi Timur' },
      { id: 'rambutan', name: 'Rambutan' },
      { id: 'bajenis', name: 'Bajenis' },
      { id: 'padang-hilir', name: 'Padang Hilir' }
    ],
    'sibolga': [
      { id: 'sibolga-kota', name: 'Sibolga Kota' },
      { id: 'sibolga-sambas', name: 'Sibolga Sambas' },
      { id: 'sibolga-selatan', name: 'Sibolga Selatan' },
      { id: 'sibolga-utara', name: 'Sibolga Utara' }
    ],
    'padang-sidempuan': [
      { id: 'padang-sidempuan-angkola-julu', name: 'Padang Sidempuan Angkola Julu' },
      { id: 'padang-sidempuan-batang-natal', name: 'Padang Sidempuan Batang Natal' },
      { id: 'padang-sidempuan-hutaimbaru', name: 'Padang Sidempuan Hutaimbaru' },
      { id: 'padang-sidempuan-selatan', name: 'Padang Sidempuan Selatan' },
      { id: 'padang-sidempuan-tenggara', name: 'Padang Sidempuan Tenggara' },
      { id: 'padang-sidempuan-utara', name: 'Padang Sidempuan Utara' }
    ],
    'gunung-sitoli': [
      { id: 'gunung-sitoli', name: 'Gunung Sitoli' },
      { id: 'gunung-sitoli-alo-oa', name: 'Gunung Sitoli Alo Oa' },
      { id: 'gunung-sitoli-barat', name: 'Gunung Sitoli Barat' },
      { id: 'gunung-sitoli-idanoi', name: 'Gunung Sitoli Idanoi' },
      { id: 'gunung-sitoli-selatan', name: 'Gunung Sitoli Selatan' },
      { id: 'gunung-sitoli-utara', name: 'Gunung Sitoli Utara' }
    ],
    // Sumatera Barat
    'payakumbuh': [
      { id: 'payakumbuh-barat', name: 'Payakumbuh Barat' },
      { id: 'payakumbuh-selatan', name: 'Payakumbuh Selatan' },
      { id: 'payakumbuh-timur', name: 'Payakumbuh Timur' },
      { id: 'payakumbuh-utara', name: 'Payakumbuh Utara' },
      { id: 'lamposi-tigo-nagori', name: 'Lamposi Tigo Nagori' }
    ],
    'bukittinggi': [
      { id: 'aur-biru', name: 'Aur Biru' },
      { id: 'guguk-panjang', name: 'Guguk Panjang' },
      { id: 'mandiangin-koto-selayan', name: 'Mandiangin Koto Selayan' }
    ],
    'sawahlunto': [
      { id: 'barangin', name: 'Barangin' },
      { id: 'lembah-segari', name: 'Lembah Segari' },
      { id: 'silungkang', name: 'Silungkang' },
      { id: 'talawi', name: 'Talawi' }
    ],
    'solok': [
      { id: 'lubuk-sikarah', name: 'Lubuk Sikarah' },
      { id: 'tanjung-harapan', name: 'Tanjung Harapan' }
    ],
    'pariaman': [
      { id: 'pariaman-selatan', name: 'Pariaman Selatan' },
      { id: 'pariaman-tengah', name: 'Pariaman Tengah' },
      { id: 'pariaman-timur', name: 'Pariaman Timur' },
      { id: 'pariaman-utara', name: 'Pariaman Utara' }
    ],
    // Riau
    'dumai': [
      { id: 'dumai-barat', name: 'Dumai Barat' },
      { id: 'dumai-selatan', name: 'Dumai Selatan' },
      { id: 'dumai-timur', name: 'Dumai Timur' },
      { id: 'dumai-utara', name: 'Dumai Utara' },
      { id: 'medang-kampai', name: 'Medang Kampai' },
      { id: 'sungai-sembilan', name: 'Sungai Sembilan' }
    ],
    // Sumatera Selatan
    'prabumulih': [
      { id: 'prabumulih-barat', name: 'Prabumulih Barat' },
      { id: 'prabumulih-selatan', name: 'Prabumulih Selatan' },
      { id: 'prabumulih-timur', name: 'Prabumulih Timur' },
      { id: 'prabumulih-utara', name: 'Prabumulih Utara' }
    ],
    'pagar-alam': [
      { id: 'pagar-alam-selatan', name: 'Pagar Alam Selatan' },
      { id: 'pagar-alam-utara', name: 'Pagar Alam Utara' },
      { id: 'dempo-selatan', name: 'Dempo Selatan' },
      { id: 'dempo-tengah', name: 'Dempo Tengah' },
      { id: 'dempo-utara', name: 'Dempo Utara' }
    ],
    'lubuk-linggau': [
      { id: 'lubuk-linggau-barat-i', name: 'Lubuk Linggau Barat I' },
      { id: 'lubuk-linggau-barat-ii', name: 'Lubuk Linggau Barat II' },
      { id: 'lubuk-linggau-selatan-i', name: 'Lubuk Linggau Selatan I' },
      { id: 'lubuk-linggau-selatan-ii', name: 'Lubuk Linggau Selatan II' },
      { id: 'lubuk-linggau-timur-i', name: 'Lubuk Linggau Timur I' },
      { id: 'lubuk-linggau-timur-ii', name: 'Lubuk Linggau Timur II' },
      { id: 'lubuk-linggau-utara-i', name: 'Lubuk Linggau Utara I' },
      { id: 'lubuk-linggau-utara-ii', name: 'Lubuk Linggau Utara II' }
    ],
    // Lampung
    'metro': [
      { id: 'metro-barat', name: 'Metro Barat' },
      { id: 'metro-pusat', name: 'Metro Pusat' },
      { id: 'metro-selatan', name: 'Metro Selatan' },
      { id: 'metro-timur', name: 'Metro Timur' },
      { id: 'metro-utara', name: 'Metro Utara' }
    ],
    // Aceh
    'langsa': [
      { id: 'langsa-barat', name: 'Langsa Barat' },
      { id: 'langsa-baru', name: 'Langsa Baru' },
      { id: 'langsa-kota', name: 'Langsa Kota' },
      { id: 'langsa-lama', name: 'Langsa Lama' },
      { id: 'langsa-timur', name: 'Langsa Timur' }
    ],
    'lhokseumawe': [
      { id: 'baktia', name: 'Baktia' },
      { id: 'bantayan', name: 'Bantayan' },
      { id: 'blang-mangat', name: 'Blang Mangat' },
      { id: 'muara-dua', name: 'Muara Dua' }
    ],
    'sabang': [
      { id: 'sukajaya', name: 'Sukajaya' },
      { id: 'sukakarya', name: 'Sukakarya' }
    ],
    'subulussalam': [
      { id: 'longkib', name: 'Longkib' },
      { id: 'penanggalan', name: 'Penanggalan' },
      { id: 'rundeng', name: 'Rundeng' },
      { id: 'simpang-kiri', name: 'Simpang Kiri' },
      { id: 'sultan-daulat', name: 'Sultan Daulat' }
    ],
    // Jambi
    'sungaipenuh': [
      { id: 'sungaipenuh', name: 'Sungaipenuh' },
      { id: 'hamparan-rawang', name: 'Hamparan Rawang' },
      { id: 'koto-baru', name: 'Koto Baru' },
      { id: 'kumun-debai', name: 'Kumun Debai' },
      { id: 'pondok-tinggi', name: 'Pondok Tinggi' }
    ],
    // Bengkulu
    'bengkulu': [
      { id: 'gading-cempaka', name: 'Gading Cempaka' },
      { id: 'kampung-meling', name: 'Kampung Meling' },
      { id: 'muara-bang-kahulu', name: 'Muara Bang Kahulu' },
      { id: 'ratu-agung', name: 'Ratu Agung' },
      { id: 'ratu-samban', name: 'Ratu Samban' },
      { id: 'selebar', name: 'Selebar' },
      { id: 'singaran-pati', name: 'Singaran Pati' },
      { id: 'sungai-serut', name: 'Sungai Serut' },
      { id: 'teluk-segara', name: 'Teluk Segara' }
    ],
    // Bangka Belitung
    'pangkalpinang': [
      { id: 'gerunggang', name: 'Gerunggang' },
      { id: 'girimaya', name: 'Girimaya' },
      { id: 'pangkalan-balam', name: 'Pangkalan Balam' },
      { id: 'rantau-prapat', name: 'Rantau Prapat' },
      { id: 'taman-sari', name: 'Taman Sari' }
    ],
    // Kepulauan Riau
    'tanjungpinang': [
      { id: 'bukit-bestari', name: 'Bukit Bestari' },
      { id: 'tanjungpinang-barat', name: 'Tanjungpinang Barat' },
      { id: 'tanjungpinang-kota', name: 'Tanjungpinang Kota' },
      { id: 'tanjungpinang-timur', name: 'Tanjungpinang Timur' }
    ],
    'batam': [
      { id: 'batam-kota', name: 'Batam Kota' },
      { id: 'batam-kepulauan', name: 'Batam Kepulauan' },
      { id: 'belakang-padang', name: 'Belakang Padang' },
      { id: 'bulang', name: 'Bulang' },
      { id: 'galang', name: 'Galang' },
      { id: 'lubuk-baja', name: 'Lubuk Baja' },
      { id: 'nongsa', name: 'Nongsa' },
      { id: 'sagulung', name: 'Sagulung' },
      { id: 'seibeduk', name: 'Seibeduk' },
      { id: 'sekupang', name: 'Sekupang' },
      { id: 'sungai-beduk', name: 'Sungai Beduk' },
      { id: 'tunggul-hitam', name: 'Tunggul Hitam' }
    ],
    // Nusa Tenggara Barat
    'mataram': [
      { id: 'ampenan', name: 'Ampenan' },
      { id: 'cakranegara', name: 'Cakranegara' },
      { id: 'mataram', name: 'Mataram' },
      { id: 'sandubaya', name: 'Sandubaya' },
      { id: 'selaparang', name: 'Selaparang' },
      { id: 'sekarbela', name: 'Sekarbela' }
    ],
    'bima': [
      { id: 'asakota', name: 'Asakota' },
      { id: 'mada-pangga', name: 'Mada Pangga' },
      { id: 'rasanae-barat', name: 'Rasanae Barat' },
      { id: 'rasanae-timur', name: 'Rasanae Timur' }
    ],
    'dompu': [
      { id: 'dompu', name: 'Dompu' },
      { id: 'huu', name: 'Huu' },
      { id: 'kilo', name: 'Kilo' },
      { id: 'kempo', name: 'Kempo' },
      { id: 'manggalewa', name: 'Manggalewa' },
      { id: 'pajo', name: 'Pajo' },
      { id: 'pekat', name: 'Pekat' },
      { id: 'woja', name: 'Woja' }
    ],
    // Nusa Tenggara Timur
    'kupang': [
      { id: 'alak', name: 'Alak' },
      { id: 'kelapa-lima', name: 'Kelapa Lima' },
      { id: 'kota-lama', name: 'Kota Lama' },
      { id: 'kota-raja', name: 'Kota Raja' },
      { id: 'maulafa', name: 'Maulafa' },
      { id: 'oebobo', name: 'Oebobo' }
    ],
    // Kalimantan Barat
    'pontianak': [
      { id: 'pontianak-barat', name: 'Pontianak Barat' },
      { id: 'pontianak-kota', name: 'Pontianak Kota' },
      { id: 'pontianak-selatan', name: 'Pontianak Selatan' },
      { id: 'pontianak-tenggara', name: 'Pontianak Tenggara' },
      { id: 'pontianak-timur', name: 'Pontianak Timur' },
      { id: 'pontianak-utara', name: 'Pontianak Utara' }
    ],
    'singkawang': [
      { id: 'singkawang-barat', name: 'Singkawang Barat' },
      { id: 'singkawang-selatan', name: 'Singkawang Selatan' },
      { id: 'singkawang-tengah', name: 'Singkawang Tengah' },
      { id: 'singkawang-timur', name: 'Singkawang Timur' },
      { id: 'singkawang-utara', name: 'Singkawang Utara' }
    ],
    // Kalimantan Tengah
    'palangka-raya': [
      { id: 'bukit-batu', name: 'Bukit Batu' },
      { id: 'jekan-raya', name: 'Jekan Raya' },
      { id: 'pahandut', name: 'Pahandut' },
      { id: 'rakumpit', name: 'Rakumpit' },
      { id: 'sabangau', name: 'Sabangau' }
    ],
    // Kalimantan Selatan
    'banjarmasin': [
      { id: 'banjarmasin-barat', name: 'Banjarmasin Barat' },
      { id: 'banjarmasin-selatan', name: 'Banjarmasin Selatan' },
      { id: 'banjarmasin-tengah', name: 'Banjarmasin Tengah' },
      { id: 'banjarmasin-timur', name: 'Banjarmasin Timur' },
      { id: 'banjarmasin-utara', name: 'Banjarmasin Utara' }
    ],
    'banjarbaru': [
      { id: 'banjarbaru-selatan', name: 'Banjarbaru Selatan' },
      { id: 'banjarbaru-utara', name: 'Banjarbaru Utara' },
      { id: 'cempaka', name: 'Cempaka' },
      { id: 'landasan-ulin', name: 'Landasan Ulin' },
      { id: 'liang-anggang', name: 'Liang Anggang' }
    ],
    // Kalimantan Timur
    'samarinda': [
      { id: 'samarinda-ilir', name: 'Samarinda Ilir' },
      { id: 'samarinda-kota', name: 'Samarinda Kota' },
      { id: 'samarinda-seberang', name: 'Samarinda Seberang' },
      { id: 'samarinda-ulu', name: 'Samarinda Ulu' },
      { id: 'samarinda-utara', name: 'Samarinda Utara' },
      { id: 'sambutan', name: 'Sambutan' },
      { id: 'sungai-kuning', name: 'Sungai Kuning' },
      { id: 'sungai-pinang', name: 'Sungai Pinang' },
      { id: 'sungai-tengah', name: 'Sungai Tengah' }
    ],
    'balikpapan': [
      { id: 'balikpapan-barat', name: 'Balikpapan Barat' },
      { id: 'balikpapan-kota', name: 'Balikpapan Kota' },
      { id: 'balikpapan-selatan', name: 'Balikpapan Selatan' },
      { id: 'balikpapan-tengah', name: 'Balikpapan Tengah' },
      { id: 'balikpapan-timur', name: 'Balikpapan Timur' },
      { id: 'balikpapan-utara', name: 'Balikpapan Utara' }
    ],
    'bontang': [
      { id: 'bontang-barat', name: 'Bontang Barat' },
      { id: 'bontang-selatan', name: 'Bontang Selatan' },
      { id: 'bontang-utara', name: 'Bontang Utara' }
    ],
    // Kalimantan Utara
    'tarakan': [
      { id: 'tarakan-barat', name: 'Tarakan Barat' },
      { id: 'tarakan-tengah', name: 'Tarakan Tengah' },
      { id: 'tarakan-timur', name: 'Tarakan Timur' },
      { id: 'tarakan-utara', name: 'Tarakan Utara' }
    ],
    // Sulawesi Utara
    'manado': [
      { id: 'bunaken', name: 'Bunaken' },
      { id: 'bunaken-kepulauan', name: 'Bunaken Kepulauan' },
      { id: 'malalayang', name: 'Malalayang' },
      { id: 'mapanget', name: 'Mapanget' },
      { id: 'paal-ii', name: 'Paal II' },
      { id: 'sario', name: 'Sario' },
      { id: 'singkil', name: 'Singkil' },
      { id: 'tuminting', name: 'Tuminting' },
      { id: 'wenang', name: 'Wenang' },
      { id: 'wanea', name: 'Wanea' }
    ],
    'bitung': [
      { id: 'bitung-barat', name: 'Bitung Barat' },
      { id: 'bitung-selatan', name: 'Bitung Selatan' },
      { id: 'bitung-tengah', name: 'Bitung Tengah' },
      { id: 'bitung-timur', name: 'Bitung Timur' },
      { id: 'bitung-utara', name: 'Bitung Utara' },
      { id: 'girian', name: 'Girian' },
      { id: 'lembeh-selatan', name: 'Lembeh Selatan' },
      { id: 'lembeh-utara', name: 'Lembeh Utara' },
      { id: 'madidir', name: 'Madidir' },
      { id: 'maesa', name: 'Maesa' },
      { id: 'matuari', name: 'Matuari' },
      { id: 'ranowulu', name: 'Ranowulu' }
    ],
    'kotamobagu': [
      { id: 'kotamobagu-barat', name: 'Kotamobagu Barat' },
      { id: 'kotamobagu-selatan', name: 'Kotamobagu Selatan' },
      { id: 'kotamobagu-timur', name: 'Kotamobagu Timur' },
      { id: 'kotamobagu-utara', name: 'Kotamobagu Utara' }
    ],
    'tomohon': [
      { id: 'tomohon-barat', name: 'Tomohon Barat' },
      { id: 'tomohon-selatan', name: 'Tomohon Selatan' },
      { id: 'tomohon-tengah', name: 'Tomohon Tengah' },
      { id: 'tomohon-timur', name: 'Tomohon Timur' },
      { id: 'tomohon-utara', name: 'Tomohon Utara' }
    ],
    // Sulawesi Tengah
    'palu': [
      { id: 'palu-barat', name: 'Palu Barat' },
      { id: 'palu-selatan', name: 'Palu Selatan' },
      { id: 'palu-timur', name: 'Palu Timur' },
      { id: 'palu-utara', name: 'Palu Utara' },
      { id: 'tatanga', name: 'Tatanga' },
      { id: 'ulujadi', name: 'Ulujadi' }
    ],
    // Sulawesi Selatan
    'parepare': [
      { id: 'bacukiki', name: 'Bacukiki' },
      { id: 'bacukiki-barat', name: 'Bacukiki Barat' },
      { id: 'soreang', name: 'Soreang' },
      { id: 'ulaweng', name: 'Ulaweng' }
    ],
    'palopo': [
      { id: 'bara', name: 'Bara' },
      { id: 'mungkajang', name: 'Mungkajang' },
      { id: 'sendana', name: 'Sendana' },
      { id: 'wara', name: 'Wara' },
      { id: 'wara-barat', name: 'Wara Barat' },
      { id: 'wara-selatan', name: 'Wara Selatan' },
      { id: 'wara-timur', name: 'Wara Timur' },
      { id: 'wara-utara', name: 'Wara Utara' }
    ],
    // Sulawesi Tenggara
    'kendari': [
      { id: 'abeli', name: 'Abeli' },
      { id: 'baruga', name: 'Baruga' },
      { id: 'kadia', name: 'Kadia' },
      { id: 'kambu', name: 'Kambu' },
      { id: 'kendari', name: 'Kendari' },
      { id: 'kendari-barat', name: 'Kendari Barat' },
      { id: 'mandonga', name: 'Mandonga' },
      { id: 'poasia', name: 'Poasia' },
      { id: 'puuwatu', name: 'Puuwatu' },
      { id: 'wua-wua', name: 'Wua Wua' }
    ],
    'baubau': [
      { id: 'betoambari', name: 'Betoambari' },
      { id: 'bungi', name: 'Bungi' },
      { id: 'kokalukuna', name: 'Kokalukuna' },
      { id: 'lemo', name: 'Lemo' },
      { id: 'murhum', name: 'Murhum' },
      { id: 'sora-walia', name: 'Sora Walia' },
      { id: 'wolio', name: 'Wolio' }
    ],
    // Gorontalo
    'gorontalo': [
      { id: 'dumbo-raya', name: 'Dumbo Raya' },
      { id: 'hulonthalangi', name: 'Hulonthalangi' },
      { id: 'kota-barat', name: 'Kota Barat' },
      { id: 'kota-selatan', name: 'Kota Selatan' },
      { id: 'kota-tengah', name: 'Kota Tengah' },
      { id: 'kota-timur', name: 'Kota Timur' },
      { id: 'kota-utara', name: 'Kota Utara' },
      { id: 'sipatana', name: 'Sipatana' }
    ],
    // Sulawesi Barat
    'mamuju': [
      { id: 'banggae', name: 'Banggae' },
      { id: 'banggae-timur', name: 'Banggae Timur' },
      { id: 'mamuju', name: 'Mamuju' },
      { id: 'mamuju-utara', name: 'Mamuju Utara' },
      { id: 'pabiringan', name: 'Pabiringan' },
      { id: 'sendana', name: 'Sendana' },
      { id: 'tammerodo-sendana', name: 'Tammerodo Sendana' }
    ],
    // Maluku
    'ambon': [
      { id: 'baguala', name: 'Baguala' },
      { id: 'leitimur-selatan', name: 'Leitimur Selatan' },
      { id: 'nusaniwe', name: 'Nusaniwe' },
      { id: 'sirimau', name: 'Sirimau' },
      { id: 'teluk-ambon', name: 'Teluk Ambon' }
    ],
    'tual': [
      { id: 'kur-selatan', name: 'Kur Selatan' },
      { id: 'kur-utara', name: 'Kur Utara' },
      { id: 'pulau-dullah-selatan', name: 'Pulau Dullah Selatan' },
      { id: 'pulau-dullah-utara', name: 'Pulau Dullah Utara' },
      { id: 'pulau-tayando-tam', name: 'Pulau Tayando Tam' }
    ],
    // Maluku Utara
    'ternate': [
      { id: 'ternate-barat', name: 'Ternate Barat' },
      { id: 'ternate-selatan', name: 'Ternate Selatan' },
      { id: 'ternate-tengah', name: 'Ternate Tengah' },
      { id: 'ternate-timur', name: 'Ternate Timur' },
      { id: 'ternate-utara', name: 'Ternate Utara' }
    ],
    'tidore-kepulauan': [
      { id: 'tidore', name: 'Tidore' },
      { id: 'tidore-selatan', name: 'Tidore Selatan' },
      { id: 'tidore-timur', name: 'Tidore Timur' },
      { id: 'tidore-utara', name: 'Tidore Utara' }
    ],
    // Papua Barat
    'manokwari': [
      { id: 'manokwari-barat', name: 'Manokwari Barat' },
      { id: 'manokwari-selatan', name: 'Manokwari Selatan' },
      { id: 'manokwari-timur', name: 'Manokwari Timur' },
      { id: 'manokwari-utara', name: 'Manokwari Utara' }
    ],
    'sorong': [
      { id: 'sorong-barat', name: 'Sorong Barat' },
      { id: 'sorong-kepulauan', name: 'Sorong Kepulauan' },
      { id: 'sorong-manoi', name: 'Sorong Manoi' },
      { id: 'sorong-timur', name: 'Sorong Timur' },
      { id: 'sorong-utara', name: 'Sorong Utara' }
    ],
    // Papua
    'jayapura': [
      { id: 'jayapura-selatan', name: 'Jayapura Selatan' },
      { id: 'jayapura-utara', name: 'Jayapura Utara' },
      { id: 'muara-tami', name: 'Muara Tami' },
      { id: 'south-jayapura', name: 'South Jayapura' }
    ],
    'merauke': [
      { id: 'merauke', name: 'Merauke' },
      { id: 'anim-ha', name: 'Anim Ha' },
      { id: 'elikobel', name: 'Elikobel' },
      { id: 'ilwayab', name: 'Ilwayab' },
      { id: 'jagebob', name: 'Jagebob' },
      { id: 'kaptel', name: 'Kaptel' },
      { id: 'kimaam', name: 'Kimaam' },
      { id: 'kurik', name: 'Kurik' },
      { id: 'malind', name: 'Malind' },
      { id: 'muting', name: 'Muting' },
      { id: 'naukenjerai', name: 'Naukenjerai' },
      { id: 'okaba', name: 'Okaba' },
      { id: 'semangga', name: 'Semangga' },
      { id: 'sota', name: 'Sota' },
      { id: 'tabonji', name: 'Tabonji' },
      { id: 'tanah-miring', name: 'Tanah Miring' },
      { id: 'tubang', name: 'Tubang' },
      { id: 'ulilin', name: 'Ulilin' },
      { id: 'waan', name: 'Waan' },
      { id: 'weriagar', name: 'Weriagar' }
    ]
  }

  // Background options with descriptions
  const backgroundOptions = [
    {
      value: 'Mahasiswa/Fresh Graduate IT',
      label: 'Mahasiswa/Fresh Graduate IT',
      description: 'Mahasiswa, fresh graduate, job seekers, lulusan bootcamp/sertifikasi yang memiliki pondasi di bidang IT'
    },
    {
      value: 'Developer/Engineer/Praktisi IT',
      label: 'Developer/Engineer/Praktisi IT',
      description: 'Web/Mobile/Game Developer, Data Scientist/Analyst/Engineer, Cloud/DevOps Engineer, Cybersecurity Specialist, IT Support'
    },
    {
      value: 'Guru/Dosen/Peneliti/Akademisi',
      label: 'Guru/Dosen/Peneliti/Akademisi',
      description: 'Pengajar, peneliti, akademisi di bidang teknologi dan pendidikan'
    },
    {
      value: 'Pimpinan Teknologi',
      label: 'Pimpinan Teknologi',
      description: 'CTO, IT Director, Technology Manager, Head of Engineering'
    },
    {
      value: 'Pendiri Startup/Wirausahawan Teknologi',
      label: 'Pendiri Startup/Wirausahawan Teknologi',
      description: 'Founder, Co-founder, CEO startup teknologi, wirausahawan di bidang IT'
    },
    {
      value: 'Konsultan/Analis/Profesional Terkait Teknologi',
      label: 'Konsultan/Analis/Profesional Terkait Teknologi',
      description: 'IT Consultant, Business Analyst, System Analyst, Project Manager IT'
    },
    {
      value: 'Mahasiswa Non-IT',
      label: 'Mahasiswa Non-IT',
      description: 'Mahasiswa dari jurusan non-teknologi yang tertarik belajar IT'
    },
    {
      value: 'Fresh Graduate Non-IT',
      label: 'Fresh Graduate Non-IT',
      description: 'Lulusan baru dari jurusan non-teknologi yang ingin beralih ke bidang IT'
    },
    {
      value: 'Karyawan Swasta',
      label: 'Karyawan Swasta',
      description: 'Karyawan di perusahaan swasta yang ingin meningkatkan skill IT'
    },
    {
      value: 'PNS/ASN',
      label: 'PNS/ASN',
      description: 'Pegawai Negeri Sipil atau Aparatur Sipil Negara'
    },
    {
      value: 'Wirausaha/Entrepreneur',
      label: 'Wirausaha/Entrepreneur',
      description: 'Pengusaha atau entrepreneur yang ingin mengintegrasikan teknologi'
    },
    {
      value: 'Freelancer',
      label: 'Freelancer',
      description: 'Pekerja lepas yang ingin mengembangkan skill teknologi'
    },
    {
      value: 'Pensiunan',
      label: 'Pensiunan',
      description: 'Pensiunan yang ingin belajar teknologi untuk hobi atau bisnis'
    },
    {
      value: 'Ibu Rumah Tangga',
      label: 'Ibu Rumah Tangga',
      description: 'Ibu rumah tangga yang ingin belajar teknologi untuk keperluan pribadi atau bisnis'
    },
    {
      value: 'Pelajar/Siswa',
      label: 'Pelajar/Siswa',
      description: 'Siswa SMA/SMK yang tertarik dengan dunia teknologi'
    },
    {
      value: 'Lainnya',
      label: 'Lainnya',
      description: 'Kategori lain yang tidak termasuk dalam pilihan di atas'
    }
  ]

  // Education options with descriptions
  const educationOptions = [
    {
      value: 'SD',
      label: 'SD (Sekolah Dasar)',
      description: 'Pendidikan dasar 6 tahun (Kelas 1-6)'
    },
    {
      value: 'SMP',
      label: 'SMP (Sekolah Menengah Pertama)',
      description: 'Pendidikan menengah pertama 3 tahun (Kelas 7-9)'
    },
    {
      value: 'SMA',
      label: 'SMA (Sekolah Menengah Atas)',
      description: 'Pendidikan menengah atas umum 3 tahun (Kelas 10-12)'
    },
    {
      value: 'SMK',
      label: 'SMK (Sekolah Menengah Kejuruan)',
      description: 'Pendidikan menengah kejuruan 3 tahun dengan fokus keterampilan'
    },
    {
      value: 'SMA/SMK',
      label: 'SMA/SMK',
      description: 'Pendidikan menengah atas (umum atau kejuruan)'
    },
    {
      value: 'D1',
      label: 'D1 (Diploma 1)',
      description: 'Pendidikan vokasi 1 tahun'
    },
    {
      value: 'D2',
      label: 'D2 (Diploma 2)',
      description: 'Pendidikan vokasi 2 tahun'
    },
    {
      value: 'D3',
      label: 'D3 (Diploma 3)',
      description: 'Pendidikan vokasi 3 tahun'
    },
    {
      value: 'D4',
      label: 'D4 (Diploma 4)',
      description: 'Pendidikan vokasi 4 tahun setara dengan S1'
    },
    {
      value: 'Diploma',
      label: 'Diploma',
      description: 'Pendidikan vokasi (D1, D2, D3, atau D4)'
    },
    {
      value: 'S1',
      label: 'S1 (Sarjana)',
      description: 'Pendidikan tinggi strata 1 (4 tahun)'
    },
    {
      value: 'S2',
      label: 'S2 (Magister)',
      description: 'Pendidikan tinggi strata 2 (2 tahun setelah S1)'
    },
    {
      value: 'S3',
      label: 'S3 (Doktor)',
      description: 'Pendidikan tinggi strata 3 (3-4 tahun setelah S2)'
    },
    {
      value: 'Magister',
      label: 'Magister',
      description: 'Gelar magister (S2)'
    },
    {
      value: 'Doktor',
      label: 'Doktor',
      description: 'Gelar doktor (S3)'
    },
    {
      value: 'Profesi',
      label: 'Profesi',
      description: 'Pendidikan profesi (setelah S1)'
    },
    {
      value: 'Spesialis',
      label: 'Spesialis',
      description: 'Pendidikan spesialis (setelah profesi)'
    }
  ]

  // Program source options
  const programSourceOptions = [
    'Media Sosial (Instagram, Facebook, TikTok, dll)',
    'Website/Google Search',
    'Rekomendasi Teman/Keluarga',
    'Email Marketing',
    'Event/Seminar',
    'Referral Code',
    'Iklan Online',
    'Partner/Sponsor',
    'Lainnya'
  ]

  useEffect(() => {
    if (!authLoading) {
      if (!profile) {
        // User not logged in, redirect to login
        router.push('/login')
        return
      }

      // Pre-fill form with profile data
      setFormData(prev => ({
        ...prev,
        full_name: profile.full_name || '',
        email: profile.email || ''
      }))

      // Initialize provinces data
      setProvinces(indonesiaProvinces)

      validateReferralCode()
    }
  }, [profile, authLoading, referralCode])

  // Initialize search terms when form data changes
  useEffect(() => {
    if (formData.background) {
      const selectedOption = backgroundOptions.find(opt => opt.value === formData.background)
      if (selectedOption && selectedOption.label !== backgroundSearchTerm) {
        setBackgroundSearchTerm(selectedOption.label)
      }
    }
  }, [formData.background])

  useEffect(() => {
    if (formData.education) {
      const selectedOption = educationOptions.find(opt => opt.value === formData.education)
      if (selectedOption && selectedOption.label !== educationSearchTerm) {
        setEducationSearchTerm(selectedOption.label)
      }
    }
  }, [formData.education])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.background-dropdown-container')) {
        setIsBackgroundDropdownOpen(false)
      }
      if (!target.closest('.education-dropdown-container')) {
        setIsEducationDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const validateReferralCode = async () => {
    try {
      setLoading(true)

      console.log('Validating referral code:', referralCode)

      // Get referral code details with program info
      const { data, error } = await supabase
        .from('referral_codes')
        .select(`
          *,
          user_profiles!referral_codes_trainer_id_fkey (
            full_name,
            email
          )
        `)
        .eq('code', referralCode)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error fetching referral code:', error)
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Kode referral tidak ditemukan'
        })
        router.push('/programs')
        return
      }

      if (!data) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Kode referral tidak ditemukan'
        })
        router.push('/programs')
        return
      }

      // Check if referral code is expired
      if ((data as any).valid_until && new Date((data as any).valid_until) < new Date()) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Kode referral sudah expired'
        })
        router.push('/programs')
        return
      }

      // Check if referral code has reached max uses
      if ((data as any).max_uses && (data as any).current_uses >= (data as any).max_uses) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Kode referral sudah mencapai batas penggunaan'
        })
        router.push('/programs')
        return
      }

      // Set referral data
      setReferralData({
        id: (data as any).id,
        code: (data as any).code,
        description: (data as any).description,
        trainer_id: (data as any).trainer_id,
        discount_percentage: (data as any).discount_percentage || 0,
        discount_amount: (data as any).discount_amount || 0
      })

      // Get programs from this trainer - try different approaches
      let programsData = null
      let programsError = null

      // First try: programs with trainer_id from user_profiles
      const { data: programsData1, error: programsError1 } = await supabase
        .from('programs')
        .select('*')
        .eq('trainer_id', (data as any).trainer_id)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(1)

      if (programsError1 || !programsData1 || programsData1.length === 0) {
        // Second try: get all published programs and show the first one
        const { data: allProgramsData, error: allProgramsError } = await supabase
          .from('programs')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(1)

        programsData = allProgramsData
        programsError = allProgramsError
      } else {
        programsData = programsData1
        programsError = programsError1
      }

      if (programsError) {
        console.error('Error fetching trainer programs:', programsError)
        // Fallback to a default program if no programs found
        setProgram({
          id: 'default-program',
          title: 'Program dengan Kode Referral',
          description: 'Program khusus dengan kode referral yang valid',
          category: 'General',
          price: 0, // Free program
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          max_participants: 50,
          current_participants: 0,
          trainer_id: (data as any).trainer_id,
          trainer: {
            full_name: (data as any).user_profiles?.full_name || 'Unknown Trainer',
            email: (data as any).user_profiles?.email || 'unknown@example.com'
          }
        })
      } else if (programsData && programsData.length > 0) {
        // Use the first program from the trainer
        const programData = programsData[0] as any
        setProgram({
          id: programData.id,
          title: programData.title,
          description: programData.description,
          category: programData.category,
          price: programData.price || 0,
          start_date: programData.start_date,
          end_date: programData.end_date,
          max_participants: programData.max_participants,
          current_participants: programData.current_participants,
          trainer_id: (data as any).trainer_id,
          trainer: {
            full_name: (data as any).user_profiles?.full_name || 'Unknown Trainer',
            email: (data as any).user_profiles?.email || 'unknown@example.com'
          }
        })
      } else {
        // No programs found, create a default free program
        setProgram({
          id: 'default-program',
          title: 'Program dengan Kode Referral',
          description: 'Program khusus dengan kode referral yang valid',
          category: 'General',
          price: 0, // Free program
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          max_participants: 50,
          current_participants: 0,
          trainer_id: (data as any).trainer_id,
          trainer: {
            full_name: (data as any).user_profiles?.full_name || 'Unknown Trainer',
            email: (data as any).user_profiles?.email || 'unknown@example.com'
          }
        })
      }

      console.log('Referral code validated:', data)

    } catch (error) {
      console.error('Error validating referral code:', error)
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Gagal memvalidasi kode referral'
      })
    } finally {
      setLoading(false)
    }
  }

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

  const handleLocationChange = async (type: 'province' | 'city' | 'district', value: string) => {
    setFormData(prev => ({
      ...prev,
      [type]: value,
      // Reset dependent fields
      ...(type === 'province' && { city: '', district: '' }),
      ...(type === 'city' && { district: '' })
    }))

    // Load dependent data
    if (type === 'province' && value) {
      // Load cities for selected province
      const provinceCities = citiesData[value] || []
      setCities(provinceCities)
      setDistricts([])
    } else if (type === 'city' && value) {
      // Load kecamatan for selected kabupaten/kota
      // Prioritize data from kecamatanData (file terpisah), fallback to districtsData (legacy)
      const kecamatanFromFile = getKecamatanByKabupatenKota(value)
      const kecamatanFromLegacy = districtsData[value] || []
      // Combine both sources, prioritizing file data
      const allKecamatan = kecamatanFromFile.length > 0
        ? kecamatanFromFile
        : kecamatanFromLegacy.map(d => ({ id: d.id, name: d.name }))
      setDistricts(allKecamatan)
    }
  }

  // Filter background options based on search term
  const filteredBackgroundOptions = backgroundOptions.filter(option =>
    option.label.toLowerCase().includes(backgroundSearchTerm.toLowerCase()) ||
    option.description.toLowerCase().includes(backgroundSearchTerm.toLowerCase())
  )

  // Filter education options based on search term
  const filteredEducationOptions = educationOptions.filter(option =>
    option.label.toLowerCase().includes(educationSearchTerm.toLowerCase()) ||
    option.description.toLowerCase().includes(educationSearchTerm.toLowerCase())
  )


  // Handle education selection
  const handleEducationSelect = useCallback((option: any) => {
    setFormData(prev => ({
      ...prev,
      education: option.value
    }))
    setEducationSearchTerm(option.label)
    setIsEducationDropdownOpen(false)
  }, [])

  // Handle background input change
  const handleBackgroundInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setBackgroundSearchTerm(value)
    setIsBackgroundDropdownOpen(true)

    // If user clears the input, clear the form data too
    if (!value) {
      setFormData(prev => ({
        ...prev,
        background: ''
      }))
    }
  }

  // Handle background selection with useCallback
  const handleBackgroundSelect = useCallback((option: any) => {
    setFormData(prev => ({
      ...prev,
      background: option.value
    }))
    setBackgroundSearchTerm(option.label)
    setIsBackgroundDropdownOpen(false)
  }, [])

  // Handle education input change
  const handleEducationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEducationSearchTerm(value)
    setIsEducationDropdownOpen(true)

    // If user clears the input, clear the form data too
    if (!value) {
      setFormData(prev => ({
        ...prev,
        education: ''
      }))
    }
  }

  // Toggle accordion
  const toggleAccordion = useCallback((section: keyof typeof accordionStates) => {
    setAccordionStates(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }, [])

  // Check if specific section is complete
  const isSectionComplete = (section: string) => {
    if (section === 'personal') {
      return formData.full_name && formData.email && formData.background && formData.gender &&
        formData.date_of_birth && formData.whatsapp && formData.province
    } else if (section === 'career') {
      return formData.education && formData.education_status && formData.employment_status
    } else if (section === 'other') {
      return formData.it_background && formData.disability && formData.program_source.length > 0
    }
    return false
  }

  // Get missing fields for specific section
  const getMissingFields = (section: string) => {
    const missing = []
    if (section === 'personal') {
      if (!formData.full_name) missing.push('Nama Lengkap')
      if (!formData.email) missing.push('Email')
      if (!formData.background) missing.push('Latar Belakang')
      if (!formData.gender) missing.push('Jenis Kelamin')
      if (!formData.date_of_birth) missing.push('Tanggal Lahir')
      if (!formData.whatsapp) missing.push('No WhatsApp')
      if (!formData.province) missing.push('Provinsi')
    } else if (section === 'career') {
      if (!formData.education) missing.push('Pendidikan Terakhir')
      if (!formData.education_status) missing.push('Status Pendidikan')
      if (!formData.employment_status) missing.push('Status Pekerjaan')
    } else if (section === 'other') {
      if (!formData.it_background) missing.push('Pemahaman IT')
      if (!formData.disability) missing.push('Status Disabilitas')
      if (formData.program_source.length === 0) missing.push('Sumber Program')
    }
    return missing
  }

  // Check if all sections are complete
  const isAllSectionsComplete = () => {
    return isSectionComplete('personal') && isSectionComplete('career') && isSectionComplete('other')
  }


  const calculateFinalPrice = () => {
    if (!program) return 0
    if (!referralData) return program.price

    let finalPrice = program.price

    // Apply discount
    if (referralData.discount_percentage > 0) {
      finalPrice = finalPrice * (1 - referralData.discount_percentage / 100)
    }
    if (referralData.discount_amount > 0) {
      finalPrice = finalPrice - referralData.discount_amount
    }

    return Math.max(0, finalPrice)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!program || !referralData || !profile) return

    // Validate required fields
    if (!formData.full_name || !formData.email || !formData.gender || !formData.background || !formData.date_of_birth || !formData.whatsapp || !formData.province) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Mohon lengkapi semua field yang wajib diisi pada tab Informasi Pribadi'
      })
      return
    }

    if (!formData.education || !formData.education_status || !formData.employment_status) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Mohon lengkapi semua field pada tab Informasi Karier dan Pendidikan'
      })
      return
    }

    if (!formData.it_background || !formData.disability || formData.program_source.length === 0) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Mohon lengkapi semua field pada tab Informasi Lainnya'
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
      setSubmitting(true)

      // Create or update participant record
      let participantId = profile.id

      const { data: existingParticipant, error: participantError } = await supabase
        .from('participants')
        .select('id')
        .eq('user_id', profile.id)
        .single()

      if (participantError && participantError.code !== 'PGRST116') {
        throw participantError
      }

      if (!existingParticipant) {
        // Create participant record
        const { data: newParticipant, error: createParticipantError } = await supabase
          .from('participants')
          .insert({
            user_id: profile.id,
            name: formData.full_name,
            email: formData.email,
            phone: formData.whatsapp,
            address: `${formData.province}, ${formData.city}, ${formData.district}`,
            date_of_birth: formData.date_of_birth,
            gender: formData.gender,
            emergency_contact_name: '',
            emergency_contact_phone: ''
          } as any)
          .select('id')
          .single()

        if (createParticipantError) throw createParticipantError
        participantId = (newParticipant as any).id
      } else {
        // Update existing participant
        const updateData = {
          name: formData.full_name,
          email: formData.email,
          phone: formData.whatsapp,
          address: `${formData.province}, ${formData.city}, ${formData.district}`,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          emergency_contact_name: '',
          emergency_contact_phone: ''
        }

        const { error: updateParticipantError } = await (supabase as any)
          .from('participants')
          .update(updateData)
          .eq('id', (existingParticipant as any).id)

        if (updateParticipantError) throw updateParticipantError
        participantId = (existingParticipant as any).id
      }

      // Check if enrollment already exists
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('*')
        .eq('program_id', program.id)
        .eq('participant_id', participantId)
        .single()

      let enrollment;
      const isFree = calculateFinalPrice() === 0 || program.price === 0

      // Create enrollment data object
      const enrollmentData = {
        program_id: program.id,
        participant_id: participantId,
        status: isFree ? 'approved' : 'pending',
        payment_status: isFree ? 'paid' : 'unpaid',
        amount_paid: 0,
        referral_code_id: referralData.id,
        referral_code: referralData.code,
        referred_by_trainer_id: referralData.trainer_id,
        notes: `Referral Code: ${referralData.code}`
      }

      if (existingEnrollment) {
        // Update existing enrollment with referral info if not present
        const { data: updatedEnrollment, error: updateError } = await supabase
          .from('enrollments')
          .update({
            referral_code_id: referralData.id,
            referral_code: referralData.code,
            referred_by_trainer_id: referralData.trainer_id,
            // Verify if we should update notes or append
            notes: existingEnrollment.notes ? existingEnrollment.notes + ` | Referral Added: ${referralData.code}` : `Referral Added: ${referralData.code}`
          })
          .eq('id', existingEnrollment.id)
          .select()
          .single()

        if (updateError) throw updateError
        enrollment = updatedEnrollment
      } else {
        // Create new enrollment
        const { data: newEnrollment, error: enrollmentError } = await supabase
          .from('enrollments')
          .insert(enrollmentData as any)
          .select()
          .single()

        if (enrollmentError) throw enrollmentError
        enrollment = newEnrollment
      }
    }

      // Check enrollment status (might be auto-approved by trigger)
      const enrollmentStatus = (enrollment as any).status
    const isEnrollmentApproved = enrollmentStatus === 'approved'

    // Create referral tracking with appropriate status
    // If enrollment is approved (free program or auto-approved), referral should be confirmed
    const referralTrackingStatus = isEnrollmentApproved ? 'confirmed' : 'pending'

    const { error: trackingError } = await supabase
      .from('referral_tracking')
      .insert({
        referral_code_id: referralData.id,
        trainer_id: referralData.trainer_id,
        participant_id: participantId,
        enrollment_id: (enrollment as any).id,
        program_id: program.id,
        discount_applied: program.price - calculateFinalPrice(),
        commission_earned: 0,
        status: referralTrackingStatus
      } as any)

    if (trackingError) {
      console.error('Error creating referral tracking:', trackingError)
    } else if (isEnrollmentApproved) {
      console.log('Referral tracking created with confirmed status (free program auto-approved)')
    }

    // Get or create user referral code and send welcome email
    try {
      // Get or create user referral code
      let userReferralCode: string | null = null

      const { data: existingCodes } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('trainer_id', profile.id)
        .eq('is_active', true)
        .limit(1)

      if (existingCodes && existingCodes.length > 0) {
        userReferralCode = (existingCodes[0] as any).code
      } else {
        // Generate new referral code
        const generateReferralCode = () => {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
          let result = ''
          for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length))
          }
          return result
        }

        let newReferralCode = generateReferralCode()
        let attempts = 0
        let codeExists = true

        while (codeExists && attempts < 10) {
          const { data: checkCodes } = await supabase
            .from('referral_codes')
            .select('id')
            .eq('code', newReferralCode)
            .limit(1)

          if (!checkCodes || checkCodes.length === 0) {
            codeExists = false
          } else {
            newReferralCode = generateReferralCode()
            attempts++
          }
        }

        if (!codeExists) {
          const { data: newCode } = await supabase
            .from('referral_codes')
            .insert({
              code: newReferralCode,
              trainer_id: profile.id,
              description: 'Referral code untuk berbagi program',
              is_active: true,
              discount_percentage: 0,
              discount_amount: 0,
              commission_percentage: 0,
              commission_amount: 0
            } as any)
            .select('code')
            .single()

          if (newCode) {
            userReferralCode = (newCode as any).code
          }
        }
      }

      // Check if user has used referral (has confirmed referral tracking)
      const { data: trackingData } = await supabase
        .from('referral_tracking')
        .select('id')
        .eq('trainer_id', profile.id)
        .eq('status', 'confirmed')
        .limit(1)

      const hasReferralUsed = trackingData && trackingData.length > 0

      // Materials list
      const materials = [
        'Fondasi AI Generatif dan Prompting Efektif',
        'Dari Ide Menjadi Materi Ajar di Gemini Canvas',
        'Integrasi Lanjutan, Etika dan Pemberdayaan Siswa',
        'Sertifikasi Internasional Gemini Certified Educator',
        'Diseminasi Pengimbasan Program'
      ]

      const openMaterials = hasReferralUsed ? materials : materials.slice(0, 2)
      const lockedMaterials = hasReferralUsed ? [] : materials.slice(2)

      // Generate referral link
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const referralLink = userReferralCode ? `${baseUrl}/referral/${userReferralCode}` : undefined

      // Generate email HTML
      const emailHtml = generateWelcomeEmail({
        participantName: formData.full_name,
        programTitle: program.title,
        programDescription: program.description || '',
        userReferralCode: userReferralCode || undefined,
        referralLink: referralLink,
        dashboardUrl: `${baseUrl}/dashboard`,
        openMaterials,
        lockedMaterials,
        hasReferralUsed: !!hasReferralUsed,
      })

      // Send email via API (async, tidak perlu menunggu)
      fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: formData.email,
          subject: `Selamat Bergabung - ${program.title} | GARUDA-21 Training Center`,
          html: emailHtml,
          useQueue: true, // Use queue untuk scalability
        }),
      }).catch((error) => {
        console.error('Error sending welcome email:', error)
        // Don't throw - email sending failure shouldn't block enrollment
      })
    } catch (emailError) {
      console.error('Error preparing welcome email:', emailError)
      // Don't throw - email sending failure shouldn't block enrollment
    }

    addNotification({
      type: 'success',
      title: 'Berhasil',
      message: 'Pendaftaran berhasil! Detail lebih lanjut telah dikirim ke email Anda.'
    })

    // Redirect to success page
    setTimeout(() => {
      router.push(`/register-referral/${referralCode}/success`)
    }, 1000)

  } catch (error: any) {
    console.error('Error completing enrollment:', error)
    addNotification({
      type: 'error',
      title: 'Error',
      message: error.message || 'Gagal menyelesaikan pendaftaran'
    })
  } finally {
    setSubmitting(false)
  }
}

if (loading) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Memvalidasi kode referral...</p>
      </div>
    </div>
  )
}

if (!program || !referralData) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Kode Referral Tidak Valid</h2>
        <Link href="/programs" className="text-blue-600 hover:text-blue-700">
          Kembali ke Daftar Program
        </Link>
      </div>
    </div>
  )
}

const finalPrice = calculateFinalPrice()
const discount = program.price - finalPrice

return (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pendaftaran dengan Referral</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Lengkapi data diri Anda untuk melanjutkan pendaftaran dengan kode referral
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Program Info */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:sticky lg:top-8">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Program Detail</h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">{program.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{program.description}</p>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Harga Normal:</span>
                  <span className="font-medium">Rp {program.price.toLocaleString('id-ID')}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 mt-1">
                    <span>Diskon:</span>
                    <span className="font-medium">-Rp {discount.toLocaleString('id-ID')}</span>
                  </div>
                )}

                <div className="flex justify-between text-lg font-semibold text-gray-900 mt-2 pt-2 border-t">
                  <span>Total:</span>
                  <span>Rp {finalPrice.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Kode Referral Valid</span>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  Dari: {program.trainer.full_name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Data Diri</h3>

            <div className="space-y-6">
              {/* Accordion 1: Personal Information */}
              <div className="border rounded-lg">
                <button
                  type="button"
                  onClick={() => toggleAccordion('personal')}
                  className="w-full px-3 sm:px-4 py-3 text-left flex items-center justify-between bg-gray-50 rounded-t-lg hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-medium text-gray-900 text-sm sm:text-base">Informasi Pribadi</span>
                    {isSectionComplete('personal') ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex-shrink-0">
                        ✓ Lengkap
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex-shrink-0">
                        {getMissingFields('personal').length} field kosong
                      </span>
                    )}
                  </div>
                  {accordionStates.personal ? (
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>

                {accordionStates.personal && (
                  <div className="p-3 sm:p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nama Lengkap *
                        </label>
                        <input
                          type="text"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 hover:border-gray-400 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 hover:border-gray-400 transition-colors"
                        />
                      </div>

                      <div className="relative background-dropdown-container">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Latar Belakang *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={backgroundSearchTerm}
                            onChange={handleBackgroundInputChange}
                            onFocus={() => setIsBackgroundDropdownOpen(true)}
                            placeholder="Pilih latar belakang"
                            required
                            className="w-full px-3 py-2 pr-10 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 hover:border-gray-400 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setIsBackgroundDropdownOpen(!isBackgroundDropdownOpen)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                          >
                            <svg
                              className={`h-4 w-4 sm:h-5 sm:w-5 transition-transform ${isBackgroundDropdownOpen ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>

                        {isBackgroundDropdownOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 sm:max-h-60 overflow-auto">
                            {filteredBackgroundOptions.length > 0 ? (
                              filteredBackgroundOptions.map((option, index) => (
                                <div
                                  key={index}
                                  onClick={() => handleBackgroundSelect(option)}
                                  className="px-3 sm:px-4 py-2 sm:py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium text-gray-900 text-xs sm:text-sm">
                                    {option.label}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {option.description}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="px-3 sm:px-4 py-2 sm:py-3 text-gray-500 text-xs sm:text-sm">
                                Tidak ada pilihan yang sesuai
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Jenis Kelamin *
                        </label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 hover:border-gray-400 transition-colors"
                        >
                          <option value="">Pilih Jenis Kelamin</option>
                          <option value="male">Laki-laki</option>
                          <option value="female">Perempuan</option>
                          <option value="other">Lainnya</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tanggal Lahir *
                        </label>
                        <input
                          type="date"
                          name="date_of_birth"
                          value={formData.date_of_birth}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 hover:border-gray-400 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          No WhatsApp *
                        </label>
                        <input
                          type="tel"
                          name="whatsapp"
                          value={formData.whatsapp}
                          onChange={handleInputChange}
                          placeholder="08xxxxxxxxxx"
                          required
                          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 hover:border-gray-400 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Provinsi *
                        </label>
                        <select
                          name="province"
                          value={formData.province}
                          onChange={(e) => handleLocationChange('province', e.target.value)}
                          required
                          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 hover:border-gray-400 transition-colors"
                        >
                          <option value="">Pilih Provinsi</option>
                          {provinces.map((province) => (
                            <option key={province.id} value={province.id}>
                              {province.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kabupaten *
                        </label>
                        <select
                          name="city"
                          value={formData.city}
                          onChange={(e) => handleLocationChange('city', e.target.value)}
                          required
                          disabled={!formData.province}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 hover:border-gray-400 transition-colors disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                        >
                          <option value="">Pilih Kabupaten</option>
                          {cities.map((city) => (
                            <option key={city.id} value={city.id}>
                              {city.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Kecamatan *
                        </label>
                        <select
                          name="district"
                          value={formData.district}
                          onChange={(e) => handleLocationChange('district', e.target.value)}
                          required
                          disabled={!formData.city}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 hover:border-gray-400 transition-colors disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                        >
                          <option value="">Pilih Kecamatan</option>
                          {districts.map((district) => (
                            <option key={district.id} value={district.id}>
                              {district.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 2: Career & Education */}
              <div className="border rounded-lg">
                <button
                  type="button"
                  onClick={() => toggleAccordion('career')}
                  className="w-full px-3 sm:px-4 py-3 text-left flex items-center justify-between bg-gray-50 rounded-t-lg hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-medium text-gray-900 text-sm sm:text-base">Karier & Pendidikan</span>
                    {isSectionComplete('career') ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex-shrink-0">
                        ✓ Lengkap
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex-shrink-0">
                        {getMissingFields('career').length} field kosong
                      </span>
                    )}
                  </div>
                  {accordionStates.career ? (
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>

                {accordionStates.career && (
                  <div className="p-3 sm:p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative education-dropdown-container">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pendidikan Terakhir *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={educationSearchTerm}
                            onChange={handleEducationInputChange}
                            onFocus={() => setIsEducationDropdownOpen(true)}
                            placeholder="Pilih pendidikan terakhir"
                            required
                            className="w-full px-3 py-2 pr-10 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 hover:border-gray-400 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setIsEducationDropdownOpen(!isEducationDropdownOpen)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                          >
                            <svg
                              className={`h-4 w-4 sm:h-5 sm:w-5 transition-transform ${isEducationDropdownOpen ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>

                        {isEducationDropdownOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 sm:max-h-60 overflow-auto">
                            {filteredEducationOptions.length > 0 ? (
                              filteredEducationOptions.map((option, index) => (
                                <div
                                  key={index}
                                  onClick={() => handleEducationSelect(option)}
                                  className="px-3 sm:px-4 py-2 sm:py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium text-gray-900 text-xs sm:text-sm">
                                    {option.label}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {option.description}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="px-3 sm:px-4 py-2 sm:py-3 text-gray-500 text-xs sm:text-sm">
                                Tidak ada pilihan yang sesuai
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status Pendidikan *
                        </label>
                        <select
                          name="education_status"
                          value={formData.education_status}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 hover:border-gray-400 transition-colors"
                        >
                          <option value="">Pilih Status Pendidikan</option>
                          <option value="sedang">Sedang Menempuh Pendidikan</option>
                          <option value="tidak">Tidak Menempuh Pendidikan</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status Pekerjaan *
                        </label>
                        <select
                          name="employment_status"
                          value={formData.employment_status}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 hover:border-gray-400 transition-colors"
                        >
                          <option value="">Pilih Status Pekerjaan</option>
                          <option value="bekerja">Sedang Bekerja</option>
                          <option value="tidak_bekerja">Tidak Bekerja</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 3: Other Information */}
              <div className="border rounded-lg">
                <button
                  type="button"
                  onClick={() => toggleAccordion('other')}
                  className="w-full px-3 sm:px-4 py-3 text-left flex items-center justify-between bg-gray-50 rounded-t-lg hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-medium text-gray-900 text-sm sm:text-base">Informasi Lainnya</span>
                    {isSectionComplete('other') ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex-shrink-0">
                        ✓ Lengkap
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex-shrink-0">
                        {getMissingFields('other').length} field kosong
                      </span>
                    )}
                  </div>
                  {accordionStates.other ? (
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>

                {accordionStates.other && (
                  <div className="p-3 sm:p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Apakah kamu memiliki pemahaman dasar/latar belakang di bidang IT? *
                        </label>
                        <select
                          name="it_background"
                          value={formData.it_background}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 hover:border-gray-400 transition-colors"
                        >
                          <option value="">Pilih Jawaban</option>
                          <option value="ya">Ya</option>
                          <option value="tidak">Tidak</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Apakah kamu penyandang disabilitas? *
                        </label>
                        <select
                          name="disability"
                          value={formData.disability}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 hover:border-gray-400 transition-colors"
                        >
                          <option value="">Pilih Jawaban</option>
                          <option value="ya">Ya</option>
                          <option value="tidak">Tidak</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-xs sm:text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Consent Section - Always visible at the bottom */}
            <div className="mt-6 sm:mt-8 border rounded-lg p-3 sm:p-4 bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Pernyataan Persetujuan</h4>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-2 hover:bg-white rounded-md transition-colors">
                  <input
                    type="checkbox"
                    name="consent_privacy"
                    checked={formData.consent_privacy}
                    onChange={handleInputChange}
                    required
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-xs sm:text-sm text-gray-700">
                    Saya menyetujui penggunaan data pribadi saya sesuai dengan kebijakan privasi yang berlaku. *
                  </span>
                </label>

                <label className="flex items-start gap-3 p-2 hover:bg-white rounded-md transition-colors">
                  <input
                    type="checkbox"
                    name="consent_contact"
                    checked={formData.consent_contact}
                    onChange={handleInputChange}
                    required
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-xs sm:text-sm text-gray-700">
                    Saya menyetujui untuk dihubungi melalui email atau telepon untuk keperluan program. *
                  </span>
                </label>

                <label className="flex items-start gap-3 p-2 hover:bg-white rounded-md transition-colors">
                  <input
                    type="checkbox"
                    name="consent_terms"
                    checked={formData.consent_terms}
                    onChange={handleInputChange}
                    required
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-xs sm:text-sm text-gray-700">
                    Saya menyetujui syarat dan ketentuan yang berlaku. *
                  </span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-4 sm:mt-6 flex justify-end">
              <button
                type="submit"
                disabled={submitting || !isAllSectionsComplete() || !formData.consent_privacy || !formData.consent_contact || !formData.consent_terms}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg flex items-center gap-2 text-sm sm:text-base ${submitting || !isAllSectionsComplete() || !formData.consent_privacy || !formData.consent_contact || !formData.consent_terms
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                    <span className="hidden sm:inline">Memproses...</span>
                    <span className="sm:hidden">Proses...</span>
                  </>
                ) : (
                  'Daftar Program'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
)
}